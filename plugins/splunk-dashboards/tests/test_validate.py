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
    check_timerange_default_value,
    check_singlevalue_invalid_options,
    check_rangevalue_dos_signatures,
    check_all,
)


def test_timerange_default_value_object_form_flagged():
    d = {
        "inputs": {
            "input_time": {
                "type": "input.timerange",
                "options": {"token": "t", "defaultValue": {"earliest": "-24h", "latest": "now"}},
            }
        }
    }
    findings = check_timerange_default_value(d)
    assert len(findings) == 1
    assert findings[0].severity == "error"
    assert findings[0].code == "timerange-defaultvalue-not-string"


def test_timerange_default_value_string_form_passes():
    d = {
        "inputs": {
            "input_time": {
                "type": "input.timerange",
                "options": {"token": "t", "defaultValue": "-24h,now"},
            }
        }
    }
    assert check_timerange_default_value(d) == []


def test_singlevalue_major_color_configuration_flagged():
    d = {
        "visualizations": {
            "viz_1": {
                "type": "splunk.singlevalue",
                "options": {"majorValue": "42", "majorColorConfiguration": [{"to": 1, "value": "#000"}]},
            }
        }
    }
    findings = check_singlevalue_invalid_options(d)
    assert len(findings) == 1
    assert findings[0].code == "singlevalue-invalid-option"
    assert "majorColorConfiguration" in findings[0].message


def test_singlevalue_without_invalid_options_passes():
    d = {
        "visualizations": {
            "viz_1": {
                "type": "splunk.singlevalue",
                "options": {"majorValue": "42", "majorColor": "#53A051"},
            }
        }
    }
    assert check_singlevalue_invalid_options(d) == []


def test_rangevalue_null_in_ranges_flagged():
    d = {
        "visualizations": {
            "viz_1": {
                "type": "splunk.singlevalue",
                "options": {"majorColor": "> primary | lastPoint() | rangeValue(ranges=[null, 95, 99])"},
            }
        }
    }
    findings = check_rangevalue_dos_signatures(d)
    assert any(f.code == "rangevalue-null-in-ranges" for f in findings)


def test_rangevalue_missing_values_flagged():
    d = {
        "visualizations": {
            "viz_1": {
                "type": "splunk.singlevalue",
                "options": {"majorColor": "> primary | lastPoint() | rangeValue(ranges=[95, 99])"},
            }
        }
    }
    findings = check_rangevalue_dos_signatures(d)
    assert any(f.code == "rangevalue-missing-values" for f in findings)


def test_rangevalue_proper_signature_passes():
    d = {
        "visualizations": {
            "viz_1": {
                "type": "splunk.singlevalue",
                "options": {
                    "majorColor": "> primary | lastPoint() | rangeValue(ranges=[95, 99], values=[\"#DC4E41\", \"#F8BE34\", \"#53A051\"])",
                },
            }
        }
    }
    assert check_rangevalue_dos_signatures(d) == []


def test_rangevalue_context_var_form_passes():
    """rangeValue(colorConfig) uses a context-declared array — no ranges= / values= needed."""
    d = {
        "visualizations": {
            "viz_1": {
                "type": "splunk.singlevalue",
                "options": {
                    "majorColor": "> primary | seriesByName('p95') | lastPoint() | rangeValue(colorConfig)",
                },
                "context": {
                    "colorConfig": [
                        {"value": "#53A051", "to": 300},
                        {"value": "#F8BE34", "from": 300, "to": 500},
                        {"value": "#DC4E41", "from": 500},
                    ],
                },
            }
        }
    }
    assert check_rangevalue_dos_signatures(d) == []


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


from splunk_dashboards.workspace import (
    init_workspace,
    load_state,
    save_state,
    advance_stage,
    get_workspace_dir,
)


def _run_cli(args, cwd):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    return subprocess.run(
        [_sys.executable, "-m", "splunk_dashboards.validate", *args],
        cwd=cwd,
        env=env,
        capture_output=True,
        text=True,
    )


def _prepare_workspace_at_built(tmp_path, monkeypatch, dashboard: dict, project="my-dash"):
    monkeypatch.chdir(tmp_path)
    state = init_workspace(project, autopilot=False)
    for stage in ("data-ready", "designed", "built"):
        advance_stage(state, stage)
    save_state(state)
    (get_workspace_dir(project) / "dashboard.json").write_text(json.dumps(dashboard), encoding="utf-8")


def test_cli_check_passes_clean_dashboard_and_advances_stage(tmp_path, monkeypatch):
    _prepare_workspace_at_built(tmp_path, monkeypatch, _sample_dashboard())
    result = _run_cli(["check", "my-dash"], cwd=tmp_path)
    assert result.returncode == 0, result.stderr
    state = load_state("my-dash")
    assert state.current_stage == "validated"
    assert "built" in state.stages_completed


def test_cli_check_fails_on_errors_without_force(tmp_path, monkeypatch):
    d = _sample_dashboard()
    del d["dataSources"]["ds_1"]["name"]  # introduces an error
    _prepare_workspace_at_built(tmp_path, monkeypatch, d)
    result = _run_cli(["check", "my-dash"], cwd=tmp_path)
    assert result.returncode != 0
    state = load_state("my-dash")
    # Stage should NOT have advanced
    assert state.current_stage == "built"
