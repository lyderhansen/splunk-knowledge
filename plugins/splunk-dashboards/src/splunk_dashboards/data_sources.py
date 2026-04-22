"""Data source model and I/O for ds-data-explore and ds-mock."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Literal, Optional

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
