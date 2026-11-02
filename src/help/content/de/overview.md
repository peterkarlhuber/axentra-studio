---
title: Was sind Axentra und Studio?
summary: Axentra ist ein Backend für mandantenfähige SaaS-Produkte; Axentra Studio ist die optionale Weboberfläche zu seiner Verwaltung.
keywords: Einführung, Überblick, Plattform, Backend, SaaS, Admin-Konsole, Verwaltungsoberfläche, was ist, Architektur, mandantenfähig, Multi-Tenant, Server
---

**Axentra** ist eine Backend-Plattform für Software-as-a-Service-Produkte (SaaS). Axentra stellt die
Bausteine bereit, die fast jede mandantenfähige Anwendung braucht, damit du sie nicht in jedem
Produkt neu bauen musst. **Axentra Studio** ist die Weboberfläche, in der Administratoren,
Betreiber und Support-Mitarbeitende einen Axentra-Server verwalten: seine Produkte, Kunden,
Benutzer, Rollen, API-Schlüssel und Daten.

## Was Axentra leistet {#what-is-axentra}

Axentra übernimmt die „Infrastruktur“ eines SaaS-Produkts:

- **Konten und Anmeldung**: Benutzer, Passwörter, Browser-Sitzungen und Single Sign-on (OpenID Connect).
- **Kunden (Mandanten)**: Jede Kundenorganisation deines Produkts bekommt einen eigenen Mandanten mit
  Mitgliedern und Einladungen. Die Daten verschiedener Mandanten sind strikt getrennt, auch auf Datenbankebene.
- **Zugriffssteuerung**: Rollen, Berechtigungen und API-Schlüssel für Maschinen.
- **Daten**: Datensätze (JSON-Dokumente in Sammlungen) und Dateien.
- **Hintergrundarbeit**: Jobs, Zeitpläne, Ereignisse und Webhooks.
- **Kommerzielle Funktionen**: Nutzungsmessung, Kontingente, Tarife und Abonnements.
- **Benachrichtigungen**: E-Mail-Vorlagen und Zustellung.
- **Audit-Protokoll**: Wer hat wann was getan – für jede Änderung.

Axentra ist ein Python-Paket mit einer PostgreSQL-Datenbank. Es lässt sich auf zwei Arten betreiben:

- **Als HTTP-Dienst** (`axentra serve`): Dein Produkt und andere Clients rufen die versionierte API
  unter `/v1` auf.
- **Als Bibliothek**, eingebettet in deine eigene Python-Anwendung: Dein Code ruft dieselben Dienste
  im selben Prozess auf.

Beide Varianten nutzen dieselben Dienste, Berechtigungsprüfungen und dasselbe Audit-Protokoll.
Welche optionalen Teile aktiv sind, legt der Serverbetreiber über [Module](help:concepts#modules) fest.

## Was Studio ist {#what-is-studio}

Studio ist eine eigenständige Webanwendung, die in deinem Browser läuft. Studio hat **keinen eigenen
Server und keine Sonderrechte**: Es spricht mit dem Axentra-Server ausschließlich über dieselbe
öffentliche HTTP-API, die auch jeder andere Client nutzt. Was du in Studio siehst und tun darfst,
entscheidet der Axentra-Server anhand deiner [Rollen](help:roles-permissions).

Daraus folgen drei Grundsätze:

1. **Studio zeigt nur echte Daten.** Jede Zahl und jede Liste kommt vom Server. Ist ein Modul auf dem
   Server nicht aktiviert, sagt Studio das, statt Platzhalterdaten anzuzeigen.
2. **Der Server entscheidet, Studio erklärt.** Studio bietet Aktionen entsprechend deinen
   Berechtigungen an. Lehnt der Server trotzdem etwas ab, erklärt Studio die Ablehnung und zeigt die
   Anfrage-ID für den Support.
3. **Unumkehrbare Aktionen sind bewusst gewollt.** Löschen, Widerrufen und Sperren verlangen eine
   Bestätigung, und Geheimnisse wie API-Schlüssel werden genau einmal angezeigt.

## Wie Axentra und Studio zusammenhängen {#how-they-relate}

```diagram
architecture
```

- Dein **Produkt** (zum Beispiel ein CRM oder ein Onlineshop) nutzt Axentra über die HTTP-API oder als
  Bibliothek. Seine Endbenutzer sehen Studio nie.
- **Studio** ist ein weiterer Client derselben API, für die Menschen, die die Plattform betreiben.
- **Maschinen** (das Backend deines Produkts, Importjobs, Integrationen) authentifizieren sich mit
  [API-Schlüsseln](help:api-keys).
- Axentra kommuniziert nach außen über **Webhooks** und **E-Mail** und meldet Benutzer optional über
  einen externen **Identitätsanbieter** an.

Studio ist **optional**. Alles, was Studio kann, kann jeder API-Client mit denselben Berechtigungen
auch, und Axentra hängt nie von Studio ab. Die Sicherheit beruht nie auf der Oberfläche: Einen Button
in Studio auszublenden ist eine Bequemlichkeit, jede Regel setzt der Server durch.

> [!NOTE]
> Studio prüft beim Laden die API-Version des Servers. Spricht der Server eine andere Hauptversion
> oder ist er älter, als dieses Studio benötigt, bricht Studio mit **Inkompatible Serverversion** ab.
> Siehe [Fehlerbehebung](help:troubleshooting).

## Wer Studio nutzt {#who-uses-studio}

| Wer                                                   | Typische Aufgaben                                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Plattform-Administratoren                             | Betreiben die gesamte Installation: legen Produkte an, vergeben Plattformrollen, prüfen Systemzustand und Audit. |
| Produktverantwortliche (Product owner, Product admin) | Verwalten ein Produkt: Mandanten, Rollen, API-Schlüssel, Tarife, Vorlagen, Webhooks.                             |
| Support-Mitarbeitende                                 | Lesen Daten und beantworten Kundenfragen, verwalten Mitglieder im Rahmen ihrer eigenen Berechtigungen.           |
| Mandanten-Administratoren                             | Verwalten die Mitglieder und Einladungen ihrer eigenen Organisation.                                             |

Um Studio zu nutzen, musst du nicht programmieren können. Einige Bereiche (Datensätze, Job-Nutzdaten,
Produkteinstellungen) erwarten JSON-Eingaben; die Beispiele in den Artikeln reichen für den Einstieg.

## Typische Szenarien {#scenarios}

- **Ein neuer Server geht live.** Der Betreiber gibt ein Einrichtungs-Token aus; du legst den ersten
  Plattform-Administrator und danach das erste Produkt an. Siehe
  [Ersteinrichtung](help:first-run-setup) und [erste Schritte](help:first-steps).
- **Ein neuer Kunde unterschreibt einen Vertrag.** Du legst einen Mandanten an, lädst den
  Administrator des Kunden ein und erstellst einen API-Schlüssel für seine Integration. Siehe
  [Eine Kundenorganisation einrichten](help:tutorial-onboard-customer).
- **Ein Kunde meldet „Zugriff verweigert“.** Du prüfst die Rolle des Mitglieds, die Berechtigungen des
  API-Schlüssels und die abgelehnten Ereignisse im [Audit-Protokoll](help:audit).
- **Eine Integration braucht Ereignisse.** Du registrierst einen Webhook und beobachtest seine
  Zustellungen. Siehe [Einen Webhook-Empfänger bauen](help:tutorial-webhook-receiver).
- **Der Vertrieb führt einen neuen Preistarif ein.** Du definierst Zähler, Tarife und Abonnements.
  Siehe [Tarife und Nutzung](help:tutorial-plan-usage).

## Was Studio nicht tut {#what-studio-does-not-do}

- Studio installiert oder konfiguriert den Server nicht. Servereinstellungen (Module,
  Anmeldemethoden, erlaubte Origins, der Modus) stehen in der Serverkonfiguration; Studio zeigt unter
  **Einstellungen** nur die wirksamen, nicht geheimen Werte an. Siehe
  [Serverkonfiguration](help:server-configuration).
- Studio legt keine Benutzerkonten direkt an. Konten entstehen bei der Ersteinrichtung, durch
  Single Sign-on oder durch den Code deines Produkts. Siehe [Benutzer](help:users).
- Manche Funktionen sind nur über die API verfügbar. Diese sind unter
  [bekannte Einschränkungen](help:limitations) aufgeführt.

## Fehlerbehebung {#troubleshooting}

| Situation                                              | Was zu tun ist                                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Keine Verbindung zu Axentra** beim Öffnen von Studio | Studio konnte `GET /v1/meta` nicht laden. Prüfe, ob der Axentra-Server läuft und Studio mit der richtigen API-Adresse konfiguriert ist. |
| **Inkompatible Serverversion**                         | Verwende ein Studio-Release, das zur API-Version des Servers passt, oder aktualisiere den Server.                                       |
| Ein Eintrag in der Seitenleiste zeigt **Aus**          | Das zugehörige Servermodul ist nicht aktiviert. Wende dich an den Serverbetreiber. Siehe [Module](help:concepts#modules).               |
| Eine erwartete Aktion fehlt                            | Dir fehlt wahrscheinlich die Berechtigung. Siehe [Rollen und Berechtigungen](help:roles-permissions).                                   |
