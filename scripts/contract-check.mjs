#!/usr/bin/env node
/**
 * Contract drift check between Studio and the Axentra commit it is pinned to.
 *
 *   node scripts/contract-check.mjs --backend <axentra checkout at api/BACKEND_REF>
 *   node scripts/contract-check.mjs --from <axentra-v1.json> [--sha <commit>]
 *
 * Fails (exit 1) when
 *   1. api/BACKEND_REF is not a full commit SHA, or the backend checkout is at another commit;
 *   2. api/SOURCE does not record the same commit (the vendored contract came from elsewhere);
 *   3. api/openapi.json is not the backend's openapi/axentra-v1.json (compared as JSON);
 *   4. api/openapi.json or src/api/schema.d.ts differ from what `npm run api:sync` writes
 *      (regenerated into a temporary directory; the working tree is not touched).
 * Fix with: `npm run api:sync -- --sha "$(cat api/BACKEND_REF)"` and commit api/ and schema.d.ts.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRACT_PATH = 'openapi/axentra-v1.json';

/** The exact bytes `npm run api:sync` writes for a document (keep in sync with api-sync.mjs). */
export function serializeContract(document) {
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function readPinnedRef(text) {
  const ref = text.trim();
  if (!/^[0-9a-f]{40}$/.test(ref)) {
    throw new Error(`api/BACKEND_REF must contain one full 40-character commit SHA, got "${ref}".`);
  }
  return ref;
}

export function readSourceSha(text) {
  const match = /^sha:\s*(\S+)\s*$/m.exec(text);
  return match ? match[1] : null;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (['--backend', '--from', '--sha'].includes(flag)) args[flag.slice(2)] = argv[(i += 1)];
    else if (flag === '--help' || flag === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${flag}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.backend && !args.from)) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    process.exit(args.help ? 0 : 2);
  }
  const problems = [];
  const pinned = readPinnedRef(fs.readFileSync(path.join(root, 'api/BACKEND_REF'), 'utf8'));

  let backendFile;
  let backendSha = args.sha ?? null;
  if (args.backend) {
    backendFile = path.resolve(args.backend, CONTRACT_PATH);
    backendSha = execFileSync('git', ['-C', args.backend, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
  } else {
    backendFile = path.resolve(args.from);
  }
  if (backendSha && backendSha !== pinned) {
    problems.push(`The backend checkout is at ${backendSha}, but api/BACKEND_REF pins ${pinned}.`);
  }

  const sourceSha = readSourceSha(fs.readFileSync(path.join(root, 'api/SOURCE'), 'utf8'));
  if (sourceSha !== pinned) {
    problems.push(
      `api/SOURCE records sha ${sourceSha ?? '(none)'}, but api/BACKEND_REF pins ${pinned}. ` +
        'Re-sync the contract from the pinned commit, or move BACKEND_REF together with the sync.',
    );
  }

  const vendoredText = fs.readFileSync(path.join(root, 'api/openapi.json'), 'utf8');
  const vendored = JSON.parse(vendoredText);
  const backend = JSON.parse(fs.readFileSync(backendFile, 'utf8'));
  if (!isDeepStrictEqual(vendored, backend)) {
    const ours = new Set(Object.keys(vendored.paths ?? {}));
    const theirs = new Set(Object.keys(backend.paths ?? {}));
    const added = [...theirs].filter((p) => !ours.has(p));
    const removed = [...ours].filter((p) => !theirs.has(p));
    problems.push(
      `api/openapi.json differs from ${CONTRACT_PATH} at ${backendSha ?? backendFile}` +
        ` (backend-only paths: ${added.length ? added.join(', ') : 'none'};` +
        ` Studio-only paths: ${removed.length ? removed.join(', ') : 'none'};` +
        ' other differences possible in schemas).',
    );
  }
  if (vendoredText !== serializeContract(vendored)) {
    problems.push('api/openapi.json is not formatted as `npm run api:sync` writes it.');
  }

  // Regenerate the types exactly like api-sync.mjs and compare with the committed file.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-contract-'));
  try {
    const input = path.join(tmp, 'openapi.json');
    const output = path.join(tmp, 'schema.d.ts');
    fs.writeFileSync(input, serializeContract(backend));
    execFileSync(
      path.join(root, 'node_modules/.bin/openapi-typescript'),
      [input, '--output', output],
      {
        stdio: ['ignore', 'ignore', 'inherit'],
      },
    );
    const committed = fs.readFileSync(path.join(root, 'src/api/schema.d.ts'), 'utf8');
    if (fs.readFileSync(output, 'utf8') !== committed) {
      problems.push(
        'src/api/schema.d.ts is not what `npm run api:sync` generates from the pinned contract.',
      );
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (problems.length) {
    console.error('Contract check FAILED:');
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(
      `Fix: npm run api:sync -- --sha ${pinned}   (or --from <checkout>/${CONTRACT_PATH}), then commit api/ and src/api/schema.d.ts.`,
    );
    process.exit(1);
  }
  console.log(
    `Contract OK: api/openapi.json and src/api/schema.d.ts match ${CONTRACT_PATH} at ${pinned} ` +
      `(${Object.keys(backend.paths).length} paths, API ${backend.info?.version}).`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    main();
  } catch (error) {
    console.error(`contract-check failed: ${error.message}`);
    process.exit(1);
  }
}
