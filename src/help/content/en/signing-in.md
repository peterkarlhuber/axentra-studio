---
title: Signing in and out
summary: Sign in with a password or single sign-on, understand when a session ends, and fix sign-in problems.
keywords: login, log in, sign in, logout, log out, sign out, password, SSO, single sign-on, OIDC, OpenID Connect, identity provider, Keycloak, Entra ID, Google, session, expired, timeout, language, return, forgot password, reset password
related: first-run-setup, profile, interface, security, users, troubleshooting
---

Studio works with your personal account on the Axentra server. When you sign in, the server starts
a **session** for your browser; Studio then acts with your roles until the session ends. Depending on
the server's configuration you sign in with an email address and password, through **single
sign-on** with your organization's identity provider, or both.

## Sign in with email and password {#password}

1. Open Studio. If you are not signed in, the **Sign in** page appears.
2. Enter your **Email address** and **Password**.
3. Choose **Sign in**.

**Expected result:** Studio opens the page you came from, or the dashboard of the product you used
last. If you have no product yet, you land on **Products**.

The form is shown only when the server allows password sign-in. Accounts that were created through
single sign-on have no password and cannot use the form; you can set a password for such an
account in your [profile](help:profile), if the server allows it.

## Forgotten password {#forgotten-password}

1. On the **Sign in** page, choose **Forgot your password?** below the password field.
2. Enter the email address of your account and choose **Send reset link**.
3. Open the link in the email. On the page **Choose a new password**, enter the new password twice
   and choose **Save new password**.

**Expected result:** you are signed out everywhere, this browser included, and sign in with the new
password. The address now counts as verified, because the link reached it.

The page always says that a link is on its way: Studio and the server never reveal whether an
account exists for an address. No email arrives when there is no account, when the account is
disabled, when it signs in with single sign-on only (it has no password to reset), or when you asked
for a link less than a minute ago. The link works once, expires after a short time (30 minutes by
default) and only the newest link of an account works. A link that is invalid, expired or already
used shows **This link cannot be used**; request a new one. Changing your password in the
[profile](help:profile#password) also invalidates open reset links.

## Sign in with single sign-on {#sso}

If the operator has connected an identity provider (OpenID Connect, for example Keycloak,
Microsoft Entra ID, Google or Auth0), the sign-in page shows a button **Continue with …** for each
provider, below the password form and the word **or**.

1. Choose **Continue with** _your provider_.
2. Sign in at your identity provider as usual (including any multi-factor step it requires).
3. The provider sends you back to Studio, signed in.

Good to know:

- Multi-factor authentication is handled by your identity provider, not by Axentra.
- On your first single sign-on, Axentra links the login to an existing account with the same,
  **verified** email address, or creates a new account if the provider allows sign-up or if an
  open [invitation](help:members-invitations) exists for your address.
- A new account gets no access by itself. You see products and tenants only after someone gives
  you a role or you accept an invitation.

## Return to where you left off {#return-to}

When your session ends while you work, or when you open a link to a Studio page while signed out,
Studio sends you to the sign-in page and remembers the page. The sign-in page then says **Please
sign in to continue where you left off.** After signing in (with password or single sign-on) you are
back on that page, including its filters in the address.

For safety, Studio returns only to its own pages; any other target leads to the start page.

> [!WARNING]
> Unsaved input in an open form is lost when the session ends. For long edits, save in between.

## When a session ends {#session-end}

| The session ends …                                 | Default                                       |
| -------------------------------------------------- | --------------------------------------------- |
| After its maximum lifetime, even if you are active | 12 hours (`security.session_ttl_hours`)       |
| After a period without any request                 | 120 minutes (`security.session_idle_minutes`) |
| When you sign out                                  | Immediately                                   |
| When you or an administrator revoke it             | On the next request                           |
| When your account is disabled                      | Immediately, all sessions                     |
| When you change your password                      | All your **other** sessions                   |

The values are set by the server operator. Your active sessions (browsers and devices) are listed in
your [profile](help:profile), where you can also end them.

Some security-relevant actions need a **recent** sign-in. If the server answers **Please sign in
again**, Studio signs you out, and after signing in again you are back on the same page to repeat
the action.

> [!NOTE]
> Single sign-on only **starts** an Axentra session. Signing out of Studio does not sign you out at
> your identity provider, and being signed out or blocked at the provider does not end a running
> Axentra session; it ends at its normal expiry or when an administrator disables the account.

## Sign out {#sign-out}

1. Open the user menu at the top right (your initials and name).
2. Choose **Sign out**.

Studio ends the session on the server, forgets all loaded data and shows the sign-in page. On a
shared computer, always sign out.

## Choose the language before signing in {#language}

The sign-in page and the setup page have a language selector below the form. Your choice applies
immediately and is remembered in this browser. After you sign in, you can change the language in the
user menu (**Language**) or under **Settings**; then it is also saved in your account and follows
you to other browsers. See [the interface](help:interface#language).

## Settings {#settings}

These server settings affect signing in. Only the server operator can change them; Studio shows the
effective values under **Settings**.

| Setting                          | What it does                                                                               | Default |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------- |
| `security.password_login`        | Allows email and password sign-in. When off, only single sign-on is offered.               | on      |
| `security.login_rate_per_minute` | Failed sign-ins allowed per account and minute (per network address: three times as many). | 10      |
| `security.session_ttl_hours`     | Maximum session lifetime.                                                                  | 12      |
| `security.session_idle_minutes`  | Idle timeout.                                                                              | 120     |
| `[[oidc]]` providers             | Single sign-on providers shown as **Continue with …**.                                     | none    |

## Details for administrators {#details}

- The session lives in an `HttpOnly` cookie; Studio never stores tokens in browser storage. Changing
  requests also need a CSRF token, which Studio keeps in memory.
- Studio's address must be the server's `security.public_url` or be listed in
  `security.allowed_origins`; otherwise sign-in and changing requests are refused with `403`.
- Sign-ins, failed sign-ins (`identity.login` with outcome `denied`) and sign-outs are written to the
  [audit log](help:audit).
- Failed sign-ins are throttled per account. Anyone who knows an address can therefore block password
  sign-in for that account for up to a minute.
- Single sign-on uses the authorization code flow with PKCE. The redirect URI to register at the
  provider is `<public URL of the API>/v1/auth/oidc/<provider id>/callback`. Configuration:
  [server configuration](help:server-configuration).

## Single sign-on errors {#sso-errors}

When single sign-on fails, the server sends you back to the sign-in page, and Studio shows
**Single sign-on did not complete** with the reason:

| Reason (code)                                                 | What it means                                                                                                                       | What to do                                                                              |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Took too long or started in another browser (`login_expired`) | The sign-in must finish within 10 minutes in the same browser.                                                                      | Start again from the sign-in page.                                                      |
| Cancelled or refused (`access_denied`)                        | You cancelled at the provider, or consent was refused.                                                                              | Start again and confirm at the provider.                                                |
| Provider not reachable (`provider_unavailable`)               | Axentra could not reach or validate the provider.                                                                                   | Try later; the operator checks the provider configuration.                              |
| Answer could not be verified (`login_failed`)                 | The provider's token failed a check.                                                                                                | Try again; if it persists, the operator checks the server log.                          |
| Email not verified (`email_not_verified`)                     | The provider did not confirm your address as verified. Common with Microsoft Entra ID, which often sends no `email_verified` claim. | The operator configures the provider to send it.                                        |
| Domain not allowed (`domain_not_allowed`)                     | Your email domain is not on the provider's allow list.                                                                              | Use an account in an allowed domain.                                                    |
| No account (`signup_disabled`)                                | No account exists for you and sign-up is off.                                                                                       | Ask an administrator for an [invitation](help:members-invitations), then sign in again. |
| Account disabled (`account_disabled`)                         | Your account is disabled.                                                                                                           | Contact an administrator.                                                               |
| Too many attempts (`rate_limited`)                            | Too many sign-ins started from your network.                                                                                        | Wait a minute.                                                                          |
| Invitation not accepted here (`invitation_requires_post`)     | A single sign-on link carried an invitation token in its address, which the server refuses.                                         | Open the invitation link from your email again and sign in from the sign-in page.       |

## Troubleshooting {#troubleshooting}

| Message                                                            | Cause                                                                                                                                                             | What to do                                                                                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Sign-in failed** – "The email address or password is incorrect." | Wrong address or password, the account is disabled, or the account has no password (created through single sign-on). For security, the server does not say which. | Check the input; try single sign-on; ask an administrator to check the account on the [users](help:users) page. |
| **Too many requests**                                              | More than the allowed failed attempts within a minute (10 per account by default).                                                                                | Wait one minute and try again.                                                                                  |
| **No sign-in method available**                                    | The server has neither password sign-in nor single sign-on enabled.                                                                                               | The operator must configure authentication.                                                                     |
| Single sign-on returns with an error                               | See [single sign-on errors](help:signing-in#sso-errors).                                                                                                          |                                                                                                                 |
| You are sent to the sign-in page again and again                   | The browser blocks the session cookie.                                                                                                                            | Allow cookies for Studio's address; ask the operator to check the configuration.                                |
| **Not permitted** right when signing in                            | Studio's address is neither the server's public URL nor in `security.allowed_origins`.                                                                            | The operator adds Studio's address to `security.allowed_origins`.                                               |
| **Your session could not be checked**                              | The server could not be asked about your session (network or server error).                                                                                       | Choose **Try again**; check **System health** when signed in again.                                             |
| **Please sign in again**                                           | The action needs a recent sign-in.                                                                                                                                | Sign in again and repeat the action.                                                                            |
| After signing in you see no products                               | Your account has no role yet.                                                                                                                                     | Ask an administrator to add you or send an invitation.                                                          |
