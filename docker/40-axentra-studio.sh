#!/bin/sh
# Generates the runtime snippets for Axentra Studio from the environment:
#   AXENTRA_API_URL          upstream for the optional /v1 reverse proxy (e.g. http://api:8080)
#   AXENTRA_PUBLIC_API_URL   API origin the browser calls when the API is on another origin
#                            (both: http:// or https://, host, optional :port and /path; anything else
#                            stops the start)
#   AXENTRA_CSP_CONNECT_SRC  extra connect-src sources for the Content-Security-Policy: space-separated
#                            https:// origins (https://host or https://host:port); anything else stops the start
#   AXENTRA_TLS_TERMINATED   "true" when browsers reach Studio over HTTPS (TLS terminated in front of this
#                            container): adds Strict-Transport-Security; "false" or unset: no HSTS
set -eu

out=/etc/nginx/axentra
mkdir -p "$out"

strip() { printf '%s' "$1" | sed -e 's#/*$##' -e 's#/v1$##'; }

nl='
'
cr="$(printf '\r')"

# Both URLs go into nginx directives (proxy_pass, the CSP add_header line) and config.json, so
# only a plain http(s) URL is accepted: a host from letters, digits, dots, hyphens and underscores
# (compose service names such as axentra_api) or a bracketed IPv6 literal ([::1], [fd00::1]), an
# optional port and an optional path from a safe character set. Whitespace, control characters,
# quotes, semicolons, `$` (nginx variables), braces, `#`, `?` and anything else stop the start,
# like AXENTRA_CSP_CONNECT_SRC below.
check_url() {
  case "$2" in
    "") return 0 ;;
    *"$nl"*|*"$cr"*) ;;
    *) printf '%s\n' "$2" | LC_ALL=C grep -Eq \
      '^https?://([A-Za-z0-9._-]+|\[[0-9A-Fa-f:]+\])(:[0-9]+)?(/[A-Za-z0-9._~/-]*)?$' && return 0 ;;
  esac
  echo "40-axentra-studio: $1 must be an http:// or https:// URL (scheme://host[:port][/path];" \
    "host characters A-Z a-z 0-9 . _ - or an [IPv6] literal; path characters A-Z a-z 0-9 . _ ~ / -)" >&2
  exit 1
}

api_url="$(strip "${AXENTRA_API_URL:-}")"
public_api_url="$(strip "${AXENTRA_PUBLIC_API_URL:-}")"
check_url AXENTRA_API_URL "$api_url"
check_url AXENTRA_PUBLIC_API_URL "$public_api_url"

# Reverse proxy for /v1 (same-origin deployment).
if [ -n "$api_url" ]; then
  AXENTRA_API_URL="$api_url" envsubst '${AXENTRA_API_URL}' \
    < /etc/nginx/axentra-templates/api-proxy.conf.template > "$out/api-proxy.conf"
  echo "40-axentra-studio: proxying /v1 to $api_url"
else
  printf '# AXENTRA_API_URL is not set: no /v1 reverse proxy.\n' > "$out/api-proxy.conf"
fi

# Runtime configuration read by the Studio at startup (the value is a checked URL: no quotes or
# backslashes that would need JSON escaping).
printf '{"apiBaseUrl": "%s"}\n' "$public_api_url" > "$out/config.json"

# Extra connect-src sources: only https origins, separated by spaces or tabs (MUP-ONA VB-6). The value
# goes into an nginx add_header line, so quotes, semicolons, keywords ('unsafe-...'), schemes other than
# https, paths, wildcards and line breaks are refused instead of being written into the configuration.
# 'self' is always part of connect-src, and AXENTRA_PUBLIC_API_URL (http or https) is added on its own.
extra_connect_src="$(printf '%s' "${AXENTRA_CSP_CONNECT_SRC:-}" | sed -e 's/^[[:blank:]]*//' -e 's/[[:blank:]]*$//')"
if [ -n "$extra_connect_src" ]; then
  case "$extra_connect_src" in
    *"$nl"*|*"$cr"*)
      echo "40-axentra-studio: AXENTRA_CSP_CONNECT_SRC must be one line of https:// origins" >&2; exit 1 ;;
  esac
  origin='https://[A-Za-z0-9.-]+(:[0-9]+)?'
  if ! printf '%s\n' "$extra_connect_src" | grep -Eq "^${origin}([[:blank:]]+${origin})*\$"; then
    echo "40-axentra-studio: AXENTRA_CSP_CONNECT_SRC must be space-separated https:// origins" \
      "(https://host or https://host:port), got: $extra_connect_src" >&2
    exit 1
  fi
fi

# HSTS only when TLS is terminated in front of the container (a plain-http deployment must not send it).
case "${AXENTRA_TLS_TERMINATED:-false}" in
  true|1) hsts='add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;' ;;
  false|0|"") hsts='# AXENTRA_TLS_TERMINATED is not "true": no Strict-Transport-Security header.' ;;
  *) echo "40-axentra-studio: AXENTRA_TLS_TERMINATED must be true or false" >&2; exit 1 ;;
esac

# Security headers. Scripts only from this origin (no inline scripts); inline style
# attributes are needed by Radix UI positioning, style elements by its scroll lock.
connect_src="'self'"
[ -n "$public_api_url" ] && connect_src="$connect_src $public_api_url"
[ -n "$extra_connect_src" ] && connect_src="$connect_src $extra_connect_src"
csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src $connect_src; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"

cat > "$out/security-headers.conf" <<CONF
add_header Content-Security-Policy "$csp" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
$hsts
CONF
