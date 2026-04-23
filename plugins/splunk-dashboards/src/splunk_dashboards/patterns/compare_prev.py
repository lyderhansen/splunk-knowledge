"""compare-prev pattern — dashed previous-period overlay on line/area charts.

Rewrites data source SPL to append `| timewrap 1d` (a reasonable default),
then configures the viz to render the previous period in grey + dashed.
"""
from __future__ import annotations

import re

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


TIMESERIES_RE = re.compile(r"\|\s*timechart\b", re.I)
TIMEWRAP_RE = re.compile(r"\|\s*timewrap\b", re.I)


def _spl_for_viz(viz: dict, dashboard: dict) -> str:
    ds_key = (viz.get("dataSources") or {}).get("primary")
    if not ds_key:
        return ""
    return ((dashboard["dataSources"].get(ds_key, {}).get("options") or {}).get("query") or "")


def _ds_key_for_viz(viz: dict) -> str | None:
    return (viz.get("dataSources") or {}).get("primary")


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    for viz_id, viz in dashboard.get("visualizations", {}).items():
        if viz.get("type") not in ("splunk.line", "splunk.area"):
            continue
        ds_key = _ds_key_for_viz(viz)
        if not ds_key:
            continue
        spl = _spl_for_viz(viz, dashboard)
        if not TIMESERIES_RE.search(spl):
            continue
        if TIMEWRAP_RE.search(spl):
            # Already wrapped — skip to keep idempotent
            pass
        else:
            new_spl = spl.rstrip() + " | timewrap 1d"
            dashboard["dataSources"][ds_key]["options"]["query"] = new_spl

        options = viz.setdefault("options", {})
        # After timewrap, field names follow the pattern: count_latest_day, count_1day_before
        options.setdefault("seriesColorsByField", {
            "count_latest_day": theme.accent,
            "count_1day_before": theme.text_secondary,
        })
        options.setdefault("lineDashStylesByField", {
            "count_1day_before": "dashed",
        })


register_pattern(Pattern(name="compare-prev", apply=apply))
