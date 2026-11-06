---
title: Jobs
summary: Follow background jobs, understand their statuses and retries, enqueue a job by hand, and retry or cancel one.
keywords: job, background job, task, queue, worker, retry, cancel, dead letter, failed, attempts, backoff, enqueue, idempotency key, handler
related: schedules, events, webhooks, permissions-reference, health-monitoring, limitations
---

A **job** is a piece of work that runs in the background instead of while someone waits for a
screen to load: sending a monthly report, importing a file, delivering a webhook. Your product, a
schedule or Axentra itself puts jobs into a queue, and a separate **worker** process picks them up
and runs the code (the **handler**) that belongs to the job's **kind**. The **Jobs** screen shows
what is waiting, what is running, what worked and what failed, and lets operators retry or cancel
jobs.

> [!IMPORTANT]
> Jobs need the server module `events`; without it, **Jobs** is not shown in the sidebar. Viewing
> needs the permission `jobs:read` (product owners, admins, support and viewers have it). **Retry**
> and **Cancel job** need `jobs:manage`; without it these buttons are hidden. **Enqueue job** needs
> `jobs:manage` too, except for kinds opened to tenant members (see [who may enqueue which
> kind](#kind-permissions)). Jobs only run while at least one worker process (`axentra worker`) is
> running. That is an operations task, see [Server configuration](help:server-configuration).

## Read the jobs list {#jobs-list}

Open [Jobs](app:jobs). The list shows the newest jobs first with **Kind**, **Status**,
**Attempts** (for example `2 of 5`), **Tenant** (or **Product level** for jobs that do not belong
to a tenant), **Created** and **Updated**. Select a kind to open the job's details.

### Overview counters {#overview}

The **Overview** card counts the jobs per status. Select a counter to show only those jobs. Below
the counters you see how many jobs succeeded and failed in the last 24 hours (the failed number
includes **Dead** jobs) and when the **Oldest queued job** was created. If that time keeps getting
older, no worker is taking jobs: check that a worker is running and that it handles this kind.

### Filter jobs {#filter}

Filter by **Status**, by exact **Kind** (for example `reports.send`) and by **Tenant**, then choose
**Apply filters**. **Reset filters** clears them. The filters are part of the page address, so
you can bookmark or share a filtered view.

### Follow changes live {#live-updates}

Switch on **Live updates** to follow the server's jobs stream. Studio then refreshes the list and
the counters (at most once a second) whenever a job changes. The indicator next to the switch
shows the connection state; see [Connection status](help:events#connection-status). Without live
updates the list changes only when you reload it.

## Job statuses {#statuses}

```diagram
job-lifecycle
```

| Status        | Meaning                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Queued**    | Waiting for a worker. A job with a delay or waiting for its next retry is also queued.                           |
| **Running**   | A worker has claimed the job and holds a time-limited lease on it.                                               |
| **Succeeded** | The handler finished. Its return value is stored as the **Result**.                                              |
| **Failed**    | The handler reported a permanent error (it raised `PermanentJobError`). There are no further automatic attempts. |
| **Dead**      | All attempts are used up. The job is kept as a "dead letter" so you can inspect and retry it.                    |
| **Cancelled** | Cancelled before it started, or the handler stopped after a cancellation request.                                |

**Failed** and **Dead** are both final, but for different reasons: **Failed** means the handler
decided that retrying cannot help; **Dead** means every attempt ended with an error.

**Skipped jobs.** A job whose product is archived or whose tenant is suspended (or no longer
exists) is not run. The worker ends it as **Failed** with a last error that starts with
`skipped:`, for example `skipped: the product or tenant is not active`. Studio marks it **Not run:
product or tenant inactive**. Jobs fired by a schedule end this way while the tenant is suspended.
The job is kept: once the product and tenant are active again, retry it if it is still needed.

## Attempts, retries and backoff {#retries}

Every time a worker claims a job, its attempt counter goes up by one. When an attempt ends with an
ordinary error, the job goes back to **Queued** and waits before the next attempt. The wait grows
exponentially: it is between half and all of `2 × 2^(n−1)` seconds after attempt _n_ (2, 4, 8, 16 …
seconds with the default settings, never more than one hour). This "backoff" gives a temporary
problem, such as a busy external service, time to recover. The random part keeps many failed jobs
from retrying at the same moment.

When the last allowed attempt fails, the job becomes **Dead**. The default is **5** attempts, so
with default settings a job that always fails is dead after about half a minute. You can set
**Max. attempts** between 1 and 100 when you enqueue a job or create a schedule.

A worker that crashes stops renewing its lease. After the lease expires (60 seconds by default),
another worker puts the job back into the queue. The lost run counts as an attempt.

> [!WARNING]
> Jobs run **at least once**, not exactly once. A job can run twice, for example after a worker
> crash or when the result could not be saved. Handlers must be idempotent: running them twice must
> have the same effect as running them once.

## Open a job's details {#job-detail}

Select a job's kind in the list. The detail page shows:

- **Details**: **Job ID**, **Kind**, **Status**, **Tenant**, **Attempts**, **Priority**,
  **Idempotency key**, the **Schedule** that created the job (a link), the **Worker** that runs or
  ran it, whether **Cancellation requested** is set, and **Created by** (a user or API key id, or
  `schedule:<id>` for scheduled jobs).
- **Timeline**: **Created**, **Run after** (the earliest start time, including delays and backoff),
  **Started**, **Lease until**, **Finished** and **Updated**.
- **Last error**: the error message of the most recent failed attempt, at most 2000 characters.
  The server removes tokens, API keys and connection strings before it stores the message.
- **Payload** and **Result** as JSON. Values under keys such as `password`, `secret`, `token` or
  `api_key` are shown as `[redacted]`.

While a job is **Queued** or **Running**, the page refreshes itself every 3 seconds.

## Enqueue a job {#enqueue}

You usually do not enqueue jobs by hand: your product's code and schedules do that. Enqueueing in
Studio is useful to start a one-off run or to test a handler.

1. Open [Jobs](app:jobs) and choose **Enqueue job**.
2. Enter the **Kind**, for example `reports.send`. It must match a handler that a worker runs.
3. Optional: enter the **Payload** as a JSON object (the input for the handler), choose a
   **Tenant**, and set **Priority**, **Delay (seconds)** and **Max. attempts**.
4. Choose **Enqueue**. Studio opens the new job's detail page.

| Setting             | What it does                                                                          | Allowed values / default                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Kind**            | Selects the handler that runs the job.                                                | Starts with a lowercase letter, then lowercase letters, digits and `_ . : -`, at most 100 characters. `axentra.` is reserved. Required. |
| **Payload**         | Input for the handler.                                                                | JSON object, at most 64 KB. Default `{}`.                                                                                               |
| **Tenant**          | Runs the job in a tenant's scope; the handler can then only reach that tenant's data. | A tenant of the product, or **Product level**.                                                                                          |
| **Priority**        | Higher values are claimed first when several jobs are due.                            | −100 to 100. Default 0.                                                                                                                 |
| **Delay (seconds)** | The job does not start before this many seconds have passed.                          | 0 to one year. Default 0.                                                                                                               |
| **Max. attempts**   | How many times the job is tried before it becomes **Dead**.                           | 1 to 100. Empty: server default (5).                                                                                                    |
| **Idempotency key** | Protects against creating the same job twice.                                         | 1 to 200 printable characters. Studio fills in a random key.                                                                            |

> [!CAUTION]
> Do not put secrets (passwords, API keys) into a payload. Payloads are stored as given and are
> readable for everyone with `jobs:read` (common secret field names are only hidden in the
> display). Pass ids and let the handler read the secret.

### Idempotency key {#idempotency-key}

Studio generates a new key each time you open the dialog. If you submit twice (a double click, or
a retry after a timeout), the server returns the job created by the first submit instead of a
second one. The key is unique per product, tenant and kind for as long as the job exists.

If the same key was already used with a different payload or priority, or by another caller who
cannot read jobs, the server refuses the request. Studio then shows **Already used for a different
request** and offers **Use a new key**.

## Retry a failed or dead job {#retry}

1. Open the job, or open the actions menu of its row in the list.
2. Choose **Retry** and confirm.

The job goes back to **Queued** with its attempt counter reset to 0, so it gets its full number of
attempts again. **Retry** is only offered for **Failed** and **Dead** jobs. Fix the cause first
(see **Last error**), otherwise the job fails again.

## Cancel a job {#cancel}

1. Open the job, or open the actions menu of its row.
2. Choose **Cancel job** and confirm.

What happens depends on the status:

- A **Queued** job is cancelled at once and never runs.
- For a **Running** job, cancellation is _requested_. The list shows **Cancellation requested**.
  The handler sees the request the next time it checks (handlers check between steps) and stops;
  the job then ends as **Cancelled**. If the handler finishes its work first, the job ends as
  **Succeeded**, because the work was done.

Jobs that have already finished cannot be cancelled.

## For developers and operators {#developers}

### Handlers and workers {#workers}

Handlers are registered in Python with `ax.jobs.register("reports.send", handler)` and run by
`axentra worker`. A worker only claims kinds it has a handler for. A job whose kind no running
worker handles stays **Queued** indefinitely; it does not fail. Handlers can:

- return a JSON value, which becomes the **Result** (larger than 64 KB: replaced by a truncation
  note);
- raise `PermanentJobError` to end as **Failed** at once;
- raise `RetryJob(delay_seconds=…)` to retry after a delay of their choice;
- call `ctx.heartbeat()` during long work to renew the lease, and `ctx.cancel_requested()` to
  notice a cancellation.

The jobs list and stats are also available through the API: `GET /v1/products/{product_id}/jobs`,
`/jobs/stats` and the SSE stream `/jobs/stream`. See [API basics](help:api-basics).

### Who may enqueue which kind {#kind-permissions}

Holders of `jobs:manage` may enqueue any kind that does not start with `axentra.`. Through the API,
tenant members with only `events:publish` may enqueue a kind only when the product explicitly opened
that kind to them; otherwise the server answers "not permitted". Studio offers **Enqueue job** to
tenant members without `jobs:manage` too: they choose a **Tenant** first and then one of the kinds
opened to them there. If no kind is open to them in that tenant, the dialog says so.

### Built-in job kinds {#system-kinds}

Axentra uses the queue for its own work, so you will see these kinds in the list:

| Kind                      | Purpose                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| `axentra.event.dispatch`  | Distributes a published event to subscribers and webhook endpoints. |
| `axentra.event.handle`    | Runs one in-process subscriber for one event.                       |
| `axentra.webhook.deliver` | Sends one webhook delivery; see [Webhooks](help:webhooks#retries).  |

You cannot enqueue `axentra.` kinds yourself, but you can retry and cancel them like other jobs.

### Retention {#retention}

Finished jobs (**Succeeded**, **Failed**, **Dead**, **Cancelled**) are deleted after 30 days by
default (`observability.job_retention_days`). Queued and running jobs are never purged.

## Good to know {#good-to-know}

- There is no guaranteed order. Higher priority first, then earlier start time, but retries and
  parallel workers reorder jobs.
- Each job is handed to exactly one worker per attempt.
- Every enqueue, retry and cancel is recorded in the [audit log](help:audit)
  (`events.job.enqueue`, `events.job.retry`, `events.job.cancel`).
- The server's readiness check does not include workers. Watch the **Oldest queued job** instead.

## Troubleshooting {#troubleshooting}

**Jobs stay Queued and never start.** No worker is running, or none of the running workers has a
handler for this kind. Check the time of the **Oldest queued job**, ask your operators to start
`axentra worker` (with `--load` for your product's handlers), and check the spelling of the kind.
Also check **Run after**: a delayed job or one waiting for a retry is queued on purpose.

**A job is Dead.** All attempts failed. Read **Last error** on the detail page, fix the cause (for
example a missing record or an unreachable service) and choose **Retry**.

**A job is Failed after one attempt.** The handler reported a permanent error, so Axentra did not
retry. Read **Last error**. Retry only after fixing the cause.

**"Please check your input" when enqueueing.** The server rejected a value; the message under the
title names it, for example `kind must be 1-100 characters…`, `payload is larger than 64000
bytes`, `priority must be between -100 and 100` or `job kinds starting with 'axentra.' are
reserved`. Correct the field and submit again.

**"Not permitted" when enqueueing.** You need `jobs:manage`. A message such as `job kind … is not
open to tenant callers` means the kind can only be enqueued by operators.

**"Already used for a different request".** The idempotency key belongs to another job request.
Choose **Use a new key** to create a new job, or repeat the original request unchanged.

**"Conflict" on Retry or Cancel.** The job's status changed in the meantime (for example it
finished while you were confirming). Reload the page; **Retry** works only for **Failed** and
**Dead** jobs, **Cancel job** only for **Queued** and **Running** ones.

**Cancellation requested, but the job keeps running.** The handler only stops when it checks for
cancellation. Handlers that never check run to the end and then count as **Succeeded**. If the
worker hangs, the job is re-queued after its lease expires.

**A job ran twice.** This is expected with at-least-once execution. Make the handler idempotent,
for example by checking whether the work was already done.
