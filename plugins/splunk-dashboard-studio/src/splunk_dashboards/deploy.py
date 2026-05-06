"""XML envelope + Splunk TA packaging for ds-deploy."""
from __future__ import annotations

import json
from xml.sax.saxutils import escape


def build_xml_envelope(dashboard: dict, label: str, description: str, theme: str) -> str:
    """Wrap a Dashboard Studio JSON definition in the v2 XML envelope."""
    json_body = json.dumps(dashboard, indent=2)
    parts: list[str] = [
        f'<dashboard version="2" theme="{escape(theme)}">',
        f"  <label>{escape(label)}</label>",
    ]
    if description:
        parts.append(f"  <description>{escape(description)}</description>")
    parts.append("  <definition><![CDATA[")
    parts.append(json_body)
    parts.append("]]></definition>")
    parts.append("</dashboard>")
    return "\n".join(parts) + "\n"


import io
import tarfile
from pathlib import Path

APP_CONF_TEMPLATE = """[install]
is_configured = 1

[launcher]
version = 0.1.0
description = {description}

[ui]
is_visible = 1
label = {label}

[package]
id = {app_name}
"""

META_DEFAULT = """[]
access = read : [ * ], write : [ admin ]
export = system
"""


def _tar_add_bytes(tar: tarfile.TarFile, name: str, data: bytes) -> None:
    info = tarfile.TarInfo(name=name)
    info.size = len(data)
    tar.addfile(info, io.BytesIO(data))


def build_ta_tarball(
    *,
    xml_content: str,
    app_name: str,
    view_name: str,
    app_label: str,
    output_path: Path,
    description: str = "",
) -> None:
    """Build a Splunk TA tarball containing a single dashboard view."""
    app_conf = APP_CONF_TEMPLATE.format(
        app_name=app_name,
        label=app_label,
        description=description or app_label,
    )
    with tarfile.open(output_path, "w:gz") as tar:
        _tar_add_bytes(tar, f"{app_name}/default/app.conf", app_conf.encode("utf-8"))
        _tar_add_bytes(
            tar,
            f"{app_name}/default/data/ui/views/{view_name}.xml",
            xml_content.encode("utf-8"),
        )
        _tar_add_bytes(tar, f"{app_name}/metadata/default.meta", META_DEFAULT.encode("utf-8"))


import sys as _sys

from splunk_dashboards.workspace import (
    advance_stage,
    get_workspace_dir,
    load_state,
    save_state,
    InvalidStageTransition,
)


def _cli(argv=None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.deploy")
    sub = parser.add_subparsers(dest="command", required=True)
    build = sub.add_parser("build", help="Build dashboard.xml (and optional TA tarball)")
    build.add_argument("project")
    build.add_argument("--label", required=True, help="Dashboard label (shown in Splunk UI)")
    build.add_argument("--theme", default=None, help="Override theme from dashboard.json")
    build.add_argument("--as-app", action="store_true", help="Also build a Splunk TA tarball")
    build.add_argument("--app-name", help="TA app name (defaults to project name)")
    build.add_argument("--view-name", help="View name inside the TA (defaults to project name)")

    args = parser.parse_args(argv)
    if args.command == "build":
        try:
            state = load_state(args.project)
        except FileNotFoundError:
            print(f"No workspace for project '{args.project}'", file=_sys.stderr)
            return 2
        if state.current_stage != "validated":
            print(
                f"Cannot deploy from stage '{state.current_stage}' — expected 'validated'",
                file=_sys.stderr,
            )
            return 2

        ws = get_workspace_dir(args.project)
        dashboard_path = ws / "dashboard.json"
        if not dashboard_path.exists():
            print(f"Missing {dashboard_path}", file=_sys.stderr)
            return 2
        dashboard = json.loads(dashboard_path.read_text(encoding="utf-8"))
        theme = args.theme or dashboard.get("theme", "dark")
        description = dashboard.get("description", "")
        xml_content = build_xml_envelope(
            dashboard, label=args.label, description=description, theme=theme
        )
        xml_path = ws / "dashboard.xml"
        xml_path.write_text(xml_content, encoding="utf-8")

        if args.as_app:
            app_name = args.app_name or args.project.replace("-", "_")
            view_name = args.view_name or args.project.replace("-", "_")
            tar_path = ws / f"{app_name}.tar.gz"
            build_ta_tarball(
                xml_content=xml_content,
                app_name=app_name,
                view_name=view_name,
                app_label=args.label,
                output_path=tar_path,
                description=description,
            )
            print(f"Wrote TA tarball: {tar_path}")

        try:
            advance_stage(state, "deployed")
        except InvalidStageTransition as e:
            print(str(e), file=_sys.stderr)
            return 3
        save_state(state)
        print(f"Wrote {xml_path}. Stage advanced to 'deployed'.")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
