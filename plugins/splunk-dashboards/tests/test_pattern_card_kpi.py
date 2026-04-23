"""Tests for card-kpi pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard_with_kpi_row():
    return {
        "title": "T", "dataSources": {},
        "visualizations": {
            "viz_p1": {"type": "splunk.singlevalue", "title": "Events", "dataSources": {}, "options": {}},
            "viz_p2": {"type": "splunk.singlevalue", "title": "Uptime", "dataSources": {}, "options": {}},
            "viz_p3": {"type": "splunk.singlevalue", "title": "p95",    "dataSources": {}, "options": {}},
            "viz_p4": {"type": "splunk.singlevalue", "title": "Alerts", "dataSources": {}, "options": {}},
        },
        "layout": {
            "type": "absolute", "options": {"width": 1440},
            "structure": [
                {"item": "viz_p1", "type": "block", "position": {"x": 20,  "y": 20, "w": 320, "h": 140}},
                {"item": "viz_p2", "type": "block", "position": {"x": 360, "y": 20, "w": 320, "h": 140}},
                {"item": "viz_p3", "type": "block", "position": {"x": 700, "y": 20, "w": 320, "h": 140}},
                {"item": "viz_p4", "type": "block", "position": {"x": 1040,"y": 20, "w": 320, "h": 140}},
            ],
        },
    }


def test_card_kpi_inserts_rectangle_before_kpi_panels():
    from splunk_dashboards.patterns.card_kpi import apply
    d = _dashboard_with_kpi_row()
    theme = get_theme("pro")
    apply(d, theme, T)
    # A splunk.rectangle viz is added
    rects = [v for v in d["visualizations"].values() if v["type"] == "splunk.rectangle"]
    assert len(rects) == 1
    r = rects[0]
    assert r["options"]["fillColor"] == "#15161a"
    assert r["options"]["strokeColor"] == "#2C2C3A"
    assert r["options"]["rx"] == 8
    assert r["options"]["ry"] == 8


def test_card_kpi_rectangle_rendered_before_kpi_panels():
    """Rectangle must appear earlier in layout.structure (renders behind)."""
    from splunk_dashboards.patterns.card_kpi import apply
    d = _dashboard_with_kpi_row()
    apply(d, get_theme("pro"), T)
    structure = d["layout"]["structure"]
    # Find rectangle entry index
    rect_idx = next(i for i, e in enumerate(structure) if e["item"].startswith("viz_card_"))
    # All KPI entries must have higher index (render later = on top)
    kpi_indices = [i for i, e in enumerate(structure) if e["item"] in ("viz_p1", "viz_p2", "viz_p3", "viz_p4")]
    assert all(i > rect_idx for i in kpi_indices)


def test_card_kpi_rectangle_wraps_kpi_bounding_box():
    """Rectangle position covers the KPI row with 10px inset."""
    from splunk_dashboards.patterns.card_kpi import apply
    d = _dashboard_with_kpi_row()
    apply(d, get_theme("pro"), T)
    structure = d["layout"]["structure"]
    rect = next(e for e in structure if e["item"].startswith("viz_card_"))
    pos = rect["position"]
    # KPIs span x=20 to x=1360 (1040+320), y=20 to y=160 (20+140)
    # Rectangle should extend 10px outside on each side
    assert pos["x"] == 10
    assert pos["y"] == 10
    assert pos["w"] == 1360
    assert pos["h"] == 160


def test_card_kpi_no_op_on_grid_layout():
    """Pattern skips silently when layout.type != 'absolute'."""
    from splunk_dashboards.patterns.card_kpi import apply
    d = _dashboard_with_kpi_row()
    d["layout"]["type"] = "grid"
    rect_count_before = sum(1 for v in d["visualizations"].values() if v["type"] == "splunk.rectangle")
    apply(d, get_theme("pro"), T)
    rect_count_after = sum(1 for v in d["visualizations"].values() if v["type"] == "splunk.rectangle")
    assert rect_count_before == rect_count_after  # no rectangle added


def test_card_kpi_no_op_when_no_kpi_panels():
    """If there are no singlevalue panels, pattern does nothing."""
    from splunk_dashboards.patterns.card_kpi import apply
    d = {"title": "T", "dataSources": {}, "visualizations": {},
         "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []}}
    apply(d, get_theme("pro"), T)
    assert d["visualizations"] == {}
