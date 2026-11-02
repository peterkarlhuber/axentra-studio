---
title: Systemzustand und Monitoring
summary: Prüfen, ob der Axentra-Server läuft und bereit ist, seine Metriken lesen und die gemeldeten Einstellungen zu Aufbewahrung, Tracing und Protokollierung ansehen.
keywords: Zustand, Health, Status, Bereitschaft, Readiness, Erreichbarkeit, Liveness, Verfügbarkeit, 503, Monitoring, Überwachung, Metriken, Prometheus, Scrape, OpenTelemetry, Tracing, Protokollstufe, Log-Level, Aufbewahrung, Bereinigung, Version
---

Zwei Seiten zeigen, wie es dem Axentra-Server geht. **Systemzustand** beantwortet die Frage „Läuft
der Server und kann er Anfragen bedienen?“ und zeigt, welche Versionen von Server und Studio
laufen. **Monitoring** ergänzt die eigenen Metriken des Servers (Anzahl der Anfragen, Fehler,
Antwortzeiten) und die gemeldeten Einstellungen zu Wartung, Aufbewahrung, Tracing und
Protokollierung. Betreiber nutzen sie für einen schnellen Blick; für Alarme und Verlauf schließt du
ein echtes Monitoring-System an (siehe [Für Betreiber](#for-operators)).

> [!IMPORTANT]
> Beide Seiten stehen allen angemeldeten Benutzern offen und hängen von keinem Modul ab. Die Karten
> **Wartung und Aufbewahrung** und **Tracing und Protokollierung** erfordern `platform:settings`
> (Plattformrollen) oder `product:manage` in mindestens einem Produkt (**Product owner**,
> **Product admin**). Die Karte **Metriken** hängt von der Metrik-Konfiguration des Servers
> ab, nicht von deiner Rolle (siehe [Metriken](#metrics)).

## Prüfen, ob der Server gesund ist {#check-health}

1. Öffne **Audit & Überwachung** › **Systemzustand** ([öffnen](app:health)).
2. Lies die Karte **Bereitschaft**: den Gesamtstatus und eine Zeile pro Prüfung.
3. Lies die Karte **Erreichbarkeit**: **OK** bedeutet, dass der Serverprozess antwortet.
4. Wähle **Aktualisieren**, um sofort erneut zu prüfen. Beide Karten aktualisieren sich außerdem
   alle 30 Sekunden; **Aktualisiert um …** zeigt, wann das Ergebnis der Bereitschaftsprüfung
   abgerufen wurde.

### Bereitschaft {#readiness}

Die Bereitschaftsprüfung fragt den Server, ob er gerade Anfragen bedienen kann
(`GET /v1/health/ready`). Der Server führt jede Prüfung aus und antwortet nur dann mit **OK**, wenn
alle bestanden sind; sonst antwortet er mit HTTP `503` und dem Status **Nicht verfügbar**, und
Studio listet trotzdem jede Prüfung auf, damit du siehst, welche fehlschlägt.

| Prüfung           | Vorhanden, wenn                                             | Bestanden, wenn                                                                                                                |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `database`        | immer                                                       | Der Server erreicht seine PostgreSQL-Datenbank                                                                                 |
| `notify_provider` | das Modul notify aktiviert ist                              | Die Konfiguration des E-Mail-Anbieters vollständig ist (Absenderadresse, Anbietereinstellungen). Es wird keine E-Mail gesendet |
| `schema`          | der Betreiber `database.require_current_schema` gesetzt hat | Keine Datenbankmigrationen ausstehen und keine dem Server unbekannt sind                                                       |

Produkt-Backends, die auf Axentra aufbauen, können weitere Prüfungen registrieren; diese erscheinen
hier unter ihrem eigenen Namen.

### Erreichbarkeit {#liveness}

Die Erreichbarkeitsprüfung (`GET /v1/health/live`) sagt nur, dass der Serverprozess antwortet.
Studio zeigt **Ausgefallen**, wenn die Anfrage scheitert, zum Beispiel weil der Server oder der
vorgeschaltete Proxy nicht erreichbar ist. Ein Server kann erreichbar, aber nicht bereit sein: Der
Prozess läuft, aber eine Abhängigkeit wie die Datenbank fehlt.

### Versionen {#versions}

Die Karte **Versionen** unter **Systemzustand** zeigt Name und Version des **Server**, die
**API-Version des Servers**, die **Umgebung** (`development`, `test` oder `production`), die
**Studio-Version** und die **Benötigte API-Version** dieses Studio-Builds. Studio startet nicht mit
einem Server, dessen API-Version nicht passt; siehe
[Kompatibilitätsprüfung](help:server-configuration#compatibility).

## Die Seite Monitoring verwenden {#monitoring}

Öffne **Audit & Überwachung** › **Monitoring** ([öffnen](app:monitoring)). Die Seite zeigt dieselben
Karten **Bereitschaft** und **Erreichbarkeit** wie **Systemzustand** und zusätzlich:

- **Wartung und Aufbewahrung** und **Tracing und Protokollierung** (siehe [unten](#retention)),
- **Metriken** des API-Prozesses (siehe [Metriken](#metrics)).

**Aktualisieren** lädt alles neu. Metriken aktualisieren sich außerdem alle 30 Sekunden, solange
sie ohne Fehler laden.

## Metriken {#metrics}

Die Karte **Metriken** liest den Prometheus-Endpunkt `GET /metrics` des Servers und zeigt ihn als
Kennzahlen und Tabellen.

| Kennzahl                                                                                                   | Gezählt aus                                                                                         |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **HTTP-Anfragen**                                                                                          | Alle Anfragen (`axentra_http_requests_total`)                                                       |
| **Serverfehler (5xx)** / **Clientfehler (4xx)**                                                            | Anfragen mit dieser Statusklasse                                                                    |
| **Mittlere Antwortzeit**                                                                                   | Gesamte Anfragezeit geteilt durch die Anzahl der Anfragen (`axentra_http_request_duration_seconds`) |
| **Abgewiesen (401/403)**                                                                                   | Abweisungen bei Authentifizierung und Berechtigung (`axentra_auth_failures_total`)                  |
| **Eingereihte Benachrichtigungen** / **Zugestellte Benachrichtigungen** / **Fehlgeschlagene Zustellungen** | Benachrichtigungszähler (nur Prozesse, die Benachrichtigungen verarbeiten, melden sie)              |

Unter den Kennzahlen sind die Metriken gruppiert in **HTTP**, **Authentifizierung**,
**Datenbank-Pool**, **Benachrichtigungen**, **Jobs und Ereignisse** und **Weitere Metriken**. Jede
Tabelle zeigt eine Zeile pro Label-Kombination (zum Beispiel pro Methode, Route und Status) mit
ihrem Wert; bei Histogrammen **Anzahl** und **Mittelwert**. Große Metriken zeigen die ersten 50
Zeilen.

> [!WARNING]
> Die Werte zählen **seit dem Start dieses API-Prozesses** und gehören zu **dem einen Prozess, der
> die Anfrage von Studio beantwortet hat**. Bei mehreren API-Prozessen oder Replikaten hat jeder
> eigene Zahlen, und auch der Benachrichtigungs-Dispatcher und die Job-Worker haben eigene. Ein
> Neustart setzt die Zahlen auf null zurück. Für ein vollständiges Bild lass Prometheus jeden
> Prozess abfragen.

### Metrik-Token {#metrics-token}

Ob `/metrics` antwortet, hängt von der Serverkonfiguration ab:

| Serverkonfiguration                                   | Was Studio zeigt                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `observability.metrics_enabled = false`               | **Metriken sind nicht verfügbar**                                                        |
| `observability.metrics_token_ref` ist gesetzt         | **Ein Metrik-Token ist erforderlich** und ein Formular **Metrik-Token**                  |
| Kein Token konfiguriert, `environment = "production"` | **Metriken sind nicht verfügbar** (Metriken bleiben aus, bis ein Token konfiguriert ist) |
| Kein Token konfiguriert, Entwicklung oder Test        | Die Metriken, ohne Token                                                                 |

So zeigst du geschützte Metriken an:

1. Hol dir das Metrik-Token von deinem Betreiber (das Geheimnis, auf das
   `observability.metrics_token_ref` verweist).
2. Gib es unter **Bearer-Token** ein und wähle **Metriken laden**.

> [!NOTE]
> Studio hält das Token nur in der geöffneten Seite. Es wird nie gespeichert und ist weg, sobald du
> die Seite verlässt oder neu lädst. Akzeptiert der Server es nicht, zeigt Studio
> **Der Server hat dieses Token nicht akzeptiert.**

## Aufbewahrung, Tracing und Protokollierung {#retention}

**Wartung und Aufbewahrung** listet, wie lange der Server Daten aufbewahrt, wie von
`GET /v1/settings` gemeldet:

| Zeile                                                      | Servereinstellung                                                 | Standard                                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Audit-Ereignisse**                                       | `observability.audit_retention_days`                              | 365 Tage                                                                    |
| **Abgeschlossene Jobs**                                    | `observability.job_retention_days`                                | 30 Tage                                                                     |
| **Inhalt von Benachrichtigungen** / **Benachrichtigungen** | `notify.content_retention_days` / `notify.message_retention_days` | von der Serverversion, gegen die dieses Studio gebaut wurde, nicht gemeldet |

Einen Wert, den der Server nicht meldet, zeigt Studio als **vom Server nicht gemeldet**; Studio
rät nie.

> [!IMPORTANT]
> Die Aufbewahrung läuft nicht von selbst. Daten, die älter als die Frist sind, werden erst
> gelöscht, wenn der Betreiber `axentra maintenance purge` ausführt (typischerweise einmal täglich
> per Cron oder Scheduler). Der Befehl entfernt auch abgelaufene Sitzungen und Einrichtungstokens.

**Tracing und Protokollierung** zeigt, ob **OpenTelemetry-Tracing** aktiviert ist, die
**Protokollstufe**, den **Benachrichtigungsanbieter** (`local` oder `smtp`) und die **Umgebung**.
Diese Werte sind schreibgeschützt; geändert werden sie in der Serverkonfiguration.

## Für Betreiber {#for-operators}

- **Probes**: Verwende `GET /v1/health/live` als Liveness-Probe und `GET /v1/health/ready` als
  Readiness-Probe deines Orchestrators. Beide brauchen keine Authentifizierung und werden nie durch
  die Ratenbegrenzung gebremst.
- **Prometheus**: Lass Prometheus `/metrics` jedes API-Prozesses abfragen. Konfiguriere in
  Produktion `observability.metrics_token_ref` (zum Beispiel
  `file:/run/secrets/axentra_metrics_token`) und gib Prometheus dasselbe Token als
  Bearer-Zugangsdaten.
- **Studio mit gleichem Ursprung**: Der Studio-Container leitet `/metrics` zusammen mit `/v1` an
  die API weiter, sodass die Seite Monitoring unter derselben Adresse funktioniert.
- **Protokolle** sind standardmäßig JSON und enthalten die Anfrage-ID; Geheimnisse werden
  geschwärzt.
- **Tracing**: `observability.otel_enabled = true` plus das Extra `otel` des Serverpakets
  exportiert pro Anfrage einen Span über OTLP/HTTP.

Das Backend-Repository dokumentiert all das in `docs/operations/OBSERVABILITY.md`.

## Fehlerbehebung {#troubleshooting}

- **Bereitschaft: Nicht verfügbar** mit `database` **Fehlerhaft**: Der Server erreicht PostgreSQL
  nicht. Prüfe die Datenbank und die Datenbank-URL des Servers; Anfragen, die Daten brauchen,
  scheitern, bis sie wieder erreichbar ist.
- **`notify_provider` Fehlerhaft**: Die E-Mail-Konfiguration ist unvollständig, zum Beispiel eine
  fehlende oder ungültige Absenderadresse oder SMTP-Einstellungen. Korrigiere `[notify]` in der
  Serverkonfiguration.
- **`schema` Fehlerhaft**: Migrationen stehen aus. Der Betreiber führt `axentra migrate` aus.
- **Erreichbarkeit: Ausgefallen** oder **Server nicht erreichbar**: Der Server oder der Proxy
  zwischen Studio und Server ist nicht erreichbar. Prüfe, ob der Server läuft und die API-Adresse
  von Studio stimmt (siehe [Konfiguration von Studio](help:server-configuration#studio-config)).
- **Metriken sind nicht verfügbar**: Metriken sind ausgeschaltet, oder es handelt sich um einen
  Produktivserver ohne Metrik-Token. Bitte den Betreiber, `observability.metrics_token_ref` zu
  setzen.
- **Der Server hat dieses Token nicht akzeptiert.**: Das Token ist falsch oder wurde erneuert. Bitte
  den Betreiber um das aktuelle.
- **Einstellungen zu Aufbewahrung und Tracing sehen nur Plattform-Administratoren und
  Produktverantwortliche**: Du hast weder `platform:settings` noch `product:manage`. Der Rest der
  Seite funktioniert trotzdem.
- **Metriken wirken zu niedrig oder springen auf null zurück**: Ein anderer API-Prozess hat
  geantwortet, oder der Prozess wurde neu gestartet (siehe die Warnung unter [Metriken](#metrics)).
