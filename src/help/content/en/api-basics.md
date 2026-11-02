---
title: API basics for developers
summary: How to call the Axentra HTTP API from your own code - base URL, authentication, errors, request IDs, pagination, concurrency, rate limits, SDKs and versioning.
keywords: API, REST, HTTP, developer, integration, base URL, API key, bearer token, session, CSRF, error, problem details, RFC 9457, request id, pagination, cursor, If-Match, ETag, 412, 429, rate limit, Retry-After, idempotency, SDK, Python, TypeScript, OpenAPI, version
related: api-keys, server-configuration, roles-permissions, audit, permissions-reference, tutorial-webhook-receiver
---

Everything Studio does, it does through the public Axentra HTTP API, and your own services can do
the same. This article explains the rules that apply to every endpoint. The complete,
machine-readable contract is the OpenAPI document of the server (`openapi/axentra-v1.json` in the
backend repository; on a running server `/v1/openapi.json` and the interactive reference at
`/v1/docs`, if the operator enabled them, see [API reference](#api-reference)).

> [!IMPORTANT]
> To call the API from a program you need an API key for your product. Create one under
> **Access & API Keys** › **API keys** ([open](app:apiKeys)); see [API keys](help:api-keys).

## Base URL and format {#base-url}

- All endpoints live under `/v1` on the server's public address, for example
  `https://api.example.com/v1/...`. Ask your operator for the address (it is `public_url` on the
  [Settings](help:settings#settings-tree) page).
- Product and tenant are part of the path:
  `/v1/products/{product_id}/tenants/{tenant_id}/...`. The IDs are opaque strings with a prefix
  (`prd_`, `ten_`, `usr_`, `key_`, `rec_`, ...); do not parse them.
- Requests and responses are JSON (`application/json`, UTF-8) with `snake_case` fields.
  Timestamps are RFC 3339 in UTC, for example `2026-11-02T09:30:00Z`.
- Clients must ignore response fields they do not know: new fields can appear in any minor
  version.

```http
GET /v1/products/prd_01EXAMPLE/tenants?limit=20 HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01EXAMPLE_secretEXAMPLE
Accept: application/json
```

## Authenticate {#authentication}

| Caller                                           | How                                                                                             | CSRF                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------ |
| A service, script or job                         | API key: `Authorization: Bearer axk_<id>_<secret>` (the header `X-API-Key: axk_...` also works) | Not needed                     |
| A browser app on an allowed origin (like Studio) | Session cookie from sign-in, sent by the browser                                                | Required for changing requests |
| A CLI or tool acting as a user                   | The session token as `Authorization: Bearer <token>`                                            | Not needed                     |

### API keys {#api-keys}

An API key belongs to one product, optionally to one tenant, and has an explicit list of
permissions. It is shown only once when it is created or rotated. Keep it in a secret store, never
in a browser or a repository. Requests with a key are recorded with **Actor type** `api_key` in
the [audit log](help:audit#event-detail). Details: [API keys](help:api-keys).

### Browser sessions and CSRF {#csrf}

Signing in (`POST /v1/auth/login/password` or single sign-on) sets an `HttpOnly` session cookie.
When a request is authenticated by that cookie and changes something (`POST`, `PUT`, `PATCH`,
`DELETE`), it must also send:

- `X-Axentra-CSRF: <csrf_token>`, where the token comes from `GET /v1/auth/session` (or the
  sign-in response); keep it in memory only;
- an `Origin` that is the server's `public_url` or listed in `security.allowed_origins`.

Otherwise the server answers `403` (`missing or invalid CSRF token` or
`cross-origin request refused`). Requests authenticated with a bearer token need no CSRF token,
because browsers never send them automatically.

### 401, 403 and 404 {#auth-errors}

- `401 unauthenticated`: no or invalid credentials (wrong key, revoked key, expired session).
- `403 forbidden`: you are authenticated but lack the permission.
- `404 not_found`: also for resources **outside your scope**, for example another product's
  tenant. The server never reveals whether something exists that you may not see.

## Errors {#errors}

Every error is an RFC 9457 problem document with `Content-Type: application/problem+json`
([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)):

```json
{
  "type": "https://axentra.dev/problems/validation_failed",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_failed",
  "detail": "The request is invalid.",
  "request_id": "req_01EXAMPLE",
  "errors": [{ "loc": ["body", "slug"], "msg": "String should have at least 2 characters" }]
}
```

Use `code` in your program; it is stable. `title` and `detail` are for people and can change.

| Status | `code`                                   | Meaning                                                                   |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------- |
| 400    | `bad_request`                            | Malformed request                                                         |
| 401    | `unauthenticated`                        | Sign in or send a valid key                                               |
| 403    | `forbidden`, `reauthentication_required` | Missing permission; or the action needs a recent sign-in                  |
| 404    | `not_found`, `module_disabled`           | Not there, not yours, or the module is off                                |
| 409    | `conflict`, `mode_not_supported`         | Clashes with existing data; or not possible in single-product mode        |
| 412    | `precondition_failed`                    | `If-Match` version is outdated (see [Concurrency](#concurrency))          |
| 413    | `payload_too_large`                      | Body larger than `max_body_bytes` (or file larger than the storage limit) |
| 415    | `unsupported_media_type`                 | Content type not accepted                                                 |
| 422    | `validation_failed`                      | Input invalid; `errors` lists each field (`loc`) and reason (`msg`)       |
| 429    | `rate_limited`, `quota_exceeded`         | Too many requests, or a usage quota is used up                            |
| 500    | `internal`                               | Server error; report the request ID                                       |

Problem details never contain secrets, tokens, SQL or stack traces.

## Request IDs {#request-ids}

Every response carries an `X-Request-ID` header, and every problem document its `request_id`.
You can send your own ID in `X-Request-ID` (1-64 characters of `A-Z a-z 0-9 . _ -`); otherwise the
server creates one (`req_…`). The same ID appears in the server logs, in traces and as
**Request ID** in [audit events](help:audit#request-id). Log it with every failed call and quote it
when you ask for help. Studio shows it under **Technical details** in each error message.

## Paginate lists {#pagination}

Lists use cursors:

```http
GET /v1/audit?limit=100 HTTP/1.1
```

```json
{ "items": [ ... ], "next_cursor": "eyJ..." }
```

- `limit` is 1-200, default 50.
- When `next_cursor` is not `null`, request the next page with `?cursor=<next_cursor>` and the
  same filters. When it is `null`, you have everything.
- Cursors are opaque; do not build or change them. Filters are plain query parameters documented
  per endpoint.

## Avoid lost updates {#concurrency}

Resources that have a `version` number (for example products, tenants, records, usage meters,
notification templates) support optimistic concurrency:

1. Read the resource and note its `version` (record and meter responses also send it as `ETag`,
   for example `"3"`).
2. Send the change with `If-Match: 3`.
3. If someone changed it in between, the server answers `412 precondition_failed`. Read it again,
   reapply your change and retry.

Without `If-Match` the last write wins. `If-Match` must be the version number; anything else is
`422`.

## Retry safely: idempotency keys {#idempotency}

Endpoints that create something with side effects accept an `Idempotency-Key` header (up to 200
characters), for example recording usage, enqueuing jobs, publishing events and sending
notifications. Repeating a request with the same key returns the original result instead of
doing the work twice. Use your own business key (an order ID, a message ID) and reuse it on every
retry. For recording usage the key is required.

## Rate limits {#rate-limits}

If the operator enabled rate limits (`limits.rate_limit_per_minute`,
`rate_limit_ip_per_minute`, see [Settings](help:settings#settings-tree)), a client that sends too
many requests gets `429 rate_limited` with a `Retry-After` header in seconds. Wait that long and
retry. Limits count per credential (API key or session) and per client IP, and per server
process. Health checks and `/metrics` are never limited. Sign-in attempts have their own limit
(`login_rate_per_minute`).

`429 quota_exceeded` is different: a usage quota of the tenant or plan is used up (see
[Usage](help:usage)). Waiting a few seconds does not help.

## Use an SDK {#sdks}

The backend repository contains two official clients, both in alpha and not yet published to a
package registry. Both send the right headers, turn problem documents into exceptions with
`status`, `code`, `request_id` and `retry_after`, paginate for you and check the server version.
Neither retries automatically: retry yourself, with an idempotency key.

### Python {#sdk-python}

Package `axentra-client` in `sdk/python` (Python 3.11+, synchronous and asynchronous clients).
Install it from a checkout with `pip install ./sdk/python`.

```python
from axentra_client import AxentraClient, AxentraApiError

with AxentraClient("https://api.example.com", api_key="axk_01EXAMPLE_secretEXAMPLE") as ax:
    ax.check_compatibility()
    pid = "prd_01EXAMPLE"
    for tenant in ax.tenants.iter(pid, page_size=100):
        print(tenant.slug)
    try:
        ax.tenants.create(pid, slug="acme", name="Acme")
    except AxentraApiError as e:
        print(e.status, e.code, e.request_id)
```

### TypeScript {#sdk-typescript}

Package `@axentra/sdk` in `sdk/typescript` (ESM, Node 20+ or a modern browser). Its types are
generated from the OpenAPI contract, so every path, parameter and body is typed.

```ts
import { AxentraApiError, createAxentraClient } from '@axentra/sdk';

const ax = createAxentraClient({
  baseUrl: 'https://api.example.com',
  apiKey: process.env.AXENTRA_KEY,
});
await ax.checkCompatibility();

const product_id = 'prd_01EXAMPLE';
for await (const t of ax.paginate((cursor) =>
  ax.GET('/v1/products/{product_id}/tenants', {
    params: { path: { product_id }, query: { cursor, limit: 100 } },
  }),
)) {
  console.log(t.slug);
}
```

In a browser without a key the TypeScript client uses the session cookie and handles the CSRF
token itself. The backend repository documents both clients in `docs/sdk/PYTHON.md` and
`docs/sdk/TYPESCRIPT.md`.

## Versions and compatibility {#versioning}

- The path version `/v1` changes only for breaking changes. A new `/v2` would be served next to
  `/v1` for at least one minor release.
- The API **minor** version grows with additive changes (new endpoints, new optional fields, new
  values). `GET /v1/meta` returns it as `api_version: {"major": 1, "minor": 0}`, and every
  response carries `Axentra-API-Version: 1.0`.
- Call `GET /v1/meta` at startup and refuse to run when the major differs or the server's minor
  is lower than the one you need. A newer minor is fine. Both SDKs do this in
  `check_compatibility()` / `checkCompatibility()`, and Studio does the same (see
  [Compatibility check](help:server-configuration#compatibility)).
- Optionally send `Axentra-Client: <name>/<version>; api=<major.minor>` so server logs show which
  client called.

## API reference {#api-reference}

The server can serve its OpenAPI document at `/v1/openapi.json` and an interactive reference at
`/v1/docs`. The operator controls this with `security.api_docs` (shown as `limits.api_docs` in
[Settings](help:settings#settings-tree)): `public`, `authenticated` (needs a session or API key) or
`disabled` (the default in production). The committed `openapi/axentra-v1.json` in the backend
repository always describes the current contract.

## Troubleshooting {#troubleshooting}

- **`401 unauthenticated` with an API key**: the key is wrong, revoked or expired, or it was rotated and its grace period is over.
  Check the key's status under **API keys** and send it as `Authorization: Bearer axk_...`.
- **`403 forbidden` with "missing or invalid CSRF token"**: a cookie-authenticated browser request
  without `X-Axentra-CSRF`, or with a stale token. Read `GET /v1/auth/session` again.
- **`403` with "cross-origin request refused"**: your app's origin is not in
  `security.allowed_origins`. Ask the operator to add it.
- **`404` although the ID is right**: the resource belongs to another product or tenant than your
  key, or the module is disabled (`module_disabled`).
- **`412 precondition_failed`**: someone changed the resource since you read it. Read it again and
  retry with the new version.
- **`429 rate_limited`**: wait the number of seconds in `Retry-After`, then slow down.
- **`413 payload_too_large`**: the body exceeds `security.max_body_bytes` (default 10 MiB). Upload
  files through the files endpoints, which have their own limit.
- **Your client refuses the server version**: the server is older than your client needs, or has
  another major version. Use a matching client release.
