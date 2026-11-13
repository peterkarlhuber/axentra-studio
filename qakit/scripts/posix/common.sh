# Shared settings of the Axentra Studio QA kit (macOS and Linux). Sourced by the scripts; not run directly.
# Everything the kit installs or writes stays inside this folder.

KIT_ROOT="$(pwd -P)"  # every script cds to its own folder before sourcing this file
KIT="$KIT_ROOT/_kit"
ENV_DIR="$KIT/env"
PY="$ENV_DIR/bin/python"
LAUNCHER="$KIT/app/launcher.py"

# Settings of a uv the user may have configured elsewhere must not redirect the kit.
unset UV_INDEX UV_INDEX_URL UV_DEFAULT_INDEX UV_EXTRA_INDEX_URL UV_FIND_LINKS UV_PYTHON_INSTALL_MIRROR \
  UV_PYPY_INSTALL_MIRROR UV_PYTHON_DOWNLOADS_JSON_URL UV_PYTHON_DOWNLOADS UV_OFFLINE UV_CONSTRAINT UV_OVERRIDE \
  UV_PYTHON UV_INSECURE_HOST PIP_INDEX_URL PIP_EXTRA_INDEX_URL PYTHONPATH PYTHONHOME AXENTRA_CONFIG 2>/dev/null
export UV_CACHE_DIR="$KIT/cache"
export UV_PYTHON_INSTALL_DIR="$KIT/python"
export UV_NO_CONFIG=1
export UV_NO_PROGRESS=1
export UV_PYTHON_PREFERENCE="${UV_PYTHON_PREFERENCE:-only-managed}"

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) UV="$KIT/bin/macos-arm64/uv" ;;
  Darwin-x86_64) UV="$KIT/bin/macos-x64/uv" ;;
  Linux-x86_64) UV="$KIT/bin/linux-x64/uv" ;;
  *) UV="" ;;
esac

pause() {
  [ -n "${QA_KIT_NO_PAUSE:-}" ] && return 0
  echo
  printf 'Zum Schliessen die Eingabetaste druecken ... '
  read -r _ || true
}

fail() {
  echo
  echo "FEHLER: $1"
  pause
  exit 1
}

ask_yes() {
  printf '%s (j/n) ' "$1"
  read -r ANSWER || ANSWER=n
  case "$ANSWER" in
    j|J|ja|Ja|JA|y|Y|yes) return 0 ;;
    *) return 1 ;;
  esac
}

installed() {
  [ -x "$PY" ] && [ -f "$KIT/env/.qa-kit-installed" ]
}

# Linux file managers may run a script without a terminal ("Run as program"); then reopen it in one, so that the
# tester sees what happens and can answer prompts.
ensure_terminal() {
  [ -t 0 ] && return 0
  [ "$(uname -s)" = "Linux" ] || return 0
  [ -n "${QA_KIT_NO_TERMINAL:-}" ] && return 0
  [ -n "${QA_KIT_REOPENED:-}" ] && return 0
  export QA_KIT_REOPENED=1
  for term in x-terminal-emulator gnome-terminal konsole xfce4-terminal mate-terminal lxterminal xterm; do
    command -v "$term" >/dev/null 2>&1 || continue
    case "$term" in
      gnome-terminal) exec "$term" -- bash "$1" ;;
      *) exec "$term" -e bash "$1" ;;
    esac
  done
  return 0
}

do_install() {
  echo "Axentra Studio (lokale Testversion) wird installiert."
  echo "Alles bleibt in diesem Ordner: $KIT_ROOT"
  echo
  [ -n "$UV" ] && [ -f "$UV" ] || fail "Dieses System wird vom Testpaket nicht unterstuetzt ($(uname -s) $(uname -m))."
  if [ "$(uname -s)" = "Darwin" ]; then
    # Files unpacked from a download carry the quarantine flag; clear it for the kit's own files so that the
    # bundled tools and the database start without a further prompt.
    xattr -dr com.apple.quarantine "$KIT_ROOT" 2>/dev/null || true
  fi
  chmod +x "$UV" "$KIT"/pg/bin/* "$KIT_ROOT"/*.command "$KIT_ROOT"/*.sh 2>/dev/null || true

  echo "[1/4] Python 3.13 bereitstellen (einmalig aus dem Internet) ..."
  "$UV" venv --clear --python 3.13 "$ENV_DIR" || fail "Python konnte nicht bereitgestellt werden. Besteht eine Internetverbindung?"
  echo "[2/4] Bibliotheken laden und pruefen (feste Versionen mit Pruefsummen) ..."
  "$UV" pip install --python "$PY" --require-hashes --no-deps --only-binary :all: -r "$KIT/runtime-lock.txt" \
    || fail "Die Bibliotheken konnten nicht installiert werden. Besteht eine Internetverbindung?"
  echo "[3/4] Axentra installieren ..."
  "$UV" pip install --python "$PY" --no-deps "$KIT"/wheels/*.whl || fail "Axentra konnte nicht installiert werden."
  echo "[4/4] Installation pruefen ..."
  "$UV" pip check --python "$PY" || fail "Die Pruefung der Installation ist fehlgeschlagen."
  "$KIT/pg/bin/postgres" --version >/dev/null || fail "Die mitgelieferte Datenbank startet auf diesem System nicht."
  VERSION="$("$PY" -c 'import axentra; print(axentra.__version__)')" || fail "Axentra startet nicht."
  touch "$KIT/env/.qa-kit-installed"
  echo
  echo "Installiert: Axentra $VERSION mit Axentra Studio."
}
