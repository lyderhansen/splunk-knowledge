"""Compatibility shim — re-exports from themes + theme_engine.

Existing imports like `from splunk_dashboards.theme import apply_theme, THEMES`
continue to work. New code should import from themes.py or theme_engine.py directly.
"""
from __future__ import annotations

from splunk_dashboards.themes import (
    Theme as ThemeConfig,  # legacy name
    THEMES,
    get_theme,
)
from splunk_dashboards.theme_engine import (
    apply_theme,
    detect_semantics,
    SINGLEVALUE_TYPES,
    CHART_TYPES,
)

__all__ = [
    "ThemeConfig", "THEMES", "get_theme",
    "apply_theme", "detect_semantics",
    "SINGLEVALUE_TYPES", "CHART_TYPES",
]
