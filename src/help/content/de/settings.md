---
title: Einstellungen
summary: Sprache und Darstellung wählen und die wirksame Konfiguration des Axentra-Servers nachschlagen.
keywords: Einstellungen, Präferenzen, Sprache, Darstellung, Theme, Dunkelmodus, heller Modus, Serverkonfiguration, wirksame Einstellungen, Konfiguration, Module, Sitzungsdauer, Limits
---

Die Seite **Einstellungen** hat zwei Teile. **Persönliche Einstellungen** sind deine eigene Wahl
für Studio: die Sprache der Oberfläche und die Darstellung. **Serverkonfiguration** zeigt, wie der
Axentra-Server gerade konfiguriert ist, zum Beispiel welche Module aktiviert sind, wie lange
Sitzungen dauern und welche Limits gelten. Die Serverkonfiguration ist in Studio schreibgeschützt:
Änderungen nimmt der Betreiber auf dem Server vor.

Öffne die Seite über **Einstellungen** unten in der Seitenleiste ([öffnen](app:settings)).

## Sprache und Darstellung ändern {#preferences}

1. Wähle unter **Persönliche Einstellungen** eine **Sprache**. Die Oberfläche wechselt sofort.
2. Wähle unter **Darstellung** **Hell**, **Dunkel** oder **System**. **System** folgt der hellen
   oder dunklen Einstellung deines Betriebssystems und wechselt mit ihr.

Dieselbe Auswahl findest du im Benutzermenü oben rechts (**Sprache** und **Darstellung**).

| Einstellung     | Was sie bewirkt                                                        | Werte                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprache**     | Sprache der Studio-Oberfläche und der Datums-, Zeit- und Zahlenformate | English, Deutsch, Español, Français, Português (Brasil), Italiano. Ohne Auswahl folgt Studio der Sprache deines Browsers, sonst Englisch |
| **Darstellung** | Farben der Oberfläche                                                  | **Hell**, **Dunkel**, **System** (Standard)                                                                                              |

### Wo die Einstellungen gespeichert werden {#stored}

Deine Wahl gilt sofort und wird doppelt gespeichert: in diesem Browser, damit sie schon vor der
Anmeldung wirkt, und in deinem Benutzerkonto auf dem Server, damit sie dir in andere Browser folgt.
Meldest du dich in einem Browser an, der noch keine eigene Wahl hat, übernimmt Studio Sprache und
Darstellung aus deinem Konto. Eine in einem Browser getroffene Wahl bleibt in diesem Browser, bis
du sie dort änderst.

> [!NOTE]
> Manche Texte kommen vom Server und bleiben auf Englisch, egal welche Sprache du wählst: Namen
> und Beschreibungen der integrierten Rollen, die Beschreibungen im Berechtigungskatalog und die
> Servermeldung in den technischen Details eines Fehlers.

## Die Serverkonfiguration nachschlagen {#server-configuration}

Die Karte **Serverkonfiguration** zeigt die wirksame, nicht geheime Konfiguration des Servers
(`GET /v1/settings`) als Baum: Gruppen wie `limits` oder `storage` enthalten ihre Werte. Listen
werden durch Kommas getrennt angezeigt. Damit beantwortest du Fragen wie „Welche Module sind
aktiviert?“, „Wie lange dauert eine Sitzung?“ oder „Wie groß darf eine Datei sein?“, ohne den
Betreiber zu fragen.

> [!IMPORTANT]
> Die Serverkonfiguration wird mit `platform:settings` (Plattformrollen `platform_admin` und
> `platform_viewer`) oder mit `product:manage` in mindestens einem Produkt (**Product owner**,
> **Product admin**) angezeigt. Alle anderen sehen nur die persönlichen Einstellungen.

### Was die Werte bedeuten {#settings-tree}

| Schlüssel                                                        | Bedeutung                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `environment`                                                    | `development`, `test` oder `production`. Produktion erzwingt beim Start strengere Sicherheitsprüfungen                                                                                                                                       |
| `mode`                                                           | `single` (ein Produkt) oder `multi` (viele Produkte); siehe [Betriebsarten](help:server-configuration#deployment-modes)                                                                                                                      |
| `modules`                                                        | Aktivierte Module. Studio-Bereiche anderer Module zeigen **Modul auf diesem Server nicht aktiviert**                                                                                                                                         |
| `public_url`, `allowed_origins`                                  | Die externe Adresse des Servers und die Browser-Ursprünge (etwa der von Studio), die angemeldete Anfragen senden dürfen                                                                                                                      |
| `trusted_proxies`                                                | Proxys, deren weitergeleiteter Clientadresse der Server glaubt (wirkt sich auf die IP im Audit-Protokoll und auf Ratenbegrenzungen aus)                                                                                                      |
| `session_ttl_hours`, `session_idle_minutes`                      | Maximale Lebensdauer einer Sitzung (Standard 12 Stunden) und Zeitlimit bei Inaktivität (Standard 120 Minuten)                                                                                                                                |
| `password_login`, `password_min_length`, `login_rate_per_minute` | Ob die Anmeldung per Passwort aktiviert ist, die Mindestlänge von Passwörtern (Standard 12) und das Budget fehlgeschlagener Anmeldungen pro Konto und Minute (Standard 10)                                                                   |
| `limits`                                                         | `max_body_bytes` (größter Anfrage-Body, Standard 10 MiB), `rate_limit_per_minute`, `rate_limit_ip_per_minute`, `rate_limit_burst` (leer: keine Ratenbegrenzung) und `api_docs` (ob `/v1/docs` `public`, `authenticated` oder `disabled` ist) |
| `oidc_providers`                                                 | Single-Sign-on-Anbieter mit ihren Registrierungsregeln (nie das Client-Secret)                                                                                                                                                               |
| `storage`                                                        | Speicher-Backend für Dateien, maximale Dateigröße und erlaubte Inhaltstypen                                                                                                                                                                  |
| `notify`, `billing`                                              | Benachrichtigungsanbieter und Absender; Abrechnungsanbieter und ob Echtzahlungen eingeschaltet sind                                                                                                                                          |
| `observability`                                                  | Protokollstufe, Tracing, Aufbewahrung von Audit-Ereignissen und Jobs                                                                                                                                                                         |
| `encryption_key_ids`, `active_encryption_key`                    | IDs der Verschlüsselungsschlüssel, die der Server hat, und der Schlüssel für neue Daten (nie Schlüsselmaterial)                                                                                                                              |
| `features`                                                       | Freie Feature-Flags der Installation                                                                                                                                                                                                         |

Geheimnisse (Datenbankpasswörter, Verschlüsselungsschlüssel, Client-Secrets, API-Schlüssel von
Anbietern) sind nie Teil dieser Antwort.

### Die Serverkonfiguration ändern {#change}

Studio kann diese Werte nicht ändern. Der Betreiber ändert die Konfigurationsdatei oder die
Umgebungsvariablen des Servers und startet den Server neu; beim nächsten Öffnen dieser Seite siehst
du die neuen Werte. Was Betreiber für Studio typischerweise ändern, steht unter
[Serverkonfiguration](help:server-configuration).

## Gut zu wissen {#good-to-know}

- Produktspezifische Einstellungen (zum Beispiel die Speicherrichtlinie eines Produkts) stehen
  nicht hier, sondern auf der Seite des jeweiligen Produkts.
- Nachdem der Betreiber ein Modul aktiviert oder deaktiviert hat, lade Studio neu: Studio liest
  die Modulliste einmal beim Start.

## Fehlerbehebung {#troubleshooting}

- **Die Serverkonfiguration sehen nur Plattform-Administratoren sowie Produktinhaber und
  -administratoren.**: Du hast weder `platform:settings` noch `product:manage`. Deine persönlichen
  Einstellungen funktionieren trotzdem.
- **Der Server hat keine Einstellungen geliefert.**: Der Server hat mit einer leeren Konfiguration
  geantwortet. Lade die Seite neu; bleibt sie leer, informiere den Betreiber.
- Deine Sprache oder Darstellung folgt dir nicht in einen anderen Browser: Dieser Browser hat
  bereits eine eigene Wahl, und die Wahl des Browsers hat Vorrang. Ändere sie dort einmal.
- Sprache oder Darstellung springen nach der Anmeldung zurück: Dieser Browser hatte keine eigene
  Wahl, also hat Studio die aus deinem Konto übernommen. Wähle erneut; ab dann behält dieser
  Browser deine Wahl.
