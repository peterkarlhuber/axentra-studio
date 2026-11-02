---
title: Permissions reference
summary: Every built-in Axentra permission, which built-in roles hold it, and what it lets you do in Studio.
keywords: permission, permissions list, catalog, role matrix, scope, platform, product, tenant, read, manage, access rights, built-in roles, owner, admin, viewer, support, member
related: roles-permissions, security, api-keys, members-invitations, users, troubleshooting
---

A _permission_ is a single right written as `resource:action`, for example `files:write`. Access
is denied unless a role or an API key grants the permission explicitly. This page lists every
built-in permission, shows which built-in role holds it, and says what it unlocks in Studio. For
how roles are created and assigned, see [Roles and permissions](help:roles-permissions).

## How permissions work {#how-permissions-work}

Every permission has a **scope**:

- **Platform**: installation-wide. Granted only by the platform roles **Platform administrator**
  and **Platform viewer**, never by product or tenant roles and never by API keys.
- **Product**: about one product as a whole (its tenants, roles, keys, jobs, plans …).
- **Tenant**: about the data inside one tenant (records, files, members …).

Who holds what:

- A **tenant role** grants tenant permissions **in that tenant only**.
- A **product role** grants product permissions and tenant permissions **in every tenant of the
  product**.
- A **platform role** grants its permissions in every product.
- Someone who is only a tenant member still gets `product:read` for the product, so they can
  open it and pick their tenant, and nothing else at product level.
- An **API key** holds exactly the permissions listed on it, in its product (and, if bound, only
  in its tenant).

Studio hides buttons, tabs and dialogs that your permissions do not allow. Areas in the sidebar
stay visible; if you lack the read permission, the page shows **Not permitted** with the missing
permission (see [troubleshooting](help:troubleshooting#forbidden)).

> [!TIP]
> In Studio, open [Permissions](app:permissions) to see the complete catalog of your product,
> including the permissions the product declared itself, with the server's descriptions.

## Platform permissions {#platform-permissions}

| Permission          | Server description                      | What it enables in Studio                                                                                                                                                                            |
| ------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `products:create`   | Create products (multi-product mode)    | **New product** on the Products page (multi-product mode only)                                                                                                                                       |
| `products:archive`  | Archive and restore products            | Archive and restore on the product page (multi-product mode only)                                                                                                                                    |
| `users:read`        | List all users of the installation      | Open the detail page of any user, also outside your products; list all users through the API                                                                                                         |
| `users:manage`      | Disable users and revoke their sessions | **Disable user** / **Enable user** and **Sign out everywhere** on a user's page, and its **Active sessions** list. Changing a **Platform role** additionally requires being a platform administrator |
| `platform:settings` | Read installation settings              | The [Settings](app:settings) page; the billing provider status and storage settings shown on product pages                                                                                           |
| `platform:audit`    | Read installation-wide audit events     | The [Audit log](app:audit) across all products, including platform events such as sign-ins                                                                                                           |

## Product permissions {#product-permissions}

| Permission               | Server description                                                       | What it enables in Studio                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product:read`           | View the product and its overview                                        | Open the product and its dashboard                                                                                                                                           |
| `product:manage`         | Edit product details and settings                                        | Edit name, description and settings on the product page (including the storage policy); also lets you read the [Settings](app:settings) page and the billing provider status |
| `product_members:read`   | View product operators                                                   | The **Members** tab of the product page                                                                                                                                      |
| `product_members:manage` | Add, change and remove product operators                                 | Add, change and remove product members (within the [role ceiling](help:security#role-ceiling))                                                                               |
| `permissions:manage`     | Declare and retire the product's own permissions over the API            | Nothing to click in Studio (the Permissions page is read-only); lets you read the permission catalog. Declaring is available through the API                                 |
| `product_users:read`     | View users who belong to the product's tenants                           | The [Users](app:users) page of the product and user detail pages                                                                                                             |
| `tenants:read`           | List tenants                                                             | The [Tenants](app:tenants) list and tenant pages; tenant pickers in other areas                                                                                              |
| `tenants:create`         | Create tenants                                                           | **New tenant** (Tenants page and dashboard)                                                                                                                                  |
| `tenants:update`         | Edit and suspend tenants                                                 | Edit, suspend and reactivate a tenant; set a tenant's storage quota                                                                                                          |
| `tenants:delete`         | Delete tenants and all their data                                        | Delete a tenant (irreversible)                                                                                                                                               |
| `roles:read`             | View roles                                                               | The [Roles](app:roles) page and the permission catalog; lets Studio show which roles you can assign                                                                          |
| `roles:manage`           | Create, edit and delete custom roles                                     | **New custom role**, edit and delete custom roles                                                                                                                            |
| `api_keys:read`          | View API keys (never their secrets)                                      | The [API keys](app:apiKeys) list and the permission catalog                                                                                                                  |
| `api_keys:manage`        | Create, rotate and revoke API keys                                       | **New API key**, **Rotate secret**, **Revoke key**                                                                                                                           |
| `audit:read`             | Read the product's audit events                                          | The [Audit log](app:audit) for this product                                                                                                                                  |
| `collections:read`       | View record collection statistics                                        | Collection statistics on the [Data overview](app:dataOverview)                                                                                                               |
| `jobs:read`              | View background jobs and events                                          | [Jobs](app:jobs), [Schedules](app:schedules), [Events](app:events) including the live view                                                                                   |
| `jobs:manage`            | Enqueue, retry and cancel jobs                                           | **Enqueue job**, retry and cancel jobs; create, edit and delete schedules                                                                                                    |
| `webhooks:read`          | View webhooks and deliveries                                             | [Webhooks](app:webhooks) and their deliveries                                                                                                                                |
| `webhooks:manage`        | Create, edit and delete webhooks                                         | Create, edit, delete webhooks; rotate the signing secret, send a test, redeliver                                                                                             |
| `usage:manage`           | Define meters and quotas                                                 | Create and edit meters; set usage quotas of tenants                                                                                                                          |
| `billing:manage`         | Manage plans, prices and subscriptions                                   | Create and edit plans; create and change tenant subscriptions                                                                                                                |
| `notify:manage`          | Manage notification templates and send tests                             | [Notifications](app:notifications): templates, message log, statistics, the local mailbox                                                                                    |
| `notify:send_external`   | Send notifications to email addresses that are not members of the tenant | Send a test to any email address, not only to tenant members                                                                                                                 |

## Tenant permissions {#tenant-permissions}

When a product role holds a tenant permission, it applies in every tenant of the product.

| Permission           | Server description                                             | What it enables in Studio                                                                                                     |
| -------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `tenant:read`        | View the tenant                                                | Open the tenant you belong to                                                                                                 |
| `members:read`       | View tenant members and invitations                            | The **Members** and **Invitations** tabs of a tenant; the [Invitations](app:invitations) page                                 |
| `members:manage`     | Invite, change and remove tenant members                       | Add members, invite, change roles, remove members, revoke invitations (within the [role ceiling](help:security#role-ceiling)) |
| `records:read`       | Read records                                                   | [Records](app:records) of the tenant                                                                                          |
| `records:write`      | Create, change and delete records                              | Create, edit and delete records                                                                                               |
| `files:read`         | List and download files                                        | [Files](app:files) of the tenant, download                                                                                    |
| `files:write`        | Upload and delete files                                        | Upload, edit and delete files                                                                                                 |
| `events:publish`     | Publish events and enqueue jobs for the tenant                 | **Publish event** on the Events page                                                                                          |
| `usage:read`         | View usage and quotas                                          | [Usage](app:usage) of the tenant, quotas, usage widgets on the dashboard                                                      |
| `usage:record`       | Record usage                                                   | Record usage and commit or release reservations for a tenant                                                                  |
| `billing:read`       | View subscription and entitlements                             | [Plans](app:plans), [Subscriptions](app:subscriptions) and a tenant's billing                                                 |
| `notify:send`        | Send notifications                                             | Send test notifications to tenant members; see the tenant's messages                                                          |
| `notify:preferences` | Manage notification preferences                                | Your own notification preferences for a tenant                                                                                |
| `search:query`       | Search the tenant's search index                               | Nothing in Studio yet; available through the API                                                                              |
| `search:index`       | Add, replace and remove documents in the tenant's search index | Nothing in Studio yet; available through the API                                                                              |

## Built-in roles {#built-in-roles}

| Role (key)                                    | Level    | Purpose                                                                                      |
| --------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| **Platform administrator** (`platform_admin`) | Platform | Every permission everywhere; exempt from the role ceiling                                    |
| **Platform viewer** (`platform_viewer`)       | Platform | Every read permission, plus `platform:settings`, `platform:audit` and `search:query`         |
| **Product owner** (`product_owner`)           | Product  | Full control of the product, including operators and owner rank                              |
| **Product admin** (`product_admin`)           | Product  | Everything except managing product operators and declaring product permissions               |
| **Support** (`product_support`)               | Product  | Reads everything and manages tenant members up to its own permissions (in practice: viewers) |
| **Product viewer** (`product_viewer`)         | Product  | Read-only access to the product                                                              |
| **Owner** (`tenant_owner`)                    | Tenant   | All tenant permissions, plus owner rank                                                      |
| **Admin** (`tenant_admin`)                    | Tenant   | All tenant permissions, without owner rank                                                   |
| **Member** (`member`)                         | Tenant   | Works with the tenant's data                                                                 |
| **Viewer** (`viewer`)                         | Tenant   | Read-only access to the tenant                                                               |

## Role matrix {#role-matrix}

✓ = the role holds the permission. Abbreviations: **PA** Platform administrator, **PV** Platform
viewer, **PO** Product owner, **PAd** Product admin, **Sup** Support, **PVi** Product viewer,
**TO** Owner, **TA** Admin, **M** Member, **V** Viewer.

| Permission               | PA  | PV  | PO  | PAd | Sup | PVi | TO  | TA  | M   | V   |
| ------------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `products:create`        | ✓   |     |     |     |     |     |     |     |     |     |
| `products:archive`       | ✓   |     |     |     |     |     |     |     |     |     |
| `users:read`             | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `users:manage`           | ✓   |     |     |     |     |     |     |     |     |     |
| `platform:settings`      | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `platform:audit`         | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `product:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `product_members:read`   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product_members:manage` | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `permissions:manage`     | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `product_users:read`     | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:create`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:update`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:delete`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `roles:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `roles:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `api_keys:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `api_keys:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `audit:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `collections:read`       | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:read`              | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:manage`            | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `webhooks:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `webhooks:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `usage:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `billing:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:manage`          | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:send_external`   | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenant:read`            | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:manage`         | ✓   |     | ✓   | ✓   | ✓   |     | ✓   | ✓   |     |     |
| `records:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `records:write`          | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `files:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `files:write`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `events:publish`         | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `usage:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `usage:record`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `billing:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `notify:send`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `notify:preferences`     | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `search:query`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `search:index`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   |     |     |

> [!NOTE]
> **Owner** and **Admin** of a tenant hold the same permissions. The difference is the owner
> rank: only an owner (or a product operator or platform administrator) can make someone an
> owner, or change or remove an owner. See [role ceiling](help:security#role-ceiling).

## Permissions a product declares itself {#product-defined}

Besides the built-in catalog, a product can declare its own permissions, named
`<namespace>.<resource>:<action>`, for example `crm.deals:approve`. They are listed on the
[Permissions](app:permissions) page under **Product permissions**, and you can grant them in
custom roles and API keys like built-in ones.

- **Product owner**, **Product admin** and **Platform administrator** hold all of them;
  **Owner** and **Admin** of a tenant hold the tenant-scoped ones.
- **Product viewer**, **Support** and **Platform viewer** hold the read-only ones.
- **Member** and **Viewer** hold only those the product lists for them (column **Also granted
  to**).
- A _retired_ permission no longer has any effect, even where it is still listed.

## API keys and permissions {#api-keys}

An [API key](help:api-keys) holds only the permissions selected when it was created, and only in
its product (and tenant, if bound). You can give a key only permissions you hold yourself at
product level. Platform permissions are never available for keys.

## Troubleshooting {#troubleshooting}

| Situation                                                    | What to do                                                                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Not permitted** with `missing permission …`                | Find the permission above and ask for a role that holds it.                                                                 |
| A tenant member sees the product but no product pages        | Expected: tenant members get only `product:read` at product level. They work in their tenant.                               |
| A role cannot be selected (**"… (above your permissions)"**) | The role holds permissions you lack, or it is an owner role. See [role ceiling](help:security#role-ceiling).                |
| A permission is missing from the role editor                 | Tenant roles offer only tenant permissions; platform permissions are never offered; retired product permissions are hidden. |
| The role field is a plain text box                           | You cannot read roles (`roles:read`); Studio cannot list them. Type the role key; the server checks it.                     |
