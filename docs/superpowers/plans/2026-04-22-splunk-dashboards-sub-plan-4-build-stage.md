# splunk-dashboards Sub-plan 4: Build stage (ds-create + ds-syntax + ds-viz)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate Splunk Dashboard Studio JSON from a workspace's `layout.json` + `data-sources.json`, and ship two standalone reference skills (`ds-syntax` and `ds-viz`) that document the JSON schema and visualization options for the whole plugin family.

**Architecture:** `create.py` builds a Dashboard Studio JSON dict from `Layout` + `DataSources`, mapping each `DataSource` entry to a `ds.search`, each `Panel` to a visualization + an absolute-positioned layout structure entry, and the Layout's theme to the top-level `theme` attribute. A `build` CLI persists `dashboard.json` to the workspace and advances state `designed` → `built`. `ds-syntax` and `ds-viz` are pure documentation skills with no code — they surface reference material when Claude is building or editing dashboards, and they also work standalone for ad-hoc questions.

**Tech Stack:** Python 3.11+ stdlib only. No new external dependencies. The reference SKILL.md files are Markdown.

---

## Execution pattern

```
Sequential foundation:          Parallel reference skills:      Final (sequential):
  F1 builder function             S1 ds-syntax SKILL.md           Z1 pipeline test
  F2 build CLI                    S2 ds-viz SKILL.md              Z2 verification + push
  F3 ds-create SKILL.md
                                  (dispatch S1+S2 as parallel agents)
```

S1 and S2 touch entirely separate directories (`skills/ds-syntax/` and `skills/ds-viz/`), so they can be written concurrently.

---

## File structure created by this sub-plan

```
plugins/splunk-dashboards/
├── src/splunk_dashboards/
│   └── create.py                   # NEW — dashboard JSON builder + build CLI
├── skills/
│   ├── ds-create/
│   │   └── SKILL.md                # NEW
│   ├── ds-syntax/
│   │   └── SKILL.md                # NEW — reference
│   └── ds-viz/
│       └── SKILL.md                # NEW — reference
└── tests/
    ├── test_create.py              # NEW
    └── test_pipeline_build.py      # NEW — designed → built
```

Expected test count after this sub-plan: **57 (prior) + 9 new = 66 tests** (F1: 5, F2: 3, Z1: 1).

---

### Task F1: Dashboard JSON builder (TDD)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_create.py`
- Create: `plugins/splunk-dashboards/src/splunk_dashboards/create.py`

- [ ] **Step 1: Write the failing tests**

Create `plugins/splunk-dashboards/tests/test_create.py`:

```python
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
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_create.py -v
```

Expected: `ModuleNotFoundError: No module named 'splunk_dashboards.create'`.

- [ ] **Step 3: Implement the builder**

Create `plugins/splunk-dashboards/src/splunk_dashboards/create.py`:

```python
"""Dashboard Studio JSON builder for ds-create."""
from __future__ import annotations

from splunk_dashboards.data_sources import DataSources
from splunk_dashboards.layout import Layout

GRID_UNIT_W = 100  # pixels per grid column
GRID_UNIT_H = 80   # pixels per grid row


def build_dashboard(layout: Layout, data: DataSources, title: str, description: str) -> dict:
    """Build a Splunk Dashboard Studio JSON definition from a Layout + DataSources."""
    # Map DataSource index -> ds key. Also build question -> ds key lookup for panel binding.
    ds_map: dict = {}
    question_to_key: dict = {}
    for idx, source in enumerate(data.sources, start=1):
        key = f"ds_{idx}"
        ds_map[key] = {
            "type": "ds.search",
            "name": source.name or source.question,
            "options": {
                "query": source.spl,
                "queryParameters": {
                    "earliest": source.earliest,
                    "latest": source.latest,
                },
            },
        }
        question_to_key[source.question] = key

    visualizations: dict = {}
    structure: list = []
    for panel in layout.panels:
        viz_key = f"viz_{panel.id}"
        data_sources = {}
        if panel.data_source_ref and panel.data_source_ref in question_to_key:
            data_sources["primary"] = question_to_key[panel.data_source_ref]
        visualizations[viz_key] = {
            "type": panel.viz_type,
            "title": panel.title,
            "dataSources": data_sources,
            "options": {},
        }
        structure.append({
            "item": viz_key,
            "type": "block",
            "position": {
                "x": panel.x * GRID_UNIT_W,
                "y": panel.y * GRID_UNIT_H,
                "w": panel.w * GRID_UNIT_W,
                "h": panel.h * GRID_UNIT_H,
            },
        })

    return {
        "title": title,
        "description": description,
        "theme": layout.theme,
        "dataSources": ds_map,
        "visualizations": visualizations,
        "inputs": {},
        "defaults": {},
        "layout": {
            "type": "absolute",
            "options": {"width": 1440, "height": 960},
            "structure": structure,
        },
    }
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_create.py -v
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/create.py plugins/splunk-dashboards/tests/test_create.py
git commit -m "feat(splunk-dashboards): add Dashboard Studio JSON builder"
```

---

### Task F2: Build CLI with stage advance (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_create.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/create.py`

- [ ] **Step 1: Append failing CLI test**

Append to `plugins/splunk-dashboards/tests/test_create.py`:

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
)
from splunk_dashboards.layout import save_layout
from splunk_dashboards.data_sources import save_data_sources


def _run_cli(args, cwd):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    return subprocess.run(
        [_sys.executable, "-m", "splunk_dashboards.create", *args],
        cwd=cwd,
        env=env,
        capture_output=True,
        text=True,
    )


def _prepare_workspace_at_designed(tmp_path, monkeypatch, project="my-dash"):
    monkeypatch.chdir(tmp_path)
    state = init_workspace(project, autopilot=False)
    advance_stage(state, "data-ready")
    advance_stage(state, "designed")
    save_state(state)
    save_data_sources(DataSources(
        project=project,
        sources=[DataSource(question="q1", spl="| makeresults count=1", name="Q1")],
    ))
    save_layout(Layout(
        project=project,
        panels=[Panel(id="p1", title="T", viz_type="splunk.singlevalue", data_source_ref="q1")],
    ))


def test_cli_build_persists_dashboard_and_advances_state(tmp_path, monkeypatch):
    _prepare_workspace_at_designed(tmp_path, monkeypatch)
    result = _run_cli(
        ["build", "my-dash", "--title", "My Dashboard", "--description", "Test"],
        cwd=tmp_path,
    )
    assert result.returncode == 0, result.stderr

    ws = tmp_path / ".splunk-dashboards" / "my-dash"
    dashboard = json.loads((ws / "dashboard.json").read_text())
    assert dashboard["title"] == "My Dashboard"
    assert dashboard["description"] == "Test"
    assert "ds_1" in dashboard["dataSources"]
    assert "viz_p1" in dashboard["visualizations"]

    state = load_state("my-dash")
    assert state.current_stage == "built"
    assert "designed" in state.stages_completed


def test_cli_build_rejects_wrong_stage(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    init_workspace("my-dash", autopilot=False)  # stage = scoped
    result = _run_cli(
        ["build", "my-dash", "--title", "t", "--description", ""],
        cwd=tmp_path,
    )
    assert result.returncode != 0


def test_cli_build_rejects_missing_inputs(tmp_path, monkeypatch):
    # Workspace at 'designed' but without layout/data-sources files on disk
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    advance_stage(state, "data-ready")
    advance_stage(state, "designed")
    save_state(state)
    result = _run_cli(
        ["build", "my-dash", "--title", "t", "--description", ""],
        cwd=tmp_path,
    )
    assert result.returncode != 0
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_create.py -v
```

Expected: CLI tests fail (no `__main__` handler yet).

- [ ] **Step 3: Add the CLI**

Append to `plugins/splunk-dashboards/src/splunk_dashboards/create.py`:

```python
import json as _json
import sys as _sys
from pathlib import Path as _Path

from splunk_dashboards.data_sources import load_data_sources
from splunk_dashboards.layout import load_layout
from splunk_dashboards.workspace import (
    advance_stage,
    get_workspace_dir,
    load_state,
    save_state,
    InvalidStageTransition,
)

DASHBOARD_FILENAME = "dashboard.json"


def _cli(argv=None) -> int:
    import argparse

    parser = argparse.ArgumentParser(prog="splunk_dashboards.create")
    sub = parser.add_subparsers(dest="command", required=True)
    build = sub.add_parser("build", help="Build dashboard.json from workspace")
    build.add_argument("project")
    build.add_argument("--title", required=True)
    build.add_argument("--description", default="")

    args = parser.parse_args(argv)

    if args.command == "build":
        try:
            state = load_state(args.project)
        except FileNotFoundError:
            print(f"No workspace for project '{args.project}'", file=_sys.stderr)
            return 2
        if state.current_stage != "designed":
            print(
                f"Cannot build from stage '{state.current_stage}' — expected 'designed'",
                file=_sys.stderr,
            )
            return 2
        try:
            layout = load_layout(args.project)
            data = load_data_sources(args.project)
        except FileNotFoundError as e:
            print(f"Missing workspace file: {e}", file=_sys.stderr)
            return 2

        dashboard = build_dashboard(
            layout, data, title=args.title, description=args.description
        )
        ws = get_workspace_dir(args.project)
        path = ws / DASHBOARD_FILENAME
        path.write_text(_json.dumps(dashboard, indent=2) + "\n", encoding="utf-8")

        try:
            advance_stage(state, "built")
        except InvalidStageTransition as e:
            print(str(e), file=_sys.stderr)
            return 3
        save_state(state)
        print(f"Wrote {path} ({len(dashboard['visualizations'])} visualizations)")
        return 0
    return 1


if __name__ == "__main__":
    _sys.exit(_cli())
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_create.py -v
```

Expected: 8 passed (5 builder + 3 CLI).

Full suite:

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: 65 passed (57 prior + 8 new).

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/create.py plugins/splunk-dashboards/tests/test_create.py
git commit -m "feat(splunk-dashboards): add build CLI (designed → built)"
```

---

### Task F3: ds-create SKILL.md

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-create/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-create/SKILL.md`:

```markdown
---
name: ds-create
description: Use this skill to generate a full Splunk Dashboard Studio JSON definition (dashboard.json) from a workspace's layout.json and data-sources.json. Reads Panel positions, visualization types, and SPL queries; produces the complete dataSources + visualizations + layout.structure. Advances workspace state from designed to built. Requires a workspace at designed stage produced by ds-design.
---

# ds-create — Dashboard Studio JSON builder

## When to use

After `ds-design` has written `design/layout.json` and advanced state to `designed`. Combined with `data-sources.json` from `ds-data-explore` or `ds-mock`, this skill produces the complete `dashboard.json` that a Splunk instance can consume.

## Prerequisites

- Workspace exists with `current_stage=designed`.
- `design/layout.json` has panels.
- `data-sources.json` has one entry per question.

## What it does

1. Reads `design/layout.json` (panels: id, title, grid position, viz_type, data_source_ref).
2. Reads `data-sources.json` (sources: question, SPL, earliest, latest, name).
3. Generates Dashboard Studio JSON:
   - One `ds.search` entry per data source, keyed `ds_1`, `ds_2`, …
   - One visualization per panel, keyed `viz_<panel.id>`, with `dataSources.primary` pointing to the matching `ds_N`.
   - Absolute layout structure: grid cells × `GRID_UNIT_W`/`GRID_UNIT_H` (100 × 80 pixels).
4. Writes `dashboard.json` at the workspace root.
5. Advances state `designed` → `built`.

## How to invoke

```bash
PYTHONPATH=<repo-root>/plugins/splunk-dashboards/src \
python3 -m splunk_dashboards.create build <project-name> \
  --title "<dashboard title>" \
  --description "<optional description>"
```

The `title` becomes the dashboard's top-level title (shown in the Splunk UI). `description` is optional.

## Output shape

`dashboard.json` matches the Splunk Dashboard Studio (v2) schema:

```json
{
  "title": "...",
  "description": "...",
  "theme": "dark",
  "dataSources": { "ds_1": { "type": "ds.search", "name": "...", "options": { "query": "...", "queryParameters": { "earliest": "...", "latest": "..." } } } },
  "visualizations": { "viz_p1": { "type": "splunk.singlevalue", "title": "...", "dataSources": { "primary": "ds_1" }, "options": {} } },
  "inputs": {},
  "defaults": {},
  "layout": { "type": "absolute", "options": { "width": 1440, "height": 960 }, "structure": [ { "item": "viz_p1", "type": "block", "position": { "x": 0, "y": 0, "w": 600, "h": 320 } } ] }
}
```

For deeper schema details, invoke `ds-syntax`. For per-visualization option fields, invoke `ds-viz`.

## After building

- `dashboard.json` exists at the workspace root.
- `state.json` has `current_stage=built`.
- Next step: `ds-validate` (lint SPL, tokens, drilldowns) before `ds-deploy`.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-create/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-create SKILL.md"
```

---

### Task S1: ds-syntax SKILL.md (parallel with S2)

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-syntax/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-syntax/SKILL.md`:

```markdown
---
name: ds-syntax
description: Reference skill documenting the Splunk Dashboard Studio (v2) JSON schema. Covers top-level keys, dataSources (ds.search, ds.savedSearch, ds.chain), visualizations container shape, inputs and token definitions, defaults, layout structures (absolute, grid), drilldowns, and the XML envelope used for file deployment. Use this skill when authoring or editing Dashboard Studio JSON by hand, when ds-create needs field-level detail, or when answering standalone questions about Dashboard Studio syntax.
---

# ds-syntax — Dashboard Studio JSON reference

## Top-level keys

A Dashboard Studio definition is a JSON object with these keys:

| Key | Type | Required | Purpose |
|---|---|---|---|
| `title` | string | yes | Dashboard title shown in the UI |
| `description` | string | no | Subtitle / description |
| `theme` | string | no | `"light"` or `"dark"` (also settable in the XML envelope) |
| `dataSources` | object | yes | Named searches — see next section |
| `visualizations` | object | yes | Panels, keyed by id |
| `inputs` | object | no | User-facing filters (tokens) |
| `defaults` | object | no | Default token values + global time range |
| `layout` | object | yes | Grid structure placing visualizations on screen |

## dataSources

Each entry is a named search. The three common types:

### `ds.search` (SPL)

```json
"ds_1": {
  "type": "ds.search",
  "name": "Failed Logins by Source",
  "options": {
    "query": "index=auth action=failure | stats count by src",
    "queryParameters": {
      "earliest": "$global_time.earliest$",
      "latest": "$global_time.latest$"
    },
    "refresh": "30s",
    "refreshType": "delay"
  }
}
```

Fields:

- `name` (string, required) — human-readable label shown in the editor.
- `options.query` (string, required) — SPL. Use `\n` for multi-line.
- `options.queryParameters.earliest` / `latest` — absolute string (`-24h`, `now`) or a token reference (`$global_time.earliest$`).
- `options.refresh` — optional auto-refresh interval.
- `options.refreshType` — `"delay"` (wait for completion) or `"interval"` (fixed cadence).

### `ds.savedSearch`

Reference a saved search by name:

```json
"ds_2": {
  "type": "ds.savedSearch",
  "name": "Weekly report",
  "options": { "ref": "Weekly Auth Report" }
}
```

### `ds.chain`

Chain a post-process onto another data source (no extra search dispatch):

```json
"ds_3": {
  "type": "ds.chain",
  "options": {
    "extend": "ds_1",
    "query": "| head 10"
  }
}
```

## visualizations

Each entry is a panel that renders data:

```json
"viz_p1": {
  "type": "splunk.singlevalue",
  "title": "Failed Logins",
  "description": "Last 24 hours",
  "dataSources": { "primary": "ds_1" },
  "options": { "majorColor": "#d13d3d" }
}
```

Fields:

- `type` (required) — one of the built-in types (see `ds-viz` for per-type options).
- `title` / `description` — shown in the panel header.
- `dataSources.primary` — key in `dataSources` that feeds this viz. Some types also accept `dataSources.annotations` or `dataSources.comparison`.
- `options` — per-type configuration object.

## inputs and tokens

`inputs` declares filters the user can manipulate at the top of the dashboard.

```json
"inputs": {
  "input_timerange": {
    "type": "input.timerange",
    "title": "Time range",
    "options": { "token": "global_time", "defaultValue": { "earliest": "-24h", "latest": "now" } }
  },
  "input_index": {
    "type": "input.dropdown",
    "title": "Index",
    "options": {
      "token": "selected_index",
      "items": [
        { "label": "auth", "value": "auth" },
        { "label": "web", "value": "web" }
      ],
      "defaultValue": "auth"
    }
  }
}
```

Reference tokens in SPL as `$token_name$`. For timerange inputs, use `$<token>.earliest$` and `$<token>.latest$`.

## defaults

Top-level defaults (often just a global time range):

```json
"defaults": {
  "dataSources": {
    "global": { "options": { "queryParameters": { "earliest": "-24h", "latest": "now" } } }
  }
}
```

## layout

Two layout types:

### Absolute

Pixel-based positioning. `ds-create` emits this.

```json
"layout": {
  "type": "absolute",
  "options": { "width": 1440, "height": 960 },
  "structure": [
    { "item": "viz_p1", "type": "block", "position": { "x": 0, "y": 0, "w": 600, "h": 320 } }
  ]
}
```

### Grid

Row-oriented, auto-sized columns:

```json
"layout": {
  "type": "grid",
  "structure": [
    { "type": "row", "items": [ { "item": "viz_p1", "width": 50 }, { "item": "viz_p2", "width": 50 } ] }
  ]
}
```

## drilldowns

Per-visualization click-through behavior, declared under `options.drilldown`:

```json
"viz_p1": {
  "type": "splunk.table",
  "options": {
    "drilldown": "all",
    "drilldownTarget": "row",
    "drilldownAction": {
      "type": "link.url",
      "url": "https://example.com/search?q=$row.src$"
    }
  }
}
```

Common actions: `link.url`, `link.dashboard`, `setToken`, `unsetToken`.

## XML envelope (deployment)

For deploying to Splunk, wrap the JSON in XML:

```xml
<dashboard version="2" theme="dark">
  <label>Failed Logins Dashboard</label>
  <description>Monitors auth failures</description>
  <definition><![CDATA[
    { ...JSON definition... }
  ]]></definition>
</dashboard>
```

- `version="2"` marks this as Dashboard Studio (not classic Simple XML).
- `theme` overrides the JSON's `theme`.
- The JSON goes inside `<![CDATA[...]]>`.

## When to use this skill standalone

- "How do I define a dropdown input?" — section `inputs and tokens`.
- "What's the difference between ds.search and ds.chain?" — section `dataSources`.
- "How do drilldowns work?" — section `drilldowns`.

For per-visualization options (e.g., what fields does `splunk.pie` accept?), invoke `ds-viz`.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-syntax/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-syntax reference skill"
```

---

### Task S2: ds-viz SKILL.md (parallel with S1)

**Files:**
- Create: `plugins/splunk-dashboards/skills/ds-viz/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `plugins/splunk-dashboards/skills/ds-viz/SKILL.md`:

```markdown
---
name: ds-viz
description: Reference skill documenting every Splunk Dashboard Studio (v2) visualization type and the options each one accepts. Covers splunk.singlevalue, splunk.line, splunk.column, splunk.bar, splunk.pie, splunk.area, splunk.table, splunk.timeline, splunk.choropleth, splunk.markergauge. Use this skill when picking or configuring a visualization for a panel, when ds-create needs per-type option detail, or when answering standalone questions about viz options.
---

# ds-viz — Visualization reference

Each section covers one Dashboard Studio visualization type: required fields, common options, and a minimal example. All examples show only the contents of the `visualizations.<key>` object.

## splunk.singlevalue

Displays a single number. Best for KPIs.

**Data shape:** one row, one column (use `| stats count` or similar).

**Common options:**

- `majorColor` — hex color for the number
- `sparklineDisplay` — `"off"`, `"above"`, `"below"`
- `unit` — string shown next to the value (e.g., `"ms"`, `"%"`)
- `majorValue` — field name to display (defaults to first numeric column)

```json
{
  "type": "splunk.singlevalue",
  "title": "Failed Logins",
  "dataSources": { "primary": "ds_1" },
  "options": { "majorColor": "#d13d3d", "unit": "" }
}
```

## splunk.line

Line chart. Best for trends over time.

**Data shape:** `_time` + one or more numeric series (usually produced by `| timechart`).

**Common options:**

- `xAxisTitle`, `yAxisTitle` — axis labels
- `yAxisMin`, `yAxisMax` — numeric bounds (auto if omitted)
- `lineWidth` — 1–4
- `showLegend` — boolean

```json
{
  "type": "splunk.line",
  "title": "Latency Trend",
  "dataSources": { "primary": "ds_2" },
  "options": { "showLegend": true, "yAxisTitle": "ms" }
}
```

## splunk.column

Vertical bar chart (categorical x-axis).

**Data shape:** one categorical field + one or more numeric series (e.g., `| stats count by category`).

**Common options:**

- `stackMode` — `"default"`, `"stacked"`, `"stacked100"`
- `showLegend` — boolean

```json
{
  "type": "splunk.column",
  "title": "Counts by Service",
  "dataSources": { "primary": "ds_3" },
  "options": { "stackMode": "default" }
}
```

## splunk.bar

Horizontal bar chart (categorical y-axis). Same data shape and options as `splunk.column`, rotated 90 degrees.

```json
{
  "type": "splunk.bar",
  "title": "Top Source IPs",
  "dataSources": { "primary": "ds_4" },
  "options": {}
}
```

## splunk.pie

Pie chart. Use sparingly — only for a small number of categories (≤ 6).

**Data shape:** one categorical field + one numeric (e.g., `| top limit=5 severity`).

**Common options:**

- `showDonut` — boolean (renders as a donut with a hole)
- `showLabels` — boolean
- `showPercent` — boolean

```json
{
  "type": "splunk.pie",
  "title": "Severity Breakdown",
  "dataSources": { "primary": "ds_5" },
  "options": { "showDonut": true, "showPercent": true }
}
```

## splunk.area

Filled-area time series. Same data shape as `splunk.line`; use for cumulative / stacked visuals.

**Common options:**

- `stackMode` — `"default"`, `"stacked"`, `"stacked100"`
- `opacity` — 0.0–1.0

```json
{
  "type": "splunk.area",
  "title": "Throughput by Service",
  "dataSources": { "primary": "ds_6" },
  "options": { "stackMode": "stacked" }
}
```

## splunk.table

Tabular display of all returned columns.

**Data shape:** any tabular result.

**Common options:**

- `rowNumbers` — boolean
- `columnFormat` — object keyed by column name for per-column formatting
- `drilldown` — `"row"` / `"cell"` / `"none"` (see `ds-syntax` for drilldown details)

```json
{
  "type": "splunk.table",
  "title": "Slowest Endpoints",
  "dataSources": { "primary": "ds_7" },
  "options": { "rowNumbers": true, "drilldown": "row" }
}
```

## splunk.timeline

Shows discrete events on a timeline. Useful for incident overlays.

**Data shape:** `_time` + `label` (or equivalent).

**Common options:**

- `axisTitle` — timeline axis label
- `colorField` — field whose value drives per-event color

```json
{
  "type": "splunk.timeline",
  "title": "Deploy Markers",
  "dataSources": { "primary": "ds_8" },
  "options": { "colorField": "env" }
}
```

## splunk.choropleth

Geographic heatmap.

**Data shape:** a geographic key (e.g., `country`, `featureIdField` value) + a numeric.

**Common options:**

- `map` — base map (e.g., `"world"`, `"us"`)
- `featureIdField` — field in the data that matches the map's feature id

```json
{
  "type": "splunk.choropleth",
  "title": "Attacks by Country",
  "dataSources": { "primary": "ds_9" },
  "options": { "map": "world", "featureIdField": "country" }
}
```

## splunk.markergauge

Gauge with a needle/marker. Good for SLA indicators.

**Data shape:** one row, one numeric.

**Common options:**

- `min`, `max` — gauge range
- `majorColor` — color of the needle
- `ranges` — array of threshold bands (`[{ "value": 95, "color": "#ff0" }, ...]`)

```json
{
  "type": "splunk.markergauge",
  "title": "p95 Latency",
  "dataSources": { "primary": "ds_10" },
  "options": { "min": 0, "max": 1000, "ranges": [ { "value": 500, "color": "#f90" }, { "value": 1000, "color": "#d00" } ] }
}
```

## Picking a viz type

| Question shape | Recommended viz |
|---|---|
| "What's the current <metric>?" | `splunk.singlevalue` |
| "How has <metric> changed over time?" | `splunk.line` or `splunk.area` |
| "Top N <thing> by <metric>" | `splunk.bar` (horizontal) or `splunk.column` |
| "Breakdown of <categorical>" | `splunk.pie` (only if ≤ 6 categories) or `splunk.bar` |
| "List of events / rows" | `splunk.table` |
| "When did X events happen?" | `splunk.timeline` |
| "Geographic distribution" | `splunk.choropleth` |
| "Is <metric> above threshold?" | `splunk.markergauge` |
```

- [ ] **Step 2: Commit**

```bash
git add plugins/splunk-dashboards/skills/ds-viz/SKILL.md
git commit -m "feat(splunk-dashboards): add ds-viz reference skill"
```

---

### Task Z1: Pipeline integration test (designed → built)

**Files:**
- Create: `plugins/splunk-dashboards/tests/test_pipeline_build.py`

- [ ] **Step 1: Write the integration test**

Create `plugins/splunk-dashboards/tests/test_pipeline_build.py`:

```python
"""Integration test — full pipeline from init through build."""
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


def test_full_pipeline_through_build(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)

    # 1. ds-init
    r = _run(
        "splunk_dashboards.requirements",
        ["from-json", "-"],
        tmp_path,
        stdin=json.dumps({
            "project": "build-demo",
            "goal": "Full pipeline through build stage",
            "role": "Developer",
            "audience": "Self",
            "focus": "Mixed",
            "questions": ["How many events?"],
            "has_data": "no",
            "indexes": [],
            "customization": "template",
            "nice_to_haves": [],
            "reference_dashboard": None,
        }),
    )
    assert r.returncode == 0, r.stderr

    # 2. ds-mock
    r = _run(
        "splunk_dashboards.data_sources",
        ["write", "-"],
        tmp_path,
        stdin=json.dumps({
            "project": "build-demo",
            "source": "mock",
            "sources": [
                {"question": "How many events?", "spl": "| makeresults count=1 | eval c=42", "earliest": "-24h", "latest": "now", "name": "Event Count"},
            ],
        }),
    )
    assert r.returncode == 0, r.stderr

    # 3. ds-template load (gives us some panels)
    r = _run(
        "splunk_dashboards.templates",
        ["load", "soc-overview", "--project", "build-demo"],
        tmp_path,
    )
    assert r.returncode == 0, r.stderr

    # 4. ds-design — simulate Save & Exit with one panel bound to our question
    server = create_server(project="build-demo", port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        body = json.dumps({
            "project": "build-demo",
            "theme": "dark",
            "panels": [
                {
                    "id": "p1", "title": "Event Count",
                    "x": 0, "y": 0, "w": 6, "h": 4,
                    "viz_type": "splunk.singlevalue",
                    "data_source_ref": "How many events?",
                }
            ],
        }).encode()
        req = urllib.request.Request(
            f"http://{host}:{port}/save",
            data=body, method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 200
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)

    assert load_state("build-demo").current_stage == "designed"

    # 5. ds-create build
    r = _run(
        "splunk_dashboards.create",
        ["build", "build-demo", "--title", "Build Demo", "--description", "End-to-end test"],
        tmp_path,
    )
    assert r.returncode == 0, r.stderr

    # 6. Verify dashboard.json
    ws = tmp_path / ".splunk-dashboards" / "build-demo"
    dashboard = json.loads((ws / "dashboard.json").read_text())
    assert dashboard["title"] == "Build Demo"
    # The panel should be bound to the mock data source
    viz = dashboard["visualizations"]["viz_p1"]
    assert viz["type"] == "splunk.singlevalue"
    assert viz["dataSources"]["primary"] == "ds_1"
    # And ds_1 should have the SPL from the mock source
    assert "makeresults count=1" in dashboard["dataSources"]["ds_1"]["options"]["query"]

    # 7. State advanced to 'built'
    state = load_state("build-demo")
    assert state.current_stage == "built"
    assert "designed" in state.stages_completed
```

- [ ] **Step 2: Run the test**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_pipeline_build.py -v
```

Expected: 1 passed.

Full suite:

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: **67 passed** (57 prior + 8 builder/CLI + 1 build pipeline = 66. Hmm, recount: 57 + 8 = 65, + 1 = 66. Wait.)

Recount precisely:
- Prior: 57
- F1 adds: 5 (builder tests)
- F2 adds: 3 (CLI tests)
- Z1 adds: 1 (pipeline)

Total: 57 + 5 + 3 + 1 = **66**.

So expected is 66 passed, not 67. The plan header above says 67 — update the counts: replace "10 new" with "9 new", and "67 tests" with "66 tests". Fix this inline while writing the plan.

- [ ] **Step 3: Commit**

```bash
git add plugins/splunk-dashboards/tests/test_pipeline_build.py
git commit -m "test(splunk-dashboards): add pipeline integration test through build"
```

---

### Task Z2: Final verification + push

- [ ] **Step 1: Run full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -v
```

Expected: **66 passed**, 0 failed.

- [ ] **Step 2: Verify file tree**

```bash
cd plugins/splunk-dashboards
find . -type f -not -path "*/__pycache__/*" -not -path "*/.pytest_cache/*" | sort
```

Expected to include the new files: `src/splunk_dashboards/create.py`, `skills/ds-create/SKILL.md`, `skills/ds-syntax/SKILL.md`, `skills/ds-viz/SKILL.md`, `tests/test_create.py`, `tests/test_pipeline_build.py`.

- [ ] **Step 3: Git log**

```bash
git log --oneline splunk-dashboards-foundation -15
```

Expected: 7 new commits from this sub-plan (F1, F2, F3, S1, S2, Z1, + the plan doc commit).

- [ ] **Step 4: Push and fast-forward main**

```bash
git push
git checkout main
git merge --ff-only splunk-dashboards-foundation
git push origin main
git checkout splunk-dashboards-foundation
```

---

## What this sub-plan delivers

- `create.py` with `build_dashboard(layout, data, title, description)` that emits a complete Dashboard Studio JSON definition. Grid cells become pixels via `GRID_UNIT_W=100`, `GRID_UNIT_H=80`.
- `build` CLI that persists `dashboard.json` and advances state `designed` → `built`.
- Three new skills: `ds-create` (the build workflow), `ds-syntax` (Dashboard Studio JSON reference), `ds-viz` (visualization options reference). `ds-syntax` and `ds-viz` are standalone and can be invoked without a workspace.
- 9 new tests, bringing the total to 66.

Sub-plan 5 (ship stage: `ds-validate`, `ds-deploy`, `ds-update`, `ds-review`) picks up from a workspace at `built`.
