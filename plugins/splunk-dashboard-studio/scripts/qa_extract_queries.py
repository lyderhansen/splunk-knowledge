#!/usr/bin/env python3
"""Walk every viz test-dashboard, extract all `ds.search` SPL queries, and
emit a JSON document the QA orchestrator (the LLM driving the MCP) can
iterate over.

Output schema (`/tmp/qa_queries.json` by default):

    [
      {
        "viz":      "ds-viz-singlevalue",
        "theme":    "dark",
        "ds_id":    "ds_revenue_trend",
        "name":     "revenue trend - 24h sparkline",
        "earliest": "-24h@h",
        "latest":   "now",
        "spl":      "| makeresults count=24 ...",
        "expected_fields": ["_time", "revenue"]
      },
      ...
    ]

`expected_fields` is a best-effort guess — we look for a final `| table ...`
clause in the SPL and split on whitespace. The QA driver uses this to
verify the result row shape matches what the viz needs.

Pairs with audit_data_source_names.py and sanitize_data_source_names.py.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

VIZ_ROOT = Path("plugins/splunk-dashboards/skills/viz")

TABLE_FIELDS_RE = re.compile(r"\|\s*table\s+([^|]+?)(?:\s*\||\s*$)", re.IGNORECASE)


def expected_fields(spl: str) -> list[str]:
    """Best-effort extraction of the field list passed to the final `| table`
    clause. Returns [] if no `| table` is present."""
    matches = TABLE_FIELDS_RE.findall(spl)
    if not matches:
        return []
    last = matches[-1]
    fields: list[str] = []
    for tok in last.split():
        tok = tok.strip().rstrip(",")
        if not tok:
            continue
        fields.append(tok)
    return fields


def collect_queries(viz_root: Path) -> list[dict[str, Any]]:
    queries: list[dict[str, Any]] = []
    for viz_dir in sorted(viz_root.glob("ds-viz-*")):
        for theme, fname in [("dark", "dashboard.json"), ("light", "dashboard-light.json")]:
            path = viz_dir / "test-dashboard" / fname
            if not path.exists():
                continue
            data = json.loads(path.read_text())
            globals_qp = (
                data.get("defaults", {})
                .get("dataSources", {})
                .get("global", {})
                .get("options", {})
                .get("queryParameters", {})
            )
            default_earliest = globals_qp.get("earliest", "-24h")
            default_latest = globals_qp.get("latest", "now")

            sources = data.get("dataSources", {})
            for ds_id, src in sources.items():
                if not isinstance(src, dict):
                    continue
                if src.get("type") != "ds.search":
                    continue
                opts = src.get("options", {})
                spl = opts.get("query")
                if not spl:
                    continue
                qp = opts.get("queryParameters", {})
                queries.append({
                    "viz": viz_dir.name,
                    "theme": theme,
                    "ds_id": ds_id,
                    "name": src.get("name"),
                    "earliest": qp.get("earliest", default_earliest),
                    "latest": qp.get("latest", default_latest),
                    "spl": spl,
                    "expected_fields": expected_fields(spl),
                })
    return queries


def main(argv: list[str]) -> int:
    out_path = Path(argv[1]) if len(argv) > 1 else Path("/tmp/qa_queries.json")
    queries = collect_queries(VIZ_ROOT)
    out_path.write_text(json.dumps(queries, indent=2))
    print(f"Extracted {len(queries)} ds.search queries -> {out_path}", file=sys.stderr)

    # Quick stats
    by_viz: dict[str, int] = {}
    no_table: list[tuple[str, str, str]] = []
    for q in queries:
        by_viz[q["viz"]] = by_viz.get(q["viz"], 0) + 1
        if not q["expected_fields"]:
            no_table.append((q["viz"], q["theme"], q["ds_id"]))
    print(f"  per-viz query counts:", file=sys.stderr)
    for viz, n in sorted(by_viz.items()):
        print(f"    {viz}: {n}", file=sys.stderr)
    if no_table:
        print(f"  {len(no_table)} queries without a `| table` clause "
              f"(can't auto-verify field shape):", file=sys.stderr)
        for v, t, ds in no_table[:10]:
            print(f"    {v} [{t}] {ds}", file=sys.stderr)
        if len(no_table) > 10:
            print(f"    ... and {len(no_table) - 10} more", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
