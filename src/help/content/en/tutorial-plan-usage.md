---
title: Plans and usage end to end
summary: Define a meter and a plan with a usage limit, subscribe a tenant, record usage through the API and watch the quota in Studio.
keywords: tutorial, walkthrough, example, metering, quota, plan limit, entitlement, subscription, API key, record usage, 429, quota exceeded
related: usage, plans-subscriptions, api-keys, tenants, api-basics
---

In this tutorial you limit the API calls of a customer through its plan. You create a meter
`api_calls`, a free plan **Starter** that allows 1,000 calls per month and enables an export
feature, subscribe the tenant `acme` to it, record usage with an API key and watch the quota fill
up in Studio. At the end you trigger a refused request on purpose. It takes about 15 minutes.

> [!IMPORTANT]
> You need: the `usage` and `billing` modules on the server; a product role with `usage:manage`,
> `billing:manage` and the right to create API keys (for example **Product owner** or **Product
> admin**); a tenant to work with (here `acme`, see [Tenants](help:tenants)); and a terminal with
> `curl`. All ids, keys and addresses below are examples: use your own.

## Step 1: Create the meter {#step-meter}

1. Open [Usage](app:usage), tab **Meters**, and choose **New meter**.
2. Enter:

   | Field             | Value              |
   | ----------------- | ------------------ |
   | **Key**           | `api_calls`        |
   | **Name**          | API calls          |
   | **Unit**          | calls              |
   | **Aggregation**   | **Sum**            |
   | **Reset period**  | **Billing period** |
   | **Default limit** | `100`              |
   | **Enforcement**   | **Hard limit**     |

3. Choose **Create meter**.

The default limit of 100 applies to tenants without a plan limit, for example tenants without a
subscription. **Billing period** makes the counter follow each tenant's subscription cycle. Details:
[Usage and quotas](help:usage#create-meter).

## Step 2: Create a plan with entitlements {#step-plan}

1. Open [Plans](app:plans) and choose **New plan**.
2. **Name**: Starter, **Key**: `starter`, **Trial days**: `0`, **Active** on.
3. Leave **Prices** empty. The plan is free, so the subscription starts immediately with every
   payment provider.
4. Under **Entitlements**, choose **Add entitlement** twice:
   - **Type** **Limit**, **Meter key** `api_calls`, **Limit** `1000`;
   - **Type** **Feature**, **Feature name** `export`, **Enabled** on.
5. Choose **Create plan**.

The plan now carries `limit.api_calls: 1000` and `feature.export: true`. Details:
[Entitlements](help:plans-subscriptions#entitlements).

> [!NOTE]
> A paid plan works the same way, but subscribing needs a checkout at the payment provider
> (unless the server uses the manual provider). See
> [Subscribe a tenant](help:plans-subscriptions#subscribe).

## Step 3: Subscribe the tenant {#step-subscribe}

1. Open [Subscriptions](app:subscriptions). In **Billing of a tenant**, choose `acme` and select
   **Open**.
2. In **Subscription**, choose **Subscribe to a plan**, then **Starter (starter)**, and choose
   **Subscribe**.
3. The subscription shows **Active**. **Effective entitlements** lists `export: on` under
   **Features** and `api_calls` 1,000 under **Limits**.

## Step 4: Create an API key for recording usage {#step-api-key}

1. Open [API keys](app:apiKeys) and choose **New API key**.
2. **Name**: `usage-demo`. In **Tenant scope**, choose `acme`, so the key can only touch this
   tenant.
3. Under **Permissions**, select `usage:record` and `usage:read`.
4. Create the key and copy the secret. It is shown only once.

Store the values you need in your terminal (example values):

```bash
export AX=https://axentra.example.com
export PID=prd_01EXAMPLE
export TID=ten_01EXAMPLE
export KEY=axk_EXAMPLE_secret
```

The product id is shown on the product's page, the tenant id on the tenant's page and on its
billing page. See [API keys](help:api-keys) and [API basics](help:api-basics).

## Step 5: Record usage {#step-record}

Record one API call. Every distinct event needs its own `Idempotency-Key`; your product would use
its request id.

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0001" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 1, "properties": {"endpoint": "/reports"}}'
```

The answer (`201 Created`, shortened) contains the event and the quota after it:

```json
{
  "event": {
    "id": "uev_01EXAMPLE",
    "meter": "api_calls",
    "quantity": 1,
    "idempotency_key": "demo-0001"
  },
  "replayed": false,
  "quota": {
    "meter": "api_calls",
    "used": 1,
    "reserved": 0,
    "limit": 1000,
    "remaining": 999,
    "enforcement": "hard",
    "source": "plan",
    "over_limit": false
  }
}
```

Run the same command again: the answer is `200` with `"replayed": true` and the usage still counts
once. That is what makes retries after a network error safe.

Now record a larger batch with a new key:

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0002" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 950}'
```

`remaining` is now 49.

## Step 6: Watch the quota in Studio {#step-watch}

1. Open [Usage](app:usage), tab **Tenant usage**, and choose `acme` (or select **Usage** in the
   header of the tenant's billing page).
2. The `api_calls` card shows 951 calls, a bar at 95 %, the badges **From plan** and **Hard limit**,
   and **Remaining** 49 calls.
3. **Usage events** lists both events with their idempotency keys and the `endpoint` property.
4. **Daily usage** shows today's bar, and the **Overview** tab shows `acme` in **Totals per tenant**.

## Step 7: Exceed the limit {#step-exceed}

Try to record 50 more calls (951 + 50 > 1,000):

```bash
curl -sS -i -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0003" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 50}'
```

The server answers `429` with a `Retry-After` header and a problem body like this (shortened):

```json
{
  "code": "quota_exceeded",
  "status": 429,
  "detail": "the api_calls limit of this period would be exceeded",
  "meter": "api_calls",
  "limit": 1000,
  "used": 951,
  "reserved": 0,
  "requested": 50,
  "period_end": "2026-12-02T00:00:00+00:00"
}
```

Nothing was recorded. Your product would now refuse the customer's request or offer an upgrade.

## Step 8: Give the tenant more room {#step-override}

Suppose you agree to give `acme` 2,000 calls this period:

1. In **Tenant usage**, choose **Set override** on the `api_calls` card.
2. Enter **Limit** `2000`, keep **Hard limit**, and choose **Save override**.
3. The badge changes to **Tenant override**. Repeat the request from step 7: it is accepted with
   `"source": "quota"`.

Choose **Remove override** to return to the plan limit. To change the limit for every tenant on the
plan, edit the plan's entitlement instead. Details: [Where the effective limit comes
from](help:usage#limit-source).

## What your product does with this {#in-your-product}

- Before an action that costs a metered resource, record the usage. Treat `429 quota_exceeded` as
  "limit reached" and show the customer a clear message.
- Read the tenant's features with
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements` and enable the export
  only when `features.export` is `true`.
- For work that takes long, reserve first and commit later; see
  [Reservations](help:usage#reservations).

## Clean up {#clean-up}

- Revoke the `usage-demo` key on [API keys](app:apiKeys).
- Cancel the subscription on the tenant's billing page with **Cancel now** if you do not need it.
- The meter cannot be deleted because it has usage. **Deactivate** it if you do not want it.
- The plan cannot be deleted because a subscription used it. **Deactivate** it.

## Troubleshooting {#troubleshooting}

| What you see                                   | Why                                                                  | What to do                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `401`                                          | The key is wrong, revoked or expired                                 | Check `$KEY`; create a new key                                       |
| `403`                                          | The key lacks `usage:record`, or is bound to another tenant          | Check the key's permissions and **Tenant scope**                     |
| `404`                                          | Wrong product or tenant id, or the meter key does not exist          | Compare the ids with Studio; check the meter key                     |
| `409` "the meter is inactive"                  | The meter was deactivated                                            | **Activate** it on **Meters**                                        |
| `409` for the idempotency key                  | The key was used before with another body                            | Use a new `Idempotency-Key`                                          |
| `422`                                          | Missing `Idempotency-Key`, or an invalid quantity                    | Send the header; use a quantity of 0 or more with at most 6 decimals |
| The card shows **Meter default** and limit 100 | The subscription is not active, or the plan has no `limit.api_calls` | Check step 2 and step 3                                              |
| `429` earlier than expected                    | Reservations or other events also count                              | Look at **Reserved** and **Usage events**                            |
