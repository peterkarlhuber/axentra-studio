---
title: Events
summary: Browse the event log, watch events live as they happen, understand the connection indicator and publish a test event.
keywords: event, event log, domain event, live, stream, SSE, server-sent events, realtime, publish, event type, subscriber, outbox, Last-Event-ID
related: webhooks, jobs, tutorial-webhook-receiver, api-basics, audit, limitations
---

An **event** is a short message that says "something happened" in your product, for example
`invoice.created` or `user.invited`. Each event has a **type**, the time it **occurred**, the
tenant it belongs to, who caused it (the **actor**) and a JSON object with the details (the
**data**). Other parts of the system react to events: in-process subscribers in your product's
code, and [webhook endpoints](help:webhooks) in other systems. The **Events** screen lets you look
back at what happened (**Event log**) and watch new events arrive (**Live**).

Events are not the same as the [audit log](help:audit): the audit log records who changed what in
Axentra for compliance, while events are messages your product publishes for other systems to react
to.

> [!IMPORTANT]
> Events need the server module `events`. Viewing the log and the live view needs `jobs:read`
> (the permission covers jobs and events). **Publish event** needs `events:publish` in at least one
> tenant (tenant owners, admins and members have it); without it the button is hidden.

## Event types {#event-types}

An event type is a name in lowercase, usually _object.action_: `invoice.created`,
`order.shipped`, `crm.contact:merged`. It starts with a lowercase letter and may contain lowercase
letters, digits and `_ . : -`, up to 150 characters. Types starting with `axentra.` are reserved for
Axentra itself (for example `axentra.ping`, the webhook test).

Axentra keeps no list of "allowed" types: your product defines them by publishing. Several screens
accept **patterns** where `*` stands for any text: `invoice.*` matches `invoice.created` and
`invoice.paid`, and `*` alone matches every type.

## Browse the event log {#event-log}

Open [Events](app:events). The **Event log** tab lists events newest first with **Type**,
**Tenant** (or **Product level**), **Actor** and **Occurred**. The actor shows the kind of caller
(`user`, `api_key` or `system`) and its id. Scroll down and load more to go further back.

### Filter by type and tenant {#filter}

- **Type**: an exact type (`invoice.created`) or a prefix that ends with `*` (`invoice.*`, `crm.*`).
  The log filter only supports a `*` at the end.
- **Tenant**: only events of one tenant.

Choose **Apply filters**; **Reset filters** clears them. The filters are kept in the page address.

### Event details {#event-detail}

Select the details icon at the end of a row. The panel shows **Event ID**, **Type**, **Occurred**,
**Tenant**, **Actor**, **Request ID** (to find the API request in server logs), **Idempotency key**
(if the publisher gave one) and the **Data** as JSON.

## Watch events live {#live}

Open the **Live** tab. Studio opens a connection to the server's event stream and shows events
**published from now on**, newest at the top. Older events are in the **Event log**.

1. Optional: enter **Types**, one or more patterns separated by commas (for example
   `invoice.*, user.created`), and choose **Apply**. Leave the field empty to see all types.
   Applying a filter clears the list and reconnects.
2. Watch events arrive. Select **Show data** on an entry to see the full event and its stream
   position.

The live view keeps the latest 200 events; older ones drop off the list but stay in the log.

### Connection status {#connection-status}

The indicator above the list (and next to **Live updates** on the [Jobs](help:jobs#live-updates)
screen) tells you whether you are really receiving updates:

| Indicator         | Meaning                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Connecting…**   | Studio is opening the connection.                                                                                                    |
| **Live**          | The connection is open; new events appear within about a second.                                                                     |
| **Live, paused**  | Connected, but the display is paused (see below).                                                                                    |
| **Reconnecting**  | The connection dropped or the server ended it. Studio retries automatically and shows when (_next attempt in … s_).                  |
| **Disconnected**  | Studio stopped trying, for example because your session or permission changed. The reason is shown next to it; choose **Reconnect**. |
| **Not connected** | You chose **Disconnect**.                                                                                                            |

The server ends every stream after one hour and checks your session and permission every 15
seconds (default settings). After a normal end or a network problem Studio reconnects and
**resumes where it stopped**, so no event is lost in between. If your access was revoked, the
stream closes with _Access to the stream was lost (session or permission changed)._

### Pause, resume and clear {#pause}

- **Pause** freezes the list so you can read it. The connection stays open and new events are
  collected. **Resume** shows them (the button counts them, for example **Resume (3 new events)**).
- **Disconnect** closes the connection. **Connect** opens it again and continues after the last
  event you received, so events published in between also appear.
- **Clear** empties the list on your screen. It does not delete any events.

## Publish a test event {#publish}

Publishing an event by hand is useful to test a webhook endpoint or a subscriber.

1. Choose **Publish event**.
2. Choose the **Tenant**. Events published here always belong to a tenant.
3. Enter the **Type**, for example `invoice.created`.
4. Enter the **Data** as a JSON object, for example `{"invoice_id": "inv_123"}`.
5. Choose **Publish**.

The event appears in the log and is delivered to every enabled webhook endpoint whose event types
match, and to your product's subscribers. It is a real event: receivers cannot tell it apart from
one your product published, so use test data and a tenant meant for testing.

| Setting    | What it does                                                      | Allowed values / default                              |
| ---------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| **Tenant** | The tenant the event belongs to. You need `events:publish` there. | Required.                                             |
| **Type**   | The event type receivers filter on.                               | See [Event types](help:events#event-types). Required. |
| **Data**   | Details of the event.                                             | JSON object, at most 64 KB. Default `{}`.             |

Studio sends an idempotency key with each publish dialog, so a double click publishes only once.

## For developers {#developers}

- **Transactional outbox.** Product code publishes with `ax.events.publish_in_tx(...)` inside its
  own database transaction. The event exists if and only if the transaction commits, so no event is
  sent for a change that was rolled back.
- **Delivery to subscribers and webhooks** runs through [jobs](help:jobs#system-kinds)
  (`axentra.event.dispatch`, `axentra.event.handle`, `axentra.webhook.deliver`), at least once each.
  There is no ordering guarantee between events.
- **API.** `GET /v1/products/{product_id}/events?type=&tenant_id=` lists events,
  `GET /events/{event_id}` returns one, and `POST /tenants/{tenant_id}/events` publishes (with an
  optional `Idempotency-Key` header).
- **Streams (SSE).** `GET /events/stream?types=invoice.*,user.created` and `GET /jobs/stream` send
  messages with `id:` (the stream position), `event:` (the event type, or `job.<status>` on the jobs
  stream) and JSON `data:`. Send the last `id` back as `Last-Event-ID` to resume;
  `Last-Event-ID: 0` replays everything still retained. With `?tenant_id=` the permission is checked
  in that tenant, so tenant-bound API keys can stream their tenant. The jobs stream shows the
  latest state of each changed job, so intermediate states can be skipped.
- **Retention.** Events are deleted after the job retention period (30 days by default) once no
  delivery is pending.

## Good to know {#good-to-know}

- The live view shows only events that arrive while it is open. To see what happened earlier, use
  the **Event log**.
- Type suggestions in the webhook form come from the latest events in this log, because there is
  no central catalog of types.

## Troubleshooting {#troubleshooting}

**The log is empty.** Your product has not published events yet, or the filters exclude them. Choose
**Reset filters**. Publish a test event to check the setup.

**"Enter an exact type or a prefix ending in `*`".** The log filter accepts `invoice.created` or
`invoice.*`, not a `*` in the middle. For the live view and webhooks, patterns such as `*.created`
are allowed.

**The indicator stays on Reconnecting.** Studio cannot reach the server's stream. Check your network
and the server status. Proxies that buffer responses can also break streams; tell your operators.

**Disconnected with "Access to the stream was lost".** Your session ended or your role changed.
Sign in again if needed, then choose **Reconnect**.

**"Not permitted" when opening Events.** You need `jobs:read` in this product. Ask a product owner or
admin for a role that includes it, see [Roles and permissions](help:roles-permissions).

**"Types starting with “axentra.” are reserved".** Choose a type with your own prefix, for example
`invoice.created`.

**"Already used for a different request" when publishing.** An earlier attempt from the same dialog
used other values. Studio has already created a new key: choose **Publish** again.

**A published event did not reach a webhook.** Check that the endpoint is enabled, that one of its
event types matches, and that its tenant filter (if set) is the event's tenant. Then look at the
endpoint's [deliveries](help:webhooks#deliveries). If there is no delivery at all, no worker may be
running to dispatch the event.
