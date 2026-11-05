# ADR 0001: Frontend stack

- Status: accepted
- Date: 2026-11-01

## Context

Axentra Studio is the admin UI for the Axentra backend. It is a separate repository and a
separate deployable, and it talks to the public HTTP API only, so the API stays the single source
of truth and Studio needs no special access. Requirements that shaped the stack:

- Typed against the backend's OpenAPI contract, so contract changes break the build, not users.
- Static hosting (any CDN or nginx), runtime configuration without rebuilding.
- Accessible (WCAG 2.1 AA), responsive from 360 px, light and dark theme, German and English.
- Cookie sessions with CSRF, `problem+json` errors, cursor pagination.
- A small, mainstream dependency set that a single maintainer can keep current.

## Decision

| Concern      | Choice                                                                                           | Why                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Build        | Vite 8                                                                                           | Fast dev server with a `/v1` proxy that mirrors production; static output.                                                                                                                 |
| UI           | React 19 + TypeScript 5.9 (strict, `noUncheckedIndexedAccess`)                                   | Mainstream, strong typing. TypeScript 6/7 are not yet in the peer ranges of `typescript-eslint` and `openapi-typescript`.                                                                  |
| Routing      | React Router 8 (data router, lazy routes)                                                        | Nested layouts for the shell and the `/p/:productId` scope; route `handle` drives breadcrumbs; per-page code splitting.                                                                    |
| Server state | TanStack Query 5                                                                                 | Caching, invalidation, infinite queries for cursor "load more"; no global client store needed.                                                                                             |
| API client   | `openapi-fetch` + `openapi-typescript`                                                           | Types generated from the vendored `api/openapi.json`; a 5 kB runtime with middleware for CSRF and 401 handling. `npm run api:sync` records provenance in `api/SOURCE`.                     |
| i18n         | i18next + react-i18next, one namespace per feature                                               | Pluralization and interpolation; `scripts/i18n-check.mjs` enforces identical keys and placeholders in CI.                                                                                  |
| Styling      | CSS custom properties (design tokens) + CSS Modules                                              | Zero runtime, theme switch by flipping `data-theme` on `<html>`, scoped class names, works under a CSP without inline scripts. No utility framework: the design system is small and owned. |
| Primitives   | Radix UI (dialog, dropdown menu, tooltip, tabs, switch, checkbox, toast)                         | Correct focus management, keyboard handling and ARIA, unstyled so the look stays ours.                                                                                                     |
| Icons        | lucide-react                                                                                     | Consistent stroke icons, tree-shaken.                                                                                                                                                      |
| Fonts        | Inter, Manrope, JetBrains Mono via `@fontsource-variable`                                        | Self-hosted (no third-party requests, CSP `font-src 'self'`), variable weights.                                                                                                            |
| Unit tests   | Vitest + Testing Library + jsdom                                                                 | Same config as Vite; tests query by role and label, which doubles as an accessibility check.                                                                                               |
| E2E          | Playwright + `@axe-core/playwright`                                                              | Real browser against a real API; axe runs on every visited page.                                                                                                                           |
| Lint/format  | ESLint 9 flat config (typescript-eslint strict, react-hooks, jsx-a11y, react-refresh) + Prettier | ESLint 9 because `eslint-plugin-jsx-a11y` does not support ESLint 10 yet.                                                                                                                  |
| Serving      | nginx-unprivileged image                                                                         | Static files, optional `/v1` reverse proxy, strict security headers, non-root.                                                                                                             |

### Conventions that follow from it

- Components use semantic tokens (`--ax-color-text`, `--ax-space-4`), never raw colors.
- Only `src/api/models.ts` imports the generated schema; features import its aliases.
- Every endpoint goes through `src/api/endpoints.ts` and `unwrap()`, which turns problem details
  and network failures into `ApiError` with a stable `code` and `requestId`.
- Server data lives in TanStack Query; local UI state stays in components. Preferences (theme,
  locale, sidebar) are stored in `localStorage` under `axentra.studio.*`; the CSRF token never is.

## Consequences

- A backend contract change shows up as type errors after `npm run api:sync`.
- Charts are not included; the dashboard uses counters. Adding a chart library later is a
  separate decision.
- CSS Modules mean styles live next to components; the token file is the only global contract
  and is checked for WCAG AA contrast by `src/styles/tokens.test.ts`.
- Radix needs `style-src 'unsafe-inline'` in the CSP (inline positioning styles and the scroll
  lock's `<style>` element). Scripts stay `'self'` only.

## Alternatives considered

- **Next.js / Remix**: server rendering is not needed for an authenticated admin app and would
  add a Node runtime to every deployment.
- **Tailwind CSS**: fast to start, but a token-based design system with CSS Modules keeps markup
  readable and themes in one file.
- **MUI / Chakra / Mantine**: complete, but heavy and recognizable; Radix plus our own styling
  gives a distinct look with less weight.
- **Redux / Zustand**: not needed; almost all state is server state.
- **Orval / openapi-generator**: generate more code than needed; `openapi-fetch` keeps calls
  explicit and typed.
