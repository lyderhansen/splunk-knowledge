"""Tests for layout module."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.layout import Panel, VIZ_TYPES


def test_panel_defaults():
    p = Panel(id="p1", title="Failed Logins")
    assert p.id == "p1"
    assert p.title == "Failed Logins"
    assert p.x == 0
    assert p.y == 0
    assert p.w == 6
    assert p.h == 4
    assert p.viz_type == "splunk.singlevalue"
    assert p.data_source_ref is None


def test_panel_to_dict_roundtrip():
    p = Panel(
        id="p2",
        title="Logins Over Time",
        x=6, y=0, w=6, h=4,
        viz_type="splunk.line",
        data_source_ref="question-1",
    )
    data = p.to_dict()
    restored = Panel.from_dict(data)
    assert restored == p


def test_viz_types_includes_core_set():
    core = {
        "splunk.singlevalue",
        "splunk.line",
        "splunk.column",
        "splunk.bar",
        "splunk.pie",
        "splunk.area",
        "splunk.table",
        "splunk.timeline",
        "splunk.choropleth",
        "splunk.markergauge",
    }
    assert core.issubset(set(VIZ_TYPES))
