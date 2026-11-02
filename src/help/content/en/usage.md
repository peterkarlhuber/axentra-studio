---
title: Usage and quotas
summary: Define meters, follow the usage of every tenant, set quota overrides and look up reservations.
keywords: usage, metering, meter, quota, limit, consumption, counter, reservation, hard limit, soft limit, overage, API calls, reset period
related: plans-subscriptions, tutorial-plan-usage, tenants, api-keys, limitations
---

Usage metering counts how much each tenant consumes of something your product measures: API
calls, stored bytes, generated reports. You define **meters** in Studio; your product records
**usage events** against them through the API. Axentra adds the events up per tenant and period,
compares the result with the tenant's **limit** (from a quota override, the plan or the meter's
default) and refuses or flags usage above it. Product operators use this screen to define meters
and watch consumption; support staff use it to answer "why was my request refused?".

> [!IMPORTANT]
> The **Usage** screen needs the `usage` module on the server. Without it, **Usage** is not shown
> in the navigation. Reading needs `usage:read`; defining meters and quota overrides needs the
> product permission `usage:manage`; committing or releasing reservations needs `usage:record` in
> the tenant. See [Roles and permissions](help:roles-permissions).

## What the screen shows {#overview}

Open [Usage](app:usage) (group **Usage & Billing**). The page has three tabs:

| Tab              | Shows                                                                       | Who sees it                                                |
| ---------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Overview**     | A daily chart of one meter across all tenants and the **Totals per tenant** | Product-level `usage:read` (product roles, platform roles) |
| **Meters**       | The meter definitions                                                       | Product-level `usage:read`                                 |
| **Tenant usage** | Limits, chart, events and reservations of one tenant                        | `usage:read` in at least one tenant                        |

People who only hold a tenant role (for example the tenant role **Member**) see just the
**Tenant usage** tab, and only for tenants where they have `usage:read`.

### Read the overview {#overview-chart}

1. Choose a **Meter** and a **Time range** (**Last 7 days**, **Last 30 days** or **Last 90 days**).
2. **Daily usage, all tenants** shows one bar per UTC day. **Show data table** below the chart
   lists every day as a table, which also works with screen readers.
3. **Totals per tenant** lists each tenant with usage in the range, its **Value** and the number
   of **Events**. Select a tenant name to open its **Tenant usage** tab.

How the total is formed depends on the meter's aggregation: **Sum** adds the daily values,
**Maximum** takes the highest daily value, **Last value** takes the value of the latest day with
usage. All days are UTC days, so a day may start in the evening or the morning of your local time.

The product **Dashboard** has a **Usage this month** card with the totals per meter since the first
day of the current UTC month.

## Create a meter {#create-meter}

A meter defines _what_ is measured. It does not record anything by itself.

1. Open the **Meters** tab and choose **New meter**.
2. Enter a **Key**, for example `api_calls`. Your product sends usage with this key.
3. Optional: **Name**, **Unit** (shown next to values, for example `calls`) and **Description**.
4. Choose the **Aggregation** and the **Reset period** (see the table below).
5. Optional: a **Default limit** and its **Enforcement**.
6. Choose **Create meter**.

> [!WARNING]
> **Key**, **Aggregation** and **Reset period** cannot be changed after creation. If you chose
> wrongly, create a new meter with another key.

### Meter settings {#meter-settings}

| Setting           | What it does                                                                                                                                                          | Allowed values / default                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Key**           | Identifier used by your product's API calls and by plan entitlements (`limit.<key>`)                                                                                  | Lowercase letters, digits, `_` and `.`, starting with a letter, at most 63 characters |
| **Name**          | Display name                                                                                                                                                          | At most 200 characters; optional                                                      |
| **Unit**          | Shown after values                                                                                                                                                    | Free text; optional                                                                   |
| **Aggregation**   | How events of one period combine: **Sum** adds quantities, **Maximum** keeps the highest, **Last value** keeps the value of the event with the newest occurrence time | `sum` (default), `max`, `last`                                                        |
| **Reset period**  | When the counter starts again: **Never resets**, **Daily (UTC)**, **Monthly (UTC)**, **Billing period**                                                               | Default **Monthly (UTC)**                                                             |
| **Default limit** | Limit for tenants without an override and without a plan limit; empty means unlimited                                                                                 | Number of 0 or more; empty                                                            |
| **Enforcement**   | **Hard limit** refuses usage above the limit; **Soft limit** records it and reports the excess                                                                        | Default **Hard limit**                                                                |

Choose the aggregation by what you measure: events that add up (calls, messages) use **Sum**; a
level that you sample (storage in bytes, active seats) uses **Maximum** or **Last value**.

### Reset periods and the billing period {#reset-period}

**Billing period** follows the tenant's subscription cycle: the period starts on the day the
subscription started (for example the 15th) and runs one month or one year, depending on the
price interval. A start day such as the 31st is moved to the last day of shorter months. If the
`billing` module is not enabled, or the tenant has no subscription in **Trial**, **Active** or
**Past due**, the period is the calendar month (UTC). See [Plans and
subscriptions](help:plans-subscriptions).

### Fixed periods, not sliding windows {#fixed-periods}

Limits apply per period, and periods have fixed boundaries: midnight UTC for daily meters, the
first of the month (UTC) for monthly meters. A tenant can use its whole daily limit at 23:50 UTC
and the whole limit again at 00:10 UTC. There are no hourly or sliding quota windows. If you need a
tighter window, use a `day` meter with a smaller limit or an additional meter.

Quotas are not the same as the server's request rate limit (requests per minute per key or IP).
That limit is configured by the operator and is off by default; see
[Server configuration](help:server-configuration).

## Edit, deactivate or delete a meter {#edit-meter}

In the row's action menu (**Actions for meter …**):

- **Edit** changes **Name**, **Unit**, **Description**, **Default limit** and **Enforcement**.
- **Deactivate** stops new usage for the meter: recording against an inactive meter is refused.
  Inactive meters no longer appear in a tenant's **Usage in the period**. **Activate** reverses it.
- **Delete meter** removes a meter that has never recorded usage. You confirm by typing the key.
  A meter with recorded usage cannot be deleted; deactivate it instead.

## Check a tenant's usage and limits {#tenant-usage}

1. Open the **Tenant usage** tab and choose the tenant (or select a tenant in **Totals per tenant**).
2. **Usage in the period** shows a card for every active meter with:
   - the value in the current period, and for limited meters a bar with
     "_used_ of _limit_ used (_n_ %), including reservations";
   - where the limit comes from (see below) and **Hard limit** or **Soft limit**;
   - **Over the limit** when soft-limited usage exceeded the limit;
   - **Period**, **Events**, **Reserved** (if any) and **Remaining**.
3. To look at an earlier period, pick a date in **Period containing**. Leave it empty for the
   current period.

Below follow **Daily usage** (a chart per meter, same ranges as the overview), **Usage events**
(newest first, filter by **Meter**) and **Reservations**.

### Where the effective limit comes from {#limit-source}

The first match wins:

| Badge               | Source                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Tenant override** | A quota override set for this tenant on this screen                                                               |
| **From plan**       | The entitlement `limit.<meter key>` of the tenant's plan, or an entitlement override on the tenant's billing page |
| **Meter default**   | The meter's **Default limit**                                                                                     |
| **No limit**        | None of the above: unlimited                                                                                      |

A plan limit applies only while the subscription is in **Trial**, **Active** or **Past due**. Plan
limits use the meter's **Enforcement**; only a quota override sets its own.

> [!NOTE]
> There are two kinds of tenant overrides. A **quota override** (this screen) replaces the limit
> of one meter, including its enforcement, and always wins. An **entitlement override** on the
> tenant's billing page replaces a plan entitlement and shows as **From plan**. Use one mechanism
> per meter to keep it easy to understand.

## Set or remove a quota override {#quota-override}

Requires the product permission `usage:manage`.

1. In **Usage in the period**, choose **Set override** on the meter's card.
2. Enter a **Limit**. Leave it empty for an unlimited override (the tenant then has no limit even
   if its plan has one).
3. Choose the **Enforcement** and **Save override**.

The badge changes to **Tenant override**. **Remove override** (shown only on cards with a tenant
override) makes the plan limit or the meter default apply again. Overrides take effect for the
next recorded usage; usage already recorded stays. Quota changes are recorded in the audit log.

## Hard and soft limits {#enforcement}

- **Hard limit**: a request that would exceed the limit is refused with HTTP `429` and the error
  code `quota_exceeded`, including the meter, limit, used, reserved and requested quantities and
  when the period ends. For **Sum** meters the check is _used + reserved + requested > limit_; for
  **Maximum** and **Last value** meters it is _requested > limit_.
- **Soft limit**: usage is always recorded. The response and Studio report **Over the limit**, so
  your product can warn or bill the excess.

A hard limit is never overshot by concurrent requests: Axentra serializes the writes for one
tenant, meter and period.

## Record usage (API) {#record-usage}

Studio does not record usage. Your product calls the API with a key that has `usage:record`
(see [API keys](help:api-keys)):

```http
POST /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/usage/events
Authorization: Bearer axk_EXAMPLE_secret
Idempotency-Key: req-7f3a9c
Content-Type: application/json

{"meter": "api_calls", "quantity": 1}
```

- The `Idempotency-Key` header is required (1 to 200 printable ASCII characters). Repeating the
  same key with the same body returns the original event (`200`, `replayed: true`) and counts
  once. The same key with a different body is refused with `409`.
- `quantity`: a number from 0 to 10^15 with at most 6 decimal places.
- `occurred_at` (optional): at most 5 minutes in the future and 400 days in the past. Backdated
  events count in the period they belong to, even if it has ended.
- `properties` (optional): a JSON object of at most 4 KB, shown in **Usage events**.
- `"enforce": false` records without the hard-limit check; this needs the product permission
  `usage:manage`, which tenant-bound keys never have.

The tutorial [Plans and usage end to end](help:tutorial-plan-usage) walks through a complete
example.

## Reservations {#reservations}

For long-running work, a product can **reserve** a quantity before it starts (API:
`POST …/usage/reservations` with `meter`, `quantity` and `ttl_seconds` from 1 to 86 400, default
300). An active reservation counts against the limit, so parallel jobs cannot together exceed it.
When the work is done, the product **commits** the actual quantity, which records a usage event, or
**releases** the reservation. Reservations exist only for **Sum** meters.

The API has no list of reservations, so Studio looks one up by its id:

1. In **Reservations**, paste the **Reservation id** and choose **Look up**.
2. Studio shows **Status**, meter, **Reserved quantity**, **Expires** and, once committed, the
   **Committed quantity** and the **Usage event**.
3. With `usage:record` in the tenant, an **Active** reservation can be finished here:
   - **Commit** records the **Actual quantity** (leave it empty to commit the reserved quantity).
     A commit is never refused by the limit, because the work is already done.
   - **Release** gives the quantity back without recording usage.

| Status        | Meaning                                                         |
| ------------- | --------------------------------------------------------------- |
| **Active**    | Counts against the limit until it expires                       |
| **Committed** | Usage was recorded                                              |
| **Released**  | Given back; no usage recorded                                   |
| **Expired**   | Not committed before **Expires**; stopped counting at that time |

## Good to know {#good-to-know}

- Usage events cannot be changed or deleted, and quantities cannot be negative, so recorded usage
  cannot be subtracted. To give a tenant more room after a mistake, set a
  [quota override](help:usage#quota-override) for the rest of the period.
- Individual usage events are not audited because of their volume; meter and quota changes are.
- A tenant's data is isolated: a foreign tenant id returns "not found".
- Studio shows quantities with up to 6 decimal places, formatted for your language.
- Time series cover at most 400 days.
- More limits are listed under [Known limitations](help:limitations).

## Troubleshooting {#troubleshooting}

| What you see                                    | Why                                                              | What to do                                                                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **No access to usage**                          | Your role lacks `usage:read` for this product or tenant          | Ask a product admin for a role with `usage:read`                                                                      |
| Only the **Tenant usage** tab                   | You have `usage:read` through a tenant role only                 | Expected; the overview needs a product role                                                                           |
| **No meters yet**                               | No meter defined                                                 | Create one on **Meters** (needs `usage:manage`)                                                                       |
| **Conflict** when deleting a meter              | The meter has recorded usage                                     | **Deactivate** it instead                                                                                             |
| **Conflict** "a meter with this key exists"     | Keys are unique per product, also for inactive meters            | Choose another key or activate the old meter                                                                          |
| **Changed in the meantime**                     | Someone else edited the meter                                    | Reload and repeat your change                                                                                         |
| Your product gets `429 quota_exceeded`          | A hard limit would be exceeded                                   | Check the card's limit source; raise the plan limit, set a quota override, or wait for the period end (`Retry-After`) |
| Your product gets `409` "the meter is inactive" | The meter was deactivated                                        | **Activate** it on **Meters**                                                                                         |
| Your product gets `409` for an idempotency key  | The key was reused with a different body                         | Use a new key per distinct usage event                                                                                |
| **Please check your input** when recording      | Quantity, `occurred_at` or `properties` outside the limits above | Fix the value; send `occurred_at` with a time zone                                                                    |
| Commit is refused: "the reservation is expired" | The TTL ran out before the commit                                | Record the usage as a normal event; choose a longer `ttl_seconds`                                                     |
| Usage appears on the wrong day                  | Days are UTC                                                     | Compare with UTC times                                                                                                |
| **Billing period** meter resets on the 1st      | The tenant has no entitled subscription, or billing is disabled  | Subscribe the tenant (see [Plans and subscriptions](help:plans-subscriptions#subscribe))                              |
