"""Tests for markergauge-strip pattern — horizontal gauge strip beneath KPIs.

Opt-in per viz via a top-level `gaugeRanges` hint on the singlevalue/
singlevalueicon. The pattern reads the hint, generates a companion
splunk.markergauge below the panel, and shrinks the singlevalue's
allocated height to make room.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard_with_hint(
    hint=None,
    viz_type="splunk.singlevalueicon",
    major_value="> primary | seriesByName('uptime') | lastPoint()",
    position=(100, 100, 400, 180),
):
    viz = {
        "type": viz_type,
        "title": "UPTIME",
        "dataSources": {"primary": "ds_1"},
        "options": {"majorValue": major_value} if major_value else {},
    }
    if hint is not None:
        viz["gaugeRanges"] = hint
    x, y, w, h = position
    return {
        "title": "T",
        "dataSources": {"ds_1": {"type": "ds.search", "options": {"query": "| makeresults | eval uptime=99.9 | table uptime"}}},
        "visualizations": {"viz_p1": viz},
        "layout": {
            "type": "absolute",
            "options": {"width": 1440, "height": 400},
            "structure": [{"item": "viz_p1", "type": "block", "position": {"x": x, "y": y, "w": w, "h": h}}],
        },
    }


DEFAULT_HINT = [
    {"from": 0,  "to": 95,  "value": "#DC4E41"},
    {"from": 95, "to": 99,  "value": "#F8BE34"},
    {"from": 99, "to": 100, "value": "#53A051"},
]


def test_markergauge_adds_companion_viz_when_hint_present():
    from splunk_dashboards.patterns.markergauge_strip import apply
    d = _dashboard_with_hint(hint=DEFAULT_HINT)
    apply(d, get_theme("noc"), T)
    assert "viz_p1_gauge" in d["visualizations"]
    gauge = d["visualizations"]["viz_p1_gauge"]
    assert gauge["type"] == "splunk.markergauge"
    assert gauge["dataSources"]["primary"] == "ds_1"
    assert gauge["options"]["orientation"] == "horizontal"
    assert gauge["options"]["gaugeRanges"] == DEFAULT_HINT


def test_markergauge_binds_value_to_same_series():
    from splunk_dashboards.patterns.markergauge_strip import apply
    d = _dashboard_with_hint(hint=DEFAULT_HINT)
    apply(d, get_theme("noc"), T)
    # value binding reuses the series name from majorValue
    assert d["visualizations"]["viz_p1_gauge"]["options"]["value"] == (
        "> primary | seriesByName('uptime') | lastPoint()"
    )


def test_markergauge_shrinks_singlevalue_height_and_adds_strip_below():
    from splunk_dashboards.patterns.markergauge_strip import apply
    d = _dashboard_with_hint(hint=DEFAULT_HINT, position=(100, 100, 400, 180))
    apply(d, get_theme("noc"), T)

    structure = d["layout"]["structure"]
    sv_entry = next(e for e in structure if e["item"] == "viz_p1")
    gauge_entry = next(e for e in structure if e["item"] == "viz_p1_gauge")

    # singlevalue was shrunk by the strip height
    assert sv_entry["position"]["h"] == 180 - 28
    # gauge sits directly below, same x/w, height 28
    assert gauge_entry["position"]["x"] == 100
    assert gauge_entry["position"]["y"] == 100 + 180 - 28
    assert gauge_entry["position"]["w"] == 400
    assert gauge_entry["position"]["h"] == 28


def test_markergauge_removes_hint_from_original_viz():
    """gaugeRanges was a pattern hint, not a viz property — should not leak into output."""
    from splunk_dashboards.patterns.markergauge_strip import apply
    d = _dashboard_with_hint(hint=DEFAULT_HINT)
    apply(d, get_theme("noc"), T)
    assert "gaugeRanges" not in d["visualizations"]["viz_p1"]


def test_markergauge_skips_when_no_hint():
    from splunk_dashboards.patterns.markergauge_strip import apply
    d = _dashboard_with_hint(hint=None)
    apply(d, get_theme("noc"), T)
    assert "viz_p1_gauge" not in d["visualizations"]
    # layout structure unchanged
    assert len(d["layout"]["structure"]) == 1


def test_markergauge_skips_when_no_majorValue_binding():
    """Without a majorValue expression, we cannot determine the series name."""
    from splunk_dashboards.patterns.markergauge_strip import apply
    d = _dashboard_with_hint(hint=DEFAULT_HINT, major_value=None)
    apply(d, get_theme("noc"), T)
    assert "viz_p1_gauge" not in d["visualizations"]


def test_markergauge_no_op_on_non_singlevalue():
    from splunk_dashboards.patterns.markergauge_strip import apply
    d = _dashboard_with_hint(hint=DEFAULT_HINT, viz_type="splunk.line")
    apply(d, get_theme("noc"), T)
    assert "viz_p1_gauge" not in d["visualizations"]


def test_markergauge_skips_when_layout_not_absolute():
    """Grid layout doesn't support overlayed strips the same way — skip safely."""
    from splunk_dashboards.patterns.markergauge_strip import apply
    d = _dashboard_with_hint(hint=DEFAULT_HINT)
    d["layout"]["type"] = "grid"
    apply(d, get_theme("noc"), T)
    assert "viz_p1_gauge" not in d["visualizations"]


def test_markergauge_strip_registered():
    from splunk_dashboards.patterns import get_pattern
    p = get_pattern("markergauge-strip")
    assert p.name == "markergauge-strip"
    assert callable(p.apply)
