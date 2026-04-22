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
