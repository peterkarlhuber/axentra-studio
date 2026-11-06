# Axentra Studio design system

The look is derived from the Axentra logo: a hexagonal core with a cyan, blue and violet
gradient, set against deep navy ink. Studio turns that into a calm admin interface with a navy
sidebar, a light or dark content area, and the gradient used sparingly as an accent: a 3 px top
edge on cards that matter (login, health), the active navigation indicator, and hexagon motifs
behind empty states and dashboard counters.

Tokens live in [`src/styles/tokens.css`](../src/styles/tokens.css). Components use the semantic
tokens only, never the primitives or raw hex values.

## Brand primitives (from the logo)

| Token                 | Value                | Source in the logo            |
| --------------------- | -------------------- | ----------------------------- |
| `--ax-brand-cyan`     | `#06C4F5`            | Top node and gradient start   |
| `--ax-brand-blue`     | `#3488FA`            | Middle nodes                  |
| `--ax-brand-violet`   | `#7846F9`            | Bottom nodes and gradient end |
| `--ax-brand-ink`      | `#06034C`            | Wordmark navy                 |
| `--ax-brand-core`     | `#1E1B6B`            | Hexagon core                  |
| `--ax-brand-ring`     | `#88B0F8`            | Dashed orbit ring             |
| `--ax-gradient-brand` | cyan → blue → violet | Node gradient                 |

## Semantic colors

| Token                        | Light                 | Dark                  | Use                               |
| ---------------------------- | --------------------- | --------------------- | --------------------------------- |
| `--ax-color-bg`              | `#F4F6FB`             | `#0A0C22`             | Page background                   |
| `--ax-color-surface`         | `#FFFFFF`             | `#11143A`             | Cards, dialogs, inputs            |
| `--ax-color-surface-2`       | `#ECEFF7`             | `#181C47`             | Table headers, footers            |
| `--ax-color-border`          | `#DDE1EE`             | `#262B5A`             | Dividers, card borders            |
| `--ax-color-control-border`  | `#858CAA`             | `#6A71A8`             | Input and checkbox borders (3:1)  |
| `--ax-color-text`            | `#11143B`             | `#E9ECFB`             | Body text                         |
| `--ax-color-text-muted`      | `#4F5677`             | `#A6ACD0`             | Secondary text                    |
| `--ax-color-text-subtle`     | `#626A8C`             | `#8D94BD`             | Placeholders, captions            |
| `--ax-color-heading`         | `#06034C`             | `#F4F6FF`             | Headings (brand ink in light)     |
| `--ax-color-primary`         | `#2A59E0`             | `#7AA2FF`             | Primary buttons                   |
| `--ax-color-on-primary`      | `#FFFFFF`             | `#06034C`             | Text on primary                   |
| `--ax-color-link`            | `#2A59E0`             | `#8FB0FF`             | Links, active controls            |
| `--ax-color-focus`           | `#7340F0`             | `#A98BFF`             | Focus ring (violet from the logo) |
| `--ax-color-success` / `-bg` | `#0F7A4A` / `#E2F4EA` | `#5AD69C` / `#0F2F2A` | Active, OK                        |
| `--ax-color-warning` / `-bg` | `#8A5300` / `#FCF1D8` | `#F2C35C` / `#33280F` | Suspended, expiring               |
| `--ax-color-danger` / `-bg`  | `#C42537` / `#FCE7E9` | `#FF8590` / `#3A1424` | Errors, destructive actions       |
| `--ax-color-info` / `-bg`    | `#0A67A3` / `#E1F1FB` | `#62CBF5` / `#0F2A45` | Pending, informational            |

The sidebar is navy in both themes (`--ax-sidebar-bg: #0D0B3F`), which keeps the brand present
and makes the active item indicator (`#22D3EE`, logo cyan) readable everywhere.

## Contrast

`src/styles/tokens.test.ts` parses `tokens.css` and fails the build if any pair drops below its
WCAG 2.1 AA minimum (4.5:1 for text, 3:1 for UI components and focus indicators). Current values:

| Foreground                  | Background                  | Minimum | Light | Dark  |
| --------------------------- | --------------------------- | ------- | ----- | ----- |
| `--ax-color-text`           | `--ax-color-bg`             | 4.5:1   | 16.36 | 16.40 |
| `--ax-color-text`           | `--ax-color-surface`        | 4.5:1   | 17.69 | 15.07 |
| `--ax-color-text`           | `--ax-color-surface-2`      | 4.5:1   | 15.38 | 13.78 |
| `--ax-color-heading`        | `--ax-color-surface`        | 4.5:1   | 18.66 | 16.43 |
| `--ax-color-text-muted`     | `--ax-color-surface`        | 4.5:1   | 7.17  | 7.96  |
| `--ax-color-text-muted`     | `--ax-color-bg`             | 4.5:1   | 6.63  | 8.67  |
| `--ax-color-text-muted`     | `--ax-color-surface-2`      | 4.5:1   | 6.23  | 7.28  |
| `--ax-color-text-subtle`    | `--ax-color-surface`        | 4.5:1   | 5.30  | 5.99  |
| `--ax-color-link`           | `--ax-color-surface`        | 4.5:1   | 5.83  | 8.29  |
| `--ax-color-link`           | `--ax-color-bg`             | 4.5:1   | 5.39  | 9.02  |
| `--ax-color-link`           | `--ax-color-primary-subtle` | 4.5:1   | 4.97  | 6.29  |
| `--ax-color-on-primary`     | `--ax-color-primary`        | 4.5:1   | 5.83  | 7.50  |
| `--ax-color-on-primary`     | `--ax-color-primary-hover`  | 4.5:1   | 7.79  | 9.58  |
| `--ax-color-on-danger`      | `--ax-color-danger`         | 4.5:1   | 5.73  | 8.01  |
| `--ax-color-success`        | `--ax-color-success-bg`     | 4.5:1   | 4.70  | 7.90  |
| `--ax-color-warning`        | `--ax-color-warning-bg`     | 4.5:1   | 5.64  | 8.78  |
| `--ax-color-danger`         | `--ax-color-danger-bg`      | 4.5:1   | 4.84  | 6.90  |
| `--ax-color-info`           | `--ax-color-info-bg`        | 4.5:1   | 5.22  | 7.92  |
| `--ax-color-neutral`        | `--ax-color-neutral-bg`     | 4.5:1   | 6.23  | 6.67  |
| `--ax-color-danger`         | `--ax-color-surface`        | 4.5:1   | 5.73  | 7.60  |
| `--ax-color-focus`          | `--ax-color-bg`             | 3:1     | 5.22  | 7.19  |
| `--ax-color-focus`          | `--ax-color-surface`        | 3:1     | 5.64  | 6.60  |
| `--ax-color-control-border` | `--ax-color-surface`        | 3:1     | 3.32  | 3.83  |
| `--ax-sidebar-text`         | `--ax-sidebar-bg`           | 4.5:1   | 11.73 | 11.73 |
| `--ax-sidebar-text-muted`   | `--ax-sidebar-bg`           | 4.5:1   | 7.37  | 7.37  |
| `--ax-sidebar-text-active`  | `--ax-sidebar-bg`           | 4.5:1   | 18.47 | 18.47 |
| `--ax-sidebar-indicator`    | `--ax-sidebar-bg`           | 3:1     | 10.22 | 10.22 |

Color never carries meaning alone: status pills have a text label, errors have an icon and
text, sort direction has an icon and `aria-sort`.

## Typography

| Role                       | Font                                            | Token               |
| -------------------------- | ----------------------------------------------- | ------------------- |
| UI and body                | Inter (variable)                                | `--ax-font-sans`    |
| Headings, numbers on cards | Manrope (variable), geometric like the wordmark | `--ax-font-display` |
| IDs, keys, JSON, code      | JetBrains Mono (variable)                       | `--ax-font-mono`    |

All three are self-hosted through `@fontsource-variable/*` and never inlined, so the CSP keeps
`font-src 'self'`. The scale is `--ax-text-xs` (12 px) to `--ax-text-3xl` (30 px); body text is
14 px (`--ax-text-md`) with a 1.5 line height. Sizes are in `rem`, so browser zoom and font
settings work.

## Space, radii, shadows

- Spacing on a 4 px grid: `--ax-space-1` (4 px) to `--ax-space-16` (64 px).
- Radii: `xs` 4, `sm` 6, `md` 8 (controls), `lg` 12 (cards), `xl` 16 (dialogs), `full`.
- Shadows: `sm` (cards), `md` (menus, popovers), `lg` (dialogs, toasts). Dark theme shadows are
  deeper and rely more on borders.

## Motion

Durations `fast` 120 ms, `normal` 200 ms, `slow` 320 ms with `--ax-ease-standard`. Motion only
supports orientation (menus, dialogs, drawer, toasts, skeleton shimmer). With
`prefers-reduced-motion: reduce` all duration tokens become `0ms` and `global.css` stops
animations and smooth scrolling.

## Themes

`data-theme="light|dark"` on `<html>` selects the token set. `public/theme-init.js` applies the
stored choice (or the system preference) before first paint; the user menu offers Light, Dark and
System. The choice is stored per browser and, when the server supports it, in the user's
preferences.

## Components

All in `src/components/ui/`, exported from `index.ts`.

| Component                     | Notes                                                                                                                                                                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`, `ButtonLink`        | Variants `primary`, `secondary`, `ghost`, `subtle`, `danger`, `dangerOutline` (a destructive action beside others; the confirmation keeps the filled `danger`); sizes `sm`, `md`, `lg`; `loading` disables and sets `aria-busy`. `ButtonLink` is for navigation. |
| `IconButton`                  | Requires a `label`; shows it as tooltip and accessible name.                                                                                                                                                                                                     |
| `Input`, `Select`, `Textarea` | Pick up `id`, `aria-describedby`, `aria-invalid`, `required` from `FormField`.                                                                                                                                                                                   |
| `FormField`                   | Label, control, help and error with correct wiring; required marker is announced as text. A control the browser refuses on submit (`required`, `type`, `min`/`max`) shows a translated inline error instead of the browser's bubble.                             |
| `Checkbox`, `Switch`          | Radix; labelled, keyboard operable.                                                                                                                                                                                                                              |
| `Card`                        | Optional title, actions, `accent` (gradient top edge), `flush` for tables.                                                                                                                                                                                       |
| `Badge`, `StatusPill`         | Tones `neutral`, `info`, `success`, `warning`, `danger`, `brand`; `StatusPill` translates known statuses and adds a dot.                                                                                                                                         |
| `DataTable`                   | Caption, row headers, server sort with `aria-sort`, skeleton rows while loading, empty and error states, cursor "Load more" with a live count, horizontal scroll region on small screens, optional mobile-hidden columns.                                        |
| `Dialog`                      | Radix dialog, also as a side `drawer`; focus trap, Escape, focus returns to the trigger.                                                                                                                                                                         |
| `ConfirmDialog`               | For destructive actions; optional type-to-confirm (for example the tenant slug); stays open and keeps input if the action fails.                                                                                                                                 |
| `Toast` (`useToast`)          | Success, info and error; errors are announced assertively and can carry the request id.                                                                                                                                                                          |
| `Tabs`                        | Radix tabs with arrow-key navigation.                                                                                                                                                                                                                            |
| `DropdownMenu`                | Radix menu with items, radio groups, submenus.                                                                                                                                                                                                                   |
| `Tooltip`                     | Supplementary only; never the only source of information.                                                                                                                                                                                                        |
| `Skeleton`, `Spinner`         | Loading placeholders; respect reduced motion.                                                                                                                                                                                                                    |
| `EmptyState`, `ErrorState`    | Hexagon icon, heading, text, actions; `ErrorState` shows the translated message, field issues and request id with a retry button.                                                                                                                                |
| `PageHeader`                  | `h1` that receives focus after navigation, description, actions.                                                                                                                                                                                                 |
| `DetailList`                  | Label/value pairs (`dl`), monospace option for ids.                                                                                                                                                                                                              |
| `CopyField`                   | Read-only value with copy button and optional reveal for one-time secrets; announces success or failure.                                                                                                                                                         |
| `JsonView`                    | Formatted JSON in a labelled, scrollable region.                                                                                                                                                                                                                 |
| `Alert`, `Time`, `HexIcon`    | Inline messages; relative time with the exact time as title; the hexagon motif.                                                                                                                                                                                  |

## Writing

- Sentence case for headings and buttons ("New tenant", "Rotate secret").
- Buttons say what happens; destructive confirmations repeat the object ("Delete tenant").
- All six languages use informal address (German "du", not "Sie"). German uses typographic quotes („…“); English uses curly quotes (“…”).
