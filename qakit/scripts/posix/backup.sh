#!/bin/bash
# Axentra Studio QA kit: copy the test data into the folder "Sicherungen" (stops Axentra Studio first).
cd "$(dirname "$0")" || exit 1
if [ ! -f "./_kit/common.sh" ]; then
  echo "FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken."
  exit 1
fi
. "./_kit/common.sh"
ensure_terminal "$KIT_ROOT/$(basename "$0")"
[ -x "$PY" ] || fail "Axentra Studio ist nicht installiert; es gibt nichts zu sichern."
echo "Zum Sichern wird Axentra Studio beendet, falls es laeuft."
"$PY" "$LAUNCHER" backup || fail "Die Sicherung ist fehlgeschlagen."
pause
