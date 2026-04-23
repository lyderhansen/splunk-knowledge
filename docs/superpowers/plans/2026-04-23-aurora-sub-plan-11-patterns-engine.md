# Aurora Sub-plan 11: Composition patterns engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the six Aurora composition patterns (`card-kpi`, `hero-kpi`, `sparkline-in-kpi`, `compare-prev`, `annotations`, `section-zones`), a `PATTERNS` registry, and an `aurora.py` orchestrator that applies theme + patterns to a dashboard JSON dict. Extend `ds-create` with `--pattern` CLI flag.

**Architecture:** New `patterns/` package — one module per pattern, each exposing `apply(dashboard, theme, tokens) -> None`. Auto-discovery registers patterns on import. `aurora.apply(dashboard, theme=..., patterns=[...])` is the orchestrator that theme_engine's `apply_theme` is called from first, then patterns in order. Skipping occurs for patterns that aren't valid for the current layout (e.g. rectangle-based patterns skip on grid layout).

**Tech Stack:** Python 3.9+ stdlib. Pytest. No new runtime deps.

**Depends on:** Sub-plan 10 (tokens.py, themes.py, theme_engine.py must exist).

---

## File structure

```
plugins/splunk-dashboards/
├── src/splunk_dashboards/
│   ├── patterns/
│   │   ├── __init__.py             # NEW — PATTERNS registry + auto-discovery
│   │   ├── card_kpi.py             # NEW
│   │   ├── hero_kpi.py             # NEW
│   │   ├── sparkline_in_kpi.py     # NEW
│   │   ├── compare_prev.py         # NEW
│   │   ├── annotations.py          # NEW
│   │   └── section_zones.py        # NEW
│   ├── aurora.py                   # NEW — orchestrator apply()
│   └── create.py                   # MODIFIED — add --pattern CLI flag
└── tests/
    ├── test_patterns_registry.py   # NEW
    ├── test_pattern_card_kpi.py    # NEW
    ├── test_pattern_hero_kpi.py    # NEW
    ├── test_pattern_sparkline_in_kpi.py  # NEW
    ├── test_pattern_compare_prev.py      # NEW
    ├── test_pattern_annotations.py       # NEW
    ├── test_pattern_section_zones.py     # NEW
    └── test_aurora.py              # NEW — integration
```

Test count after sub-plan 11: ~117–120 + 30–35 = ~147–155.

---

### Task T11-1: Patterns registry

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/patterns/__init__.py`
- Create: `plugins/splunk-dashboards/tests/test_patterns_registry.py`

- [ ] **Step 1: Write failing test**

Create `plugins/splunk-dashboards/tests/test_patterns_registry.py`:

```python
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_patterns_registry.py -v
```

Expected: FAIL — `ModuleNotFoundError: splunk_dashboards.patterns`.

- [ ] **Step 3: Create the package**

Create `plugins/splunk-dashboards/src/splunk_dashboards/patterns/__init__.py`:

```python
"""Aurora composition patterns — registry and auto-discovery.

Each pattern is a callable: apply(dashboard: dict, theme: Theme, tokens) -> None
that mutates the dashboard in place. Patterns are registered at module import
time; importing this package auto-imports every sibling module so their
register_pattern() calls run.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict

from splunk_dashboards.themes import Theme
from splunk_dashboards import tokens as _tokens_module


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

from splunk_dashboards.patterns import (  # noqa: E402, F401
    card_kpi,
    hero_kpi,
    sparkline_in_kpi,
    compare_prev,
    annotations,
    section_zones,
)
```

Note: the test will still fail at this point because the sibling modules don't exist yet. We add them in the next tasks. After T11-7 all six pattern modules will exist and this test will pass.

- [ ] **Step 4: Commit the registry scaffold**

Since we can't run the registry test green without the pattern modules, commit the registry as a WIP that we'll complete in T11-2 through T11-7:

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/patterns/__init__.py plugins/splunk-dashboards/tests/test_patterns_registry.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): patterns registry scaffold

Pattern dataclass + PATTERNS dict + register/get/list helpers.
Pattern module imports will light up as each pattern lands in T11-2..T11-7.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T11-2: Pattern — card-kpi

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/patterns/card_kpi.py`
- Create: `plugins/splunk-dashboards/tests/test_pattern_card_kpi.py`

- [ ] **Step 1: Write failing test**

Create `plugins/splunk-dashboards/tests/test_pattern_card_kpi.py`:

```python
"""Tests for card-kpi pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard_with_kpi_row():
    return {
        "title": "T", "dataSources": {},
        "visualizations": {
            "viz_p1": {"type": "splunk.singlevalue", "title": "Events", "dataSources": {}, "options": {}},
            "viz_p2": {"type": "splunk.singlevalue", "title": "Uptime", "dataSources": {}, "options": {}},
            "viz_p3": {"type": "splunk.singlevalue", "title": "p95",    "dataSources": {}, "options": {}},
            "viz_p4": {"type": "splunk.singlevalue", "title": "Alerts", "dataSources": {}, "options": {}},
        },
        "layout": {
            "type": "absolute", "options": {"width": 1440},
            "structure": [
                {"item": "viz_p1", "type": "block", "position": {"x": 20,  "y": 20, "w": 320, "h": 140}},
                {"item": "viz_p2", "type": "block", "position": {"x": 360, "y": 20, "w": 320, "h": 140}},
                {"item": "viz_p3", "type": "block", "position": {"x": 700, "y": 20, "w": 320, "h": 140}},
                {"item": "viz_p4", "type": "block", "position": {"x": 1040,"y": 20, "w": 320, "h": 140}},
            ],
        },
    }


def test_card_kpi_inserts_rectangle_before_kpi_panels():
    from splunk_dashboards.patterns.card_kpi import apply
    d = _dashboard_with_kpi_row()
    theme = get_theme("pro")
    apply(d, theme, T)
    # A splunk.rectangle viz is added
    rects = [v for v in d["visualizations"].values() if v["type"] == "splunk.rectangle"]
    assert len(rects) == 1
    r = rects[0]
    assert r["options"]["fillColor"] == "#15161a"
    assert r["options"]["strokeColor"] == "#2C2C3A"
    assert r["options"]["rx"] == 8
    assert r["options"]["ry"] == 8


def test_card_kpi_rectangle_rendered_before_kpi_panels():
    """Rectangle must appear earlier in layout.structure (renders behind)."""
    from splunk_dashboards.patterns.card_kpi import apply
    d = _dashboard_with_kpi_row()
    apply(d, get_theme("pro"), T)
    structure = d["layout"]["structure"]
    # Find rectangle entry index
    rect_idx = next(i for i, e in enumerate(structure) if e["item"].startswith("viz_card_"))
    # All KPI entries must have higher index (render later = on top)
    kpi_indices = [i for i, e in enumerate(structure) if e["item"] in ("viz_p1", "viz_p2", "viz_p3", "viz_p4")]
    assert all(i > rect_idx for i in kpi_indices)


def test_card_kpi_rectangle_wraps_kpi_bounding_box():
    """Rectangle position covers the KPI row with 10px inset."""
    from splunk_dashboards.patterns.card_kpi import apply
    d = _dashboard_with_kpi_row()
    apply(d, get_theme("pro"), T)
    structure = d["layout"]["structure"]
    rect = next(e for e in structure if e["item"].startswith("viz_card_"))
    pos = rect["position"]
    # KPIs span x=20 to x=1360 (1040+320), y=20 to y=160 (20+140)
    # Rectangle should extend 10px outside on each side
    assert pos["x"] == 10
    assert pos["y"] == 10
    assert pos["w"] == 1360
    assert pos["h"] == 160


def test_card_kpi_no_op_on_grid_layout():
    """Pattern skips silently when layout.type != 'absolute'."""
    from splunk_dashboards.patterns.card_kpi import apply
    d = _dashboard_with_kpi_row()
    d["layout"]["type"] = "grid"
    rect_count_before = sum(1 for v in d["visualizations"].values() if v["type"] == "splunk.rectangle")
    apply(d, get_theme("pro"), T)
    rect_count_after = sum(1 for v in d["visualizations"].values() if v["type"] == "splunk.rectangle")
    assert rect_count_before == rect_count_after  # no rectangle added


def test_card_kpi_no_op_when_no_kpi_panels():
    """If there are no singlevalue panels, pattern does nothing."""
    from splunk_dashboards.patterns.card_kpi import apply
    d = {"title": "T", "dataSources": {}, "visualizations": {},
         "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []}}
    apply(d, get_theme("pro"), T)
    assert d["visualizations"] == {}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_card_kpi.py -v
```

Expected: FAIL — `ModuleNotFoundError`.

- [ ] **Step 3: Implement the pattern**

Create `plugins/splunk-dashboards/src/splunk_dashboards/patterns/card_kpi.py`:

```python
"""card-kpi pattern — insert a splunk.rectangle behind a KPI row for depth.

The rectangle uses theme.panel as fill, theme.panel_stroke as stroke, radius 8.
Layering is controlled via layout.structure array order (earlier = behind).
Skips when layout.type is not 'absolute'.
"""
from __future__ import annotations

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


SINGLEVALUE_TYPES = {
    "splunk.singlevalue", "splunk.singlevalueicon", "splunk.singlevalueradial",
    "splunk.markergauge", "splunk.fillergauge",
}


def _kpi_entries(dashboard: dict) -> list:
    kpis = []
    for entry in dashboard["layout"].get("structure", []):
        viz_id = entry.get("item")
        vtype = dashboard["visualizations"].get(viz_id, {}).get("type", "")
        if vtype in SINGLEVALUE_TYPES:
            kpis.append(entry)
    return kpis


def _bounding_box(entries: list, inset: int = -10) -> dict:
    """Axis-aligned bounding box with `inset` offset outward."""
    xs = [e["position"]["x"] for e in entries]
    ys = [e["position"]["y"] for e in entries]
    rights = [e["position"]["x"] + e["position"]["w"] for e in entries]
    bottoms = [e["position"]["y"] + e["position"]["h"] for e in entries]
    x = min(xs) + inset
    y = min(ys) + inset
    w = max(rights) - min(xs) - 2 * inset
    h = max(bottoms) - min(ys) - 2 * inset
    return {"x": x, "y": y, "w": w, "h": h}


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    # Skip unless absolute layout
    if dashboard["layout"].get("type") != "absolute":
        return
    kpis = _kpi_entries(dashboard)
    if not kpis:
        return
    # Only apply if KPIs are in roughly the same row (y within 40px of each other)
    ys = [k["position"]["y"] for k in kpis]
    if max(ys) - min(ys) > 40:
        return

    card_id = "viz_card_kpi_row"
    dashboard["visualizations"][card_id] = {
        "type": "splunk.rectangle",
        "title": "",
        "dataSources": {},
        "options": {
            "fillColor": theme.panel,
            "strokeColor": theme.panel_stroke,
            "fillOpacity": 1,
            "strokeOpacity": 1,
            "rx": tokens.R_CARD,
            "ry": tokens.R_CARD,
        },
    }
    bbox = _bounding_box(kpis, inset=-10)
    rect_entry = {"item": card_id, "type": "block", "position": bbox}

    # Insert rectangle entry BEFORE the first KPI entry in structure
    structure = dashboard["layout"]["structure"]
    first_kpi_idx = min(structure.index(k) for k in kpis)
    structure.insert(first_kpi_idx, rect_entry)


register_pattern(Pattern(name="card-kpi", apply=apply))
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_card_kpi.py tests/test_patterns_registry.py -v
```

Expected: 4 tests in test_pattern_card_kpi.py passed. `test_patterns_registry.py` is still failing on the `six_patterns` test because only 1 of 6 is registered — that's expected.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/patterns/card_kpi.py plugins/splunk-dashboards/tests/test_pattern_card_kpi.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): card-kpi pattern

Insert splunk.rectangle behind a KPI row (same y ±40px) with theme
panel fill, stroke, and rx=8. Skips on non-absolute layouts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T11-3: Pattern — hero-kpi

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/patterns/hero_kpi.py`
- Create: `plugins/splunk-dashboards/tests/test_pattern_hero_kpi.py`

- [ ] **Step 1: Write failing test**

Create `plugins/splunk-dashboards/tests/test_pattern_hero_kpi.py`:

```python
"""Tests for hero-kpi pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard_with_kpis(hero_flag_on="viz_p1"):
    vizs = {
        "viz_p1": {"type": "splunk.singlevalue", "title": "Revenue", "dataSources": {}, "options": {},
                   "hero": hero_flag_on == "viz_p1"},
        "viz_p2": {"type": "splunk.singlevalue", "title": "Users",   "dataSources": {}, "options": {}},
        "viz_p3": {"type": "splunk.singlevalue", "title": "Churn",   "dataSources": {}, "options": {}},
    }
    return {
        "title": "T", "dataSources": {},
        "visualizations": vizs,
        "layout": {
            "type": "absolute", "options": {"width": 1440},
            "structure": [
                {"item": "viz_p1", "type": "block", "position": {"x": 20,  "y": 20, "w": 320, "h": 140}},
                {"item": "viz_p2", "type": "block", "position": {"x": 360, "y": 20, "w": 320, "h": 140}},
                {"item": "viz_p3", "type": "block", "position": {"x": 700, "y": 20, "w": 320, "h": 140}},
            ],
        },
    }


def test_hero_kpi_resizes_flagged_panel():
    from splunk_dashboards.patterns.hero_kpi import apply
    d = _dashboard_with_kpis()
    apply(d, get_theme("glass"), T)
    hero_entry = next(e for e in d["layout"]["structure"] if e["item"] == "viz_p1")
    # Hero panel grows to 2.5x width, 1.5x height
    assert hero_entry["position"]["w"] == 800
    assert hero_entry["position"]["h"] == 210


def test_hero_kpi_sets_oversized_font_and_sparkline():
    from splunk_dashboards.patterns.hero_kpi import apply
    d = _dashboard_with_kpis()
    apply(d, get_theme("glass"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert opts["majorValueSize"] == 64
    assert opts["sparklineDisplay"] == "below"
    assert opts["trendDisplay"] == "percent"
    assert opts["showSparklineAreaGraph"] is True


def test_hero_kpi_falls_back_to_first_singlevalue_when_no_flag():
    """When no panel has hero:true, promote the first singlevalue."""
    from splunk_dashboards.patterns.hero_kpi import apply
    d = _dashboard_with_kpis(hero_flag_on="")
    apply(d, get_theme("glass"), T)
    hero_entry = next(e for e in d["layout"]["structure"] if e["item"] == "viz_p1")
    assert hero_entry["position"]["w"] == 800


def test_hero_kpi_no_op_if_no_singlevalues():
    from splunk_dashboards.patterns.hero_kpi import apply
    d = {"title": "T", "dataSources": {}, "visualizations": {},
         "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []}}
    apply(d, get_theme("glass"), T)
    assert d["visualizations"] == {}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_hero_kpi.py -v
```

Expected: FAIL — ModuleNotFoundError.

- [ ] **Step 3: Implement the pattern**

Create `plugins/splunk-dashboards/src/splunk_dashboards/patterns/hero_kpi.py`:

```python
"""hero-kpi pattern — promote one singlevalue to 2x size with sparkline + delta.

A panel marked `hero: true` in layout.json becomes the hero. If none is flagged,
the first splunk.singlevalue panel is promoted.
"""
from __future__ import annotations

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


def _find_hero_viz_id(dashboard: dict) -> str | None:
    # Explicit flag wins
    for viz_id, viz in dashboard["visualizations"].items():
        if viz.get("type") == "splunk.singlevalue" and viz.get("hero"):
            return viz_id
    # Fallback: first singlevalue in structure order
    for entry in dashboard["layout"].get("structure", []):
        viz_id = entry.get("item")
        if dashboard["visualizations"].get(viz_id, {}).get("type") == "splunk.singlevalue":
            return viz_id
    return None


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    hero_id = _find_hero_viz_id(dashboard)
    if not hero_id:
        return
    # Promote the viz
    viz = dashboard["visualizations"][hero_id]
    options = viz.setdefault("options", {})
    options["majorValueSize"] = tokens.FS_KPI_MAJOR + 16  # 64 — between major and hero
    options["sparklineDisplay"] = "below"
    options["showSparklineAreaGraph"] = True
    options["trendDisplay"] = "percent"
    options.setdefault("sparklineStrokeColor", theme.accent)

    # Expand its layout position
    for entry in dashboard["layout"].get("structure", []):
        if entry.get("item") == hero_id:
            entry["position"]["w"] = 800   # ~2.5x standard 320
            entry["position"]["h"] = 210   # ~1.5x standard 140
            break


register_pattern(Pattern(name="hero-kpi", apply=apply))
```

- [ ] **Step 4: Run tests**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_hero_kpi.py -v
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/patterns/hero_kpi.py plugins/splunk-dashboards/tests/test_pattern_hero_kpi.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): hero-kpi pattern

Promote one singlevalue (flagged or first) to 2.5x width, 1.5x height,
with majorValueSize=64, sparklineDisplay=below, trendDisplay=percent.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T11-4: Pattern — sparkline-in-kpi

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/patterns/sparkline_in_kpi.py`
- Create: `plugins/splunk-dashboards/tests/test_pattern_sparkline_in_kpi.py`

- [ ] **Step 1: Write failing test**

Create `plugins/splunk-dashboards/tests/test_pattern_sparkline_in_kpi.py`:

```python
"""Tests for sparkline-in-kpi pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard(spl="index=main | timechart count"):
    return {
        "title": "T",
        "dataSources": {
            "ds_1": {"type": "ds.search", "options": {"query": spl}},
        },
        "visualizations": {
            "viz_p1": {
                "type": "splunk.singlevalue", "title": "Events",
                "dataSources": {"primary": "ds_1"}, "options": {},
            },
        },
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []},
    }


def test_sparkline_applies_to_timeseries_singlevalue():
    from splunk_dashboards.patterns.sparkline_in_kpi import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert opts["sparklineDisplay"] == "below"
    assert opts["showSparklineAreaGraph"] is True
    assert opts["sparklineStrokeColor"] == "#006D9C"  # pro accent


def test_sparkline_skips_non_timeseries_singlevalue():
    """Skip singlevalues whose SPL has no | timechart or | bin _time."""
    from splunk_dashboards.patterns.sparkline_in_kpi import apply
    d = _dashboard(spl="index=main | stats count")  # no timechart
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert "sparklineDisplay" not in opts


def test_sparkline_preserves_hero_settings():
    """If hero-kpi already set sparklineDisplay, do not overwrite."""
    from splunk_dashboards.patterns.sparkline_in_kpi import apply
    d = _dashboard()
    d["visualizations"]["viz_p1"]["options"]["sparklineDisplay"] = "before"  # hero set it
    d["visualizations"]["viz_p1"]["options"]["majorValueSize"] = 64
    apply(d, get_theme("pro"), T)
    # Should stay 'before', not be overwritten to 'below'
    assert d["visualizations"]["viz_p1"]["options"]["sparklineDisplay"] == "before"


def test_sparkline_no_op_on_non_singlevalue():
    from splunk_dashboards.patterns.sparkline_in_kpi import apply
    d = _dashboard()
    d["visualizations"]["viz_p1"]["type"] = "splunk.line"
    apply(d, get_theme("pro"), T)
    assert "sparklineDisplay" not in d["visualizations"]["viz_p1"]["options"]
```

- [ ] **Step 2: Run to verify failure**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_sparkline_in_kpi.py -v
```

Expected: FAIL — ModuleNotFoundError.

- [ ] **Step 3: Implement the pattern**

Create `plugins/splunk-dashboards/src/splunk_dashboards/patterns/sparkline_in_kpi.py`:

```python
"""sparkline-in-kpi pattern — add sparkline-below to every time-series singlevalue."""
from __future__ import annotations

import re

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


TIMESERIES_PATTERNS = [
    re.compile(r"\|\s*timechart\b", re.I),
    re.compile(r"\|\s*bin\s+_time\b", re.I),
]


def _is_timeseries(spl: str) -> bool:
    return any(p.search(spl) for p in TIMESERIES_PATTERNS)


def _spl_for_viz(viz: dict, dashboard: dict) -> str:
    ds_key = (viz.get("dataSources") or {}).get("primary")
    if not ds_key:
        return ""
    return ((dashboard["dataSources"].get(ds_key, {}).get("options") or {}).get("query") or "")


def _alpha_hex(hex_color: str, alpha: float) -> str:
    """Convert #RRGGBB to rgba(r,g,b,alpha)."""
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r},{g},{b},{alpha})"


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    for viz_id, viz in dashboard.get("visualizations", {}).items():
        if viz.get("type") != "splunk.singlevalue":
            continue
        spl = _spl_for_viz(viz, dashboard)
        if not _is_timeseries(spl):
            continue
        options = viz.setdefault("options", {})
        # Don't overwrite if hero-kpi already set sparkline behavior
        if "sparklineDisplay" in options:
            continue
        options["sparklineDisplay"] = "below"
        options["showSparklineAreaGraph"] = True
        options["sparklineStrokeColor"] = theme.accent
        options["sparklineAreaColor"] = _alpha_hex(theme.accent, 0.15)


register_pattern(Pattern(name="sparkline-in-kpi", apply=apply))
```

- [ ] **Step 4: Run tests**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_sparkline_in_kpi.py -v
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/patterns/sparkline_in_kpi.py plugins/splunk-dashboards/tests/test_pattern_sparkline_in_kpi.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): sparkline-in-kpi pattern

Adds sparklineDisplay=below + theme-accent fill to every singlevalue
backed by a time-series SPL (| timechart or | bin _time). Skips if
hero-kpi already configured the panel.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T11-5: Pattern — compare-prev

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/patterns/compare_prev.py`
- Create: `plugins/splunk-dashboards/tests/test_pattern_compare_prev.py`

- [ ] **Step 1: Write failing test**

Create `plugins/splunk-dashboards/tests/test_pattern_compare_prev.py`:

```python
"""Tests for compare-prev pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard(vtype="splunk.line", spl="index=main | timechart count"):
    return {
        "title": "T",
        "dataSources": {
            "ds_1": {"type": "ds.search", "options": {"query": spl}},
        },
        "visualizations": {
            "viz_p1": {
                "type": vtype, "title": "Requests",
                "dataSources": {"primary": "ds_1"}, "options": {},
            },
        },
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []},
    }


def test_compare_prev_rewrites_spl_to_add_timewrap():
    from splunk_dashboards.patterns.compare_prev import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    spl = d["dataSources"]["ds_1"]["options"]["query"]
    assert "| timewrap" in spl.lower()


def test_compare_prev_sets_series_colors_and_dash_style():
    from splunk_dashboards.patterns.compare_prev import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    # Both seriesColorsByField and lineDashStylesByField should be set
    assert "seriesColorsByField" in opts
    assert "lineDashStylesByField" in opts
    # Any field containing '1' (like "count_1day_before") dashed
    dashes = opts["lineDashStylesByField"]
    assert any("before" in k or "prev" in k.lower() for k in dashes.keys())


def test_compare_prev_skips_non_timeseries_spl():
    from splunk_dashboards.patterns.compare_prev import apply
    d = _dashboard(spl="index=main | stats count")  # no | timechart
    apply(d, get_theme("pro"), T)
    spl = d["dataSources"]["ds_1"]["options"]["query"]
    assert "timewrap" not in spl.lower()


def test_compare_prev_only_line_and_area():
    """Pattern applies on splunk.line and splunk.area; skips others."""
    from splunk_dashboards.patterns.compare_prev import apply
    d = _dashboard(vtype="splunk.pie")
    apply(d, get_theme("pro"), T)
    assert "timewrap" not in d["dataSources"]["ds_1"]["options"]["query"].lower()
    assert "seriesColorsByField" not in d["visualizations"]["viz_p1"]["options"]


def test_compare_prev_idempotent():
    """Applying twice does not double-wrap the SPL."""
    from splunk_dashboards.patterns.compare_prev import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    spl_once = d["dataSources"]["ds_1"]["options"]["query"]
    apply(d, get_theme("pro"), T)
    spl_twice = d["dataSources"]["ds_1"]["options"]["query"]
    assert spl_once == spl_twice
```

- [ ] **Step 2: Run to verify failure**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_compare_prev.py -v
```

Expected: FAIL — ModuleNotFoundError.

- [ ] **Step 3: Implement the pattern**

Create `plugins/splunk-dashboards/src/splunk_dashboards/patterns/compare_prev.py`:

```python
"""compare-prev pattern — dashed previous-period overlay on line/area charts.

Rewrites data source SPL to append `| timewrap 1d` (a reasonable default),
then configures the viz to render the previous period in grey + dashed.
"""
from __future__ import annotations

import re

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


TIMESERIES_RE = re.compile(r"\|\s*timechart\b", re.I)
TIMEWRAP_RE = re.compile(r"\|\s*timewrap\b", re.I)


def _spl_for_viz(viz: dict, dashboard: dict) -> str:
    ds_key = (viz.get("dataSources") or {}).get("primary")
    if not ds_key:
        return ""
    return ((dashboard["dataSources"].get(ds_key, {}).get("options") or {}).get("query") or "")


def _ds_key_for_viz(viz: dict) -> str | None:
    return (viz.get("dataSources") or {}).get("primary")


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    for viz_id, viz in dashboard.get("visualizations", {}).items():
        if viz.get("type") not in ("splunk.line", "splunk.area"):
            continue
        ds_key = _ds_key_for_viz(viz)
        if not ds_key:
            continue
        spl = _spl_for_viz(viz, dashboard)
        if not TIMESERIES_RE.search(spl):
            continue
        if TIMEWRAP_RE.search(spl):
            # Already wrapped — skip to keep idempotent
            pass
        else:
            new_spl = spl.rstrip() + " | timewrap 1d"
            dashboard["dataSources"][ds_key]["options"]["query"] = new_spl

        options = viz.setdefault("options", {})
        # After timewrap, field names follow the pattern: count_latest_day, count_1day_before
        options.setdefault("seriesColorsByField", {
            "count_latest_day": theme.accent,
            "count_1day_before": theme.text_secondary,
        })
        options.setdefault("lineDashStylesByField", {
            "count_1day_before": "dashed",
        })


register_pattern(Pattern(name="compare-prev", apply=apply))
```

- [ ] **Step 4: Run tests**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_compare_prev.py -v
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/patterns/compare_prev.py plugins/splunk-dashboards/tests/test_pattern_compare_prev.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): compare-prev pattern

Appends | timewrap 1d to line/area SPL producing current/previous
series. Sets seriesColorsByField + lineDashStylesByField so previous
period renders dashed in the theme's text-secondary color.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T11-6: Pattern — annotations

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/patterns/annotations.py`
- Create: `plugins/splunk-dashboards/tests/test_pattern_annotations.py`

- [ ] **Step 1: Write failing test**

Create `plugins/splunk-dashboards/tests/test_pattern_annotations.py`:

```python
"""Tests for annotations pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard(vtype="splunk.line"):
    return {
        "title": "T",
        "dataSources": {
            "ds_1": {"type": "ds.search", "options": {"query": "index=main | timechart count"}},
        },
        "visualizations": {
            "viz_p1": {
                "type": vtype, "title": "Requests",
                "dataSources": {"primary": "ds_1"}, "options": {},
            },
        },
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []},
    }


def test_annotations_adds_secondary_ds_for_annotations():
    from splunk_dashboards.patterns.annotations import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    # A new ds entry keyed ds_annotations_* is added
    ann_keys = [k for k in d["dataSources"].keys() if k.startswith("ds_annotations_")]
    assert len(ann_keys) == 1
    # Its SPL pulls from an annotations lookup
    spl = d["dataSources"][ann_keys[0]]["options"]["query"]
    assert "inputlookup" in spl.lower() or "annotations" in spl.lower()


def test_annotations_binds_viz_options_to_secondary_ds():
    from splunk_dashboards.patterns.annotations import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    opts = d["visualizations"]["viz_p1"]["options"]
    assert "annotationX" in opts
    assert "annotationLabel" in opts
    assert "annotationColor" in opts


def test_annotations_applies_only_to_line_area_column():
    from splunk_dashboards.patterns.annotations import apply
    for vtype in ("splunk.line", "splunk.area", "splunk.column"):
        d = _dashboard(vtype=vtype)
        apply(d, get_theme("pro"), T)
        assert "annotationX" in d["visualizations"]["viz_p1"]["options"]


def test_annotations_skips_pie_bar_table():
    from splunk_dashboards.patterns.annotations import apply
    for vtype in ("splunk.pie", "splunk.bar", "splunk.table"):
        d = _dashboard(vtype=vtype)
        apply(d, get_theme("pro"), T)
        assert "annotationX" not in d["visualizations"]["viz_p1"]["options"]


def test_annotations_idempotent():
    from splunk_dashboards.patterns.annotations import apply
    d = _dashboard()
    apply(d, get_theme("pro"), T)
    key_count_once = len([k for k in d["dataSources"] if k.startswith("ds_annotations_")])
    apply(d, get_theme("pro"), T)
    key_count_twice = len([k for k in d["dataSources"] if k.startswith("ds_annotations_")])
    assert key_count_once == key_count_twice
```

- [ ] **Step 2: Run to verify failure**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_annotations.py -v
```

Expected: FAIL — ModuleNotFoundError.

- [ ] **Step 3: Implement the pattern**

Create `plugins/splunk-dashboards/src/splunk_dashboards/patterns/annotations.py`:

```python
"""annotations pattern — event markers on line/area/column charts.

Creates a secondary ds.search (placeholder, using inputlookup annotations.csv)
and binds it to each eligible viz via annotationX/Label/Color options.
Users replace the placeholder SPL with their real annotation source.
"""
from __future__ import annotations

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


ANNOTATION_TYPES = {"splunk.line", "splunk.area", "splunk.column"}


def _annotation_ds_key_for(viz_id: str) -> str:
    return f"ds_annotations_{viz_id}"


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    for viz_id, viz in dashboard.get("visualizations", {}).items():
        if viz.get("type") not in ANNOTATION_TYPES:
            continue
        ds_key = _annotation_ds_key_for(viz_id)
        if ds_key not in dashboard["dataSources"]:
            dashboard["dataSources"][ds_key] = {
                "type": "ds.search",
                "name": f"annotations for {viz_id}",
                "options": {
                    "query": "| inputlookup annotations.csv | eval _time = strptime(timestamp, \"%Y-%m-%dT%H:%M:%S\")",
                },
            }
        options = viz.setdefault("options", {})
        options["annotationX"] = f"> {ds_key} | seriesByName('_time')"
        options["annotationLabel"] = f"> {ds_key} | seriesByName('label')"
        options["annotationColor"] = f"> {ds_key} | seriesByName('color')"


register_pattern(Pattern(name="annotations", apply=apply))
```

- [ ] **Step 4: Run tests**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_annotations.py -v
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/patterns/annotations.py plugins/splunk-dashboards/tests/test_pattern_annotations.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): annotations pattern

Adds a secondary ds.search (placeholder inputlookup annotations.csv)
and binds annotationX/Label/Color options on every eligible chart
(line, area, column). Users replace the placeholder SPL with their
real annotation source.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T11-7: Pattern — section-zones

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/patterns/section_zones.py`
- Create: `plugins/splunk-dashboards/tests/test_pattern_section_zones.py`

- [ ] **Step 1: Write failing test**

Create `plugins/splunk-dashboards/tests/test_pattern_section_zones.py`:

```python
"""Tests for section-zones pattern."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.themes import get_theme
from splunk_dashboards import tokens as T


def _dashboard_with_sections():
    """Panels tagged with 'section' metadata group into zones."""
    vizs = {}
    structure = []
    # 4 panels, 2 sections
    for i, (section, y) in enumerate([("Availability", 20), ("Availability", 180),
                                        ("Performance", 400), ("Performance", 560)], start=1):
        vizs[f"viz_p{i}"] = {
            "type": "splunk.singlevalue", "title": f"Metric {i}",
            "dataSources": {}, "options": {}, "section": section,
        }
        structure.append({"item": f"viz_p{i}", "type": "block",
                           "position": {"x": 20, "y": y, "w": 1400, "h": 140}})
    return {
        "title": "T", "dataSources": {}, "visualizations": vizs,
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": structure},
    }


def test_section_zones_adds_zone_rectangle_per_section():
    from splunk_dashboards.patterns.section_zones import apply
    d = _dashboard_with_sections()
    apply(d, get_theme("pro"), T)
    rects = [v for v in d["visualizations"].values() if v["type"] == "splunk.rectangle"]
    assert len(rects) == 2  # one per section


def test_section_zones_adds_markdown_header_per_section():
    from splunk_dashboards.patterns.section_zones import apply
    d = _dashboard_with_sections()
    apply(d, get_theme("pro"), T)
    mds = [v for v in d["visualizations"].values() if v["type"] == "splunk.markdown"]
    assert len(mds) == 2
    # Each markdown contains the section name as a level-3 heading
    md_texts = [m["options"]["markdown"] for m in mds]
    assert any("Availability" in t for t in md_texts)
    assert any("Performance" in t for t in md_texts)


def test_section_zones_no_op_when_no_sections_tagged():
    """If panels have no 'section' field, do nothing."""
    from splunk_dashboards.patterns.section_zones import apply
    d = _dashboard_with_sections()
    for v in d["visualizations"].values():
        v.pop("section", None)
    apply(d, get_theme("pro"), T)
    assert not any(v["type"] == "splunk.rectangle" for v in d["visualizations"].values())


def test_section_zones_no_op_on_grid_layout():
    from splunk_dashboards.patterns.section_zones import apply
    d = _dashboard_with_sections()
    d["layout"]["type"] = "grid"
    apply(d, get_theme("pro"), T)
    assert not any(v["type"] == "splunk.rectangle" for v in d["visualizations"].values())
```

- [ ] **Step 2: Run to verify failure**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_section_zones.py -v
```

Expected: FAIL — ModuleNotFoundError.

- [ ] **Step 3: Implement the pattern**

Create `plugins/splunk-dashboards/src/splunk_dashboards/patterns/section_zones.py`:

```python
"""section-zones pattern — group panels into labeled zones via markdown + rectangle."""
from __future__ import annotations

from splunk_dashboards.patterns import Pattern, register_pattern
from splunk_dashboards.themes import Theme


def _groups_by_section(dashboard: dict) -> dict:
    groups: dict = {}
    for viz_id, viz in dashboard["visualizations"].items():
        section = viz.get("section")
        if not section:
            continue
        groups.setdefault(section, []).append(viz_id)
    return groups


def _bounding_box_for(viz_ids: list, dashboard: dict) -> dict:
    entries = [e for e in dashboard["layout"]["structure"] if e.get("item") in viz_ids]
    if not entries:
        return None
    xs = [e["position"]["x"] for e in entries]
    ys = [e["position"]["y"] for e in entries]
    rights = [e["position"]["x"] + e["position"]["w"] for e in entries]
    bottoms = [e["position"]["y"] + e["position"]["h"] for e in entries]
    return {
        "x": min(xs) - 12,
        "y": min(ys) - 40,  # room for header
        "w": max(rights) - min(xs) + 24,
        "h": max(bottoms) - min(ys) + 52,
    }


def apply(dashboard: dict, theme: Theme, tokens) -> None:
    if dashboard["layout"].get("type") != "absolute":
        return
    groups = _groups_by_section(dashboard)
    if not groups:
        return

    for section, viz_ids in groups.items():
        bbox = _bounding_box_for(viz_ids, dashboard)
        if bbox is None:
            continue
        slug = section.lower().replace(" ", "_")
        rect_id = f"viz_zone_rect_{slug}"
        md_id = f"viz_zone_header_{slug}"

        dashboard["visualizations"][rect_id] = {
            "type": "splunk.rectangle",
            "title": "",
            "dataSources": {},
            "options": {
                "fillColor": theme.panel,
                "fillOpacity": 0.04,
                "strokeColor": theme.panel_stroke,
                "strokeOpacity": 0.6,
                "strokeWidth": 1,
                "rx": tokens.R_SUBTLE,
                "ry": tokens.R_SUBTLE,
            },
        }
        dashboard["visualizations"][md_id] = {
            "type": "splunk.markdown",
            "title": "",
            "dataSources": {},
            "options": {
                "markdown": f"### {section}",
                "fontColor": theme.text_secondary,
                "backgroundColor": "transparent",
            },
        }

        structure = dashboard["layout"]["structure"]
        # Rectangle FIRST (renders behind), then header on top of it, then panels
        structure.insert(0, {"item": rect_id, "type": "block", "position": bbox})
        structure.insert(1, {
            "item": md_id, "type": "block",
            "position": {"x": bbox["x"] + 12, "y": bbox["y"] + 8, "w": 300, "h": 28},
        })


register_pattern(Pattern(name="section-zones", apply=apply))
```

- [ ] **Step 4: Run tests + the registry test**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pattern_section_zones.py tests/test_patterns_registry.py -v
```

Expected: 4 new + 4 registry tests passed. (`test_six_patterns_registered` finally passes because all 6 modules exist.)

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/patterns/section_zones.py plugins/splunk-dashboards/tests/test_pattern_section_zones.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): section-zones pattern

Groups panels tagged with 'section' field into labeled zones:
- splunk.rectangle as zone background (fillOpacity 0.04)
- splunk.markdown as zone header (### Section)
- Layered first in structure so zone renders behind panels.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T11-8: Aurora orchestrator

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/aurora.py`
- Create: `plugins/splunk-dashboards/tests/test_aurora.py`

- [ ] **Step 1: Write failing tests**

Create `plugins/splunk-dashboards/tests/test_aurora.py`:

```python
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
    """Theme layer runs first and writes canvas backgroundColor."""
    d = _dashboard()
    apply(d, theme="noc")
    assert d["defaults"]["visualizations"]["global"]["options"]["backgroundColor"] == "#000000"


def test_apply_with_legacy_theme_name():
    """Legacy 'clean' resolves to 'pro' and runs pro defaults."""
    d = _dashboard()
    apply(d, theme="clean")
    # Should behave identically to theme="pro"
    assert d["defaults"]["visualizations"]["global"]["options"]["backgroundColor"] == "#0b0c0e"


def test_apply_patterns_argument_uses_registry_names():
    """Pass an explicit pattern list by name."""
    d = _dashboard()
    apply(d, theme="pro", patterns=["card-kpi"])
    # Only card-kpi ran — sparkline-in-kpi should NOT have fired
    assert any(v["type"] == "splunk.rectangle" for v in d["visualizations"].values())
    assert "sparklineDisplay" not in d["visualizations"]["viz_p1"]["options"]
```

- [ ] **Step 2: Run to verify failure**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_aurora.py -v
```

Expected: FAIL — `ModuleNotFoundError: splunk_dashboards.aurora`.

- [ ] **Step 3: Implement the orchestrator**

Create `plugins/splunk-dashboards/src/splunk_dashboards/aurora.py`:

```python
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
```

- [ ] **Step 4: Run tests**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_aurora.py -v
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/aurora.py plugins/splunk-dashboards/tests/test_aurora.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): Aurora orchestrator

aurora.apply(dashboard, theme, patterns=None) runs the theme engine
then walks the pattern list in order. Default = theme.default_patterns;
empty list = theme only. 'status-tile' is a noc theme concern, not a
v1 pattern module.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T11-9: Wire `ds-create --pattern` CLI

**Files:**
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/create.py`
- Modify: `plugins/splunk-dashboards/tests/test_create.py`

- [ ] **Step 1: Write failing test**

Add to `plugins/splunk-dashboards/tests/test_create.py`:

```python
def test_build_dashboard_applies_theme_defaults_by_default():
    """Without --pattern, theme's default_patterns auto-apply."""
    from splunk_dashboards.create import build_dashboard
    from splunk_dashboards.layout import Layout, Panel
    from splunk_dashboards.data_sources import DataSources, DataSource

    layout = Layout(panels=[
        Panel(id="p1", title="Events", x=0, y=0, w=4, h=3,
              viz_type="splunk.singlevalue", data_source_ref="q1"),
    ])
    data = DataSources(sources=[
        DataSource(question="q1", spl="index=m | timechart count", earliest="-24h", latest="now"),
    ])
    result = build_dashboard(layout, data, title="T", description="", theme="pro")
    # pro default includes card-kpi
    assert any(v.get("type") == "splunk.rectangle" for v in result["visualizations"].values())


def test_build_dashboard_explicit_patterns_override():
    from splunk_dashboards.create import build_dashboard
    from splunk_dashboards.layout import Layout, Panel
    from splunk_dashboards.data_sources import DataSources, DataSource

    layout = Layout(panels=[
        Panel(id="p1", title="E", x=0, y=0, w=4, h=3,
              viz_type="splunk.singlevalue", data_source_ref="q1"),
    ])
    data = DataSources(sources=[DataSource(question="q1", spl="index=m | stats count", earliest="-24h", latest="now")])
    # patterns=[] means no patterns run
    result = build_dashboard(layout, data, title="T", description="", theme="pro", patterns=[])
    assert not any(v.get("type") == "splunk.rectangle" for v in result["visualizations"].values())
```

- [ ] **Step 2: Run to verify failure**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_create.py -v -k patterns
```

Expected: FAIL — `build_dashboard() got an unexpected keyword argument 'patterns'`.

- [ ] **Step 3: Update `create.py`**

Read `plugins/splunk-dashboards/src/splunk_dashboards/create.py` first. At the top of the file, replace:

```python
from splunk_dashboards.theme import apply_theme
```

with:

```python
from splunk_dashboards.aurora import apply as aurora_apply
```

In the `build_dashboard` function signature, change:

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
```

to:

```python
def build_dashboard(
    layout: Layout,
    data: DataSources,
    title: str,
    description: str,
    with_time_input: bool = True,
    layout_type: str = "absolute",
    theme: str = "pro",
    patterns: list | None = None,
) -> dict:
```

At the END of `build_dashboard` (where it currently calls `apply_theme(dashboard, theme)`), replace that call with:

```python
aurora_apply(dashboard, theme=theme, patterns=patterns)
```

For the CLI argparse block, add after the existing `--theme` argument:

```python
parser.add_argument(
    "--pattern", action="append", default=None,
    help="Composition pattern to apply. Repeatable. E.g. --pattern card-kpi --pattern compare-prev. "
         "If omitted, the theme's default patterns apply. Pass --pattern '' to disable patterns entirely.",
)
```

And in the CLI handler (where `build_dashboard(...)` is called from the argparse branch), pass `patterns=args.pattern if args.pattern != [''] else []` or similar — adapt to the existing CLI code structure.

- [ ] **Step 4: Run tests**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_create.py -v
```

Expected: all passed, including the 2 new ones.

- [ ] **Step 5: Run full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: ~147–155 passed.

- [ ] **Step 6: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/create.py plugins/splunk-dashboards/tests/test_create.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): ds-create --pattern flag

build_dashboard() calls aurora.apply() instead of apply_theme(),
allowing explicit pattern override via --pattern. Default patterns
come from the theme. Legacy apply_theme() import replaced.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T11-Z: Full suite sanity + push

- [ ] **Step 1: Run the full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: ~147–155 passed, 0 failed.

- [ ] **Step 2: Smoke test `ds-create --theme glass --pattern hero-kpi`**

```bash
# From an existing workspace at designed stage:
cd plugins/splunk-dashboards
PYTHONPATH=src python3 -m splunk_dashboards.create build <existing-workspace> \
  --title "Aurora Smoke" --theme glass --pattern hero-kpi --pattern card-kpi
# Check generated dashboard.json:
# - dataSources/visualizations shape preserved
# - At least one viz_card_* rectangle inserted
# - One hero-KPI with majorValueSize=64 (check via jq or manual inspection)
```

- [ ] **Step 3: Push**

```bash
git push
```

---

## Deliverables when sub-plan 11 closes

- [x] 6 pattern modules implemented, each with its own test file
- [x] `PATTERNS` registry supports `register_pattern()` for extension
- [x] `aurora.apply(dashboard, theme, patterns)` orchestrator
- [x] `ds-create --pattern` CLI flag working
- [x] +30–35 new tests passing, total ~150 green
- [x] No existing tests broken

Next: sub-plan 12 (skill updates + flagship templates).
