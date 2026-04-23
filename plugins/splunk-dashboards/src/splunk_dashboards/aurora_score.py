"""Aurora polish scorecard — measures how 'designed' a dashboard is.

Ten weighted rules. Each returns pass/partial/fail + a human message.
Score = sum(rule.weight * level_factor) where factor is 1.0/0.5/0.0 for
pass/partial/fail. Weights sum to 10, so the total is 0–10.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Literal, List


Level = Literal["pass", "partial", "fail"]
LEVEL_FACTOR = {"pass": 1.0, "partial": 0.5, "fail": 0.0}


@dataclass
class Finding:
    rule: str
    level: Level
    message: str
    suggestion: str = ""  # optional ds-update CLI hint


@dataclass
class ScoringRule:
    name: str
    weight: float
    check: Callable[[dict], Finding]


@dataclass
class PolishScore:
    value: float  # 0.0 - 10.0
    findings: List[Finding] = field(default_factory=list)

    @property
    def wins(self) -> List[Finding]:
        return [f for f in self.findings if f.level == "pass"]

    @property
    def gaps(self) -> List[Finding]:
        return [f for f in self.findings if f.level != "pass"]


# ----- Rules registered below (tasks T13-2..T13-4) -----

RULES: List[ScoringRule] = []


def register_rule(rule: ScoringRule) -> None:
    RULES.append(rule)


def evaluate(dashboard: dict) -> PolishScore:
    findings = [rule.check(dashboard) for rule in RULES]
    total = sum(rule.weight * LEVEL_FACTOR[f.level] for rule, f in zip(RULES, findings))
    return PolishScore(value=round(total, 2), findings=findings)


def render_markdown(score: PolishScore) -> str:
    lines = ["## Polish scorecard", "", f"**Score: {score.value} / 10**", ""]
    wins = score.wins
    gaps = score.gaps
    if wins:
        lines.append("### Wins")
        for f in wins:
            lines.append(f"- [{f.level}] **{f.rule}** — {f.message}")
        lines.append("")
    if gaps:
        lines.append("### Gaps")
        for f in gaps:
            item = f"- [{f.level}] **{f.rule}** — {f.message}"
            if f.suggestion:
                item += f"\n  _Suggestion:_ `{f.suggestion}`"
            lines.append(item)
        lines.append("")
    return "\n".join(lines)


# Rule module imports (self-registering). Kept at bottom to avoid circular.
from splunk_dashboards import aurora_score_rules  # noqa: E402, F401
