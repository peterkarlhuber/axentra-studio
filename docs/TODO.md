# Open work and known limitations

The one list of what Studio does not do yet, or does with a known limitation. Keep it honest:
remove an item only when it is done and tested, and add what you find. Priorities:

- **P0**: blocks a release or hides failures. Fix first.
- **P1**: needed for the next release.
- **P2**: should be done; workarounds exist.
- **P3**: nice to have.

Backend gaps (something the Axentra API does not offer) are marked **backend** and also belong in
the backend's `docs/TODO.md`.

## P0

- **First CI run of the `contract` and `e2e` jobs.** Both ran locally only (see
  [COMPATIBILITY.md](COMPATIBILITY.md)). Confirm them on GitHub Actions, then fill in the Studio
  commit in the compatibility table.

## P1

- **Phase 2/3 areas.** Files, jobs, events, webhooks, usage, plans, subscriptions and
  notifications show only "module not enabled" / "not yet available in Studio"
  (`futureModule()` in `src/app/router.tsx`). Screens are being built per area; the a11y harness
  (`e2e/a11y.spec.ts`) picks new routes up automatically.
- **Records are read-only.** The record browser lists and filters; creating, editing and deleting
  records is not in Studio.
- **Interactive states are not covered by the a11y harness.** `e2e/a11y.spec.ts` checks the
  initial render of every route. Open dialogs, menus, drawers, toasts and form error states are
  checked only where an area spec does so explicitly.
- **Route parameters need fixtures.** The harness fills `:productId`, `:tenantId` and `:userId`
  from the e2e backend. A new detail route with another parameter (for example `:fileId`) is
  skipped with "no fixture for :fileId" until `scripts/e2e-backend.sh` creates such an object and
  `e2e/a11y.spec.ts` maps it.

- **No invitations for product operators (backend).** `POST /v1/products/{id}/members` resolves
  only users the caller can see (`404` otherwise), and there is no product-level invitation, so a
  product owner who is not a platform admin cannot add an operator without an account they can
  see. Studio explains this in the add dialog.

## P2

- **Role ceiling needs the role catalog.** Studio disables roles above the caller only when
  `GET .../roles` is readable (`roles:read`); otherwise the role is a free-text field and the
  server's `403` explains a refusal. The ceiling is computed from `GET /v1/me`; a role changed
  while the page is open is noticed after the next `/v1/me` refresh.
- **Job kinds open to tenant callers are not listed (backend).** Callers without `jobs:manage`
  may enqueue only kinds opened with `enqueue_permission`, but the API does not expose which kinds
  those are. Studio offers "Enqueue job" only to `jobs:manage` holders and shows the server's
  `403` explanation otherwise.
- **API key expiry inheritance is text only.** Studio creates keys with a user session, so the
  "inherits the creating key's expiry" rule (`422` for a later `expires_at`) never applies to
  Studio's own create form; the page explains it, and the revoke confirmation says that derived
  keys are revoked too. The confirmation does not list those derived keys (they could be found
  through `created_by`, which holds the creating key's actor id; not built).

- **Separate API origin needs a same-site setup.** Axentra's session cookie is `SameSite=Lax`, so
  with `apiBaseUrl` pointing to another origin the API and Studio must share the registrable domain
  (`studio.example.com` + `api.example.com`); cross-site setups cannot sign in. The API must also
  list the Studio origin in `security.allowed_origins`, the CSP must allow the API in
  `connect-src` (`AXENTRA_PUBLIC_API_URL`), and OIDC must accept the absolute Studio return URL.
  Same origin behind a reverse proxy is the recommended and the only e2e-tested setup.
- **Compatibility is checked once per page load.** `MetaGate` reads `GET /v1/meta` with
  `staleTime: Infinity`; a server upgraded while a tab is open is noticed only after a reload. The
  `Axentra-API-Version` response header (sent and exposed by the backend) is not read.
- **Only Chromium in e2e.** Playwright runs Chromium (desktop and a 360 px phone viewport); Firefox
  and WebKit are untested.
- **`style-src 'unsafe-inline'` in the CSP.** Required by Radix UI's inline positioning and
  scroll-lock styles; a stricter policy breaks dialogs. Scripts never run inline.
- **HSTS is not set by the Docker image.** Add it at the TLS terminator.
- **The pinned backend commit must be pushed.** `api/BACKEND_REF` is written by `npm run api:sync`
  from a local checkout too; CI cannot check out an unpushed commit and fails loudly.

## P3

- **Dev-only `npm audit` findings.** `npm audit` reports 16 moderate findings, all in development
  tooling: `minimatch` (GHSA-g3hv-75wg-m249, ReDoS-style "globparts amplification") pulled in by
  ESLint 9, `typescript-eslint`, `eslint-plugin-jsx-a11y`, `eslint-config-prettier`,
  `eslint-plugin-react-refresh` and by `openapi-typescript` (via `@redocly/openapi-core`).
  `npm audit --omit=dev` reports 0. None of it ships in the built app; they only process our own
  files. Upgrade when the tools release fixed ranges (ESLint 9 is also out of support: plan the move
  to ESLint 10).
- **Languages.** German and English only.
- **The e2e backend uses fixed names.** `scripts/e2e-backend.sh` drops and recreates
  `$AXENTRA_E2E_DB`/`$AXENTRA_E2E_DB_ROLE`; parallel runs on one PostgreSQL need distinct names
  and ports (all configurable through environment variables).

## Recently fixed

- The product switcher's accessible name ("Switch product") did not contain its visible text
  (axe `label-content-name-mismatch`, WCAG 2.5.3) on every signed-in desktop page. Found by the
  first signed-in e2e run; the visible text now leads the name.
