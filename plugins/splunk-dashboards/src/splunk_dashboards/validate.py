"""Lint checks for a Splunk Dashboard Studio JSON definition."""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

Severity = Literal["error", "warning", "info"]

# Tokens defined automatically by Dashboard Studio even when not declared in `inputs`.
BUILT_IN_TOKENS = {"global_time", "earliest", "latest", "row", "click"}

# Match $name$ or $name.sub$, but NOT $$ (escaped dollar).
TOKEN_RE = re.compile(r"\$([a-zA-Z_][\w.]*)\$")


@dataclass
class Finding:
    severity: Severity
    code: str
    message: str


def check_data_source_names(dashboard: dict) -> list[Finding]:
    findings: list[Finding] = []
    for key, ds in dashboard.get("dataSources", {}).items():
        if ds.get("type") == "ds.search" and not ds.get("name"):
            findings.append(Finding(
                severity="error",
                code="ds.search-missing-name",
                message=f"dataSource '{key}' (ds.search) is missing required 'name' field",
            ))
    return findings


def check_panel_data_source_refs(dashboard: dict) -> list[Finding]:
    known = set(dashboard.get("dataSources", {}).keys())
    findings: list[Finding] = []
    for viz_id, viz in dashboard.get("visualizations", {}).items():
        for role, ref in viz.get("dataSources", {}).items():
            if ref and ref not in known:
                findings.append(Finding(
                    severity="error",
                    code="viz-unknown-data-source",
                    message=f"visualization '{viz_id}' references unknown dataSource '{ref}' (role: {role})",
                ))
    return findings


def _collect_declared_tokens(dashboard: dict) -> set[str]:
    tokens: set[str] = set(BUILT_IN_TOKENS)
    for inp in dashboard.get("inputs", {}).values():
        token = (inp.get("options") or {}).get("token")
        if token:
            tokens.add(token)
    # defaults can also set tokens
    for key in (dashboard.get("defaults") or {}):
        if key == "tokens":
            tokens.update(dashboard["defaults"]["tokens"].keys())
    return tokens


def _find_token_refs_in_text(text: str) -> set[str]:
    return {m.split(".")[0] for m in TOKEN_RE.findall(text or "")}


def check_token_references(dashboard: dict) -> list[Finding]:
    declared = _collect_declared_tokens(dashboard)
    findings: list[Finding] = []
    # SPL queries
    for ds_id, ds in dashboard.get("dataSources", {}).items():
        query = (ds.get("options") or {}).get("query", "")
        for ref in _find_token_refs_in_text(query):
            if ref not in declared:
                findings.append(Finding(
                    severity="warning",
                    code="token-undeclared",
                    message=f"dataSource '{ds_id}' references token '{ref}' which is not declared in inputs or defaults",
                ))
    return findings


def check_drilldown_targets(dashboard: dict) -> list[Finding]:
    known_vizes = set(dashboard.get("visualizations", {}).keys())
    findings: list[Finding] = []
    for viz_id, viz in dashboard.get("visualizations", {}).items():
        action = (viz.get("options") or {}).get("drilldownAction")
        if isinstance(action, dict) and action.get("type") == "link.viz":
            target = action.get("target")
            if target and target not in known_vizes:
                findings.append(Finding(
                    severity="warning",
                    code="drilldown-unknown-target",
                    message=f"visualization '{viz_id}' drilldown targets unknown visualization '{target}'",
                ))
    return findings


def check_all(dashboard: dict) -> list[Finding]:
    findings: list[Finding] = []
    findings.extend(check_data_source_names(dashboard))
    findings.extend(check_panel_data_source_refs(dashboard))
    findings.extend(check_token_references(dashboard))
    findings.extend(check_drilldown_targets(dashboard))
    return findings
