# Changelog

All notable changes to Axentra Studio are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

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

- The full Playwright suite passes against one `scripts/e2e-backend.sh run --worker` backend: the
  worker loads the e2e job handlers, billing uses the `manual` provider, webhook retries are short,
  the a11y route sweep gets job, webhook, template and subscription fixtures (no skipped routes),
  and specs no longer assume a stopped notification dispatcher. The new-template page no longer
  sends an incomplete draft to the preview endpoint (which answered 422).
- Switching between light and dark theme changes colours instantly; button colour transitions
  no longer fade through intermediate colours that briefly failed WCAG contrast.
