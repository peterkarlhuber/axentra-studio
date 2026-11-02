# Changelog

All notable changes to Axentra Studio are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

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
