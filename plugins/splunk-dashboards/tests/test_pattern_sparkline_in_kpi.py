"""Tests for sparkline-in-kpi pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard(spl="index=main | timechart count"):
    return {
        "title": "T",
        "dataSources": {
            "ds_1": {"type": "ds.search", "options": {"query": spl}},
        },
        "visualizations": {
            "viz_p1": {
                "type": "splunk.singlevalue", "title": "Events",
                "dataSources": {"primary": "ds_1"}, "options": {},
            },
        },
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []},
    }


def test_sparkline_applies_to_timeseries_singlevalue():
    from splunk_dashboards.patterns.sparkline_in_kpi import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert opts["sparklineDisplay"] == "below"
    assert opts["showSparklineAreaGraph"] is True
    assert opts["sparklineStrokeColor"] == "#006D9C"  # pro accent


def test_sparkline_skips_non_timeseries_singlevalue():
    """Skip singlevalues whose SPL has no | timechart or | bin _time."""
    from splunk_dashboards.patterns.sparkline_in_kpi import apply
    d = _dashboard(spl="index=main | stats count")  # no timechart
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert "sparklineDisplay" not in opts


def test_sparkline_preserves_hero_settings():
    """If hero-kpi already set sparklineDisplay, do not overwrite."""
    from splunk_dashboards.patterns.sparkline_in_kpi import apply
    d = _dashboard()
    d["visualizations"]["viz_p1"]["options"]["sparklineDisplay"] = "before"  # hero set it
    d["visualizations"]["viz_p1"]["options"]["majorValueSize"] = 64
    apply(d, get_theme("pro"), T)
    # Should stay 'before', not be overwritten to 'below'
    assert d["visualizations"]["viz_p1"]["options"]["sparklineDisplay"] == "before"


def test_sparkline_no_op_on_non_singlevalue():
    from splunk_dashboards.patterns.sparkline_in_kpi import apply
    d = _dashboard()
    d["visualizations"]["viz_p1"]["type"] = "splunk.line"
    apply(d, get_theme("pro"), T)
    assert "sparklineDisplay" not in d["visualizations"]["viz_p1"]["options"]
