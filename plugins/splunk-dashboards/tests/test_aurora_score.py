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
    """An empty dashboard should not hit a perfect score — theme-applied definitively fails."""
    score = evaluate(_minimal_dashboard())
    # Empty dashboard: only theme-applied fails definitively; most other rules
    # return "pass" for N/A (no KPIs, no charts, no panels to evaluate).
    # Score is not perfect because at minimum theme-applied (weight 0.8) fails,
    # reflecting the no-penalty-for-absence policy for the other 9 rules.
    assert score.value < 9.5


def _themed_dashboard():
    d = _minimal_dashboard()
    d["layout"]["options"]["backgroundColor"] = "#0b0c0e"
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
    assert r.level == "pass"  # N/A because <= 6 panels


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
                   "options": {"majorColor": "#006D9C"}},  # blue - wrong for failure
    }
    score = evaluate(d)
    r = next(f for f in score.findings if f.rule == "semantic-colors")
    assert r.level == "fail"


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
    d = _minimal_dashboard()  # no theme -> lots of gaps
    md = render_markdown(evaluate(d))
    assert "ds-create build" in md or "--pattern" in md  # at least one suggestion surfaces
