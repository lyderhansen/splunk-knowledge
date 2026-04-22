"""Dashboard Studio JSON builder for ds-create."""
from __future__ import annotations

from splunk_dashboards.data_sources import DataSources
from splunk_dashboards.layout import Layout

GRID_UNIT_W = 100  # pixels per grid column
GRID_UNIT_H = 80   # pixels per grid row


def build_dashboard(layout: Layout, data: DataSources, title: str, description: str) -> dict:
    """Build a Splunk Dashboard Studio JSON definition from a Layout + DataSources."""
    # Map DataSource index -> ds key. Also build question -> ds key lookup for panel binding.
    ds_map: dict = {}
    question_to_key: dict = {}
    for idx, source in enumerate(data.sources, start=1):
        key = f"ds_{idx}"
        ds_map[key] = {
            "type": "ds.search",
            "name": source.name or source.question,
            "options": {
                "query": source.spl,
                "queryParameters": {
                    "earliest": source.earliest,
                    "latest": source.latest,
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

    return {
        "title": title,
        "description": description,
        "theme": layout.theme,
        "dataSources": ds_map,
        "visualizations": visualizations,
        "inputs": {},
        "defaults": {},
        "layout": {
            "type": "absolute",
            "options": {"width": 1440, "height": 960},
            "structure": structure,
        },
    }


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

        dashboard = build_dashboard(
            layout, data, title=args.title, description=args.description
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
