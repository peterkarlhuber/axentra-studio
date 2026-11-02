---
title: Modules reference
summary: The Axentra server modules, which Studio areas each one powers, and what you see when a module is switched off.
keywords: module, modules, enabled, disabled, off, feature, server configuration, identity, tenancy, access, data, audit, storage, events, usage, billing, notify, search, realtime
related: troubleshooting, server-configuration, overview, concepts, limitations
---

The Axentra server is built from _modules_: building blocks such as file storage, background
jobs or billing. An operator decides in the server configuration which modules run. Studio reads
the list of enabled modules when it starts and adapts: areas of switched-off modules stay in the
sidebar with the label **Off**, so you can see what exists and what an operator would have to
enable.

## Which modules are enabled? {#check-modules}

- The [Dashboard](app:dashboard) lists all modules under **Modules** in the server card; enabled
  modules are highlighted, switched-off ones are gray.
- The [Settings](app:settings) page (with `platform:settings` or `product:manage`) shows the
  server's effective configuration, including the module list.
- In the sidebar, an area of a switched-off module carries the label **Off**; screen readers
  announce "module not enabled".

By default every module is enabled. Changing the list is a server configuration change
(`modules`, see [server configuration](help:server-configuration)); it takes effect when the
server restarts. Studio reads the list once per page load, so reload Studio afterwards.

## Module overview {#overview}

| Module id  | Can be switched off | Studio areas it powers                                                                                              |
| ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `identity` | No                  | Sign-in, sign-out, [Profile](help:profile), [Users](help:users), sessions                                           |
| `tenancy`  | No                  | [Products](help:products), [Tenants](help:tenants), [members and invitations](help:members-invitations)             |
| `access`   | No                  | [Roles](help:roles-permissions), [Permissions](help:permissions-reference), [API keys](help:api-keys)               |
| `audit`    | No                  | [Audit log](help:audit)                                                                                             |
| `data`     | Yes                 | [Data overview](help:data-overview), [Records](help:records)                                                        |
| `storage`  | Yes                 | [Files](help:files), tenant storage quotas, the product's storage policy                                            |
| `events`   | Yes                 | [Jobs](help:jobs), [Schedules](help:schedules), [Events](help:events) with the live view, [Webhooks](help:webhooks) |
| `usage`    | Yes                 | [Usage](help:usage): meters, tenant usage, quotas, reservations                                                     |
| `billing`  | Yes                 | [Plans and subscriptions](help:plans-subscriptions), tenant billing                                                 |
| `notify`   | Yes                 | [Notifications](help:notifications): templates, message log, mailbox, preferences                                   |
| `search`   | Yes                 | No Studio screens yet; tenant full-text search is available through the API                                         |
| `realtime` | Yes                 | Accepted in the configuration, but has no effect in this version                                                    |

[System health](help:health-monitoring), Monitoring and [Settings](help:settings) do not belong
to a module and are always available.

## What happens when a module is off {#when-disabled}

When a module is switched off, the server does not offer its part of the API at all. In Studio:

- The area's page shows **Module not enabled on this server** and names the module id to enable,
  for example `storage`. Nothing is deleted: data stored while the module was on is still in the
  database and reappears when the module is switched on again.
- Shortcuts and widgets that depend on the module disappear, for example the usage and billing
  widgets on the dashboard or the **Browse records** button on a tenant page.
- An action that still reaches a switched-off module answers
  [Module not enabled](help:troubleshooting#module-disabled) or **Not found**.

Notes per module:

### data {#data}

**Data overview** and **Records** show the "not enabled" state. Products that store their own
data in their own tables are not affected.

### storage {#storage}

**Files** shows the "not enabled" state; storage quotas and the storage policy cannot be read or
changed.

### events {#events}

**Jobs**, **Schedules**, **Events** and **Webhooks** show the "not enabled" state, and there is
no live event view. Inside the server, other modules still use the job queue; only the screens and
the API for it are gone.

### usage and billing {#usage-billing}

Without `usage`, **Usage** is off and the dashboard shows no usage widgets. Without `billing`,
**Plans** and **Subscriptions** are off. Plan limits feed into usage quotas only when **both**
modules are enabled.

### notify {#notify}

**Notifications** shows the "not enabled" state. Invitations still work, but the server does not
send invitation emails: share the invitation link or token that Studio shows once after creating
the invitation (see [Members and invitations](help:members-invitations)).

### search and realtime {#search-realtime}

Studio has no screens for these modules. Switching them on or off changes nothing in Studio.

## Not yet available in Studio {#not-in-studio}

If a module is enabled on the server but this Studio release has no screens for it, the area
shows **Not yet available in Studio**. Use the API directly or a newer Studio release.

## Troubleshooting {#troubleshooting}

| Situation                                                                          | What to do                                                                                                         |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| An area shows **Off**                                                              | Ask an operator to add the module id to the server's `modules` setting and restart the server, then reload Studio. |
| An operator enabled a module, but Studio still shows **Off**                       | Reload the page; Studio reads the module list only when it loads.                                                  |
| The configuration refuses to switch off `identity`, `tenancy`, `access` or `audit` | These modules are required and cannot be disabled.                                                                 |
| Invitations are created but no email arrives                                       | Is `notify` enabled and an email provider configured? Otherwise share the link manually.                           |
