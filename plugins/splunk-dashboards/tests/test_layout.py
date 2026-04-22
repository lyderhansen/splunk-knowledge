"""Tests for layout module."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.layout import (
    Panel,
    VIZ_TYPES,
    Layout,
    LAYOUT_FILENAME,
    DESIGN_SUBDIR,
    layout_path,
    save_layout,
    load_layout,
)
from splunk_dashboards.workspace import init_workspace


def test_panel_defaults():
    p = Panel(id="p1", title="Failed Logins")
    assert p.id == "p1"
    assert p.title == "Failed Logins"
    assert p.x == 0
    assert p.y == 0
    assert p.w == 6
    assert p.h == 4
    assert p.viz_type == "splunk.singlevalue"
    assert p.data_source_ref is None


def test_panel_to_dict_roundtrip():
    p = Panel(
        id="p2",
        title="Logins Over Time",
        x=6, y=0, w=6, h=4,
        viz_type="splunk.line",
        data_source_ref="question-1",
    )
    data = p.to_dict()
    restored = Panel.from_dict(data)
    assert restored == p


def test_viz_types_includes_core_set():
    core = {
        "splunk.singlevalue",
        "splunk.line",
        "splunk.column",
        "splunk.bar",
        "splunk.pie",
        "splunk.area",
        "splunk.table",
        "splunk.timeline",
        "splunk.choropleth",
        "splunk.markergauge",
    }
    assert core.issubset(set(VIZ_TYPES))


def test_layout_defaults():
    layout = Layout(project="my-dash")
    assert layout.project == "my-dash"
    assert layout.theme == "dark"
    assert layout.panels == []


def test_layout_roundtrip():
    layout = Layout(
        project="my-dash",
        theme="light",
        panels=[
            Panel(id="p1", title="T1"),
            Panel(id="p2", title="T2", viz_type="splunk.line"),
        ],
    )
    data = layout.to_dict()
    restored = Layout.from_dict(data)
    assert restored == layout


import pytest


def test_layout_path_resolves_under_design_subdir(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    assert layout_path("my-dash") == tmp_path / ".splunk-dashboards" / "my-dash" / DESIGN_SUBDIR / LAYOUT_FILENAME


def test_save_and_load_layout_roundtrip(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    original = Layout(
        project="my-dash",
        theme="dark",
        panels=[Panel(id="p1", title="Hello")],
    )
    save_layout(original)
    loaded = load_layout("my-dash")
    assert loaded == original


def test_save_layout_creates_design_subdir(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    save_layout(Layout(project="my-dash"))
    assert (tmp_path / ".splunk-dashboards" / "my-dash" / DESIGN_SUBDIR).is_dir()


def test_save_layout_requires_workspace(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    with pytest.raises(FileNotFoundError):
        save_layout(Layout(project="ghost"))


def test_load_layout_missing_raises(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    with pytest.raises(FileNotFoundError):
        load_layout("my-dash")
