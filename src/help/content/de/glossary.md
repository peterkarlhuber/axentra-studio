---
title: Glossar
summary: Kurze Erklärungen der Begriffe, die in Axentra und Studio verwendet werden, mit Links zu den Details.
keywords: Glossar, Begriffe, Definitionen, Fachbegriffe, Bedeutung, was ist, Wörterbuch, Begriffserklärung
---

Kurze Definitionen der Begriffe, die in Studio und in dieser Hilfe verwendet werden. Die Einträge
sind nach dem englischen Begriff alphabetisch sortiert, der in Klammern steht, wo er abweicht. Jeder
Eintrag verweist auf den Artikel mit den Details.

## API-Schlüssel (API key) {#api-key}

Zugangsdaten für Maschinen (Format `axk_…`), die die Axentra-API für ein Produkt aufrufen, mit
einer expliziten Liste von Berechtigungen und optional an einen Mandanten gebunden. Siehe
[API-Schlüssel](help:api-keys).

## Archivieren (Archive) {#archive}

Ein Produkt außer Betrieb nehmen, ohne es zu löschen. In einem archivierten Produkt können nur noch
Plattform-Administratoren arbeiten; es lässt sich wiederherstellen. Siehe [Produkte](help:products).

## Audit-Protokoll (Audit log) {#audit-log}

Die nur erweiterbare Aufzeichnung, wer wann was auf dem Server geändert hat, mit Ergebnis,
Anfrage-ID und IP-Adresse. Siehe [Audit-Protokoll](help:audit).

## Integrierte Rolle (Built-in role) {#built-in-role}

Eine Rolle, die Axentra in jedem Produkt bereitstellt, etwa **Product admin**, **Owner** oder
**Viewer**. Eine integrierte Rolle lässt sich nicht ändern. Siehe die
[Berechtigungsreferenz](help:permissions-reference#built-in-roles).

## Checkout {#checkout}

Das Bezahlen eines Tarifs auf der gehosteten Seite des Zahlungsanbieters. Studio verarbeitet nie
Kartendaten. Siehe [Tarife und Abonnements](help:plans-subscriptions).

## Sammlung (Collection) {#collection}

Eine benannte Gruppe von Datensätzen in einem Mandanten, zum Beispiel `contacts`. Siehe
[Datensätze](help:records).

## Cron-Ausdruck (Cron expression) {#cron-expression}

Fünf Felder (Minute, Stunde, Tag des Monats, Monat, Wochentag), die beschreiben, wann ein Zeitplan
läuft, immer in UTC. Siehe [Zeitpläne](help:schedules).

## CSRF {#csrf}

Cross-Site Request Forgery: ein Angriff, bei dem eine andere Website versucht, über deinen
angemeldeten Browser Änderungen zu senden. Studio und der Server blockieren das automatisch. Siehe
[Sicherheit](help:security#csrf).

## Eigene Rolle (Custom role) {#custom-role}

Eine für ein Produkt definierte Rolle mit einer gewählten Menge von Berechtigungen, für ein
Produkt oder einen Mandanten. Siehe [Rollen und Berechtigungen](help:roles-permissions).

## Zustellung (Delivery) {#delivery}

Eine Kette von Versuchen, ein Ereignis an einen Webhook-Endpunkt zu senden, mit Status, Antwort und
Wiederholungen. Siehe [Webhooks](help:webhooks).

## Leistung eines Tarifs (Entitlement) {#entitlement}

Eine Funktion (ein oder aus) oder ein Limit, das ein Tarif den Mandanten gewährt, die ihn
abonniert haben. Nicht zu verwechseln mit einer [Berechtigung](#permission), die festlegt, was eine
Person oder ein Schlüssel tun darf. Siehe [Tarife und Abonnements](help:plans-subscriptions).

## Ereignis (Event) {#event}

Eine Nachricht deines Produkts, dass etwas passiert ist, zum Beispiel `invoice.created`. Ereignisse
können Webhooks und Handler auslösen. Siehe [Ereignisse](help:events).

## Übergangsfrist (Grace period) {#grace-period}

Die Zeit nach dem Erneuern eines Geheimnisses, in der das alte Geheimnis noch funktioniert
(höchstens 7 Tage), damit Dienste ohne Ausfall umstellen können. Siehe
[API-Schlüssel](help:api-keys) und [Webhooks](help:webhooks).

## Idempotenzschlüssel (Idempotency key) {#idempotency-key}

Ein eindeutiger Wert, der mit einer Anfrage gesendet wird, damit eine wiederholte gleiche Anfrage
nicht doppelt ausgeführt wird. Einen Schlüssel mit anderen Werten erneut zu verwenden, wird
abgelehnt. Siehe [Fehlerbehebung](help:troubleshooting#idempotency-conflict).

## Einladung (Invitation) {#invitation}

Ein Angebot an eine E-Mail-Adresse, einem Mandanten mit einer bestimmten Rolle beizutreten. Link
und Token werden einmal angezeigt. Siehe [Mitglieder und Einladungen](help:members-invitations).

## Job {#job}

Eine Hintergrundaufgabe, die ein Worker ausführt, mit Wiederholungen bei Fehlern. Siehe
[Jobs](help:jobs).

## Mitglied (Member) {#member}

Ein Benutzer, der mit einer Mandantenrolle zu einem Mandanten gehört. Auch der Name der
integrierten Mandantenrolle **Member**, die mit den Daten des Mandanten arbeitet. Siehe
[Mitglieder und Einladungen](help:members-invitations).

## Zähler (Meter) {#meter}

Etwas, das ein Produkt misst, etwa API-Aufrufe oder Speicher, und wie es zusammengefasst (Summe,
Maximum oder letzter Wert) und zurückgesetzt wird. Siehe [Nutzung](help:usage).

## Modul (Module) {#module}

Ein Baustein des Axentra-Servers (zum Beispiel `storage` oder `billing`), den ein Betreiber ein-
oder ausschalten kann. Siehe die [Modulreferenz](help:modules-reference).

## Mehrproduktbetrieb (Multi-product mode) {#multi-product-mode}

Eine Betriebsart des Servers, in der eine Installation viele Produkte beherbergt, die
Plattform-Administratoren anlegen. Siehe [Grundbegriffe](help:concepts).

## Owner-Rang (Owner rank) {#owner-rank}

Der besondere Rang der Rollen **Owner** (Mandant) und **Product owner**: Nur ein Owner desselben
Bereichs oder jemand mit Befugnis von einer höheren Ebene darf ihn vergeben oder entziehen. Siehe
[Rollenobergrenze](help:security#role-ceiling).

## Berechtigung (Permission) {#permission}

Ein einzelnes Recht in der Form `resource:action`, zum Beispiel `files:write`, mit dem
Geltungsbereich Plattform, Produkt oder Mandant. Siehe die
[Berechtigungsreferenz](help:permissions-reference).

## Tarif (Plan) {#plan}

Ein Angebot mit Preisen und Leistungen, das Mandanten abonnieren. Siehe
[Tarife und Abonnements](help:plans-subscriptions).

## Plattformrolle (Platform role) {#platform-role}

Eine installationsweite Rolle: **Plattform-Administration** (alles) oder **Plattform-Leserecht**
(Lesezugriff überall). Nur Plattform-Administratoren können sie vergeben. Siehe
[Benutzer](help:users).

## Produkt (Product) {#product}

Eine Anwendung, die auf dem Axentra-Server läuft, mit eigenen Mandanten, Rollen, Schlüsseln und
Daten. Siehe [Produkte](help:products).

## Produktverantwortlicher (Product operator) {#product-operator}

Ein Benutzer mit einer Produktrolle wie **Product owner** oder **Support**, der am Produkt als
Ganzem arbeitet. Siehe [Produkte](help:products).

## Produktberechtigung (Product permission) {#product-permission}

Eine Berechtigung, die ein Produkt selbst deklariert, benannt etwa wie `crm.deals:approve`. Siehe
die [Berechtigungsreferenz](help:permissions-reference#product-defined).

## Kontingent (Quota) {#quota}

Eine Obergrenze für die Nutzung oder den Speicher eines Mandanten. Wird sie überschritten, erscheint
[Kontingent überschritten](help:troubleshooting#quota-exceeded). Siehe [Nutzung](help:usage).

## Datensatz (Record) {#record}

Ein JSON-Objekt, das in einer Sammlung eines Mandanten gespeichert ist. Siehe
[Datensätze](help:records).

## Anfrage-ID (Request ID) {#request-id}

Die Kennung `req_…` jeder Serveranfrage, angezeigt in den Fehlerdetails und im Audit-Protokoll; der
Schlüssel für den Support. Siehe [Fehlerbehebung](help:troubleshooting#request-id).

## Reservierung (Reservation) {#reservation}

Im Voraus gebuchte Nutzung, die später mit der tatsächlichen Menge verbucht oder freigegeben wird.
Siehe [Nutzung](help:usage).

## Rolle (Role) {#role}

Ein benanntes Bündel von Berechtigungen, das Personen zugewiesen wird (oder, als
Berechtigungsliste, API-Schlüsseln). Siehe [Rollen und Berechtigungen](help:roles-permissions).

## Rollenobergrenze (Role ceiling) {#role-ceiling}

Die Regel, dass niemand eine Rolle mit Berechtigungen vergeben kann, die er selbst nicht hat. Siehe
[Sicherheit](help:security#role-ceiling).

## Erneuerung (Rotation) {#rotation}

Ein Geheimnis durch ein neues ersetzen, optional mit Übergangsfrist. Siehe
[API-Schlüssel](help:api-keys).

## Row-Level Security {#row-level-security}

Eine Datenbankfunktion, die jede Transaktion auf die Zeilen eines Produkts oder Mandanten
beschränkt, als zweite Verteidigungslinie hinter den Berechtigungsprüfungen. Siehe
[Sicherheit](help:security#tenant-isolation).

## Zeitplan (Schedule) {#schedule}

Eine Regel, die einen Job in festen Abständen oder zu Cron-Zeitpunkten einreiht. Siehe
[Zeitpläne](help:schedules).

## Sitzung (Session) {#session}

Der angemeldete Zustand eines Browsers. Eine Sitzung endet nach einer maximalen Lebensdauer, bei
Inaktivität, beim Abmelden oder wenn sie beendet wird. Siehe [Sicherheit](help:security#sessions).

## Einrichtungstoken (Setup token) {#setup-token}

Ein einmaliges Token, das auf dem Server ausgegeben wird und den ersten Plattform-Administrator
anlegt. Siehe [Ersteinrichtung](help:first-run-setup).

## Signaturgeheimnis (Signing secret) {#signing-secret}

Das Geheimnis (`whsec_…`), mit dem Axentra Webhook-Anfragen signiert (HMAC-SHA256), damit
Empfänger sie prüfen können. Siehe [Webhooks](help:webhooks) und
[Sicherheit](help:security#webhook-signing).

## Einzelproduktbetrieb (Single-product mode) {#single-product-mode}

Eine Betriebsart des Servers mit genau einem Produkt, das aus der Serverkonfiguration angelegt
wird; Produkte lassen sich weder anlegen noch archivieren. Siehe [Grundbegriffe](help:concepts).

## Kurzname (Slug) {#slug}

Eine kurze, URL-taugliche Kennung eines Produkts oder Mandanten, zum Beispiel `acme`. Der Kurzname ist
eindeutig und darf keine Leerzeichen enthalten. Siehe [Mandanten](help:tenants).

## Abonnement (Subscription) {#subscription}

Die Buchung eines Tarifs durch einen Mandanten, mit Status (zum Beispiel Testphase, aktiv,
überfällig) und Zeitraum. Siehe [Tarife und Abonnements](help:plans-subscriptions).

## Sperren (Suspend) {#suspend}

Den Zugriff auf einen Mandanten blockieren, ohne seine Daten zu löschen. Er lässt sich wieder
aktivieren. Siehe [Mandanten](help:tenants).

## Vorlage (Template) {#template}

Eine Benachrichtigungs-E-Mail mit Sprachvarianten und Variablen. Siehe
[Benachrichtigungen](help:notifications).

## Mandant (Tenant) {#tenant}

Ein Kunde oder eine Organisation innerhalb eines Produkts. Die Daten jedes Mandanten sind strikt
getrennt. Siehe [Mandanten](help:tenants).

## UTC {#utc}

Koordinierte Weltzeit, die Zeitbasis aller Zeitpläne. Studio zeigt Zeiten, wo möglich, in deiner
eigenen Zeitzone.

## Webhook {#webhook}

Eine signierte HTTP-Anfrage, die Axentra an ein anderes System sendet, wenn ein Ereignis eintritt.
Siehe [Webhooks](help:webhooks).

## Worker {#worker}

Ein Serverprozess, der Jobs, Zeitpläne und Webhook-Zustellungen ausführt. Ohne laufenden Worker
bleiben Jobs in der Warteschlange. Siehe [Jobs](help:jobs).
