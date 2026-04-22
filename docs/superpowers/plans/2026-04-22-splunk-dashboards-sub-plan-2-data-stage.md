# splunk-dashboards Sub-plan 2: Data stage (ds-data-explore + ds-mock)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the data-stage skills to `splunk-dashboards`: `ds-data-explore` (discover indexes / draft SPL from existing data) and `ds-mock` (generate inline synthetic data via `makeresults`). Both write `data-sources.json` under the workspace and advance pipeline state from `scoped` → `data-ready`.

**Architecture:** Both skills share a common Python module (`data_sources.py`) that owns the `data-sources.json` data model, file I/O, and state transition. The skills themselves are documentation — they tell Claude how to extract questions from `requirements.md` and draft SPL (by heuristic + optional Splunk MCP verification for `ds-data-explore`, or by `makeresults` patterns for `ds-mock`). A single generic CLI (`python3 -m splunk_dashboards.data_sources write`) accepts a JSON payload from either skill and produces the workspace artifact deterministically.

**Tech Stack:** Python 3.11+ stdlib (same constraint as sub-plan 1). Reuses `workspace.py` for state and directory access. No new external dependencies.

---

## File structure created by this sub-plan

```
plugins/splunk-dashboards/
├── src/splunk_dashboards/
│   └── data_sources.py            # NEW — DataSource model, I/O, write CLI
├── skills/
│   ├── ds-data-explore/
│   │   └── SKILL.md               # NEW
│   └── ds-mock/
│       └── SKILL.md               # NEW
└── tests/
    ├── test_data_sources.py       # NEW — dataclass + I/O + CLI tests
    └── test_pipeline_data.py      # NEW — integration test: init → mock → data-ready
```

Expected test count after this sub-plan: **19 (from sub-plan 1) + 8 new = 27 tests**.

---

### Task 1: DataSource dataclass (TDD)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_data_sources.py`
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/data_sources.py`

- [ ] **Step 1: Write the failing tests**

Create `plugins/splunk-dashboards/tests/test_data_sources.py`:

```python
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
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_data_sources.py -v
```

Expected: `ImportError` — `data_sources` module does not exist.

- [ ] **Step 3: Implement the dataclasses**

Create `plugins/splunk-dashboards/src/splunk_dashboards/data_sources.py`:

```python
"""Data source model and I/O for ds-data-explore and ds-mock."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Literal, Optional

Source = Literal["mock", "explore"]


@dataclass
class DataSource:
    question: str
    spl: str
    earliest: str = "-24h"
    latest: str = "now"
    name: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "DataSource":
        return cls(**data)


@dataclass
class DataSources:
    project: str
    source: Source = "mock"
    sources: list[DataSource] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "project": self.project,
            "source": self.source,
            "sources": [s.to_dict() for s in self.sources],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "DataSources":
        return cls(
            project=data["project"],
            source=data.get("source", "mock"),
            sources=[DataSource.from_dict(s) for s in data.get("sources", [])],
        )
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_data_sources.py -v
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/data_sources.py plugins/splunk-dashboards/tests/test_data_sources.py
git commit -m "feat(splunk-dashboards): add DataSource and DataSources dataclasses"
```

---

### Task 2: Workspace-aware load/save (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_data_sources.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/data_sources.py`

- [ ] **Step 1: Append failing tests**

Append to `plugins/splunk-dashboards/tests/test_data_sources.py`:

```python
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
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_data_sources.py -v
```

Expected: ImportError on `DATA_SOURCES_FILENAME`, `load_data_sources`, `save_data_sources`.

- [ ] **Step 3: Implement load/save**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/data_sources.py`:

```python
import json
from pathlib import Path

from splunk_dashboards.workspace import get_workspace_dir

DATA_SOURCES_FILENAME = "data-sources.json"


def _data_sources_path(project: str, cwd: Optional[Path] = None) -> Path:
    return get_workspace_dir(project, cwd) / DATA_SOURCES_FILENAME


def save_data_sources(coll: DataSources, cwd: Optional[Path] = None) -> None:
    ws = get_workspace_dir(coll.project, cwd)
    if not ws.exists():
        raise FileNotFoundError(f"Workspace does not exist: {ws}")
    path = ws / DATA_SOURCES_FILENAME
    path.write_text(json.dumps(coll.to_dict(), indent=2) + "\n", encoding="utf-8")


def load_data_sources(project: str, cwd: Optional[Path] = None) -> DataSources:
    path = _data_sources_path(project, cwd)
    data = json.loads(path.read_text(encoding="utf-8"))
    return DataSources.from_dict(data)
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_data_sources.py -v
```

Expected: 7 passed (4 from Task 1 + 3 new).

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/data_sources.py plugins/splunk-dashboards/tests/test_data_sources.py
git commit -m "feat(splunk-dashboards): add data-sources.json load/save"
```

---

### Task 3: `write` CLI with stage advance (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_data_sources.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/data_sources.py`

- [ ] **Step 1: Append failing CLI test**

Append to `plugins/splunk-dashboards/tests/test_data_sources.py`:

```python
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
```

- [ ] **Step 2: Run test and verify it fails**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_data_sources.py -v
```

Expected: the CLI tests fail — `data_sources` module has no `__main__` handler yet, so subprocess returns non-zero but no `data-sources.json` is written, causing the first assertion to fail.

- [ ] **Step 3: Add the CLI**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/data_sources.py`:

```python
import sys as _sys

from splunk_dashboards.workspace import (
    advance_stage,
    load_state,
    save_state,
)


def _cli(argv: Optional[list[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.data_sources")
    sub = parser.add_subparsers(dest="command", required=True)
    write = sub.add_parser(
        "write",
        help="Write data-sources.json from a JSON payload and advance workspace state",
    )
    write.add_argument("source_arg", help='Path to JSON file, or "-" to read stdin')

    args = parser.parse_args(argv)

    if args.command == "write":
        raw = _sys.stdin.read() if args.source_arg == "-" else Path(args.source_arg).read_text(encoding="utf-8")
        coll = DataSources.from_dict(json.loads(raw))
        try:
            save_data_sources(coll)
        except FileNotFoundError as e:
            print(str(e), file=_sys.stderr)
            return 2
        # advance state scoped -> data-ready
        state = load_state(coll.project)
        if state.current_stage == "scoped":
            advance_stage(state, "data-ready")
            save_state(state)
        print(f"Wrote data-sources.json for {coll.project} ({len(coll.sources)} sources)")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_data_sources.py -v
```

Expected: 9 passed (7 prior + 2 new).

Also run the full test suite:

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: 28 passed (19 from sub-plan 1 + 4 from Task 1 + 3 from Task 2 + 2 from Task 3 = 28). The pipeline integration test from Task 6 will bring the total to 29.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/data_sources.py plugins/splunk-dashboards/tests/test_data_sources.py
git commit -m "feat(splunk-dashboards): add data_sources write CLI with stage advance"
```

---

### Task 4: ds-mock SKILL.md

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-mock/SKILL.md`

- [ ] **Step 1: Write the SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-mock/SKILL.md` with this exact content:

```markdown
---
name: ds-mock
description: Use this skill to generate inline synthetic data for a Splunk dashboard when real data is not yet available. Produces makeresults-based SPL queries (one per dashboard question) and writes them to data-sources.json under the workspace. Advances workspace state from scoped to data-ready. Requires an existing workspace created by ds-init.
---

# ds-mock — Synthetic data generator

## When to use

When `requirements.md` reports `Has data: no` (or `partial` and the user wants mock for the missing questions), or when the user explicitly asks to mock data.

## Prerequisites

- Workspace exists at `./.splunk-dashboards/<project>/state.json`.
- `current_stage` is `scoped`.
- `requirements.md` lists 1–5 questions.

If the workspace does not exist, run `ds-init` first.

## What it does

1. Reads the dashboard questions from `requirements.md`.
2. For each question, drafts a `makeresults`-based SPL snippet that produces plausible synthetic events.
3. Assembles a JSON payload with one entry per question.
4. Invokes the `data_sources write` CLI to persist `data-sources.json` and advance state to `data-ready`.

## Pattern library

Compose mock SPL from these building blocks. Pick patterns based on the question type.

### Categorical field (fixed vocabulary)

```spl
| makeresults count=100
| eval user=mvindex(split("alice,bob,carol,dave,erin",","), random()%5)
| eval action=mvindex(split("success,failure,timeout",","), random()%3)
```

### Numeric distribution (counts, latencies)

```spl
| makeresults count=200
| eval latency_ms=round(10 + random()%500, 0)
| eval bytes=round(1024 + random()%(1024*1024), 0)
```

### Timestamps over a window (for trends / time charts)

```spl
| makeresults count=500
| eval _time=now()-round(random()%(24*3600), 0)
```

### IP addresses (for network-ish data)

```spl
| makeresults count=150
| eval src="10.0.0.".(random()%254+1)
| eval dest="192.168.1.".(random()%254+1)
```

### Top-N friendly shape

After generating events, aggregate — this produces realistic leaderboards:

```spl
| makeresults count=500
| eval src=mvindex(split("10.0.0.1,10.0.0.2,10.0.0.3,10.0.0.4,10.0.0.5",","), random()%5)
| stats count by src
| sort -count
```

## How to produce the data-sources.json

1. For each question in `requirements.md`, draft an SPL using the patterns above. Favor shapes that naturally answer the question — if the question asks "top sources", end with `| stats count by src | sort -count`.
2. Set `earliest` to `-24h` and `latest` to `now` unless the question implies a different window.
3. Give each source a short `name` (human-readable label shown in the dashboard UI later).
4. Assemble this JSON payload and write it via the CLI:

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.data_sources write - <<'JSON'
{
  "project": "<project-name-from-state.json>",
  "source": "mock",
  "sources": [
    {
      "question": "What are the top failed login sources?",
      "spl": "| makeresults count=500\n| eval src=\"10.0.0.\".(random()%254+1)\n| eval action=if(random()%3==0,\"failure\",\"success\")\n| where action=\"failure\"\n| stats count by src\n| sort -count",
      "earliest": "-24h",
      "latest": "now",
      "name": "Failed Logins by Source"
    }
  ]
}
JSON
```

The CLI:

- Validates that the workspace exists.
- Writes `.splunk-dashboards/<project>/data-sources.json`.
- Advances `state.json` from `current_stage=scoped` to `current_stage=data-ready` (appending `scoped` to `stages_completed`).

## Next step

After this skill completes, move to `ds-design` to wireframe the dashboard layout.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-mock/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-mock SKILL.md"
```

---

### Task 5: ds-data-explore SKILL.md

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-data-explore/SKILL.md`

- [ ] **Step 1: Write the SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-data-explore/SKILL.md` with this exact content:

```markdown
---
name: ds-data-explore
description: Use this skill to discover real Splunk data and draft SPL queries for a dashboard when the user has indicated they have data in Splunk. Reads requirements.md, probes available indexes and sourcetypes, drafts SPL per dashboard question (verifying with Splunk MCP if available), and writes data-sources.json. Advances workspace state from scoped to data-ready. Requires an existing workspace created by ds-init.
---

# ds-data-explore — Discover real Splunk data

## When to use

When `requirements.md` reports `Has data: yes` (or `partial` for the yes-portion of questions). Requires `current_stage=scoped`.

## What it does

1. Reads the questions and declared indexes from `requirements.md`.
2. (If Splunk MCP is configured) probes the listed indexes for sourcetypes and sample events.
3. Drafts an SPL query per question, using real index/sourcetype names where possible.
4. (If Splunk MCP is configured) runs each query with a tight time window to validate it parses and returns rows.
5. Assembles a JSON payload and writes it via the generic data-sources CLI, advancing state to `data-ready`.

## MCP vs. no-MCP paths

**If `splunk` MCP tools are available in the session:**

- Use `splunk_search` (or equivalent) to verify each drafted SPL returns rows within a short `earliest` window (e.g., `-1h`).
- If a query fails to parse or returns 0 rows, iterate: inspect sourcetype fields, adjust field names, re-run.
- Persist only queries that parsed and returned rows.

**If no MCP tools are available:**

- Draft SPL using the indexes declared in `requirements.md` and reasonable field-name heuristics (e.g., auth data uses `src`, `user`, `action`; web data uses `status`, `uri`, `clientip`).
- Mark each drafted query with a short comment the user should review before deploy: `| comment "Review field names against actual data"`.
- Do NOT fabricate field values or promise correctness — the skill is best-effort here.

## Heuristic hints for common question shapes

| Question pattern | SPL skeleton |
|---|---|
| "Top N <thing> by <metric>" | `index=<idx> <sourcetype?> | stats count by <field> | sort -count | head N` |
| "Trend of <metric> over time" | `index=<idx> <sourcetype?> | timechart span=<span> count` |
| "Failures / errors" | `index=<idx> (action=failure OR status>=400) | stats count by <grouping>` |
| "Per-user activity" | `index=<idx> user=* | stats count by user | sort -count` |
| "Unique <thing> count" | `index=<idx> | stats dc(<field>)` |

## How to produce the data-sources.json

Same CLI as `ds-mock`, but set `"source": "explore"` and use real `index=`-based SPL instead of `makeresults`:

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.data_sources write - <<'JSON'
{
  "project": "<project-name>",
  "source": "explore",
  "sources": [
    {
      "question": "What are the top failed login sources?",
      "spl": "index=auth action=failure | stats count by src | sort -count | head 10",
      "earliest": "-24h",
      "latest": "now",
      "name": "Failed Logins by Source"
    }
  ]
}
JSON
```

The CLI:

- Validates the workspace exists.
- Writes `.splunk-dashboards/<project>/data-sources.json`.
- Advances `state.json` from `current_stage=scoped` to `current_stage=data-ready`.

## Next step

Move to `ds-design` to wireframe the layout.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-data-explore/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-data-explore SKILL.md"
```

---

### Task 6: Pipeline integration test (TDD)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_pipeline_data.py`

- [ ] **Step 1: Write the failing integration test**

Create `plugins/splunk-dashboards/tests/test_pipeline_data.py`:

```python
"""Integration test — chain ds-init (requirements) into ds-mock (data-sources)."""
import json
import os
import subprocess
import sys
from pathlib import Path


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


def test_pipeline_init_then_mock_advances_to_data_ready(tmp_path):
    # Step 1: ds-init writes requirements.md and creates workspace at scoped stage.
    init_payload = {
        "project": "pipeline-demo",
        "goal": "Demo that the pipeline advances state correctly",
        "role": "Developer",
        "audience": "Self",
        "focus": "Mixed",
        "questions": ["What happened?", "How often?"],
        "has_data": "no",
        "indexes": [],
        "customization": "moderate",
        "nice_to_haves": [],
        "reference_dashboard": None
    }
    r1 = _run(
        "splunk_dashboards.requirements",
        ["from-json", "-"],
        cwd=tmp_path,
        stdin=json.dumps(init_payload),
    )
    assert r1.returncode == 0, r1.stderr

    ws = tmp_path / ".splunk-dashboards" / "pipeline-demo"
    state_after_init = json.loads((ws / "state.json").read_text())
    assert state_after_init["current_stage"] == "scoped"

    # Step 2: ds-mock writes data-sources.json and advances state.
    mock_payload = {
        "project": "pipeline-demo",
        "source": "mock",
        "sources": [
            {
                "question": "What happened?",
                "spl": "| makeresults count=10 | eval event=\"demo\"",
                "earliest": "-24h",
                "latest": "now",
                "name": "Demo Events"
            },
            {
                "question": "How often?",
                "spl": "| makeresults count=10 | timechart span=1h count",
                "earliest": "-24h",
                "latest": "now",
                "name": "Event Rate"
            }
        ]
    }
    r2 = _run(
        "splunk_dashboards.data_sources",
        ["write", "-"],
        cwd=tmp_path,
        stdin=json.dumps(mock_payload),
    )
    assert r2.returncode == 0, r2.stderr

    state_after_mock = json.loads((ws / "state.json").read_text())
    assert state_after_mock["current_stage"] == "data-ready"
    assert "scoped" in state_after_mock["stages_completed"]

    coll = json.loads((ws / "data-sources.json").read_text())
    assert coll["source"] == "mock"
    assert len(coll["sources"]) == 2
    assert coll["sources"][0]["name"] == "Demo Events"
```

- [ ] **Step 2: Run the test**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pipeline_data.py -v
```

Expected: 1 passed. (The test depends on CLI behavior already implemented in Task 3 — no new implementation needed.)

- [ ] **Step 3: Run full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: 29 passed (19 from sub-plan 1 + 9 data-source tests from Tasks 1–3 + 1 pipeline test).

Wait — the earlier count in Task 3 was 28. Recount: sub-plan 1 contributed 19, Task 1 added 4, Task 2 added 3, Task 3 added 2, Task 6 adds 1 → 19+4+3+2+1 = **29**.

- [ ] **Step 4: Commit**

```bash
git add plugins/splunk-dashboards/tests/test_pipeline_data.py
git commit -m "test(splunk-dashboards): add pipeline integration test for init→mock"
```

---

### Task 7: Final sub-plan verification

- [ ] **Step 1: Run full test suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: 29 passed, 0 failed.

- [ ] **Step 2: Verify the new file tree**

```bash
cd plugins/splunk-dashboards
find . -type f -not -path "*/__pycache__/*" -not -path "*/.pytest_cache/*" | sort
```

Expected output includes the new files:

```
./.claude-plugin/plugin.json
./README.md
./pyproject.toml
./skills/ds-data-explore/SKILL.md
./skills/ds-init/SKILL.md
./skills/ds-mock/SKILL.md
./src/splunk_dashboards/__init__.py
./src/splunk_dashboards/data_sources.py
./src/splunk_dashboards/requirements.py
./src/splunk_dashboards/workspace.py
./tests/__init__.py
./tests/test_data_sources.py
./tests/test_ds_init_cli.py
./tests/test_pipeline_data.py
./tests/test_requirements.py
./tests/test_workspace.py
```

- [ ] **Step 3: Verify git log is clean**

```bash
git log --oneline splunk-dashboards-foundation -20
```

Expected: sub-plan 1 history preserved, followed by 6 new commits from this sub-plan (Tasks 1, 2, 3, 4, 5, 6 — Task 7 is verification only).

- [ ] **Step 4: Push**

```bash
git push
```

---

## What this sub-plan delivers

- A `data_sources.py` module with `DataSource`/`DataSources` dataclasses, workspace-aware load/save, and a `write` CLI.
- Two new skills: `ds-mock` (inline `makeresults` synthetic data) and `ds-data-explore` (real SPL drafting with optional MCP verification).
- A pipeline integration test that proves `ds-init` → `ds-mock` correctly produces a workspace at the `data-ready` stage.
- 10 new tests (4 + 3 + 2 + 1 = 10), bringing the total to 29.

Sub-plan 3 (design stage: `ds-design` HTTP server, `ds-template`) picks up from a workspace at `data-ready`.
