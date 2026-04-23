"""Aurora orchestrator — runs theme + patterns in the correct order.

Public API:
    apply(dashboard, theme="pro", patterns=None) -> None

When `patterns is None`, the theme's default_patterns are used.
When `patterns=[]` (empty list), NO patterns run (theme only).
"""
from __future__ import annotations

from typing import Optional

from splunk_dashboards.themes import get_theme
from splunk_dashboards.theme_engine import apply_theme
from splunk_dashboards.patterns import get_pattern
from splunk_dashboards import tokens as _tokens


def apply(
    dashboard: dict,
    theme: str = "pro",
    patterns: Optional[list] = None,
) -> None:
    # 1. Apply theme layer (writes definition.defaults + semantic coloring)
    apply_theme(dashboard, theme)

    # 2. Resolve pattern list
    t = get_theme(theme)
    pattern_names = list(t.default_patterns) if patterns is None else list(patterns)

    # 3. Apply patterns in order (skip "status-tile" — it's a theme-level concern, not a pattern module in v1)
    for name in pattern_names:
        if name == "status-tile":
            continue  # handled inline by noc theme via singlevalueicon backgroundColor
        pat = get_pattern(name)
        pat.apply(dashboard, t, _tokens)
