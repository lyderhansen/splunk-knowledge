"""Aurora themes registry — 4 canonical themes + legacy aliases.

A Theme captures the tokens and behavior hints that the Aurora engine uses
to emit definition.defaults and per-viz overrides. Patterns are separate
(see patterns/ package, sub-plan 11).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Tuple, Dict

from splunk_dashboards import tokens as T


ThemeMode = Literal["dark", "light"]


@dataclass(frozen=True)
class Theme:
    name: str
    mode: ThemeMode
    canvas: str
    panel: str
    panel_stroke: str
    text_primary: str
    text_secondary: str
    accent: str
    series_colors: list
    semantic_colors: Dict[str, str]
    default_patterns: Tuple[str, ...]
    # True for themes that rely on rectangle stacking to fake gradients (glass)
    uses_gradient_canvas: bool = False


PRO = Theme(
    name="pro",
    mode="dark",
    canvas=T.CANVAS_DARK,
    panel=T.PANEL_DARK,
    panel_stroke=T.PANEL_STROKE_DARK,
    text_primary=T.TEXT_PRIMARY_DARK,
    text_secondary=T.TEXT_SECONDARY_DARK,
    accent=T.STATUS_INFO,  # #006D9C
    series_colors=list(T.SERIES_CATEGORICAL_10),
    semantic_colors={
        "failure": T.STATUS_CRITICAL,
        "success": T.STATUS_OK,
        "critical": T.STATUS_CRITICAL,
        "latency": T.STATUS_HIGH,
        "count": T.STATUS_INFO,
        "volume": T.STATUS_INFO,
    },
    default_patterns=("card-kpi", "sparkline-in-kpi", "compare-prev"),
)

GLASS = Theme(
    name="glass",
    mode="dark",
    canvas=T.CANVAS_DARK,  # gradient faked via rectangle stack
    panel="rgba(255,255,255,0.03)",
    panel_stroke="rgba(255,255,255,0.08)",
    text_primary=T.TEXT_PRIMARY_DARK,
    text_secondary=T.TEXT_SECONDARY_DARK,
    accent="#009CEB",  # DS default blue, slightly richer than #006D9C
    series_colors=list(T.SERIES_STUDIO_20[:8]),
    semantic_colors={
        "failure": T.STATUS_CRITICAL,
        "success": T.STATUS_OK,
        "critical": T.STATUS_CRITICAL,
        "latency": T.STATUS_HIGH,
        "count": "#009CEB",
        "volume": "#7B56DB",
    },
    default_patterns=("hero-kpi", "card-kpi", "sparkline-in-kpi"),
    uses_gradient_canvas=True,
)

EXEC = Theme(
    name="exec",
    mode="light",
    canvas=T.CANVAS_LIGHT,
    panel=T.PANEL_LIGHT,
    panel_stroke=T.PANEL_STROKE_LIGHT,
    text_primary=T.TEXT_PRIMARY_LIGHT,
    text_secondary=T.TEXT_SECONDARY_LIGHT,
    accent=T.STATUS_INFO_LIGHT,
    series_colors=list(T.SERIES_CATEGORICAL_10_LIGHT),
    semantic_colors={
        "failure": T.STATUS_CRITICAL_LIGHT,
        "success": T.STATUS_OK_LIGHT,
        "critical": T.STATUS_CRITICAL_LIGHT,
        "latency": T.STATUS_HIGH_LIGHT,
        "count": T.STATUS_INFO_LIGHT,
        "volume": T.STATUS_INFO_LIGHT,
    },
    default_patterns=("compare-prev", "section-zones", "sparkline-in-kpi"),
)

NOC = Theme(
    name="noc",
    mode="dark",
    canvas=T.CANVAS_DARK_PURE,
    panel=T.PANEL_DARK_NOC,
    panel_stroke="#1FBAD6",  # cyan stroke at opacity 0.4 applied at render
    text_primary=T.TEXT_PRIMARY_DARK,
    text_secondary=T.TEXT_SECONDARY_DARK,
    accent="#1FBAD6",
    series_colors=list(T.SERIES_SOC_8),
    semantic_colors={
        "failure": T.STATUS_CRITICAL,
        "success": T.STATUS_OK,
        "critical": T.STATUS_CRITICAL,
        "latency": T.STATUS_HIGH,
        "count": "#1FBAD6",
        "volume": T.STATUS_INFO,
    },
    default_patterns=("card-kpi", "annotations", "status-tile"),
)


THEMES: Dict[str, Theme] = {
    "pro": PRO,
    "glass": GLASS,
    "exec": EXEC,
    "noc": NOC,
}


# Legacy theme names → canonical Aurora names.
LEGACY_ALIASES: Dict[str, str] = {
    "clean": "pro",
    "ops": "noc",
    "soc": "noc",
}


def get_theme(name: str) -> Theme:
    """Resolve a theme name, supporting legacy aliases."""
    canonical = LEGACY_ALIASES.get(name, name)
    if canonical not in THEMES:
        raise KeyError(f"Unknown theme: {name}. Available: {list_themes()}")
    return THEMES[canonical]


def list_themes() -> list:
    """Return canonical Aurora theme names only (not legacy aliases)."""
    return list(THEMES.keys())


def register_theme(theme: Theme) -> None:
    """Add a theme to the registry. Overwrites if name already exists."""
    THEMES[theme.name] = theme
