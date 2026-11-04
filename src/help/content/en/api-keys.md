---
title: API keys
summary: Create API keys for services that call Axentra, send them correctly, rotate them without downtime and revoke them, including keys derived from them.
keywords: API key, key, token, secret, credential, machine access, service account, integration, rotate, rotation, grace period, revoke, expiry, axk, bearer, X-API-Key
related: api-basics, roles-permissions, security, tenants, permissions-reference, webhooks
---

An **API key** lets a machine, such as your product's backend, a worker or an import script,
call the Axentra API without a person signing in. Each key belongs to exactly one product, holds
an explicit list of permissions and can be bound to one tenant. A key never holds platform
permissions.

The key's secret is shown **once**, when the key is created or rotated. Axentra stores only a
hash of it, so nobody, not even an administrator, can display it again.

> [!IMPORTANT]
> The **API keys** screen needs the access module and `api_keys:read`. Creating, rotating and
> revoking keys needs `api_keys:manage` (product owners and product admins). You can grant a key
> only permissions you hold yourself at product level.

## Create an API key {#create}

1. Open [API keys](app:apiKeys) and choose **New API key**.
2. Enter a **Name** that says where the key is used, for example `billing-worker production`.
3. Optionally choose a **Tenant scope** (see [tenant-bound keys](#tenant-scope)). Leave **Whole
   product** for a key that works in every tenant.
4. Optionally choose an **Expiry**: **Never** (the default), **In 30 days**, **In 90 days**, **In
   365 days**, or **On a date…** and then an **Expiry date** (see [expiry](#expiry)).
5. Select the **Permissions** the service needs, and no more. The checklist works as described in
   [roles and permissions](help:roles-permissions#checklist).
6. Choose **Create key**.
7. Copy the secret from **API key secret** into your secret manager.
8. Tick **I have stored the secret securely** and choose **Done**.

> [!CAUTION]
> The secret dialog cannot be closed with Escape or by clicking outside, and the secret cannot be
> shown again. If it is lost, [rotate the key](#rotate) to get a new secret.

| Field            | What it does                            | Allowed values / default                                                                                         |
| ---------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Name**         | Label in the list and in the audit log. | 1–200 characters. Not unique.                                                                                    |
| **Tenant scope** | Binds the key to one tenant.            | **Whole product** (default) or one tenant. Shown when the tenants module is enabled.                             |
| **Permissions**  | What the key may do.                    | 1–100 permissions of scope product or tenant, including active product-defined ones.                             |
| **Expiry**       | Time after which the key stops working. | **Never** (default), 30, 90 or 365 days from creation, or the end of a chosen day (after today, your time zone). |

### Expiry {#expiry}

A key with an expiry stops working at that time: it is refused like a revoked key and listed as
**Expired**. Choose an expiry for keys that are only needed for a while, for example for a migration
or a partner's test; long-running services usually use keys without expiry and [rotate](#rotate)
them on a schedule.

The expiry cannot be changed after creation, and rotation keeps it: create a new key before the old
one expires and switch the service over. Keys that a service creates with another key never outlive
the creating key (see [derived keys](#derived-keys)); keys created in Studio belong to your account,
so that rule does not apply to them.

### Tenant-bound keys {#tenant-scope}

A key with a **Tenant scope** works only inside that tenant: it can use its tenant permissions
there, and its product permissions have no effect at all. Every other tenant answers **Not
found**. When the tenant is deleted, the key is deleted with it; while the tenant is suspended,
the key is refused.

## Send the key with a request {#use}

A key looks like `axk_<26 characters>_<secret>`. The list shows only the first part (the
**prefix**, for example `axk_01jdk7x3m9q2w8v5r4t6y0z1ab_`), which identifies the key but cannot be used to call
the API. Send the full key in one of these headers:

```http
GET /v1/products/prd_01EXAMPLE/tenants HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01jdk7x3m9q2w8v5r4t6y0z1ab_EXAMPLEsecretEXAMPLEsecretEXAMPLEsec
```

```bash
curl -H "X-API-Key: $AXENTRA_API_KEY" https://api.example.com/v1/products/prd_01EXAMPLE/tenants
```

Requests with a key need no CSRF token and no cookie. Keep the key out of browsers and source
code; load it from an environment variable or secret manager. See [API basics](help:api-basics).

## Read the key list {#list}

| Column                   | Meaning                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Name**                 | The name and the key's prefix.                                                                                      |
| **Status**               | **Active**, **Expired** (past its expiry) or **Revoked** (revoked, or replaced by rotation after the grace period). |
| **Scope**                | **Whole product** or **Tenant** with the tenant ID.                                                                 |
| **Permissions**          | Number of permissions.                                                                                              |
| **Last used**            | Last successful request; updated at most once a minute.                                                             |
| **Expires**, **Created** | Timestamps.                                                                                                         |

Active keys are listed first, newest first. Expired and revoked keys stay listed for reference.

## Rotate a key {#rotate}

Rotating replaces a key with a new one, for example on a schedule or after a secret was exposed.

1. In the key's row, open the actions menu (**…**) and choose **Rotate secret**.
2. Choose a **Grace period for the old secret**.
3. Choose **Rotate secret** and store the new secret, as when creating a key.

The replacement is a **new key** with a new ID and prefix, and the same name, permissions,
tenant scope and expiry. Retired product permissions are left out. The old key is revoked when the
grace period ends.

```diagram
key-rotation
```

### Grace period {#grace-period}

| Option                                  | Effect                                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **None – old secret stops immediately** | The old key is revoked at once. Services still using it fail until they get the new secret.         |
| **1 hour**, **24 hours**, **7 days**    | Old and new key both work until the period ends. Both are listed as **Active**, with the same name. |

> [!TIP]
> Rotation without downtime: rotate with **24 hours**, deploy the new secret to all services,
> check that **Last used** of the new key moves and that of the old key stops, then revoke the old
> key to end the grace period early.

Keys that a service created _with_ the old key are not revoked by rotation and keep working.

## Revoke a key {#revoke}

1. Open the key's actions menu (**…**) and choose **Revoke key**.
2. Type the key's name to confirm and choose **Revoke key**.

The key stops working immediately and permanently. Revoking a key that is in its grace period
ends the grace period now.

> [!CAUTION]
> Revoking also revokes every key that was **created with this key**, and the keys created with
> those, at once. The confirmation does not list them; check the [audit log](help:audit) entry of
> the revocation for the revoked derived keys.

## Derived keys and expiry {#derived-keys}

A service whose key holds `api_keys:manage` can create further keys through the API. Such
**derived keys**:

- hold at most the permissions of the key that creates them;
- never outlive it: without their own expiry they inherit the creating key's expiry, and a later
  expiry is refused;
- are revoked together with it (see [revoke](#revoke)), but not on rotation.

Keys created in Studio are created by your user account, not by a key, so these rules do not apply
to them. Keys belong to the product, but they act only within the current permissions of the person
who created them (see the next section).

### Keys depend on their creator's permissions {#creator-permissions}

A key works only as long as the person who created it still holds the permissions the key uses. The
server checks this on every request: if the creator's role was changed or they were removed from the
product, a request that needs a permission they no longer hold is refused with `403
api_key_creator_lost_access`, and the response names that permission in `permission`. The key list
still shows such a key as **Active**. Give the creator the permission again, or create a new key as
someone who holds it, switch your services over and revoke the old key.

Studio itself is never refused this way: it uses your user session, not a key.

## Good to know {#good-to-know}

- An archived product or a suspended tenant makes all of its keys fail with **Not permitted**
  until it is restored or reactivated.
- Removing a permission from a product (retiring it) silently removes its effect from every key.
- Give each service its own key, so you can rotate or revoke one without affecting others.

## Troubleshooting {#troubleshooting}

**Not permitted: "you cannot grant permissions you do not hold: …".** You selected a permission
you do not hold yourself. Remove it, or ask a product owner to create the key. The same applies to
rotation: the person who rotates must hold all of the key's permissions.

**Please check your input: "an API key needs at least one permission" / "unknown permissions".**
Select at least one permission; a product permission may have been retired meanwhile.

**Please check your input: "only active keys can be rotated".** The key is expired or revoked.
Create a new key instead.

**Please check your input: "expires_at must not be later than the expiry of the creating key".**
Only through the API: a derived key cannot outlive its parent.

**Please sign in (401) when the service calls the API.** The key is wrong, incomplete, revoked or
expired. Check that the full key (not just the prefix) is sent and that the status is **Active**.

**Not permitted (403) for a valid key.** The key lacks the permission for that request, the
product is archived, or the tenant is suspended.

**Not found (404) for a valid key.** The key belongs to another product, or it is bound to a
different tenant.
