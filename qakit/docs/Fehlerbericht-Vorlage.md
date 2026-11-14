# Fehlerbericht – Vorlage

Ein Bericht pro Fehler. Kopier den leeren Teil, füll ihn aus, speicher ihn z. B. als `Fehler_B-03.md` oder `Fehler_B-03.txt` im Ordner `QA-Ergebnisse`.
Kurze Sätze reichen. Lieber ein Screenshot zu viel als einer zu wenig.

---

## Leere Vorlage

**Testfall-ID:** (z. B. B-03, steht in der Checkliste)

**Kurz: Was ist kaputt?** (ein Satz)

**Was ich gemacht habe:** (Schritt für Schritt) 1. 2. 3.

**Was ich erwartet habe:**

**Was stattdessen passiert ist:** (genaue Fehlermeldung abschreiben, wenn es eine gibt)

**Passiert es wieder, wenn ich es nochmal versuche?** ☐ Ja, immer ☐ Manchmal ☐ Nur einmal

**Screenshots (Dateinamen):**

**Zeitpunkt:** (Datum und Uhrzeit, z. B. 14.11.2026, 10:42)

**Testbenutzer:** (mit wem warst du angemeldet?)

**Computer und Browser:** (z. B. Windows 11, Chrome 131)

**Kit-Version:** (Kit-Seite /qa/, Tab „Version“)

---

## So findest du die Angaben

**Screenshot machen**

| System                      | Tasten                                                    | Wo landet das Bild?                                                                       |
| --------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Windows                     | **Windows-Taste + Umschalt + S**, dann Bereich ziehen     | In der Zwischenablage. Unten rechts erscheint eine Meldung: anklicken > Speichern-Symbol. |
| Windows (ganzer Bildschirm) | **Windows-Taste + Druck**                                 | Ordner _Bilder > Screenshots_                                                             |
| Mac (Bereich)               | **Cmd + Umschalt + 4**, dann Bereich ziehen               | Auf dem Schreibtisch                                                                      |
| Mac (ganzer Bildschirm)     | **Cmd + Umschalt + 3**                                    | Auf dem Schreibtisch                                                                      |
| Linux                       | **Druck**-Taste (oder Umschalt + Druck für einen Bereich) | Meist Ordner _Bilder/Screenshots_                                                         |

Benenne das Bild nach dem Testfall, z. B. `B-03_1.png`, `B-03_2.png`. Leg es in den Ordner `QA-Ergebnisse`.
Tipp: Mach auch einen Screenshot vom schwarzen Fenster, wenn dort etwas Rotes oder „Error“ steht.

**Uhrzeit:** Steht unten rechts (Windows) oder oben rechts (Mac, Linux) auf dem Bildschirm. Schreib sie direkt nach dem Fehler auf. So findet das Team den Fehler im Protokoll.

**Betriebssystem**

- Windows: **Windows-Taste + R**, `winver` eingeben, Eingabe. Dort steht z. B. „Windows 11, Version 24H2“.
- Mac: Apfel-Menü > **Über diesen Mac**. Dort steht z. B. „macOS Sequoia 15.1“.
- Linux: **Einstellungen > Info** (oder „System > Info“).

**Browser und Version**

- Chrome: Menü (drei Punkte) > **Hilfe** > **Über Google Chrome**.
- Edge: Menü (drei Punkte) > **Hilfe und Feedback** > **Info zu Microsoft Edge**.
- Firefox: Menü (drei Striche) > **Hilfe** > **Über Firefox**.
- Safari: Menü **Safari** > **Über Safari**.

**Kit- und Studio-Version:** Kit-Seite http://127.0.0.1:8765/qa/, Tab **Version**. In Studio auch unter **Systemzustand** > **Versionen**.

---

## Ausgefülltes Beispiel

**Testfall-ID:** G-02

**Kurz: Was ist kaputt?** Das Fenster mit dem Geheimnis des API-Schlüssels geht mit Esc zu, bevor ich den Haken gesetzt habe.

**Was ich gemacht habe:**

1. Als Alex Admin (Test) angemeldet.
2. Links „API-Schlüssel“ > „Neuer API-Schlüssel“.
3. Name „qa-test“, Berechtigung „records:read“, „Schlüssel anlegen“ geklickt.
4. Im Fenster „Geheimnis jetzt kopieren“ die Taste Esc gedrückt.

**Was ich erwartet habe:** Das Fenster bleibt offen, bis ich „Ich habe das Geheimnis sicher gespeichert“ anhake.

**Was stattdessen passiert ist:** Das Fenster ging sofort zu. Das Geheimnis war weg. In der Liste steht der Schlüssel „qa-test“ als „Aktiv“, aber ich kenne sein Geheimnis nicht.

**Passiert es wieder, wenn ich es nochmal versuche?** ☒ Ja, immer ☐ Manchmal ☐ Nur einmal

**Screenshots (Dateinamen):** `G-02_1.png` (Fenster vor Esc), `G-02_2.png` (Liste danach)

**Zeitpunkt:** 14.11.2026, 10:42

**Testbenutzer:** Alex Admin (Test)

**Computer und Browser:** Windows 11 (24H2), Chrome 131

**Kit-Version:** (wie auf /qa/, Tab „Version“ angezeigt)

_(Dieses Beispiel ist erfunden und zeigt nur, wie ein Bericht aussehen soll.)_
