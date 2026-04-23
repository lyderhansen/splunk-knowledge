"""annotations pattern — event markers on line/area/column charts.

Creates a secondary ds.search (placeholder, using inputlookup annotations.csv)
and binds it to each eligible viz via annotationX/Label/Color options.
Users replace the placeholder SPL with their real annotation source.
"""
from __future__ import annotations

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


ANNOTATION_TYPES = {"splunk.line", "splunk.area", "splunk.column"}


def _annotation_ds_key_for(viz_id: str) -> str:
    return f"ds_annotations_{viz_id}"


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    for viz_id, viz in dashboard.get("visualizations", {}).items():
        if viz.get("type") not in ANNOTATION_TYPES:
            continue
        ds_key = _annotation_ds_key_for(viz_id)
        if ds_key not in dashboard["dataSources"]:
            dashboard["dataSources"][ds_key] = {
                "type": "ds.search",
                "name": f"annotations for {viz_id}",
                "options": {
                    "query": "| inputlookup annotations.csv | eval _time = strptime(timestamp, \"%Y-%m-%dT%H:%M:%S\")",
                },
            }
        options = viz.setdefault("options", {})
        options["annotationX"] = f"> {ds_key} | seriesByName('_time')"
        options["annotationLabel"] = f"> {ds_key} | seriesByName('label')"
        options["annotationColor"] = f"> {ds_key} | seriesByName('color')"


register_pattern(Pattern(name="annotations", apply=apply))
