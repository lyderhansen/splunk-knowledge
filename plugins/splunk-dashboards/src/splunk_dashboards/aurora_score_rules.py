"""Aurora polish scorecard rules — self-registering.

Imports aurora_score's registry and adds one ScoringRule per dimension.
Rule 1–5 land in this task (T13-2). 6–10 follow in T13-3/T13-4.
"""
from __future__ import annotations

import re

from splunk_dashboards.aurora_score import (
    Finding, ScoringRule, register_rule,
)


SINGLEVALUE_TYPES = {
    "splunk.singlevalue", "splunk.singlevalueicon", "splunk.singlevalueradial",
    "splunk.markergauge", "splunk.fillergauge",
}
TIMESERIES_RE = re.compile(r"\|\s*timechart\b|\|\s*bin\s+_time\b", re.I)
TIMEWRAP_RE = re.compile(r"\|\s*timewrap\b", re.I)


def _spl_for_viz(viz: dict, dashboard: dict) -> str:
    ds_key = (viz.get("dataSources") or {}).get("primary")
    if not ds_key:
        return ""
    return ((dashboard["dataSources"].get(ds_key, {}).get("options") or {}).get("query") or "")


# ----- Rule 1: theme-applied (weight 0.8) -----

def _check_theme_applied(dashboard: dict) -> Finding:
    bg = (((dashboard.get("defaults") or {}).get("visualizations") or {})
          .get("global", {}).get("options", {}).get("backgroundColor"))
    if bg:
        return Finding(rule="theme-applied", level="pass",
                        message=f"Canvas backgroundColor set to {bg}")
    return Finding(rule="theme-applied", level="fail",
                    message="No Aurora theme applied — dashboard uses Splunk default styling",
                    suggestion="Rebuild with: ds-create build <ws> --theme pro")

register_rule(ScoringRule("theme-applied", 0.8, _check_theme_applied))


# ----- Rule 2: card-kpi (weight 1.0) -----

def _check_card_kpi(dashboard: dict) -> Finding:
    vizs = dashboard["visualizations"]
    rects = [vid for vid, v in vizs.items() if v.get("type") == "splunk.rectangle"]
    kpis = [vid for vid, v in vizs.items() if v.get("type") in SINGLEVALUE_TYPES]
    if not kpis:
        return Finding(rule="card-kpi", level="pass",
                        message="No KPIs present — rule N/A (no penalty)")
    if not rects:
        return Finding(rule="card-kpi", level="fail",
                        message="KPI row has no rectangle card behind it",
                        suggestion="Add: --pattern card-kpi")
    # Check structure order: at least one rect before at least one kpi
    structure = dashboard["layout"].get("structure", [])
    rect_indices = [i for i, e in enumerate(structure) if e.get("item") in rects]
    kpi_indices = [i for i, e in enumerate(structure) if e.get("item") in kpis]
    if rect_indices and kpi_indices and min(rect_indices) < max(kpi_indices):
        return Finding(rule="card-kpi", level="pass",
                        message="KPI row wrapped in rectangle card")
    return Finding(rule="card-kpi", level="partial",
                    message="Rectangle present but not layered behind KPIs")

register_rule(ScoringRule("card-kpi", 1.0, _check_card_kpi))


# ----- Rule 3: hero-kpi (weight 1.2) -----

def _check_hero_kpi(dashboard: dict) -> Finding:
    structure = dashboard["layout"].get("structure", [])
    kpi_entries = [e for e in structure
                    if dashboard["visualizations"].get(e.get("item"), {}).get("type") == "splunk.singlevalue"]
    if len(kpi_entries) < 2:
        # Only zero or one KPI — rule N/A, no penalty (treat as pass)
        return Finding(rule="hero-kpi", level="pass",
                        message="Too few KPIs for hero pattern (N/A)")
    widths = [e["position"]["w"] for e in kpi_entries]
    max_w, median_w = max(widths), sorted(widths)[len(widths)//2]
    if max_w >= median_w * 2:
        # One KPI clearly promoted
        hero = next(e for e in kpi_entries if e["position"]["w"] == max_w)
        viz = dashboard["visualizations"][hero["item"]]
        if viz.get("options", {}).get("majorValueSize", 0) >= 48:
            return Finding(rule="hero-kpi", level="pass",
                            message="Hero KPI identified and sized correctly")
        return Finding(rule="hero-kpi", level="partial",
                        message="Hero KPI has width but not oversized font (majorValueSize < 48)")
    return Finding(rule="hero-kpi", level="partial",
                    message="No hero KPI identified",
                    suggestion="Consider: --pattern hero-kpi (flag one panel with hero: true)")

register_rule(ScoringRule("hero-kpi", 1.2, _check_hero_kpi))


# ----- Rule 4: sparkline-in-kpi (weight 1.0) -----

def _check_sparkline(dashboard: dict) -> Finding:
    ts_kpis = []
    for vid, viz in dashboard["visualizations"].items():
        if viz.get("type") != "splunk.singlevalue":
            continue
        spl = _spl_for_viz(viz, dashboard)
        if TIMESERIES_RE.search(spl):
            ts_kpis.append(viz)
    if not ts_kpis:
        return Finding(rule="sparkline-in-kpi", level="pass",
                        message="No time-series KPIs (N/A)")
    with_spark = [v for v in ts_kpis if v.get("options", {}).get("sparklineDisplay")]
    if len(with_spark) == len(ts_kpis):
        return Finding(rule="sparkline-in-kpi", level="pass",
                        message=f"All {len(ts_kpis)} time-series KPIs have sparklines")
    if len(with_spark) >= len(ts_kpis) * 0.5:
        return Finding(rule="sparkline-in-kpi", level="partial",
                        message=f"{len(with_spark)} of {len(ts_kpis)} time-series KPIs have sparklines",
                        suggestion="Add: --pattern sparkline-in-kpi")
    return Finding(rule="sparkline-in-kpi", level="fail",
                    message=f"Only {len(with_spark)} of {len(ts_kpis)} KPIs have sparklines",
                    suggestion="Add: --pattern sparkline-in-kpi")

register_rule(ScoringRule("sparkline-in-kpi", 1.0, _check_sparkline))


# ----- Rule 5: compare-prev (weight 1.2) -----

def _check_compare_prev(dashboard: dict) -> Finding:
    line_vizs = [v for v in dashboard["visualizations"].values()
                 if v.get("type") in ("splunk.line", "splunk.area")]
    if not line_vizs:
        return Finding(rule="compare-prev", level="pass",
                        message="No line/area charts (N/A)")
    with_timewrap = 0
    for viz in line_vizs:
        if TIMEWRAP_RE.search(_spl_for_viz(viz, dashboard)):
            with_timewrap += 1
    if with_timewrap >= 1:
        return Finding(rule="compare-prev", level="pass",
                        message=f"{with_timewrap} line/area chart(s) have compare-to-previous")
    return Finding(rule="compare-prev", level="fail",
                    message="No compare-to-previous-period on any time chart",
                    suggestion="Add: --pattern compare-prev")

register_rule(ScoringRule("compare-prev", 1.2, _check_compare_prev))
