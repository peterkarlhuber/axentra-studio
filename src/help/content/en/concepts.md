---
title: Key concepts
summary: The building blocks of Axentra in plain words, from platform and product to tenant, role, permission and API key.
keywords: terms, terminology, basics, model, hierarchy, platform, product, tenant, customer, organization, user, member, operator, invitation, role, permission, module, API key, single product, multi product, mode
related: overview, glossary, roles-permissions, tenants, modules-reference, permissions-reference
---

This article explains the terms you meet everywhere in Studio and how they fit together. Read it
once before you start; the [glossary](help:glossary) has short definitions to look up later.

```diagram
hierarchy
```

## Platform (installation) {#platform}

The **platform** is one Axentra server with its database. User accounts exist once per platform
and can belong to several products. Platform-wide pages in Studio are **Products**,
**Audit log**, **System health**, **Monitoring** and **Settings**.

### Platform roles {#platform-roles}

A user can hold one platform role, which applies to **every product** of the server:

| Platform role                             | What it allows                                                                                                             |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Platform administrator (`platform_admin`) | Full control of the installation: create and archive products, manage all users and their platform roles, read everything. |
| Platform viewer (`platform_viewer`)       | Read access to the whole installation.                                                                                     |

The first platform administrator is created during [first-run setup](help:first-run-setup).
Further platform roles are assigned on a user's page (see [users](help:users)). The last platform
administrator cannot be disabled or lose the role.

## Product {#product}

A **product** is one application that runs on the platform, for example "Example CRM". Each
product has its own tenants, roles, API keys, data, plans and templates, isolated from all other
products. Most pages in Studio belong to one product; the address then starts with
`/p/<product id>/` and the [product switcher](help:interface#product-switcher) shows which one.

People who manage a product as a whole are **product operators**. They hold a product role:

| Built-in product role | In short                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| Product owner         | Full control of the product. Whoever creates a product becomes its owner.                              |
| Product admin         | Manages tenants, roles, keys and data; cannot manage product operators or declare product permissions. |
| Support               | Reads everything in the product and manages tenant members up to its own permissions.                  |
| Product viewer        | Read-only access to the product.                                                                       |

A product role that contains tenant permissions grants them in **every** tenant of the product.
See [products](help:products).

## Tenant {#tenant}

A **tenant** is one customer or organization inside a product, for example "Acme Ltd". The data
of different tenants is strictly separated, also inside the database (row-level security). A tenant
is **active** or **suspended**; suspending blocks its members and its tenant-bound API keys without
deleting data. See [tenants](help:tenants).

## User {#user}

A **user** is a person with an account on the platform, usually identified by an email address.
The same account can be a member of several tenants and an operator of several products. A user
can be **active** or **disabled**; disabling ends all sessions immediately.

Accounts are not created in Studio. They come from [first-run setup](help:first-run-setup), from a
[single sign-on](help:signing-in#sso) login, or from your product's own code (Axentra used as a
library). See [users](help:users).

## Member {#member}

A **member** is a user with a **tenant role** in one tenant. Membership is what gives a person
access to a tenant's data. Built-in tenant roles:

| Built-in tenant role | In short                                                        |
| -------------------- | --------------------------------------------------------------- |
| Owner                | Full control of the tenant.                                     |
| Admin                | Manages members and data of the tenant.                         |
| Member               | Works with the tenant's data. The default role for invitations. |
| Viewer               | Read-only access to the tenant.                                 |

Do not confuse tenant members with **product operators** (product members), who hold a product
role. See [members and invitations](help:members-invitations).

## Invitation {#invitation}

An **invitation** asks a person, by email address, to join a tenant with a given role. It contains
a one-time token, is valid for 7 days and can be revoked. The invited person accepts it while
signed in with an account that has **the same email address**. There are no invitations for product
operators. See [members and invitations](help:members-invitations).

## Role {#role}

A **role** is a named bundle of permissions. Axentra ships built-in roles (above) that cannot be
changed. A product can add **custom roles** with a **scope**:

- **Tenant** scope: assigned to tenant members, contains tenant permissions only.
- **Product** scope: assigned to product operators, may contain product and tenant permissions.

See [roles and permissions](help:roles-permissions).

## Permission {#permission}

A **permission** is a single right written as `resource:action`, for example `tenants:create` or
`records:write`. Access is denied unless a role or API key grants the permission explicitly.
Every permission has a scope:

| Scope    | Meaning                                                            | Examples                                            |
| -------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| Platform | Installation-wide; only platform roles grant them, never API keys. | `products:create`, `users:manage`                   |
| Product  | About one product as a whole.                                      | `tenants:create`, `api_keys:manage`, `roles:manage` |
| Tenant   | About data inside one tenant.                                      | `members:manage`, `records:read`, `files:write`     |

Products can also declare their **own permissions**, with a namespace and a dot, for example
`crm.deals:approve`. The full list is in the [permissions reference](help:permissions-reference).

### Role ceiling {#role-ceiling}

Being allowed to manage members does not mean you can hand out any role. You can assign a role only
if you hold **every permission of that role** yourself; owner roles additionally need owner rank.
Platform administrators are exempt. Studio marks roles above your level as not selectable. The same
rule applies to API keys: a key can only receive permissions that you hold.

## Module {#modules}

A **module** is a functional block of the server that the operator switches on or off in the server
configuration. `identity`, `tenancy`, `access`, `data` and `audit` are always enabled. Optional
modules include `storage` (files), `events` (jobs, schedules, events, webhooks), `usage`,
`billing` and `notify` (notifications).

In Studio, a sidebar entry whose module is not enabled stays visible and shows **Off**. Opening it
shows **Module not enabled on this server** and names the module id the operator must enable. The
dashboard's **Server** card lists all modules and their state. See the
[modules reference](help:modules-reference).

## API key {#api-key}

An **API key** lets a machine (your product's backend, an integration, a script) call the API
without a user. Each key belongs to exactly one product, has an explicit list of permissions and can
optionally be bound to one tenant. Its secret is shown **once**; Axentra stores only a hash. See
[API keys](help:api-keys).

## Records and files {#records-files}

- **Records** are JSON documents stored in named collections inside a tenant, for example a
  `contacts` collection. See [records](help:records) and the [data overview](help:data-overview).
- **Files** are uploaded binary objects (documents, images) with metadata, stored per tenant
  (module `storage`). See [files](help:files).

## Events and jobs {#events-jobs}

With the `events` module, Axentra runs work in the background and tells other systems what happened:

- **Jobs**: units of background work with status, retries and results. See [jobs](help:jobs).
- **Schedules**: jobs that run on a cron schedule. See [schedules](help:schedules).
- **Events**: records of things that happened, for example "a contact was created". See
  [events](help:events).
- **Webhooks**: HTTP calls that deliver events to your endpoints, signed with a secret. See
  [webhooks](help:webhooks).

## Usage and billing {#usage-billing}

- **Usage** (module `usage`) counts consumption per tenant with **meters**, for example API calls or
  storage, and can enforce **quotas**. See [usage](help:usage).
- **Billing** (module `billing`) defines **plans** with prices and entitlements and assigns them to
  tenants as **subscriptions**. Studio never handles card data. See
  [plans and subscriptions](help:plans-subscriptions).

## Audit log {#audit-log}

Every change, and every refused attempt, is written to the **audit log** in the same transaction as
the change: who (actor), what (action, for example `tenancy.tenant.create`), on what (target),
when, and with which outcome (allowed or denied). See [audit log](help:audit).

## Single- and multi-product mode {#single-multi-product}

The server runs in one of two **modes**, set by the operator:

|                            | Single product                                                     | Multi product                                   |
| -------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| Products                   | Exactly one, created from the server configuration on first start. | Any number, created by platform administrators. |
| Create or archive products | Not possible (`mode_not_supported`).                               | With `products:create` and `products:archive`.  |
| Product switcher           | A fixed **Product** label with the product's name.                 | A menu listing your products.                   |

Everything else (tenants, roles, API paths, permissions) works the same in both modes. Switching
from single to multi is a configuration change without data migration. The dashboard's **Server**
card shows the current **Mode**.

## Request ID {#request-id}

Every API request gets a unique **request ID**. Studio shows it with error messages; give it to
your operator, who can find the matching log entry and audit events.

## Troubleshooting {#troubleshooting}

| You see                                       | Meaning and fix                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Not permitted**                             | Your roles lack the permission. Ask someone with a higher role, or check [roles and permissions](help:roles-permissions).                                          |
| A role is shown as "(above your permissions)" | The [role ceiling](help:concepts#role-ceiling) blocks it. Someone holding all of that role's permissions must assign it.                                           |
| **Not found** for something that exists       | Axentra answers "not found" when you have no access at all, so that it does not reveal what exists. Check that you are in the right product and have a role there. |
| **Not available in this mode**                | The server runs in single-product mode; products cannot be created or archived.                                                                                    |
