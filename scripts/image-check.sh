#!/usr/bin/env bash
# Builds the Docker image twice and checks it: reproducible build, container smoke test and Trivy scan.
# CI runs this as the "Container image: reproducible build, smoke test and Trivy scan" job (.github/workflows/ci.yml).
#
#   scripts/image-check.sh [work dir]      (default: a new temporary directory)
#
# Steps:
#   1. Two --no-cache builds with SOURCE_DATE_EPOCH = the HEAD commit time and rewrite-timestamp, written as OCI
#      archives without provenance or SBOM attestations; their image manifests must be identical.
#   2. Smoke test of the loaded image without a backend: runs as uid 101, `nginx -t`, no curl, healthcheck healthy,
#      `/`, `/healthz` and the SPA fallback answer 200, the security headers are set, and invalid
#      AXENTRA_API_URL / AXENTRA_CSP_CONNECT_SRC values stop the start.
#   3. Trivy (pinned by digest) on the unpacked OCI archive: any CRITICAL or HIGH finding that has a fix fails the job; the full
#      report (all severities, also without a fix) is written to the work dir.
#
# Environment: DOCKERFILE (default Dockerfile) and EXTRA_BUILD_ARGS (word-split, for example a proxy CA build
# context on a machine behind a TLS-intercepting proxy) change only how the image is built. Needs docker with buildx
# and a builder that can write OCI archives (docker-container driver, or the containerd image store).
set -euo pipefail

TRIVY_IMAGE="aquasec/trivy:0.58.1@sha256:ab70a02200597efa04748f210f793936eb647cbcdb0ea69cc30b226d6f5a22c7"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${1:-$(mktemp -d)}"
mkdir -p "$WORK"
DOCKERFILE="${DOCKERFILE:-$ROOT/Dockerfile}"
read -r -a EXTRA <<<"${EXTRA_BUILD_ARGS:-}"
EPOCH="$(git -C "$ROOT" log -1 --format=%ct)"
NAME="axentra-studio:image-check"
fail() { echo "FAIL: $*" >&2; exit 1; }

build() { # <archive>
  docker buildx build --no-cache --progress=plain --provenance=false --sbom=false -f "$DOCKERFILE" \
    "${EXTRA[@]}" --build-arg SOURCE_DATE_EPOCH="$EPOCH" \
    --output "type=oci,dest=$1,name=$NAME,rewrite-timestamp=true" "$ROOT" > "$1.log" 2>&1 \
    || { tail -40 "$1.log"; fail "docker build ($1)"; }
}

manifest_digest() { # <archive>: the image manifest of the linux/amd64 image in the OCI archive
  python3 - "$1" <<'PY'
import json, sys, tarfile
with tarfile.open(sys.argv[1]) as tar:
    def blob(digest):
        return json.load(tar.extractfile("blobs/" + digest.replace(":", "/")))
    entry = json.load(tar.extractfile("index.json"))["manifests"][0]
    doc = blob(entry["digest"])
    if "manifests" in doc:  # an image index: pick linux/amd64
        entry = next(m for m in doc["manifests"] if m.get("platform", {}).get("architecture") == "amd64")
    print(entry["digest"])
PY
}

echo "== 1. Two builds (SOURCE_DATE_EPOCH=$EPOCH)"
build "$WORK/a.tar"
build "$WORK/b.tar"
A="$(manifest_digest "$WORK/a.tar")"; B="$(manifest_digest "$WORK/b.tar")"
echo "manifest a: $A"; echo "manifest b: $B"
[ "$A" = "$B" ] || fail "the two builds differ (not reproducible)"
echo "reproducible: yes"

echo "== 2. Smoke test"
docker load -i "$WORK/a.tar" >/dev/null
NAME_C="image-check-$$"
trap 'docker rm -f "$NAME_C" >/dev/null 2>&1 || true' EXIT
docker run -d --name "$NAME_C" -p 127.0.0.1:18399:8080 --health-interval=2s \
  -e AXENTRA_PUBLIC_API_URL=https://api.example.com -e AXENTRA_TLS_TERMINATED=true "$NAME" >/dev/null
for _ in $(seq 1 30); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' "$NAME_C")" = healthy ] && break; sleep 1
done
[ "$(docker inspect -f '{{.State.Health.Status}}' "$NAME_C")" = healthy ] || { docker logs "$NAME_C"; fail "healthcheck"; }
# nginx -t inside the running container: the entrypoint renders /etc/nginx/axentra/*.conf first.
docker exec "$NAME_C" sh -c 'test "$(id -u)" = 101 && nginx -t 2>&1 && ! command -v curl' \
  || fail "uid 101, nginx -t or no-curl check"
for path in / /healthz /p/x/tenants; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:18399$path")"
  [ "$code" = 200 ] || fail "GET $path -> $code"
done
headers="$(curl -sI http://127.0.0.1:18399/)"
for h in content-security-policy strict-transport-security x-content-type-options referrer-policy permissions-policy; do
  grep -qi "^$h:" <<<"$headers" || fail "missing header $h"
done
grep -i '^content-security-policy:' <<<"$headers" | grep -q "script-src 'self'" || fail "CSP without script-src 'self'"
docker rm -f "$NAME_C" >/dev/null
for bad in "AXENTRA_API_URL=http://x;evil" "AXENTRA_CSP_CONNECT_SRC=http://x; script-src *"; do
  if timeout 30 docker run --rm -e "$bad" "$NAME" >/dev/null 2>&1; then fail "the start was not refused for $bad"; fi
done
echo "smoke: passed"

echo "== 3. Trivy"
# Trivy reads an OCI image as a layout directory, not as a tar archive.
rm -rf "$WORK/oci"; mkdir -p "$WORK/oci"; tar -xf "$WORK/a.tar" -C "$WORK/oci"
docker run --rm -v "$WORK:/work" "$TRIVY_IMAGE" image --quiet --input /work/oci \
  --format table --output /work/trivy-all.txt
cat "$WORK/trivy-all.txt"
docker run --rm -v "$WORK:/work" "$TRIVY_IMAGE" image --quiet --input /work/oci \
  --severity CRITICAL,HIGH --ignore-unfixed --exit-code 1 --format table \
  || fail "the image has CRITICAL or HIGH findings with a fix"
echo "trivy: no fixable CRITICAL or HIGH finding"
