"""Developer harness of the backend lane: run the whole kit backend end to end without the launcher.

    python dev_run.py [--state DIR] [--fresh] [--keep-running]

1. Creates a throwaway PostgreSQL 17 cluster like the launcher does (``initdb -U axqa_super
   -A scram-sha-256 -E UTF8 --locale=C``, listen on 127.0.0.1 only) and starts ``postgres``.
   PostgreSQL refuses to run as root: when this script runs as root it runs initdb/postgres as the
   unprivileged user ``axqa`` (created with ``useradd`` if missing).
2. ``qa_config.prepare`` + ``bootstrap.bootstrap`` (only for a fresh state folder; otherwise
   bootstrap runs again to prove it is idempotent).
3. Starts the local SMTP catcher, ``axentra serve`` and the background processes of
   ``qa_config.BACKGROUND_PROCESSES``.
4. ``seed_demo.seed`` and prints a summary (counts read back through the API).

Must run with the venv Python (``/home/user/.venv-axqa/bin/python``).
"""

from __future__ import annotations

import argparse
import json
import os
import secrets
import shutil
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import bootstrap
import qa_config

PG_BIN = Path(os.environ.get("AXQA_PG_BIN", "/home/user/axqa/pg/linux/bin"))
PG_USER = "axqa"
PG_SUPERUSER = "axqa_super"
PORTS = {"pg": 55432, "http": 18080, "smtp": 18025}
AX = "import sys; from axentra.cli import main; sys.exit(main())"


def _as_pg_user(cmd: list[str]) -> list[str]:
    if os.geteuid() != 0:
        return cmd
    if subprocess.run(["id", PG_USER], capture_output=True).returncode != 0:
        subprocess.run(["useradd", "-M", "-s", "/usr/sbin/nologin", PG_USER], check=True)
    return ["runuser", "-u", PG_USER, "--", *cmd]


def start_postgres(state: Path) -> tuple[subprocess.Popen, str]:
    data = state / "pg"
    pw_file = state / "pg-superuser.txt"
    if not data.exists():
        password = secrets.token_urlsafe(24)
        pw_file.write_text(password + "\n", encoding="utf-8")
        if os.geteuid() == 0:
            # initdb runs as the unprivileged user: it must read the password file and own the folder.
            data.mkdir(mode=0o700)
            shutil.chown(data, PG_USER)
            shutil.chown(pw_file, PG_USER)
        subprocess.run(
            _as_pg_user(
                [
                    str(PG_BIN / "initdb"),
                    "-D",
                    str(data),
                    "-U",
                    PG_SUPERUSER,
                    f"--pwfile={pw_file}",
                    "-A",
                    "scram-sha-256",
                    "-E",
                    "UTF8",
                    "--locale=C",
                ]
            ),
            check=True,
            capture_output=True,
        )
        with open(data / "postgresql.conf", "a", encoding="utf-8") as conf:
            conf.write(
                f"\nlisten_addresses = '127.0.0.1'\nport = {PORTS['pg']}\n"
                "unix_socket_directories = ''\nmax_connections = 60\n"
            )
    pw_file.chmod(0o600)
    password = pw_file.read_text(encoding="utf-8").strip()
    log = open(state / "postgres.log", "ab")
    proc = subprocess.Popen(_as_pg_user([str(PG_BIN / "postgres"), "-D", str(data)]), stdout=log, stderr=log)
    url = f"postgresql://{PG_SUPERUSER}:{password}@127.0.0.1:{PORTS['pg']}/postgres"
    import psycopg

    for _ in range(120):
        try:
            psycopg.connect(url, connect_timeout=2).close()
            return proc, url
        except psycopg.OperationalError:
            if proc.poll() is not None:
                raise SystemExit("postgres exited; see " + str(state / "postgres.log"))
            time.sleep(0.5)
    raise SystemExit("postgres did not start")


def wait_http(url: str, procs: list[subprocess.Popen], timeout: float = 60) -> None:
    import httpx

    deadline = time.time() + timeout
    while time.time() < deadline:
        for p in procs:
            if p.poll() is not None:
                raise SystemExit(f"a process exited early: {p.args}")
        try:
            if httpx.get(url, timeout=2).status_code == 200:
                return
        except httpx.HTTPError:
            pass
        time.sleep(0.5)
    raise SystemExit(f"{url} did not answer")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--state", default=str(HERE.parent.parent.parent / ".axqa-dev-state"))
    ap.add_argument("--fresh", action="store_true", help="delete the state folder first")
    ap.add_argument("--keep-running", action="store_true", help="keep the processes running until Ctrl+C")
    args = ap.parse_args()
    state = Path(args.state).resolve()
    if args.fresh and state.exists():
        shutil.rmtree(state)
    state.mkdir(parents=True, exist_ok=True)
    if os.geteuid() == 0:
        _as_pg_user(["true"])  # creates the user
        os.chmod(state, 0o755)
    py = Path(sys.executable)
    procs: list[subprocess.Popen] = []
    t0 = time.time()
    pg, super_url = start_postgres(state)
    try:
        ax_state = state / "axentra"
        fresh = not qa_config.config_path(ax_state).exists()
        config = (
            qa_config.prepare(ax_state, PORTS["pg"], PORTS["http"], PORTS["smtp"])
            if fresh
            else qa_config.config_path(ax_state)
        )
        bootstrap.bootstrap(config, py, super_url)
        print(f"bootstrap ok ({'fresh' if fresh else 're-run'}) after {time.time() - t0:.1f}s")

        from smtp_catcher import MailCatcher

        catcher = MailCatcher(state / "mails", PORTS["smtp"])
        catcher.start()
        logs = state / "logs"
        logs.mkdir(exist_ok=True)

        def spawn(name: str, extra: list[str]) -> None:
            log = open(logs / f"{name}.log", "ab")
            procs.append(subprocess.Popen([str(py), "-c", AX, "--config", str(config), *extra], stdout=log, stderr=log))

        spawn("serve", ["serve", "--host", "127.0.0.1", "--port", str(PORTS["http"])])
        for name, extra in qa_config.BACKGROUND_PROCESSES:
            spawn(name, extra)
        base = f"http://127.0.0.1:{PORTS['http']}"
        wait_http(base + "/v1/health/ready", procs)

        import seed_demo

        result = seed_demo.seed(base, config, py, state)
        print(json.dumps(result["summary"], indent=2, ensure_ascii=False))
        print(f"users: {len(result['users'])}, written to {state / 'testbenutzer.json'}")
        time.sleep(8)  # let the worker and dispatcher process a first round
        print(f"mails caught: {len(list((state / 'mails').glob('*.eml')))}")
        print(f"done after {time.time() - t0:.1f}s")
        if args.keep_running:
            print(f"running at {base} (Ctrl+C stops)")
            while all(p.poll() is None for p in procs):
                time.sleep(1)
        catcher.stop()
        return 0
    finally:
        for p in reversed(procs):
            p.terminate()
        for p in procs:
            try:
                p.wait(15)
            except subprocess.TimeoutExpired:
                p.kill()
        pg.terminate()
        pg.wait(30)


if __name__ == "__main__":
    sys.exit(main())
