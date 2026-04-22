# splunk-dashboards Sub-plan 8: Theme engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `ds-create` output from functional-but-plain to visually polished. Add a theme engine that applies colored KPI tiles with thresholds + sparklines, series colors from curated palettes, smart chart defaults (legend, gridlines), and optional markdown header panels. Ship four themes: `clean` (minimal, default), `soc` (security ops, red/amber/green semantics), `ops` (traffic-light), `exec` (muted executive). Expose via `--theme` CLI flag.

**Architecture:** New `theme.py` module with a `ThemeConfig` dataclass, four bundled theme constants, semantic detection from SPL + title, and an `apply_theme(dashboard, theme_name)` function that mutates viz `options`. `build_dashboard()` gains an optional `theme: str = "clean"` kwarg. The `clean` theme is a no-op (preserves current output), making the change non-breaking. Other themes add: singlevalue thresholds via DOS `rangeValue(...)`, sparklines, series color arrays, legend defaults, and an auto-generated markdown header panel.

**Tech Stack:** Python 3.11+ stdlib. Pure dict mutations on the already-built dashboard JSON. No new modules needed beyond `theme.py`.

---

## File structure

```
plugins/splunk-dashboards/
├── src/splunk_dashboards/
│   ├── theme.py                    # NEW
│   └── create.py                   # MODIFIED (+ 10 lines)
├── tests/
│   └── test_theme.py               # NEW
└── skills/ds-create/SKILL.md       # MODIFIED (theme section)
```

Expected test count after this sub-plan: **92 (prior) + 10 new = 102 tests** (T1: 4, T2: 4, T3: 2).

---

### Task T1: Theme config + semantic detection (TDD)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_theme.py`
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/theme.py`

- [ ] **Step 1: Write failing tests**

Create `plugins/splunk-dashboards/tests/test_theme.py`:

```python
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
```

- [ ] **Step 2: Run tests — fail with ModuleNotFoundError**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_theme.py -v
```

- [ ] **Step 3: Implement `theme.py`**

Create `plugins/splunk-dashboards/src/splunk_dashboards/theme.py`:

```python
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
    series_colors: list[str]
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


def detect_semantics(spl: str, title: str) -> list[str]:
    """Returns list of semantic hints found in SPL or title. Order: most specific first."""
    combined = f"{spl or ''} {title or ''}"
    hints: list[str] = []
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
```

- [ ] **Step 4: Run tests — expect 6 passed**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_theme.py -v
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/theme.py plugins/splunk-dashboards/tests/test_theme.py
git commit -m "feat(splunk-dashboards): add theme module with 4 themes + semantic detection"
```

---

### Task T2: Apply theme to dashboard (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_theme.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/theme.py`

- [ ] **Step 1: Append failing tests**

Append to `plugins/splunk-dashboards/tests/test_theme.py`:

```python
from splunk_dashboards.theme import apply_theme


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


def test_apply_theme_clean_is_noop():
    d = _sample_dashboard_with_singlevalue()
    before = {k: v for k, v in d["visualizations"]["viz_p1"]["options"].items()}
    apply_theme(d, "clean")
    after = d["visualizations"]["viz_p1"]["options"]
    assert after == before  # clean theme does nothing


def test_apply_theme_soc_colors_failure_singlevalue_red():
    d = _sample_dashboard_with_singlevalue()
    apply_theme(d, "soc")
    options = d["visualizations"]["viz_p1"]["options"]
    # SPL contains "action=failure" → semantic "failure" → red majorColor
    assert options["majorColor"] == "#dc4e41"


def test_apply_theme_soc_adds_sparkline_on_count_singlevalue():
    d = _sample_dashboard_with_singlevalue()
    apply_theme(d, "soc")
    options = d["visualizations"]["viz_p1"]["options"]
    # "stats count" in SPL → "count" semantic → sparkline on
    assert options["sparklineDisplay"] == "below"


def test_apply_theme_soc_adds_series_colors_to_charts():
    d = {
        "title": "T", "description": "", "theme": "dark",
        "dataSources": {"ds_1": {"type": "ds.search", "name": "x", "options": {"query": "| makeresults count=10", "queryParameters": {"earliest": "-24h", "latest": "now"}}}},
        "visualizations": {
            "viz_p1": {"type": "splunk.line", "title": "T", "dataSources": {"primary": "ds_1"}, "options": {}}
        },
        "inputs": {}, "defaults": {},
        "layout": {"type": "absolute", "structure": [{"item": "viz_p1", "type": "block", "position": {"x": 0, "y": 0, "w": 600, "h": 320}}]},
    }
    apply_theme(d, "soc")
    options = d["visualizations"]["viz_p1"]["options"]
    assert "seriesColors" in options
    # SOC palette starts with red
    assert options["seriesColors"][0] == "#dc4e41"


def test_apply_theme_soc_adds_markdown_header_panel():
    d = _sample_dashboard_with_singlevalue()
    apply_theme(d, "soc")
    # Header markdown panel is added
    header_ids = [k for k, v in d["visualizations"].items() if v["type"] == "splunk.markdown"]
    assert len(header_ids) == 1
    header = d["visualizations"][header_ids[0]]
    assert d["title"] in header["options"]["markdown"]
```

- [ ] **Step 2: Run — expect 5 failures (apply_theme not defined)**

- [ ] **Step 3: Implement `apply_theme`**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/theme.py`:

```python
# ---------- Apply theme ----------

def _spl_for_viz(viz_id: str, dashboard: dict) -> str:
    """Returns the SPL of the dataSource bound to a visualization's primary."""
    viz = dashboard["visualizations"].get(viz_id, {})
    ds_key = (viz.get("dataSources") or {}).get("primary")
    if not ds_key:
        return ""
    ds = dashboard["dataSources"].get(ds_key, {})
    return ((ds.get("options") or {}).get("query") or "")


def _style_singlevalue(viz: dict, semantics: list[str], theme: ThemeConfig) -> None:
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
```

- [ ] **Step 4: Run — expect all 11 tests pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_theme.py -v
```

Expected: 11 passed (6 from T1 + 5 new).

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/theme.py plugins/splunk-dashboards/tests/test_theme.py
git commit -m "feat(splunk-dashboards): add apply_theme function with semantic styling"
```

---

### Task T3: Integrate theme into `build_dashboard` + CLI flag (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_create.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/create.py`

- [ ] **Step 1: Append failing tests**

Append to `plugins/splunk-dashboards/tests/test_create.py`:

```python
def test_build_dashboard_applies_soc_theme():
    layout = Layout(project="x", panels=[
        Panel(id="p1", title="Failed Logins", viz_type="splunk.singlevalue", data_source_ref="q1"),
    ])
    data = DataSources(project="x", sources=[
        DataSource(question="q1", spl="index=auth action=failure | stats count", name="Failed Logins"),
    ])
    result = build_dashboard(layout, data, title="SOC Dashboard", description="", with_time_input=False, theme="soc")
    viz = result["visualizations"]["viz_p1"]
    # SOC theme colored the failure singlevalue red
    assert viz["options"]["majorColor"] == "#dc4e41"
    # And added a markdown header panel
    header_ids = [k for k, v in result["visualizations"].items() if v["type"] == "splunk.markdown"]
    assert len(header_ids) == 1


def test_cli_build_theme_flag(tmp_path, monkeypatch):
    _prepare_workspace_at_designed(tmp_path, monkeypatch)
    result = _run_cli(
        ["build", "my-dash", "--title", "T", "--description", "", "--theme", "soc", "--no-time-input"],
        cwd=tmp_path,
    )
    assert result.returncode == 0, result.stderr
    dashboard = json.loads((tmp_path / ".splunk-dashboards" / "my-dash" / "dashboard.json").read_text())
    # Theme applied → header panel present
    header_ids = [k for k, v in dashboard["visualizations"].items() if v["type"] == "splunk.markdown"]
    assert len(header_ids) == 1
```

- [ ] **Step 2: Run — fail (theme kwarg + CLI flag don't exist)**

- [ ] **Step 3: Update `build_dashboard` + CLI in `create.py`**

In `create.py`:

1. Add import at the top:
   ```python
   from splunk_dashboards.theme import apply_theme
   ```

2. Update `build_dashboard` signature and add theme-apply call at the end, just before `return`:

   ```python
   def build_dashboard(
       layout: Layout,
       data: DataSources,
       title: str,
       description: str,
       with_time_input: bool = True,
       layout_type: str = "absolute",
       theme: str = "clean",
   ) -> dict:
       # ... existing body unchanged ...

       # Build the return dict as before, assign to a local variable instead of returning directly
       dashboard = {
           "title": title,
           # ... rest of existing dict ...
       }
       apply_theme(dashboard, theme)
       return dashboard
   ```

   (If the current function returns the dict literal directly, refactor to a local variable first, then apply_theme, then return.)

3. In `_cli`, add a `--theme` argument:

   ```python
   build.add_argument("--theme", choices=["clean", "soc", "ops", "exec"], default="clean",
                      help="Visual theme (default: clean, no-op)")
   ```

   And pass it to `build_dashboard`:

   ```python
   dashboard = build_dashboard(
       layout, data,
       title=args.title,
       description=args.description,
       with_time_input=not args.no_time_input,
       layout_type=args.layout,
       theme=args.theme,
   )
   ```

- [ ] **Step 4: Run**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: **102 passed** (92 prior + 5 theme apply + 2 create theme = actually let me recount: 92 + 6 (T1) + 5 (T2) + 2 (T3) = 105... but some of these overlap with existing tests? No, T1-T3 are all new).

Recount properly:
- Prior: 92
- T1 new: 6
- T2 new: 5
- T3 new: 2
- Total: 92 + 13 = 105

Plan header says 102. Adjusting expected count to **105**.

- [ ] **Step 5: Update `skills/ds-create/SKILL.md`**

Append a new section "## Theme" near the end of `plugins/splunk-dashboards/skills/ds-create/SKILL.md`:

```markdown
## Theme

Pass `--theme {clean|soc|ops|exec}` to apply visual styling. Default is `clean` (no-op).

- **clean** — minimal, preserves Splunk defaults.
- **soc** — security-ops palette. Failures render red, successes green, with sparklines on count-type KPIs.
- **ops** — cool-blue operations palette with traffic-light semantic coloring.
- **exec** — muted executive palette with subtle accents for critical states.

Non-`clean` themes also:
- Set `seriesColors` on chart-type visualizations from the theme's palette.
- Hide minor gridlines for a cleaner look.
- Insert an automatic `splunk.markdown` header panel at the top with the dashboard title and description.

The semantic engine reads each panel's SPL and title to detect tags (`failure`, `success`, `latency`, `count`, `volume`, `critical`) and applies the theme's color for the most specific match.
```

- [ ] **Step 6: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/create.py plugins/splunk-dashboards/tests/test_create.py plugins/splunk-dashboards/skills/ds-create/SKILL.md
git commit -m "feat(splunk-dashboards): integrate theme engine into ds-create + --theme CLI flag"
```

---

### Task Z: Final verification + push

- [ ] **Step 1: Full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: **105 passed**, 0 failed.

- [ ] **Step 2: Push + fast-forward main**

```bash
git push
git checkout main
git merge --ff-only splunk-dashboards-foundation
git push origin main
git checkout splunk-dashboards-foundation
```

---

## What this sub-plan delivers

- `theme.py` with four bundled themes (`clean`, `soc`, `ops`, `exec`) and a keyword-based semantic detector that reads SPL + title for tags.
- `apply_theme(dashboard, theme_name)` mutator that styles single-value KPIs (majorColor via semantic match + sparkline), charts (seriesColors + minor-gridline defaults), and inserts a markdown header panel.
- `build_dashboard(..., theme="...")` kwarg + `--theme` CLI flag.
- 13 new tests (total 105).
- `ds-create` SKILL.md documents the theme flag.

**Before vs. after example:** A KPI panel that currently renders as the plain number `42` becomes a red tile with the number `42`, a 24h sparkline below it, and a dashboard header above it with the title "SOC Dashboard". The viz types the user selected stay the same — only the options gain themed polish.
