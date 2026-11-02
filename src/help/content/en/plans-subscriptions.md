---
title: Plans and subscriptions
summary: Create plans with prices and entitlements, subscribe tenants, manage their subscriptions and understand the payment provider.
keywords: billing, plan, pricing, price, tier, subscription, entitlement, feature flag, limit, trial, cancel, past due, Stripe, checkout, payment provider, manual billing
related: usage, tutorial-plan-usage, tenants, settings, limitations
---

A **plan** describes what a tenant gets: its prices, a trial length and its **entitlements**
(features that are on or off, and usage limits per meter). A **subscription** connects one tenant
to one plan and has a status, such as **Trial**, **Active** or **Past due**. Your product asks
Axentra for a tenant's effective entitlements to decide what the tenant may do; the usage module
takes its default quotas from them. Product operators use these screens to set up plans and to
support customers with their subscriptions.

> [!IMPORTANT]
> These screens need the `billing` module on the server; without it, **Plans** and
> **Subscriptions** are not shown. **Plans** and **Subscriptions** need `billing:read` through a
> product role; a tenant's billing page needs `billing:read` in that tenant. Every change needs
> `billing:manage`. See [Roles and permissions](help:roles-permissions).

> [!CAUTION]
> Studio never asks for card or bank details, and Axentra stores none. Payment details are entered
> only on the payment provider's hosted checkout page. Invoices, taxes, receipts and refunds are
> handled by the provider and the operator, not by Axentra.

## Create a plan {#create-plan}

1. Open [Plans](app:plans) (group **Usage & Billing**) and choose **New plan**.
2. Enter a **Name** and a **Key**, for example `pro`. The key cannot be changed later; your
   product and the API refer to the plan by it.
3. Optional: **Description** and **Trial days** (0 to 365). New subscriptions to a plan with trial
   days start in **Trial**.
4. Leave **Active** on so the plan can be chosen for new subscriptions.
5. Under **Prices**, choose **Add price** for each price (see [Prices](help:plans-subscriptions#prices)).
   Without prices the plan is free.
6. Under **Entitlements**, add features and limits (see
   [Entitlements](help:plans-subscriptions#entitlements)).
7. Choose **Create plan**.

### Plan settings {#plan-settings}

| Setting          | What it does                                                           | Allowed values / default                                                                                 |
| ---------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Name**         | Display name                                                           | 1 to 200 characters; required                                                                            |
| **Key**          | Identifier of the plan                                                 | Lowercase letters, digits, `_` and `-`, starting with a letter, at most 63 characters; cannot be changed |
| **Description**  | Free text                                                              | At most 2000 characters                                                                                  |
| **Trial days**   | Length of the trial of new subscriptions                               | 0 to 365; default 0 (no trial)                                                                           |
| **Active**       | Only active plans can be chosen for new subscriptions and plan changes | On by default                                                                                            |
| **Prices**       | Amount, currency, interval and provider price id                       | At most 20 per plan                                                                                      |
| **Entitlements** | Features and limits                                                    | At most 200 entries                                                                                      |

### Prices {#prices}

Each price has an **Amount**, a **Currency**, an **Interval** and an optional **Provider price id**.

- Enter the amount in normal currency units, for example `19.90`. Axentra stores it as an integer
  in minor units (cents); Studio shows the stored value below the field ("Stored as 1990 minor
  units"). Currencies without minor units (such as JPY) take whole numbers.
- **Currency** is a three-letter ISO 4217 code such as `EUR` or `USD`.
- **Interval**: **month** or **year**. It also sets the length of the subscription's billing
  period.
- **Provider price id**: with Stripe, the id of the price you created in Stripe (letters, digits
  and `_`, for example `price_1EXAMPLE`). Axentra maps Stripe's updates back to the plan by it.

A plan with no prices, or only zero prices, is **Free**. A plan may have several prices (for
example monthly and yearly); then you choose one when subscribing a tenant. Existing subscriptions
keep a copy of the price they were started with, so later price changes do not affect them.

### Entitlements {#entitlements}

Entitlements are a flat list of keys. In the editor, choose the **Type** of each row:

| Type        | Stored as                                          | Value                                        |
| ----------- | -------------------------------------------------- | -------------------------------------------- |
| **Feature** | `feature.<name>`, for example `feature.sso`        | **Enabled** on or off                        |
| **Limit**   | `limit.<meter key>`, for example `limit.api_calls` | A number of 0 or more; empty means unlimited |

Names use lowercase letters, digits, `_` and `.`, starting with a letter. A **Limit** sets the
quota of the usage meter with that key per reset period; when the `usage` module is readable,
Studio suggests the existing meter keys. A limit for a key that has no meter has no effect. Plan
limits use the meter's enforcement (hard or soft). See [Usage and quotas](help:usage#limit-source).

What a feature such as `feature.sso` means is up to your product: Axentra only stores and returns
it.

## Edit, deactivate or delete a plan {#edit-plan}

In the row's action menu (**Actions for plan …**):

- **Edit** changes everything except the key. Changed entitlements apply immediately to every
  tenant on the plan. Changed prices apply to new subscriptions only.
- **Deactivate** hides the plan from new subscriptions and plan changes. Existing subscriptions
  continue. **Activate** reverses it.
- **Delete plan** removes a plan that no subscription uses; you confirm by typing the plan key.
  Plans in use (also by canceled subscriptions) cannot be deleted; deactivate them instead.

## Subscriptions overview {#subscriptions}

[Subscriptions](app:subscriptions) lists the subscriptions of all tenants, newest first, with
**Tenant**, **Plan**, **Status**, **Price**, **Period ends**, **Trial ends** and **Provider**.
Filter by **Status** and **Plan**. Select a tenant to open its billing page.

To open a tenant that has no subscription yet, choose it in **Billing of a tenant** and select
**Open**.

### Subscription statuses {#status}

| Status         | Meaning                                  | Entitlements apply |
| -------------- | ---------------------------------------- | ------------------ |
| **Incomplete** | Waiting for the checkout at the provider | No                 |
| **Trial**      | Trial days are running                   | Yes                |
| **Active**     | Running subscription                     | Yes                |
| **Past due**   | Payment is overdue; a grace period       | Yes                |
| **Canceled**   | Ended; final                             | No                 |

Allowed changes: Incomplete → Trial, Active or Canceled; Trial → Active, Past due or Canceled;
Active → Past due or Canceled; Past due → Active or Canceled. A canceled subscription cannot be
reactivated: subscribe the tenant again.

## Subscribe a tenant {#subscribe}

1. Open the tenant's billing page (from **Subscriptions**, or **Billing of a tenant**).
2. In **Subscription**, choose **Subscribe to a plan**.
3. Choose the plan in **Choose a plan**, and the **Price** if the plan has several.
4. Choose **Subscribe**.

What happens depends on the plan and the payment provider:

- **Free plans**, and any plan with the **Manual** provider, start immediately in **Trial** (if
  the plan has trial days) or **Active**.
- **Paid plans with the test provider or Stripe** need a checkout. The button reads **Start
  checkout**. Studio creates a checkout session and shows **Open checkout page**, which opens the
  provider's hosted page in a new tab. The subscription stays **Incomplete** until the provider
  confirms the payment through its webhook.
- When **Live payments** are on, Studio does not start real-money checkouts. Use your product's
  own checkout flow.

A tenant has at most one current (not canceled) subscription.

## Change the plan {#change-plan}

**Change plan** switches the tenant to another active plan (or another price of the same plan).
There is no proration: Axentra does not calculate credits or extra charges. The new plan's
entitlements apply immediately.

- Stripe subscriptions are changed in Stripe (for example in Stripe's customer portal); the webhook
  then updates Axentra. Studio hides **Change plan** for them.
- A subscription created without payment (manual) cannot be changed to a paid plan while a
  real provider is configured; cancel it and subscribe again with a checkout.
- **Incomplete** subscriptions cannot change their plan; finish or restart the checkout.

## Cancel or resume {#cancel}

- **Cancel at period end**: the subscription stays usable until the end of the current period,
  then ends. **Resume** withdraws the scheduled cancellation.
- **Cancel now**: the subscription ends immediately and its entitlements stop. You confirm by
  typing the plan key. This cannot be undone.

For Stripe subscriptions, Axentra passes the cancellation to Stripe first.

> [!IMPORTANT]
> With the **Manual** provider, trials end, periods roll forward and "cancel at period end" takes
> effect only when the operator runs the scheduled billing task (`advance_periods`, for example
> hourly). If trials never end, ask your operator to schedule it.

## Set the status (manual provider) {#set-status}

With the **Manual** provider you collect payment outside Axentra and record the result. Choose
**Set status**, then the **New status**: for example **Past due** when an invoice is unpaid, or
**Active** when it is paid. Only allowed transitions are offered. Setting **Active** during a trial
ends the trial now. Subscriptions of other providers get their status from the provider's
webhooks.

## Effective entitlements and overrides {#overrides}

**Effective entitlements** on the tenant's billing page shows what the tenant gets now: the
**Plan** (with its status), **Features**, **Limits** and **Overrides**. They are the plan's
entitlements while the subscription is in **Trial**, **Active** or **Past due**, merged with the
tenant's overrides. Without such a subscription the tenant gets only its overrides
(**No entitled subscription**).

To give one tenant something different from its plan, choose **Edit overrides**, add or change
rows in the same editor as for plans and choose **Save overrides**.

> [!WARNING]
> Saving replaces all overrides of the tenant. A row you remove from the list is removed from
> the tenant. Overrides stay when the plan changes or the subscription ends.

To raise only one usage limit, a quota override on the **Usage** screen is often clearer; see
[Usage and quotas](help:usage#quota-override). **Usage** in the page header opens the tenant's
usage.

## Payment provider {#payment-provider}

The **Payment provider** card on **Plans** and **Subscriptions** shows the server's configuration:

| Provider               | Behavior                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Manual**             | Payment is collected outside Axentra. Subscriptions are created directly; an operator sets their status.                             |
| **Test double (fake)** | Deterministic test provider without network access; paid plans go through a simulated checkout. Refused by the server in production. |
| **Stripe**             | Paid plans go through Stripe Checkout; Stripe webhooks update the subscriptions.                                                     |

**Live payments** shows whether real-money payments are enabled (Stripe only). **Checkout from
Studio** says whether Studio can start a hosted checkout: only for the test provider or for Stripe
with live payments off.

The provider is chosen by the operator in the server configuration (`billing.provider`); it
cannot be changed in Studio. The card needs `platform:settings` or `product:manage`; otherwise it
says that the configuration is not visible to you. See [Settings](help:settings) and
[Server configuration](help:server-configuration).

## For developers {#developers}

- Read a tenant's effective entitlements with
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements`
  (`billing:read`). The response has `features` (name → true/false), `limits` (meter key → number
  or `null` for unlimited), `plan_key`, `subscription_status` and `overrides`.
- Tenant self-service purchases go through your product's backend with an API key that has
  `billing:manage`; there is no tenant permission for self-service checkout.
- Checkout return addresses (`success_url`, `cancel_url`) must start with the server's public URL
  or one of its allowed origins. Studio uses its own page address.
- Subscription changes are audited (`billing.subscription.*`) and, when the events module is
  enabled, published as events of the same name, so a webhook can react to them. See
  [Events](help:events).
- Stripe webhooks are verified by signature and processed once per event id; outdated events are
  ignored.

## Good to know {#good-to-know}

- No proration, coupons, taxes, invoices, seat quantities or usage-based prices.
- No customer portal endpoint; Stripe plan changes happen in Stripe.
- `past_due` keeps the entitlements; decide in your product whether to restrict anything.
- See [Known limitations](help:limitations).

## Troubleshooting {#troubleshooting}

| What you see                                                                   | Why                                                                                | What to do                                                                         |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **No access to billing**                                                       | Your role lacks `billing:read` (product-level for **Plans** and **Subscriptions**) | Ask a product admin for a suitable role                                            |
| **Conflict** when deleting a plan                                              | Subscriptions use the plan                                                         | **Deactivate** it instead                                                          |
| **Conflict** "a plan with this key exists"                                     | Plan keys are unique per product                                                   | Choose another key                                                                 |
| A plan is missing in **Choose a plan**                                         | It is inactive                                                                     | Activate it on **Plans**                                                           |
| **Conflict** "paid plans need a checkout …"                                    | Subscribing to a paid plan with the test provider or Stripe                        | Use **Start checkout**, or the product's own checkout when live payments are on    |
| "This paid plan needs a checkout, which the server does not offer here"        | Live payments are on, or the provider is unknown to you                            | Use your product's checkout                                                        |
| **Conflict** "the tenant already has a subscription"                           | A current subscription exists                                                      | Use **Change plan**, or cancel first                                               |
| **Not available in this mode** when changing the plan                          | The subscription is managed by Stripe                                              | Change it in Stripe                                                                |
| **Please check your input**: "redirect URLs must start with an allowed origin" | Studio's address is not the server's public URL or an allowed origin               | Ask the operator to add Studio's origin to `security.allowed_origins`              |
| The subscription stays **Incomplete**                                          | The checkout was not finished, or the webhook does not reach the server            | Open the checkout again; ask the operator to check the webhook endpoint and secret |
| Trial does not end (manual)                                                    | The billing task is not scheduled                                                  | Ask the operator to schedule `advance_periods`                                     |
| **Changed in the meantime**                                                    | Someone else changed the plan or subscription                                      | Reload and repeat                                                                  |
| Limits do not apply after cancellation                                         | Canceled subscriptions grant no entitlements                                       | Expected; the meter default or quota override applies                              |
