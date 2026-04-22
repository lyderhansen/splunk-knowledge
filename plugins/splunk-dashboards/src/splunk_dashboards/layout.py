"""Layout model for ds-design wireframes."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Literal, Optional

VIZ_TYPES: list[str] = [
    "splunk.singlevalue",
    "splunk.line",
    "splunk.column",
    "splunk.bar",
    "splunk.pie",
    "splunk.area",
    "splunk.table",
    "splunk.timeline",
    "splunk.choropleth",
    "splunk.markergauge",
]


@dataclass
class Panel:
    id: str
    title: str
    x: int = 0
    y: int = 0
    w: int = 6
    h: int = 4
    viz_type: str = "splunk.singlevalue"
    data_source_ref: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "Panel":
        return cls(**data)
