---
title: Users
summary: Find the people who have access to a product, check their profile and sessions, sign them out, disable accounts and grant platform roles.
keywords: user, account, person, people, disable user, deactivate, sign out everywhere, sessions, platform role, platform admin, platform viewer, no email
related: members-invitations, tenants, products, roles-permissions, security, profile
---

A **user** is a person's account on the Axentra server. Accounts are installation-wide: one
account can be an operator of one product and a member of tenants in several others. What a user
can do comes from three places:

- a **platform role** (installation-wide, rare),
- a **product role**, when the user is an operator of a product (see
  [products](help:products#members)),
- a **tenant role** in each tenant the user is a member of (see
  [members and invitations](help:members-invitations)).

The [Users](app:users) screen lists the users of the current product: its operators and the
members of its tenants.

> [!IMPORTANT]
> The **Users** screen needs `product_users:read` (product owners, admins, support and viewers;
> platform administrators and viewers). Disabling users, ending their sessions and seeing their
> sessions needs the platform permission `users:manage`, which only platform administrators
> hold. Only platform administrators change platform roles.

## Find a user {#find}

Open [Users](app:users). Use **Search users** to filter by name or email address and the
**Status** filter to show **Active** or **Disabled** users. Select a name to open the user's page.

Apart from [single sign-on users](help:users#external-user), Studio does not create accounts. They are created when the first administrator completes the
first-run setup, when someone signs in through single sign-on for the first time (if the
identity provider settings allow sign-up, or an invitation is open for that email address), or by
product code that embeds Axentra. See [signing in](help:signing-in).

## Add a single sign-on user {#external-user}

For migrations and imports, platform administrators create accounts that sign in only through an
identity provider, with or without an email address.

1. Open [Users](app:users) and choose **Add single sign-on user**.
2. Enter the **Provider (issuer)**: the identity provider's issuer URL, exactly as the server's
   single sign-on settings name it. Studio suggests the configured providers.
3. Enter the **Subject**: the user's ID at the provider (the `sub` claim), not the email address.
4. Optionally enter a **Name** and an **Email address (optional)**. Tick **The provider verified
   this address** only if the provider confirmed that the address belongs to the user.
5. Choose **Add user**. Studio opens the new user's page.

The email address becomes the user's address only when it is verified; otherwise the user has no
address (see [users without an email address](help:users#no-email)). The new user has no password
and no memberships: add the user to tenants on the tenant's **Members** tab.

## The user page {#profile}

The **Profile** card shows:

| Field                         | Meaning                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| **Name**, **Email address**   | From the account. Users edit their own name on their profile.            |
| **Status**                    | **Active** or **Disabled**.                                              |
| **Language**                  | The user's interface language.                                           |
| **Platform role**             | **No platform role**, **Platform viewer** or **Platform administrator**. |
| **Password sign-in**          | **Password set**, or **No password (single sign-on only)**.              |
| **Last sign-in**, **Created** | Timestamps.                                                              |

### Memberships {#memberships}

The **Memberships** card lists what the user belongs to, as far as you may see it:

- **Product roles**: products where the user is an operator, with the role. Platform
  administrators and platform viewers see all of them; others see products where they hold
  `product_members:read`.
- **Tenant memberships**: tenants where the user is a member, with the product, the role and
  the tenant's status. Others see tenants where they hold `members:read`.

The card is read-only. To change what a user can do, open the tenant's **Members** tab (from the
tenant name) or, for operators, the product's **Members** tab.

### Users without an email address {#no-email}

Some accounts have no email address, for example when an identity provider did not confirm one
and the server allows such sign-ups. Studio then shows the user's ID instead of the address.
Such users:

- sign in only through single sign-on, never with a password;
- cannot accept invitations, because invitations are bound to an address;
- can still be added to tenants directly by someone who can see them (for example a platform
  administrator).

## Single sign-on identities {#identities}

The **Single sign-on identities** card on a user's page lists the accounts at identity providers
that sign in as this user, with the columns **Provider (issuer)**, **Subject**, **Email reported**
(the address the provider sent) and **Linked**. Axentra links an identity at the user's first single
sign-on, or when a platform administrator links it here.

> [!IMPORTANT]
> The card needs `users:manage`. Only platform administrators link and unlink identities.

### Link an identity {#link-identity}

1. Open the user's page and choose **Link identity** on the **Single sign-on identities** card.
2. Enter the **Provider (issuer)** and the **Subject**, then choose **Link identity**.

The user can then sign in with that account at the provider. An identity belongs to one user only:
**Conflict** means that it is already linked, to this or to another user.

### Unlink an identity {#unlink-identity}

1. On the **Single sign-on identities** card, choose the unlink button next to the identity.
2. Read the warning and choose **Unlink identity**.

All of the user's sessions end immediately, because a session does not record which identity started
it. The user's last way to sign in cannot be unlinked: when the user has no password and no other
identity, Studio shows **The user's last way to sign in**. Link another identity first, or [disable
the user](help:users#disable) instead.

## Sign a user out everywhere {#sign-out}

1. Open the user's page.
2. Choose **Sign out everywhere** and confirm.

All of the user's sessions end immediately, on every device. The user can sign in again. Use it
when a device was lost or a session might be compromised. **Active sessions** on the same page
lists each session with device, sign-in **Method**, **Last active** and **Expires**.

## Disable a user {#disable}

1. Open the user's page.
2. Choose **Disable user**.
3. Type the user's email address (or ID, for users without one) to confirm, and choose **Disable
   user**.

A disabled user cannot sign in, by password or single sign-on, and all of their sessions end
immediately. Memberships, platform role and audit history stay, so **Enable user** restores the
previous access.

> [!WARNING]
> API keys a user created stop working as soon as the user is disabled or loses the permissions the
> keys use: requests are refused with `api_key_creator_lost_access` (see [API
> keys](help:api-keys#creator-permissions)). The keys are not revoked and work again if the access
> comes back. When someone leaves, create replacement keys as someone who stays, switch the services
> over and revoke the old keys.

You cannot disable yourself, and the last active platform administrator cannot be disabled.

## Change a platform role {#platform-role}

Platform roles apply to **every product** on the server, independent of memberships.

| Platform role              | Meaning                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **No platform role**       | Access only through product and tenant memberships.                                                                                     |
| **Platform viewer**        | Read-only access to every product, including archived products and suspended tenants, the settings and the installation-wide audit log. |
| **Platform administrator** | Full control of the whole installation: all products and users, creating and archiving products, no role ceiling.                       |

1. Open the user's page. The **Platform role** card is shown to platform administrators only.
2. Choose the new **Platform role**.
3. Choose **Change platform role** and confirm. Granting **Platform administrator** requires
   typing the user's email address (or ID).

> [!CAUTION]
> A platform administrator can do everything on the server, including deleting tenants and
> creating keys in any product. Grant it to as few people as possible. The last platform
> administrator cannot lose the role.

## Troubleshooting {#troubleshooting}

**Not permitted on the Users screen.** You lack `product_users:read` in this product. Tenant
owners and members do not have it; they see their colleagues on the tenant's **Members** tab.

**No Disable user or Sign out everywhere buttons.** These need `users:manage`, which only
platform administrators hold.

**Conflict: "you cannot disable yourself".** Ask another platform administrator.

**Conflict: "the last platform admin cannot be disabled" / "the last platform admin cannot lose
the role".** Make another user platform administrator first.

**Not permitted: "only platform admins can change platform roles".** Ask a platform administrator.

**A user is missing from the list.** The user is neither an operator of this product nor a member
of one of its tenants. Add or invite them, see
[members and invitations](help:members-invitations).

**A disabled user still appears in tenants.** Disabling does not remove memberships. Remove them
on the tenant's **Members** tab if access should not come back when the user is enabled again.

**Conflict when adding a single sign-on user or linking an identity.** The identity is already
linked to a user, or the verified email address belongs to another user. Find that user, or check
the provider and subject.
