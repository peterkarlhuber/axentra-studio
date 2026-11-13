"""Axentra Studio QA kit launcher: start, stop, back up, reset and clean up the local test installation.

Runs inside the kit's own Python environment (``_kit/env``). It supervises four things and stops all of them on exit:
PostgreSQL (bundled binaries, data in ``_kit/daten/pg``), the web process (Studio's static files, the Axentra API
under ``/v1`` and the kit page under ``/qa/`` on one origin), Axentra's background workers, and a local SMTP
catcher that stores every mail as a file instead of sending it.

Messages printed here are for the tester, so they are German; code and comments stay English.

Usage: ``python launcher.py start|stop|backup|reset|cleanup|status``
"""

from __future__ import annotations

import argparse
import json
import os
import secrets
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent  # _kit/app
KIT = HERE.parent  # _kit
KIT_ROOT = KIT.parent  # the folder the tester unpacked
STATE = KIT / "daten"
PG_HOME = KIT / "pg"
STUDIO_WEB = KIT / "studio-web"
BACKUPS = KIT_ROOT / "Sicherungen"
RESULTS = KIT_ROOT / "QA-Ergebnisse"
RUN_FILE = STATE / "launcher.json"
STOP_FILE = STATE / "stop.request"
PORTS_FILE = STATE / "ports.json"
READY_FILE = STATE / ".initialized"
LOGS = STATE / "logs"
DEFAULT_HTTP_PORT = 8765
IS_WINDOWS = os.name == "nt"
EXE = ".exe" if IS_WINDOWS else ""
PG_SUPERUSER = "axqa_super"

sys.path.insert(0, str(HERE))


def say(msg: str = "") -> None:
    # The terminal may already be closed (the tester closed the window); shutting down must go on regardless.
    try:
        print(msg, flush=True)
    except (OSError, ValueError):
        pass


def pg_bin(name: str) -> Path:
    return PG_HOME / "bin" / f"{name}{EXE}"


def free_port(preferred: int | None = None, span: int = 20) -> int:
    candidates = list(range(preferred, preferred + span)) if preferred else []
    for port in candidates:
        if port_free(port):
            return port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


def port_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if not IS_WINDOWS:
            # Like the servers themselves: a port in TIME_WAIT after the last stop counts as free. (On Windows the
            # option would allow binding over a live socket, so the plain check is used there.)
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("127.0.0.1", port))
        except OSError:
            return False
    return True


def private_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    if not IS_WINDOWS:
        path.chmod(0o700)
    return path


def write_private(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        fh.write(text)


def read_json(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def pid_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    if IS_WINDOWS:
        out = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}", "/NH"], capture_output=True, text=True, errors="replace", check=False
        ).stdout
        return str(pid) in out
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def pid_is_ours(pid: int) -> bool:
    """True only for a live process whose command line points into this kit (never kill an unrelated process
    that reused a recorded PID)."""
    if not pid_alive(pid):
        return False
    try:
        if IS_WINDOWS:
            ps = (
                "[Console]::OutputEncoding = [Text.Encoding]::UTF8; "
                f"(Get-CimInstance Win32_Process -Filter 'ProcessId={int(pid)}').CommandLine"
            )
            cmdline = subprocess.run(
                ["powershell", "-NoProfile", "-Command", ps], capture_output=True, check=False
            ).stdout.decode("utf-8", "replace")
        elif Path(f"/proc/{pid}/cmdline").exists():
            cmdline = Path(f"/proc/{pid}/cmdline").read_bytes().replace(b"\0", b" ").decode("utf-8", "replace")
        else:
            cmdline = subprocess.run(
                ["ps", "-o", "command=", "-p", str(int(pid))],
                capture_output=True,
                text=True,
                errors="replace",
                check=False,
            ).stdout
    except OSError:
        return False
    return str(KIT) in cmdline


def kill_pid(pid: int) -> None:
    try:
        if IS_WINDOWS:
            subprocess.run(["taskkill", "/PID", str(int(pid)), "/T", "/F"], capture_output=True, check=False)
        else:
            os.kill(pid, signal.SIGTERM)
    except OSError:
        pass


def http_ok(url: str, timeout: float = 2.0) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return 200 <= resp.status < 500
    except Exception:
        return False


def pg_url(ports: dict, password: str, db: str = "postgres") -> str:
    return f"postgresql://{PG_SUPERUSER}:{password}@127.0.0.1:{ports['pg']}/{db}"


def axentra_cmd(config: Path, *args: str) -> list[str]:
    code = "import sys; from axentra.cli import main; sys.exit(main())"
    return [sys.executable, "-c", code, "--config", str(config), *args]


class Supervisor:
    """Owns every child process of one run and stops them in reverse order."""

    def __init__(self) -> None:
        self.children: list[tuple[str, subprocess.Popen]] = []
        self.smtp = None
        self.stopping = threading.Event()
        self._stopped = False
        self._done = threading.Event()
        self._lock = threading.Lock()
        self.ports: dict = {}

    def spawn(self, name: str, cmd: list[str], env: dict | None = None) -> subprocess.Popen:
        log = open(LOGS / f"{name}.log", "ab")  # noqa: SIM115 (kept open for the child's lifetime)
        kwargs: dict = {"stdout": log, "stderr": subprocess.STDOUT, "stdin": subprocess.DEVNULL, "cwd": str(STATE)}
        if IS_WINDOWS:
            kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
        proc = subprocess.Popen(cmd, env=env, **kwargs)
        self.children.append((name, proc))
        self.record()
        return proc

    def record(self, ready: bool = False) -> None:
        """Write the run file after every spawn, so that a hard kill at any point leaves a list of what to stop."""
        write_private(
            RUN_FILE,
            json.dumps(
                {
                    "launcher_pid": os.getpid(),
                    "pids": [p.pid for _, p in self.children],
                    "ports": self.ports,
                    "ready": ready,
                    "started": datetime.now().isoformat(timespec="seconds"),
                }
            ),
        )

    def stop_all(self) -> None:
        with self._lock:
            first = not self._stopped
            self._stopped = True
        if not first:
            # Another thread (Windows console close, signal) is already stopping: wait until it is done, so the
            # interpreter does not exit while PostgreSQL is still being stopped.
            self._done.wait(timeout=90)
            return
        try:
            self._stop_all()
        finally:
            self._done.set()

    def _stop_all(self) -> None:
        say("Axentra Studio wird beendet ...")
        for name, proc in reversed(self.children):
            if name == "postgres":
                continue
            if proc.poll() is None:
                proc.terminate()
        for name, proc in reversed(self.children):
            if name == "postgres":
                continue
            try:
                proc.wait(timeout=15)
            except subprocess.TimeoutExpired:
                proc.kill()
        if self.smtp is not None:
            try:
                self.smtp.stop()
            except Exception:
                pass
        stop_postgres()
        for name, proc in self.children:
            if name == "postgres":
                try:
                    proc.wait(timeout=30)
                except subprocess.TimeoutExpired:
                    proc.kill()
        for path in (RUN_FILE, STOP_FILE):
            path.unlink(missing_ok=True)
        say("Alles beendet. Es laufen keine Hintergrundprozesse mehr.")


def stop_postgres() -> None:
    data = STATE / "pg"
    if not (data / "postmaster.pid").exists():
        return
    subprocess.run(
        [str(pg_bin("pg_ctl")), "stop", "-D", str(data), "-m", "fast", "-w", "-t", "60"],
        capture_output=True,
        check=False,
    )


def init_postgres(ports: dict) -> str:
    """Create the cluster once; return the superuser password (kept in a 0600 file in the state folder)."""
    pw_file = STATE / "pg-superuser.txt"
    data = STATE / "pg"
    if data.exists():
        return pw_file.read_text(encoding="utf-8").strip()
    password = secrets.token_urlsafe(24)
    write_private(pw_file, password + "\n")
    say("  Datenbank wird angelegt ...")
    res = subprocess.run(
        [
            str(pg_bin("initdb")),
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
        ],
        capture_output=True,
        text=True,
        errors="replace",
        check=False,
    )
    (LOGS / "initdb.log").write_text(res.stdout + res.stderr, encoding="utf-8")
    if res.returncode != 0:
        shutil.rmtree(data, ignore_errors=True)
        raise SystemExit(f"FEHLER: Die Datenbank konnte nicht angelegt werden (siehe {LOGS / 'initdb.log'}).")
    with open(data / "postgresql.conf", "a", encoding="utf-8") as conf:
        conf.write(
            "\n# Axentra Studio QA kit: local only.\n"
            "listen_addresses = '127.0.0.1'\n"
            f"port = {ports['pg']}\n"
            "unix_socket_directories = ''\n"
            "max_connections = 60\n"
            "logging_collector = off\n"
        )
    return password


def wait_for_postgres(url: str, proc: subprocess.Popen, timeout: float = 60) -> None:
    import psycopg

    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if proc.poll() is not None:
            raise SystemExit(f"FEHLER: Die Datenbank ist nicht gestartet (siehe {LOGS / 'postgres.log'}).")
        try:
            with psycopg.connect(url, connect_timeout=2):
                return
        except Exception:
            time.sleep(0.5)
    raise SystemExit("FEHLER: Die Datenbank antwortet nicht.")


def wait_for_http(url: str, procs: list[subprocess.Popen], timeout: float = 90) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if any(p.poll() is not None for p in procs):
            raise SystemExit(f"FEHLER: Axentra ist nicht gestartet (siehe {LOGS / 'web.log'}).")
        if http_ok(url):
            return
        time.sleep(0.5)
    raise SystemExit("FEHLER: Axentra antwortet nicht.")


def load_ports() -> dict:
    ports = read_json(PORTS_FILE)
    if ports:
        return ports
    ports = {"http": free_port(DEFAULT_HTTP_PORT), "pg": free_port(), "smtp": free_port()}
    write_private(PORTS_FILE, json.dumps(ports))
    return ports


def leftover_cleanup() -> None:
    """A previous run that was killed hard can leave PostgreSQL running; stop it before starting again."""
    info = read_json(RUN_FILE)
    if info:
        launcher = int(info.get("launcher_pid", 0))
        for pid in [launcher, *info.get("pids", [])]:
            if pid != os.getpid() and pid_is_ours(int(pid)):
                kill_pid(int(pid))
        time.sleep(1)
    stop_postgres()
    for path in (RUN_FILE, STOP_FILE):
        path.unlink(missing_ok=True)


def running_instance() -> dict | None:
    info = read_json(RUN_FILE)
    if not info or not pid_is_ours(int(info.get("launcher_pid", 0))):
        return None
    if http_ok(f"http://127.0.0.1:{info['ports']['http']}/qa/api/ping"):
        return info
    return None


def install_stop_handlers(sup: Supervisor) -> None:
    def _handler(*_args: object) -> None:
        sup.stopping.set()

    for sig in ("SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"):
        if hasattr(signal, sig):
            try:
                signal.signal(getattr(signal, sig), _handler)
            except (OSError, ValueError):
                pass
    if IS_WINDOWS:
        # Closing the console window gives the process a few seconds: stop everything right there.
        import ctypes

        handler_type = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_uint)

        def _console(event: int) -> bool:
            sup.stopping.set()
            if event in (2, 5, 6):  # CTRL_CLOSE, CTRL_LOGOFF, CTRL_SHUTDOWN
                sup.stop_all()
            return True

        sup._console_handler = handler_type(_console)  # keep a reference
        ctypes.windll.kernel32.SetConsoleCtrlHandler(sup._console_handler, True)


def cmd_start(args: argparse.Namespace) -> int:
    running = running_instance()
    if running:
        url = f"http://127.0.0.1:{running['ports']['http']}/"
        say(f"Axentra Studio laeuft bereits: {url}")
        if not args.no_browser:
            webbrowser.open(url)
        return 0
    if any(ch in str(KIT) for ch in '$`"%!'):
        # PostgreSQL's initdb and pg_ctl pass paths through a shell; these characters would break them.
        say('FEHLER: Der Ordnerpfad des Testpakets enthaelt ein Sonderzeichen ($ ` " % !).')
        say('Bitte das Testpaket in einen Ordner ohne diese Zeichen entpacken (z. B. in "Downloads").')
        return 1
    private_dir(STATE)
    private_dir(LOGS)
    leftover_cleanup()
    ports = load_ports()
    for key in ("http", "pg", "smtp"):
        if not port_free(ports[key]):
            say(f"FEHLER: Der Anschluss (Port) {ports[key]} ist belegt. Laeuft Axentra Studio schon in einem")
            say("anderen Fenster? Sonst eine Minute warten und erneut starten;")
            say("hilft das nicht, den Computer neu starten.")
            return 1

    sup = Supervisor()
    sup.ports = ports
    install_stop_handlers(sup)
    try:
        return _run(args, sup, ports)
    except SystemExit as exc:
        if exc.code not in (0, None):
            say(str(exc.code))
        return 1
    finally:
        sup.stop_all()


def _run(args: argparse.Namespace, sup: Supervisor, ports: dict) -> int:
    first_run = not READY_FILE.exists()
    if first_run and (STATE / "pg").exists():
        # An earlier first start was interrupted: begin again with an empty database.
        say("Ein frueherer erster Start wurde nicht beendet; die Testdaten werden neu angelegt.")
        shutil.rmtree(STATE / "pg", ignore_errors=True)
        (STATE / "axentra").exists() and shutil.rmtree(STATE / "axentra", ignore_errors=True)
    say("[1/4] Datenbank starten ...")
    password = init_postgres(ports)
    pg = sup.spawn("postgres", [str(pg_bin("postgres")), "-D", str(STATE / "pg")])
    super_url = pg_url(ports, password)
    wait_for_postgres(super_url, pg)

    import qa_config
    from smtp_catcher import MailCatcher

    if first_run:
        say("[2/4] Axentra einrichten (nur beim ersten Start, etwa eine Minute) ...")
        config = qa_config.prepare(STATE / "axentra", ports["pg"], ports["http"], ports["smtp"])
        import bootstrap

        bootstrap.bootstrap(config, Path(sys.executable), super_url)
    else:
        say("[2/4] Axentra pruefen ...")
        config = qa_config.config_path(STATE / "axentra")
        res = subprocess.run(
            axentra_cmd(config, "migrate", "--check"), capture_output=True, text=True, errors="replace", check=False
        )
        if res.returncode != 0:
            (LOGS / "migrate-check.log").write_text(res.stdout + res.stderr, encoding="utf-8")
            raise SystemExit(
                "FEHLER: Die Testdatenbank passt nicht zu dieser Axentra-Version. "
                'Bitte "5 - Testdaten zuruecksetzen" ausfuehren.'
            )

    sup.smtp = MailCatcher(STATE / "mails", ports["smtp"])
    sup.smtp.start()

    say("[3/4] Axentra und Studio starten ...")
    env = dict(os.environ, PYTHONUNBUFFERED="1")
    web = sup.spawn(
        "web",
        [
            sys.executable,
            str(HERE / "web.py"),
            "--config",
            str(config),
            "--port",
            str(ports["http"]),
            "--studio",
            str(STUDIO_WEB),
            "--state",
            str(STATE),
            "--kit",
            str(KIT),
            "--results",
            str(RESULTS),
        ],
        env=env,
    )
    for name, extra in qa_config.BACKGROUND_PROCESSES:
        sup.spawn(name, axentra_cmd(config, *extra), env=env)
    base = f"http://127.0.0.1:{ports['http']}"
    wait_for_http(f"{base}/qa/api/ping", [web])

    if first_run:
        say("[4/4] Synthetische Testdaten anlegen ...")
        import seed_demo

        seed_demo.seed(base, config, Path(sys.executable), STATE)
        READY_FILE.write_text(datetime.now().isoformat(timespec="seconds"), encoding="utf-8")
    else:
        say("[4/4] Testdaten vorhanden.")

    sup.record(ready=True)
    say()
    say(f"Axentra Studio laeuft: {base}/")
    say(f"Testbenutzer, E-Mails und Hinweise: {base}/qa/")
    say('Dieses Fenster bitte offen lassen. Beenden: "3 - Beenden" oder dieses Fenster schliessen.')
    if not args.no_browser:
        webbrowser.open(f"{base}/qa/")
    while not sup.stopping.is_set():
        if STOP_FILE.exists():
            break
        dead = [name for name, p in sup.children if p.poll() is not None]
        if dead:
            say(f"FEHLER: Ein Teil von Axentra ist unerwartet beendet worden ({', '.join(dead)}).")
            say(f'Details stehen in {LOGS}. Bitte "2 - Starten" erneut ausfuehren.')
            return 1
        sup.stopping.wait(0.5)
    return 0


def cmd_stop(_args: argparse.Namespace) -> int:
    info = read_json(RUN_FILE)
    if not info or not pid_is_ours(int(info.get("launcher_pid", 0))):
        leftover_cleanup()
        say("Axentra Studio lief nicht (eventuelle Reste wurden beendet).")
        return 0
    STOP_FILE.write_text("stop", encoding="utf-8")
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline and RUN_FILE.exists():
        time.sleep(0.5)
    if RUN_FILE.exists():
        leftover_cleanup()
    say("Axentra Studio wurde beendet.")
    return 0


def ensure_stopped() -> None:
    if running_instance() or RUN_FILE.exists():
        cmd_stop(argparse.Namespace())


def cmd_backup(_args: argparse.Namespace) -> int:
    if not READY_FILE.exists():
        say("Es gibt noch keine Testdaten zum Sichern.")
        return 0
    ensure_stopped()
    target = BACKUPS / datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    say(f"Testdaten werden gesichert nach: {target}")
    shutil.copytree(STATE, target, ignore=shutil.ignore_patterns("launcher.json", "stop.request", "postmaster.pid"))
    say("Sicherung fertig. Wiederherstellen: siehe Anleitung, Abschnitt 8.")
    return 0


def cmd_reset(_args: argparse.Namespace) -> int:
    ensure_stopped()
    if STATE.exists():
        guard_inside_kit(STATE)
        shutil.rmtree(STATE)
    say("Testdaten entfernt. Der naechste Start legt neue Testdaten an.")
    return 0


def cmd_cleanup(_args: argparse.Namespace) -> int:
    """Uninstall step run from the kit's Python: stop everything and delete the test data."""
    ensure_stopped()
    if STATE.exists():
        guard_inside_kit(STATE)
        shutil.rmtree(STATE)
    return 0


def guard_inside_kit(path: Path) -> None:
    resolved = path.resolve()
    if resolved.parent != KIT.resolve() or not (KIT / "app" / "launcher.py").exists():
        raise SystemExit(f"FEHLER: Unerwarteter Ordner {resolved}; es wurde nichts entfernt.")


def cmd_status(_args: argparse.Namespace) -> int:
    info = running_instance()
    if info:
        say(f"laeuft: http://127.0.0.1:{info['ports']['http']}/")
        return 0
    say("gestoppt")
    return 3


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="launcher")
    sub = p.add_subparsers(dest="cmd", required=True)
    st = sub.add_parser("start")
    st.add_argument("--no-browser", action="store_true")
    for name in ("stop", "backup", "reset", "cleanup", "status"):
        sub.add_parser(name)
    args = p.parse_args(argv)
    handlers = {
        "start": cmd_start,
        "stop": cmd_stop,
        "backup": cmd_backup,
        "reset": cmd_reset,
        "cleanup": cmd_cleanup,
        "status": cmd_status,
    }
    return handlers[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())
