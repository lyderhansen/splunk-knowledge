"""Integration test — chain ds-init (requirements) into ds-mock (data-sources)."""
import json
import os
import subprocess
import sys
from pathlib import Path


def _run(module, args, cwd, stdin=None):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    return subprocess.run(
        [sys.executable, "-m", module, *args],
        cwd=cwd,
        env=env,
        input=stdin,
        capture_output=True,
        text=True,
    )


def test_pipeline_init_then_mock_advances_to_data_ready(tmp_path):
    # Step 1: ds-init writes requirements.md and creates workspace at scoped stage.
    init_payload = {
        "project": "pipeline-demo",
        "goal": "Demo that the pipeline advances state correctly",
        "role": "Developer",
        "audience": "Self",
        "focus": "Mixed",
        "questions": ["What happened?", "How often?"],
        "has_data": "no",
        "indexes": [],
        "customization": "moderate",
        "nice_to_haves": [],
        "reference_dashboard": None
    }
    r1 = _run(
        "splunk_dashboards.requirements",
        ["from-json", "-"],
        cwd=tmp_path,
        stdin=json.dumps(init_payload),
    )
    assert r1.returncode == 0, r1.stderr

    ws = tmp_path / ".splunk-dashboards" / "pipeline-demo"
    state_after_init = json.loads((ws / "state.json").read_text())
    assert state_after_init["current_stage"] == "scoped"

    # Step 2: ds-mock writes data-sources.json and advances state.
    mock_payload = {
        "project": "pipeline-demo",
        "source": "mock",
        "sources": [
            {
                "question": "What happened?",
                "spl": "| makeresults count=10 | eval event=\"demo\"",
                "earliest": "-24h",
                "latest": "now",
                "name": "Demo Events"
            },
            {
                "question": "How often?",
                "spl": "| makeresults count=10 | timechart span=1h count",
                "earliest": "-24h",
                "latest": "now",
                "name": "Event Rate"
            }
        ]
    }
    r2 = _run(
        "splunk_dashboards.data_sources",
        ["write", "-"],
        cwd=tmp_path,
        stdin=json.dumps(mock_payload),
    )
    assert r2.returncode == 0, r2.stderr

    state_after_mock = json.loads((ws / "state.json").read_text())
    assert state_after_mock["current_stage"] == "data-ready"
    assert "scoped" in state_after_mock["stages_completed"]

    coll = json.loads((ws / "data-sources.json").read_text())
    assert coll["source"] == "mock"
    assert len(coll["sources"]) == 2
    assert coll["sources"][0]["name"] == "Demo Events"
