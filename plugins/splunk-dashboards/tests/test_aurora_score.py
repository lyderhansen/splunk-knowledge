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
