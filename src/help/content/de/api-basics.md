---
title: API-Grundlagen für Entwickler
summary: So rufst du die Axentra-HTTP-API aus deinem eigenen Code auf - Basis-URL, Authentifizierung, Fehler, Anfrage-IDs, Paginierung, Nebenläufigkeit, Ratenbegrenzung, SDKs und Versionierung.
keywords: API, REST, HTTP, Entwickler, Integration, Schnittstelle, Basis-URL, API-Schlüssel, Bearer-Token, Sitzung, CSRF, Fehler, Problem Details, RFC 9457, Anfrage-ID, Request-ID, Paginierung, Cursor, If-Match, ETag, 412, 429, Ratenbegrenzung, Rate Limit, Retry-After, Idempotenz, SDK, Python, TypeScript, OpenAPI, Version
---

Alles, was Studio tut, erledigt es über die öffentliche Axentra-HTTP-API, und deine eigenen
Dienste können das genauso. Dieser Artikel erklärt die Regeln, die für jeden Endpunkt gelten. Der
vollständige, maschinenlesbare Vertrag ist das OpenAPI-Dokument des Servers
(`openapi/axentra-v1.json` im Backend-Repository; auf einem laufenden Server `/v1/openapi.json` und
die interaktive Referenz unter `/v1/docs`, sofern der Betreiber sie aktiviert hat, siehe
[API-Referenz](#api-reference)).

> [!IMPORTANT]
> Um die API aus einem Programm aufzurufen, brauchst du einen API-Schlüssel für dein Produkt. Lege
> ihn unter **Zugriff & API-Schlüssel** › **API-Schlüssel** an ([öffnen](app:apiKeys)); siehe
> [API-Schlüssel](help:api-keys).

## Basis-URL und Format {#base-url}

- Alle Endpunkte liegen unter `/v1` auf der öffentlichen Adresse des Servers, zum Beispiel
  `https://api.example.com/v1/...`. Frag deinen Betreiber nach der Adresse (sie steht als
  `public_url` auf der Seite [Einstellungen](help:settings#settings-tree)).
- Produkt und Mandant sind Teil des Pfads:
  `/v1/products/{product_id}/tenants/{tenant_id}/...`. Die IDs sind undurchsichtige Zeichenketten
  mit Präfix (`prd_`, `ten_`, `usr_`, `key_`, `rec_`, ...); werte sie nicht aus.
- Anfragen und Antworten sind JSON (`application/json`, UTF-8) mit Feldern in `snake_case`.
  Zeitstempel sind RFC 3339 in UTC, zum Beispiel `2026-11-02T09:30:00Z`.
- Clients müssen Antwortfelder ignorieren, die sie nicht kennen: Neue Felder können in jeder
  Nebenversion hinzukommen.

```http
GET /v1/products/prd_01EXAMPLE/tenants?limit=20 HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01EXAMPLE_secretEXAMPLE
Accept: application/json
```

## Authentifizieren {#authentication}

| Aufrufer                                                   | Wie                                                                                                  | CSRF                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------ |
| Ein Dienst, Skript oder Job                                | API-Schlüssel: `Authorization: Bearer axk_<id>_<secret>` (der Header `X-API-Key: axk_...` geht auch) | Nicht nötig                    |
| Eine Browser-App auf einem erlaubten Ursprung (wie Studio) | Sitzungscookie aus der Anmeldung, vom Browser mitgesendet                                            | Pflicht bei ändernden Anfragen |
| Ein CLI oder Werkzeug, das als Benutzer handelt            | Das Sitzungstoken als `Authorization: Bearer <token>`                                                | Nicht nötig                    |

### API-Schlüssel {#api-keys}

Ein API-Schlüssel gehört zu einem Produkt, optional zu einem Mandanten, und hat eine explizite
Liste von Berechtigungen. Er wird nur einmal angezeigt, beim Anlegen oder Erneuern. Bewahre ihn in
einem Secret-Speicher auf, nie im Browser oder in einem Repository. Anfragen mit einem Schlüssel
werden im [Audit-Protokoll](help:audit#event-detail) mit **Art des Akteurs** `api_key`
festgehalten. Details: [API-Schlüssel](help:api-keys).

### Browser-Sitzungen und CSRF {#csrf}

Die Anmeldung (`POST /v1/auth/login/password` oder Single Sign-on) setzt ein `HttpOnly`-
Sitzungscookie. Ist eine Anfrage über dieses Cookie authentifiziert und ändert sie etwas (`POST`,
`PUT`, `PATCH`, `DELETE`), muss sie zusätzlich senden:

- `X-Axentra-CSRF: <csrf_token>`, wobei das Token von `GET /v1/auth/session` (oder aus der Antwort
  der Anmeldung) stammt; halte es nur im Arbeitsspeicher;
- einen `Origin`, der die `public_url` des Servers ist oder in `security.allowed_origins` steht.

Sonst antwortet der Server mit `403` (`missing or invalid CSRF token` oder
`cross-origin request refused`). Anfragen, die mit einem Bearer-Token authentifiziert sind,
brauchen kein CSRF-Token, weil Browser sie nie automatisch senden.

### 401, 403 und 404 {#auth-errors}

- `401 unauthenticated`: keine oder ungültige Zugangsdaten (falscher Schlüssel, widerrufener
  Schlüssel, abgelaufene Sitzung).
- `403 forbidden`: Du bist authentifiziert, aber dir fehlt die Berechtigung.
- `404 not_found`: auch bei Ressourcen **außerhalb deines Bereichs**, zum Beispiel einem Mandanten
  eines anderen Produkts. Der Server verrät nie, ob etwas existiert, das du nicht sehen darfst.

## Fehler {#errors}

Jeder Fehler ist ein Problem-Dokument nach RFC 9457 mit
`Content-Type: application/problem+json` ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)):

```json
{
  "type": "https://axentra.dev/problems/validation_failed",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_failed",
  "detail": "The request is invalid.",
  "request_id": "req_01EXAMPLE",
  "errors": [{ "loc": ["body", "slug"], "msg": "String should have at least 2 characters" }]
}
```

Verwende in deinem Programm `code`; der Wert ist stabil. `title` und `detail` sind für Menschen
gedacht und können sich ändern.

| Status | `code`                                   | Bedeutung                                                                        |
| ------ | ---------------------------------------- | -------------------------------------------------------------------------------- |
| 400    | `bad_request`                            | Fehlerhaft aufgebaute Anfrage                                                    |
| 401    | `unauthenticated`                        | Melde dich an oder sende einen gültigen Schlüssel                                |
| 403    | `forbidden`, `reauthentication_required` | Berechtigung fehlt; oder die Aktion erfordert eine kurz zurückliegende Anmeldung |
| 404    | `not_found`, `module_disabled`           | Nicht vorhanden, nicht deins, oder das Modul ist aus                             |
| 409    | `conflict`, `mode_not_supported`         | Kollidiert mit vorhandenen Daten; oder im Einzelproduktmodus nicht möglich       |
| 412    | `precondition_failed`                    | Die Version in `If-Match` ist veraltet (siehe [Nebenläufigkeit](#concurrency))   |
| 413    | `payload_too_large`                      | Body größer als `max_body_bytes` (oder Datei größer als das Speicherlimit)       |
| 415    | `unsupported_media_type`                 | Inhaltstyp nicht akzeptiert                                                      |
| 422    | `validation_failed`                      | Eingabe ungültig; `errors` nennt jedes Feld (`loc`) und den Grund (`msg`)        |
| 429    | `rate_limited`, `quota_exceeded`         | Zu viele Anfragen, oder ein Nutzungskontingent ist aufgebraucht                  |
| 500    | `internal`                               | Serverfehler; melde die Anfrage-ID                                               |

Problem-Dokumente enthalten nie Geheimnisse, Tokens, SQL oder Stacktraces.

## Anfrage-IDs {#request-ids}

Jede Antwort trägt einen Header `X-Request-ID` und jedes Problem-Dokument eine `request_id`. Du
kannst in `X-Request-ID` eine eigene ID senden (1-64 Zeichen aus `A-Z a-z 0-9 . _ -`); sonst
erzeugt der Server eine (`req_…`). Dieselbe ID erscheint in den Serverprotokollen, in Traces und
als **Anfrage-ID** in [Audit-Ereignissen](help:audit#request-id). Protokolliere sie bei jedem
fehlgeschlagenen Aufruf und nenne sie, wenn du um Hilfe bittest. Studio zeigt sie in jeder
Fehlermeldung unter **Technische Details**.

## Listen paginieren {#pagination}

Listen verwenden Cursor:

```http
GET /v1/audit?limit=100 HTTP/1.1
```

```json
{ "items": [ ... ], "next_cursor": "eyJ..." }
```

- `limit` liegt zwischen 1 und 200, Standard 50.
- Ist `next_cursor` nicht `null`, fordere die nächste Seite mit `?cursor=<next_cursor>` und
  denselben Filtern an. Ist er `null`, hast du alles.
- Cursor sind undurchsichtig; baue oder verändere sie nicht. Filter sind normale
  Query-Parameter, die pro Endpunkt dokumentiert sind.

## Verlorene Änderungen vermeiden {#concurrency}

Ressourcen mit einer Versionsnummer `version` (zum Beispiel Produkte, Mandanten, Datensätze,
Nutzungszähler, Benachrichtigungsvorlagen) unterstützen optimistische Nebenläufigkeitskontrolle:

1. Lies die Ressource und merke dir ihre `version` (Antworten zu Datensätzen und Zählern senden sie
   auch als `ETag`, zum Beispiel `"3"`).
2. Sende die Änderung mit `If-Match: 3`.
3. Hat jemand sie zwischenzeitlich geändert, antwortet der Server mit `412 precondition_failed`.
   Lies sie erneut, wende deine Änderung neu an und versuche es noch einmal.

Ohne `If-Match` gewinnt der letzte Schreibvorgang. `If-Match` muss die Versionsnummer sein; alles
andere ergibt `422`.

## Sicher wiederholen: Idempotenzschlüssel {#idempotency}

Endpunkte, die etwas mit Nebenwirkungen anlegen, akzeptieren einen Header `Idempotency-Key` (bis
zu 200 Zeichen), zum Beispiel beim Erfassen von Nutzung, beim Einreihen von Jobs, beim
Veröffentlichen von Ereignissen und beim Senden von Benachrichtigungen. Eine wiederholte Anfrage
mit demselben Schlüssel liefert das ursprüngliche Ergebnis, statt die Arbeit doppelt zu erledigen.
Verwende einen eigenen fachlichen Schlüssel (eine Bestell-ID, eine Nachrichten-ID) und nutze ihn
bei jeder Wiederholung erneut. Beim Erfassen von Nutzung ist der Schlüssel Pflicht.

## Ratenbegrenzung {#rate-limits}

Hat der Betreiber Ratenbegrenzungen aktiviert (`limits.rate_limit_per_minute`,
`rate_limit_ip_per_minute`, siehe [Einstellungen](help:settings#settings-tree)), erhält ein Client,
der zu viele Anfragen sendet, `429 rate_limited` mit einem Header `Retry-After` in Sekunden. Warte
so lange und versuche es erneut. Die Limits zählen pro Zugangsdaten (API-Schlüssel oder Sitzung)
und pro Client-IP, und zwar pro Serverprozess. Statusprüfungen und `/metrics` werden nie begrenzt.
Anmeldeversuche haben ein eigenes Limit (`login_rate_per_minute`).

`429 quota_exceeded` ist etwas anderes: Ein Nutzungskontingent des Mandanten oder Tarifs ist
aufgebraucht (siehe [Nutzung](help:usage)). Ein paar Sekunden zu warten hilft hier nicht.

## Ein SDK verwenden {#sdks}

Das Backend-Repository enthält zwei offizielle Clients, beide im Alpha-Stadium und noch nicht in
einer Paket-Registry veröffentlicht. Beide senden die richtigen Header, wandeln Problem-Dokumente
in Exceptions mit `status`, `code`, `request_id` und `retry_after` um, paginieren für dich und
prüfen die Serverversion. Keiner wiederholt automatisch: Wiederhole selbst, mit einem
Idempotenzschlüssel.

### Python {#sdk-python}

Paket `axentra-client` in `sdk/python` (Python 3.11+, synchrone und asynchrone Clients).
Installiere es aus einem Checkout mit `pip install ./sdk/python`.

```python
from axentra_client import AxentraClient, AxentraApiError

with AxentraClient("https://api.example.com", api_key="axk_01EXAMPLE_secretEXAMPLE") as ax:
    ax.check_compatibility()
    pid = "prd_01EXAMPLE"
    for tenant in ax.tenants.iter(pid, page_size=100):
        print(tenant.slug)
    try:
        ax.tenants.create(pid, slug="acme", name="Acme")
    except AxentraApiError as e:
        print(e.status, e.code, e.request_id)
```

### TypeScript {#sdk-typescript}

Paket `@axentra/sdk` in `sdk/typescript` (ESM, Node 20+ oder ein moderner Browser). Seine Typen
werden aus dem OpenAPI-Vertrag erzeugt, sodass jeder Pfad, jeder Parameter und jeder Body typisiert
ist.

```ts
import { AxentraApiError, createAxentraClient } from '@axentra/sdk';

const ax = createAxentraClient({
  baseUrl: 'https://api.example.com',
  apiKey: process.env.AXENTRA_KEY,
});
await ax.checkCompatibility();

const product_id = 'prd_01EXAMPLE';
for await (const t of ax.paginate((cursor) =>
  ax.GET('/v1/products/{product_id}/tenants', {
    params: { path: { product_id }, query: { cursor, limit: 100 } },
  }),
)) {
  console.log(t.slug);
}
```

Im Browser ohne Schlüssel verwendet der TypeScript-Client das Sitzungscookie und kümmert sich
selbst um das CSRF-Token. Das Backend-Repository dokumentiert beide Clients in
`docs/sdk/PYTHON.md` und `docs/sdk/TYPESCRIPT.md`.

## Versionen und Kompatibilität {#versioning}

- Die Pfadversion `/v1` ändert sich nur bei inkompatiblen Änderungen. Ein neues `/v2` würde
  mindestens ein Nebenrelease lang parallel zu `/v1` angeboten.
- Die **Nebenversion** der API wächst mit abwärtskompatiblen Ergänzungen (neue Endpunkte, neue
  optionale Felder, neue Werte). `GET /v1/meta` liefert sie als
  `api_version: {"major": 1, "minor": 0}`, und jede Antwort trägt `Axentra-API-Version: 1.0`.
- Rufe beim Start `GET /v1/meta` auf und verweigere den Betrieb, wenn die Hauptversion abweicht
  oder die Nebenversion des Servers niedriger ist als die benötigte. Eine neuere Nebenversion ist in
  Ordnung. Beide SDKs tun das in `check_compatibility()` / `checkCompatibility()`, und Studio
  genauso (siehe [Kompatibilitätsprüfung](help:server-configuration#compatibility)).
- Sende optional `Axentra-Client: <name>/<version>; api=<major.minor>`, damit die
  Serverprotokolle zeigen, welcher Client aufgerufen hat.

## API-Referenz {#api-reference}

Der Server kann sein OpenAPI-Dokument unter `/v1/openapi.json` und eine interaktive Referenz unter
`/v1/docs` bereitstellen. Der Betreiber steuert das mit `security.api_docs` (angezeigt als
`limits.api_docs` unter [Einstellungen](help:settings#settings-tree)): `public`, `authenticated`
(erfordert eine Sitzung oder einen API-Schlüssel) oder `disabled` (Standard in Produktion). Das
eingecheckte `openapi/axentra-v1.json` im Backend-Repository beschreibt immer den aktuellen
Vertrag.

## Fehlerbehebung {#troubleshooting}

- **`401 unauthenticated` mit einem API-Schlüssel**: Der Schlüssel ist falsch, widerrufen oder abgelaufen, oder er wurde erneuert und seine Übergangsfrist ist vorbei.
  Prüfe den Status des Schlüssels unter **API-Schlüssel** und sende ihn als `Authorization: Bearer axk_...`.
- **`403 forbidden` mit „missing or invalid CSRF token“**: eine per Cookie authentifizierte
  Browser-Anfrage ohne `X-Axentra-CSRF` oder mit veraltetem Token. Lies `GET /v1/auth/session`
  erneut.
- **`403` mit „cross-origin request refused“**: Der Ursprung deiner App steht nicht in
  `security.allowed_origins`. Bitte den Betreiber, ihn hinzuzufügen.
- **`404`, obwohl die ID stimmt**: Die Ressource gehört zu einem anderen Produkt oder Mandanten als
  dein Schlüssel, oder das Modul ist deaktiviert (`module_disabled`).
- **`412 precondition_failed`**: Jemand hat die Ressource geändert, seit du sie gelesen hast. Lies
  sie erneut und versuche es mit der neuen Version.
- **`429 rate_limited`**: Warte die Sekunden aus `Retry-After` ab und sende danach langsamer.
- **`413 payload_too_large`**: Der Body überschreitet `security.max_body_bytes` (Standard 10 MiB).
  Lade Dateien über die Datei-Endpunkte hoch, die ein eigenes Limit haben.
- **Dein Client lehnt die Serverversion ab**: Der Server ist älter, als dein Client voraussetzt,
  oder hat eine andere Hauptversion. Verwende ein passendes Client-Release.
