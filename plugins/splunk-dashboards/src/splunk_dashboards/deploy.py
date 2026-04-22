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
