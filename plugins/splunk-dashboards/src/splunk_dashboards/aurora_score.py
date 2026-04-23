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


# Rule module imports (self-registering). Kept at bottom to avoid circular.
from splunk_dashboards import aurora_score_rules  # noqa: E402, F401
