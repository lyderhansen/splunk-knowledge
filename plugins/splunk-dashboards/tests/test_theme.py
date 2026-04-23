"""Tests for theme module (Aurora-aware compatibility shim + engine)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from splunk_dashboards.theme import (
    THEMES,
    ThemeConfig,
    apply_theme,
    detect_semantics,
    get_theme,
)


def test_four_bundled_themes_exist():
    # Aurora v1 — 4 new canonical themes replace the old 4; legacy names still resolve.
    assert set(THEMES.keys()) == {"pro", "glass", "exec", "noc"}


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


def _empty_dashboard():
    return {
        "title": "T", "description": "",
        "dataSources": {},
        "visualizations": {},
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []},
        "defaults": {},
    }


def test_apply_theme_pro_writes_definition_defaults():
    """Aurora pro theme should emit definition.defaults with canvas + series palette."""
    dashboard = _empty_dashboard()
    apply_theme(dashboard, "pro")
    d = dashboard.get("defaults", {})
    # definition.defaults.visualizations.global.options.backgroundColor
    global_opts = d.get("visualizations", {}).get("global", {}).get("options", {})
    assert global_opts.get("backgroundColor") == "#0b0c0e"


def test_apply_theme_legacy_clean_routes_to_pro():
    """'clean' is a legacy alias for 'pro' — behavior identical."""
    d1 = _empty_dashboard()
    d2 = _empty_dashboard()
    apply_theme(d1, "clean")
    apply_theme(d2, "pro")
    assert d1.get("defaults") == d2.get("defaults")


def test_apply_theme_noc_uses_black_canvas():
    d = _empty_dashboard()
    apply_theme(d, "noc")
    global_opts = d["defaults"]["visualizations"]["global"]["options"]
    assert global_opts["backgroundColor"] == "#000000"


def test_apply_theme_exec_uses_light_canvas():
    d = _empty_dashboard()
    apply_theme(d, "exec")
    global_opts = d["defaults"]["visualizations"]["global"]["options"]
    assert global_opts["backgroundColor"] == "#FAFAF7"


def test_apply_theme_legacy_ops_routes_to_noc():
    d1 = _empty_dashboard()
    d2 = _empty_dashboard()
    apply_theme(d1, "ops")
    apply_theme(d2, "noc")
    assert d1.get("defaults") == d2.get("defaults")


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


def test_apply_theme_noc_colors_failure_singlevalue_red():
    """Legacy 'soc' / new 'noc' theme colors the failure singlevalue with STATUS_CRITICAL."""
    d = _sample_dashboard_with_singlevalue()
    apply_theme(d, "noc")
    options = d["visualizations"]["viz_p1"]["options"]
    # SPL contains "action=failure" → semantic "failure" → critical majorColor
    assert options["majorColor"] == "#DC4E41"
