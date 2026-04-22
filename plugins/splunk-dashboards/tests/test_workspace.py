"""Tests for workspace module."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.workspace import WorkspaceState, STAGES


def test_workspace_state_defaults():
    state = WorkspaceState(project="my-dashboard")
    assert state.project == "my-dashboard"
    assert state.current_stage == "scoped"
    assert state.stages_completed == []
    assert state.data_path is None
    assert state.autopilot is False
    assert state.created  # ISO timestamp string, non-empty


def test_workspace_state_to_dict_roundtrip():
    state = WorkspaceState(
        project="test",
        current_stage="designed",
        stages_completed=["scoped", "data-ready"],
        data_path="mock",
        autopilot=True,
    )
    data = state.to_dict()
    restored = WorkspaceState.from_dict(data)
    assert restored == state


def test_stages_sequence():
    assert STAGES == [
        "scoped",
        "data-ready",
        "designed",
        "built",
        "validated",
        "deployed",
        "reviewed",
    ]


from splunk_dashboards.workspace import (
    get_workspace_dir,
    init_workspace,
    load_state,
    save_state,
    workspace_exists,
)


def test_get_workspace_dir_resolves_under_cwd(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = get_workspace_dir("my-dash")
    assert result == tmp_path / ".splunk-dashboards" / "my-dash"


def test_init_workspace_creates_scaffolding(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    ws = tmp_path / ".splunk-dashboards" / "my-dash"
    assert ws.exists()
    assert (ws / "state.json").exists()
    assert state.project == "my-dash"
    assert state.current_stage == "scoped"


def test_init_workspace_is_idempotent(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state1 = init_workspace("my-dash", autopilot=False)
    state2 = init_workspace("my-dash", autopilot=False)
    # Second call returns the existing state, does not overwrite
    assert state1.created == state2.created


def test_save_and_load_state_roundtrip(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    state.current_stage = "data-ready"
    state.stages_completed = ["scoped"]
    save_state(state)
    loaded = load_state("my-dash")
    assert loaded.current_stage == "data-ready"
    assert loaded.stages_completed == ["scoped"]


def test_workspace_exists(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert workspace_exists("my-dash") is False
    init_workspace("my-dash", autopilot=False)
    assert workspace_exists("my-dash") is True


import pytest
from splunk_dashboards.workspace import advance_stage, InvalidStageTransition


def test_advance_stage_moves_to_next(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    advanced = advance_stage(state, "data-ready")
    assert advanced.current_stage == "data-ready"
    assert advanced.stages_completed == ["scoped"]


def test_advance_stage_rejects_skipping(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    with pytest.raises(InvalidStageTransition):
        advance_stage(state, "built")  # skips data-ready and designed


def test_advance_stage_allows_update_loop(tmp_path, monkeypatch):
    # deployed -> validated is legal (ds-update loops back through validate)
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    state.current_stage = "deployed"
    state.stages_completed = ["scoped", "data-ready", "designed", "built", "validated"]
    advanced = advance_stage(state, "validated", allow_backward=True)
    assert advanced.current_stage == "validated"


def test_advance_stage_rejects_unknown_stage(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    with pytest.raises(InvalidStageTransition):
        advance_stage(state, "nonsense")
