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
