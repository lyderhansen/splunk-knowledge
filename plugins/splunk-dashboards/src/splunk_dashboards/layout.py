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


Theme = Literal["light", "dark"]


@dataclass
class Layout:
    project: str
    theme: Theme = "dark"
    panels: list[Panel] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "project": self.project,
            "theme": self.theme,
            "panels": [p.to_dict() for p in self.panels],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Layout":
        return cls(
            project=data["project"],
            theme=data.get("theme", "dark"),
            panels=[Panel.from_dict(p) for p in data.get("panels", [])],
        )


import json
from pathlib import Path

from splunk_dashboards.workspace import get_workspace_dir

DESIGN_SUBDIR = "design"
LAYOUT_FILENAME = "layout.json"


def layout_path(project: str, cwd: Optional[Path] = None) -> Path:
    return get_workspace_dir(project, cwd) / DESIGN_SUBDIR / LAYOUT_FILENAME


def save_layout(layout: Layout, cwd: Optional[Path] = None) -> None:
    ws = get_workspace_dir(layout.project, cwd)
    if not ws.exists():
        raise FileNotFoundError(f"Workspace does not exist: {ws}")
    path = ws / DESIGN_SUBDIR / LAYOUT_FILENAME
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(layout.to_dict(), indent=2) + "\n", encoding="utf-8")


def load_layout(project: str, cwd: Optional[Path] = None) -> Layout:
    path = layout_path(project, cwd)
    data = json.loads(path.read_text(encoding="utf-8"))
    return Layout.from_dict(data)
