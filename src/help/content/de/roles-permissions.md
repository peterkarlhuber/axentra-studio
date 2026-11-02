---
title: Rollen und Berechtigungen
summary: Verstehe Berechtigungen und die integrierten Rollen, lege eigene Rollen für dein Produkt an und lies den Berechtigungskatalog des Produkts.
keywords: Rolle, Berechtigung, eigene Rolle, benutzerdefinierte Rolle, integrierte Rolle, Zugriffsrechte, Rechte, Privilegien, Geltungsbereich, Produktberechtigung, festgelegte Berechtigung, stillgelegte Berechtigung, RBAC
---

Eine **Berechtigung** erlaubt eine Aktion, zum Beispiel `records:write` (Datensätze anlegen, ändern
und löschen). Eine **Rolle** ist ein benanntes Bündel von Berechtigungen, das du Personen zuweist.
Axentra verweigert standardmäßig alles: Eine Person oder ein API-Schlüssel kann nur tun, was eine
Rolle oder die Berechtigungsliste des Schlüssels ausdrücklich gewährt.

Jede Berechtigung hat einen **Geltungsbereich**:

| Geltungsbereich | Gilt für                                                                 | Gewährt durch                                                                                        |
| --------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Plattform**   | Die gesamte Installation, zum Beispiel `products:create`                 | Nur Plattformrollen; nie eigene Rollen oder API-Schlüssel                                            |
| **Produkt**     | Ein Produkt als Ganzes, zum Beispiel `tenants:create`, `api_keys:manage` | Produktrollen und API-Schlüssel                                                                      |
| **Mandant**     | Daten innerhalb eines Mandanten, zum Beispiel `records:read`             | Mandantenrollen in diesem Mandanten; Produktrollen und produktweite API-Schlüssel in jedem Mandanten |

Die vollständige Liste steht in der [Berechtigungsreferenz](help:permissions-reference).

> [!IMPORTANT]
> Die Seiten **Rollen** und **Berechtigungen** erfordern das Zugriffsmodul und `roles:read` (die Seite
> **Berechtigungen** öffnet sich auch mit `api_keys:read`). Eigene Rollen anlegen, bearbeiten und
> löschen erfordert `roles:manage` (Product owner und Product admin).

## Integrierte Rollen {#built-in-roles}

Integrierte Rollen stellt Axentra bereit; sie lassen sich nicht ändern. Öffne [Rollen](app:roles)
und wähle das Augensymbol, um genau zu sehen, welche Berechtigungen eine integrierte Rolle in deinem
Produkt hat.

| Rolle              | Geltungsbereich | Zweck                                                                                                                                    |
| ------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Product owner**  | Produkt         | Volle Kontrolle über das Produkt, einschließlich Produktverantwortlicher und Produktberechtigungen                                       |
| **Product admin**  | Produkt         | Verwaltet Mandanten, Rollen, Schlüssel und Daten; kann keine Produktverantwortlichen verwalten und keine Produktberechtigungen festlegen |
| **Support**        | Produkt         | Liest alles; verwaltet Mandantenmitglieder im Rahmen der eigenen Berechtigungen (in der Praxis: Betrachter)                              |
| **Product viewer** | Produkt         | Nur Lesezugriff auf das Produkt und alle seine Mandanten                                                                                 |
| **Owner**          | Mandant         | Volle Kontrolle über den Mandanten, einschließlich anderer Owner                                                                         |
| **Admin**          | Mandant         | Dieselben Berechtigungen wie Owner, aber ohne Inhaberrang                                                                                |
| **Member**         | Mandant         | Arbeitet mit den Daten des Mandanten                                                                                                     |
| **Viewer**         | Mandant         | Nur Lesezugriff auf den Mandanten                                                                                                        |

Darüber gibt es zwei Plattformrollen: **Plattform-Administration** und **Plattform-Leserecht**. Diese
werden auf der Seite eines Benutzers vergeben, siehe [Benutzer](help:users#platform-role).

## Eine eigene Rolle anlegen {#create}

Lege eine eigene Rolle an, wenn keine integrierte Rolle passt, zum Beispiel für Support-Mitarbeitende,
die Datensätze lesen dürfen, aber keine Dateien.

1. Öffne [Rollen](app:roles) und wähle **Neue eigene Rolle**.
2. Gib einen **Namen** ein.
3. Prüfe den **Schlüssel**. Studio leitet ihn aus dem Namen ab.
4. Wähle den **Geltungsbereich**: **Mandant** für Rollen, die du Mandantenmitgliedern gibst,
   **Produkt** für Rollen, die du Produktverantwortlichen gibst.
5. Gib optional eine **Beschreibung** ein.
6. Wähle die **Berechtigungen** aus (siehe [die Berechtigungs-Checkliste](#checklist)).
7. Wähle **Änderungen speichern**.

Die Rolle wird jetzt überall angeboten, wo Mitglieder ihres Geltungsbereichs hinzugefügt oder
eingeladen werden.

| Feld                | Was es bewirkt                                                                               | Erlaubte Werte / Standard                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Name**            | Anzeigename in Rollenlisten.                                                                 | 1–100 Zeichen. Änderbar.                                                                                                         |
| **Schlüssel**       | Stabile Kennung, die in Mitgliedschaften gespeichert wird, zum Beispiel `support_agent`.     | 2–41 Kleinbuchstaben, Ziffern oder Unterstriche; eindeutig im Produkt; kein integrierter Schlüssel wie `member`. Nicht änderbar. |
| **Geltungsbereich** | **Mandant**: nur Mandantenberechtigungen. **Produkt**: Produkt- und Mandantenberechtigungen. | Standard **Mandant**. Nicht änderbar.                                                                                            |
| **Beschreibung**    | Erklärt die Rolle anderen Administratoren.                                                   | Bis zu 500 Zeichen.                                                                                                              |
| **Berechtigungen**  | Was die Rolle erlaubt.                                                                       | Bis zu 100 Berechtigungen. Plattformberechtigungen werden nie angeboten.                                                         |

## Eine eigene Rolle bearbeiten {#edit}

Wähle das Stiftsymbol einer eigenen Rolle, ändere Name, Beschreibung oder Berechtigungen und wähle
**Änderungen speichern**. Schlüssel und Geltungsbereich bleiben fest.

> [!WARNING]
> Änderungen gelten sofort für alle, die die Rolle haben, in jedem Mandanten des Produkts.

## Eine eigene Rolle löschen {#delete}

1. Wähle das Papierkorbsymbol der Rolle.
2. Tippe zur Bestätigung den Namen der Rolle ein und wähle **Rolle löschen**.

Eine Rolle, die noch einem Mitglied oder einer bzw. einem Produktverantwortlichen zugewiesen ist,
kann nicht gelöscht werden: Der Server antwortet mit **Konflikt** und der Anzahl der Zuweisungen. Gib
diesen Personen zuerst eine andere Rolle.

## Die Berechtigungs-Checkliste verwenden {#checklist}

Die Checkliste erscheint im Rolleneditor und beim Anlegen eines API-Schlüssels.

- Berechtigungen sind nach Ressource gruppiert (dem Teil vor dem Doppelpunkt, zum Beispiel
  `records`). Das Kontrollkästchen der Gruppe wählt die ganze Gruppe aus oder ab; der Zähler zeigt,
  wie viele ausgewählt sind.
- **Berechtigungen filtern …** durchsucht Namen und Beschreibungen.
- Mit **Produkt** gekennzeichnete Gruppen enthalten Berechtigungen, die dein Produkt selbst
  festgelegt hat.
- Jede Berechtigung zeigt ihre Beschreibung und ihren Geltungsbereich. Einer Mandantenrolle werden
  nur Mandantenberechtigungen angeboten; stillgelegte Produktberechtigungen werden nie angeboten.

> [!NOTE]
> Eine eigene Rolle darf jede Berechtigung ihres Geltungsbereichs enthalten. Die
> [Rollenobergrenze](help:members-invitations#role-ceiling) greift, wenn die Rolle _zugewiesen_
> wird: Nur wer alle ihre Berechtigungen hat, kann sie jemandem geben.

## Vom Produkt festgelegte Berechtigungen {#product-permissions}

Neben dem integrierten Katalog kann ein Produkt eigene Berechtigungen für eigene Funktionen
festlegen, zum Beispiel `crm.deals:approve`. Deren Namen enthalten immer einen Punkt:
`<namespace>.<resource>:<action>`. Einmal festgelegt, lassen sie sich wie integrierte Berechtigungen
über eigene Rollen und API-Schlüssel gewähren, und dein Produktcode prüft sie.

Öffne [Berechtigungen](app:permissions), um den Katalog des Produkts zu sehen. Er ist schreibgeschützt.

| Spalte                    | Bedeutung                                                                                                                                                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Berechtigung**          | Name und Beschreibung.                                                                                                                                                                                                                                                 |
| **Geltungsbereich**       | **Produkt** oder **Mandant**.                                                                                                                                                                                                                                          |
| **Zusätzlich gewährt an** | Integrierte Rollen, die sie zusätzlich zu den automatischen Zuweisungen haben. **Lesende Rollen** bedeutet, dass Support, Product viewer und Plattform-Leserecht sie haben; **Nur Inhaber und Administratoren** bedeutet, dass keine andere integrierte Rolle sie hat. |
| **Festgelegt durch**      | **Produktcode** (beim Start vom Code des Produkts registriert) oder **API** (über die HTTP-API festgelegt).                                                                                                                                                            |
| **Status**                | **Aktiv** oder **Stillgelegt** mit Datum. Schalte **Stillgelegte anzeigen** ein, um stillgelegte aufzulisten.                                                                                                                                                          |

Product owner, Product admin und Plattform-Administratoren haben immer jede aktive
Produktberechtigung; Owner und Admins von Mandanten jede mandantenbezogene.

> [!NOTE]
> Studio kann keine Berechtigungen festlegen oder stilllegen. Das erledigt der Produktcode, oder
> jemand mit `permissions:manage` (Product owner) verwendet die API: `PUT` und `DELETE`
> `/v1/products/{product_id}/permissions/{name}`. Ein Produkt kann bis zu 500 Berechtigungen festlegen.

### Stillgelegte Berechtigungen {#retired}

Eine stillgelegte Berechtigung gewährt nichts, auch wenn sie noch in einer eigenen Rolle oder einem
API-Schlüssel gespeichert ist. Wird sie erneut festgelegt, wirkt sie für diese Inhaber wieder. Beim
Speichern einer eigenen Rolle in Studio werden stillgelegte Namen daraus entfernt, und beim Rotieren
eines API-Schlüssels fehlen sie im Ersatzschlüssel.

## Fehlerbehebung {#troubleshooting}

**Konflikt: „a role with this key exists“ / „this key belongs to a built-in role“.** Wähle einen
anderen Schlüssel.

**Bitte prüfe deine Eingaben: „key must be 2-41 lowercase letters, digits or underscores“.** Entferne
Großbuchstaben, Bindestriche und Leerzeichen aus dem Schlüssel.

**Konflikt: „the role is assigned N times; reassign those members first“.** Ändere die Rolle dieser
Mitglieder (auf den Tabs **Mitglieder** der Mandanten und des Produkts), bevor du die Rolle löschst.

**Bitte prüfe deine Eingaben: „permissions not allowed for a tenant role“.** Eine Mandantenrolle kann
nur Mandantenberechtigungen enthalten.

**Der Berechtigungskatalog konnte nicht geladen werden.** Dir fehlt `roles:read` (oder
`api_keys:read`), oder der Server ist nicht erreichbar. Lade neu oder wende dich an einen Product
owner.

**Zwischenzeitlich geändert.** Jemand anderes hat die Rolle gespeichert, während du sie bearbeitet
hast. Schließe den Editor, öffne die Rolle erneut und wiederhole deine Änderung.

**Eine Berechtigung fehlt in der Checkliste.** Es handelt sich um eine Plattformberechtigung (hier nie
vergebbar), um eine Produktberechtigung des anderen Geltungsbereichs oder um eine stillgelegte.
