"""Tests for patterns registry."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from splunk_dashboards.patterns import (
    Pattern,
    PATTERNS,
    get_pattern,
    list_patterns,
    register_pattern,
)


def test_six_patterns_registered_on_import():
    expected = {"card-kpi", "hero-kpi", "sparkline-in-kpi", "compare-prev", "annotations", "section-zones"}
    assert expected.issubset(set(PATTERNS.keys()))


def test_get_pattern_unknown_raises():
    with pytest.raises(KeyError):
        get_pattern("nonexistent")


def test_pattern_has_required_fields():
    for name in list_patterns():
        p = get_pattern(name)
        assert p.name == name
        assert callable(p.apply)


def test_register_pattern_adds_new():
    called = []
    def fake_apply(dashboard, theme, tokens):
        called.append(True)
    register_pattern(Pattern(name="test-pat", apply=fake_apply))
    try:
        get_pattern("test-pat").apply({}, None, None)
        assert called == [True]
    finally:
        PATTERNS.pop("test-pat", None)
