---
title: Your profile
summary: See your account and memberships, change your display name and password, and sign out browsers you no longer use.
keywords: profile, account, my account, display name, name, password, change password, set password, sessions, devices, sign out, log out everywhere, single sign-on, SSO
related: settings, signing-in, security, users, roles-permissions
---

Your **Profile** is where you manage your own account: the name others see, your password and the
browsers where you are signed in. It also shows which products you belong to and with which role.
Every signed-in user has a profile; no permission is needed.

Open it from the user menu at the top right with **Profile** ([open](app:profile)). Language and
theme are on the [Settings](help:settings#preferences) page and in the same user menu.

## Check your account {#account}

The **Account** card shows:

| Field             | Meaning                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- |
| **Email address** | The address you sign in with. You cannot change it yourself                                   |
| **User ID**       | Your ID (`usr_…`), for example to filter the [audit log](help:audit#filter) by **Actor ID**   |
| **Platform role** | `platform_admin` or `platform_viewer` if you have one, otherwise **None**                     |
| **Products**      | Each product you belong to, with your product role (for example **Acme CRM · product_admin**) |

Tenant memberships are not listed here; they are on the tenant pages. To get a different role,
ask a product owner or a platform administrator; see
[Roles and permissions](help:roles-permissions).

## Change your display name {#name}

1. In **Display name**, change **Name** (up to 200 characters).
2. Choose **Save changes**. The button is active only when the name differs from the saved one.

The name appears in the user menu, in member lists and as the **Actor** of your actions in the
audit log. Past audit events keep the name you had when they were recorded.

## Change your password {#password}

1. In **Change password**, enter your **Current password**.
2. Enter the **New password** twice (**Repeat new password**).
3. Choose **Change password**.

> [!WARNING]
> Changing the password **signs you out on every other browser and device** at once. The browser
> you are using stays signed in. Use this when you suspect someone else knows your password.

The new password must

- be at least as long as the server's minimum (default 12 characters, see
  `password_min_length` in [Settings](help:settings#settings-tree)) and at most 1024 characters,
- not be your email address,
- contain at least 4 different characters.

### Set a first password (single sign-on users) {#set-password}

If you have only ever signed in through single sign-on, the card is called **Set a password** and
has no **Current password** field. A password lets you also sign in with email and password.

For your security, a first password can only be set **shortly after you signed in** (default:
within 5 minutes; the operator sets this with `security.fresh_login_minutes`). If your sign-in is
older, Studio shows **Please sign in again**:

1. Choose **Sign in again**. Studio signs you out and opens the sign-in page.
2. Sign in. You come back to your profile.
3. Within the next few minutes, enter the **New password** twice and choose **Set password**.

> [!NOTE]
> The operator can switch this off (`security.first_password = "disabled"`). Then users who sign
> in through single sign-on cannot set a password at all, and the server refuses with
> **Not permitted**.

## See where you are signed in {#sessions}

**Your sessions** lists every browser or device with an active session:

| Column             | Meaning                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Device**         | Browser and operating system (from the browser's user agent) and the IP address. **This session** marks the browser you are using |
| **Sign-in method** | `password`, or `oidc:<provider>` for single sign-on                                                                               |
| **Last active**    | The last request of that session                                                                                                  |
| **Expires**        | When the session ends at the latest                                                                                               |

A session ends when it reaches its maximum lifetime (default 12 hours), after a period without
activity (default 120 minutes), when you sign out, when it is revoked, when you change your
password (all other sessions) or when an administrator disables your account.

### Sign out a browser you no longer use {#revoke-session}

1. Find the browser in **Your sessions**.
2. Choose **Revoke session** (the bin icon at the end of the row).

That browser is signed out with its next request. Your current session has no revoke button; use
**Sign out** in the user menu for it.

### Sign out everywhere else {#sign-out-elsewhere}

To end all sessions except the one you are using, choose **Sign out all other sessions** in the header of
**Your sessions**. The button appears when at least one other session exists.

> [!TIP]
> Signed in on a shared or lost computer? Revoke that session here. If you think your password is
> known to someone else, change it: that also signs out every other session.

Administrators can end the sessions of other users on the [Users](help:users) page.

## Troubleshooting {#troubleshooting}

- **Not permitted** after **Change password**: the **Current password** is wrong. The server
  records the attempt as **Denied** in the audit log.
- **Please check your input**: the new password breaks one of the rules above (too short, equal to
  your email address, too simple). **Technical details** in the message show the server's reason,
  for example "the password must have at least 12 characters".
- **The new passwords do not match.**: **New password** and **Repeat new password** differ.
- **Please sign in again** when setting a first password: your sign-in is too old. Follow the
  steps in [Set a first password](#set-password).
- **Not permitted** when setting a first password: the server does not allow passwords for
  single sign-on users, or your account has no email address. Keep signing in through single
  sign-on.
- You were signed out unexpectedly: your session expired, was idle too long, or was revoked
  (for example because you changed your password elsewhere). Sign in again; Studio brings you
  back to the page you were on.
