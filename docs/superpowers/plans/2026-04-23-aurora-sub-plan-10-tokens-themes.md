# Aurora Sub-plan 10: Tokens + theme engine v2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `tokens.py` module with immutable design-token constants, refactor the theme engine to register four Aurora themes (`pro`, `glass`, `exec`, `noc`) with backwards-compatible aliases (`clean→pro`, `ops→noc`, `soc→noc`), and emit `definition.defaults` instead of per-viz mutation where possible.

**Architecture:** Two new modules (`tokens.py`, `themes.py`) hold data; the existing `theme.py` becomes a thin compatibility shim that re-exports `apply_theme` from a new `theme_engine.py`. Legacy theme names still work. `ds-create --theme` accepts the four new names plus three legacy aliases. No patterns are implemented in this sub-plan — that's sub-plan 11.

**Tech Stack:** Python 3.9+ stdlib only. `dataclasses`, `typing`. Pytest for tests.

---

## File structure

```
plugins/splunk-dashboards/
├── src/splunk_dashboards/
│   ├── tokens.py           # NEW — color/spacing/radius/type-scale constants
│   ├── themes.py           # NEW — THEMES registry with 4 Aurora themes + aliases
│   ├── theme_engine.py     # NEW — apply_theme() logic extracted from theme.py
│   ├── theme.py            # MODIFIED — thin shim re-exporting for compat
│   └── create.py           # MODIFIED — accept new theme names in CLI
├── tests/
│   ├── test_tokens.py      # NEW
│   ├── test_themes.py      # NEW
│   └── test_theme.py       # MODIFIED — legacy aliases still pass
├── viz_packs/              # NEW — empty directory reserved for Phase 2
│   └── .gitkeep
```

Test count after this sub-plan: 105 + 12–15 = ~120.

---

### Task T10-1: Create `tokens.py`

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/tokens.py`
- Create: `plugins/splunk-dashboards/tests/test_tokens.py`

- [ ] **Step 1: Write the failing test**

Create `plugins/splunk-dashboards/tests/test_tokens.py`:

```python
"""Tests for design tokens module."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards import tokens


def test_spacing_scale_matches_splunk_ui():
    # Splunk CustomVizDesign documents 5/10/15/20 as canonical distances; we extend.
    assert tokens.S_0_5 == 4
    assert tokens.S_1 == 8
    assert tokens.S_1_5 == 12
    assert tokens.S_2 == 16
    assert tokens.S_2_5 == 20
    assert tokens.S_3 == 24
    assert tokens.S_4 == 32
    assert tokens.S_6 == 48
    assert tokens.S_8 == 64


def test_radii_scale():
    assert tokens.R_SHARP == 0
    assert tokens.R_SUBTLE == 4
    assert tokens.R_CARD == 8
    assert tokens.R_HERO == 12
    assert tokens.R_PILL == 999


def test_type_scale_font_sizes():
    assert tokens.FS_TICK == 11
    assert tokens.FS_AXIS == 12
    assert tokens.FS_BODY == 14
    assert tokens.FS_LARGE == 18
    assert tokens.FS_XLARGE == 24
    assert tokens.FS_KPI_MINOR == 28
    assert tokens.FS_KPI_MAJOR == 48
    assert tokens.FS_KPI_HERO == 72


def test_splunk_categorical_10_palette_matches_official():
    # From https://splunkui.splunk.com CustomVizDesign official categorical palette.
    expected = [
        "#006D9C", "#4FA484", "#EC9960", "#AF575A", "#B6C75A",
        "#62B3B2", "#294E70", "#738795", "#EDD051", "#BD9872",
    ]
    assert tokens.SERIES_CATEGORICAL_10 == expected
    assert len(tokens.SERIES_CATEGORICAL_10) == 10


def test_soc_semantic_palette_red_first():
    # SOC priority order: critical/high/warn/ok/info/accent
    assert tokens.SERIES_SOC_8[0] == "#DC4E41"  # critical first
    assert tokens.SERIES_SOC_8[3] == "#53A051"  # ok
    assert len(tokens.SERIES_SOC_8) == 8


def test_ds_default_20_palette_length():
    # Splunk Dashboard Studio default seriesColors — full 20.
    assert len(tokens.SERIES_STUDIO_20) == 20
    assert tokens.SERIES_STUDIO_20[0] == "#7B56DB"  # DS default first color


def test_status_hex_values():
    assert tokens.STATUS_CRITICAL == "#DC4E41"
    assert tokens.STATUS_HIGH == "#F1813F"
    assert tokens.STATUS_WARNING == "#F8BE34"
    assert tokens.STATUS_OK == "#53A051"
    assert tokens.STATUS_INFO == "#006D9C"
    assert tokens.STATUS_UNKNOWN == "#B0B0BE"


def test_light_status_overrides():
    # Light-theme semantic overrides (for `exec` theme).
    assert tokens.STATUS_CRITICAL_LIGHT == "#C0392B"
    assert tokens.STATUS_OK_LIGHT == "#2B9E44"
    assert tokens.STATUS_INFO_LIGHT == "#2066C0"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_tokens.py -v
```

Expected: FAIL with `ImportError` / `ModuleNotFoundError: splunk_dashboards.tokens`.

- [ ] **Step 3: Create `tokens.py`**

Create `plugins/splunk-dashboards/src/splunk_dashboards/tokens.py`:

```python
"""Design tokens for Aurora — ground-truth constants.

Every hex value is verified against Splunk's official design language:
splunkui.splunk.com/Packages/visualizations/VisualizationsGallery and
docs.splunk.com Dashboard Studio reference.

Spacing and type scale follow Splunk UI's @splunk/themes conventions
(see splunkui.splunk.com/Packages/themes/Variables).
"""
from __future__ import annotations


# ----- Spacing scale (px) -----
S_0_5 = 4
S_1 = 8
S_1_5 = 12
S_2 = 16
S_2_5 = 20  # canonical gutter / panel margin
S_3 = 24
S_4 = 32
S_6 = 48
S_8 = 64


# ----- Border radius (px) -----
R_SHARP = 0
R_SUBTLE = 4
R_CARD = 8
R_HERO = 12
R_PILL = 999


# ----- Typography scale (px) -----
FS_TICK = 11
FS_AXIS = 12
FS_BODY = 14
FS_LARGE = 18
FS_XLARGE = 24
FS_KPI_MINOR = 28
FS_KPI_MAJOR = 48
FS_KPI_HERO = 72


# ----- Semantic status colors (dark theme default) -----
STATUS_CRITICAL = "#DC4E41"
STATUS_HIGH = "#F1813F"
STATUS_WARNING = "#F8BE34"
STATUS_OK = "#53A051"
STATUS_INFO = "#006D9C"
STATUS_UNKNOWN = "#B0B0BE"


# ----- Light-theme semantic overrides (for exec theme) -----
STATUS_CRITICAL_LIGHT = "#C0392B"
STATUS_HIGH_LIGHT = "#C05C00"
STATUS_WARNING_LIGHT = "#D4820A"
STATUS_OK_LIGHT = "#2B9E44"
STATUS_INFO_LIGHT = "#2066C0"


# ----- Canvas tokens -----
CANVAS_DARK = "#0b0c0e"          # Prisma Dark
CANVAS_DARK_PURE = "#000000"     # NOC pure black
CANVAS_LIGHT = "#FAFAF7"         # warm off-white for exec
PANEL_DARK = "#15161a"
PANEL_DARK_NOC = "#0F1117"
PANEL_LIGHT = "#ffffff"
PANEL_STROKE_DARK = "#2C2C3A"
PANEL_STROKE_LIGHT = "#E5E5E0"

# ----- Text tokens -----
TEXT_PRIMARY_DARK = "#FFFFFF"
TEXT_SECONDARY_DARK = "#B0B0BE"
TEXT_PRIMARY_LIGHT = "#1A1A1A"
TEXT_SECONDARY_LIGHT = "#6B7C85"


# ----- Series palettes -----
# Splunk CustomVizDesign official 10-color categorical palette.
SERIES_CATEGORICAL_10 = [
    "#006D9C", "#4FA484", "#EC9960", "#AF575A", "#B6C75A",
    "#62B3B2", "#294E70", "#738795", "#EDD051", "#BD9872",
]

# Light-theme override of categorical-10 (higher contrast on white).
SERIES_CATEGORICAL_10_LIGHT = [
    "#2066C0", "#2B9E44", "#C05C00", "#C0392B", "#7A873D",
    "#3D8B8B", "#294E70", "#4A5A64", "#B39A1F", "#8A6B4A",
]

# Splunk Dashboard Studio default 20-color seriesColors (dark theme).
SERIES_STUDIO_20 = [
    "#7B56DB", "#009CEB", "#00CDAF", "#DD9900", "#FF677B",
    "#CB2196", "#813193", "#0051B5", "#008C80", "#99B100",
    "#FFA476", "#FF6ACE", "#AE8CFF", "#00689D", "#00490A",
    "#465D00", "#9D6300", "#F6540B", "#FF969E", "#E47BFE",
]

# SOC semantic-ordered 8-color palette (red/amber/green priority + accents).
SERIES_SOC_8 = [
    "#DC4E41", "#F1813F", "#F8BE34", "#53A051",
    "#006D9C", "#1FBAD6", "#826AF9", "#9B59B6",
]


# ----- Chart chrome -----
GRIDLINE_DARK = "#23262b"
GRIDLINE_LIGHT = "#ebedef"
AXISLINE_DARK = "#2c3036"
AXISLINE_LIGHT = "#d9dce0"
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_tokens.py -v
```

Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/tokens.py plugins/splunk-dashboards/tests/test_tokens.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): add Aurora design tokens module

Immutable constants for colors (Splunk categorical-10, DS default-20,
SOC semantic-8, status palette with light overrides), spacing,
radii, and typography. All values verified against splunkui.splunk.com.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T10-2: Create `themes.py` with Theme dataclass + registry

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/themes.py`
- Create: `plugins/splunk-dashboards/tests/test_themes.py`

- [ ] **Step 1: Write the failing test**

Create `plugins/splunk-dashboards/tests/test_themes.py`:

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_themes.py -v
```

Expected: FAIL — `ModuleNotFoundError: splunk_dashboards.themes`.

- [ ] **Step 3: Create `themes.py`**

Create `plugins/splunk-dashboards/src/splunk_dashboards/themes.py`:

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_themes.py -v
```

Expected: 11 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/themes.py plugins/splunk-dashboards/tests/test_themes.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): add Aurora themes registry

Four canonical themes (pro, glass, exec, noc) + three legacy aliases
(clean→pro, ops→noc, soc→noc). Theme dataclass is frozen; registry
supports register_theme() extension for Aurora v2+ contributions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T10-3: Extract theme_engine.py and keep `theme.py` as compatibility shim

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/theme_engine.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/theme.py` (replace content with re-exports)
- Modify: `plugins/splunk-dashboards/tests/test_theme.py` (update to test new theme names AND legacy aliases)

- [ ] **Step 1: Write new failing tests for Aurora apply_theme behavior**

Add to `plugins/splunk-dashboards/tests/test_theme.py` (append after existing tests):

```python
def test_apply_theme_pro_writes_definition_defaults():
    """Aurora pro theme should emit definition.defaults with canvas + series palette."""
    from splunk_dashboards.theme import apply_theme
    dashboard = {
        "title": "T", "description": "",
        "dataSources": {},
        "visualizations": {},
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []},
        "defaults": {},
    }
    apply_theme(dashboard, "pro")
    d = dashboard.get("defaults", {})
    # definition.defaults.visualizations.global.options.backgroundColor
    global_opts = d.get("visualizations", {}).get("global", {}).get("options", {})
    assert global_opts.get("backgroundColor") == "#0b0c0e"


def test_apply_theme_legacy_clean_routes_to_pro():
    """'clean' is a legacy alias for 'pro' — behavior identical."""
    from splunk_dashboards.theme import apply_theme
    d1 = _empty_dashboard()
    d2 = _empty_dashboard()
    apply_theme(d1, "clean")
    apply_theme(d2, "pro")
    assert d1.get("defaults") == d2.get("defaults")


def test_apply_theme_noc_uses_black_canvas():
    from splunk_dashboards.theme import apply_theme
    d = _empty_dashboard()
    apply_theme(d, "noc")
    global_opts = d["defaults"]["visualizations"]["global"]["options"]
    assert global_opts["backgroundColor"] == "#000000"


def test_apply_theme_exec_uses_light_canvas():
    from splunk_dashboards.theme import apply_theme
    d = _empty_dashboard()
    apply_theme(d, "exec")
    global_opts = d["defaults"]["visualizations"]["global"]["options"]
    assert global_opts["backgroundColor"] == "#FAFAF7"


def test_apply_theme_legacy_ops_routes_to_noc():
    from splunk_dashboards.theme import apply_theme
    d1 = _empty_dashboard()
    d2 = _empty_dashboard()
    apply_theme(d1, "ops")
    apply_theme(d2, "noc")
    assert d1.get("defaults") == d2.get("defaults")


def _empty_dashboard():
    return {
        "title": "T", "description": "",
        "dataSources": {},
        "visualizations": {},
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []},
        "defaults": {},
    }
```

Also update the first test that currently asserts old theme keys:

```python
def test_four_bundled_themes_exist():
    # Aurora v1 — 4 new canonical themes replace the old 4; legacy names still resolve.
    assert set(THEMES.keys()) == {"pro", "glass", "exec", "noc"}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_theme.py -v
```

Expected: Several failures — `test_four_bundled_themes_exist` fails (still old keys), new tests fail on `definition.defaults` shape.

- [ ] **Step 3: Create `theme_engine.py`**

Create `plugins/splunk-dashboards/src/splunk_dashboards/theme_engine.py`:

```python
"""Aurora theme engine — applies a Theme to a dashboard JSON dict.

Responsibilities:
1. Emit definition.defaults (canvas + series palette) — global, not per-viz.
2. Per-viz semantic coloring on singlevalues where SPL/title matches tags.
3. Insert a markdown header panel for themes that request one.

Patterns (card-kpi, hero-kpi, etc.) are NOT applied here — see aurora.py
(sub-plan 11) for pattern orchestration.
"""
from __future__ import annotations

import re

from splunk_dashboards.themes import Theme, get_theme


SINGLEVALUE_TYPES = {
    "splunk.singlevalue", "splunk.singlevalueicon", "splunk.singlevalueradial",
    "splunk.markergauge", "splunk.fillergauge",
}
CHART_TYPES = {
    "splunk.line", "splunk.area", "splunk.bar", "splunk.column", "splunk.pie",
    "splunk.bubble", "splunk.scatter", "splunk.punchcard",
}


# ----- Semantic detection (moved from old theme.py) -----

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
    re.compile(r"\bp\d\d\b"),
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


def _match_any(patterns, text):
    return any(p.search(text) for p in patterns)


def detect_semantics(spl: str, title: str) -> list:
    combined = f"{spl or ''} {title or ''}"
    hints = []
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


def _spl_for_viz(viz_id: str, dashboard: dict) -> str:
    viz = dashboard["visualizations"].get(viz_id, {})
    ds_key = (viz.get("dataSources") or {}).get("primary")
    if not ds_key:
        return ""
    ds = dashboard["dataSources"].get(ds_key, {})
    return ((ds.get("options") or {}).get("query") or "")


def _style_singlevalue(viz: dict, semantics: list, theme: Theme) -> None:
    options = viz.setdefault("options", {})
    for tag in semantics:
        if tag in theme.semantic_colors:
            options["majorColor"] = theme.semantic_colors[tag]
            break


def _emit_definition_defaults(dashboard: dict, theme: Theme) -> None:
    """Write global canvas + default series palette to definition.defaults."""
    defaults = dashboard.setdefault("defaults", {})
    viz_defaults = defaults.setdefault("visualizations", {})
    global_opts = viz_defaults.setdefault("global", {}).setdefault("options", {})
    global_opts["backgroundColor"] = theme.canvas
    # Default series palette for every chart type.
    for chart_type in CHART_TYPES:
        type_defaults = viz_defaults.setdefault(chart_type, {}).setdefault("options", {})
        type_defaults.setdefault("seriesColors", list(theme.series_colors))


def apply_theme(dashboard: dict, theme_name: str) -> None:
    """Mutate `dashboard` in place — apply the named theme's styling.

    Writes definition.defaults for global canvas + series palette.
    Applies per-viz semantic coloring on singlevalues.
    """
    theme = get_theme(theme_name)
    _emit_definition_defaults(dashboard, theme)

    for viz_id, viz in list(dashboard.get("visualizations", {}).items()):
        vtype = viz.get("type", "")
        if vtype in SINGLEVALUE_TYPES:
            spl = _spl_for_viz(viz_id, dashboard)
            semantics = detect_semantics(spl, viz.get("title", ""))
            _style_singlevalue(viz, semantics, theme)
```

- [ ] **Step 4: Replace `theme.py` with shim**

Replace the entire contents of `plugins/splunk-dashboards/src/splunk_dashboards/theme.py` with:

```python
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
```

- [ ] **Step 5: Run the full theme test suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_theme.py tests/test_themes.py tests/test_tokens.py -v
```

Expected: all passed. Previously-working `detect_semantics` tests still pass. Legacy theme-name tests resolve via aliases. New definition.defaults tests pass.

- [ ] **Step 6: Run full suite to confirm nothing else broke**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: 117–120 passed, 0 failed.

- [ ] **Step 7: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/theme.py plugins/splunk-dashboards/src/splunk_dashboards/theme_engine.py plugins/splunk-dashboards/tests/test_theme.py
git commit -m "$(cat <<'EOF'
refactor(splunk-dashboards): split theme.py into engine + compat shim

theme_engine.py holds apply_theme() + semantic detection; theme.py is a
thin re-export for backwards compatibility. Engine now emits
definition.defaults (global canvas + default series palette) instead of
mutating every viz individually. Per-viz semantic coloring preserved.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T10-4: Update `ds-create` CLI to accept new theme names

**Files:**
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/create.py`
- Modify: `plugins/splunk-dashboards/tests/test_create.py`

- [ ] **Step 1: Write failing test**

Add to `plugins/splunk-dashboards/tests/test_create.py` (append):

```python
def test_build_dashboard_accepts_aurora_theme_pro(tmp_path):
    """Aurora theme 'pro' should be accepted by build_dashboard."""
    from splunk_dashboards.create import build_dashboard
    from splunk_dashboards.layout import Layout, Panel
    from splunk_dashboards.data_sources import DataSources, DataSource

    layout = Layout(panels=[
        Panel(id="p1", title="Events", x=0, y=0, w=4, h=3,
              viz_type="splunk.singlevalue", data_source_ref="q1"),
    ])
    data = DataSources(sources=[
        DataSource(question="q1", spl="index=main | stats count", earliest="-24h", latest="now"),
    ])
    result = build_dashboard(layout, data, title="T", description="D", theme="pro")
    assert result["defaults"]["visualizations"]["global"]["options"]["backgroundColor"] == "#0b0c0e"


def test_build_dashboard_accepts_legacy_clean_via_alias(tmp_path):
    from splunk_dashboards.create import build_dashboard
    from splunk_dashboards.layout import Layout
    from splunk_dashboards.data_sources import DataSources

    result = build_dashboard(
        Layout(panels=[]), DataSources(sources=[]),
        title="T", description="", theme="clean",
    )
    # 'clean' resolves to 'pro' — canvas == Prisma Dark
    assert result["defaults"]["visualizations"]["global"]["options"]["backgroundColor"] == "#0b0c0e"


def test_build_dashboard_unknown_theme_raises(tmp_path):
    from splunk_dashboards.create import build_dashboard
    from splunk_dashboards.layout import Layout
    from splunk_dashboards.data_sources import DataSources

    import pytest
    with pytest.raises(KeyError):
        build_dashboard(
            Layout(panels=[]), DataSources(sources=[]),
            title="T", description="", theme="nope",
        )
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_create.py -v -k aurora
```

Expected: FAIL — `KeyError: "Unknown theme: pro"` (because old theme.py had "pro" not registered).

Wait — after T10-3 the shim re-exports from themes.py, so "pro" IS registered. The tests should actually PASS after T10-3. Let me revise expectation:

Expected: the "pro" and legacy-clean tests pass; the unknown-theme test also passes because `apply_theme` now raises KeyError. If any fail, fix implementation.

- [ ] **Step 3: Update `create.py` CLI help text (no functional change needed)**

Find the argparse block in `build_cli()` in `create.py` (around line 140–180) and update the `--theme` help string. Read the file first to locate the exact line.

Replace:
```python
parser.add_argument("--theme", default="clean",
    help="Visual theme: clean|soc|ops|exec")
```

With:
```python
parser.add_argument("--theme", default="pro",
    help="Visual theme: pro|glass|exec|noc (aliases: clean→pro, ops→noc, soc→noc)")
```

Change the default from `"clean"` to `"pro"` — new default is the Aurora dark theme.

- [ ] **Step 4: Update existing default-theme assumption in tests**

Search for any test that asserted `theme="clean"` as the default:

```bash
cd plugins/splunk-dashboards
grep -rn 'theme.*clean' tests/
```

For each hit, update to use `theme="pro"` OR update the test to accept either (since `clean → pro` aliasing is lossless).

- [ ] **Step 5: Run full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: 117–120 passed.

- [ ] **Step 6: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/create.py plugins/splunk-dashboards/tests/test_create.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): ds-create --theme accepts Aurora themes

Default theme changed from 'clean' to 'pro' (the Aurora dark default).
Legacy theme names continue to work via aliases. Help text updated.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T10-5: Reserve `viz_packs/` directory for Phase 2

**Files:**
- Create: `plugins/splunk-dashboards/viz_packs/.gitkeep`
- Create: `plugins/splunk-dashboards/viz_packs/README.md`

- [ ] **Step 1: Create the empty directory with a README**

Create `plugins/splunk-dashboards/viz_packs/README.md`:

```markdown
# viz_packs — reserved for Aurora v2 custom visualization extensions

This directory is intentionally empty in Aurora v1. It is reserved for
Aurora v2 custom visualization packs that extend Dashboard Studio beyond
what native viz types can deliver (pulsing alerts, gradient text, custom
animations).

Aurora v2 design (not in v1):
- `viz_packs/<name>/` contains a Canvas 2D custom viz generated via
  the `splunk-viz` skill, packaged as a Splunk app.
- `aurora.register_viz_pack(name)` wires it into the theme engine.
- `ds-create --viz-pack <name> --theme noc` installs the app and emits
  `"type": "<name>.gauge"` in panel specs.

Do not add code here without bumping the plugin to v0.11+ and updating
the Aurora spec.
```

Also create an empty `plugins/splunk-dashboards/viz_packs/.gitkeep` so git tracks the directory even before any packs exist.

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/viz_packs/
git commit -m "$(cat <<'EOF'
chore(splunk-dashboards): reserve viz_packs/ for Aurora v2

Empty directory with README documenting intended Phase 2 use.
Not wired to any code path in Aurora v1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T10-Z: Full suite sanity + push

- [ ] **Step 1: Run full test suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: 117–120 passed, 0 failed.

- [ ] **Step 2: Manual smoke test of ds-create with each theme**

For each of `pro`, `glass`, `exec`, `noc`, `clean` (legacy), `ops` (legacy), build a trivial dashboard:

```bash
# Use an existing workspace or create a fresh one
cd plugins/splunk-dashboards
PYTHONPATH=src python3 -m splunk_dashboards.workspace init aurora-smoke
PYTHONPATH=src python3 -m splunk_dashboards.data_sources write aurora-smoke --json '{"sources":[{"question":"q1","spl":"| makeresults","earliest":"-24h","latest":"now"}]}'
PYTHONPATH=src python3 -m splunk_dashboards.layout write aurora-smoke --json '{"panels":[{"id":"p1","title":"X","x":0,"y":0,"w":4,"h":3,"viz_type":"splunk.singlevalue","data_source_ref":"q1"}]}'
# Note: workspace has to be advanced to 'designed' stage manually for build — or tweak state.json
```

For each theme, assert the generated `dashboard.json` contains:
- `defaults.visualizations.global.options.backgroundColor` = expected canvas hex
- `defaults.visualizations["splunk.line"].options.seriesColors[0]` = theme's first series color

- [ ] **Step 3: Push**

```bash
git push
```

---

## Deliverables when sub-plan 10 closes

- [x] `tokens.py` with colors, spacing, radii, typography — all Splunk-verified
- [x] `themes.py` with 4 Aurora themes + 3 legacy aliases + `Theme` dataclass + registry
- [x] `theme_engine.py` extracted from `theme.py`; old `theme.py` is compat shim
- [x] `ds-create --theme` accepts `pro`, `glass`, `exec`, `noc`, `clean`, `ops`, `soc`
- [x] `definition.defaults` used for global canvas + series palette (not per-viz)
- [x] `viz_packs/` reserved for Aurora v2
- [x] 12–15 new tests passing, total ~117–120 green
- [x] No existing tests broken

Next: sub-plan 11 (patterns engine).
