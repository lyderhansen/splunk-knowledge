"""Aurora theme engine — applies a Theme to a dashboard JSON dict.

Responsibilities:
1. Emit definition.defaults (canvas + series palette) — global, not per-viz.
2. Per-viz semantic coloring on singlevalues where SPL/title matches tags.
3. Insert a markdown header panel for themes that request one.

Patterns (card-kpi, hero-kpi, etc.) are NOT applied here — see aurora.py
(sub-plan 11) for pattern orchestration.
"""
from __future__ import annotations

import re

from splunk_dashboards.themes import Theme, get_theme


SINGLEVALUE_TYPES = {
    "splunk.singlevalue", "splunk.singlevalueicon", "splunk.singlevalueradial",
    "splunk.markergauge", "splunk.fillergauge",
}
CHART_TYPES = {
    "splunk.line", "splunk.area", "splunk.bar", "splunk.column", "splunk.pie",
    "splunk.bubble", "splunk.scatter", "splunk.punchcard",
}


# ----- Semantic detection (moved from old theme.py) -----

FAILURE_PATTERNS = [
    re.compile(r"\baction\s*=\s*failure\b", re.I),
    re.compile(r"\baction\s*=\s*fail\b", re.I),
    re.compile(r"\bstatus\s*>=\s*[45]\d\d\b"),
    re.compile(r"\berror\b", re.I),
    re.compile(r"\bfailed\b", re.I),
    re.compile(r"\bfailure\b", re.I),
    re.compile(r"\battack\b", re.I),
]
SUCCESS_PATTERNS = [
    re.compile(r"\baction\s*=\s*success\b", re.I),
    re.compile(r"\buptime\b", re.I),
    re.compile(r"\bhealthy\b", re.I),
    re.compile(r"\bsuccess\b", re.I),
]
LATENCY_PATTERNS = [
    re.compile(r"\blatency\b", re.I),
    re.compile(r"\bresponse_time\b", re.I),
    re.compile(r"\bduration\b", re.I),
    re.compile(r"\bp\d\d\b"),
]
COUNT_PATTERNS = [
    re.compile(r"\|\s*stats\s+count\b", re.I),
    re.compile(r"\bevent[s]?\b", re.I),
    re.compile(r"\btotal\b", re.I),
]
VOLUME_PATTERNS = [
    re.compile(r"\bbytes\b", re.I),
    re.compile(r"\btraffic\b", re.I),
    re.compile(r"\bthroughput\b", re.I),
]
CRITICAL_PATTERNS = [
    re.compile(r"\bcritical\b", re.I),
    re.compile(r"\balert\b", re.I),
    re.compile(r"\bincident\b", re.I),
]


def _match_any(patterns, text):
    return any(p.search(text) for p in patterns)


def detect_semantics(spl: str, title: str) -> list:
    combined = f"{spl or ''} {title or ''}"
    hints = []
    if _match_any(CRITICAL_PATTERNS, combined):
        hints.append("critical")
    if _match_any(FAILURE_PATTERNS, combined):
        hints.append("failure")
    if _match_any(SUCCESS_PATTERNS, combined):
        hints.append("success")
    if _match_any(LATENCY_PATTERNS, combined):
        hints.append("latency")
    if _match_any(VOLUME_PATTERNS, combined):
        hints.append("volume")
    if _match_any(COUNT_PATTERNS, combined):
        hints.append("count")
    return hints


def _spl_for_viz(viz_id: str, dashboard: dict) -> str:
    viz = dashboard["visualizations"].get(viz_id, {})
    ds_key = (viz.get("dataSources") or {}).get("primary")
    if not ds_key:
        return ""
    ds = dashboard["dataSources"].get(ds_key, {})
    return ((ds.get("options") or {}).get("query") or "")


def _style_singlevalue(viz: dict, semantics: list, theme: Theme) -> None:
    options = viz.setdefault("options", {})
    for tag in semantics:
        if tag in theme.semantic_colors:
            options["majorColor"] = theme.semantic_colors[tag]
            break


def _emit_definition_defaults(dashboard: dict, theme: Theme) -> None:
    """Write global canvas + default series palette to definition.defaults."""
    defaults = dashboard.setdefault("defaults", {})
    viz_defaults = defaults.setdefault("visualizations", {})
    global_opts = viz_defaults.setdefault("global", {}).setdefault("options", {})
    global_opts["backgroundColor"] = theme.canvas
    # Default series palette for every chart type.
    for chart_type in CHART_TYPES:
        type_defaults = viz_defaults.setdefault(chart_type, {}).setdefault("options", {})
        type_defaults.setdefault("seriesColors", list(theme.series_colors))


def apply_theme(dashboard: dict, theme_name: str) -> None:
    """Mutate `dashboard` in place — apply the named theme's styling.

    Writes definition.defaults for global canvas + series palette.
    Applies per-viz semantic coloring on singlevalues.
    """
    theme = get_theme(theme_name)
    _emit_definition_defaults(dashboard, theme)

    for viz_id, viz in list(dashboard.get("visualizations", {}).items()):
        vtype = viz.get("type", "")
        if vtype in SINGLEVALUE_TYPES:
            spl = _spl_for_viz(viz_id, dashboard)
            semantics = detect_semantics(spl, viz.get("title", ""))
            _style_singlevalue(viz, semantics, theme)
