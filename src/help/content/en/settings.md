---
title: Settings
summary: Choose your language and theme, and look up the effective configuration of the Axentra server.
keywords: settings, preferences, language, theme, dark mode, light mode, server configuration, effective settings, config, modules, session lifetime, limits
related: profile, server-configuration, health-monitoring, security, interface
---

The **Settings** page has two parts. **Preferences** are your own choices for Studio: the
interface language and the theme. **Server configuration** shows how the Axentra server is
configured right now, for example which modules are enabled, how long sessions last and which
limits apply. The server configuration is read-only in Studio: it is changed by the operator on
the server.

Open it with **Settings** at the bottom of the sidebar ([open](app:settings)).

## Change language and theme {#preferences}

1. Under **Preferences**, choose a **Language**. The interface switches immediately.
2. Under **Theme**, choose **Light**, **Dark** or **System**. **System** follows the light or
   dark setting of your operating system and changes with it.

The same choices are in the user menu at the top right (**Language** and **Theme**).

| Setting      | What it does                                                          | Values                                                                                                                                         |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Language** | Language of the Studio interface and of date, time and number formats | English, Deutsch, Español, Français, Português (Brasil), Italiano. Without a choice, Studio follows your browser's language, otherwise English |
| **Theme**    | Colors of the interface                                               | **Light**, **Dark**, **System** (default)                                                                                                      |

### Where preferences are stored {#stored}

Your choice applies at once and is saved twice: in this browser, so it works even before you
sign in, and in your user account on the server, so it follows you to other browsers. When you
sign in on a browser that has no choice of its own yet, Studio takes the language and theme from
your account. A choice made in a browser stays in that browser until you change it there.

> [!NOTE]
> Some texts come from the server and stay in English whatever language you choose: the names and
> descriptions of the built-in roles, the descriptions in the permission catalog and the server
> message in the technical details of an error.

## Look up the server configuration {#server-configuration}

The **Server configuration** card shows the effective, non-secret configuration of the server
(`GET /v1/settings`) as a tree: groups such as `limits` or `storage` contain their values. Lists
are shown comma-separated. Use it to answer questions like "which modules are enabled?", "how
long does a session last?" or "how large may a file be?" without asking the operator.

> [!IMPORTANT]
> The server configuration is shown with `platform:settings` (platform roles `platform_admin`
> and `platform_viewer`) or with `product:manage` in at least one product (**Product owner**,
> **Product admin**). Everyone else sees only the preferences.

### What the values mean {#settings-tree}

| Key                                                              | Meaning                                                                                                                                                                                                                                |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `environment`                                                    | `development`, `test` or `production`. Production enforces stricter security checks at start                                                                                                                                           |
| `mode`                                                           | `single` (one product) or `multi` (many products); see [Deployment modes](help:server-configuration#deployment-modes)                                                                                                                  |
| `modules`                                                        | Enabled modules. Studio sections of other modules show **Module not enabled on this server**                                                                                                                                           |
| `public_url`, `allowed_origins`                                  | The server's external address and the browser origins (such as Studio's) allowed to send signed-in requests                                                                                                                            |
| `trusted_proxies`                                                | Proxies whose forwarded client address the server believes (affects the IP in the audit log and rate limits)                                                                                                                           |
| `session_ttl_hours`, `session_idle_minutes`                      | Maximum session lifetime (default 12 hours) and idle timeout (default 120 minutes)                                                                                                                                                     |
| `password_login`, `password_min_length`, `login_rate_per_minute` | Whether password sign-in is enabled, the minimum password length (default 12) and the failed sign-in budget per account and minute (default 10)                                                                                        |
| `limits`                                                         | `max_body_bytes` (largest request body, default 10 MiB), `rate_limit_per_minute`, `rate_limit_ip_per_minute`, `rate_limit_burst` (empty: no rate limit) and `api_docs` (whether `/v1/docs` is `public`, `authenticated` or `disabled`) |
| `oidc_providers`                                                 | Single sign-on providers with their sign-up rules (never the client secret)                                                                                                                                                            |
| `storage`                                                        | File storage backend, maximum file size and allowed content types                                                                                                                                                                      |
| `notify`, `billing`                                              | Notification provider and sender; billing provider and whether live payments are on                                                                                                                                                    |
| `observability`                                                  | Log level, tracing, audit and job retention                                                                                                                                                                                            |
| `encryption_key_ids`, `active_encryption_key`                    | IDs of the encryption keys the server holds and the one used for new data (never key material)                                                                                                                                         |
| `features`                                                       | Free feature flags of the installation                                                                                                                                                                                                 |

Secrets (database passwords, encryption keys, client secrets, API keys of providers) are never
part of this response.

### Change the server configuration {#change}

Studio cannot change these values. The operator changes the server's configuration file or
environment variables and restarts the server; the next time you open this page you see the new
values. See [Server configuration](help:server-configuration) for what operators typically
change for Studio.

## Good to know {#good-to-know}

- Product-specific settings (for example a product's storage policy) are not here; they are on the
  product's own page.
- After the operator enabled or disabled a module, reload Studio: it reads the module list once
  when it starts.

## Troubleshooting {#troubleshooting}

- **The server configuration is shown to platform administrators and to product owners and admins
  only.**: you have neither `platform:settings` nor `product:manage`. Your preferences still work.
- **The server returned no settings.**: the server answered with an empty configuration. Reload
  the page; if it stays empty, tell the operator.
- Your language or theme does not follow you to another browser: that browser already has a
  choice of its own, and the browser's choice wins. Change it there once.
- The language or theme changes back after signing in: this browser had no choice of its own,
  so Studio took the one from your account. Choose again; from then on this browser keeps it.
