#!/bin/bash
# Axentra Studio QA kit: stop everything and remove what the kit installed or wrote into this folder
# (Python, libraries, test data). Backups and QA results stay until you delete the folder.
cd "$(dirname "$0")" || exit 1
if [ ! -f "./_kit/common.sh" ]; then
  echo "FEHLER: Der Ordner _kit fehlt. Bitte das Testpaket neu entpacken."
  exit 1
fi
. "./_kit/common.sh"
ensure_terminal "$KIT_ROOT/$(basename "$0")"
echo "Deinstallieren beendet Axentra Studio und entfernt Python, die Bibliotheken und die Testdaten"
echo "aus diesem Ordner: $KIT_ROOT"
echo "Ausserhalb dieses Ordners wurde nichts installiert oder veraendert."
if ! ask_yes "Fortfahren?"; then
  echo "Abgebrochen, nichts wurde entfernt."
  pause
  exit 0
fi
case "$KIT" in
  /*/_kit) ;;
  *) fail "Unerwarteter Ordner ($KIT); es wurde nichts entfernt." ;;
esac
[ -f "$KIT/common.sh" ] && [ -f "$KIT/app/launcher.py" ] || fail "Unerwarteter Ordner ($KIT); es wurde nichts entfernt."
if [ -x "$PY" ]; then
  if [ -d "$KIT/daten" ] && ask_yes "Vorher die Testdaten sichern (Ordner \"Sicherungen\")?"; then
    "$PY" "$LAUNCHER" backup || fail "Die Sicherung ist fehlgeschlagen; es wurde nichts entfernt."
  fi
  "$PY" "$LAUNCHER" cleanup || fail "Axentra Studio konnte nicht beendet werden; es wurde nichts entfernt."
elif [ -f "$KIT/daten/pg/postmaster.pid" ]; then
  "$KIT/pg/bin/pg_ctl" stop -D "$KIT/daten/pg" -m fast -w >/dev/null 2>&1 || true
fi
rm -rf "$KIT/env" "$KIT/python" "$KIT/cache" "$KIT/daten"
for d in env python cache daten; do
  [ -e "$KIT/$d" ] && fail "Der Ordner _kit/$d konnte nicht vollstaendig entfernt werden. Bitte \"3 - Beenden\" ausfuehren und erneut versuchen."
done
echo
echo "Entfernt. Zum Schluss den Ordner \"$(basename "$KIT_ROOT")\" in den Papierkorb ziehen"
echo "(vorher die Ordner \"Sicherungen\" und \"QA-Ergebnisse\" woanders hin kopieren, falls du sie behalten willst)."
pause
