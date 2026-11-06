---
title: Serverkonfiguration für Studio
summary: Was Betreiber konfigurieren, damit Studio funktioniert - die API-Adresse in config.json, erlaubte Ursprünge, Module, Einzel- oder Mehrproduktbetrieb und die Versionsprüfung.
keywords: Betreiber, Administrator, Betrieb, Deployment, Installation, Konfiguration, config.json, apiBaseUrl, Reverse Proxy, CORS, erlaubte Ursprünge, Same-Site, Module, Modul aktivieren, Einzelprodukt, Mehrprodukt, Modus, Kompatibilität, Version, Docker, Backup, Sicherung, Wiederherstellung, Observability
---

Dieser Artikel richtet sich an die Personen, die Axentra und Studio betreiben. Er behandelt nur,
was für Studio wichtig ist: wie Studio die API findet, was die API erlauben muss, wie Module und
die Betriebsart beeinflussen, was Studio anzeigt, und wie Studio prüft, ob es zur Serverversion
passt. Die vollständige Serverkonfiguration ist im Backend-Repository dokumentiert (siehe
[Weiterführende Dokumentation](#further-reading)).

Studio ist eine statische Web-App. Es hat keinen eigenen Server, keine Datenbank und keine
Geheimnisse; alles, was es anzeigt, kommt von der Axentra-API, und jede Berechtigungsentscheidung
trifft die API.

```diagram
architecture
```

## Studio sagen, wo die API ist: config.json {#studio-config}

Beim Start lädt Studio vor allem anderen `/config.json` von seiner eigenen Adresse. Ein einziger
Build funktioniert dadurch in jeder Umgebung.

```json
{ "apiBaseUrl": "" }
```

| `apiBaseUrl`                | Bedeutung                                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `""` (Standard)             | **Gleicher Ursprung** (empfohlen): Ein Reverse Proxy liefert Studio aus und leitet `/v1` (und `/metrics`) unter derselben Adresse an die API weiter |
| `"https://api.example.com"` | Die API läuft unter einer anderen Adresse. Gib nur den Ursprung an; ein abschließendes `/` oder `/v1` wird entfernt                                 |

Fehlt `/config.json` oder ist die Datei ungültig, verwendet Studio den gleichen Ursprung.

Mit dem Container-Image von Studio schreibst du die Datei nicht selbst:

| Variable                  | Wirkung                                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AXENTRA_API_URL`         | Der Container leitet `/v1` und `/metrics` an diese API-Adresse weiter (Betrieb mit gleichem Ursprung)                                                                                              |
| `AXENTRA_PUBLIC_API_URL`  | Wird als `apiBaseUrl` in `config.json` geschrieben und in der Content-Security-Policy erlaubt (separate API-Adresse)                                                                               |
| `AXENTRA_CSP_CONNECT_SRC` | Zusätzliche `https://`-Ursprünge, zu denen Studio Verbindungen aufbauen darf, durch Leerzeichen getrennt (`https://host` oder `https://host:port`); jeder andere Wert bricht den Containerstart ab |
| `AXENTRA_TLS_TERMINATED`  | `true`, wenn Benutzer Studio über HTTPS erreichen (TLS endet vor dem Container): setzt `Strict-Transport-Security`. Standard `false`                                                               |

## Die API Studio akzeptieren lassen {#allowed-origins}

Die API lehnt angemeldete Browser-Anfragen von unbekannten Ursprüngen ab. Konfiguriere auf dem
Axentra-Server:

- `security.allowed_origins`: Füge die öffentliche Adresse von Studio hinzu, zum Beispiel
  `["https://studio.example.com"]`, sofern Studio nicht unter der eigenen `public_url` der API
  läuft. In Produktion werden nur explizite `https://`-Ursprünge akzeptiert; `*` ist nie erlaubt.
- `security.public_url`: die externe `https://`-Adresse der API. Mit ihr werden sichere Cookies aktiviert.
- `security.trusted_proxies`: die Proxys vor der API, damit die Client-IP im Audit-Protokoll und
  bei Ratenbegrenzungen die des Benutzers ist und nicht die des Proxys.

> [!WARNING]
> Bei einer separaten API-Adresse müssen Studio und API auf derselben **Site** liegen (zum
> Beispiel `studio.example.com` und `api.example.com`). Das Sitzungscookie ist `SameSite=Lax`;
> bei einem Site-übergreifenden Aufbau ist daher keine Anmeldung möglich. Der gleiche Ursprung ist
> der getestete und empfohlene Aufbau.

Bei Single Sign-on kehrt der Identitätsanbieter zu einer absoluten Studio-Adresse zurück, die die
API als Weiterleitungsziel akzeptieren muss.

## Module aktivieren {#modules}

Die Servereinstellung `modules` legt fest, welche Teile von Axentra laufen. Die Module
`identity`, `tenancy`, `access` und `audit` sind immer an. Die anderen sind optional:

| Modul                | Bereiche in Studio                                    |
| -------------------- | ----------------------------------------------------- |
| `data`               | **Datenübersicht**, **Datensätze**                    |
| `storage`            | **Dateien**                                           |
| `events`             | **Jobs**, **Zeitpläne**, **Ereignisse**, **Webhooks** |
| `usage`              | **Nutzung**                                           |
| `billing`            | **Tarife**, **Abonnements**                           |
| `notify`             | **Benachrichtigungen**                                |
| `search`, `realtime` | Keine Seiten in Studio; nur über die API verfügbar    |

Studio liest die Modulliste beim Laden einmal über `GET /v1/meta`:

- Ein Bereich, dessen Modul aus ist, bleibt in der Seitenleiste, markiert mit **Aus**, und öffnet
  **Modul auf diesem Server nicht aktiviert**.
- Ein Modul, das an ist, für das dieses Studio-Release aber keine Seiten hat, zeigt
  **Im Studio noch nicht verfügbar**.

Um Module zu ändern, bearbeite die Serverkonfiguration (zum Beispiel
`modules = ["identity", "tenancy", "access", "audit", "data", "storage", "events"]` oder die
Umgebungsvariable `AXENTRA__MODULES`), starte die API neu und lade dann Studio neu. Die aktive
Liste steht unter `modules` auf der Seite [Einstellungen](help:settings#settings-tree). Siehe
[Modulreferenz](help:modules-reference).

> [!NOTE]
> Wird ein Modul ausgeschaltet, werden seine Endpunkte entfernt; seine Daten bleiben in der
> Datenbank und sind wieder da, sobald du das Modul erneut einschaltest.

## Einzel- oder Mehrproduktbetrieb {#deployment-modes}

Der `mode` des Servers legt fest, wie viele Produkte er bedient. Studio liest ihn aus
`GET /v1/meta`.

|                                                  | `single` (Serverstandard)                                                             | `multi`                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Produkte                                         | Genau eins, beim ersten Start aus dem Abschnitt `[product]` angelegt (`slug`, `name`) | Beliebig viele, angelegt von Plattform-Administratoren |
| Startseite                                       | Das Dashboard des Produkts                                                            | Das zuletzt verwendete Produkt, sonst die Produktliste |
| Obere Leiste                                     | Der Name des Produkts, kein Wechsler                                                  | Produktwechsler                                        |
| **Neues Produkt**, Archivieren, Wiederherstellen | Nicht angeboten (die API antwortet mit `409 mode_not_supported`)                      | Mit `products:create` / `products:archive`             |
| Unbekannte Produkt-ID in der Adresse             | Weiterleitung zum selben Bereich des einen Produkts                                   | **Nicht gefunden**                                     |

Alles andere (Mandanten, Benutzer, Rollen, Daten, Audit) funktioniert in beiden Betriebsarten
gleich. Benutzerkonten gehören in beiden Betriebsarten zur Installation. Eine Installation von
`single` auf `multi` umzustellen ist eine Konfigurationsänderung ohne Datenmigration.

## Kompatibilitätsprüfung zwischen Studio und API {#compatibility}

Jeder Studio-Build gibt an, welche API-Version er braucht (**Benötigte API-Version**, derzeit
`1.0`). Beim Start liest Studio `api_version` aus `GET /v1/meta`:

| API-Version des Servers                                                            | Ergebnis                                                                                 |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Gleiche Hauptversion, gleiche oder höhere Nebenversion (zum Beispiel `1.0`, `1.3`) | Studio startet                                                                           |
| Niedrigere Nebenversion (zum Beispiel Server `1.0`, Studio braucht `1.2`)          | **Inkompatible Serverversion**: Aktualisiere den Server oder verwende ein älteres Studio |
| Andere Hauptversion (zum Beispiel `2.0`)                                           | **Inkompatible Serverversion**: Verwende ein Studio-Release für diese Hauptversion       |
| Nicht lesbar                                                                       | **Inkompatible Serverversion** mit dem Rohwert                                           |

Bei einer Ablehnung wird nichts weiter geladen; ein unpassender Server erhält also nie
Schreibzugriffe von Studio. Beide Versionen werden unter
[Systemzustand](help:health-monitoring#versions) angezeigt. Die gemeinsam getesteten
Kombinationen stehen in `docs/COMPATIBILITY.md` von Studio.

> [!TIP]
> Lade nach einem Server-Upgrade offene Studio-Tabs neu: Die Prüfung läuft nur beim Laden von
> Studio.

Zeigt Studio stattdessen **Keine Verbindung zu Axentra**, konnte es `GET /v1/meta` gar nicht
laden; siehe [Fehlerbehebung](#troubleshooting).

## Servereinstellungen, die ändern, was Benutzer sehen {#user-visible-settings}

| Servereinstellung                                     | Wirkung in Studio                                                                                                                                                                                  | Standard                                         |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `security.password_login`                             | Formular für die Passwortanmeldung auf der Anmeldeseite                                                                                                                                            | an                                               |
| `[[oidc]]`-Anbieter                                   | Single-Sign-on-Schaltflächen auf der Anmeldeseite                                                                                                                                                  | keine                                            |
| `security.session_ttl_hours` / `session_idle_minutes` | Wann sich Benutzer erneut anmelden müssen                                                                                                                                                          | 12 h / 120 min                                   |
| `security.password_min_length`                        | Mindestlänge neuer Passwörter                                                                                                                                                                      | 12                                               |
| `security.first_password` / `fresh_login_minutes`     | Ob und wie schnell Single-Sign-on-Benutzer in ihrem [Profil](help:profile#set-password) ein Passwort festlegen können                                                                              | erlaubt innerhalb von 5 min                      |
| `security.max_body_bytes`, `storage.max_file_bytes`   | Größte Anfrage und größter Datei-Upload                                                                                                                                                            | 10 MiB / 50 MiB                                  |
| `observability.metrics_enabled` / `metrics_token_ref` | Ob **Metriken** unter Monitoring Daten zeigt oder nach einem Token fragt                                                                                                                           | an; in Produktion ohne Token aus                 |
| `observability.audit_retention_days`                  | Wie weit das Audit-Protokoll nach `axentra maintenance purge` zurückreicht                                                                                                                         | 365                                              |
| `notify.invitation_accept_url`                        | Wohin Einladungslinks führen (eine eigene `invitation_accept_url` des Produkts hat Vorrang). Setze sie auf `https://<your Studio address>/invitations/accept`, wenn Studio eine eigene Adresse hat | `/accept-invitation` unter `security.public_url` |

Ändere diese Werte in der TOML-Datei des Servers oder als Umgebungsvariablen
`AXENTRA__<SECTION>__<KEY>` (zum Beispiel `AXENTRA__SECURITY__SESSION_TTL_HOURS=8`) und starte die
API neu. Geheimnisse werden immer als Verweise angegeben (`env:NAME` oder `file:/path`), in
Produktion nie direkt.

## Weiterführende Dokumentation {#further-reading}

Im Backend-Repository von Axentra:

- `docs/operations/CONFIGURATION.md`: jede Einstellung mit Standardwert und Umgebungsvariable.
- `docs/operations/DEPLOYMENT.md`: Container-Image, Compose-Stacks und die Checkliste für die
  Produktion.
- `docs/architecture/DEPLOYMENT_MODELS.md`: Einzel- und Mehrproduktbetrieb im Detail.
- `docs/operations/BACKUP_RESTORE.md`: Sicherung und Wiederherstellung der Datenbank und wie du
  eine Wiederherstellung überprüfst. Studio hält keine Daten; die Datenbank zu sichern genügt.
- `docs/operations/OBSERVABILITY.md`: Metriken, Tracing, Protokolle, Statusprüfungen und
  Aufbewahrung.
- `docs/architecture/VERSIONING.md`: Versionsnummern und Kompatibilitätsregeln.

Im Studio-Repository: `README.md` (Konfiguration und Container-Image) und
`docs/COMPATIBILITY.md` (getestete Kombinationen).

## Fehlerbehebung {#troubleshooting}

- **Keine Verbindung zu Axentra**: Studio konnte `GET /v1/meta` nicht laden. Prüfe, ob die API
  läuft, ob `apiBaseUrl` in `/config.json` stimmt (oder ob der Proxy `/v1` weiterleitet) und, bei
  einer separaten API-Adresse, ob die Content-Security-Policy sie erlaubt.
- Die Anmeldung scheitert mit **Nicht erlaubt**, oder jede Änderung scheitert mit **Nicht
  erlaubt**: Die API lehnt den Ursprung von Studio ab. Füge die Adresse von Studio zu
  `security.allowed_origins` hinzu und starte die API neu.
- Die Anmeldung scheint zu klappen, aber du wirst sofort wieder abgemeldet: Studio und API liegen
  auf verschiedenen Sites, oder die `public_url` der API ist `https://`, während Benutzer sie über
  `http://` erreichen. Verwende den gleichen Ursprung oder einen Same-Site-Aufbau über HTTPS.
- **Inkompatible Serverversion**: siehe [Kompatibilitätsprüfung](#compatibility).
- **Modul auf diesem Server nicht aktiviert**: Aktiviere das in der Meldung genannte Modul auf dem
  Server und lade Studio neu.
- **In diesem Modus nicht verfügbar**: Die Aktion erfordert den Modus `multi`; der Server läuft im
  Modus `single`.
- Das Audit-Protokoll zeigt die Adresse des Proxys als **IP-Adresse**: Füge den Proxy zu
  `security.trusted_proxies` hinzu.
- Einladungslinks öffnen eine Seite der API oder **Seite nicht gefunden**: Studio hat eine eigene
  Adresse. Setze `notify.invitation_accept_url` auf
  `https://<your Studio address>/invitations/accept` und starte die API neu. Bereits verschickte
  Links zeigen weiter auf die API; schick diesen Personen das Token oder eine neue Einladung. Siehe
  [Mitglieder und Einladungen](help:members-invitations#delivery).
