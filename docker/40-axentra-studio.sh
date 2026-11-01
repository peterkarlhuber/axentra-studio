#!/bin/sh
# Generates the runtime snippets for Axentra Studio from the environment:
#   AXENTRA_API_URL          upstream for the optional /v1 reverse proxy (e.g. http://api:8080)
#   AXENTRA_PUBLIC_API_URL   API origin the browser calls when the API is on another origin
#   AXENTRA_CSP_CONNECT_SRC  extra connect-src sources for the Content-Security-Policy
set -eu

out=/etc/nginx/axentra
mkdir -p "$out"

strip() { printf '%s' "$1" | sed -e 's#/*$##' -e 's#/v1$##'; }

api_url="$(strip "${AXENTRA_API_URL:-}")"
public_api_url="$(strip "${AXENTRA_PUBLIC_API_URL:-}")"

case "$public_api_url" in
  ""|http://*|https://*) ;;
  *) echo "40-axentra-studio: AXENTRA_PUBLIC_API_URL must start with http:// or https://" >&2; exit 1 ;;
esac
case "$public_api_url" in *[\"\\\ ]*) echo "40-axentra-studio: invalid AXENTRA_PUBLIC_API_URL" >&2; exit 1 ;; esac

# Reverse proxy for /v1 (same-origin deployment).
if [ -n "$api_url" ]; then
  case "$api_url" in
    http://*|https://*) ;;
    *) echo "40-axentra-studio: AXENTRA_API_URL must start with http:// or https://" >&2; exit 1 ;;
  esac
  AXENTRA_API_URL="$api_url" envsubst '${AXENTRA_API_URL}' \
    < /etc/nginx/axentra-templates/api-proxy.conf.template > "$out/api-proxy.conf"
  echo "40-axentra-studio: proxying /v1 to $api_url"
else
  printf '# AXENTRA_API_URL is not set: no /v1 reverse proxy.\n' > "$out/api-proxy.conf"
fi

# Runtime configuration read by the Studio at startup.
printf '{"apiBaseUrl": "%s"}\n' "$public_api_url" > "$out/config.json"

# Security headers. Scripts only from this origin (no inline scripts); inline style
# attributes are needed by Radix UI positioning, style elements by its scroll lock.
connect_src="'self'"
[ -n "$public_api_url" ] && connect_src="$connect_src $public_api_url"
[ -n "${AXENTRA_CSP_CONNECT_SRC:-}" ] && connect_src="$connect_src ${AXENTRA_CSP_CONNECT_SRC}"
csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src $connect_src; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"

cat > "$out/security-headers.conf" <<CONF
add_header Content-Security-Policy "$csp" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
CONF
