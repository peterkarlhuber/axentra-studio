---
title: System health and monitoring
summary: Check whether the Axentra server is up and ready, read its metrics and see the retention, tracing and logging settings it reports.
keywords: health, status, readiness, liveness, uptime, 503, monitoring, metrics, Prometheus, scrape, OpenTelemetry, tracing, log level, retention, purge, version
related: audit, settings, server-configuration, api-basics, troubleshooting
---

Two pages show how the Axentra server is doing. **System health** answers "is the server up and
able to serve requests?" and shows which versions of the server and Studio are running.
**Monitoring** adds the server's own metrics (request counts, errors, response times) and the
maintenance, retention, tracing and logging settings it reports. Operators use them for a quick
look; for alerting and history, connect a real monitoring system (see
[For operators](#for-operators)).

> [!IMPORTANT]
> Both pages are open to every signed-in user and do not depend on a module. The
> **Maintenance and retention** and **Tracing and logging** cards need `platform:settings`
> (platform roles) or `product:manage` in at least one product (**Product owner**,
> **Product admin**). The **Metrics** card depends on the server's metrics configuration, not on
> your role (see [Metrics](#metrics)).

## Check whether the server is healthy {#check-health}

1. Open **Audit & Monitoring** › **System health** ([open](app:health)).
2. Read the **Readiness** card: the overall status and one line per check.
3. Read the **Liveness** card: **OK** means the server process answers.
4. Choose **Refresh** to check again right away. Both cards also refresh every 30 seconds;
   **Updated …** tells you when the readiness result was fetched.

### Readiness {#readiness}

Readiness asks the server whether it can serve requests right now (`GET /v1/health/ready`). The
server runs each check and answers **OK** only when all of them pass; otherwise it answers with
HTTP `503` and the status **Unavailable**, and Studio still lists every check so you see which
one fails.

| Check             | Present when                                       | Passes when                                                                                        |
| ----------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `database`        | always                                             | The server reaches its PostgreSQL database                                                         |
| `notify_provider` | the notify module is enabled                       | The email provider configuration is complete (sender address, provider settings). No email is sent |
| `schema`          | the operator set `database.require_current_schema` | No database migrations are pending and none are unknown to the server                              |

Product backends built on Axentra can register further checks; they appear here with their own
names.

### Liveness {#liveness}

Liveness (`GET /v1/health/live`) only tells you that the server process answers. Studio shows
**Down** when the request fails, for example because the server or the proxy in front of it is
not reachable. A server can be live but not ready: the process runs, but a dependency such as the
database is missing.

### Versions {#versions}

The **Versions** card on **System health** shows the **Server** name and version, the
**Server API version**, the **Environment** (`development`, `test` or `production`), the
**Studio version** and the **Required API version** of this Studio build. Studio refuses to start
against a server whose API version does not fit; see
[Compatibility check](help:server-configuration#compatibility).

## Use the Monitoring page {#monitoring}

Open **Audit & Monitoring** › **Monitoring** ([open](app:monitoring)). It shows the same
**Readiness** and **Liveness** cards as **System health**, plus:

- **Maintenance and retention** and **Tracing and logging** (see [below](#retention)),
- **Metrics** of the API process (see [Metrics](#metrics)).

**Refresh** reloads all of them. Metrics also refresh every 30 seconds while they load without
error.

## Metrics {#metrics}

The **Metrics** card reads the server's Prometheus endpoint `GET /metrics` and shows it as key
figures and tables.

| Key figure                                                                      | Counted from                                                                                   |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **HTTP requests**                                                               | All requests (`axentra_http_requests_total`)                                                   |
| **Server errors (5xx)** / **Client errors (4xx)**                               | Requests with that status class                                                                |
| **Average response time**                                                       | Total request time divided by the number of requests (`axentra_http_request_duration_seconds`) |
| **Refused (401/403)**                                                           | Authentication and permission refusals (`axentra_auth_failures_total`)                         |
| **Notifications enqueued** / **delivered** / **Notification deliveries failed** | Notification counters (only processes that handle notifications report them)                   |

Below the key figures the metrics are grouped into **HTTP**, **Authentication**,
**Database pool**, **Notifications**, **Jobs and events** and **Other metrics**. Each table shows
one row per label combination (for example per method, route and status) with its value; for
histograms the **Count** and **Average**. Large metrics show the first 50 rows.

> [!WARNING]
> Values count **since this API process started** and belong to **the one process that answered
> Studio's request**. With several API processes or replicas, each keeps its own numbers, and the
> notification dispatcher and job workers have their own as well. A restart sets the numbers back
> to zero. For a complete picture, let Prometheus scrape every process.

### Metrics token {#metrics-token}

Whether `/metrics` answers depends on the server configuration:

| Server configuration                              | What Studio shows                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `observability.metrics_enabled = false`           | **Metrics are not available**                                                |
| `observability.metrics_token_ref` is set          | **A metrics token is required** and a **Metrics token** form                 |
| No token configured, `environment = "production"` | **Metrics are not available** (metrics stay off until a token is configured) |
| No token configured, development or test          | The metrics, without a token                                                 |

To view protected metrics:

1. Get the metrics token from your operator (the secret that `observability.metrics_token_ref`
   points to).
2. Enter it in **Bearer token** and choose **Load metrics**.

> [!NOTE]
> Studio keeps the token only in the open page. It is never stored and is gone when you leave or
> reload the page. If the server does not accept it, Studio shows
> **The server did not accept this token.**

## Retention, tracing and logging {#retention}

**Maintenance and retention** lists how long the server keeps data, as reported by
`GET /v1/settings`:

| Line                                                 | Server setting                                                    | Default                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Audit events**                                     | `observability.audit_retention_days`                              | 365 days                                                         |
| **Finished jobs**                                    | `observability.job_retention_days`                                | 30 days                                                          |
| **Notification content** / **Notification messages** | `notify.content_retention_days` / `notify.message_retention_days` | not reported by the server version this Studio was built against |

A value the server does not report is shown as **not reported by the server**; Studio never
guesses.

> [!IMPORTANT]
> Retention does not run by itself. Data older than the period is deleted only when the operator
> runs `axentra maintenance purge` (typically once a day from cron or a scheduler). The command
> also removes expired sessions and setup tokens.

**Tracing and logging** shows whether **OpenTelemetry tracing** is enabled, the **Log level**,
the **Notification provider** (`local` or `smtp`) and the **Environment**. These are read-only;
they are changed in the server configuration.

## For operators {#for-operators}

- **Probes**: use `GET /v1/health/live` as the liveness probe and `GET /v1/health/ready` as the
  readiness probe of your orchestrator. Both need no authentication and are never rate limited.
- **Prometheus**: scrape `/metrics` of every API process. In production configure
  `observability.metrics_token_ref` (for example `file:/run/secrets/axentra_metrics_token`) and
  give Prometheus the same token as bearer credentials.
- **Same-origin Studio**: the Studio container proxies `/metrics` to the API together with `/v1`,
  so the Monitoring page works behind the same address.
- **Logs** are JSON by default and carry the request ID; secrets are redacted.
- **Tracing**: `observability.otel_enabled = true` plus the `otel` extra of the server package
  exports one span per request over OTLP/HTTP.

The backend repository documents all of this in `docs/operations/OBSERVABILITY.md`.

## Troubleshooting {#troubleshooting}

- **Readiness: Unavailable** with `database` **Failing**: the server cannot reach PostgreSQL.
  Check the database and the server's database URL; requests that need data fail until it is
  back.
- **`notify_provider` Failing**: the email configuration is incomplete, for example a missing or
  invalid sender address or SMTP settings. Fix `[notify]` in the server configuration.
- **`schema` Failing**: migrations are pending. The operator runs `axentra migrate`.
- **Liveness: Down** or **Server not reachable**: the server or the proxy between Studio and the
  server is not reachable. Check that the server runs and that Studio's API address is right
  (see [Studio's configuration](help:server-configuration#studio-config)).
- **Metrics are not available**: metrics are switched off, or this is a production server without
  a metrics token. Ask the operator to set `observability.metrics_token_ref`.
- **The server did not accept this token.**: the token is wrong or has been rotated. Ask the
  operator for the current one.
- **Retention and tracing settings are shown to platform administrators and product managers
  only**: you have neither `platform:settings` nor `product:manage`. The rest of the page still
  works.
- **Metrics look too low or jump back to zero**: another API process answered, or the process was
  restarted (see the warning in [Metrics](#metrics)).
