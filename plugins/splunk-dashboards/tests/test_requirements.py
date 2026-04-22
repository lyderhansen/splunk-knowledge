"""Tests for requirements module."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.requirements import Requirements, render_markdown


def test_requirements_defaults():
    r = Requirements(project="test", goal="Monitor failed logins")
    assert r.project == "test"
    assert r.goal == "Monitor failed logins"
    assert r.role == "Developer"
    assert r.audience == "Self"
    assert r.focus == "Mixed"
    assert r.questions == []
    assert r.has_data == "no"
    assert r.indexes == []
    assert r.customization == "moderate"
    assert r.nice_to_haves == []
    assert r.reference_dashboard is None


def test_render_markdown_contains_all_sections():
    r = Requirements(
        project="auth-monitoring",
        goal="Surface suspicious authentication activity",
        role="SOC analyst",
        audience="Team",
        focus="Technical",
        questions=[
            "What are the top failed login sources?",
            "Which users have repeated failures?",
        ],
        has_data="yes",
        indexes=["auth", "windows"],
        customization="bespoke",
        nice_to_haves=["drilldowns", "tokens"],
        reference_dashboard=None,
    )
    md = render_markdown(r)
    assert "# Dashboard: auth-monitoring" in md
    assert "Surface suspicious authentication activity" in md
    assert "- Role: SOC analyst" in md
    assert "- Audience: Team" in md
    assert "- Focus: Technical" in md
    assert "1. What are the top failed login sources?" in md
    assert "2. Which users have repeated failures?" in md
    assert "- Has data: yes" in md
    assert "- Indexes: auth, windows" in md
    assert "- Customization: bespoke" in md
    assert "- Nice-to-haves: drilldowns, tokens" in md


def test_render_markdown_routes_to_data_explore_when_has_data():
    r = Requirements(project="x", goal="g", has_data="yes")
    md = render_markdown(r)
    assert "→ ds-data-explore" in md


def test_render_markdown_routes_to_mock_when_no_data():
    r = Requirements(project="x", goal="g", has_data="no")
    md = render_markdown(r)
    assert "→ ds-mock" in md


def test_render_markdown_routes_to_both_when_partial():
    r = Requirements(project="x", goal="g", has_data="partial")
    md = render_markdown(r)
    assert "→ ds-data-explore" in md
    assert "→ ds-mock" in md
