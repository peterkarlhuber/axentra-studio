"""Download the binaries bundled in the QA kit and check them against pinned SHA-256 values.

- uv (installs the kit's Python and libraries): taken from the uv wheels on PyPI.
- PostgreSQL 17 (initdb, pg_ctl, postgres and their libraries): the zonky "embedded-postgres-binaries" jars on
  Maven Central, which hold a .txz of a relocatable PostgreSQL build. The macOS build is a universal binary
  (x86_64 and arm64), so one macOS kit serves both.

Usage: python fetch_tools.py <windows|macos|linux> <download folder>
Writes <folder>/uv/<platform>/uv[.exe] and <folder>/pg/<system>/{bin,lib,share}.
"""

from __future__ import annotations

import hashlib
import io
import json
import lzma
import os
import sys
import tarfile
import urllib.request
import zipfile
from pathlib import Path

UV_VERSION = "0.11.32"
UV_WHEELS = {
    "macosx_10_12_x86_64": "c82954b1bd507e767b1d996c2865ea3eb7d464a479ec0e4d60f0b8e2e07dee45",
    "macosx_11_0_arm64": "2a56d1abf16337350e878b2c869b256b8448ecc4a722b98f8d41e1b3680a587b",
    "manylinux_2_17_x86_64": "3da76cd4e2697de30928b8a8524bd39183ac1e08cb7e72833807c022b7cba6c4",
    "win_amd64": "855632ee1d2a8491986efa54c562b806cd32477761889a1e13624b519d98a45e",
}
UV_PLATFORMS = {
    "windows": {"win_amd64": "windows-x64"},
    "macos": {"macosx_11_0_arm64": "macos-arm64"},
    "linux": {"manylinux_2_17_x86_64": "linux-x64"},
}

PG_VERSION = "17.11.0"
PG_JARS = {
    "windows": ("windows-amd64", "98040fae18dd9633ff95932125b0cecf0a45a1a9312e216e2a33ad03a31d4251"),
    "macos": ("darwin-arm64v8", "a1c2786acb0c398f9b2d76806fc52f5dc8b222cbc8e9383a9b9702084daaf3a5"),
    "linux": ("linux-amd64", "0dd7b72b6f335b8ecfb355fa24c5781e8a93edd09880bb77eb52ebbf29b3e96d"),
}
MAVEN = "https://repo1.maven.org/maven2/io/zonky/test/postgres"


def download(url: str, sha256: str) -> bytes:
    with urllib.request.urlopen(url, timeout=600) as response:
        data = response.read()
    actual = hashlib.sha256(data).hexdigest()
    if actual != sha256:
        raise SystemExit(f"{url}: SHA-256 mismatch ({actual})")
    return data


def fetch_uv(system: str, target: Path) -> None:
    with urllib.request.urlopen(f"https://pypi.org/pypi/uv/{UV_VERSION}/json", timeout=60) as response:
        files = json.load(response)["urls"]
    for tag, folder in UV_PLATFORMS[system].items():
        matches = [f for f in files if tag in f["filename"]]
        if len(matches) != 1:
            raise SystemExit(f"uv {UV_VERSION} {tag}: PyPI does not list exactly one file")
        data = download(matches[0]["url"], UV_WHEELS[tag])
        name = "uv.exe" if tag.startswith("win") else "uv"
        out = target / "uv" / folder / name
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(zipfile.ZipFile(io.BytesIO(data)).read(f"uv-{UV_VERSION}.data/scripts/{name}"))
        os.chmod(out, 0o755)
        print(f"{out}  sha256 {hashlib.sha256(out.read_bytes()).hexdigest()}")


def fetch_pg(system: str, target: Path) -> None:
    artifact, sha = PG_JARS[system]
    name = f"embedded-postgres-binaries-{artifact}"
    data = download(f"{MAVEN}/{name}/{PG_VERSION}/{name}-{PG_VERSION}.jar", sha)
    jar = zipfile.ZipFile(io.BytesIO(data))
    (txz,) = [n for n in jar.namelist() if n.endswith(".txz")]
    out = target / "pg" / system
    out.mkdir(parents=True, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(lzma.decompress(jar.read(txz))), mode="r:") as tar:
        tar.extractall(out, filter="tar")
    print(f"{out}: PostgreSQL {PG_VERSION} ({artifact}, jar sha256 {sha})")


def main() -> None:
    system, folder = sys.argv[1], Path(sys.argv[2])
    fetch_uv(system, folder)
    fetch_pg(system, folder)


if __name__ == "__main__":
    main()
