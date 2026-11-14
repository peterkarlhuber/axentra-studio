"""Automated checks for checklist sections M to T (billing, notifications, audit, settings, kit scripts,
phone layout and keyboard, help and health, API reference)."""

from __future__ import annotations

import re
import subprocess
import time
import urllib.request

from playwright.sync_api import TimeoutError as PlaywrightTimeout
from playwright.sync_api import expect

from .harness import ADMIN, Ctx, Outcome, failed, passed, sign_in

SETTLE = 800  # ms to let React settle after a navigation


# ---------------------------------------------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------------------------------------------


def nav(page, label: str) -> None:
    """Click a link of the sidebar by its visible German label (the accessible name may carry a count)."""
    link = page.locator("aside nav").get_by_role("link", name=re.compile("^" + re.escape(label)))
    link.first.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(SETTLE)


def choose_product(page, name: str = "Beispiel-CRM (Test)") -> None:
    """Pick the product in the switcher top right, as the checklist intro asks."""
    switcher = page.locator("header").get_by_role("button", name=re.compile("Produkt wechseln|Switch product"))
    if name in switcher.inner_text():
        return
    switcher.click()
    page.get_by_role("menuitemradio", name=name).click()
    expect(switcher).to_contain_text(name)
    page.wait_for_load_state("networkidle")


def crm_page(ctx: Ctx, email: str | None = ADMIN, viewport: tuple[int, int] = (1280, 900)):
    """A page signed in through the login form, with „Beispiel-CRM (Test)“ chosen in the product switcher."""
    page = ctx.page(email, viewport)
    page.wait_for_load_state("networkidle")
    choose_product(page)
    return page


def main_text(page) -> str:
    return page.locator("main").inner_text()


def fail_shot(ctx: Ctx, page, note: str) -> Outcome:
    out = failed(note)
    out.screenshot = ctx.shot(page)
    return out


def tenant_id(ctx: Ctx, product_id: str, name: str) -> str | None:
    _, body = ctx.api().get(f"/v1/products/{product_id}/tenants?limit=200")
    return next((t["id"] for t in body["items"] if t["name"] == name), None)


def ensure_tenant(ctx: Ctx, product_id: str, name: str, slug: str) -> str:
    """Setup: the tenant another checklist section creates (E-02); created over the API if missing."""
    tid = tenant_id(ctx, product_id, name)
    if tid:
        return tid
    status, body = ctx.api().post(f"/v1/products/{product_id}/tenants", {"name": name, "slug": slug})
    if status != 201:
        raise AssertionError(f"setup: creating tenant {name} failed: {status} {body}")
    return body["id"]


def subscription(ctx: Ctx, product_id: str, tid: str) -> dict | None:
    status, body = ctx.api().get(f"/v1/products/{product_id}/tenants/{tid}/billing/subscription")
    return body if status == 200 else None


def open_tenant_billing(page, tenant_name: str) -> None:
    """On the „Abonnements“ page: pick the tenant in „Abrechnung eines Mandanten“ and click „Öffnen“."""
    page.locator("main").get_by_label("Mandant", exact=True).select_option(label=tenant_name)
    page.get_by_role("button", name="Öffnen", exact=True).click()
    page.wait_for_url(re.compile(r"/subscriptions/ten_"))
    expect(page.get_by_role("heading", name=tenant_name)).to_be_visible()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(SETTLE)


def detail(page, label: str) -> str:
    """The value next to a label of a DetailList (dt/dd)."""
    dt = page.locator("main dt").filter(has_text=re.compile("^" + re.escape(label) + "$")).first
    return dt.locator("xpath=following-sibling::dd[1]").inner_text().strip()


def leave_via_sidebar(page, label: str, heading: str) -> str:
    """Leave a detail page through the sidebar. The new page must actually render (a regression seen before:
    only the URL changed). Returns "" on success, else a German note."""
    link = page.locator("aside nav").get_by_role("link", name=re.compile("^" + re.escape(label)))
    link.first.click()
    guard = page.get_by_role("alertdialog", name="Ohne Speichern verlassen?").or_(
        page.get_by_role("dialog", name="Ohne Speichern verlassen?")
    )
    target = page.locator("main h1").filter(has_text=re.compile("^" + re.escape(heading) + "$"))
    try:
        expect(target.or_(guard).first).to_be_visible()
    except AssertionError:
        return f"Zurück über die Seitenleiste („{label}“): die Adresse wechselt, die Seite bleibt stehen."
    if guard.count():
        return (
            f"Zurück über die Seitenleiste („{label}“) fragt „Ohne Speichern verlassen?“, obwohl nichts geändert wurde."
        )
    page.wait_for_timeout(SETTLE)
    return ""


def user_menu(page):
    page.locator("header").get_by_role("button", name=re.compile("Benutzermenü öffnen|Open user menu")).click()
    return page.get_by_role("menu")


CONTRAST_JS = """() => {
  const parse = (c) => {
    const m = c.match(/[\\d.]+/g).map(Number);
    const k = c.startsWith('color(') ? 1 : 255;
    return { rgb: m.slice(0, 3).map((v) => v / k), a: m.length > 3 ? m[3] : 1 };
  };
  const lum = (c) => {
    const [r, g, b] = parse(c).rgb.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      if (parse(c).a > 0.5) return c;
    }
    return getComputedStyle(document.body).backgroundColor;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.opacity !== '0';
  };
  const unreadable = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    if (!walker.currentNode.textContent.trim() || seen.has(el)) continue;
    seen.add(el);
    if (!visible(el) || el.closest('.ax-sr-only')) continue;
    const a = lum(getComputedStyle(el).color), b = lum(bgOf(el));
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (ratio < 3) unreadable.push(`${el.textContent.trim().slice(0, 30)} (${ratio.toFixed(1)}:1)`);
  }
  const light = [];
  for (const el of document.querySelectorAll('main *, header *, aside *')) {
    const c = getComputedStyle(el).backgroundColor;
    if (parse(c).a <= 0.5 || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width * r.height > 6000 && lum(c) > 0.5) light.push(`${el.tagName}.${el.className}`.slice(0, 50));
  }
  return { body: lum(getComputedStyle(document.body).backgroundColor), main: lum(bgOf(document.querySelector('main'))),
           unreadable, light };
}"""


def pick_menu_radio(page, submenu: str, item: str) -> None:
    """User menu > submenu > radio item, by keyboard inside the menu (pointer moves would close the submenu)."""
    user_menu(page)
    page.get_by_role("menuitem", name=submenu).hover()
    page.keyboard.press("ArrowRight")
    page.get_by_role("menuitemradio", name=item).press("Enter")
    page.wait_for_timeout(SETTLE)


def kit_script(ctx: Ctx, script: str, answers: str = "", timeout: int = 900) -> subprocess.CompletedProcess:
    """Run one of the kit's own scripts as user qa, exactly as a tester would (no terminal, no pause)."""
    cmd = f"cd '{ctx.kit}' && QA_KIT_NO_TERMINAL=1 QA_KIT_NO_PAUSE=1 bash '{script}'"
    return subprocess.run(
        ["su", "qa", "-c", cmd], input=answers, capture_output=True, text=True, timeout=timeout, check=False
    )


def kit_stop(ctx: Ctx) -> str:
    proc = kit_script(ctx, "3 - Beenden.sh", timeout=300)
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline and server_up(ctx):
        time.sleep(1)
    return proc.stdout + proc.stderr


def kit_start(ctx: Ctx) -> str:
    """Start the kit in the background and wait until the start log says it runs."""
    log = ctx.kit.parent / "start.log"
    cmd = (
        f"cd '{ctx.kit}' && nohup env SSL_CERT_FILE=/home/qa/ca.crt QA_KIT_NO_TERMINAL=1 QA_KIT_NO_PAUSE=1 "
        f"BROWSER=echo bash '2 - Starten.sh' </dev/null >'{log}' 2>&1 &"
    )
    subprocess.run(["su", "qa", "-c", cmd], check=True, timeout=60)
    deadline = time.monotonic() + 900
    text = ""
    while time.monotonic() < deadline:
        time.sleep(2)
        text = log.read_text(encoding="utf-8", errors="replace") if log.exists() else ""
        if "laeuft: http" in text:
            break
        if "FEHLER" in text:
            raise AssertionError(f"kit start failed: {text[-800:]}")
    else:
        raise AssertionError(f"kit start timed out: {text[-800:]}")
    if f"127.0.0.1:{ctx.base.rsplit(':', 1)[1]}" not in text:
        raise AssertionError(f"kit started on another port: {text[-400:]}")
    deadline = time.monotonic() + 120
    while time.monotonic() < deadline and not server_up(ctx):
        time.sleep(1)
    return text


def server_up(ctx: Ctx) -> bool:
    try:
        with urllib.request.urlopen(ctx.base + "/v1/health/live", timeout=3) as r:
            return r.status == 200
    except Exception:
        return False


# ---------------------------------------------------------------------------------------------------------------
# M: plans and subscriptions
# ---------------------------------------------------------------------------------------------------------------


def m_01(ctx: Ctx) -> Outcome:
    page = crm_page(ctx)
    nav(page, "Abonnements")
    expect(page.get_by_role("heading", name="Abonnements", exact=True)).to_be_visible()
    expected = [
        ("Muster GmbH (Test)", "professional", "Testphase"),
        ("Beispiel AG (Test)", "starter", "Aktiv"),
        ("Demo Handwerk KG (Test)", "enterprise", "Aktiv"),
        ("Probe & Partner (Test)", "enterprise", "Überfällig"),
        ("Grenzfall Datenhungrig GmbH (Test)", "professional", "Unvollständig"),
    ]
    rows = page.locator("main table tbody tr")
    expect(rows.first).to_be_visible()
    problems = []
    for tenant, plan_key, status in expected:
        row = rows.filter(has=page.get_by_role("link", name=tenant, exact=True))
        if row.count() != 1:
            problems.append(f"{tenant} fehlt")
            continue
        cells = [c.strip() for c in row.locator("td, th").all_inner_texts()]
        if not any(status == c or c.startswith(status + "\n") for c in cells):
            problems.append(f"{tenant}: Status {cells[2] if len(cells) > 2 else '?'} statt {status}")
        if plan_key not in cells:
            problems.append(f"{tenant}: Tarif {cells[1] if len(cells) > 1 else '?'} statt {plan_key}")
    if problems:
        return fail_shot(ctx, page, "; ".join(problems))
    return passed()


def m_02(ctx: Ctx) -> Outcome:
    page = crm_page(ctx)
    nav(page, "Abonnements")
    try:
        expect(page.get_by_role("heading", name="Zahlungsanbieter", exact=True)).to_be_visible()
    except AssertionError:
        return fail_shot(ctx, page, "Auf „Abonnements“ fehlt der Bereich „Zahlungsanbieter“.")
    provider, live = detail(page, "Anbieter"), detail(page, "Echtzahlungen")
    if provider != "Testattrappe (fake)" or live != "Aus":
        return fail_shot(ctx, page, f"Zahlungsanbieter „{provider}“, Echtzahlungen „{live}“.")
    open_tenant_billing(page, "Beispiel AG (Test)")
    tenant_provider = detail(page, "Anbieter")
    if tenant_provider != "Manuell":
        return fail_shot(ctx, page, f"Abonnement der Beispiel AG: „Anbieter: {tenant_provider}“ statt „Manuell“.")
    card_inputs = page.locator("input[autocomplete^='cc-'], input[name*='card' i], input[name*='iban' i]").count()
    if card_inputs:
        return fail_shot(ctx, page, "Studio zeigt Eingabefelder für Karten- oder Bankdaten.")
    problem = leave_via_sidebar(page, "Abonnements", "Abonnements")
    if problem:
        return fail_shot(ctx, page, problem)
    return passed()


def m_03(ctx: Ctx) -> Outcome:
    product_id = ctx.product()["id"]
    tid = ensure_tenant(ctx, product_id, "Peter QA GmbH", "peter-qa-gmbh")
    current = subscription(ctx, product_id, tid)
    if current and current["status"] != "canceled":  # setup: a previous run left a subscription
        ctx.api().post(f"/v1/products/{product_id}/tenants/{tid}/billing/subscription/cancel", {"at_period_end": False})
    page = crm_page(ctx)
    nav(page, "Abonnements")
    open_tenant_billing(page, "Peter QA GmbH")
    page.get_by_role("button", name="Tarif abonnieren").click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_label("Tarif").select_option(label="Starter (Test) (starter)")
    dialog.get_by_role("button", name="Abonnieren", exact=True).click()
    try:
        expect(page.get_by_text("Abonnement gestartet", exact=True)).to_be_visible()
    except AssertionError:
        return fail_shot(ctx, page, "Keine Meldung „Abonnement gestartet“.")
    expect(dialog).to_be_hidden()
    page.wait_for_timeout(SETTLE)
    sub = subscription(ctx, product_id, tid)
    if not sub or sub["plan_key"] != "starter" or sub["status"] not in ("active", "trialing"):
        return fail_shot(ctx, page, f"Kein laufendes Starter-Abonnement: {sub and (sub['plan_key'], sub['status'])}")
    plan_shown = detail(page, "Tarif")
    # Effective entitlements: the plan's entries must show under „Wirksame Leistungen“.
    _, plans = ctx.api().get(f"/v1/products/{product_id}/billing/plans")
    starter = next(p for p in plans if p["key"] == "starter")
    ent_card = page.locator("main").filter(has=page.get_by_role("heading", name="Wirksame Leistungen"))
    ent_text = ent_card.inner_text()
    names = [key.split(".", 1)[-1] for key in starter["entitlements"]]  # e.g. feature.export -> export
    missing = [n for n in names if n not in ent_text]
    if "Kein berechtigendes Abonnement" in ent_text or missing:
        return fail_shot(ctx, page, f"„Wirksame Leistungen“ zeigt die Leistungen des Tarifs nicht: fehlt {missing}.")
    if plan_shown != "starter":
        return fail_shot(ctx, page, f"Das Abonnement zeigt den Tarif „{plan_shown}“ statt „starter“.")
    return passed()


def m_04(ctx: Ctx) -> Outcome:
    product_id = ctx.product()["id"]
    tid = ensure_tenant(ctx, product_id, "Peter QA GmbH", "peter-qa-gmbh")
    current = subscription(ctx, product_id, tid)
    if not current or current["status"] == "canceled":  # setup: M-03 normally leaves a Starter subscription
        ctx.api().post(f"/v1/products/{product_id}/tenants/{tid}/billing/subscription", {"plan": "starter"})
        current = subscription(ctx, product_id, tid)
    page = crm_page(ctx)
    nav(page, "Abonnements")
    open_tenant_billing(page, "Peter QA GmbH")
    page.get_by_role("button", name="Sofort kündigen").click()
    dialog = page.get_by_role("alertdialog").or_(page.get_by_role("dialog"))
    confirm = dialog.get_by_role("button", name="Sofort kündigen")
    confirm_inputs = dialog.locator("input")
    if confirm_inputs.count():
        confirm_inputs.first.fill(current["plan_key"])
    confirm.click()
    expect(page.get_by_text("Abonnement gekündigt", exact=True)).to_be_visible()
    expect(dialog).to_be_hidden()
    page.get_by_role("button", name="Tarif abonnieren").click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_label("Tarif").select_option(label="Professional (Test) (professional)")
    start = dialog.get_by_role("button", name="Checkout starten")
    if not start.count():
        return fail_shot(ctx, page, "Kein Knopf „Checkout starten“ für „Professional (Test)“.")
    start.click()
    ready = page.get_by_role("dialog", name="Checkout angelegt")
    try:
        expect(ready).to_be_visible()
    except AssertionError:
        alerts = " ".join(page.get_by_role("alert").all_inner_texts()) + " " + main_text(page)
        if "Serverfehler" in alerts:
            return fail_shot(ctx, page, "Checkout scheitert mit „Serverfehler“.")
        return fail_shot(ctx, page, "„Checkout angelegt“ erscheint nicht.")
    link = ready.get_by_role("link", name=re.compile("Checkout-Seite öffnen"))
    href = link.get_attribute("href") or ""
    with page.context.expect_page() as new_tab:
        link.click()
    checkout = new_tab.value
    try:
        checkout.wait_for_load_state("load", timeout=15_000)
    except Exception:
        pass
    checkout.wait_for_timeout(1500)
    card_fields = checkout.locator("input").count()
    opened_real = checkout.url.startswith("https://checkout.fake.invalid") and checkout.locator("form").count() > 0
    checkout.close()
    if "checkout.fake.invalid" not in href:
        return fail_shot(ctx, page, f"Checkout-Link zeigt nicht auf checkout.fake.invalid: {href}")
    if card_fields or opened_real:
        return fail_shot(ctx, page, "Die Checkout-Seite öffnet sich mit Eingabefeldern.")
    ready.get_by_role("button", name="Schließen").first.click()
    expect(ready).to_be_hidden()
    page.wait_for_timeout(SETTLE)
    status = page.locator("main dd").filter(has_text="Unvollständig")
    if not status.count():
        return fail_shot(ctx, page, f"Abonnement steht nicht auf „Unvollständig“ (Status: {detail(page, 'Status')}).")
    return passed()


def m_05(ctx: Ctx) -> Outcome:
    page = crm_page(ctx)
    nav(page, "Abonnements")
    open_tenant_billing(page, "Muster GmbH (Test)")
    page.get_by_role("button", name="Zum Periodenende kündigen").click()
    dialog = page.get_by_role("alertdialog").or_(page.get_by_role("dialog"))
    dialog.get_by_role("button", name="Zum Periodenende kündigen").click()
    try:
        expect(page.get_by_text("Das Abonnement endet zum Ende des Zeitraums", exact=True)).to_be_visible()
    except AssertionError:
        return fail_shot(ctx, page, "Nach dem Kündigen fehlt „Das Abonnement endet zum Ende des Zeitraums“.")
    expect(dialog).to_be_hidden()
    notice = page.locator("main").get_by_text(re.compile("^Endet zum Periodenende am"))
    expect(notice).to_be_visible()
    page.get_by_role("button", name="Fortsetzen", exact=True).click()
    dialog = page.get_by_role("alertdialog").or_(page.get_by_role("dialog"))
    dialog.get_by_role("button", name="Fortsetzen", exact=True).click()
    try:
        expect(page.get_by_text("Abonnement fortgesetzt", exact=True)).to_be_visible()
    except AssertionError:
        return fail_shot(ctx, page, "Nach „Fortsetzen“ fehlt die Meldung „Abonnement fortgesetzt“.")
    try:
        expect(notice).to_be_hidden()
        expect(page.get_by_role("button", name="Zum Periodenende kündigen")).to_be_visible()
    except AssertionError:
        return fail_shot(ctx, page, "Der Hinweis auf das Periodenende bleibt nach „Fortsetzen“ stehen.")
    if detail(page, "Kündigung zum Periodenende") != "Nein":
        return fail_shot(ctx, page, "„Kündigung zum Periodenende“ steht nach „Fortsetzen“ nicht auf „Nein“.")
    return passed()


# ---------------------------------------------------------------------------------------------------------------
# N: notifications, templates and mailbox
# ---------------------------------------------------------------------------------------------------------------

N02_EMAIL = "peter.qa@example.com"


def n_01(ctx: Ctx) -> Outcome:
    page = crm_page(ctx)
    nav(page, "Benachrichtigungen")
    page.get_by_role("tab", name="Vorlagen").click()
    table = page.locator("main table").filter(has_text="Vorlage")
    missing = [
        name
        for name in ("Willkommensmail (Test)", "Rechnung bereit (Test)", "Wartungshinweis im Posteingang (Test)")
        if not table.get_by_role("link", name=name, exact=True).count()
    ]
    if missing:
        return fail_shot(ctx, page, f"Vorlagen fehlen: {', '.join(missing)}")
    table.get_by_role("link", name="Willkommensmail (Test)", exact=True).click()
    expect(page.get_by_role("heading", name="Vorschau", exact=True)).to_be_visible()
    preview = page.locator("main section").filter(has=page.get_by_role("heading", name="Vorschau", exact=True))
    subject_line = preview.get_by_text(re.compile(r"^Betreff\s"))
    expect(subject_line).to_be_visible()
    page.wait_for_timeout(SETTLE)
    english = subject_line.inner_text()
    language = preview.get_by_label("Sprache")
    if language.input_value() != "en":
        return fail_shot(ctx, page, f"Die Vorschau beginnt nicht mit „en“, sondern „{language.input_value()}“.")
    language.select_option("de")
    expected = "Willkommen im Beispiel-CRM, Erika (Test)"
    try:
        expect(subject_line).to_contain_text(expected)
    except AssertionError:
        return fail_shot(ctx, page, f"Vorschau (de) zeigt „{subject_line.inner_text()}“ statt „{expected}“.")
    text = preview.inner_text()
    if "{{" in text or "}}" in text or "{{" in english:
        return fail_shot(ctx, page, "Platzhalter bleiben in der Vorschau stehen.")
    problem = leave_via_sidebar(page, "Benachrichtigungen", "Benachrichtigungen")
    if problem:
        return fail_shot(ctx, page, "Vorschau stimmt (de: „" + expected + "“). " + problem)
    return passed()


def n_02(ctx: Ctx) -> Outcome:
    before = {m["id"] for m in ctx.mails()}
    page = crm_page(ctx)
    nav(page, "Benachrichtigungen")
    page.get_by_role("tab", name="Vorlagen").click()
    page.get_by_role("button", name="Testbenachrichtigung aus Rechnung bereit (Test) senden").click()
    dialog = page.get_by_role("dialog", name="Rechnung bereit (Test) senden")
    dialog.get_by_label("Mandant", exact=True).select_option(label="Muster GmbH (Test)")
    dialog.get_by_label("Senden an").select_option(label="Eine E-Mail-Adresse")
    dialog.get_by_label("E-Mail-Adresse").fill(N02_EMAIL)
    values = {}
    for name in ("nummer", "betrag"):
        field = dialog.get_by_label(name, exact=True)
        if not field.input_value():
            field.fill({"nummer": "RE-TEST-0042", "betrag": "490,00 EUR"}[name])
        values[name] = field.input_value()
    dialog.get_by_role("button", name="Senden", exact=True).click()
    try:
        expect(page.get_by_text("Benachrichtigung angenommen").first).to_be_visible()
    except AssertionError:
        return fail_shot(ctx, page, "Keine Meldung „Benachrichtigung angenommen“.")
    # The kit page, tab „E-Mails“: wait up to 2 minutes for the captured mail.
    qa = ctx.new_page()
    qa.goto(f"{ctx.base}/qa/#mails")
    row = qa.locator("#mails tbody tr.clickable").filter(has_text=N02_EMAIL)
    deadline = time.monotonic() + 120
    new_ids: list = []
    while time.monotonic() < deadline:
        new_ids = [m for m in ctx.mails() if m["id"] not in before and m["to"] == N02_EMAIL]
        if new_ids:
            break
        time.sleep(3)
    if not new_ids:
        return fail_shot(ctx, qa, f"Keine Mail an {N02_EMAIL} im Mail-Fänger nach 2 Minuten.")
    qa.get_by_role("button", name="Aktualisieren").click()
    subject = new_ids[0]["subject"]
    target = row.filter(has_text=subject).first
    expect(target).to_be_visible()
    target.click()
    expect(qa.locator("#mail-view")).to_be_visible()
    body = qa.locator("#mail-text").inner_text()
    shown_subject = qa.locator("#mail-subject").inner_text()
    _, tpl = ctx.api().get(f"/v1/products/{ctx.product()['id']}/notify/templates/rechnung.bereit")
    allowed = [v["subject"].replace("{{ nummer }}", values["nummer"]) for v in tpl["variants"].values()]
    if "{{" in shown_subject + body or values["nummer"] not in body or values["betrag"] not in body:
        return fail_shot(ctx, qa, f"Platzhalter nicht ersetzt: „{shown_subject}“ / „{body[:120]}“")
    if shown_subject not in allowed:
        return fail_shot(ctx, qa, f"Falscher Betreff „{shown_subject}“ (erwartet einer von {allowed}).")
    return passed()


def n_03(ctx: Ctx) -> Outcome:
    page = crm_page(ctx)
    nav(page, "Benachrichtigungen")
    page.get_by_role("tab", name="Nachrichtenprotokoll").click()
    page.wait_for_timeout(SETTLE)
    table = page.get_by_role("tabpanel").locator("table")
    row = table.locator("tbody tr").filter(has_text=N02_EMAIL).first
    deadline = time.monotonic() + 120
    status = ""
    while time.monotonic() < deadline:
        if row.count():
            status = row.inner_text()
            if "Gesendet" in status:
                break
        time.sleep(5)
        page.reload()
        page.wait_for_load_state("networkidle")
        page.get_by_role("tab", name="Nachrichtenprotokoll").click()
        page.wait_for_timeout(SETTLE)
    if not row.count():
        return fail_shot(ctx, page, f"Die Test-Mail an {N02_EMAIL} fehlt im Nachrichtenprotokoll.")
    if "Gesendet" not in status:
        return fail_shot(ctx, page, f"Test-Mail steht nicht auf „Gesendet“: {' '.join(status.split())[:150]}")
    page.get_by_role("tab", name="Postfach").click()
    try:
        expect(page.get_by_text("Kein lokales Postfach auf diesem Server")).to_be_visible()
    except AssertionError:
        return fail_shot(ctx, page, "Der Tab „Postfach“ meldet nicht „Kein lokales Postfach auf diesem Server“.")
    return passed()


def n_04(ctx: Ctx) -> Outcome:
    maria = "maria.muster@example.com"
    page = crm_page(ctx, maria)
    nav(page, "Posteingang")
    subject = "Wartung am 30.11.2026 (Test)"
    row = page.locator("main table tbody tr").filter(has_text=subject)
    try:
        expect(row).to_have_count(1)
    except AssertionError:
        return fail_shot(ctx, page, f"Posteingang zeigt „{subject}“ nicht.")
    if "Ungelesen:" not in row.inner_text() or not page.get_by_text("1 ungelesen").count():
        return fail_shot(ctx, page, f"„{subject}“ ist nicht als ungelesen markiert.")
    row.get_by_role("button", name=f"„{subject}“ öffnen").click()
    detail_view = page.get_by_role("dialog")
    try:
        expect(detail_view).to_contain_text("Am 30.11.2026 ist das Beispiel-CRM kurz nicht erreichbar")
    except AssertionError:
        return fail_shot(ctx, page, "Die Nachricht öffnet sich nicht.")
    page.keyboard.press("Escape")
    try:
        expect(row).not_to_contain_text("Ungelesen:")
    except AssertionError:
        return fail_shot(ctx, page, "Nach dem Öffnen ist die Nachricht nicht als gelesen markiert.")
    nav(page, "Benachrichtigungen")
    page.get_by_role("tab", name="Meine Einstellungen").click()
    box = page.get_by_role("checkbox", name="onboarding")
    expect(box).to_be_checked()
    box.uncheck()
    page.get_by_role("button", name="Einstellungen speichern").click()
    try:
        expect(page.get_by_text("Einstellungen gespeichert.", exact=True)).to_be_visible()
    except AssertionError:
        return fail_shot(ctx, page, "Keine Meldung „Einstellungen gespeichert.“")
    page.reload()
    page.get_by_role("tab", name="Meine Einstellungen").click()
    box = page.get_by_role("checkbox", name="onboarding")
    kept = not box.is_checked()
    box.check()  # restore Maria's settings
    page.get_by_role("button", name="Einstellungen speichern").click()
    expect(page.get_by_text("Einstellungen gespeichert.", exact=True).first).to_be_visible()
    if not kept:
        return fail_shot(ctx, page, "Die abgewählte Kategorie ist nach dem Neuladen wieder angehakt.")
    return passed()


# ---------------------------------------------------------------------------------------------------------------
# O: audit log
# ---------------------------------------------------------------------------------------------------------------


def setup_qa_test_key(ctx: Ctx, product_id: str) -> list[str]:
    """Setup for O-01 (the key of section G): create „qa-test“, rotate it, revoke the new key. Returns the secrets."""
    api = ctx.api()
    status, body = api.post(f"/v1/products/{product_id}/api-keys", {"name": "qa-test", "permissions": ["records:read"]})
    if status != 201:
        raise AssertionError(f"setup: creating key qa-test failed: {status} {body}")
    secrets = [body["secret"]]
    status, body = api.post(f"/v1/products/{product_id}/api-keys/{body['key']['id']}/rotate", {"grace_seconds": 0})
    if status != 200:
        raise AssertionError(f"setup: rotating key qa-test failed: {status} {body}")
    secrets.append(body["secret"])
    status, _ = api.post(f"/v1/products/{product_id}/api-keys/{body['key']['id']}/revoke", {})
    if status != 200:
        raise AssertionError(f"setup: revoking key qa-test failed: {status}")
    return secrets


def audit_rows(page):
    return page.locator("main table tbody tr").filter(has_text=re.compile(r"access\.api_key\.(create|rotate|revoke)"))


def apply_audit_filter(page) -> None:
    page.get_by_role("button", name="Filter anwenden").click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)


def o_01(ctx: Ctx) -> Outcome:
    product_id = ctx.product()["id"]
    secrets = setup_qa_test_key(ctx, product_id)
    page = crm_page(ctx)
    nav(page, "Audit-Protokoll")
    more = page.get_by_role("button", name=re.compile("^Weitere Filter"))
    if more.is_visible():
        more.click()
    page.get_by_label("Aktion", exact=True).fill("access.api_key.*")
    apply_audit_filter(page)
    rows = audit_rows(page)
    if not rows.count():
        return fail_shot(ctx, page, "Filter Aktion „access.api_key.*“ findet keine Einträge.")
    actions = " ".join(rows.all_inner_texts())
    have = {a for a in ("create", "rotate", "revoke") if f"access.api_key.{a}" in actions}
    leaked = [x for x in secrets if x in main_text(page)]
    rows.first.get_by_role("button", name=re.compile("^Details zu")).click()
    drawer = page.get_by_role("dialog")
    expect(drawer).to_contain_text("Akteur")
    page.wait_for_timeout(SETTLE)
    detail_text = drawer.inner_text()
    leaked += [x for x in secrets if x in detail_text]
    page.keyboard.press("Escape")
    if leaked:
        return fail_shot(ctx, page, "Ein Schlüssel-Geheimnis steht im Audit im Klartext.")
    if (
        have != {"create", "rotate", "revoke"}
        or "alex.admin@example.com" not in actions
        or "Erfolgreich" not in actions
    ):
        return fail_shot(ctx, page, f"Einträge unvollständig: gefunden {sorted(have)}.")
    if "Zeitpunkt" not in detail_text or "alex.admin@example.com" not in detail_text:
        return fail_shot(ctx, page, "Der geöffnete Eintrag zeigt Zeitpunkt oder Akteur nicht.")
    return passed()


# ---------------------------------------------------------------------------------------------------------------
# P: settings, profile, language and theme
# ---------------------------------------------------------------------------------------------------------------


def restore_me(ctx: Ctx, email: str, before: dict) -> None:
    """Put the user's server-side language, theme and name back the way they were."""
    ctx.api(email).patch(
        "/v1/me", {"locale": before["locale"], "preferences": before.get("preferences") or {}, "name": before["name"]}
    )


def p_01(ctx: Ctx) -> Outcome:
    before = ctx.api().get("/v1/me")[1]["user"]
    try:
        page = crm_page(ctx)
        pick_menu_radio(page, "Darstellung", "Dunkel")
        problems = []
        for label, path in (("Dashboard", "/dashboard"), ("Nutzung", "/usage"), ("Dateien", "/files")):
            nav(page, label)
            expect(page).to_have_url(re.compile(re.escape(path) + "$"))
            expect(page).to_have_title(re.compile("^" + label))
            page.wait_for_timeout(SETTLE)
            dark = page.evaluate(CONTRAST_JS)
            if dark["body"] > 0.1 or dark["main"] > 0.1:
                problems.append(f"{label}: Hintergrund nicht dunkel")
            if dark["unreadable"]:
                problems.append(f"{label}: schlecht lesbar: {', '.join(dark['unreadable'][:3])}")
            if dark["light"]:
                problems.append(f"{label}: helle Flächen: {', '.join(dark['light'][:3])}")
        if problems:
            return fail_shot(ctx, page, "; ".join(problems))
        pick_menu_radio(page, "Darstellung", "Hell")
        back = page.evaluate(CONTRAST_JS)
        if back["body"] < 0.5 or back["main"] < 0.5:
            return fail_shot(ctx, page, "Zurück auf „Hell“ wird die Seite nicht wieder hell.")
        return passed()
    finally:
        restore_me(ctx, ADMIN, before)


GERMAN_UI = ("Mandant", "Abonnement", "Tarif", "Zeitraum", "Anbieter", "Öffnen", "Benutzer", "Einstellungen")
ENGLISH_UI = ("Tenant", "Subscription", "Plan", "Provider", "Open", "Users", "Settings")
DATE_DE = re.compile(r"\b\d{2}\.\d{2}\.\d{4}\b")
DATE_EN = re.compile(r"\b[A-Z][a-z]{2} \d{1,2}, \d{4}\b")


def language_problems(page, lang: str) -> list[str]:
    """Words of the other language in the sidebar and on the „Abonnements“ page, and the date format."""
    text = page.locator("aside nav").inner_text() + "\n" + main_text(page)
    if lang == "en":
        wrong = [w for w in GERMAN_UI if re.search(r"\b" + w, text)]
        dates_ok = bool(DATE_EN.search(text)) and not DATE_DE.search(text)
    else:
        wrong = [w for w in ENGLISH_UI if re.search(r"\b" + w + r"\b", text)]
        dates_ok = bool(DATE_DE.search(text)) and not DATE_EN.search(text)
    problems = [f"Wörter der anderen Sprache: {', '.join(wrong)}"] if wrong else []
    if not dates_ok:
        problems.append("Datumsformat passt nicht zur Sprache")
    return problems


def p_02(ctx: Ctx) -> Outcome:
    before = ctx.api().get("/v1/me")[1]["user"]
    try:
        page = crm_page(ctx)
        nav(page, "Abonnements")
        if language_problems(page, "de"):
            return fail_shot(ctx, page, f"Schon vor dem Wechsel nicht deutsch: {language_problems(page, 'de')}")
        pick_menu_radio(page, "Sprache", "English")
        try:
            expect(page.get_by_role("heading", name="Subscriptions", exact=True)).to_be_visible()
        except AssertionError:
            return fail_shot(ctx, page, "Nach „English“ ist die Oberfläche nicht sofort englisch.")
        problems = language_problems(page, "en")
        if problems:
            return fail_shot(ctx, page, "Englisch: " + "; ".join(problems))
        page.reload()
        page.wait_for_load_state("networkidle")
        try:
            expect(page.get_by_role("heading", name="Subscriptions", exact=True)).to_be_visible()
        except AssertionError:
            return fail_shot(ctx, page, "Nach dem Neuladen ist die Oberfläche nicht mehr englisch.")
        page.wait_for_timeout(SETTLE)
        problems = language_problems(page, "en")
        if problems:
            return fail_shot(ctx, page, "Englisch nach dem Neuladen: " + "; ".join(problems))
        pick_menu_radio(page, "Language", "Deutsch")
        try:
            expect(page.get_by_role("heading", name="Abonnements", exact=True)).to_be_visible()
        except AssertionError:
            return fail_shot(ctx, page, "Zurück auf „Deutsch“ klappt nicht.")
        problems = language_problems(page, "de")
        if problems:
            return fail_shot(ctx, page, "Wieder deutsch: " + "; ".join(problems))
        return passed()
    finally:
        restore_me(ctx, ADMIN, before)


def p_03(ctx: Ctx) -> Outcome:
    lena = "lena.demo@example.com"
    before = ctx.api(lena).get("/v1/me")[1]["user"]
    try:
        page = crm_page(ctx, lena)
        user_menu(page)
        page.get_by_role("menuitem", name="Profil").click()
        page.wait_for_url(re.compile(r"/profile$"))
        card = page.locator("main section").filter(has=page.get_by_role("heading", name="Anzeigename", exact=True))
        card.get_by_role("textbox", name="Name").fill("Lena Demo QA")
        card.get_by_role("button", name="Speichern").click()
        try:
            expect(page.get_by_text("Name gespeichert", exact=True)).to_be_visible()
        except AssertionError:
            return fail_shot(ctx, page, "Keine Meldung „Name gespeichert“.")
        user_button = page.locator("header").get_by_role("button", name=re.compile("Benutzermenü öffnen"))
        try:
            expect(user_button).to_contain_text("Lena Demo QA")
        except AssertionError:
            return fail_shot(ctx, page, f"Oben rechts steht nicht der neue Name: {user_button.inner_text()}")
        return passed()
    finally:
        restore_me(ctx, lena, before)


# ---------------------------------------------------------------------------------------------------------------
# Q: error handling and data storage (the kit's own scripts, run as user qa)
# ---------------------------------------------------------------------------------------------------------------

SEED_TENANTS = ("Muster GmbH (Test)", "Beispiel AG (Test)", "Demo Handwerk KG (Test)", "Probe & Partner (Test)")
Q_STATE: dict = {}  # the Studio tab of Q-01, which Q-02 keeps using („im bestehenden Studio-Tab“)


def ensure_kit_running(ctx: Ctx) -> None:
    if not server_up(ctx):
        kit_start(ctx)


def tenant_names(page) -> list[str]:
    expect(page.locator("main table tbody tr").first).to_be_visible()
    page.wait_for_timeout(SETTLE)
    return [n.strip() for n in page.locator("main table tbody tr a").all_inner_texts()]


def q_01(ctx: Ctx) -> Outcome:
    ensure_kit_running(ctx)
    # Own browser context (not closed by the runner after this case): Q-02 continues in this tab.
    context = ctx.browser.new_context(viewport={"width": 1280, "height": 900}, locale="de-DE")
    page = context.new_page()
    page.set_default_timeout(15_000)
    Q_STATE.update(context=context, page=page)
    sign_in(page, ctx.base, ADMIN)
    page.wait_for_load_state("networkidle")
    choose_product(page)
    nav(page, "Mandanten")
    expect(page.get_by_role("heading", name="Mandanten", exact=True)).to_be_visible()
    log = kit_stop(ctx)
    if server_up(ctx):
        return fail_shot(ctx, page, f"„3 - Beenden“ hat den Server nicht beendet: {log[-200:]}")
    page.locator("aside nav").get_by_role("link", name=re.compile("^Benutzer")).click()
    page.wait_for_timeout(5000)  # give Studio time to give up on the request
    text = page.locator("body").inner_text().strip()
    network = (
        page.get_by_text("Server nicht erreichbar").count()
        and page.get_by_role("button", name="Erneut versuchen").count()
    )
    crash = (
        page.get_by_text("Etwas ist schiefgelaufen").count()
        and page.get_by_role("button", name="Seite neu laden").count()
    )
    if len(text) < 20:
        return fail_shot(ctx, page, "Weiße/leere Seite, nachdem der Server beendet wurde.")
    if network:
        return passed("„Server nicht erreichbar“ mit „Erneut versuchen“.")
    if crash:
        out = passed(
            "Keine weiße Seite: „Etwas ist schiefgelaufen – Diese Seite konnte nicht angezeigt werden“ mit "
            "„Seite neu laden“ (sagt nicht, dass der Server weg ist)."
        )
        out.screenshot = ctx.shot(page)
        return out
    spinner = page.locator("[aria-busy=true], [class*=skeleton], [class*=spinner]").count()
    return fail_shot(
        ctx,
        page,
        "Keine verständliche Meldung nach dem Beenden"
        + (" (endloses Laden)" if spinner else f": {' '.join(text.split())[:150]}"),
    )


def q_02(ctx: Ctx) -> Outcome:
    page = Q_STATE.get("page")
    try:
        if not server_up(ctx):
            kit_start(ctx)
        if page is None or page.is_closed():
            page = crm_page(ctx)
            nav(page, "Benutzer")
        retry = page.get_by_role("button", name=re.compile("^(Erneut versuchen|Seite neu laden)$"))
        if retry.count():
            retry.first.click()
        else:
            page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(SETTLE)
        if "/login" in page.url:  # signing in again is allowed by the checklist
            sign_in(page, ctx.base, ADMIN)
            page.wait_for_load_state("networkidle")
            choose_product(page)
        nav(page, "Mandanten")
        try:
            expect(page.get_by_role("heading", name="Mandanten", exact=True)).to_be_visible()
            names = tenant_names(page)
        except AssertionError:
            return fail_shot(ctx, page, "Studio bleibt nach dem Neustart kaputt.")
        missing = [n for n in SEED_TENANTS if n not in names]
        if missing:
            return fail_shot(ctx, page, f"Nach dem Neustart fehlen Mandanten: {', '.join(missing)}")
        return passed()
    finally:
        if Q_STATE.get("context"):
            Q_STATE.pop("context").close()
        Q_STATE.clear()
        ensure_kit_running(ctx)


def q_03(ctx: Ctx) -> Outcome:
    ensure_kit_running(ctx)
    product_before = ctx.product()["id"]
    page = crm_page(ctx)
    nav(page, "Mandanten")
    page.get_by_role("button", name="Neuer Mandant").click()
    dialog = page.get_by_role("dialog", name="Mandant anlegen")
    dialog.get_by_role("textbox", name=re.compile("^Name")).fill("Bleibt-da KG")
    dialog.get_by_role("button", name="Mandant anlegen").click()
    try:
        expect(page.get_by_text("Mandant „Bleibt-da KG“ angelegt")).to_be_visible()
    except AssertionError:
        return fail_shot(ctx, page, "Mandant „Bleibt-da KG“ ließ sich nicht anlegen.")
    kit_stop(ctx)
    log = kit_start(ctx)
    page = crm_page(ctx)
    nav(page, "Mandanten")
    names = tenant_names(page)
    if "Bleibt-da KG" not in names:
        return fail_shot(ctx, page, "„Bleibt-da KG“ ist nach dem Neustart weg.")
    if ctx.product()["id"] != product_before or "Testdaten vorhanden" not in log:
        return fail_shot(ctx, page, "Die Testdaten wurden beim Neustart neu erzeugt.")
    return passed()


def q_04(ctx: Ctx) -> Outcome:
    backups = ctx.kit / "Sicherungen"
    try:
        before = {p.name for p in backups.iterdir()} if backups.is_dir() else set()
        kit_stop(ctx)
        if server_up(ctx):
            return failed("„3 - Beenden“ hat den Server nicht beendet.")
        proc = kit_script(ctx, "4 - Testdaten sichern.sh", timeout=600)
        new = sorted({p.name for p in backups.iterdir()} - before) if backups.is_dir() else []
        if proc.returncode != 0 or not new:
            return failed(f"Keine neue Sicherung in „Sicherungen“: {(proc.stdout + proc.stderr)[-300:]}")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}", new[-1]):
            return failed(f"Sicherungsordner „{new[-1]}“ trägt nicht Datum und Uhrzeit.")
        if not any((backups / new[-1]).iterdir()):
            return failed(f"Sicherungsordner „{new[-1]}“ ist leer.")
        proc = kit_script(ctx, "5 - Testdaten zuruecksetzen.sh", answers="j\nn\n", timeout=600)
        if proc.returncode != 0 or (ctx.kit / "_kit" / "daten").exists():
            return failed(f"Zurücksetzen hat nicht geklappt: {(proc.stdout + proc.stderr)[-300:]}")
        kit_start(ctx)
        page = crm_page(ctx)
        nav(page, "Mandanten")
        names = tenant_names(page)
        if "Bleibt-da KG" in names:
            return fail_shot(ctx, page, "Nach dem Zurücksetzen ist „Bleibt-da KG“ noch da.")
        missing = [n for n in SEED_TENANTS if n not in names]
        if missing:
            return fail_shot(ctx, page, f"Nach dem Zurücksetzen fehlen Testdaten: {', '.join(missing)}")
        return passed(f"Sicherung {new[-1]}")
    finally:
        ensure_kit_running(ctx)


# ---------------------------------------------------------------------------------------------------------------
# R: phone layout, keyboard, accessibility
# ---------------------------------------------------------------------------------------------------------------

FOCUS_JS = """() => {
  const e = document.activeElement;
  if (!e || e === document.body) return null;
  const s = getComputedStyle(e);
  const r = e.getBoundingClientRect();
  const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 1)
    || /\\d+px \\d+px 0px [1-9]/.test(s.boxShadow);
  const inView = r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0
    && r.bottom <= innerHeight && r.right <= innerWidth;
  return { text: (e.innerText || e.getAttribute('aria-label') || '').trim().split('\\n')[0], ring, inView };
}"""


def r_01(ctx: Ctx) -> Outcome:
    page = crm_page(ctx, viewport=(375, 780))
    menu_button = page.get_by_role("button", name="Navigation öffnen")
    if page.locator("aside").is_visible() or not menu_button.is_visible():
        return fail_shot(ctx, page, "Die Seitenleiste wird bei Handybreite nicht zum Menü-Knopf.")
    menu_button.click()
    drawer = page.get_by_role("dialog")
    expect(drawer).to_be_visible()
    drawer.get_by_role("link", name=re.compile("^Datensätze")).click()
    page.wait_for_url(re.compile(r"/records$"))
    try:
        expect(drawer).to_be_hidden()
    except AssertionError:
        return fail_shot(ctx, page, "Das Menü schließt sich nach der Auswahl nicht.")
    # A table to scroll: collection „kontakte“ of Muster GmbH (Test).
    collection = page.locator("main").get_by_role("button", name=re.compile("^kontakte"))
    collection.click()
    expect(collection).to_have_attribute("aria-pressed", "true")
    tenant = page.locator("main").get_by_label("Mandant", exact=True)
    tenant.select_option(label="Muster GmbH (Test)")
    expect(tenant).not_to_have_value("")
    try:
        expect(page.locator("main table tbody tr").first).to_be_visible(timeout=20_000)
    except AssertionError:
        return fail_shot(ctx, page, "Nach Auswahl von Sammlung „kontakte“ und Mandant erscheint keine Tabelle.")
    page.wait_for_timeout(SETTLE)
    layout = page.evaluate(
        """() => {
          const t = document.querySelector('main table');
          let box = t.parentElement;
          while (box && box !== document.body && !['auto', 'scroll'].includes(getComputedStyle(box).overflowX)) {
            box = box.parentElement;
          }
          const own = box && box !== document.body;
          if (own) box.scrollLeft = 120;
          window.scrollTo(0, document.body.scrollHeight);
          return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                   table: t.scrollWidth, own, scrolled: own ? box.scrollLeft : 0, pageX: window.scrollX };
        }"""
    )
    if layout["page"] > 1 or layout["pageX"] > 0:
        return fail_shot(ctx, page, f"Die ganze Seite scrollt seitwärts ({layout['page']} px).")
    if layout["table"] > 375 and (not layout["own"] or layout["scrolled"] <= 0):
        return fail_shot(ctx, page, "Die breite Tabelle scrollt nicht in ihrem eigenen Bereich.")
    cut = page.evaluate(
        """() => [...document.querySelectorAll('main button, main a, main select, main input')]
          .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && !e.closest('table')
                           && (r.left < -1 || r.right > document.documentElement.clientWidth + 1); })
          .map((e) => (e.innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 30))"""
    )
    if cut:
        return fail_shot(ctx, page, f"Bedienelemente abgeschnitten: {', '.join(cut[:4])}")
    return passed()


def r_02(ctx: Ctx) -> Outcome:
    page = crm_page(ctx)
    nav(page, "Mandanten")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(SETTLE)
    page.keyboard.press("Tab")
    page.wait_for_timeout(400)  # the skip link slides in
    first = page.evaluate(FOCUS_JS)
    if not first or first["text"] != "Zum Hauptinhalt springen" or not first["inView"]:
        return fail_shot(ctx, page, f"Erster Tab zeigt nicht „Zum Hauptinhalt springen“: {first}")
    no_ring = [] if first["ring"] else [first["text"]]
    for _ in range(80):
        page.keyboard.press("Tab")
        focus = page.evaluate(FOCUS_JS)
        if not focus:
            return fail_shot(ctx, page, "Der Fokus verschwindet beim Tabben.")
        if not focus["ring"]:
            no_ring.append(focus["text"])
        if focus["text"] == "Neuer Mandant":
            break
    else:
        return fail_shot(ctx, page, "„Neuer Mandant“ ist mit Tab nicht erreichbar.")
    if no_ring:
        return fail_shot(ctx, page, f"Kein sichtbarer Fokusrahmen bei: {', '.join(no_ring[:5])}")
    page.keyboard.press("Enter")
    dialog = page.get_by_role("dialog", name="Mandant anlegen")
    try:
        expect(dialog).to_be_visible()
    except AssertionError:
        return fail_shot(ctx, page, "Der Dialog öffnet sich nicht mit Eingabe.")
    inside = page.evaluate(FOCUS_JS)
    page.keyboard.press("Escape")
    try:
        expect(dialog).to_be_hidden()
    except AssertionError:
        return fail_shot(ctx, page, "Esc schließt den Dialog nicht.")
    page.wait_for_timeout(SETTLE)
    after = page.evaluate(FOCUS_JS)
    if not inside or not inside["ring"]:
        return fail_shot(ctx, page, "Im Dialog ist kein Fokus sichtbar.")
    if not after or after["text"] != "Neuer Mandant":
        out = failed(
            "Dialog öffnet mit Eingabe und schließt mit Esc, aber danach steht der Fokus nicht wieder auf "
            f"„Neuer Mandant“ ({'Fokus liegt auf keinem Element' if not after else 'Fokus auf ' + after['text']})."
        )
        out.screenshot = ctx.shot(page)
        return out
    return passed()


# ---------------------------------------------------------------------------------------------------------------
# S: help center and system health
# ---------------------------------------------------------------------------------------------------------------


def looks_german(text: str) -> bool:
    words = re.findall(r"[a-zäöüß]+", text.lower())
    german = sum(w in {"und", "der", "die", "das", "nicht", "mit", "ist", "ein", "eine", "für"} for w in words)
    english = sum(w in {"the", "and", "with", "is", "for", "this", "you", "not"} for w in words)
    return german >= 10 and german > 3 * english


def s_01(ctx: Ctx) -> Outcome:
    # 1440 px wide: from this width on the article shows „Auf dieser Seite“ as a column on the right
    # (narrower windows fold it into a box above the article).
    page = crm_page(ctx, viewport=(1440, 900))
    nav(page, "Hilfecenter")
    page.get_by_role("searchbox", name="Hilfecenter durchsuchen").fill("API-Schlüssel")
    try:
        expect(page.locator("main").get_by_text(re.compile(r"^\d+ Treffer für „API-Schlüssel“"))).to_be_visible()
    except AssertionError:
        return fail_shot(ctx, page, "Keine Treffer für „API-Schlüssel“.")
    hit = page.locator("main").get_by_role("link").filter(has_text="im Abschnitt").first
    title = hit.inner_text().split("\n")[0]
    hit.click()
    page.wait_for_url(re.compile(r"/help/[^/]+"))
    article = page.locator("main article").first if page.locator("main article").count() else page.locator("main")
    expect(article.get_by_role("heading", level=1)).to_be_visible()
    page.wait_for_timeout(SETTLE)
    text = article.inner_text()
    if len(text) < 500:
        return fail_shot(ctx, page, f"Artikel „{title}“ ist (fast) leer.")
    if not looks_german(text):
        return fail_shot(ctx, page, f"Artikel „{title}“ ist nicht auf Deutsch.")
    toc = page.get_by_text("Auf dieser Seite", exact=True).locator("visible=true")
    if not toc.count():
        return fail_shot(ctx, page, "„Auf dieser Seite“ fehlt.")
    box = toc.first.bounding_box()
    if box["x"] < 1440 / 2:
        return fail_shot(ctx, page, "„Auf dieser Seite“ steht nicht rechts.")
    pager = page.get_by_role("navigation", name="Vorheriger und nächster Artikel")
    if not pager.get_by_text("Zurück", exact=True).count() or not pager.get_by_text("Weiter", exact=True).count():
        return fail_shot(ctx, page, f"Unten fehlt „Zurück“/„Weiter“: {pager.all_inner_texts()}")
    return passed()


def s_02(ctx: Ctx) -> Outcome:
    page = crm_page(ctx)
    user_menu(page)
    page.get_by_role("menuitem", name="Abmelden").click()
    page.wait_for_url(re.compile(r"/login"))
    if ctx.api(None).get("/v1/me")[0] != 401:
        return fail_shot(ctx, page, "Nach dem Abmelden noch angemeldet.")
    problems = []
    # „Hilfe zur Anmeldung“ opens the article „An- und Abmelden“ in a help panel on the login page.
    page.get_by_role("link", name="Hilfe zur Anmeldung", exact=True).click()
    page.wait_for_timeout(SETTLE)
    panel = page.get_by_role("dialog")
    if "/help" in page.url:
        shown = page.locator("main").inner_text()
    elif panel.count():
        shown = panel.first.inner_text()
    else:
        shown = ""
    if len(shown) < 200 or "Anmeld" not in shown:
        problems.append(f"„Hilfe zur Anmeldung“ zeigt keine Hilfe ({page.url})")
    page.goto(f"{ctx.base}/login")
    page.get_by_role("link", name="Hilfecenter", exact=True).click()
    try:
        page.wait_for_url(re.compile(r"/help"))
        expect(page.get_by_role("heading", name="Hilfecenter", level=1)).to_be_visible()
        expect(page.get_by_role("searchbox", name="Hilfecenter durchsuchen")).to_be_visible()
    except (AssertionError, PlaywrightTimeout):
        problems.append(f"„Hilfecenter“ öffnet das Hilfecenter nicht ({page.url})")
    if "/login" in page.url:
        problems.append("Weiterleitung zur Anmeldung")
    if problems:
        return fail_shot(ctx, page, "; ".join(problems))
    return passed()


def s_03(ctx: Ctx) -> Outcome:
    page = crm_page(ctx)
    nav(page, "Systemzustand")
    if page.get_by_text("Der Server meldet, dass er nicht bereit ist").count():
        return fail_shot(ctx, page, "„Der Server meldet, dass er nicht bereit ist“.")
    problems = []
    for name in ("Bereitschaft", "Erreichbarkeit"):
        card = page.locator("main section").filter(has=page.get_by_role("heading", name=name, exact=True))
        expect(card.get_by_text("OK", exact=True).first).to_be_visible()
        badges = card.locator("[class*=badge]")
        states = badges.all_inner_texts()
        colors = badges.evaluate_all(
            "l => l.map((e) => getComputedStyle(e.querySelector('[class*=dot]') || e).backgroundColor)"
        )
        green = all(
            (lambda c: c[1] > c[0] and c[1] > c[2] * 0.9)([float(x) for x in re.findall(r"[\d.]+", col)[:3]])
            for col in colors
        )
        if any(st.strip() != "OK" for st in states) or not green:
            problems.append(f"{name}: {', '.join(st.strip() for st in states)}")
    server, studio = detail(page, "Server"), detail(page, "Studio-Version")
    if not server or not studio or server == "—" or studio == "—":
        problems.append(f"Versionen fehlen (Server „{server}“, Studio „{studio}“)")
    if problems:
        return fail_shot(ctx, page, "; ".join(problems))
    return passed(f"Server {server}, Studio {studio}")


# ---------------------------------------------------------------------------------------------------------------
# T: API reference (optional)
# ---------------------------------------------------------------------------------------------------------------

T_KEY = {"name": "qa-api-referenz", "secret": ""}


def scroll_until(page, locator, steps: int = 40) -> bool:
    """The API reference renders only the sections near the viewport: scroll down until the locator exists."""
    page.wait_for_selector(".swagger-ui .opblock", timeout=30_000)
    for _ in range(steps):
        if locator.count():
            locator.first.scroll_into_view_if_needed()
            return True
        page.mouse.wheel(0, 800)
        page.wait_for_timeout(250)
    return False


def docs_tenants_request(ctx: Ctx, page, secret: str, product_id: str) -> tuple[str, str]:
    """In the API reference: Authorize with the key (X-API-Key), then „Try it out“ and „Execute“ on the
    tenant list of the product. Returns (status code, response body)."""
    page.goto(f"{ctx.base}/v1/docs")
    page.get_by_role("button", name="Authorize").first.click()
    modal = page.locator(".modal-ux")
    section = modal.locator(".auth-container").filter(has_text="apiKeyHeader")
    section.locator("input").fill(secret)
    section.locator("button.authorize").click()  # labelled „Authorize“ (accessible name „Apply credentials“)
    expect(section.locator("button", has_text="Logout")).to_be_visible()  # shown once the key is applied
    modal.locator("button.btn-done").first.click()  # „Close“
    op = (
        page.locator(".opblock-get")
        .filter(
            has=page.locator(".opblock-summary-path", has_text=re.compile(r"^/v1/products/\{product_id\}/tenants$"))
        )
        .first
    )
    scroll_until(page, op)
    op.locator(".opblock-summary").click()
    op.get_by_role("button", name="Try it out").click()
    op.locator("tr[data-param-name=product_id] input").fill(product_id)
    op.get_by_role("button", name="Execute").click()
    live = op.locator(".live-responses-table .response").first
    expect(live).to_be_visible(timeout=20_000)
    status = live.locator(".response-col_status").inner_text().strip().split()[0]
    body = live.locator(".response-col_description").inner_text()
    return status, body


def t_01(ctx: Ctx) -> Outcome:
    page = crm_page(ctx)
    qa = page.context.new_page()
    qa.goto(f"{ctx.base}/qa/#integrationen")
    with page.context.expect_page() as docs_tab:
        qa.get_by_role("link", name="API-Referenz öffnen").click()
    docs = docs_tab.value
    docs.wait_for_load_state("networkidle")
    try:
        expect(docs.locator(".swagger-ui .info .title")).to_contain_text("Axentra API", timeout=20_000)
    except AssertionError:
        return fail_shot(ctx, docs, "Die API-Referenz bleibt leer (lädt ihre Darstellung aus dem Internet).")
    docs.mouse.move(640, 450)
    tenants = docs.locator("h3.opblock-tag").filter(has_text=re.compile("^tenants"))
    if not scroll_until(docs, tenants) or not docs.get_by_text("/v1/products/{product_id}/tenants", exact=True).count():
        return fail_shot(ctx, docs, "Kein Abschnitt zu Mandanten (tenants) in der API-Referenz.")
    anonymous = ctx.new_page()
    response = anonymous.goto(f"{ctx.base}/v1/docs")
    if response.status != 401:
        return fail_shot(ctx, anonymous, f"Ohne Anmeldung antwortet /v1/docs mit {response.status} statt 401.")
    return passed()


def t_02(ctx: Ctx) -> Outcome:
    product_id = ctx.product()["id"]
    page = crm_page(ctx)
    nav(page, "API-Schlüssel")
    page.get_by_role("button", name="Neuer API-Schlüssel").click()
    dialog = page.get_by_role("dialog", name="Neuer API-Schlüssel")
    dialog.get_by_role("textbox", name="Name").fill(T_KEY["name"])
    dialog.get_by_role("checkbox", name="tenants:read").check()
    dialog.get_by_role("button", name="Schlüssel anlegen").click()
    secret_dialog = page.get_by_role("dialog", name=f"Geheimnis für „{T_KEY['name']}“")
    expect(secret_dialog).to_be_visible()
    secret_dialog.get_by_role("button", name="Wert anzeigen").click()
    secret = secret_dialog.get_by_label("Geheimnis des API-Schlüssels").input_value()
    T_KEY["secret"] = secret
    secret_dialog.get_by_role("checkbox", name="Ich habe das Geheimnis sicher gespeichert").check()
    secret_dialog.get_by_role("button", name="Fertig").click()
    expect(secret_dialog).to_be_hidden()
    docs = page.context.new_page()
    status, body = docs_tenants_request(ctx, docs, secret, product_id)
    if status != "200":
        return fail_shot(ctx, docs, f"Die Anfrage mit dem Schlüssel antwortet mit {status} statt 200.")
    if "Muster GmbH (Test)" not in body or "Beispiel AG (Test)" not in body:
        return fail_shot(ctx, docs, "Die Antwort enthält nicht die Mandanten des Beispiel-CRM (Test).")
    page.reload()
    page.wait_for_load_state("networkidle")
    row = page.locator("main table tbody tr").filter(has_text=T_KEY["name"]).first
    expect(row).to_be_visible()
    headers = [h.strip().lower() for h in page.locator("main table thead th").all_inner_texts()]
    cells = row.locator("th, td").all_inner_texts()
    column = next((i for i, h in enumerate(headers) if h.startswith("zuletzt verwendet")), None)
    last_used = cells[column].strip() if column is not None and column < len(cells) else ""
    if not last_used or last_used in ("—", "-", "Nie"):
        return fail_shot(ctx, page, f"„Zuletzt verwendet“ bleibt leer („{last_used}“).")
    return passed()


def t_03(ctx: Ctx) -> Outcome:
    product_id = ctx.product()["id"]
    api = ctx.api()
    _, keys = api.get(f"/v1/products/{product_id}/api-keys")
    keys = keys["items"] if isinstance(keys, dict) else keys
    active = [k for k in keys if k["name"] == T_KEY["name"] and k["status"] == "active"]
    if not T_KEY["secret"] or not active:  # setup when T-02 did not leave its key
        status, body = api.post(
            f"/v1/products/{product_id}/api-keys", {"name": T_KEY["name"], "permissions": ["tenants:read"]}
        )
        T_KEY["secret"] = body["secret"]
    page = crm_page(ctx)
    nav(page, "API-Schlüssel")
    row = page.locator("main table tbody tr").filter(has_text=T_KEY["name"]).filter(has_text="Aktiv").first
    row.get_by_role("button", name=f"Aktionen für {T_KEY['name']}").click()
    page.get_by_role("menuitem", name="Schlüssel widerrufen").click()
    confirm = page.get_by_role("alertdialog").or_(page.get_by_role("dialog"))
    confirm.locator("input").fill(T_KEY["name"])
    confirm.get_by_role("button", name=re.compile("widerrufen", re.I)).click()
    expect(page.get_by_text(f"API-Schlüssel „{T_KEY['name']}“ widerrufen")).to_be_visible()
    docs = page.context.new_page()
    status, _ = docs_tenants_request(ctx, docs, T_KEY["secret"], product_id)
    if status != "401":
        return fail_shot(ctx, docs, f"Die Anfrage mit dem widerrufenen Schlüssel antwortet mit {status} statt 401.")
    return passed()


CASES = {
    "M-01": m_01,
    "M-02": m_02,
    "M-03": m_03,
    "M-04": m_04,
    "M-05": m_05,
    "N-01": n_01,
    "N-02": n_02,
    "N-03": n_03,
    "N-04": n_04,
    "O-01": o_01,
    "P-01": p_01,
    "P-02": p_02,
    "P-03": p_03,
    "Q-01": q_01,
    "Q-02": q_02,
    "Q-03": q_03,
    "Q-04": q_04,
    "R-01": r_01,
    "R-02": r_02,
    "S-01": s_01,
    "S-02": s_02,
    "S-03": s_03,
    "T-01": t_01,
    "T-02": t_02,
    "T-03": t_03,
}
