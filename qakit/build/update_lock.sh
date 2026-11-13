#!/bin/bash
# Regenerate kit-lock.txt: the runtime libraries of the QA kit with SHA-256 hashes for Windows, macOS and Linux.
# Versions follow axentra's own lock (deploy/locks/full.txt) of the commit the kit is built from; the lock adds
# the local SMTP catcher (aiosmtpd). Usage: qakit/build/update_lock.sh <axentra checkout>
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
AXENTRA="$1"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
python3 - "$AXENTRA/pyproject.toml" > "$TMP/requirements.in" <<'PY'
import sys, tomllib
project = tomllib.load(open(sys.argv[1], "rb"))["project"]
extras = project["optional-dependencies"]
for req in project["dependencies"] + [r for e in ("server", "oidc", "s3") for r in extras[e]]:
    print(req)
print("aiosmtpd")
PY
sed -e 's/ \\$//' -e '/--hash/d' "$AXENTRA/deploy/locks/full.txt" > "$TMP/constraints.txt"
uv pip compile --quiet --universal --python-version 3.13 --generate-hashes --no-header --no-annotate \
  -c "$TMP/constraints.txt" "$TMP/requirements.in" -o "$HERE/kit-lock.txt"
echo "wrote $HERE/kit-lock.txt"
