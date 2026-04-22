"""Tests for theme module."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from splunk_dashboards.theme import (
    THEMES,
    ThemeConfig,
    detect_semantics,
    get_theme,
)


def test_four_bundled_themes_exist():
    assert set(THEMES.keys()) == {"clean", "soc", "ops", "exec"}


def test_each_theme_has_required_fields():
    for name, theme in THEMES.items():
        assert isinstance(theme, ThemeConfig)
        assert theme.name == name
        assert isinstance(theme.series_colors, list)
        assert len(theme.series_colors) >= 5  # enough for typical multi-series
        assert isinstance(theme.semantic_colors, dict)


def test_detect_semantics_finds_failure_in_spl():
    assert "failure" in detect_semantics(
        spl="index=auth action=failure | stats count by src",
        title="Failed Logins",
    )


def test_detect_semantics_finds_multiple_hints():
    hints = detect_semantics(
        spl="index=web status>=400 | stats avg(response_time) as latency by uri",
        title="Slow error endpoints",
    )
    assert "failure" in hints  # status>=400 OR "error" in title
    assert "latency" in hints


def test_get_theme_unknown_raises():
    with pytest.raises(KeyError):
        get_theme("nonexistent")


def test_clean_theme_has_no_semantic_colors():
    # The clean theme is a no-op baseline — no semantic coloring
    assert THEMES["clean"].semantic_colors == {}


from splunk_dashboards.theme import apply_theme


def _sample_dashboard_with_singlevalue() -> dict:
    return {
        "title": "T",
        "description": "",
        "theme": "dark",
        "dataSources": {
            "ds_1": {
                "type": "ds.search",
                "name": "Failed Logins",
                "options": {
                    "query": "index=auth action=failure | stats count",
                    "queryParameters": {"earliest": "-24h", "latest": "now"},
                },
            }
        },
        "visualizations": {
            "viz_p1": {
                "type": "splunk.singlevalue",
                "title": "Failed Logins",
                "dataSources": {"primary": "ds_1"},
                "options": {},
            }
        },
        "inputs": {},
        "defaults": {},
        "layout": {"type": "absolute", "options": {"width": 1440, "height": 960}, "structure": [
            {"item": "viz_p1", "type": "block", "position": {"x": 0, "y": 0, "w": 300, "h": 200}}
        ]},
    }


def test_apply_theme_clean_is_noop():
    d = _sample_dashboard_with_singlevalue()
    before = {k: v for k, v in d["visualizations"]["viz_p1"]["options"].items()}
    apply_theme(d, "clean")
    after = d["visualizations"]["viz_p1"]["options"]
    assert after == before  # clean theme does nothing


def test_apply_theme_soc_colors_failure_singlevalue_red():
    d = _sample_dashboard_with_singlevalue()
    apply_theme(d, "soc")
    options = d["visualizations"]["viz_p1"]["options"]
    # SPL contains "action=failure" → semantic "failure" → red majorColor
    assert options["majorColor"] == "#dc4e41"


def test_apply_theme_soc_adds_sparkline_on_count_singlevalue():
    d = _sample_dashboard_with_singlevalue()
    apply_theme(d, "soc")
    options = d["visualizations"]["viz_p1"]["options"]
    # "stats count" in SPL → "count" semantic → sparkline on
    assert options["sparklineDisplay"] == "below"


def test_apply_theme_soc_adds_series_colors_to_charts():
    d = {
        "title": "T", "description": "", "theme": "dark",
        "dataSources": {"ds_1": {"type": "ds.search", "name": "x", "options": {"query": "| makeresults count=10", "queryParameters": {"earliest": "-24h", "latest": "now"}}}},
        "visualizations": {
            "viz_p1": {"type": "splunk.line", "title": "T", "dataSources": {"primary": "ds_1"}, "options": {}}
        },
        "inputs": {}, "defaults": {},
        "layout": {"type": "absolute", "structure": [{"item": "viz_p1", "type": "block", "position": {"x": 0, "y": 0, "w": 600, "h": 320}}]},
    }
    apply_theme(d, "soc")
    options = d["visualizations"]["viz_p1"]["options"]
    assert "seriesColors" in options
    # SOC palette starts with red
    assert options["seriesColors"][0] == "#dc4e41"


def test_apply_theme_soc_adds_markdown_header_panel():
    d = _sample_dashboard_with_singlevalue()
    apply_theme(d, "soc")
    # Header markdown panel is added
    header_ids = [k for k, v in d["visualizations"].items() if v["type"] == "splunk.markdown"]
    assert len(header_ids) == 1
    header = d["visualizations"][header_ids[0]]
    assert d["title"] in header["options"]["markdown"]
