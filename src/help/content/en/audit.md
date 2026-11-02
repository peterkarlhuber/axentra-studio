---
title: Audit log
summary: Find out who did what and when on the server, filter the log, share a filtered view and read the full details of an event.
keywords: audit, audit trail, history, activity log, who changed, events log, compliance, request id, denied, login attempts
related: health-monitoring, roles-permissions, permissions-reference, api-basics, security, users
---

The **Audit log** records security-relevant and administrative actions on the Axentra server:
who acted (a user, an API key or the system), what they did, on which object, with which
result, and when. Use it to answer questions such as "who revoked this API key?", "why can this
user no longer sign in?" or "what happened during the request with this request ID?".

The server writes the events itself. Studio only reads them: nobody can edit or delete a single
audit event, not even a platform administrator.

> [!IMPORTANT]
> The audit module is always enabled. To read events of a product you need the permission
> `audit:read` in that product (all built-in product roles have it: **Product owner**,
> **Product admin**, **Support** and **Product viewer**). Events of the whole installation,
> including those that belong to no product, need `platform:audit` (platform roles
> `platform_admin` and `platform_viewer`). Tenant roles cannot read the audit log.

## Who sees which events {#who-sees-what}

| You have                                       | Studio shows                                                                                  | Product filter                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `platform:audit`                               | Every event of the installation, including sign-ins, setup and other events without a product | **All products** (default) or one product             |
| `audit:read` in a product, no `platform:audit` | Only the events of one product; Studio starts with the product you used last                  | One of your products; **All products** is not offered |
| Neither                                        | An error **Not permitted**                                                                    | –                                                     |

The server checks the permission for every request. Selecting a product you are not allowed to
read returns **Not permitted**, and an event you may not read cannot be opened in detail (see
[Troubleshooting](#troubleshooting)).

> [!NOTE]
> Events without a product, such as `identity.login`, `identity.logout` or
> `identity.setup.complete`, are visible only with `platform:audit`.

## Open the audit log {#open}

1. In the sidebar, open **Audit & Monitoring** › **Audit log** ([open](app:audit)).
2. The newest events come first. Scroll to the end of the table to load more.

Each row shows **Time**, **Action**, **Actor**, **Target** and **Outcome**. On a phone, only
**Time** and **Action** are shown; open the details to see the rest.

## Filter events {#filter}

1. Type a word into **Search**. On a narrow screen, choose **More filters** to see the other
   fields; the number in brackets tells you how many filters are active.
2. Fill in any of the other filters. All filters combine (an event must match every one).
3. Choose **Apply filters**. Studio only loads new results when you apply.
4. To start again, choose **Reset filters**.

| Filter               | What it matches                                                                          | Example                              |
| -------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------ |
| **Search**           | Part of the action, the target ID, the actor's name or the actor ID (not case sensitive) | `acme`, `api_key`                    |
| **Product**          | Events of one product                                                                    | –                                    |
| **Tenant ID**        | Events in one tenant (exact ID)                                                          | `ten_01EXAMPLE`                      |
| **Action**           | The exact action name, or a prefix when it ends with `*`                                 | `access.api_key.revoke`, `tenancy.*` |
| **Actor ID**         | Events of one user or API key (exact ID)                                                 | `usr_01EXAMPLE`, `key_01EXAMPLE`     |
| **Outcome**          | **Success**, **Denied** or **Failure**                                                   | –                                    |
| **From** / **Until** | Time range in your local time. **From** is included, **Until** is not                    | –                                    |

The server accepts at most 100 characters for **Action** and 200 for **Search**.

### Share a filtered view {#share}

The applied filters are part of the page address, for example
`/audit?actor_id=usr_01EXAMPLE&outcome=denied`. Copy the address from the browser to share or
bookmark exactly this view. The recipient sees only the events their own permissions allow.

## Read the details of an event {#event-detail}

1. Choose the details button at the end of a row (**Show details for …**).
2. A panel opens on the side with all fields of the event and its **Details**.

| Field                                     | Meaning                                                                                                                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Event ID**                              | ID of the audit event (`aud_…`)                                                                                                                                      |
| **Time**                                  | When the server recorded the event                                                                                                                                   |
| **Action**                                | What happened, as `module.object.verb`                                                                                                                               |
| **Actor** / **Actor type** / **Actor ID** | Who acted. Types: `user`, `api_key`, `system` (the server itself, for example a scheduled task) and `anonymous` (no one was signed in, for example a failed sign-in) |
| **Product** / **Tenant**                  | Where it happened; empty for installation-wide events                                                                                                                |
| **Target**                                | The object that was acted on: type and ID (for example `api_key · key_01EXAMPLE`)                                                                                    |
| **Outcome**                               | See [Outcomes](#outcomes)                                                                                                                                            |
| **Request ID**                            | The `X-Request-ID` of the HTTP request that caused the event                                                                                                         |
| **IP address**                            | The client address as seen by the server (behind a proxy only if the proxy is trusted)                                                                               |
| **Details**                               | Additional data as JSON, for example the changed fields or the reason for a refusal                                                                                  |

> [!NOTE]
> The server removes secrets (passwords, tokens, keys) from the details before it stores them.
> You never find a secret in the audit log.

### Outcomes {#outcomes}

| Outcome     | Meaning                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Success** | The action was carried out.                                                                                                                                               |
| **Denied**  | The server refused the action, for example a sign-in with a wrong password, a password change with a wrong current password or a first password without a recent sign-in. |
| **Failure** | The action was attempted but did not succeed.                                                                                                                             |

A refused request because of missing permissions is usually **not** recorded: the client only
receives `403`. Look for **Denied** events mainly around sign-in and passwords.

## Trace a request with its request ID {#request-id}

Every error message in Studio shows a **Request ID** under **Technical details**. To find out
what that request changed:

1. Copy the request ID from the error message.
2. The audit search does not cover request IDs. Narrow the list with **From** / **Until** (and
   the **Actor ID**, if you know it), open the candidate events and compare their **Request ID**.
3. If no event matches, the request changed nothing that is audited. Give the request ID to your
   operator: the server logs carry the same ID.

See [Request IDs](help:api-basics#request-ids) for how request IDs work.

## What is recorded {#what-is-recorded}

Actions are named `module.object.verb`. Typical examples:

| Area                          | Actions                                                                                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in and accounts          | `identity.login`, `identity.logout`, `identity.password.change`, `identity.session.revoke`, `identity.session.revoke_all`, `identity.platform_role.set`, `identity.setup.complete` |
| Products, tenants, members    | `tenancy.product.create`, `tenancy.tenant.create`, `tenancy.tenant.update`, `tenancy.member.set`, `tenancy.invitation.create`, `tenancy.invitation.accept`                         |
| Access                        | `access.role.create`, `access.api_key.create`, `access.api_key.rotate`, `access.api_key.revoke`                                                                                    |
| Data and files                | `data.record.delete`, `storage.file.upload`, `storage.file.delete`, `storage.policy.update`                                                                                        |
| Events and jobs               | `events.job.enqueue`, `events.job.cancel`, `events.schedule.update`, `events.webhook.rotate_secret`                                                                                |
| Usage, billing, notifications | `usage.quota.set`, `billing.plan.update`, `notify.template.update`, `notify.message.enqueue`                                                                                       |

Not everything is an audit event: reads are not recorded, and creating or changing a record is
not recorded (deleting one is). Product backends built on Axentra can add their own actions.

## Retention {#retention}

Audit events are kept for `observability.audit_retention_days` (default 365 days). They are
deleted only when the operator runs the maintenance task `axentra maintenance purge`. Until that
task runs, older events stay visible. The configured value is shown under
**Maintenance and retention** on the [Monitoring](help:health-monitoring#retention) page.

## Good to know {#good-to-know}

- The list is sorted by time, newest first; you cannot change the order.
- Times are shown in your browser's time zone; the API stores and filters in UTC.
- There is no export in Studio. Developers can read the log with the API
  (`GET /v1/audit`, cursor pagination) or the SDKs (`audit.list`, `audit.iter`); see
  [API basics](help:api-basics#pagination).

## Troubleshooting {#troubleshooting}

- **Not permitted** when opening the page: You have no `audit:read` in the selected product. Pick a product where you have a product role, or ask a product owner or platform administrator for access.
- **No matching events**: The filters are too narrow. Check that **Action** is spelled exactly (actions are `tenancy.tenant.create`, not `tenant.created`) or end it with `*`, widen **From** / **Until**, or choose **Reset filters**.
- **No audit events yet** although things changed: You are looking at one product, but the change was installation-wide (for example a sign-in). Those events need `platform:audit`. Also check that the action is one that is recorded (see [What is recorded](#what-is-recorded)).
- **The full event could not be loaded** (in the details panel): The event was deleted by the retention task, or it belongs to a product (or to no product) that you may not read. The server answers `404` in both cases, so it does not reveal whether the event exists. Studio shows the values from the list instead.
- **Please check your input**: A filter value was refused, for example an **Action** longer than 100 characters or a **Search** longer than 200 characters.
