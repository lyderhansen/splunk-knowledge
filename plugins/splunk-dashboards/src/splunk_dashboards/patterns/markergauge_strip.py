"""markergauge-strip pattern — horizontal gauge below opt-in KPIs.

Adds a companion splunk.markergauge visualization directly underneath a
singlevalue / singlevalueicon when the author has opted in by setting a
``gaugeRanges`` hint on the viz. The pattern shrinks the singlevalue's
allocated height to make room for the strip (default 28 px).

Opt-in shape on the source viz:

    "viz_uptime": {
      "type": "splunk.singlevalueicon",
      "options": {"majorValue": "> primary | seriesByName('uptime') | lastPoint()"},
      "gaugeRanges": [
        {"from": 0,  "to": 95,  "value": "#DC4E41"},
        {"from": 95, "to": 99,  "value": "#F8BE34"},
        {"from": 99, "to": 100, "value": "#53A051"}
      ]
    }

Pattern behaviour:
- Only fires on absolute layouts (grid layouts do not support the
  overlay convention this uses).
- Requires a ``majorValue`` DOS binding to extract the series name.
- Removes the ``gaugeRanges`` hint from the source viz after use — the
  hint is pattern config, not a viz property Splunk understands.
"""
from __future__ import annotations

import re

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


TARGET_TYPES = {"splunk.singlevalue", "splunk.singlevalueicon"}
# splunk.markergauge refuses to render below ~100 px and shows a
# "Too small to render content" placeholder instead. Keep this >= 100.
STRIP_HEIGHT = 100

SERIES_NAME_RE = re.compile(r"seriesByName\(\s*['\"]([^'\"]+)['\"]\s*\)")


def _series_from_major_value(major_value) -> str | None:
    if not isinstance(major_value, str):
        return None
    m = SERIES_NAME_RE.search(major_value)
    return m.group(1) if m else None


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    if dashboard.get("layout", {}).get("type") != "absolute":
        return

    structure = dashboard["layout"]["structure"]
    # Snapshot the viz IDs up front so we don't iterate over newly-added gauges.
    for viz_id in list(dashboard.get("visualizations", {}).keys()):
        viz = dashboard["visualizations"][viz_id]
        if viz.get("type") not in TARGET_TYPES:
            continue
        hint = viz.get("gaugeRanges")
        if not hint:
            continue

        series = _series_from_major_value(viz.get("options", {}).get("majorValue"))
        if series is None:
            continue

        sv_entry = next((e for e in structure if e.get("item") == viz_id), None)
        if sv_entry is None:
            continue

        gauge_id = f"{viz_id}_gauge"
        dashboard["visualizations"][gauge_id] = {
            "type": "splunk.markergauge",
            "title": "",
            "dataSources": {"primary": viz["dataSources"]["primary"]},
            "options": {
                "value": f"> primary | seriesByName('{series}') | lastPoint()",
                "gaugeRanges": list(hint),
                "orientation": "horizontal",
                "labelDisplay": "off",
                "valueDisplay": "off",
            },
        }

        pos = sv_entry["position"]
        new_sv_height = pos["h"] - STRIP_HEIGHT
        gauge_pos = {
            "x": pos["x"],
            "y": pos["y"] + new_sv_height,
            "w": pos["w"],
            "h": STRIP_HEIGHT,
        }
        pos["h"] = new_sv_height
        structure.append({"item": gauge_id, "type": "block", "position": gauge_pos})

        # Hint was pattern config, strip it from the viz.
        del viz["gaugeRanges"]


register_pattern(Pattern(name="markergauge-strip", apply=apply))
