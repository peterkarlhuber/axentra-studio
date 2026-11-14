# Changelog

All notable changes to Axentra Studio are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `api/BACKEND_REF` moves to Axentra `3b80af1` (Tabrion 0.2.1 pin, Swagger UI with Subresource Integrity); the
  OpenAPI document is unchanged.
- CI job `Container image: reproducible build, smoke test and Trivy scan` (`scripts/image-check.sh`): builds the
  Docker image twice with `SOURCE_DATE_EPOCH` and requires identical manifests, smoke-tests the container (uid
  101, `nginx -t`, health check, SPA fallback, security headers, refused start on invalid API/CSP values) and fails
  on CRITICAL or HIGH Trivy findings that have a fix; the full Trivy report is uploaded as an artifact. Listed in
  `.github/ci-manifest.json`.
- The sign-in page and help explain the single sign-on error `explicit_link_required`: a platform account's
  sign-in method must be linked by a platform administrator (Axentra owner decision I5), in all six languages.
- README: the officially supported deployment for the first public release is the container image on Linux
  amd64; the Windows/macOS QA kit is a test tool, not a supported deployment.

- `qakit/`: a local, double-click test version of Axentra and Studio for manual QA on Windows, macOS (Apple
  silicon) and Linux, with bundled PostgreSQL 17, hash-pinned libraries, synthetic seed data, a kit page with an
  interactive German checklist, and smoke and browser checks (see `qakit/README.md`). Not a release; nothing is
  published. `api/BACKEND_REF` moves to the Axentra commit with the fake billing checkout fix (OpenAPI unchanged).
- `qakit/build/qa_checklist_auto.py` with `qakit/build/qa_auto/`: runs the 80 cases of the QA checklist
  automatically against a running kit in a real browser (Playwright) and writes one result per case (pass, fail,
  or not automated with the reason). The tester's own results are never touched.

### Fixed

- Leaving a detail page (tenant, user, job, webhook, template, product) through the sidebar or the breadcrumb
  changed the address but kept showing the detail page until a reload. The breadcrumb label store handed out a
  new setter on every change, so `useCrumbLabel` removed and re-added its label in an endless loop of updates
  that starved the navigation. Test: `src/app/RootLayout.test.tsx`.
- Closing a dialog that was opened without a Radix trigger (for example „New tenant“, which opens through
  `?new=1`) left the keyboard focus on the page body; it now returns to the element that opened the dialog.
- The template editor asked „Leave without saving?“ for an untouched template with variables (row ids of the
  variable list counted as changes).
- Records: choosing the collection and then the tenant in quick succession could drop the collection (both
  URL updates started from the same old search parameters).

### Security

- Pre-release assessment phase 3: the sign-in's return path is checked in a real browser against open
  redirects (backslash, encoded tab/newline/CR, `//host`, `javascript:`, absolute URLs) with a real backend
  (`e2e/return-path.spec.ts`, H-C1); with the fix reverted 7 of its cases fail. The Docker runtime moves to
  `nginxinc/nginx-unprivileged:1.30.6-alpine-slim` (pinned by digest) plus Alpine's fixed musl and zlib: Trivy
  OS findings go from 1 CRITICAL / 12 HIGH / 4 MEDIUM / 44 LOW to 0, the image shrinks from 100 MB to 41 MB and
  has no curl; the build stays reproducible (`apk` runs without a log file). The e2e helper `settleAnimations`
  passes a function instead of a string, so the specs also run under the image's CSP (no `unsafe-eval`).

- Fixes from the pre-release security assessment of 2026-11-13 (findings C-01, C-04, B-01, H-C1;
  report `axentra-sicherheitsbewertung.md`). The Docker image accepts `AXENTRA_API_URL` and
  `AXENTRA_PUBLIC_API_URL` only as plain `http(s)://host[:port][/path]` URLs (letters, digits, `.`, `_`, `-`
  or a bracketed IPv6 literal as host; path characters `A-Z a-z 0-9 . _ ~ / -`); any other value stops the
  start, so CSP and nginx directives can no longer be injected through them (C-01). The production build
  ships no source maps, and nginx answers `404` for `/assets/*.map` as a backstop (C-04). The access log
  masks signed download tokens (`/v1/files/download/[redacted]`) when Studio proxies `/v1` (B-01).
  `safeReturnPath` refuses whitespace, control characters and backslashes like the server's
  `safe_return_to` (H-C1). Tests: `scripts/entrypoint-security.test.mjs`, `scripts/access-log.test.mjs`,
  `scripts/build-config.test.mjs`, `src/lib/utils.test.ts`. Breaking only for a deployment whose API URL
  contains other characters (for example a query string).

- The Docker image validates `AXENTRA_CSP_CONNECT_SRC` at start (MUP-ONA VB-6): only space-separated
  `https://host` or `https://host:port` origins are accepted, and any other value (other schemes such as
  `http:` or `wss:`, keywords, paths, wildcards, quotes, semicolons, line breaks) stops the container start
  instead of being written into nginx's `Content-Security-Policy` header line. The default (empty) is
  unchanged; `'self'` and `AXENTRA_PUBLIC_API_URL` stay in `connect-src` as before. New
  `AXENTRA_TLS_TERMINATED` (default `false`): `true` when browsers reach Studio over HTTPS through a
  TLS-terminating proxy adds `Strict-Transport-Security: max-age=31536000; includeSubDomains`; an unknown
  value stops the start. `scripts/entrypoint-security.test.mjs` runs the start script with valid and invalid
  values (T-A7-5). Breaking only for a deployment that put non-`https` sources into `AXENTRA_CSP_CONNECT_SRC`.
- The Docker image's nginx access log records no query strings any more (security review round 4, R4-2).
  The first request of an emailed link (`GET /invitations/accept?token=...`, `/setup?token=...`) reaches
  nginx before Studio can remove the token from the address bar, and the default `combined` format logged
  the full request line, token included (also `?code=&state=` of an OIDC callback through the `/v1` proxy).
  The server now logs with its own `axentra_studio` format: the path of the request up to the first `?`,
  no query and no `Referer`. `scripts/access-log.test.mjs` checks the format and that no other
  `access_log` in the image uses another one.
- The sign-in page explains Axentra's new single sign-on error `invitation_requires_post` (all six
  languages, also in the **Signing in** help): Axentra now refuses an invitation on the `GET` start (security
  review round 4, R4-1), which Studio does not use (it sends invitations with the `POST` start only; its
  `405` fallback is the token-free `GET` start). The vendored contract and `api/BACKEND_REF` are synced from the
  axentra fix (descriptions only, no shape change): axentra `2767a2e` (axentra #29).
- An invitation token is kept out of every URL that Studio builds or keeps (security review round 3, NF-2
  and NF-3, the rest of AX-R2). The emailed link itself still carries it on its first request, which the
  image's access log no longer records (entry above):
  - Studio reads it once and removes it from the address bar at once (`history.replaceState`, no history
    entry): at startup, before the router runs, for the invitation link and for a sign-in page whose
    `return_to` holds one, and in `loginPath()`, the `/accept-invitation` alias and the accept page for
    in-app navigations. The tab keeps it in sessionStorage (memory when storage is blocked); the sign-in
    page address is `/login?return_to=%2Finvitations%2Faccept`.
  - Paths are compared after normalization (percent-decoding, case, repeated and trailing slashes), as the
    router matches them: `/invitations/accept/?token=`, `/INVITATIONS/accept?token=`,
    `/invitations/%61ccept?TOKEN=` and the alias are all treated as the accept page.
  - Single sign-on with an invitation uses Axentra's new `POST /v1/auth/oidc/{provider}/start` with the
    token in the JSON body and then navigates to the returned identity provider URL; the link itself is
    the plain `GET` start without the token (also used for sign-ons without an invitation, unchanged). A
    backend without the `POST` start (`405`) signs on without the invitation. `return_to` of a sign-on
    start never carries a token-like parameter (`token`, `*_token`, `invitation`).
  - `<meta name="referrer" content="no-referrer">` replaces `strict-origin-when-cross-origin`: the meta
    element overrode the image's `Referrer-Policy: no-referrer` header, so same-origin requests (through
    the `/v1` proxy) sent the full address, token included, as `Referer`, which nginx's combined log
    records. The Vite dev and preview servers send the header too.
  - Backend pin `api/BACKEND_REF` is axentra `f3ed8d2` (axentra #28: `POST /v1/auth/oidc/{provider}/start`,
    secret-free `return_to`, encoded-token redaction); the vendored contract is synced from it.
- Backend pin `api/BACKEND_REF` is axentra `024da57` (axentra #25: AX-R1 cursor validation; #26: AX-R2
  `invitation_accepted` after single sign-on). The OpenAPI contract is unchanged.
- Single sign-on for an invitation no longer puts the invitation token into `return_to` of
  `GET /v1/auth/oidc/{provider}/start` (re-review AX-R2). Axentra stores `return_to` in plain text
  with the login state (`axentra_login_states.return_to`) and does not redact it in its access log.
  The sign-in page now sends `return_to=<Studio>/invitations/accept` without the token and the token
  only in the dedicated `invitation` parameter, which Axentra stores encrypted and redacts; other
  return-path parameters and the hash are kept. The token is kept for the tab, so the accept page
  still finds it after the round trip. With `invitation`, Axentra also lets an invited address
  without an account sign up and accepts the invitation right after the sign-in. Back on the accept
  page, Studio reads Axentra's `invitation_accepted=<tenant id>` (trusted only in the tab that
  started that sign-on, and only when `/v1/me` lists the tenant), shows **Invitation accepted**
  without a second confirmation and forgets the token; otherwise the page asks for the
  confirmation as before. The sign-in page and the members and invitations help (all six
  languages) describe both paths: a password sign-in still confirms on the next page. The token
  in the start URL's query string is gone with the `POST` start (entry above).

### Fixed

- Invitation refusals are told apart by the backend's `reason` (`email_mismatch`, `scope_inactive`,
  `inviter_lost_access`) instead of the English detail text, which stays the fallback.
- Password fields (setup, password change) state the server's policy (`auth.password_policy` in
  `/v1/meta`) and mark the field with the server's reason on a refusal.
- The API key list shows a rotated key's grace period (`grace_until`) and a key whose creator lost
  access ("Creator lost access", with the withheld permissions) instead of **Active**.
- A changed `Axentra-API-Version` response header reloads the compatibility check (a server upgraded
  while the tab is open is noticed without a reload).
- Revoking a session and **Sign out all other sessions** ask first and name the device.
- The role editor keeps retired product permissions a custom role already holds (needs axentra with
  the matching fix) and enables **Save changes** only when something changed; product settings too.
- A failed single sign-on returns to the original deep link after the next sign-in (axentra passes
  `return_to` back).
- `?new=1` opens the product dialog; a signed-in user without products no longer sees
  "No products yet"; heading order on schedules, webhook detail, invitations and the products table;
  the 360 px breadcrumb no longer starts with an orphan separator; Delete tenant is an outlined
  danger button next to Suspend.
- Tenant pickers ask the server for `sort=name`, so they list the first 200 tenants by name.

- Product owners and admins who are not platform administrators can reactivate a suspended tenant
  (needs axentra with the suspended-tenant read fix). The tenant page loads, shows a **This tenant
  is suspended** banner that says what suspension means and who can lift it, and offers
  **Reactivate tenant** with a confirmation only to users with `tenants:update`. The Members and
  Invitations tabs show one explanation instead of failing with `403` (platform roles still see the
  data). The tenant list offers **Reactivate tenant** in the row menu of suspended tenants, and its
  status filter is kept in the address (`?status=suspended`). Help (tenants, troubleshooting, FAQ)
  describes the flow in all six languages instead of the API workaround. Vitest and a Playwright
  spec (`e2e/tenant-suspension.spec.ts`, real backend, product owner without a platform role and a
  member of the tenant) cover it; `scripts/e2e-backend.sh` creates two plain users for such specs.

### Changed

- Studio asks `GET /v1/me?tenants=memberships` (axentra AX3-03): per product only the tenants with a tenant
  role are listed, so the response no longer grows with the number of tenants for operators and platform
  roles, whose tenant permissions come from the product entry. The jobs page counts an operator's product
  role for **Enqueue job**. Older servers ignore the parameter.
- Help corrections: the known limitations no longer say that Studio creates no accounts, that there is no
  password reset or email verification, that notifications are email only or that there is no per-tenant
  send limit; the notifications help names the limit (`notify.tenant_send_limit_per_hour`).
- The help panel content (help library and Markdown renderer) loads on demand when a help topic
  opens, so it is no longer preloaded with the shell.
- Vitest runs without the file-system module cache (a new i18n namespace was not picked up) and
  with a 10 s test timeout (jsdom and user-event tests under machine load).
- `api/BACKEND_REF` and the vendored contract are synced from the round's axentra commit
  (additive `/v1` changes).

- Dependencies (dependency round 2026-11-05): ESLint 10 (eslint 10.14.0, @eslint/js 10.0.1; an npm
  override lets eslint-plugin-jsx-a11y use it, same lint findings as ESLint 9), Playwright 1.64.1 without
  the `playwright-core` override, marked 18.1.2, and the GitHub Actions of CI at v7 (checkout, setup-node,
  setup-python, upload-artifact). Dependabot groups GitHub Actions, waits a few days before proposing a
  new release, and ignores TypeScript, `@types/node` and Node.js image majors and nginx mainline releases
  (reasons in `docs/TODO.md`).
- React Router 8 (react-router 8.5.1, replaces Dependabot #25). Studio already imported everything from
  `react-router` (no `react-router-dom`) and used none of the removed future flags, so no code changed.
  React Router 8 requires Node.js 22.22 or later, so `engines.node` is now `>=22.22.0` (CI and the Docker
  build stage use the newest Node.js 22).
- The pinned backend (`api/BACKEND_REF`) moves from Axentra `0a1d1cc` to `cfa80dc` (axentra #42: sign-in and
  first-run setup audit events now carry the client IP and request id, so the Audit page shows them like every other
  event). The API contract is unchanged (114 paths); `npm run api:check` passes against the new commit.

- GitHub social preview `branding-src/social-preview.png` (1280 × 640, not served): the Axentra
  lockup with a "Studio" tag on a dark violet background, rendered by `scripts/social_preview.py`,
  the template shared with Nodestro and Orkexa. It is uploaded by hand in the repository settings.
- German: plan entitlements are now **Leistungen** (Tarifleistung, Leistungsüberschreibung) in the
  billing and usage texts and every German help article; "Berechtigung" means only permission
  again (docs/i18n/TERMINOLOGY.md).
- **Sign out all other sessions** no longer fails as a whole when one request fails: it reads the
  session list fresh, never revokes the session the server marks as current (and revokes nothing
  without that marker), sends at most 4 requests at a time, counts an already ended session as
  done, reports how many sessions could not be signed out with the first reason, and always
  reloads the list. No new backend endpoint (see docs/TODO.md).
- **New API key** offers an optional **Expiry**: never (default), in 30, 90 or 365 days, or the
  end of a chosen day (after today, local time zone; validated before sending). The info tip and
  the API keys article (new section "Expiry", six languages) explain that an expiry cannot be
  extended, that rotation keeps it and how derived keys inherit it. The list already showed it.
- Help (webhooks, webhook receiver tutorial; six languages): webhook deliveries now retry on their
  own schedule (Axentra `events.webhook_backoff_base_seconds` 120 s doubling, at most 6 hours per
  wait), so the default 8 attempts span about 2 to 4¼ hours instead of a few minutes.
- First-run setup tells "setup already completed" from "email address in use" by the new error
  codes (`setup_already_completed`, `email_taken`); the message text is only a fallback for older
  backends that answer `conflict` for both.
- Every error code the Axentra API can answer with has its own message (six languages) and a
  troubleshooting section: new `method_not_allowed` (405), the generic `error`, `invalid_signature`,
  `setup_already_completed` and `email_taken` (Axentra's new setup conflict codes), and
  `KNOWN_ERROR_CODES` now lists the codes `errors.json` already translated. `405`, `413` and `415`
  without a code map to their codes. The `mode_not_supported` message and article also name the
  Stripe subscription and test mailbox cases.
- The sidebar lists **Audit log** only for users who may read audit events (`platform:audit`, or
  `audit:read` in one of their products, from `GET /v1/me`); before, everyone saw it and got a
  `403` state. **Settings** (personal preferences for everyone) and **System health** /
  **Monitoring** (public readiness checks) stay visible and explain the parts the user cannot read;
  items of disabled modules stay visible as before. A direct link still shows **Not permitted**.
- Translation review of all six languages (UI strings and the 39 help articles): consistent terms
  (de **Betreiber** for the operator, **erneuern** for rotate; it "scheda" for tabs), informal address,
  typography (de „…“, fr « … » with non-breaking spaces, curly apostrophes), meaning fixes in pt-BR
  and it, and help labels that match the UI exactly. A native-speaker review is still open (see
  docs/TODO.md).
- New official Axentra logo. The two logo masters live in `branding-src/` (not served) and every
  brand file is derived from them by `scripts/derive_branding.py`, the shared derivation script
  (replaces `scripts/derive-branding.py`). The sign-in, setup and public help pages show the lockup
  matching the theme; the sidebar shows the official lockup with a white wordmark when expanded and
  the symbol when collapsed; the loading screen shows the symbol. One component
  (`src/components/layout/Logo.tsx`) picks the file everywhere. New favicons (`favicon.ico` with
  16/32/48 px, `favicon-16.png`, `favicon-32.png`) and apple-touch icon. The served paths
  `/branding/axentra-logo-transparent.png` and `/branding/axentra-logo-on-dark.png` stay the same.
  Removed: the copy of the old logo (`public/branding/axentra-logo.png`) and the old
  `axentra-mark-64.png` and `axentra-mark-192.png`. All screenshots in `docs/screenshots/` were
  re-taken.
- All languages address the user informally (German now uses "du" throughout).
- Many interface texts were reworded while writing the help: error messages say what happened,
  why and what to do; empty states and confirmations name the consequence.
- Focus returns to the element that opened the help panel; a URL fragment (`#section`) is no
  longer overridden by the route focus on navigation.

- Backend pin `api/BACKEND_REF` is axentra `2ff428c` (axentra #13 and #14). Users without an email
  address (external identity only, axentra migration `0007`) are shown by name or id in the user list,
  user detail, members panels, platform role and disable confirmations (the confirmation text is the
  user id then). The e2e notifier role includes `search:query`, which the backend's viewer role holds.

### Added

- Single sign-on users and identities (axentra `fcacc25`): platform administrators add a user who signs in
  through an identity provider, with or without an email address (**Add single sign-on user** on the Users
  page, `POST /v1/users/external`). A user's page lists the **Single sign-on identities** (`users:manage`);
  platform administrators link and unlink them (`.../users/{id}/identities`). The provider field suggests the
  issuers of the server settings; unlinking asks first, ends the user's sessions and explains the refusal of
  the user's last way to sign in (`409` `reason: last_sign_in_method`). Help: **Users** in all six
  languages; e2e `inbox-identities.spec.ts`.
- **Inbox** (`/p/:productId/inbox`): the signed-in user's in-app notifications (`.../notify/inbox/me`),
  product-wide or for one tenant, optionally unread only; opening one marks it as read, **Mark all as read**
  marks the scope. The sidebar entry shows the unread count, refreshed every minute. Help: **Notifications**
  (your inbox) in all six languages.
- A search the server stops at `search.statement_timeout_ms` (`422` `reason: query_too_expensive`) is
  explained as **Search took too long** with a link to the new help section; problem reasons with their own
  translation now take precedence over the code's general text.
- Forgotten password, password reset and email verification (needs axentra with account emails): a
  **Forgot your password?** link on the sign-in page, a page that requests the reset link (the same answer
  whether or not the address exists), a reset page and a verify page for the emailed links (the token is
  removed from the address bar at once; verification confirms only on a click), and a **Not verified** badge
  with **Send verification email** on the profile. All six languages; help: **Signing in** (forgotten
  password) and **Profile** (email verification); e2e `account-recovery.spec.ts`.
- Search: **Match word beginnings** (search as you type, `match=prefix`), kept in the address; help updated
  in all six languages.
- The API key revoke confirmation lists the active keys created with the key (transitively), which stop
  working with it.
- Dialogs with input ask **Discard your changes?** on Escape, an outside click or close, and start empty
  again after **Cancel** (role, permission, record, product, tenant, member and invitation dialogs).
- Native form validation (required, type, range) shows Studio's translated message in the field instead
  of the browser's bubble; the first invalid field takes the focus.
- Tests: the interactive a11y harness opens the record, file, event and webhook delivery drawers (new
  fixtures in `scripts/e2e-backend.sh`).
- Product team invitations (needs axentra with product-level invitations): a product's
  **Invitations** tab invites operators by email with a product role (`product_members:manage`,
  role ceiling), lists and revokes open invitations, and the accept page accepts `axpinv_` links,
  also through single sign-on (`product_invitation_accepted`), and opens the product. Help:
  **Members and invitations**, section "Product team".
- A user's page lists their product and tenant memberships (`GET /v1/users/{id}/memberships`).
- Tenant members without `jobs:manage` can enqueue the job kinds opened to them: the enqueue dialog
  requires a tenant and offers the kinds from `GET .../jobs/kinds`; managers get the kinds as
  suggestions.
- The search page offers the tenant's indexed kinds as toggle chips with counts
  (`GET .../search/kinds`).
- Product permissions can be declared, changed and retired on the Permissions page
  (`permissions:manage`; only permissions declared over the API, code-registered ones stay
  read-only).
- `UnsavedChangesGuard`: the profile name, product settings, notification preferences and the
  template editor ask before unsaved input is lost (browser prompt on reload, **Leave without
  saving?** on navigation).
- Component tests for `ProductDetailPage` and `SettingsPage`.

- In-app help system. A help center at `/help` (public, also reachable when the API is down or
  incompatible) with 39 articles in 13 chapters written against the real product: introduction,
  getting started, every Studio area, developers, security, three tutorials, troubleshooting
  (one entry per API error code), FAQ and reference (permissions, modules, keyboard, glossary,
  limitations). Search over titles, keywords and sections with deep links, table of contents,
  related topics, previous/next, copyable code examples, localized diagrams (architecture, role
  hierarchy, job lifecycle, webhook delivery, key rotation) and stable `#anchor` links.
  Contextual help: a help button in page headers opens the page's article in a side panel without
  leaving the page, info tips (`FormField info`) explain fields with keyboard-operable toggletips,
  error states link to their troubleshooting entry, and the sidebar, top bar and sign-in screens
  link to the help center. Authoring rules in `docs/HELP_AUTHORING.md`; `npm run help:check`
  (also in CI) verifies files, front matter, anchors, structure parity, links and topics used in
  code.
- Spanish, French, Brazilian Portuguese and Italian for the whole interface and the help, next
  to English and German. Language menus name each language in its own language; any `pt` browser
  language selects Brazilian Portuguese. Terminology is fixed in `docs/i18n/TERMINOLOGY.md`.
  `npm run i18n:check` now compares every language with English (keys, placeholders, plural
  categories per language), rejects formal address and reports values left in English unless
  they are listed in `src/i18n/untranslated.json`.

- Product-defined permissions (Axentra G-1, needs a backend with
  `GET /v1/products/{id}/permissions`): the role and API key editors load the product's catalog
  (built-in plus the product's own permissions, retired ones left out), group product permissions
  by namespace and resource after the built-in groups and mark them with a "Product" badge. New
  read-only page **Access & API Keys → Permissions** (`/p/:productId/permissions`) lists the
  product's own permissions (scope, description, extra role grants, read-only flag, declared by
  code or API, active/retired with a "Show retired" switch) and the built-in ones.
- Per-product storage content-type policy (Axentra G-7, needs
  `GET/PUT /v1/products/{id}/storage/policy`): the product detail has a **Files** tab (storage
  module only) to choose refuse or keep blocked types as inert attachments (or inherit the
  installation default), add blocked extensions/content types and extensions accepted as inert,
  with the built-in blocklist shown read-only and `If-Match` on the product version. The upload
  dialog and the data overview show the product's effective policy; the file drawer marks files
  stored inert with their original type.
- e2e spec `e2e/permissions-policy.spec.ts`; component tests for the permission grouping, the
  Permissions page, the policy card and the inert file details.

- Implementation report `docs/AXENTRA_STUDIO_IMPLEMENTATION_REPORT.md` (architecture, features,
  backend contract, tests and CI, security, design and branding, compatibility, acceptance
  criteria 17-30) with screenshots in `docs/screenshots/`, taken against a real backend by
  `scripts/report-screenshots.mjs`.
- Single-product mode tested end to end: `scripts/e2e-backend.sh --mode single|multi`
  (`AXENTRA_E2E_MODE`) starts Axentra in either deployment model, the specs work in the one
  product in single mode (`specProduct()` in `e2e/support.ts`), `e2e/single-product.spec.ts`
  checks the mode specifics, and CI runs the e2e job as a matrix over both modes. Studio in single
  mode shows the product as a static label instead of the switcher, explains on the products and
  product pages why products cannot be created or archived, and redirects an unknown product id
  to the same section of the one product.
- Notifications (notify module) and Monitoring: templates with versions (`If-Match`), locale
  variants, variables and sample data, a live server preview in a sandboxed frame (no scripts, no
  network), test sends with an `Idempotency-Key`, the message log with attempts, redacted last
  error and retry, delivery statistics, the local mailbox, own preferences with locked
  categories; a Monitoring page with per-check readiness (503 bodies), liveness, parsed
  `GET /metrics` values (optional bearer token, kept in memory only) and retention/tracing from
  `GET /v1/settings`. `/metrics` is proxied by `vite dev/preview` and the Docker image.
- Project setup: Vite, React 19, strict TypeScript, React Router 7, TanStack Query, ESLint,
  Prettier, Vitest, Playwright with axe-core (see `docs/adr/0001-frontend-stack.md`).
- Typed API client from the vendored Axentra OpenAPI contract (`api/openapi.json`, synced with
  `npm run api:sync`), with cookie sessions, an in-memory CSRF token (`X-Axentra-CSRF`), the
  `Axentra-Client` header, problem+json error mapping with request ids, and a central redirect to
  the login page on `401` that keeps the return path.
- Startup checks: runtime `/config.json`, `GET /v1/meta` and API compatibility against
  version 1.0, first-run setup, session, login with password and OIDC providers.
- Design system derived from the Axentra logo: tokens for light and dark themes with a WCAG AA
  contrast test, self-hosted fonts, reduced-motion support, and components (buttons, form
  controls, data table with sort and cursor "load more", dialogs with type-to-confirm, toasts,
  tabs, menus, tooltips, empty, error and loading states).
- App shell: collapsible navy sidebar that becomes a drawer on phones, breadcrumbs, product
  switcher, user menu with language, theme and sign-out, skip link and focus management.
- Screens for the Phase-1 API: products, product members, dashboard, tenants with members and
  invitations, invitation acceptance, users with sessions and platform role, roles, API keys with
  one-time secrets, rotation and revocation, read-only records, audit log, system health,
  effective settings, profile with password and sessions.
- "Module not enabled" and "not yet available in Studio" states for files, jobs, events,
  webhooks, usage, plans, subscriptions and notifications.
- Data & Storage: Files (per-tenant list with filters and server sort, upload with progress and
  the server's size/type limits, honest 413/415/429 errors, metadata detail and label editing,
  downloads and shareable links through signed download URLs, delete with `If-Match`), tenant
  storage usage and quota editing, a Data overview (collections, storage per tenant, storage
  configuration and reported retention), and record create/edit/delete with `If-Match`.
- Usage & Billing: meters (create, edit, (de)activate, delete), product usage chart (inline SVG
  with data table) and totals per tenant, tenant usage per period with limits, quota overrides,
  events and reservation lookup (commit/release); plans with Intl-formatted prices and
  entitlements, subscriptions per tenant (subscribe, change plan, cancel at period end or now,
  resume, manual status, hosted checkout only for a reported test provider), entitlement
  overrides, payment provider state, and usage/billing widgets on the dashboard.
- Events & Jobs (module `events`): jobs with counters, status/kind/tenant filters, live updates,
  detail (attempts, redacted error, payload, result), retry, cancel and enqueue with an
  idempotency key; schedules (interval or validated UTC cron) with enable/disable, edit
  (`If-Match`) and delete; event log with filters, publish and a live SSE view (resume with
  `Last-Event-ID`, pause/resume, connection state); webhook endpoints with event type patterns,
  one-time signing secret, rotation with grace period, test ping, delivery log and redelivery.
- German and English translations with a parity check (`npm run i18n:check`).
- Brand assets derived from the original logo with a reproducible script
  (`scripts/derive-branding.py`, provenance in `public/branding/README.md`).
- Docker image on nginx-unprivileged with an optional `/v1` reverse proxy, runtime
  `config.json`, and security headers including a CSP without inline scripts.
- CI workflow for typecheck, lint, formatting, i18n parity, tests and build.
- End-to-end against a real backend: `scripts/e2e-backend.sh` (PostgreSQL role without
  superuser, all modules, first admin via setup token, optional worker), CI jobs `contract`
  (drift check against `api/BACKEND_REF`) and `e2e` (all Playwright specs, report artifact), an
  a11y/responsive harness over every registered route (`e2e/a11y.spec.ts`), and
  `docs/COMPATIBILITY.md` and `docs/TODO.md`.

### Changed

- `api/openapi.json`, `api/SOURCE` and `src/api/schema.d.ts` are synced from the Axentra branch
  with product permissions and the storage policy (`67cd0ac`, API still 1.0). `api/BACKEND_REF`
  intentionally stays at `7511a37` until that backend change is merged; until the re-pin,
  `npm run api:check` and the unit check "pins the same backend commit"
  (`scripts/contract-check.test.mjs`) fail by design.

### Security

- Adapted to Axentra's security fixes (backend `7511a37`, contract synced): role options above the
  caller's own grant (role ceiling, owner roles only for owners) are listed but disabled in member
  and invitation forms, members holding such a role cannot be changed or removed there, and the
  server's `403` explanation is shown; adding a user the caller cannot see (`404`) offers "Send
  invitation instead" for tenants and explains the limit for product members; the send-test
  dialog offers free-form addresses only with `notify:send_external` and never offers system-only
  templates (`invitation`, badge and explanation); `409` idempotency conflicts are explained (new
  key for event publish, notification send and on request for job enqueue); a first password that
  needs a fresh sign-in (`reauthentication_required`) leads to the login page with a return path;
  API key texts describe inherited expiry and cascading revocation; an audit event the caller may
  not read (`404`) keeps the list values. New e2e spec `e2e/security.spec.ts`.

### Fixed

- Invitation links: Axentra's default link `<public_url>/accept-invitation?token=…` ended on "page
  not found". `/accept-invitation` is now a public alias of `/invitations/accept` (history replace,
  query kept), so links already sent work when Studio runs on the API origin; split-origin
  deployments set Axentra's new `notify.invitation_accept_url`. Signed-out visitors keep the token
  through password and single sign-on login. The accept page removes the token from the address
  bar, keeps it for the tab only, still waits for confirmation, shows the signed-in account and
  explains every outcome with a next step (accepted with tenant and role, unusable invitation,
  another address with "sign out and use the invited address", account without email, server not
  reachable with retry). The sign-in page explains an invitation sign-in and how people without an
  account get one. Help articles updated in all six languages; new `e2e/invitations.spec.ts`;
  `scripts/e2e-backend.sh` points invitation links at the preview origin when the backend supports
  the setting.
- The full Playwright suite passes against one `scripts/e2e-backend.sh run --worker` backend: the
  worker loads the e2e job handlers, billing uses the `manual` provider, webhook retries are short,
  the a11y route sweep gets job, webhook, template and subscription fixtures (no skipped routes),
  and specs no longer assume a stopped notification dispatcher. The new-template page no longer
  sends an incomplete draft to the preview endpoint (which answered 422).
- Switching between light and dark theme changes colours instantly; button colour transitions
  no longer fade through intermediate colours that briefly failed WCAG contrast.
