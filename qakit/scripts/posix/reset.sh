#!/bin/bash
# Axentra Studio QA kit: delete the test data; the next start creates fresh synthetic test data.
cd "$(dirname "$0")" || exit 1
if [ ! -f "./_kit/common.sh" ]; then
  echo "FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken."
  exit 1
fi
. "./_kit/common.sh"
ensure_terminal "$KIT_ROOT/$(basename "$0")"
[ -x "$PY" ] || fail "Axentra Studio ist nicht installiert."
echo "Zuruecksetzen loescht alle Testdaten (Datenbank, Dateien, abgefangene E-Mails)."
echo "Deine QA-Ergebnisse im Ordner \"QA-Ergebnisse\" und alte Sicherungen bleiben erhalten."
if ! ask_yes "Wirklich zuruecksetzen?"; then
  echo "Abgebrochen, nichts wurde geloescht."
  pause
  exit 0
fi
if ask_yes "Vorher eine Sicherung anlegen?"; then
  "$PY" "$LAUNCHER" backup || fail "Die Sicherung ist fehlgeschlagen; es wurde nichts geloescht."
fi
"$PY" "$LAUNCHER" reset || fail "Zuruecksetzen ist fehlgeschlagen."
echo "Weiter mit \"2 - Starten\"."
pause
