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
