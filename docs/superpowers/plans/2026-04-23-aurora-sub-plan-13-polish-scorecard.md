# Aurora Sub-plan 13: Polish scorecard in ds-review

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `aurora_score.py` that evaluates a dashboard dict across 10 weighted polish dimensions, returning a `PolishScore` (0–10 with per-dimension findings). Wire it into `ds-review` so `review.md` gains a "Polish scorecard" section with the score + gap findings + suggested `ds-update` invocations. Bump plugin version to 0.10.0 and update README.

**Architecture:** `aurora_score.py` defines a `ScoringRule` dataclass (name, weight, check function returning pass/partial/fail + message). Ten built-in rules. `evaluate(dashboard)` runs all rules, sums weights, normalizes to 0–10. The existing `ds-review` skill writes an extra markdown section using `evaluate()`.

**Tech Stack:** Python 3.9+ stdlib. Pytest.

**Depends on:** Sub-plans 10, 11, 12.

---

## File structure

```
plugins/splunk-dashboards/
├── src/splunk_dashboards/
│   └── aurora_score.py              # NEW
├── tests/
│   └── test_aurora_score.py         # NEW
├── .claude-plugin/plugin.json        # MODIFIED — version 0.10.0
└── /README.md                        # MODIFIED (at repo root) — Aurora section
```

Test count after sub-plan 13: ~155 + 12–15 = ~165–170.

---

### Task T13-1: ScoringRule dataclass + evaluate() skeleton

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/aurora_score.py`
- Create: `plugins/splunk-dashboards/tests/test_aurora_score.py`

- [ ] **Step 1: Write failing test**

Create `plugins/splunk-dashboards/tests/test_aurora_score.py`:

```python
"""Tests for Aurora polish scorecard."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.aurora_score import (
    ScoringRule,
    Finding,
    PolishScore,
    RULES,
    evaluate,
)


def _minimal_dashboard():
    return {
        "title": "T", "description": "",
        "dataSources": {},
        "visualizations": {},
        "layout": {"type": "absolute", "options": {"width": 1440}, "structure": []},
        "defaults": {},
    }


def test_evaluate_returns_polish_score():
    score = evaluate(_minimal_dashboard())
    assert isinstance(score, PolishScore)
    assert 0.0 <= score.value <= 10.0
    assert isinstance(score.findings, list)


def test_ten_rules_registered():
    # Spec section §6 — exactly 10 dimensions
    assert len(RULES) == 10


def test_each_rule_has_required_fields():
    for rule in RULES:
        assert isinstance(rule, ScoringRule)
        assert isinstance(rule.name, str) and rule.name
        assert rule.weight > 0
        assert callable(rule.check)


def test_weights_sum_to_10():
    """Rule weights sum to 10.0 so max score is 10."""
    total = sum(r.weight for r in RULES)
    assert abs(total - 10.0) < 0.001


def test_empty_dashboard_scores_low():
    """An empty dashboard should score near zero — no theme, no KPIs, no patterns."""
    score = evaluate(_minimal_dashboard())
    assert score.value < 3.0
```

- [ ] **Step 2: Run to verify failure**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_aurora_score.py -v
```

Expected: FAIL — ModuleNotFoundError.

- [ ] **Step 3: Create the module skeleton**

Create `plugins/splunk-dashboards/src/splunk_dashboards/aurora_score.py`:

```python
"""Aurora polish scorecard — measures how 'designed' a dashboard is.

Ten weighted rules. Each returns pass/partial/fail + a human message.
Score = sum(rule.weight * level_factor) where factor is 1.0/0.5/0.0 for
pass/partial/fail. Weights sum to 10, so the total is 0–10.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Literal, List


Level = Literal["pass", "partial", "fail"]
LEVEL_FACTOR = {"pass": 1.0, "partial": 0.5, "fail": 0.0}


@dataclass
class Finding:
    rule: str
    level: Level
    message: str
    suggestion: str = ""  # optional ds-update CLI hint


@dataclass
class ScoringRule:
    name: str
    weight: float
    check: Callable[[dict], Finding]


@dataclass
class PolishScore:
    value: float  # 0.0 - 10.0
    findings: List[Finding] = field(default_factory=list)

    @property
    def wins(self) -> List[Finding]:
        return [f for f in self.findings if f.level == "pass"]

    @property
    def gaps(self) -> List[Finding]:
        return [f for f in self.findings if f.level != "pass"]


# ----- Rules registered below (tasks T13-2..T13-4) -----

RULES: List[ScoringRule] = []


def register_rule(rule: ScoringRule) -> None:
    RULES.append(rule)


def evaluate(dashboard: dict) -> PolishScore:
    findings = [rule.check(dashboard) for rule in RULES]
    total = sum(rule.weight * LEVEL_FACTOR[f.level] for rule, f in zip(RULES, findings))
    return PolishScore(value=round(total, 2), findings=findings)


# Rule module imports (self-registering). Kept at bottom to avoid circular.
from splunk_dashboards import aurora_score_rules  # noqa: E402, F401
```

Also create `plugins/splunk-dashboards/src/splunk_dashboards/aurora_score_rules.py` as an empty stub for now:

```python
"""Aurora scorecard rule definitions — one check function per dimension.

Rules self-register via aurora_score.register_rule(). This file is imported
once by aurora_score at module-load time.

Rule definitions land in tasks T13-2..T13-4.
"""
from __future__ import annotations

# Rule implementations added in T13-2 (5 rules), T13-3 (3 rules), T13-4 (2 rules).
```

- [ ] **Step 4: Run tests — 3 of 5 should pass; weight-sum and rule-count fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_aurora_score.py -v
```

Expected: `test_evaluate_returns_polish_score` passes. `test_ten_rules_registered` fails (RULES is empty). `test_weights_sum_to_10` fails. `test_each_rule_has_required_fields` passes (empty loop). `test_empty_dashboard_scores_low` passes (score=0).

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/aurora_score.py plugins/splunk-dashboards/src/splunk_dashboards/aurora_score_rules.py plugins/splunk-dashboards/tests/test_aurora_score.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): Aurora scorecard skeleton

ScoringRule + Finding + PolishScore dataclasses. evaluate()
orchestrator. Rules will register themselves in aurora_score_rules.
Weights sum to 10 so total is 0-10.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T13-2: First 5 rules (theme + card + hero + sparkline + compare-prev)

**Files:**
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/aurora_score_rules.py`
- Modify: `plugins/splunk-dashboards/tests/test_aurora_score.py`

- [ ] **Step 1: Write failing tests for these 5 rules**

Append to `plugins/splunk-dashboards/tests/test_aurora_score.py`:

```python
def _themed_dashboard():
    d = _minimal_dashboard()
    d["defaults"] = {"visualizations": {"global": {"options": {"backgroundColor": "#0b0c0e"}}}}
    return d


def test_rule_theme_applied_pass():
    from splunk_dashboards.aurora_score import evaluate
    score = evaluate(_themed_dashboard())
    theme_findings = [f for f in score.findings if f.rule == "theme-applied"]
    assert theme_findings and theme_findings[0].level == "pass"


def test_rule_theme_applied_fail_when_no_defaults():
    from splunk_dashboards.aurora_score import evaluate
    score = evaluate(_minimal_dashboard())
    theme_findings = [f for f in score.findings if f.rule == "theme-applied"]
    assert theme_findings and theme_findings[0].level == "fail"


def test_rule_card_kpi_pass_when_rectangle_before_kpis():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["visualizations"] = {
        "viz_card": {"type": "splunk.rectangle", "options": {}},
        "viz_kpi":  {"type": "splunk.singlevalue", "options": {}},
    }
    d["layout"]["structure"] = [
        {"item": "viz_card", "type": "block", "position": {"x": 0, "y": 0, "w": 100, "h": 100}},
        {"item": "viz_kpi",  "type": "block", "position": {"x": 10, "y": 10, "w": 80, "h": 80}},
    ]
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "card-kpi")
    assert r.level == "pass"


def test_rule_hero_kpi_partial_when_no_sized_hero():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["visualizations"] = {
        "viz_a": {"type": "splunk.singlevalue", "options": {"majorValueSize": 32}},
        "viz_b": {"type": "splunk.singlevalue", "options": {"majorValueSize": 32}},
    }
    d["layout"]["structure"] = [
        {"item": "viz_a", "type": "block", "position": {"x": 0, "y": 0, "w": 320, "h": 140}},
        {"item": "viz_b", "type": "block", "position": {"x": 340, "y": 0, "w": 320, "h": 140}},
    ]
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "hero-kpi")
    # No singlevalue is 2x size → partial or fail (treat as partial because pattern is optional)
    assert r.level in ("partial", "fail")


def test_rule_sparkline_in_kpi_pass_when_all_timeseries_have_spark():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["dataSources"] = {"ds_1": {"type": "ds.search", "options": {"query": "index=m | timechart count"}}}
    d["visualizations"] = {
        "viz_1": {"type": "splunk.singlevalue", "dataSources": {"primary": "ds_1"},
                   "options": {"sparklineDisplay": "below"}},
    }
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "sparkline-in-kpi")
    assert r.level == "pass"


def test_rule_compare_prev_pass_when_timewrap_in_line_spl():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["dataSources"] = {"ds_1": {"type": "ds.search", "options": {"query": "| timechart count | timewrap 1d"}}}
    d["visualizations"] = {"viz_1": {"type": "splunk.line", "dataSources": {"primary": "ds_1"}, "options": {}}}
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "compare-prev")
    assert r.level == "pass"


def test_rule_compare_prev_fail_when_no_timewrap_anywhere():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["dataSources"] = {"ds_1": {"type": "ds.search", "options": {"query": "| timechart count"}}}
    d["visualizations"] = {"viz_1": {"type": "splunk.line", "dataSources": {"primary": "ds_1"}, "options": {}}}
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "compare-prev")
    assert r.level == "fail"
```

- [ ] **Step 2: Run tests to see failures**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_aurora_score.py -v
```

Expected: new tests fail because rules don't exist yet.

- [ ] **Step 3: Implement the 5 rules**

Replace the contents of `plugins/splunk-dashboards/src/splunk_dashboards/aurora_score_rules.py` with:

```python
"""Aurora polish scorecard rules — self-registering.

Imports aurora_score's registry and adds one ScoringRule per dimension.
Rule 1–5 land in this task (T13-2). 6–10 follow in T13-3/T13-4.
"""
from __future__ import annotations

import re

from splunk_dashboards.aurora_score import (
    Finding, ScoringRule, register_rule,
)


SINGLEVALUE_TYPES = {
    "splunk.singlevalue", "splunk.singlevalueicon", "splunk.singlevalueradial",
    "splunk.markergauge", "splunk.fillergauge",
}
TIMESERIES_RE = re.compile(r"\|\s*timechart\b|\|\s*bin\s+_time\b", re.I)
TIMEWRAP_RE = re.compile(r"\|\s*timewrap\b", re.I)


def _spl_for_viz(viz: dict, dashboard: dict) -> str:
    ds_key = (viz.get("dataSources") or {}).get("primary")
    if not ds_key:
        return ""
    return ((dashboard["dataSources"].get(ds_key, {}).get("options") or {}).get("query") or "")


# ----- Rule 1: theme-applied (weight 0.8) -----

def _check_theme_applied(dashboard: dict) -> Finding:
    bg = (((dashboard.get("defaults") or {}).get("visualizations") or {})
          .get("global", {}).get("options", {}).get("backgroundColor"))
    if bg:
        return Finding(rule="theme-applied", level="pass",
                        message=f"Canvas backgroundColor set to {bg}")
    return Finding(rule="theme-applied", level="fail",
                    message="No Aurora theme applied — dashboard uses Splunk default styling",
                    suggestion="Rebuild with: ds-create build <ws> --theme pro")

register_rule(ScoringRule("theme-applied", 0.8, _check_theme_applied))


# ----- Rule 2: card-kpi (weight 1.0) -----

def _check_card_kpi(dashboard: dict) -> Finding:
    vizs = dashboard["visualizations"]
    rects = [vid for vid, v in vizs.items() if v.get("type") == "splunk.rectangle"]
    kpis = [vid for vid, v in vizs.items() if v.get("type") in SINGLEVALUE_TYPES]
    if not kpis:
        return Finding(rule="card-kpi", level="pass",
                        message="No KPIs present — rule N/A (no penalty)")
    if not rects:
        return Finding(rule="card-kpi", level="fail",
                        message="KPI row has no rectangle card behind it",
                        suggestion="Add: --pattern card-kpi")
    # Check structure order: at least one rect before at least one kpi
    structure = dashboard["layout"].get("structure", [])
    rect_indices = [i for i, e in enumerate(structure) if e.get("item") in rects]
    kpi_indices = [i for i, e in enumerate(structure) if e.get("item") in kpis]
    if rect_indices and kpi_indices and min(rect_indices) < max(kpi_indices):
        return Finding(rule="card-kpi", level="pass",
                        message="KPI row wrapped in rectangle card")
    return Finding(rule="card-kpi", level="partial",
                    message="Rectangle present but not layered behind KPIs")

register_rule(ScoringRule("card-kpi", 1.0, _check_card_kpi))


# ----- Rule 3: hero-kpi (weight 1.2) -----

def _check_hero_kpi(dashboard: dict) -> Finding:
    structure = dashboard["layout"].get("structure", [])
    kpi_entries = [e for e in structure
                    if dashboard["visualizations"].get(e.get("item"), {}).get("type") == "splunk.singlevalue"]
    if len(kpi_entries) < 2:
        # Only zero or one KPI — rule N/A, no penalty (treat as pass)
        return Finding(rule="hero-kpi", level="pass",
                        message="Too few KPIs for hero pattern (N/A)")
    widths = [e["position"]["w"] for e in kpi_entries]
    max_w, median_w = max(widths), sorted(widths)[len(widths)//2]
    if max_w >= median_w * 2:
        # One KPI clearly promoted
        hero = next(e for e in kpi_entries if e["position"]["w"] == max_w)
        viz = dashboard["visualizations"][hero["item"]]
        if viz.get("options", {}).get("majorValueSize", 0) >= 48:
            return Finding(rule="hero-kpi", level="pass",
                            message="Hero KPI identified and sized correctly")
        return Finding(rule="hero-kpi", level="partial",
                        message="Hero KPI has width but not oversized font (majorValueSize < 48)")
    return Finding(rule="hero-kpi", level="partial",
                    message="No hero KPI identified",
                    suggestion="Consider: --pattern hero-kpi (flag one panel with hero: true)")

register_rule(ScoringRule("hero-kpi", 1.2, _check_hero_kpi))


# ----- Rule 4: sparkline-in-kpi (weight 1.0) -----

def _check_sparkline(dashboard: dict) -> Finding:
    ts_kpis = []
    for vid, viz in dashboard["visualizations"].items():
        if viz.get("type") != "splunk.singlevalue":
            continue
        spl = _spl_for_viz(viz, dashboard)
        if TIMESERIES_RE.search(spl):
            ts_kpis.append(viz)
    if not ts_kpis:
        return Finding(rule="sparkline-in-kpi", level="pass",
                        message="No time-series KPIs (N/A)")
    with_spark = [v for v in ts_kpis if v.get("options", {}).get("sparklineDisplay")]
    if len(with_spark) == len(ts_kpis):
        return Finding(rule="sparkline-in-kpi", level="pass",
                        message=f"All {len(ts_kpis)} time-series KPIs have sparklines")
    if len(with_spark) >= len(ts_kpis) * 0.5:
        return Finding(rule="sparkline-in-kpi", level="partial",
                        message=f"{len(with_spark)} of {len(ts_kpis)} time-series KPIs have sparklines",
                        suggestion="Add: --pattern sparkline-in-kpi")
    return Finding(rule="sparkline-in-kpi", level="fail",
                    message=f"Only {len(with_spark)} of {len(ts_kpis)} KPIs have sparklines",
                    suggestion="Add: --pattern sparkline-in-kpi")

register_rule(ScoringRule("sparkline-in-kpi", 1.0, _check_sparkline))


# ----- Rule 5: compare-prev (weight 1.2) -----

def _check_compare_prev(dashboard: dict) -> Finding:
    line_vizs = [v for v in dashboard["visualizations"].values()
                 if v.get("type") in ("splunk.line", "splunk.area")]
    if not line_vizs:
        return Finding(rule="compare-prev", level="pass",
                        message="No line/area charts (N/A)")
    with_timewrap = 0
    for viz in line_vizs:
        if TIMEWRAP_RE.search(_spl_for_viz(viz, dashboard)):
            with_timewrap += 1
    if with_timewrap >= 1:
        return Finding(rule="compare-prev", level="pass",
                        message=f"{with_timewrap} line/area chart(s) have compare-to-previous")
    return Finding(rule="compare-prev", level="fail",
                    message="No compare-to-previous-period on any time chart",
                    suggestion="Add: --pattern compare-prev")

register_rule(ScoringRule("compare-prev", 1.2, _check_compare_prev))
```

- [ ] **Step 4: Run tests**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_aurora_score.py -v
```

Expected: the 7 tests added in this task + the 5 skeleton tests pass. Weight-sum test still fails (5 rules = 5.2 weight).

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/aurora_score_rules.py plugins/splunk-dashboards/tests/test_aurora_score.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): Aurora scorecard rules 1-5

theme-applied (0.8), card-kpi (1.0), hero-kpi (1.2), sparkline-in-kpi
(1.0), compare-prev (1.2). Total weight so far: 5.2 / 10.
Remaining 5 rules land in T13-3 and T13-4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T13-3: Rules 6–8 (section-zones + series-cap + semantic-colors)

**Files:**
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/aurora_score_rules.py`
- Modify: `plugins/splunk-dashboards/tests/test_aurora_score.py`

- [ ] **Step 1: Write failing tests**

Append to `plugins/splunk-dashboards/tests/test_aurora_score.py`:

```python
def test_rule_section_zones_na_when_small_dashboard():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["visualizations"] = {
        f"viz_{i}": {"type": "splunk.singlevalue", "options": {}}
        for i in range(4)
    }
    d["layout"]["structure"] = [
        {"item": f"viz_{i}", "type": "block", "position": {"x": i*100, "y": 0, "w": 100, "h": 100}}
        for i in range(4)
    ]
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "section-zones")
    assert r.level == "pass"  # N/A because ≤ 6 panels


def test_rule_section_zones_fail_when_large_dashboard_unzoned():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["visualizations"] = {
        f"viz_{i}": {"type": "splunk.singlevalue", "options": {}}
        for i in range(8)
    }
    d["layout"]["structure"] = [
        {"item": f"viz_{i}", "type": "block", "position": {"x": i*100, "y": 0, "w": 100, "h": 100}}
        for i in range(8)
    ]
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "section-zones")
    assert r.level == "fail"


def test_rule_series_cap_fail_when_chart_has_too_many():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["visualizations"] = {
        "viz_1": {"type": "splunk.line", "options": {"seriesColors": ["#fff"] * 12}},
    }
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "series-cap")
    assert r.level == "fail"


def test_rule_series_cap_pass_when_under_8():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["visualizations"] = {
        "viz_1": {"type": "splunk.line", "options": {"seriesColors": ["#fff"] * 6}},
    }
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "series-cap")
    assert r.level == "pass"


def test_rule_semantic_colors_pass_when_failure_kpi_is_red():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["dataSources"] = {"ds_1": {"type": "ds.search", "options": {"query": "index=m action=failure | stats count"}}}
    d["visualizations"] = {
        "viz_1": {"type": "splunk.singlevalue", "title": "Failed logins",
                   "dataSources": {"primary": "ds_1"},
                   "options": {"majorColor": "#DC4E41"}},
    }
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "semantic-colors")
    assert r.level == "pass"


def test_rule_semantic_colors_fail_when_failure_kpi_is_blue():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["dataSources"] = {"ds_1": {"type": "ds.search", "options": {"query": "index=m action=failure | stats count"}}}
    d["visualizations"] = {
        "viz_1": {"type": "splunk.singlevalue", "title": "Failed logins",
                   "dataSources": {"primary": "ds_1"},
                   "options": {"majorColor": "#006D9C"}},  # blue — wrong for failure
    }
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "semantic-colors")
    assert r.level == "fail"
```

- [ ] **Step 2: Run to see failures**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_aurora_score.py -v
```

Expected: the 6 new tests fail (rules not registered).

- [ ] **Step 3: Add the 3 rules**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/aurora_score_rules.py`:

```python
# ----- Rule 6: section-zones (weight 0.8) -----

def _check_section_zones(dashboard: dict) -> Finding:
    # Count non-decoration panels
    content_types = SINGLEVALUE_TYPES | {
        "splunk.line", "splunk.area", "splunk.bar", "splunk.column", "splunk.pie",
        "splunk.table", "splunk.timeline", "splunk.choropleth.map",
    }
    content = [vid for vid, v in dashboard["visualizations"].items()
               if v.get("type") in content_types]
    if len(content) <= 6:
        return Finding(rule="section-zones", level="pass",
                        message=f"Small dashboard ({len(content)} panels) — zones N/A")
    # Check for zone rectangles or section-header markdowns
    has_zone = any(v.get("type") in ("splunk.rectangle", "splunk.markdown")
                   for v in dashboard["visualizations"].values()
                   if v.get("title", "").startswith("") and
                   ("zone" in (v.get("options", {}).get("markdown", "") or "").lower()
                     or v.get("options", {}).get("fillOpacity", 1) <= 0.1))
    if has_zone:
        return Finding(rule="section-zones", level="pass",
                        message="Large dashboard uses section zones")
    return Finding(rule="section-zones", level="fail",
                    message=f"Dashboard has {len(content)} panels but no section-zones",
                    suggestion="Add: --pattern section-zones (after tagging panels with section)")

register_rule(ScoringRule("section-zones", 0.8, _check_section_zones))


# ----- Rule 7: series-cap (weight 1.0) -----

CHART_TYPES = {"splunk.line", "splunk.area", "splunk.bar", "splunk.column",
               "splunk.pie", "splunk.bubble", "splunk.scatter"}


def _check_series_cap(dashboard: dict) -> Finding:
    exceeders = []
    for vid, viz in dashboard["visualizations"].items():
        if viz.get("type") not in CHART_TYPES:
            continue
        sc = viz.get("options", {}).get("seriesColors") or []
        if len(sc) > 8:
            exceeders.append(vid)
    if not exceeders:
        return Finding(rule="series-cap", level="pass",
                        message="No chart exceeds 8 series")
    return Finding(rule="series-cap", level="fail",
                    message=f"{len(exceeders)} chart(s) have > 8 series: {', '.join(exceeders)}",
                    suggestion="Add Top-N + Other aggregation to SPL")

register_rule(ScoringRule("series-cap", 1.0, _check_series_cap))


# ----- Rule 8: semantic-colors (weight 1.2) -----

SEMANTIC_HINTS = {
    "failure": "#DC4E41", "critical": "#DC4E41", "error": "#DC4E41",
    "success": "#53A051", "healthy": "#53A051", "uptime": "#53A051",
}


def _check_semantic_colors(dashboard: dict) -> Finding:
    mismatches = []
    matches = []
    for vid, viz in dashboard["visualizations"].items():
        if viz.get("type") not in SINGLEVALUE_TYPES:
            continue
        text = (viz.get("title", "") + " " + _spl_for_viz(viz, dashboard)).lower()
        major_color = (viz.get("options", {}) or {}).get("majorColor", "")
        for hint, expected_hex in SEMANTIC_HINTS.items():
            if hint in text:
                if not major_color:
                    continue  # no color set — not a mismatch
                # Check the color matches the expected hue family (red/green exact match for now)
                if major_color.upper() == expected_hex.upper():
                    matches.append(vid)
                else:
                    # Also allow light variants
                    light_variants = {"#DC4E41": "#C0392B", "#53A051": "#2B9E44"}
                    if major_color.upper() == light_variants.get(expected_hex, "").upper():
                        matches.append(vid)
                    else:
                        mismatches.append((vid, hint, major_color))
                break
    if not matches and not mismatches:
        return Finding(rule="semantic-colors", level="pass",
                        message="No status KPIs detected (N/A)")
    if mismatches:
        return Finding(rule="semantic-colors", level="fail",
                        message=f"{len(mismatches)} status KPI(s) use wrong color",
                        suggestion="Apply theme with semantic detection enabled (--theme pro/glass/exec/noc)")
    return Finding(rule="semantic-colors", level="pass",
                    message=f"{len(matches)} status KPI(s) use semantic colors")

register_rule(ScoringRule("semantic-colors", 1.2, _check_semantic_colors))
```

- [ ] **Step 4: Run tests**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_aurora_score.py -v
```

Expected: new tests pass. Weight-sum test still fails (5.2 + 0.8 + 1.0 + 1.2 = 8.2 / 10).

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/aurora_score_rules.py plugins/splunk-dashboards/tests/test_aurora_score.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): Aurora scorecard rules 6-8

section-zones (0.8), series-cap (1.0), semantic-colors (1.2).
Running total weight: 8.2 / 10. Remaining: gutters + typography (T13-4).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T13-4: Final rules (gutters + typography) + review.md integration

**Files:**
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/aurora_score_rules.py`
- Modify: `plugins/splunk-dashboards/tests/test_aurora_score.py`

- [ ] **Step 1: Write failing tests**

Append:

```python
def test_rule_gutters_fail_when_panels_overlap():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["visualizations"] = {
        "viz_1": {"type": "splunk.singlevalue", "options": {}},
        "viz_2": {"type": "splunk.singlevalue", "options": {}},
    }
    d["layout"]["structure"] = [
        {"item": "viz_1", "type": "block", "position": {"x": 0,   "y": 0, "w": 100, "h": 100}},
        {"item": "viz_2", "type": "block", "position": {"x": 105, "y": 0, "w": 100, "h": 100}},  # 5px gap
    ]
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "gutters")
    assert r.level == "fail"


def test_rule_gutters_pass_when_20px_gap():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["visualizations"] = {
        "viz_1": {"type": "splunk.singlevalue", "options": {}},
        "viz_2": {"type": "splunk.singlevalue", "options": {}},
    }
    d["layout"]["structure"] = [
        {"item": "viz_1", "type": "block", "position": {"x": 0,   "y": 0, "w": 100, "h": 100}},
        {"item": "viz_2", "type": "block", "position": {"x": 120, "y": 0, "w": 100, "h": 100}},
    ]
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "gutters")
    assert r.level == "pass"


def test_rule_typography_fail_when_title_too_long():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["visualizations"] = {
        "viz_1": {"type": "splunk.singlevalue",
                   "title": "This is an extremely long panel title that goes on way past forty characters",
                   "options": {}},
    }
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "typography")
    assert r.level == "fail"


def test_rule_typography_pass_when_titles_short():
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["visualizations"] = {
        "viz_1": {"type": "splunk.singlevalue", "title": "Events", "options": {}},
        "viz_2": {"type": "splunk.line", "title": "Request rate", "options": {}},
    }
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "typography")
    assert r.level == "pass"


def test_weights_now_sum_to_10():
    from splunk_dashboards.aurora_score import RULES
    assert abs(sum(r.weight for r in RULES) - 10.0) < 0.001


def test_high_score_dashboard():
    """A fully decked-out dashboard hits near 10/10."""
    from splunk_dashboards.aurora_score import evaluate
    d = _themed_dashboard()
    d["dataSources"] = {
        "ds_1": {"type": "ds.search",
                  "options": {"query": "index=m action=failure | timechart count | timewrap 1d"}},
    }
    d["visualizations"] = {
        "viz_card": {"type": "splunk.rectangle", "options": {}},
        "viz_kpi":  {"type": "splunk.singlevalue", "title": "Failures",
                      "dataSources": {"primary": "ds_1"},
                      "options": {"sparklineDisplay": "below", "majorColor": "#DC4E41"}},
        "viz_line": {"type": "splunk.line", "title": "Trend",
                      "dataSources": {"primary": "ds_1"},
                      "options": {"seriesColors": ["#fff"] * 4}},
    }
    d["layout"]["structure"] = [
        {"item": "viz_card", "type": "block", "position": {"x": 0, "y": 0, "w": 400, "h": 150}},
        {"item": "viz_kpi",  "type": "block", "position": {"x": 10,"y": 10, "w": 380, "h": 130}},
        {"item": "viz_line", "type": "block", "position": {"x": 0, "y": 170, "w": 400, "h": 300}},
    ]
    score = evaluate(d)
    assert score.value >= 8.0
```

- [ ] **Step 2: Run to verify failure**

Expected: 4 new tests fail, weight-sum test fails (still 8.2).

- [ ] **Step 3: Append the 2 final rules**

Append to `aurora_score_rules.py`:

```python
# ----- Rule 9: gutters (weight 0.8) -----

def _rects_overlap_or_too_close(entries: list, min_gap: int = 20) -> bool:
    """True if any pair of rects has a gap < min_gap on x-axis when y overlaps."""
    for i, a in enumerate(entries):
        for b in entries[i+1:]:
            a_pos, b_pos = a["position"], b["position"]
            # y overlap?
            a_bot = a_pos["y"] + a_pos["h"]
            b_bot = b_pos["y"] + b_pos["h"]
            if a_pos["y"] >= b_bot or b_pos["y"] >= a_bot:
                continue  # no y overlap; x gap not enforced
            a_right = a_pos["x"] + a_pos["w"]
            b_right = b_pos["x"] + b_pos["w"]
            # Measure min horizontal gap
            if a_pos["x"] < b_pos["x"]:
                gap = b_pos["x"] - a_right
            else:
                gap = a_pos["x"] - b_right
            if gap < min_gap:
                return True
    return False


def _check_gutters(dashboard: dict) -> Finding:
    structure = dashboard["layout"].get("structure", [])
    # Ignore rectangle decorations; measure only content panels
    non_decoration = [e for e in structure
                       if dashboard["visualizations"].get(e["item"], {}).get("type")
                       not in ("splunk.rectangle", "splunk.ellipse")]
    if len(non_decoration) < 2:
        return Finding(rule="gutters", level="pass", message="Too few panels to measure gutters")
    if _rects_overlap_or_too_close(non_decoration, min_gap=20):
        return Finding(rule="gutters", level="fail",
                        message="Some panels have < 20px horizontal gap",
                        suggestion="Adjust layout x-positions in design/layout.json")
    return Finding(rule="gutters", level="pass",
                    message="All panel gutters ≥ 20 px")

register_rule(ScoringRule("gutters", 0.8, _check_gutters))


# ----- Rule 10: typography (weight 1.0) -----

MAX_TITLE_LEN = 40


def _check_typography(dashboard: dict) -> Finding:
    over = [viz.get("title", "") for viz in dashboard["visualizations"].values()
            if len(viz.get("title", "")) > MAX_TITLE_LEN]
    if not over:
        return Finding(rule="typography", level="pass",
                        message=f"All panel titles ≤ {MAX_TITLE_LEN} chars")
    return Finding(rule="typography", level="fail",
                    message=f"{len(over)} panel title(s) exceed {MAX_TITLE_LEN} chars",
                    suggestion="Shorten titles; use 3–5 words")

register_rule(ScoringRule("typography", 1.0, _check_typography))
```

- [ ] **Step 4: Run tests**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_aurora_score.py -v
```

Expected: all tests pass. Weight sum = 10.0.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/aurora_score_rules.py plugins/splunk-dashboards/tests/test_aurora_score.py
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): Aurora scorecard rules 9-10 + weight sum 10

gutters (0.8, min 20px between overlapping-y panels) and
typography (1.0, panel title ≤ 40 chars). Total weight = 10.0.
High-score fixture asserts a fully-decked dashboard hits ≥ 8.0.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T13-5: Wire the scorecard into ds-review

**Files:**
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/validate.py` OR add a helper in `aurora_score.py` that produces markdown. Since `ds-review` is skill-driven (not CLI-backed per the existing SKILL.md), we add a helper that Claude can invoke from the skill.

- Create: `plugins/splunk-dashboards/src/splunk_dashboards/aurora_score.py` — add `render_markdown(score: PolishScore) -> str`

- [ ] **Step 1: Write failing test**

Append to `plugins/splunk-dashboards/tests/test_aurora_score.py`:

```python
def test_render_markdown_includes_score_and_sections():
    from splunk_dashboards.aurora_score import evaluate, render_markdown
    d = _themed_dashboard()
    score = evaluate(d)
    md = render_markdown(score)
    assert "## Polish scorecard" in md
    assert f"**Score: {score.value}" in md
    assert "### Wins" in md or "### Gaps" in md


def test_render_markdown_shows_suggestions_in_gaps():
    from splunk_dashboards.aurora_score import evaluate, render_markdown
    d = _minimal_dashboard()  # no theme → lots of gaps
    md = render_markdown(evaluate(d))
    assert "ds-create build" in md or "--pattern" in md  # at least one suggestion surfaces
```

- [ ] **Step 2: Implement `render_markdown`**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/aurora_score.py`:

```python
def render_markdown(score: PolishScore) -> str:
    lines = ["## Polish scorecard", "", f"**Score: {score.value} / 10**", ""]
    wins = score.wins
    gaps = score.gaps
    if wins:
        lines.append("### Wins")
        for f in wins:
            lines.append(f"- [{f.level}] **{f.rule}** — {f.message}")
        lines.append("")
    if gaps:
        lines.append("### Gaps")
        for f in gaps:
            item = f"- [{f.level}] **{f.rule}** — {f.message}"
            if f.suggestion:
                item += f"\n  _Suggestion:_ `{f.suggestion}`"
            lines.append(item)
        lines.append("")
    return "\n".join(lines)
```

- [ ] **Step 3: Run tests**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_aurora_score.py -v
```

Expected: all pass (~15 tests in this file total).

- [ ] **Step 4: Update ds-review SKILL.md with usage example**

Add to `plugins/splunk-dashboards/skills/ds-review/SKILL.md` near the existing "Polish scorecard" section added in sub-plan 12 (replacing the stub pointer):

```markdown
### How ds-review computes the score

```python
from splunk_dashboards.aurora_score import evaluate, render_markdown
import json

with open("dashboard.json") as f:
    dashboard = json.load(f)
score = evaluate(dashboard)
print(render_markdown(score))
# Appends result to review.md
```

The scorecard is deterministic — the same `dashboard.json` always produces the same score. It does NOT execute SPL against a live Splunk instance; it only inspects the JSON structure and static SPL text.
```

- [ ] **Step 5: Full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: ~165–170 passed.

- [ ] **Step 6: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/aurora_score.py plugins/splunk-dashboards/tests/test_aurora_score.py plugins/splunk-dashboards/skills/ds-review/SKILL.md
git commit -m "$(cat <<'EOF'
feat(splunk-dashboards): ds-review polish scorecard integration

Adds render_markdown(score) helper that emits a ## Polish scorecard
section with Wins/Gaps + suggestions. ds-review SKILL.md now shows
how to invoke it from the skill and appends the result to review.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T13-6: Bump plugin version and update repo README

**Files:**
- Modify: `plugins/splunk-dashboards/.claude-plugin/plugin.json`
- Modify: `/README.md` (at repo root)

- [ ] **Step 1: Bump version to 0.10.0**

Read `plugins/splunk-dashboards/.claude-plugin/plugin.json`, then update the `"version"` field to `"0.10.0"`.

- [ ] **Step 2: Update README with Aurora section**

Read `/README.md` at the repo root. In the `### splunk-dashboards` section, update the version in the heading to `(v0.10.0)`.

Add a new subsection after the "Themes" block:

```markdown
**Aurora design framework (v0.10.0+):**

The Aurora framework codifies four professionally-tuned themes and six composition patterns that make generated dashboards look world-class while respecting Splunk's own design language. All native Dashboard Studio JSON — no CSS, no JS, Enterprise + Cloud compatible.

- **Themes:** `pro` (dark default), `glass` (premium hero), `exec` (editorial light), `noc` (mission-control). Legacy `clean`/`ops`/`soc` aliases still work.
- **Patterns:** `card-kpi`, `hero-kpi`, `sparkline-in-kpi`, `compare-prev`, `annotations`, `section-zones`. Apply via `--pattern` or use the theme's default package.
- **Polish scorecard:** `ds-review` produces a weighted 0–10 score across 10 dimensions with actionable `ds-update` suggestions for gaps.

See `docs/superpowers/specs/2026-04-23-aurora-design-framework-design.md` for the full spec.
```

- [ ] **Step 3: Commit**

```bash
git add plugins/splunk-dashboards/.claude-plugin/plugin.json README.md
git commit -m "$(cat <<'EOF'
chore(splunk-dashboards): bump version to 0.10.0 (Aurora framework)

Aurora sub-plans 10-13 shipped: tokens + themes (4 Aurora themes +
3 legacy aliases), composition patterns engine (6 patterns),
flagship templates, polish scorecard (10 dimensions, 0-10 score).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task T13-Z: Full suite + manual verification + push

- [ ] **Step 1: Run full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: ~165–170 passed, 0 failed.

- [ ] **Step 2: Manual verification — Enterprise**

If a local Splunk Enterprise is available (via splunk_install_app_local MCP tool or similar):
1. Build `aurora-exec-hero` into a workspace, run through ds-create → ds-deploy → install.
2. Open in Splunk Web, confirm it renders without errors.
3. Repeat for `aurora-noc-wall`.

- [ ] **Step 3: Manual verification — Cloud (deferred if not available)**

If a Splunk Cloud test stack exists, install the same apps there. Record results in a note on the PR.

- [ ] **Step 4: Push and fast-forward main**

```bash
git push
git checkout main
git merge --ff-only splunk-dashboards-foundation
git push origin main
git checkout splunk-dashboards-foundation
```

---

## Deliverables when sub-plan 13 closes

- [x] `aurora_score.py` + `aurora_score_rules.py` with 10 rules (weights sum to 10.0)
- [x] `PolishScore` with `value`, `findings`, `wins`, `gaps` properties
- [x] `render_markdown(score)` helper produces ds-review output
- [x] ds-review SKILL.md shows how to invoke the scorecard
- [x] plugin.json at v0.10.0
- [x] README.md updated with Aurora section
- [x] Full test count: ~165–170 green, 0 failures
- [x] Both flagship templates installed and rendering on Enterprise (Cloud optional)

**Aurora v1 is complete.**

Future (Aurora v2 — separate spec): custom viz packs via `viz_packs/`, additional themes (e.g. cyberpunk), additional patterns, richer template gallery.
