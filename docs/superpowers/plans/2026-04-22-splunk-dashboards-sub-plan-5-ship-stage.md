# splunk-dashboards Sub-plan 5: Ship stage (ds-validate + ds-deploy + ds-update + ds-review)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the splunk-dashboards pipeline with the four ship-stage skills. `ds-validate` lints a built `dashboard.json` and advances `built` → `validated`. `ds-deploy` wraps the JSON in the Dashboard Studio XML envelope and (optionally) packs it as a Splunk TA tarball, advancing `validated` → `deployed`. `ds-update` and `ds-review` are standalone skills that operate on any dashboard file — `ds-update` applies natural-language edits via Claude, `ds-review` audits against best practices and writes `review.md`.

**Architecture:** `validate.py` ships a set of pure-function lint checks (SPL name present, token references resolve, drilldown targets exist, panel data-source refs resolve, JSON shape sane) plus a `check` CLI. `deploy.py` owns XML envelope construction and optional Splunk TA tarball packaging via stdlib `tarfile`. `ds-update` and `ds-review` are SKILL.md-only skills — their intelligence lives in Claude's edit/audit behavior.

**Tech Stack:** Python 3.11+ stdlib (`tarfile`, `xml.sax.saxutils` for escaping, `re`). No new external deps.

---

## Execution pattern

```
Sequential foundation:                    Parallel SKILLs (4 agents):
  F1 validate.py + CLI                      S1 ds-validate SKILL.md
  F2 deploy.py XML envelope                 S2 ds-deploy SKILL.md
  F3 deploy.py TA tarball                   S3 ds-update SKILL.md
  F4 deploy CLI                             S4 ds-review SKILL.md
                                          Final:
                                            Z1 pipeline test
                                            Z2 verification + push
```

S1–S4 all touch separate directories and can run concurrently.

---

## File structure created by this sub-plan

```
plugins/splunk-dashboards/
├── src/splunk_dashboards/
│   ├── validate.py                 # NEW — lint checks + CLI
│   └── deploy.py                   # NEW — XML envelope, TA tarball, CLI
├── skills/
│   ├── ds-validate/SKILL.md        # NEW
│   ├── ds-deploy/SKILL.md          # NEW
│   ├── ds-update/SKILL.md          # NEW
│   └── ds-review/SKILL.md          # NEW
└── tests/
    ├── test_validate.py            # NEW
    ├── test_deploy.py              # NEW
    └── test_pipeline_ship.py       # NEW — built → deployed
```

Expected test count after this sub-plan: **66 (prior) + 17 new = 83 tests** (F1: 9, F2: 3, F3: 3, F4: 1, Z1: 1).

---

### Task F1: validate.py lint checks + CLI (TDD)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_validate.py`
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/validate.py`

- [ ] **Step 1: Write the failing tests**

Create `plugins/splunk-dashboards/tests/test_validate.py`:

```python
"""Tests for validate module (lint checks + CLI)."""
import json
import os
import subprocess
import sys as _sys
from pathlib import Path

sys.path = [str(Path(__file__).parent.parent / "src")] + sys.path if 'sys' in dir() else _sys.path  # noqa

import sys
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
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_validate.py -v
```

Expected: `ModuleNotFoundError: No module named 'splunk_dashboards.validate'`.

- [ ] **Step 3: Implement validate.py**

Create `plugins/splunk-dashboards/src/splunk_dashboards/validate.py`:

```python
"""Lint checks for a Splunk Dashboard Studio JSON definition."""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

Severity = Literal["error", "warning", "info"]

# Tokens defined automatically by Dashboard Studio even when not declared in `inputs`.
BUILT_IN_TOKENS = {"global_time", "earliest", "latest", "row", "click"}

# Match $name$ or $name.sub$, but NOT $$ (escaped dollar).
TOKEN_RE = re.compile(r"\$([a-zA-Z_][\w.]*)\$")


@dataclass
class Finding:
    severity: Severity
    code: str
    message: str


def check_data_source_names(dashboard: dict) -> list[Finding]:
    findings: list[Finding] = []
    for key, ds in dashboard.get("dataSources", {}).items():
        if ds.get("type") == "ds.search" and not ds.get("name"):
            findings.append(Finding(
                severity="error",
                code="ds.search-missing-name",
                message=f"dataSource '{key}' (ds.search) is missing required 'name' field",
            ))
    return findings


def check_panel_data_source_refs(dashboard: dict) -> list[Finding]:
    known = set(dashboard.get("dataSources", {}).keys())
    findings: list[Finding] = []
    for viz_id, viz in dashboard.get("visualizations", {}).items():
        for role, ref in viz.get("dataSources", {}).items():
            if ref and ref not in known:
                findings.append(Finding(
                    severity="error",
                    code="viz-unknown-data-source",
                    message=f"visualization '{viz_id}' references unknown dataSource '{ref}' (role: {role})",
                ))
    return findings


def _collect_declared_tokens(dashboard: dict) -> set[str]:
    tokens: set[str] = set(BUILT_IN_TOKENS)
    for inp in dashboard.get("inputs", {}).values():
        token = (inp.get("options") or {}).get("token")
        if token:
            tokens.add(token)
    # defaults can also set tokens
    for key in (dashboard.get("defaults") or {}):
        if key == "tokens":
            tokens.update(dashboard["defaults"]["tokens"].keys())
    return tokens


def _find_token_refs_in_text(text: str) -> set[str]:
    return {m.split(".")[0] for m in TOKEN_RE.findall(text or "")}


def check_token_references(dashboard: dict) -> list[Finding]:
    declared = _collect_declared_tokens(dashboard)
    findings: list[Finding] = []
    # SPL queries
    for ds_id, ds in dashboard.get("dataSources", {}).items():
        query = (ds.get("options") or {}).get("query", "")
        for ref in _find_token_refs_in_text(query):
            if ref not in declared:
                findings.append(Finding(
                    severity="warning",
                    code="token-undeclared",
                    message=f"dataSource '{ds_id}' references token '{ref}' which is not declared in inputs or defaults",
                ))
    return findings


def check_drilldown_targets(dashboard: dict) -> list[Finding]:
    known_vizes = set(dashboard.get("visualizations", {}).keys())
    findings: list[Finding] = []
    for viz_id, viz in dashboard.get("visualizations", {}).items():
        action = (viz.get("options") or {}).get("drilldownAction")
        if isinstance(action, dict) and action.get("type") == "link.viz":
            target = action.get("target")
            if target and target not in known_vizes:
                findings.append(Finding(
                    severity="warning",
                    code="drilldown-unknown-target",
                    message=f"visualization '{viz_id}' drilldown targets unknown visualization '{target}'",
                ))
    return findings


def check_all(dashboard: dict) -> list[Finding]:
    findings: list[Finding] = []
    findings.extend(check_data_source_names(dashboard))
    findings.extend(check_panel_data_source_refs(dashboard))
    findings.extend(check_token_references(dashboard))
    findings.extend(check_drilldown_targets(dashboard))
    return findings
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_validate.py -v
```

Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/validate.py plugins/splunk-dashboards/tests/test_validate.py
git commit -m "feat(splunk-dashboards): add validate module with lint checks"
```

---

### Task F1b: validate CLI + stage advance (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_validate.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/validate.py`

- [ ] **Step 1: Append failing CLI test**

Append to `plugins/splunk-dashboards/tests/test_validate.py`:

```python
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
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_validate.py -v
```

Expected: the 2 new CLI tests fail (no `__main__` yet).

- [ ] **Step 3: Add the CLI**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/validate.py`:

```python
import json as _json
import sys as _sys
from pathlib import Path as _Path

from splunk_dashboards.workspace import (
    advance_stage,
    get_workspace_dir,
    load_state,
    save_state,
    InvalidStageTransition,
)


def _cli(argv=None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.validate")
    sub = parser.add_subparsers(dest="command", required=True)
    check = sub.add_parser("check", help="Lint a built dashboard")
    check.add_argument("project")
    check.add_argument("--force", action="store_true",
                       help="Advance stage even if errors are found")

    args = parser.parse_args(argv)
    if args.command == "check":
        try:
            state = load_state(args.project)
        except FileNotFoundError:
            print(f"No workspace for project '{args.project}'", file=_sys.stderr)
            return 2
        if state.current_stage != "built":
            print(
                f"Cannot validate from stage '{state.current_stage}' — expected 'built'",
                file=_sys.stderr,
            )
            return 2
        ws = get_workspace_dir(args.project)
        dashboard_path = ws / "dashboard.json"
        if not dashboard_path.exists():
            print(f"Missing {dashboard_path}", file=_sys.stderr)
            return 2

        dashboard = _json.loads(dashboard_path.read_text(encoding="utf-8"))
        findings = check_all(dashboard)
        errors = [f for f in findings if f.severity == "error"]
        warnings = [f for f in findings if f.severity == "warning"]

        for f in findings:
            print(f"[{f.severity}] {f.code}: {f.message}")

        if errors and not args.force:
            print(f"\n{len(errors)} error(s), {len(warnings)} warning(s). Refusing to advance stage. Use --force to override.",
                  file=_sys.stderr)
            return 1

        try:
            advance_stage(state, "validated")
        except InvalidStageTransition as e:
            print(str(e), file=_sys.stderr)
            return 3
        save_state(state)
        print(f"\nValidation complete: {len(errors)} error(s), {len(warnings)} warning(s). Stage advanced to 'validated'.")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_validate.py -v
```

Expected: 11 passed (9 unit + 2 CLI).

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/validate.py plugins/splunk-dashboards/tests/test_validate.py
git commit -m "feat(splunk-dashboards): add validate CLI (built → validated)"
```

---

### Task F2: deploy.py XML envelope (TDD)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_deploy.py`
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/deploy.py`

- [ ] **Step 1: Write the failing tests**

Create `plugins/splunk-dashboards/tests/test_deploy.py`:

```python
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
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_deploy.py -v
```

Expected: `ModuleNotFoundError`.

- [ ] **Step 3: Implement build_xml_envelope**

Create `plugins/splunk-dashboards/src/splunk_dashboards/deploy.py`:

```python
"""XML envelope + Splunk TA packaging for ds-deploy."""
from __future__ import annotations

import json
from xml.sax.saxutils import escape


def build_xml_envelope(dashboard: dict, label: str, description: str, theme: str) -> str:
    """Wrap a Dashboard Studio JSON definition in the v2 XML envelope."""
    json_body = json.dumps(dashboard, indent=2)
    parts: list[str] = [
        f'<dashboard version="2" theme="{escape(theme)}">',
        f"  <label>{escape(label)}</label>",
    ]
    if description:
        parts.append(f"  <description>{escape(description)}</description>")
    parts.append("  <definition><![CDATA[")
    parts.append(json_body)
    parts.append("]]></definition>")
    parts.append("</dashboard>")
    return "\n".join(parts) + "\n"
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_deploy.py -v
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/deploy.py plugins/splunk-dashboards/tests/test_deploy.py
git commit -m "feat(splunk-dashboards): add XML envelope builder"
```

---

### Task F3: deploy.py TA tarball (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_deploy.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/deploy.py`

- [ ] **Step 1: Append failing tests**

Append to `plugins/splunk-dashboards/tests/test_deploy.py`:

```python
import tarfile
from splunk_dashboards.deploy import build_ta_tarball


def test_ta_tarball_contains_required_files(tmp_path):
    xml = "<dashboard version=\"2\"><label>T</label></dashboard>\n"
    out = tmp_path / "my_app.tar.gz"
    build_ta_tarball(
        xml_content=xml,
        app_name="my_app",
        view_name="my_view",
        app_label="My App",
        output_path=out,
    )
    assert out.exists()
    with tarfile.open(out, "r:gz") as tar:
        names = tar.getnames()
    assert "my_app/default/app.conf" in names
    assert "my_app/default/data/ui/views/my_view.xml" in names
    assert "my_app/metadata/default.meta" in names


def test_ta_tarball_view_file_contains_dashboard_xml(tmp_path):
    xml = "<dashboard version=\"2\"><label>Unique123</label></dashboard>\n"
    out = tmp_path / "app.tar.gz"
    build_ta_tarball(
        xml_content=xml,
        app_name="app",
        view_name="v",
        app_label="App",
        output_path=out,
    )
    with tarfile.open(out, "r:gz") as tar:
        f = tar.extractfile("app/default/data/ui/views/v.xml")
        assert f is not None
        content = f.read().decode("utf-8")
    assert "Unique123" in content


def test_ta_tarball_app_conf_has_label(tmp_path):
    out = tmp_path / "app.tar.gz"
    build_ta_tarball(
        xml_content="<dashboard version=\"2\"/>",
        app_name="app",
        view_name="v",
        app_label="Human Friendly Label",
        output_path=out,
    )
    with tarfile.open(out, "r:gz") as tar:
        f = tar.extractfile("app/default/app.conf")
        assert f is not None
        content = f.read().decode("utf-8")
    assert "label = Human Friendly Label" in content
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_deploy.py -v
```

Expected: `ImportError: cannot import name 'build_ta_tarball'`.

- [ ] **Step 3: Implement build_ta_tarball**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/deploy.py`:

```python
import io
import tarfile
from pathlib import Path

APP_CONF_TEMPLATE = """[install]
is_configured = 1

[launcher]
version = 0.1.0
description = {description}

[ui]
is_visible = 1
label = {label}

[package]
id = {app_name}
"""

META_DEFAULT = """[]
access = read : [ * ], write : [ admin ]
export = system
"""


def _tar_add_bytes(tar: tarfile.TarFile, name: str, data: bytes) -> None:
    info = tarfile.TarInfo(name=name)
    info.size = len(data)
    tar.addfile(info, io.BytesIO(data))


def build_ta_tarball(
    *,
    xml_content: str,
    app_name: str,
    view_name: str,
    app_label: str,
    output_path: Path,
    description: str = "",
) -> None:
    """Build a Splunk TA tarball containing a single dashboard view."""
    app_conf = APP_CONF_TEMPLATE.format(
        app_name=app_name,
        label=app_label,
        description=description or app_label,
    )
    with tarfile.open(output_path, "w:gz") as tar:
        _tar_add_bytes(tar, f"{app_name}/default/app.conf", app_conf.encode("utf-8"))
        _tar_add_bytes(
            tar,
            f"{app_name}/default/data/ui/views/{view_name}.xml",
            xml_content.encode("utf-8"),
        )
        _tar_add_bytes(tar, f"{app_name}/metadata/default.meta", META_DEFAULT.encode("utf-8"))
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_deploy.py -v
```

Expected: 6 passed (3 XML + 3 TA).

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/deploy.py plugins/splunk-dashboards/tests/test_deploy.py
git commit -m "feat(splunk-dashboards): add Splunk TA tarball packaging"
```

---

### Task F4: deploy CLI + stage advance (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_deploy.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/deploy.py`

- [ ] **Step 1: Append failing CLI test**

Append to `plugins/splunk-dashboards/tests/test_deploy.py`:

```python
import json
import os
import subprocess
import sys as _sys
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
        [_sys.executable, "-m", "splunk_dashboards.deploy", *args],
        cwd=cwd,
        env=env,
        capture_output=True,
        text=True,
    )


def test_cli_build_writes_xml_and_advances_stage(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    for stage in ("data-ready", "designed", "built", "validated"):
        advance_stage(state, stage)
    save_state(state)
    dashboard = {"title": "T", "description": "d", "theme": "dark", "dataSources": {}, "visualizations": {}, "inputs": {}, "defaults": {}, "layout": {"type": "absolute", "structure": []}}
    (get_workspace_dir("my-dash") / "dashboard.json").write_text(json.dumps(dashboard))

    result = _run_cli(
        ["build", "my-dash", "--label", "My Dashboard"],
        cwd=tmp_path,
    )
    assert result.returncode == 0, result.stderr

    xml_path = get_workspace_dir("my-dash") / "dashboard.xml"
    assert xml_path.exists()
    content = xml_path.read_text()
    assert '<dashboard version="2"' in content
    assert "<label>My Dashboard</label>" in content

    state = load_state("my-dash")
    assert state.current_stage == "deployed"
    assert "validated" in state.stages_completed
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_deploy.py -v
```

Expected: the new CLI test fails (no `__main__`).

- [ ] **Step 3: Add the CLI**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/deploy.py`:

```python
import sys as _sys

from splunk_dashboards.workspace import (
    advance_stage,
    get_workspace_dir,
    load_state,
    save_state,
    InvalidStageTransition,
)


def _cli(argv=None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.deploy")
    sub = parser.add_subparsers(dest="command", required=True)
    build = sub.add_parser("build", help="Build dashboard.xml (and optional TA tarball)")
    build.add_argument("project")
    build.add_argument("--label", required=True, help="Dashboard label (shown in Splunk UI)")
    build.add_argument("--theme", default=None, help="Override theme from dashboard.json")
    build.add_argument("--as-app", action="store_true", help="Also build a Splunk TA tarball")
    build.add_argument("--app-name", help="TA app name (defaults to project name)")
    build.add_argument("--view-name", help="View name inside the TA (defaults to project name)")

    args = parser.parse_args(argv)
    if args.command == "build":
        try:
            state = load_state(args.project)
        except FileNotFoundError:
            print(f"No workspace for project '{args.project}'", file=_sys.stderr)
            return 2
        if state.current_stage != "validated":
            print(
                f"Cannot deploy from stage '{state.current_stage}' — expected 'validated'",
                file=_sys.stderr,
            )
            return 2

        ws = get_workspace_dir(args.project)
        dashboard_path = ws / "dashboard.json"
        if not dashboard_path.exists():
            print(f"Missing {dashboard_path}", file=_sys.stderr)
            return 2
        dashboard = json.loads(dashboard_path.read_text(encoding="utf-8"))
        theme = args.theme or dashboard.get("theme", "dark")
        description = dashboard.get("description", "")
        xml_content = build_xml_envelope(
            dashboard, label=args.label, description=description, theme=theme
        )
        xml_path = ws / "dashboard.xml"
        xml_path.write_text(xml_content, encoding="utf-8")

        if args.as_app:
            app_name = args.app_name or args.project.replace("-", "_")
            view_name = args.view_name or args.project.replace("-", "_")
            tar_path = ws / f"{app_name}.tar.gz"
            build_ta_tarball(
                xml_content=xml_content,
                app_name=app_name,
                view_name=view_name,
                app_label=args.label,
                output_path=tar_path,
                description=description,
            )
            print(f"Wrote TA tarball: {tar_path}")

        try:
            advance_stage(state, "deployed")
        except InvalidStageTransition as e:
            print(str(e), file=_sys.stderr)
            return 3
        save_state(state)
        print(f"Wrote {xml_path}. Stage advanced to 'deployed'.")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_deploy.py -v
```

Expected: 7 passed.

Full suite:

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: 82 passed (66 prior + 11 validate + 6 deploy - wait, recount).

Actually: 66 prior + 9 F1 + 2 F1b + 3 F2 + 3 F3 + 1 F4 = 66 + 18 = 84.

Hmm, we stated 83 in the header. Let me recount:
- F1: 9 (validate unit tests)
- F1b: 2 (validate CLI)
- F2: 3 (XML envelope)
- F3: 3 (TA tarball)
- F4: 1 (deploy CLI)
- Z1: 1 (pipeline)
Total new: 19. Grand total: 66 + 19 = 85.

OK header was wrong. The correct expected count after Z1 is **85**. After F4 (before Z1): **84**.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/deploy.py plugins/splunk-dashboards/tests/test_deploy.py
git commit -m "feat(splunk-dashboards): add deploy CLI (validated → deployed)"
```

---

### Task S1: ds-validate SKILL.md (parallel)

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-validate/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-validate/SKILL.md`:

```markdown
---
name: ds-validate
description: Use this skill to lint a built dashboard.json before deploying it to Splunk. Checks that every ds.search has a name, every panel references an existing data source, all token references resolve to declared inputs or defaults, and drilldown targets exist. Reports errors (blocking) and warnings (non-blocking). Advances workspace state from built to validated. Requires a workspace at built stage produced by ds-create.
---

# ds-validate — Dashboard lint

## When to use

After `ds-create` has produced `dashboard.json` and advanced state to `built`. Always run this before `ds-deploy` — it catches the Dashboard-Studio-specific mistakes that would otherwise silently break the dashboard in production.

## What it checks

| Check | Severity | What it catches |
|---|---|---|
| `ds.search-missing-name` | error | A `ds.search` without a `name` field (Dashboard Studio UI won't show the search) |
| `viz-unknown-data-source` | error | A panel's `dataSources.primary` points to a dataSource id that isn't defined |
| `token-undeclared` | warning | SPL references `$some_token$` that isn't declared in `inputs` or `defaults` (may still work if the runtime injects it, but fragile) |
| `drilldown-unknown-target` | warning | A `link.viz` drilldown targets a visualization id that doesn't exist |

**Errors** block the stage advance. **Warnings** are reported but do not block.

## How to invoke

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.validate check <project-name>
```

Output:

```
[error] ds.search-missing-name: dataSource 'ds_2' (ds.search) is missing required 'name' field
[warning] token-undeclared: dataSource 'ds_1' references token 'env' which is not declared in inputs or defaults

Validation complete: 1 error(s), 1 warning(s). Refusing to advance stage. Use --force to override.
```

With errors and no `--force`, the CLI exits non-zero and leaves state at `built`. With `--force`, stage advances regardless.

## After a clean run

- `state.json` has `current_stage=validated`.
- Next step: `ds-deploy` to produce `dashboard.xml` (and optionally a Splunk TA tarball).
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-validate/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-validate SKILL.md"
```

---

### Task S2: ds-deploy SKILL.md (parallel)

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-deploy/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-deploy/SKILL.md`:

```markdown
---
name: ds-deploy
description: Use this skill to produce a deployable Splunk artifact from a validated dashboard.json. Writes dashboard.xml (Dashboard Studio v2 XML envelope with embedded JSON definition) to the workspace, and optionally packages the dashboard as a Splunk TA tarball with app.conf, metadata, and view files ready to install into Splunk. Advances workspace state from validated to deployed.
---

# ds-deploy — Produce a deployable Splunk artifact

## When to use

After `ds-validate` has confirmed the dashboard passes lint checks and state is `validated`. This is the last step before the dashboard lives in Splunk.

## What it produces

1. **`dashboard.xml`** (always) — the Dashboard Studio v2 XML envelope with the JSON definition embedded in a CDATA section. Can be pasted directly into Splunk's dashboard editor.
2. **`<app_name>.tar.gz`** (with `--as-app`) — a Splunk TA tarball containing:
   - `default/app.conf` — app metadata
   - `default/data/ui/views/<view_name>.xml` — the dashboard view
   - `metadata/default.meta` — permissions

Install the TA by dropping the tarball into `$SPLUNK_HOME/etc/apps/` (or using Splunk's UI install flow) and restarting Splunk.

## How to invoke

Plain XML (default):

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.deploy build <project-name> --label "My Dashboard"
```

As Splunk TA:

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.deploy build <project-name> --label "My Dashboard" --as-app
```

## Flags

| Flag | Default | Purpose |
|---|---|---|
| `--label` (required) | — | Dashboard label (shown in Splunk UI) |
| `--theme` | `dashboard.json`'s theme | Override theme (`light` / `dark`) |
| `--as-app` | off | Also build a Splunk TA tarball |
| `--app-name` | project name | TA app directory name (dashes → underscores) |
| `--view-name` | project name | View file basename inside the TA |

## After deploying

- `dashboard.xml` ready to paste / install.
- (If `--as-app`) `<app-name>.tar.gz` ready to deploy as a Splunk TA.
- `state.json` has `current_stage=deployed`.
- Next step (optional): `ds-review` to audit the dashboard against best practices.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-deploy/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-deploy SKILL.md"
```

---

### Task S3: ds-update SKILL.md (parallel)

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-update/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-update/SKILL.md`:

```markdown
---
name: ds-update
description: Use this skill to modify an existing Splunk Dashboard Studio dashboard based on a natural-language change request. Can edit dashboard.json inside a workspace (preserving pipeline state) or operate on any dashboard.json or dashboard.xml file outside a workspace. Applies targeted edits like adding a panel, changing a viz type, adjusting an SPL query, retitling, or rebinding data sources. After editing, always re-run ds-validate before ds-deploy.
---

# ds-update — Modify an existing dashboard

## When to use

- User says "change <X> in my dashboard" and points at a workspace project or a file path.
- After `ds-review` flagged something that needs fixing.
- After `ds-validate` reported errors that need to be corrected in the JSON.

## Two modes

### Workspace mode

If the dashboard is inside an existing workspace (`.splunk-dashboards/<project>/dashboard.json`), apply edits in place. The workspace state stays where it is — `ds-update` is not a pipeline stage. After editing, advise the user to re-run `ds-validate` and `ds-deploy`.

### Standalone mode

Operate on any `dashboard.json` or `dashboard.xml` path the user provides. If the input is XML, extract the JSON from the `<![CDATA[...]]>` block, edit it, and write it back in the same envelope.

## How to apply edits

1. Read the file (or workspace `dashboard.json`).
2. Interpret the change request. Map it to one or more JSON mutations:

| Request pattern | Mutation |
|---|---|
| "Add a panel for <metric>" | Add a new `visualizations.viz_<id>` entry + a new `layout.structure` block. Bind to an existing or new `dataSources` entry. |
| "Change viz <id> to <type>" | Update `visualizations.<id>.type`; remove incompatible options. |
| "Rename panel <id> to <title>" | Update `visualizations.<id>.title`. |
| "Change query for <ds>" | Update `dataSources.<ds>.options.query`. |
| "Rebind panel <id> to <ds>" | Update `visualizations.<id>.dataSources.primary`. |
| "Resize panel <id> to <w>x<h>" | Update `layout.structure` entry's `position.w` / `position.h` (in pixels — grid cells × 100 × 80 if built by ds-create). |
| "Drop panel <id>" | Remove from `visualizations` AND from `layout.structure`. |

3. Preserve the rest of the file unchanged — don't reformat keys or reorder entries unnecessarily.
4. Write back to the same path.
5. If operating on XML, preserve the XML envelope exactly (only the CDATA body changes).

## Invariants to preserve

- Every `ds.search` keeps its `name` field.
- Every `visualizations.<id>.dataSources.primary` references a real `dataSources` key.
- Every `layout.structure[*].item` references a real `visualizations` key.
- `layout.structure` and `visualizations` stay in sync (no orphans in either).

If any invariant breaks after your edit, fix it before writing the file.

## After editing

Tell the user:
- What you changed (one-sentence summary).
- What to do next: re-run `ds-validate` (and then `ds-deploy`) if operating in a workspace, or just re-lint manually otherwise.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-update/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-update SKILL.md"
```

---

### Task S4: ds-review SKILL.md (parallel)

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-review/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-review/SKILL.md`:

```markdown
---
name: ds-review
description: Use this skill to audit a Splunk Dashboard Studio dashboard against authoring best practices — panel count and cognitive load, viz-type consistency, drilldown coverage, token reuse, accessibility (color contrast, dark/light compatibility), and SPL performance hints. Operates on any dashboard.json or dashboard.xml inside or outside a workspace and writes review.md with findings and suggested ds-update invocations.
---

# ds-review — Audit a dashboard against best practices

## When to use

- After `ds-deploy` (post-ship audit).
- Before touching a legacy dashboard a user hands you — get a quick read on what's wrong before editing.
- After any `ds-update` that introduced substantial changes.

## Review dimensions

### 1. Panel count and density

- **Too many panels** (more than ~12): overloaded, likely hiding signal.
- **Too few** (fewer than ~3): probably not useful as a standalone dashboard.
- **Density**: sum of panel `w × h` vs. layout area — low density wastes screen, very high density overflows.

### 2. Visualization appropriateness

Check each panel's `viz_type` against the shape of its data (see `ds-viz` for recommendations):

- `splunk.pie` with > 6 categories — flag (unreadable).
- `splunk.singlevalue` driven by a query returning many rows — flag (only first row shown).
- Time-series data rendered as `splunk.bar` or `splunk.pie` — flag (misleading).
- `splunk.choropleth` without a geographic field — flag.

### 3. Drilldowns

- Panels with rich data (tables, timelines) without drilldowns — suggest adding.
- Drilldown targets that don't exist — flag (also caught by ds-validate, repeat here if present).

### 4. Tokens

- Input declared but never referenced by any dataSource — flag (dead input).
- SPL references a token that's declared but only given a default value — info (works, but consider giving the user the option to change it).

### 5. Accessibility

- Custom colors in `majorColor`, `ranges`, etc. — cross-check against theme. Hard-coded dark colors on a light theme (or vice versa) reduce legibility.
- Text with very low contrast — if present in `description`, flag.

### 6. SPL performance

- Queries starting with `search` or `index=* *` — flag (full-index scans).
- Queries without `earliest` / `latest` bounds at the dashboard level — suggest setting `defaults` or a global timerange input.
- Use of `join` or `append` on large datasets — suggest `tstats` or subsearch redesign.

## Output

Write findings to `review.md` in the workspace (or to the directory of the input file when operating standalone):

```markdown
# Dashboard Review: <title>

Generated: <ISO date>
Source: <path to dashboard.json/xml>

## Summary

- Errors: N (blocking)
- Warnings: N (should fix)
- Info: N (suggestions)

## Findings

### [warning] panel-count-high
<N> panels on the dashboard. Consider splitting into two dashboards or hiding secondary panels behind a drilldown.

### [info] spl-no-timerange
`dataSources.ds_3` query has no earliest/latest bound. Consider adding a `input.timerange` and referencing `$<token>.earliest$`.

## Suggested ds-update invocations

- Add a time range input to the dashboard (see finding "spl-no-timerange")
- Drop panel `viz_p9` — barely used real estate (see "panel-count-high")
```

## How to invoke

Inside a workspace (reads `dashboard.json`, writes `review.md` next to it):

```bash
# No dedicated CLI yet — ds-review is skill-driven.
# Claude reads the file, analyzes it, writes review.md.
```

Standalone (path to file):

```bash
# Same — Claude reads the given path and writes review.md in the same directory.
```

## After review

Hand the findings to the user. For each actionable one, offer a specific `ds-update` command that would fix it. Do not advance workspace state; `ds-review` is read-only.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-review/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-review SKILL.md"
```

---

### Task Z1: Full pipeline integration test (built → deployed)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_pipeline_ship.py`

- [ ] **Step 1: Write the integration test**

Create `plugins/splunk-dashboards/tests/test_pipeline_ship.py`:

```python
"""Integration test — full pipeline from init through deploy."""
import json
import os
import subprocess
import sys
import threading
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.design import create_server
from splunk_dashboards.workspace import load_state


def _run(module, args, cwd, stdin=None):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    return subprocess.run(
        [sys.executable, "-m", module, *args],
        cwd=cwd,
        env=env,
        input=stdin,
        capture_output=True,
        text=True,
    )


def test_full_pipeline_through_deploy(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    project = "ship-demo"

    # 1. ds-init
    r = _run("splunk_dashboards.requirements", ["from-json", "-"], tmp_path, stdin=json.dumps({
        "project": project, "goal": "Ship pipeline", "role": "Developer", "audience": "Self",
        "focus": "Mixed", "questions": ["How many events?"], "has_data": "no", "indexes": [],
        "customization": "moderate", "nice_to_haves": [], "reference_dashboard": None,
    }))
    assert r.returncode == 0, r.stderr

    # 2. ds-mock
    r = _run("splunk_dashboards.data_sources", ["write", "-"], tmp_path, stdin=json.dumps({
        "project": project, "source": "mock",
        "sources": [{"question": "How many events?", "spl": "| makeresults count=1 | eval c=42",
                     "earliest": "-24h", "latest": "now", "name": "Events"}],
    }))
    assert r.returncode == 0, r.stderr

    # 3. ds-design Save
    server = create_server(project=project, port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        body = json.dumps({
            "project": project, "theme": "dark",
            "panels": [{"id": "p1", "title": "Events", "x": 0, "y": 0, "w": 6, "h": 4,
                        "viz_type": "splunk.singlevalue", "data_source_ref": "How many events?"}]
        }).encode()
        req = urllib.request.Request(f"http://{host}:{port}/save", data=body, method="POST",
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 200
    finally:
        server.shutdown(); server.server_close(); thread.join(timeout=2)

    # 4. ds-create
    r = _run("splunk_dashboards.create", ["build", project, "--title", "Ship Demo"], tmp_path)
    assert r.returncode == 0, r.stderr

    # 5. ds-validate — should pass cleanly
    r = _run("splunk_dashboards.validate", ["check", project], tmp_path)
    assert r.returncode == 0, r.stderr
    assert load_state(project).current_stage == "validated"

    # 6. ds-deploy with --as-app — produces XML + TA tarball
    r = _run("splunk_dashboards.deploy",
             ["build", project, "--label", "Ship Demo", "--as-app"], tmp_path)
    assert r.returncode == 0, r.stderr

    ws = tmp_path / ".splunk-dashboards" / project
    assert (ws / "dashboard.xml").exists()
    xml = (ws / "dashboard.xml").read_text()
    assert '<dashboard version="2"' in xml
    assert "<label>Ship Demo</label>" in xml

    # TA tarball was produced
    tarballs = list(ws.glob("*.tar.gz"))
    assert len(tarballs) == 1

    # 7. State is 'deployed'
    state = load_state(project)
    assert state.current_stage == "deployed"
    assert "validated" in state.stages_completed
```

- [ ] **Step 2: Run the test**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pipeline_ship.py -v
```

Expected: 1 passed.

Full suite:

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: **85 passed** (66 prior + 19 new).

- [ ] **Step 3: Commit**

```bash
git add plugins/splunk-dashboards/tests/test_pipeline_ship.py
git commit -m "test(splunk-dashboards): add full pipeline integration test through deploy"
```

---

### Task Z2: Final verification + push

- [ ] **Step 1: Full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: **85 passed**, 0 failed.

- [ ] **Step 2: Verify file tree**

```bash
cd plugins/splunk-dashboards
find . -type f -not -path "*/__pycache__/*" -not -path "*/.pytest_cache/*" | sort
```

Expected to include the new files: `src/splunk_dashboards/validate.py`, `src/splunk_dashboards/deploy.py`, `skills/ds-validate/SKILL.md`, `skills/ds-deploy/SKILL.md`, `skills/ds-update/SKILL.md`, `skills/ds-review/SKILL.md`, `tests/test_validate.py`, `tests/test_deploy.py`, `tests/test_pipeline_ship.py`.

- [ ] **Step 3: Push + fast-forward main**

```bash
git push
git checkout main
git merge --ff-only splunk-dashboards-foundation
git push origin main
git checkout splunk-dashboards-foundation
```

---

## What this sub-plan delivers

- **`validate.py`** — pure-function lint checks (data-source names, panel-to-ds references, token declarations, drilldown targets) + `check` CLI that advances `built` → `validated`.
- **`deploy.py`** — `build_xml_envelope` for the Dashboard Studio v2 XML wrapper, `build_ta_tarball` for optional Splunk TA packaging, + `build` CLI that advances `validated` → `deployed` and writes both artifacts.
- **Four new skills:**
  - `ds-validate` (pipeline: built → validated)
  - `ds-deploy` (pipeline: validated → deployed)
  - `ds-update` (standalone: edit any dashboard file)
  - `ds-review` (standalone: audit any dashboard file, write `review.md`)
- **19 new tests** — bringing the total to 85.

## Plugin feature-complete

With sub-plan 5 complete, all 12 skills from the design spec (`docs/superpowers/specs/2026-04-22-splunk-dashboards-plugin-design.md`) exist, and the workspace state machine covers `scoped → data-ready → designed → built → validated → deployed → reviewed`.
