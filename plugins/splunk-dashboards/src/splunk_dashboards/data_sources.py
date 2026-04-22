"""Data source model and I/O for ds-data-explore and ds-mock."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Literal, Optional

from splunk_dashboards.workspace import get_workspace_dir

Source = Literal["mock", "explore"]


@dataclass
class DataSource:
    question: str
    spl: str
    earliest: str = "-24h"
    latest: str = "now"
    name: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "DataSource":
        return cls(**data)


@dataclass
class DataSources:
    project: str
    source: Source = "mock"
    sources: list[DataSource] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "project": self.project,
            "source": self.source,
            "sources": [s.to_dict() for s in self.sources],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "DataSources":
        return cls(
            project=data["project"],
            source=data.get("source", "mock"),
            sources=[DataSource.from_dict(s) for s in data.get("sources", [])],
        )


DATA_SOURCES_FILENAME = "data-sources.json"


def _data_sources_path(project: str, cwd: Optional[Path] = None) -> Path:
    return get_workspace_dir(project, cwd) / DATA_SOURCES_FILENAME


def save_data_sources(coll: DataSources, cwd: Optional[Path] = None) -> None:
    ws = get_workspace_dir(coll.project, cwd)
    if not ws.exists():
        raise FileNotFoundError(f"Workspace does not exist: {ws}")
    path = ws / DATA_SOURCES_FILENAME
    path.write_text(json.dumps(coll.to_dict(), indent=2) + "\n", encoding="utf-8")


def load_data_sources(project: str, cwd: Optional[Path] = None) -> DataSources:
    path = _data_sources_path(project, cwd)
    data = json.loads(path.read_text(encoding="utf-8"))
    return DataSources.from_dict(data)
