---
title: Schedules
summary: Run a job regularly, at a fixed interval or on cron times in UTC, and enable, disable, edit or delete schedules.
keywords: schedule, cron, crontab, recurring job, timer, interval, periodic, UTC, time zone, next run, every day, every hour
related: jobs, events, permissions-reference, limitations, glossary
---

A **schedule** enqueues a [job](help:jobs) again and again: every 15 minutes, every night at 02:00,
on the first day of each month. You give the schedule a job **Kind** and a **Payload**, and the
schedule puts a new job of that kind into the queue at each scheduled time. A worker then runs the
job like any other. Use schedules for reports, clean-ups, synchronisations and reminders.

> [!IMPORTANT]
> Schedules need the server module `events`. Viewing needs `jobs:read`; **New schedule**, editing,
> enabling, disabling and deleting need `jobs:manage` (without it the buttons and the row menu are
> hidden). Schedules only fire while a worker process (`axentra worker`) runs, because the worker
> also acts as the scheduler.

## Read the schedules list {#schedules-list}

Open [Schedules](app:schedules) (also reachable with **Schedules** on the **Jobs** screen). Each row
shows:

- **Name** and the job kind it enqueues;
- **Timing**: an interval such as _Every 15 minutes_, or a cron expression marked _cron, UTC_;
- **State**: **Active** or **Disabled**;
- **Next run**: when the schedule fires next (shown as **Disabled** for disabled schedules);
- **Last run**: the time slot that fired last. When a job exists for it, the time links to that
  job;
- **Tenant**, or **Product level**.

## Create a schedule {#create}

1. Open [Schedules](app:schedules) and choose **New schedule**.
2. Enter a **Name** (1 to 200 characters) and the job **Kind**, for example `reports.send`.
3. Under **Timing**, choose **Fixed interval** or **Cron expression** (see below).
4. Optional: enter the **Payload** for the job, choose a **Tenant**, and set **Priority** and
   **Max. attempts**.
5. Leave **Enabled** on if the schedule should start firing right away.
6. Choose **Create schedule**.

The server calculates **Next run** when you save. Studio does not preview future run times.

## Choose the timing {#timing}

A schedule uses exactly one of the two timing modes.

### Fixed interval {#interval}

Enter a number under **Every** and choose the **Unit** (**Seconds**, **Minutes**, **Hours** or
**Days**). The interval must be between 10 seconds and 366 days.

Interval times are counted from midnight UTC on 1 January 1970, not from the moment you saved. All
servers therefore calculate the same times, and the run times are predictable:

- _Every 15 minutes_ fires at :00, :15, :30 and :45 of every hour (UTC).
- _Every 1 day_ fires at 00:00 UTC.
- _Every 7 days_ fires on Thursdays at 00:00 UTC (1 January 1970 was a Thursday).

If you need a specific time of day or weekday, use a cron expression instead.

### Cron expression {#cron-syntax}

A cron expression has exactly **5 fields**, separated by spaces:

```text
┌──────── minute        0-59
│ ┌────── hour          0-23
│ │ ┌──── day of month  1-31
│ │ │ ┌── month         1-12
│ │ │ │ ┌ day of week   0-7 (0 and 7 are Sunday)
* * * * *
```

Each field accepts:

| Syntax  | Meaning                                | Example                                          |
| ------- | -------------------------------------- | ------------------------------------------------ |
| `*`     | every value                            | `*` in the hour field: every hour                |
| `n`     | one value                              | `30` in the minute field                         |
| `a-b`   | a range                                | `1-5` in the day-of-week field: Monday to Friday |
| `a,b,c` | a list (items may be ranges or steps)  | `0,30` in the minute field                       |
| `*/n`   | every _n_-th value from the start      | `*/10` in the minute field: 0, 10, 20 …          |
| `a-b/n` | every _n_-th value within a range      | `8-18/2` in the hour field: 8, 10 … 18           |
| `a/n`   | every _n_-th value from _a_ to the end | `5/15` in the minute field: 5, 20, 35, 50        |

**Not supported:** month or weekday names (`JAN`, `MON`), `L`, `W`, `#`, `?`, a seconds field,
and macros such as `@daily` or `@hourly`. An expression may be at most 200 characters.

When **both** day of month and day of week are restricted (neither is `*`), a day matches if
**either** matches. `0 0 1 * 1` therefore fires on the 1st of every month _and_ on every Monday.

An expression that never matches, such as `0 0 31 2 *` (31 February), is rejected when you save.

Studio checks the syntax while you type, using the same rules as the server, and shows messages
such as _A cron expression has 5 fields separated by spaces; this one has 6._ The buttons under
**Common expressions** fill in ready-made expressions:

| Button                | Expression    |
| --------------------- | ------------- |
| **Every 5 minutes**   | `*/5 * * * *` |
| **Hourly**            | `0 * * * *`   |
| **Daily at 00:00**    | `0 0 * * *`   |
| **Weekdays at 09:00** | `0 9 * * 1-5` |
| **Mondays at 06:00**  | `0 6 * * 1`   |
| **1st of the month**  | `0 0 1 * *`   |

### Time zone: always UTC {#timezone}

All schedule times are in **UTC**. There is no time zone setting and no automatic daylight saving
time adjustment. Convert local times yourself: 09:00 in Berlin is `0 8 * * *` in winter (UTC+1)
and `0 7 * * *` in summer (UTC+2). If the exact local hour matters all year, adjust the schedule
when the clocks change, or let the handler check the local time.

The **Next run** and **Last run** columns are displayed in your own time zone, as everywhere in
Studio.

## What a schedule enqueues {#what-it-enqueues}

At each time slot the schedule enqueues one job with:

- the schedule's **Kind**, **Payload**, **Priority**, **Max. attempts** and **Tenant**;
- a link back to the schedule (the job detail shows it under **Schedule**);
- **Created by** `schedule:<schedule id>`;
- an idempotency key made of the schedule id and the time slot.

Each time slot fires **at most once**, even when several workers run. The job itself then runs at
least once, with the usual [retries](help:jobs#retries). A schedule does not wait for the previous
job to finish: if a job takes longer than the interval, the next one starts anyway.

## Missed runs and the next run {#missed-runs}

If no worker was running when slots were due (for example during maintenance), the missed slots are
**combined**: the schedule fires once for the overdue slot and then continues with the next slot
after the current time. It does not catch up every missed run.

**Next run** is recalculated from the current time whenever you change the timing or enable the
schedule. Changing only the name, payload, priority or attempts keeps the next run.

**Suspended tenant or archived product.** While the tenant of a schedule is suspended or its
product archived, due slots are skipped: no job is enqueued, **Last run** does not change and the
schedule moves on to its next slot. The audit log records `events.schedule.skip` once for the
first skipped slot. A job that was already queued is not run either; it ends as **Failed** with
`skipped: …` (see [job statuses](help:jobs#statuses)). The schedule itself is kept and fires again
with the next slot after the tenant is reactivated.

## Edit a schedule {#edit}

1. Open the row's actions menu and choose **Edit**.
2. Change the values and choose **Save changes**.

Studio sends only the fields you changed. The **Tenant** cannot be changed after creation; delete
the schedule and create a new one instead. Jobs already enqueued keep their old payload.

## Enable or disable a schedule {#enable-disable}

Open the row's actions menu and choose **Disable** or **Enable**. A disabled schedule keeps all its
settings but does not fire. When you enable it again, it continues with the next slot after now;
slots missed while it was disabled are not run.

## Delete a schedule {#delete}

Open the row's actions menu, choose **Delete schedule** and confirm. The schedule stops firing.
Jobs it already enqueued stay and still run. Deleting cannot be undone; to stop a schedule
temporarily, disable it instead.

## Settings {#settings}

| Setting           | What it does                                              | Allowed values / default                                            |
| ----------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| **Name**          | Shown in the list and in messages.                        | 1 to 200 characters. Required.                                      |
| **Kind**          | Job kind to enqueue; a worker needs a handler for it.     | As for [jobs](help:jobs#enqueue); `axentra.` is reserved. Required. |
| **Timing**        | **Fixed interval** or **Cron expression**.                | Interval 10 s to 366 days; cron: 5 fields, UTC.                     |
| **Payload**       | Input of every enqueued job.                              | JSON object, at most 64 KB. Default `{}`.                           |
| **Tenant**        | Enqueues the jobs in this tenant.                         | A tenant or **Product level**. Only when creating.                  |
| **Priority**      | Priority of the enqueued jobs.                            | −100 to 100. Default 0.                                             |
| **Max. attempts** | Attempts of each enqueued job before it becomes **Dead**. | 1 to 100. Default 5.                                                |
| **Enabled**       | Whether the schedule fires.                               | Default on.                                                         |

## For developers {#developers}

Schedules are also available through the API: `GET/POST /v1/products/{product_id}/schedules` and
`GET/PATCH/DELETE /schedules/{id}` (with `If-Match` for updates and deletes). Only one worker acts
as the scheduler at a time; it checks for due schedules every 5 seconds by default
(`events.scheduler_interval_seconds`), so a job can be enqueued a few seconds after its slot.

## Troubleshooting {#troubleshooting}

**The schedule does not fire.** Check that it is **Active** and that **Next run** is in the past.
If so, no worker is running; ask your operators to start one. If jobs are enqueued but stay
**Queued**, no worker handles the kind; see [Jobs](help:jobs#troubleshooting).

**It fires at the wrong hour.** Cron times are UTC. Convert your local time, including daylight
saving time (see [Time zone](help:schedules#timezone)).

**"The cron expression never matches".** The fields describe a date that does not exist, such as
the 30th of February. Change the day or month.

**"Please check your input" with a cron message.** The server names the field, for example
`cron hour: values must be within 0-23` or `cron day of week: invalid value 'MON'`. Use numbers
instead of names and remove macros.

**"interval_seconds must be between 10 and 31622400".** The interval is shorter than 10 seconds or
longer than 366 days.

**"Changed in the meantime" when saving, enabling or deleting.** Someone else changed the
schedule after you loaded it. Close the dialog, wait for the list to refresh (or reload the page),
then repeat your change on the current version.

**The schedule ran once after a downtime, not for every missed slot.** That is intended: missed
slots are combined into one run.
