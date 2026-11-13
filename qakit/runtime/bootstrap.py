"""Create the database and roles of the QA kit, run migrations and the runtime role grants.

``bootstrap(config_path, venv_python, pg_superuser_url)``:

1. As the PostgreSQL superuser (the kit's own throwaway cluster): create or update the roles
   ``axentra_owner`` (owns the schema, runs migrations) and ``axentra_app`` (runtime role: LOGIN,
   NOSUPERUSER, NOBYPASSRLS, no DDL), create the database ``axentra`` owned by ``axentra_owner`` and
   lock it down like Axentra's deploy/compose/initdb/01-roles.sql.
2. ``axentra --config <cfg> migrate``                       (as the owner role)
3. ``axentra --config <cfg> db grant-runtime-role axentra_app``  (as the owner role)
4. ``axentra --config <cfg> db inspect-role``               (fails unless RLS fully applies)

Idempotent: every step can run again (passwords are reset to the ones in the state folder).

This file uses only the standard library. The SQL of step 1 runs in a child process of the venv
Python (it needs psycopg); the superuser URL is passed in the environment, never on a command line.
"""

from __future__ import annotations

import os
import subprocess
import sys
import tomllib
from pathlib import Path

OWNER_ROLE = "axentra_owner"
APP_ROLE = "axentra_app"
DB_NAME = "axentra"

_AXENTRA = "import sys; from axentra.cli import main; sys.exit(main())"


def _role_passwords(config_path: Path) -> tuple[str, str]:
    cfg = tomllib.loads(Path(config_path).read_text(encoding="utf-8"))
    secrets_dir = Path(cfg["database"]["migration_url_ref"].removeprefix("file:")).parent
    owner = (secrets_dir / "db_owner_password").read_text(encoding="utf-8").strip()
    app = (secrets_dir / "db_app_password").read_text(encoding="utf-8").strip()
    return owner, app


def axentra_cli(venv_python: Path, config_path: Path, *args: str, check: bool = True) -> str:
    """Run ``axentra --config <cfg> <args>`` with the venv Python; return stdout."""
    cmd = [str(venv_python), "-c", _AXENTRA, "--config", str(config_path), *args]
    proc = subprocess.run(cmd, capture_output=True, text=True, env=_child_env())
    if check and proc.returncode != 0:
        raise RuntimeError(f"axentra {' '.join(args)} failed (exit {proc.returncode}):\n{proc.stderr.strip()[-2000:]}")
    return proc.stdout


def _child_env() -> dict[str, str]:
    env = dict(os.environ)
    # Settings come only from the config file, never from a stray environment.
    for key in list(env):
        if key.startswith("AXENTRA__") or key == "AXENTRA_CONFIG":
            env.pop(key)
    env["PYTHONIOENCODING"] = "utf-8"
    return env


# SQL step, executed by the venv Python (psycopg). Reads its inputs from the environment.
_ROLE_SCRIPT = r"""
import os
import psycopg
from psycopg import sql
from urllib.parse import urlsplit, urlunsplit

su = os.environ["AXQA_SUPERUSER_URL"]
owner, app, db = os.environ["AXQA_OWNER_ROLE"], os.environ["AXQA_APP_ROLE"], os.environ["AXQA_DB"]
owner_pw, app_pw = os.environ["AXQA_OWNER_PW"], os.environ["AXQA_APP_PW"]

with psycopg.connect(su, autocommit=True) as conn:
    for role, pw in ((owner, owner_pw), (app, app_pw)):
        exists = conn.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (role,)).fetchone()
        verb = "ALTER" if exists else "CREATE"
        conn.execute(
            sql.SQL(verb + " ROLE {} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS"
                    " PASSWORD {}").format(sql.Identifier(role), sql.Literal(pw))
        )
    if not conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db,)).fetchone():
        conn.execute(sql.SQL("CREATE DATABASE {} OWNER {} ENCODING 'UTF8' TEMPLATE template0").format(
            sql.Identifier(db), sql.Identifier(owner)))
    conn.execute(sql.SQL("ALTER DATABASE {} OWNER TO {}").format(sql.Identifier(db), sql.Identifier(owner)))

parts = urlsplit(su)
db_url = urlunsplit((parts.scheme, parts.netloc, "/" + db, parts.query, parts.fragment))
with psycopg.connect(db_url, autocommit=True) as conn:
    D, O, A = sql.Identifier(db), sql.Identifier(owner), sql.Identifier(app)
    for stmt in (
        sql.SQL("ALTER SCHEMA public OWNER TO {}").format(O),
        sql.SQL("REVOKE ALL ON DATABASE {} FROM PUBLIC").format(D),
        sql.SQL("REVOKE CREATE ON SCHEMA public FROM PUBLIC").format(),
        sql.SQL("GRANT CONNECT, TEMPORARY ON DATABASE {} TO {}").format(D, A),
        sql.SQL("GRANT USAGE ON SCHEMA public TO {}").format(A),
    ):
        conn.execute(stmt)
print("roles ok")
"""


def bootstrap(config_path: Path, venv_python: Path, pg_superuser_url: str) -> None:
    """Create/update roles and database, migrate, grant the runtime role and verify RLS applies."""
    config_path = Path(config_path).resolve()
    owner_pw, app_pw = _role_passwords(config_path)
    env = _child_env()
    env.update(
        AXQA_SUPERUSER_URL=pg_superuser_url,
        AXQA_OWNER_ROLE=OWNER_ROLE,
        AXQA_APP_ROLE=APP_ROLE,
        AXQA_DB=DB_NAME,
        AXQA_OWNER_PW=owner_pw,
        AXQA_APP_PW=app_pw,
    )
    proc = subprocess.run([str(venv_python), "-c", _ROLE_SCRIPT], capture_output=True, text=True, env=env)
    if proc.returncode != 0:
        # The superuser URL holds a password: never echo the command or environment.
        raise RuntimeError(f"creating database roles failed:\n{proc.stderr.strip()[-2000:]}")

    axentra_cli(venv_python, config_path, "migrate")
    axentra_cli(venv_python, config_path, "db", "grant-runtime-role", APP_ROLE)
    # Exit 3 when the runtime role is not restricted by row-level security: then refuse to go on.
    axentra_cli(venv_python, config_path, "db", "inspect-role", APP_ROLE)


if __name__ == "__main__":  # python bootstrap.py <config> <venv_python>  (superuser URL in AXQA_SUPERUSER_URL)
    bootstrap(Path(sys.argv[1]), Path(sys.argv[2]), os.environ["AXQA_SUPERUSER_URL"])
    print("bootstrap ok")
