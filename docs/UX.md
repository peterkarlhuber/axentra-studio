# Axentra Studio UX guidelines

How Studio is organized and how its screens behave. Visual rules are in
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## Principles

1. **Show the truth.** Every number and list comes from the API. No demo data, no placeholders
   that look like data, no buttons without an effect. A disabled module says so.
2. **The server decides, the UI explains.** Studio hides or disables actions the user lacks
   permission for (from `GET /v1/me`), but the API stays authoritative; a `403` is explained, not
   swallowed.
3. **Irreversible means deliberate.** Destructive actions use a confirmation that names the
   object; deleting a tenant requires typing its slug. One-time secrets are shown once with a
   clear warning and a copy button.
4. **Errors are actionable.** Translated message by error code, field errors at the field, the
   request id for support, and a retry where it makes sense.

## Structure

### Routes

| Route                                                                            | Screen                                                                       |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/setup`                                                                         | First-run setup (only while the server reports `setup_required`)             |
| `/login`                                                                         | Password and/or OIDC sign-in; `?return_to=` restores the previous page       |
| `/`                                                                              | Redirects to the last used product's dashboard, or `/products`               |
| `/products`, `/products/:id`                                                     | Product list (create, archive, restore) and detail (settings, members)       |
| `/p/:productId/dashboard`                                                        | Product overview: counters, health, server facts, module status              |
| `/p/:productId/tenants[/:tenantId]`                                              | Tenants; detail with details, members and invitations tabs                   |
| `/p/:productId/users[/:userId]`                                                  | Users of the product; detail with status, platform role, sessions            |
| `/p/:productId/invitations`                                                      | Open invitations across tenants                                              |
| `/p/:productId/roles`                                                            | Built-in roles (read-only) and custom roles                                  |
| `/p/:productId/permissions`                                                      | Permission catalog: built-in and product-defined permissions (read-only)     |
| `/p/:productId/api-keys`                                                         | API keys: create, rotate with grace period, revoke                           |
| `/p/:productId/data`                                                             | Data overview: collections, storage per tenant, storage settings, retention  |
| `/p/:productId/jobs[/:jobId]`, `/schedules`, `/events`, `/webhooks[/:webhookId]` | Events & Jobs: jobs, schedules, event log and live stream, webhook endpoints |
| `/p/:productId/records`                                                          | Records per tenant and collection; create, edit, delete with records:write   |
| `/p/:productId/files`                                                            | Files per tenant: upload, detail, download link, delete; usage and quota     |
| `/p/:productId/search`                                                           | Full-text search per tenant: query, kind filter, document, remove from index |
| `/p/:productId/{usage,plans,subscriptions[/:tenantId]}`                          | Usage & Billing: meters, usage, quotas; plans, subscriptions, entitlements   |
| `/p/:productId/notifications`                                                    | Notifications: templates, message log, mailbox, preferences                  |
| `/audit`                                                                         | Audit log with filters and event detail                                      |
| `/health`                                                                        | Readiness and liveness checks                                                |
| `/monitoring`                                                                    | Health checks, metrics, retention and tracing                                |
| `/settings`                                                                      | Effective server settings (read-only)                                        |
| `/profile`                                                                       | Name, language, theme, password, email verification, own sessions            |
| `/invitations/accept`, `/accept-invitation`                                      | Accept an invitation token (the second path is the default link alias)       |
| `/forgot-password`, `/reset-password`, `/verify-email`                           | Public: request a reset link; the pages of the reset and verification links  |
| `/help[/:article]`                                                               | Help center; works signed out and without a reachable API                    |

### Navigation

The sidebar groups, in this order:

1. Dashboard, Products
2. **Identity & Tenants**: Tenants, Users, Invitations
3. **Access & API Keys**: Roles, API keys
4. **Data & Storage**: Data overview, Records, Files
5. **Events & Jobs**: Jobs, Schedules, Events, Webhooks
6. **Usage & Billing**: Usage, Plans, Subscriptions
7. Notifications
8. **Audit & Monitoring**: Audit log, System health
9. Settings

Items for modules the server does not report stay visible but lead to the "module not enabled"
state, so operators can see what exists and what to enable. The sidebar filters by permission
only where a screen is useless without it: **Audit log** is listed only for users with
`platform:audit` or `audit:read` in one of their products (from `GET /v1/me`). **Settings**
(personal preferences for everyone, server configuration with `platform:settings` or
`product:manage`), **System health** and **Monitoring** (public readiness and liveness checks)
stay visible and explain the parts the user cannot read. Product screens stay visible too and show
a no-access state. A direct visit to a hidden screen still shows the explanatory **Not permitted**
state; the server stays authoritative.
**Help** sits in the last group and is always available.

### Shell

- **Sidebar**: navy, collapsible to icons on desktop (remembered per browser). Below 960 px it
  becomes a drawer opened from the top bar; it closes on navigation and on Escape.
- **Top bar**: menu button (mobile), breadcrumbs, product switcher, help center button, user menu.
- **Product switcher**: only shown in multi-product mode or when the user can see more than one
  product. Switching keeps the current section (`/p/A/tenants/x` → `/p/B/tenants`).
- **User menu**: profile, language (the six supported languages, each named in its own
  language), theme (Light/Dark/System), sign out.
- **Skip link** to the main content as the first focusable element.
- **Breadcrumbs** from route metadata, with resolved names for products, tenants and users.

### Product scope

Product-scoped routes live under `/p/:productId`. The scope guard loads the product, remembers it
as the last used product and shows a clear "not found or no access" state for unknown ids.
Single-product servers go straight to their product.

## Screen patterns

### Lists

- Page header with title, one-line description and the primary action ("New tenant").
- Filters above the table; search is debounced. Audit filters are part of the URL, so a filtered
  audit view can be shared and is linked from the dashboard counters. On phones, secondary audit
  filters fold behind "More filters".
- Cursor pagination with "Load more" and a live "Showing N" count; no page numbers (the API has
  none).
- Server-side sort only where the API supports it (records); headers show the direction.
- Loading: skeleton rows. Empty: hexagon empty state with a next step. Error: translated error,
  request id, retry.

### Detail pages

Header with name, status and id, actions on the right (secondary actions first, destructive last
and red). Content in tabs when there is more than one concern (details, members, invitations).
Edit forms only enable "Save" when something changed.

### Forms and dialogs

- Create flows open in a dialog; the URL gets `?new=1` so the dialog survives reload and back
  closes it.
- Slugs are derived from the name until the user edits the slug.
- Validation errors from the server appear under the matching field; anything else above the
  form.
- Submit buttons show a spinner and prevent double submission. Dialogs close only on success.
- Focus moves into the dialog on open and back to the trigger on close.
- Edit forms on a page (profile name, product settings, notification preferences, template
  editor) render `UnsavedChangesGuard` with their dirty state: a reload or closing the tab shows
  the browser's prompt, and leaving the page inside Studio asks **Leave without saving?**. Query
  string changes on the same page (tabs, `?new=1`) are not blocked. Turn the guard off while a
  save runs. **Save changes** stays disabled while nothing changed where the form can tell.
- Dialogs with input pass `dirty` to `Dialog`: Escape, an outside click or the close button then
  asks **Discard your changes?** (**Keep editing** / **Discard changes**); **Cancel** discards
  without asking. A dialog whose state outlives it (create dialogs opened from the address,
  member and invitation dialogs) clears its input when it closes, so reopening starts empty.

### Secrets and tokens

New API key secrets and invitation tokens appear once in a dialog with a warning, a masked field,
reveal and copy buttons. The dialog can only be closed after confirming "I have stored the
secret". Rotation offers a grace period during which the old secret still works.

### Module states

| State                       | When                                                               | Shows                                                       |
| --------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Module not enabled          | The server does not list the backend module in `GET /v1/meta`      | Which module id to enable in the server configuration       |
| Not yet available in Studio | The module is enabled but Studio has no screens for it (Phase 2/3) | That the API can be used directly or a newer Studio release |

## Sessions and errors

- Startup order: load `/config.json`, call `GET /v1/meta`, check API compatibility, then
  `/setup` if required, then the session, then the app or `/login`.
- An incompatible API version blocks the app with both versions shown.
- An unreachable API shows a retry screen with the error and request id.
- Any `401` from a protected call returns to `/login?return_to=…`; a short note explains that the
  session ended.
- `403`: inline "not permitted" state; `404`: "not found" with a way back; `409` and `412`:
  explained in place ("already exists", "changed by someone else, reload"); `429`: wait and retry.

## Accessibility

- Semantic landmarks (`header`, `nav`, `main`), one `h1` per page; focus moves to it after
  navigation so screen readers announce the new page.
- Everything works with the keyboard; focus is always visible (violet ring, 3:1 or better).
- Tables have captions, column headers, row headers and `aria-sort`; scrollable regions are
  labelled and focusable.
- Form controls have visible labels; required fields are announced; errors are linked with
  `aria-describedby`.
- Status changes (copied, loading more, toasts) are announced through live regions.
- Controls are at least 36 px high (44 px for large buttons); text can be zoomed to 200 %
  without loss.
- Reduced motion is respected.
- Verified with axe-core in the Playwright smoke tests (WCAG 2.1 A/AA) on all main pages, both
  themes, desktop and 360 px.

## Responsive behavior

| Width       | Layout                                                                                  |
| ----------- | --------------------------------------------------------------------------------------- |
| ≥ 1200 px   | Full sidebar, multi-column dashboards and detail grids                                  |
| 960–1199 px | Full or collapsed sidebar, two columns where useful                                     |
| < 960 px    | Sidebar becomes a drawer; content single column                                         |
| < 640 px    | Secondary table columns hidden, audit filters folded, page actions wrap below the title |

Nothing scrolls horizontally except tables with many columns, which scroll inside their own
labelled region.

## Language

Six languages, complete in all of them: English (reference), German, Spanish, French, Brazilian
Portuguese and Italian, both for the interface and for the help center. Every language addresses
the user informally (du, tú, tu, você, tu). The language follows the browser until the user picks
one (user menu, login page, help center header, profile); signed-in choices are saved to the
user's profile. Dates, times and numbers use `Intl` with the active language. Terms are fixed in
[i18n/TERMINOLOGY.md](i18n/TERMINOLOGY.md); `npm run i18n:check` and `npm run help:check` guard
missing keys, placeholders, plural forms, formal address, untranslated text and article
structure.

## Help

- **Help center** at `/help`: chapters, search with deep links to sections, table of contents,
  related topics, previous/next, diagrams and code examples. It is public and works without a
  reachable API, so troubleshooting stays available when the server is down.
- **Page help**: the `?` button in a page header opens the page's article in a side panel; the
  page and any form stay as they are. Links inside the panel open in the panel, with Back.
- **Info tips**: `i` buttons next to field labels explain a field in one to three sentences and
  can link to the matching section. They open on click, Enter or Space and close with Escape
  (toggletip, not hover-only).
- **Error states** link to the troubleshooting entry for their error code.

Authoring rules are in [HELP_AUTHORING.md](HELP_AUTHORING.md).
