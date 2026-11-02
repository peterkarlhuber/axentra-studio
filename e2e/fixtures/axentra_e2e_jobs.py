"""Job handlers for Studio's e2e tests (e2e/events.spec.ts), loaded into a real Axentra worker:

    PYTHONPATH=e2e/fixtures axentra worker --load axentra_e2e_jobs

- ``studio.e2e.ok``: succeeds and returns ``{"ok": true, "echo": payload}``.
- ``studio.e2e.flaky``: fails permanently on its first run and succeeds when retried
  (remembered in-process per job id), so a "retry a failed job" flow can be tested.
- ``studio.e2e.slow``: sleeps up to 60 s while honouring cancellation (``ctx.cancel_requested``).
- ``studio.e2e.create_user``: creates a password user ``{"email", "password", "name"}`` (or finds
  it) and returns ``{"user_id": ...}``. Axentra has no public API to create a second account
  (users come from setup, OIDC or invitations), so e2e/security.spec.ts uses this in-process
  fixture to sign in as a non-admin. Only ``jobs:manage`` holders can enqueue it (undeclared kind).
"""

from __future__ import annotations

import time

from axentra.data.database import DbScope
from axentra.events import JobCancelled, PermanentJobError

_seen: set[str] = set()


def _ok(ctx):
    return {"ok": True, "echo": ctx.job.payload}


def _flaky(ctx):
    if ctx.job.id not in _seen:
        _seen.add(ctx.job.id)
        raise PermanentJobError("e2e: first attempt fails on purpose")
    return {"ok": True, "retried": True}


def _slow(ctx):
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline:
        if not ctx.heartbeat() or ctx.cancel_requested():
            raise JobCancelled()
        time.sleep(0.5)
    return {"ok": True}


def _create_user(ax):
    def handler(ctx):
        payload = ctx.job.payload
        with ax.db.transaction(DbScope.platform()) as tx:
            existing = ax.identity.find_user_by_email(tx, payload["email"])
            user_id = (
                existing["id"]
                if existing
                else ax.identity.create_user(
                    tx, email=payload["email"], name=payload.get("name", ""), password=payload["password"]
                )
            )
        return {"user_id": user_id}

    return handler


def setup(ax) -> None:
    ax.jobs.register("studio.e2e.create_user", _create_user(ax))
    ax.jobs.register("studio.e2e.ok", _ok)
    ax.jobs.register("studio.e2e.flaky", _flaky)
    ax.jobs.register("studio.e2e.slow", _slow)
