"""trend-chip pattern — colored delta chip on time-series singlevalues.

Adds a trendValue DOS binding (delta between the last two series points),
a trendColor binding that maps the delta to red/green via rangeValue, and
the corresponding trendColorConfig in the viz context.

Polarity:
- Default (growth metrics): positive delta is green, negative is red.
- Failure/critical/latency metrics (per theme_engine.detect_semantics):
  positive delta is red, negative is green — because "more errors"
  or "higher latency" is bad.

Skipped when the viz is not a singlevalue/singlevalueicon, when the SPL
has no time series, when majorValue is absent (can't determine series
name), or when trendValue is already set (respect manual overrides).
"""
from __future__ import annotations

import re

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme
from splunk_dashboards.theme_engine import detect_semantics


TARGET_TYPES = {"splunk.singlevalue", "splunk.singlevalueicon"}

TIMESERIES_PATTERNS = [
    re.compile(r"\|\s*timechart\b", re.I),
    re.compile(r"\|\s*bin\s+_time\b", re.I),
]

# seriesByName('<name>') or seriesByName("<name>") — captures the series id
SERIES_NAME_RE = re.compile(r"seriesByName\(\s*['\"]([^'\"]+)['\"]\s*\)")

# Metrics where "up" is bad (more errors, higher latency, more incidents)
UP_IS_BAD_SEMANTICS = {"critical", "failure", "latency"}

# Color constants — hex values from tokens (STATUS_OK / STATUS_CRITICAL).
# Hardcoded here rather than reading from tokens because trend chips use
# the same polarity semantics across every theme.
TREND_POSITIVE_COLOR = "#53A051"  # green
TREND_NEGATIVE_COLOR = "#DC4E41"  # red


def _is_timeseries(spl: str) -> bool:
    return any(p.search(spl) for p in TIMESERIES_PATTERNS)


def _spl_for_viz(viz: dict, dashboard: dict) -> str:
    ds_key = (viz.get("dataSources") or {}).get("primary")
    if not ds_key:
        return ""
    return ((dashboard["dataSources"].get(ds_key, {}).get("options") or {}).get("query") or "")


def _series_from_major_value(major_value) -> str | None:
    if not isinstance(major_value, str):
        return None
    m = SERIES_NAME_RE.search(major_value)
    return m.group(1) if m else None


def _trend_color_config(up_is_bad: bool) -> list:
    """rangeValue config mapping delta sign to color."""
    if up_is_bad:
        return [
            {"value": TREND_POSITIVE_COLOR, "to": 0},     # negative = improvement = green
            {"value": TREND_NEGATIVE_COLOR, "from": 0},   # positive = regression = red
        ]
    return [
        {"value": TREND_NEGATIVE_COLOR, "to": 0},         # negative = decline = red
        {"value": TREND_POSITIVE_COLOR, "from": 0},       # positive = growth = green
    ]


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    for viz_id, viz in dashboard.get("visualizations", {}).items():
        if viz.get("type") not in TARGET_TYPES:
            continue
        options = viz.setdefault("options", {})
        if "trendValue" in options:
            continue  # respect explicit override

        series = _series_from_major_value(options.get("majorValue"))
        if series is None:
            continue  # cannot determine which column to trend

        spl = _spl_for_viz(viz, dashboard)
        if not _is_timeseries(spl):
            continue

        semantics = detect_semantics(spl, viz.get("title", ""))
        up_is_bad = any(s in UP_IS_BAD_SEMANTICS for s in semantics)

        options["trendValue"] = f"> primary | seriesByName('{series}') | delta(-2)"
        options["trendDisplay"] = "percent"
        options["trendColor"] = "> trendValue | rangeValue(trendColorConfig)"

        context = viz.setdefault("context", {})
        context["trendColorConfig"] = _trend_color_config(up_is_bad)


register_pattern(Pattern(name="trend-chip", apply=apply))
