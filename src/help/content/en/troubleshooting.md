---
title: Troubleshooting
summary: What Studio's error messages mean, why they appear and what to do, from startup problems to refused actions.
keywords: error, problem, failed, not working, request id, not permitted, forbidden, not found, conflict, 401, 403, 404, 409, 412, 413, 415, 422, 429, 500, cannot connect, incompatible version, session expired, module not enabled
related: faq, security, permissions-reference, modules-reference, limitations, signing-in
---

When the Axentra server refuses or cannot complete a request, Studio shows a translated message
that names what happened and what you can do. This page explains every message, the startup
screens you may see before Studio opens, and a few common situations. Each section has its own
link target, so screens can point you straight to the right explanation.

## How an error message is built {#error-message}

Every error in Studio has the same parts:

- **Title**: a short name for the problem, for example **Not permitted** or **Conflict**. It is
  chosen from the server's stable _error code_, so it is the same in every language.
- **Message**: what happened, the likely cause and what to do next.
- **Field errors**: when the server rejects individual values, Studio lists them under the
  affected form fields, or as a list of field names and reasons.
- **Technical details** (fold-out): the **HTTP status**, the **Error code**, the **Server
  message** (the server's own explanation, always in English) and the **Request ID**.

Failed actions (saving, deleting, sending) appear as a notification in the corner of the screen
with the same information. For **Not permitted** and **Conflict**, the notification adds the
server message, because it usually names exactly what is missing, for example
`missing permission tenants:update` or `a tenant with this slug exists in the product`.

### The request ID {#request-id}

Every answer from the server carries a request ID such as `req_01EXAMPLE…`. The server writes the
same ID into its logs and into the [audit log](help:audit). When you report a problem to your
operator or support, always include the request ID: it lets them find the exact request in
seconds.

> [!TIP]
> Open **Technical details** and copy the request ID before you close the message or retry.

## Error codes {#error-codes}

The table gives an overview. The sections below explain each code with causes and fixes.

| Title in Studio                     | Error code                        | HTTP status   | In short                                         |
| ----------------------------------- | --------------------------------- | ------------- | ------------------------------------------------ |
| **Please check your input**         | `validation_failed`               | 422 (or 400)  | Values were rejected                             |
| **Request not understood**          | `bad_request`                     | 400           | The request could not be read                    |
| **Please sign in**                  | `unauthenticated`                 | 401           | No valid session                                 |
| **Not permitted**                   | `forbidden`                       | 403           | Missing permission or inactive product or tenant |
| **Please sign in again**            | `reauthentication_required`       | 403           | Needs a recent sign-in                           |
| **Not found**                       | `not_found`                       | 404           | Does not exist, or not visible to you            |
| **Module not enabled**              | `module_disabled`                 | 404           | Server module switched off                       |
| **Conflict**                        | `conflict`                        | 409           | Clashes with existing data or state              |
| **Not available in this mode**      | `mode_not_supported`              | 409           | Not possible in this server mode                 |
| **Payment provider not configured** | `payment_provider_not_configured` | 409           | Billing needs a provider                         |
| **Changed in the meantime**         | `precondition_failed`             | 412           | Someone else saved first                         |
| **Too large**                       | `payload_too_large`               | 413           | Request or file too big                          |
| **Type not accepted**               | `unsupported_media_type`          | 415           | Blocked or unsupported content type              |
| **Too many requests**               | `rate_limited`                    | 429           | Slow down                                        |
| **Quota exceeded**                  | `quota_exceeded`                  | 429           | Tenant quota or plan limit used up               |
| **Server error**                    | `internal`                        | 500 and above | Server-side failure                              |
| **Server not reachable**            | `network_error`                   | none          | No answer from the server                        |
| **Unexpected error**                | `unknown`                         | other         | Not recognized                                   |

### Please check your input {#validation-failed}

**What happened:** the server checked the values you sent and rejected at least one of them
(`validation_failed`, HTTP 422).

**Typical causes:** a required field is empty, a value is too long, a key or slug contains
characters that are not allowed, a JSON field is not a JSON object, a permission name is unknown
or not allowed for this kind of role, a password does not meet the server's password policy.

**What to do:** read the messages under the fields or in the list below the title. When no
field is marked, open **Technical details**: the **Server message** names the rule, for example
`permissions not allowed for a tenant role: tenants:read`. Correct the value and submit again.

### Request not understood {#bad-request}

**What happened:** the server could not interpret the request at all (`bad_request`, HTTP 400),
for example because a value had the wrong format.

**What to do:** reload the page and repeat the action. If it happens again, report it with the
request ID; Studio normally sends only well-formed requests.

### Please sign in {#unauthenticated}

**What happened:** you are not signed in, or your session has ended (`unauthenticated`, HTTP 401).

**Typical causes:** a session ends after a maximum lifetime (default 12 hours), after a period
without activity (default 120 minutes), when you sign out, when you or an administrator revokes
it, when your account is disabled, and (for your other sessions) when you change your password.
The exact times are set by your operator.

**What to do:** Studio takes you to the sign-in page automatically and brings you back to the
page you were on afterwards. Unsaved form input is lost. See [Session ended](#session-ended).

### Not permitted {#forbidden}

**What happened:** the server knows you and the item, but refuses the action (`forbidden`,
HTTP 403).

**Typical causes:**

- **A permission is missing.** The server message says which one, for example
  `missing permission records:write`. See the [permissions reference](help:permissions-reference)
  for what each permission allows and which built-in roles hold it.
- **The product is archived or the tenant is suspended.** Then only platform administrators
  (full access) and platform viewers (read access) can still work in it; everyone else, including
  API keys, gets `the product or tenant is not active`. Product owners and admins can still open a
  suspended tenant's page and [reactivate](help:tenants#reactivate) it.
- **The role ceiling.** You tried to assign a role that has permissions you do not hold yourself,
  or an owner role without being an owner. See [role ceiling](help:security#role-ceiling).
- **API key permissions.** You tried to give a new key a permission you do not hold
  (`you cannot grant permissions you do not hold`).
- **Origin check.** The server refused a request because Studio runs at an address it does not
  trust (`cross-origin request refused`) or the security token was missing
  (`missing or invalid CSRF token`). See [Sign-in or saving fails with Not permitted](#csrf-origin).

**What to do:** ask an owner or administrator of the product or tenant to give you a role with
the missing permission, or to reactivate the product or tenant. Studio usually hides buttons for
actions you may not perform, but the server always has the final say.

### Please sign in again {#reauthentication-required}

**What happened:** the action is allowed only within a few minutes after signing in
(`reauthentication_required`, HTTP 403). Today this applies to setting a first password for an
account that so far signs in only through single sign-on.

**What to do:** choose **Sign in again**. Studio signs you out, opens the sign-in page and brings
you back to the same place; repeat the action right away (default window: 5 minutes). If your
operator has turned off first passwords, the action is never possible. See [Profile](help:profile).

### Not found {#not-found}

**What happened:** the server answers as if the item did not exist (`not_found`, HTTP 404).

**Typical causes:** the item was deleted, the address is mistyped or comes from another
installation, or you have no relation to the product or tenant. Axentra deliberately shows
**Not found** instead of **Not permitted** in that last case, so that nobody can find out which
products, tenants or accounts exist.

When you add an existing user as a member, **User not found** means that no account _you can
see_ has this address. Send an invitation instead (see [Members and invitations](help:members-invitations)).

**What to do:** check the address, go back to the list, or ask someone with access to the product
or tenant to add you.

### Module not enabled {#module-disabled}

**What happened:** the action needs a server module that is switched off (`module_disabled`).

**What to do:** ask your operator to enable the module in the server configuration. The
[modules reference](help:modules-reference) lists what each module powers.

### Conflict {#conflict}

**What happened:** the request clashes with existing data or with the current state of the item
(`conflict`, HTTP 409). The server message explains the clash; Studio shows it after the
translated text.

**Typical causes and fixes:**

| Server message (examples)                                                                                     | What to do                                                                     |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `a tenant with this slug exists in the product`, `a role with this key exists`, `a plan with this key exists` | Choose another slug or key. Slugs and keys are unique.                         |
| `an open invitation for this email exists`                                                                    | Use or revoke the open invitation first.                                       |
| `the tenant needs at least one owner`, `the product needs at least one owner`                                 | Give another person the owner role before you demote or remove the last owner. |
| `the role is assigned 3 times; reassign those members first`                                                  | Change those members to another role, then delete the role.                    |
| `subscriptions use this plan; deactivate it instead`, `the meter has recorded usage; deactivate it instead`   | Deactivate instead of deleting.                                                |
| `only failed or dead jobs can be retried`, `the job is already succeeded`                                     | The job is no longer in a state that allows the action; reload.                |
| `the delivery is already queued or in progress`                                                               | Wait for the running delivery to finish.                                       |

### Already used for a different request {#idempotency-conflict}

Some actions (enqueue a job, publish an event, send a notification, record usage) carry an
_idempotency key_ so that a repeated submission does not run twice. If the same key was already
used with other values, or by another caller, the server answers `409`. Studio shows **Already
used for a different request** and either generates a new key for you or offers **Use a new key**.
Submit again to create a new item. See the glossary entry
[idempotency key](help:glossary#idempotency-key).

### Not available in this mode {#mode-not-supported}

**What happened:** the server runs in a mode that does not support the action
(`mode_not_supported`).

**Typical causes:** creating or archiving products on a server in single-product mode, or
opening the local mailbox of notifications when the server does not use the local test mail
provider.

**What to do:** nothing in Studio; an operator would have to change the server configuration.
See [Products](help:products) and [server configuration](help:server-configuration).

### Payment provider not configured {#payment-provider-not-configured}

**What happened:** a billing action, such as a checkout for a paid plan, needs a payment
provider, and the server has none configured (`payment_provider_not_configured`).

**What to do:** ask your operator to configure the billing provider. See
[Plans and subscriptions](help:plans-subscriptions).

### Changed in the meantime {#precondition-failed}

**What happened:** you edited an item that someone else saved after you opened it
(`precondition_failed`, HTTP 412). Studio sends the version you started from; the server refuses
to overwrite the newer version, so nobody's change is silently lost.

**What to do:** reload the item, check the other person's change, and make your change again.

### Too large {#payload-too-large}

**What happened:** the request or file is bigger than the server accepts (`payload_too_large`,
HTTP 413).

**Typical limits:** request bodies 10 MiB by default (set by the operator), a record at most
256 KiB of JSON, and files up to the server's maximum file size. The server message names the
limit, for example `files may be at most 10485760 bytes`. (Job payloads and event data, at most
64 KB each, are refused with **Please check your input** instead.)

**What to do:** use a smaller file or less data, or ask your operator about the limit. See
[Files](help:files) and [Records](help:records).

### Type not accepted {#unsupported-media-type}

**What happened:** the server does not accept the content type (`unsupported_media_type`, HTTP
415). Most often a file upload was blocked: executables, HTML, SVG and script files are blocked by
type, file name extension and content.

**What to do:** upload a different file type, or pack the file in an archive if your product
allows that. A product can be configured to store blocked files as inert attachments instead of
refusing them. See [Files](help:files).

### Too many requests {#rate-limited}

**What happened:** too many requests in a short time (`rate_limited`, HTTP 429).

**Typical causes:** too many failed sign-in attempts for one account or from one network address
(default: 10 failed attempts per account per minute), or a general request limit your operator
has switched on.

**What to do:** wait about a minute, then try again. If you keep hitting the limit while
signing in, check the email address and password, or use single sign-on if available.

### Quota exceeded {#quota-exceeded}

**What happened:** a quota or plan limit is used up (`quota_exceeded`, HTTP 429), for example the
tenant's storage quota (bytes or number of files) or a usage quota.

**What to do:** delete files or wait for the next usage period, or ask someone with
`tenants:update` (storage quota), `usage:manage` (usage quotas) or `billing:manage` (plans) to
raise the limit. See [Usage](help:usage) and [Files](help:files).

### Server error {#internal}

**What happened:** the server, or a service behind it, failed while handling the request
(`internal`, HTTP 500 or above). For security reasons the server never shows internal details;
the request ID connects your report to the server's log entry. A `502`, `503` or `504` from a
reverse proxy in front of the server also appears as **Server error**.

**What to do:** try again after a moment. Your change may not have been saved, so check before
repeating destructive actions. If it keeps failing, report it to your operator with the request
ID and the time.

### Server not reachable {#network-error}

**What happened:** Studio got no answer at all (`network_error`): the connection failed or was
interrupted.

**What to do:** check your network connection and VPN. If other sites work, the Axentra server may
be down or restarting; check [System health](help:health-monitoring) once it answers again, or
ask your operator.

### Unexpected error {#unknown}

**What happened:** the server answered with an error Studio does not recognize (`unknown`).

**What to do:** try again. If it keeps happening, report it with the request ID, the **Error
code** and the **Server message** from **Technical details**.

## Messages at startup {#startup}

Before Studio shows anything, it loads the server information, checks the API version and then
your session. Problems in this phase fill the whole screen.

### Connecting to the Axentra server… {#connecting}

This is the normal start screen. If it stays for a long time, the server is slow to answer or
not reachable; Studio then shows [Cannot connect to Axentra](#api-unreachable).

### Cannot connect to Axentra {#api-unreachable}

Studio could not load the server information (`GET /v1/meta`). Below the explanation you see the
error title and, if the server answered, the request ID.

- **Server not reachable**: the server is down, restarting or blocked by the network.
- **Server error** or **Not found**: Studio reaches _something_, but not the Axentra API, for
  example a reverse proxy that does not forward `/v1`, or a wrong API address in Studio's
  configuration file (`/config.json`, setting `apiBaseUrl`).

**What to do:** choose **Try again**. If it persists, an operator should check that the server is
running and that Studio points to the right API address (see
[server configuration](help:server-configuration)).

### Incompatible server version {#incompatible-version}

Studio and the server speak different versions of the Axentra API. The screen shows the
**Server API version**, the **Required API version**, the **Server** version and the **Studio
version**, and one of these reasons:

- **Different major version**: Studio and server are from different generations.
- **Server too old**: the server is older than this Studio requires. Update the server, or use
  an older Studio.
- **Unreadable version**: the server reported a version Studio cannot interpret.

**What to do:** use a Studio release that matches the server's API version, or update the server.
Studio checks the version only when the page loads: after a server update, reload the page.

### Set up Axentra {#setup-required}

A fresh server has no platform administrator yet. Studio then opens **Set up Axentra** instead of
the sign-in page. You need a one-time setup token that an operator prints on the server. See
[First-run setup](help:first-run-setup).

### Your session could not be checked {#session-check-failed}

Studio asked the server whether you are signed in and got an error instead of an answer (for
example **Server error** or **Server not reachable**). Choose **Try again**. This is not the same
as an ended session.

### Session ended {#session-ended}

When any request returns **Please sign in**, Studio opens the sign-in page with the note
**Please sign in to continue where you left off.** After signing in you return to the same page.
See [Signing in](help:signing-in).

### Module not enabled on this server {#module-not-enabled}

You opened an area whose server module is switched off. The page names the module id an operator
has to enable (for example `storage` or `billing`). In the sidebar such areas carry the label
**Off**. See the [modules reference](help:modules-reference).

### Not yet available in Studio {#not-in-studio}

The module is enabled on the server, but this Studio release has no screens for it. Use the API
directly or a newer Studio release.

### Page not found {#page-not-found}

The address does not match any Studio page: it may be mistyped, or the item was moved or deleted.
Choose **Go to start page**.

### Something went wrong {#something-went-wrong}

The page could not be displayed, often because a newer Studio version was deployed while your tab
was open. Choose **Reload page**. If the problem remains, report it with the address of the page.

## Common situations {#situations}

### An area shows Off in the sidebar {#menu-item-off}

The server module behind it is switched off. The area still opens and tells you which module to
enable. Areas that need a product (most of them) appear only after you pick a product.

### A button or tab is missing {#action-missing}

Studio hides actions and tabs your permissions do not allow, for example **New tenant** without
`tenants:create` or the **Members** tab without `members:read`. Look up the permission in the
[permissions reference](help:permissions-reference) and ask for a suitable role. Some actions are
also hidden because of the server mode (for example **New product** in single-product mode).

### A page shows Not permitted although you can open it {#page-forbidden}

The sidebar shows every area; whether you may read its data is decided when the page loads. An
area without the read permission shows **Not permitted** with the missing permission in the
server message.

### Sign-in or saving fails with Not permitted {#csrf-origin}

If sign-in or every change fails with **Not permitted** and the server message says
`cross-origin request refused` or `missing or invalid CSRF token`, Studio runs at an address the
server does not trust, or your browser blocks the session cookie. An operator has to add Studio's
address to the server's allowed origins. When Studio and the API run on different addresses, both
must belong to the same site (for example `studio.example.com` and `api.example.com`). See
[Security](help:security#sessions-csrf).

### Sign-in fails {#sign-in-fails}

**Sign-in failed** with "The email address or password is incorrect" appears for a wrong
password _and_ for an unknown address; the server does not reveal which. After too many attempts
you see [Too many requests](#rate-limited). A disabled account cannot sign in at all. See
[Signing in](help:signing-in).

### A one-time secret was lost {#secret-lost}

API key secrets, webhook signing secrets and invitation links are shown only once and cannot be
displayed again. Rotate the secret or create a new invitation. See [API keys](help:api-keys),
[Webhooks](help:webhooks) and [Members and invitations](help:members-invitations).

### Feature-specific problems {#feature-problems}

Each feature article has its own troubleshooting section, for example for jobs that stay pending,
webhook deliveries that fail, uploads that are rejected or invitations that do not arrive:
[Jobs](help:jobs), [Schedules](help:schedules), [Webhooks](help:webhooks), [Files](help:files),
[Notifications](help:notifications), [Plans and subscriptions](help:plans-subscriptions).
