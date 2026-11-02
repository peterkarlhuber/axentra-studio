---
title: Glossary
summary: Short explanations of the terms used in Axentra and Studio, in alphabetical order, with links to the details.
keywords: glossary, terms, definitions, vocabulary, meaning, what is, dictionary
related: concepts, overview, permissions-reference, faq, security
---

Short definitions of the terms used in Studio and in this help. Each entry links to the article
with the details.

## API key {#api-key}

Credentials for machines (format `axk_…`) that call the Axentra API for one product, with an
explicit list of permissions and optionally bound to one tenant. See [API keys](help:api-keys).

## Archive {#archive}

Taking a product out of use without deleting it. Only platform administrators can still work in
an archived product; it can be restored. See [Products](help:products).

## Audit log {#audit-log}

The append-only record of who changed what and when on the server, with outcome, request ID and
IP address. See [Audit log](help:audit).

## Built-in role {#built-in-role}

A role that Axentra provides in every product, such as **Product admin**, **Owner** or
**Viewer**. It cannot be changed. See the [permissions reference](help:permissions-reference#built-in-roles).

## Checkout {#checkout}

Paying for a plan on the payment provider's hosted page. Studio never handles card data. See
[Plans and subscriptions](help:plans-subscriptions).

## Collection {#collection}

A named group of records in a tenant, for example `contacts`. See [Records](help:records).

## Cron expression {#cron-expression}

Five fields (minute, hour, day of month, month, weekday) that describe when a schedule runs,
always in UTC. See [Schedules](help:schedules).

## CSRF {#csrf}

Cross-site request forgery: an attack in which another website tries to send changes through your
signed-in browser. Studio and the server block it automatically. See
[Security](help:security#csrf).

## Custom role {#custom-role}

A role defined for one product with a chosen set of permissions, for a product or a tenant. See
[Roles and permissions](help:roles-permissions).

## Delivery {#delivery}

One attempt chain to send an event to a webhook endpoint, with status, response and retries. See
[Webhooks](help:webhooks).

## Entitlement {#entitlement}

A feature (on or off) or a limit that a plan grants to the tenants subscribed to it. See
[Plans and subscriptions](help:plans-subscriptions).

## Event {#event}

A message from your product that something happened, for example `invoice.created`. Events can
trigger webhooks and handlers. See [Events](help:events).

## Grace period {#grace-period}

The time after a secret rotation during which the old secret still works (at most 7 days), so
services can switch over without downtime. See [API keys](help:api-keys) and
[Webhooks](help:webhooks).

## Idempotency key {#idempotency-key}

A unique value sent with a request so that repeating the same request does not run it twice.
Reusing a key with different values is refused. See
[troubleshooting](help:troubleshooting#idempotency-conflict).

## Invitation {#invitation}

An offer to join a tenant with a given role, sent to an email address. Its link and token are
shown once. See [Members and invitations](help:members-invitations).

## Job {#job}

A background task that a worker runs, with retries on failure. See [Jobs](help:jobs).

## Member {#member}

A user who belongs to a tenant with a tenant role. Also the name of the built-in tenant role
**Member**, which works with the tenant's data. See
[Members and invitations](help:members-invitations).

## Meter {#meter}

Something a product measures, such as API calls or storage, and how it is combined (sum, maximum
or last value) and reset. See [Usage](help:usage).

## Module {#module}

A building block of the Axentra server (for example `storage` or `billing`) that an operator can
switch on or off. See the [modules reference](help:modules-reference).

## Multi-product mode {#multi-product-mode}

A server mode in which one installation hosts many products, created by platform administrators.
See [Concepts](help:concepts).

## Owner rank {#owner-rank}

The special rank of the **Owner** (tenant) and **Product owner** roles: only an owner of the same
scope, or someone with authority from a higher level, may assign or remove it. See
[role ceiling](help:security#role-ceiling).

## Permission {#permission}

A single right written as `resource:action`, for example `files:write`, with a platform, product
or tenant scope. See the [permissions reference](help:permissions-reference).

## Plan {#plan}

An offer with prices and entitlements that tenants subscribe to. See
[Plans and subscriptions](help:plans-subscriptions).

## Platform role {#platform-role}

An installation-wide role: **Platform administrator** (everything) or **Platform viewer** (read
access everywhere). Only platform administrators can grant it. See [Users](help:users).

## Product {#product}

An application that runs on the Axentra server, with its own tenants, roles, keys and data. See
[Products](help:products).

## Product operator {#product-operator}

A user with a product role, such as **Product owner** or **Support**, who works on the product as
a whole. See [Products](help:products).

## Product permission {#product-permission}

A permission that a product declares itself, named like `crm.deals:approve`. See the
[permissions reference](help:permissions-reference#product-defined).

## Quota {#quota}

An upper limit on a tenant's usage or storage. Exceeding it gives
[Quota exceeded](help:troubleshooting#quota-exceeded). See [Usage](help:usage).

## Record {#record}

A JSON object stored in a collection of a tenant. See [Records](help:records).

## Request ID {#request-id}

The identifier `req_…` of every server request, shown in error details and the audit log; the key
for support. See [troubleshooting](help:troubleshooting#request-id).

## Reservation {#reservation}

Usage booked in advance that is later committed with the actual amount or released. See
[Usage](help:usage).

## Role {#role}

A named bundle of permissions that is assigned to people (or, as a permission list, to API keys).
See [Roles and permissions](help:roles-permissions).

## Role ceiling {#role-ceiling}

The rule that nobody can assign a role with permissions they do not hold themselves. See
[Security](help:security#role-ceiling).

## Rotation {#rotation}

Replacing a secret with a new one, optionally with a grace period. See [API keys](help:api-keys).

## Row-level security {#row-level-security}

A database feature that limits every transaction to the rows of one product or tenant, as a
second line of defense behind permission checks. See
[Security](help:security#tenant-isolation).

## Schedule {#schedule}

A rule that enqueues a job at fixed intervals or at cron times. See [Schedules](help:schedules).

## Session {#session}

The signed-in state of a browser. It ends after a maximum lifetime, after inactivity, at sign-out
or when revoked. See [Security](help:security#sessions).

## Setup token {#setup-token}

A one-time token, printed on the server, that creates the first platform administrator. See
[First-run setup](help:first-run-setup).

## Signing secret {#signing-secret}

The secret (`whsec_…`) with which Axentra signs webhook requests (HMAC-SHA256) so receivers can
verify them. See [Webhooks](help:webhooks) and [Security](help:security#webhook-signing).

## Single-product mode {#single-product-mode}

A server mode with exactly one product, created from the server configuration; products cannot
be created or archived. See [Concepts](help:concepts).

## Slug {#slug}

A short, URL-friendly identifier of a product or tenant, for example `acme`. It is unique and
cannot contain spaces. See [Tenants](help:tenants).

## Subscription {#subscription}

A tenant's booking of a plan, with status (for example trialing, active, past due) and period.
See [Plans and subscriptions](help:plans-subscriptions).

## Suspend {#suspend}

Blocking access to a tenant without deleting its data. It can be reactivated. See
[Tenants](help:tenants).

## Template {#template}

A notification email with language variants and variables. See
[Notifications](help:notifications).

## Tenant {#tenant}

A customer or organization inside a product. Each tenant's data is strictly separated. See
[Tenants](help:tenants).

## UTC {#utc}

Coordinated Universal Time, the time base of all schedules. Studio shows times in your own time
zone where it can.

## Webhook {#webhook}

A signed HTTP request that Axentra sends to another system when an event occurs. See
[Webhooks](help:webhooks).

## Worker {#worker}

A server process that runs jobs, schedules and webhook deliveries. Without a running worker, jobs
stay queued. See [Jobs](help:jobs).
