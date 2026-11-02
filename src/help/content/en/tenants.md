---
title: Tenants
summary: Create tenants for your customers, rename, suspend, reactivate and delete them, and understand what each action does to access and data.
keywords: tenant, customer, organization, organisation, account, workspace, client, suspend, reactivate, delete tenant, slug
related: concepts, members-invitations, products, records, api-keys, tutorial-onboard-customer
---

A **tenant** is one customer or organization inside a product. Each tenant's data (records,
files, usage, subscriptions, notifications) is strictly separated from every other tenant, also
in the database. People get access to a tenant through a **membership** with a tenant role, see
[members and invitations](help:members-invitations).

Create one tenant per customer. Product operators (users with a product role) work across all
tenants; tenant members see only their own tenant.

```diagram
hierarchy
```

> [!IMPORTANT]
> The **Tenants** screen needs the tenants module. Seeing the list needs `tenants:read`;
> without it, you see only the tenants you are a member of. Creating needs `tenants:create`,
> renaming, suspending and reactivating `tenants:update`, deleting `tenants:delete`. Product
> owners and product admins hold all of them.

## Find a tenant {#find}

Open [Tenants](app:tenants). Use **Search tenants** to filter by name or slug and the **Status**
filter to show only **Active** or **Suspended** tenants. The **Members** column counts the
tenant's memberships.

## Create a tenant {#create}

1. Open [Tenants](app:tenants) and choose **New tenant**.
2. Enter the **Name**, for example the customer's company name.
3. Check the **Slug**. Studio derives it from the name; you can change it before you create the
   tenant.
4. Choose **Create tenant**.

Studio opens the new tenant. It has no members yet: add the customer's first person on the
**Members** tab, or invite them on the **Invitations** tab, usually with the **Owner** role. See
[members and invitations](help:members-invitations).

| Field      | What it does                                                     | Allowed values / default                                                                                                  |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Name**   | Display name in Studio and in invitation emails.                 | 1–200 characters. Can be changed later.                                                                                   |
| **Slug**   | Stable, URL-friendly identifier, also typed to confirm deletion. | 2–63 lowercase letters, digits and dashes, starting with a letter or digit; unique within the product. Cannot be changed. |
| **ID**     | Generated identifier (`ten_…`) used by the API.                  | Assigned by the server.                                                                                                   |
| **Status** | **Active** or **Suspended**.                                     | New tenants are **Active**.                                                                                               |

> [!TIP]
> Through the API a tenant can be created with an owner in one step (`owner_user_id`), and it can
> carry its own `settings` object. Studio does not show these.

## Rename a tenant {#rename}

1. Open the tenant and stay on the **Details** tab.
2. Change the **Name** under **Edit tenant**.
3. Choose **Save changes**.

The slug and ID never change.

## Suspend a tenant {#suspend}

Suspending blocks all access to a tenant without deleting anything, for example when a customer
has not paid or a contract is paused.

1. Open the tenant.
2. Choose **Suspend tenant** and confirm.

While a tenant is suspended:

- its members cannot access it; their requests are refused with **Not permitted**;
- API keys bound to the tenant, and product-wide keys working in it, are refused too;
- product operators also lose access to the tenant's data and its page; the tenant stays in the
  [Tenants](app:tenants) list with the status **Suspended**;
- platform administrators keep full access and platform viewers keep read access;
- no data is deleted.

## Reactivate a tenant {#reactivate}

1. Open the suspended tenant.
2. Choose **Reactivate tenant**.

Members and keys work again immediately.

> [!WARNING]
> Only platform administrators (and platform viewers, read-only) can open a suspended tenant's
> page. A product owner or admin who is not a platform administrator gets **Not permitted** there
> and cannot reach **Reactivate tenant** in Studio. Ask a platform administrator, or reactivate
> through the API with `tenants:update`:
>
> ```http
> PATCH /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE
> Content-Type: application/json
>
> {"status": "active"}
> ```

## Delete a tenant {#delete}

> [!CAUTION]
> Deleting a tenant cannot be undone. The tenant is removed together with its records, files,
> memberships, invitations, tenant-bound API keys, usage, subscription, notification and search
> data. If you are unsure, [suspend](#suspend) the tenant instead.

1. Open the tenant.
2. Choose **Delete tenant**.
3. Type the tenant's **slug** (not its name) to confirm, then choose **Delete tenant**.

Studio returns to the tenant list. The audit log keeps the record of the deletion. Stored file
contents are removed from the storage backend by the server's regular storage maintenance.

## Browse a tenant's data {#records}

**Browse records** on the tenant page opens [Records](app:records) filtered to this tenant. It is
shown when the records module is enabled and you hold `records:read` in the tenant. See
[records](help:records).

## Good to know {#good-to-know}

- A user can be a member of several tenants, in the same or different products, with a different
  role in each.
- Product operators do not need a membership: their product role already covers every tenant.
- Pickers in other screens (for example **Tenant scope** on API keys or the **Invitations**
  screen) list the first 200 tenants by name.

## Troubleshooting {#troubleshooting}

**Conflict: "a tenant with this slug exists in the product".** Choose a different slug. Slugs of
deleted tenants can be reused.

**Please check your input: "slug must be 2-63 lowercase letters, digits or dashes".** Remove
capitals, spaces and special characters from the slug.

**Not permitted when opening a tenant.** The tenant is suspended (see [reactivate](#reactivate)),
or the product is archived, or you lack `tenant:read` in it.

**Not found when opening a tenant.** The tenant was deleted, or you have no relation to it at all
(Axentra answers the same way so that tenant IDs cannot be probed).

**Changed in the meantime.** Someone else changed the tenant while you were editing. Reload the
page and repeat your change.

**The delete button stays disabled.** Type the slug exactly as shown in the dialog, for example
`acme`, not the display name.

**No New tenant button.** You lack `tenants:create`. Ask a product owner or admin.
