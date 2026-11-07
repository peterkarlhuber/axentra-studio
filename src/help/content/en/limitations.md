---
title: Known limitations
summary: What Studio and the Axentra server do not do yet, or do with a known restriction, and how to work around it.
keywords: limitations, known issues, not supported, missing feature, restrictions, workaround, roadmap, not possible
related: faq, troubleshooting, modules-reference, permissions-reference, security
---

This page lists the restrictions you may notice when you work with this version of Studio and the
Axentra server, each with a workaround where one exists. Some come from Studio, others from the
server; the server's API sometimes offers more than Studio does.

## Users and sign-in {#users-sign-in}

- **Studio creates only single sign-on accounts.** Accounts come from the first-run setup, from
  accepting an invitation, from the first single sign-on login, or from a platform administrator who
  adds a [single sign-on user](help:users#external-user). There is no form for password accounts:
  invite people to a tenant instead.
- **No two-factor authentication** in Axentra itself. If you use single sign-on, your identity
  provider can enforce two-factor authentication. Password reset and email verification need the
  `notify` module, which sends their links.
- **Single sign-on providers are set up only in the server configuration.** Studio cannot list,
  add or disable identity providers.
- **Accounts without an email address** (possible with some single sign-on setups) cannot accept
  invitations, because invitations are bound to an address. Add them to tenants directly.
- **No export or erasure of a person's data.** Data protection requests have to be handled by the
  operator across users, records, backups and logs.
- **Sign-in throttling is per minute.** Anyone who knows an email address can block password
  sign-ins for that account for up to a minute by sending wrong passwords; sessions already open
  and single sign-on are not affected.

## Roles, permissions and API keys {#access}

- **Studio can show which roles you may assign only if you can read roles** (`roles:read`).
  Without it, the role field is plain text and the server explains a refusal. A role change made
  while a page is open is noticed only after Studio next reloads your permissions, or after you
  reload the page.
- **A product's own permissions cannot be declared in Studio.** The **Permissions** page is
  read-only; products declare them in code or through the API.
- **Saving a custom role drops retired product permissions** that are still listed in it. They
  had no effect while retired, but would have come back if the product declared them again.
- **API keys created by a person are not revoked when that person leaves.** Review and revoke
  them yourself.
- **The revoke confirmation does not list derived keys.** Revoking a key also revokes every key
  that was created with it, but Studio does not show which keys those are.

## Data and files {#data-files}

- **No total counts.** Lists show "Showing N entries" and load more on request; the API has no
  page numbers or totals, by design.
- **Records:** filters only on top-level JSON values, sorting only by id, created or updated time.
  Saving a record replaces its whole JSON object. A record holds at most 256 KiB.
- **Full-text search** ([Search](help:search)) covers one tenant at a time and matches whole words
  only (no prefix or fuzzy matching). Studio does not add documents to the index; your product does.
- **Backups and file storage:** Studio does not show backup status, and the server's backup
  procedure covers the database; file storage has to be backed up separately.

## Jobs, events and webhooks {#events}

- **Enqueue job is offered only with `jobs:manage`.** Some job kinds may also be enqueued by
  tenant users, but the API does not say which, so Studio does not offer them.
- **The live event view polls.** New events appear after a short delay, not instantly; there are
  no WebSockets.
- **The next run of a schedule is calculated by the server when you save**; Studio checks the cron
  syntax while you type but does not preview the next run of an unsaved expression. Schedules run
  in UTC.

## Usage and billing {#usage-billing}

- **Reservations can only be looked up by id.** The API has no list of reservations.
- **No card or bank details in Studio**, by design. Paid plans go through the payment provider's
  hosted checkout.
- **Payment providers have not been tested against live services** in this version; they are
  tested against simulated providers only.

## Notifications {#notifications}

- **Email and the in-app inbox only.** There are no SMS or push channels, and Studio's template
  editor creates email templates only (inbox templates are created over the API).
- **Sending is limited per tenant**: by default 1000 notifications in any rolling hour
  (`notify.tenant_send_limit_per_hour`); more are refused with **Too many requests**.

## Studio and the server {#studio-server}

- **The server version is checked only when Studio loads.** After a server update, reload the page.
  The list of enabled modules is also read only at load time.
- **Separate addresses for Studio and the API** work only if both belong to the same site (for
  example `studio.example.com` and `api.example.com`). The recommended and tested setup serves
  both from the same address.
- **Single-product servers with leftover products:** if a server in single-product mode still
  contains other products, Studio hides the product switcher. Platform administrators reach the
  other products only through the **Products** page, and cannot archive them there.
- **Server settings cannot be changed in Studio.** The **Settings** page only shows the effective
  configuration; changes are made on the server.
- **The general request rate limit is off by default** and counted per server process.

## Browsers, languages and accessibility {#browsers-languages}

- **Only Chromium-based browsers are tested automatically.** Firefox and Safari should work but
  are not covered by the automated tests.
- **Server texts are English**: role and permission descriptions and the **Server message** in
  error details are not translated.
- **Accessibility checks cover the first view of each page**; open dialogs, menus and form errors
  are checked only in some areas. See [Keyboard and accessibility](help:keyboard-accessibility#known-gaps).

## Operations {#operations}

- **No production deployment and no load tests** have been carried out for this version; there
  are no capacity figures yet.
- **Database migrations are forward only.** Going back to an earlier version means restoring a
  backup.

## Related pages {#related}

- [Troubleshooting](help:troubleshooting) for error messages and fixes.
- [FAQ](help:faq) for common questions.
- [Modules reference](help:modules-reference) for what a switched-off module means.
