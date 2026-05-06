"""Requirements gathering output for ds-init."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

HasData = Literal["yes", "no", "partial"]
Customization = Literal["standard", "moderate", "bespoke"]


@dataclass
class Requirements:
    project: str
    goal: str
    role: str = "Developer"
    audience: str = "Self"
    focus: str = "Mixed"
    questions: list[str] = field(default_factory=list)
    has_data: HasData = "no"
    indexes: list[str] = field(default_factory=list)
    customization: Customization = "moderate"
    nice_to_haves: list[str] = field(default_factory=list)
    reference_dashboard: Optional[str] = None


def _next_step(has_data: HasData) -> str:
    if has_data == "yes":
        return "→ ds-data-explore"
    if has_data == "no":
        return "→ ds-mock"
    return "→ ds-data-explore\n→ ds-mock"


def render_markdown(r: Requirements) -> str:
    questions = "\n".join(f"  {i + 1}. {q}" for i, q in enumerate(r.questions)) or "  (none specified)"
    indexes = ", ".join(r.indexes) if r.indexes else "(none)"
    nice = ", ".join(r.nice_to_haves) if r.nice_to_haves else "(none)"
    ref = r.reference_dashboard or "(none)"

    return (
        f"# Dashboard: {r.project}\n\n"
        f"## Context\n"
        f"- Role: {r.role}\n"
        f"- Audience: {r.audience}\n"
        f"- Primary goal: {r.goal}\n\n"
        f"## Content\n"
        f"- Focus: {r.focus}\n"
        f"- Questions the dashboard should answer:\n{questions}\n"
        f"- Reference dashboard: {ref}\n\n"
        f"## Data\n"
        f"- Has data: {r.has_data}\n"
        f"- Indexes: {indexes}\n\n"
        f"## Scope\n"
        f"- Customization: {r.customization}\n"
        f"- Nice-to-haves: {nice}\n\n"
        f"## Next step\n"
        f"{_next_step(r.has_data)}\n"
    )


import json as _json
import sys as _sys
from pathlib import Path as _Path

from splunk_dashboards.workspace import init_workspace, get_workspace_dir


def _cli(argv: Optional[list[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.requirements")
    sub = parser.add_subparsers(dest="command", required=True)
    from_json = sub.add_parser(
        "from-json",
        help="Build requirements.md from an answers JSON payload",
    )
    from_json.add_argument(
        "source",
        help='Path to JSON file, or "-" to read from stdin',
    )

    args = parser.parse_args(argv)

    if args.command == "from-json":
        raw = _sys.stdin.read() if args.source == "-" else _Path(args.source).read_text(encoding="utf-8")
        payload = _json.loads(raw)
        r = Requirements(
            project=payload["project"],
            goal=payload["goal"],
            role=payload.get("role", "Developer"),
            audience=payload.get("audience", "Self"),
            focus=payload.get("focus", "Mixed"),
            questions=payload.get("questions", []),
            has_data=payload.get("has_data", "no"),
            indexes=payload.get("indexes", []),
            customization=payload.get("customization", "moderate"),
            nice_to_haves=payload.get("nice_to_haves", []),
            reference_dashboard=payload.get("reference_dashboard"),
        )
        init_workspace(r.project, autopilot=payload.get("autopilot", False))
        ws = get_workspace_dir(r.project)
        (ws / "requirements.md").write_text(render_markdown(r), encoding="utf-8")
        print(f"Wrote {ws / 'requirements.md'}")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
