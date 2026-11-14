"""Browser end-to-end check of a running QA kit (real Chromium through Playwright).

Usage: python e2e_kit.py [base URL, default http://127.0.0.1:8765] [screenshot folder]

Checks the kit page (test users, integrations, checklist save and reload, captured mails), signs in to Studio as
the platform admin and opens every product page of the seeded product, collecting console errors, failed /v1
requests (5xx) and error alerts. Then checks role limits through the API, the phone layout, and sign-out.
Prints one line per check and exits non-zero on any failure.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://127.0.0.1:8765"
SHOTS = Path(sys.argv[2]) if len(sys.argv) > 2 else None
PASSWORD = "Axentra-Test-2026!"
ADMIN = "alex.admin@example.com"
PRODUCT_PAGES = [
    "dashboard",
    "tenants",
    "users",
    "invitations",
    "roles",
    "permissions",
    "api-keys",
    "records",
    "data",
    "files",
    "search",
    "jobs",
    "schedules",
    "events",
    "webhooks",
    "usage",
    "plans",
    "subscriptions",
    "notifications",
    "inbox",
]
GLOBAL_PAGES = ["/", "/products", "/audit", "/health", "/monitoring", "/settings", "/profile", "/help"]
failures: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"{'PASS' if ok else 'FAIL'}  {name}{('  ' + detail) if detail else ''}", flush=True)
    if not ok:
        failures.append(name)


CSRF: dict[str, str] = {}


def api(method: str, path: str, cookie: str | None = None, body: dict | None = None) -> tuple[int, object]:
    req = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body else None)
    req.add_header("Origin", BASE)
    req.add_header("Content-Type", "application/json")
    if cookie:
        req.add_header("Cookie", cookie)
        if cookie in CSRF:
            req.add_header("X-Axentra-CSRF", CSRF[cookie])
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None), r.headers.get_all("Set-Cookie") or []
    except urllib.error.HTTPError as e:
        return e.code, None, []


def login_cookie(email: str) -> tuple[int, str | None]:
    status, body, cookies = api("POST", "/v1/auth/login/password", body={"email": email, "password": PASSWORD})
    cookie = "; ".join(c.split(";", 1)[0] for c in cookies) or None
    if cookie and isinstance(body, dict) and body.get("csrf_token"):
        CSRF[cookie] = body["csrf_token"]
    return status, cookie


def main() -> int:
    # Role limits through the API (the same rules Studio relies on).
    status, admin_cookie = login_cookie(ADMIN)
    check("admin can sign in (API)", status == 200 and admin_cookie is not None, str(status))
    status, _ = login_cookie("tobias.test@example.com")
    check("disabled user cannot sign in", status in (401, 403), str(status))
    status, _ = login_cookie("alex.admin@example.com".replace("alex", "niemand"))
    check("unknown user cannot sign in", status in (401, 403), str(status))
    _, products, _ = api("GET", "/v1/products", admin_cookie)
    crm = next(p for p in products if p["slug"] == "beispiel-crm")
    status, viewer = login_cookie("paula.plattform@example.com")
    s, _, _ = api("POST", "/v1/products", viewer, {"name": "Darf nicht", "slug": "darf-nicht"})
    check("read-only platform viewer cannot create a product", s == 403, str(s))
    s, _, _ = api("POST", "/v1/auth/logout", viewer)
    s2, _, _ = api("POST", "/v1/products", None, {"name": "Ohne Anmeldung", "slug": "ohne-anmeldung"})
    check("CSRF token present for API checks", viewer in CSRF, "")
    check("anonymous request cannot create a product", s2 == 401, str(s2))
    status, lena = login_cookie("lena.demo@example.com")
    s, _, _ = api("GET", f"/v1/products/{crm['id']}/audit", lena)
    check("plain member cannot read the product audit log", s in (403, 404), str(s))

    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.environ.get("QA_E2E_CHROMIUM") or None)
        page = browser.new_page(viewport={"width": 1280, "height": 900}, locale="de-DE")
        console_errors: list[str] = []
        server_errors: list[str] = []
        page.on("console", lambda m: m.type == "error" and console_errors.append(m.text))
        page.on("response", lambda r: r.status >= 500 and server_errors.append(f"{r.status} {r.url}"))

        # Kit page.
        page.goto(f"{BASE}/qa/")
        page.wait_for_selector("#users tbody tr td code")
        rows = page.locator("#users tbody tr").count()
        check("kit page lists the test users", rows >= 10, f"{rows} rows")
        check("kit page lists the integrations", page.locator("#integrations tbody tr").count() >= 5)
        page.goto(f"{BASE}/qa/#checkliste")
        page.wait_for_selector(".case")
        cases = page.locator(".case").count()
        check("checklist renders", cases >= 50, f"{cases} cases")
        first = page.locator(".case").first
        first.locator("input[value=pass]").check()
        first.locator("textarea").fill("E2E-Probe")
        expect(page.locator("#save-state")).to_have_text("Gespeichert.")
        page.reload()
        page.wait_for_selector(".case")
        check(
            "checklist result survives a reload",
            page.locator(".case").first.locator("input[value=pass]").is_checked()
            and page.locator(".case").first.locator("textarea").input_value() == "E2E-Probe",
        )
        first = page.locator(".case").first
        first.locator("textarea").fill("")
        expect(page.locator("#save-state")).to_have_text("Gespeichert.")
        page.goto(f"{BASE}/qa/#mails")
        page.wait_for_selector("#mails tbody tr.clickable", timeout=15_000)
        page.locator("#mails tbody tr.clickable").first.click()
        page.wait_for_selector("#mail-view:not([hidden])")
        check("captured mails are listed and open", page.locator("#mail-text").inner_text().strip() != "")

        # Studio sign-in through the real form.
        page.goto(f"{BASE}/login")
        page.fill("input[type=email]", ADMIN)
        page.fill("input[type=password]", PASSWORD)
        page.click("button[type=submit]")
        page.wait_for_url(lambda u: "/login" not in u, timeout=20_000)
        check("admin signs in through the Studio form", "/login" not in page.url, page.url)
        if SHOTS:
            SHOTS.mkdir(parents=True, exist_ok=True)

        def visit(path: str) -> None:
            before_console, before_server = len(console_errors), len(server_errors)
            page.goto(BASE + path)
            page.wait_for_load_state("networkidle")
            alerts = [t for t in page.locator("[role=alert]").all_inner_texts() if t.strip()]
            new_server = server_errors[before_server:]
            new_console = [e for e in console_errors[before_console:] if "favicon" not in e]
            ok = not new_server and not page.locator("text=Seite nicht gefunden").count()
            detail = "; ".join(new_server + [f"alert: {a[:80]}" for a in alerts] + new_console[:2])
            check(f"page {path}", ok, detail)
            if SHOTS:
                page.screenshot(path=str(SHOTS / ((path.strip("/").replace("/", "_") or "start") + ".png")))

        for path in GLOBAL_PAGES:
            visit(path)
        for sub in PRODUCT_PAGES:
            visit(f"/p/{crm['id']}/{sub}")

        # Phone layout: the page must not scroll sideways.
        page.set_viewport_size({"width": 360, "height": 780})
        page.goto(f"{BASE}/p/{crm['id']}/dashboard")
        page.wait_for_load_state("networkidle")
        overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        check("phone width without horizontal scrolling", overflow <= 1, f"{overflow}px")
        page.set_viewport_size({"width": 1280, "height": 900})

        # Sign-out: afterwards the API refuses the session.
        status, _, _ = api("POST", "/v1/auth/logout", admin_cookie)
        s, _, _ = api("GET", "/v1/me", admin_cookie)
        check("sign-out ends the session", s == 401, f"logout {status}, /v1/me {s}")
        browser.close()

    print(f"\n{'E2E OK' if not failures else 'E2E FAILED: ' + ', '.join(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
