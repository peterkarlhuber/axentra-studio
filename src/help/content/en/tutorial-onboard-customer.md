---
title: Onboard a customer organization
summary: Set up a new customer end to end - tenant, administrator and staff with the right roles, accepted invitations, an API key for their integration, and an audit check.
keywords: onboarding, new customer, customer setup, tenant setup, invite, invitation, accept invitation, owner, admin, member, viewer, integration, API key, audit, checklist, offboarding
related: tenants, members-invitations, roles-permissions, api-keys, audit, first-steps
---

A new customer, "Acme Ltd", has signed up for your product. In this tutorial you prepare everything
they need: their own tenant, their administrator and staff with suitable roles, an API key for
their integration, and a check in the audit log that everything happened as planned. You also learn
what the customer has to do on their side to accept an invitation.

This tutorial builds on [first steps](help:first-steps). Plan about 30 minutes plus the time the
customer needs to accept.

## Before you start {#before-you-start}

> [!IMPORTANT]
> You need these permissions in the product (the built-in **Product owner** and **Product admin**
> roles have them all; a platform administrator has them anyway):
>
> | Task                            | Permission                                                           |
> | ------------------------------- | -------------------------------------------------------------------- |
> | Create the tenant               | `tenants:create`                                                     |
> | Invite, add and change members  | `members:manage`                                                     |
> | Invite the customer's **Owner** | owner rank: product operator, tenant owner or platform administrator |
> | Create the API key              | `api_keys:manage` and every permission you put on the key            |
> | Check the audit log             | `audit:read`                                                         |

Collect from the customer beforehand:

- the email address of their **administrator** and of each staff member,
- what each person should be able to do,
- what their integration has to do through the API.

## Step 1: Plan the roles {#plan-roles}

Choose roles before you invite anybody; changing them later is possible but easier to forget.

| Person                        | Recommended tenant role | Why                                                                        |
| ----------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| Customer's main administrator | **Owner**               | Full control of the tenant, can manage all members including other owners. |
| Deputy administrator          | **Admin**               | Manages members and data, but cannot assign or remove owners.              |
| Staff who work with data      | **Member**              | Reads and writes data, sees members; cannot manage members.                |
| Auditors, read-only staff     | **Viewer**              | Reads data only.                                                           |

If none fits, a product operator with `roles:manage` can create a custom tenant role first. See
[roles and permissions](help:roles-permissions).

> [!TIP]
> Give **Owner** to one or two people only. A second owner avoids a deadlock when the first one leaves.

## Step 2: Create the tenant {#create-tenant}

1. Open [Tenants](app:tenants) and choose **New tenant**.
2. **Name**: `Acme Ltd`. Keep the derived **Slug** `acme-ltd`, or enter the customer's short name.
   The slug must be unique in the product and cannot be reused while the tenant exists.
3. Choose **Create tenant**.

**Expected result:** "Tenant “Acme Ltd” created"; the tenant's page opens with status **Active** and
no members. Note the tenant **ID** (`ten_…`) from the **Details** tab.

## Step 3: Invite the customer's administrator {#invite-admin}

1. On the tenant's page, open **Invitations** and choose **Invite member**.
2. **Email address**: the administrator's address, for example `admin@acme.example`.
3. **Role**: **Owner**.
4. Choose **Send invitation**.

**Expected result:** **Invitation created** with the **Invitation token** and, if the `notify` module
is enabled, an **Invitation link**. Both are shown only once.

### How the invitation reaches the customer {#delivery}

- **With the `notify` module**, Axentra emails the invitation, including the link, to the address.
  You do not need to send anything; you can still copy the link as a backup.
- **Without it**, copy the **Invitation token** and send it yourself over a trusted channel, with
  the instruction from [step 5](help:tutorial-onboard-customer#accept-invitation).

> [!NOTE]
> The invitation link is built from the product setting `invitation_accept_url` (in the product's
> **Settings (JSON)**), for example
> `{"invitation_accept_url": "https://app.example.com/accept-invitation?token={token}"}`. Without
> that setting, the link points to `/accept-invitation` on the API's public address. Point it at the
> page of your product that accepts invitations, or at Studio's own page
> `https://studio.example.com/invitations/accept?token={token}` if your customers use Studio.

**Check it:** The **Invitations** tab shows the invitation with status **Pending** and an expiry date
7 days ahead.

## Step 4: Add the staff {#add-staff}

For each further person, choose one way:

- **The person already has an account that you can see** (for example a member of another tenant of
  this product): open **Members**, choose **Add member**, enter the **Email address**, choose the
  **Role** and confirm. The person has access immediately.
- **Otherwise**: invite them as in step 3, with the role from step 1. If **Add member** answers
  **User not found**, choose **Send invitation instead**; Studio creates an invitation with the same
  role.

Axentra does not reveal whether an address has an account: inviting works the same for every address.

## Step 5: The customer accepts {#accept-invitation}

This is what the invited person does. Send them these instructions.

1. **Have an account with exactly the invited email address.**
   - If your server offers **single sign-on**, the person signs in with **Continue with …**. An
     account is created automatically for a verified email address that has an open invitation.
   - With **password sign-in only**, the account must already exist. Axentra has no
     self-registration over the API: accounts for password sign-in are created by your product's own
     code. See [users](help:users).
2. **Open the invitation link.** If not signed in, the person is taken to **Sign in** and, after
   signing in, back to the invitation. With a token instead of a link, they open **Accept
   invitation** (address `/invitations/accept`) after signing in and paste the **Invitation token**.
3. Choose **Accept invitation**.

**Expected result:** "Invitation accepted. You now have access." The person now sees the product and
the tenant according to their role. It can take a moment until the access shows everywhere.

**Check it (you):** On the tenant's **Members** tab, the person is listed with the role **Owner**.
On **Invitations**, the status is **Accepted**.

> [!WARNING]
> Invitations are bound to the address. If the person signs in with another address, accepting
> fails with **Not permitted**. An invitation that was accepted, revoked or has expired cannot be
> used again: create a new one.

## Step 6: Adjust roles if needed {#change-role}

On the **Members** tab, choose a new role in the member's **Role** list; Studio confirms "Role
updated". To take access away, choose **Remove member**. You cannot change or remove members whose
role is above your own (marked "Above your own role").

## Step 7: Create the API key for the integration {#integration-key}

The customer's integration (for example their ERP sync) gets its own key, bound to their tenant.

1. Open [API keys](app:apiKeys) and choose **New API key**.
2. **Name**: say who uses it and where, for example `acme erp-sync production`.
3. **Tenant scope**: **Acme Ltd**. A tenant-bound key cannot see or change other tenants.
4. **Permissions**: only what the integration needs, for example `records:read` and `records:write`
   for a data sync, plus `events:publish` if it publishes events.
5. Choose **Create key**, copy the **API key secret**, confirm **I have stored the secret securely**
   and choose **Done**.

Hand the secret to the customer's technical contact over a secure channel (for example a shared
secret manager), never by plain email. The integration sends it as
`Authorization: Bearer axk_…`. Test it as in [first steps](help:first-steps#try-api-key).

> [!CAUTION]
> The secret cannot be shown again. If it is lost or leaked, **Rotate secret** (with a grace period
> for a switch without downtime) or **Revoke key**. See [API keys](help:api-keys).

## Step 8: Check the audit log {#check-audit}

1. Open [Audit log](app:audit).
2. Set **Product** to your product. Optionally enter `tenancy.*` under **Action** to see only tenant
   and member events, or enter the tenant ID under **Tenant ID** (under **More filters** on small
   screens).
3. Choose **Apply filters**.

**Expected result**, newest first:

| Action                      | Actor                        | Meaning                                                        |
| --------------------------- | ---------------------------- | -------------------------------------------------------------- |
| `access.api_key.create`     | you                          | The integration key was created.                               |
| `tenancy.invitation.accept` | the customer's administrator | The invitation was accepted.                                   |
| `tenancy.member.set`        | you                          | A member was added or a role changed (if you did step 4 or 6). |
| `tenancy.invitation.create` | you                          | One per invitation.                                            |
| `tenancy.tenant.create`     | you                          | The tenant was created.                                        |

All with the outcome **Success**. An accept attempt with the wrong account appears as
`tenancy.invitation.accept` with the outcome **Denied**.

## Onboarding checklist {#checklist}

1. Tenant created, ID recorded.
1. Administrator invited as **Owner**, invitation accepted, visible under **Members**.
1. Staff added or invited with planned roles; all invitations **Accepted**.
1. Integration key created, tenant-bound, minimal permissions, secret handed over securely.
1. Audit log shows the expected events.
1. Optional: subscription assigned (see [plans and subscriptions](help:plans-subscriptions)).

## When the customer leaves {#offboarding}

- **Suspend tenant** first: members and tenant-bound keys lose access, no data is deleted, and you
  can reactivate it.
- **Revoke** the integration key.
- **Delete tenant** only when the data must go; it deletes the tenant and all of its data and cannot
  be undone. See [tenants](help:tenants).

## Troubleshooting {#troubleshooting}

| Problem                                | Cause and fix                                                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner** cannot be selected           | You lack owner rank or some of the role's permissions (role ceiling). Ask a product owner or platform administrator.                                                                      |
| **Conflict** when inviting             | An open invitation for this address already exists in this tenant. Use or revoke it.                                                                                                      |
| **User not found** in **Add member**   | No account you can see has this address. Use **Send invitation instead**.                                                                                                                 |
| The customer gets no email             | The `notify` module is off, or mail delivery failed. Send the link or token yourself; check [notifications](help:notifications).                                                          |
| The link opens a "page not found"      | The product setting `invitation_accept_url` is missing or wrong (see [delivery](help:tutorial-onboard-customer#delivery)). Send the token and have it pasted under `/invitations/accept`. |
| Accepting fails with **Not permitted** | The person is signed in with an account whose email differs from the invited address. Sign in with the right account, or invite the actual address.                                       |
| Accepting fails with **Not found**     | The invitation was already accepted, revoked or is older than 7 days. Create a new invitation.                                                                                            |
| Single sign-on fails with "no account" | No open invitation for the verified address, and sign-up is off. Check the invited address; see [signing in](help:signing-in#sso-errors).                                                 |
| The integration gets `403`             | The key lacks a permission, or the tenant is suspended.                                                                                                                                   |
| No events in the audit log             | Check the **Product** filter and that you have `audit:read`.                                                                                                                              |
