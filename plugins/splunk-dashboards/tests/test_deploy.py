"""Tests for deploy module."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.deploy import build_xml_envelope


def test_xml_envelope_wraps_json_in_cdata():
    dashboard = {"title": "Hello", "visualizations": {}}
    xml = build_xml_envelope(dashboard, label="Hello", description="", theme="dark")
    assert '<dashboard version="2" theme="dark">' in xml
    assert "<label>Hello</label>" in xml
    assert "<definition><![CDATA[" in xml
    assert "]]></definition>" in xml
    assert "</dashboard>" in xml
    # JSON body round-trips intact
    start = xml.index("<![CDATA[") + len("<![CDATA[")
    end = xml.index("]]>")
    body = xml[start:end].strip()
    assert json.loads(body)["title"] == "Hello"


def test_xml_envelope_escapes_label_and_description():
    dashboard = {"title": "t"}
    xml = build_xml_envelope(
        dashboard,
        label="Me & You <script>",
        description="Quote: \"hi\"",
        theme="light",
    )
    # Raw angle brackets and ampersands in label should be escaped
    assert "<script>" not in xml  # if present it would inject real HTML
    assert "&amp;" in xml  # "&" escaped
    assert "&lt;script&gt;" in xml
    assert '<dashboard version="2" theme="light">' in xml


def test_xml_envelope_includes_optional_description_element():
    dashboard = {"title": "t"}
    xml = build_xml_envelope(dashboard, label="L", description="Some desc", theme="dark")
    assert "<description>Some desc</description>" in xml
    # When description is empty, no description element should be emitted
    xml2 = build_xml_envelope(dashboard, label="L", description="", theme="dark")
    assert "<description>" not in xml2
