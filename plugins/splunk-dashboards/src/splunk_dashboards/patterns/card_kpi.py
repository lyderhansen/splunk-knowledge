"""card-kpi pattern — insert a splunk.rectangle behind a KPI row for depth.

The rectangle uses theme.panel as fill, theme.panel_stroke as stroke, radius 8.
Layering is controlled via layout.structure array order (earlier = behind).
Skips when layout.type is not 'absolute'.
"""
from __future__ import annotations

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


SINGLEVALUE_TYPES = {
    "splunk.singlevalue", "splunk.singlevalueicon", "splunk.singlevalueradial",
    "splunk.markergauge", "splunk.fillergauge",
}


def _kpi_entries(dashboard: dict) -> list:
    kpis = []
    for entry in dashboard["layout"].get("structure", []):
        viz_id = entry.get("item")
        vtype = dashboard["visualizations"].get(viz_id, {}).get("type", "")
        if vtype in SINGLEVALUE_TYPES:
            kpis.append(entry)
    return kpis


def _bounding_box(entries: list, inset: int = -10) -> dict:
    """Axis-aligned bounding box with `inset` offset outward."""
    xs = [e["position"]["x"] for e in entries]
    ys = [e["position"]["y"] for e in entries]
    rights = [e["position"]["x"] + e["position"]["w"] for e in entries]
    bottoms = [e["position"]["y"] + e["position"]["h"] for e in entries]
    x = min(xs) + inset
    y = min(ys) + inset
    w = max(rights) - min(xs) - 2 * inset
    h = max(bottoms) - min(ys) - 2 * inset
    return {"x": x, "y": y, "w": w, "h": h}


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    # Skip unless absolute layout
    if dashboard["layout"].get("type") != "absolute":
        return
    kpis = _kpi_entries(dashboard)
    if not kpis:
        return
    # Only apply if KPIs are in roughly the same row (y within 40px of each other)
    ys = [k["position"]["y"] for k in kpis]
    if max(ys) - min(ys) > 40:
        return

    card_id = "viz_card_kpi_row"
    dashboard["visualizations"][card_id] = {
        "type": "splunk.rectangle",
        "title": "",
        "dataSources": {},
        "options": {
            "fillColor": theme.panel,
            "strokeColor": theme.panel_stroke,
            "fillOpacity": 1,
            "strokeOpacity": 1,
            "rx": tokens.R_CARD,
            "ry": tokens.R_CARD,
        },
    }
    bbox = _bounding_box(kpis, inset=-10)
    rect_entry = {"item": card_id, "type": "block", "position": bbox}

    # Insert rectangle entry BEFORE the first KPI entry in structure
    structure = dashboard["layout"]["structure"]
    first_kpi_idx = min(structure.index(k) for k in kpis)
    structure.insert(first_kpi_idx, rect_entry)


register_pattern(Pattern(name="card-kpi", apply=apply))
