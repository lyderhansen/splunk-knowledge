"""Tests for validate module (lint checks + CLI)."""
import json
import os
import subprocess
import sys as _sys
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from splunk_dashboards.validate import (
    Finding,
    check_data_source_names,
    check_panel_data_source_refs,
    check_token_references,
    check_drilldown_targets,
    check_all,
)


def _sample_dashboard(**overrides) -> dict:
    d = {
        "title": "t",
        "description": "",
        "theme": "dark",
        "dataSources": {
            "ds_1": {
                "type": "ds.search",
                "name": "Search 1",
                "options": {
                    "query": "index=main | stats count",
                    "queryParameters": {"earliest": "-24h", "latest": "now"},
                },
            }
        },
        "visualizations": {
            "viz_p1": {
                "type": "splunk.singlevalue",
                "title": "V1",
                "dataSources": {"primary": "ds_1"},
                "options": {},
            }
        },
        "inputs": {},
        "defaults": {},
        "layout": {
            "type": "absolute",
            "options": {"width": 1440, "height": 960},
            "structure": [
                {"item": "viz_p1", "type": "block", "position": {"x": 0, "y": 0, "w": 600, "h": 320}}
            ],
        },
    }
    d.update(overrides)
    return d


def test_check_data_source_names_passes_when_all_named():
    findings = check_data_source_names(_sample_dashboard())
    assert findings == []


def test_check_data_source_names_flags_missing_name():
    d = _sample_dashboard()
    del d["dataSources"]["ds_1"]["name"]
    findings = check_data_source_names(d)
    assert len(findings) == 1
    assert findings[0].severity == "error"
    assert "ds_1" in findings[0].message


def test_check_panel_data_source_refs_passes_when_all_resolve():
    findings = check_panel_data_source_refs(_sample_dashboard())
    assert findings == []


def test_check_panel_data_source_refs_flags_unknown_ref():
    d = _sample_dashboard()
    d["visualizations"]["viz_p1"]["dataSources"]["primary"] = "ds_nonexistent"
    findings = check_panel_data_source_refs(d)
    assert len(findings) == 1
    assert findings[0].severity == "error"
    assert "ds_nonexistent" in findings[0].message


def test_check_token_references_passes_when_tokens_defined():
    d = _sample_dashboard()
    d["inputs"] = {
        "tr": {"type": "input.timerange", "options": {"token": "global_time"}}
    }
    d["dataSources"]["ds_1"]["options"]["query"] = "index=main earliest=$global_time.earliest$ | stats count"
    findings = check_token_references(d)
    assert findings == []


def test_check_token_references_flags_unknown_token():
    d = _sample_dashboard()
    d["dataSources"]["ds_1"]["options"]["query"] = "index=main src=$undefined_token$ | stats count"
    findings = check_token_references(d)
    assert len(findings) == 1
    assert findings[0].severity == "warning"
    assert "undefined_token" in findings[0].message


def test_check_drilldown_targets_passes_when_all_resolve():
    d = _sample_dashboard()
    d["visualizations"]["viz_p1"]["options"]["drilldown"] = "all"
    d["visualizations"]["viz_p1"]["options"]["drilldownAction"] = {
        "type": "link.dashboard", "dashboard": "viz_p1"
    }
    findings = check_drilldown_targets(d)
    assert findings == []


def test_check_drilldown_targets_flags_unknown_viz_target():
    d = _sample_dashboard()
    d["visualizations"]["viz_p1"]["options"]["drilldownAction"] = {
        "type": "link.viz", "target": "viz_unknown"
    }
    findings = check_drilldown_targets(d)
    # Only flags when action.type == link.viz and target doesn't match a known viz
    assert len(findings) == 1
    assert findings[0].severity == "warning"


def test_check_all_aggregates_all_findings():
    d = _sample_dashboard()
    del d["dataSources"]["ds_1"]["name"]  # 1 error
    d["dataSources"]["ds_1"]["options"]["query"] = "index=main src=$undefined$ | stats count"  # 1 warning
    findings = check_all(d)
    assert len(findings) == 2
    severities = {f.severity for f in findings}
    assert "error" in severities
    assert "warning" in severities
