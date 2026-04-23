"""Tests for compare-prev pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard(vtype="splunk.line", spl="index=main | timechart count"):
    return {
        "title": "T",
        "dataSources": {
            "ds_1": {"type": "ds.search", "options": {"query": spl}},
        },
        "visualizations": {
            "viz_p1": {
                "type": vtype, "title": "Requests",
                "dataSources": {"primary": "ds_1"}, "options": {},
            },
        },
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []},
    }


def test_compare_prev_rewrites_spl_to_add_timewrap():
    from splunk_dashboards.patterns.compare_prev import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    spl = d["dataSources"]["ds_1"]["options"]["query"]
    assert "| timewrap" in spl.lower()


def test_compare_prev_sets_series_colors_and_dash_style():
    from splunk_dashboards.patterns.compare_prev import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    # Both seriesColorsByField and lineDashStylesByField should be set
    assert "seriesColorsByField" in opts
    assert "lineDashStylesByField" in opts
    # Any field containing '1' (like "count_1day_before") dashed
    dashes = opts["lineDashStylesByField"]
    assert any("before" in k or "prev" in k.lower() for k in dashes.keys())


def test_compare_prev_skips_non_timeseries_spl():
    from splunk_dashboards.patterns.compare_prev import apply
    d = _dashboard(spl="index=main | stats count")  # no | timechart
    apply(d, get_theme("pro"), T)
    spl = d["dataSources"]["ds_1"]["options"]["query"]
    assert "timewrap" not in spl.lower()


def test_compare_prev_only_line_and_area():
    """Pattern applies on splunk.line and splunk.area; skips others."""
    from splunk_dashboards.patterns.compare_prev import apply
    d = _dashboard(vtype="splunk.pie")
    apply(d, get_theme("pro"), T)
    assert "timewrap" not in d["dataSources"]["ds_1"]["options"]["query"].lower()
    assert "seriesColorsByField" not in d["visualizations"]["viz_p1"]["options"]


def test_compare_prev_idempotent():
    """Applying twice does not double-wrap the SPL."""
    from splunk_dashboards.patterns.compare_prev import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    spl_once = d["dataSources"]["ds_1"]["options"]["query"]
    apply(d, get_theme("pro"), T)
    spl_twice = d["dataSources"]["ds_1"]["options"]["query"]
    assert spl_once == spl_twice
