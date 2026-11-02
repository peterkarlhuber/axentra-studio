---
title: Frequently asked questions
summary: Short answers to the questions people ask most often about Studio, with links to the details.
keywords: FAQ, questions, how do I, why, help, answers, common questions
related: troubleshooting, limitations, permissions-reference, security, glossary
---

Short answers to common questions. Each answer links to the article with the details.

## Can I create user accounts in Studio? {#create-users}

No. Accounts are created during the [first-run setup](help:first-run-setup), when someone
accepts an invitation, or at the first sign-in through single sign-on. In Studio you invite people
to a tenant or add existing accounts as members. See
[Members and invitations](help:members-invitations).

## How do I make someone a product operator? {#add-operator}

Axentra has no invitations at product level. The person needs an account you can see: invite them
to one of the product's tenants first; once they have accepted, add them on the product page
under **Members**. A platform administrator can add any existing account directly. See
[Products](help:products).

## What is the difference between a product role and a tenant role? {#product-vs-tenant-role}

A tenant role (for example **Member**) applies only in that one tenant. A product role (for
example **Product admin**) applies to the product as a whole _and_ to every tenant in it. Give
product roles only to people who need that reach. See
[Roles and permissions](help:roles-permissions).

## What is the difference between Owner and Admin of a tenant? {#owner-vs-admin}

They have the same permissions. Only an **Owner** (or someone with authority from the product or
platform) can make someone an owner, or change or remove an owner. Every tenant keeps at least
one owner. See [role ceiling](help:security#role-ceiling).

## Why can I not choose some roles? {#roles-greyed-out}

Studio marks roles you may not assign with **"… (above your permissions)"**: they contain
permissions you do not hold yourself, or they are an owner role and you are not an owner.
Nobody can hand out more rights than they have. See [role ceiling](help:security#role-ceiling).

## I lost the secret of an API key. Can I see it again? {#lost-secret}

No. Secrets are shown exactly once and the server keeps only a hash. Use **Rotate secret** to get
a new one; a grace period keeps the old secret working while you update your services. See
[API keys](help:api-keys).

## What happens to the data when I suspend a tenant? {#suspend-data}

Nothing is deleted. Members and API keys lose access until the tenant is reactivated; platform
administrators can still inspect it. Product owners and admins can reactivate it from the tenant's page in
Studio. Deleting a tenant, in contrast, removes the tenant and all
its data and cannot be undone. See [Tenants](help:tenants).

## Why do I see "Not found" for something that exists? {#not-found-exists}

If you have no relation to a product or tenant, Axentra answers exactly as if it did not exist,
so that nobody can discover which products, tenants or accounts there are. Ask someone with access
to add you. See [Not found](help:troubleshooting#not-found).

## Why is an area in the sidebar marked "Off"? {#area-off}

The server module behind it is switched off. An operator can enable it in the server
configuration. See the [modules reference](help:modules-reference).

## Why is a button missing for me? {#button-missing}

Studio hides actions your permissions do not allow, and some actions depend on the server mode
(for example **New product** exists only in multi-product mode). Look up the permission in the
[permissions reference](help:permissions-reference).

## Why was I signed out? {#signed-out}

Sessions end after a maximum lifetime, after a period of inactivity, when they are revoked, when
your account is disabled, and when your password was changed in another session. Sign in again;
Studio brings you back to the page you were on. See [Security](help:security#sessions).

## Can I pay or store a credit card in Studio? {#payment}

No. Studio never asks for card or bank details. Paid plans go through the payment provider's
hosted checkout page. See [Plans and subscriptions](help:plans-subscriptions).

## Can I edit records in Studio? {#edit-records}

Yes, with the `records:write` permission in that tenant. Saving replaces the record's whole JSON
object. See [Records](help:records).

## Why do schedule times look different from what I entered? {#utc}

Schedules run in UTC (without daylight saving time). Studio shows next and last run in your own
time zone. See [Schedules](help:schedules).

## Where do I change the server configuration? {#server-config}

Not in Studio. The **Settings** page shows the effective configuration; changes are made on the
server by an operator. See [Settings](help:settings) and
[server configuration](help:server-configuration).

## Why are some texts in English when I use another language? {#english-texts}

Descriptions of built-in roles and permissions and the **Server message** in error details come
from the server and are always English. Everything else in Studio is translated.

## How do I report a problem? {#report-problem}

Open **Technical details** in the error message and copy the **Request ID** (`req_…`). Send it
to your operator together with the time and what you did. See
[the request ID](help:troubleshooting#request-id).

## Does Studio work on a phone? {#mobile}

Yes. On narrow screens the sidebar becomes a drawer behind **Open navigation**, and less
important table columns are hidden. See [Keyboard and accessibility](help:keyboard-accessibility#zoom).

## Can I use Studio with only the keyboard or a screen reader? {#accessibility}

Yes. Every function works with the keyboard, and Studio is designed to meet WCAG 2.1 AA. See
[Keyboard and accessibility](help:keyboard-accessibility).
