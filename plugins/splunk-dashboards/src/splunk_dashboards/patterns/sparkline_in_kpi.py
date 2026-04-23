"""sparkline-in-kpi pattern — add sparkline-below to every time-series singlevalue."""
from __future__ import annotations

import re

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


TIMESERIES_PATTERNS = [
    re.compile(r"\|\s*timechart\b", re.I),
    re.compile(r"\|\s*bin\s+_time\b", re.I),
]


def _is_timeseries(spl: str) -> bool:
    return any(p.search(spl) for p in TIMESERIES_PATTERNS)


def _spl_for_viz(viz: dict, dashboard: dict) -> str:
    ds_key = (viz.get("dataSources") or {}).get("primary")
    if not ds_key:
        return ""
    return ((dashboard["dataSources"].get(ds_key, {}).get("options") or {}).get("query") or "")


def _alpha_hex(hex_color: str, alpha: float) -> str:
    """Convert #RRGGBB to rgba(r,g,b,alpha)."""
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r},{g},{b},{alpha})"


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    for viz_id, viz in dashboard.get("visualizations", {}).items():
        if viz.get("type") != "splunk.singlevalue":
            continue
        spl = _spl_for_viz(viz, dashboard)
        if not _is_timeseries(spl):
            continue
        options = viz.setdefault("options", {})
        # Don't overwrite if hero-kpi already set sparkline behavior
        if "sparklineDisplay" in options:
            continue
        options["sparklineDisplay"] = "below"
        options["showSparklineAreaGraph"] = True
        options["sparklineStrokeColor"] = theme.accent
        options["sparklineAreaColor"] = _alpha_hex(theme.accent, 0.15)


register_pattern(Pattern(name="sparkline-in-kpi", apply=apply))
