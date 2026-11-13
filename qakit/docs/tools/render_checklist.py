#!/usr/bin/env python3
"""Renders checkliste.json to QA-Checkliste.md and QA-Ergebnisse.csv (stdlib only).

Usage: python3 render_checklist.py [checkliste.json] [output directory]
Defaults: the docs folder that contains this tools/ folder.
"""

import csv
import json
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent
RESULT_LINE = "Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar"
CSV_HEADER = ["ID", "Bereich", "Titel", "Ergebnis", "Notiz", "Screenshot-Datei"]


def load(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("version") != 1:
        raise SystemExit(f"{path}: unbekannte Version {data.get('version')!r}")
    seen = set()
    for section in data["sections"]:
        for case in section["cases"]:
            for key in ("id", "title", "user", "steps", "expected", "failure", "area"):
                if key not in case:
                    raise SystemExit(f"{case.get('id', '?')}: Feld {key!r} fehlt")
            if case["id"] in seen:
                raise SystemExit(f"doppelte ID {case['id']}")
            seen.add(case["id"])
    return data


def render_md(data: dict) -> str:
    sections = data["sections"]
    total = sum(len(s["cases"]) for s in sections)
    out = [f"# {data.get('title', 'QA-Checkliste')}", ""]
    if data.get("note"):
        out += [data["note"], ""]
    out += [
        f"{total} Testfälle. Jeder dauert etwa 1 bis 3 Minuten.",
        "Empfohlen ist die Checkliste auf http://127.0.0.1:8765/qa/ (Tab „QA-Checkliste“).",
        "Diese Datei ist zum Lesen oder Ausdrucken.",
        "",
        "Name: ______________________   Datum: ____________   Computer/Browser: ______________________",
        "",
        "## Inhalt",
        "",
    ]
    for s in sections:
        out.append(f"- {s['id']} {s['title']} ({len(s['cases'])})")
    out.append("")
    for s in sections:
        out += [f"## {s['id']} {s['title']}", ""]
        if s.get("intro"):
            out += [f"*{s['intro']}*", ""]
        for c in s["cases"]:
            out += [
                f"### {c['id']} {c['title']}",
                "",
                f"**Benutzer:** {c['user']}  ",
                f"**Bereich:** {c['area']}",
                "",
                "**Schritte:**",
                "",
            ]
            out += [f"{i}. {step}" for i, step in enumerate(c["steps"], 1)]
            out += [
                "",
                f"**Was sollte passieren:** {c['expected']}",
                "",
                f"**Woran erkenne ich einen Fehler:** {c['failure']}",
                "",
                RESULT_LINE,
                "",
                "Notiz: ______________________________________________________________",
                "",
                "Screenshot-Datei: ______________________",
                "",
            ]
    return "\n".join(out)


def write_csv(data: dict, path: Path) -> None:
    # UTF-8 with BOM and semicolons so that Excel opens it correctly on German systems.
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";", quoting=csv.QUOTE_MINIMAL, lineterminator="\r\n")
        w.writerow(CSV_HEADER)
        for s in data["sections"]:
            for c in s["cases"]:
                w.writerow([c["id"], c["area"], c["title"], "", "", ""])


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DOCS / "checkliste.json"
    dest = Path(sys.argv[2]) if len(sys.argv) > 2 else src.parent
    data = load(src)
    (dest / "QA-Checkliste.md").write_text(render_md(data), encoding="utf-8")
    write_csv(data, dest / "QA-Ergebnisse.csv")
    n = sum(len(s["cases"]) for s in data["sections"])
    print(f"{n} Testfälle -> {dest / 'QA-Checkliste.md'}, {dest / 'QA-Ergebnisse.csv'}")


if __name__ == "__main__":
    main()
