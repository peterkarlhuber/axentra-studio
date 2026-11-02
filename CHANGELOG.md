# Changelog

All notable changes to Axentra Studio are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

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
