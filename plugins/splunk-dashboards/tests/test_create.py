"""Tests for create module (Dashboard Studio JSON builder)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from splunk_dashboards.create import (
    build_dashboard,
    GRID_UNIT_W,
    GRID_UNIT_H,
)
from splunk_dashboards.layout import Layout, Panel
from splunk_dashboards.data_sources import DataSources, DataSource


def test_build_dashboard_empty_layout_returns_skeleton():
    layout = Layout(project="my-dash")
    data = DataSources(project="my-dash")
    result = build_dashboard(layout, data, title="My Dash", description="desc", with_time_input=False)
    assert result["title"] == "My Dash"
    assert result["description"] == "desc"
    assert result["dataSources"] == {}
    assert result["visualizations"] == {}
    assert result["inputs"] == {}
    assert result["defaults"] == {}
    assert result["layout"]["type"] == "absolute"
    assert result["layout"]["structure"] == []


def test_build_dashboard_maps_data_sources_to_ds_search():
    layout = Layout(project="x")
    data = DataSources(
        project="x",
        sources=[
            DataSource(question="Top failed logins?", spl="index=auth action=failure | top src", name="Failed Logins"),
            DataSource(question="Events over time?", spl="index=main | timechart count", earliest="-7d", latest="now"),
        ],
    )
    result = build_dashboard(layout, data, title="t", description="", with_time_input=False)
    ds = result["dataSources"]
    assert len(ds) == 2
    # Each entry has type, name, options.query
    first = ds["ds_1"]
    assert first["type"] == "ds.search"
    assert first["name"] == "Failed Logins"
    assert first["options"]["query"] == "index=auth action=failure | top src"
    assert first["options"]["queryParameters"]["earliest"] == "-24h"
    assert first["options"]["queryParameters"]["latest"] == "now"
    # DataSource without explicit name falls back to the question text
    assert ds["ds_2"]["name"] == "Events over time?"
    assert ds["ds_2"]["options"]["queryParameters"]["earliest"] == "-7d"


def test_build_dashboard_maps_panels_to_visualizations_and_layout():
    layout = Layout(
        project="x",
        panels=[
            Panel(id="p1", title="Count", x=0, y=0, w=6, h=4, viz_type="splunk.singlevalue", data_source_ref="q1"),
            Panel(id="p2", title="Trend", x=6, y=0, w=6, h=4, viz_type="splunk.line", data_source_ref="q2"),
        ],
    )
    data = DataSources(
        project="x",
        sources=[
            DataSource(question="q1", spl="| makeresults count=1"),
            DataSource(question="q2", spl="| makeresults count=100 | timechart count"),
        ],
    )
    result = build_dashboard(layout, data, title="t", description="", with_time_input=False)

    # Visualizations keyed as viz_<panel.id>
    viz = result["visualizations"]
    assert len(viz) == 2
    assert viz["viz_p1"]["type"] == "splunk.singlevalue"
    assert viz["viz_p1"]["title"] == "Count"
    assert viz["viz_p1"]["dataSources"]["primary"] == "ds_1"
    assert viz["viz_p2"]["dataSources"]["primary"] == "ds_2"

    # Layout structure maps grid cells to pixels via GRID_UNIT_W / GRID_UNIT_H
    structure = result["layout"]["structure"]
    assert len(structure) == 2
    first = structure[0]
    assert first["item"] == "viz_p1"
    assert first["type"] == "block"
    assert first["position"]["x"] == 0
    assert first["position"]["y"] == 0
    assert first["position"]["w"] == 6 * GRID_UNIT_W
    assert first["position"]["h"] == 4 * GRID_UNIT_H


def test_build_dashboard_panel_without_data_source_ref_gets_no_primary():
    layout = Layout(project="x", panels=[Panel(id="p1", title="Orphan")])
    data = DataSources(project="x")
    result = build_dashboard(layout, data, title="t", description="", with_time_input=False)
    viz = result["visualizations"]["viz_p1"]
    # dataSources map is present but empty when no ref
    assert viz["dataSources"] == {}


def test_build_dashboard_preserves_theme():
    layout = Layout(project="x", theme="light")
    data = DataSources(project="x")
    result = build_dashboard(layout, data, title="t", description="", with_time_input=False)
    # Theme is a top-level hint consumed by the XML envelope at deploy time
    assert result["theme"] == "light"


import json
import os
import subprocess
import sys as _sys
from splunk_dashboards.workspace import (
    init_workspace,
    load_state,
    save_state,
    advance_stage,
)
from splunk_dashboards.layout import save_layout
from splunk_dashboards.data_sources import save_data_sources


def _run_cli(args, cwd):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    return subprocess.run(
        [_sys.executable, "-m", "splunk_dashboards.create", *args],
        cwd=cwd,
        env=env,
        capture_output=True,
        text=True,
    )


def _prepare_workspace_at_designed(tmp_path, monkeypatch, project="my-dash"):
    monkeypatch.chdir(tmp_path)
    state = init_workspace(project, autopilot=False)
    advance_stage(state, "data-ready")
    advance_stage(state, "designed")
    save_state(state)
    save_data_sources(DataSources(
        project=project,
        sources=[DataSource(question="q1", spl="| makeresults count=1", name="Q1")],
    ))
    save_layout(Layout(
        project=project,
        panels=[Panel(id="p1", title="T", viz_type="splunk.singlevalue", data_source_ref="q1")],
    ))


def test_cli_build_persists_dashboard_and_advances_state(tmp_path, monkeypatch):
    _prepare_workspace_at_designed(tmp_path, monkeypatch)
    result = _run_cli(
        ["build", "my-dash", "--title", "My Dashboard", "--description", "Test"],
        cwd=tmp_path,
    )
    assert result.returncode == 0, result.stderr

    ws = tmp_path / ".splunk-dashboards" / "my-dash"
    dashboard = json.loads((ws / "dashboard.json").read_text())
    assert dashboard["title"] == "My Dashboard"
    assert dashboard["description"] == "Test"
    assert "ds_1" in dashboard["dataSources"]
    assert "viz_p1" in dashboard["visualizations"]

    state = load_state("my-dash")
    assert state.current_stage == "built"
    assert "designed" in state.stages_completed


def test_cli_build_rejects_wrong_stage(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)  # stage = scoped
    result = _run_cli(
        ["build", "my-dash", "--title", "t", "--description", ""],
        cwd=tmp_path,
    )
    assert result.returncode != 0


def test_cli_build_rejects_missing_inputs(tmp_path, monkeypatch):
    # Workspace at 'designed' but without layout/data-sources files on disk
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    advance_stage(state, "data-ready")
    advance_stage(state, "designed")
    save_state(state)
    result = _run_cli(
        ["build", "my-dash", "--title", "t", "--description", ""],
        cwd=tmp_path,
    )
    assert result.returncode != 0


def test_build_dashboard_with_time_input_emits_global_time():
    layout = Layout(project="x")
    data = DataSources(project="x", sources=[DataSource(question="q", spl="index=main | stats count")])
    result = build_dashboard(layout, data, title="t", description="", with_time_input=True)
    assert "input_global_time" in result["inputs"]
    tr = result["inputs"]["input_global_time"]
    assert tr["type"] == "input.timerange"
    assert tr["options"]["token"] == "global_time"
    # Defaults block wires panels to the token
    defaults = result["defaults"]["dataSources"]["global"]["options"]["queryParameters"]
    assert defaults["earliest"] == "$global_time.earliest$"
    assert defaults["latest"] == "$global_time.latest$"


def test_build_dashboard_panel_queries_use_token_when_time_input_enabled():
    layout = Layout(project="x")
    data = DataSources(project="x", sources=[
        DataSource(question="q1", spl="| makeresults count=1", earliest="-24h", latest="now"),
    ])
    result = build_dashboard(layout, data, title="t", description="", with_time_input=True)
    qp = result["dataSources"]["ds_1"]["options"]["queryParameters"]
    assert qp["earliest"] == "$global_time.earliest$"
    assert qp["latest"] == "$global_time.latest$"


def test_build_dashboard_without_time_input_keeps_raw_time_strings():
    layout = Layout(project="x")
    data = DataSources(project="x", sources=[DataSource(question="q", spl="q", earliest="-7d", latest="now")])
    result = build_dashboard(layout, data, title="t", description="", with_time_input=False)
    assert result["inputs"] == {}
    assert result["defaults"] == {}
    qp = result["dataSources"]["ds_1"]["options"]["queryParameters"]
    assert qp["earliest"] == "-7d"
    assert qp["latest"] == "now"


def test_build_dashboard_emits_drilldown_when_panel_has_one():
    layout = Layout(project="x", panels=[
        Panel(
            id="p1", title="T", viz_type="splunk.table",
            drilldown={"type": "link.dashboard", "dashboard": "other"},
        )
    ])
    data = DataSources(project="x")
    result = build_dashboard(layout, data, title="t", description="", with_time_input=False)
    viz = result["visualizations"]["viz_p1"]
    assert viz["options"]["drilldown"] == "all"
    assert viz["options"]["drilldownAction"] == {"type": "link.dashboard", "dashboard": "other"}


def test_build_dashboard_grid_layout_emits_row_structure():
    layout = Layout(project="x", panels=[
        Panel(id="p1", title="A", x=0, y=0, w=6, h=4),
        Panel(id="p2", title="B", x=6, y=0, w=6, h=4),
        Panel(id="p3", title="C", x=0, y=4, w=12, h=4),
    ])
    data = DataSources(project="x")
    result = build_dashboard(layout, data, title="t", description="", with_time_input=False, layout_type="grid")
    assert result["layout"]["type"] == "grid"
    structure = result["layout"]["structure"]
    # Each row is a {"type": "row", "items": [...]}. Panels at the same y share a row.
    assert len(structure) == 2  # two rows (y=0 and y=4)
    assert structure[0]["type"] == "row"
    first_row_items = [it["item"] for it in structure[0]["items"]]
    assert "viz_p1" in first_row_items
    assert "viz_p2" in first_row_items
    # Second row has a single panel at y=4
    second_row_items = [it["item"] for it in structure[1]["items"]]
    assert second_row_items == ["viz_p3"]


def test_cli_build_grid_layout_flag(tmp_path, monkeypatch):
    _prepare_workspace_at_designed(tmp_path, monkeypatch)
    result = _run_cli(
        ["build", "my-dash", "--title", "T", "--description", "", "--layout", "grid", "--no-time-input"],
        cwd=tmp_path,
    )
    assert result.returncode == 0, result.stderr
    dashboard = json.loads((tmp_path / ".splunk-dashboards" / "my-dash" / "dashboard.json").read_text())
    assert dashboard["layout"]["type"] == "grid"
    assert dashboard["inputs"] == {}
