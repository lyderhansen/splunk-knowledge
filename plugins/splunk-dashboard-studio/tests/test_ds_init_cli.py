"""Integration test for the ds-init CLI — writes requirements from a JSON payload."""
import json
import os
import subprocess
import sys
from pathlib import Path


def _run(args, cwd, stdin=None):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    return subprocess.run(
        [sys.executable, "-m", "splunk_dashboards.requirements", *args],
        cwd=cwd,
        env=env,
        input=stdin,
        capture_output=True,
        text=True,
    )


def test_ds_init_writes_workspace_and_requirements(tmp_path):
    answers = {
        "project": "auth-monitoring",
        "goal": "Surface suspicious authentication activity",
        "role": "SOC analyst",
        "audience": "Team",
        "focus": "Technical",
        "questions": [
            "What are the top failed login sources?",
            "Which users have repeated failures?",
        ],
        "has_data": "yes",
        "indexes": ["auth", "windows"],
        "customization": "moderate",
        "nice_to_haves": ["drilldowns"],
        "reference_dashboard": None,
    }
    result = _run(["from-json", "-"], cwd=tmp_path, stdin=json.dumps(answers))
    assert result.returncode == 0, result.stderr

    ws = tmp_path / ".splunk-dashboards" / "auth-monitoring"
    assert (ws / "state.json").exists()
    assert (ws / "requirements.md").exists()

    state = json.loads((ws / "state.json").read_text())
    assert state["project"] == "auth-monitoring"
    assert state["current_stage"] == "scoped"

    md = (ws / "requirements.md").read_text()
    assert "Surface suspicious authentication activity" in md
    assert "→ ds-data-explore" in md  # routed because has_data=yes
