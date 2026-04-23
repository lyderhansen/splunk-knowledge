"""Dashboard Studio JSON builder for ds-create."""
from __future__ import annotations

from splunk_dashboards.data_sources import DataSources
from splunk_dashboards.layout import Layout
from splunk_dashboards.aurora import apply as aurora_apply

GRID_UNIT_W = 100  # pixels per grid column
GRID_UNIT_H = 80   # pixels per grid row


def build_dashboard(
    layout: Layout,
    data: DataSources,
    title: str,
    description: str,
    with_time_input: bool = True,
    layout_type: str = "absolute",
    theme: str = "pro",
    patterns: list | None = None,
) -> dict:
    """Build a Splunk Dashboard Studio JSON definition from a Layout + DataSources."""
    # Map DataSource index -> ds key. Also build question -> ds key lookup for panel binding.
    ds_map: dict = {}
    question_to_key: dict = {}
    for idx, source in enumerate(data.sources, start=1):
        key = f"ds_{idx}"
        earliest = "$global_time.earliest$" if with_time_input else source.earliest
        latest = "$global_time.latest$" if with_time_input else source.latest
        ds_map[key] = {
            "type": "ds.search",
            "name": source.name or source.question,
            "options": {
                "query": source.spl,
                "queryParameters": {
                    "earliest": earliest,
                    "latest": latest,
                },
            },
        }
        question_to_key[source.question] = key

    visualizations: dict = {}
    structure: list = []
    for panel in layout.panels:
        viz_key = f"viz_{panel.id}"
        data_sources = {}
        if panel.data_source_ref and panel.data_source_ref in question_to_key:
            data_sources["primary"] = question_to_key[panel.data_source_ref]
        visualizations[viz_key] = {
            "type": panel.viz_type,
            "title": panel.title,
            "dataSources": data_sources,
            "options": {},
        }
        if panel.drilldown:
            visualizations[viz_key]["options"]["drilldown"] = "all"
            visualizations[viz_key]["options"]["drilldownAction"] = panel.drilldown
        structure.append({
            "item": viz_key,
            "type": "block",
            "position": {
                "x": panel.x * GRID_UNIT_W,
                "y": panel.y * GRID_UNIT_H,
                "w": panel.w * GRID_UNIT_W,
                "h": panel.h * GRID_UNIT_H,
            },
        })

    inputs: dict = {}
    defaults: dict = {}
    if with_time_input:
        inputs["input_global_time"] = {
            "type": "input.timerange",
            "title": "Time range",
            "options": {
                "token": "global_time",
                "defaultValue": {"earliest": "-24h", "latest": "now"},
            },
        }
        defaults["dataSources"] = {
            "global": {
                "options": {
                    "queryParameters": {
                        "earliest": "$global_time.earliest$",
                        "latest": "$global_time.latest$",
                    }
                }
            }
        }

    if layout_type == "grid":
        # Group panels by y coordinate. Each unique y becomes a row.
        rows: dict = {}
        for panel in layout.panels:
            rows.setdefault(panel.y, []).append(panel)
        grid_structure = []
        for y in sorted(rows.keys()):
            row_panels = sorted(rows[y], key=lambda p: p.x)
            total_width = sum(p.w for p in row_panels) or 1
            grid_structure.append({
                "type": "row",
                "items": [
                    {"item": f"viz_{p.id}", "width": int(p.w / total_width * 100)}
                    for p in row_panels
                ],
            })
        layout_block = {"type": "grid", "structure": grid_structure}
    else:
        layout_block = {
            "type": "absolute",
            "options": {"width": 1440, "height": 960},
            "structure": structure,
        }

    dashboard = {
        "title": title,
        "description": description,
        "theme": layout.theme,
        "dataSources": ds_map,
        "visualizations": visualizations,
        "inputs": inputs,
        "defaults": defaults,
        "layout": layout_block,
    }
    aurora_apply(dashboard, theme=theme, patterns=patterns)
    return dashboard


import json as _json
import sys as _sys
from pathlib import Path as _Path

from splunk_dashboards.data_sources import load_data_sources
from splunk_dashboards.layout import load_layout
from splunk_dashboards.workspace import (
    advance_stage,
    get_workspace_dir,
    load_state,
    save_state,
    InvalidStageTransition,
)

DASHBOARD_FILENAME = "dashboard.json"


def _cli(argv=None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.create")
    sub = parser.add_subparsers(dest="command", required=True)
    build = sub.add_parser("build", help="Build dashboard.json from workspace")
    build.add_argument("project")
    build.add_argument("--title", required=True)
    build.add_argument("--description", default="")
    build.add_argument("--no-time-input", action="store_true",
                       help="Omit the global time-range input and defaults block")
    build.add_argument("--layout", choices=["absolute", "grid"], default="absolute",
                       help="Layout type (default: absolute)")
    build.add_argument(
        "--theme",
        choices=["pro", "glass", "exec", "noc", "clean", "ops", "soc"],
        default="pro",
        help="Visual theme: pro|glass|exec|noc (aliases: clean→pro, ops→noc, soc→noc)",
    )
    build.add_argument(
        "--pattern", action="append", default=None,
        help="Composition pattern to apply. Repeatable. E.g. --pattern card-kpi --pattern compare-prev. "
             "If omitted, the theme's default patterns apply. Pass --pattern '' to disable patterns entirely.",
    )

    args = parser.parse_args(argv)

    if args.command == "build":
        try:
            state = load_state(args.project)
        except FileNotFoundError:
            print(f"No workspace for project '{args.project}'", file=_sys.stderr)
            return 2
        if state.current_stage != "designed":
            print(
                f"Cannot build from stage '{state.current_stage}' — expected 'designed'",
                file=_sys.stderr,
            )
            return 2
        try:
            layout = load_layout(args.project)
            data = load_data_sources(args.project)
        except FileNotFoundError as e:
            print(f"Missing workspace file: {e}", file=_sys.stderr)
            return 2

        # --pattern '' (empty string) explicitly disables all patterns.
        if args.pattern == [""]:
            patterns = []
        else:
            patterns = args.pattern
        dashboard = build_dashboard(
            layout, data,
            title=args.title,
            description=args.description,
            with_time_input=not args.no_time_input,
            layout_type=args.layout,
            theme=args.theme,
            patterns=patterns,
        )
        ws = get_workspace_dir(args.project)
        path = ws / DASHBOARD_FILENAME
        path.write_text(_json.dumps(dashboard, indent=2) + "\n", encoding="utf-8")

        try:
            advance_stage(state, "built")
        except InvalidStageTransition as e:
            print(str(e), file=_sys.stderr)
            return 3
        save_state(state)
        print(f"Wrote {path} ({len(dashboard['visualizations'])} visualizations)")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
