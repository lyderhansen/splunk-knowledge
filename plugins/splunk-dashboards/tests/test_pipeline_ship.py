"""Integration test — full pipeline from init through deploy."""
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


def test_full_pipeline_through_deploy(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    project = "ship-demo"

    # 1. ds-init
    r = _run("splunk_dashboards.requirements", ["from-json", "-"], tmp_path, stdin=json.dumps({
        "project": project, "goal": "Ship pipeline", "role": "Developer", "audience": "Self",
        "focus": "Mixed", "questions": ["How many events?"], "has_data": "no", "indexes": [],
        "customization": "moderate", "nice_to_haves": [], "reference_dashboard": None,
    }))
    assert r.returncode == 0, r.stderr

    # 2. ds-mock
    r = _run("splunk_dashboards.data_sources", ["write", "-"], tmp_path, stdin=json.dumps({
        "project": project, "source": "mock",
        "sources": [{"question": "How many events?", "spl": "| makeresults count=1 | eval c=42",
                     "earliest": "-24h", "latest": "now", "name": "Events"}],
    }))
    assert r.returncode == 0, r.stderr

    # 3. ds-design Save
    server = create_server(project=project, port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        body = json.dumps({
            "project": project, "theme": "dark",
            "panels": [{"id": "p1", "title": "Events", "x": 0, "y": 0, "w": 6, "h": 4,
                        "viz_type": "splunk.singlevalue", "data_source_ref": "How many events?"}]
        }).encode()
        req = urllib.request.Request(f"http://{host}:{port}/save", data=body, method="POST",
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 200
    finally:
        server.shutdown(); server.server_close(); thread.join(timeout=2)

    # 4. ds-create
    r = _run("splunk_dashboards.create", ["build", project, "--title", "Ship Demo"], tmp_path)
    assert r.returncode == 0, r.stderr

    # 5. ds-validate — should pass cleanly
    r = _run("splunk_dashboards.validate", ["check", project], tmp_path)
    assert r.returncode == 0, r.stderr
    assert load_state(project).current_stage == "validated"

    # 6. ds-deploy with --as-app — produces XML + TA tarball
    r = _run("splunk_dashboards.deploy",
             ["build", project, "--label", "Ship Demo", "--as-app"], tmp_path)
    assert r.returncode == 0, r.stderr

    ws = tmp_path / ".splunk-dashboards" / project
    assert (ws / "dashboard.xml").exists()
    xml = (ws / "dashboard.xml").read_text()
    assert '<dashboard version="2"' in xml
    assert "<label>Ship Demo</label>" in xml

    tarballs = list(ws.glob("*.tar.gz"))
    assert len(tarballs) == 1

    # 7. State is 'deployed'
    state = load_state(project)
    assert state.current_stage == "deployed"
    assert "validated" in state.stages_completed
