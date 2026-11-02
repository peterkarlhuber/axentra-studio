---
title: What are Axentra and Studio?
summary: Axentra is a backend for multi-tenant SaaS products; Axentra Studio is the optional web interface for administering it.
keywords: introduction, about, platform, backend, SaaS, admin console, admin UI, what is, architecture, multi-tenant, server
related: concepts, first-steps, interface, api-basics, modules-reference, security
---

**Axentra** is a backend platform for software-as-a-service (SaaS) products. It provides the
building blocks that almost every multi-tenant application needs, so that you do not have to
build them again in every product. **Axentra Studio** is the web interface in which
administrators, operators and support staff manage an Axentra server: its products, customers,
users, roles, API keys and data.

## What Axentra does {#what-is-axentra}

Axentra takes care of the "plumbing" of a SaaS product:

- **Accounts and sign-in**: users, passwords, browser sessions and single sign-on (OpenID Connect).
- **Customers (tenants)**: each customer organization of your product gets its own tenant, with
  members and invitations. Data of different tenants is strictly separated, also at database level.
- **Access control**: roles, permissions and API keys for machines.
- **Data**: records (JSON documents in collections) and files.
- **Background work**: jobs, schedules, events and webhooks.
- **Commercial features**: usage metering, quotas, plans and subscriptions.
- **Notifications**: email templates and delivery.
- **Audit log**: who did what and when, for every change.

Axentra is one Python package with a PostgreSQL database. It can run in two ways:

- **As an HTTP service** (`axentra serve`): your product and other clients call the versioned API
  under `/v1`.
- **As a library** embedded in your own Python application: your code calls the same services
  in-process.

Both ways use the same services, permission checks and audit log. Which optional parts are active
is decided by the server operator through [modules](help:concepts#modules).

## What Studio is {#what-is-studio}

Studio is a separate web application that runs in your browser. It has **no server of its own and
no special rights**: it talks to the Axentra server only through the same public HTTP API that every
other client uses. What you see and may do in Studio is decided by the Axentra server, based on your
[roles](help:roles-permissions).

Three principles follow from this:

1. **Studio shows only real data.** Every number and list comes from the server. If a module is not
   enabled on the server, Studio says so instead of showing placeholder data.
2. **The server decides, Studio explains.** Studio offers actions according to your permissions.
   If the server still refuses something, Studio explains the refusal and shows the request ID for
   support.
3. **Irreversible actions are deliberate.** Deleting, revoking and suspending ask for confirmation,
   and secrets such as API keys are shown exactly once.

## How Axentra and Studio relate {#how-they-relate}

```diagram
architecture
```

- Your **product** (for example a CRM or a shop) uses Axentra through the HTTP API or as a library.
  Its end users never see Studio.
- **Studio** is one more client of the same API, for the people who run the platform.
- **Machines** (your product's backend, import jobs, integrations) authenticate with
  [API keys](help:api-keys).
- Axentra calls out to the world through **webhooks** and **email**, and optionally signs users in
  through an external **identity provider**.

Studio is **optional**. Everything Studio can do, any API client can do with the same
permissions, and Axentra never depends on Studio. Security never relies on the interface: hiding a
button in Studio is a convenience, the server enforces every rule.

> [!NOTE]
> Studio checks the server's API version when it loads. If the server speaks a different major
> version, or is older than this Studio needs, Studio stops with **Incompatible server version**.
> See [troubleshooting](help:troubleshooting).

## Who uses Studio {#who-uses-studio}

| Who                                              | Typical tasks                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Platform administrators                          | Run the whole installation: create products, assign platform roles, check health and audit. |
| Product operators (product owner, product admin) | Manage one product: tenants, roles, API keys, plans, templates, webhooks.                   |
| Support staff                                    | Read data and answer customer questions, manage members up to their own permissions.        |
| Tenant administrators                            | Manage the members and invitations of their own organization.                               |

You do not need to program to use Studio. A few areas (records, job payloads, product settings)
take JSON input; the examples in the articles are enough to get started.

## Typical scenarios {#scenarios}

- **A new server goes live.** The operator prints a setup token; you create the first platform
  administrator, then the first product. See [first-run setup](help:first-run-setup) and
  [first steps](help:first-steps).
- **A new customer signs a contract.** You create a tenant, invite the customer's administrator and
  create an API key for their integration. See
  [Onboard a customer organization](help:tutorial-onboard-customer).
- **A customer reports "access denied".** You check the member's role, the API key's permissions
  and the denied events in the [audit log](help:audit).
- **An integration needs events.** You register a webhook and watch its deliveries. See
  [Build a webhook receiver](help:tutorial-webhook-receiver).
- **Sales introduces a new price plan.** You define meters, plans and subscriptions. See
  [Plans and usage](help:tutorial-plan-usage).

## What Studio does not do {#what-studio-does-not-do}

- Studio does not install or configure the server. Server settings (modules, sign-in methods,
  allowed origins, the mode) live in the server configuration; Studio only shows the effective,
  non-secret values under **Settings**. See [server configuration](help:server-configuration).
- Studio does not create user accounts directly. Accounts come from first-run setup, from single
  sign-on, or from your product's own code. See [users](help:users).
- Some functions are available only through the API. They are listed in
  [known limitations](help:limitations).

## Troubleshooting {#troubleshooting}

| Situation                                       | What to do                                                                                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Cannot connect to Axentra** when Studio opens | Studio could not load `GET /v1/meta`. Check that the Axentra server runs and that Studio is configured with the right API address. |
| **Incompatible server version**                 | Use a Studio release that matches the server's API version, or update the server.                                                  |
| A sidebar entry shows **Off**                   | The server module behind it is not enabled. Ask the server operator. See [modules](help:concepts#modules).                         |
| An action you expect is missing                 | You probably lack the permission. See [roles and permissions](help:roles-permissions).                                             |
