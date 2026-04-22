"""Requirements gathering output for ds-init."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

HasData = Literal["yes", "no", "partial"]
Customization = Literal["template", "moderate", "bespoke"]


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
