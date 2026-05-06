"""Tests for design module (HTTP handlers, not the server itself)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from splunk_dashboards.design import (
    handle_get_layout,
    handle_post_save,
    StageAdvanceError,
)
from splunk_dashboards.layout import Layout, Panel, save_layout
from splunk_dashboards.workspace import (
    init_workspace,
    load_state,
    advance_stage,
    save_state,
)


def _prepare_workspace_at_data_ready(tmp_path, monkeypatch, project="my-dash"):
    monkeypatch.chdir(tmp_path)
    state = init_workspace(project, autopilot=False)
    advance_stage(state, "data-ready")
    save_state(state)
    return tmp_path


def test_get_layout_returns_existing(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    save_layout(Layout(project="my-dash", panels=[Panel(id="p1", title="T1")]))
    status, body = handle_get_layout("my-dash")
    assert status == 200
    data = json.loads(body)
    assert data["project"] == "my-dash"
    assert len(data["panels"]) == 1


def test_get_layout_returns_empty_layout_when_missing(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    status, body = handle_get_layout("my-dash")
    assert status == 200
    data = json.loads(body)
    assert data["project"] == "my-dash"
    assert data["panels"] == []


def test_post_save_persists_and_advances_state(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    payload = json.dumps({
        "project": "my-dash",
        "theme": "dark",
        "panels": [
            {"id": "p1", "title": "T1", "x": 0, "y": 0, "w": 6, "h": 4,
             "viz_type": "splunk.singlevalue", "data_source_ref": None}
        ]
    })
    status, msg = handle_post_save("my-dash", payload)
    assert status == 200
    state = load_state("my-dash")
    assert state.current_stage == "designed"
    assert "data-ready" in state.stages_completed


def test_post_save_rejects_wrong_project(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    payload = json.dumps({"project": "wrong-name", "panels": []})
    status, msg = handle_post_save("my-dash", payload)
    assert status == 400
    assert "project" in msg.lower()


def test_post_save_rejects_invalid_json(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    status, msg = handle_post_save("my-dash", "{not json")
    assert status == 400


def test_post_save_rejects_wrong_stage(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    payload = json.dumps({"project": "my-dash", "panels": []})
    with pytest.raises(StageAdvanceError):
        handle_post_save("my-dash", payload)


import threading
import time
import urllib.request
import urllib.error
from splunk_dashboards.design import create_server


def test_server_serves_get_layout_and_accepts_post_save(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)

    server = create_server(project="my-dash", port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with urllib.request.urlopen(f"http://{host}:{port}/api/layout", timeout=5) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode())
            assert data["project"] == "my-dash"
            assert data["panels"] == []

        body = json.dumps({
            "project": "my-dash",
            "theme": "dark",
            "panels": [
                {"id": "p1", "title": "T1", "x": 0, "y": 0, "w": 6, "h": 4,
                 "viz_type": "splunk.line", "data_source_ref": None}
            ]
        }).encode()
        req = urllib.request.Request(
            f"http://{host}:{port}/save",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 200
            result = json.loads(resp.read().decode())
            assert result["status"] == "saved"
            assert result["panels"] == 1

        state = load_state("my-dash")
        assert state.current_stage == "designed"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def test_server_serves_wireframe_html_on_root(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    server = create_server(project="my-dash", port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with urllib.request.urlopen(f"http://{host}:{port}/", timeout=5) as resp:
            assert resp.status == 200
            content = resp.read().decode()
            assert "gridstack" in content.lower()
            assert "save" in content.lower()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
