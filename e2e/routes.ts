/**
 * Reads the route table from src/app/router.tsx (statically, with the TypeScript parser), so
 * the a11y/responsive harness visits every page, including pages other areas add later.
 *
 * Understood shapes inside `routes` (recursively):
 * - object literals with `path`, `index`, `children`, `element`;
 * - calls whose first argument is a string literal, e.g. `futureModule('files', ...)` → `files`;
 * - spreads/identifiers (`...fileRoutes`, `fileRoutes()`) that resolve to an array literal in
 *   router.tsx or in a module it imports (`@/…` or relative), e.g. an area's `routes.tsx`.
 * Routes below an element `<RequireAuth />` are marked as signed-in routes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export interface DiscoveredRoute {
  /** Absolute path pattern, e.g. `/p/:productId/tenants`. `*` is the catch-all. */
  pattern: string;
  requiresAuth: boolean;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routerFile = path.join(root, 'src/app/router.tsx');
const sources = new Map<string, ts.SourceFile>();

function parse(file: string): ts.SourceFile {
  let source = sources.get(file);
  if (!source) {
    source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    sources.set(file, source);
  }
  return source;
}

function resolveModule(from: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith('@/')) base = path.join(root, 'src', specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(from), specifier);
  else return null;
  for (const candidate of [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, 'index.tsx'),
    path.join(base, 'index.ts'),
  ]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Finds the declaration of `name` in `file` (local or imported) and returns its value node. */
function resolveIdentifier(file: string, name: string, depth = 0): ts.Node | null {
  if (depth > 8) return null;
  const source = parse(file);
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
          return declaration.initializer ?? null;
        }
      }
    }
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) return statement;
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      for (const element of statement.importClause.namedBindings.elements) {
        if (element.name.text !== name) continue;
        const target = resolveModule(file, statement.moduleSpecifier.text);
        if (!target) return null;
        return resolveIdentifier(target, (element.propertyName ?? element.name).text, depth + 1);
      }
    }
  }
  return null;
}

/** Turns an expression into the array literal it evaluates to, if statically obvious. */
function asArray(node: ts.Node | null, file: string): ts.ArrayLiteralExpression | null {
  if (!node) return null;
  if (ts.isArrayLiteralExpression(node)) return node;
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node)
  ) {
    return asArray(node.expression, file);
  }
  if (ts.isIdentifier(node)) return asArray(resolveIdentifier(file, node.text), file);
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    return asArray(resolveIdentifier(file, node.expression.text), file);
  }
  if (ts.isArrowFunction(node) || ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
    const body = node.body;
    if (!body) return null;
    if (!ts.isBlock(body)) return asArray(body, file);
    for (const statement of body.statements) {
      if (ts.isReturnStatement(statement)) return asArray(statement.expression ?? null, file);
    }
  }
  return null;
}

function prop(object: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  for (const property of object.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === name
    ) {
      return property.initializer;
    }
  }
  return undefined;
}

function elementTag(expression: ts.Expression | undefined): string | null {
  if (!expression) return null;
  if (ts.isJsxSelfClosingElement(expression)) return expression.tagName.getText();
  if (ts.isJsxElement(expression)) return expression.openingElement.tagName.getText();
  return null;
}

function join(parent: string, child: string): string {
  if (child.startsWith('/')) return child;
  const joined = `${parent.replace(/\/$/, '')}/${child}`;
  return joined.startsWith('/') ? joined : `/${joined}`;
}

function walk(
  array: ts.ArrayLiteralExpression,
  file: string,
  parent: string,
  auth: boolean,
  out: Map<string, DiscoveredRoute>,
) {
  const add = (pattern: string, requiresAuth: boolean) => {
    const normalized = pattern === '' ? '/' : pattern;
    if (!out.has(normalized)) out.set(normalized, { pattern: normalized, requiresAuth });
  };
  for (const element of array.elements) {
    const expression = ts.isSpreadElement(element) ? element.expression : element;
    if (ts.isObjectLiteralExpression(expression)) {
      const pathNode = prop(expression, 'path');
      const index = prop(expression, 'index');
      const here =
        pathNode && ts.isStringLiteralLike(pathNode) ? join(parent, pathNode.text) : parent;
      const childAuth = auth || elementTag(prop(expression, 'element')) === 'RequireAuth';
      if (pathNode && ts.isStringLiteralLike(pathNode)) add(here, childAuth);
      else if (index && index.kind === ts.SyntaxKind.TrueKeyword) add(here || '/', childAuth);
      const children = asArray(prop(expression, 'children') ?? null, file);
      if (children) walk(children, file, here, childAuth, out);
      continue;
    }
    if (ts.isCallExpression(expression)) {
      const [first] = expression.arguments;
      if (first && ts.isStringLiteralLike(first)) {
        add(join(parent, first.text), auth);
        continue;
      }
    }
    const nested = asArray(expression, file);
    if (nested) walk(nested, file, parent, auth, out);
    else {
      throw new Error(
        `e2e/routes.ts cannot read a route entry in ${path.relative(root, file)}: ${expression
          .getText()
          .slice(0, 120)}. Extend the parser or use a plain object/array.`,
      );
    }
  }
}

export function discoverRoutes(): DiscoveredRoute[] {
  const routes = asArray(resolveIdentifier(routerFile, 'routes'), routerFile);
  if (!routes) throw new Error('src/app/router.tsx does not export an array literal `routes`.');
  const out = new Map<string, DiscoveredRoute>();
  walk(routes, routerFile, '', false, out);
  return [...out.values()];
}
