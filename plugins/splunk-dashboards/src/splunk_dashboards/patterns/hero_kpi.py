"""hero-kpi pattern — promote one singlevalue to 2x size with sparkline + delta.

A panel marked `hero: true` in layout.json becomes the hero. If none is flagged,
the first splunk.singlevalue panel is promoted.
"""
from __future__ import annotations

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


def _find_hero_viz_id(dashboard: dict) -> str | None:
    # Explicit flag wins
    for viz_id, viz in dashboard["visualizations"].items():
        if viz.get("type") == "splunk.singlevalue" and viz.get("hero"):
            return viz_id
    # Fallback: first singlevalue in structure order
    for entry in dashboard["layout"].get("structure", []):
        viz_id = entry.get("item")
        if dashboard["visualizations"].get(viz_id, {}).get("type") == "splunk.singlevalue":
            return viz_id
    return None


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    hero_id = _find_hero_viz_id(dashboard)
    if not hero_id:
        return
    # Promote the viz
    viz = dashboard["visualizations"][hero_id]
    options = viz.setdefault("options", {})
    options["majorValueSize"] = tokens.FS_KPI_MAJOR + 16  # 64 — between major and hero
    options["sparklineDisplay"] = "below"
    options["showSparklineAreaGraph"] = True
    options["trendDisplay"] = "percent"
    options.setdefault("sparklineStrokeColor", theme.accent)

    # Expand its layout position
    for entry in dashboard["layout"].get("structure", []):
        if entry.get("item") == hero_id:
            entry["position"]["w"] = 800   # ~2.5x standard 320
            entry["position"]["h"] = 210   # ~1.5x standard 140
            break


register_pattern(Pattern(name="hero-kpi", apply=apply))
