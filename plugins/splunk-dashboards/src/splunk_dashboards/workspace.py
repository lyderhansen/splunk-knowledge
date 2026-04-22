"""Workspace and state management for splunk-dashboards."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
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
