---
title: Tutorial: Build a webhook receiver
summary: Build a small receiver in Python or TypeScript that verifies Axentra's webhook signature, test it with a ping and a real event, and check the deliveries.
keywords: webhook receiver, verify signature, HMAC-SHA256, Axentra-Signature, tutorial, Python, TypeScript, Node.js, example, integration, test ping, deduplicate
related: webhooks, events, security, api-basics
---

In this tutorial you build a small program that receives Axentra's webhook requests, checks that
each one is genuine, ignores duplicates, and prints the event. You then connect it to an endpoint,
test it with a ping and a real event, and learn to read the deliveries when something goes wrong.
It takes about 30 minutes. The receiver is written twice, in Python and in TypeScript (Node.js);
pick one.

## What you need {#prerequisites}

- A Studio account with `webhooks:manage` (product owner or admin) and, for step 7,
  `events:publish` in a test tenant. See [Webhooks](help:webhooks) for permissions.
- The server module `events` and a running worker (ask your operators).
- Python 3.10 or later, or Node.js 22 or later. No extra libraries are needed.
- A way to make your receiver reachable over public HTTPS (step 1).

## Step 1: Get a public HTTPS address {#public-url}

Axentra only sends webhooks to public `https://` URLs. It refuses `localhost`, private network
addresses and plain `http://` (unless your operators enabled these for a development server, see
[URL rules](help:webhooks#url-rules)). To test a receiver on your own computer, use a tunnel
service (for example ngrok or Cloudflare Tunnel) that forwards a public HTTPS address to
`http://localhost:8000`. You get an address such as `https://example-tunnel.example.com`.

In production, run the receiver behind your normal HTTPS web server or load balancer.

## Step 2: Create the endpoint and copy the secret {#create-endpoint}

1. Open [Webhooks](app:webhooks) and choose **New endpoint**.
2. **URL**: your public address plus a path, for example `https://example-tunnel.example.com/hooks/axentra`.
3. **Description**: `Tutorial receiver`.
4. **Event types**: add `tutorial.*`, so the receiver only gets the events you send in step 7.
5. **Tenant filter**: choose your test tenant.
6. Choose **Create endpoint**.
7. Copy the **Signing secret** (it starts with `whsec_`). You cannot see it again. Tick
   **I have stored the secret securely** and choose **Done**.

Make the secret available to the receiver as an environment variable, never in source code:

```bash
export AXENTRA_WEBHOOK_SECRET='whsec_…'   # the value you copied
```

## Step 3: Understand the signature {#verify-signature}

Every request carries a header like this:

```http
Axentra-Signature: t=1767225600,v1=9c1e…
```

- `t` is the time of sending, in Unix seconds.
- `v1` is a hex-encoded HMAC-SHA256. During a secret rotation with a grace period, the header has
  **two** `v1` values (new secret first, previous secret second): accept the request if **any** of
  them matches.

To verify a request:

1. Read the **raw** request body as bytes. Do not parse and re-serialize the JSON first: any change
   in spacing or key order breaks the signature.
2. Split the header at commas, then each part at the first `=`. Take `t` and all `v1` values. If
   `t` or every `v1` is missing, reject the request.
3. Reject the request if `t` is more than 300 seconds away from your current time. This stops
   someone from replaying an old request they recorded.
4. Compute `HMAC-SHA256(key = the secret, message = t + "." + raw body)`, hex encoded in lowercase.
   The key is the complete secret string **including** the `whsec_` prefix, as UTF-8 bytes. The
   message is the digits of `t`, a dot, and the body bytes.
5. Compare your result with each `v1` value using a **constant-time** comparison, so attackers
   cannot guess the signature from response times.

Axentra delivers **at least once**, so the same event can arrive more than once. After the signature
check, look at `Axentra-Event-Id` (the same as the body's `id`): if you have already processed this
id, answer `200` and do nothing. Answer within 10 seconds; Axentra treats a slower answer as a
failure and retries. If processing takes long, store the event and answer first.

> [!TIP]
> If your receiver is written in Python and can install the `axentra` package, its helper
> `axentra.events.verify_signature(secret, header, body)` does steps 2 to 5 for you.

## Step 4: Write the receiver in Python {#python}

Save this as `receiver.py`. It uses only the standard library and listens on port 8000.

```python
import hashlib
import hmac
import json
import os
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

SECRET = os.environ["AXENTRA_WEBHOOK_SECRET"]  # the complete value, including "whsec_"
TOLERANCE_SECONDS = 300
seen_event_ids: set[str] = set()  # use a database table in production


def verify_signature(secret: str, header: str, body: bytes) -> bool:
    timestamp = None
    signatures = []
    for part in header.split(","):
        key, _, value = part.strip().partition("=")
        if key == "t" and value.isdigit():
            timestamp = int(value)
        elif key == "v1":
            signatures.append(value)
    if timestamp is None or not signatures:
        return False
    if abs(time.time() - timestamp) > TOLERANCE_SECONDS:
        return False
    message = f"{timestamp}.".encode() + body
    expected = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, signature) for signature in signatures)


class Receiver(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        if not verify_signature(SECRET, self.headers.get("Axentra-Signature", ""), body):
            self.reply(401, "invalid signature")
            return
        event_id = self.headers.get("Axentra-Event-Id", "")
        if event_id in seen_event_ids:
            self.reply(200, "duplicate, ignored")
            return
        event = json.loads(body)
        print(f"{event['type']} {event['id']} tenant={event['tenant_id']} data={event['data']}")
        seen_event_ids.add(event_id)
        self.reply(200, "ok")

    def reply(self, status: int, text: str) -> None:
        data = text.encode()
        self.send_response(status)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 8000), Receiver).serve_forever()
```

Start it:

```bash
python3 receiver.py
```

## Step 5: Or write it in TypeScript {#typescript}

Save this as `receiver.ts`. It uses only Node.js built-ins (`node:http`, `node:crypto`).
`timingSafeEqual` is the constant-time comparison; it requires both values to have the same
length, hence the length check.

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer, type ServerResponse } from 'node:http';

const SECRET = process.env.AXENTRA_WEBHOOK_SECRET ?? ''; // the complete value, including "whsec_"
const TOLERANCE_SECONDS = 300;
const seenEventIds = new Set<string>(); // use a database table in production

export function verifySignature(secret: string, header: string, body: Buffer): boolean {
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const [key = '', ...rest] = part.trim().split('=');
    const value = rest.join('=');
    if (key === 't' && /^\d+$/.test(value)) timestamp = Number(value);
    else if (key === 'v1') signatures.push(value);
  }
  if (timestamp === null || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;
  const expected = Buffer.from(
    createHmac('sha256', secret).update(`${timestamp}.`).update(body).digest('hex'),
  );
  return signatures.some((signature) => {
    const candidate = Buffer.from(signature);
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

function reply(res: ServerResponse, status: number, text: string) {
  res.writeHead(status, { 'Content-Type': 'text/plain' }).end(text);
}

createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks); // the raw bytes, exactly as received
    const header = req.headers['axentra-signature'];
    if (
      req.method !== 'POST' ||
      typeof header !== 'string' ||
      !verifySignature(SECRET, header, body)
    ) {
      reply(res, 401, 'invalid signature');
      return;
    }
    const eventId = String(req.headers['axentra-event-id'] ?? '');
    if (seenEventIds.has(eventId)) {
      reply(res, 200, 'duplicate, ignored');
      return;
    }
    const event = JSON.parse(body.toString('utf8')) as {
      id: string;
      type: string;
      tenant_id: string | null;
      data: Record<string, unknown>;
    };
    console.log(
      `${event.type} ${event.id} tenant=${event.tenant_id} data=${JSON.stringify(event.data)}`,
    );
    seenEventIds.add(eventId);
    reply(res, 200, 'ok');
  });
}).listen(8000);
```

Start it with Node.js 22 or later (or compile it with `tsc` first):

```bash
node --experimental-strip-types receiver.ts
```

> [!NOTE]
> Both examples remember processed event ids in memory, which is lost on restart. In a real
> receiver, store them in a database table with a unique index on the event id, in the same
> transaction as the work the event triggers.

## Step 6: Test locally, then with a ping {#test}

First check the receiver on your own computer with a self-signed request (replace the secret with
yours):

```bash
SECRET='whsec_…'
BODY='{"id":"evt_local_1","type":"tutorial.hello","tenant_id":null,"data":{}}'
T=$(date +%s)
SIG=$(printf '%s' "$T.$BODY" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.*= //')
curl -i -X POST http://localhost:8000/hooks/axentra \
  -H 'Content-Type: application/json' \
  -H 'Axentra-Event-Id: evt_local_1' \
  -H "Axentra-Signature: t=$T,v1=$SIG" \
  --data "$BODY"
```

The answer is `200` with `ok`; sending it again returns `duplicate, ignored`. Change one character of
`SIG` and you get `401`.

Now let Axentra call it:

1. Open your endpoint in [Webhooks](app:webhooks) and choose **Send test ping**.
2. Studio shows **Test ping delivered (HTTP 200)** and opens the delivery. Your receiver prints a line
   starting with `axentra.ping`.

The ping is sent once, without retries. Its `id` is the delivery id, so every ping is new to your
deduplication.

## Step 7: Send a real event {#real-event}

1. Open [Events](app:events) and choose **Publish event**.
2. Choose your test **Tenant**, enter the **Type** `tutorial.hello` and the **Data**
   `{"message": "Hello, receiver"}`.
3. Choose **Publish**.

Within a few seconds the receiver prints `tutorial.hello evt_… tenant=… data=…`. On the endpoint's
**Deliveries** tab, the delivery is **Delivered** with **Response** `200`.

## Step 8: Watch a failure and redeliver {#check-deliveries}

1. Stop the receiver.
2. Publish another `tutorial.hello` event.
3. Open the endpoint's **Deliveries** tab and choose **Refresh**. The delivery shows **Failed,
   retrying**; its details show the **Last error** and the **Next attempt**.
4. Start the receiver again. A later automatic attempt succeeds, or, if all attempts were used (about
   two to five minutes with default settings), the delivery is **Dead**.
5. For a dead delivery, open its details and choose **Redeliver**. It becomes **Pending** and then
   **Delivered**.

Reading the delivery details:

| You see                                         | Likely cause                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| **Response** `401`, body `invalid signature`    | Wrong secret, body changed before verifying, or the receiver's clock is off. |
| **Response** `404` or `405`                     | Wrong path, or the receiver does not accept `POST`.                          |
| **Response** `301`/`302`                        | A redirect; Axentra does not follow them. Use the final URL.                 |
| No response code, **Last error** with a timeout | The receiver took longer than 10 seconds.                                    |
| No response code, `unresolvable: …`             | The host name does not exist (for example an expired tunnel).                |
| **Dead**, `refused: …`                          | The URL resolves to a private or local address.                              |

## Step 9: Rotate the secret without downtime {#rotate}

1. On the endpoint's page, choose **Rotate secret**, pick the **Grace period** **24 hours** and
   confirm.
2. Copy the new secret. The receiver keeps working: each request now carries a signature with the
   new secret and one with the old secret, and the receiver accepts either.
3. Put the new secret into `AXENTRA_WEBHOOK_SECRET` and restart the receiver.
4. Choose **Send test ping** to confirm. After the grace period, only the new secret signs requests.

## Troubleshooting {#troubleshooting}

**Every request gets 401, even the local curl test.** Check that `AXENTRA_WEBHOOK_SECRET` contains
the complete secret including `whsec_`, without quotes or a trailing newline.

**The local test works, Axentra's ping gets 401.** The receiver uses a different secret than the
endpoint (for example from before a rotation), a framework changed the body before you read it (use
the raw body, not parsed JSON), or the receiver's clock is more than 5 minutes off: synchronise it
with NTP.

**"webhook urls must not point to local hosts" when creating the endpoint.** You entered a
`localhost` or private address. Use the tunnel's public HTTPS address.

**The ping works, but published events do not arrive.** Check the endpoint's **Event types**
(`tutorial.*` matches `tutorial.hello`), the **Tenant filter** (it must be the tenant you published
in) and that the endpoint is **Enabled**. If the event is in the event log but no delivery appears,
no worker is running.

**The receiver prints the same event twice after a restart.** The in-memory list of processed ids
was lost. Store processed ids persistently, as described in the note in step 5.
