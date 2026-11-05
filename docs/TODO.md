# Open work and known limitations

The one list of what Studio does not do yet, or does with a known limitation. Keep it honest:
remove an item only when it is done and tested, and add what you find. Priorities:

- **P0**: blocks a release or hides failures. Fix first.
- **P1**: needed for the next release.
- **P2**: should be done; workarounds exist.
- **P3**: nice to have.

Backend gaps (something the Axentra API does not offer) are marked **backend** and also belong in
the backend's `docs/TODO.md`.

Last full review: 2026-11-05 against `master` at `d124ae4` (quality round 3 close-out; TODO consolidated). Backend
pin `api/BACKEND_REF`: `cfa80dc` (Axentra #42, sign-in audit context; moved from `0a1d1cc` in the same PR; contract
unchanged). Before that: 2026-11-04 in UX round 3 against backend `0a1d1cc`.

## P0

None open. (The first GitHub Actions runs of the `contract` and `e2e` jobs passed on PR #2 and
PR #3, see [COMPATIBILITY.md](COMPATIBILITY.md).)

Release blockers: none. No Studio release is scheduled, and nothing here blocks the next planned preview (the
Nodestro desktop candidate, nodestro-desktop DSK-001). The P1 items are needed before a Studio release is planned.

## P1

- **Two Phase 1 pages have no component tests.** `ProductDetailPage` and `SettingsPage` have no
  Vitest test (UX round 3 added `UsersPage`, `UserDetailPage`, `HealthPage` and `NotFoundPage`;
  `DashboardPage` and the suspended-tenant gate of `InvitationsPage` are covered). They are
  rendered by the e2e a11y sweep and partly driven by area specs, but their actions are not
  asserted in isolation.
- **Drawers and toasts are not in the interactive a11y harness.** `e2e/a11y-interactive.spec.ts`
  checks open dialogs, menus, the info tip, the page help panel and form error states in both
  themes on desktop and 360 px, and since UX round 3 the audit drawer, the phone navigation drawer
  and an error toast. The record, event, webhook delivery and file drawers still need fixtures and
  are checked only where an area spec does so (for example `e2e/search.spec.ts`).
- **Route parameters need fixtures.** The harness fills `:productId`, `:tenantId`, `:userId`,
  `:jobId`, `:webhookId` and `:templateKey` from the e2e backend. A new detail route with another parameter (for example `:fileId`) is
  skipped with "no fixture for :fileId" until `scripts/e2e-backend.sh` creates such an object and
  `e2e/a11y.spec.ts` maps it.

- **No invitations for product operators (backend).** `POST /v1/products/{id}/members` resolves
  only users the caller can see (`404` otherwise), and there is no product-level invitation, so a
  product owner who is not a platform admin cannot add an operator without an account they can
  see. Studio explains this in the add dialog.

## P2

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
  missing. The base images are pinned by digest (`node:22.23.4-alpine`,
  `nginxinc/nginx-unprivileged:1.30.6-alpine`) and Dependabot proposes updates weekly; the pinned
  image was not built in the review environment (no Docker daemon), and its nginx config
  (`error_log ... crit` in `location /v1/`) was checked by `scripts/error-log.test.mjs` only, not
  by `nginx -t`.
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

- **No guard against losing unsaved input.** No page asks before a reload, a navigation or
  sign-out while a form has unsaved changes (no `beforeunload`, no router blocker); the profile
  name field, role editor and record editors lose edits silently. Dialogs close on Escape without
  asking (their state is kept until the page unmounts, so reopening restores it, which in turn
  shows stale input after **Cancel**). The role editor's **Save changes** is enabled without
  changes. Needs one shared "dirty form" pattern.
- **Revoking a session has no confirmation.** **Revoke** on a single session and **Sign out all
  other sessions** act at once (profile and user detail). The buttons now name the device;
  a confirmation that names the device, as for API keys, is still missing.
- **Invitation refusals are told apart by their English detail text (backend).** Accepting answers
  `403 forbidden` for three reasons (other email address, tenant or product not active, inviter
  can no longer grant the role). Studio matches the `detail` text to explain each; distinct codes
  (or a `reason` field) would make this robust. Unknown 403s show the server message. Backend: Axentra AXS-B1.
- **The initial bundle carries the help library.** About 956 kB raw / 296 kB gzip load before the
  first page, including the help index and article renderer that only `/help` and the help panel
  need. Lazy-load them.

## P3

- **Dependabot updates are reviewed but not merged.** UX round 3 triage of #16 to #27: #22 is safe
  once the `playwright-core` override moves to 1.64.1; #18 to #21 (GitHub Actions majors) one at a
  time; #25 (React Router 8) passes locally, merge alone after raising `engines.node`; #17 (nginx
  1.31 is a mainline release) with care; #23 (TypeScript 7; typescript-eslint and `routes.ts`) and
  #24/#26 (ESLint 10; jsx-a11y) are blocked upstream; hold #27 (@types/node 26) and #16 (Node 26
  image) while the runtime and CI use Node 22.

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
  "Übergangsfrist" and "anlegen" vs "erstellen"; en "Cancelled" vs US "Canceled";
  es quote style and the meaning of "registros"; pt-BR "inquilino" vs "tenant", "direito" and
  "substituição"; fr "Studio" vs "le Studio"; it "Verificatosi" and the `_many` plural forms.
- **The e2e backend uses fixed names.** `scripts/e2e-backend.sh` drops and recreates
  `$AXENTRA_E2E_DB`/`$AXENTRA_E2E_DB_ROLE`; parallel runs on one PostgreSQL need distinct names
  and ports (all configurable through environment variables).

- **Product creation does not use `?new=1`.** Other create dialogs open from the address (UX.md);
  the product dialog does not, so it cannot be linked or restored on reload.
- **Native and Studio validation mix.** Some inputs (for example the custom API key expiry date
  and the setup page's full name) use the browser's `required` bubble, others Studio's inline errors; the bubble is not translated
  by Studio and looks different.
- **Search kinds are typed by hand (backend).** There is no endpoint that lists the kinds indexed
  in a tenant, so the kind filter is free text with format validation. Backend: Axentra AXS-B2.
- **Password policy refusals do not mark the field (backend).** A refused password (setup, password
  change) answers `422` with only `detail`, so Studio cannot point to the password field or state the
  exact minimum length. Backend: Axentra AXS-B6 (UX round 3 handover axs B-2).
- **API keys of a creator who lost access still show as Active (backend).** Since AX3-01 such a key is
  refused with `api_key_creator_lost_access`, but the key list has no effective state; the help says the
  list still shows such keys as Active. Show it in the status column of `ApiKeysPage` once the backend
  offers it. Backend: Axentra AX3-01 effective-state item (UX round 3 handover axs B-3).
- **Vitest keeps a stale `import.meta.glob` result.** After adding a new i18n namespace, Vitest's
  cache (`node_modules/.vitest-cache`, `node_modules/.vite/vitest`) served the old locale map
  until it was deleted. Document it or disable the cache for `src/i18n`.

- **Plain user lands on "No products yet".** A signed-in user without roles sees a heading that
  reads like an empty installation (the body text is right).
- **Heading order on four screens.** axe best-practice `heading-order` (h1 to h3) on schedules,
  webhook detail, invitations and the "No products yet" table state.
- **Tenant page at 360 px.** The breadcrumb starts with an orphan "›" when the parent crumb is
  hidden, and Delete tenant is a filled danger button next to Suspend.
- **Vitest timeouts under machine load.** About 37 jsdom + userEvent tests exceed the default 5 s
  when the machine is busy (they pass alone and in CI); consider `testTimeout` 10 s or pool tuning.

## Recently fixed

- **Sign-in audit events carry client context (Axentra #42, `cfa80dc`).** `identity.login` (success and
  denied), `identity.setup.complete` and `identity.external.link` record IP and request id, and a successful
  login records the actor (UX A3-14, handover axs B-1); the audit drawer shows them without a Studio change,
  and both e2e modes passed against `cfa80dc` in UX round 3.
  `api/BACKEND_REF` now pins `cfa80dc` (contract unchanged).

- **Suspended tenants on tenant-scoped pages.** Billing, invitations, files, search, usage and
  records of a suspended tenant showed the generic **Not permitted** state; `SuspendedTenantGate`
  now explains the suspension and sends no request bound to fail (unit + e2e). Also: validation
  errors without a field no longer point to "marked fields"; full-page errors have a level-1
  heading; closing the phone drawer returns focus to the menu button; the disable-user dialog and
  help said a disabled user's API keys keep working (they stop until the user is enabled again).
- **API keys bound to their creator (Axentra AX3-01).** The new `403
api_key_creator_lost_access` is shown with the missing permission in six languages and links to
  help; the API keys page explains that a key works only while its creator holds the permissions
  (`e2e/api-key-creator.spec.ts`, multi-product mode).

- **Search UI.** `/p/:productId/search` searches a tenant's full-text index (phrases, exclusions,
  kind filter, highlighted matches as text, cursor paging), opens a document and removes it from
  the index with `search:index`. Covered by `src/features/search/*.test.ts(x)` and
  `e2e/search.spec.ts`.
- **Write flows in e2e.** `e2e/write-flows.spec.ts` drives product and tenant creation, tenant
  suspension, custom roles, API key create/rotate/revoke (the old key's grace period is now shown
  as "Replaced, stops working"), revoking another session, changing the password and signing out.
- **Interactive a11y.** `e2e/a11y-interactive.spec.ts`; it found that an open menu hid the page
  from assistive technology while it stayed focusable (Radix modal menu, axe
  `aria-hidden-focus`); menus are non-modal now.
- **Accepting an invitation explained every 403 as "another email address".** Since Axentra PR
  #31 the refusal can also mean "tenant not active" or "inviter lost the right"; each has its own
  explanation now (`AcceptInvitationPage.test.tsx`, `e2e/invitations.spec.ts`).
- Jobs the worker skipped for an inactive tenant ("skipped: ...") are marked in the jobs list
  and explained on the job page; built-in role descriptions are translated; a failed sign-in
  moves the focus to the password field; session revoke buttons name the device; tenant pickers
  sorted by name client-side (they sent a `sort=name` the API does not have, so the order was the
  server's, oldest first) and help says which 200 tenants they list.

- The default invitation link (`<public_url>/accept-invitation?token=…`) ended on "page not
  found": Studio served its accept page only at `/invitations/accept`. `/accept-invitation` is now a
  public alias; the accept page strips the token from the address bar and explains every outcome.
  Split-origin deployments set the new backend setting `notify.invitation_accept_url` (Axentra);
  links sent before that still point to the API origin. Covered by
  `src/features/tenants/AcceptInvitationPage.test.tsx` and `e2e/invitations.spec.ts`.

- The product switcher's accessible name ("Switch product") did not contain its visible text
  (axe `label-content-name-mismatch`, WCAG 2.5.3) on every signed-in desktop page. Found by the
  first signed-in e2e run; the visible text now leads the name.
