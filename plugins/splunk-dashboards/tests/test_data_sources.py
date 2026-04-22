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
