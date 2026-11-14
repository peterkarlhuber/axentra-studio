"""Run the QA checklist automatically against a running kit (Playwright, real Chromium).

Usage:
  python qa_checklist_auto.py <base URL> --kit <unpacked AxentraStudio-QA folder> [--sections A,B,...]
      [--out results.json] [--shots folder]

Each case of qakit/docs/checkliste.json that has an automated counterpart in qa_auto/cases_*.py runs in its own
browser context. The result file maps case ids to {result: pass|fail|not_automated, note, screenshot}. Exit code 1
when any case fails. The tester's own results (QA-Ergebnisse/ergebnisse.json) are never touched.
"""

from __future__ import annotations

import argparse
import importlib
import json
import pkgutil
import sys
import time
import traceback
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from qa_auto.harness import FAIL, NOT_AUTOMATED, Ctx, Outcome, chromium_path  # noqa: E402

CHECKLIST = HERE.parent / "docs" / "checkliste.json"


def load_cases() -> dict:
    import qa_auto

    cases: dict = {}
    for mod in pkgutil.iter_modules(qa_auto.__path__):
        if mod.name.startswith("cases_"):
            module = importlib.import_module(f"qa_auto.{mod.name}")
            overlap = set(cases) & set(module.CASES)
            if overlap:
                raise SystemExit(f"{mod.name}: duplicate case ids {sorted(overlap)}")
            cases.update(module.CASES)
    return cases


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("base")
    p.add_argument("--kit", required=True, type=Path)
    p.add_argument("--sections", default="")
    p.add_argument("--out", type=Path, default=Path("qa-auto-results.json"))
    p.add_argument("--shots", type=Path, default=Path("qa-auto-shots"))
    a = p.parse_args()
    wanted = {s.strip() for s in a.sections.split(",") if s.strip()}
    checklist = json.loads(CHECKLIST.read_text(encoding="utf-8"))
    cases = load_cases()
    results: dict = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=chromium_path())
        for section in checklist["sections"]:
            if wanted and section["id"] not in wanted:
                continue
            for case in section["cases"]:
                fn = cases.get(case["id"])
                ctx = Ctx(a.base.rstrip("/"), a.kit, a.shots, browser, case["id"])
                started = time.monotonic()
                if fn is None:
                    out = Outcome(NOT_AUTOMATED, "no automated check")
                else:
                    try:
                        out = fn(ctx)
                    except Exception as e:  # a crash in a case is a failed case, with the reason
                        out = Outcome(FAIL, f"{type(e).__name__}: {e}".strip()[:500])
                        traceback.print_exc()
                        page = ctx.last_page()
                        if page is not None and not out.screenshot:
                            try:
                                out.screenshot = ctx.shot(page, "absturz")
                            except Exception:
                                pass
                    finally:
                        ctx.close()
                results[case["id"]] = {
                    "result": out.result,
                    "note": out.note,
                    "screenshot": out.screenshot,
                    "seconds": round(time.monotonic() - started, 1),
                }
                print(f"{out.result.upper():14} {case['id']}  {case['title']}  {out.note}", flush=True)
        browser.close()
    a.out.write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
    counts = {r: sum(1 for v in results.values() if v["result"] == r) for r in ("pass", "fail", "not_automated")}
    print(f"\n{counts}")
    return 1 if counts["fail"] else 0


if __name__ == "__main__":
    sys.exit(main())
