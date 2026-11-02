---
title: Security
summary: How Axentra and Studio protect sign-ins, separate tenants, limit what people can grant, and handle secrets, and what you can do to keep your installation safe.
keywords: security, session, cookie, CSRF, row-level security, RLS, tenant isolation, role ceiling, secret, API key, rotation, webhook signature, HMAC, audit, privacy, GDPR, password
related: permissions-reference, roles-permissions, api-keys, webhooks, audit, profile
---

Axentra is built so that a mistake in one place does not open everything: access is denied
unless a role grants it, each tenant's data is separated in the database, people cannot hand out
more rights than they hold, and secrets are shown once and then stored only in a form that cannot
be read back. This page explains these protections in plain words, what you see of them in
Studio, and the habits that keep an installation safe.

> [!NOTE]
> Studio is only a window onto the Axentra server. Every decision (who may see or change what) is
> made by the server. Studio hides buttons you cannot use, but hiding is a convenience, not the
> protection.

## Sessions and CSRF protection {#sessions-csrf}

### Your session {#sessions}

When you sign in, the server creates a _session_ and your browser receives a session cookie.
The cookie is marked so that scripts on a page cannot read it, and on HTTPS it is sent only over
encrypted connections. The server stores only a fingerprint (hash) of the session token, never
the token itself. A new token is created at every sign-in.

A session ends:

- after its maximum lifetime (default 12 hours),
- after a period without activity (default 120 minutes),
- when you choose **Sign out** in the user menu,
- when you revoke it under **Your sessions** in your [profile](help:profile), or an administrator
  uses **Sign out everywhere** on your user page,
- when your account is disabled,
- for all your _other_ sessions, when you change your password.

Your operator can change the lifetimes. When a session ends, Studio takes you to the sign-in page
and back to where you were afterwards (see [Session ended](help:troubleshooting#session-ended)).

### CSRF protection {#csrf}

_Cross-site request forgery_ (CSRF) is an attack in which another website tries to make your
browser send a change to Axentra while you are signed in. Axentra blocks it in three ways, and
you do not have to do anything:

1. The session cookie is not sent along with requests that other sites trigger in the
   background (`SameSite=Lax`).
2. Every change Studio sends carries a security token that belongs to your session. Studio keeps
   this token only in memory, never in browser storage.
3. The server checks that the request comes from an address it trusts (Studio's address must be
   in the server's list of allowed origins).

If Studio runs at an address the server does not trust, sign-in and every change fail with
**Not permitted**; see [Sign-in or saving fails](help:troubleshooting#csrf-origin).

### Passwords and sign-in attempts {#passwords}

Passwords are stored with Argon2id, a slow one-way hash. The server's policy requires at least 12
characters by default. A failed sign-in always says the email address _or_ password is wrong, so
nobody can find out which accounts exist. After about 10 failed attempts for one account within a
minute (more from one network address), further attempts are refused for up to a minute.

Setting a _first_ password on an account that signs in only through single sign-on is allowed
only within a few minutes of signing in, so a stolen session cannot be turned into a permanent
password login (see [Please sign in again](help:troubleshooting#reauthentication-required)).

## Tenant isolation {#tenant-isolation}

Each customer or organization in a product is a [tenant](help:tenants). Axentra keeps tenants
apart in two independent layers:

1. **Permission checks.** Before any data is read or written, the server checks that you (or the
   API key) have the required permission for exactly this product and tenant.
2. **Row-level security in the database.** Every database transaction is limited to one product
   or one tenant. Even if a query forgot a filter, the database itself returns only rows of that
   product or tenant and refuses to write rows for another one.

What this means for you:

- A tenant member sees only the data of their own tenant. People who are not related to a
  product or tenant get **Not found**, exactly as if it did not exist.
- A role at product level (for example **Product admin**) works in _every_ tenant of the product.
  Give product roles only to people who really need that reach.
- An API key belongs to one product and can be restricted to one tenant.
- User accounts are global: one account can work in several products and tenants. Product admins
  see only the users related to their product.

> [!NOTE]
> Database administrators, and backups of the database, can see all data. Protecting the
> database server and its backups is the operator's job.

## Role ceiling: nobody can grant more than they hold {#role-ceiling}

Being allowed to manage members (`members:manage`, or `product_members:manage` for product
operators) does not mean you can make anyone an administrator. The server enforces a _role
ceiling_:

- You can assign a role (add, invite or change a member) only if **you hold every permission of
  that role** in the same scope.
- You can change or remove a member only if their _current_ role is also within your
  permissions.
- The owner roles (**Owner** of a tenant, **Product owner** of a product) can be assigned,
  changed or removed only by an owner of the same scope, or by someone with authority from
  above: product operators for tenants, platform administrators everywhere.
- The last owner of a product or tenant cannot be removed or demoted, and the last platform
  administrator cannot be disabled or demoted.

In Studio, roles you cannot assign appear as **"… (above your permissions)"** and cannot be
selected; members above your level show **Above your own role: only someone with this role's
permissions can change it**. The same principle applies to API keys: a new key can hold only
permissions its creator holds. Platform permissions are never granted to API keys.

Details and examples: [Roles and permissions](help:roles-permissions) and the
[permissions reference](help:permissions-reference).

## One-time secrets {#one-time-secrets}

Some values are secrets that let a machine or person act on your behalf. Axentra shows each of
them **exactly once**:

| Secret                             | When it is shown                                  | How the server keeps it                    |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| API key secret (`axk_…`)           | After creating or rotating a key                  | Only a hash; it cannot be shown again      |
| Webhook signing secret (`whsec_…`) | After creating a webhook or rotating its secret   | Encrypted (AES-256-GCM), used only to sign |
| Invitation link and token          | After creating an invitation                      | Only a hash of the token                   |
| Setup token                        | Printed on the server for the first administrator | Only a hash; valid for a limited time      |

In Studio, API key and webhook secrets appear in a dialog with a warning, a masked field and copy
buttons. The dialog cannot be closed with Escape or by clicking outside; you confirm with **I have
stored the secret securely**. Invitation links and tokens are shown in a box marked **Shown only
once**.

If a secret is lost, it cannot be recovered: [rotate the API key](help:api-keys), rotate the
[webhook secret](help:webhooks) or create a new invitation.

## API key hygiene {#api-key-hygiene}

[API keys](help:api-keys) let other systems call the Axentra API. Good practice:

- **One key per service and environment**, named after where it is used (for example
  "billing-worker production"), so you can revoke one without breaking others.
- **Least privilege:** grant only the permissions the service needs, and restrict the key to one
  tenant when the service works for one tenant only.
- **Store secrets in a secret manager**, never in source code, tickets or chat.
- **Rotate regularly** with **Rotate secret**. A grace period (up to 7 days) keeps the old secret
  working while you update the services.
- **Revoke keys you no longer need.** Revoking a key also revokes every key that was created with
  it. Keys created by a person belong to the product, not to the person: when someone leaves,
  check and revoke the keys they set up.
- Watch the **Last used** column: a key that is never used can go; a key used unexpectedly
  deserves a look in the [audit log](help:audit).

## Webhook signatures {#webhook-signing}

Axentra signs every [webhook](help:webhooks) request so the receiving system can check that it
really comes from your Axentra server and was not changed or replayed. Each request carries an
`Axentra-Signature` header:

```text
Axentra-Signature: t=1767225600,v1=5f2b…
```

`t` is the time of signing (Unix seconds); `v1` is an HMAC-SHA256 of `<t>.<raw request body>`
computed with the webhook's signing secret. During a secret rotation with a grace period, the
header carries two `v1` values, one per secret. The receiver should:

1. compute the HMAC over the timestamp, a dot and the raw body,
2. compare it with every `v1` value in constant time,
3. reject requests whose timestamp is older than about 5 minutes,
4. ignore events whose id (`Axentra-Event-Id`) it has already processed.

The [webhook receiver tutorial](help:tutorial-webhook-receiver) walks through a complete example.

## Audit trail {#audit-trail}

The server records security-relevant changes in an append-only [audit log](help:audit): who
(user or API key), what (for example `access.role.create`), when, on which product and tenant,
the outcome, the request ID, the IP address and the browser or client. Secrets are removed from
the recorded details before storing.

Product operators with `audit:read` see the events of their product; platform administrators and
viewers (`platform:audit`) see installation-wide events such as sign-ins and user changes. Audit
events are kept for a period your operator sets (default 365 days).

## What Studio never stores {#what-studio-never-stores}

- **No secrets in the browser.** The CSRF token and a monitoring token you enter are kept only in
  memory and disappear when you close or reload the tab. One-time secrets are displayed, never
  saved.
- **Only harmless preferences in browser storage:** language, theme, the collapsed sidebar and
  the last product you used.
- **No card or bank details.** Studio never asks for payment data; payments happen only on the
  payment provider's hosted page (see [Plans and subscriptions](help:plans-subscriptions)).
- **No third-party scripts.** Studio loads its code only from its own address. Email previews are
  displayed in a sandbox that cannot run scripts.

The server also removes passwords, tokens and keys from its logs, error messages and audit
details.

## Good practice {#good-practice}

- Give platform roles sparingly; prefer product and tenant roles.
- Use the built-in roles where they fit, and custom roles with only the permissions needed.
- Disable the accounts of people who leave (**Disable user** ends all their sessions at once) and
  review the API keys they created.
- Review the [audit log](help:audit) regularly, especially role, key and member changes.
- Sign out on shared computers, and revoke sessions you do not recognize in your
  [profile](help:profile).

> [!IMPORTANT]
> Axentra provides technical measures (tenant separation, encryption of stored secrets, audit
> trail, data minimization in logs), but it does not by itself make an installation compliant
> with data protection law such as the GDPR. Hosting, backups, retention and data subject requests
> are the operator's responsibility. There is no built-in export or erasure of a person's data
> yet (see [limitations](help:limitations)).

## Troubleshooting {#troubleshooting}

| Situation                                                                                                             | Cause and fix                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in and all changes fail with **Not permitted** (`cross-origin request refused`, `missing or invalid CSRF token`) | Studio's address is not in the server's allowed origins, or the cookie is blocked. See [the troubleshooting entry](help:troubleshooting#csrf-origin). |
| You are signed out unexpectedly                                                                                       | The session expired, was revoked, or your password was changed in another session. Sign in again.                                                     |
| **Not permitted** when assigning a role                                                                               | Role ceiling: the role holds permissions you do not hold, or it is an owner role. Ask an owner.                                                       |
| **Not permitted** when creating an API key                                                                            | You tried to grant a permission you do not hold yourself. Remove it from the selection.                                                               |
| **Please sign in again** when setting a password                                                                      | Allowed only shortly after sign-in. Choose **Sign in again**, then repeat at once.                                                                    |
| A receiver rejects webhook signatures                                                                                 | It must sign the _raw_ body, accept any `v1` value and use the current secret. See [Webhooks](help:webhooks).                                         |
| You lost a secret                                                                                                     | It cannot be shown again; rotate it or create a new invitation.                                                                                       |
