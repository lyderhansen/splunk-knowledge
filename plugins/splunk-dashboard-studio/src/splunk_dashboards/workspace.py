"""Workspace and state management for splunk-dashboards."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

STAGES: list[str] = [
    "scoped",
    "data-ready",
    "designed",
    "built",
    "validated",
    "deployed",
    "reviewed",
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@dataclass
class WorkspaceState:
    project: str
    created: str = field(default_factory=_now_iso)
    current_stage: str = "scoped"
    stages_completed: list[str] = field(default_factory=list)
    data_path: Optional[str] = None
    autopilot: bool = False

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "WorkspaceState":
        return cls(**data)


WORKSPACE_ROOT = ".splunk-dashboards"


def get_workspace_dir(project: str, cwd: Optional[Path] = None) -> Path:
    base = cwd if cwd is not None else Path.cwd()
    return base / WORKSPACE_ROOT / project


def workspace_exists(project: str, cwd: Optional[Path] = None) -> bool:
    return (get_workspace_dir(project, cwd) / "state.json").exists()


def init_workspace(project: str, autopilot: bool = False, cwd: Optional[Path] = None) -> WorkspaceState:
    ws = get_workspace_dir(project, cwd)
    state_path = ws / "state.json"
    if state_path.exists():
        return load_state(project, cwd)
    ws.mkdir(parents=True, exist_ok=True)
    state = WorkspaceState(project=project, autopilot=autopilot)
    _write_state_file(state_path, state)
    return state


def load_state(project: str, cwd: Optional[Path] = None) -> WorkspaceState:
    state_path = get_workspace_dir(project, cwd) / "state.json"
    data = json.loads(state_path.read_text(encoding="utf-8"))
    return WorkspaceState.from_dict(data)


def save_state(state: WorkspaceState, cwd: Optional[Path] = None) -> None:
    state_path = get_workspace_dir(state.project, cwd) / "state.json"
    _write_state_file(state_path, state)


def _write_state_file(path: Path, state: WorkspaceState) -> None:
    path.write_text(json.dumps(state.to_dict(), indent=2) + "\n", encoding="utf-8")


class InvalidStageTransition(Exception):
    pass


def advance_stage(state: WorkspaceState, target: str, allow_backward: bool = False) -> WorkspaceState:
    if target not in STAGES:
        raise InvalidStageTransition(f"Unknown stage: {target}")
    current_idx = STAGES.index(state.current_stage)
    target_idx = STAGES.index(target)
    if not allow_backward and target_idx != current_idx + 1:
        raise InvalidStageTransition(
            f"Cannot advance from {state.current_stage} to {target}"
        )
    if state.current_stage not in state.stages_completed:
        state.stages_completed.append(state.current_stage)
    state.current_stage = target
    return state


def _cli(argv: Optional[list[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.workspace")
    sub = parser.add_subparsers(dest="command", required=True)
    init_p = sub.add_parser("init", help="Create a new workspace")
    init_p.add_argument("project")
    init_p.add_argument("--autopilot", action="store_true")

    args = parser.parse_args(argv)
    if args.command == "init":
        state = init_workspace(args.project, autopilot=args.autopilot)
        print(f"Workspace initialized: {get_workspace_dir(state.project)}")
        return 0
    return 1


if __name__ == "__main__":
    import sys

    sys.exit(_cli())
