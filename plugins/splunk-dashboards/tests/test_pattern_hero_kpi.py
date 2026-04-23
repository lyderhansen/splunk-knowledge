"""Tests for hero-kpi pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard_with_kpis(hero_flag_on="viz_p1"):
    vizs = {
        "viz_p1": {"type": "splunk.singlevalue", "title": "Revenue", "dataSources": {}, "options": {},
                   "hero": hero_flag_on == "viz_p1"},
        "viz_p2": {"type": "splunk.singlevalue", "title": "Users",   "dataSources": {}, "options": {}},
        "viz_p3": {"type": "splunk.singlevalue", "title": "Churn",   "dataSources": {}, "options": {}},
    }
    return {
        "title": "T", "dataSources": {},
        "visualizations": vizs,
        "layout": {
            "type": "absolute", "options": {"width": 1440},
            "structure": [
                {"item": "viz_p1", "type": "block", "position": {"x": 20,  "y": 20, "w": 320, "h": 140}},
                {"item": "viz_p2", "type": "block", "position": {"x": 360, "y": 20, "w": 320, "h": 140}},
                {"item": "viz_p3", "type": "block", "position": {"x": 700, "y": 20, "w": 320, "h": 140}},
            ],
        },
    }


def test_hero_kpi_resizes_flagged_panel():
    from splunk_dashboards.patterns.hero_kpi import apply
    d = _dashboard_with_kpis()
    apply(d, get_theme("glass"), T)
    hero_entry = next(e for e in d["layout"]["structure"] if e["item"] == "viz_p1")
    # Hero panel grows to 2.5x width, 1.5x height
    assert hero_entry["position"]["w"] == 800
    assert hero_entry["position"]["h"] == 210


def test_hero_kpi_sets_oversized_font_and_sparkline():
    from splunk_dashboards.patterns.hero_kpi import apply
    d = _dashboard_with_kpis()
    apply(d, get_theme("glass"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert opts["majorValueSize"] == 64
    assert opts["sparklineDisplay"] == "below"
    assert opts["trendDisplay"] == "percent"
    assert opts["showSparklineAreaGraph"] is True


def test_hero_kpi_falls_back_to_first_singlevalue_when_no_flag():
    """When no panel has hero:true, promote the first singlevalue."""
    from splunk_dashboards.patterns.hero_kpi import apply
    d = _dashboard_with_kpis(hero_flag_on="")
    apply(d, get_theme("glass"), T)
    hero_entry = next(e for e in d["layout"]["structure"] if e["item"] == "viz_p1")
    assert hero_entry["position"]["w"] == 800


def test_hero_kpi_no_op_if_no_singlevalues():
    from splunk_dashboards.patterns.hero_kpi import apply
    d = {"title": "T", "dataSources": {}, "visualizations": {},
         "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []}}
    apply(d, get_theme("glass"), T)
    assert d["visualizations"] == {}
