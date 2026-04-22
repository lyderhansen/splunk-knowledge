"""Dashboard Studio JSON builder for ds-create."""
from __future__ import annotations

from splunk_dashboards.data_sources import DataSources
from splunk_dashboards.layout import Layout

GRID_UNIT_W = 100  # pixels per grid column
GRID_UNIT_H = 80   # pixels per grid row


def build_dashboard(layout: Layout, data: DataSources, title: str, description: str) -> dict:
    """Build a Splunk Dashboard Studio JSON definition from a Layout + DataSources."""
    # Map DataSource index -> ds key. Also build question -> ds key lookup for panel binding.
    ds_map: dict = {}
    question_to_key: dict = {}
    for idx, source in enumerate(data.sources, start=1):
        key = f"ds_{idx}"
        ds_map[key] = {
            "type": "ds.search",
            "name": source.name or source.question,
            "options": {
                "query": source.spl,
                "queryParameters": {
                    "earliest": source.earliest,
                    "latest": source.latest,
                },
            },
        }
        question_to_key[source.question] = key

    visualizations: dict = {}
    structure: list = []
    for panel in layout.panels:
        viz_key = f"viz_{panel.id}"
        data_sources = {}
        if panel.data_source_ref and panel.data_source_ref in question_to_key:
            data_sources["primary"] = question_to_key[panel.data_source_ref]
        visualizations[viz_key] = {
            "type": panel.viz_type,
            "title": panel.title,
            "dataSources": data_sources,
            "options": {},
        }
        structure.append({
            "item": viz_key,
            "type": "block",
            "position": {
                "x": panel.x * GRID_UNIT_W,
                "y": panel.y * GRID_UNIT_H,
                "w": panel.w * GRID_UNIT_W,
                "h": panel.h * GRID_UNIT_H,
            },
        })

    return {
        "title": title,
        "description": description,
        "theme": layout.theme,
        "dataSources": ds_map,
        "visualizations": visualizations,
        "inputs": {},
        "defaults": {},
        "layout": {
            "type": "absolute",
            "options": {"width": 1440, "height": 960},
            "structure": structure,
        },
    }
