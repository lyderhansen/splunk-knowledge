"""Aurora composition patterns - registry and auto-discovery.

Each pattern is a callable: apply(dashboard: dict, theme: Theme, tokens) -> None
that mutates the dashboard in place. Patterns are registered at module import
time; importing this package auto-imports every sibling module so their
register_pattern() calls run.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict

from splunk_dashboards.themes import Theme
from splunk_dashboards import tokens as _tokens_module  # noqa: F401


@dataclass(frozen=True)
class Pattern:
    name: str
    apply: Callable[[dict, Theme, object], None]


PATTERNS: Dict[str, Pattern] = {}


def register_pattern(pattern: Pattern) -> None:
    """Add a pattern to the registry. Overwrites if name already exists."""
    PATTERNS[pattern.name] = pattern


def get_pattern(name: str) -> Pattern:
    if name not in PATTERNS:
        raise KeyError(f"Unknown pattern: {name}. Available: {list_patterns()}")
    return PATTERNS[name]


def list_patterns() -> list:
    return list(PATTERNS.keys())


# ----- Auto-discovery: import every pattern module so they self-register -----
# During staged development (Aurora sub-plan 11 tasks T11-2..T11-7), pattern
# modules are added one at a time. We silently skip missing modules so the
# package remains importable at every commit. Each module registers itself
# via register_pattern() at import time.
for _mod_name in (
    "card_kpi",
    "hero_kpi",
    "sparkline_in_kpi",
    "compare_prev",
    "annotations",
    "section_zones",
    "trend_chip",
    "markergauge_strip",
):
    try:
        __import__(f"splunk_dashboards.patterns.{_mod_name}")
    except ImportError:
        pass
