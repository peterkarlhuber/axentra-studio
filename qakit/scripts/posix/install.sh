#!/bin/bash
# Axentra Studio QA kit: install Python and the libraries into this folder (needs internet once).
cd "$(dirname "$0")" || exit 1
if [ ! -f "./_kit/common.sh" ]; then
  echo "FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken."
  exit 1
fi
. "./_kit/common.sh"
ensure_terminal "$KIT_ROOT/$(basename "$0")"
set -u
if [ -x "$PY" ]; then "$PY" "$LAUNCHER" stop >/dev/null 2>&1 || true; fi
do_install
echo "Weiter mit \"2 - Starten\"."
pause
