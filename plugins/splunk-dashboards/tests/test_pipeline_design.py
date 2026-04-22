"""Integration test — chain ds-init, ds-mock, ds-template, and ds-design handlers."""
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


def test_full_pipeline_init_mock_template_design(tmp_path, monkeypatch):
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
        "customization": "template",
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

    # 3. ds-template load
    r3 = _run(
        "splunk_dashboards.templates",
        ["load", "ops-health", "--project", "full-pipeline"],
        tmp_path,
    )
    assert r3.returncode == 0, r3.stderr
    ws = tmp_path / ".splunk-dashboards" / "full-pipeline"
    assert (ws / "design" / "layout.json").exists()
    state = load_state("full-pipeline")
    assert state.current_stage == "data-ready"

    # 4. ds-design — simulate the browser's Save & Exit with a POST
    server = create_server(project="full-pipeline", port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with urllib.request.urlopen(f"http://{host}:{port}/api/layout", timeout=5) as resp:
            seeded = json.loads(resp.read().decode())
        assert len(seeded["panels"]) >= 1

        body = json.dumps(seeded).encode()
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

    # 5. State is now 'designed'
    state = load_state("full-pipeline")
    assert state.current_stage == "designed"
    assert "data-ready" in state.stages_completed
