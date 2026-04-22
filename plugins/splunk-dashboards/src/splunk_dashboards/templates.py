"""Bundled dashboard templates for ds-template."""
from __future__ import annotations

import json
import sys as _sys
from pathlib import Path

from splunk_dashboards.layout import Layout, Panel, save_layout

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates"


class TemplateNotFoundError(Exception):
    pass


def list_bundled_templates() -> list[str]:
    if not TEMPLATES_DIR.exists():
        return []
    return sorted(p.stem for p in TEMPLATES_DIR.glob("*.json"))


def load_bundled_template(name: str) -> dict:
    path = TEMPLATES_DIR / f"{name}.json"
    if not path.exists():
        raise TemplateNotFoundError(
            f"No bundled template named '{name}'. Available: {list_bundled_templates()}"
        )
    return json.loads(path.read_text(encoding="utf-8"))


def _cli(argv=None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.templates")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list", help="List available bundled templates")

    load = sub.add_parser(
        "load",
        help="Seed design/layout.json for a project from a bundled template",
    )
    load.add_argument("template")
    load.add_argument("--project", required=True)

    args = parser.parse_args(argv)

    if args.command == "list":
        for name in list_bundled_templates():
            template = load_bundled_template(name)
            desc = template.get("description", "")
            print(f"{name}\t{desc}")
        return 0

    if args.command == "load":
        try:
            template = load_bundled_template(args.template)
        except TemplateNotFoundError as e:
            print(str(e), file=_sys.stderr)
            return 2
        panels = [Panel.from_dict(p) for p in template.get("panels", [])]
        layout = Layout(
            project=args.project,
            theme=template.get("theme", "dark"),
            panels=panels,
        )
        try:
            save_layout(layout)
        except FileNotFoundError as e:
            print(str(e), file=_sys.stderr)
            return 3
        print(f"Seeded layout.json for {args.project} from template '{args.template}' ({len(panels)} panels)")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
