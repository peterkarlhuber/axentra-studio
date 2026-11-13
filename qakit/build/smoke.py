"""Smoke test of a QA kit zip, run the way a tester would: install, start, sign in, stop, restart, back up, reset,
uninstall.

Usage: python smoke.py <kit zip> [<parent folder>]

The zip is unpacked below the home folder into a folder with a space, umlauts and an apostrophe. The scripts run
with their prompts answered on stdin; BROWSER points to a no-op so nothing opens. Exits non-zero on failure.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

WINDOWS = os.name == "nt"
PARENT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path.home() / "Tëst Ördner l'été"
KIT = PARENT / "AxentraStudio-QA"
EXT = ".cmd" if WINDOWS else (".command" if sys.platform == "darwin" else ".sh")
BASE = "http://127.0.0.1:8765"
os.environ["QA_KIT_NO_TERMINAL"] = "1"
os.environ["QA_KIT_NO_PAUSE"] = "1"
os.environ["BROWSER"] = "echo" if not WINDOWS else "cmd /c echo"


def unpack(archive: str) -> None:
    PARENT.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as zf:
        for member in zf.infolist():
            target = Path(zf.extract(member, PARENT))
            mode = (member.external_attr >> 16) & 0o777
            if mode and not WINDOWS and not member.is_dir():
                target.chmod(mode)


def command(label: str) -> list[str]:
    script = KIT / f"{label}{EXT}"
    return ["cmd", "/c", str(script)] if WINDOWS else ["/bin/bash", str(script)]


def run(label: str, answers: str = "", timeout: int = 900) -> str:
    proc = subprocess.run(
        command(label),
        input=answers + "\n\n\n",
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        cwd=KIT,
    )
    print(f"--- {label}: exit {proc.returncode}\n{proc.stdout}{proc.stderr}", flush=True)
    if proc.returncode != 0:
        raise SystemExit(f"{label} failed")
    return proc.stdout


def get(path: str, data: dict | None = None) -> tuple[int, bytes]:
    req = urllib.request.Request(BASE + path, data=json.dumps(data).encode() if data else None)
    req.add_header("Origin", BASE)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""


def dump_logs() -> None:
    logs = KIT / "_kit" / "daten" / "logs"
    for path in sorted(logs.glob("*.log")) if logs.is_dir() else []:
        print(f"--- {path.name}\n{path.read_text(encoding='utf-8', errors='replace')[-4000:]}")


def start(log: Path) -> subprocess.Popen:
    fh = open(log, "w", encoding="utf-8")  # noqa: SIM115
    proc = subprocess.Popen(
        command("2 - Starten"), stdin=subprocess.PIPE, stdout=fh, stderr=subprocess.STDOUT, cwd=KIT, text=True
    )
    deadline = time.monotonic() + 900
    while time.monotonic() < deadline:
        text = log.read_text(encoding="utf-8", errors="replace")
        if "laeuft: http" in text:
            return proc
        if proc.poll() is not None or "FEHLER" in text:
            print(text)
            dump_logs()
            raise SystemExit("start failed")
        time.sleep(1)
    proc.kill()
    print(log.read_text(encoding="utf-8", errors="replace"))
    raise SystemExit("start timed out")


def stop(proc: subprocess.Popen, log: Path) -> None:
    run("3 - Beenden")
    try:
        proc.communicate(input="\n\n", timeout=120)
    except subprocess.TimeoutExpired:
        proc.kill()
        raise SystemExit("start script did not end after stop") from None
    print(log.read_text(encoding="utf-8", errors="replace"))
    try:
        urllib.request.urlopen(BASE + "/qa/api/ping", timeout=3)
    except Exception:
        return
    raise SystemExit("server still answers after stop")


def main() -> None:
    unpack(sys.argv[1])
    run("1 - Installieren")
    log = PARENT / "start1.log"
    proc = start(log)
    status, body = get("/")
    assert status == 200 and b"<html" in body.lower(), status
    status, body = get("/qa/api/info")
    users = json.loads(body)["users"]["benutzer"]
    assert len(users) >= 10, users
    status, _ = get("/v1/auth/login/password", {"email": users[0]["email"], "password": users[0]["password"]})
    assert status == 200, f"admin login {status}"
    status, body = get("/qa/api/mails")
    assert status == 200 and len(json.loads(body)) >= 1, "no captured mails"
    print("first start OK: Studio, kit page, admin login, captured mails")
    stop(proc, log)

    log = PARENT / "start2.log"
    proc = start(log)
    assert "Testdaten vorhanden" in log.read_text(encoding="utf-8", errors="replace")
    status, _ = get("/v1/auth/login/password", {"email": users[1]["email"], "password": users[1]["password"]})
    assert status == 200, f"login after restart {status}"
    print("restart OK: data kept")
    run("4 - Testdaten sichern")  # stops the running instance first
    proc.communicate(input="\n\n", timeout=120)
    assert any((KIT / "Sicherungen").iterdir()), "no backup folder"
    run("5 - Testdaten zuruecksetzen", answers="j\nn")
    assert not (KIT / "_kit" / "daten").exists(), "reset left the data folder"
    run("6 - Deinstallieren", answers="j\nn")
    leftovers = [p.name for p in (KIT / "_kit").iterdir() if p.name in {"env", "python", "cache", "daten"}]
    assert not leftovers, f"uninstall left {leftovers}"
    print("SMOKE OK")


if __name__ == "__main__":
    main()
