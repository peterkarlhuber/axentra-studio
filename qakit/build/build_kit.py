"""Assemble the Axentra Studio QA kits: one zip per operating system.

Usage:
  python qakit/build/build_kit.py --axentra <axentra checkout> [--tabrion <tabrion checkout>] --studio-dist <dist> \
      --tools <fetch_tools.py download folder> [--out <folder>] [windows] [macos] [linux]

Inputs:
- the axentra checkout (built into a wheel here; its commit goes into BUILD-INFO.json),
- the tabrion checkout at the commit that axentra's requirements/tabrion.txt pins (built into a wheel too),
- Studio's production build (`npm run build`, dist/), served same-origin by the kit's web process,
- uv and PostgreSQL from fetch_tools.py (SHA-256 checked there),
- qakit/runtime (launcher, web process, kit page, config, bootstrap, seed), qakit/scripts, qakit/docs,
  qakit/build/kit-lock.txt (hash-pinned runtime libraries).

Build-time requirement: the `markdown` package (renders the German documents to HTML).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
import zipfile
from datetime import UTC, datetime
from pathlib import Path

QAKIT = Path(__file__).resolve().parents[1]
STUDIO_REPO = QAKIT.parent
NAME = "AxentraStudio-QA"
SCRIPTS = {
    "install": "1 - Installieren",
    "start": "2 - Starten",
    "stop": "3 - Beenden",
    "backup": "4 - Testdaten sichern",
    "reset": "5 - Testdaten zuruecksetzen",
    "uninstall": "6 - Deinstallieren",
}
SYSTEMS = {
    "windows": (["windows-x64"], "windows", ".cmd"),
    # Apple silicon only: cryptography and argon2-cffi-bindings of the lock have no Intel macOS wheels.
    "macos": (["macos-arm64"], "posix", ".command"),
    "linux": (["linux-x64"], "posix", ".sh"),
}
DOCS_HTML = {
    "Anleitung.md": "Anleitung.html",
    "QA-Checkliste.md": "QA-Checkliste.html",
}
DOCS_COPY = {
    "QA-Ergebnisse.csv": "QA-Ergebnisse.csv",
    "Fehlerbericht-Vorlage.md": "Fehlerbericht-Vorlage.txt",
}
HTML_PAGE = """<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
body {{ font: 16px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; max-width: 860px; margin: 24px auto;
  padding: 0 16px; color: #11143b; background: #fff; }}
h1, h2, h3 {{ color: #06034c; }} a {{ color: #2a59e0; }}
table {{ border-collapse: collapse; }} th, td {{ border: 1px solid #dde1ee; padding: 4px 8px; text-align: left; }}
code {{ background: #eceff7; padding: 0 3px; border-radius: 3px; }}
blockquote {{ border-left: 4px solid #2a59e0; margin: 0; padding: 4px 12px; background: #e6edfd; }}
@media print {{ body {{ margin: 0; }} }}
</style></head><body>
{body}
</body></html>
"""


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(repo: Path, *args: str) -> str:
    return subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True, check=True).stdout.strip()


def build_wheel(repo: Path, name: str, out: Path) -> Path:
    if git(repo, "status", "--porcelain", "--untracked-files=no"):
        raise SystemExit(f"{repo} has uncommitted changes; build the kit from a clean commit")
    subprocess.run(["uv", "build", "--wheel", "--out-dir", str(out), str(repo)], check=True)
    (wheel,) = out.glob(f"{name}-*.whl")
    return wheel


def tabrion_pin(axentra: Path) -> str | None:
    """The tabrion commit that axentra pins (requirements/tabrion.txt), or None for an axentra without tabrion."""
    pin = axentra / "requirements" / "tabrion.txt"
    if not pin.is_file():
        return None
    shas = re.findall(
        r"^tabrion @ git\+https://github\.com/peterkarlhuber/tabrion\.git@([0-9a-f]{40})$", pin.read_text(), re.M
    )
    if len(shas) != 1:
        raise SystemExit(f"{pin}: expected exactly one tabrion requirement at a full commit SHA")
    return shas[0]


def render_docs(target: Path) -> None:
    import markdown

    target.mkdir(parents=True)
    docs = QAKIT / "docs"
    for src, dst in DOCS_HTML.items():
        text = (docs / src).read_text(encoding="utf-8")
        title = text.splitlines()[0].lstrip("# ").strip() if text else src
        body = markdown.markdown(text, extensions=["tables", "sane_lists", "toc"])
        (target / dst).write_text(HTML_PAGE.format(title=title, body=body), encoding="utf-8")
    for src, dst in DOCS_COPY.items():
        data = (docs / src).read_bytes()
        if dst.endswith(".txt"):
            data = crlf(data)
        (target / dst).write_bytes(data)


def crlf(data: bytes) -> bytes:
    return data.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n")  # readable in Windows Notepad too


def copy_licenses(root: Path, args: argparse.Namespace) -> None:
    """Studio's LICENSE at the top, the other bundled components' license texts in _kit/licenses. The Python
    libraries bring their own license files into _kit/env when the kit installs them."""
    (root / "LICENSE.txt").write_bytes(crlf((STUDIO_REPO / "LICENSE").read_bytes()))
    target = root / "_kit" / "licenses"
    target.mkdir()
    sources = {"axentra-LICENSE.txt": args.axentra / "LICENSE"}
    if args.tabrion is not None:
        sources["tabrion-LICENSE.txt"] = args.tabrion / "LICENSE"
    sources.update({p.name: p for p in sorted((QAKIT / "build" / "licenses").glob("*.txt"))})
    for name, src in sources.items():
        (target / name).write_bytes(crlf(src.read_bytes()))
    (target / "README.txt").write_bytes(
        crlf(
            b"License texts of the components bundled in this kit: Axentra and Tabrion (Levuvo), PostgreSQL 17.11\n"
            b"(PostgreSQL License, binaries from zonky embedded-postgres-binaries), uv 0.11.32 (MIT or Apache-2.0).\n"
            b"Axentra Studio's own license is LICENSE.txt in the top folder. The Python libraries that the install\n"
            b"step adds keep their license files in _kit/env (in each package's .dist-info folder).\n"
        )
    )


def stage(system: str, root: Path, args: argparse.Namespace, wheels: list[Path], info: dict) -> None:
    platforms, flavor, ext = SYSTEMS[system]
    kit = root / "_kit"
    kit.mkdir(parents=True)
    src = QAKIT / "scripts" / flavor
    for key, label in SCRIPTS.items():
        text = (src / f"{key}{'.cmd' if flavor == 'windows' else '.sh'}").read_text(encoding="utf-8")
        if flavor == "windows":
            text = text.replace("\r\n", "\n").replace("\n", "\r\n")
        (root / f"{label}{ext}").write_bytes(text.encode("ascii"))
    shared = ["common.cmd", "install_steps.cmd"] if flavor == "windows" else ["common.sh"]
    for name in shared:
        text = (src / name).read_text(encoding="utf-8")
        if flavor == "windows":
            text = text.replace("\r\n", "\n").replace("\n", "\r\n")
        (kit / name).write_bytes(text.encode("ascii"))
    for platform in platforms:
        shutil.copytree(args.tools / "uv" / platform, kit / "bin" / platform)
    shutil.copytree(args.tools / "pg" / system, kit / "pg")
    (kit / "wheels").mkdir()
    for wheel in wheels:
        shutil.copy2(wheel, kit / "wheels" / wheel.name)
    shutil.copy2(QAKIT / "build" / "kit-lock.txt", kit / "runtime-lock.txt")
    shutil.copytree(
        QAKIT / "runtime",
        kit / "app",
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "dev_run.py", "SEED_DATA.md"),
    )
    shutil.copy2(QAKIT / "docs" / "checkliste.json", kit / "app" / "checkliste.json")
    shutil.copytree(args.studio_dist, kit / "studio-web", ignore=shutil.ignore_patterns("*.map"))
    render_docs(root / "Dokumente")
    copy_licenses(root, args)
    (kit / "BUILD-INFO.json").write_text(json.dumps(dict(info, system=system), indent=1), encoding="utf-8")
    lines = [
        "Axentra Studio, local test version for manual QA only. Not a release; nothing is published.",
        json.dumps(info),
        "Files (SHA-256):",
    ]
    for path in sorted(p for p in kit.rglob("*") if p.is_file()):
        lines.append(f"  {sha256(path)}  {path.relative_to(root).as_posix()}")
    (kit / "KIT-INFO.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")


def executable(path: Path, system: str) -> bool:
    if system == "windows" or not path.is_file():
        return False
    if path.suffix in {".command", ".sh"}:
        return True
    parts = path.parts
    if "bin" in parts and ("pg" in parts or path.name == "uv"):
        return True
    return False


def pack(system: str, root: Path, out: Path) -> Path:
    archive = out / f"{NAME}-{system}.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for path in sorted(root.rglob("*")):
            arcname = path.relative_to(root.parent).as_posix()
            if path.is_symlink():
                info = zipfile.ZipInfo(arcname, date_time=(2026, 11, 13, 0, 0, 0))
                info.create_system = 3
                info.external_attr = 0o120777 << 16
                zf.writestr(info, str(path.readlink()))
                continue
            info = zipfile.ZipInfo(arcname + ("/" if path.is_dir() else ""), date_time=(2026, 11, 13, 0, 0, 0))
            info.create_system = 3  # Unix, so that unzip tools and Archive Utility keep the mode bits
            mode = 0o40755 if path.is_dir() else (0o100755 if executable(path, system) else 0o100644)
            info.external_attr = mode << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, b"" if path.is_dir() else path.read_bytes())
    return archive


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--axentra", required=True, type=Path)
    p.add_argument("--tabrion", type=Path, help="tabrion checkout at the commit axentra pins (if it pins one)")
    p.add_argument("--studio-dist", required=True, type=Path)
    p.add_argument("--tools", required=True, type=Path)
    p.add_argument("--out", type=Path, default=QAKIT / "build" / "out")
    p.add_argument("systems", nargs="*", default=list(SYSTEMS))
    args = p.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        wheel = build_wheel(args.axentra, "axentra", Path(tmp) / "wheel")
        wheels = [wheel]
        tabrion = tabrion_pin(args.axentra)
        if tabrion:
            if args.tabrion is None or git(args.tabrion, "rev-parse", "HEAD") != tabrion:
                raise SystemExit(f"axentra pins tabrion {tabrion}; pass --tabrion <checkout at that commit>")
            wheels.append(build_wheel(args.tabrion, "tabrion", Path(tmp) / "tabrion-wheel"))
        info = {
            "axentra_commit": git(args.axentra, "rev-parse", "HEAD"),
            "axentra_wheel": wheel.name,
            "tabrion_commit": tabrion,
            "tabrion_wheel": wheels[1].name if tabrion else None,
            "studio_commit": git(STUDIO_REPO, "rev-parse", "HEAD"),
            "studio_dirty": bool(git(STUDIO_REPO, "status", "--porcelain", "--untracked-files=no")),
            "postgresql": "17.11 (zonky embedded-postgres-binaries 17.11.0)",
            "python": "3.13 (installed by uv on first install)",
            "uv": "0.11.32",
            "built": datetime.now(UTC).isoformat(timespec="seconds"),
        }
        for system in args.systems:
            root = Path(tmp) / system / NAME
            stage(system, root, args, wheels, info)
            archive = pack(system, root, args.out)
            print(f"{archive.name}  {archive.stat().st_size // (1024 * 1024)} MiB  sha256 {sha256(archive)}")


if __name__ == "__main__":
    main()
