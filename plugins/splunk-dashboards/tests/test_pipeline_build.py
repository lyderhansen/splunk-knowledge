"""Integration test — full pipeline from init through build."""
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


def test_full_pipeline_through_build(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)

    # 1. ds-init
    r = _run(
        "splunk_dashboards.requirements",
        ["from-json", "-"],
        tmp_path,
        stdin=json.dumps({
            "project": "build-demo",
            "goal": "Full pipeline through build stage",
            "role": "Developer",
            "audience": "Self",
            "focus": "Mixed",
            "questions": ["How many events?"],
            "has_data": "no",
            "indexes": [],
            "customization": "moderate",
            "nice_to_haves": [],
            "reference_dashboard": None,
        }),
    )
    assert r.returncode == 0, r.stderr

    # 2. ds-mock
    r = _run(
        "splunk_dashboards.data_sources",
        ["write", "-"],
        tmp_path,
        stdin=json.dumps({
            "project": "build-demo",
            "source": "mock",
            "sources": [
                {"question": "How many events?", "spl": "| makeresults count=1 | eval c=42", "earliest": "-24h", "latest": "now", "name": "Event Count"},
            ],
        }),
    )
    assert r.returncode == 0, r.stderr

    # 3. ds-design — simulate Save & Exit with one panel bound to our question
    server = create_server(project="build-demo", port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        body = json.dumps({
            "project": "build-demo",
            "theme": "dark",
            "panels": [
                {
                    "id": "p1", "title": "Event Count",
                    "x": 0, "y": 0, "w": 6, "h": 4,
                    "viz_type": "splunk.singlevalue",
                    "data_source_ref": "How many events?",
                }
            ],
        }).encode()
        req = urllib.request.Request(
            f"http://{host}:{port}/save",
            data=body, method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 200
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)

    assert load_state("build-demo").current_stage == "designed"

    # 4. ds-create build
    r = _run(
        "splunk_dashboards.create",
        ["build", "build-demo", "--title", "Build Demo", "--description", "End-to-end test"],
        tmp_path,
    )
    assert r.returncode == 0, r.stderr

    # 5. Verify dashboard.json
    ws = tmp_path / ".splunk-dashboards" / "build-demo"
    dashboard = json.loads((ws / "dashboard.json").read_text())
    assert dashboard["title"] == "Build Demo"
    viz = dashboard["visualizations"]["viz_p1"]
    assert viz["type"] == "splunk.singlevalue"
    assert viz["dataSources"]["primary"] == "ds_1"
    assert "makeresults count=1" in dashboard["dataSources"]["ds_1"]["options"]["query"]

    # 7. State advanced to 'built'
    state = load_state("build-demo")
    assert state.current_stage == "built"
    assert "designed" in state.stages_completed
