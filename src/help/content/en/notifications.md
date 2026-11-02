---
title: Notifications
summary: Write email templates in several languages, preview and test them, follow delivery in the message log and set your own notification preferences.
keywords: notification, email, e-mail, mail, template, message, outbox, delivery, SMTP, preview, test send, mailbox, opt-out, unsubscribe, preferences, locale, language, translation
related: members-invitations, server-configuration, profile, tenants, limitations
---

Axentra sends emails from **templates**. A template has a key, a category and one **variant**
per language with a subject, a text body and an optional HTML body. Your product (or Axentra itself,
for invitations) sends a template to a recipient with values for its placeholders; Axentra renders
it, stores the message in an outbox and delivers it in the background. In Studio you write and
preview templates, send test messages, check the delivery status and choose which notifications you
receive yourself.

> [!IMPORTANT]
> The **Notifications** screen needs the `notify` module on the server; without it, the entry is
> not shown in the navigation (and invitations send no email). Templates, the message log, the
> mailbox and the statistics need the product permission `notify:manage`. Sending a test also needs
> `notify:send` in the tenant. Everyone who belongs to the product can set their own preferences.

## The Notifications screen {#overview}

Open [Notifications](app:notifications). With `notify:manage` you see **Delivery statistics** and
the tabs **Templates**, **Message log**, **Mailbox** and **My preferences**. Without it you see only
**My preferences**.

**Delivery statistics** count the messages of this product by status, in total and for the
**Last 24 hours**, and show the **Delivery provider**, the **Delivery attempts (24 h)** and the
**Oldest queued message**. The card refreshes every 30 seconds. An old queued message usually means
that no dispatcher is running (see [Troubleshooting](help:notifications#troubleshooting)).

## Templates {#templates}

The **Templates** tab lists your templates and the **Built-in** defaults with category, languages
and version. Badges:

- **Built-in**: a default that ships with Axentra (currently `invitation`, in English and
  German). Open it and save to create your own version with the same key, which replaces the
  default for this product. Deleting your version restores the default.
- **Sensitive**: the content of sent messages is never shown and is erased once sent.
- **System only**: Axentra sends this template itself (the invitation email with its one-time
  accept link). You can change its content, but it cannot be sent manually or as a test.

### Create a template {#create-template}

1. Choose **New template**.
2. Under **General**, enter the **Template key**, for example `welcome`. Your product sends the
   template by this key; it cannot be changed later.
3. Optional: **Name** and **Description** for Studio.
4. Enter the **Category**, for example `onboarding` (see [Categories](help:notifications#categories)).
5. Turn on **Sensitive** for content such as one-time links or codes.
6. Under **Variables and sample values**, declare every placeholder and give a sample value for the
   preview (see [Placeholders](help:notifications#placeholders)).
7. Under **Content per language**, fill **Subject** and **Text** for `en`, and optionally **HTML**.
8. Add more languages (see [Languages](help:notifications#locale-variants)).
9. Choose **Create template**.

Each later save increases the version (**Save new version**). Older versions are not kept: the
message log stores the rendered content and the version number of every message, not the old
template.

### Template settings {#template-settings}

| Setting                  | What it does                                                           | Allowed values / default                                                                                   |
| ------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Template key**         | Identifier used when sending                                           | 2 to 63 characters: lowercase letters, digits, `_`, `.` and `-`, starting with a letter; cannot be changed |
| **Category**             | Groups templates for opt-outs                                          | 2 to 41 lowercase letters, digits and `_`, starting with a letter; default `transactional`                 |
| **Channel**              | Delivery channel                                                       | **Email** only                                                                                             |
| **Sensitive**            | Content of sent messages is never returned and is erased after sending | Off                                                                                                        |
| **Variables**            | Placeholders the template may use                                      | At most 50; letters, digits and `_`, not starting with a digit                                             |
| **Content per language** | Subject, text and optional HTML per language                           | 1 to 20 languages; `en` is required                                                                        |

### Placeholders {#placeholders}

Write placeholders as `{{ name }}` in the subject, text or HTML. Only plain placeholders are
supported: no conditions, loops, filters or expressions, and anything else that starts with `{{`
is refused when you save. Every placeholder must be declared as a variable; if the text uses
undeclared ones, Studio offers **Declare used placeholders**.

When a message is sent, every placeholder needs a value (string, number or true/false, at most
10 000 characters). Values are inserted as they are into the text body; in the HTML body they are
HTML-escaped. Subjects never contain line breaks.

> [!WARNING]
> A value used inside a link (`href`) controls the link target. Keep links in the template or let
> your backend build them; do not let end users supply them.

### Categories {#categories}

Recipients can opt out of categories in their preferences. `transactional` and `security` are
always delivered and cannot be opted out of. Use them only for messages a user must get, such as
password resets or receipts. Studio suggests `transactional`, `security`, `onboarding` and
`product`; you can enter any valid category.

### Languages and fallback {#locale-variants}

Each language is a **variant**. To add one, type a language code such as `de` or `de-at` in
**Add language** and choose **Add**; **Remove language …** removes it. English (`en`) is required.

Axentra picks the variant in this order: the requested language (for example `de-at`), then its
base language (`de`), then `en`. The requested language is the one chosen when sending, otherwise
the recipient user's language, otherwise (for invitations) the product's default language,
otherwise English.

## Preview {#preview}

The **Preview** next to the editor is rendered by the server from the current, unsaved state with
your sample values, a moment after you stop typing. Choose the language in the preview's selector;
"Rendered in language …" tells you which variant was used. The preview appears once every language
has a subject and a text.

HTML is shown in an isolated frame: scripts never run, and remote images, fonts and styles are not
loaded. Recipients' email programs may show the message differently.

## Send a test {#send-test}

**Send test** (in the editor, or the send icon in the template list) sends a **real** notification:

1. Choose the **Tenant**. The message belongs to this tenant; you need `notify:send` there.
2. Choose the recipient:
   - **A member of the tenant**: choose the **Member**. Their language is used unless you choose one.
   - **An email address**: only with the product permission `notify:send_external` (product owners
     and admins). Without it Studio explains that you can send to members only.
3. Optional: choose a **Language**; without a choice the recipient's language is used, otherwise
   English.
4. Adjust the **Values** (prefilled with the sample values).
5. Optional: **Preview** shows the result with these values. Then choose **Send**.

Studio confirms **Notification accepted** with the message id and status. Delivery happens
asynchronously; follow it in the **Message log**. Each dialog sends with its own idempotency key,
so a repeated click after a network error does not send twice.

If the recipient opted out of the template's category, the message is accepted with the status
**Suppressed** and not delivered.

## Message log {#message-log}

The **Message log** is the outbox: every notification of the product with time, template (key,
version and language), **Recipient**, **Status**, **Attempts** and **Last error**. Filter by
**Status**, **Template key**, **Recipient** and **Tenant**, then choose **Apply**; **Reset filters**
clears them. The details icon opens all fields and, where available, the content.

| Status         | Meaning                                                                             |
| -------------- | ----------------------------------------------------------------------------------- |
| **Queued**     | Waiting for the dispatcher; **Next attempt** shows when                             |
| **Sending**    | A dispatcher is delivering it                                                       |
| **Sent**       | The provider accepted it                                                            |
| **Failed**     | Permanent error, or all attempts used up                                            |
| **Suppressed** | Not sent: the recipient opted out of the category, or the user has no email address |

A failed delivery is retried automatically with growing waiting times, by default up to 5 attempts.
**Retry delivery** puts a **Failed** message back into the queue with fresh attempts. It is not
possible after the content was erased by retention; send the notification again instead.

The content may be missing: sensitive templates never show it, retention erases it (by default 30
days after delivery), and suppressed messages store none. Studio says which case applies. The last
error has tokens, keys and passwords removed by the server.

> [!NOTE]
> Delivery is at least once: after a crash a message can be delivered twice. Messages carry a
> stable Message-ID, so mail servers can recognize duplicates. The order of messages is not
> guaranteed.

## Mailbox {#mailbox}

The **Mailbox** exists only when the server uses the local development provider
(`notify.provider = "local"`). That provider sends nothing; it stores what it "delivered" here, so
you can check templates on development and test servers. Filter by **Recipient** and open a message
to see it as delivered.

With a real provider (SMTP), the tab says **No local mailbox on this server**: messages go to real
recipients, and you follow them in the **Message log**.

## My preferences {#preferences}

On **My preferences** you choose which categories you receive from this product:

1. In **Applies to**, choose **The whole product** or one tenant.
2. Under **Receive these categories**, clear the categories you do not want. Locked categories
   (`transactional`, `security`) are always delivered.
3. Choose **Save preferences**.

Preferences apply to messages sent from now on, to you as a user and to your email address.
A category you turn off for the whole product stays off in every tenant; a tenant setting can turn
off more, not turn categories back on. Categories appear once the product has templates in them.
Setting preferences for a tenant needs `notify:preferences` there (members and admins have it).

## For administrators and developers {#developers}

- **Sending from your product**: `POST /v1/products/{product_id}/tenants/{tenant_id}/notify/send`
  with `template_key`, `to` (`{"user_id": …}` or `{"email": …}`), `variables` and optional `locale`,
  plus an `Idempotency-Key` header. It needs `notify:send` in the tenant; free addresses outside
  the tenant's members also need `notify:send_external`. See [API basics](help:api-basics).
- **Dispatcher**: messages are delivered only while a dispatcher runs (`axentra notify-dispatch
--loop` or a worker). Without it, messages stay **Queued**.
- **Providers and settings** (`[notify]`): `provider` (`local` or `smtp`), `sender`, SMTP host,
  port, credentials and STARTTLS, `max_attempts` (default 5), backoff, `content_retention_days`
  (default 30) and `message_retention_days` (default 180). See
  [Server configuration](help:server-configuration).
- **Privacy**: subjects and bodies are encrypted at rest. Recipient addresses are personal data and
  are visible to people with `notify:manage`; they are deleted with the message after the message
  retention.
- **Invitations**: when a tenant invitation is created, Axentra sends the `invitation` template
  with the accept link. See [Members and invitations](help:members-invitations).

## Good to know {#good-to-know}

- Email only: no SMS or push, no attachments, no per-product sender address.
- No unsubscribe link or `List-Unsubscribe` header; opt-outs work only through preferences and only
  for addresses that belong to users.
- No per-tenant send rate limit yet.
- See [Known limitations](help:limitations).

## Troubleshooting {#troubleshooting}

| What you see                                                | Why                                                                                               | What to do                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Only **My preferences**                                     | You lack `notify:manage`                                                                          | Ask a product admin if you need templates                                                 |
| **Please check your input** when saving                     | Invalid key or category, undeclared placeholder, unsupported `{{ … }}` syntax, or no `en` variant | Read the server message; fix the named field or placeholder                               |
| The preview says a value is missing                         | A declared variable has no sample value                                                           | Fill in the **Sample value**                                                              |
| **Conflict** "a template with this key exists"              | Keys are unique per product                                                                       | Choose another key or edit the existing template                                          |
| **Changed in the meantime**                                 | Someone else saved the template                                                                   | Reload; your unsaved edits are lost, so copy them first                                   |
| No send icon for a template                                 | It is **System only**, or you lack `notify:send`                                                  | Expected for invitations; ask for a role with `notify:send`                               |
| "You do not have the permission notify:send in this tenant" | Your role does not cover that tenant                                                              | Choose another tenant or ask for a role                                                   |
| **Not permitted** when sending to an address                | The address is not a member and you lack `notify:send_external`                                   | Send to a member, or ask a product owner                                                  |
| **Not found** for a member                                  | The user is not a member of the tenant                                                            | Choose a member of the chosen tenant                                                      |
| Messages stay **Queued**; **Oldest queued message** grows   | No dispatcher is running                                                                          | Ask the operator to run `axentra notify-dispatch --loop` or a worker                      |
| Messages end as **Failed**                                  | SMTP refused the message or is unreachable                                                        | Read **Last error**; ask the operator to check the SMTP settings, then **Retry delivery** |
| **Conflict** on **Retry delivery**                          | The message is not failed, or its content was erased                                              | Send the notification again                                                               |
| **Suppressed**                                              | The recipient opted out of the category, or has no email address                                  | Use `transactional` only for messages users must get                                      |
| **No local mailbox on this server**                         | The server uses SMTP                                                                              | Use the **Message log**                                                                   |
