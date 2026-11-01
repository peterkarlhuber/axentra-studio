#!/usr/bin/env node
/**
 * Vendors the Axentra OpenAPI document into api/openapi.json, records its source in
 * api/SOURCE and regenerates src/api/schema.d.ts with openapi-typescript.
 *
 *   npm run api:sync                          # copy ../axentra/openapi/axentra-v1.json
 *   npm run api:sync -- --from <file>         # copy another local file
 *   npm run api:sync -- --sha <commit>        # fetch from GitHub at a commit
 *   npm run api:sync -- --url <https-url>     # fetch from any URL
 *
 * Env: AXENTRA_API_REPO (default peterkarlhuber/axentra) for --sha.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'api/openapi.json');
const sourceFile = path.join(root, 'api/SOURCE');
const schemaFile = path.join(root, 'src/api/schema.d.ts');
const CONTRACT_PATH = 'openapi/axentra-v1.json';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--help' || flag === '-h') args.help = true;
    else if (['--from', '--sha', '--url'].includes(flag)) args[flag.slice(2)] = argv[(i += 1)];
    else throw new Error(`Unknown argument: ${flag}`);
  }
  return args;
}

function gitSha(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
  return response.text();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    return;
  }

  let text;
  let source;
  let sha = 'unknown';
  if (args.url) {
    text = await fetchText(args.url);
    source = args.url;
  } else if (args.sha) {
    const repo = process.env.AXENTRA_API_REPO || 'peterkarlhuber/axentra';
    const url = `https://raw.githubusercontent.com/${repo}/${args.sha}/${CONTRACT_PATH}`;
    text = await fetchText(url);
    source = `github:${repo}/${CONTRACT_PATH}`;
    sha = args.sha;
  } else {
    const file = path.resolve(root, args.from || `../axentra/${CONTRACT_PATH}`);
    if (!fs.existsSync(file)) {
      throw new Error(
        `OpenAPI document not found at ${file}. Pass --from, --sha or --url (see --help).`,
      );
    }
    text = fs.readFileSync(file, 'utf8');
    source = path.relative(root, file);
    sha = gitSha(path.dirname(file));
  }

  const document = JSON.parse(text);
  if (!document.openapi || !document.paths) {
    throw new Error('The fetched document is not an OpenAPI document (missing openapi/paths).');
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`);
  fs.writeFileSync(
    sourceFile,
    [
      '# Provenance of api/openapi.json (written by `npm run api:sync`).',
      `source: ${source}`,
      `sha: ${sha}`,
      `api_version: ${document.info?.version ?? 'unknown'}`,
      `synced_at: ${new Date().toISOString()}`,
      '',
    ].join('\n'),
  );

  const bin = path.join(root, 'node_modules/.bin/openapi-typescript');
  execFileSync(bin, [target, '--output', schemaFile], { stdio: 'inherit' });
  console.log(`Synced ${Object.keys(document.paths).length} paths from ${source} (${sha}).`);
  console.log(
    'Next: replace the hand-written interfaces in src/api/models.ts with schema aliases.',
  );
}

main().catch((error) => {
  console.error(`api:sync failed: ${error.message}`);
  process.exit(1);
});
