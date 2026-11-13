# Axentra Studio

The admin UI for [Axentra](https://github.com/peterkarlhuber/axentra), the multi-tenant SaaS
backend. Studio is a separate, static single-page app that talks to the Axentra HTTP API
(`/v1`) like any other client. It has no backend of its own and no privileged access.

- Products, tenants, users, invitations, members, roles, the product's permission catalog
  (built-in and product-defined permissions), API keys, records, files, full-text search, storage quotas and the
  per-product file content-type policy (see "Data & Storage" below), audit log, system health, effective server settings, and
  your own profile and sessions.
- Usage & Billing: meters, usage charts and totals, tenant quotas, events and reservations;
  plans, subscriptions and entitlements (see "Usage & Billing" below).
- Events & Jobs: jobs, schedules, the event log with a live view, and webhooks with their
  delivery log (see "Events & Jobs" below).
- Notifications (templates, message log, mailbox, preferences, and your own in-app inbox with an
  unread count) and Monitoring (health checks, metrics, retention, tracing).
- Users without an email address and single sign-on identities: platform administrators add
  single sign-on users and link or unlink their identities.
- A section whose backend module is disabled shows "module not enabled" and never shows demo
  data.
- Built-in help: a help center at `/help` (40 articles in 13 chapters: getting started, every
  screen, tutorials, troubleshooting, reference) with search, deep links and diagrams, page help
  in a side panel and info tips on fields. It works signed out and without a reachable API. See
  [docs/HELP_AUTHORING.md](docs/HELP_AUTHORING.md).
- Six languages for interface and help: English, German, Spanish, French, Brazilian Portuguese
  and Italian (informal address throughout). Light and dark theme, usable from 360 px wide,
  keyboard and screen reader accessible (WCAG 2.2 AA as the target).

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

| Script                            | What it does                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`                     | Dev server with `/v1` proxy                                                           |
| `npm run build`                   | Type-check and build to `dist/`                                                       |
| `npm run preview`                 | Serve `dist/` locally, also with the `/v1` proxy                                      |
| `npm run typecheck`               | `tsc -b` (strict)                                                                     |
| `npm run lint`                    | ESLint, zero warnings allowed                                                         |
| `npm run format` / `format:check` | Prettier                                                                              |
| `npm test`                        | Unit and component tests (Vitest, jsdom)                                              |
| `npm run e2e`                     | Playwright specs against a real API (see below)                                       |
| `npm run i18n:check`              | All six languages: keys, placeholders, plurals, informal address, untranslated text   |
| `npm run help:check`              | Help articles: all languages present, same anchors and structure, links, front matter |
| `npm run api:sync`                | Refresh the vendored OpenAPI contract and regenerate types                            |
| `npm run api:check`               | Contract drift check against a backend checkout (`--backend`)                         |
| `npm run e2e:backend`             | `scripts/e2e-backend.sh`: real backend for e2e (see below)                            |

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
| `Strict-Transport-Security`                       | `max-age=31536000; includeSubDomains`, only with `AXENTRA_TLS_TERMINATED=true`                                                                                                                                                                                          |

Scripts never run inline (the pre-paint theme script is the external `/theme-init.js`).
`style-src` needs `'unsafe-inline'` because Radix UI sets inline positioning styles and its
scroll lock injects a `<style>` element; a stricter policy was tested and breaks dialogs. HSTS is
sent only with `AXENTRA_TLS_TERMINATED=true`, that is when browsers reach Studio over HTTPS through
a TLS-terminating proxy in front of the container (the container itself speaks plain HTTP); you
may also add it at your TLS terminator instead. With `AXENTRA_API_URL` set, the API sees the Studio's `Origin`, so
put the public Studio URL into the API's `security.allowed_origins` (or make it the API's
`public_url`).

| Variable                  | Purpose                                                                                                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AXENTRA_API_URL`         | Upstream for the `/v1` reverse proxy. Unset: no proxy.                                                                                                                                                                                                       |
| `AXENTRA_PUBLIC_API_URL`  | Written to `config.json` as `apiBaseUrl`, added to `connect-src`.                                                                                                                                                                                            |
| `AXENTRA_CSP_CONNECT_SRC` | Extra `connect-src` sources: space-separated `https://host` or `https://host:port` origins. Anything else (other schemes such as `http:` or `wss:`, keywords such as `'self'`, paths, wildcards, quotes, semicolons, line breaks) stops the container start. |
| `AXENTRA_TLS_TERMINATED`  | `true` (or `1`) adds `Strict-Transport-Security`; `false`, `0` or unset (default): none. Other values stop the start.                                                                                                                                        |

`connect-src` always contains `'self'` (same-origin requests, including the `/v1` proxy and its
server-sent events), and `AXENTRA_PUBLIC_API_URL` is added on its own (it may be `http://` for a
local API, for example `http://localhost:8080`). `AXENTRA_CSP_CONNECT_SRC` is therefore only for
further `https://` origins; it is written into the nginx configuration, so the start fails on any
other value instead of producing a weaker or broken policy. `AXENTRA_API_URL` and
`AXENTRA_PUBLIC_API_URL` end up in `proxy_pass`, the `Content-Security-Policy` line and
`config.json`, so both must be plain `http://` or `https://` URLs (`scheme://host[:port][/path]`,
path characters `A-Z a-z 0-9 . _ ~ / -`); whitespace, quotes, semicolons, `$`, braces, `#`, `?` or
credentials stop the container start. Local development uses `npm run dev`,
which does not read these variables.

## Deployment modes (single and multi product)

Studio reads `mode` and `product` from `GET /v1/meta` and adapts; the API makes every decision
(Axentra `docs/architecture/DEPLOYMENT_MODELS.md`). Both modes are covered by the e2e suite.

|                     | `multi`                                              | `single`                                                              |
| ------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| Start page (`/`)    | last visited or first product, else the product list | the configured product's dashboard                                    |
| Top bar             | product switcher (with "All products")               | static label with the product name, no switcher                       |
| Products page       | list; "New product" for `products:create`            | the one product, read-only, with an explanation (no "New product")    |
| Product page        | archive / restore for `products:archive`             | name, description, settings, members; no archive, with an explanation |
| `/p/<unknown id>/…` | not-found error                                      | redirect to the same section of the one product                       |

In single mode the backend answers `POST /v1/products`, `/archive` and `/restore` with
`409 mode_not_supported`; Studio offers none of them, so that answer is never provoked from the UI.

## End-to-end tests

The Playwright specs in `e2e/` run against a **real** Axentra. `scripts/e2e-backend.sh` starts one
from a backend checkout and tears it down again:

```bash
export AXENTRA_E2E_PG_URL=postgresql://postgres:pg@127.0.0.1:5432/postgres   # superuser URL
# Backend from a local checkout (default ../axentra), Python with axentra[server] installed:
AXENTRA_PYTHON=../axentra/.venv/bin/python scripts/e2e-backend.sh run --worker
# Or exactly the pinned commit (api/BACKEND_REF), installed into a venv in .e2e-backend/:
scripts/e2e-backend.sh run --ref pinned --install --worker
# Single-product deployment (Axentra `mode = "single"`); the default is --mode multi:
scripts/e2e-backend.sh run --worker --mode single
# Any command instead of `npm run e2e`:
scripts/e2e-backend.sh run -- npx playwright test e2e/a11y.spec.ts --project mobile
```

`run` = `up`, the command, `down` (also on failure or Ctrl-C). `up` alone leaves the backend
running for interactive work (`eval "$(scripts/e2e-backend.sh env)"`, then `npm run e2e` as often
as you like, `scripts/e2e-backend.sh down` at the end). `up`:

1. creates the database `AXENTRA_E2E_DB` (default `axentra_studio_e2e`) owned by a
   **non-superuser** role `AXENTRA_E2E_DB_ROLE` (RLS enforced as in production); both are dropped
   first if they exist;
2. writes `.e2e-backend/axentra.toml` (secrets in files next to it, mode 600): the deployment mode
   from `--mode` / `AXENTRA_E2E_MODE` (`multi`, the default, or `single` with a `[product]`
   section, slug `studio-e2e`), every module enabled (storage: local, notify: local provider, events, usage, billing:
   `manual`), environment `test`, the Studio preview origin `http://127.0.0.1:$AXENTRA_E2E_PORT`
   allowed, webhooks to local http targets allowed (refused in production) with short retries
   (3 attempts, 0.5 s backoff base) so failing deliveries end as dead within seconds;
3. runs `axentra migrate`, `axentra admin setup-token` and `axentra serve` on
   `AXENTRA_E2E_API_PORT` (default 18080); with `--worker` also
   `axentra worker --load axentra_e2e_jobs` (with `e2e/fixtures` on `PYTHONPATH`) and
   `axentra notify-dispatch --loop` for job, webhook and notification flows;
4. creates the first platform admin with the setup token (`POST /v1/auth/setup`), a product
   (multi: `POST /v1/products`; single: the one the backend created on start, read from
   `GET /v1/meta`, after checking that `POST /v1/products` answers `409 mode_not_supported`) and a
   tenant, and in that product the fixtures the a11y route sweep needs: a free plan the tenant
   subscribes to, a job, a webhook endpoint (for an event type nothing publishes) and a
   notification template;
5. exports `AXENTRA_E2E_API`, `AXENTRA_E2E_EMAIL`, `AXENTRA_E2E_PASSWORD`,
   `AXENTRA_E2E_PRODUCT_ID`, `AXENTRA_E2E_TENANT_ID`, `AXENTRA_E2E_JOB_ID`,
   `AXENTRA_E2E_WEBHOOK_ID`, `AXENTRA_E2E_TEMPLATE_KEY`, `AXENTRA_E2E_BACKEND_SHA`,
   `AXENTRA_E2E_MODULES`, `AXENTRA_E2E_MODE`, `AXENTRA_E2E_WORKER`, `AXENTRA_E2E_NOTIFY_DISPATCH` (a one-shot
   `notify-dispatch --once` command) and `AXENTRA_E2E_PORT` for Playwright.

Every spec that changes data gets its product from `specProduct()` in `e2e/support.ts`: in
multi-product mode a new product (unique slug per run and project), in single-product mode the
server's one product, where the spec creates its own tenant and gives every name and key it
creates (meters, plans, roles, templates, categories, schedules, event types) a per-run suffix and
reads product-wide counts from the API instead of assuming an empty product. The a11y sweep only
reads the fixture product. So specs are independent of each other, of their order, of the other
Playwright project and of what earlier runs left in the database, in both modes.

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
- `e2e/single-product.spec.ts`: the deployment model. Single mode: the API refuses product
  creation and archiving with `409 mode_not_supported`, Studio opens in the one product, shows no
  product switcher, no "New product" and no archive action (with an explanation), sends an unknown
  product id to the same section of the one product, and every navigation area loads. Multi mode:
  the switcher and "New product" are offered. Each block is skipped, with that reason, against a
  backend in the other mode.
- `e2e/<area>.spec.ts`: area specs; use the helpers in `e2e/support.ts`.

Without `AXENTRA_E2E_API` every test is skipped with a message (in CI that is an error). You can
also point the specs at any running server (`AXENTRA_E2E_API`, optionally `AXENTRA_E2E_EMAIL` /
`AXENTRA_E2E_PASSWORD`) or at an already running Studio such as the Docker image
(`AXENTRA_E2E_BASE_URL`). Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use a preinstalled Chromium.

CI runs the same script in the `e2e` job, once per deployment mode (matrix `mode: [multi, single]`,
artifacts `playwright-report-multi` and `playwright-report-single`), against the backend commit
pinned in `api/BACKEND_REF`,
and checks the vendored contract against that commit in the `contract` job
(`npm run api:check`). Details, the compatibility matrix and the update procedure:
[docs/COMPATIBILITY.md](docs/COMPATIBILITY.md). Open work: [docs/TODO.md](docs/TODO.md).

Implementation status, test evidence, screenshots and the acceptance criteria:
[docs/AXENTRA_STUDIO_IMPLEMENTATION_REPORT.md](docs/AXENTRA_STUDIO_IMPLEMENTATION_REPORT.md).

## Usage & Billing

- `/p/:id/usage`: overview (daily chart of a meter across tenants, totals per tenant), meters,
  and tenant usage (current or any past period with limits and their source, quota overrides,
  daily chart, events, reservation lookup by id). The chart is inline SVG colored with design
  tokens; every chart has a data table for screen readers.
- `/p/:id/plans` and `/p/:id/subscriptions[/:tenantId]`: plans with prices (entered in major
  units, stored as `amount_minor`, shown with `Intl` in the UI language) and entitlements;
  subscriptions per tenant with plan change (`If-Match`), cancellation, resume, manual status
  and entitlement overrides.
- **Studio never collects card or bank data.** The payment provider shown is what
  `GET /v1/settings` reports (`billing.provider`, `billing.live_payments`; needs
  `platform:settings` or `product:manage`). A checkout is offered only for paid plans when the
  provider is `fake` or `stripe` with live payments off; it only opens the provider's hosted page.
  With live payments on, Studio starts no checkout.

## Project layout

```
api/                   vendored OpenAPI contract + provenance (SOURCE) + pinned backend (BACKEND_REF)
docker/                nginx config, proxy template, entrypoint script
docs/                  ADR, design system, UX guidelines, COMPATIBILITY.md, TODO.md
e2e/                   Playwright specs (smoke, a11y harness, areas) + routes.ts, support.ts
public/                config.json, theme-init.js, favicons, branding/ (see its README)
branding-src/          the two official logo masters (not served)
scripts/               i18n parity check, API sync + contract check, e2e backend, branding
                       (derive_branding.py)
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
- Notifications and Monitoring: template edits send `If-Match`, test sends an
  `Idempotency-Key`. Rendered HTML (previews, messages, mailbox) is shown in an
  `<iframe sandbox="">` with a `default-src 'none'` policy. The Monitoring page reads
  `GET /metrics` (outside `/v1`, Prometheus text); the dev/preview server and the Docker image
  proxy it like `/v1`. A metrics bearer token entered there stays in memory only.

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
  by key. Role and key editors read `GET /v1/products/{id}/permissions` (built-in plus the
  product's own permissions, `source: builtin|product`), not the global `GET /v1/permissions`.
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

### Events & Jobs

- Pages: `/p/:productId/jobs[/:jobId]`, `/schedules`, `/events` (log and `?view=live`),
  `/webhooks[/:webhookId]`. They need the `events` module; actions follow `jobs:read`,
  `jobs:manage`, `webhooks:read`, `webhooks:manage` and `events:publish`.
- The live views read the SSE endpoints (`/events/stream`, `/jobs/stream`) with `fetch`
  (credentials included) instead of `EventSource`: Axentra names each message after the event
  type, which `EventSource` can only receive with a listener per known name, and `fetch` can tell
  a lost permission (401/403, or the stream's `event: error`) from a network drop. Reconnects
  honour `retry:` and send the last seen id as `Last-Event-ID`, so no event is skipped.
- Cron expressions are checked in the browser with the server's rules (5 fields, UTC, no
  names); the server stays authoritative and its explanation is shown on rejection. Next runs
  come from the API (`next_run_at`); there is no preview endpoint for unsaved expressions.
- e2e (`e2e/events.spec.ts`) needs an API with `events.webhook_allow_http` and
  `events.webhook_allow_private_targets` (development only, for the local webhook receivers the
  spec starts) and, for job flows, `AXENTRA_E2E_WORKER=1` with a worker running
  `PYTHONPATH=e2e/fixtures axentra worker --load axentra_e2e_jobs`; `--worker` of
  `scripts/e2e-backend.sh` sets all of this up.

### Security rules (Axentra 7511a37)

Studio mirrors the backend's authorization rules (its `docs/architecture/SECURITY_MODEL.md`,
rules 8-12) to decide what it offers; the server stays authoritative.

- **Role ceiling.** A role is offered in member and invitation forms only if every permission of
  the role is in the caller's own grant for that scope (`GET /v1/me` vs. the role catalog from
  `GET .../roles`, which needs `roles:read`); `tenant_owner`/`product_owner` additionally need owner
  rank (owner of the scope, a product operator for tenants, or a platform admin). Members holding
  a role above the caller show "Above your own role" without role picker or remove button.
  Without the role catalog Studio cannot compute this and shows the server's `403` explanation.
- **No user directory.** Adding a member by email resolves only users the caller can see; the
  `404` offers "Send invitation instead" (tenants). Axentra has no invitations for product
  operators, so there Studio explains the limit. Studio never sends `owner_user_id` when creating
  a tenant: a new tenant starts without members and its owner is invited from the Invitations tab.
- **Notifications.** The send-test dialog offers a free-form address only with the product
  permission `notify:send_external`; otherwise tenant members only, with an explanation.
  `Template.system_only` templates (`invitation`) never get "Send test".
- **Idempotency.** A `409` for a reused `Idempotency-Key` is explained; event publish and
  notification send then use a new key automatically, the job dialog offers "Use a new key".
- **Fresh sign-in.** `POST /v1/me/password` without an existing password may answer
  `403 reauthentication_required`; the profile page offers "Sign in again" (logout, then
  `/login?return_to=/profile`).
- The e2e spec `e2e/security.spec.ts` signs in as a second, non-admin account. Axentra has no API
  to create one, so the e2e worker's fixture job `studio.e2e.create_user`
  (`e2e/fixtures/axentra_e2e_jobs.py`) creates it in process.

## License

MIT, see [LICENSE](LICENSE). The Axentra logo is used with permission of the same owner. The
official masters are in `branding-src/`; every served logo and icon is derived from them with
`scripts/derive_branding.py` (provenance, file list and regenerate command:
[public/branding/README.md](public/branding/README.md)).
