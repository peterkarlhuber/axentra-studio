# Open work and known limitations

The one list of what Studio does not do yet, or does with a known limitation. Keep it honest:
remove an item only when it is done and tested, and add what you find. Priorities:

- **P0**: blocks a release or hides failures. Fix first.
- **P1**: needed for the next release.
- **P2**: should be done; workarounds exist.
- **P3**: nice to have.

Backend gaps (something the Axentra API does not offer) are marked **backend** and also belong in
the backend's `docs/TODO.md`.

Last full review: 2026-11-06 against master at 715da0d (TODO abatement round). Backend pin
`api/BACKEND_REF`: the round's Axentra commit (product invitations, memberships, job and search
kinds, password policy, key states; additive `/v1` changes, see the backend's CHANGELOG). It must
point to a pushed Axentra commit before CI can run, see "The pinned backend commit must be
pushed". Before that: 2026-11-05 against `d124ae4` (quality round 3 close-out) with backend
`cfa80dc`.

## P0

None open. (The first GitHub Actions runs of the `contract` and `e2e` jobs passed on PR #2 and
PR #3, see [COMPATIBILITY.md](COMPATIBILITY.md).)

Release blockers: none. No Studio release is scheduled, and nothing here blocks the next planned preview (the
Nodestro desktop candidate, nodestro-desktop DSK-001). The P1 items are needed before a Studio release is planned.

## P1

- **Drawers and toasts are not in the interactive a11y harness.** `e2e/a11y-interactive.spec.ts`
  checks open dialogs, menus, the info tip, the page help panel and form error states in both
  themes on desktop and 360 px, and since UX round 3 the audit drawer, the phone navigation drawer
  and an error toast. The record, event, webhook delivery and file drawers still need fixtures and
  are checked only where an area spec does so (for example `e2e/search.spec.ts`).
- **Route parameters need fixtures.** The harness fills `:productId`, `:tenantId`, `:userId`,
  `:jobId`, `:webhookId` and `:templateKey` from the e2e backend. A new detail route with another parameter (for example `:fileId`) is
  skipped with "no fixture for :fileId" until `scripts/e2e-backend.sh` creates such an object and
  `e2e/a11y.spec.ts` maps it.

## P2

- **Role ceiling needs the role catalog.** Studio disables roles above the caller only when
  `GET .../roles` is readable (`roles:read`); otherwise the role is a free-text field and the
  server's `403` explains a refusal. The ceiling is computed from `GET /v1/me`; a role changed
  while the page is open is noticed after the next `/v1/me` refresh.
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
- **Only Chromium in e2e.** Playwright runs Chromium (desktop and a 360 px phone viewport); Firefox
  and WebKit are untested. Adding the two Playwright projects is small, but the browsers must be
  installed in CI (`npx playwright install --with-deps firefox webkit`) and the first runs checked
  for engine-specific failures.
- **`style-src 'unsafe-inline'` in the CSP.** Required by Radix UI's inline positioning and
  scroll-lock styles; a stricter policy breaks dialogs. Scripts never run inline.
- **HSTS is not set by the Docker image.** Add it at the TLS terminator.
- **The Docker image is not built or tested in CI.** CI runs the e2e suite against `vite preview`,
  which sends no security headers. The production CSP of `docker/40-axentra-studio.sh` was
  exercised once locally without Docker (headers emulated, see the implementation report); a CI job
  that builds the image and runs the smoke and a11y specs against it (`AXENTRA_E2E_BASE_URL`) is
  missing. The base images are pinned by digest (`node:22.23.4-alpine`,
  `nginxinc/nginx-unprivileged:1.30.6-alpine`) and Dependabot proposes updates weekly; the pinned
  image was built and started locally in the dependency round of 2026-11-05 (`nginx -t` passes,
  `/` serves Studio), but CI still does not build it.
- **The pinned backend commit must be pushed.** `api/BACKEND_REF` is written by `npm run api:sync`
  from a local checkout too; CI cannot check out an unpushed commit and fails loudly.

- **Single-product e2e runs share one product.** With `--mode single` every spec, both
  Playwright projects and both workers work in the same product at the same time. The specs use
  per-run names and read product-wide counts from the API; the live event view only asserts "at
  least one new event" there (`e2e/events.spec.ts`). A new spec must follow `specProduct()` in
  `e2e/support.ts` or it will collide in single mode.

- **Dialogs can lose unsaved input.** Page forms (profile name, product settings, notification
  preferences, template editor) use `UnsavedChangesGuard` (browser prompt on reload, **Leave
  without saving?** on navigation). Dialogs (role editor, record editor, create dialogs) still
  close on Escape or an outside click without asking, and keep their state until the page
  unmounts, so reopening after **Cancel** can show stale input. Extend the guard to `Dialog`
  (ask on close while dirty, reset on **Cancel**).

## P3

- **Dependency updates: what is held back and why** (dependency round 2026-11-05). Done in the PR
  that updates this entry: GitHub Actions v7 (replaced #18 to #21), marked 18.1.2 and Playwright
  1.64.1 without the `playwright-core` override (replaced #22), ESLint 10 (replaced #24 and #26),
  React Router 8.5.1 with `engines.node >=22.22.0` (replaced #25). Held back, each with an `ignore` rule in
  `.github/dependabot.yml`:
  - **TypeScript 6/7** (#23 closed): openapi-typescript 7.13.0 (newest) declares `typescript ^5.x`
    and typescript-eslint 8.72 `typescript < 6.1`; `npm ci` refuses TypeScript 7, and TypeScript 7
    also rejects `baseUrl` in `tsconfig.app.json`. Lift the rule when both support it (same as
    nodestro-sdk SDK-009).
  - **Node.js 26 build image (#16 closed) and `@types/node` 26 (#27 closed)**: CI, `engines` and
    the Dockerfile build stage use Node.js 22, which is supported until 2027-04-30. Move all three
    together in one PR well before that date; the build stage only produces static files, so the
    served image (nginx) is not affected. Owner decision 2026-11-05: the target is Node.js 24 LTS,
    coordinated with the other repositories in Q1 2027 after a compatibility check (nodestro-studio
    ST-054); `engines` then becomes `>=24`, React Router 8's `>=22.22.0` is covered.
  - **nginx mainline 1.31 (#17 closed)**: the image stays on nginx's stable branch (1.30.6 is its
    newest release; Dependabot still proposes 1.30.x and the next stable, 1.32).
  - **ESLint 10 override**: eslint-plugin-jsx-a11y 6.10.2 still declares `eslint ^9`; the npm
    override in `package.json` gives it the project's ESLint. With every jsx-a11y rule on, ESLint
    9 and 10 report the same findings. Drop the override when jsx-a11y supports ESLint 10.
  - **No auto-merge**: merge Dependabot pull requests by hand after CI (axentra has the same
    entry). Owner decision 2026-11-05: protect `master` with required CI checks (the jobs of
    `ci.yml` that run on every pull request, including both end-to-end modes) and block force
    pushes and deletion, without required approvals, so agent pull requests keep working;
    auto-merge stays off. Implementation is a separate work order (nodestro-studio ST-052).

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

- **Dev-only `npm audit` findings.** `npm audit` reports 11 moderate findings (16 before ESLint
  10), all in development tooling: `minimatch` (GHSA-g3hv-75wg-m249, ReDoS-style "globparts
  amplification") pulled in by `@eslint/config-array`, `typescript-eslint`,
  `eslint-plugin-jsx-a11y` and by `openapi-typescript` (via `@redocly/openapi-core`).
  `npm audit --omit=dev` reports 0. None of it ships in the built app; they only process our own
  files. Upgrade when the tools release fixed ranges.
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

- **Native and Studio validation mix.** Some inputs (for example the custom API key expiry date
  and the setup page's full name) use the browser's `required` bubble, others Studio's inline errors; the bubble is not translated
  by Studio and looks different.

## Recently fixed

- **TODO abatement round (2026-11-06).** Product operators are invited at product level (Invitations
  tab of a product; `axpinv_` links accepted on the accept page, also through single sign-on);
  invitation refusals use the backend's `reason`; a user's page lists their memberships; tenant
  members enqueue the job kinds opened to them; the search kind filter offers the indexed kinds;
  password fields state and mark the server's policy; the API key list shows the grace period and
  "Creator lost access"; a changed `Axentra-API-Version` header reloads the compatibility check;
  revoking sessions asks first; product permissions can be declared, changed and retired, and
  custom roles keep retired permissions on save (Save only when changed); a failed single sign-on
  returns to the deep link; `?new=1` opens the product dialog; page forms ask before unsaved input
  is lost; the help panel content loads on demand (no longer preloaded with the shell); heading
  order, the 360 px breadcrumb and the tenant Delete emphasis are fixed; `ProductDetailPage` and
  `SettingsPage` have component tests; Vitest runs without the module cache and with a 10 s test
  timeout.

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
