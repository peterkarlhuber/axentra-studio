---
title: Modulreferenz
summary: Die Servermodule von Axentra, welche Bereiche von Studio jedes Modul bereitstellt und was du siehst, wenn ein Modul ausgeschaltet ist.
keywords: Modul, Module, aktiviert, deaktiviert, aus, ausgeschaltet, Funktion, Serverkonfiguration, identity, tenancy, access, data, audit, storage, events, usage, billing, notify, search, realtime
---

Der Axentra-Server besteht aus _Modulen_: Bausteinen wie Dateispeicher, Hintergrundjobs oder
Abrechnung. Ein Betreiber legt in der Serverkonfiguration fest, welche Module laufen. Studio liest
beim Start die Liste der aktivierten Module und passt sich an: Bereiche ausgeschalteter Module
bleiben mit der Kennzeichnung **Aus** in der Seitenleiste, damit du siehst, was es gibt und was ein
Betreiber aktivieren müsste.

## Welche Module sind aktiviert? {#check-modules}

- Das [Dashboard](app:dashboard) listet alle Module unter **Module** in der Serverkarte;
  aktivierte Module sind hervorgehoben, ausgeschaltete grau.
- Die Seite [Einstellungen](app:settings) (mit `platform:settings` oder `product:manage`) zeigt
  die wirksame Konfiguration des Servers, einschließlich der Modulliste.
- In der Seitenleiste trägt ein Bereich eines ausgeschalteten Moduls die Kennzeichnung **Aus**;
  Screenreader sagen „Modul nicht aktiviert“ an.

Standardmäßig ist jedes Modul aktiviert. Die Liste zu ändern ist eine Änderung der
Serverkonfiguration (`modules`, siehe [Serverkonfiguration](help:server-configuration)); sie wird
beim Neustart des Servers wirksam. Studio liest die Liste einmal pro Seitenaufruf; lade Studio
danach also neu.

## Modulübersicht {#overview}

| Modul-ID   | Abschaltbar | Bereiche in Studio                                                                                                        |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `identity` | Nein        | Anmelden, Abmelden, [Profil](help:profile), [Benutzer](help:users), Sitzungen                                             |
| `tenancy`  | Nein        | [Produkte](help:products), [Mandanten](help:tenants), [Mitglieder und Einladungen](help:members-invitations)              |
| `access`   | Nein        | [Rollen](help:roles-permissions), [Berechtigungen](help:permissions-reference), [API-Schlüssel](help:api-keys)            |
| `audit`    | Nein        | [Audit-Protokoll](help:audit)                                                                                             |
| `data`     | Ja          | [Datenübersicht](help:data-overview), [Datensätze](help:records)                                                          |
| `storage`  | Ja          | [Dateien](help:files), Speicherkontingente der Mandanten, die Speicherrichtlinie des Produkts                             |
| `events`   | Ja          | [Jobs](help:jobs), [Zeitpläne](help:schedules), [Ereignisse](help:events) mit der Live-Ansicht, [Webhooks](help:webhooks) |
| `usage`    | Ja          | [Nutzung](help:usage): Zähler, Nutzung pro Mandant, Kontingente, Reservierungen                                           |
| `billing`  | Ja          | [Tarife und Abonnements](help:plans-subscriptions), Abrechnung der Mandanten                                              |
| `notify`   | Ja          | [Benachrichtigungen](help:notifications): Vorlagen, Nachrichtenprotokoll, Postfach, Einstellungen                         |
| `search`   | Ja          | Noch keine Seiten in Studio; die Volltextsuche pro Mandant ist über die API verfügbar                                     |
| `realtime` | Ja          | Wird in der Konfiguration akzeptiert, hat in dieser Version aber keine Wirkung                                            |

[Systemzustand](help:health-monitoring), Monitoring und [Einstellungen](help:settings) gehören zu
keinem Modul und sind immer verfügbar.

## Was passiert, wenn ein Modul aus ist {#when-disabled}

Ist ein Modul ausgeschaltet, bietet der Server seinen Teil der API überhaupt nicht an. In Studio:

- Die Seite des Bereichs zeigt **Modul auf diesem Server nicht aktiviert** und nennt die Modul-ID,
  die aktiviert werden muss, zum Beispiel `storage`. Es wird nichts gelöscht: Daten, die gespeichert
  wurden, als das Modul an war, liegen weiterhin in der Datenbank und erscheinen wieder, sobald das
  Modul erneut eingeschaltet wird.
- Verknüpfungen und Widgets, die vom Modul abhängen, verschwinden, zum Beispiel die Nutzungs- und
  Abrechnungs-Widgets auf dem Dashboard oder die Schaltfläche **Datensätze ansehen** auf einer
  Mandantenseite.
- Eine Aktion, die trotzdem ein ausgeschaltetes Modul erreicht, liefert
  [Modul nicht aktiviert](help:troubleshooting#module-disabled) oder **Nicht gefunden**.

Hinweise pro Modul:

### data {#data}

**Datenübersicht** und **Datensätze** zeigen den Zustand „nicht aktiviert“. Produkte, die ihre
eigenen Daten in eigenen Tabellen speichern, sind nicht betroffen.

### storage {#storage}

**Dateien** zeigt den Zustand „nicht aktiviert“; Speicherkontingente und die Speicherrichtlinie
lassen sich weder lesen noch ändern.

### events {#events}

**Jobs**, **Zeitpläne**, **Ereignisse** und **Webhooks** zeigen den Zustand „nicht aktiviert“,
und es gibt keine Live-Ansicht der Ereignisse. Innerhalb des Servers nutzen andere Module die
Job-Warteschlange weiterhin; nur die Seiten und die API dafür fallen weg.

### usage und billing {#usage-billing}

Ohne `usage` ist **Nutzung** aus, und das Dashboard zeigt keine Nutzungs-Widgets. Ohne `billing`
sind **Tarife** und **Abonnements** aus. Tariflimits fließen nur dann in Nutzungskontingente ein,
wenn **beide** Module aktiviert sind.

### notify {#notify}

**Benachrichtigungen** zeigt den Zustand „nicht aktiviert“. Einladungen funktionieren weiterhin,
aber der Server verschickt keine Einladungs-E-Mails: Gib den Einladungslink oder das Token weiter,
das Studio nach dem Anlegen der Einladung einmal anzeigt (siehe
[Mitglieder und Einladungen](help:members-invitations)).

### search und realtime {#search-realtime}

Studio hat für diese Module keine Seiten. Ob sie ein- oder ausgeschaltet sind, ändert in Studio nichts.

## Im Studio noch nicht verfügbar {#not-in-studio}

Ist ein Modul auf dem Server aktiviert, hat dieses Studio-Release aber keine Seiten dafür, zeigt
der Bereich **Im Studio noch nicht verfügbar**. Verwende die API direkt oder ein neueres
Studio-Release.

## Fehlerbehebung {#troubleshooting}

| Situation                                                                              | Was du tun kannst                                                                                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Ein Bereich zeigt **Aus**                                                              | Bitte einen Betreiber, die Modul-ID zur Einstellung `modules` des Servers hinzuzufügen und den Server neu zu starten; lade dann Studio neu. |
| Ein Betreiber hat ein Modul aktiviert, aber Studio zeigt weiterhin **Aus**             | Lade die Seite neu; Studio liest die Modulliste nur beim Laden.                                                                             |
| Die Konfiguration lässt `identity`, `tenancy`, `access` oder `audit` nicht ausschalten | Diese Module sind erforderlich und lassen sich nicht deaktivieren.                                                                          |
| Einladungen werden angelegt, aber es kommt keine E-Mail an                             | Ist `notify` aktiviert und ein E-Mail-Anbieter konfiguriert? Sonst gib den Link manuell weiter.                                             |
