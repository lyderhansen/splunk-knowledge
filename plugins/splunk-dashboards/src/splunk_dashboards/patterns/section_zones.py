"""section-zones pattern — group panels into labeled zones via markdown + rectangle."""
from __future__ import annotations

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


def _groups_by_section(dashboard: dict) -> dict:
    groups: dict = {}
    for viz_id, viz in dashboard["visualizations"].items():
        section = viz.get("section")
        if not section:
            continue
        groups.setdefault(section, []).append(viz_id)
    return groups


def _bounding_box_for(viz_ids: list, dashboard: dict) -> dict:
    entries = [e for e in dashboard["layout"]["structure"] if e.get("item") in viz_ids]
    if not entries:
        return None
    xs = [e["position"]["x"] for e in entries]
    ys = [e["position"]["y"] for e in entries]
    rights = [e["position"]["x"] + e["position"]["w"] for e in entries]
    bottoms = [e["position"]["y"] + e["position"]["h"] for e in entries]
    return {
        "x": min(xs) - 12,
        "y": min(ys) - 40,  # room for header
        "w": max(rights) - min(xs) + 24,
        "h": max(bottoms) - min(ys) + 52,
    }


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    if dashboard["layout"].get("type") != "absolute":
        return
    groups = _groups_by_section(dashboard)
    if not groups:
        return

    for section, viz_ids in groups.items():
        bbox = _bounding_box_for(viz_ids, dashboard)
        if bbox is None:
            continue
        slug = section.lower().replace(" ", "_")
        rect_id = f"viz_zone_rect_{slug}"
        md_id = f"viz_zone_header_{slug}"

        dashboard["visualizations"][rect_id] = {
            "type": "splunk.rectangle",
            "title": "",
            "dataSources": {},
            "options": {
                "fillColor": theme.panel,
                "fillOpacity": 0.04,
                "strokeColor": theme.panel_stroke,
                "strokeOpacity": 0.6,
                "strokeWidth": 1,
                "rx": tokens.R_SUBTLE,
                "ry": tokens.R_SUBTLE,
            },
        }
        dashboard["visualizations"][md_id] = {
            "type": "splunk.markdown",
            "title": "",
            "dataSources": {},
            "options": {
                "markdown": f"### {section}",
                "fontColor": theme.text_secondary,
                "backgroundColor": "transparent",
            },
        }

        structure = dashboard["layout"]["structure"]
        # Rectangle FIRST (renders behind), then header on top of it, then panels
        structure.insert(0, {"item": rect_id, "type": "block", "position": bbox})
        structure.insert(1, {
            "item": md_id, "type": "block",
            "position": {"x": bbox["x"] + 12, "y": bbox["y"] + 8, "w": 300, "h": 28},
        })


register_pattern(Pattern(name="section-zones", apply=apply))
