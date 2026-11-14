"""Shared helpers for the automated checklist cases.

A case is a function ``case(ctx: Ctx) -> Outcome``. It drives Studio like the tester would (real Chromium through
Playwright) where the checklist describes UI steps, and may use the HTTP API for setup and for checks the UI cannot
show. A case never changes data that another case of the same run relies on without restoring it.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

PASSWORD = "Axentra-Test-2026!"
ADMIN = "alex.admin@example.com"

PASS, FAIL, NOT_AUTOMATED = "pass", "fail", "not_automated"


@dataclass
class Outcome:
    result: str  # PASS, FAIL or NOT_AUTOMATED
    note: str = ""
    screenshot: str = ""


def passed(note: str = "") -> Outcome:
    return Outcome(PASS, note)


def failed(note: str) -> Outcome:
    return Outcome(FAIL, note)


def manual(reason: str) -> Outcome:
    return Outcome(NOT_AUTOMATED, reason)


class Api:
    """A signed-in (or anonymous) API client with the CSRF header Axentra expects on writes."""

    def __init__(self, base: str) -> None:
        self.base = base
        self.cookie: str | None = None
        self.csrf: str | None = None

    def call(self, method: str, path: str, body: Any = None, headers: dict | None = None) -> tuple[int, Any]:
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, method=method, data=data)
        req.add_header("Origin", self.base)
        req.add_header("Content-Type", "application/json")
        for k, v in (headers or {}).items():
            req.add_header(k, v)
        if self.cookie:
            req.add_header("Cookie", self.cookie)
        if self.csrf and method not in ("GET", "HEAD"):
            req.add_header("X-Axentra-CSRF", self.csrf)
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                raw = r.read()
                cookies = r.headers.get_all("Set-Cookie") or []
                if cookies:
                    self.cookie = "; ".join(c.split(";", 1)[0] for c in cookies)
                try:
                    return r.status, json.loads(raw) if raw else None
                except ValueError:
                    return r.status, raw.decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                return e.code, json.loads(raw) if raw else None
            except ValueError:
                return e.code, raw.decode("utf-8", "replace")

    def login(self, email: str, password: str = PASSWORD) -> int:
        status, body = self.call("POST", "/v1/auth/login/password", {"email": email, "password": password})
        if status == 200 and isinstance(body, dict):
            self.csrf = body.get("csrf_token")
        return status

    def get(self, path: str) -> tuple[int, Any]:
        return self.call("GET", path)

    def post(self, path: str, body: Any = None) -> tuple[int, Any]:
        return self.call("POST", path, body if body is not None else {})

    def patch(self, path: str, body: Any) -> tuple[int, Any]:
        return self.call("PATCH", path, body)

    def put(self, path: str, body: Any) -> tuple[int, Any]:
        return self.call("PUT", path, body)

    def delete(self, path: str) -> tuple[int, Any]:
        return self.call("DELETE", path)


@dataclass
class Ctx:
    base: str  # e.g. http://127.0.0.1:8766
    kit: Path  # the unpacked AxentraStudio-QA folder of this kit (scripts, _kit, QA-Ergebnisse)
    shots: Path  # screenshot folder for this run
    browser: Any  # playwright Browser
    case_id: str = ""
    _contexts: list = field(default_factory=list)

    def api(self, email: str | None = ADMIN) -> Api:
        api = Api(self.base)
        if email:
            status = api.login(email)
            if status != 200:
                raise AssertionError(f"API sign-in as {email} failed: {status}")
        return api

    def product(self, slug: str = "beispiel-crm") -> dict:
        _, products = self.api().get("/v1/products")
        items = products["items"] if isinstance(products, dict) and "items" in products else products
        return next(p for p in items if p["slug"] == slug)

    def new_page(self, viewport: tuple[int, int] = (1280, 900), color_scheme: str = "light"):
        context = self.browser.new_context(
            viewport={"width": viewport[0], "height": viewport[1]}, locale="de-DE", color_scheme=color_scheme
        )
        self._contexts.append(context)
        page = context.new_page()
        page.set_default_timeout(15_000)
        return page

    def page(self, email: str | None = ADMIN, viewport: tuple[int, int] = (1280, 900)):
        """A fresh browser context, signed in through Studio's real login form (None: not signed in)."""
        page = self.new_page(viewport)
        if email:
            sign_in(page, self.base, email)
        return page

    def mails(self) -> list[dict]:
        return self.api(None).get("/qa/api/mails")[1] or []

    def mail(self, mail_id: str) -> dict:
        return self.api(None).get(f"/qa/api/mails/{mail_id}")[1] or {}

    def shot(self, page, name: str = "") -> str:
        self.shots.mkdir(parents=True, exist_ok=True)
        path = self.shots / f"{self.case_id}{('_' + name) if name else ''}.png"
        page.screenshot(path=str(path), full_page=True)
        return str(path)

    def last_page(self):
        """The most recently opened page of this case, or None (for a screenshot after a crash)."""
        pages = [page for context in self._contexts for page in context.pages]
        return pages[-1] if pages else None

    def close(self) -> None:
        for c in self._contexts:
            try:
                c.close()
            except Exception:
                pass
        self._contexts.clear()


def sign_in(page, base: str, email: str, password: str = PASSWORD, expect_success: bool = True) -> None:
    page.goto(f"{base}/login")
    page.fill("input[type=email]", email)
    page.fill("input[type=password]", password)
    page.click("button[type=submit]")
    if expect_success:
        page.wait_for_url(lambda u: "/login" not in u, timeout=20_000)


Case = Callable[[Ctx], Outcome]


def chromium_path() -> str | None:
    return os.environ.get("QA_E2E_CHROMIUM") or None
