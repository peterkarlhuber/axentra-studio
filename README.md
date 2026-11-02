# Axentra Studio

The admin UI for [Axentra](https://github.com/peterkarlhuber/axentra), the multi-tenant SaaS
backend. Studio is a separate, static single-page app that talks to the Axentra HTTP API
(`/v1`) like any other client. It has no backend of its own and no privileged access.

- Products, tenants, users, invitations, members, roles, API keys, records, files and storage
  quotas (see "Data & Storage" below), audit log, system health, effective server settings, and
  your own profile and sessions.
- Sections for modules that Studio has no screens for yet (jobs, events, webhooks, usage,
  plans, subscriptions, notifications) exist as routes. They show "module not enabled" or "not
  yet available in Studio" and never show demo data.
- German and English, light and dark theme, usable from 360 px wide, keyboard and screen
  reader accessible (WCAG 2.1 AA as the target).

## Compatibility

| Studio             | Axentra API                | Notes                                                             |
| ------------------ | -------------------------- | ----------------------------------------------------------------- |
| 0.1.x (unreleased) | 1.x with minor version ≥ 0 | Contract vendored from backend commit `a2ca72a`, see `api/SOURCE` |

At startup Studio calls `GET /v1/meta` and compares `api_version` with the version it was built
against (`REQUIRED_API` in `src/api/compat.ts`). A different major version, or an older minor
version, stops the app with an explanation instead of failing in odd ways later. Tested
combinations and the update procedure: [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md).

## Quick start (development)

Requirements: Node.js 22 (`.nvmrc`), a running Axentra API.

```bash
npm ci
AXENTRA_API_URL=http://127.0.0.1:8080 npm run dev     # http://127.0.0.1:5173
```

The Vite dev server proxies `/v1` to `AXENTRA_API_URL` (default `http://127.0.0.1:8080`), so the
browser sees one origin, exactly as behind a production reverse proxy.

**The API must accept the Studio origin.** Axentra refuses cookie requests whose `Origin` is
neither `security.public_url` nor in `security.allowed_origins`. Through the dev proxy the origin
is the Studio's, so start the API with, for example:

```bash
AXENTRA__SECURITY__ALLOWED_ORIGINS='["http://127.0.0.1:5173","http://localhost:5173"]' axentra serve
```

On a fresh server Studio opens the setup page. Print a one-time token with
`axentra admin setup-token`, then create the first platform administrator; Studio signs you in
right away.

## Scripts

| Script                            | What it does                                                  |
| --------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                     | Dev server with `/v1` proxy                                   |
| `npm run build`                   | Type-check and build to `dist/`                               |
| `npm run preview`                 | Serve `dist/` locally, also with the `/v1` proxy              |
| `npm run typecheck`               | `tsc -b` (strict)                                             |
| `npm run lint`                    | ESLint, zero warnings allowed                                 |
| `npm run format` / `format:check` | Prettier                                                      |
| `npm test`                        | Unit and component tests (Vitest, jsdom)                      |
| `npm run e2e`                     | Playwright specs against a real API (see below)               |
| `npm run i18n:check`              | German and English must have identical keys and placeholders  |
| `npm run api:sync`                | Refresh the vendored OpenAPI contract and regenerate types    |
| `npm run api:check`               | Contract drift check against a backend checkout (`--backend`) |
| `npm run e2e:backend`             | `scripts/e2e-backend.sh`: real backend for e2e (see below)    |

CI (`.github/workflows/ci.yml`) runs `npm ci`, typecheck, lint, format check, i18n check, tests
and build on Node 22 (`check`), the contract drift check against `api/BACKEND_REF` (`contract`)
and all Playwright specs against a real backend at that commit (`e2e`).

## Configuration

### Runtime: `/config.json`

The built app reads `/config.json` (next to `index.html`) before anything else, so one build
works in every environment:

```json
{ "apiBaseUrl": "" }
```

| Value                       | Meaning                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `""` (default)              | Same origin: the API is reachable under `/v1` on the Studio's host (reverse proxy). Recommended. |
| `"https://api.example.com"` | API on another origin. No trailing `/v1`; Studio adds it.                                        |

With a separate API origin:

- The API must list the Studio origin in `security.allowed_origins` (credentialed CORS).
- Axentra's session cookie is `SameSite=Lax`, so the API and Studio must be **same-site**
  (for example `studio.example.com` and `api.example.com`). Cross-site setups cannot log in.
- The Content-Security-Policy must allow the API in `connect-src` (the Docker image does this
  from `AXENTRA_PUBLIC_API_URL`).
- OIDC sign-in returns to an absolute Studio URL, which the API must accept as a redirect target.

### Build time

| Variable          | Used by                                | Default                 |
| ----------------- | -------------------------------------- | ----------------------- |
| `AXENTRA_API_URL` | `npm run dev` / `preview` proxy target | `http://127.0.0.1:8080` |

## Docker

```bash
docker build -t axentra-studio .
# Same origin: nginx serves Studio and proxies /v1 to the API.
docker run -p 8080:8080 -e AXENTRA_API_URL=http://axentra-api:8080 axentra-studio
# Separate API origin: no proxy, the browser calls the API directly.
docker run -p 8080:8080 -e AXENTRA_PUBLIC_API_URL=https://api.example.com axentra-studio
```

The image is `nginxinc/nginx-unprivileged` (runs as uid 101, listens on 8080, `/healthz` for
probes). At start, `docker/40-axentra-studio.sh` writes `config.json`, the optional `/v1` proxy
(from `docker/api-proxy.conf.template` via `envsubst`) and the security headers:

| Header                                            | Value                                                                                                                                                                                                                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`                         | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' [AXENTRA_PUBLIC_API_URL] [AXENTRA_CSP_CONNECT_SRC]; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
| `X-Frame-Options`                                 | `DENY`                                                                                                                                                                                                                                                                  |
| `X-Content-Type-Options`                          | `nosniff`                                                                                                                                                                                                                                                               |
| `Referrer-Policy`                                 | `no-referrer`                                                                                                                                                                                                                                                           |
| `Permissions-Policy`                              | camera, microphone, geolocation, payment, usb disabled                                                                                                                                                                                                                  |
| `Cross-Origin-Opener-Policy` / `-Resource-Policy` | `same-origin`                                                                                                                                                                                                                                                           |

Scripts never run inline (the pre-paint theme script is the external `/theme-init.js`).
`style-src` needs `'unsafe-inline'` because Radix UI sets inline positioning styles and its
scroll lock injects a `<style>` element; a stricter policy was tested and breaks dialogs. Add
HSTS at your TLS terminator. With `AXENTRA_API_URL` set, the API sees the Studio's `Origin`, so
put the public Studio URL into the API's `security.allowed_origins` (or make it the API's
`public_url`).

| Variable                  | Purpose                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| `AXENTRA_API_URL`         | Upstream for the `/v1` reverse proxy. Unset: no proxy.            |
| `AXENTRA_PUBLIC_API_URL`  | Written to `config.json` as `apiBaseUrl`, added to `connect-src`. |
| `AXENTRA_CSP_CONNECT_SRC` | Extra `connect-src` sources, space-separated.                     |

## End-to-end tests

The Playwright specs in `e2e/` run against a **real** Axentra. `scripts/e2e-backend.sh` starts one
from a backend checkout and tears it down again:

```bash
export AXENTRA_E2E_PG_URL=postgresql://postgres:pg@127.0.0.1:5432/postgres   # superuser URL
# Backend from a local checkout (default ../axentra), Python with axentra[server] installed:
AXENTRA_PYTHON=../axentra/.venv/bin/python scripts/e2e-backend.sh run --worker
# Or exactly the pinned commit (api/BACKEND_REF), installed into a venv in .e2e-backend/:
scripts/e2e-backend.sh run --ref pinned --install --worker
# Any command instead of `npm run e2e`:
scripts/e2e-backend.sh run -- npx playwright test e2e/a11y.spec.ts --project mobile
```

`run` = `up`, the command, `down` (also on failure or Ctrl-C). `up` alone leaves the backend
running for interactive work (`eval "$(scripts/e2e-backend.sh env)"`, then `npm run e2e` as often
as you like, `scripts/e2e-backend.sh down` at the end). `up`:

1. creates the database `AXENTRA_E2E_DB` (default `axentra_studio_e2e`) owned by a
   **non-superuser** role `AXENTRA_E2E_DB_ROLE` (RLS enforced as in production); both are dropped
   first if they exist;
2. writes `.e2e-backend/axentra.toml` (secrets in files next to it, mode 600): multi-product mode,
   every module enabled (storage: local, notify: local provider, events, usage, billing: `fake`),
   the Studio preview origin `http://127.0.0.1:$AXENTRA_E2E_PORT` allowed, webhooks to local http
   targets allowed;
3. runs `axentra migrate`, `axentra admin setup-token` and `axentra serve` on
   `AXENTRA_E2E_API_PORT` (default 18080); with `--worker` also `axentra worker` and
   `axentra notify-dispatch --loop` for job, webhook and notification flows;
4. creates the first platform admin with the setup token (`POST /v1/auth/setup`), a product and a
   tenant;
5. exports `AXENTRA_E2E_API`, `AXENTRA_E2E_EMAIL`, `AXENTRA_E2E_PASSWORD`,
   `AXENTRA_E2E_PRODUCT_ID`, `AXENTRA_E2E_TENANT_ID`, `AXENTRA_E2E_BACKEND_SHA`,
   `AXENTRA_E2E_MODULES`, `AXENTRA_E2E_WORKER` and `AXENTRA_E2E_PORT` for Playwright.

`down` stops all processes and drops the database and the role; logs stay in `.e2e-backend/run/`.
`scripts/e2e-backend.sh --help` lists every option and variable.

Playwright builds Studio, serves it with `vite preview` on `AXENTRA_E2E_PORT` (default 4173)
proxying `/v1` to the API, and runs every spec on a desktop and a 360 px phone project:

- `e2e/smoke.spec.ts`: API version through the Studio origin, entry page, theme before first
  paint, CSP violations, sign-in and axe on the shell and settings.
- `e2e/a11y.spec.ts`: every route registered in `src/app/router.tsx` (read statically by
  `e2e/routes.ts`, so new pages are covered without editing the spec), signed out or signed in as
  the route requires, in the light and the dark theme: no axe-core WCAG 2.1 A/AA violations, no
  page-level horizontal scroll, no console errors. A route whose parameter has no fixture is
  skipped with its name.
- `e2e/<area>.spec.ts`: area specs; use the helpers in `e2e/support.ts`.

Without `AXENTRA_E2E_API` every test is skipped with a message (in CI that is an error). You can
also point the specs at any running server (`AXENTRA_E2E_API`, optionally `AXENTRA_E2E_EMAIL` /
`AXENTRA_E2E_PASSWORD`) or at an already running Studio such as the Docker image
(`AXENTRA_E2E_BASE_URL`). Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use a preinstalled Chromium.

CI runs the same script in the `e2e` job against the backend commit pinned in `api/BACKEND_REF`,
and checks the vendored contract against that commit in the `contract` job
(`npm run api:check`). Details, the compatibility matrix and the update procedure:
[docs/COMPATIBILITY.md](docs/COMPATIBILITY.md). Open work: [docs/TODO.md](docs/TODO.md).

## Project layout

```
api/                   vendored OpenAPI contract + provenance (SOURCE) + pinned backend (BACKEND_REF)
docker/                nginx config, proxy template, entrypoint script
docs/                  ADR, design system, UX guidelines, COMPATIBILITY.md, TODO.md
e2e/                   Playwright specs (smoke, a11y harness, areas) + routes.ts, support.ts
public/                config.json, theme-init.js, favicons, branding/ (see its README)
scripts/               i18n parity check, API sync + contract check, e2e backend, branding
src/api/               typed client: openapi-fetch, CSRF, problem+json errors, compatibility
src/app/               bootstrap (MetaGate), router, guards, auth, permissions, shell
src/components/ui/     design system components
src/features/<area>/   pages per area (auth, dashboard, products, tenants, users, access, …)
src/i18n/locales/      de/ and en/, one JSON namespace per feature
src/styles/            tokens.css (both themes) and global.css
```

## How Studio talks to the API

- One typed client (`src/api/client.ts`, `openapi-fetch` + types generated from
  `api/openapi.json`). Every request uses `credentials: 'include'` and sends
  `Axentra-Client: axentra-studio/<version>; api=1.0`.
- The CSRF token comes from the login/setup response or `GET /v1/auth/session`. It is kept in
  memory only and sent as `X-Axentra-CSRF` on every non-GET request.
- Any unexpected `401` sends you to `/login?return_to=<current path>`; after signing in you
  return there. Return paths are validated (same-origin, no `//`).
- Errors are RFC 9457 problem details. Studio picks the translated message by the stable `code`
  (not the English `detail`), shows field errors next to their inputs, and always shows the
  `request_id` (or the `X-Request-ID` header) so support can find the log entry.
- Optimistic concurrency: product, tenant and role edits send `If-Match` with the resource
  `version`; a `412` explains that someone else changed the item in the meantime.

### Differences from the original API catalog

The contract in `api/openapi.json` is authoritative. Where it differs from the earlier
endpoint catalog Studio was planned against, Studio follows the contract:

- `api_version` is an object `{major, minor}`, not a string (strings are still accepted).
- Module ids are `identity, tenancy, access, data, audit, storage, events, usage, billing, notify,
search, realtime`; the first four are always on.
- Products, product/tenant members, invitations, roles, API keys, collections, permissions and
  sessions are plain arrays without cursors. Tenants, users, audit and records are cursor pages.
- Tenants have no `sort` parameter; filters are `q` and `status` (`active` / `suspended`).
- Records: `where` is a JSON-encoded containment filter, `sort` is one of `id`, `created_at`,
  `updated_at` with an optional `-`. Create, replace and delete need `records:write` in the
  tenant; replace and delete send `If-Match` with the record version.
- `POST /v1/auth/setup` returns a session: the new admin is signed in immediately.
- Products and tenants need a `slug` (Studio derives one from the name; you can edit it).
- Roles have `key`, `scope` and `builtin`; built-in roles have no `id`. Members reference roles
  by key.
- Creating an API key returns `{key, secret}`; rotation takes `grace_seconds`.
- Creating an invitation returns `{invitation, token, accept_url?}`; the token is always shown
  once so it can be delivered without email.
- Health is `{status: ok|unavailable, checks: {name: boolean}}`, also as the body of a `503`.
- `Me` carries `platform_permissions`; `Me.user` is `null` for API-key principals.

### Data & Storage

- `/p/:productId/files?tenant=…`: files of one tenant (`files:read`; upload, label edit and
  delete with `files:write`). Uploads use `XMLHttpRequest` (`src/api/upload.ts`) because `fetch`
  cannot report upload progress; it sends the same credentials, CSRF and client headers.
- Size and type limits come from `GET /v1/settings` `storage` (readable with `platform:settings`
  or `product:manage`). Without that access Studio says the server checks them; the server
  always enforces them and its `413`/`415`/`429` answers are explained with the server message
  and request id.
- Downloads ask for a signed URL (`POST …/download-url`) and open its `path` through the API
  origin Studio is configured for (the absolute `url` is built from the server's `public_url`);
  presigned S3 URLs are used as given. "Create download link" shows the URL and its expiry.
- Tenant usage and quota (`PUT …/storage/quota` with `If-Match: quota_version`,
  `tenants:update`) on the Files page; product-wide usage per tenant on `/p/:productId/data`
  (`collections:read`), next to collection statistics, the storage configuration and the
  audit/job retention periods the server reports. Backups and the retention of deleted file
  metadata are not reported by the API and are shown as such.

## License

MIT, see [LICENSE](LICENSE). The Axentra logo is used with permission of the same owner; see
[public/branding/README.md](public/branding/README.md).
