"""Tests for annotations pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard(vtype="splunk.line"):
    return {
        "title": "T",
        "dataSources": {
            "ds_1": {"type": "ds.search", "options": {"query": "index=main | timechart count"}},
        },
        "visualizations": {
            "viz_p1": {
                "type": vtype, "title": "Requests",
                "dataSources": {"primary": "ds_1"}, "options": {},
            },
        },
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []},
    }


def test_annotations_adds_secondary_ds_for_annotations():
    from splunk_dashboards.patterns.annotations import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    # A new ds entry keyed ds_annotations_* is added
    ann_keys = [k for k in d["dataSources"].keys() if k.startswith("ds_annotations_")]
    assert len(ann_keys) == 1
    # Its SPL pulls from an annotations lookup
    spl = d["dataSources"][ann_keys[0]]["options"]["query"]
    assert "inputlookup" in spl.lower() or "annotations" in spl.lower()


def test_annotations_binds_viz_options_to_secondary_ds():
    from splunk_dashboards.patterns.annotations import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert "annotationX" in opts
    assert "annotationLabel" in opts
    assert "annotationColor" in opts


def test_annotations_applies_only_to_line_area_column():
    from splunk_dashboards.patterns.annotations import apply
    for vtype in ("splunk.line", "splunk.area", "splunk.column"):
        d = _dashboard(vtype=vtype)
        apply(d, get_theme("pro"), T)
        assert "annotationX" in d["visualizations"]["viz_p1"]["options"]


def test_annotations_skips_pie_bar_table():
    from splunk_dashboards.patterns.annotations import apply
    for vtype in ("splunk.pie", "splunk.bar", "splunk.table"):
        d = _dashboard(vtype=vtype)
        apply(d, get_theme("pro"), T)
        assert "annotationX" not in d["visualizations"]["viz_p1"]["options"]


def test_annotations_idempotent():
    from splunk_dashboards.patterns.annotations import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    key_count_once = len([k for k in d["dataSources"] if k.startswith("ds_annotations_")])
    apply(d, get_theme("pro"), T)
    key_count_twice = len([k for k in d["dataSources"] if k.startswith("ds_annotations_")])
    assert key_count_once == key_count_twice
