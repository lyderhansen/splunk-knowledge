"""Integration tests for Aurora orchestrator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from splunk_dashboards.aurora import apply


def _dashboard():
    return {
        "title": "T", "dataSources": {
            "ds_1": {"type": "ds.search", "options": {"query": "index=m | timechart count"}},
        },
        "visualizations": {
            "viz_p1": {"type": "splunk.singlevalue", "title": "Events",
                       "dataSources": {"primary": "ds_1"}, "options": {}},
        },
        "layout": {"type": "absolute", "options": {"width": 1440},
                    "structure": [{"item": "viz_p1", "type": "block",
                                     "position": {"x": 20, "y": 20, "w": 320, "h": 140}}]},
    }


def test_apply_runs_theme_and_default_patterns():
    """With no explicit patterns list, apply uses theme's default pattern package."""
    d = _dashboard()
    apply(d, theme="pro")
    # pro default patterns include card-kpi → rectangle should be added
    assert any(v["type"] == "splunk.rectangle" for v in d["visualizations"].values())
    # pro default includes sparkline-in-kpi → singlevalue gets sparkline
    assert d["visualizations"]["viz_p1"]["options"].get("sparklineDisplay") == "below"


def test_apply_explicit_patterns_override_defaults():
    """Passing patterns=[] means NO patterns run, even though theme has defaults."""
    d = _dashboard()
    apply(d, theme="pro", patterns=[])
    # No rectangle (card-kpi skipped)
    assert not any(v["type"] == "splunk.rectangle" for v in d["visualizations"].values())


def test_apply_unknown_pattern_raises():
    d = _dashboard()
    with pytest.raises(KeyError):
        apply(d, theme="pro", patterns=["nonexistent"])


def test_apply_writes_definition_defaults():
    """Theme layer runs first and writes canvas backgroundColor on layout."""
    d = _dashboard()
    apply(d, theme="noc")
    assert d["layout"]["options"]["backgroundColor"] == "#000000"


def test_apply_with_legacy_theme_name():
    """Legacy 'clean' resolves to 'pro' and runs pro defaults."""
    d = _dashboard()
    apply(d, theme="clean")
    # Should behave identically to theme="pro"
    assert d["layout"]["options"]["backgroundColor"] == "#0b0c0e"


def test_apply_patterns_argument_uses_registry_names():
    """Pass an explicit pattern list by name."""
    d = _dashboard()
    apply(d, theme="pro", patterns=["card-kpi"])
    # Only card-kpi ran — sparkline-in-kpi should NOT have fired
    assert any(v["type"] == "splunk.rectangle" for v in d["visualizations"].values())
    assert "sparklineDisplay" not in d["visualizations"]["viz_p1"]["options"]
