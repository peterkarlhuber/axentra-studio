---
title: Server configuration for Studio
summary: What operators configure so that Studio works - the API address in config.json, allowed origins, modules, single or multi-product mode and the version check.
keywords: operator, administrator, deployment, install, configuration, config.json, apiBaseUrl, reverse proxy, CORS, allowed origins, same-site, modules, enable module, single product, multi product, mode, compatibility, version, Docker, backup, restore, observability
related: settings, health-monitoring, api-basics, security, modules-reference, limitations
---

This article is for the people who run Axentra and Studio. It covers only what matters for
Studio: how Studio finds the API, what the API must allow, how modules and the deployment mode
change what Studio shows, and how Studio checks that it fits the server version. The full server
configuration is documented in the backend repository (see [Further reading](#further-reading)).

Studio is a static web app. It has no server, database or secrets of its own; everything it
shows comes from the Axentra API, and every permission decision is made by the API.

```diagram
architecture
```

## Tell Studio where the API is: config.json {#studio-config}

When Studio starts, it loads `/config.json` from its own address, before anything else. One build
therefore works in every environment.

```json
{ "apiBaseUrl": "" }
```

| `apiBaseUrl`                | Meaning                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `""` (default)              | **Same origin** (recommended): a reverse proxy serves Studio and forwards `/v1` (and `/metrics`) to the API on the same address |
| `"https://api.example.com"` | The API runs on another address. Give the origin only; a trailing `/` or `/v1` is removed                                       |

If `/config.json` is missing or invalid, Studio uses the same origin.

With the Studio container image you do not write the file yourself:

| Variable                  | Effect                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `AXENTRA_API_URL`         | The container proxies `/v1` and `/metrics` to this API address (same-origin setup)                         |
| `AXENTRA_PUBLIC_API_URL`  | Written to `config.json` as `apiBaseUrl` and allowed in the Content-Security-Policy (separate API address) |
| `AXENTRA_CSP_CONNECT_SRC` | Additional addresses Studio may connect to                                                                 |

## Let the API accept Studio {#allowed-origins}

The API refuses signed-in browser requests from unknown origins. Configure on the Axentra server:

- `security.allowed_origins`: add Studio's public address, for example
  `["https://studio.example.com"]`, unless Studio runs on the API's own `public_url`. In
  production only explicit `https://` origins are accepted; `*` is never allowed.
- `security.public_url`: the API's external `https://` address. It enables secure cookies.
- `security.trusted_proxies`: the proxies in front of the API, so that the client IP in the audit
  log and in rate limits is the user's, not the proxy's.

> [!WARNING]
> With a separate API address, Studio and the API must be on the **same site** (for example
> `studio.example.com` and `api.example.com`). The session cookie is `SameSite=Lax`, so a
> cross-site setup cannot sign in. Same origin is the tested and recommended setup.

For single sign-on, the identity provider returns to an absolute Studio address, which the API
must accept as a redirect target.

## Enable modules {#modules}

The server setting `modules` decides which parts of Axentra run. The modules `identity`,
`tenancy`, `access` and `audit` are always on. The others are optional:

| Module               | Studio sections                                   |
| -------------------- | ------------------------------------------------- |
| `data`               | **Data overview**, **Records**                    |
| `storage`            | **Files**                                         |
| `events`             | **Jobs**, **Schedules**, **Events**, **Webhooks** |
| `usage`              | **Usage**                                         |
| `billing`            | **Plans**, **Subscriptions**                      |
| `notify`             | **Notifications**                                 |
| `search`, `realtime` | No Studio screens; available through the API only |

Studio reads the module list from `GET /v1/meta` once when it loads:

- A section whose module is off stays in the sidebar, marked **Off**, and opens
  **Module not enabled on this server**.
- A module that is on but has no screens in this Studio release shows
  **Not yet available in Studio**.

To change modules, edit the server configuration (for example
`modules = ["identity", "tenancy", "access", "audit", "data", "storage", "events"]` or the
environment variable `AXENTRA__MODULES`), restart the API, then reload Studio. The active list is
shown under `modules` on the [Settings](help:settings#settings-tree) page. See
[Modules reference](help:modules-reference).

> [!NOTE]
> Turning a module off unmounts its endpoints; its data stays in the database and is back when you
> turn the module on again.

## Single or multi-product deployment {#deployment-modes}

The server's `mode` decides how many products it serves. Studio reads it from `GET /v1/meta`.

|                                   | `single` (server default)                                                         | `multi`                                           |
| --------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------- |
| Products                          | Exactly one, created on first start from the `[product]` section (`slug`, `name`) | Any number, created by platform administrators    |
| Start page                        | The product's dashboard                                                           | The last used product, otherwise the product list |
| Top bar                           | The product's name, no switcher                                                   | Product switcher                                  |
| **New product**, archive, restore | Not offered (the API answers `409 mode_not_supported`)                            | With `products:create` / `products:archive`       |
| Unknown product ID in the address | Redirect to the same section of the one product                                   | **Not found**                                     |

Everything else (tenants, users, roles, data, audit) works the same in both modes. User accounts
belong to the installation in both modes. Switching an installation from `single` to `multi` is a
configuration change without data migration.

## Compatibility check between Studio and the API {#compatibility}

Each Studio build declares the API version it needs (**Required API version**, currently `1.0`).
At start, Studio reads `api_version` from `GET /v1/meta`:

| Server API version                                          | Result                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| Same major, same or higher minor (for example `1.0`, `1.3`) | Studio starts                                                             |
| Lower minor (for example server `1.0`, Studio needs `1.2`)  | **Incompatible server version**: update the server or use an older Studio |
| Different major (for example `2.0`)                         | **Incompatible server version**: use a Studio release for that major      |
| Not readable                                                | **Incompatible server version** with the raw value                        |

On refusal nothing else loads, so an unsuitable server never receives writes from Studio. Both
versions are shown on [System health](help:health-monitoring#versions). The combinations that
were tested together are listed in Studio's `docs/COMPATIBILITY.md`.

> [!TIP]
> After upgrading the server, reload open Studio tabs: the check runs only when Studio loads.

If Studio shows **Cannot connect to Axentra** instead, it could not load `GET /v1/meta` at all;
see [Troubleshooting](#troubleshooting).

## Server settings that change what users see {#user-visible-settings}

| Server setting                                        | Effect in Studio                                                                                              | Default                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `security.password_login`                             | Password sign-in form on the sign-in page                                                                     | on                                    |
| `[[oidc]]` providers                                  | Single sign-on buttons on the sign-in page                                                                    | none                                  |
| `security.session_ttl_hours` / `session_idle_minutes` | When users must sign in again                                                                                 | 12 h / 120 min                        |
| `security.password_min_length`                        | Minimum length for new passwords                                                                              | 12                                    |
| `security.first_password` / `fresh_login_minutes`     | Whether and how quickly single sign-on users can set a password in their [profile](help:profile#set-password) | allowed within 5 min                  |
| `security.max_body_bytes`, `storage.max_file_bytes`   | Largest request and file upload                                                                               | 10 MiB / 50 MiB                       |
| `observability.metrics_enabled` / `metrics_token_ref` | Whether **Metrics** on Monitoring shows data or asks for a token                                              | on; off in production without a token |
| `observability.audit_retention_days`                  | How far back the audit log goes after `axentra maintenance purge`                                             | 365                                   |

Change these in the server's TOML file or as environment variables
`AXENTRA__<SECTION>__<KEY>` (for example `AXENTRA__SECURITY__SESSION_TTL_HOURS=8`) and restart
the API. Secrets are always given as references (`env:NAME` or `file:/path`), never inline in
production.

## Further reading {#further-reading}

In the Axentra backend repository:

- `docs/operations/CONFIGURATION.md`: every setting with its default and environment variable.
- `docs/operations/DEPLOYMENT.md`: container image, compose stacks and the production checklist.
- `docs/architecture/DEPLOYMENT_MODELS.md`: single and multi-product mode in depth.
- `docs/operations/BACKUP_RESTORE.md`: database backup, restore and how to verify a restore.
  Studio holds no data, so backing up the database is enough.
- `docs/operations/OBSERVABILITY.md`: metrics, tracing, logs, health checks and retention.
- `docs/architecture/VERSIONING.md`: version numbers and compatibility rules.

In the Studio repository: `README.md` (configuration and container image) and
`docs/COMPATIBILITY.md` (tested combinations).

## Troubleshooting {#troubleshooting}

- **Cannot connect to Axentra**: Studio could not load `GET /v1/meta`. Check that the API runs,
  that `apiBaseUrl` in `/config.json` is right (or that the proxy forwards `/v1`), and, with a
  separate API address, that the Content-Security-Policy allows it.
- Sign-in fails with **Not permitted** or every change fails with **Not permitted**: the API
  refuses Studio's origin. Add Studio's address to `security.allowed_origins` and restart the API.
- Sign-in seems to work but you are immediately signed out again: Studio and the API are on
  different sites, or the API's `public_url` is `https://` while users reach it over `http://`.
  Use the same origin or a same-site setup over HTTPS.
- **Incompatible server version**: see [Compatibility check](#compatibility).
- **Module not enabled on this server**: enable the module listed in the message on the server
  and reload Studio.
- **Not available in this mode**: the action needs `multi` mode; the server runs in `single`
  mode.
- Audit log shows the proxy's address as **IP address**: add the proxy to
  `security.trusted_proxies`.
