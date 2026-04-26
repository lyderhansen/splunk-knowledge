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


def check_timerange_default_value(dashboard: dict) -> list[Finding]:
    """Catch input.timerange defaultValue as an object — Splunk schema requires a string.

    The object form ``{"earliest": "-24h", "latest": "now"}`` triggers a schema
    error at render time (``defaultValue: must be string``). Canonical form is
    a comma-separated string like ``"-24h,now"`` or ``"-7d@d,now"``.
    """
    findings: list[Finding] = []
    for input_id, inp in (dashboard.get("inputs") or {}).items():
        if inp.get("type") != "input.timerange":
            continue
        default = (inp.get("options") or {}).get("defaultValue")
        if default is None:
            continue
        if not isinstance(default, str):
            findings.append(Finding(
                severity="error",
                code="timerange-defaultvalue-not-string",
                message=(
                    f"input '{input_id}' (input.timerange) has defaultValue of type "
                    f"{type(default).__name__}; Splunk schema requires a string like "
                    f"'\"-24h,now\"' or '\"-7d@d,now\"'. Object form crashes the renderer."
                ),
            ))
    return findings


def check_singlevalue_invalid_options(dashboard: dict) -> list[Finding]:
    """Flag known-invalid option fields on singlevalue vizes that crash the renderer.

    ``majorColorConfiguration`` is NOT a Splunk Dashboard Studio field. Supplying
    it in combination with a ``rangeValue`` DOS expression on ``majorColor``
    typically crashes the renderer with ``.split is not a function``.
    """
    BAD_FIELDS = {"majorColorConfiguration"}
    SINGLEVALUE_TYPES = {
        "splunk.singlevalue",
        "splunk.singlevalueicon",
        "splunk.singlevalueradial",
    }
    findings: list[Finding] = []
    for viz_id, viz in (dashboard.get("visualizations") or {}).items():
        if viz.get("type") not in SINGLEVALUE_TYPES:
            continue
        options = viz.get("options") or {}
        for bad in BAD_FIELDS & set(options.keys()):
            findings.append(Finding(
                severity="error",
                code="singlevalue-invalid-option",
                message=(
                    f"visualization '{viz_id}' sets '{bad}' — not a valid "
                    f"{viz['type']} option. Use a static majorColor hex, "
                    f"or rangeValue(ranges=[A,B], values=[c1,c2,c3]) DOS."
                ),
            ))
    return findings


def check_rangevalue_dos_signatures(dashboard: dict) -> list[Finding]:
    """Flag common ``rangeValue`` DOS mistakes that crash the renderer.

    ``rangeValue`` accepts two signatures on Splunk 10.x:

    1. **Context-variable form (portable):** ``rangeValue(colorConfig)`` where
       ``colorConfig`` is a context array of ``{from, to, value}`` entries declared
       in the viz's ``context`` block. This is the form documented in ds-syntax
       and used by flagship templates.
    2. **Inline form:** ``rangeValue(ranges=[A,B], values=[c1,c2,c3])`` — N ranges,
       N+1 values. Less portable across versions; prefer form 1.

    Known bad patterns flagged here:

    - ``rangeValue(ranges=[null, A, B])`` — null inside ranges array (crashes
      renderer with ``.split is not a function``).
    - Inline ``rangeValue(ranges=[...])`` without a matching ``values=[...]`` —
      the selector would have no colors to choose from.
    """
    RANGE_RE = re.compile(r"rangeValue\s*\(\s*ranges\s*=\s*(\[[^\]]*\])", re.IGNORECASE)
    findings: list[Finding] = []
    for viz_id, viz in (dashboard.get("visualizations") or {}).items():
        options = viz.get("options") or {}
        for opt_name, opt_value in options.items():
            if not isinstance(opt_value, str) or "rangeValue" not in opt_value:
                continue
            for ranges_literal in RANGE_RE.findall(opt_value):
                if "null" in ranges_literal:
                    findings.append(Finding(
                        severity="error",
                        code="rangevalue-null-in-ranges",
                        message=(
                            f"visualization '{viz_id}' option '{opt_name}' uses "
                            f"rangeValue(ranges=[..., null, ...]) — null is not a "
                            f"valid range boundary and crashes the renderer."
                        ),
                    ))
            # Only warn on inline form (ranges= present). Context-var form
            # `rangeValue(colorConfig)` has no `ranges=` argument and is fine.
            if "ranges=" in opt_value and "values=" not in opt_value and "values =" not in opt_value:
                findings.append(Finding(
                    severity="warning",
                    code="rangevalue-missing-values",
                    message=(
                        f"visualization '{viz_id}' option '{opt_name}' uses inline "
                        f"rangeValue(ranges=[...]) without a matching 'values=[...]'. "
                        f"Either supply both (N ranges, N+1 values) or switch to the "
                        f"context-var form: rangeValue(colorConfig) + define colorConfig in context."
                    ),
                ))
    return findings


def check_input_types(dashboard: dict) -> list[Finding]:
    """Reject input ``type`` values not on the Splunk 10.4 PDF allow-list.

    Per the Splunk Cloud 10.4.2604 Dashboard Studio reference, only five input
    types are valid:

    - ``input.text``
    - ``input.dropdown``
    - ``input.multiselect``
    - ``input.checkbox``
    - ``input.timerange``

    Common mistakes that produce ``/inputs/<id>/type: must be equal to one of
    the allowed values`` at render time:

    - ``input.radio`` — does not exist; use ``input.dropdown`` for single-select.
    - ``input.number``, ``input.date``, ``input.search`` — not in the schema.
    """
    ALLOWED = {
        "input.text",
        "input.dropdown",
        "input.multiselect",
        "input.checkbox",
        "input.timerange",
    }
    findings: list[Finding] = []
    for input_id, inp in (dashboard.get("inputs") or {}).items():
        type_ = inp.get("type")
        if type_ is None:
            findings.append(Finding(
                severity="error",
                code="input-missing-type",
                message=f"input '{input_id}' is missing required 'type' field",
            ))
            continue
        if type_ not in ALLOWED:
            allowed_str = ", ".join(sorted(ALLOWED))
            hint = ""
            if type_ == "input.radio":
                hint = " — use 'input.dropdown' for single-select."
            findings.append(Finding(
                severity="error",
                code="input-invalid-type",
                message=(
                    f"input '{input_id}' has type '{type_}' which is not in the "
                    f"Splunk 10.4 allow-list ({allowed_str}).{hint}"
                ),
            ))
    return findings


def check_rangevalue_needs_reducer(dashboard: dict) -> list[Finding]:
    """Flag ``rangeValue`` DOS expressions that operate on a series without reducing.

    ``rangeValue(thresholds)`` requires a single number as input. Pickers like
    ``seriesByName(...)`` and ``seriesByType(...)`` return a *series* — they
    must be reduced with ``lastPoint()`` (or ``min()``, ``max()``, ``count()``,
    ``sum()``) before being piped into ``rangeValue``.

    A pipeline such as::

        > primary | seriesByType("number") | rangeValue(cfg)

    will silently render grey because ``rangeValue`` cannot match a series
    against numeric thresholds. Splunk Studio's editor always emits the
    canonical alias-in-context form::

        context.dataAlias = "> primary | seriesByType(\\"number\\") | lastPoint()"
        options.fillColor = "> dataAlias | rangeValue(colorConfig)"

    This check warns on any ``rangeValue`` expression where the upstream
    pipeline contains a series picker but no reducer.

    Both inline (``options.fillColor``) and context-alias forms are checked.
    """
    SERIES_PICKERS = ("seriesByName", "seriesByType", "seriesByIndex")
    REDUCERS = ("lastPoint", "max", "min", "count", "sum", "first", "last")

    def _expression_needs_reducer(expr: str) -> bool:
        if "rangeValue(" not in expr:
            return False
        if not any(p in expr for p in SERIES_PICKERS):
            return False
        if any(f"{r}(" in expr for r in REDUCERS):
            return False
        return True

    findings: list[Finding] = []
    for viz_id, viz in (dashboard.get("visualizations") or {}).items():
        # Inline form: options.<name> = "> primary | seriesByType(...) | rangeValue(...)"
        for opt_name, opt_value in (viz.get("options") or {}).items():
            if isinstance(opt_value, str) and _expression_needs_reducer(opt_value):
                findings.append(Finding(
                    severity="warning",
                    code="rangevalue-missing-reducer",
                    message=(
                        f"visualization '{viz_id}' option '{opt_name}' pipes a "
                        f"series picker into rangeValue() without reducing to a "
                        f"single value. Add ' | lastPoint()' (or max/min) before "
                        f"rangeValue, or use the canonical alias-in-context form."
                    ),
                ))

        # Alias form: context aliases that are referenced by an option, but the
        # alias pipeline itself has a series picker without a reducer. The
        # `rangeValue` call lives in the option string, the `seriesBy*` lives
        # in the context alias — combine them.
        ctx = viz.get("context") or {}
        if not ctx:
            continue
        # collect aliases that are used somewhere in options as `> alias | rangeValue(...)`
        used_aliases: dict[str, str] = {}  # alias_name -> option name where it is used
        for opt_name, opt_value in (viz.get("options") or {}).items():
            if not isinstance(opt_value, str) or "rangeValue(" not in opt_value:
                continue
            m = re.match(r"\s*>\s*(\w+)\s*\|\s*rangeValue", opt_value)
            if m:
                used_aliases[m.group(1)] = opt_name
        for alias, opt_name in used_aliases.items():
            alias_expr = ctx.get(alias)
            if not isinstance(alias_expr, str):
                continue
            if any(p in alias_expr for p in SERIES_PICKERS) and not any(
                f"{r}(" in alias_expr for r in REDUCERS
            ):
                findings.append(Finding(
                    severity="warning",
                    code="rangevalue-alias-missing-reducer",
                    message=(
                        f"visualization '{viz_id}' option '{opt_name}' references "
                        f"context alias '{alias}' which uses a series picker "
                        f"({alias_expr!r}) without a reducer. Append "
                        f"' | lastPoint()' to the alias so rangeValue receives a "
                        f"single number."
                    ),
                ))
    return findings


def check_all(dashboard: dict) -> list[Finding]:
    findings: list[Finding] = []
    findings.extend(check_data_source_names(dashboard))
    findings.extend(check_panel_data_source_refs(dashboard))
    findings.extend(check_token_references(dashboard))
    findings.extend(check_drilldown_targets(dashboard))
    findings.extend(check_timerange_default_value(dashboard))
    findings.extend(check_input_types(dashboard))
    findings.extend(check_singlevalue_invalid_options(dashboard))
    findings.extend(check_rangevalue_dos_signatures(dashboard))
    findings.extend(check_rangevalue_needs_reducer(dashboard))
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
