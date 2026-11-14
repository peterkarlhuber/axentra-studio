# QA kit seed data

Created by `seed_demo.py` on the first start of a fresh kit (about 15 seconds). All data is
synthetic. Convention: every person, company, product and key name ends with `(Test)`; people use
`@example.com` addresses; the system sender is `no-reply@axentra-qa.test`.

## Login

Studio: `http://127.0.0.1:<port>/` (the same origin also serves the API under `/v1`).
Shared password of every test user that can log in:

    Axentra-Test-2026!

(It meets Axentra's policy: at least 12 characters, at least 4 different characters, not equal to
the email address.) The list is also written to `<kit>/_kit/daten/testbenutzer.json` (German texts).

## Users

| Email                       | Name                     | Roles                                                                                                          | What to test                                                                              |
| --------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| alex.admin@example.com      | Alex Admin (Test)        | platform_admin (created through the real first-run setup: `axentra admin setup-token` + `POST /v1/auth/setup`) | Everything: products, users, settings, audit                                              |
| paula.plattform@example.com | Paula Plattform (Test)   | platform_viewer                                                                                                | Read-only across products; every write must be refused. Does not see the archived product |
| otto.inhaber@example.com    | Otto Inhaber (Test)      | product_owner, Beispiel-CRM (Test)                                                                             | Manage product team and product permissions; must not see Beispiel-Shop                   |
| ole.operator@example.com    | Ole Operator (Test)      | product_admin, Beispiel-CRM (Test)                                                                             | Tenants, roles, keys, data; must NOT manage the product team                              |
| sabine.support@example.com  | Sabine Support (Test)    | product_support, Beispiel-CRM (Test)                                                                           | Reads everything; manages members only up to her own permissions                          |
| bea.abrechnung@example.com  | Bea Abrechnung (Test)    | custom product role `abrechnung` "Abrechnung (Test)"                                                           | Meters, plans, subscriptions only                                                         |
| maria.muster@example.com    | Maria Muster (Test)      | tenant_owner, Muster GmbH (Test)                                                                               | Tenant owner view; has 1 inbox message, 1 welcome email                                   |
| jonas.beispiel@example.com  | Jonas Beispiel (Test)    | tenant_admin, Muster GmbH (Test)                                                                               | Cannot grant tenant_owner                                                                 |
| lena.demo@example.com       | Lena Demo (Test)         | member of Muster GmbH (Test) and Demo Handwerk KG (Test)                                                       | Switching tenants; 1 inbox message                                                        |
| tobias.test@example.com     | Tobias Test (Test)       | viewer, Muster GmbH (Test); **account disabled**                                                               | Login fails ("wrong email or password"); enable as admin and retry                        |
| karin.kunde@example.com     | Karin Kunde (Test)       | tenant_owner, Beispiel AG (Test) – **joined by accepting an invitation over the API**                          | Accepted invitation shows in audit                                                        |
| sven.service@example.com    | Sven Service (Test)      | custom tenant role `support_agent` "Support-Mitarbeiter (Test)", Muster GmbH (Test)                            | Read-only custom role                                                                     |
| frieda.verein@example.com   | Frieda Verein (Test)     | tenant_owner of Musterstadt e.V. (Test), which is **suspended**                                                | Logs in but sees no tenant                                                                |
| markus.laden@example.com    | Markus Laden (Test)      | tenant_owner, Musterladen OHG (Test) in Beispiel-Shop (Test)                                                   | Product isolation                                                                         |
| erik.ohne@example.com       | Erik Ohne-Mandant (Test) | none                                                                                                           | User without product or tenant: empty UI                                                  |
| sso.nutzer@example.com      | SSO Nutzer (Test)        | viewer of Demo Handwerk KG (Test); external identity `qa-sso-test` only, **no password**                       | Cannot log in (no IdP in the kit); visible in the user list with its identity             |

How the accounts are created: Axentra's HTTP API has **no endpoint to create a password account**
(only the first-run setup, OIDC logins and `POST /v1/users/external` for SSO-only users exist). The
kit has no identity provider, so `create_test_users.py` calls Axentra's Python API
(`identity.create_user`: same policy check and Argon2 hash as the setup flow) once, as the restricted
runtime DB role, and writes an `identity.user.create` audit entry (actor `system`, reason
`qa-kit-seed`). Everything else goes through the public HTTP API.

## Products and tenants

| Product                                      | Status                            | Tenants                                                                                                                                                                         |
| -------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beispiel-CRM (Test) `beispiel-crm`           | active                            | Muster GmbH (Test), Beispiel AG (Test), Demo Handwerk KG (Test), Musterstadt e.V. (Test) **suspended**, Probe & Partner (Test), Grenzfall Datenhungrig GmbH (Test) (over quota) |
| Beispiel-Shop (Test) `beispiel-shop`         | active                            | Musterladen OHG (Test), Beispiel Boutique (Test)                                                                                                                                |
| Altes Testprodukt (Test) `altes-testprodukt` | **archived** (restore it to test) | Ehemaliger Kunde GmbH (Test)                                                                                                                                                    |

## Data per area (Beispiel-CRM unless noted)

- **Custom roles**: `support_agent` (tenant scope, read-only), `abrechnung` (product scope, usage + billing).
- **Invitations**: open: neue.kollegin@example.com (member) and aushilfe@example.com (viewer) to Muster GmbH,
  buchhaltung@example.com (tenant_admin) to Beispiel AG, neuer.operator@example.com (product_viewer) to the
  product team; revoked: zurueckgezogen@example.com (Demo Handwerk KG); accepted: Karin Kunde.
  Every invitation email is in the mail catcher (link `http://127.0.0.1:<port>/accept-invitation?token=...`).
- **API keys**: `crm-backend (Test)` active and used (it wrote the Muster GmbH contacts);
  `import-worker Muster GmbH (Test, laeuft bald ab)` tenant key expiring in 3 days;
  `reporting nur lesend (Test)`; `alter Schluessel (Test, widerrufen)` revoked;
  `Kurzzeit-Schluessel (Test, abgelaufen)` expired (20 s after creation);
  `rotierter Schluessel (Test)` rotated (old key in 24 h grace period, new key active); Shop: `shop-frontend (Test)`.
  Key secrets are never shown again (as in production).
- **Records**: collection `kontakte` (6 in Muster GmbH, 2 in Beispiel AG, 30 in Grenzfall for paging),
  `notizen` (2), `aufgaben` (1); Shop/Musterladen: `artikel` (1).
- **Search**: 4 documents of kind `kontakt` in Muster GmbH (try "Mustermann").
- **Files**: Muster GmbH: `angebot-2026-11.pdf`, `firmenlogo.png`, `kontakte-export.csv`, `protokoll-kickoff.txt`;
  Beispiel AG: `vertrag-entwurf.pdf`; Grenzfall: 3 × 90 KiB `.bin` with quota 300 KiB / 3 files
  (**file quota full**, a 4th upload is refused with 429).
- **Usage**: meters `api_calls` (hard, default 10 000), `aktive_benutzer` (max), `berichte` (soft, 50);
  20 days of events for 4 tenants (only the current month counts). **Over quota**: Grenzfall
  `api_calls` 1180 / 1000 hard (an enforced event is refused with 429). **Near quota**: Beispiel AG
  `berichte` 18 / 20 (soft) and `api_calls` ~80 % of its Starter limit 2000. Reservation of 500
  `api_calls` in Muster GmbH (24 h).
- **Billing** (fake provider): plans Starter (free), Professional (14-day trial, 49 €/month, 490 €/year),
  Enterprise (199 €/month), Basis alt (inactive). Subscriptions: Muster GmbH Professional **trialing**;
  Beispiel AG Starter **active** + override `feature.export`; Demo Handwerk KG Enterprise **active**;
  Probe & Partner Enterprise **past_due** (signed `invoice.payment_failed`); Grenzfall Professional
  **incomplete** (checkout never paid); Musterstadt e.V. none.
- **Webhooks**: 3 endpoints to `http://127.0.0.1:9/qa-webhook-empfaenger/...` (closed port): product-wide
  `kontakt.*`, `rechnung.erstellt`; tenant Muster GmbH `kontakt.erstellt`; one disabled (`*`).
  Deliveries **fail** ("Connection refused"), retry 4× within minutes, then end as failed.
- **Events**: 5 (`kontakt.erstellt` ×2, `kontakt.geaendert`, `rechnung.erstellt`, `angebot.versendet`).
- **Jobs**: 6 product jobs whose kinds no worker in the kit handles: 4 stay **queued**, 1 delayed by
  24 h, `crm.sync.extern` **cancelled**. Axentra's own jobs (event dispatch: succeeded; webhook
  delivery: retrying/failed) appear too.
- **Schedules**: "Monatsbericht (Test)" (cron `0 6 1 * *`), "Naechtlicher Kontakt-Import (Test)"
  (cron, tenant Muster GmbH), "Index auffrischen (Test, pausiert)" (interval, disabled).
- **Notifications**: templates `willkommen` (de/en, HTML), `rechnung.bereit` (de/en), `hinweis.wartung`
  (inbox channel). Sent: 2 welcome emails, 1 invoice email to buchhaltung@example.com, 2 inbox
  messages (Maria, Lena), plus Axentra's own invitation emails (6). All emails land in the catcher.
- **Audit**: produced by all of the above, including a refused storage upload and usage event.

## Deliberate edge cases (summary)

Archived product; suspended tenant (with an owner); disabled user; user without any role; SSO-only
user without password; over-quota tenant (usage and storage); near-quota tenant; expired, revoked,
expiring and rotated API keys; open, revoked and accepted invitations; failing webhooks; past_due and
incomplete subscriptions; queued jobs without a handler; a paused schedule; a disabled webhook.

## Known problems (Axentra, not the kit)

- **Fake payment provider after a restart** (fixed in axentra #80, merge `17e9bb4`): checkout ids used to
  restart at `cs_fake_000001` in every web process, so checkouts after a kit restart failed with HTTP 500.
  They now carry the subscription id.

## Integration matrix

| Integration       | State                          | Reason                                                                                                                                                                                                                                                       |
| ----------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OIDC / SSO        | not configured                 | The repos have no reusable local identity provider (tests use an in-process httpx mock). One SSO-only user record shows how such users look                                                                                                                  |
| SMTP / email      | real local                     | Axentra's real SMTP provider delivers to the kit's catcher on 127.0.0.1 (plain SMTP on loopback, no TLS, no auth; stored as .eml). Nothing leaves the PC. Studio's "Mailbox" panel only works with the `local` provider and therefore says it is unavailable |
| S3                | not configured                 | Local filesystem backend inside the kit's state folder                                                                                                                                                                                                       |
| Stripe / payments | simulated                      | `billing.provider = "fake"`, `live_payments = false`: checkout returns `https://checkout.fake.invalid/...` (does not open); the seed completes checkouts with webhook events signed with the kit's own fake-provider secret                                  |
| Webhooks          | real local, failing on purpose | Real delivery jobs to a closed local port (needs `events.webhook_allow_http` and `webhook_allow_private_targets`, both test-only settings refused in production)                                                                                             |
| OpenTelemetry     | not configured                 | `observability.otel_enabled = false`; `/metrics` is served locally                                                                                                                                                                                           |
| API docs          | real local                     | `/v1/docs` with `security.api_docs = "authenticated"`: works when logged in to Studio (same-origin cookie), 401 otherwise                                                                                                                                    |

## Security model kept

Separate DB roles exactly as Axentra's deployment docs: `axentra_owner` owns the schema and runs
migrations (`database.migration_url_ref`); API, worker and dispatcher connect as `axentra_app`
(no superuser, no BYPASSRLS, no tables owned; `axentra db inspect-role` reports `restricted: true`);
`database.allow_table_owner = false`. Random per-install secrets (DB passwords, AES keyring, fake
billing webhook secret) in `secrets/` (0700/0600 files), referenced as `file:` refs, never inline.
`environment = "development"` (not production).
