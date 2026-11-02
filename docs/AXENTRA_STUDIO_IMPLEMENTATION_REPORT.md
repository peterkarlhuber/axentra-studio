# Axentra Studio implementation report

Status: **alpha**, package `axentra-studio` `0.1.0` (unreleased), built against Axentra HTTP API
`v1` version `1.0`. Report date: 2026-11-02. Basis: `master` at
[`ee7d9f2`](https://github.com/peterkarlhuber/axentra-studio/commit/ee7d9f2a9007a1f570d800b2d77e584ddfe6a5cb)
(merge of PR #3), pinned to Axentra
[`7511a37`](https://github.com/peterkarlhuber/axentra/commit/7511a37ce0876c13e5a9c861e3b9e31b6401d99c)
(`api/BACKEND_REF`). All local numbers below were measured on 2026-11-02 on that commit (plus this
report's documentation changes and `scripts/report-screenshots.mjs`), on Linux with Node.js 22,
Chromium 1243 (Playwright 1.63.0), PostgreSQL 16 and the backend installed into a Python 3.13
virtual environment by `scripts/e2e-backend.sh --install` (CI uses Python 3.12).

This report covers the admin UI (`peterkarlhuber/axentra-studio`). The backend has its own report:
[`docs/AXENTRA_IMPLEMENTATION_REPORT.md` in peterkarlhuber/axentra](https://github.com/peterkarlhuber/axentra/blob/master/docs/AXENTRA_IMPLEMENTATION_REPORT.md)
(modules, API and SDKs, deployment models, backend tests and security review). Where this report
says "backend report", it means that file.

Axentra `master` has moved on to
[`f80429f`](https://github.com/peterkarlhuber/axentra/commit/f80429f129f76bc019118bd825bef637feaf8ecf)
(PR #11, search module). Studio has **no UI for search yet** and is **not yet pinned to or tested
against `f80429f`** (section 10). Nothing here is production-ready in the sense of the order: Studio
has not been deployed, its Docker image has not been built in CI, and only Chromium was tested.
Section 12 lists every open limitation.

## Contents

1. [Architecture overview](#1-architecture-overview)
2. [Feature overview per area](#2-feature-overview-per-area)
3. [Screenshots](#3-screenshots)
4. [How Studio talks to the backend](#4-how-studio-talks-to-the-backend)
5. [Installation, build and start commands](#5-installation-build-and-start-commands)
6. [Test evidence and CI results](#6-test-evidence-and-ci-results)
7. [Security checks](#7-security-checks)
8. [Design system and branding](#8-design-system-and-branding)
9. [Independent build and operation](#9-independent-build-and-operation)
10. [Version and API compatibility](#10-version-and-api-compatibility)
11. [Joint integration tests with Axentra](#11-joint-integration-tests-with-axentra)
12. [Open limitations and residual risks](#12-open-limitations-and-residual-risks)
13. [Pull requests and merge SHAs](#13-pull-requests-and-merge-shas)
14. [Notes on Nodestro](#14-notes-on-nodestro)
15. [Acceptance criteria status](#15-acceptance-criteria-status)

## 1. Architecture overview

- **Static single-page app** without a backend of its own: React 19.3, TypeScript 5.9 (strict),
  Vite 8, React Router 7, TanStack Query 5, Radix UI primitives, i18next. Decision record:
  [adr/0001-frontend-stack.md](adr/0001-frontend-stack.md). The build output in `dist/` is plain
  files; any static web server can host it (the repository ships an nginx image, section 5).
- **Talks to Axentra only over the public HTTP API** (`/v1`), with a typed client generated from
  the vendored OpenAPI contract (section 4). No Axentra package, SDK or code is imported; Studio has
  no privileged access and the server enforces every permission.
- **Runtime configuration** from `/config.json` (`apiBaseUrl`, default same origin), read before
  anything else, so one build serves every environment.
- **Startup gate** (`src/app/MetaGate.tsx`): `GET /v1/meta` decides API compatibility
  (`src/api/compat.ts`, `REQUIRED_API = {major: 1, minor: 0}`), enabled modules and first-run setup
  before any screen renders.
- **Layout of the code**:

  | Path                             | Content                                                                      |
  | -------------------------------- | ---------------------------------------------------------------------------- |
  | `src/api/`                       | `openapi-fetch` client, CSRF holder, problem+json errors, compat, query keys |
  | `src/app/`                       | bootstrap, router (36 route entries), guards, permissions, modules, shell    |
  | `src/components/ui/`             | design system components (buttons, data table, dialogs, toasts, tabs, ...)   |
  | `src/features/<area>/`           | pages per area (16 areas + `shared`, 34 pages)                               |
  | `src/i18n/locales/{de,en}/`      | 20 namespaces, 1,685 keys per language                                       |
  | `src/styles/tokens.css`          | design tokens for both themes                                                |
  | `e2e/`, `scripts/e2e-backend.sh` | Playwright specs and the real-backend harness                                |
  | `api/`                           | vendored contract, provenance (`SOURCE`), pinned backend (`BACKEND_REF`)     |
  | `docker/`, `Dockerfile`          | nginx-unprivileged image, CSP and other security headers                     |

- **Permissions and modules in the UI** (`src/app/permissions.ts`, `src/app/modules.ts`,
  `src/app/guards.tsx`): navigation entries and actions are hidden or disabled with an explanation
  when the principal lacks the permission or the backend module is disabled. This is a usability
  layer; the backend stays authoritative and its `403`/`404` answers are shown.
- **State**: server state only in TanStack Query; the session is an HttpOnly cookie set by Axentra;
  the CSRF token lives in memory; `localStorage` holds only language, theme, sidebar state and the
  last product (`src/lib/storage.ts`).

## 2. Feature overview per area

Legend: **implemented + tested** = merged on `master`, uses real endpoints of the pinned contract,
rendered against a real backend by the e2e a11y sweep and covered by component tests and/or an area
e2e spec (named). Gaps in the tests are named in the last column and in section 12.

| Area (navigation)                             | Routes                                                            | What Studio does                                                                                                                                                                                                                                                               | Status and tests                                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in and setup                             | `/login`, `/setup`, `/invitations/accept`                         | Password login, OIDC providers from `GET /v1/meta`, first-run setup with the one-time setup token (the new admin is signed in), invitation acceptance, `return_to` after login                                                                                                 | implemented + tested: `LoginPage.test`, `smoke.spec` (sign-in). No component test for setup and invitation acceptance                    |
| Dashboard                                     | `/p/:id/dashboard`                                                | Counters from `GET .../overview`, usage and billing widgets, health and server summary                                                                                                                                                                                         | implemented + tested: `DashboardWidgets.test`, a11y sweep. No test of the page itself                                                    |
| Products                                      | `/products`, `/products/:id`                                      | List, create (slug derived from the name), edit with `If-Match`, archive/restore, product members (operators) with role ceiling                                                                                                                                                | implemented; `MembersPanel.test`, a11y sweep, `security.spec` (product members). No component test of the pages, no e2e create flow      |
| Tenants                                       | `/p/:id/tenants[/:tenantId]`                                      | Cursor list with `q`/status filter, create, edit (`If-Match`), suspend/reactivate, delete with type-to-confirm, members and invitations tabs (role ceiling, "Send invitation instead" on `404`)                                                                                | implemented; `MembersPanel.test`, a11y sweep, `security.spec`. No component test of the pages, no e2e create/suspend flow                |
| Users                                         | `/p/:id/users[/:userId]`, `/p/:id/invitations`                    | Product users, user detail with sessions (revoke), platform role, product-wide invitations                                                                                                                                                                                     | implemented; a11y sweep. No component or e2e test of session revocation                                                                  |
| Roles                                         | `/p/:id/roles`                                                    | Built-in roles (read-only) and custom roles (create, edit with `If-Match`, delete) with the permission catalog from `GET /v1/permissions`                                                                                                                                      | implemented; a11y sweep. No component test, no e2e flow                                                                                  |
| API keys                                      | `/p/:id/api-keys`                                                 | Product and tenant keys: create with permissions and expiry, one-time secret (`SecretRevealDialog`), rotate with grace period, revoke (cascade explained)                                                                                                                      | implemented; a11y sweep. No component test, no e2e flow                                                                                  |
| Records                                       | `/p/:id/records`                                                  | Tenant records per collection: JSON containment filter, sort, cursor paging, create/edit/delete with `If-Match`                                                                                                                                                                | implemented + tested: `RecordsPage.test`, `storage.spec` (create, edit, delete)                                                          |
| Data overview and files                       | `/p/:id/data`, `/p/:id/files`                                     | Collections, storage per tenant, storage configuration and retention; files per tenant with upload progress (XHR), server limits (`413`/`415`/`429` explained), label edit, signed download URLs, delete with `If-Match`, quota editing                                        | implemented + tested: `FilesPage.test`, `DataOverviewPage.test`, `storage.spec` (upload, download, blocked type, delete)                 |
| Jobs and schedules                            | `/p/:id/jobs[/:jobId]`, `/p/:id/schedules`                        | Counters, filters, live updates (SSE), detail with attempts, redacted error, payload and result; retry, cancel, enqueue with idempotency key; schedules (interval or validated UTC cron), enable/disable, edit (`If-Match`), delete                                            | implemented + tested: `JobsPage.test`, `JobDetailPage.test`, `SchedulesPage.test`, `cron.test`, `events.spec` (retry, cancel, schedules) |
| Events                                        | `/p/:id/events`                                                   | Event log with filters, publish, live view over SSE with `Last-Event-ID` resume                                                                                                                                                                                                | implemented + tested: `EventsPage.test`, `event-stream.test`, `events.spec` (live view)                                                  |
| Webhooks                                      | `/p/:id/webhooks[/:webhookId]`                                    | Endpoints with event type patterns, one-time signing secret, secret rotation with grace, test ping, delivery log, redelivery                                                                                                                                                   | implemented + tested: `WebhooksPage.test`, `WebhookDetailPage.test`, `events.spec` (secret, ping, failing deliveries, redelivery)        |
| Usage                                         | `/p/:id/usage`                                                    | Meters (create, edit, (de)activate, delete), daily chart (inline SVG with data table), totals per tenant, tenant usage per period with limits, quota overrides, events, reservation lookup (commit/release)                                                                    | implemented + tested: `UsagePage.test`, `usage-utils.test`, `billing.spec` (meters, usage, chart)                                        |
| Billing                                       | `/p/:id/plans`, `/p/:id/subscriptions[/:tenantId]`                | Plans with Intl-formatted prices and entitlements; subscriptions (subscribe, change plan with `If-Match`, cancel, resume, manual status), entitlement overrides, provider state; hosted checkout only for a reported test provider; Studio never collects card data            | implemented + tested: `PlansPage.test`, `SubscriptionsPage.test`, `TenantBillingPage.test`, `billing.spec` (plans, subscribe)            |
| Notifications                                 | `/p/:id/notifications`, `.../templates/new`, `.../templates/:key` | Templates with versions (`If-Match`), locale variants, variables and sample data, server preview in a sandboxed frame, test send (`Idempotency-Key`, `notify:send_external` rule), message log with retry, statistics, mailbox, own preferences                                | implemented + tested: `NotificationsPage.test`, `TemplateEditorPage.test`, `SendTestDialog.test`, `PreferencesPanel.test`, `notify.spec` |
| Audit log                                     | `/audit`                                                          | Platform and product audit events with filters, detail drawer; `404` for an event the caller may not read keeps the list                                                                                                                                                       | implemented + tested: `AuditPage.test`, a11y sweep                                                                                       |
| System: health, monitoring, settings, profile | `/health`, `/monitoring`, `/settings`, `/profile`                 | Readiness per check (also from `503` bodies), liveness, parsed `GET /metrics` (optional bearer token kept in memory), retention and tracing; language and theme (local and in `PATCH /v1/me`); effective server settings; profile, password (with fresh sign-in), own sessions | implemented + tested: `MonitoringPage.test`, `prometheus.test`, `ProfilePage.test`, `monitoring.spec`, `smoke.spec` (settings)           |
| **Search** (backend `f80429f`)                | none                                                              | **No UI.** The backend's new search module is not in Studio's pinned contract                                                                                                                                                                                                  | **not implemented** ([TODO.md](TODO.md))                                                                                                 |

Backend functions without an API, and therefore without a Studio screen (listed as backend gaps in
[TODO.md](TODO.md)): management of OIDC providers (configuration only), creating users directly
(users come from setup, OIDC or invitations), product-level operator invitations, the list of job
kinds open to tenant callers. A section whose backend module is disabled shows "module not enabled"
and never shows demo data.

## 3. Screenshots

Taken on 2026-11-02 with [`scripts/report-screenshots.mjs`](../scripts/report-screenshots.mjs)
(Playwright, Chromium, English UI) against a real Axentra at the pinned commit `7511a37`, started
with `scripts/e2e-backend.sh up --ref pinned --install --worker` (PostgreSQL 16, non-superuser
role, multi-product mode, all modules, worker and notification dispatcher running), and the
production build served by `vite preview`. The data shown (product "Acme Projects", tenants,
users, files, jobs, events, usage, plans, a template) was created by the script **through the
public API** before the shots; the four extra users come from the e2e worker's fixture job
`studio.e2e.create_user`, because Axentra has no user-creation API. Nothing is mocked. Desktop shots
are 1440 x 900 at device scale 1, phone shots 360 x 740 at device scale 2; all are palette PNGs
between 16 and 85 KB. Re-run: see the comment at the top of the script.

| Sign-in                                            | Dashboard                                          |
| -------------------------------------------------- | -------------------------------------------------- |
| ![Sign-in page](screenshots/login.png)             | ![Product dashboard](screenshots/dashboard.png)    |
| **Tenants**                                        | **Tenant members**                                 |
| ![Tenant list](screenshots/tenants.png)            | ![Tenant members](screenshots/tenant-members.png)  |
| **Users**                                          | **Roles and permissions**                          |
| ![Users](screenshots/users.png)                    | ![Roles](screenshots/roles.png)                    |
| **API keys**                                       | **Files and storage**                              |
| ![API keys](screenshots/api-keys.png)              | ![Files](screenshots/files.png)                    |
| **Jobs**                                           | **Events**                                         |
| ![Jobs](screenshots/jobs.png)                      | ![Event log](screenshots/events.png)               |
| **Webhook deliveries**                             | **Usage**                                          |
| ![Webhook](screenshots/webhook-detail.png)         | ![Usage](screenshots/usage.png)                    |
| **Plans**                                          | **Tenant subscription**                            |
| ![Plans](screenshots/plans.png)                    | ![Subscription](screenshots/subscription.png)      |
| **Notification template (sandboxed preview)**      | **Audit log**                                      |
| ![Template](screenshots/notification-template.png) | ![Audit log](screenshots/audit.png)                |
| **Settings**                                       | **Dark theme: dashboard**                          |
| ![Settings](screenshots/settings.png)              | ![Dashboard, dark](screenshots/dashboard-dark.png) |
| **Dark theme: usage**                              |                                                    |
| ![Usage, dark](screenshots/usage-dark.png)         |                                                    |

Phone (360 px): tenant list and the navigation drawer.

<p>
  <img src="screenshots/mobile-tenants.png" alt="Tenant list at 360 px" width="300">
  <img src="screenshots/mobile-navigation.png" alt="Navigation drawer at 360 px" width="300">
</p>

What the screenshots show beyond the layout: the jobs page has one job that failed on purpose
(`studio.e2e.flaky`), the webhook delivery log shows real `204` answers from a local receiver the
script runs, the template preview is the server's rendering inside the `sandbox=""` frame, and the
settings page shows the effective configuration of that backend (environment `test`, mode `multi`).

## 4. How Studio talks to the backend

- **Vendored contract**: `api/openapi.json` is a byte-identical copy of the backend's
  `openapi/axentra-v1.json` at the pinned commit (109 paths, API `1.0`). It is never edited by hand.
  `npm run api:sync -- --sha <sha>` (or `--from <file>`) rewrites it, `api/SOURCE` (source, `sha`,
  `api_version`, sync time), `api/BACKEND_REF` (the full SHA CI checks out) and
  `src/api/schema.d.ts` (types generated by `openapi-typescript` 7.13).
- **Contract check**: `npm run api:check -- --backend <checkout>` (`scripts/contract-check.mjs`,
  with its own unit tests) fails when `BACKEND_REF` is not a full SHA or differs from the checkout
  or from `api/SOURCE`, when the vendored contract differs from the backend's, or when
  `api/openapi.json`/`schema.d.ts` are not exactly what `api:sync` produces. Results in this run:
  - against the pinned `7511a37` (`/home/user/wt/axentra-master`, clean checkout): `Contract OK ...
at 7511a37ce0876c13e5a9c861e3b9e31b6401d99c (109 paths, API 1.0)`;
  - against `f80429f` (backend `master`): **fails as expected**, backend-only paths
    `/v1/products/{product_id}/tenants/{tenant_id}/search` and
    `.../search/documents/{kind}/{ref_id}`, no Studio-only paths. This is the re-pin in
    [TODO.md](TODO.md).
- **One client** (`src/api/client.ts`): `openapi-fetch` with `credentials: 'include'`, the header
  `Axentra-Client: axentra-studio/<version>; api=1.0`, `X-Axentra-CSRF` on every non-GET request,
  RFC 9457 problem details mapped to translated messages by their stable `code` with field errors
  and the `request_id` always shown, and a central redirect to `/login?return_to=...` on an
  unexpected `401`. Uploads use `XMLHttpRequest` for progress with the same headers
  (`src/api/upload.ts`); SSE streams are read with `fetch` so that `401`/`403` can be told from a
  network drop.
- **Concurrency and idempotency** follow the contract: `If-Match` with the resource `version`
  (products, tenants, roles, records, files, schedules, plans/subscriptions, templates, quotas);
  `Idempotency-Key` for usage events, event publish, job enqueue and notification sends, with
  `409` replays explained.
- Where the contract differs from the earlier endpoint catalog Studio was planned against, Studio
  follows the contract; the list is in the [README](../README.md#differences-from-the-original-api-catalog).

## 5. Installation, build and start commands

Verified in this run (Node.js 22.23.4, `npm ci` on a clean worktree, 443 packages):

```bash
npm ci
npm run build                                   # tsc -b + vite build -> dist/ (built in ~2 s)
AXENTRA_API_URL=http://127.0.0.1:8080 npm run dev       # http://127.0.0.1:5173, proxies /v1
AXENTRA_API_URL=http://127.0.0.1:18190 npx vite preview --port 4290   # what e2e and screenshots use
```

The API must accept the Studio origin (`security.allowed_origins` or `security.public_url`); on a
fresh server Studio opens the setup page, which needs a token from `axentra admin setup-token`.
Details: [README](../README.md#quick-start-development).

Production: `Dockerfile` builds an `nginxinc/nginx-unprivileged` image (uid 101, port 8080,
`/healthz`) that writes `config.json`, the optional `/v1` reverse proxy and the security headers at
start (`docker/40-axentra-studio.sh`). **Not verified here**: there is no Docker daemon in this
environment and Studio's CI has no image job, so the image was never built or started by an
automated check (section 12).

## 6. Test evidence and CI results

### 6.1 Local run (2026-11-02)

| Check                    | Command                                                               | Result                                                                                                       |
| ------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Types                    | `npm run typecheck` (`tsc -b`, strict)                                | no errors                                                                                                    |
| Lint                     | `npm run lint` (ESLint, jsx-a11y, zero warnings)                      | passed                                                                                                       |
| Format                   | `npm run format:check`                                                | all files formatted                                                                                          |
| i18n parity              | `npm run i18n:check`                                                  | de and en identical, 1,685 keys per locale                                                                   |
| Unit and component tests | `npm test` (Vitest, jsdom)                                            | **272 passed in 45 files**, 0 failed                                                                         |
| Build                    | `npm run build`                                                       | passed                                                                                                       |
| Contract                 | `npm run api:check -- --backend <7511a37 checkout>`                   | Contract OK (109 paths, API 1.0)                                                                             |
| Dependencies             | `npm audit --omit=dev` / `npm audit`                                  | 0 vulnerabilities in runtime dependencies; 16 moderate in dev tooling only (ESLint/`minimatch`, see TODO P3) |
| End-to-end               | `scripts/e2e-backend.sh run --ref pinned --install --worker`          | **186 passed**, 0 failed, 0 skipped (6.2 min), see 6.3                                                       |
| Production CSP           | smoke + a11y specs against `dist/` served with the Docker CSP headers | 160 passed, 0 failed (smoke, a11y sweep, notify), see section 7                                              |

The 45 test files cover the API client, CSRF and error mapping, compatibility check, runtime
config, guards and permissions, the theme provider and the design tokens' contrast
(`tokens.test.ts`), the data table, dialogs and copy field, the contract and i18n check scripts, and
the pages of audit, login, billing, events/jobs/webhooks, monitoring, notifications, profile,
records, storage and usage. **Fifteen pages have no component test** (API keys, roles, setup,
dashboard, products, health, not-found, settings, invitation acceptance, invitations, tenants,
users and their detail pages); see section 12.

### 6.2 End-to-end tests against a real backend

`scripts/e2e-backend.sh` starts a real Axentra from a checkout (or exactly `api/BACKEND_REF`): own
database owned by a **non-superuser** role (RLS enforced as in production), multi-product mode,
every module enabled (local storage, local notify provider, events, usage, billing `manual`),
`axentra migrate`, the first admin through `POST /v1/auth/setup` with the setup token, fixtures
through the API, and with `--worker` the job worker (including the e2e job handlers in
`e2e/fixtures`) and the notification dispatcher. Playwright builds Studio, serves it with
`vite preview` and runs every spec in two projects: desktop Chromium and a 360 x 740 phone
viewport. **186 tests in 8 files** (93 per project):

| Spec                 | Tests per project | What it proves                                                                                                                                                                                                                         |
| -------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `a11y.spec.ts`       | 75                | Route discovery (1) plus **every route of `src/app/router.tsx`** (37 patterns: 2 signed out, 35 signed in) in the **light and the dark theme**: no axe-core WCAG 2.1 A/AA violation, no page-level horizontal scroll, no console error |
| `smoke.spec.ts`      | 4                 | API version through the Studio origin, entry page, theme before first paint, sign-in and settings (fails on CSP violations when pointed at a server that sends a CSP)                                                                  |
| `events.spec.ts`     | 5                 | Cron schedule create/disable/delete; failed job retried; queued job cancelled; webhook with one-time secret, test ping, failing deliveries and redelivery; live event view                                                             |
| `security.spec.ts`   | 3                 | Unknown user → invitation instead (tenant) and explanation (product); system-only template has no "Send test"; without `notify:send_external` only members, roles above the caller disabled                                            |
| `storage.spec.ts`    | 2                 | File upload, list, download, refused blocked type, delete; records create, edit, delete and data overview                                                                                                                              |
| `billing.spec.ts`    | 2                 | Meters, recorded usage, chart and data table; plans, subscribing a tenant, entitlements                                                                                                                                                |
| `notify.spec.ts`     | 1                 | Create a template, preview it, send it to a member, find it in the log and the mailbox                                                                                                                                                 |
| `monitoring.spec.ts` | 1                 | Health checks, metrics and retention settings                                                                                                                                                                                          |

The a11y sweep therefore runs 148 page checks (37 routes x 2 themes x 2 viewports); no route is
skipped for a missing fixture. It checks the initial render of each route; dialogs, menus and error
states are checked only where an area spec opens them.

### 6.3 Results

| Run                                                                                                                             | Backend   | Result                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| CI, PR #3 run [41376595156](https://github.com/peterkarlhuber/axentra-studio/actions/runs/41376595156) (head `a35b458`)         | `7511a37` | check 272 tests passed; contract OK; **e2e 186 passed, 0 failed** (job 125058075685, 5.2 min)                                       |
| CI, PR #2 run [41375099609](https://github.com/peterkarlhuber/axentra-studio/actions/runs/41375099609) (head `87f2650`)         | `a2ca72a` | check, contract passed; **e2e 180 passed, 0 failed** (job 125053499801)                                                             |
| CI, PR #2 run [41372780630](https://github.com/peterkarlhuber/axentra-studio/actions/runs/41372780630) (earlier head `9d82202`) | `a2ca72a` | e2e 176 passed, **4 failed**; fixed before the merge (the later run above)                                                          |
| CI, PR #1 run [41363022505](https://github.com/peterkarlhuber/axentra-studio/actions/runs/41363022505) (head `0b5ab56`)         | none      | check job passed (the contract and e2e jobs did not exist yet)                                                                      |
| CI, PR #4 run [41383014581](https://github.com/peterkarlhuber/axentra-studio/actions/runs/41383014581) (head `82681cb`)         | `7511a37` | contract OK; **e2e multi 188 passed, 10 skipped; single 196 passed, 2 skipped; 0 failed, 0 flaky** (jobs 125077688055/125077688056) |
| Local, this report (`ee7d9f2` tree, `--ref pinned --install --worker`, ports 18190/4290, own database)                          | `7511a37` | **186 passed, 0 failed, 0 skipped** (6.2 min)                                                                                       |
| Local, before PR #3 (from [COMPATIBILITY.md](COMPATIBILITY.md))                                                                 | `7511a37` | 186 passed, 0 failed, 0 skipped, twice in a row                                                                                     |

CI retries a failed test once (`retries: 1` in CI); the passing CI runs above report no flaky tests.
Up to `ee7d9f2` the merge commits on `master` have **no CI run of their own**: the workflow's push
trigger named `main` while the default branch is `master`. PR #4 (merged as `4d2df1a`) changed the
trigger to `master`; `4d2df1a` is the first `master` commit with its own CI run. What GitHub tested
for the earlier PRs is the merge of each PR head into the then-current `master`, which is the tree
of the merge commit.

## 7. Security checks

Studio is a client; every authorization decision is made by Axentra (backend report, sections 8
and 15, criteria 2, 4 and 6). What Studio itself does, and how it was checked:

| Property                        | Implementation                                                                                                                                                                                                                                                                                                                                                                                                                      | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cookie session                  | Axentra's session cookie (HttpOnly, `SameSite=Lax`, set by the server); Studio never sees or stores the session token; every request uses `credentials: 'include'`                                                                                                                                                                                                                                                                  | `client.test.ts`; e2e sign-in on every signed-in test                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| CSRF                            | Token from the login/setup response or `GET /v1/auth/session`, kept **in memory only** (`src/api/csrf.ts`), sent as `X-Axentra-CSRF` on every non-GET request (including uploads); the backend additionally checks `Origin`                                                                                                                                                                                                         | `client.test.ts`; every e2e write flow passes the backend's CSRF and origin checks                                                                                                                                                                                                                                                                                                                                                                                                               |
| No secrets in the client        | No `import.meta.env` use in `src/`; the only build-time value is the package version; `config.json` holds only `apiBaseUrl`; no key-shaped string (`axk_...`) in `dist/assets`; API key, webhook secret and invitation token are shown once and never stored; the metrics bearer token stays in memory                                                                                                                              | grep of `src/` and `dist/` in this run; `SecretRevealDialog` used by API keys and webhooks                                                                                                                                                                                                                                                                                                                                                                                                       |
| Return paths                    | `safeReturnPath()` accepts only same-origin paths (`/...`, not `//` or `/\`)                                                                                                                                                                                                                                                                                                                                                        | `guards.test.tsx`, code review                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| XSS                             | React escaping everywhere; **no `dangerouslySetInnerHTML` and no `innerHTML`** in `src/` (grep); server-rendered email HTML is shown only in `<iframe sandbox="" referrerPolicy="no-referrer" srcdoc>` with a `default-src 'none'` meta policy (no scripts, no network, opaque origin)                                                                                                                                              | `TemplateEditorPage.test`, `notify.spec`; the a11y harness relies on Chromium refusing script injection into the frame (`e2e/support.ts`)                                                                                                                                                                                                                                                                                                                                                        |
| Content-Security-Policy         | Docker image: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ...; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`, plus `X-Frame-Options: DENY`, `nosniff`, `no-referrer`, Permissions-Policy, COOP/CORP. No inline scripts (the theme pre-paint script is the external `/theme-init.js`), fonts never inlined | Exercised locally without Docker: `dist/` served by a small Node server that sends exactly the headers `docker/40-axentra-studio.sh` writes for a same-origin setup (header checked with `curl -I`) and proxies `/v1`; `smoke.spec`, the full a11y sweep and `notify.spec` (sandboxed preview) then ran against it with `AXENTRA_E2E_BASE_URL`: **160 passed, 0 failed**. Any CSP violation is a console error, which `smoke.spec` and every a11y test fail on. The real nginx image was not run |
| Permission boundaries in the UI | Actions hidden/disabled by permission and module; role ceiling and owner rank mirrored from the backend's rules 8-12 (role catalog vs. own grant), `404` "no user directory" handled, `notify:send_external` and system-only templates respected                                                                                                                                                                                    | `permissions.test.ts`, `guards.test.tsx`, `MembersPanel.test`, `SendTestDialog.test`, `security.spec` (second, non-admin account)                                                                                                                                                                                                                                                                                                                                                                |
| Administrative actions          | Destructive actions confirm (type-to-confirm for archiving a product, deleting a tenant and other irreversible steps), `If-Match` prevents lost updates, idempotency keys prevent duplicate side effects                                                                                                                                                                                                                            | `ConfirmDialog.test`, area tests                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Dependencies                    | `npm audit --omit=dev`: 0; dev tooling: 16 moderate (`minimatch` via ESLint 9 and `openapi-typescript`), not shipped                                                                                                                                                                                                                                                                                                                | this run                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Not done: a penetration test or an independent security review of Studio, CSP verification of the
real Docker image in CI, and tests in browsers other than Chromium.

## 8. Design system and branding

- **Logo: the existing Axentra logo, not replaced.** `public/branding/axentra-logo.png` is a
  byte-identical copy of `assets/branding/axentra-logo.png` in `peterkarlhuber/axentra`
  (commit `1c5974594168bd1eb1430e41e7e4802a205ede64`, git blob
  `d82648e04ab1285e09543db031467133b70f767f`; `git hash-object` of Studio's file gives the same
  blob id in this run, and backend `master` still has that blob). All other brand files (transparent
  and on-dark lockups, square marks, favicon, apple-touch icon) are derived from it by
  [`scripts/derive-branding.py`](../scripts/derive-branding.py) (Pillow, reproducible byte for byte);
  provenance and method: [public/branding/README.md](../public/branding/README.md). The logo appears
  on the sign-in and setup pages (light and dark variants) and as the mark in the sidebar.
- **Design tokens derived from the logo** ([DESIGN_SYSTEM.md](DESIGN_SYSTEM.md),
  `src/styles/tokens.css`): brand primitives cyan `#06C4F5`, blue `#3488FA`, violet `#7846F9`, ink
  `#06034C`; semantic tokens for both themes; components use semantic tokens only. The navy sidebar
  stays navy in both themes; the logo gradient is used sparingly (top edge of key cards, active
  navigation indicator, hexagon motifs).
- **Contrast is tested**: `src/styles/tokens.test.ts` parses `tokens.css` and fails the build if any
  text pair drops below 4.5:1 or any UI/focus pair below 3:1, in both themes; axe-core checks the
  rendered pages in both themes (section 6.2).
- **Light, dark, system**: preference in `localStorage` and in the user's server-side preferences
  (`PATCH /v1/me`), applied before first paint by `/theme-init.js` (tested by `smoke.spec`),
  switched instantly from the user menu or settings.
- **Responsive**: usable from 360 px; the sidebar becomes a drawer, tables scroll inside their
  container, no page-level horizontal scroll (asserted on every route in the 360 px project).
- **Accessibility target WCAG 2.1 AA**: labels, focus management, skip link, keyboard operation,
  reduced motion; axe-core on every route in both themes and both viewports.
- **i18n**: German ("Sie" form) and English, 20 namespaces with 1,685 keys each, identical key sets
  and placeholders enforced by `npm run i18n:check` (with its own tests); language from the browser,
  `localStorage` or the user's `locale`; dates, numbers and prices through `Intl`. The e2e suite and
  the screenshots run in English; German is covered by the parity check, not by browser tests.

## 9. Independent build and operation

- Studio has its own repository, CI workflow, version (`0.1.0`), changelog and TODO list. Its
  `package.json` has no Axentra package; `npm ci && npm run build` and the unit tests need no backend
  (CI job "Typecheck, lint, i18n, test, build" runs without one).
- The backend is needed only at runtime (a URL) and for the contract and e2e checks, which fetch it
  by the pinned SHA. Axentra never needs Studio (backend report, section 9; `grep` for
  `axentra_studio` imports there: 0 hits).
- `grep -rni 'nodestro\|orkexa'` over the Studio repository (excluding `node_modules`): 0 hits.

## 10. Version and API compatibility

- `REQUIRED_API = {major: 1, minor: 0}` (`src/api/compat.ts`). At startup Studio reads
  `GET /v1/meta` `api_version` and refuses a different major or a lower minor with a full-page
  explanation (server and Studio versions shown), before any other request. Every request
  identifies the build with `Axentra-Client`. Details and limits (no re-check while a tab stays
  open, `Axentra-API-Version` header not read): [COMPATIBILITY.md](COMPATIBILITY.md).
- **Tested combinations** ([COMPATIBILITY.md](COMPATIBILITY.md)): Studio PR #2 (`0aed4fc`) with
  Axentra `a2ca72a`, and Studio PR #3 (`ee7d9f2`, current `master`) with Axentra `7511a37`, each with
  a passing contract job and e2e job on GitHub Actions. This report fills in the Studio commits and
  CI job ids in that table.
- **Axentra `f80429f` (backend `master`, search module) is untested with Studio.** Its API version is
  still `1.0` (`info.version` of its contract), so Studio's runtime check would accept it, and the
  contract change is additive (two new paths); but no e2e run against it exists. Re-pinning is the
  first P1 item in [TODO.md](TODO.md).

## 11. Joint integration tests with Axentra

The Studio repository owns the joint test (backend report, section 11). For every Studio pull
request, `.github/workflows/ci.yml`:

1. reads `api/BACKEND_REF` and checks out `peterkarlhuber/axentra` at that SHA;
2. job `contract`: Studio's vendored contract and generated types equal that commit's OpenAPI;
3. job `e2e`: installs `axentra[server]` from that checkout (Python 3.12), runs the backend's own
   drift check (`axentra openapi export --check`), starts PostgreSQL 16, the backend and a worker
   with `scripts/e2e-backend.sh`, and runs all 186 Playwright tests; uploads the HTML report, traces
   and backend logs as an artifact.

Results: section 6.3 (CI: 180/180 against `a2ca72a`, 186/186 against `7511a37`, and since PR #4
a matrix over both deployment modes: multi 188 passed, single 196 passed, 0 failed).

Limitations: nothing on the Axentra side triggers it for a new backend commit (it runs on Studio
pull requests and, since `4d2df1a`, on pushes to `master`); Chromium only; Studio served by `vite preview`, not by the Docker image.

## 12. Open limitations and residual risks

The full prioritized list is [TODO.md](TODO.md). The most important points:

**Functional scope**

- No search UI; Studio is pinned to `7511a37` and not tested against backend `master` `f80429f`.
- No UI for things the API does not offer: OIDC provider management, direct user creation,
  operator invitations at product level, the list of job kinds open to tenant callers.
- German and English only.

**Untested or unproven**

- Fifteen pages have no component test (section 6.1), and several write flows have no e2e spec:
  creating products and tenants, suspending a tenant, custom roles, API key create/rotate/revoke,
  session revocation, password change, sign-out. Their pages are rendered and checked by the a11y
  sweep only.
- The a11y sweep checks initial renders; dialogs, menus, toasts and form error states are checked
  only where an area spec opens them.
- Only Chromium (desktop and a 360 px viewport); Firefox and WebKit/Safari are untested.
- The Docker image (nginx, entrypoint, headers, `/v1` proxy) is not built or started by CI.
- Only the same-origin setup (reverse proxy or `vite preview` proxy) is e2e-tested; a separate API
  origin needs a same-site setup and was not tested.
- Single-product mode: Studio never triggers the backend's 409 for product create/archive (it
  offers no such actions there), so that refusal is asserted at API level only; a single-mode
  database with leftover products from an earlier multi setup is not e2e-tested.
- German UI texts are checked for key parity, not reviewed in browser tests.

**Operational properties**

- Merge commits up to `ee7d9f2` have no CI run of their own (push trigger `main`, fixed in PR #4).
- Compatibility is checked once per page load; a backend upgraded under an open tab is noticed only
  after a reload.
- `style-src 'unsafe-inline'` is needed by Radix UI; HSTS must be added at the TLS terminator.
- Live views use SSE that the backend serves by polling the database (backend report).

**Residual risks**: permission-dependent UI states are mirrored from the backend's rules and could
drift from them (the backend stays authoritative, and a refusal is shown, but a user could see an
action that then fails); screens without component tests may regress unnoticed until the next e2e
run touches them; behaviour in non-Chromium browsers is unknown; the production image is untested
by automation.

## 13. Pull requests and merge SHAs

Axentra Studio (`peterkarlhuber/axentra-studio`, all merged into `master` from
`claude/project-thread-wj7vfx`):

| PR                                                            | Title                                                                                    | Merged (UTC)     | Merge SHA                                  |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------ |
| [#1](https://github.com/peterkarlhuber/axentra-studio/pull/1) | Phase 1: Studio foundation, design system and Phase 1 admin areas                        | 2026-11-01 23:39 | `f1351991614f3f60cac1e9405a00207ce111f34a` |
| [#2](https://github.com/peterkarlhuber/axentra-studio/pull/2) | Phase 2/3: all admin areas, e2e against a real backend in CI, compatibility matrix       | 2026-11-02 02:03 | `0aed4fce5dc2e4dc3c662d5fdcd066611077c4da` |
| [#3](https://github.com/peterkarlhuber/axentra-studio/pull/3) | Adapt Studio to the Axentra security fixes (backend 7511a37)                             | 2026-11-02 02:21 | `ee7d9f2a9007a1f570d800b2d77e584ddfe6a5cb` |
| [#4](https://github.com/peterkarlhuber/axentra-studio/pull/4) | Single-product e2e with a CI mode matrix, template preview fix, CI push trigger `master` | merged           | `4d2df1a`                                  |

Axentra PRs #1-#9 and their merge SHAs: backend report, section 13. Backend PRs merged after it
that Studio has not adopted yet: #10 (implementation report, `ddc1f53`) and #11 (search module,
`f80429f`).

Important dependency versions (exact pins in `package.json`, lock file `package-lock.json`): React
19.3.1, React Router 7.18.5, TanStack Query 5.105.1, openapi-fetch 0.17.0, i18next 26.7.0, Vite
8.3.5, TypeScript 5.9.3, Vitest 5.0.5, Playwright 1.63.0, `@axe-core/playwright` 4.14.0,
openapi-typescript 7.13.0.

## 14. Notes on Nodestro

Studio contains no code taken or adapted from Nodestro or orkexa repositories (no "Adapted from"
headers, 0 grep hits for either name) and no runtime dependency on them. For a later Nodestro
integration Studio needs nothing specific: if Nodestro runs Axentra as a library or service and
exposes the Axentra `/v1` API, Studio administers it like any other Axentra instance, within the
API version range above. The migration plan itself is in the backend repository
(backend report, section 14).

## 15. Acceptance criteria status

Status values: **met**, **met with limitation**, **not met**. Criteria 1-16 concern the backend and
are assessed in the backend report (section 15); 17-30 are assessed here from Studio's side.

| #   | Criterion                                                                     | Status              | Evidence and limitation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ----------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 17  | Shared installation serves at least two products without cross-product access | met                 | Studio manages any number of products (product switcher, product-scoped routes); every data-changing e2e spec creates its own product on one shared multi-product backend; cross-product protection is server-side (backend report, criterion 17)                                                                                                                                                                                                                                                                           |
| 18  | Studio: complete, integrated admin UI in its own repository                   | met with limitation | All admin areas of the pinned API (section 2), separate repository; **no search UI** for the module added in backend `f80429f`; 15 pages without component tests                                                                                                                                                                                                                                                                                                                                                            |
| 19  | Branding with the existing Axentra logo                                       | met                 | Original logo byte-identical (same git blob as in the backend repository), derived assets reproducible, design tokens from the logo (section 8)                                                                                                                                                                                                                                                                                                                                                                             |
| 20  | UI areas work with real backend endpoints, no dead placeholders               | met with limitation | Every route rendered against a real backend (a11y sweep, 0 skipped) and 18 area flows per project; all calls go through the generated client of the real contract; no demo data. Not every control has an automated test (section 12)                                                                                                                                                                                                                                                                                       |
| 21  | Light mode, dark mode and responsive views implemented and tested             | met with limitation | Both themes on every route at 1280 px desktop and 360 px with axe-core and a horizontal-scroll check; token contrast test; theme before first paint. Chromium only; initial renders only                                                                                                                                                                                                                                                                                                                                    |
| 22  | UI security: permission limits, sessions and admin actions protected          | met with limitation | Server-side enforcement (backend); Studio: cookie session, in-memory CSRF, safe return paths, no secrets in the client, sandboxed previews, permission-aware UI and `security.spec` with a non-admin account; CSP see section 7. No independent review or penetration test of Studio                                                                                                                                                                                                                                        |
| 23  | Central user flows pass automated end-to-end tests                            | met with limitation | CI: 186 passed, 0 failed against `7511a37`; local run see 6.3. Product/tenant creation, roles, API keys, session revocation, password change and sign-out have no e2e flow                                                                                                                                                                                                                                                                                                                                                  |
| 24  | Studio works in single- and multi-product configuration                       | met with limitation | Multi-product: the whole e2e suite (CI and local) runs against a `mode = "multi"` backend. Single-product: since PR #4 (`4d2df1a`) CI runs the whole suite a second time against a `mode = "single"` backend (196 passed, 2 skipped, 0 failed; multi 188 passed, 10 skipped) plus `e2e/single-product.spec.ts` (409 on product create/archive, no switcher, read-only products page, redirect of unknown product ids). Limitation: the 409 is asserted at API level only, since Studio offers no such action in single mode |
| 25  | Axentra and Studio are technically and organizationally separate              | met                 | Separate repositories, CI, versions, changelogs, TODO lists; no shared code                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 26  | Studio uses Axentra through public interfaces; Axentra never needs Studio     | met                 | Only `/v1` over HTTP with types from the vendored public contract; no Axentra package in `package.json`; backend side: backend report, section 9                                                                                                                                                                                                                                                                                                                                                                            |
| 27  | Both repositories build and test independently                                | met with limitation | Studio builds and runs its unit tests without a backend (CI `check` job, local run); pushes to `master` run CI since `4d2df1a` (PR #4); earlier merge commits had no own run                                                                                                                                                                                                                                                                                                                                                |
| 28  | Studio runs with a defined compatible Axentra version                         | met                 | `api/BACKEND_REF` = `7511a37`, contract check OK, runtime check of `REQUIRED_API` 1.0, tested combinations in [COMPATIBILITY.md](COMPATIBILITY.md). Backend `master` `f80429f` is not yet a tested combination                                                                                                                                                                                                                                                                                                              |
| 29  | Axentra works fully without frontend dependencies                             | met (backend)       | Backend report, sections 5 and 9 (headless wheel, serve, health without any frontend). Studio adds nothing the backend needs                                                                                                                                                                                                                                                                                                                                                                                                |
| 30  | Joint e2e pipeline confirms both components in a realistic environment        | met with limitation | Studio CI `contract` + `e2e` jobs against the pinned backend with PostgreSQL 16, a non-superuser role and a worker (180/180 at `a2ca72a`, 186/186 at `7511a37`); only on Studio pull requests, no Axentra-side trigger, Chromium only, `vite preview` instead of the Docker image                                                                                                                                                                                                                                           |

No Studio criterion is marked "not met". The search module of backend `f80429f` has no Studio UI;
it is not a numbered acceptance criterion but is an open gap ([TODO.md](TODO.md), P1).
