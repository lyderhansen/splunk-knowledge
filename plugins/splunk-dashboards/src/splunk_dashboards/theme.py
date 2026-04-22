"""Theme engine for ds-create — applies visual polish to generated dashboards."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Literal


SemanticTag = Literal["failure", "success", "latency", "count", "volume", "critical"]


@dataclass
class ThemeConfig:
    name: str
    # Ordered color palette for series (charts honor these in seriesColors).
    series_colors: list
    # Per-semantic-tag colors for single-value KPIs and fills.
    semantic_colors: dict  # tag -> hex
    # Whether to auto-add a markdown header panel at the top.
    add_header: bool = False
    # Whether to add sparklines to single-value panels.
    sparklines: bool = False
    # Default legend display when series count <= 1 (vs. >1).
    legend_single_series: str = "off"
    legend_multi_series: str = "right"
    # Whether to hide gridlines for a cleaner look.
    hide_minor_gridlines: bool = True


# ---------- Bundled themes ----------

# Default Splunk Dashboard Studio dark-theme palette (20 colors).
DEFAULT_PALETTE = [
    "#006eb9", "#763c00", "#3c444d", "#f38700", "#dc4e41",
    "#1a7b7b", "#6b7ec1", "#d94670", "#008000", "#5b5b5b",
    "#c29922", "#826af9", "#6b7c85", "#005a75", "#a64c4c",
    "#706a2e", "#9c4f2e", "#337a3f", "#8c3b8f", "#424c6d",
]

# SOC palette: red / amber / green priority with accents.
SOC_PALETTE = [
    "#dc4e41", "#f1813f", "#f5c342", "#54a353", "#006eb9",
    "#763c00", "#6b7ec1", "#a64c4c", "#826af9", "#1a7b7b",
]

# Ops palette: cool blues with status accents.
OPS_PALETTE = [
    "#006eb9", "#1a7b7b", "#54a353", "#f1813f", "#dc4e41",
    "#6b7ec1", "#826af9", "#c29922", "#3c444d", "#5b5b5b",
]

# Exec palette: muted with single accent per chart.
EXEC_PALETTE = [
    "#2d5a87", "#5b7ca8", "#9caec8", "#c29922", "#54a353",
    "#dc4e41", "#3c444d", "#6b7c85", "#a64c4c", "#8c3b8f",
]


THEMES: dict = {
    "clean": ThemeConfig(
        name="clean",
        series_colors=DEFAULT_PALETTE,
        semantic_colors={},  # no auto coloring
        add_header=False,
        sparklines=False,
    ),
    "soc": ThemeConfig(
        name="soc",
        series_colors=SOC_PALETTE,
        semantic_colors={
            "failure": "#dc4e41",
            "success": "#54a353",
            "critical": "#dc4e41",
            "latency": "#f1813f",
            "count": "#006eb9",
            "volume": "#1a7b7b",
        },
        add_header=True,
        sparklines=True,
    ),
    "ops": ThemeConfig(
        name="ops",
        series_colors=OPS_PALETTE,
        semantic_colors={
            "failure": "#dc4e41",
            "success": "#54a353",
            "critical": "#dc4e41",
            "latency": "#f1813f",
            "count": "#006eb9",
            "volume": "#826af9",
        },
        add_header=True,
        sparklines=True,
    ),
    "exec": ThemeConfig(
        name="exec",
        series_colors=EXEC_PALETTE,
        semantic_colors={
            "failure": "#dc4e41",
            "success": "#54a353",
            "critical": "#dc4e41",
            "latency": "#c29922",
            "count": "#2d5a87",
            "volume": "#5b7ca8",
        },
        add_header=True,
        sparklines=True,
    ),
}


def get_theme(name: str) -> ThemeConfig:
    if name not in THEMES:
        raise KeyError(f"Unknown theme: {name}. Available: {list(THEMES.keys())}")
    return THEMES[name]


# ---------- Semantic detection ----------

FAILURE_PATTERNS = [
    re.compile(r"\baction\s*=\s*failure\b", re.I),
    re.compile(r"\baction\s*=\s*fail\b", re.I),
    re.compile(r"\bstatus\s*>=\s*[45]\d\d\b"),
    re.compile(r"\berror\b", re.I),
    re.compile(r"\bfailed\b", re.I),
    re.compile(r"\bfailure\b", re.I),
    re.compile(r"\battack\b", re.I),
]
SUCCESS_PATTERNS = [
    re.compile(r"\baction\s*=\s*success\b", re.I),
    re.compile(r"\buptime\b", re.I),
    re.compile(r"\bhealthy\b", re.I),
    re.compile(r"\bsuccess\b", re.I),
]
LATENCY_PATTERNS = [
    re.compile(r"\blatency\b", re.I),
    re.compile(r"\bresponse_time\b", re.I),
    re.compile(r"\bduration\b", re.I),
    re.compile(r"\bp\d\d\b"),  # p95, p99
]
COUNT_PATTERNS = [
    re.compile(r"\|\s*stats\s+count\b", re.I),
    re.compile(r"\bevent[s]?\b", re.I),
    re.compile(r"\btotal\b", re.I),
]
VOLUME_PATTERNS = [
    re.compile(r"\bbytes\b", re.I),
    re.compile(r"\btraffic\b", re.I),
    re.compile(r"\bthroughput\b", re.I),
]
CRITICAL_PATTERNS = [
    re.compile(r"\bcritical\b", re.I),
    re.compile(r"\balert\b", re.I),
    re.compile(r"\bincident\b", re.I),
]


def _match_any(patterns: list, text: str) -> bool:
    return any(p.search(text) for p in patterns)


def detect_semantics(spl: str, title: str) -> list:
    """Returns list of semantic hints found in SPL or title. Order: most specific first."""
    combined = f"{spl or ''} {title or ''}"
    hints: list = []
    if _match_any(CRITICAL_PATTERNS, combined):
        hints.append("critical")
    if _match_any(FAILURE_PATTERNS, combined):
        hints.append("failure")
    if _match_any(SUCCESS_PATTERNS, combined):
        hints.append("success")
    if _match_any(LATENCY_PATTERNS, combined):
        hints.append("latency")
    if _match_any(VOLUME_PATTERNS, combined):
        hints.append("volume")
    if _match_any(COUNT_PATTERNS, combined):
        hints.append("count")
    return hints


# ---------- Apply theme ----------

def _spl_for_viz(viz_id: str, dashboard: dict) -> str:
    """Returns the SPL of the dataSource bound to a visualization's primary."""
    viz = dashboard["visualizations"].get(viz_id, {})
    ds_key = (viz.get("dataSources") or {}).get("primary")
    if not ds_key:
        return ""
    ds = dashboard["dataSources"].get(ds_key, {})
    return ((ds.get("options") or {}).get("query") or "")


def _style_singlevalue(viz: dict, semantics: list, theme: ThemeConfig) -> None:
    options = viz.setdefault("options", {})
    # Apply majorColor from the first matching semantic
    for tag in semantics:
        if tag in theme.semantic_colors:
            options["majorColor"] = theme.semantic_colors[tag]
            break
    # Sparkline when count/volume/latency semantic present
    if theme.sparklines and any(t in semantics for t in ("count", "volume", "latency")):
        options.setdefault("sparklineDisplay", "below")


def _style_chart(viz: dict, theme: ThemeConfig) -> None:
    options = viz.setdefault("options", {})
    options["seriesColors"] = list(theme.series_colors)
    if theme.hide_minor_gridlines:
        options.setdefault("showYMinorGridLines", False)


# Viz types that behave like "single-value KPI tiles" for theming purposes.
SINGLEVALUE_TYPES = {
    "splunk.singlevalue", "splunk.singlevalueicon", "splunk.singlevalueradial",
    "splunk.markergauge", "splunk.fillergauge",
}
# Viz types that accept seriesColors.
CHART_TYPES = {
    "splunk.line", "splunk.area", "splunk.bar", "splunk.column", "splunk.pie",
    "splunk.bubble", "splunk.scatter", "splunk.punchcard",
}


def _add_markdown_header(dashboard: dict) -> None:
    """Insert a markdown header panel at y=0, pushing existing panels down by 2 rows."""
    header_id = "viz_theme_header"
    if header_id in dashboard["visualizations"]:
        return
    title = dashboard.get("title", "")
    description = dashboard.get("description", "") or ""
    md = f"# {title}\n\n{description}" if description else f"# {title}"
    dashboard["visualizations"][header_id] = {
        "type": "splunk.markdown",
        "title": "",
        "dataSources": {},
        "options": {"markdown": md, "backgroundColor": "transparent"},
    }
    # Push existing structure entries down
    existing = dashboard["layout"].get("structure", [])
    shift = 120  # two grid-row heights
    for entry in existing:
        pos = entry.get("position") or {}
        if "y" in pos:
            pos["y"] = pos["y"] + shift
    # Insert header at top spanning full width
    width = (dashboard["layout"].get("options") or {}).get("width", 1440)
    existing.insert(0, {
        "item": header_id,
        "type": "block",
        "position": {"x": 0, "y": 0, "w": width, "h": shift - 20},
    })


def apply_theme(dashboard: dict, theme_name: str) -> None:
    """Mutate `dashboard` in place, applying the named theme's styling to each viz.

    Theme "clean" is a no-op. Other themes add colors, sparklines, series palettes,
    and an optional markdown header panel.
    """
    theme = get_theme(theme_name)
    if theme.name == "clean":
        return  # no-op

    for viz_id, viz in list(dashboard.get("visualizations", {}).items()):
        vtype = viz.get("type", "")
        spl = _spl_for_viz(viz_id, dashboard)
        semantics = detect_semantics(spl, viz.get("title", ""))
        if vtype in SINGLEVALUE_TYPES:
            _style_singlevalue(viz, semantics, theme)
        elif vtype in CHART_TYPES:
            _style_chart(viz, theme)

    if theme.add_header:
        _add_markdown_header(dashboard)
