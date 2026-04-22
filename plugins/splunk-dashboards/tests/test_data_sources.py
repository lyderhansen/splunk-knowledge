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
