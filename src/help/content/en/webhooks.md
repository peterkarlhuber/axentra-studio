---
title: Webhooks
summary: Send events to other systems as signed HTTP requests, manage the signing secret, and check, retry and redeliver deliveries.
keywords: webhook, endpoint, callback, HTTP POST, signing secret, signature, HMAC, whsec, rotate secret, delivery, redeliver, retry, test ping, receiver, integration
related: events, tutorial-webhook-receiver, jobs, security, api-keys, limitations
---

A **webhook** lets another system learn about [events](help:events) in your product without asking
for them. You register an **endpoint**, which is a URL in the other system, and choose which event
types it wants. Whenever a matching event is published, Axentra sends an HTTP `POST` request with
the event as JSON to that URL. Each request is **signed** with a secret only Axentra and the
receiver know, so the receiver can check that the request is genuine. Every attempt is recorded as
a **delivery** that you can inspect and send again.

> [!IMPORTANT]
> Webhooks need the server module `events`. Viewing endpoints and deliveries needs `webhooks:read`
> (product owners, admins, support and viewers). Creating, editing, testing, rotating the secret,
> redelivering and deleting need `webhooks:manage` (product owners and admins); without it these
> buttons are hidden and **Settings** is read-only. A worker process must run for deliveries to be
> sent.

## How delivery works {#how-it-works}

```diagram
webhook-delivery
```

1. Your product publishes an event, for example `invoice.created` in tenant `acme`.
2. A worker looks for **enabled** endpoints whose **Event types** match the type and whose
   **Tenant filter** is empty or equals the event's tenant. For each match it creates one delivery
   with the status **Pending**.
3. The worker sends the signed request. A `2xx` answer makes the delivery **Delivered**.
4. Any other answer, a timeout or a connection error makes it **Failed, retrying**: it is sent again
   after a growing wait. After the last attempt it is **Dead**.
5. You can **Redeliver** a delivery that is not pending, for example after fixing the receiver.

Deliveries happen **at least once**: a receiver can get the same event twice (for example when its
`200` answer was lost). Receivers should remember the event id and ignore duplicates. There is no
guaranteed order between events.

## Create an endpoint {#create}

1. Open [Webhooks](app:webhooks) and choose **New endpoint**.
2. Enter the **URL** that should receive the requests.
3. Optional: a **Description** (up to 1000 characters), for example who owns the receiver.
4. Add the **Event types**: type a type or pattern and press Enter or choose **Add type**. Studio
   suggests types it has seen in recent events, and **\* (all types)**.
5. Optional: choose a **Tenant filter** and switch off **Enabled** if the receiver is not ready yet.
6. Choose **Create endpoint**.
7. Copy the **Signing secret** that appears, store it for the receiver, tick **I have stored the
   secret securely** and choose **Done**. See [Store the signing secret](help:webhooks#signing-secret).

Studio then opens the endpoint's page.

### URL rules {#url-rules}

To keep webhooks from being used to reach internal systems, the server checks every URL when you
save it and again before every delivery:

- It must start with `https://`. Plain `http://` is only accepted by servers outside production
  whose operators enabled `events.webhook_allow_http`.
- It must not contain a user name or password (`https://user:pass@…`) or a fragment (`#…`).
- `localhost` and host names ending in `.local`, `.localhost` or `.internal` are refused.
- The host name is resolved, and **every** address it points to must be public. Private networks
  (such as `10.x`, `192.168.x`), loopback, link-local and other special addresses are refused,
  unless the operators set `events.webhook_allow_private_targets` (meant for development, and in
  production only with an extra override).
- At most 2000 characters.

Redirects are not followed: a `301` or `302` answer counts as a failure. Use the final URL.

### Choose event types {#event-types}

Each endpoint has 1 to 50 event type patterns. Use exact types (`invoice.created`), patterns with `*`
(`invoice.*`, `*.deleted`) or `*` for all types. Patterns use lowercase letters, digits, `_ . : -`
and `*`. Events with reserved types (`axentra.…`) are never sent to endpoints, except the test ping.

### Tenant filter {#tenant-filter}

Without a tenant filter, the endpoint receives matching events of **all tenants** and product-level
events. With a filter, it receives only that tenant's events. The tenant filter cannot be changed
later; create a new endpoint instead.

## Store the signing secret {#signing-secret}

When you create an endpoint (and when you rotate its secret), Axentra generates a signing secret
that starts with `whsec_`. It is shown **only once**. Axentra stores it encrypted and never displays
it again.

> [!CAUTION]
> Store the secret in your receiver's secret store right away. Anyone who knows it can send requests
> that your receiver accepts as genuine. If you lose it or it leaks,
> [rotate the secret](help:webhooks#rotate-secret).

The receiver uses the secret to check the `Axentra-Signature` header of each request. The
[webhook receiver tutorial](help:tutorial-webhook-receiver#verify-signature) shows the exact
algorithm with Python and TypeScript code.

## Send a test ping {#test}

On the endpoint's page, choose **Send test ping**. Axentra immediately sends a signed request with
the type `axentra.ping` and waits for the answer. Studio reports **Test ping delivered (HTTP 200)**
or **Test ping failed** with the status code or error, and opens the recorded delivery.

A test ping is sent once, without retries, and also to a disabled endpoint, so you can test a
receiver before enabling it. Its body has `"type": "axentra.ping"`, `"data": {"endpoint_id": "…"}`,
and the delivery id as `id`.

## Check deliveries {#deliveries}

The **Deliveries** tab of an endpoint lists its deliveries newest first: **Event** (type and delivery
id), **Status**, **Response** (the HTTP status code), **Attempts**, **Duration** and **Created**.
Filter by **Status**; **Refresh** loads the latest state.

### Delivery statuses {#delivery-statuses}

| Status               | Meaning                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------- |
| **Pending**          | Waiting to be sent, being sent, or queued again by **Redeliver**.                             |
| **Delivered**        | The receiver answered with a `2xx` status.                                                    |
| **Failed, retrying** | The last attempt failed; another attempt is planned (**Next attempt**).                       |
| **Dead**             | No more automatic attempts: all were used, the URL was refused, or the endpoint was disabled. |

### Delivery details {#delivery-detail}

Select the details icon at the end of a row. The panel shows **Delivery ID**, **Status**,
**Response**, **Attempts**, **Duration**, the **Event ID**, the **Job** that sends it (a link to
the [job](help:jobs#job-detail)), **Created**, **Delivered** and **Next attempt**, plus:

- **Last error**: for example `HTTP 500`, a timeout, `unresolvable: …` or `refused: …`;
- **Response body**: the first 4096 bytes (default) of what the receiver answered. Returning a short
  error text from your receiver makes problems easier to diagnose here.

## Retries {#retries}

Failed deliveries are retried automatically through the job queue, up to **8 attempts** with default
settings (`events.webhook_max_attempts`). Webhooks have their own, slower schedule than other jobs:
the wait before attempt _n + 1_ is between half and all of `120 × 2^(n−1)` seconds, at most 6 hours
(`events.webhook_backoff_base_seconds`, `events.webhook_backoff_max_seconds`). With default settings
the waits are about 2, 4, 8, 16, 32, 64 and 128 minutes, so the last attempt runs about **2 to 4¼
hours** after the first, and a receiver outage of up to about two hours is always bridged. Each
attempt waits at most 10 seconds for the connection and for each read of the answer. (Axentra
versions before this schedule used the short job backoff and used up all attempts within minutes.)

A receiver that is down for longer than that loses no events, but its deliveries end as **Dead**:
redeliver them once it is back. Axentra does not disable endpoints that keep failing, and has no
per-endpoint rate limit.

Two cases end a delivery without further attempts: a URL that the server refuses (see
[URL rules](help:webhooks#url-rules)), and an endpoint that was disabled while the delivery was waiting. A host
name that cannot be resolved is retried.

## Redeliver {#redeliver}

1. Open the delivery's details.
2. Choose **Redeliver**.

The delivery becomes **Pending** and is sent again with a fresh set of attempts. The **Attempts**
counter keeps counting. **Redeliver** is not offered while the delivery is **Pending**. The receiver
gets the same event id again, so a deduplicating receiver ignores events it already processed.

## Rotate the signing secret {#rotate-secret}

Rotate the secret when it may have leaked, when someone who knew it leaves, or regularly as good
practice.

1. On the endpoint's page, choose **Rotate secret**.
2. Choose a **Grace period**: **None (old secret stops at once)**, **1 hour**, **24 hours** or
   **7 days**.
3. Choose **Rotate secret**, then copy and store the new secret as when creating.

During the grace period each request carries **two** signatures: one made with the new secret and
one with the previous secret. A receiver that still has the old secret keeps working while you
update it. The endpoint page shows **Previous secret still valid** until the period ends.

> [!TIP]
> To rotate without failed deliveries: choose a grace period, put the new secret into the receiver,
> and check that deliveries still succeed before the period ends. With **None**, the receiver rejects
> every request until it has the new secret.

## Edit or disable an endpoint {#edit}

Open the endpoint's **Settings** tab, change the **URL**, **Description**, **Event types** or
**Enabled**, and choose **Save changes**. **Discard changes** restores the saved values.

Switching **Enabled** off stops new deliveries. Deliveries that were still waiting for an attempt end
as **Dead** with the error `endpoint disabled`; redeliver them after enabling the endpoint again.
Events published while the endpoint was disabled are not delivered later.

## Delete an endpoint {#delete}

Choose **Delete endpoint** and confirm. The endpoint receives nothing more, and its delivery history is
deleted with it. This cannot be undone. To pause an endpoint, disable it instead.

## Request format {#request-format}

```http
POST /hooks/axentra HTTP/1.1
Host: example.com
Content-Type: application/json
User-Agent: Axentra-Webhooks/1
Axentra-Event: invoice.created
Axentra-Event-Id: evt_01EXAMPLE
Axentra-Delivery: dlv_01EXAMPLE
Axentra-Signature: t=1767225600,v1=9c1e…(64 hex characters)

{"data":{"invoice_id":"inv_123"},"id":"evt_01EXAMPLE","occurred_at":"2026-01-01T00:00:00+00:00","product_id":"prd_01EXAMPLE","tenant_id":"ten_01EXAMPLE","type":"invoice.created"}
```

| Field                     | Content                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `id`                      | Event id, identical to the `Axentra-Event-Id` header. Use it to deduplicate. |
| `type`                    | Event type.                                                                  |
| `product_id`, `tenant_id` | Where the event happened; `tenant_id` is `null` for product-level events.    |
| `occurred_at`             | When the event happened (ISO 8601, UTC).                                     |
| `data`                    | The event's data object.                                                     |

`Axentra-Delivery` identifies the delivery and is the same for all attempts and redeliveries of it.
Verify the signature over the **raw** body bytes; do not parse and re-serialize the JSON first.

## Settings {#settings}

| Setting                     | What it does                                       | Allowed values / default                                        |
| --------------------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| **URL**                     | Where requests are sent.                           | `https://` URL, public host, at most 2000 characters. Required. |
| **Description**             | Note for people.                                   | Up to 1000 characters.                                          |
| **Event types**             | Which events are sent.                             | 1 to 50 types or patterns with `*`. Required.                   |
| **Tenant filter**           | Limits the endpoint to one tenant.                 | A tenant or **All tenants**. Only when creating.                |
| **Enabled**                 | Whether new deliveries are sent.                   | Default on.                                                     |
| **Grace period** (rotation) | How long the previous secret still signs requests. | None, 1 hour, 24 hours, 7 days (API: up to 7 days in seconds).  |

Server-side defaults (operators can change them in `[events]`): 8 attempts, retries spread over
about 2 to 4¼ hours, 10-second timeout, 4096 bytes of stored response body.

## Good to know {#good-to-know}

- Endpoints, deliveries, tests and rotations are also available through the API under
  `/v1/products/{product_id}/webhooks`; see [API basics](help:api-basics).
- Creating, changing, deleting, testing, rotating and redelivering are recorded in the
  [audit log](help:audit).
- Delivered and dead deliveries are deleted after the retention period (30 days by default).

## Troubleshooting {#troubleshooting}

**"webhook urls must use https".** Use an `https://` URL. `http://` works only on development servers
that allow it.

**"webhook urls must not point to local hosts" or "… private, loopback or link-local addresses".** The
URL points to your own machine or an internal network. Use a public HTTPS address, for example
through a tunnel service during development (see the
[tutorial](help:tutorial-webhook-receiver#public-url)).

**"event_types needs 1-50 type patterns".** Add at least one event type, or `*` for all.

**Test ping failed with HTTP 401 or 403.** The receiver rejected the signature. Check that it uses
the current secret (the complete value including `whsec_`), the raw request body, and a correct clock
(timestamps older than about 5 minutes are rejected).

**Test ping failed with HTTP 404 or 405.** The path is wrong, or the receiver does not accept `POST`.

**Test ping failed without a status code.** The receiver could not be reached: read **Last error**.
`unresolvable` means the host name does not exist in DNS; a timeout means the receiver did not
answer within 10 seconds. Answer quickly and do slow work after responding.

**Deliveries are Dead with "refused: …".** The host now resolves to a private address. Fix the DNS
entry or URL, then redeliver.

**Deliveries are Dead with "endpoint disabled".** The endpoint was disabled while they waited. Enable
it and redeliver.

**No deliveries appear for an event.** Check that the endpoint is enabled, that an event type
pattern matches, and the tenant filter. Events published before the endpoint existed are not
delivered. If the event is in the [event log](help:events#event-log) but nothing happens, no worker
may be running.

**"Conflict" on Redeliver.** The delivery is already queued or being sent. Wait and choose
**Refresh**.

**"Changed in the meantime" when saving or deleting.** Someone else changed the endpoint. Reload the
page and repeat your change.

**The receiver processed an event twice.** Expected with at-least-once delivery. Deduplicate by
`Axentra-Event-Id`.
