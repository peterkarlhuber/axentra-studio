---
title: Audit-Protokoll
summary: Herausfinden, wer wann was auf dem Server getan hat, das Protokoll filtern, eine gefilterte Ansicht teilen und alle Details eines Ereignisses lesen.
keywords: Audit, Audit-Log, Audit-Trail, Verlauf, Historie, Aktivitätsprotokoll, wer hat geändert, Ereignisprotokoll, Compliance, Anfrage-ID, abgelehnt, Anmeldeversuche
---

Das **Audit-Protokoll** hält sicherheitsrelevante und administrative Aktionen auf dem
Axentra-Server fest: wer gehandelt hat (ein Benutzer, ein API-Schlüssel oder das System), was
getan wurde, an welchem Objekt, mit welchem Ergebnis und wann. Damit beantwortest du Fragen wie
„Wer hat diesen API-Schlüssel widerrufen?“, „Warum kann sich dieser Benutzer nicht mehr anmelden?“
oder „Was ist bei der Anfrage mit dieser Anfrage-ID passiert?“.

Die Ereignisse schreibt der Server selbst. Studio liest sie nur: Niemand kann ein einzelnes
Audit-Ereignis bearbeiten oder löschen, auch kein Plattform-Administrator.

> [!IMPORTANT]
> Das Audit-Modul ist immer aktiviert. Um die Ereignisse eines Produkts zu lesen, brauchst du die
> Berechtigung `audit:read` in diesem Produkt (alle integrierten Produktrollen haben sie:
> **Product owner**, **Product admin**, **Support** und **Product viewer**). Ereignisse
> der ganzen Installation, auch solche, die zu keinem Produkt gehören, erfordern `platform:audit`
> (Plattformrollen `platform_admin` und `platform_viewer`). Mandantenrollen können das
> Audit-Protokoll nicht lesen.

## Wer welche Ereignisse sieht {#who-sees-what}

| Du hast                                              | Studio zeigt                                                                                      | Produktfilter                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `platform:audit`                                     | Jedes Ereignis der Installation, auch Anmeldungen, Einrichtung und andere Ereignisse ohne Produkt | **Alle Produkte** (Standard) oder ein Produkt                 |
| `audit:read` in einem Produkt, kein `platform:audit` | Nur die Ereignisse eines Produkts; Studio beginnt mit dem zuletzt verwendeten Produkt             | Eines deiner Produkte; **Alle Produkte** wird nicht angeboten |
| Keins von beiden                                     | **Audit-Protokoll** fehlt in der Seitenleiste; ein direkter Link zeigt **Nicht erlaubt**          | –                                                             |

Der Server prüft die Berechtigung bei jeder Anfrage. Wählst du ein Produkt, das du nicht lesen
darfst, kommt **Nicht erlaubt** zurück, und ein Ereignis, das du nicht lesen darfst, lässt sich
nicht im Detail öffnen (siehe [Fehlerbehebung](#troubleshooting)).

> [!NOTE]
> Ereignisse ohne Produkt, etwa `identity.login`, `identity.logout` oder
> `identity.setup.complete`, sind nur mit `platform:audit` sichtbar.

## Das Audit-Protokoll öffnen {#open}

1. Öffne in der Seitenleiste **Audit & Überwachung** › **Audit-Protokoll** ([öffnen](app:audit)).
2. Die neuesten Ereignisse stehen oben. Scrolle ans Ende der Tabelle, um weitere zu laden.

Jede Zeile zeigt **Zeitpunkt**, **Aktion**, **Akteur**, **Ziel** und **Ergebnis**. Auf dem Smartphone
werden nur **Zeitpunkt** und **Aktion** angezeigt; öffne die Details, um den Rest zu sehen.

## Ereignisse filtern {#filter}

1. Gib ein Wort in **Suche** ein. Auf einem schmalen Bildschirm wählst du **Weitere Filter**, um
   die anderen Felder zu sehen; die Zahl in Klammern zeigt, wie viele Filter aktiv sind.
2. Fülle beliebige weitere Filter aus. Alle Filter werden kombiniert (ein Ereignis muss jeden
   erfüllen).
3. Wähle **Filter anwenden**. Studio lädt neue Ergebnisse erst, wenn du die Filter anwendest.
4. Um neu anzufangen, wähle **Filter zurücksetzen**.

| Filter            | Was er findet                                                                                                     | Beispiel                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Suche**         | Teil der Aktion, der Ziel-ID, des Akteursnamens oder der Akteur-ID (ohne Rücksicht auf Groß- und Kleinschreibung) | `acme`, `api_key`                    |
| **Produkt**       | Ereignisse eines Produkts                                                                                         | –                                    |
| **Mandanten-ID**  | Ereignisse in einem Mandanten (exakte ID)                                                                         | `ten_01EXAMPLE`                      |
| **Aktion**        | Der exakte Aktionsname oder ein Präfix, wenn er auf `*` endet                                                     | `access.api_key.revoke`, `tenancy.*` |
| **Akteur-ID**     | Ereignisse eines Benutzers oder API-Schlüssels (exakte ID)                                                        | `usr_01EXAMPLE`, `key_01EXAMPLE`     |
| **Ergebnis**      | **Erfolgreich**, **Abgelehnt** oder **Fehlschlag**                                                                | –                                    |
| **Von** / **Bis** | Zeitraum in deiner Ortszeit. **Von** ist eingeschlossen, **Bis** nicht                                            | –                                    |

Der Server akzeptiert höchstens 100 Zeichen für **Aktion** und 200 für **Suche**.

### Eine gefilterte Ansicht teilen {#share}

Die angewendeten Filter sind Teil der Seitenadresse, zum Beispiel
`/audit?actor_id=usr_01EXAMPLE&outcome=denied`. Kopiere die Adresse aus dem Browser, um genau
diese Ansicht zu teilen oder als Lesezeichen zu speichern. Wer den Link öffnet, sieht nur die
Ereignisse, die die eigenen Berechtigungen erlauben.

## Die Details eines Ereignisses lesen {#event-detail}

1. Wähle die Detailschaltfläche am Ende einer Zeile (**Details zu … anzeigen**).
2. Seitlich öffnet sich ein Bereich mit allen Feldern des Ereignisses und seinen **Details**.

| Feld                                             | Bedeutung                                                                                                                                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ereignis-ID**                                  | ID des Audit-Ereignisses (`aud_…`)                                                                                                                                                                        |
| **Zeitpunkt**                                    | Wann der Server das Ereignis festgehalten hat                                                                                                                                                             |
| **Aktion**                                       | Was passiert ist, als `module.object.verb`                                                                                                                                                                |
| **Akteur** / **Art des Akteurs** / **Akteur-ID** | Wer gehandelt hat. Arten: `user`, `api_key`, `system` (der Server selbst, zum Beispiel eine geplante Aufgabe) und `anonymous` (niemand war angemeldet, zum Beispiel bei einer fehlgeschlagenen Anmeldung) |
| **Produkt** / **Mandant**                        | Wo es passiert ist; leer bei installationsweiten Ereignissen                                                                                                                                              |
| **Ziel**                                         | Das Objekt, auf das sich die Aktion bezog: Typ und ID (zum Beispiel `api_key · key_01EXAMPLE`)                                                                                                            |
| **Ergebnis**                                     | Siehe [Ergebnisse](#outcomes)                                                                                                                                                                             |
| **Anfrage-ID**                                   | Die `X-Request-ID` der HTTP-Anfrage, die das Ereignis ausgelöst hat                                                                                                                                       |
| **IP-Adresse**                                   | Die Clientadresse, wie der Server sie sieht (hinter einem Proxy nur, wenn der Proxy vertrauenswürdig ist)                                                                                                 |
| **Details**                                      | Zusätzliche Daten als JSON, zum Beispiel die geänderten Felder oder der Grund einer Ablehnung                                                                                                             |

> [!NOTE]
> Der Server entfernt Geheimnisse (Passwörter, Tokens, Schlüssel) aus den Details, bevor er sie
> speichert. Im Audit-Protokoll findest du nie ein Geheimnis.

### Ergebnisse {#outcomes}

| Ergebnis        | Bedeutung                                                                                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Erfolgreich** | Die Aktion wurde ausgeführt.                                                                                                                                                                               |
| **Abgelehnt**   | Der Server hat die Aktion abgelehnt, zum Beispiel eine Anmeldung mit falschem Passwort, eine Passwortänderung mit falschem aktuellem Passwort oder ein erstes Passwort ohne kurz zuvor erfolgte Anmeldung. |
| **Fehlschlag**  | Die Aktion wurde versucht, war aber nicht erfolgreich.                                                                                                                                                     |

Eine wegen fehlender Berechtigungen abgelehnte Anfrage wird meist **nicht** festgehalten: Der
Client erhält nur `403`. Suche vor allem rund um Anmeldung und
Passwörter nach Ereignissen mit **Abgelehnt**.

## Eine Anfrage über ihre Anfrage-ID verfolgen {#request-id}

Jede Fehlermeldung in Studio zeigt unter **Technische Details** eine **Anfrage-ID**. So findest du
heraus, was diese Anfrage geändert hat:

1. Kopiere die Anfrage-ID aus der Fehlermeldung.
2. Die Audit-Suche erfasst keine Anfrage-IDs. Grenze die Liste mit **Von** / **Bis** ein (und mit
   der **Akteur-ID**, falls du sie kennst), öffne die infrage kommenden Ereignisse und vergleiche
   ihre **Anfrage-ID**.
3. Passt kein Ereignis, hat die Anfrage nichts geändert, was auditiert wird. Gib die Anfrage-ID an
   deinen Betreiber weiter: Die Serverprotokolle enthalten dieselbe ID.

Wie Anfrage-IDs funktionieren, steht unter [Anfrage-IDs](help:api-basics#request-ids).

## Was festgehalten wird {#what-is-recorded}

Aktionen heißen `module.object.verb`. Typische Beispiele:

| Bereich                                 | Aktionen                                                                                                                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anmeldung und Konten                    | `identity.login`, `identity.logout`, `identity.password.change`, `identity.session.revoke`, `identity.session.revoke_all`, `identity.platform_role.set`, `identity.setup.complete` |
| Produkte, Mandanten, Mitglieder         | `tenancy.product.create`, `tenancy.tenant.create`, `tenancy.tenant.update`, `tenancy.member.set`, `tenancy.invitation.create`, `tenancy.invitation.accept`                         |
| Zugriff                                 | `access.role.create`, `access.api_key.create`, `access.api_key.rotate`, `access.api_key.revoke`                                                                                    |
| Daten und Dateien                       | `data.record.delete`, `storage.file.upload`, `storage.file.delete`, `storage.policy.update`                                                                                        |
| Ereignisse und Jobs                     | `events.job.enqueue`, `events.job.cancel`, `events.schedule.update`, `events.webhook.rotate_secret`                                                                                |
| Nutzung, Abrechnung, Benachrichtigungen | `usage.quota.set`, `billing.plan.update`, `notify.template.update`, `notify.message.enqueue`                                                                                       |

Nicht alles ist ein Audit-Ereignis: Lesezugriffe werden nicht festgehalten, und das Anlegen oder
Ändern eines Datensatzes auch nicht (das Löschen schon). Produkt-Backends, die auf Axentra
aufbauen, können eigene Aktionen ergänzen.

## Aufbewahrung {#retention}

Audit-Ereignisse werden `observability.audit_retention_days` lang aufbewahrt (Standard 365 Tage).
Gelöscht werden sie erst, wenn der Betreiber die Wartungsaufgabe `axentra maintenance purge`
ausführt. Bis dahin bleiben ältere Ereignisse sichtbar. Der konfigurierte Wert steht unter
**Wartung und Aufbewahrung** auf der Seite [Monitoring](help:health-monitoring#retention).

## Gut zu wissen {#good-to-know}

- Die Liste ist nach Zeit sortiert, neueste zuerst; die Reihenfolge lässt sich nicht ändern.
- Zeiten werden in der Zeitzone deines Browsers angezeigt; die API speichert und filtert in UTC.
- Einen Export gibt es in Studio nicht. Entwickler können das Protokoll über die API
  (`GET /v1/audit`, Cursor-Paginierung) oder die SDKs (`audit.list`, `audit.iter`) lesen; siehe
  [API-Grundlagen](help:api-basics#pagination).

## Fehlerbehebung {#troubleshooting}

- **Nicht erlaubt** beim Öffnen der Seite: Du hast kein `audit:read` im gewählten Produkt. Wähle ein Produkt, in dem du eine Produktrolle hast, oder bitte einen Product owner oder Plattform-Administrator um Zugriff.
- **Keine passenden Ereignisse**: Die Filter sind zu eng. Prüfe, ob **Aktion** exakt geschrieben ist (Aktionen heißen `tenancy.tenant.create`, nicht `tenant.created`), oder beende sie mit `*`, erweitere **Von** / **Bis** oder wähle **Filter zurücksetzen**.
- **Noch keine Audit-Ereignisse**, obwohl sich etwas geändert hat: Du siehst ein einzelnes Produkt, aber die Änderung war installationsweit (zum Beispiel eine Anmeldung). Solche Ereignisse erfordern `platform:audit`. Prüfe auch, ob die Aktion überhaupt festgehalten wird (siehe [Was festgehalten wird](#what-is-recorded)).
- **Das vollständige Ereignis konnte nicht geladen werden** (im Detailbereich): Die Aufbewahrungsaufgabe hat das Ereignis gelöscht, oder es gehört zu einem Produkt (oder zu keinem Produkt), das du nicht lesen darfst. Der Server antwortet in beiden Fällen mit `404` und verrät so nicht, ob das Ereignis existiert. Studio zeigt stattdessen die Werte aus der Liste.
- **Bitte prüfe deine Eingaben**: Ein Filterwert wurde abgelehnt, zum Beispiel eine **Aktion** mit mehr als 100 Zeichen oder eine **Suche** mit mehr als 200 Zeichen.
