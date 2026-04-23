"""Tests for Aurora themes registry."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from splunk_dashboards.themes import (
    Theme,
    THEMES,
    LEGACY_ALIASES,
    get_theme,
    list_themes,
    register_theme,
)


def test_four_aurora_themes_registered():
    assert {"pro", "glass", "exec", "noc"}.issubset(set(THEMES.keys()))


def test_legacy_aliases_resolve():
    assert LEGACY_ALIASES["clean"] == "pro"
    assert LEGACY_ALIASES["ops"] == "noc"
    assert LEGACY_ALIASES["soc"] == "noc"


def test_get_theme_resolves_legacy_alias():
    resolved = get_theme("clean")
    assert resolved.name == "pro"


def test_get_theme_unknown_raises():
    with pytest.raises(KeyError):
        get_theme("nonexistent")


def test_pro_theme_uses_categorical_10():
    from splunk_dashboards.tokens import SERIES_CATEGORICAL_10
    pro = get_theme("pro")
    assert pro.series_colors == SERIES_CATEGORICAL_10


def test_glass_theme_uses_studio_20():
    from splunk_dashboards.tokens import SERIES_STUDIO_20
    glass = get_theme("glass")
    # Glass uses first 8 of DS default 20
    assert glass.series_colors == SERIES_STUDIO_20[:8]


def test_noc_theme_uses_soc_8():
    from splunk_dashboards.tokens import SERIES_SOC_8
    noc = get_theme("noc")
    assert noc.series_colors == SERIES_SOC_8


def test_exec_theme_is_light_mode():
    exec_t = get_theme("exec")
    assert exec_t.canvas == "#FAFAF7"
    assert exec_t.mode == "light"


def test_each_theme_has_default_patterns():
    # Each theme ships with a list of pattern names to auto-apply
    for name in ("pro", "glass", "exec", "noc"):
        t = get_theme(name)
        assert isinstance(t.default_patterns, tuple)
        assert len(t.default_patterns) >= 2


def test_list_themes_returns_canonical_only():
    # list_themes returns only Aurora themes, not legacy aliases
    listed = list_themes()
    assert set(listed) == {"pro", "glass", "exec", "noc"}


def test_register_theme_adds_new():
    from splunk_dashboards.tokens import SERIES_CATEGORICAL_10
    custom = Theme(
        name="custom_test",
        mode="dark",
        canvas="#111",
        panel="#222",
        panel_stroke="#333",
        text_primary="#fff",
        text_secondary="#aaa",
        accent="#f0f",
        series_colors=SERIES_CATEGORICAL_10,
        semantic_colors={},
        default_patterns=("card-kpi",),
    )
    register_theme(custom)
    try:
        assert get_theme("custom_test").name == "custom_test"
    finally:
        THEMES.pop("custom_test", None)  # cleanup
