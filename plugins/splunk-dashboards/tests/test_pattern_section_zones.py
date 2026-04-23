"""Tests for section-zones pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard_with_sections():
    """Panels tagged with 'section' metadata group into zones."""
    vizs = {}
    structure = []
    # 4 panels, 2 sections
    for i, (section, y) in enumerate([("Availability", 20), ("Availability", 180),
                                        ("Performance", 400), ("Performance", 560)], start=1):
        vizs[f"viz_p{i}"] = {
            "type": "splunk.singlevalue", "title": f"Metric {i}",
            "dataSources": {}, "options": {}, "section": section,
        }
        structure.append({"item": f"viz_p{i}", "type": "block",
                           "position": {"x": 20, "y": y, "w": 1400, "h": 140}})
    return {
        "title": "T", "dataSources": {}, "visualizations": vizs,
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": structure},
    }


def test_section_zones_adds_zone_rectangle_per_section():
    from splunk_dashboards.patterns.section_zones import apply
    d = _dashboard_with_sections()
    apply(d, get_theme("pro"), T)
    rects = [v for v in d["visualizations"].values() if v["type"] == "splunk.rectangle"]
    assert len(rects) == 2  # one per section


def test_section_zones_adds_markdown_header_per_section():
    from splunk_dashboards.patterns.section_zones import apply
    d = _dashboard_with_sections()
    apply(d, get_theme("pro"), T)
    mds = [v for v in d["visualizations"].values() if v["type"] == "splunk.markdown"]
    assert len(mds) == 2
    # Each markdown contains the section name as a level-3 heading
    md_texts = [m["options"]["markdown"] for m in mds]
    assert any("Availability" in t for t in md_texts)
    assert any("Performance" in t for t in md_texts)


def test_section_zones_no_op_when_no_sections_tagged():
    """If panels have no 'section' field, do nothing."""
    from splunk_dashboards.patterns.section_zones import apply
    d = _dashboard_with_sections()
    for v in d["visualizations"].values():
        v.pop("section", None)
    apply(d, get_theme("pro"), T)
    assert not any(v["type"] == "splunk.rectangle" for v in d["visualizations"].values())


def test_section_zones_no_op_on_grid_layout():
    from splunk_dashboards.patterns.section_zones import apply
    d = _dashboard_with_sections()
    d["layout"]["type"] = "grid"
    apply(d, get_theme("pro"), T)
    assert not any(v["type"] == "splunk.rectangle" for v in d["visualizations"].values())
