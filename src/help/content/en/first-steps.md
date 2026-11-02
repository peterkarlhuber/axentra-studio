---
title: First steps
summary: A guided first session in Studio - create a product and a tenant, invite a member and create an API key, and check that each step worked.
keywords: getting started, quick start, tutorial, beginner, first product, first tenant, first API key, first invitation, hello world, walkthrough
related: first-run-setup, concepts, products, tenants, members-invitations, api-keys
---

In this tutorial you set up a small but real working structure: a product, a customer (tenant) in
that product, an invitation for a person, and an API key that a machine can use. After each step
you check the result, so you know that it worked. It takes about 15 minutes.

You learn the most important terms on the way. If one is new to you, see
[key concepts](help:concepts).

## Before you start {#before-you-start}

> [!IMPORTANT]
>
> - You are signed in to Studio, ideally as a **platform administrator** (for example the account
>   from [first-run setup](help:first-run-setup)).
> - To create a product you need the platform permission `products:create` and a server in
>   **multi-product mode**. In single-product mode the product already exists: skip
>   [step 1](help:first-steps#create-product).
> - For [step 4](help:first-steps#create-api-key) and its check you need a command line with `curl`.

Use example names. This tutorial uses the product "Example CRM" and the tenant "Acme Ltd".

## Step 1: Create a product {#create-product}

A **product** is your application on the Axentra server. Everything else in this tutorial lives
inside it.

1. Open [Products](app:products).
2. Choose **New product**.
3. Enter the **Name** `Example CRM`. Studio derives the **Slug** `example-crm`; keep it.
4. Optionally add a **Description**.
5. Choose **Create product**.

**Expected result:** Studio reports "Product “Example CRM” created" and opens the product's page.

**Check it:** Open the tab **Members**. Your account is listed with the role **Product owner**: the
creator of a product becomes its owner. The product also appears in the product switcher at the top.

Now choose **Open dashboard**. The dashboard of "Example CRM" opens; all counters show `0` except
**Users** (you, as product operator) and **Audit events (24 h)**.

## Step 2: Create a tenant {#create-tenant}

A **tenant** is one customer organization of your product. Its data is strictly separated from all
other tenants.

1. Open [Tenants](app:tenants), or choose **New tenant** on the dashboard.
2. Choose **New tenant**.
3. Enter the **Name** `Acme Ltd`. Studio derives the **Slug** `acme-ltd`.
4. Choose **Create tenant**.

**Expected result:** Studio reports "Tenant “Acme Ltd” created" and opens the tenant's page with
the tabs **Details**, **Members** and **Invitations**. The status is **Active**.

**Check it:** Back on the dashboard, **Tenants** now shows `1`. Note the tenant's **ID** on the
**Details** tab (it starts with `ten_`); you need it in step 4.

> [!NOTE]
> A new tenant has no members. You add them in the next step.

## Step 3: Invite a member {#invite-member}

People join a tenant through an **invitation** (or are added directly if they already have an
account you can see).

1. On the tenant's page, open the tab **Invitations**.
2. Choose **Invite member**.
3. Enter the **Email address** of a colleague, for example `maria@example.com`.
4. Leave **Role** at **Member**, or choose another role. Roles above your own permissions cannot be
   selected.
5. Choose **Send invitation**.

**Expected result:** The dialog **Invitation created** shows the secret of the invitation, marked
**Shown only once**: with the `notify` module enabled an **Invitation link** (and Axentra also emails
the invitation), otherwise only the **Invitation token**.

6. Copy the link or token and send it to your colleague over a channel you trust, then choose
   **Done**.

**Check it:** The **Invitations** tab lists the invitation with status **Pending** and an expiry
date seven days ahead.

> [!IMPORTANT]
> Your colleague accepts while signed in with an account that has exactly the invited email
> address. How this works, including for people without an account, is described in
> [Onboard a customer organization](help:tutorial-onboard-customer#accept-invitation).

## Step 4: Create an API key {#create-api-key}

An **API key** lets a machine, for example the Acme integration, call the API. Each key has an
explicit list of permissions; give it only what it needs.

1. Open [API keys](app:apiKeys), or choose **New API key** on the dashboard.
2. Choose **New API key**.
3. Enter the **Name** `acme-integration test`.
4. Under **Tenant scope**, choose **Acme Ltd**. The key can then only reach this tenant's data.
5. Under **Permissions**, select `tenant:read` only.
6. Choose **Create key**.

**Expected result:** The dialog **Secret for “acme-integration test”** shows the **API key secret**,
which starts with `axk_`. Copy it now: it is shown only this once.

7. Select **I have stored the secret securely**, then choose **Done**.

**Check it:** The key is listed with status **Active**, scope **Tenant** and **1 permission**.

### Try the key {#try-api-key}

Call the API with the key. Replace the address, the product ID (from the dashboard's **Server**
card, **Product ID**) and the tenant ID:

```bash
curl -s https://axentra.example.com/v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE \
  -H "Authorization: Bearer axk_EXAMPLE_SECRET"
```

**Expected result:** a JSON description of the tenant:

```json
{
  "id": "ten_01EXAMPLE",
  "product_id": "prd_01EXAMPLE",
  "slug": "acme-ltd",
  "name": "Acme Ltd",
  "status": "active"
}
```

The real answer contains a few more fields. Back in Studio, reload **API keys**: **Last used** now
shows a time.

If the call fails, see [troubleshooting](help:first-steps#troubleshooting). To learn the API, see
[API basics](help:api-basics).

## Step 5: Look at the audit log {#check-audit}

Everything you just did was recorded.

1. Open [Audit log](app:audit).
2. Under **Product**, choose "Example CRM" and apply the filter.

**Expected result:** You see, newest first, `access.api_key.create`, `tenancy.invitation.create`,
`tenancy.tenant.create` and (in multi-product mode) `tenancy.product.create`, each with you as
actor and the outcome **Success**. Select an entry to see its details.

## What you have built {#summary}

```diagram
hierarchy
```

You have a product with one tenant, an open invitation and a tenant-bound API key, and you know where
to verify each of them. Next:

- Onboard a real customer end to end: [Onboard a customer organization](help:tutorial-onboard-customer).
- Define your own roles: [roles and permissions](help:roles-permissions).
- Clean up the test key: on **API keys**, open the key's actions and choose **Revoke key**.

## Troubleshooting {#troubleshooting}

| Problem                                          | Cause and fix                                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **New product** is missing                       | You are not a platform administrator, or the server runs in single-product mode. Use the existing product. |
| **Conflict** when creating the product or tenant | The slug is already taken (products: on the server; tenants: in the product). Choose another slug.         |
| **Please check your input** for the slug         | Slugs have 2 to 63 characters: lowercase letters, digits and hyphens, starting with a letter or digit.     |
| **Conflict** when inviting                       | An open invitation for this address already exists in the tenant. Revoke it or use it.                     |
| **Not permitted** when creating the key          | You selected a permission that you do not hold yourself.                                                   |
| `curl` answers `401`                             | The secret is incomplete or wrong, or the key was revoked. Create a new key.                               |
| `curl` answers `404`                             | The product or tenant ID is wrong, or the key is bound to another tenant.                                  |
| `curl` answers `403`                             | The key lacks the permission (`tenant:read`), or the tenant is suspended.                                  |
| The audit log shows nothing                      | You need `audit:read` for the product (or a platform role). Check the **Product** filter.                  |
