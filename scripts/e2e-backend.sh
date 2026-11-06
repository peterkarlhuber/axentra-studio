#!/usr/bin/env bash
# Starts a real, PostgreSQL-backed Axentra for Studio's Playwright suite and tears it down again.
#
#   scripts/e2e-backend.sh run  [options] [-- command...]   up, run the command, down (default: npm run e2e)
#   scripts/e2e-backend.sh up   [options]                   start and leave running; prints the env
#   scripts/e2e-backend.sh env                              print the exports of a running backend
#   scripts/e2e-backend.sh down                             stop everything, drop database and role
#
# Options:
#   --backend DIR   Axentra checkout to run (default: $AXENTRA_BACKEND_DIR, else ../axentra)
#   --ref SHA       fetch peterkarlhuber/axentra at SHA into the state dir and run that instead
#                   (`--ref pinned` reads api/BACKEND_REF). A private repo needs AXENTRA_REPO_TOKEN.
#   --install       create a venv in the state dir and `pip install "<checkout>[server]"`
#                   (default: use $AXENTRA_PYTHON, which must already have axentra installed)
#   --mode MODE     deployment model: `multi` (default) or `single` (see Axentra's
#                   docs/architecture/DEPLOYMENT_MODELS.md); also AXENTRA_E2E_MODE
#   --worker        also run `axentra worker --load axentra_e2e_jobs` (jobs, schedules, webhooks,
#                   plus the e2e job handlers in e2e/fixtures) and `axentra notify-dispatch --loop`
#                   (notification delivery)
#
# What `up` does:
#   1. creates database $AXENTRA_E2E_DB owned by the NON-superuser role $AXENTRA_E2E_DB_ROLE
#      (both dropped first if they exist, so RLS is enforced exactly as in production),
#   2. writes a config (state dir/axentra.toml) for the chosen deployment mode (`mode = "multi"`,
#      or `mode = "single"` with a [product] section) with every module enabled (storage: local,
#      notify: local provider, with invitation links to the Studio preview origin's
#      /accept-invitation when the backend supports notify.invitation_accept_url; events with
#      plain-http/private webhook targets and short retries, usage, billing: manual) that allows the Studio preview origin; environment "test", so the
#      development-only webhook settings are accepted (the backend refuses them in production),
#   3. `axentra migrate`, `axentra admin setup-token`, `axentra serve` (+ workers with --worker),
#   4. creates the first platform admin through POST /v1/auth/setup with the setup token, then
#      fixtures through the API: a product (multi: POST /v1/products; single: the product the
#      backend created on start from [product], read from GET /v1/meta, after checking that
#      POST /v1/products is refused with 409 mode_not_supported) with a tenant, a free plan the tenant subscribes to, a
#      job, a webhook endpoint (no matching events) and a notification template, so every route
#      of the a11y sweep (e2e/a11y.spec.ts) has its parameters, and drawer fixtures for
#      e2e/a11y-interactive.spec.ts (a record, a file, an event, a test delivery of a second endpoint),
#   5. creates two plain users without any role (Axentra has no API to create password users, so
#      through the installed library): specs make them product operators or tenant members of
#      what they create, to check Studio for non-admins (e2e/tenant-suspension.spec.ts),
#   6. writes the exports for Playwright (AXENTRA_E2E_API, _EMAIL, _PASSWORD, _PRODUCT_ID,
#      _TENANT_ID, _JOB_ID, _WEBHOOK_ID, _TEMPLATE_KEY, _OPERATOR_EMAIL, _MEMBER_EMAIL,
#      _USER_PASSWORD, _MODE, _WORKER, _NOTIFY_DISPATCH, ...).
#
# Env (all optional except the PostgreSQL URL):
#   AXENTRA_E2E_PG_URL     superuser URL (fallback AXENTRA_TEST_DATABASE_URL)
#   AXENTRA_E2E_DB         database name   (default axentra_studio_e2e)
#   AXENTRA_E2E_DB_ROLE    runtime role    (default axentra_studio_e2e_app)
#   AXENTRA_E2E_API_PORT   API port        (default 18080)
#   AXENTRA_E2E_PORT       Studio preview port allowed as origin (default 4173, as playwright.config.ts)
#   AXENTRA_E2E_STATE_DIR  runtime files   (default .e2e-backend in the repository; git-ignored)
#   AXENTRA_PYTHON         Python with axentra[server] (default: python3; ignored with --install)
#   AXENTRA_E2E_MODE       multi | single (default multi; same as --mode)
#   AXENTRA_E2E_WORKER=1   same as --worker
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE="${AXENTRA_E2E_STATE_DIR:-$ROOT/.e2e-backend}"
REPO="${AXENTRA_REPO:-peterkarlhuber/axentra}"
DB="${AXENTRA_E2E_DB:-axentra_studio_e2e}"
ROLE="${AXENTRA_E2E_DB_ROLE:-axentra_studio_e2e_app}"
API_PORT="${AXENTRA_E2E_API_PORT:-18080}"
PREVIEW_PORT="${AXENTRA_E2E_PORT:-4173}"
PG_URL="${AXENTRA_E2E_PG_URL:-${AXENTRA_TEST_DATABASE_URL:-}}"
WORKER="${AXENTRA_E2E_WORKER:-0}"
MODE="${AXENTRA_E2E_MODE:-multi}"
INSTALL=0
BACKEND="${AXENTRA_BACKEND_DIR:-}"
REF=""

log() { printf '[e2e-backend] %s\n' "$*" >&2; }
die() {
  printf '[e2e-backend] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() { sed -n '2,/^set -euo/p' "${BASH_SOURCE[0]}" | sed '$d' | sed 's/^# \{0,1\}//'; }

[[ $# -gt 0 ]] || {
  usage
  exit 2
}
CMD="$1"
shift
RUN_CMD=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend) BACKEND="$2"; shift 2 ;;
    --ref) REF="$2"; shift 2 ;;
    --install) INSTALL=1; shift ;;
    --worker) WORKER=1; shift ;;
    --mode) MODE="$2"; shift 2 ;;
    --) shift; RUN_CMD=("$@"); break ;;
    -h | --help) usage; exit 0 ;;
    *) die "unknown argument: $1 (see --help)" ;;
  esac
done

[[ "$MODE" == "multi" || "$MODE" == "single" ]] || die "--mode must be multi or single (got '$MODE')"

# Identifiers are interpolated into SQL; allow only plain names.
[[ "$DB" =~ ^[a-z_][a-z0-9_]{0,62}$ ]] || die "AXENTRA_E2E_DB must match ^[a-z_][a-z0-9_]*$"
[[ "$ROLE" =~ ^[a-z_][a-z0-9_]{0,62}$ ]] || die "AXENTRA_E2E_DB_ROLE must match ^[a-z_][a-z0-9_]*$"

pid_alive() { [[ -f "$1" ]] && kill -0 "$(cat "$1")" 2>/dev/null; }

stop_pid() { # stop_pid <pidfile>: SIGTERM, wait up to 15 s, then SIGKILL
  local file="$1" pid
  [[ -f "$file" ]] || return 0
  pid="$(cat "$file")"
  if kill -0 "$pid" 2>/dev/null; then
    kill -TERM "$pid" 2>/dev/null || true
    for _ in $(seq 1 75); do kill -0 "$pid" 2>/dev/null || break; sleep 0.2; done
    kill -0 "$pid" 2>/dev/null && kill -KILL "$pid" 2>/dev/null || true
  fi
  rm -f "$file"
}

cmd_down() {
  local name
  for name in notify worker server; do stop_pid "$STATE/$name.pid"; done
  if [[ -n "$PG_URL" ]]; then
    psql "$PG_URL" -q -v ON_ERROR_STOP=0 \
      -c "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE)" \
      -c "DROP ROLE IF EXISTS \"$ROLE\"" >/dev/null 2>&1 || log "could not drop $DB/$ROLE"
    log "dropped database $DB and role $ROLE"
  else
    log "AXENTRA_E2E_PG_URL is not set: database $DB and role $ROLE were not dropped"
  fi
  rm -rf "$STATE/run/storage" "$STATE/run/cookies.txt" # logs stay for CI artifacts
  rm -f "$STATE/env" "$STATE/axentra.toml" "$STATE/secrets"/* 2>/dev/null || true
}

cmd_env() {
  [[ -f "$STATE/env" ]] || die "no running e2e backend (missing $STATE/env); run \`$0 up\` first"
  cat "$STATE/env"
}

fetch_ref() { # fetch_ref <sha> -> checkout dir
  local sha="$1" dir="$STATE/backend-src" url="https://github.com/$REPO.git"
  local -a auth=()
  if [[ -n "${AXENTRA_REPO_TOKEN:-}" ]]; then
    auth=(-c "http.extraheader=Authorization: Basic $(printf 'x-access-token:%s' "$AXENTRA_REPO_TOKEN" | base64 | tr -d '\n')")
  fi
  mkdir -p "$dir"
  if [[ "$(git -C "$dir" rev-parse HEAD 2>/dev/null || true)" != "$sha" ]]; then
    log "fetching $REPO at $sha"
    git -C "$dir" init -q
    git "${auth[@]}" -C "$dir" fetch -q --depth 1 "$url" "$sha" ||
      die "could not fetch $REPO@$sha. If the repository is private, set AXENTRA_REPO_TOKEN to a token with read access."
    git -C "$dir" checkout -q --force FETCH_HEAD
  fi
  printf '%s\n' "$dir"
}

cmd_up() {
  command -v psql >/dev/null || die "psql is required"
  command -v curl >/dev/null || die "curl is required"
  [[ -n "$PG_URL" ]] || die "set AXENTRA_E2E_PG_URL to a PostgreSQL superuser URL, e.g. postgresql://postgres:pg@127.0.0.1:5432/postgres"
  if pid_alive "$STATE/server.pid"; then die "an e2e backend is already running (pid $(cat "$STATE/server.pid")); run \`$0 down\`"; fi

  mkdir -p "$STATE/secrets" "$STATE/run"
  chmod 700 "$STATE" "$STATE/secrets"

  # Backend checkout and Python.
  if [[ "$REF" == "pinned" ]]; then
    REF="$(tr -d '[:space:]' <"$ROOT/api/BACKEND_REF")"
  fi
  if [[ -n "$REF" ]]; then
    [[ "$REF" =~ ^[0-9a-f]{40}$ ]] || die "--ref must be a full 40-character commit SHA (got '$REF')"
    BACKEND="$(fetch_ref "$REF")"
  fi
  [[ -n "$BACKEND" ]] || BACKEND="$ROOT/../axentra"
  [[ -f "$BACKEND/pyproject.toml" && -d "$BACKEND/src/axentra" ]] ||
    die "no Axentra checkout at $BACKEND (pass --backend DIR or --ref SHA)"
  BACKEND="$(cd "$BACKEND" && pwd)"
  local sha pinned
  sha="$(git -C "$BACKEND" rev-parse HEAD 2>/dev/null || echo unknown)"
  pinned="$(tr -d '[:space:]' <"$ROOT/api/BACKEND_REF" 2>/dev/null || true)"
  if [[ -n "$pinned" && "$sha" != "$pinned" ]]; then
    log "note: backend checkout is at $sha, api/BACKEND_REF pins $pinned"
  fi
  if [[ -n "$(git -C "$BACKEND" status --porcelain 2>/dev/null || true)" ]]; then
    log "note: backend checkout has uncommitted changes"
  fi

  local py
  if [[ "$INSTALL" == "1" ]]; then
    py="$STATE/venv/bin/python"
    [[ -x "$py" ]] || python3 -m venv "$STATE/venv"
    log "installing $BACKEND[server] into $STATE/venv"
    "$py" -m pip install -q --upgrade pip
    "$py" -m pip install -q "$BACKEND[server]"
  else
    py="${AXENTRA_PYTHON:-python3}"
  fi
  local where
  where="$("$py" -c 'import axentra, os; print(os.path.dirname(axentra.__file__))' 2>/dev/null)" ||
    die "$py cannot import axentra; install it (pip install \"$BACKEND[server]\") or pass --install"
  case "$where" in
    "$BACKEND"/*) ;;
    *) log "note: axentra is imported from $where (installed copy), not from $BACKEND/src" ;;
  esac
  local -a AX=("$py" -m axentra.cli --config "$STATE/axentra.toml")

  # 1. database + non-superuser role
  local role_pw app_url
  role_pw="$("$py" -c 'import secrets; print(secrets.token_urlsafe(18))')"
  log "creating database $DB owned by non-superuser role $ROLE"
  psql "$PG_URL" -q -v ON_ERROR_STOP=1 -c "SET client_min_messages = warning" \
    -c "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE)" \
    -c "DROP ROLE IF EXISTS \"$ROLE\"" \
    -c "CREATE ROLE \"$ROLE\" LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '$role_pw'" \
    -c "CREATE DATABASE \"$DB\" OWNER \"$ROLE\"" >/dev/null
  app_url="$("$py" - "$PG_URL" "$DB" "$ROLE" "$role_pw" <<'PY'
import sys
from psycopg.conninfo import conninfo_to_dict, make_conninfo
params = conninfo_to_dict(sys.argv[1])
params.update(dbname=sys.argv[2], user=sys.argv[3], password=sys.argv[4])
print(make_conninfo(**params))
PY
)"

  # 2. secrets (files, mode 600) and config
  umask 077
  printf '%s' "$app_url" >"$STATE/secrets/database_url"
  "$py" -m axentra.cli keys generate --kid e2e | tr -d '\n' >"$STATE/secrets/master_keys"
  umask 022
  local base="http://127.0.0.1:$API_PORT"
  local product_section=""
  if [[ "$MODE" == "single" ]]; then
    # Single-product mode: Axentra creates this product on start (idempotent) and refuses
    # creating, archiving and restoring products (409 mode_not_supported).
    product_section=$'\n[product]\nslug = "studio-e2e"\nname = "Studio e2e"\n'
  fi
  # Invitation links lead to Studio (the preview origin, which proxies /v1 to the API) through
  # Studio's public /accept-invitation alias, like a split-origin deployment. Only for backends
  # that know notify.invitation_accept_url (older ones refuse unknown settings and keep the
  # default <public_url>/accept-invitation).
  local notify_extra=""
  if "$py" -c 'import sys; from axentra.config.settings import NotifySettings; sys.exit(0 if "invitation_accept_url" in NotifySettings.model_fields else 1)' 2>/dev/null; then
    notify_extra="invitation_accept_url = \"http://127.0.0.1:$PREVIEW_PORT/accept-invitation\""
  fi
  # Newer backends retry webhooks on their own schedule (minutes to hours by default); keep the
  # e2e retries short. Older backends refuse unknown settings, so add them only where they exist.
  local webhook_backoff=""
  if grep -q 'webhook_backoff_base_seconds' "$BACKEND/src/axentra/config/settings.py"; then
    webhook_backoff=$'webhook_backoff_base_seconds = 0.5\nwebhook_backoff_max_seconds = 5'
  fi
  cat >"$STATE/axentra.toml" <<TOML
# Written by scripts/e2e-backend.sh for Studio's end-to-end tests. Never use for anything else.
environment = "test"
mode = "$MODE"
modules = ["identity", "tenancy", "access", "data", "audit", "storage", "events", "usage", "billing", "notify", "search"]
$product_section
[database]
url_ref = "file:$STATE/secrets/database_url"
pool_max = 8

[security]
public_url = "$base"
allowed_origins = ["http://127.0.0.1:$PREVIEW_PORT", "http://localhost:$PREVIEW_PORT"]
master_keys_ref = "file:$STATE/secrets/master_keys"
login_rate_per_minute = 1000

[storage]
backend = "local"
local_path = "$STATE/run/storage"
max_file_bytes = 1048576  # 1 MiB: e2e/storage.spec.ts asserts this limit in the upload dialog

[notify]
provider = "local"
$notify_extra

[billing]
# "manual": paid plans can be subscribed without a checkout, so e2e/billing.spec.ts covers prices.
# Neither manual nor fake ever moves money.
provider = "manual"

[events]
# Lets e2e specs point webhooks at a local receiver (refused in production by the backend).
webhook_allow_private_targets = true
webhook_allow_http = true
# Failing webhook deliveries end as "dead" within seconds (e2e/events.spec.ts waits for that).
webhook_max_attempts = 3
backoff_base_seconds = 0.5
backoff_max_seconds = 5
${webhook_backoff}

[observability]
log_format = "text"
TOML
  # Settings come only from the file above.
  unset AXENTRA_CONFIG
  while IFS='=' read -r name _; do unset "$name"; done < <(env | grep '^AXENTRA__' || true)

  # 3. migrate, setup token, serve (+ workers)
  log "migrating ($BACKEND @ ${sha:0:12})"
  "${AX[@]}" migrate >"$STATE/run/migrate.log" 2>&1 || {
    cat "$STATE/run/migrate.log" >&2
    die "axentra migrate failed"
  }
  local setup_token
  setup_token="$("${AX[@]}" admin setup-token)"

  log "starting axentra serve on $base (mode $MODE)"
  nohup "${AX[@]}" serve --host 127.0.0.1 --port "$API_PORT" >"$STATE/run/server.log" 2>&1 &
  echo $! >"$STATE/server.pid"
  local ready=0
  for _ in $(seq 1 150); do
    if curl -fsS "$base/v1/health/ready" >/dev/null 2>&1; then ready=1; break; fi
    pid_alive "$STATE/server.pid" || break
    sleep 0.2
  done
  if [[ "$ready" != "1" ]]; then
    tail -n 60 "$STATE/run/server.log" >&2 || true
    die "axentra serve did not become ready on $base (port in use?)"
  fi
  if [[ "$WORKER" == "1" ]]; then
    log "starting axentra worker (+ e2e/fixtures/axentra_e2e_jobs) and notify-dispatch --loop"
    PYTHONPATH="$ROOT/e2e/fixtures${PYTHONPATH:+:$PYTHONPATH}" \
      nohup "${AX[@]}" worker --shutdown-timeout 5 --load axentra_e2e_jobs >"$STATE/run/worker.log" 2>&1 &
    echo $! >"$STATE/worker.pid"
    nohup "${AX[@]}" notify-dispatch --loop --interval 0.5 >"$STATE/run/notify.log" 2>&1 &
    echo $! >"$STATE/notify.pid"
    sleep 1
    pid_alive "$STATE/worker.pid" || { cat "$STATE/run/worker.log" >&2; die "axentra worker exited"; }
    pid_alive "$STATE/notify.pid" || { cat "$STATE/run/notify.log" >&2; die "axentra notify-dispatch exited"; }
  fi

  # 4. first admin (setup token), a product and a tenant, through the API like a browser would
  local email="studio-e2e-admin@example.com" password csrf product_id tenant_id jar="$STATE/run/cookies.txt"
  password="$("$py" -c 'import secrets; print("pw-" + secrets.token_urlsafe(18))')"
  json_get() { # json_get <dotted.key>
    "$py" -c 'import functools,json,sys; print(functools.reduce(lambda o, k: o[k], sys.argv[1].split("."), json.load(sys.stdin)))' "$1"
  }
  post() { # post <path> <json>; fails on HTTP >= 400 and shows the problem body
    local out code
    out="$(curl -sS -b "$jar" -c "$jar" -H 'Content-Type: application/json' \
      -H "X-Axentra-CSRF: ${csrf:-}" -w '\n%{http_code}' -X POST "$base$1" --data "$2")"
    code="${out##*$'\n'}"
    out="${out%$'\n'*}"
    [[ "$code" -lt 400 ]] || die "POST $1 -> HTTP $code: $out"
    printf '%s' "$out"
  }
  log "creating the first platform admin via the setup token"
  local setup_body
  setup_body="$("$py" -c 'import json,sys; print(json.dumps({"setup_token": sys.argv[1], "email": sys.argv[2], "name": "Studio e2e admin", "password": sys.argv[3]}))' "$setup_token" "$email" "$password")"
  csrf="$(post /v1/auth/setup "$setup_body" | json_get csrf_token)"
  if [[ "$MODE" == "single" ]]; then
    # The backend created its one product on start; creating another one must be refused.
    local refused
    refused="$(curl -sS -o /dev/null -w '%{http_code}' -b "$jar" -c "$jar" -H 'Content-Type: application/json' \
      -H "X-Axentra-CSRF: $csrf" -X POST "$base/v1/products" --data '{"name": "Second", "slug": "second"}')"
    [[ "$refused" == "409" ]] || die "single mode: POST /v1/products answered HTTP $refused, expected 409"
    product_id="$(curl -fsS "$base/v1/meta" | json_get product.id)"
    [[ -n "$product_id" ]] || die "single mode: GET /v1/meta reports no product"
    log "single-product mode: using product $product_id (studio-e2e); POST /v1/products -> 409"
  else
    product_id="$(post /v1/products '{"name": "Studio e2e", "slug": "studio-e2e"}' | json_get id)"
  fi
  tenant_id="$(post "/v1/products/$product_id/tenants" '{"name": "E2E tenant", "slug": "e2e-tenant"}' | json_get id)"
  log "creating fixtures: free plan + subscription, job, webhook endpoint, notification template"
  post "/v1/products/$product_id/billing/plans" \
    '{"key": "e2e-free", "name": "E2E free", "entitlements": {"feature.e2e": true}}' >/dev/null
  post "/v1/products/$product_id/tenants/$tenant_id/billing/subscription" '{"plan": "e2e-free"}' >/dev/null
  local job_id webhook_id template_key="e2e.fixture"
  job_id="$(post "/v1/products/$product_id/jobs" \
    "{\"kind\": \"studio.e2e.ok\", \"tenant_id\": \"$tenant_id\", \"payload\": {\"fixture\": true}}" | json_get id)"
  # Port 9 (discard) and an event type nothing publishes: the endpoint never receives a delivery.
  webhook_id="$(post "/v1/products/$product_id/webhooks" \
    '{"url": "http://127.0.0.1:9/e2e-fixture", "event_types": ["e2e.fixture.never"], "description": "a11y sweep fixture"}' |
    json_get endpoint.id)"
  post "/v1/products/$product_id/notify/templates" \
    "{\"key\": \"$template_key\", \"name\": \"E2E fixture\", \"category\": \"onboarding\", \"variables\": [\"name\"], \"sample_data\": {\"name\": \"Ada\"}, \"variants\": {\"en\": {\"subject\": \"Hello {{ name }}\", \"text\": \"Hi {{ name }}.\", \"html\": \"<p>Hi {{ name }}.</p>\"}}}" >/dev/null
  # Drawer fixtures for e2e/a11y-interactive.spec.ts (record, file, event, webhook delivery). The
  # delivery comes from a synchronous test send to a second endpoint on port 9, so it exists
  # without a worker and the first endpoint still never receives one.
  log "creating drawer fixtures: record, file, event, webhook delivery"
  post "/v1/products/$product_id/tenants/$tenant_id/records/e2e_notes" '{"title": "a11y drawer fixture"}' >/dev/null
  local upload_code
  upload_code="$(curl -sS -o /dev/null -w '%{http_code}' -b "$jar" -c "$jar" -H "X-Axentra-CSRF: $csrf" \
    -F "file=@-;filename=a11y-fixture.txt;type=text/plain" \
    "$base/v1/products/$product_id/tenants/$tenant_id/files" <<<"a11y drawer fixture")"
  [[ "$upload_code" -lt 400 ]] || die "file fixture upload -> HTTP $upload_code"
  post "/v1/products/$product_id/tenants/$tenant_id/events" \
    '{"type": "e2e.a11y.fixture", "data": {"fixture": true}}' >/dev/null
  local delivery_webhook_id
  delivery_webhook_id="$(post "/v1/products/$product_id/webhooks" \
    '{"url": "http://127.0.0.1:9/e2e-delivery-fixture", "event_types": ["e2e.fixture.never"], "description": "a11y drawer fixture"}' |
    json_get endpoint.id)"
  post "/v1/products/$product_id/webhooks/$delivery_webhook_id/test" '{}' >/dev/null
  rm -f "$jar"

  # 5. plain users (no platform role) for the specs
  local operator_email="studio-e2e-operator@example.com" member_email="studio-e2e-member@example.com" user_password
  user_password="$("$py" -c 'import secrets; print("pw-" + secrets.token_urlsafe(18))')"
  log "creating plain users $operator_email and $member_email"
  "$py" - "$STATE/axentra.toml" "$user_password" "$operator_email" "$member_email" <<'PY'
import sys
from axentra.config.settings import load_settings
from axentra.data.database import DbScope
from axentra.platform import Axentra

ax = Axentra.from_settings(load_settings(sys.argv[1]))
ax.db.open()
try:
    with ax.db.transaction(DbScope.platform()) as tx:
        for email in sys.argv[3:]:
            ax.identity.create_user(tx, email=email, name=email.split("@")[0], password=sys.argv[2])
finally:
    ax.db.close()
PY

  # 6. exports for Playwright
  local modules
  modules="$(curl -fsS "$base/v1/meta" | "$py" -c 'import json,sys; print(",".join(json.load(sys.stdin)["modules"]))')"
  umask 077
  cat >"$STATE/env" <<ENV
export AXENTRA_E2E_API=$base
export AXENTRA_E2E_PORT=$PREVIEW_PORT
export AXENTRA_E2E_EMAIL=$email
export AXENTRA_E2E_PASSWORD=$password
export AXENTRA_E2E_PRODUCT_ID=$product_id
export AXENTRA_E2E_TENANT_ID=$tenant_id
export AXENTRA_E2E_JOB_ID=$job_id
export AXENTRA_E2E_WEBHOOK_ID=$webhook_id
export AXENTRA_E2E_DELIVERY_WEBHOOK_ID=$delivery_webhook_id
export AXENTRA_E2E_TEMPLATE_KEY=$template_key
export AXENTRA_E2E_OPERATOR_EMAIL=$operator_email
export AXENTRA_E2E_MEMBER_EMAIL=$member_email
export AXENTRA_E2E_USER_PASSWORD=$user_password
export AXENTRA_E2E_BACKEND_SHA=$sha
export AXENTRA_E2E_MODULES=$modules
export AXENTRA_E2E_WORKER=$WORKER
export AXENTRA_E2E_MODE=$MODE
export AXENTRA_E2E_CONFIG=$STATE/axentra.toml
export AXENTRA_E2E_NOTIFY_DISPATCH=$(printf '%q' "$(printf '%q ' "${AX[@]}")notify-dispatch --once")
ENV
  umask 022
  log "ready: API $base, mode $MODE, modules $modules, backend $sha"
  log "logs: $STATE/run/*.log"
}

case "$CMD" in
  up)
    trap 'code=$?; [[ $code -eq 0 ]] || { log "up failed, cleaning up"; cmd_down; }' EXIT
    cmd_up
    trap - EXIT
    cmd_env
    ;;
  down) cmd_down ;;
  env) cmd_env ;;
  run)
    trap 'code=$?; trap - EXIT; if [[ $code -ne 0 && -f "$STATE/run/server.log" ]]; then log "server log (last 40 lines):"; tail -n 40 "$STATE/run/server.log" >&2 || true; fi; cmd_down; exit $code' EXIT
    trap 'exit 130' INT TERM
    cmd_up
    # shellcheck disable=SC1091
    source "$STATE/env"
    [[ ${#RUN_CMD[@]} -gt 0 ]] || RUN_CMD=(npm run e2e)
    log "running: ${RUN_CMD[*]}"
    (cd "$ROOT" && "${RUN_CMD[@]}")
    ;;
  *)
    usage
    exit 2
    ;;
esac
