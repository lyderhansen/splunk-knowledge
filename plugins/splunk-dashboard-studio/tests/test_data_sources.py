"""Tests for data_sources module."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.data_sources import DataSource, DataSources


def test_data_source_defaults():
    ds = DataSource(question="Top failed logins?", spl="index=auth | top src")
    assert ds.question == "Top failed logins?"
    assert ds.spl == "index=auth | top src"
    assert ds.earliest == "-24h"
    assert ds.latest == "now"
    assert ds.name is None


def test_data_source_to_dict_roundtrip():
    ds = DataSource(
        question="q",
        spl="s",
        earliest="-7d",
        latest="-1d",
        name="Weekly report",
    )
    data = ds.to_dict()
    restored = DataSource.from_dict(data)
    assert restored == ds


def test_data_sources_collection_defaults():
    coll = DataSources(project="my-dash")
    assert coll.project == "my-dash"
    assert coll.source == "mock"
    assert coll.sources == []


def test_data_sources_collection_roundtrip():
    coll = DataSources(
        project="my-dash",
        source="explore",
        sources=[
            DataSource(question="q1", spl="s1"),
            DataSource(question="q2", spl="s2"),
        ],
    )
    data = coll.to_dict()
    restored = DataSources.from_dict(data)
    assert restored == coll


import pytest
from splunk_dashboards.data_sources import (
    DATA_SOURCES_FILENAME,
    load_data_sources,
    save_data_sources,
)
from splunk_dashboards.workspace import init_workspace


def test_save_and_load_data_sources_roundtrip(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    coll = DataSources(
        project="my-dash",
        source="mock",
        sources=[DataSource(question="q1", spl="| makeresults count=10")],
    )
    save_data_sources(coll)
    loaded = load_data_sources("my-dash")
    assert loaded == coll
    # File should land under the workspace directory
    assert (tmp_path / ".splunk-dashboards" / "my-dash" / DATA_SOURCES_FILENAME).exists()


def test_load_data_sources_missing_raises(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    with pytest.raises(FileNotFoundError):
        load_data_sources("my-dash")


def test_save_data_sources_requires_workspace(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    # No init_workspace call — workspace does not exist
    coll = DataSources(project="ghost")
    with pytest.raises(FileNotFoundError):
        save_data_sources(coll)


import os
import subprocess
import sys as _sys
import json as _json


def _run_cli(args, cwd, stdin=None):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    return subprocess.run(
        [_sys.executable, "-m", "splunk_dashboards.data_sources", *args],
        cwd=cwd,
        env=env,
        input=stdin,
        capture_output=True,
        text=True,
    )


def test_cli_write_persists_and_advances_stage(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("auth-mon", autopilot=False)
    payload = {
        "project": "auth-mon",
        "source": "mock",
        "sources": [
            {
                "question": "Top failed logins?",
                "spl": "| makeresults count=10 | eval src=\"10.0.0.1\"",
                "earliest": "-24h",
                "latest": "now",
                "name": "Failed Logins"
            }
        ]
    }
    result = _run_cli(["write", "-"], cwd=tmp_path, stdin=_json.dumps(payload))
    assert result.returncode == 0, result.stderr

    ws = tmp_path / ".splunk-dashboards" / "auth-mon"
    # data-sources.json written
    coll = _json.loads((ws / "data-sources.json").read_text())
    assert coll["project"] == "auth-mon"
    assert len(coll["sources"]) == 1
    assert coll["sources"][0]["name"] == "Failed Logins"
    # state advanced to data-ready
    state = _json.loads((ws / "state.json").read_text())
    assert state["current_stage"] == "data-ready"
    assert "scoped" in state["stages_completed"]


def test_cli_write_rejects_missing_workspace(tmp_path):
    # No init_workspace — CLI should fail with non-zero exit code
    payload = {"project": "ghost", "sources": []}
    result = _run_cli(["write", "-"], cwd=tmp_path, stdin=_json.dumps(payload))
    assert result.returncode != 0
    assert "Workspace does not exist" in result.stderr or "Workspace does not exist" in result.stdout
