"""Fill a fresh QA kit installation with clearly synthetic test data, through Axentra's public HTTP API.

``seed(base_url, config_path, venv_python, out_dir) -> dict``

1. First platform admin through the real first-run flow: ``axentra admin setup-token`` (CLI) and
   ``POST /v1/auth/setup``.
2. Password accounts for the other test users: Axentra has no HTTP API for that (see
   create_test_users.py), so one library call creates them; everything else goes over HTTP.
3. Products, tenants, operators, members, invitations (one accepted by its user over the API),
   custom roles, API keys, records, files, search documents, usage meters/events/quotas, billing
   plans and subscriptions (fake provider, completed with signed provider webhooks), jobs,
   schedules, events, webhooks (to an unreachable local port), notification templates, emails and
   inbox messages. Audit entries come from all of that.
4. Writes ``out_dir/testbenutzer.json`` and returns ``{"users": [...], "summary": {...}}``.

Re-running on an already seeded installation changes nothing and only rewrites the user list.
Must run with the venv Python (needs httpx). Prints no secrets except the shared test password.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import struct
import subprocess
import sys
import time
import zlib
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import httpx

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from bootstrap import axentra_cli

PASSWORD = "Axentra-Test-2026!"
#: An unreachable local port: webhook deliveries fail with "connection refused".
DEAD_WEBHOOK_BASE = "http://127.0.0.1:9/qa-webhook-empfaenger"

ADMIN = {"email": "alex.admin@example.com", "name": "Alex Admin (Test)"}

#: Every test user: email, name, role description (German, shown to the tester), what to test.
USERS: list[dict[str, Any]] = [
    {
        **ADMIN,
        "roles": ["Plattform-Administrator (platform_admin)"],
        "testen": "Alles: Produkte anlegen/archivieren, Benutzer sperren, Einstellungen, Audit-Log.",
    },
    {
        "email": "paula.plattform@example.com",
        "name": "Paula Plattform (Test)",
        "roles": ["Plattform-Betrachterin (platform_viewer)"],
        "testen": "Sieht alle Produkte nur lesend; jede Aenderung muss abgelehnt werden.",
    },
    {
        "email": "otto.inhaber@example.com",
        "name": "Otto Inhaber (Test)",
        "roles": ["Produkt-Inhaber Beispiel-CRM (Test) (product_owner)"],
        "testen": "Produkt-Team verwalten, eigene Berechtigungen deklarieren; sieht Beispiel-Shop nicht.",
    },
    {
        "email": "ole.operator@example.com",
        "name": "Ole Operator (Test)",
        "roles": ["Produkt-Admin Beispiel-CRM (Test) (product_admin)"],
        "testen": "Mandanten, Rollen, API-Schluessel, Daten verwalten; Produkt-Team NICHT verwalten.",
    },
    {
        "email": "sabine.support@example.com",
        "name": "Sabine Support (Test)",
        "roles": ["Support Beispiel-CRM (Test) (product_support)"],
        "testen": "Liest alles im Produkt; darf Mitglieder nur bis zur eigenen Berechtigung verwalten.",
    },
    {
        "email": "bea.abrechnung@example.com",
        "name": "Bea Abrechnung (Test)",
        "roles": ["Eigene Produktrolle 'Abrechnung (Test)' in Beispiel-CRM (Test)"],
        "testen": "Eigene Rolle: Zaehler, Tarife und Abos pflegen; keine Mandanten anlegen.",
    },
    {
        "email": "maria.muster@example.com",
        "name": "Maria Muster (Test)",
        "roles": ["Inhaberin Muster GmbH (Test) (tenant_owner)"],
        "testen": "Sicht einer Mandanten-Inhaberin: Mitglieder, Daten, Dateien, Abo, Posteingang.",
    },
    {
        "email": "jonas.beispiel@example.com",
        "name": "Jonas Beispiel (Test)",
        "roles": ["Admin Muster GmbH (Test) (tenant_admin)"],
        "testen": "Mitglieder und Daten verwalten; Inhaber-Rolle darf er nicht vergeben.",
    },
    {
        "email": "lena.demo@example.com",
        "name": "Lena Demo (Test)",
        "roles": ["Mitglied Muster GmbH (Test) (member)", "Mitglied Demo Handwerk KG (Test) (member)"],
        "testen": "Zwei Mandanten: Wechsel zwischen Mandanten, normale Mitgliedsrechte.",
    },
    {
        "email": "tobias.test@example.com",
        "name": "Tobias Test (Test)",
        "roles": ["Betrachter Muster GmbH (Test) (viewer)", "KONTO GESPERRT"],
        "testen": "Anmeldung muss scheitern (Konto gesperrt). Als Admin entsperren und erneut probieren.",
    },
    {
        "email": "karin.kunde@example.com",
        "name": "Karin Kunde (Test)",
        "roles": ["Inhaberin Beispiel AG (Test) (tenant_owner), per angenommener Einladung"],
        "testen": "Mitgliedschaft entstand durch eine angenommene Einladung; Abo mit Testphase.",
    },
    {
        "email": "sven.service@example.com",
        "name": "Sven Service (Test)",
        "roles": ["Eigene Mandantenrolle 'Support-Mitarbeiter (Test)' in Muster GmbH (Test)"],
        "testen": "Eigene Mandantenrolle: darf lesen, aber nichts aendern.",
    },
    {
        "email": "frieda.verein@example.com",
        "name": "Frieda Verein (Test)",
        "roles": ["Inhaberin Musterstadt e.V. (Test) (tenant_owner), Mandant GESPERRT"],
        "testen": "Mandant ist gesperrt: Zugriff auf dessen Daten muss verweigert werden.",
    },
    {
        "email": "markus.laden@example.com",
        "name": "Markus Laden (Test)",
        "roles": ["Inhaber Musterladen OHG (Test) im Beispiel-Shop (Test) (tenant_owner)"],
        "testen": "Zweites Produkt; sieht nichts vom Beispiel-CRM.",
    },
    {
        "email": "erik.ohne@example.com",
        "name": "Erik Ohne-Mandant (Test)",
        "roles": ["keine Rolle"],
        "testen": "Benutzer ohne Produkt und ohne Mandant: leere Oberflaeche, keine Daten.",
    },
]
#: Created with POST /v1/users/external: no password, cannot log in (no identity provider in the kit).
SSO_USER = {
    "email": "sso.nutzer@example.com",
    "name": "SSO Nutzer (Test)",
    "provider": "qa-sso-test",
    "subject": "qa-sso-test-0001",
}


class Api:
    """A logged-in browser-like client: session cookie, CSRF header and same-origin Origin header."""

    def __init__(self, base: str) -> None:
        self.base = base.rstrip("/")
        self.http = httpx.Client(base_url=self.base, timeout=30, headers={"Origin": self.base})
        self.csrf = ""

    def close(self) -> None:
        self.http.close()

    def _session(self, data: dict[str, Any]) -> None:
        self.csrf = data["csrf_token"]

    def login(self, email: str, password: str = PASSWORD) -> None:
        self._session(self.call("POST", "/v1/auth/login/password", {"email": email, "password": password}))

    def call(
        self,
        method: str,
        path: str,
        body: Any = None,
        *,
        ok: tuple[int, ...] = (),
        headers: dict[str, str] | None = None,
        **kw: Any,
    ) -> Any:
        h = dict(headers or {})
        if method != "GET" and self.csrf:
            h["X-Axentra-CSRF"] = self.csrf
        if body is not None:
            kw["json"] = body
        r = self.http.request(method, path, headers=h, **kw)
        if r.status_code >= 400 and r.status_code not in ok:
            raise RuntimeError(f"{method} {path} -> {r.status_code} {r.text[:500]}")
        if not r.content:
            return None
        try:
            return r.json()
        except ValueError:
            return r.text

    def get(self, path: str, **kw: Any) -> Any:
        return self.call("GET", path, **kw)

    def try_post(self, path: str, body: Any = None, **kw: Any) -> int:
        """POST that is expected to be refused; returns the HTTP status instead of raising."""
        if body is not None:
            kw["json"] = body
        headers = {"X-Axentra-CSRF": self.csrf, **kw.pop("headers", {})}
        return self.http.post(path, headers=headers, **kw).status_code

    def post(self, path: str, body: Any = None, **kw: Any) -> Any:
        return self.call("POST", path, body, **kw)

    def patch(self, path: str, body: Any, **kw: Any) -> Any:
        return self.call("PATCH", path, body, **kw)

    def put(self, path: str, body: Any, **kw: Any) -> Any:
        return self.call("PUT", path, body, **kw)

    def delete(self, path: str, **kw: Any) -> Any:
        return self.call("DELETE", path, **kw)


# -- small synthetic files -----------------------------------------------------------------------


def _pdf(text: str) -> bytes:
    """A tiny valid one-page PDF showing ``text``."""
    stream = f"BT /F1 18 Tf 72 720 Td ({text}) Tj ET".encode("latin-1")
    objs = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R"
        b" /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, body in enumerate(objs, 1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return bytes(out)


def _png(width: int = 64, height: int = 64) -> bytes:
    """A small valid PNG (a two-colour test pattern)."""
    rows = b""
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            row += bytes((40, 90, 200)) if (x // 8 + y // 8) % 2 else bytes((240, 240, 240))
        rows += bytes(row)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(rows)) + chunk(b"IEND", b"")


# -- helpers ---------------------------------------------------------------------------------------


def _iso(dt: datetime) -> str:
    return dt.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _webhook_secret(config_path: Path) -> str:
    import tomllib

    cfg = tomllib.loads(Path(config_path).read_text(encoding="utf-8"))
    ref = cfg["billing"]["webhook_secret_ref"]
    return Path(ref.removeprefix("file:")).read_text(encoding="utf-8").strip()


def _billing_event(api: Api, secret: str, event_id: str, event_type: str, obj: dict[str, Any]) -> str:
    """POST a signed event of the fake payment provider (Stripe signature scheme) to the public webhook."""
    now = int(time.time())
    body = json.dumps(
        {"id": event_id, "object": "event", "type": event_type, "created": now, "data": {"object": obj}},
        separators=(",", ":"),
    ).encode()
    mac = hmac.new(secret.encode(), f"{now}.".encode() + body, hashlib.sha256).hexdigest()
    r = api.http.post(
        "/v1/billing/webhooks/fake",
        content=body,
        headers={"Stripe-Signature": f"t={now},v1={mac}", "Content-Type": "application/json"},
    )
    if r.status_code != 200:
        raise RuntimeError(f"billing webhook {event_type} -> {r.status_code} {r.text[:300]}")
    return str(r.json()["outcome"])


def _create_password_users(config_path: Path, venv_python: Path) -> dict[str, str]:
    people = [
        {"email": u["email"], "name": u["name"], "password": PASSWORD, "locale": "de"}
        for u in USERS
        if u["email"] != ADMIN["email"]
    ]
    proc = subprocess.run(
        [str(venv_python), str(HERE / "create_test_users.py"), "--config", str(config_path)],
        input=json.dumps(people),
        capture_output=True,
        text=True,
        errors="replace",
    )
    if proc.returncode != 0:
        raise RuntimeError(f"creating test accounts failed:\n{proc.stderr.strip()[-2000:]}")
    return dict(json.loads(proc.stdout))


def _write_users(out_dir: Path, base_url: str) -> list[dict[str, Any]]:
    users = [
        {"email": u["email"], "name": u["name"], "password": PASSWORD, "roles": u["roles"], "testen": u["testen"]}
        for u in USERS
    ]
    users.append(
        {
            "email": SSO_USER["email"],
            "name": SSO_USER["name"],
            "password": None,
            "roles": ["Nur externe Anmeldung (SSO), kein Passwort"],
            "testen": "Kann sich im Testpaket nicht anmelden (kein Identitaetsanbieter). In der Benutzerliste"
            " pruefen: externe Identitaet sichtbar, kein Passwort.",
        }
    )
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = {
        "hinweis": "Nur synthetische Testdaten. Alle Konten teilen sich das Test-Passwort.",
        "adresse": base_url.rstrip("/") + "/",
        "passwort": PASSWORD,
        "benutzer": users,
    }
    (out_dir / "testbenutzer.json").write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return users


# -- the seed --------------------------------------------------------------------------------------


def seed(base_url: str, config_path: Path, venv_python: Path, out_dir: Path) -> dict[str, Any]:
    config_path = Path(config_path).resolve()
    out_dir = Path(out_dir)
    admin = Api(base_url)
    try:
        meta = admin.get("/v1/meta")
        if meta.get("setup_required"):
            token = axentra_cli(venv_python, config_path, "admin", "setup-token").strip()
            admin._session(
                admin.post(
                    "/v1/auth/setup",
                    {
                        "setup_token": token,
                        "email": ADMIN["email"],
                        "name": ADMIN["name"],
                        "password": PASSWORD,
                    },
                )
            )
        else:
            admin.login(ADMIN["email"])
        products = admin.get("/v1/products")
        if any(p["slug"] == "beispiel-crm" for p in products):
            users = _write_users(out_dir, base_url)
            return {"users": users, "summary": {"already_seeded": True}}
        summary = _seed_data(admin, base_url, config_path, venv_python)
        users = _write_users(out_dir, base_url)
        return {"users": users, "summary": summary}
    finally:
        admin.close()


def _seed_data(a: Api, base_url: str, config_path: Path, venv_python: Path) -> dict[str, Any]:
    now = datetime.now(UTC)
    a.patch("/v1/me", {"locale": "de"})
    uid = _create_password_users(config_path, venv_python)
    uid[ADMIN["email"]] = a.get("/v1/auth/session")["user"]["id"]

    # Platform viewer.
    a.patch(f"/v1/users/{uid['paula.plattform@example.com']}", {"platform_role": "platform_viewer"})
    # SSO-only user (external identity, no password).
    sso = a.post(
        "/v1/users/external",
        {
            "provider": SSO_USER["provider"],
            "subject": SSO_USER["subject"],
            "email": SSO_USER["email"],
            "email_verified": True,
            "name": SSO_USER["name"],
        },
    )
    uid[SSO_USER["email"]] = sso["id"]

    # -- products ---------------------------------------------------------------------------------
    crm = a.post(
        "/v1/products",
        {
            "name": "Beispiel-CRM (Test)",
            "slug": "beispiel-crm",
            "description": "Testprodukt: Kundenverwaltung fuer kleine Unternehmen (synthetische Daten).",
        },
    )
    shop = a.post(
        "/v1/products",
        {
            "name": "Beispiel-Shop (Test)",
            "slug": "beispiel-shop",
            "description": "Testprodukt: Online-Shop-Baukasten (synthetische Daten).",
        },
    )
    old = a.post(
        "/v1/products",
        {
            "name": "Altes Testprodukt (Test)",
            "slug": "altes-testprodukt",
            "description": "Archiviertes Testprodukt: nur lesbar, kann wiederhergestellt werden.",
        },
    )
    P = f"/v1/products/{crm['id']}"
    S = f"/v1/products/{shop['id']}"
    a.post(f"/v1/products/{old['id']}/tenants", {"name": "Ehemaliger Kunde GmbH (Test)", "slug": "ehemaliger-kunde"})

    # -- tenants ----------------------------------------------------------------------------------
    T: dict[str, dict[str, Any]] = {}
    for name, slug in [
        ("Muster GmbH (Test)", "muster-gmbh"),
        ("Beispiel AG (Test)", "beispiel-ag"),
        ("Demo Handwerk KG (Test)", "demo-handwerk"),
        ("Musterstadt e.V. (Test)", "musterstadt-ev"),
        ("Probe & Partner (Test)", "probe-partner"),
        ("Grenzfall Datenhungrig GmbH (Test)", "grenzfall-datenhungrig"),
    ]:
        T[slug] = a.post(f"{P}/tenants", {"name": name, "slug": slug})
    laden = a.post(f"{S}/tenants", {"name": "Musterladen OHG (Test)", "slug": "musterladen"})
    a.post(f"{S}/tenants", {"name": "Beispiel Boutique (Test)", "slug": "beispiel-boutique"})
    mg, bag, dhw, ev, pp, gf = (
        T[k]["id"]
        for k in (
            "muster-gmbh",
            "beispiel-ag",
            "demo-handwerk",
            "musterstadt-ev",
            "probe-partner",
            "grenzfall-datenhungrig",
        )
    )
    TM = f"{P}/tenants/{mg}"

    def TP(tid: str) -> str:
        return f"{P}/tenants/{tid}"

    # -- custom roles -----------------------------------------------------------------------------
    a.post(
        f"{P}/roles",
        {
            "key": "support_agent",
            "name": "Support-Mitarbeiter (Test)",
            "scope": "tenant",
            "description": "Liest Daten und Dateien eines Mandanten, um Kundenanfragen zu beantworten.",
            "permissions": ["tenant:read", "members:read", "records:read", "files:read", "usage:read", "billing:read"],
        },
    )
    a.post(
        f"{P}/roles",
        {
            "key": "abrechnung",
            "name": "Abrechnung (Test)",
            "scope": "product",
            "description": "Pflegt Zaehler, Tarife und Abonnements.",
            "permissions": [
                "product:read",
                "tenants:read",
                "tenant:read",
                "usage:read",
                "usage:manage",
                "billing:read",
                "billing:manage",
            ],
        },
    )

    # -- product operators and tenant members -----------------------------------------------------
    a.post(f"{P}/members", {"email": "otto.inhaber@example.com", "role": "product_owner"})
    a.post(f"{P}/members", {"email": "ole.operator@example.com", "role": "product_admin"})
    a.post(f"{P}/members", {"email": "sabine.support@example.com", "role": "product_support"})
    a.post(f"{P}/members", {"email": "bea.abrechnung@example.com", "role": "abrechnung"})
    a.post(f"{TM}/members", {"email": "maria.muster@example.com", "role": "tenant_owner"})
    a.post(f"{TM}/members", {"email": "jonas.beispiel@example.com", "role": "tenant_admin"})
    a.post(f"{TM}/members", {"email": "lena.demo@example.com", "role": "member"})
    a.post(f"{TM}/members", {"email": "tobias.test@example.com", "role": "viewer"})
    a.post(f"{TM}/members", {"email": "sven.service@example.com", "role": "support_agent"})
    a.post(f"{TP(dhw)}/members", {"email": "lena.demo@example.com", "role": "member"})
    # The SSO-only user needs a membership to appear in the product's user list (checklist B-08).
    a.post(f"{TP(dhw)}/members", {"email": SSO_USER["email"], "role": "viewer"})
    a.post(f"{TP(ev)}/members", {"email": "frieda.verein@example.com", "role": "tenant_owner"})
    a.post(f"{S}/tenants/{laden['id']}/members", {"email": "markus.laden@example.com", "role": "tenant_owner"})

    # -- invitations ------------------------------------------------------------------------------
    # Karin joins Beispiel AG by accepting her invitation over the API (the real flow).
    inv = a.post(f"{TP(bag)}/invitations", {"email": "karin.kunde@example.com", "role": "tenant_owner"})
    karin = Api(base_url)
    try:
        karin.login("karin.kunde@example.com")
        karin.post("/v1/invitations/accept", {"token": inv["token"]})
    finally:
        karin.close()
    # Open invitations (the addresses have no account yet).
    a.post(f"{TM}/invitations", {"email": "neue.kollegin@example.com", "role": "member"})
    a.post(f"{TM}/invitations", {"email": "aushilfe@example.com", "role": "viewer"})
    a.post(f"{TP(bag)}/invitations", {"email": "buchhaltung@example.com", "role": "tenant_admin"})
    revoked_inv = a.post(f"{TP(dhw)}/invitations", {"email": "zurueckgezogen@example.com", "role": "member"})
    a.delete(f"{TP(dhw)}/invitations/{revoked_inv['invitation']['id']}")
    a.post(f"{P}/invitations", {"email": "neuer.operator@example.com", "role": "product_viewer"})

    # -- tenant status edge cases (after the invitations, which need active tenants) --------------
    a.patch(f"{TP(ev)}", {"status": "suspended"}, headers={"If-Match": str(T["musterstadt-ev"]["version"])})
    a.patch(f"/v1/users/{uid['tobias.test@example.com']}", {"status": "disabled"})

    # -- API keys ---------------------------------------------------------------------------------
    k_backend = a.post(
        f"{P}/api-keys",
        {
            "name": "crm-backend (Test)",
            "permissions": [
                "tenants:read",
                "records:read",
                "records:write",
                "files:read",
                "files:write",
                "events:publish",
                "usage:record",
                "usage:read",
            ],
        },
    )
    a.post(
        f"{P}/api-keys",
        {
            "name": "import-worker Muster GmbH (Test, laeuft bald ab)",
            "tenant_id": mg,
            "expires_at": _iso(now + timedelta(days=3)),
            "permissions": ["records:read", "records:write", "files:write"],
        },
    )
    a.post(
        f"{P}/api-keys",
        {
            "name": "reporting nur lesend (Test)",
            "permissions": ["tenants:read", "records:read", "usage:read", "billing:read"],
        },
    )
    revoked = a.post(f"{P}/api-keys", {"name": "alter Schluessel (Test, widerrufen)", "permissions": ["records:read"]})
    a.post(f"{P}/api-keys/{revoked['key']['id']}/revoke")
    # Expires a few seconds from now: shown as expired once the seed is done.
    a.post(
        f"{P}/api-keys",
        {
            "name": "Kurzzeit-Schluessel (Test, abgelaufen)",
            "expires_at": _iso(now + timedelta(seconds=20)),
            "permissions": ["records:read"],
        },
    )
    rotated = a.post(f"{P}/api-keys", {"name": "rotierter Schluessel (Test)", "permissions": ["records:read"]})
    a.post(f"{P}/api-keys/{rotated['key']['id']}/rotate", {"grace_seconds": 86400})
    a.post(f"{S}/api-keys", {"name": "shop-frontend (Test)", "permissions": ["records:read"]})

    # -- records (some written with the API key, as a product backend would) ----------------------
    kontakte = [
        {
            "name": "Erika Mustermann (Test)",
            "firma": "Muster GmbH (Test)",
            "email": "erika.mustermann@example.com",
            "status": "kunde",
            "umsatz": 12400,
        },
        {
            "name": "Max Mustermann (Test)",
            "firma": "Muster GmbH (Test)",
            "email": "max.mustermann@example.com",
            "status": "interessent",
            "umsatz": 0,
        },
        {
            "name": "Hans Beispiel (Test)",
            "firma": "Beispiel AG (Test)",
            "email": "hans.beispiel@example.com",
            "status": "kunde",
            "umsatz": 8300,
        },
        {
            "name": "Clara Demo (Test)",
            "firma": "Demo Handwerk KG (Test)",
            "email": "clara.demo@example.com",
            "status": "kunde",
            "umsatz": 2150,
        },
        {
            "name": "Felix Probe (Test)",
            "firma": "Probe & Partner (Test)",
            "email": "felix.probe@example.com",
            "status": "interessent",
            "umsatz": 0,
        },
        {
            "name": "Nora Test (Test)",
            "firma": "Muster GmbH (Test)",
            "email": "nora.test@example.com",
            "status": "ehemalig",
            "umsatz": 990,
        },
    ]
    key_client = httpx.Client(base_url=base_url, timeout=30, headers={"Authorization": f"Bearer {k_backend['secret']}"})
    try:
        for k in kontakte:
            r = key_client.post(f"{TM}/records/kontakte", json=k)
            if r.status_code >= 400:
                raise RuntimeError(f"record via API key -> {r.status_code} {r.text[:300]}")
    finally:
        key_client.close()
    for n in [
        {"titel": "Rueckruf vereinbart", "kontakt": "Erika Mustermann (Test)", "faellig": "2026-11-20"},
        {"titel": "Angebot nachfassen", "kontakt": "Max Mustermann (Test)", "faellig": "2026-11-27"},
    ]:
        a.post(f"{TM}/records/notizen", n)
    for k in kontakte[2:4]:
        a.post(f"{TP(bag)}/records/kontakte", k)
    a.post(f"{TP(bag)}/records/aufgaben", {"titel": "Jahresgespraech (Test)", "erledigt": False})
    for i in range(1, 31):  # a longer list for paging
        a.post(
            f"{TP(gf)}/records/kontakte",
            {
                "name": f"Massen-Kontakt {i:02d} (Test)",
                "firma": "Grenzfall Datenhungrig GmbH (Test)",
                "email": f"massen.kontakt{i:02d}@example.com",
                "status": "interessent",
                "umsatz": i * 10,
            },
        )
    a.post(f"{S}/tenants/{laden['id']}/records/artikel", {"name": "Test-Tasse (Test)", "preis": 9.9, "lager": 12})

    # -- search documents -------------------------------------------------------------------------
    for i, k in enumerate(kontakte[:3] + [kontakte[5]], 1):
        a.put(
            f"{TM}/search/documents/kontakt/k{i}",
            {
                "title": k["name"],
                "body": f"{k['firma']} {k['email']} Status {k['status']}",
                "metadata": {"status": k["status"]},
            },
        )

    # -- files ------------------------------------------------------------------------------------
    def upload(tid: str, name: str, ctype: str, content: bytes, meta: dict[str, Any], prefix: str = P) -> Any:
        return a.post(
            f"{prefix}/tenants/{tid}/files", files={"file": (name, content, ctype)}, data={"metadata": json.dumps(meta)}
        )

    pdf = _pdf("Angebot 2026-11 (Testdaten)")
    upload(mg, "angebot-2026-11.pdf", "application/pdf", pdf, {"art": "angebot", "kunde": "Erika Mustermann (Test)"})
    upload(mg, "firmenlogo.png", "image/png", _png(), {"art": "logo"})
    upload(
        mg,
        "kontakte-export.csv",
        "text/csv",
        b"name;firma;email\nErika Mustermann (Test);Muster GmbH (Test);erika.mustermann@example.com\n",
        {"art": "export"},
    )
    upload(
        mg,
        "protokoll-kickoff.txt",
        "text/plain",
        b"Kickoff-Protokoll (Testdatei)\n- Ziele\n- Termine\n",
        {"art": "protokoll"},
    )
    upload(bag, "vertrag-entwurf.pdf", "application/pdf", _pdf("Vertragsentwurf (Testdaten)"), {"art": "vertrag"})
    # Storage quota nearly used up for Grenzfall Datenhungrig GmbH.
    su = a.get(f"{TP(gf)}/storage/usage")
    a.put(
        f"{TP(gf)}/storage/quota",
        {"quota_bytes": 300 * 1024, "quota_files": 3},
        headers={"If-Match": str(su.get("quota_version") or 0)},
    )
    for i in range(1, 4):
        upload(
            gf, f"grosse-datei-{i}.bin", "application/octet-stream", bytes([i]) * (90 * 1024), {"art": "fuellmaterial"}
        )
    storage_refusal = a.try_post(f"{TP(gf)}/files", files={"file": ("zu-viel.txt", b"one too many", "text/plain")})

    # -- usage ------------------------------------------------------------------------------------
    a.post(
        f"{P}/usage/meters",
        {
            "key": "api_calls",
            "name": "API-Aufrufe (Test)",
            "unit": "Aufrufe",
            "aggregation": "sum",
            "reset_period": "month",
            "default_limit": 10000,
            "default_enforcement": "hard",
            "description": "Aufrufe der CRM-API durch den Mandanten.",
        },
    )
    a.post(
        f"{P}/usage/meters",
        {
            "key": "aktive_benutzer",
            "name": "Aktive Benutzer (Test)",
            "unit": "Benutzer",
            "aggregation": "max",
            "reset_period": "month",
        },
    )
    a.post(
        f"{P}/usage/meters",
        {
            "key": "berichte",
            "name": "Erstellte Berichte (Test)",
            "unit": "Berichte",
            "aggregation": "sum",
            "reset_period": "month",
            "default_limit": 50,
            "default_enforcement": "soft",
        },
    )
    seed_value = 7

    def rnd() -> float:
        nonlocal seed_value
        seed_value = (seed_value * 9301 + 49297) % 233280
        return seed_value / 233280

    n_usage = 0
    for tid, factor in [(mg, 1.0), (bag, 0.6), (dhw, 0.3), (pp, 0.15)]:
        events = []
        for d in range(19, -1, -1):
            at = now - timedelta(days=d, hours=1)
            base = 60 if at.weekday() >= 5 else 260
            events.append(
                {
                    "meter": "api_calls",
                    "quantity": round(base * factor * (0.7 + rnd() * 0.6)),
                    "occurred_at": _iso(at),
                    "enforce": False,
                }
            )
            if d % 3 == 0:
                events.append(
                    {
                        "meter": "aktive_benutzer",
                        "occurred_at": _iso(at),
                        "enforce": False,
                        "quantity": max(1, round(12 * factor * (0.8 + rnd() * 0.4))),
                    }
                )
            if d % 4 == 0:
                events.append(
                    {
                        "meter": "berichte",
                        "quantity": max(1, round(5 * factor)),
                        "occurred_at": _iso(at),
                        "enforce": False,
                    }
                )
        for ev_ in events:
            n_usage += 1
            a.post(f"{TP(tid)}/usage/events", ev_, headers={"Idempotency-Key": f"qa-usage-{n_usage}"})
    # Over quota: Grenzfall Datenhungrig GmbH has a hard limit of 1000 API calls and used more.
    a.put(f"{TP(gf)}/usage/quotas/api_calls", {"limit": 1000, "enforcement": "hard"})
    a.post(
        f"{TP(gf)}/usage/events",
        {"meter": "api_calls", "quantity": 1180, "enforce": False},
        headers={"Idempotency-Key": "qa-usage-over"},
    )
    usage_refusal = a.try_post(
        f"{TP(gf)}/usage/events",
        {"meter": "api_calls", "quantity": 1, "enforce": True},
        headers={"Idempotency-Key": "qa-usage-refused"},
    )
    # Near quota: Beispiel AG may create 20 reports this month (soft) and has created 18.
    a.put(f"{TP(bag)}/usage/quotas/berichte", {"limit": 20, "enforcement": "soft"})
    used = next(m["value"] for m in a.get(f"{TP(bag)}/usage/summary") if m["meter"] == "berichte")
    if used < 18:
        a.post(
            f"{TP(bag)}/usage/events",
            {"meter": "berichte", "quantity": 18 - used, "enforce": False},
            headers={"Idempotency-Key": "qa-usage-near"},
        )
    a.post(f"{TM}/usage/reservations", {"meter": "api_calls", "quantity": 500, "ttl_seconds": 86400})

    # -- billing ----------------------------------------------------------------------------------
    a.post(
        f"{P}/billing/plans",
        {
            "key": "starter",
            "name": "Starter (Test)",
            "description": "Kostenloser Einstieg fuer kleine Teams.",
            "entitlements": {"feature.export": False, "limit.api_calls": 2000},
        },
    )
    prof = a.post(
        f"{P}/billing/plans",
        {
            "key": "professional",
            "name": "Professional (Test)",
            "description": "Fuer wachsende Unternehmen.",
            "trial_days": 14,
            "prices": [
                {"amount_minor": 4900, "currency": "EUR", "interval": "month"},
                {"amount_minor": 49000, "currency": "EUR", "interval": "year"},
            ],
            "entitlements": {
                "feature.export": True,
                "feature.sso": False,
                "limit.api_calls": 50000,
                "limit.berichte": 100,
            },
        },
    )
    a.post(
        f"{P}/billing/plans",
        {
            "key": "enterprise",
            "name": "Enterprise (Test)",
            "description": "Mit Single Sign-on.",
            "prices": [{"amount_minor": 19900, "currency": "EUR", "interval": "month"}],
            "entitlements": {"feature.export": True, "feature.sso": True, "limit.api_calls": None},
        },
    )
    a.post(
        f"{P}/billing/plans",
        {
            "key": "legacy",
            "name": "Basis alt (Test)",
            "active": False,
            "description": "Nicht mehr buchbar.",
            "prices": [{"amount_minor": 1900, "currency": "EUR", "interval": "month"}],
        },
    )
    monthly = next(p for p in prof["prices"] if p["interval"] == "month")["id"]
    secret = _webhook_secret(config_path)
    back = base_url.rstrip("/") + "/"

    def checkout(tid: str, plan: str, price_id: str | None = None) -> dict[str, Any]:
        body: dict[str, Any] = {"plan": plan, "success_url": back, "cancel_url": back}
        if price_id:
            body["price_id"] = price_id
        return a.post(f"{TP(tid)}/billing/checkout", body)

    def complete(cs: dict[str, Any], sub_ref: str) -> None:
        _billing_event(
            a,
            secret,
            f"evt_qa_{sub_ref}_checkout",
            "checkout.session.completed",
            {
                "id": cs["checkout_id"],
                "object": "checkout.session",
                "customer": f"cus_qa_{sub_ref}",
                "subscription": f"sub_qa_{sub_ref}",
                "payment_status": "paid",
            },
        )

    # Muster GmbH: Professional, trial (14 days) after a completed checkout.
    complete(checkout(mg, "professional", monthly), "muster")
    # Beispiel AG: free Starter plan (completes locally) plus an export override.
    checkout(bag, "starter")
    a.put(f"{TP(bag)}/billing/entitlements/overrides", {"entitlements": {"feature.export": True}})
    # Demo Handwerk KG: Enterprise, active.
    complete(checkout(dhw, "enterprise"), "handwerk")
    # Probe & Partner: Enterprise, payment failed -> past_due.
    complete(checkout(pp, "enterprise"), "probe")
    _billing_event(
        a,
        secret,
        "evt_qa_probe_failed",
        "invoice.payment_failed",
        {"id": "in_qa_probe_1", "object": "invoice", "subscription": "sub_qa_probe"},
    )
    # Grenzfall Datenhungrig GmbH: checkout started but never paid -> incomplete.
    checkout(gf, "professional", monthly)

    # -- webhooks (before the events, so deliveries are created) ----------------------------------
    a.post(
        f"{P}/webhooks",
        {
            "url": f"{DEAD_WEBHOOK_BASE}/buchhaltung",
            "event_types": ["kontakt.*", "rechnung.erstellt"],
            "description": "Buchhaltungssystem (Test, nicht erreichbar)",
        },
    )
    a.post(
        f"{P}/webhooks",
        {
            "url": f"{DEAD_WEBHOOK_BASE}/altsystem",
            "event_types": ["kontakt.erstellt"],
            "description": "Altsystem Muster GmbH (Test, nicht erreichbar)",
            "tenant_id": mg,
        },
    )
    a.post(
        f"{P}/webhooks",
        {
            "url": f"{DEAD_WEBHOOK_BASE}/pausiert",
            "event_types": ["*"],
            "description": "Pausierter Empfaenger (Test)",
            "enabled": False,
        },
    )

    # -- events -----------------------------------------------------------------------------------
    for tid, etype, data in [
        (mg, "kontakt.erstellt", {"kontakt": "Erika Mustermann (Test)"}),
        (mg, "kontakt.geaendert", {"kontakt": "Max Mustermann (Test)", "feld": "status"}),
        (bag, "rechnung.erstellt", {"nummer": "RE-TEST-0042", "betrag": 490}),
        (mg, "kontakt.erstellt", {"kontakt": "Nora Test (Test)"}),
        (dhw, "angebot.versendet", {"nummer": "AN-TEST-0107"}),
    ]:
        a.post(f"{TP(tid)}/events", {"type": etype, "data": data})

    # -- jobs and schedules -----------------------------------------------------------------------
    # No worker in the kit handles these product job kinds: they stay queued (or are canceled).
    jobs = []
    for j in [
        {"kind": "crm.kontakte.import", "tenant_id": mg, "payload": {"datei": "kontakte-export.csv"}},
        {"kind": "berichte.monatsbericht", "tenant_id": mg, "payload": {"monat": "2026-10"}},
        {"kind": "berichte.monatsbericht", "tenant_id": bag, "payload": {"monat": "2026-10"}},
        {"kind": "crm.sync.extern", "tenant_id": dhw, "payload": {"ziel": "altes-crm"}, "max_attempts": 1},
        {"kind": "daten.reindex", "payload": {"sammlung": "kontakte"}},
        {"kind": "berichte.quartal", "payload": {"quartal": "2026-Q4"}, "delay_seconds": 86400},
    ]:
        jobs.append(a.post(f"{P}/jobs", j))
    a.post(f"{P}/jobs/{jobs[3]['id']}/cancel")
    a.post(
        f"{P}/schedules",
        {
            "name": "Monatsbericht (Test)",
            "kind": "berichte.monatsbericht",
            "cron": "0 6 1 * *",
            "payload": {"monat": "vormonat"},
        },
    )
    a.post(
        f"{P}/schedules",
        {
            "name": "Naechtlicher Kontakt-Import (Test)",
            "kind": "crm.kontakte.import",
            "cron": "30 2 * * 1-5",
            "tenant_id": mg,
            "payload": {"datei": "nightly.csv"},
        },
    )
    a.post(
        f"{P}/schedules",
        {
            "name": "Index auffrischen (Test, pausiert)",
            "kind": "daten.reindex",
            "interval_seconds": 21600,
            "enabled": False,
        },
    )

    # -- notifications ----------------------------------------------------------------------------
    a.post(
        f"{P}/notify/templates",
        {
            "key": "willkommen",
            "name": "Willkommensmail (Test)",
            "category": "onboarding",
            "description": "Wird nach der ersten Anmeldung gesendet.",
            "variables": ["name", "firma"],
            "sample_data": {"name": "Erika", "firma": "Muster GmbH (Test)"},
            "variants": {
                "de": {
                    "subject": "Willkommen im Beispiel-CRM, {{ name }} (Test)",
                    "text": "Hallo {{ name }},\n\nIhr Zugang bei {{ firma }} ist eingerichtet.\n\n(Testnachricht)",
                    "html": "<h1>Willkommen, {{ name }}!</h1><p>Ihr Zugang bei <strong>{{ firma }}</strong>"
                    " ist eingerichtet.</p><p><em>Testnachricht</em></p>",
                },
                "en": {
                    "subject": "Welcome to Example CRM, {{ name }} (test)",
                    "text": "Hello {{ name }},\n\nyour account at {{ firma }} is ready.\n\n(test message)",
                },
            },
        },
    )
    a.post(
        f"{P}/notify/templates",
        {
            "key": "rechnung.bereit",
            "name": "Rechnung bereit (Test)",
            "category": "transactional",
            "variables": ["nummer", "betrag"],
            "sample_data": {"nummer": "RE-TEST-0042", "betrag": "490,00 EUR"},
            "variants": {
                "de": {
                    "subject": "Rechnung {{ nummer }} liegt bereit (Test)",
                    "text": "Ihre Rechnung {{ nummer }} ueber {{ betrag }} liegt bereit. (Testnachricht)",
                },
                "en": {
                    "subject": "Invoice {{ nummer }} is ready (test)",
                    "text": "Your invoice {{ nummer }} over {{ betrag }} is ready. (test message)",
                },
            },
        },
    )
    a.post(
        f"{P}/notify/templates",
        {
            "key": "hinweis.wartung",
            "name": "Wartungshinweis im Posteingang (Test)",
            "channel": "inbox",
            "category": "system",
            "variables": ["datum"],
            "sample_data": {"datum": "30.11.2026"},
            "variants": {
                "de": {
                    "subject": "Wartung am {{ datum }} (Test)",
                    "text": "Am {{ datum }} ist das Beispiel-CRM kurz nicht erreichbar. (Testnachricht)",
                },
                "en": {
                    "subject": "Maintenance on {{ datum }} (test)",
                    "text": "Example CRM is briefly unavailable on {{ datum }}. (test message)",
                },
            },
        },
    )
    sends = [
        (
            TM,
            "willkommen",
            {"user_id": uid["maria.muster@example.com"]},
            {"name": "Maria", "firma": "Muster GmbH (Test)"},
        ),
        (
            TM,
            "willkommen",
            {"user_id": uid["jonas.beispiel@example.com"]},
            {"name": "Jonas", "firma": "Muster GmbH (Test)"},
        ),
        (
            TP(bag),
            "rechnung.bereit",
            {"email": "buchhaltung@example.com"},
            {"nummer": "RE-TEST-0042", "betrag": "490,00 EUR"},
        ),
        (TM, "hinweis.wartung", {"user_id": uid["maria.muster@example.com"]}, {"datum": "30.11.2026"}),
        (TM, "hinweis.wartung", {"user_id": uid["lena.demo@example.com"]}, {"datum": "30.11.2026"}),
    ]
    for i, (prefix, key, to, variables) in enumerate(sends, 1):
        a.post(
            f"{prefix}/notify/send",
            {"template_key": key, "to": to, "locale": "de", "variables": variables},
            headers={"Idempotency-Key": f"qa-send-{i}"},
        )

    # -- archive the old product last (archived products refuse writes) ---------------------------
    a.post(f"/v1/products/{old['id']}/archive")

    return {
        "products": 3,
        "tenants": len(T) + 3,
        "users": len(USERS) + 1,
        "records": len(kontakte) + 2 + 3 + 30 + 1,
        "files": 8,
        "usage_events": n_usage + 2,
        "refusals_http_status": {"storage_quota": storage_refusal, "usage_quota": usage_refusal},
        "jobs": len(jobs),
        "notifications": len(sends),
    }


if __name__ == "__main__":  # python seed_demo.py <base_url> <config> <out_dir>
    res = seed(sys.argv[1], Path(sys.argv[2]), Path(sys.executable), Path(sys.argv[3]))
    print(json.dumps(res["summary"], indent=2))
