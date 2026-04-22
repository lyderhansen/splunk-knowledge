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
    result = build_dashboard(layout, data, title="My Dash", description="desc")
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
    result = build_dashboard(layout, data, title="t", description="")
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
    result = build_dashboard(layout, data, title="t", description="")

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
    result = build_dashboard(layout, data, title="t", description="")
    viz = result["visualizations"]["viz_p1"]
    # dataSources map is present but empty when no ref
    assert viz["dataSources"] == {}


def test_build_dashboard_preserves_theme():
    layout = Layout(project="x", theme="light")
    data = DataSources(project="x")
    result = build_dashboard(layout, data, title="t", description="")
    # Theme is a top-level hint consumed by the XML envelope at deploy time
    assert result["theme"] == "light"
