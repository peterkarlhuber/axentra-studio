"""Automated checklist cases A-01 .. F-08 (start, sign-in, users, products, tenants, roles).

Each case follows the German checklist steps through Studio's UI and checks the "expected" text. The API is used
only for setup, for restoring data and to confirm effects.
"""

from __future__ import annotations

import re
import time

from .harness import PASSWORD, Ctx, Outcome, failed, manual, passed

CRM = "Beispiel-CRM (Test)"
SHOP = "Beispiel-Shop (Test)"
MUSTER = "Muster GmbH (Test)"
CRM_TENANTS = [
    MUSTER,
    "Beispiel AG (Test)",
    "Demo Handwerk KG (Test)",
    "Musterstadt e.V. (Test)",
    "Probe & Partner (Test)",
    "Grenzfall Datenhungrig GmbH (Test)",
]
PETER_TENANT = "Peter QA GmbH"
SIDEBAR = [
    "Mandanten",
    "Benutzer",
    "Einladungen",
    "Rollen",
    "Berechtigungen",
    "API-Schlüssel",
    "Datenübersicht",
    "Datensätze",
    "Dateien",
    "Suche",
    "Jobs",
    "Zeitpläne",
    "Ereignisse",
    "Webhooks",
    "Nutzung",
    "Tarife",
    "Abonnements",
    "Benachrichtigungen",
    "Posteingang",
    "Audit-Protokoll",
    "Systemzustand",
    "Monitoring",
    "Einstellungen",
]
LOGIN_FAILED = "Anmeldung fehlgeschlagen"
WRONG_CREDENTIALS = "E-Mail-Adresse oder Passwort ist falsch."


# ---------------------------------------------------------------- helpers


def fail(ctx: Ctx, page, note: str) -> Outcome:
    out = failed(note)
    out.screenshot = ctx.shot(page)
    return out


def settle(page) -> None:
    page.wait_for_load_state("networkidle")


def main_text(page) -> str:
    settle(page)
    return page.locator("main").inner_text()


def wait_text(page, text: str, timeout: int = 10_000) -> bool:
    """True when `text` becomes visible somewhere on the page."""
    try:
        page.get_by_text(text, exact=False).first.wait_for(state="visible", timeout=timeout)
        return True
    except Exception:
        return False


def nav_link(page, label: str):
    """A sidebar entry by its German label (an entry may carry a count or the "Aus" marker after it)."""
    nav = page.get_by_role("navigation", name="Hauptnavigation")
    return nav.get_by_role("link", name=re.compile(rf"^{re.escape(label)}(\s|$)"))


def open_nav(page, label: str) -> None:
    link = nav_link(page, label).first
    href = link.get_attribute("href") or ""
    link.click()
    page.wait_for_url(lambda u: u.split("?")[0].endswith(href.split("?")[0]))
    settle(page)


def open_row(page, name: str) -> None:
    """Click the link `name` in the main table and wait for its detail page (h1 = name)."""
    page.locator("main table").get_by_role("link", name=name).first.click()
    page.locator("main h1").filter(has_text=name).wait_for()
    settle(page)


def heading(page) -> str:
    h1 = page.locator("main h1")
    try:
        h1.first.wait_for(state="visible", timeout=10_000)
    except Exception:
        return ""
    return h1.first.inner_text().strip()


def switch_product(page, name: str) -> None:
    settle(page)  # the menu re-renders while the product list is still loading
    page.get_by_role("button", name=re.compile("Produkt wechseln")).click()
    page.get_by_role("menu").wait_for()
    page.get_by_role("menuitemradio", name=name).click()
    settle(page)


def open_user_menu(page) -> None:
    settle(page)
    page.get_by_role("button", name=re.compile("Benutzermenü öffnen")).click()
    page.get_by_role("menu").wait_for()


def login_form(page, base: str, email: str, password: str = PASSWORD) -> None:
    """Fill and send Studio's login form like the tester (no wait for the result)."""
    if "/login" not in page.url:
        page.goto(f"{base}/login")
    page.get_by_label("E-Mail-Adresse").fill(email)
    page.get_by_label("Passwort", exact=False).first.fill(password)
    page.get_by_role("button", name="Anmelden", exact=True).click()


def login_refused(page) -> str:
    """Empty when the login page shows the expected refusal and stays on /login, else what happened."""
    if not wait_text(page, LOGIN_FAILED):
        return f"keine Meldung „{LOGIN_FAILED}“ (URL {page.url})"
    if not page.get_by_text(WRONG_CREDENTIALS).first.is_visible():
        return f"Text „{WRONG_CREDENTIALS}“ fehlt"
    if "/login" not in page.url:
        return f"nicht mehr auf der Anmeldeseite ({page.url})"
    return ""


def logged_in(page) -> bool:
    try:
        page.wait_for_url(lambda u: "/login" not in u, timeout=15_000)
        page.get_by_role("navigation", name="Hauptnavigation").wait_for(timeout=10_000)
        return True
    except Exception:
        return False


def crm_page(ctx: Ctx, page, sub: str, slug: str = "beispiel-crm") -> None:
    page.goto(f"{ctx.base}/p/{ctx.product(slug)['id']}/{sub}")
    settle(page)


def stable_rows(page, selector: str = "main table tbody tr", timeout: float = 10) -> int:
    """Wait until the number of table rows (and their text) stops changing; tables fill in progressively."""
    rows = page.locator(selector)
    last, same = None, 0
    end = time.monotonic() + timeout
    while time.monotonic() < end and same < 3:
        now = (rows.count(), len(page.locator("main").inner_text()))
        same = same + 1 if now == last else 0
        last = now
        page.wait_for_timeout(300)
    return rows.count()


def wait_table(page) -> int:
    page.wait_for_selector("main table tbody tr")
    return stable_rows(page)


def table_names(page) -> list[str]:
    """The first cell's first line of every row of the main table."""
    stable_rows(page)
    rows = page.locator("main table tbody tr")
    names = []
    for i in range(rows.count()):
        cell = rows.nth(i).locator("th, td").first
        if cell.count():
            text = cell.inner_text().strip()
            if text:
                names.append(text.splitlines()[0].strip())
    return names


def row(page, text: str):
    return page.locator("main table tbody tr").filter(has_text=text)


def confirm_dialog(page, button: str, typed: str | None = None) -> None:
    """Confirm the open dialog; fill the type-to-confirm field when the dialog asks for it."""
    dialog = page.get_by_role("dialog")
    dialog.wait_for()
    field = dialog.locator("input")
    if field.count():
        field.first.fill(typed or "")
    dialog.get_by_role("button", name=button, exact=True).click()
    dialog.wait_for(state="hidden")
    settle(page)


def detail_value(page, label: str) -> str:
    """The value next to `label` in a detail list (dl/dt/dd) of the main area."""
    dd = page.locator(f"main dl dt:text-is('{label}') + dd")
    dd.first.wait_for()
    return dd.first.inner_text().strip()


def wait_detail(page, label: str, value: str, timeout: float = 10) -> bool:
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        if detail_value(page, label) == value:
            return True
        page.wait_for_timeout(250)
    return False


def mail_ids(ctx: Ctx) -> set[str]:
    return {m["id"] for m in ctx.mails()}


def wait_mail(ctx: Ctx, before: set[str], to: str, timeout: float = 60) -> dict | None:
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        for m in ctx.mails():
            if m["id"] not in before and to in m.get("to", ""):
                return m
        time.sleep(1)
    return None


def find_tenant(ctx: Ctx, name: str, slug: str = "beispiel-crm") -> dict | None:
    pid = ctx.product(slug)["id"]
    _, body = ctx.api().get(f"/v1/products/{pid}/tenants?q={name.replace(' ', '%20')}")
    items = body.get("items", []) if isinstance(body, dict) else []
    return next((t for t in items if t["name"] == name), None)


def find_user(ctx: Ctx, email: str) -> dict:
    _, body = ctx.api().get(f"/v1/users?q={email}")
    return next(u for u in body["items"] if u["email"] == email)


# ---------------------------------------------------------------- A: start and orientation


def a01(ctx: Ctx) -> Outcome:
    page = ctx.page(None)
    page.goto(ctx.base + "/")
    settle(page)
    if page.get_by_role("heading", name="Anmelden", exact=True).count() == 0:
        return fail(ctx, page, f"Startseite zeigt nicht „Anmelden“ (URL {page.url})")
    return manual(
        "Seite „Anmelden“ unter http://127.0.0.1:8765/ geprüft (ok). Doppelklick auf „2 - Starten“, das offene "
        "Terminalfenster und das automatische Öffnen des Browsers kann nur ein Mensch am Rechner prüfen."
    )


def a02(ctx: Ctx) -> Outcome:
    page = ctx.page(None)
    page.goto(ctx.base + "/qa/")
    page.wait_for_selector("#users tbody tr td")
    problems = []
    users = page.locator("#users tbody tr")
    if users.count() < 10:
        problems.append(f"nur {users.count()} Testbenutzer")
    for i in range(users.count()):
        cells = users.nth(i).locator("td").all_inner_texts()
        sso_only = len(cells) > 3 and "kein Passwort" in cells[3]  # the SSO-only user has none by design
        if len(cells) < 3 or "@" not in cells[0] or not (cells[1].strip() or sso_only):
            problems.append(f"Zeile {i + 1} ohne E-Mail/Passwort")
            break
    if PASSWORD not in page.locator("#users").inner_text():
        problems.append("Passwort fehlt in der Benutzerliste")
    tabs = page.get_by_role("navigation", name="Bereiche")
    for tab, section in [
        ("QA-Checkliste", "#tab-checkliste"),
        ("E-Mails", "#tab-mails"),
        ("Integrationen", "#tab-integrationen"),
        ("Version", "#tab-info"),
    ]:
        tabs.get_by_role("link", name=tab, exact=True).click()
        sec = page.locator(section)
        try:
            sec.wait_for(state="visible", timeout=5_000)
            page.wait_for_timeout(500)
        except Exception:
            problems.append(f"Tab „{tab}“ öffnet nicht")
            continue
        text = sec.inner_text().strip()
        if tab == "QA-Checkliste":
            page.wait_for_selector(".case")
            if page.locator(".case").count() < 50:
                problems.append(f"Checkliste zeigt nur {page.locator('.case').count()} Fälle")
            elif "A-02" not in sec.inner_text() and "Kit-Seite /qa/" not in sec.inner_text():
                problems.append("Checkliste zeigt diesen Testfall nicht")
            elif page.locator(".case input[type=radio]").count() == 0:
                problems.append("Checkliste ohne Auswahl zum Abhaken")
        elif tab == "E-Mails":
            page.wait_for_selector("#mails tbody tr", timeout=10_000)
            if page.locator("#mails tbody tr").count() == 0:
                problems.append("Tab „E-Mails“ ohne Einträge")
        elif tab == "Integrationen":
            page.wait_for_selector("#integrations tbody tr")
            states = page.locator("#integrations tbody tr td:nth-child(2)").all_inner_texts()
            allowed = ("Echt, lokal", "Simuliert", "Nicht konfiguriert")
            bad = [s for s in states if not any(a in s for a in allowed)]
            if not states or bad:
                problems.append(f"Integrationen ohne erwarteten Status: {bad or 'keine Zeilen'}")
        elif len(text) < 20:
            problems.append(f"Tab „{tab}“ ist leer")
    if problems:
        return fail(ctx, page, "; ".join(problems))
    return passed()


def a03(ctx: Ctx) -> Outcome:
    page = ctx.page()
    switcher = page.get_by_role("button", name=re.compile("Produkt wechseln"))
    if CRM not in switcher.inner_text():
        switch_product(page, CRM)
    open_nav(page, "Dashboard")
    crm_id = ctx.product()["id"]
    if f"/p/{crm_id}/dashboard" not in page.url:
        return fail(ctx, page, f"Dashboard nicht für {CRM} geöffnet (URL {page.url})")
    text = main_text(page)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    values = {}
    for label in ("Mandanten", "Benutzer", "API-Schlüssel", "Datensätze"):
        if label in lines:
            idx = lines.index(label)
            values[label] = lines[idx - 1] if idx > 0 else ""
    missing = [k for k in ("Mandanten", "Benutzer", "API-Schlüssel", "Datensätze") if k not in values]
    if missing:
        return fail(ctx, page, f"Dashboard ohne Kennzahlen {', '.join(missing)}")
    if all(v == "0" for v in values.values()):
        return fail(ctx, page, f"Alle Zahlen sind 0: {values}")
    if "Systemzustand" not in text:
        return fail(ctx, page, "„Systemzustand“ fehlt auf dem Dashboard")
    if page.get_by_text("Etwas ist schiefgelaufen").count():
        return fail(ctx, page, "Fehlermeldung auf dem Dashboard")
    return passed(", ".join(f"{k} {v}" for k, v in values.items()))


def a04(ctx: Ctx) -> Outcome:
    page = ctx.page()
    crm_page(ctx, page, "dashboard")
    problems, off = [], []
    for label in SIDEBAR:
        link = nav_link(page, label)
        if link.count() == 0:
            problems.append(f"{label}: fehlt in der Seitenleiste")
            continue
        name = link.first.get_attribute("aria-label") or ""
        link.first.click()
        settle(page)
        title = heading(page)
        page.wait_for_timeout(300)
        text = page.locator("main").inner_text()
        if "Etwas ist schiefgelaufen" in text:
            problems.append(f"{label}: „Etwas ist schiefgelaufen“")
        elif not title:
            problems.append(f"{label}: keine Überschrift")
        elif "Wird geladen" in text:
            page.wait_for_timeout(5_000)
            if "Wird geladen" in page.locator("main").inner_text():
                problems.append(f"{label}: bleibt bei „Wird geladen …“")
        elif len(text.strip()) <= len(title) + 5:
            problems.append(f"{label}: leer")
        if "Modul nicht aktiviert" in name:
            off.append(label)
            if "Modul auf diesem Server nicht aktiviert" not in text:
                problems.append(f"{label}: „Aus“, aber ohne Hinweis „Modul auf diesem Server nicht aktiviert“")
    if problems:
        return fail(ctx, page, "; ".join(problems))
    return passed(f"Mit „Aus“: {', '.join(off)}" if off else "Kein Eintrag mit „Aus“")


def a05(ctx: Ctx) -> Outcome:
    page = ctx.page()
    crm_page(ctx, page, "tenants")
    wait_table(page)
    switch_product(page, SHOP)
    shop_id = ctx.product("beispiel-shop")["id"]
    if not page.url.endswith(f"/p/{shop_id}/tenants"):
        return fail(ctx, page, f"Studio ist nicht mehr auf „Mandanten“ des Shops (URL {page.url})")
    wait_table(page)
    row(page, "Musterladen OHG").first.wait_for()
    names = table_names(page)
    expected = {"Musterladen OHG (Test)", "Beispiel Boutique (Test)"}
    if heading(page) != "Mandanten" or set(names) != expected:
        return fail(ctx, page, f"Überschrift „{heading(page)}“, Mandanten: {names}")
    return passed()


# ---------------------------------------------------------------- B: sign-in and sign-out


def b01(ctx: Ctx) -> Outcome:
    page = ctx.page(None)
    page.goto(ctx.base + "/")
    login_form(page, ctx.base, "ole.operator@example.com")
    if not logged_in(page):
        return fail(ctx, page, "Anmeldung mit richtigem Passwort gescheitert")
    menu = page.get_by_role("button", name=re.compile("Benutzermenü öffnen"))
    shown = menu.inner_text()
    if "Ole Operator (Test)" not in shown:
        return fail(ctx, page, f"Oben rechts steht „{shown.strip()}“ statt „Ole Operator (Test)“")
    return passed()


def b02(ctx: Ctx) -> Outcome:
    page = ctx.page(None)
    page.goto(ctx.base + "/login")
    login_form(page, ctx.base, "ole.operator@example.com", "falsch123")
    problem = login_refused(page)
    if problem:
        return fail(ctx, page, problem)
    leaks = []
    if "falsch123" in page.locator("body").inner_text() or "falsch123" in page.url:
        leaks.append("Passwort sichtbar")
    if page.locator("input[type=password]").count() == 0:
        leaks.append("Passwortfeld nicht mehr verdeckt")
    text = page.locator("body").inner_text().lower()
    if any(w in text for w in ("kein konto", "existiert nicht", "unbekannt")):
        leaks.append("Meldung verrät, ob es das Konto gibt")
    if leaks:
        return fail(ctx, page, "; ".join(leaks))
    return passed()


def b03(ctx: Ctx) -> Outcome:
    page = ctx.page(None)
    page.goto(ctx.base + "/login")
    login_form(page, ctx.base, "tobias.test@example.com")
    problem = login_refused(page)
    if problem:
        return fail(ctx, page, problem)
    return passed()


def b04(ctx: Ctx) -> Outcome:
    page = ctx.page("ole.operator@example.com")
    open_nav(page, "Mandanten")
    wait_table(page)
    open_user_menu(page)
    page.get_by_role("menuitem", name="Abmelden").click()
    try:
        page.wait_for_url(re.compile(r"/login"), timeout=15_000)
    except Exception:
        return fail(ctx, page, f"Nach dem Abmelden keine Anmeldeseite (URL {page.url})")
    if not wait_text(page, "Anmelden"):
        return fail(ctx, page, "Seite „Anmelden“ nicht sichtbar")
    page.go_back()
    settle(page)
    page.wait_for_timeout(1_500)
    data_visible = page.locator("main table tbody tr").count() > 0
    on_login = "/login" in page.url and page.get_by_role("button", name="Anmelden", exact=True).count() > 0
    if data_visible or not on_login:
        return fail(ctx, page, f"Nach „Zurück“: URL {page.url}, Daten sichtbar: {data_visible}")
    return passed()


def b05(ctx: Ctx) -> Outcome:
    page = ctx.page("ole.operator@example.com")
    open_nav(page, "Mandanten")
    if heading(page) != "Mandanten":
        return fail(ctx, page, "„Mandanten“ öffnet nicht")
    page.reload()
    settle(page)
    if "/login" in page.url or heading(page) != "Mandanten":
        return fail(ctx, page, f"Nach dem Neuladen: URL {page.url}, Überschrift „{heading(page)}“")
    context = page.context
    page.close()
    page = context.new_page()
    page.goto(ctx.base + "/")
    settle(page)
    if not logged_in(page):
        return fail(ctx, page, f"Neuer Tab verlangt neue Anmeldung (URL {page.url})")
    return passed()


def b06(ctx: Ctx) -> Outcome:
    email = "ole.operator@example.com"
    normal = ctx.page(email)
    open_nav(normal, "Mandanten")
    private = ctx.page(email)  # a second browser context is a private window
    open_user_menu(private)
    private.get_by_role("menuitem", name="Profil").click()
    settle(private)
    private.get_by_role("heading", name="Deine Sitzungen").wait_for()
    private.get_by_role("button", name="Alle anderen Sitzungen abmelden").click()
    dialog = private.get_by_role("dialog")
    dialog.wait_for()
    dialog.get_by_role("button", name=re.compile("abmelden")).last.click()
    dialog.wait_for(state="hidden")
    settle(private)
    open_nav(normal, "Benutzer")
    try:
        normal.wait_for_url(re.compile(r"/login"), timeout=15_000)
    except Exception:
        return fail(ctx, normal, f"Normales Fenster arbeitet weiter (URL {normal.url})")
    private.reload()
    settle(private)
    if "/login" in private.url or heading(private) != "Profil":
        out = fail(ctx, private, f"Privates Fenster ist nicht mehr angemeldet (URL {private.url})")
        return out
    return passed()


def b07(ctx: Ctx) -> Outcome:
    email = "lena.demo@example.com"
    before = mail_ids(ctx)
    page = ctx.page(None)
    page.goto(ctx.base + "/login")
    page.get_by_role("link", name="Passwort vergessen?").click()
    settle(page)
    page.get_by_label("E-Mail-Adresse").fill(email)
    page.get_by_role("button", name="Link zum Zurücksetzen senden").click()
    if not wait_text(page, "Sieh in deinem Postfach nach"):
        return fail(ctx, page, "Keine Meldung „Sieh in deinem Postfach nach“")
    mail = wait_mail(ctx, before, email, timeout=120)
    kit = ctx.new_page()
    kit.goto(ctx.base + "/qa/#mails")
    if mail is None:
        return fail(ctx, kit, "Keine Mail an Lena im Tab „E-Mails“ nach 2 Minuten")
    kit.locator("#reload-mails").click()
    rows = kit.locator("#mails tbody tr.clickable").filter(has_text=email).filter(has_text=mail["subject"])
    try:
        rows.first.wait_for(timeout=15_000)
    except Exception:
        return fail(ctx, kit, "Mail an Lena fehlt im Tab „E-Mails“")
    rows.first.click()
    kit.wait_for_selector("#mail-view:not([hidden])")
    match = re.search(r"https?://\S+", ctx.mail(mail["id"]).get("text", ""))
    if not match:
        return fail(ctx, kit, "Mail an Lena enthält keinen Link")
    page.goto(match.group(0).rstrip(".,)>"))
    settle(page)
    if not wait_text(page, "Neues Passwort wählen") or page.get_by_text("Dieser Link ist nicht verwendbar").count():
        return fail(ctx, page, f"Link öffnet nicht „Neues Passwort wählen“ ({page.url})")
    return passed()


def b08(ctx: Ctx) -> Outcome:
    page = ctx.page(None)
    page.goto(ctx.base + "/login")
    login_form(page, ctx.base, "sso.nutzer@example.com")
    if not wait_text(page, LOGIN_FAILED) or "/login" not in page.url:
        return fail(ctx, page, f"SSO-Nutzer: keine Meldung „{LOGIN_FAILED}“ (URL {page.url})")
    admin = ctx.page()
    crm_page(ctx, admin, "dashboard")
    open_nav(admin, "Benutzer")
    admin.get_by_role("searchbox", name="Benutzer suchen").fill("SSO")
    link = admin.locator("main table").get_by_role("link", name="SSO Nutzer (Test)")
    try:
        link.first.wait_for(timeout=10_000)
    except Exception:
        return fail(ctx, admin, "Suche „SSO“ in „Benutzer“ findet SSO Nutzer (Test) nicht")
    open_row(admin, "SSO Nutzer (Test)")
    detail = main_text(admin)
    if "Kein Passwort (nur Single Sign-on)" not in detail:
        return fail(ctx, admin, "„Kein Passwort (nur Single Sign-on)“ fehlt")
    ids = admin.locator("table").filter(has_text="Anbieter (Issuer)").locator("tbody tr")
    if "Keine Single-Sign-on-Identitäten" in detail or ids.count() == 0:
        return fail(ctx, admin, "Keine Identität unter „Single-Sign-on-Identitäten“")
    return passed()


# ---------------------------------------------------------------- C: user management


def c01(ctx: Ctx) -> Outcome:
    page = ctx.page()
    crm_page(ctx, page, "dashboard")
    open_nav(page, "Benutzer")
    wait_table(page)
    all_names = table_names(page)
    search = page.get_by_role("searchbox", name="Benutzer suchen")
    search.fill("Maria")
    try:
        page.wait_for_function("() => document.querySelectorAll('main table tbody tr').length === 1", timeout=10_000)
    except Exception:
        pass
    settle(page)
    found = table_names(page)
    if found != ["Maria Muster (Test)"]:
        return fail(ctx, page, f"Suche „Maria“ zeigt {found}")
    search.fill("")
    page.wait_for_function(
        f"() => document.querySelectorAll('main table tbody tr').length >= {len(all_names)}", timeout=10_000
    )
    again = table_names(page)
    if sorted(again) != sorted(all_names):
        return fail(ctx, page, f"Nach dem Löschen der Suche {len(again)} statt {len(all_names)} Benutzer")
    return passed()


def c02(ctx: Ctx) -> Outcome:
    page = ctx.page()
    crm_page(ctx, page, "users")
    open_row(page, "Lena Demo (Test)")
    page.get_by_role("heading", name="Mitgliedschaften").wait_for()
    settle(page)
    stable_rows(page, "main table tbody tr")
    problems = []
    for title in ("Profil", "Mitgliedschaften", "Aktive Sitzungen"):
        if page.get_by_role("heading", name=title, exact=True).count() == 0:
            problems.append(f"Abschnitt „{title}“ fehlt")
    tenants = page.locator("table").filter(has_text="Status des Mandanten")
    for name in (MUSTER, "Demo Handwerk KG (Test)"):
        r = tenants.locator("tbody tr").filter(has_text=name)
        if r.count() == 0:
            problems.append(f"Mitgliedschaft {name} fehlt")
            continue
        role = r.first.locator("th, td").nth(2).inner_text().strip()
        if not role:
            problems.append(f"{name} ohne Rolle")
    if problems:
        return fail(ctx, page, "; ".join(problems))
    return passed()


def c03(ctx: Ctx) -> Outcome:
    email = "jonas.beispiel@example.com"
    user = find_user(ctx, email)
    admin = ctx.page()
    try:
        crm_page(ctx, admin, "users")
        open_row(admin, "Jonas Beispiel (Test)")
        admin.get_by_role("button", name="Benutzer deaktivieren").click()
        confirm_dialog(admin, "Benutzer deaktivieren", email)
        notice = "Dieser Benutzer ist deaktiviert und kann sich nicht anmelden."
        if not wait_text(admin, notice):
            return fail(ctx, admin, f"Hinweis „{notice}“ fehlt nach dem Deaktivieren")
        private = ctx.page(None)
        private.goto(ctx.base + "/login")
        login_form(private, ctx.base, email)
        if not wait_text(private, LOGIN_FAILED) or "/login" not in private.url:
            return fail(ctx, private, "Jonas kann sich trotz Deaktivierung anmelden")
        admin.get_by_role("button", name="Benutzer aktivieren").click()
        if admin.get_by_role("dialog").count():
            confirm_dialog(admin, "Benutzer aktivieren", email)
        if not wait_text(admin, "Benutzer aktiviert"):
            return fail(ctx, admin, "Keine Bestätigung „Benutzer aktiviert“")
        private.goto(ctx.base + "/login")
        login_form(private, ctx.base, email)
        if not logged_in(private):
            return fail(ctx, private, "Jonas kann sich nach dem Aktivieren nicht anmelden")
        return passed()
    finally:
        api = ctx.api()
        if api.get(f"/v1/users/{user['id']}")[1].get("status") != "active":
            api.patch(f"/v1/users/{user['id']}", {"status": "active"})


def c04(ctx: Ctx) -> Outcome:
    email = "peter.test@example.com"
    before = mail_ids(ctx)
    page = ctx.page()
    crm_page(ctx, page, "dashboard")
    open_nav(page, "Einladungen")
    page.locator("main").get_by_label("Mandant", exact=True).select_option(label=MUSTER)
    settle(page)
    page.get_by_role("button", name="Mitglied einladen").click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_role("textbox", name=re.compile("^E-Mail-Adresse")).fill(email)
    dialog.get_by_role("combobox", name="Rolle").select_option(value="member")
    dialog.get_by_role("button", name="Einladung senden").click()
    if not wait_text(page, "Einladung erstellt"):
        return fail(ctx, page, "Kein „Einladung erstellt“")
    created = page.get_by_role("dialog")
    text = created.inner_text()
    if "Wird nur einmal angezeigt" not in text or "Einladungslink" not in text:
        return fail(ctx, page, "Fenster ohne „Einladungslink“ / „Wird nur einmal angezeigt“")
    created.get_by_role("button", name=re.compile("Schließen|Fertig")).first.click()
    created.wait_for(state="hidden")
    settle(page)
    entry = row(page, email).filter(has_not_text="Widerrufen")
    if entry.count() == 0:
        return fail(ctx, page, "Neue Einladung steht nicht in der Liste")
    count_open = entry.count()
    entry.first.get_by_role("button", name=f"Einladung für {email} widerrufen").click()
    confirm_dialog(page, "Einladung widerrufen")
    page.wait_for_timeout(1_000)
    settle(page)
    if row(page, email).filter(has_not_text="Widerrufen").count() >= count_open:
        return fail(ctx, page, "Widerrufen ändert nichts an der Liste")
    if not wait_mail(ctx, before, email, timeout=60):
        return fail(ctx, page, "Keine Einladungs-Mail an peter.test@example.com im Mail-Fänger")
    kit = ctx.new_page()
    kit.goto(ctx.base + "/qa/#mails")
    try:
        kit.locator("#mails tbody tr").filter(has_text=email).first.wait_for(timeout=15_000)
    except Exception:
        return fail(ctx, kit, "Mail an peter.test@example.com fehlt im Tab „E-Mails“")
    return passed()


# ---------------------------------------------------------------- D: products


def d01(ctx: Ctx) -> Outcome:
    page = ctx.page()
    open_nav(page, "Produkte")
    wait_table(page)
    problems = []
    for name in (CRM, SHOP, "Altes Testprodukt (Test)"):
        if row(page, name).count() == 0:
            problems.append(f"{name} fehlt")
    old = row(page, "Altes Testprodukt (Test)")
    if old.count() and "Archiviert" not in old.first.inner_text():
        problems.append("Altes Testprodukt (Test) nicht „Archiviert“")
    if problems:
        return fail(ctx, page, "; ".join(problems))
    return passed()


def d02(ctx: Ctx) -> Outcome:
    name, slug = "QA Testprodukt", "qa-testprodukt"
    _, products = ctx.api().get("/v1/products")
    items = products["items"] if isinstance(products, dict) else products
    if any(p["slug"] == slug for p in items):
        return manual(
            "„QA Testprodukt“ existiert schon (früherer Lauf); Produkte lassen sich nicht löschen. "
            "Mit frischen Testdaten wiederholen."
        )
    page = ctx.page()
    open_nav(page, "Produkte")
    page.get_by_role("button", name="Neues Produkt").click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_role("textbox", name=re.compile(r"^Name\b")).fill(name)
    page.wait_for_timeout(300)
    auto_slug = dialog.get_by_role("textbox", name=re.compile("^Kurzname")).input_value()
    dialog.get_by_role("button", name="Produkt anlegen").click()
    if not wait_text(page, f"Produkt „{name}“ angelegt"):
        return fail(ctx, page, f"Keine Meldung „Produkt „{name}“ angelegt“ (Kurzname „{auto_slug}“)")
    if auto_slug != slug:
        return fail(ctx, page, f"Kurzname „{auto_slug}“ statt „{slug}“")
    page.goto(ctx.base + "/products")
    wait_table(page)
    if row(page, name).count() == 0 or slug not in row(page, name).first.inner_text():
        return fail(ctx, page, "Neues Produkt fehlt in der Liste")
    return passed()


def d03(ctx: Ctx) -> Outcome:
    old = ctx.product("altes-testprodukt")
    page = ctx.page()
    try:
        page.goto(ctx.base + "/products")
        open_row(page, "Altes Testprodukt (Test)")
        settle(page)
        page.get_by_role("button", name="Wiederherstellen").click()
        confirm_dialog(page, "Wiederherstellen")
        if not wait_text(page, "Produkt wiederhergestellt"):
            return fail(ctx, page, "Keine Meldung „Produkt wiederhergestellt“")
        if not wait_detail(page, "Status", "Aktiv"):
            return fail(ctx, page, f"Status nach Wiederherstellen „{detail_value(page, 'Status')}“ statt „Aktiv“")
        page.get_by_role("button", name="Archivieren").click()
        confirm_dialog(page, "Archivieren", old["name"])
        if not wait_text(page, "Produkt archiviert"):
            return fail(ctx, page, "Keine Meldung „Produkt archiviert“")
        if not wait_detail(page, "Status", "Archiviert"):
            return fail(ctx, page, f"Status nach Archivieren „{detail_value(page, 'Status')}“ statt „Archiviert“")
        if ctx.product("altes-testprodukt")["status"] != "archived":
            return fail(ctx, page, "Produkt laut API nicht archiviert")
        return passed()
    finally:
        if ctx.product("altes-testprodukt")["status"] != "archived":
            ctx.api().post(f"/v1/products/{old['id']}/archive")


# ---------------------------------------------------------------- E: tenants


def e01(ctx: Ctx) -> Outcome:
    page = ctx.page()
    crm_page(ctx, page, "dashboard")
    open_nav(page, "Mandanten")
    wait_table(page)
    names = table_names(page)
    missing = [n for n in CRM_TENANTS if n not in names]
    extra = [n for n in names if n not in CRM_TENANTS and n != PETER_TENANT]
    if missing or extra:
        return fail(ctx, page, f"Ohne Filter fehlen {missing}, zusätzlich {extra}")
    page.get_by_label("Status").select_option(label="Gesperrt")
    page.wait_for_function("() => document.querySelectorAll('main table tbody tr').length === 1", timeout=10_000)
    filtered = table_names(page)
    if filtered != ["Musterstadt e.V. (Test)"]:
        return fail(ctx, page, f"Filter „Gesperrt“ zeigt {filtered}")
    note = f"zusätzlich {PETER_TENANT} aus E-02 (früherer Lauf)" if PETER_TENANT in names else ""
    return passed(note)


def e02(ctx: Ctx) -> Outcome:
    existing = find_tenant(ctx, PETER_TENANT)
    if existing:  # left over from an earlier run: remove it so the case starts like on fresh data
        pid = ctx.product()["id"]
        ctx.api().call(
            "DELETE",
            f"/v1/products/{pid}/tenants/{existing['id']}",
            headers={"If-Match": str(existing["version"])},
        )
        if find_tenant(ctx, PETER_TENANT):
            return failed(f"Vorhandener Mandant {PETER_TENANT} aus früherem Lauf ließ sich nicht entfernen")
    page = ctx.page()
    crm_page(ctx, page, "tenants")
    page.get_by_role("button", name="Neuer Mandant").click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_role("textbox", name=re.compile(r"^Name\b")).fill(PETER_TENANT)
    page.wait_for_timeout(300)
    dialog.get_by_role("button", name="Mandant anlegen").click()
    if not wait_text(page, f"Mandant „{PETER_TENANT}“ angelegt"):
        return fail(ctx, page, f"Keine Meldung „Mandant „{PETER_TENANT}“ angelegt“")
    page.goto(page.url.split("/tenants")[0] + "/tenants")
    wait_table(page)
    entry = row(page, PETER_TENANT)
    if entry.count() == 0:
        return fail(ctx, page, f"{PETER_TENANT} fehlt in der Liste")
    if "Aktiv" not in entry.first.inner_text():
        return fail(ctx, page, f"{PETER_TENANT} nicht mit Status „Aktiv“")
    return passed()


def e03(ctx: Ctx) -> Outcome:
    tenant = find_tenant(ctx, PETER_TENANT)
    if not tenant:
        return failed(f"Mandant {PETER_TENANT} fehlt (E-02 zuerst)")
    page = ctx.page()
    try:
        crm_page(ctx, page, "tenants")
        open_row(page, PETER_TENANT)
        settle(page)
        page.get_by_role("button", name="Mandant sperren").click()
        confirm_dialog(page, "Mandant sperren", tenant["slug"])
        if not wait_text(page, "Dieser Mandant ist gesperrt"):
            return fail(ctx, page, "Kein Hinweis „Dieser Mandant ist gesperrt“")
        page.get_by_role("button", name="Mandant reaktivieren").first.click()
        confirm_dialog(page, "Mandant reaktivieren", tenant["slug"])
        page.wait_for_timeout(1_000)
        if page.get_by_text("Dieser Mandant ist gesperrt").count():
            return fail(ctx, page, "Hinweis „Dieser Mandant ist gesperrt“ bleibt nach dem Reaktivieren")
        if not wait_detail(page, "Status", "Aktiv") or find_tenant(ctx, PETER_TENANT)["status"] != "active":
            return fail(ctx, page, "Status nach dem Reaktivieren nicht „Aktiv“")
        return passed()
    finally:
        current = find_tenant(ctx, PETER_TENANT)
        if current and current["status"] != "active":
            pid = ctx.product()["id"]
            ctx.api().call(
                "PATCH",
                f"/v1/products/{pid}/tenants/{current['id']}",
                {"status": "active"},
                headers={"If-Match": str(current["version"])},
            )


def e04(ctx: Ctx) -> Outcome:
    page = ctx.page()
    crm_page(ctx, page, "tenants")
    open_row(page, MUSTER)
    settle(page)
    page.get_by_role("tab", name="Mitglieder").click()
    panel = page.get_by_role("tabpanel")
    panel.locator("table tbody tr").first.wait_for()
    settle(page)
    expected = {
        "Maria Muster (Test)": "Owner",
        "Jonas Beispiel (Test)": "Admin",
        "Lena Demo (Test)": "Member",
        "Tobias Test (Test)": "Viewer",
        "Sven Service (Test)": "Support-Mitarbeiter (Test)",
    }
    problems = []
    for name, role in expected.items():
        r = panel.locator("table tbody tr").filter(has_text=name)
        try:
            r.first.wait_for(timeout=10_000)  # member names fill in after the first rows render
        except Exception:
            problems.append(f"{name} fehlt")
            continue
        text = r.first.inner_text()
        select = r.first.locator("select")
        shown = select.evaluate("s => s.options[s.selectedIndex].text") if select.count() else text
        if role not in shown:
            problems.append(f"{name}: Rolle „{shown.strip()}“ statt „{role}“")
    if problems:
        return fail(ctx, page, "; ".join(problems))
    return passed()


# ---------------------------------------------------------------- F: roles and permissions


def f01(ctx: Ctx) -> Outcome:
    page = ctx.page()
    crm_page(ctx, page, "dashboard")
    open_nav(page, "Rollen")
    custom = page.locator("main table").filter(has=page.locator("caption", has_text="Eigene Rollen"))
    builtin = page.locator("main table").filter(has=page.locator("caption", has_text="Integrierte Rollen"))
    custom.locator("tbody tr").first.wait_for()
    stable_rows(page)
    problems = []
    for name in ("Support-Mitarbeiter (Test)", "Abrechnung (Test)"):
        if custom.locator("tbody tr").filter(has_text=name).count() == 0:
            problems.append(f"{name} fehlt unter „Eigene Rollen“")
    rows = builtin.locator("tbody tr")
    if rows.count() == 0:
        problems.append("keine integrierten Rollen")
    editable = builtin.get_by_role("button", name=re.compile("bearbeiten|löschen"))
    if editable.count():
        problems.append(f"{editable.count()} Knöpfe zum Ändern bei integrierten Rollen")
    if problems:
        return fail(ctx, page, "; ".join(problems))
    return passed(f"{rows.count()} integrierte Rollen, nur lesbar")


def f02(ctx: Ctx) -> Outcome:
    name = "QA Leser"
    pid = ctx.product()["id"]
    api = ctx.api()
    _, roles = api.get(f"/v1/products/{pid}/roles")
    items = roles.get("items", roles) if isinstance(roles, dict) else roles
    for r in items:
        if r.get("name") == name:  # left over from an earlier run
            api.delete(f"/v1/products/{pid}/roles/{r['id']}")
    page = ctx.page()
    crm_page(ctx, page, "roles")
    page.get_by_role("button", name="Neue eigene Rolle").click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_role("textbox", name=re.compile(r"^Name\b")).fill(name)
    dialog.get_by_role("combobox", name=re.compile("^Geltungsbereich")).select_option(label="Mandant")
    settle(page)
    for permission in ("records:read", "tenant:read"):
        dialog.get_by_label(permission, exact=True).check()
    if not wait_text(dialog, "2 Berechtigungen ausgewählt"):
        return fail(ctx, page, "Dialog zeigt nicht „2 Berechtigungen ausgewählt“")
    dialog.get_by_role("button", name="Änderungen speichern").click()
    if not wait_text(page, f"Rolle „{name}“ angelegt"):
        return fail(ctx, page, f"Keine Meldung „Rolle „{name}“ angelegt“")
    settle(page)
    custom = page.locator("main table").filter(has=page.locator("caption", has_text="Eigene Rollen"))
    entry = custom.locator("tbody tr").filter(has_text=name)
    try:
        entry.first.wait_for(timeout=10_000)
    except Exception:
        pass
    if entry.count() == 0:
        return fail(ctx, page, f"„{name}“ fehlt unter „Eigene Rollen“")
    perms = entry.first.locator("th, td").nth(2).inner_text()
    shown = len(re.findall(r"\w+:\w+", perms))
    if shown != 2 or "weitere" in perms:
        return fail(ctx, page, f"„{name}“ zeigt nicht 2 Berechtigungen: {perms.strip()!r}")
    return passed()


def f03(ctx: Ctx) -> Outcome:
    page = ctx.page("lena.demo@example.com")
    settle(page)
    if nav_link(page, "Audit-Protokoll").count():
        return fail(ctx, page, "„Audit-Protokoll“ steht in Lenas Seitenleiste")
    page.goto(ctx.base + "/audit")
    settle(page)
    text = main_text(page)
    if page.locator("main table tbody tr").count() or "Nicht erlaubt" not in text:
        return fail(ctx, page, "Direkte Adresse /audit zeigt kein „Nicht erlaubt“ oder Audit-Einträge")
    return passed()


def f04(ctx: Ctx) -> Outcome:
    page = ctx.page("sabine.support@example.com")
    crm_page(ctx, page, "dashboard")
    open_nav(page, "API-Schlüssel")
    page.locator("main table tbody tr, main :text('Nicht erlaubt')").first.wait_for()
    stable_rows(page)
    text = main_text(page)
    has_list = page.locator("main table tbody tr").count() > 0
    if not has_list and "Nicht erlaubt" not in text:
        return fail(ctx, page, "Weder Liste noch Hinweis auf fehlenden Zugriff")
    if page.get_by_role("button", name="Neuer API-Schlüssel").count():
        return fail(ctx, page, "Sabine sieht „Neuer API-Schlüssel“")
    menus = page.get_by_role("button", name=re.compile("Aktionen für"))
    for i in range(menus.count()):
        menus.nth(i).click()
        if page.get_by_role("menuitem", name="Schlüssel widerrufen").count():
            return fail(ctx, page, "Sabine sieht „Schlüssel widerrufen“")
        page.keyboard.press("Escape")
    if page.get_by_text("Schlüssel widerrufen").count():
        return fail(ctx, page, "Sabine sieht „Schlüssel widerrufen“")
    return passed()


def f05(ctx: Ctx) -> Outcome:
    page = ctx.page("sabine.support@example.com")
    crm_page(ctx, page, "dashboard")
    open_nav(page, "Mandanten")
    wait_table(page)
    if page.get_by_role("button", name="Neuer Mandant").count():
        return fail(ctx, page, "Sabine sieht „Neuer Mandant“")
    open_row(page, MUSTER)
    settle(page)
    heading(page)
    found = [b for b in ("Mandant löschen", "Mandant sperren") if page.get_by_role("button", name=b).count()]
    if found:
        return fail(ctx, page, f"Sabine sieht {', '.join(found)}")
    return passed()


def f06(ctx: Ctx) -> Outcome:
    page = ctx.page("karin.kunde@example.com")
    settle(page)
    if nav_link(page, "Mandanten").count() == 0:
        return fail(ctx, page, "Karin hat keinen Eintrag „Mandanten“")
    open_nav(page, "Mandanten")
    wait_table(page)
    names = table_names(page)
    if names != ["Beispiel AG (Test)"]:
        return fail(ctx, page, f"Karin sieht {names}")
    return passed()


def f07(ctx: Ctx) -> Outcome:
    page = ctx.page("paula.plattform@example.com")
    crm_page(ctx, page, "dashboard")
    open_nav(page, "Mandanten")
    wait_table(page)
    problems = []
    if page.get_by_role("button", name="Neuer Mandant").count():
        problems.append("„Neuer Mandant“ sichtbar")
    open_row(page, MUSTER)
    settle(page)
    heading(page)
    for label in ("Mandant bearbeiten", "Mandant sperren", "Mandant löschen", "Änderungen speichern"):
        if page.get_by_role("button", name=label).count() or page.get_by_role("heading", name=label).count():
            problems.append(f"„{label}“ sichtbar")
    open_nav(page, "Datensätze")
    try:
        page.locator("main h1").filter(has_text=re.compile("^Datensätze$")).wait_for(timeout=10_000)
    except Exception:
        return fail(ctx, page, f"Klick auf „Datensätze“ in der Seitenleiste zeigt weiter „{heading(page)}“")
    page.locator("main").get_by_label("Mandant", exact=True).select_option(label=MUSTER)
    settle(page)
    page.locator("main").get_by_role("button", name=re.compile("^kontakte")).click()
    settle(page)
    if stable_rows(page) == 0:
        problems.append("Paula sieht keine Datensätze")
    if page.get_by_role("button", name="Neuer Datensatz").count():
        problems.append("„Neuer Datensatz“ sichtbar")
    if problems:
        return fail(ctx, page, "; ".join(problems))
    return passed()


def f08(ctx: Ctx) -> Outcome:
    page = ctx.page(None)
    page.goto(ctx.base + "/login")
    login_form(page, ctx.base, "erik.ohne@example.com")
    try:
        page.wait_for_url(lambda u: "/login" not in u, timeout=15_000)
    except Exception:
        return fail(ctx, page, "Anmeldung als Erik klappt nicht")
    settle(page)
    landing = main_text(page)
    if page.locator("main table tbody tr").count():
        return fail(ctx, page, f"Erik sieht nach der Anmeldung Daten ({page.url})")
    open_nav(page, "Produkte")
    text = main_text(page)
    if "Noch keine Produkte für dich" not in text or page.locator("main table tbody tr").count():
        return fail(ctx, page, "„Produkte“ zeigt nicht „Noch keine Produkte für dich“")
    return passed(f"Startseite: {landing.strip().splitlines()[0] if landing.strip() else 'leer'}")


CASES = {
    "A-01": a01,
    "A-02": a02,
    "A-03": a03,
    "A-04": a04,
    "A-05": a05,
    "B-01": b01,
    "B-02": b02,
    "B-03": b03,
    "B-04": b04,
    "B-05": b05,
    "B-06": b06,
    "B-07": b07,
    "B-08": b08,
    "C-01": c01,
    "C-02": c02,
    "C-03": c03,
    "C-04": c04,
    "D-01": d01,
    "D-02": d02,
    "D-03": d03,
    "E-01": e01,
    "E-02": e02,
    "E-03": e03,
    "E-04": e04,
    "F-01": f01,
    "F-02": f02,
    "F-03": f03,
    "F-04": f04,
    "F-05": f05,
    "F-06": f06,
    "F-07": f07,
    "F-08": f08,
}
