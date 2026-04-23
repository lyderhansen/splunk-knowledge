"""Tests for templates module."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from splunk_dashboards.templates import (
    list_bundled_templates,
    load_bundled_template,
    TemplateNotFoundError,
)


def test_list_includes_all_bundled():
    names = list_bundled_templates()
    assert "soc-overview" in names
    assert "ops-health" in names
    assert "security-monitoring" in names
    assert "api-performance" in names


def test_load_bundled_returns_layout_dict():
    data = load_bundled_template("soc-overview")
    assert data["name"] == "soc-overview"
    assert "description" in data
    assert isinstance(data["panels"], list)
    assert len(data["panels"]) >= 1


def test_load_unknown_raises():
    with pytest.raises(TemplateNotFoundError):
        load_bundled_template("does-not-exist")


import json
import os
import subprocess
import sys as _sys
from splunk_dashboards.workspace import init_workspace


def _run_cli(args, cwd, stdin=None):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    return subprocess.run(
        [_sys.executable, "-m", "splunk_dashboards.templates", *args],
        cwd=cwd,
        env=env,
        input=stdin,
        capture_output=True,
        text=True,
    )


def test_cli_list_prints_template_names(tmp_path):
    result = _run_cli(["list"], cwd=tmp_path)
    assert result.returncode == 0, result.stderr
    assert "soc-overview" in result.stdout
    assert "ops-health" in result.stdout


def test_cli_load_seeds_layout_json(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    result = _run_cli(["load", "soc-overview", "--project", "my-dash"], cwd=tmp_path)
    assert result.returncode == 0, result.stderr
    layout = json.loads((tmp_path / ".splunk-dashboards" / "my-dash" / "design" / "layout.json").read_text())
    assert layout["project"] == "my-dash"
    assert len(layout["panels"]) >= 1
    assert "name" not in layout


def test_cli_load_rejects_missing_workspace(tmp_path):
    result = _run_cli(["load", "soc-overview", "--project", "ghost"], cwd=tmp_path)
    assert result.returncode != 0


def test_cli_load_rejects_unknown_template(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    result = _run_cli(["load", "does-not-exist", "--project", "my-dash"], cwd=tmp_path)
    assert result.returncode != 0


def test_aurora_flagship_templates_listed():
    from splunk_dashboards.templates import list_bundled_templates
    names = set(list_bundled_templates())
    assert "aurora-exec-hero" in names
    assert "aurora-noc-wall" in names


def test_aurora_exec_hero_loads_and_has_valid_structure():
    import json
    from splunk_dashboards.templates import load_bundled_template
    data = load_bundled_template("aurora-exec-hero")
    assert data["title"] == "Executive Hero"
    assert len(data["visualizations"]) >= 5
    assert data["layout"]["type"] == "absolute"
    assert len(data["layout"]["structure"]) == len(data["visualizations"])


def test_aurora_noc_wall_loads_and_has_valid_structure():
    from splunk_dashboards.templates import load_bundled_template
    data = load_bundled_template("aurora-noc-wall")
    assert data["title"] == "NOC Wall"
    # 4 status tiles + live chart + hosts = 6
    assert len(data["visualizations"]) == 6
    # Verify status-tile backgrounds are semantically colored
    alert_viz = data["visualizations"]["viz_alerts"]
    assert alert_viz["options"]["backgroundColor"] == "#DC4E41"
