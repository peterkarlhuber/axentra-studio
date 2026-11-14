#!/bin/bash
# Axentra Studio QA kit: start the database, Axentra and Studio, and open the browser.
cd "$(dirname "$0")" || exit 1
if [ ! -f "./_kit/common.sh" ]; then
  echo "FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken."
  exit 1
fi
. "./_kit/common.sh"
ensure_terminal "$KIT_ROOT/$(basename "$0")"
if ! installed; then
  QA_KIT_NO_PAUSE=1 do_install
  echo
fi
echo "Axentra Studio startet. Dieses Fenster bitte offen lassen, solange du testest."
echo "Beenden: \"3 - Beenden\" oder dieses Fenster schliessen."
echo
"$PY" "$LAUNCHER" start
STATUS=$?
echo
[ "$STATUS" -eq 0 ] && echo "Axentra Studio wurde beendet." || echo "Axentra Studio wurde mit einem Fehler beendet (Code $STATUS)."
pause
