"""Automated checklist cases G-01..L-03 (API keys, data, files, jobs, events, webhooks, usage)."""

from __future__ import annotations

import functools
import hashlib
import re
import time
from pathlib import Path

from playwright.sync_api import expect

from .harness import Ctx, Outcome, failed, manual, passed

FILES = Path("/tmp/claude-0/-home-user/2338cc76-fec0-561e-b3a1-31827f66443a/scratchpad/qa-auto/files2")
MUSTER = "Muster GmbH (Test)"
GRENZFALL = "Grenzfall Datenhungrig GmbH (Test)"
UPLOAD_NAME = "qa-lauf2-upload.txt"
SCHEDULE_NAME = "QA stündlich"

expect.set_options(timeout=15_000)


# ---- helpers -------------------------------------------------------------------------------


def case(fn):
    """Turn a crash (timeout, failed expect) into a failed outcome with a screenshot of the last page."""

    @functools.wraps(fn)
    def run(ctx: Ctx) -> Outcome:
        try:
            return fn(ctx)
        except Exception as e:
            out = failed(f"Abbruch: {type(e).__name__}: {str(e).splitlines()[0][:300]}")
            pages = [p for p in [ctx.last_page()] if p is not None]
            if pages:
                out.screenshot = ctx.shot(pages[-1])
            return out

    return run


def fail(ctx: Ctx, page, note: str) -> Outcome:
    out = failed(note)
    out.screenshot = ctx.shot(page)
    return out


def open_product(ctx: Ctx, label: str):
    """Sign in as admin, open Beispiel-CRM and click the sidebar entry `label`."""
    pid = ctx.product()["id"]
    page = ctx.page()
    page.goto(f"{ctx.base}/p/{pid}/dashboard")
    page.get_by_role("navigation").get_by_role("link", name=label, exact=True).click()
    expect(page.get_by_role("heading", level=1)).to_be_visible()
    return page, pid


def toasts(page):
    # By CSS, not by role: while a dialog is open, Radix hides the rest of the page from the accessibility tree.
    return page.locator("[role=region] > ol > li")


def toast(page, text: str) -> None:
    expect(toasts(page).get_by_text(text).first).to_be_visible()


def pick_tenant(page, name: str, scope=None) -> None:
    select = (scope or page).get_by_label("Mandant", exact=True)
    expect(select).to_be_enabled()
    select.select_option(label=name)


def row(scope, text: str):
    # By CSS: an open drawer hides the page behind it from role queries.
    return scope.locator("tr").filter(has_text=text)


def cells(locator) -> list[str]:
    return [c.strip() for c in locator.locator("th, td").all_inner_texts()]


def tenant_id(ctx: Ctx, pid: str, name: str) -> str:
    _, body = ctx.api().get(f"/v1/products/{pid}/tenants?limit=200")
    return next(t["id"] for t in body["items"] if t["name"] == name)


def write_file(name: str, data: bytes) -> Path:
    FILES.mkdir(parents=True, exist_ok=True)
    path = FILES / name
    path.write_bytes(data)
    return path


def files_api(ctx: Ctx, pid: str, tid: str) -> list[dict]:
    _, body = ctx.api().get(f"/v1/products/{pid}/tenants/{tid}/files?limit=200")
    return body["items"] if isinstance(body, dict) else body


def meter_card(panel, name: str):
    return panel.locator("li").filter(has=panel.page.get_by_role("heading", name=name, exact=True))


# ---- G: API keys ---------------------------------------------------------------------------


@case
def g01(ctx: Ctx) -> Outcome:
    page, _ = open_product(ctx, "API-Schlüssel")
    expect(page.get_by_role("heading", name="API-Schlüssel", level=1)).to_be_visible()
    table = page.get_by_role("region", name="API-Schlüssel")
    expect(row(table, "crm-backend (Test)")).to_be_visible()
    # Columns: name, status, scope, permissions, last used, expires, created.
    rows = {}
    for r in table.locator("tbody tr").all():
        c = cells(r)
        rows.setdefault(c[0].split("\n")[0], c)
    problems = []
    names = [
        "crm-backend (Test)",
        "import-worker Muster GmbH (Test, laeuft bald ab)",
        "reporting nur lesend (Test)",
        "rotierter Schluessel (Test)",
        "alter Schluessel (Test, widerrufen)",
        "Kurzzeit-Schluessel (Test, abgelaufen)",
    ]
    missing = [n for n in names if n not in rows]
    if missing:
        return fail(ctx, page, "Schlüssel fehlen: " + ", ".join(missing))
    crm = rows["crm-backend (Test)"]
    if not crm[1].startswith("Aktiv") or crm[4] in ("", "—"):
        problems.append(f"crm-backend: Status „{crm[1]}“, Zuletzt verwendet „{crm[4]}“")
    imp = rows["import-worker Muster GmbH (Test, laeuft bald ab)"]
    soon = re.search(r"in (\d+) Tag|morgen", imp[5])
    if "Mandant" not in imp[2] or not soon or (soon.group(1) and int(soon.group(1)) > 7):
        problems.append(f"import-worker: Geltungsbereich „{imp[2]}“, Läuft ab „{imp[5]}“")
    if not rows["alter Schluessel (Test, widerrufen)"][1].startswith("Widerrufen"):
        problems.append("alter Schluessel nicht „Widerrufen“")
    if not rows["Kurzzeit-Schluessel (Test, abgelaufen)"][1].startswith("Abgelaufen"):
        problems.append("Kurzzeit-Schluessel nicht „Abgelaufen“")
    if problems:
        return fail(ctx, page, "; ".join(problems))
    return passed()


@case
def g02(ctx: Ctx) -> Outcome:
    page, _ = open_product(ctx, "API-Schlüssel")
    page.get_by_role("button", name="Neuer API-Schlüssel").click()
    form = page.get_by_role("dialog", name="Neuer API-Schlüssel")
    form.get_by_role("textbox", name="Name").fill("qa-test")
    form.get_by_role("checkbox", name="records:read", exact=True).check()
    form.get_by_role("button", name="Schlüssel anlegen").click()

    dialog = page.get_by_role("dialog", name="Geheimnis für „qa-test“")
    expect(dialog).to_be_visible()
    expect(dialog.get_by_text("Geheimnis jetzt kopieren")).to_be_visible()
    page.keyboard.press("Escape")
    page.wait_for_timeout(500)
    if not dialog.is_visible():
        return fail(ctx, page, "Das Geheimnis-Fenster schließt sich mit Esc ohne Haken.")
    done = dialog.get_by_role("button", name="Fertig")
    if done.is_enabled():
        return fail(ctx, page, "„Fertig“ ist schon vor dem Haken klickbar.")
    secret_box = dialog.get_by_label("Geheimnis des API-Schlüssels")
    expect(secret_box).to_have_attribute("type", "password")
    dialog.get_by_role("button", name="Wert anzeigen").click()
    expect(secret_box).to_have_attribute("type", "text")
    secret = secret_box.input_value()
    if not secret or len(secret) < 16:
        return fail(ctx, page, f"Kein Geheimnis angezeigt („{secret}“).")
    write_file("qa-test-geheimnis.txt", secret.encode())
    dialog.get_by_role("checkbox", name="Ich habe das Geheimnis sicher gespeichert").check()
    expect(done).to_be_enabled()
    done.click()
    expect(dialog).to_be_hidden()
    expect(row(page, "qa-test").first).to_be_visible()
    page.reload()
    expect(row(page, "qa-test").first).to_be_visible()
    if secret in page.content():
        return fail(ctx, page, "Das Geheimnis ist nach „Fertig“ in der Seite wieder sichtbar.")
    return passed()


@case
def g03(ctx: Ctx) -> Outcome:
    pid = ctx.product()["id"]
    api = ctx.api()
    _, keys = api.get(f"/v1/products/{pid}/api-keys")
    keys = keys["items"] if isinstance(keys, dict) else keys
    if not any(k["name"] == "qa-test" and k["status"] == "active" for k in keys):
        # G-02 did not leave an active key (e.g. run on its own): create one for this case.
        api.post(f"/v1/products/{pid}/api-keys", {"name": "qa-test", "permissions": ["records:read"]})
    page, _ = open_product(ctx, "API-Schlüssel")
    active = row(page, "qa-test").filter(has_text="Aktiv").first
    expect(active).to_be_visible()
    active.get_by_role("button", name="Aktionen für qa-test").click()
    page.get_by_role("menuitem", name="Schlüssel widerrufen").click()
    dialog = page.get_by_role("dialog", name="API-Schlüssel widerrufen?")
    confirm = dialog.get_by_role("button", name="Schlüssel widerrufen")
    if confirm.is_enabled():
        return fail(ctx, page, "Widerruf ist ohne Namenseingabe möglich.")
    dialog.get_by_role("textbox").fill("qa-tes")
    if confirm.is_enabled():
        return fail(ctx, page, "Widerruf ist mit falschem Namen möglich.")
    dialog.get_by_role("textbox").fill("qa-test")
    expect(confirm).to_be_enabled()
    confirm.click()
    toast(page, "API-Schlüssel „qa-test“ widerrufen")
    expect(dialog).to_be_hidden()
    _, keys = api.get(f"/v1/products/{pid}/api-keys")
    keys = keys["items"] if isinstance(keys, dict) else keys
    if any(k["name"] == "qa-test" and k["status"] == "active" for k in keys):
        return fail(ctx, page, "Nach dem Widerruf ist noch ein „qa-test“ aktiv.")
    expect(row(page, "qa-test").filter(has_text="Widerrufen").first).to_be_visible()
    return passed()


# ---- H: data, records, search --------------------------------------------------------------


@case
def h01(ctx: Ctx) -> Outcome:
    page, _ = open_product(ctx, "Datenübersicht")
    collections = page.get_by_role("region", name="Datensatz-Sammlungen")
    expect(row(collections, "kontakte")).to_be_visible()
    problems = []
    for name in ("kontakte", "notizen", "aufgaben"):
        r = collections.get_by_role("row").filter(has=page.get_by_role("link", name=name, exact=True))
        if r.count() != 1:
            problems.append(f"Sammlung „{name}“ fehlt")
            continue
        count = cells(r)[1]
        if not re.fullmatch(r"[\d.]+", count) or int(count.replace(".", "")) < 1:
            problems.append(f"„{name}“ ohne Anzahl („{count}“)")
    expect(page.get_by_role("heading", name="Dateispeicher")).to_be_visible()
    storage = page.get_by_role("region", name="Speicherverbrauch pro Mandant")
    expect(row(storage, MUSTER)).to_be_visible()
    muster = cells(row(storage, MUSTER))
    if not re.search(r"\d+(,\d+)? (B|KiB|MiB)", muster[1]):
        problems.append(f"Kein Speicherverbrauch für {MUSTER} („{muster[1]}“)")
    if storage.locator("tbody tr").count() < 2:
        problems.append("Speicherverbrauch nicht pro Mandant")
    if page.get_by_role("alert").filter(has_text=re.compile(r"\S")).count():
        problems.append("Fehlermeldung: " + page.get_by_role("alert").first.inner_text()[:100])
    return fail(ctx, page, "; ".join(problems)) if problems else passed()


def open_kontakte(ctx: Ctx):
    page, pid = open_product(ctx, "Datensätze")
    pick_tenant(page, MUSTER)
    page.get_by_role("button", name=re.compile(r"^kontakte")).click()
    table = page.get_by_role("region", name="Datensätze in kontakte")
    expect(table.locator("tbody tr").first).to_be_visible()
    return page, pid, table


def record_names(table) -> list[str]:
    expect(table).not_to_have_attribute("aria-busy", "true")
    return [re.search(r'"name":"([^"]*)"', t).group(1) for t in table.locator("tbody tr td code").all_inner_texts()]


@case
def h02(ctx: Ctx) -> Outcome:
    page, _, table = open_kontakte(ctx)
    expect(page.get_by_text(re.compile(r"^6 Einträge angezeigt"))).to_be_visible()
    names = record_names(table)
    want = {"Erika Mustermann (Test)", "Max Mustermann (Test)", "Nora Test (Test)"}
    if len(names) != 6 or not want <= set(names):
        return fail(ctx, page, f"Ohne Filter: {len(names)} Kontakte: {', '.join(names)}")
    page.get_by_role("textbox", name="Feld").fill("status")
    page.get_by_role("textbox", name="Ist gleich").fill("kunde")
    page.get_by_role("button", name="Filter hinzufügen").click()
    expect(page.get_by_role("list", name="Aktive Filter")).to_contain_text('status = "kunde"')
    expect(page.get_by_text(re.compile(r"^3 Einträge angezeigt"))).to_be_visible()
    names = record_names(table)
    want = {"Erika Mustermann (Test)", "Hans Beispiel (Test)", "Clara Demo (Test)"}
    if set(names) != want or len(names) != 3:
        return fail(ctx, page, f"Mit Filter status=kunde: {', '.join(names)}")
    return passed()


@case
def h03(ctx: Ctx) -> Outcome:
    try:
        return record_lifecycle(ctx)
    finally:
        remove_test_records(ctx)


def remove_test_records(ctx: Ctx) -> None:
    """Delete "Peter Prüfer" records that a broken run of H-03 left behind (H-02 counts the contacts)."""
    pid = ctx.product()["id"]
    base = f"/v1/products/{pid}/tenants/{tenant_id(ctx, pid, MUSTER)}/records/kontakte"
    api = ctx.api()
    for r in api.get(f"{base}?limit=200")[1]["items"]:
        if r["data"].get("name") == "Peter Prüfer":
            api.call("DELETE", f"{base}/{r['id']}", headers={"If-Match": str(r["version"])})


def record_lifecycle(ctx: Ctx) -> Outcome:
    page, pid, table = open_kontakte(ctx)
    page.get_by_role("button", name="Neuer Datensatz").click()
    dialog = page.get_by_role("dialog", name="Neuer Datensatz")
    expect(dialog.get_by_role("textbox", name="Sammlung")).to_have_value("kontakte")
    dialog.get_by_role("textbox", name="Daten").fill('{"name": "Peter Prüfer", "status": "interessent"}')
    with page.expect_response(lambda r: r.request.method == "POST" and "/records/kontakte" in r.url) as resp:
        dialog.get_by_role("button", name="Datensatz anlegen").click()
    record_id = resp.value.json()["id"]
    toast(page, f"Datensatz {record_id} angelegt")
    expect(dialog).to_be_hidden()

    table.get_by_role("button", name=f"Datensatz {record_id} ansehen").click()
    drawer = page.get_by_role("dialog", name="Datensatz")
    expect(drawer).to_contain_text("Peter Prüfer")
    drawer.get_by_role("button", name="Bearbeiten").click()
    editor = page.get_by_role("dialog", name="Datensatz bearbeiten")
    expect(editor).to_contain_text("Du bearbeitest Version 1.")
    editor.get_by_role("textbox", name="Daten").fill('{"name": "Peter Prüfer", "status": "kunde"}')
    editor.get_by_role("button", name="Änderungen speichern").click()
    toast(page, f"Datensatz {record_id} gespeichert")
    expect(editor).to_be_hidden()
    expect(drawer).to_contain_text('"kunde"')
    expect(drawer).to_contain_text(re.compile(r"Version\s*2(?!\d)"))
    path = f"/v1/products/{pid}/tenants/{tenant_id(ctx, pid, MUSTER)}/records/kontakte/{record_id}"
    _, saved = ctx.api().get(path)
    if saved.get("version") != 2 or saved.get("data", {}).get("status") != "kunde":
        return fail(ctx, page, f"Nach dem Ändern: Version {saved.get('version')}, Daten {saved.get('data')}")

    drawer.get_by_role("button", name="Datensatz löschen").click()
    confirm = page.get_by_role("dialog", name="Datensatz löschen?")
    confirm.get_by_role("button", name="Datensatz löschen").click()
    toast(page, f"Datensatz {record_id} gelöscht")
    expect(table.get_by_text(record_id)).to_have_count(0)
    status, _ = ctx.api().get(path)
    if status != 404:
        return fail(ctx, page, f"Datensatz nach dem Löschen noch abrufbar (HTTP {status}).")
    return passed()


@case
def h04(ctx: Ctx) -> Outcome:
    page, pid, _ = open_kontakte(ctx)
    tid = tenant_id(ctx, pid, MUSTER)
    _, before = ctx.api().get(f"/v1/products/{pid}/tenants/{tid}/records/kontakte?limit=200")
    page.get_by_role("button", name="Neuer Datensatz").click()
    dialog = page.get_by_role("dialog", name="Neuer Datensatz")
    data = dialog.get_by_role("textbox", name="Daten")
    data.fill("hallo")
    expect(dialog.get_by_text("Das ist kein gültiges JSON.")).to_be_visible()
    create = dialog.get_by_role("button", name="Datensatz anlegen")
    if create.is_enabled():
        create.click()
    else:
        data.press("Control+Enter")
    page.wait_for_timeout(1000)
    _, after = ctx.api().get(f"/v1/products/{pid}/tenants/{tid}/records/kontakte?limit=200")
    if len(after["items"]) != len(before["items"]):
        return fail(ctx, page, "Trotz ungültigem JSON wurde ein Datensatz angelegt.")
    expect(dialog).to_be_visible()
    return passed()


@case
def h05(ctx: Ctx) -> Outcome:
    page, _ = open_product(ctx, "Suche")
    pick_tenant(page, MUSTER)
    search = page.get_by_role("search", name="Suchindex des Mandanten durchsuchen")
    search.get_by_role("searchbox", name="Suchen nach").fill("Mustermann")
    search.get_by_role("button", name="Suchen", exact=True).click()
    results = page.get_by_role("region", name="Ergebnisse für Mustermann").or_(
        page.locator("section").filter(has=page.get_by_role("heading", name="Ergebnisse für Mustermann"))
    )
    hits = results.locator("li")
    expect(hits.first).to_be_visible()
    texts = hits.all_inner_texts()
    titles = " ".join(texts)
    problems = []
    if not all("kontakt" in t for t in texts):
        problems.append("Treffer anderer Art: " + " | ".join(t.replace("\n", " ")[:60] for t in texts))
    for name in ("Erika Mustermann (Test)", "Max Mustermann (Test)"):
        if name not in titles:
            problems.append(f"„{name}“ fehlt")
    if problems:
        return fail(ctx, page, "; ".join(problems))
    results.get_by_role("button", name="Erika Mustermann (Test)").click()
    drawer = page.get_by_role("dialog", name="Erika Mustermann (Test)")
    expect(drawer.get_by_role("heading", name="Erika Mustermann (Test)")).to_be_visible()
    expect(drawer).to_contain_text("Dokument-ID")
    expect(drawer).to_contain_text(re.compile(r"Art\s*kontakt"))
    return passed()


# ---- I: files ------------------------------------------------------------------------------


def open_files(ctx: Ctx, tenant: str):
    page, pid = open_product(ctx, "Dateien")
    pick_tenant(page, tenant)
    table = page.get_by_role("region", name="Dateien des ausgewählten Mandanten")
    expect(table).not_to_have_attribute("aria-busy", "true")
    return page, pid, table


def usage_text(page) -> str:
    heading = page.get_by_role("heading", name="Speicherverbrauch", exact=True)
    card = page.locator("section, div").filter(has=heading).filter(has_text=re.compile(r"Dateien\s*\d")).last
    expect(card).to_be_visible()
    return card.inner_text()


@case
def i01(ctx: Ctx) -> Outcome:
    page, _, table = open_files(ctx, MUSTER)
    want = ["angebot-2026-11.pdf", "firmenlogo.png", "kontakte-export.csv", "protokoll-kickoff.txt"]
    expect(row(table, want[0])).to_be_visible()
    listed = table.inner_text()
    missing = [n for n in want if n not in listed]
    usage = usage_text(page)
    problems = []
    if missing:
        problems.append("Dateien fehlen: " + ", ".join(missing))
    if not re.search(r"Speicher\s.*\d", usage, re.S) or "Dateien" not in usage:
        problems.append("Speicherverbrauch fehlt")
    if page.get_by_role("heading", name="Speicherverbrauch").first.bounding_box()["y"] > table.bounding_box()["y"]:
        problems.append("Speicherverbrauch steht nicht über der Liste")
    return fail(ctx, page, "; ".join(problems)) if problems else passed()


def throttle(page, bytes_per_second: int) -> None:
    cdp = page.context.new_cdp_session(page)
    cdp.send("Network.enable")
    cdp.send(
        "Network.emulateNetworkConditions",
        {"offline": False, "latency": 0, "downloadThroughput": -1, "uploadThroughput": bytes_per_second},
    )


@case
def i02(ctx: Ctx) -> Outcome:
    pid = ctx.product()["id"]
    tid = tenant_id(ctx, pid, MUSTER)
    for f in files_api(ctx, pid, tid):  # leftovers of an earlier run
        if f["name"] in (UPLOAD_NAME, "qa-lauf2-umbenannt.txt"):
            ctx.api().delete(f"/v1/products/{pid}/tenants/{tid}/files/{f['id']}")
    data = ("QA-Testdatei Lauf 2 (Test)\n" * 12_000).encode()  # ~300 KiB, so progress is visible
    source = write_file(UPLOAD_NAME, data)
    page, _, table = open_files(ctx, MUSTER)
    page.get_by_role("button", name="Datei hochladen").click()
    dialog = page.get_by_role("dialog", name="Datei hochladen")
    dialog.locator("input[type=file]").set_input_files(str(source))
    throttle(page, 100_000)
    dialog.get_by_role("button", name="Hochladen").click()
    progress = dialog.get_by_text(re.compile(r"Wird hochgeladen: \d+ %"))
    try:
        expect(progress).to_be_visible(timeout=5_000)
        saw_progress = True
    except AssertionError:
        saw_progress = False
    throttle(page, -1)
    toast(page, f"{UPLOAD_NAME} hochgeladen")
    if not saw_progress:
        return fail(ctx, page, "Beim Hochladen wurde kein Fortschritt angezeigt.")
    target = row(table, UPLOAD_NAME)
    expect(target).to_be_visible()
    target.get_by_role("button", name=f"Aktionen für {UPLOAD_NAME}").click()
    with page.expect_download() as dl:
        page.get_by_role("menuitem", name="Herunterladen").click()
    got = Path(dl.value.path()).read_bytes()
    if hashlib.sha256(got).digest() != hashlib.sha256(data).digest():
        return fail(ctx, page, f"Heruntergeladene Datei weicht ab ({len(got)} statt {len(data)} Byte).")
    return passed()


@case
def i03(ctx: Ctx) -> Outcome:
    pid = ctx.product()["id"]
    tid = tenant_id(ctx, pid, MUSTER)
    if not any(f["name"] == UPLOAD_NAME for f in files_api(ctx, pid, tid)):
        return manual("Die in I-02 hochgeladene Datei fehlt; I-03 braucht sie.")
    page, _, table = open_files(ctx, MUSTER)
    before = usage_text(page)
    row(table, UPLOAD_NAME).get_by_role("button", name=UPLOAD_NAME, exact=True).click()
    drawer = page.get_by_role("dialog", name=UPLOAD_NAME)
    drawer.get_by_role("button", name="Name und Labels bearbeiten").click()
    form = drawer.get_by_role("form", name="Datei bearbeiten")
    form.get_by_role("textbox", name="Name").fill("qa-lauf2-umbenannt.txt")
    form.get_by_role("button", name="Änderungen speichern").click()
    toast(page, "Datei aktualisiert")
    listed = page.locator("table")
    expect(row(listed, "qa-lauf2-umbenannt.txt")).to_be_visible()
    expect(row(listed, UPLOAD_NAME)).to_have_count(0)

    drawer = page.get_by_role("dialog", name="qa-lauf2-umbenannt.txt")
    expect(drawer).to_be_visible()
    drawer.get_by_role("button", name="Datei löschen").click()
    page.get_by_role("dialog", name="Datei löschen?").get_by_role("button", name="Datei löschen").click()
    toast(page, "qa-lauf2-umbenannt.txt gelöscht")
    expect(row(listed, "qa-lauf2-umbenannt.txt")).to_have_count(0)
    expect(page.get_by_role("dialog", name="qa-lauf2-umbenannt.txt")).to_be_hidden()
    deadline = time.monotonic() + 10
    after = usage_text(page)
    while after == before and time.monotonic() < deadline:
        page.wait_for_timeout(500)
        after = usage_text(page)
    used = [re.search(r"Dateien\s*(\d+)", t) for t in (before, after)]
    if after == before or not all(used) or int(used[1].group(1)) >= int(used[0].group(1)):
        return fail(ctx, page, "Speicherverbrauch sinkt nach dem Löschen nicht.")
    return passed()


@case
def i04(ctx: Ctx) -> Outcome:
    source = write_file("test.exe", b"Nur eine Textdatei (Test).\n")
    page, pid, table = open_files(ctx, MUSTER)
    tid = tenant_id(ctx, pid, MUSTER)
    page.get_by_role("button", name="Datei hochladen").click()
    dialog = page.get_by_role("dialog", name="Datei hochladen")
    dialog.locator("input[type=file]").set_input_files(str(source))
    dialog.get_by_role("button", name="Hochladen").click()
    refused = dialog.get_by_text("Dateityp nicht zulässig")
    stored = toasts(page).get_by_text("test.exe hochgeladen")
    expect(refused.or_(stored).first).to_be_visible()
    if refused.is_visible():
        if any(f["name"] == "test.exe" for f in files_api(ctx, pid, tid)):
            return fail(ctx, page, "Meldung „Dateityp nicht zulässig“, aber test.exe ist trotzdem gespeichert.")
        return passed("abgelehnt: Dateityp nicht zulässig")
    # Stored: it must be clearly marked as inert.
    row(table, "test.exe").first.get_by_role("button", name="test.exe", exact=True).click()
    drawer = page.get_by_role("dialog", name="test.exe")
    inert = drawer.get_by_text("Inert gespeichert").is_visible()
    shot = ctx.shot(page)
    for f in files_api(ctx, pid, tid):
        if f["name"] == "test.exe":
            ctx.api().delete(f"/v1/products/{pid}/tenants/{tid}/files/{f['id']}")
    if not inert:
        out = failed("test.exe wurde ohne Hinweis normal gespeichert.")
        out.screenshot = shot
        return out
    return passed("als inert gespeichert")


@case
def i05(ctx: Ctx) -> Outcome:
    page, pid, _ = open_files(ctx, GRENZFALL)
    tid = tenant_id(ctx, pid, GRENZFALL)
    usage = usage_text(page)
    if not re.search(r"Dateien\s*3 von 3", usage):
        return fail(ctx, page, "Speicherverbrauch zeigt nicht 3 von 3 Dateien: " + usage.replace("\n", " ")[:200])
    count = len(files_api(ctx, pid, tid))
    source = write_file("klein.txt", b"Kleine Testdatei (Test).\n")
    page.get_by_role("button", name="Datei hochladen").click()
    dialog = page.get_by_role("dialog", name="Datei hochladen")
    dialog.locator("input[type=file]").set_input_files(str(source))
    dialog.get_by_role("button", name="Hochladen").click()
    alert = dialog.get_by_role("alert").filter(has_text="Speicherkontingent erschöpft")
    try:
        expect(alert).to_be_visible()
    except AssertionError:
        if len(files_api(ctx, pid, tid)) > count:
            return fail(ctx, page, "Die Datei wurde trotz vollem Kontingent gespeichert.")
        return fail(ctx, page, "Upload abgelehnt, aber ohne „Speicherkontingent erschöpft“.")
    if len(files_api(ctx, pid, tid)) != count:
        return fail(ctx, page, "Meldung erscheint, aber die Datei wurde gespeichert.")
    return passed()


# ---- J: jobs and schedules -----------------------------------------------------------------


@case
def j01(ctx: Ctx) -> Outcome:
    page, _ = open_product(ctx, "Jobs")
    table = page.get_by_role("region", name="Jobs")
    expect(row(table, "crm.kontakte.import").first).to_be_visible()
    rows = [cells(r) for r in table.locator("tbody tr").all()]
    status = {}
    for c in rows:
        status.setdefault(c[0].split("\n")[0], set()).add(c[1])
    problems = []
    for kind in ("crm.kontakte.import", "berichte.monatsbericht", "daten.reindex"):
        if "Wartend" not in status.get(kind, set()):
            problems.append(f"{kind}: {sorted(status.get(kind, [])) or 'fehlt'}")
    if "Abgebrochen" not in status.get("crm.sync.extern", set()):
        problems.append(f"crm.sync.extern: {sorted(status.get('crm.sync.extern', [])) or 'fehlt'}")
    if not any(k.startswith("axentra.") for k in status):
        problems.append("keine Axentra-eigenen Jobs")
    return fail(ctx, page, "; ".join(problems)) if problems else passed()


@case
def j02(ctx: Ctx) -> Outcome:
    page, _ = open_product(ctx, "Jobs")
    page.get_by_role("button", name="Job einreihen").click()
    dialog = page.get_by_role("dialog", name="Job einreihen")
    dialog.get_by_role("textbox", name="Art").fill("berichte.monatsbericht")
    pick_tenant(page, MUSTER, dialog)
    dialog.get_by_role("spinbutton", name="Verzögerung (Sekunden)").fill("3600")
    with page.expect_response(lambda r: r.request.method == "POST" and r.url.endswith("/jobs")) as resp:
        dialog.get_by_role("button", name="Einreihen").click()
    job_id = resp.value.json()["id"]
    toast(page, "Job „berichte.monatsbericht“ eingereiht")
    # Studio opens the new job's page.
    expect(page.get_by_role("heading", name="berichte.monatsbericht", level=1)).to_be_visible()
    expect(page.get_by_text(job_id).first).to_be_visible()
    header = page.locator("header, div").filter(has=page.get_by_role("heading", level=1)).last
    expect(header).to_contain_text("Wartend")
    page.get_by_role("button", name="Job abbrechen").click()
    page.get_by_role("dialog", name="Job abbrechen").get_by_role("button", name="Job abbrechen").click()
    toast(page, "Job abgebrochen")
    expect(header).to_contain_text("Abgebrochen")
    # Back to the list through the sidebar, as a tester would (this once kept showing the detail page).
    page.get_by_role("navigation").get_by_role("link", name="Jobs", exact=True).locator("visible=true").first.click()
    expect(page).to_have_url(re.compile(r"/jobs$"))
    expect(page.get_by_role("heading", name="Jobs", level=1)).to_be_visible()
    expect(row(page.get_by_role("region", name="Jobs"), job_id)).to_contain_text("Abgebrochen")
    return passed()


@case
def j03(ctx: Ctx) -> Outcome:
    pid = ctx.product()["id"]
    api = ctx.api()

    def ours() -> list[dict]:
        _, body = api.get(f"/v1/products/{pid}/schedules?limit=200")
        return [s for s in body["items"] if s["name"] == SCHEDULE_NAME]

    for s in ours():  # leftovers of an earlier run
        api.delete(f"/v1/products/{pid}/schedules/{s['id']}")
    page, _ = open_product(ctx, "Zeitpläne")
    table = page.get_by_role("region", name="Zeitpläne")
    expect(row(table, "Monatsbericht (Test)")).to_be_visible()
    problems = []
    for name in ("Monatsbericht (Test)", "Naechtlicher Kontakt-Import (Test)", "Index auffrischen (Test, pausiert)"):
        if row(table, name).count() != 1:
            problems.append(f"„{name}“ fehlt")
    paused = row(table, "Index auffrischen (Test, pausiert)")
    if paused.count() == 1 and cells(paused)[2] != "Deaktiviert":
        problems.append("„Index auffrischen“ ist nicht deaktiviert")
    if problems:
        return fail(ctx, page, "; ".join(problems))
    try:
        page.get_by_role("button", name="Neuer Zeitplan").click()
        dialog = page.get_by_role("dialog", name="Neuer Zeitplan")
        dialog.get_by_role("textbox", name="Name").fill(SCHEDULE_NAME)
        dialog.get_by_role("textbox", name="Art").fill("berichte.monatsbericht")
        dialog.get_by_role("radio", name="Cron-Ausdruck").check()
        dialog.get_by_role("group", name="Häufige Ausdrücke").get_by_role("button", name="Stündlich").click()
        expect(dialog.get_by_role("textbox", name="Cron-Ausdruck")).to_have_value("0 * * * *")
        dialog.get_by_role("button", name="Zeitplan anlegen").click()
        toast(page, f"Zeitplan „{SCHEDULE_NAME}“ angelegt")
        new = row(table, SCHEDULE_NAME)
        expect(new).to_be_visible()
        c = cells(new)
        if not c[2].startswith("Aktiv") or not re.search(r"in \d+ Minute|in einer Stunde|in 1 Stunde", c[3]):
            return fail(ctx, page, f"Neuer Zeitplan: Zustand „{c[2]}“, Nächster Lauf „{c[3]}“")
        new.get_by_role("button", name=f"Aktionen für Zeitplan {SCHEDULE_NAME}").click()
        page.get_by_role("menuitem", name="Deaktivieren").click()
        toast(page, f"Zeitplan „{SCHEDULE_NAME}“ deaktiviert")
        expect(new.locator("td").nth(1)).to_have_text("Deaktiviert")
        if not all(not s["enabled"] for s in ours()):
            return fail(ctx, page, "Zeitplan ist laut API nach „Deaktivieren“ noch aktiv.")
        return passed()
    finally:
        for s in ours():
            api.delete(f"/v1/products/{pid}/schedules/{s['id']}")


# ---- K: events and webhooks ----------------------------------------------------------------


@case
def k01(ctx: Ctx) -> Outcome:
    page, _ = open_product(ctx, "Ereignisse")
    page.get_by_role("tab", name="Ereignisprotokoll").click()
    log = page.get_by_role("region", name="Ereignisprotokoll")
    expect(row(log, "kontakt.erstellt").first).to_be_visible()
    expect(log).not_to_have_attribute("aria-busy", "true")
    # qa.test events are leftovers of K-02 in earlier runs.
    types = [cells(r)[0] for r in log.locator("tbody tr").all()]
    types = [t for t in types if t != "qa.test"]
    want = sorted(
        ["kontakt.erstellt", "kontakt.erstellt", "kontakt.geaendert", "rechnung.erstellt", "angebot.versendet"]
    )
    seeded = sorted(t for t in types if t in want)
    row(log, "kontakt.erstellt").first.get_by_role("button", name="Details zu kontakt.erstellt anzeigen").click()
    drawer = page.get_by_role("dialog", name="kontakt.erstellt")
    expect(drawer).to_contain_text("Ereignisdetails")
    expect(drawer.get_by_role("heading", name="Daten")).to_be_visible()
    data = drawer.inner_text()
    if seeded != want:
        return fail(ctx, page, f"Beispiel-Ereignisse: {', '.join(seeded)}")
    if not re.search(r'"?\w+"?\s*:', data.split("Daten", 1)[-1]):
        return fail(ctx, page, "Die Details zeigen keine Daten.")
    # Besides the seed events only billing system events from the test subscriptions are expected.
    extra = sorted(set(t for t in types if t not in want and not t.startswith("billing.subscription.")))
    if extra:
        return fail(ctx, page, "Unerwartete Ereignisse: " + ", ".join(extra))
    return passed()


@case
def k02(ctx: Ctx) -> Outcome:
    page, pid = open_product(ctx, "Ereignisse")
    page.get_by_role("tab", name="Live").click()
    expect(page.get_by_role("status").filter(has_text=re.compile(r"^Live$"))).to_be_visible()
    second = page.context.new_page()
    second.goto(f"{ctx.base}/p/{pid}/events")
    second.get_by_role("button", name="Ereignis veröffentlichen").click()
    dialog = second.get_by_role("dialog", name="Ereignis veröffentlichen")
    pick_tenant(second, MUSTER, dialog)
    dialog.get_by_role("textbox", name="Typ").fill("qa.test")
    dialog.get_by_role("button", name="Veröffentlichen").click()
    toast(second, "Ereignis „qa.test“ veröffentlicht")
    page.bring_to_front()
    received = page.get_by_role("list", name="Empfangene Ereignisse")
    try:
        expect(received.get_by_text("qa.test").first).to_be_visible(timeout=20_000)
    except AssertionError:
        state = page.get_by_role("status").first.inner_text()
        return fail(ctx, page, f"„qa.test“ erscheint nicht im Live-Tab (Zustand: {state}).")
    return passed()


def open_webhook(ctx: Ctx):
    page, pid = open_product(ctx, "Webhooks")
    row(page, "Buchhaltungssystem (Test, nicht erreichbar)").get_by_role("link").click()
    expect(page.get_by_role("heading", level=1)).to_contain_text("buchhaltung")
    return page, pid


@case
def k03(ctx: Ctx) -> Outcome:
    page, _ = open_webhook(ctx)
    page.get_by_role("tab", name="Zustellungen").click()
    table = page.get_by_role("region", name="Zustellungen")
    expect(table.locator("tbody tr").first).to_be_visible()
    statuses = [cells(r)[1] for r in table.locator("tbody tr").all()]
    allowed = {"Fehlgeschlagen, wird wiederholt", "Endgültig fehlgeschlagen", "Ausstehend"}
    if any(s == "Zugestellt" for s in statuses) or not any(s in allowed - {"Ausstehend"} for s in statuses):
        return fail(ctx, page, "Zustellungsstatus: " + ", ".join(sorted(set(statuses))))
    table.get_by_role("button", name=re.compile(r"^Zustellung dlv_")).first.click()
    drawer = page.get_by_role("dialog").filter(has_text="Webhook-Zustellung")
    expect(drawer.get_by_role("heading", name="Letzter Fehler")).to_be_visible()
    error = drawer.get_by_label("Letzter Fehler").inner_text()
    if "Connection refused" not in error:
        return fail(ctx, page, f"Letzter Fehler: „{error[:120]}“")
    return passed()


@case
def k04(ctx: Ctx) -> Outcome:
    page, pid = open_webhook(ctx)
    page.get_by_role("button", name="Test-Ping senden").click()
    notes = toasts(page)
    expect(notes.get_by_text(re.compile("Test-Ping"))).to_be_visible(timeout=30_000)
    ping = " ".join(notes.all_inner_texts())
    if "Test-Ping fehlgeschlagen" not in ping:
        return fail(ctx, page, f"Test-Ping meldet: {ping.strip()[:150]}")
    reason = ping.split("Test-Ping fehlgeschlagen", 1)[1].strip()
    if len(reason) < 5:
        return fail(ctx, page, "„Test-Ping fehlgeschlagen“ ohne Grund.")
    # Studio opens the ping's delivery; close it and go on with a delivery of a real event.
    ping = page.get_by_role("dialog").filter(has_text="Webhook-Zustellung")
    expect(ping).to_be_visible()
    page.keyboard.press("Escape")
    expect(ping).to_be_hidden()

    # A delivery still being retried cannot be redelivered (409 "already queued"). On a fresh kit the seeded
    # deliveries are still retrying for a few minutes, so wait until one has failed for good.
    webhook_id = re.search(r"whk_\w+", page.url).group(0)
    deliveries = f"/v1/products/{pid}/webhooks/{webhook_id}/deliveries"
    api = ctx.api()
    deadline = time.monotonic() + 300
    while time.monotonic() < deadline:
        items = api.get(deliveries)[1]["items"]
        if any(d["status"] == "dead" and d.get("event_type") != "axentra.ping" for d in items):
            break
        time.sleep(5)
    page.get_by_role("tab", name="Zustellungen").click()
    page.get_by_role("button", name="Aktualisieren").click()
    table = page.get_by_role("region", name="Zustellungen")
    failed_row = (
        table.locator("tbody tr").filter(has_text="Endgültig fehlgeschlagen").filter(has_not_text="axentra.ping").first
    )
    expect(failed_row).to_be_visible()
    delivery_id = re.search(r"dlv_\w+", failed_row.inner_text()).group(0)
    failed_row.get_by_role("button", name=f"Zustellung {delivery_id} anzeigen").click()
    drawer = page.get_by_role("dialog").filter(has_text="Webhook-Zustellung")
    drawer.get_by_role("button", name="Erneut zustellen").click()
    toast(page, "Zustellung erneut eingereiht")
    path = f"{deliveries}/{delivery_id}"
    _, first = api.get(path)
    attempts = first.get("attempts", 0)
    deadline = time.monotonic() + 60
    state = first
    while time.monotonic() < deadline:
        _, state = api.get(path)
        if state.get("status") in ("failed", "dead") and state.get("attempts", 0) > attempts:
            break
        if state.get("status") == "succeeded":
            break
        time.sleep(2)
    if state.get("status") not in ("failed", "dead"):
        return fail(
            ctx, page, f"Nach „Erneut zustellen“: Status {state.get('status')}, Versuche {state.get('attempts')}"
        )
    page.keyboard.press("Escape")
    expect(drawer).to_be_hidden()
    page.get_by_role("button", name="Aktualisieren").click()
    expect(row(table, delivery_id)).to_contain_text(re.compile("fehlgeschlagen", re.I))
    return passed(f"Grund: {reason[:80]}")


# ---- L: usage and quotas -------------------------------------------------------------------


@case
def l01(ctx: Ctx) -> Outcome:
    page, _ = open_product(ctx, "Nutzung")
    page.get_by_role("tab", name="Übersicht").click()
    page.get_by_role("tabpanel", name="Übersicht").get_by_role("combobox", name="Zähler").select_option(
        label="API-Aufrufe (Test) (api_calls)"
    )
    chart = page.get_by_role("img", name=re.compile(r"^API-Aufrufe \(Test\), alle Mandanten: Balkendiagramm"))
    expect(chart).to_be_visible()
    bars = chart.locator("path")
    expect(bars.first).to_be_attached()
    page.get_by_text("Datentabelle anzeigen").click()
    table = page.get_by_role("region", name="API-Aufrufe (Test), alle Mandanten pro Tag")
    expect(table).to_be_visible()
    values = []
    for r in table.locator("tbody tr").all():
        values.append(int(cells(r)[1].replace(".", "")))
    nonzero = [v for v in values if v > 0]
    totals = page.get_by_role("region", name="Summen pro Mandant")
    expect(totals.locator("tbody tr").first).to_be_visible()
    tenants = totals.locator("tbody tr").count()
    total_label = re.search(r"Gesamt ([\d.]+)", chart.get_attribute("aria-label") or "")
    problems = []
    if len(nonzero) < 5 or bars.count() != len(nonzero):
        problems.append(f"{bars.count()} Balken, {len(nonzero)} Tage mit Werten in der Tabelle")
    if not total_label or int(total_label.group(1).replace(".", "")) != sum(values):
        problems.append("Summe im Diagramm passt nicht zur Datentabelle")
    if tenants < 2:
        problems.append(f"Summen pro Mandant: nur {tenants} Mandant(en)")
    return fail(ctx, page, "; ".join(problems)) if problems else passed()


def tenant_usage(ctx: Ctx, tenant: str):
    page, pid = open_product(ctx, "Nutzung")
    page.get_by_role("tab", name="Nutzung pro Mandant").click()
    panel = page.get_by_role("tabpanel", name="Nutzung pro Mandant")
    pick_tenant(page, tenant, panel)
    return page, pid, panel


@case
def l02(ctx: Ctx) -> Outcome:
    page, pid, panel = tenant_usage(ctx, "Probe & Partner (Test)")
    card = meter_card(panel, "Erstellte Berichte (Test)")
    expect(card).to_contain_text("Berichte genutzt")
    before = card.inner_text()
    limit_before = re.search(r"von ([\d.]+) Berichte genutzt", before)
    source_before = "Standard des Zählers" if "Standard des Zählers" in before else "Aus dem Tarif"
    if "Mandanten-Überschreibung" in before:
        return fail(ctx, page, "Probe & Partner hat schon eine Überschreibung für „berichte“ (alter Lauf?).")
    try:
        card.get_by_role("button", name="Überschreibung festlegen").click()
        dialog = page.get_by_role("dialog", name="Kontingent-Überschreibung für Erstellte Berichte (Test)")
        dialog.get_by_role("textbox", name="Limit").fill("5")
        dialog.get_by_role("button", name="Überschreibung speichern").click()
        toast(page, "Kontingent-Überschreibung gespeichert")
        expect(card).to_contain_text("von 5 Berichte genutzt")
        expect(card).to_contain_text("Mandanten-Überschreibung")
        card.get_by_role("button", name="Überschreibung entfernen").click()
        page.get_by_role("dialog", name="Kontingent-Überschreibung entfernen?").get_by_role(
            "button", name="Überschreibung entfernen"
        ).click()
        toast(page, "Kontingent-Überschreibung entfernt")
        expect(card).not_to_contain_text("Mandanten-Überschreibung")
        after = card.inner_text()
        limit_after = re.search(r"von ([\d.]+) Berichte genutzt", after)
        if not limit_before or not limit_after or limit_after.group(1) != limit_before.group(1):
            return fail(ctx, page, "Nach dem Entfernen nicht wieder das vorherige Limit.")
        if source_before not in after:
            return fail(ctx, page, f"Nach dem Entfernen Herkunft nicht wieder „{source_before}“.")
        return passed()
    finally:
        tid = tenant_id(ctx, pid, "Probe & Partner (Test)")
        api = ctx.api()
        _, quotas = api.get(f"/v1/products/{pid}/tenants/{tid}/usage/quotas")
        items = quotas["items"] if isinstance(quotas, dict) else quotas or []
        if any(q.get("meter") == "berichte" for q in items):
            api.delete(f"/v1/products/{pid}/tenants/{tid}/usage/quotas/berichte")


@case
def l03(ctx: Ctx) -> Outcome:
    page, _, panel = tenant_usage(ctx, GRENZFALL)
    api_calls = meter_card(panel, "API-Aufrufe (Test)")
    expect(api_calls).to_contain_text("Aufrufe genutzt")
    text = api_calls.inner_text()
    m = re.search(r"([\d.]+) von ([\d.]+) Aufrufe genutzt \((\d+) %\)", text)
    problems = []
    if not m or int(m.group(3)) <= 100 or "Über dem Limit" not in text:
        problems.append("Grenzfall api_calls: " + text.replace("\n", " ")[:160])
    elif not (1100 <= int(m.group(1).replace(".", "")) <= 1300 and m.group(2) == "1.000"):
        problems.append(f"Grenzfall api_calls: {m.group(1)} von {m.group(2)}")
    pick_tenant(page, "Beispiel AG (Test)", panel)
    reports = meter_card(panel, "Erstellte Berichte (Test)")
    expect(reports).to_contain_text("Berichte genutzt")
    expect(panel.get_by_text(re.compile("von 1.000 Aufrufe"))).to_have_count(0)
    text = reports.inner_text()
    if "18 von 20 Berichte genutzt" not in text:
        problems.append("Beispiel AG berichte: " + text.replace("\n", " ")[:160])
    return fail(ctx, page, "; ".join(problems)) if problems else passed()


CASES = {
    "G-01": g01,
    "G-02": g02,
    "G-03": g03,
    "H-01": h01,
    "H-02": h02,
    "H-03": h03,
    "H-04": h04,
    "H-05": h05,
    "I-01": i01,
    "I-02": i02,
    "I-03": i03,
    "I-04": i04,
    "I-05": i05,
    "J-01": j01,
    "J-02": j02,
    "J-03": j03,
    "K-01": k01,
    "K-02": k02,
    "K-03": k03,
    "K-04": k04,
    "L-01": l01,
    "L-02": l02,
    "L-03": l03,
}
