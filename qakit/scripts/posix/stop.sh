#!/bin/bash
# Axentra Studio QA kit: stop Studio, Axentra and the database.
cd "$(dirname "$0")" || exit 1
if [ ! -f "./_kit/common.sh" ]; then
  echo "FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken."
  exit 1
fi
. "./_kit/common.sh"
ensure_terminal "$KIT_ROOT/$(basename "$0")"
if [ -x "$PY" ]; then
  "$PY" "$LAUNCHER" stop
else
  echo "Axentra Studio ist nicht installiert."
fi
pause
