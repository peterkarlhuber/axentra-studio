# Compatibility: Axentra Studio and Axentra

Studio is released separately from the Axentra backend and talks to it only through the public
HTTP API (`/v1`). This page records which combinations were tested together, what Studio checks at
runtime, and how to move Studio to a newer backend. The backend keeps the mirror of this table in
its own `docs/COMPATIBILITY.md`; its versioning rules are in `docs/architecture/VERSIONING.md`
there.

## Tested combinations

A row is added only when both checks below ran for that pair: the contract job (Studio's vendored
contract is byte-for-byte the backend's `openapi/axentra-v1.json` at that commit) and the e2e job
(Playwright against a running server of that commit).

| Studio version | Studio commit                    | `REQUIRED_API` | Axentra version | Axentra commit (`api/BACKEND_REF`) | API version | Tested on  | Result                                                                                                                            |
| -------------- | -------------------------------- | -------------- | --------------- | ---------------------------------- | ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 0.1.0 (unrel.) | `wip/ci` on top of `0b5ab56`[^1] | 1.0            | 0.1.0.dev0      | `a2ca72a7270d`                     | 1.0         | 2026-11-02 | Contract identical (109 paths). Playwright 126 passed, 0 failed, 0 skipped (local run)[^2]                                        |
| 0.1.0 (unrel.) | `wip/secadapt`[^1]               | 1.0            | 0.1.0.dev0      | `7511a37ce087`                     | 1.0         | 2026-11-02 | Contract identical (109 paths). Playwright 186 passed, 0 failed, 0 skipped, twice in a row (local run)[^3]                        |
| 0.1.0 (unrel.) | `wip/single`[^1]                 | 1.0            | 0.1.0.dev0      | `7511a37ce087`                     | 1.0         | 2026-11-02 | Both deployment modes, twice each (local run)[^4]: multi 188 passed, 0 failed, 10 skipped; single 196 passed, 0 failed, 2 skipped |

[^1]: Fill in the merge commit when this branch lands on `main`.

[^2]:
    `scripts/e2e-backend.sh run --worker` against the checkout at `a2ca72a`, PostgreSQL 16,
    Chromium, desktop and 360 px projects. Not yet confirmed by a CI run on GitHub.

[^3]:
    `scripts/e2e-backend.sh run --backend <checkout> --worker` against the checkout at `7511a37`
    (backend security fixes: role ceiling, no user directory, `notify:send_external`, system-only
    templates, idempotency replays), environment `test`, PostgreSQL 16, Chromium desktop and
    360 px. Includes `e2e/security.spec.ts`. Not yet confirmed by a CI run on GitHub.

[^4]:
    `scripts/e2e-backend.sh run --backend <checkout> --worker --mode multi|single` against the
    checkout at `7511a37`, environment `test`, PostgreSQL 16, Chromium desktop and 360 px, 198
    tests per run. The skips are exactly the mode-specific blocks of `e2e/single-product.spec.ts`
    run against the other mode (5 single-mode tests x 2 projects in multi, 1 multi-mode test x 2
    projects in single), each with its reason. Not yet confirmed by a CI run on GitHub.

## What Studio checks at runtime

The code is `src/api/compat.ts`, called from `src/app/MetaGate.tsx` before any other screen
renders:

1. Studio loads `/config.json`, then calls `GET /v1/meta` once per page load (cached for the
   lifetime of the tab, one retry). If that request fails, Studio shows a "cannot reach the API"
   page with the error and a retry button.
2. It reads the **body field** `api_version`. The contract defines it as an object
   `{major, minor}`; a string such as `"1.2"` or `"v1.2.3"` is accepted defensively (only major and
   minor are used). It does **not** read the `Axentra-API-Version` response header, although the
   backend sends and exposes it on every response.
3. `checkCompatibility()` compares with `REQUIRED_API` (currently `{ major: 1, minor: 0 }`):
   - not parseable → refuses with reason `unparseable` (the raw value is shown);
   - `server.major !== REQUIRED_API.major` → refuses with `major_mismatch`;
   - `server.minor < REQUIRED_API.minor` → refuses with `minor_too_low`;
   - otherwise Studio starts. A newer minor on the server is fine (additive changes only).
4. A refusal is a full-page message with the server API version, the required range
   (`1.0+ (< 2.0)`), the server's name and package version and the Studio version. Nothing else
   loads, so an incompatible server never sees writes from Studio.
5. Every request sends `Axentra-Client: axentra-studio/<package version>; api=<REQUIRED_API>`
   (`src/api/client.ts`) so server logs show which Studio build called.

Not covered at runtime: a server that is upgraded while a tab is open is not re-checked until the
page is reloaded; modules are read from the same `GET /v1/meta` response (`modules[]`) and a
section for a disabled module shows "module not enabled".

## Pins in this repository

| File                  | Meaning                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `api/openapi.json`    | Vendored copy of the backend's `openapi/axentra-v1.json`. Never edited by hand.                                |
| `api/SOURCE`          | Where the copy came from: source, commit `sha`, `api_version`, sync time.                                      |
| `api/BACKEND_REF`     | The full backend commit CI checks out for the `contract` and `e2e` jobs. Must equal the `sha` in `api/SOURCE`. |
| `src/api/schema.d.ts` | Types generated from `api/openapi.json` by `openapi-typescript`.                                               |
| `src/api/compat.ts`   | `REQUIRED_API`, the minimum API version this build needs.                                                      |

CI (`.github/workflows/ci.yml`):

- `contract` checks out `peterkarlhuber/axentra` at `api/BACKEND_REF` and runs
  `npm run api:check -- --backend .backend` (`scripts/contract-check.mjs`): BACKEND_REF is a full
  SHA and equals `api/SOURCE`; `api/openapi.json` equals the backend contract; `api/openapi.json`
  and `src/api/schema.d.ts` are exactly what `npm run api:sync` produces.
- `e2e` installs `axentra[server]` from the same checkout (Python 3.12), runs the backend's own
  drift check (`axentra openapi export --check`), starts it with `scripts/e2e-backend.sh` and runs
  every Playwright spec (Chromium, desktop and 360 px). It is a matrix over both deployment models,
  `mode: [multi, single]` (`scripts/e2e-backend.sh --mode`): multi-product with fixtures in a
  created product, single-product with `mode = "single"` and a `[product]` section, the fixtures in
  the product the backend creates on start. The HTML report, traces and backend logs are uploaded
  per mode as `playwright-report-multi` and `playwright-report-single`.
- The backend repository is public, so the jobs use the workflow token. If it becomes private,
  add a repository secret `AXENTRA_REPO_TOKEN` with read access to `peterkarlhuber/axentra`
  (fine-grained token: Contents read-only). Without it the checkout fails and the job stops with an
  explicit error; it never skips.

## Moving Studio to a newer backend

1. Sync the contract from a **pushed** backend commit:
   `npm run api:sync -- --sha <full sha>` (or `--from ../axentra/openapi/axentra-v1.json` with that
   checkout at the commit). This rewrites `api/openapi.json`, `api/SOURCE`, `api/BACKEND_REF` and
   `src/api/schema.d.ts`.
2. `npm run api:check -- --backend ../axentra` and `npm run typecheck`: type errors show where
   the contract changed under existing screens.
3. If Studio now relies on something added in API minor `1.N`, raise `REQUIRED_API.minor` to `N`
   in `src/api/compat.ts` (and its test). Never raise it without a reason: older servers would be
   refused.
4. Run the e2e suite against that commit: `scripts/e2e-backend.sh run --ref pinned --install`
   (or `--backend ../axentra` for a local checkout at the same commit).
5. Add a row to the table above, and the mirror row in the backend's `docs/COMPATIBILITY.md`.
6. A new API **major** (`/v2`) needs Studio code changes and a new `REQUIRED_API.major`; the
   backend serves `/v1` for at least one minor release after `/v2`, which is the migration window.
