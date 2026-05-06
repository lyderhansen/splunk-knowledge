"""Integration test — chain ds-init, ds-mock, and ds-design handlers."""
import json
import os
import subprocess
import sys
import threading
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.design import create_server
from splunk_dashboards.workspace import load_state


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


def test_full_pipeline_init_mock_design(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)

    # 1. ds-init
    init_payload = {
        "project": "full-pipeline",
        "goal": "End-to-end pipeline through design stage",
        "role": "Developer",
        "audience": "Self",
        "focus": "Mixed",
        "questions": ["Q1?", "Q2?"],
        "has_data": "no",
        "indexes": [],
        "customization": "moderate",
        "nice_to_haves": [],
        "reference_dashboard": None
    }
    r1 = _run("splunk_dashboards.requirements", ["from-json", "-"], tmp_path, stdin=json.dumps(init_payload))
    assert r1.returncode == 0, r1.stderr

    # 2. ds-mock
    mock_payload = {
        "project": "full-pipeline",
        "source": "mock",
        "sources": [
            {"question": "Q1?", "spl": "| makeresults count=10", "earliest": "-24h", "latest": "now", "name": "Q1"},
            {"question": "Q2?", "spl": "| makeresults count=10", "earliest": "-24h", "latest": "now", "name": "Q2"},
        ]
    }
    r2 = _run("splunk_dashboards.data_sources", ["write", "-"], tmp_path, stdin=json.dumps(mock_payload))
    assert r2.returncode == 0, r2.stderr
    state = load_state("full-pipeline")
    assert state.current_stage == "data-ready"

    # 3. ds-design — start from an empty canvas, add one panel via POST
    server = create_server(project="full-pipeline", port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        body = json.dumps({
            "project": "full-pipeline",
            "theme": "dark",
            "panels": [
                {
                    "id": "p1", "title": "Q1",
                    "x": 0, "y": 0, "w": 6, "h": 4,
                    "viz_type": "splunk.singlevalue",
                    "data_source_ref": "Q1?",
                }
            ],
        }).encode()
        req = urllib.request.Request(
            f"http://{host}:{port}/save",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 200
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)

    # 4. State is now 'designed'
    state = load_state("full-pipeline")
    assert state.current_stage == "designed"
    assert "data-ready" in state.stages_completed
