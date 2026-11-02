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

None open. (The first GitHub Actions runs of the `contract` and `e2e` jobs passed on PR #2 and
PR #3, see [COMPATIBILITY.md](COMPATIBILITY.md).)

## P1

- **Re-pin `api/BACKEND_REF` to the merged product-permissions/storage-policy backend.** The
  vendored contract (`api/openapi.json`, `src/api/schema.d.ts`, `api/SOURCE`) is synced from the
  unmerged Axentra commit `67cd0ac` (product-defined permissions, per-product content-type
  policy), while `api/BACKEND_REF` still pins `7511a37`, so the `contract` CI job and the unit
  check "pins the same backend commit" fail, and the CI e2e job (which runs the pinned backend)
  cannot pass `e2e/permissions-policy.spec.ts` or load the new Permissions page and Files tab.
  After the backend merge: `npm run api:sync -- --sha <merge sha>`, full e2e in both modes, a row
  in [COMPATIBILITY.md](COMPATIBILITY.md). This also covers the search re-pin below.

- **Re-pin `api/BACKEND_REF` to include search.** Axentra `master` is at `f80429f` (PR #11,
  search module, API still 1.0, two new paths under `/v1/products/{id}/tenants/{tid}/search`).
  Studio pins `7511a37`; `npm run api:check` against `f80429f` fails with exactly those two
  backend-only paths. Run `npm run api:sync -- --sha f80429f129f76bc019118bd825bef637feaf8ecf`, the
  full e2e suite against that commit, and add a row to [COMPATIBILITY.md](COMPATIBILITY.md) (and
  the backend's mirror). Integration check: contract and e2e jobs green on the re-pin PR.
- **Search UI for the new backend search module.** Axentra's `search` module (tenant-scoped
  PostgreSQL full-text index; `GET .../search` with `search:query`, `PUT`/`DELETE
.../search/documents/{kind}/{ref_id}` with `search:index`) has no Studio page. Needs the re-pin
  above first; then a per-tenant search page (query, kind filter, highlighted results, cursor
  paging), module gating on `search`, permissions, i18n, component tests and an e2e spec
  (backend reference: `docs/modules/SEARCH.md` in the Axentra repository).
- **Phase 1 pages have no component tests.** `ApiKeysPage`, `RolesPage`, `SetupPage`,
  `DashboardPage`, `ProductsPage`, `ProductDetailPage`, `HealthPage`, `NotFoundPage`,
  `SettingsPage`, `InvitationsPage`,
  `UsersPage` and `UserDetailPage` have no Vitest test (shared parts such as `MembersPanel`, the
  data table, dialogs, guards and the API client do). They are rendered by the e2e a11y sweep, but
  their actions are not asserted anywhere.
- **Write flows without an e2e spec.** Creating products and tenants, suspending a tenant in the UI
  (reactivating is covered by `e2e/tenant-suspension.spec.ts`), creating
  and editing custom roles, creating, rotating and revoking API keys (one-time secret), revoking
  sessions, changing the password and signing out are not driven by any Playwright spec (only the
  initial render of their pages is checked). Area specs cover files, records, usage, billing,
  events, jobs, schedules, webhooks, notifications, monitoring and the member/invitation rules.
- **Interactive states are not covered by the a11y harness.** `e2e/a11y.spec.ts` checks the
  initial render of every route. Open dialogs, menus, drawers, toasts and form error states are
  checked only where an area spec does so explicitly.
- **Route parameters need fixtures.** The harness fills `:productId`, `:tenantId`, `:userId`,
  `:jobId`, `:webhookId` and `:templateKey` from the e2e backend. A new detail route with another parameter (for example `:fileId`) is
  skipped with "no fixture for :fileId" until `scripts/e2e-backend.sh` creates such an object and
  `e2e/a11y.spec.ts` maps it.

- **No invitations for product operators (backend).** `POST /v1/products/{id}/members` resolves
  only users the caller can see (`404` otherwise), and there is no product-level invitation, so a
  product owner who is not a platform admin cannot add an operator without an account they can
  see. Studio explains this in the add dialog.

## P2

- **Tenant-scoped pages of a suspended tenant answer `403` for product operators.** The tenant page
  explains the suspension and closes its Members and Invitations tabs, but other screens that load
  the tenant's data (for example its subscription page `/p/:productId/subscriptions/:tenantId`)
  show the generic **Not permitted** state. They could show the same "suspended, reactivate to
  manage" explanation (the tenant record is readable).

- **Studio cannot list a user's memberships.** API-only today.

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
  Studio's own create form (which offers an optional expiry: presets or a date); the expiry info
  tip and the help explain it, and the revoke confirmation says that derived
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
- **The Docker image is not built or tested in CI.** CI runs the e2e suite against `vite preview`,
  which sends no security headers. The production CSP of `docker/40-axentra-studio.sh` was
  exercised once locally without Docker (headers emulated, see the implementation report); a CI job
  that builds the image and runs the smoke and a11y specs against it (`AXENTRA_E2E_BASE_URL`) is
  missing.
- **The pinned backend commit must be pushed.** `api/BACKEND_REF` is written by `npm run api:sync`
  from a local checkout too; CI cannot check out an unpushed commit and fails loudly.

- **Single-product e2e runs share one product.** With `--mode single` every spec, both
  Playwright projects and both workers work in the same product at the same time. The specs use
  per-run names and read product-wide counts from the API; the live event view only asserts "at
  least one new event" there (`e2e/events.spec.ts`). A new spec must follow `specProduct()` in
  `e2e/support.ts` or it will collide in single mode.

- **Product permissions cannot be declared in Studio.** The Permissions page is read-only; the
  backend's `PUT`/`DELETE /v1/products/{id}/permissions/{name}` (`permissions:manage`, product
  owners) has no form yet. Products that embed Axentra declare them in code anyway.
- **Retired permissions in custom roles are dropped on save.** The role editor offers only active
  permissions; saving a role that still lists a retired product permission removes that name
  (it had no effect while retired, but would have come back if the product re-declared it). The
  read-only role view still lists it.

## P3

- **A failed single sign-on drops `return_to` (backend).** Axentra sends a failed OIDC login to
  `<login page>?login_error=…` without the original `return_to`. Studio keeps an opened invitation
  for the tab and returns to it after the next sign-in, but other deep links are lost.

- **"Sign out all other sessions" sends one request per session (backend endpoint decided
  against for now).** Axentra offers `DELETE /v1/auth/sessions/{id}` for the caller and an admin
  endpoint that ends _all_ sessions of a user, including the current one. A user has a handful of
  sessions, so Studio revokes the others one by one (at most 4 at a time, from a freshly read list,
  never the session marked `current`), counts an already ended session (`404`) as done, reports
  how many failed and reloads the list. A server-side "all but this one" endpoint would only be
  worth it for atomicity or users with very many sessions.
- **Single-product mode with leftover products.** Axentra accepts `mode = "single"` on a database
  that also holds other products as long as the configured slug exists. Studio then hides the
  switcher; a platform admin reaches the other products only through the Products page (and they
  cannot be archived there, the backend refuses it in single mode). Not covered by e2e.

- **Dev-only `npm audit` findings.** `npm audit` reports 16 moderate findings, all in development
  tooling: `minimatch` (GHSA-g3hv-75wg-m249, ReDoS-style "globparts amplification") pulled in by
  ESLint 9, `typescript-eslint`, `eslint-plugin-jsx-a11y`, `eslint-config-prettier`,
  `eslint-plugin-react-refresh` and by `openapi-typescript` (via `@redocly/openapi-core`).
  `npm audit --omit=dev` reports 0. None of it ships in the built app; they only process our own
  files. Upgrade when the tools release fixed ranges (ESLint 9 is also out of support: plan the move
  to ESLint 10).
- **Help: no screenshots.** Articles use localized HTML/CSS diagrams and exact UI labels instead
  of screenshots, which would need six languages × two themes and go stale with every UI change.
  If screenshots are wanted later, generate them from the e2e suite per locale.
- **Translations still need a native-speaker review.** `help:check` and `i18n:check` guarantee
  completeness, structure, links, placeholders and informal address, and a full non-native review
  of all six languages (UI strings and help) fixed terms, meaning, typography and label parity
  (2026-11-02). Still open, by a native speaker per language: tone and naturalness of the long help
  texts (most articles were skimmed, 12 per language read in full); de "Kulanzzeit" vs
  "Übergangsfrist" and "anlegen" vs "erstellen"; en "Canceled" (US) vs the server's "Cancelled";
  es quote style and the meaning of "registros"; pt-BR "inquilino" vs "tenant", "direito" and
  "substituição"; fr "Studio" vs "le Studio"; it "Verificatosi" and the `_many` plural forms.
- **The e2e backend uses fixed names.** `scripts/e2e-backend.sh` drops and recreates
  `$AXENTRA_E2E_DB`/`$AXENTRA_E2E_DB_ROLE`; parallel runs on one PostgreSQL need distinct names
  and ports (all configurable through environment variables).

## Recently fixed

- The default invitation link (`<public_url>/accept-invitation?token=…`) ended on "page not
  found": Studio served its accept page only at `/invitations/accept`. `/accept-invitation` is now a
  public alias; the accept page strips the token from the address bar and explains every outcome.
  Split-origin deployments set the new backend setting `notify.invitation_accept_url` (Axentra);
  links sent before that still point to the API origin. Covered by
  `src/features/tenants/AcceptInvitationPage.test.tsx` and `e2e/invitations.spec.ts`.

- The product switcher's accessible name ("Switch product") did not contain its visible text
  (axe `label-content-name-mismatch`, WCAG 2.5.3) on every signed-in desktop page. Found by the
  first signed-in e2e run; the visible text now leads the name.
