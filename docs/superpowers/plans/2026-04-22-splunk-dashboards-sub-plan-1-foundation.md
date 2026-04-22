# splunk-dashboards Sub-plan 1: Foundation + ds-init

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the foundation for the `plugins/splunk-dashboards` plugin (workspace/state infrastructure, plugin manifest) and implement the `ds-init` skill for dashboard requirements gathering.

**Architecture:** The plugin lives in a directory at the repo root (`plugins/splunk-dashboards/`). It ships a plugin manifest (`plugin.json`), a shared Python package (`src/splunk_dashboards/`) for workspace and state management, and per-skill directories under `skills/`. Workspace state is persisted on disk under `./.splunk-dashboards/<project>/` (cwd-relative) as plain JSON and Markdown files. The `ds-init` skill gathers requirements via a ten-question interactive flow, then writes `requirements.md` and updates `state.json`. Later sub-plans add skills that read this workspace state.

**Tech Stack:** Python 3.11+ stdlib (`pathlib`, `json`, `argparse`, `dataclasses`, `datetime`). `pytest` for tests. No external runtime dependencies. All plugin artifacts are written in English (per repo `CLAUDE.md`).

---

## File structure created by this sub-plan

```
.claude-plugin/
└── marketplace.json                            # Marketplace metadata (repo root)
plugins/splunk-dashboards/
├── .claude-plugin/
│   └── plugin.json                             # Plugin manifest (Claude Code schema)
├── README.md                                   # Plugin overview
├── pyproject.toml                              # Python package + pytest config
├── src/
│   └── splunk_dashboards/
│       ├── __init__.py
│       ├── workspace.py                        # Workspace path, state.json CRUD, stages
│       └── requirements.py                     # requirements.md builder
├── skills/
│   └── ds-init/
│       └── SKILL.md                            # ds-init skill definition + question flow
└── tests/
    ├── __init__.py
    ├── test_workspace.py
    ├── test_requirements.py
    └── test_ds_init_cli.py
```

---

### Task 1: Scaffold plugin directory and manifest

**Files:**
- Create: `plugins/splunk-dashboards/plugin.json`
- Create: `plugins/splunk-dashboards/README.md`
- Create: `plugins/splunk-dashboards/pyproject.toml`

- [ ] **Step 1: Create plugin directory and manifest**

Create `plugins/splunk-dashboards/plugin.json`:

```json
{
  "name": "splunk-dashboards",
  "version": "0.1.0",
  "description": "Guided authoring of Splunk Dashboard Studio (v2) dashboards from scope to deploy.",
  "author": "splunk-knowledge",
  "skills": []
}
```

- [ ] **Step 2: Create README.md**

Create `plugins/splunk-dashboards/README.md`:

```markdown
# splunk-dashboards

A Claude Code / Cursor plugin for guided authoring of Splunk Dashboard Studio (v2) dashboards.

## Pipeline

Scope → Data → Design → Build → Ship & Iterate

## Skills

Skills are registered as they are implemented. See `plugin.json` for the current list.

## Workspace

Each dashboard project lives in `./.splunk-dashboards/<project-name>/` relative to the current working directory.
```

- [ ] **Step 3: Create pyproject.toml**

Create `plugins/splunk-dashboards/pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "splunk-dashboards"
version = "0.1.0"
description = "Splunk Dashboard Studio authoring plugin"
requires-python = ">=3.11"

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
```

- [ ] **Step 4: Commit**

```bash
cd plugins/splunk-dashboards
git init 2>/dev/null || true
cd ..
git add plugins/splunk-dashboards/plugin.json plugins/splunk-dashboards/README.md plugins/splunk-dashboards/pyproject.toml
git commit -m "feat(splunk-dashboards): scaffold plugin manifest and pyproject"
```

---

### Task 2: Python package skeleton

**Files:**
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/__init__.py`
- Create: `plugins/splunk-dashboards/tests/__init__.py`

- [ ] **Step 1: Create package init**

Create `plugins/splunk-dashboards/src/splunk_dashboards/__init__.py`:

```python
"""splunk-dashboards plugin — shared utilities."""

__version__ = "0.1.0"
```

- [ ] **Step 2: Create tests init**

Create `plugins/splunk-dashboards/tests/__init__.py` (empty file).

- [ ] **Step 3: Verify package is importable**

Run from `plugins/splunk-dashboards/` directory:

```bash
cd plugins/splunk-dashboards
python -c "import sys; sys.path.insert(0, 'src'); import splunk_dashboards; print(splunk_dashboards.__version__)"
```

Expected output: `0.1.0`

- [ ] **Step 4: Commit**

```bash
git add plugins/splunk-dashboards/src plugins/splunk-dashboards/tests/__init__.py
git commit -m "feat(splunk-dashboards): add Python package skeleton"
```

---

### Task 3: WorkspaceState dataclass (TDD)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_workspace.py`
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/workspace.py`

- [ ] **Step 1: Write the failing test**

Create `plugins/splunk-dashboards/tests/test_workspace.py`:

```python
"""Tests for workspace module."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.workspace import WorkspaceState, STAGES


def test_workspace_state_defaults():
    state = WorkspaceState(project="my-dashboard")
    assert state.project == "my-dashboard"
    assert state.current_stage == "scoped"
    assert state.stages_completed == []
    assert state.data_path is None
    assert state.autopilot is False
    assert state.created  # ISO timestamp string, non-empty


def test_workspace_state_to_dict_roundtrip():
    state = WorkspaceState(
        project="test",
        current_stage="designed",
        stages_completed=["scoped", "data-ready"],
        data_path="mock",
        autopilot=True,
    )
    data = state.to_dict()
    restored = WorkspaceState.from_dict(data)
    assert restored == state


def test_stages_sequence():
    assert STAGES == [
        "scoped",
        "data-ready",
        "designed",
        "built",
        "validated",
        "deployed",
        "reviewed",
    ]
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_workspace.py -v
```

Expected: `ImportError` — `workspace.py` does not exist yet.

- [ ] **Step 3: Implement workspace.py (dataclass only)**

Create `plugins/splunk-dashboards/src/splunk_dashboards/workspace.py`:

```python
"""Workspace and state management for splunk-dashboards."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Optional

STAGES: list[str] = [
    "scoped",
    "data-ready",
    "designed",
    "built",
    "validated",
    "deployed",
    "reviewed",
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


@dataclass
class WorkspaceState:
    project: str
    created: str = field(default_factory=_now_iso)
    current_stage: str = "scoped"
    stages_completed: list[str] = field(default_factory=list)
    data_path: Optional[str] = None
    autopilot: bool = False

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "WorkspaceState":
        return cls(**data)
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_workspace.py -v
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/workspace.py plugins/splunk-dashboards/tests/test_workspace.py
git commit -m "feat(splunk-dashboards): add WorkspaceState dataclass"
```

---

### Task 4: Workspace directory operations (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_workspace.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/workspace.py`

- [ ] **Step 1: Append failing tests**

Append to `plugins/splunk-dashboards/tests/test_workspace.py`:

```python
from splunk_dashboards.workspace import (
    get_workspace_dir,
    init_workspace,
    load_state,
    save_state,
    workspace_exists,
)


def test_get_workspace_dir_resolves_under_cwd(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    result = get_workspace_dir("my-dash")
    assert result == tmp_path / ".splunk-dashboards" / "my-dash"


def test_init_workspace_creates_scaffolding(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    ws = tmp_path / ".splunk-dashboards" / "my-dash"
    assert ws.exists()
    assert (ws / "state.json").exists()
    assert state.project == "my-dash"
    assert state.current_stage == "scoped"


def test_init_workspace_is_idempotent(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state1 = init_workspace("my-dash", autopilot=False)
    state2 = init_workspace("my-dash", autopilot=False)
    # Second call returns the existing state, does not overwrite
    assert state1.created == state2.created


def test_save_and_load_state_roundtrip(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    state.current_stage = "data-ready"
    state.stages_completed = ["scoped"]
    save_state(state)
    loaded = load_state("my-dash")
    assert loaded.current_stage == "data-ready"
    assert loaded.stages_completed == ["scoped"]


def test_workspace_exists(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert workspace_exists("my-dash") is False
    init_workspace("my-dash", autopilot=False)
    assert workspace_exists("my-dash") is True
```

- [ ] **Step 2: Run tests and verify new ones fail**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_workspace.py -v
```

Expected: ImportError on `get_workspace_dir`, `init_workspace`, `load_state`, `save_state`, `workspace_exists`.

- [ ] **Step 3: Implement the functions**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/workspace.py`:

```python
import json
from pathlib import Path

WORKSPACE_ROOT = ".splunk-dashboards"


def get_workspace_dir(project: str, cwd: Optional[Path] = None) -> Path:
    base = cwd if cwd is not None else Path.cwd()
    return base / WORKSPACE_ROOT / project


def workspace_exists(project: str, cwd: Optional[Path] = None) -> bool:
    return (get_workspace_dir(project, cwd) / "state.json").exists()


def init_workspace(project: str, autopilot: bool = False, cwd: Optional[Path] = None) -> WorkspaceState:
    ws = get_workspace_dir(project, cwd)
    state_path = ws / "state.json"
    if state_path.exists():
        return load_state(project, cwd)
    ws.mkdir(parents=True, exist_ok=True)
    state = WorkspaceState(project=project, autopilot=autopilot)
    _write_state_file(state_path, state)
    return state


def load_state(project: str, cwd: Optional[Path] = None) -> WorkspaceState:
    state_path = get_workspace_dir(project, cwd) / "state.json"
    data = json.loads(state_path.read_text(encoding="utf-8"))
    return WorkspaceState.from_dict(data)


def save_state(state: WorkspaceState, cwd: Optional[Path] = None) -> None:
    state_path = get_workspace_dir(state.project, cwd) / "state.json"
    _write_state_file(state_path, state)


def _write_state_file(path: Path, state: WorkspaceState) -> None:
    path.write_text(json.dumps(state.to_dict(), indent=2) + "\n", encoding="utf-8")
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_workspace.py -v
```

Expected: 8 passed (3 from Task 3 + 5 new).

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/workspace.py plugins/splunk-dashboards/tests/test_workspace.py
git commit -m "feat(splunk-dashboards): add workspace directory and state persistence"
```

---

### Task 5: Stage transitions (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_workspace.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/workspace.py`

- [ ] **Step 1: Append failing tests**

Append to `plugins/splunk-dashboards/tests/test_workspace.py`:

```python
import pytest
from splunk_dashboards.workspace import advance_stage, InvalidStageTransition


def test_advance_stage_moves_to_next(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    advanced = advance_stage(state, "data-ready")
    assert advanced.current_stage == "data-ready"
    assert advanced.stages_completed == ["scoped"]


def test_advance_stage_rejects_skipping(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    with pytest.raises(InvalidStageTransition):
        advance_stage(state, "built")  # skips data-ready and designed


def test_advance_stage_allows_update_loop(tmp_path, monkeypatch):
    # deployed -> validated is legal (ds-update loops back through validate)
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    state.current_stage = "deployed"
    state.stages_completed = ["scoped", "data-ready", "designed", "built", "validated"]
    advanced = advance_stage(state, "validated", allow_backward=True)
    assert advanced.current_stage == "validated"


def test_advance_stage_rejects_unknown_stage(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    with pytest.raises(InvalidStageTransition):
        advance_stage(state, "nonsense")
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_workspace.py -v
```

Expected: ImportError on `advance_stage`, `InvalidStageTransition`.

- [ ] **Step 3: Implement stage transitions**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/workspace.py`:

```python
class InvalidStageTransition(Exception):
    pass


def advance_stage(state: WorkspaceState, target: str, allow_backward: bool = False) -> WorkspaceState:
    if target not in STAGES:
        raise InvalidStageTransition(f"Unknown stage: {target}")
    current_idx = STAGES.index(state.current_stage)
    target_idx = STAGES.index(target)
    if not allow_backward and target_idx != current_idx + 1:
        raise InvalidStageTransition(
            f"Cannot advance from {state.current_stage} to {target}"
        )
    if state.current_stage not in state.stages_completed:
        state.stages_completed.append(state.current_stage)
    state.current_stage = target
    return state
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_workspace.py -v
```

Expected: 12 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/workspace.py plugins/splunk-dashboards/tests/test_workspace.py
git commit -m "feat(splunk-dashboards): add stage transition logic"
```

---

### Task 6: workspace.py CLI entry point (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_workspace.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/workspace.py`

- [ ] **Step 1: Append failing CLI test**

Append to `plugins/splunk-dashboards/tests/test_workspace.py`:

```python
import os
import subprocess
import sys as _sys


def test_cli_init_creates_workspace(tmp_path):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    result = subprocess.run(
        [
            _sys.executable,
            "-m",
            "splunk_dashboards.workspace",
            "init",
            "my-cli-dash",
        ],
        cwd=tmp_path,
        env=env,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
    assert (tmp_path / ".splunk-dashboards" / "my-cli-dash" / "state.json").exists()
```

- [ ] **Step 2: Run test and verify it fails**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_workspace.py::test_cli_init_creates_workspace -v
```

Expected: non-zero return code (no `__main__` handler yet).

- [ ] **Step 3: Add CLI entry point**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/workspace.py`:

```python
def _cli(argv: Optional[list[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.workspace")
    sub = parser.add_subparsers(dest="command", required=True)
    init_p = sub.add_parser("init", help="Create a new workspace")
    init_p.add_argument("project")
    init_p.add_argument("--autopilot", action="store_true")

    args = parser.parse_args(argv)
    if args.command == "init":
        state = init_workspace(args.project, autopilot=args.autopilot)
        print(f"Workspace initialized: {get_workspace_dir(state.project)}")
        return 0
    return 1


if __name__ == "__main__":
    import sys

    sys.exit(_cli())
```

- [ ] **Step 4: Run test and verify it passes**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_workspace.py -v
```

Expected: 13 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/workspace.py plugins/splunk-dashboards/tests/test_workspace.py
git commit -m "feat(splunk-dashboards): add workspace CLI entry point"
```

---

### Task 7: Requirements dataclass and builder (TDD)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_requirements.py`
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/requirements.py`

- [ ] **Step 1: Write the failing tests**

Create `plugins/splunk-dashboards/tests/test_requirements.py`:

```python
"""Tests for requirements module."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from splunk_dashboards.requirements import Requirements, render_markdown


def test_requirements_defaults():
    r = Requirements(project="test", goal="Monitor failed logins")
    assert r.project == "test"
    assert r.goal == "Monitor failed logins"
    assert r.role == "Developer"
    assert r.audience == "Self"
    assert r.focus == "Mixed"
    assert r.questions == []
    assert r.has_data == "no"
    assert r.indexes == []
    assert r.customization == "moderate"
    assert r.nice_to_haves == []
    assert r.reference_dashboard is None


def test_render_markdown_contains_all_sections():
    r = Requirements(
        project="auth-monitoring",
        goal="Surface suspicious authentication activity",
        role="SOC analyst",
        audience="Team",
        focus="Technical",
        questions=[
            "What are the top failed login sources?",
            "Which users have repeated failures?",
        ],
        has_data="yes",
        indexes=["auth", "windows"],
        customization="bespoke",
        nice_to_haves=["drilldowns", "tokens"],
        reference_dashboard=None,
    )
    md = render_markdown(r)
    assert "# Dashboard: auth-monitoring" in md
    assert "Surface suspicious authentication activity" in md
    assert "- Role: SOC analyst" in md
    assert "- Audience: Team" in md
    assert "- Focus: Technical" in md
    assert "1. What are the top failed login sources?" in md
    assert "2. Which users have repeated failures?" in md
    assert "- Has data: yes" in md
    assert "- Indexes: auth, windows" in md
    assert "- Customization: bespoke" in md
    assert "- Nice-to-haves: drilldowns, tokens" in md


def test_render_markdown_routes_to_data_explore_when_has_data():
    r = Requirements(project="x", goal="g", has_data="yes")
    md = render_markdown(r)
    assert "→ ds-data-explore" in md


def test_render_markdown_routes_to_mock_when_no_data():
    r = Requirements(project="x", goal="g", has_data="no")
    md = render_markdown(r)
    assert "→ ds-mock" in md


def test_render_markdown_routes_to_both_when_partial():
    r = Requirements(project="x", goal="g", has_data="partial")
    md = render_markdown(r)
    assert "→ ds-data-explore" in md
    assert "→ ds-mock" in md
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_requirements.py -v
```

Expected: ImportError — `requirements.py` does not exist.

- [ ] **Step 3: Implement requirements.py**

Create `plugins/splunk-dashboards/src/splunk_dashboards/requirements.py`:

```python
"""Requirements gathering output for ds-init."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

HasData = Literal["yes", "no", "partial"]
Customization = Literal["template", "moderate", "bespoke"]


@dataclass
class Requirements:
    project: str
    goal: str
    role: str = "Developer"
    audience: str = "Self"
    focus: str = "Mixed"
    questions: list[str] = field(default_factory=list)
    has_data: HasData = "no"
    indexes: list[str] = field(default_factory=list)
    customization: Customization = "moderate"
    nice_to_haves: list[str] = field(default_factory=list)
    reference_dashboard: Optional[str] = None


def _next_step(has_data: HasData) -> str:
    if has_data == "yes":
        return "→ ds-data-explore"
    if has_data == "no":
        return "→ ds-mock"
    return "→ ds-data-explore\n→ ds-mock"


def render_markdown(r: Requirements) -> str:
    questions = "\n".join(f"  {i + 1}. {q}" for i, q in enumerate(r.questions)) or "  (none specified)"
    indexes = ", ".join(r.indexes) if r.indexes else "(none)"
    nice = ", ".join(r.nice_to_haves) if r.nice_to_haves else "(none)"
    ref = r.reference_dashboard or "(none)"

    return (
        f"# Dashboard: {r.project}\n\n"
        f"## Context\n"
        f"- Role: {r.role}\n"
        f"- Audience: {r.audience}\n"
        f"- Primary goal: {r.goal}\n\n"
        f"## Content\n"
        f"- Focus: {r.focus}\n"
        f"- Questions the dashboard should answer:\n{questions}\n"
        f"- Reference dashboard: {ref}\n\n"
        f"## Data\n"
        f"- Has data: {r.has_data}\n"
        f"- Indexes: {indexes}\n\n"
        f"## Scope\n"
        f"- Customization: {r.customization}\n"
        f"- Nice-to-haves: {nice}\n\n"
        f"## Next step\n"
        f"{_next_step(r.has_data)}\n"
    )
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_requirements.py -v
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/requirements.py plugins/splunk-dashboards/tests/test_requirements.py
git commit -m "feat(splunk-dashboards): add Requirements model and markdown renderer"
```

---

### Task 8: ds-init CLI (writes requirements.md from JSON input) — TDD

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_ds_init_cli.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/requirements.py`

**Rationale:** The interactive question-asking happens in Claude via `SKILL.md`. This CLI takes an answers JSON payload (already collected) and deterministically produces the workspace + `requirements.md`. Tests cover that deterministic step.

- [ ] **Step 1: Write the failing CLI test**

Create `plugins/splunk-dashboards/tests/test_ds_init_cli.py`:

```python
"""Integration test for the ds-init CLI — writes requirements from a JSON payload."""
import json
import os
import subprocess
import sys
from pathlib import Path


def _run(args, cwd, stdin=None):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    return subprocess.run(
        [sys.executable, "-m", "splunk_dashboards.requirements", *args],
        cwd=cwd,
        env=env,
        input=stdin,
        capture_output=True,
        text=True,
    )


def test_ds_init_writes_workspace_and_requirements(tmp_path):
    answers = {
        "project": "auth-monitoring",
        "goal": "Surface suspicious authentication activity",
        "role": "SOC analyst",
        "audience": "Team",
        "focus": "Technical",
        "questions": [
            "What are the top failed login sources?",
            "Which users have repeated failures?",
        ],
        "has_data": "yes",
        "indexes": ["auth", "windows"],
        "customization": "moderate",
        "nice_to_haves": ["drilldowns"],
        "reference_dashboard": None,
    }
    result = _run(["from-json", "-"], cwd=tmp_path, stdin=json.dumps(answers))
    assert result.returncode == 0, result.stderr

    ws = tmp_path / ".splunk-dashboards" / "auth-monitoring"
    assert (ws / "state.json").exists()
    assert (ws / "requirements.md").exists()

    state = json.loads((ws / "state.json").read_text())
    assert state["project"] == "auth-monitoring"
    assert state["current_stage"] == "scoped"

    md = (ws / "requirements.md").read_text()
    assert "Surface suspicious authentication activity" in md
    assert "→ ds-data-explore" in md  # routed because has_data=yes
```

- [ ] **Step 2: Run test and verify it fails**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_ds_init_cli.py -v
```

Expected: non-zero return code (no CLI in `requirements.py` yet).

- [ ] **Step 3: Add the CLI**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/requirements.py`:

```python
import json as _json
import sys as _sys
from pathlib import Path as _Path

from splunk_dashboards.workspace import init_workspace, get_workspace_dir


def _cli(argv: Optional[list[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.requirements")
    sub = parser.add_subparsers(dest="command", required=True)
    from_json = sub.add_parser(
        "from-json",
        help="Build requirements.md from an answers JSON payload",
    )
    from_json.add_argument(
        "source",
        help='Path to JSON file, or "-" to read from stdin',
    )

    args = parser.parse_args(argv)

    if args.command == "from-json":
        raw = _sys.stdin.read() if args.source == "-" else _Path(args.source).read_text(encoding="utf-8")
        payload = _json.loads(raw)
        r = Requirements(
            project=payload["project"],
            goal=payload["goal"],
            role=payload.get("role", "Developer"),
            audience=payload.get("audience", "Self"),
            focus=payload.get("focus", "Mixed"),
            questions=payload.get("questions", []),
            has_data=payload.get("has_data", "no"),
            indexes=payload.get("indexes", []),
            customization=payload.get("customization", "moderate"),
            nice_to_haves=payload.get("nice_to_haves", []),
            reference_dashboard=payload.get("reference_dashboard"),
        )
        init_workspace(r.project, autopilot=payload.get("autopilot", False))
        ws = get_workspace_dir(r.project)
        (ws / "requirements.md").write_text(render_markdown(r), encoding="utf-8")
        print(f"Wrote {ws / 'requirements.md'}")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
```

- [ ] **Step 4: Run test and verify it passes**

```bash
cd plugins/splunk-dashboards
python -m pytest tests/test_ds_init_cli.py -v
```

Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/requirements.py plugins/splunk-dashboards/tests/test_ds_init_cli.py
git commit -m "feat(splunk-dashboards): add ds-init from-json CLI"
```

---

### Task 9: Full test suite passes together

- [ ] **Step 1: Run the full test suite**

```bash
cd plugins/splunk-dashboards
python -m pytest -v
```

Expected: 19 passed (13 workspace + 5 requirements + 1 CLI integration).

- [ ] **Step 2: Commit (if any fixes needed)**

If all pass, skip. If any test fails, diagnose and fix before continuing.

---

### Task 10: ds-init SKILL.md

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-init/SKILL.md`

- [ ] **Step 1: Write the SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-init/SKILL.md`:

````markdown
---
name: ds-init
description: Use this skill to scope a new Splunk Dashboard Studio dashboard. Runs an interactive question flow, creates a workspace under ./.splunk-dashboards/<project>/, and writes requirements.md. Also accepts --autopilot to run non-interactively with defaults, --quick for minimum scoping, and --resume to continue from an existing workspace. Entry point for the splunk-dashboards plugin pipeline.
---

# ds-init — Splunk Dashboard scoping

## When to use

When the user says they want to build a new Splunk Dashboard Studio dashboard and no workspace exists yet (or they pass `--resume`).

## What it does

1. Asks the user a ten-question scoping flow (below).
2. Creates `./.splunk-dashboards/<project-name>/` with `state.json`.
3. Writes `requirements.md` under the workspace.
4. Prints the next recommended skill (`ds-data-explore` or `ds-mock`).

## Flags

- `--autopilot` — skip all questions, use defaults, and let downstream skills also run with defaults.
- `--quick` — ask only questions 3 (goal) and 7 (has-data). Skip design phase later.
- `--resume` — if a workspace already exists for the project name, load it instead of re-asking.

## Question flow

Ask these one at a time. Prefer multiple-choice where options are listed.

### Group 1 — Context

1. **Role?** Options: SOC analyst / DevOps / Platform admin / Developer / Business / Other.
2. **Audience?** Options: Self / Team / Leadership / External.
3. **Primary goal (one sentence)?** Free text.

### Group 2 — Content

4. **Focus?** Options: Technical/operational / Business/executive / Mixed.
5. **Which 3–5 questions should the dashboard answer?** Free text, one per line.
6. **Does a similar dashboard already exist?** If yes, capture the path or URL.

### Group 3 — Data

7. **Is the data already in Splunk?** Options: yes / no / partial.
8. *(if yes or partial)* **Which indexes/sourcetypes are relevant?** Free text or comma-separated list.

### Group 4 — Scope

9. **Customization level?** Options: template (start from a pattern) / moderate / bespoke.
10. **Nice-to-haves?** Multi-select: drilldowns / alerts / scheduled reports / tokens / dark theme / other.

## Defaults used by `--autopilot`

| Field | Default |
|---|---|
| role | "Developer" (auto-detect from CLAUDE.md if mentioned) |
| audience | "Self" |
| focus | "Mixed" |
| questions | infer from goal sentence |
| reference_dashboard | null |
| has_data | "no" (routes to ds-mock) unless Splunk MCP is configured |
| indexes | [] |
| customization | "moderate" |
| nice_to_haves | ["drilldowns", "tokens"] |

## How to produce the workspace

Once all answers are collected, assemble them into a JSON payload and invoke:

```bash
cd <repo-root-where-splunk-dashboards-lives>
PYTHONPATH=plugins/splunk-dashboards/src python -m splunk_dashboards.requirements from-json - <<'JSON'
{
  "project": "<kebab-case-project-name>",
  "goal": "<goal sentence>",
  "role": "<role>",
  "audience": "<audience>",
  "focus": "<focus>",
  "questions": ["<q1>", "<q2>"],
  "has_data": "yes|no|partial",
  "indexes": ["<idx1>"],
  "customization": "template|moderate|bespoke",
  "nice_to_haves": ["drilldowns"],
  "reference_dashboard": null,
  "autopilot": false
}
JSON
```

The CLI writes `.splunk-dashboards/<project>/state.json` and `.splunk-dashboards/<project>/requirements.md` in the current working directory.

## Next step

Read the `## Next step` line at the bottom of `requirements.md`. Invoke the suggested skill(s).
````

- [ ] **Step 2: Manual smoke test of the skill**

Run from a temporary directory:

```bash
mkdir -p /tmp/ds-init-smoke && cd /tmp/ds-init-smoke
PYTHONPATH=<repo>/plugins/splunk-dashboards/src python -m splunk_dashboards.requirements from-json - <<'JSON'
{
  "project": "smoke-test",
  "goal": "Test the scoping flow",
  "role": "Developer",
  "audience": "Self",
  "focus": "Mixed",
  "questions": ["Does it work?"],
  "has_data": "no",
  "indexes": [],
  "customization": "moderate",
  "nice_to_haves": ["drilldowns"],
  "reference_dashboard": null
}
JSON
cat .splunk-dashboards/smoke-test/requirements.md
cat .splunk-dashboards/smoke-test/state.json
```

Expected: both files exist, `requirements.md` contains "→ ds-mock" under Next step, `state.json` has `"current_stage": "scoped"`.

Clean up:

```bash
rm -rf /tmp/ds-init-smoke
```

- [ ] **Step 3: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-init/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-init SKILL.md"
```

---

### Task 11: Verify plugin is discoverable via marketplace

**Files:**
- None to modify — `plugins/splunk-dashboards/.claude-plugin/plugin.json` and the repo-root `.claude-plugin/marketplace.json` already exist from the restructure. Claude Code auto-discovers skills from the `skills/` directory, so no per-skill registration is needed in `plugin.json`.

- [ ] **Step 1: Validate both manifests parse**

```bash
python -c "import json; json.load(open('plugins/splunk-dashboards/.claude-plugin/plugin.json')); json.load(open('.claude-plugin/marketplace.json')); print('OK')"
```

Expected: prints `OK`.

- [ ] **Step 2: Verify ds-init skill directory is present**

```bash
ls plugins/splunk-dashboards/skills/ds-init/SKILL.md
```

Expected: the file exists (created in Task 10).

- [ ] **Step 3: No commit needed**

The manifests were already committed in the restructure commit; the ds-init skill was committed in Task 10. Task 11 is a verification-only step.

---

### Task 12: Final sub-plan verification

- [ ] **Step 1: Run full test suite one more time**

```bash
cd plugins/splunk-dashboards
python -m pytest -v
```

Expected: 19 passed, 0 failed.

- [ ] **Step 2: Verify the file tree matches the plan**

```bash
cd plugins/splunk-dashboards
find . -type f -not -path "*/__pycache__/*" | sort
```

Expected output:

```
./.claude-plugin/plugin.json
./README.md
./pyproject.toml
./skills/ds-init/SKILL.md
./src/splunk_dashboards/__init__.py
./src/splunk_dashboards/requirements.py
./src/splunk_dashboards/workspace.py
./tests/__init__.py
./tests/test_ds_init_cli.py
./tests/test_requirements.py
./tests/test_workspace.py
```

- [ ] **Step 3: Verify git log is clean**

```bash
git log --oneline | head -15
```

Expected: commits corresponding to Tasks 1–10 plus the `chore(marketplace): restructure to Claude plugin marketplace layout` commit.

---

## What this sub-plan delivers

- A registered `plugins/splunk-dashboards` plugin with a valid manifest.
- A shared Python package (`splunk_dashboards`) with tested workspace and requirements modules.
- A `ds-init` skill that can be invoked from Claude Code / Cursor, gathers scoping information via ten questions, and produces a `.splunk-dashboards/<project>/` workspace containing `state.json` and `requirements.md`.
- A deterministic JSON-in / files-out CLI (`python -m splunk_dashboards.requirements from-json`) that lets any agent — or a future `--autopilot` runner — produce the same output without asking questions.

Sub-plan 2 (data stage: `ds-data-explore`, `ds-mock`) picks up from the `requirements.md` this sub-plan writes.
