# splunk-dashboards Sub-plan 3: Design stage (ds-design + ds-template)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the design-stage skills to `splunk-dashboards`: `ds-design` (local HTTP server + Gridstack.js wireframe editor) and `ds-template` (load bundled dashboard patterns as a starting point). `ds-design` advances pipeline state `data-ready` → `designed` when the user saves the layout.

**Architecture:** A shared `layout.py` module defines the `Panel` and `Layout` dataclasses plus workspace-aware load/save. `ds-design` implements request handlers as pure functions and wraps them in a stdlib `http.server`; a single-file `wireframe.html` using Gridstack.js via CDN provides the DnD UI. `ds-template` ships four bundled pattern JSON files and exposes `load`/`list` CLI commands. Both skills write to `design/layout.json` under the workspace; only `ds-design`'s Save & Exit advances pipeline state.

**Tech Stack:** Python 3.11+ stdlib (`http.server`, `pathlib`, `json`, `threading`, `urllib`). No external Python deps. Frontend: single HTML file, Gridstack.js 10.x via CDN (MIT license, DnD + resize).

---

## Execution pattern: parallel tracks after foundation

```
Foundation (sequential)           Final (sequential)
  ├─ F1 Panel dataclass            ├─ Z1 Pipeline integration test
  ├─ F2 Layout dataclass           └─ Z2 Final verification + push
  ├─ F3 Layout load/save
  └─ F4 Layout CLI
          │
          ▼
  Parallel tracks (dispatch Track A + Track B as two concurrent subagents)
  ┌──────────────────────────┬──────────────────────────┐
  │ Track A: ds-design       │ Track B: ds-template     │
  │   A1 handlers            │   B1 bundled templates   │
  │   A2 server launch       │   B2 load + list funcs   │
  │   A3 wireframe.html      │   B3 templates CLI       │
  │   A4 ds-design SKILL.md  │   B4 ds-template SKILL.md│
  └──────────────────────────┴──────────────────────────┘
```

**Parallelism rules:**

- Track A touches `src/splunk_dashboards/design.py`, `skills/ds-design/*`. Track B touches `src/splunk_dashboards/templates.py`, `plugins/splunk-dashboards/templates/*.json`, `skills/ds-template/*`. No file overlap.
- Both tracks READ from the Foundation's `layout.py` but neither modifies it.
- Within each track, tasks are sequential (TDD dependencies).
- Each track's final task is a single `git commit` that bundles all of that track's changes together, so the two tracks can't collide on partial commits.

---

## File structure created by this sub-plan

```
plugins/splunk-dashboards/
├── src/splunk_dashboards/
│   ├── layout.py              # NEW — Panel, Layout, load/save, write CLI
│   ├── design.py              # NEW — HTTP handlers + server launch
│   └── templates.py           # NEW — load/list bundled templates
├── skills/
│   ├── ds-design/
│   │   ├── SKILL.md           # NEW
│   │   └── wireframe.html     # NEW — Gridstack frontend
│   └── ds-template/
│       └── SKILL.md           # NEW
├── templates/
│   ├── soc-overview.json      # NEW
│   ├── ops-health.json        # NEW
│   ├── security-monitoring.json  # NEW
│   └── api-performance.json   # NEW
└── tests/
    ├── test_layout.py              # NEW
    ├── test_design.py              # NEW
    ├── test_templates.py           # NEW
    └── test_pipeline_design.py     # NEW
```

Expected test count after this sub-plan: **29 (prior) + 20 new = 49 tests**.

---

# FOUNDATION (sequential)

### Task F1: Panel dataclass (TDD)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_layout.py`
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/layout.py`

- [ ] **Step 1: Write the failing tests**

Create `plugins/splunk-dashboards/tests/test_layout.py`:

```python
"""Tests for layout module."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.layout import Panel, VIZ_TYPES


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
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_layout.py -v
```

Expected: `ModuleNotFoundError: No module named 'splunk_dashboards.layout'`.

- [ ] **Step 3: Implement Panel**

Create `plugins/splunk-dashboards/src/splunk_dashboards/layout.py`:

```python
"""Layout model for ds-design wireframes."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Optional

VIZ_TYPES: list[str] = [
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
]


@dataclass
class Panel:
    id: str
    title: str
    x: int = 0
    y: int = 0
    w: int = 6
    h: int = 4
    viz_type: str = "splunk.singlevalue"
    data_source_ref: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "Panel":
        return cls(**data)
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_layout.py -v
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/layout.py plugins/splunk-dashboards/tests/test_layout.py
git commit -m "feat(splunk-dashboards): add Panel dataclass and VIZ_TYPES"
```

---

### Task F2: Layout dataclass (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_layout.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/layout.py`

- [ ] **Step 1: Append failing tests**

Append to `plugins/splunk-dashboards/tests/test_layout.py`:

```python
from splunk_dashboards.layout import Layout


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
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_layout.py -v
```

Expected: `ImportError: cannot import name 'Layout'`.

- [ ] **Step 3: Implement Layout**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/layout.py`:

```python
from typing import Literal

Theme = Literal["light", "dark"]


@dataclass
class Layout:
    project: str
    theme: Theme = "dark"
    panels: list[Panel] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "project": self.project,
            "theme": self.theme,
            "panels": [p.to_dict() for p in self.panels],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Layout":
        return cls(
            project=data["project"],
            theme=data.get("theme", "dark"),
            panels=[Panel.from_dict(p) for p in data.get("panels", [])],
        )
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_layout.py -v
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/layout.py plugins/splunk-dashboards/tests/test_layout.py
git commit -m "feat(splunk-dashboards): add Layout dataclass"
```

---

### Task F3: Layout load/save with workspace (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_layout.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/layout.py`

- [ ] **Step 1: Append failing tests**

Append to `plugins/splunk-dashboards/tests/test_layout.py`:

```python
import pytest
from splunk_dashboards.layout import (
    LAYOUT_FILENAME,
    DESIGN_SUBDIR,
    layout_path,
    save_layout,
    load_layout,
)
from splunk_dashboards.workspace import init_workspace


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
    # No init_workspace
    with pytest.raises(FileNotFoundError):
        save_layout(Layout(project="ghost"))


def test_load_layout_missing_raises(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    with pytest.raises(FileNotFoundError):
        load_layout("my-dash")
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_layout.py -v
```

Expected: ImportError on `LAYOUT_FILENAME`, `DESIGN_SUBDIR`, `layout_path`, `save_layout`, `load_layout`.

- [ ] **Step 3: Implement load/save**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/layout.py`:

```python
import json
from pathlib import Path

from splunk_dashboards.workspace import get_workspace_dir

DESIGN_SUBDIR = "design"
LAYOUT_FILENAME = "layout.json"


def layout_path(project: str, cwd: Optional[Path] = None) -> Path:
    return get_workspace_dir(project, cwd) / DESIGN_SUBDIR / LAYOUT_FILENAME


def save_layout(layout: Layout, cwd: Optional[Path] = None) -> None:
    ws = get_workspace_dir(layout.project, cwd)
    if not ws.exists():
        raise FileNotFoundError(f"Workspace does not exist: {ws}")
    path = ws / DESIGN_SUBDIR / LAYOUT_FILENAME
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(layout.to_dict(), indent=2) + "\n", encoding="utf-8")


def load_layout(project: str, cwd: Optional[Path] = None) -> Layout:
    path = layout_path(project, cwd)
    data = json.loads(path.read_text(encoding="utf-8"))
    return Layout.from_dict(data)
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_layout.py -v
```

Expected: 10 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/layout.py plugins/splunk-dashboards/tests/test_layout.py
git commit -m "feat(splunk-dashboards): add layout load/save under workspace"
```

---

### Task F4: Layout CLI `write` command (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_layout.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/layout.py`

**Note:** The `write` CLI writes `layout.json` but does NOT advance pipeline state. State advance (`data-ready` → `designed`) happens in `ds-design`'s Save & Exit, not here. `ds-template` uses this CLI to seed a layout from a template; the state stays at `data-ready` until the user finalizes the design in the wireframe editor.

- [ ] **Step 1: Append failing CLI test**

Append to `plugins/splunk-dashboards/tests/test_layout.py`:

```python
import os
import subprocess
import sys as _sys
import json as _json


def _run_cli(args, cwd, stdin=None):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    return subprocess.run(
        [_sys.executable, "-m", "splunk_dashboards.layout", *args],
        cwd=cwd,
        env=env,
        input=stdin,
        capture_output=True,
        text=True,
    )


def test_cli_write_persists_layout(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    payload = {
        "project": "my-dash",
        "theme": "dark",
        "panels": [
            {"id": "p1", "title": "T1", "x": 0, "y": 0, "w": 6, "h": 4,
             "viz_type": "splunk.singlevalue", "data_source_ref": None}
        ]
    }
    result = _run_cli(["write", "-"], cwd=tmp_path, stdin=_json.dumps(payload))
    assert result.returncode == 0, result.stderr
    ws = tmp_path / ".splunk-dashboards" / "my-dash"
    loaded = _json.loads((ws / "design" / "layout.json").read_text())
    assert loaded["project"] == "my-dash"
    assert len(loaded["panels"]) == 1
    # State NOT advanced by write — that only happens from ds-design.
    state = _json.loads((ws / "state.json").read_text())
    assert state["current_stage"] == "scoped"


def test_cli_write_rejects_missing_workspace(tmp_path):
    payload = {"project": "ghost", "panels": []}
    result = _run_cli(["write", "-"], cwd=tmp_path, stdin=_json.dumps(payload))
    assert result.returncode != 0
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_layout.py -v
```

Expected: CLI tests fail — no `__main__` handler in `layout.py`.

- [ ] **Step 3: Add the CLI**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/layout.py`:

```python
import sys as _sys


def _cli(argv: Optional[list[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.layout")
    sub = parser.add_subparsers(dest="command", required=True)
    write = sub.add_parser(
        "write",
        help="Write layout.json from a JSON payload (does not advance state)",
    )
    write.add_argument("source_arg", help='Path to JSON file, or "-" to read stdin')

    args = parser.parse_args(argv)

    if args.command == "write":
        raw = _sys.stdin.read() if args.source_arg == "-" else Path(args.source_arg).read_text(encoding="utf-8")
        layout = Layout.from_dict(json.loads(raw))
        try:
            save_layout(layout)
        except FileNotFoundError as e:
            print(str(e), file=_sys.stderr)
            return 2
        print(f"Wrote layout.json for {layout.project} ({len(layout.panels)} panels)")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_layout.py -v
```

Expected: 12 passed.

Full suite:

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: 41 passed (29 prior + 12 new).

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/layout.py plugins/splunk-dashboards/tests/test_layout.py
git commit -m "feat(splunk-dashboards): add layout write CLI (no state advance)"
```

---

# TRACK A: ds-design (parallel with Track B)

### Task A1: design.py HTTP handlers (TDD)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_design.py`
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/design.py`

- [ ] **Step 1: Write the failing tests**

Create `plugins/splunk-dashboards/tests/test_design.py`:

```python
"""Tests for design module (HTTP handlers, not the server itself)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from splunk_dashboards.design import (
    handle_get_layout,
    handle_post_save,
    StageAdvanceError,
)
from splunk_dashboards.layout import Layout, Panel, save_layout
from splunk_dashboards.workspace import (
    init_workspace,
    load_state,
    advance_stage,
    save_state,
)


def _prepare_workspace_at_data_ready(tmp_path, monkeypatch, project="my-dash"):
    monkeypatch.chdir(tmp_path)
    state = init_workspace(project, autopilot=False)
    advance_stage(state, "data-ready")
    save_state(state)
    return tmp_path


def test_get_layout_returns_existing(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    save_layout(Layout(project="my-dash", panels=[Panel(id="p1", title="T1")]))
    status, body = handle_get_layout("my-dash")
    assert status == 200
    data = json.loads(body)
    assert data["project"] == "my-dash"
    assert len(data["panels"]) == 1


def test_get_layout_returns_empty_layout_when_missing(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    status, body = handle_get_layout("my-dash")
    assert status == 200
    data = json.loads(body)
    assert data["project"] == "my-dash"
    assert data["panels"] == []


def test_post_save_persists_and_advances_state(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    payload = json.dumps({
        "project": "my-dash",
        "theme": "dark",
        "panels": [
            {"id": "p1", "title": "T1", "x": 0, "y": 0, "w": 6, "h": 4,
             "viz_type": "splunk.singlevalue", "data_source_ref": None}
        ]
    })
    status, msg = handle_post_save("my-dash", payload)
    assert status == 200
    state = load_state("my-dash")
    assert state.current_stage == "designed"
    assert "data-ready" in state.stages_completed


def test_post_save_rejects_wrong_project(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    payload = json.dumps({"project": "wrong-name", "panels": []})
    status, msg = handle_post_save("my-dash", payload)
    assert status == 400
    assert "project" in msg.lower()


def test_post_save_rejects_invalid_json(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    status, msg = handle_post_save("my-dash", "{not json")
    assert status == 400


def test_post_save_rejects_wrong_stage(tmp_path, monkeypatch):
    # Workspace is at "scoped", not "data-ready" — cannot advance to "designed"
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    payload = json.dumps({"project": "my-dash", "panels": []})
    with pytest.raises(StageAdvanceError):
        handle_post_save("my-dash", payload)
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_design.py -v
```

Expected: `ModuleNotFoundError: No module named 'splunk_dashboards.design'`.

- [ ] **Step 3: Implement the handlers**

Create `plugins/splunk-dashboards/src/splunk_dashboards/design.py`:

```python
"""HTTP handlers and server for ds-design wireframe editor."""
from __future__ import annotations

import json
from typing import Optional

from splunk_dashboards.layout import Layout, load_layout, save_layout
from splunk_dashboards.workspace import (
    advance_stage,
    load_state,
    save_state,
    InvalidStageTransition,
)


class StageAdvanceError(Exception):
    pass


def handle_get_layout(project: str) -> tuple[int, str]:
    """Returns (status, body) for GET /api/layout."""
    try:
        layout = load_layout(project)
    except FileNotFoundError:
        layout = Layout(project=project)
    return 200, json.dumps(layout.to_dict())


def handle_post_save(project: str, body: str) -> tuple[int, str]:
    """Returns (status, body) for POST /save."""
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as e:
        return 400, f"Invalid JSON: {e}"

    if payload.get("project") != project:
        return 400, f"Payload project '{payload.get('project')}' does not match '{project}'"

    layout = Layout.from_dict(payload)
    save_layout(layout)

    state = load_state(project)
    if state.current_stage != "data-ready":
        raise StageAdvanceError(
            f"Cannot advance to 'designed' from '{state.current_stage}' — expected 'data-ready'"
        )
    try:
        advance_stage(state, "designed")
    except InvalidStageTransition as e:
        raise StageAdvanceError(str(e)) from e
    save_state(state)
    return 200, json.dumps({"status": "saved", "panels": len(layout.panels)})
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_design.py -v
```

Expected: 6 passed.

---

### Task A2: design.py server launch + integration test (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_design.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/design.py`

- [ ] **Step 1: Append failing integration test**

Append to `plugins/splunk-dashboards/tests/test_design.py`:

```python
import threading
import time
import urllib.request
import urllib.error
from splunk_dashboards.design import create_server


def test_server_serves_get_layout_and_accepts_post_save(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)

    # Create server on an auto-assigned port (0 = let OS pick).
    server = create_server(project="my-dash", port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        # GET /api/layout — should return an empty layout.
        with urllib.request.urlopen(f"http://{host}:{port}/api/layout", timeout=5) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode())
            assert data["project"] == "my-dash"
            assert data["panels"] == []

        # POST /save with a non-empty payload.
        body = json.dumps({
            "project": "my-dash",
            "theme": "dark",
            "panels": [
                {"id": "p1", "title": "T1", "x": 0, "y": 0, "w": 6, "h": 4,
                 "viz_type": "splunk.line", "data_source_ref": None}
            ]
        }).encode()
        req = urllib.request.Request(
            f"http://{host}:{port}/save",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 200
            result = json.loads(resp.read().decode())
            assert result["status"] == "saved"
            assert result["panels"] == 1

        # State should now be 'designed'.
        state = load_state("my-dash")
        assert state.current_stage == "designed"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def test_server_serves_wireframe_html_on_root(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    server = create_server(project="my-dash", port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with urllib.request.urlopen(f"http://{host}:{port}/", timeout=5) as resp:
            assert resp.status == 200
            content = resp.read().decode()
            # Minimal check: frontend references Gridstack and has a save button.
            assert "gridstack" in content.lower()
            assert "save" in content.lower()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
```

- [ ] **Step 2: Run tests — integration tests will fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_design.py -v
```

Expected: `ImportError: cannot import name 'create_server'` or similar. Also, the frontend HTML file does not exist yet (needed by A3), so the server test will fail even after `create_server` exists.

- [ ] **Step 3: Implement `create_server` + launch CLI**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/design.py`:

```python
import sys as _sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

WIREFRAME_HTML = Path(__file__).resolve().parent.parent.parent / "skills" / "ds-design" / "wireframe.html"


def _make_handler(project: str):
    class DesignHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/" or self.path == "/index.html":
                try:
                    html = WIREFRAME_HTML.read_text(encoding="utf-8")
                except FileNotFoundError:
                    self.send_error(500, "wireframe.html not found")
                    return
                self._respond(200, html, content_type="text/html")
                return
            if self.path == "/api/layout":
                status, body = handle_get_layout(project)
                self._respond(status, body, content_type="application/json")
                return
            self.send_error(404)

        def do_POST(self):
            if self.path == "/save":
                length = int(self.headers.get("Content-Length") or 0)
                body = self.rfile.read(length).decode("utf-8")
                try:
                    status, reply = handle_post_save(project, body)
                except StageAdvanceError as e:
                    self._respond(409, str(e))
                    return
                self._respond(status, reply, content_type="application/json")
                return
            self.send_error(404)

        def _respond(self, status: int, body: str, content_type: str = "text/plain"):
            data = body.encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, format, *args):
            # Silence default logging during tests.
            return

    return DesignHandler


def create_server(project: str, port: int = 0, host: str = "127.0.0.1") -> HTTPServer:
    return HTTPServer((host, port), _make_handler(project))


def _cli(argv: Optional[list[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.design")
    sub = parser.add_subparsers(dest="command", required=True)
    launch = sub.add_parser("launch", help="Start the wireframe editor server")
    launch.add_argument("project")
    launch.add_argument("--port", type=int, default=0, help="0 = auto-assign")

    args = parser.parse_args(argv)
    if args.command == "launch":
        server = create_server(args.project, port=args.port)
        host, port = server.server_address
        print(f"ds-design editor: http://{host}:{port}/")
        print("Open the URL in your browser. Click 'Save & Exit' when done to advance state.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nds-design: interrupted")
        finally:
            server.server_close()
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
```

- [ ] **Step 4: The integration tests still need wireframe.html**

At this point, test_server_serves_get_layout_and_accepts_post_save WILL PASS (it doesn't hit `/`), but test_server_serves_wireframe_html_on_root WILL STILL FAIL because wireframe.html doesn't exist. Task A3 creates that file.

Run to confirm partial pass:

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_design.py::test_server_serves_get_layout_and_accepts_post_save -v
```

Expected: 1 passed.

- [ ] **Step 5: Commit progress (Task A3 will fix the remaining test)**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/design.py plugins/splunk-dashboards/tests/test_design.py
git commit -m "feat(splunk-dashboards): add ds-design handlers, server, launch CLI"
```

---

### Task A3: wireframe.html frontend

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-design/wireframe.html`

- [ ] **Step 1: Create the frontend file**

Create `plugins/splunk-dashboards/skills/ds-design/wireframe.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ds-design wireframe editor</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/gridstack@10.1.2/dist/gridstack.min.css" />
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #1a1a1a; color: #eee; margin: 0; padding: 16px; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    header h1 { margin: 0; font-size: 16px; font-weight: 500; }
    button { background: #2d5a87; color: #fff; border: 0; padding: 8px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; }
    button:hover { background: #3a6fa0; }
    button.secondary { background: #444; }
    .grid-stack { background: #111; min-height: 480px; border: 1px solid #333; border-radius: 4px; }
    .grid-stack-item-content { background: #2a2a2a; border: 1px solid #444; border-radius: 4px; padding: 8px; display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
    .panel-title { font-size: 13px; font-weight: 500; color: #fff; }
    .panel-viz { flex: 1; display: flex; align-items: center; justify-content: center; color: #888; font-size: 11px; }
    select { background: #333; color: #eee; border: 1px solid #555; padding: 2px 4px; font-size: 11px; border-radius: 2px; }
    .controls { display: flex; gap: 8px; }
  </style>
</head>
<body>
  <header>
    <h1>ds-design — wireframe editor</h1>
    <div class="controls">
      <button class="secondary" id="add">+ Add panel</button>
      <button id="save">Save &amp; Exit</button>
    </div>
  </header>
  <div class="grid-stack"></div>
  <script src="https://cdn.jsdelivr.net/npm/gridstack@10.1.2/dist/gridstack-all.js"></script>
  <script>
    const VIZ = ['splunk.singlevalue','splunk.line','splunk.column','splunk.bar','splunk.pie','splunk.area','splunk.table','splunk.timeline','splunk.choropleth','splunk.markergauge'];
    const grid = GridStack.init({ column: 12, cellHeight: 40, float: true });
    let PROJECT = null;

    function panelHtml(p) {
      const options = VIZ.map(v => `<option value="${v}" ${v===p.viz_type?'selected':''}>${v}</option>`).join('');
      return `<div class="grid-stack-item-content">
        <div class="panel-title" contenteditable="true" data-field="title">${p.title}</div>
        <select data-field="viz_type">${options}</select>
        <div class="panel-viz">${p.viz_type}</div>
      </div>`;
    }

    function addPanel(p) {
      const w = grid.addWidget({
        x: p.x, y: p.y, w: p.w, h: p.h,
        content: panelHtml(p),
      });
      w.setAttribute('data-id', p.id);
      w.setAttribute('data-viz', p.viz_type);
      w.setAttribute('data-ds', p.data_source_ref || '');
      const sel = w.querySelector('select[data-field="viz_type"]');
      sel.addEventListener('change', e => {
        w.setAttribute('data-viz', e.target.value);
        w.querySelector('.panel-viz').textContent = e.target.value;
      });
    }

    function collect() {
      const items = grid.save(false);
      const panels = items.map((it, idx) => {
        const el = it.el;
        return {
          id: el.getAttribute('data-id') || `p${idx+1}`,
          title: el.querySelector('[data-field="title"]').textContent.trim(),
          x: it.x, y: it.y, w: it.w, h: it.h,
          viz_type: el.getAttribute('data-viz') || 'splunk.singlevalue',
          data_source_ref: el.getAttribute('data-ds') || null,
        };
      });
      return { project: PROJECT, theme: 'dark', panels };
    }

    document.getElementById('add').addEventListener('click', () => {
      const id = `p${Date.now()}`;
      addPanel({ id, title: 'New panel', x: 0, y: 0, w: 6, h: 4, viz_type: 'splunk.singlevalue', data_source_ref: null });
    });

    document.getElementById('save').addEventListener('click', async () => {
      const payload = collect();
      const resp = await fetch('/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (resp.ok) {
        document.body.innerHTML = '<p style="padding:20px;">Saved. You can close this tab.</p>';
      } else {
        alert('Save failed: ' + resp.status + ' ' + await resp.text());
      }
    });

    (async () => {
      const resp = await fetch('/api/layout');
      const layout = await resp.json();
      PROJECT = layout.project;
      (layout.panels || []).forEach(addPanel);
    })();
  </script>
</body>
</html>
```

- [ ] **Step 2: Run all design tests to confirm frontend test passes**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_design.py -v
```

Expected: 8 passed (6 handler + 2 server integration).

- [ ] **Step 3: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-design/wireframe.html
git commit -m "feat(splunk-dashboards): add ds-design wireframe.html frontend"
```

---

### Task A4: ds-design SKILL.md

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-design/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-design/SKILL.md`:

```markdown
---
name: ds-design
description: Use this skill to wireframe a Splunk dashboard layout in a local browser-based editor. Launches a Python HTTP server on localhost, serves a Gridstack.js drag-and-drop grid, and saves panels (position, size, visualization type) to design/layout.json. Advances workspace state from data-ready to designed on save. Requires a workspace at data-ready stage (produced by ds-data-explore or ds-mock).
---

# ds-design — Wireframe editor

## When to use

After `ds-data-explore` or `ds-mock` has produced `data-sources.json`. Workspace must be at `current_stage=data-ready`. If the user wants to start from a pattern, run `ds-template load <name> --project <proj>` first to seed the layout.

## Prerequisites

- Workspace exists with `current_stage=data-ready`.
- `data-sources.json` exists (panels will reference these questions).
- A browser is available to the user.

## What it does

1. Starts a local HTTP server on an auto-assigned port.
2. Serves a Gridstack.js grid editor at `http://127.0.0.1:<port>/`.
3. Loads any existing layout from `design/layout.json` via `GET /api/layout`.
4. The user drags, resizes, adds panels, and picks a viz type per panel.
5. On **Save & Exit**, the browser POSTs to `/save`, which writes `design/layout.json` and advances `state.json` from `data-ready` to `designed`.

## How to invoke

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.design launch <project-name>
```

The command prints a URL like `http://127.0.0.1:54321/`. Open it in a browser. The server runs in the foreground — press Ctrl-C to abort without saving.

## Panel fields (written to layout.json)

| Field | Type | Description |
|---|---|---|
| `id` | string | Panel id (e.g., `p1`) — unique within the layout |
| `title` | string | Shown at the top of the panel |
| `x`, `y` | int | Grid coordinates (12-column grid) |
| `w`, `h` | int | Grid size (in cells) |
| `viz_type` | string | One of the 10 Splunk Dashboard Studio viz types |
| `data_source_ref` | string \| null | `question` value from `data-sources.json` entry, or null |

Supported viz types: `splunk.singlevalue`, `splunk.line`, `splunk.column`, `splunk.bar`, `splunk.pie`, `splunk.area`, `splunk.table`, `splunk.timeline`, `splunk.choropleth`, `splunk.markergauge`.

## After saving

- `design/layout.json` contains the panel grid.
- `state.json` has `current_stage=designed`.
- Next step: `ds-create` to generate the full Dashboard Studio JSON from layout + data sources.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-design/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-design SKILL.md"
```

---

# TRACK B: ds-template (parallel with Track A)

### Task B1: Bundled template JSON files

**Files:**
- Create: `plugins/splunk-dashboards/templates/soc-overview.json`
- Create: `plugins/splunk-dashboards/templates/ops-health.json`
- Create: `plugins/splunk-dashboards/templates/security-monitoring.json`
- Create: `plugins/splunk-dashboards/templates/api-performance.json`

- [ ] **Step 1: Create soc-overview.json**

Create `plugins/splunk-dashboards/templates/soc-overview.json`:

```json
{
  "name": "soc-overview",
  "description": "Security operations center overview — events, alerts, top sources",
  "theme": "dark",
  "panels": [
    { "id": "p1", "title": "Total Events (24h)", "x": 0, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.singlevalue", "data_source_ref": null },
    { "id": "p2", "title": "Open Alerts", "x": 3, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.singlevalue", "data_source_ref": null },
    { "id": "p3", "title": "Events Over Time", "x": 6, "y": 0, "w": 6, "h": 3, "viz_type": "splunk.line", "data_source_ref": null },
    { "id": "p4", "title": "Top Source IPs", "x": 0, "y": 3, "w": 6, "h": 4, "viz_type": "splunk.bar", "data_source_ref": null },
    { "id": "p5", "title": "Alert Severity Breakdown", "x": 6, "y": 3, "w": 6, "h": 4, "viz_type": "splunk.pie", "data_source_ref": null }
  ]
}
```

- [ ] **Step 2: Create ops-health.json**

Create `plugins/splunk-dashboards/templates/ops-health.json`:

```json
{
  "name": "ops-health",
  "description": "Operational health — service uptime, error rates, latency",
  "theme": "dark",
  "panels": [
    { "id": "p1", "title": "Uptime %", "x": 0, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.singlevalue", "data_source_ref": null },
    { "id": "p2", "title": "Error Rate", "x": 3, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.singlevalue", "data_source_ref": null },
    { "id": "p3", "title": "p95 Latency", "x": 6, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.markergauge", "data_source_ref": null },
    { "id": "p4", "title": "Requests / min", "x": 9, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.singlevalue", "data_source_ref": null },
    { "id": "p5", "title": "Latency Over Time", "x": 0, "y": 3, "w": 8, "h": 4, "viz_type": "splunk.line", "data_source_ref": null },
    { "id": "p6", "title": "Errors by Service", "x": 8, "y": 3, "w": 4, "h": 4, "viz_type": "splunk.table", "data_source_ref": null }
  ]
}
```

- [ ] **Step 3: Create security-monitoring.json**

Create `plugins/splunk-dashboards/templates/security-monitoring.json`:

```json
{
  "name": "security-monitoring",
  "description": "Authentication and access monitoring — failed logins, unusual access patterns",
  "theme": "dark",
  "panels": [
    { "id": "p1", "title": "Failed Logins (24h)", "x": 0, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.singlevalue", "data_source_ref": null },
    { "id": "p2", "title": "Unique Attackers", "x": 3, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.singlevalue", "data_source_ref": null },
    { "id": "p3", "title": "Login Activity", "x": 6, "y": 0, "w": 6, "h": 3, "viz_type": "splunk.area", "data_source_ref": null },
    { "id": "p4", "title": "Top Source IPs", "x": 0, "y": 3, "w": 6, "h": 4, "viz_type": "splunk.table", "data_source_ref": null },
    { "id": "p5", "title": "Failures by Country", "x": 6, "y": 3, "w": 6, "h": 4, "viz_type": "splunk.choropleth", "data_source_ref": null }
  ]
}
```

- [ ] **Step 4: Create api-performance.json**

Create `plugins/splunk-dashboards/templates/api-performance.json`:

```json
{
  "name": "api-performance",
  "description": "API endpoint performance — latency, throughput, error breakdown",
  "theme": "dark",
  "panels": [
    { "id": "p1", "title": "Requests / sec", "x": 0, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.singlevalue", "data_source_ref": null },
    { "id": "p2", "title": "p50 Latency", "x": 3, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.singlevalue", "data_source_ref": null },
    { "id": "p3", "title": "p99 Latency", "x": 6, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.singlevalue", "data_source_ref": null },
    { "id": "p4", "title": "5xx Rate", "x": 9, "y": 0, "w": 3, "h": 3, "viz_type": "splunk.singlevalue", "data_source_ref": null },
    { "id": "p5", "title": "Throughput Over Time", "x": 0, "y": 3, "w": 12, "h": 4, "viz_type": "splunk.area", "data_source_ref": null },
    { "id": "p6", "title": "Slowest Endpoints", "x": 0, "y": 7, "w": 12, "h": 4, "viz_type": "splunk.bar", "data_source_ref": null }
  ]
}
```

- [ ] **Step 5: Validate all JSON files parse**

```bash
python3 -c "import json,glob; [json.load(open(f)) for f in glob.glob('plugins/splunk-dashboards/templates/*.json')]; print('OK')"
```

Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add plugins/splunk-dashboards/templates/
git commit -m "feat(splunk-dashboards): add 4 bundled dashboard templates"
```

---

### Task B2: templates.py load + list functions (TDD)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_templates.py`
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/templates.py`

- [ ] **Step 1: Write the failing tests**

Create `plugins/splunk-dashboards/tests/test_templates.py`:

```python
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
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_templates.py -v
```

Expected: `ModuleNotFoundError`.

- [ ] **Step 3: Implement list + load**

Create `plugins/splunk-dashboards/src/splunk_dashboards/templates.py`:

```python
"""Bundled dashboard templates for ds-template."""
from __future__ import annotations

import json
from pathlib import Path

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates"


class TemplateNotFoundError(Exception):
    pass


def list_bundled_templates() -> list[str]:
    if not TEMPLATES_DIR.exists():
        return []
    return sorted(p.stem for p in TEMPLATES_DIR.glob("*.json"))


def load_bundled_template(name: str) -> dict:
    path = TEMPLATES_DIR / f"{name}.json"
    if not path.exists():
        raise TemplateNotFoundError(
            f"No bundled template named '{name}'. Available: {list_bundled_templates()}"
        )
    return json.loads(path.read_text(encoding="utf-8"))
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_templates.py -v
```

Expected: 3 passed.

---

### Task B3: templates.py CLI (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_templates.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/templates.py`

- [ ] **Step 1: Append failing tests**

Append to `plugins/splunk-dashboards/tests/test_templates.py`:

```python
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
    # Template name is not persisted into layout — it's a seed, not a reference.
    assert "name" not in layout


def test_cli_load_rejects_missing_workspace(tmp_path):
    result = _run_cli(["load", "soc-overview", "--project", "ghost"], cwd=tmp_path)
    assert result.returncode != 0


def test_cli_load_rejects_unknown_template(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)
    result = _run_cli(["load", "does-not-exist", "--project", "my-dash"], cwd=tmp_path)
    assert result.returncode != 0
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_templates.py -v
```

Expected: CLI tests fail — no `__main__` handler yet.

- [ ] **Step 3: Add the CLI**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/templates.py`:

```python
import sys as _sys

from splunk_dashboards.layout import Layout, Panel, save_layout


def _cli(argv=None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.templates")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list", help="List available bundled templates")

    load = sub.add_parser(
        "load",
        help="Seed design/layout.json for a project from a bundled template",
    )
    load.add_argument("template")
    load.add_argument("--project", required=True)

    args = parser.parse_args(argv)

    if args.command == "list":
        for name in list_bundled_templates():
            template = load_bundled_template(name)
            desc = template.get("description", "")
            print(f"{name}\t{desc}")
        return 0

    if args.command == "load":
        try:
            template = load_bundled_template(args.template)
        except TemplateNotFoundError as e:
            print(str(e), file=_sys.stderr)
            return 2
        panels = [Panel.from_dict(p) for p in template.get("panels", [])]
        layout = Layout(
            project=args.project,
            theme=template.get("theme", "dark"),
            panels=panels,
        )
        try:
            save_layout(layout)
        except FileNotFoundError as e:
            print(str(e), file=_sys.stderr)
            return 3
        print(f"Seeded layout.json for {args.project} from template '{args.template}' ({len(panels)} panels)")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_templates.py -v
```

Expected: 7 passed.

- [ ] **Step 5: Commit (covers both B2 and B3 together)**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/templates.py plugins/splunk-dashboards/tests/test_templates.py
git commit -m "feat(splunk-dashboards): add templates module with list + load CLI"
```

---

### Task B4: ds-template SKILL.md

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-template/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-template/SKILL.md`:

```markdown
---
name: ds-template
description: Use this skill to seed a dashboard layout from a bundled pattern (SOC overview, ops health, security monitoring, API performance) instead of building from scratch. Runs before ds-design. Reads a bundled template JSON and writes it as design/layout.json under the workspace. Does not advance workspace state — ds-design still owns the data-ready to designed transition when the user finalizes the layout.
---

# ds-template — Load a bundled dashboard pattern

## When to use

Before `ds-design`, when the user answered "Customization: template" in `ds-init`, or when they want to start from a known-good shape rather than a blank canvas.

## Prerequisites

- Workspace exists (from `ds-init`).
- Workspace is at `current_stage=scoped` or `data-ready` — either is fine. `ds-template` seeds the layout but does not transition state.

## What it does

1. Reads a bundled template JSON from the plugin's `templates/` directory.
2. Writes it as `.splunk-dashboards/<project>/design/layout.json`.
3. Prints the template name, panel count, and the next recommended skill (`ds-design`).

## Bundled templates

| Name | Description |
|---|---|
| `soc-overview` | Security operations overview (events, alerts, top sources) |
| `ops-health` | Operational health (uptime, error rate, latency) |
| `security-monitoring` | Authentication and access monitoring (failed logins, geo distribution) |
| `api-performance` | API endpoint performance (throughput, latency percentiles) |

## How to invoke

List available templates:

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.templates list
```

Load a template into an existing workspace:

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.templates load soc-overview --project <project-name>
```

## After loading

- `design/layout.json` now contains the template's panels at their default positions.
- Workspace state is unchanged (still `scoped` or `data-ready`).
- Next step: `ds-design launch <project>` — opens the wireframe editor with the seeded layout pre-populated, so the user can tweak positions, titles, viz types, and bind panels to specific questions from `data-sources.json`.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-template/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-template SKILL.md"
```

---

# FINAL (sequential)

### Task Z1: Pipeline integration test

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_pipeline_design.py`

- [ ] **Step 1: Write the integration test**

Create `plugins/splunk-dashboards/tests/test_pipeline_design.py`:

```python
"""Integration test — chain ds-init, ds-mock, ds-template, and ds-design handlers."""
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


def test_full_pipeline_init_mock_template_design(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)

    # 1. ds-init
    init_payload = {
        "project": "full-pipeline",
        "goal": "End-to-end pipeline through design stage",
        "role": "Developer",
        "audience": "Self",
        "focus": "Mixed",
        "questions": ["Q1?", "Q2?"],
        "has_data": "no",
        "indexes": [],
        "customization": "template",
        "nice_to_haves": [],
        "reference_dashboard": None
    }
    r1 = _run("splunk_dashboards.requirements", ["from-json", "-"], tmp_path, stdin=json.dumps(init_payload))
    assert r1.returncode == 0, r1.stderr

    # 2. ds-mock
    mock_payload = {
        "project": "full-pipeline",
        "source": "mock",
        "sources": [
            {"question": "Q1?", "spl": "| makeresults count=10", "earliest": "-24h", "latest": "now", "name": "Q1"},
            {"question": "Q2?", "spl": "| makeresults count=10", "earliest": "-24h", "latest": "now", "name": "Q2"},
        ]
    }
    r2 = _run("splunk_dashboards.data_sources", ["write", "-"], tmp_path, stdin=json.dumps(mock_payload))
    assert r2.returncode == 0, r2.stderr
    state = load_state("full-pipeline")
    assert state.current_stage == "data-ready"

    # 3. ds-template load
    r3 = _run(
        "splunk_dashboards.templates",
        ["load", "ops-health", "--project", "full-pipeline"],
        tmp_path,
    )
    assert r3.returncode == 0, r3.stderr
    ws = tmp_path / ".splunk-dashboards" / "full-pipeline"
    assert (ws / "design" / "layout.json").exists()
    state = load_state("full-pipeline")
    # Template load does not advance state
    assert state.current_stage == "data-ready"

    # 4. ds-design — simulate the browser's Save & Exit with a POST
    server = create_server(project="full-pipeline", port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        # Load the seeded layout from /api/layout to verify it was picked up.
        with urllib.request.urlopen(f"http://{host}:{port}/api/layout", timeout=5) as resp:
            seeded = json.loads(resp.read().decode())
        assert len(seeded["panels"]) >= 1  # ops-health seeded several panels

        # Finalize by POSTing (reusing seeded panels unchanged).
        body = json.dumps(seeded).encode()
        req = urllib.request.Request(
            f"http://{host}:{port}/save",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 200
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)

    # 5. State is now 'designed'
    state = load_state("full-pipeline")
    assert state.current_stage == "designed"
    assert "data-ready" in state.stages_completed
```

- [ ] **Step 2: Run the integration test**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pipeline_design.py -v
```

Expected: 1 passed.

Full suite:

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: 49 passed (29 prior + 12 Foundation + 8 Track A + 7 Track B - wait, let me recount).

Recount:
- Prior: 29
- F1: 3
- F2: 2
- F3: 5
- F4: 2
- A1: 6
- A2: 2
- B2: 3
- B3: 4
- Z1: 1

Total new: 3+2+5+2+6+2+3+4+1 = 28. Total: **29 + 28 = 57**.

Correct expected: **57 passed**.

- [ ] **Step 3: Commit**

```bash
git add plugins/splunk-dashboards/tests/test_pipeline_design.py
git commit -m "test(splunk-dashboards): add full pipeline integration test through design"
```

---

### Task Z2: Final verification + push

- [ ] **Step 1: Run full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: 57 passed, 0 failed.

- [ ] **Step 2: Verify new file tree**

```bash
cd plugins/splunk-dashboards
find . -type f -not -path "*/__pycache__/*" -not -path "*/.pytest_cache/*" | sort
```

Expected to include the new files from this sub-plan:

```
./skills/ds-design/SKILL.md
./skills/ds-design/wireframe.html
./skills/ds-template/SKILL.md
./src/splunk_dashboards/design.py
./src/splunk_dashboards/layout.py
./src/splunk_dashboards/templates.py
./templates/api-performance.json
./templates/ops-health.json
./templates/security-monitoring.json
./templates/soc-overview.json
./tests/test_design.py
./tests/test_layout.py
./tests/test_pipeline_design.py
./tests/test_templates.py
```

- [ ] **Step 3: Verify git log**

```bash
git log --oneline splunk-dashboards-foundation -25
```

Expected: 10 new commits from sub-plan 3 (Foundation 4 + Track A 3 + Track B 3 + Final 1 = 11, plus the one doc commit for the plan file).

- [ ] **Step 4: Push**

```bash
git push
```

---

## What this sub-plan delivers

- **Foundation:** `layout.py` with Panel/Layout dataclasses, workspace-aware I/O, and a `write` CLI that does NOT advance state.
- **ds-design:** `design.py` with pure-function handlers (`handle_get_layout`, `handle_post_save`), a stdlib `http.server` wrapper, and a `launch` CLI. Frontend at `skills/ds-design/wireframe.html` using Gridstack.js via CDN. Advances state `data-ready` → `designed` on Save & Exit.
- **ds-template:** `templates.py` with 4 bundled patterns (soc-overview, ops-health, security-monitoring, api-performance), `list`/`load` CLI. Seeds `layout.json` without advancing state.
- **28 new tests.** Pipeline test chains ds-init → ds-mock → ds-template → ds-design to prove the workspace reaches `designed` end-to-end.

Sub-plan 4 (build stage: `ds-create`, `ds-syntax`, `ds-viz`) picks up from a workspace at `designed`.
