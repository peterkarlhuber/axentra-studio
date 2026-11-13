# QA kit: local test version of Axentra Studio

A double-click test version of Axentra and Axentra Studio for manual QA by a non-technical tester. It is not a
release, not a deployment and not a security approval. Nothing here is published; the zips are built locally or as
workflow artifacts of a work branch.

## What the tester gets

One zip per operating system: `AxentraStudio-QA-windows.zip` (Windows 10/11 x64), `AxentraStudio-QA-macos.zip`
(Apple silicon only) and `AxentraStudio-QA-linux.zip` (x86_64). Unpacked, the folder holds six scripts
(`.cmd`, `.command` or `.sh`): install, start, stop, back up test data, reset test data, uninstall, plus
`Dokumente/` with the German guide, checklist, result sheet and bug report template.

- **Install** (needs internet once): uv (bundled) downloads Python 3.13 into `_kit/python` and installs the libraries
  of `build/kit-lock.txt` with `--require-hashes --only-binary :all:`, then the axentra wheel of the pinned commit.
- **Start**: `runtime/launcher.py` runs the bundled PostgreSQL 17 (`_kit/pg`, data in `_kit/daten/pg`), on the first
  start configures Axentra (`runtime/qa_config.py`, `runtime/bootstrap.py`: owner and runtime roles, RLS checked by
  `axentra db inspect-role`), starts the web process (`runtime/web.py`), the job worker, the notification dispatcher
  and a local SMTP catcher (`runtime/smtp_catcher.py`), then seeds synthetic data through the HTTP API
  (`runtime/seed_demo.py`, data set in `runtime/SEED_DATA.md`). Everything listens on 127.0.0.1 only.
- **One origin** `http://127.0.0.1:8765`: `/v1` is the unchanged Axentra app, `/qa/` the kit page (test users,
  integration status, captured mails, interactive checklist saved to `QA-Ergebnisse/`), everything else Studio's
  production build with the headers of `docker/40-axentra-studio.sh`.
- **Stop** ends every child process and PostgreSQL; closing the window does the same. A hard kill is cleaned up by
  the next stop or start (only processes whose command line points into the kit are stopped).
- Everything the kit writes stays inside its folder; uninstall removes `_kit/{env,python,cache,daten}`.

Integrations: SMTP goes to the local catcher (never out), billing uses Axentra's `fake` provider with live payments
off, webhooks deliver to a closed local port on purpose, OIDC, S3 and OpenTelemetry are not configured.

## Build

```bash
qakit/build/update_lock.sh <axentra checkout>          # only when the axentra pin or its lock changes
npm ci && npm run build                                # Studio's dist/
python qakit/build/fetch_tools.py <windows|macos|linux> .qakit-tools   # uv + PostgreSQL, SHA-256 pinned
python qakit/build/build_kit.py --axentra <axentra checkout at api/BACKEND_REF> \
  --studio-dist dist --tools .qakit-tools <system>     # needs uv and markdown; writes qakit/build/out/
```

The axentra commit is `api/BACKEND_REF`. `BUILD-INFO.json` and `KIT-INFO.txt` (SHA-256 of every file) in `_kit/`
record what a zip contains.

## Checks

- `python qakit/build/smoke.py <zip>`: unpack below the home folder into a folder with a space, umlauts and an
  apostrophe; install, start, sign in, stop, restart, back up, reset, uninstall.
- `python qakit/build/e2e_kit.py http://127.0.0.1:8765`: real-browser checks of a running kit (kit page, checklist
  persistence, mails, Studio sign-in, every global and product page without 5xx, role limits, phone width, sign-out).
- `qakit/runtime/dev_run.py`: backend lane harness (config, bootstrap, seed) against a local PostgreSQL.

PostgreSQL refuses to run as root; run the kit as a normal user.

## Known limits

- Intel Macs: `cryptography` 50 and `argon2-cffi-bindings` 26 of the lock have no Intel macOS wheels.
- Do not move or rename the folder after the first start (absolute paths in the Axentra config and the Python
  environment); a folder path with `$`, `` ` ``, `"`, `%` or `!` is refused because initdb passes paths through a shell.
- The Axentra API cannot create a second user with a password; `runtime/create_test_users.py` calls
  `identity.create_user` of the library once, as the restricted runtime role, with audit entries.
- The seeded product job kinds have no handler, so those jobs stay queued. Studio's own mailbox panel needs the
  `local` mail provider and shows "unavailable"; the kit page shows the captured mails instead.
- Webhook delivery to private and plain-http targets is enabled for the whole local instance (test-only settings that
  Axentra refuses in production).
