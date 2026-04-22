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


import json as _json
import sys as _sys
from pathlib import Path as _Path

from splunk_dashboards.workspace import (
    advance_stage,
    get_workspace_dir,
    load_state,
    save_state,
    InvalidStageTransition,
)


def _cli(argv=None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.validate")
    sub = parser.add_subparsers(dest="command", required=True)
    check = sub.add_parser("check", help="Lint a built dashboard")
    check.add_argument("project")
    check.add_argument("--force", action="store_true",
                       help="Advance stage even if errors are found")

    args = parser.parse_args(argv)
    if args.command == "check":
        try:
            state = load_state(args.project)
        except FileNotFoundError:
            print(f"No workspace for project '{args.project}'", file=_sys.stderr)
            return 2
        if state.current_stage != "built":
            print(
                f"Cannot validate from stage '{state.current_stage}' — expected 'built'",
                file=_sys.stderr,
            )
            return 2
        ws = get_workspace_dir(args.project)
        dashboard_path = ws / "dashboard.json"
        if not dashboard_path.exists():
            print(f"Missing {dashboard_path}", file=_sys.stderr)
            return 2

        dashboard = _json.loads(dashboard_path.read_text(encoding="utf-8"))
        findings = check_all(dashboard)
        errors = [f for f in findings if f.severity == "error"]
        warnings = [f for f in findings if f.severity == "warning"]

        for f in findings:
            print(f"[{f.severity}] {f.code}: {f.message}")

        if errors and not args.force:
            print(f"\n{len(errors)} error(s), {len(warnings)} warning(s). Refusing to advance stage. Use --force to override.",
                  file=_sys.stderr)
            return 1

        try:
            advance_stage(state, "validated")
        except InvalidStageTransition as e:
            print(str(e), file=_sys.stderr)
            return 3
        save_state(state)
        print(f"\nValidation complete: {len(errors)} error(s), {len(warnings)} warning(s). Stage advanced to 'validated'.")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
