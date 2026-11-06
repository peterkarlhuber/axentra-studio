---
title: Products
summary: Create, configure, archive and restore products, manage product operators and understand single-product mode.
keywords: product, application, app, project, operators, product members, archive, restore, product settings, single-product mode, multi-product mode, slug
related: concepts, tenants, members-invitations, roles-permissions, api-keys, settings
---

A **product** is one application that runs on your Axentra server, for example a CRM or a booking
service. Each product has its own tenants, users, roles, API keys and data, and nothing is shared
between products. People who run a product (rather than use it as a customer) are its
**operators**: they hold a product role such as **Product owner** and are listed on the product's
**Members** tab.

Open the product list with [Products](app:products) in the sidebar. **Open dashboard** takes you
into a product; every other screen in the sidebar then works inside that product.

> [!IMPORTANT]
> Everyone who belongs to a product sees it in the list. Platform administrators and platform
> viewers see every product, including archived ones. Creating, archiving and restoring products
> needs the platform permissions `products:create` and `products:archive` (platform
> administrators) and is possible only in multi-product mode. See
> [single-product mode](#single-product-mode).

## Create a product {#create}

1. Open [Products](app:products) and choose **New product**.
2. Enter a **Name**.
3. Check the **Slug**. Studio derives it from the name; you can change it before you create the
   product.
4. Optionally enter a **Description**.
5. Choose **Create product**.

Studio opens the new product's page. You become its **Product owner**, so you can add further
operators right away on the **Members** tab.

> [!NOTE]
> The slug cannot be changed later. Choose one you are happy to see in URLs, logs and
> configuration files.

### Product fields {#fields}

| Field           | What it does                                                         | Allowed values / default                                                                                             |
| --------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Name**        | Display name in Studio and in emails, for example invitation emails. | 1–200 characters. Can be changed later.                                                                              |
| **Slug**        | Stable, URL-friendly identifier.                                     | 2–63 lowercase letters, digits and dashes, starting with a letter or digit; unique on the server. Cannot be changed. |
| **Description** | Free text shown in the product list.                                 | Up to 2,000 characters. Optional.                                                                                    |
| **ID**          | Generated identifier (`prd_…`) used by the API.                      | Assigned by the server.                                                                                              |
| **Status**      | **Active** or **Archived**.                                          | See [archive a product](#archive).                                                                                   |

## Change product settings {#settings}

The **Settings** tab of a product holds its name, description and **Settings (JSON)**: a JSON
object with product-specific configuration. Your own product code can read it, and some Axentra
modules use keys in it.

1. Open the product from [Products](app:products) and select the **Settings** tab.
2. Change **Name**, **Description** or **Settings (JSON)**.
3. Choose **Save changes**.

Changes apply immediately to all tenants of the product.

| Key in Settings (JSON)  | Used by       | What it does                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `invitation_accept_url` | Notifications | Link used in invitation emails. `{token}` is replaced by the invitation token; without it, `?token=…` is appended. Must start with `http://` or `https://`. See [invitations](help:members-invitations). If the key is not set, the server setting `notify.invitation_accept_url` applies, otherwise `/accept-invitation` on the API's public address. |
| `default_locale`        | Notifications | Fallback language for notification templates, for example `"en"`.                                                                                                                                                                                                                                                                                      |
| `storage`               | Files         | Storage quotas and the upload content-type policy. Edit the policy on the **Files** tab instead. See [files](help:files).                                                                                                                                                                                                                              |

```json
{
  "invitation_accept_url": "https://studio.example.com/invitations/accept?token={token}",
  "default_locale": "en"
}
```

> [!WARNING]
> **Save changes** replaces the whole settings object. If you delete a key from the text, it is removed
> from the product. The object may be up to about 32,000 characters long.

> [!IMPORTANT]
> Changing settings needs `product:manage` (product owners and product admins). Without it the
> tab shows **You can view but not change these settings.** An archived product cannot be edited
> in Studio; restore it first.

The **Files** tab (only when the files module is enabled) holds the product's storage policy. It
is described in [files](help:files).

## Manage product operators {#members}

The **Members** tab lists the product's operators: users with a product role. Their tenant
permissions apply in **every** tenant of the product. Tenant members are managed on each tenant
instead, see [members and invitations](help:members-invitations).

| Built-in product role                 | Can do                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Product owner** (`product_owner`)   | Everything in the product, including managing operators and declaring product permissions.    |
| **Product admin** (`product_admin`)   | Manages tenants, roles, API keys and data; cannot manage operators.                           |
| **Support** (`product_support`)       | Reads everything and manages tenant members up to its own permissions (in practice: viewers). |
| **Product viewer** (`product_viewer`) | Read-only access to the product.                                                              |

Custom product roles appear in the list too. See [roles and permissions](help:roles-permissions).

### Add an operator {#add-operator}

1. Open the **Members** tab and choose **Add member**.
2. Enter the person's **Email address** and choose a **Role**.
3. Choose **Add member**.

> [!IMPORTANT]
> The **Members** tab needs `product_members:read`; adding, changing and removing operators needs
> `product_members:manage` (product owners and platform administrators).

> [!NOTE]
> You can add only accounts you can see: platform administrators see every account, users with
> `product_users:read` see the users of this product (members of its tenants and its operators).
> For anyone else, the server answers **User not found** and the dialog offers **Send invitation
> instead**, which invites the address to the product team. See
> [product team invitations](help:members-invitations#product-team).

To change an operator's role, pick a new one in the **Role** column. To remove an operator, choose
the trash icon in their row and confirm. Roles above your own level are shown but cannot be
selected (see [role ceiling](help:members-invitations#role-ceiling)).

## Archive a product {#archive}

Archiving takes a product out of service without deleting anything.

1. Open the product from [Products](app:products).
2. Choose **Archive**.
3. Type the product's name to confirm and choose **Archive**.

While a product is archived:

- operators and tenant members no longer see it in the product list, and every request they make
  in it is refused;
- all of its API keys stop working (requests fail with **Not permitted**);
- platform administrators keep full access, platform viewers keep read access;
- Studio shows **This product is archived: its operators, tenant members and API keys have no
  access. Restore it to make changes.** and does not offer
  **Open dashboard**.

> [!NOTE]
> Studio cannot delete a product. Archiving is the way to take it out of service.

## Restore a product {#restore}

1. Open the archived product (as a platform administrator, it is still listed with the status
   **Archived**).
2. Choose **Restore** and confirm.

The product, its members and its API keys work again immediately. Keys that expired in the
meantime stay expired.

## Single-product mode {#single-product-mode}

An Axentra server runs in one of two modes, set by the server operator in the server
configuration:

|                                           | Single-product mode (`single`)                                        | Multi-product mode (`multi`)                     |
| ----------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------ |
| Products                                  | Exactly one, created from the configuration on the first start        | Any number, created in Studio or through the API |
| **New product**, **Archive**, **Restore** | Not offered; the API refuses them with **Not available in this mode** | With `products:create` / `products:archive`      |
| Product list                              | Shows the one product and the **Single-product mode** notice          | All products you have access to                  |

In single-product mode you still change the product's name, description, settings and members
on its page. To run several products, the server operator sets `mode = "multi"` in the server
configuration; no data migration is needed. See [server configuration](help:server-configuration).

## Good to know {#good-to-know}

- User accounts are installation-wide: one account can work in several products.
- Archived products keep their data, audit events and keys; nothing expires because of archiving.
- Product settings are not secret storage. Do not put passwords or tokens into **Settings (JSON)**.

## Troubleshooting {#troubleshooting}

**Conflict when creating a product.** Another product already uses the slug. Choose a different
slug.

**Please check your input: "slug must be 2-63 lowercase letters, digits or dashes".** Remove
capitals, spaces and special characters from the slug.

**This is not valid JSON. / Settings must be a JSON object.** **Settings (JSON)** must be one
object in curly braces, for example `{"key": "value"}`. Arrays, plain strings and trailing commas
are refused.

**Please check your input: "settings are too large"** or a message about `storage`. The object is
longer than about 32,000 characters, or the `storage` part is not valid. Shorten it, or edit the
storage policy on the **Files** tab.

**Changed in the meantime.** Someone else saved the product while you were editing. Reload the
page and apply your change again.

**Not available in this mode.** The server runs in single-product mode, where products cannot be
created, archived or restored.

**User not found when adding an operator.** The person has no account, or not one you can see.
See [add an operator](#add-operator).

**Conflict: "the product needs at least one owner".** You tried to remove or demote the last
**Product owner**. Make someone else owner first.

**A product is missing from the list.** It is archived (only platform administrators and viewers
see archived products), or you are not a member of it. Ask a platform administrator.
