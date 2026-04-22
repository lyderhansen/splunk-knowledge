# splunk-dashboards Sub-plan 7: Builder enrichment

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ds-create` emit production-quality dashboards by adding: a global time-range input so users can filter all panels, a `defaults` block that wires panel queries to that input, optional panel-level drilldown support, and an opt-in grid layout flag.

**Architecture:** Extend `build_dashboard()` in `create.py` with new optional kwargs (`with_time_input: bool = True`, `layout_type: Literal["absolute", "grid"] = "absolute"`). When `with_time_input` is on (default), emit an `input.timerange` keyed `input_global_time` with token `global_time`, plus a `defaults.dataSources.global` block setting `queryParameters.earliest` / `latest` to `$global_time.earliest$` / `$global_time.latest$`. Each panel's earliest/latest that currently hard-codes `-24h`/`now` becomes a token reference. Add a new optional `Panel.drilldown` field in `layout.py` that `build_dashboard` translates into `options.drilldown` + `options.drilldownAction` on the matching visualization. Add `--no-time-input` and `--layout grid|absolute` flags to the build CLI.

**Tech Stack:** Python 3.11+ stdlib. No new deps. All new behavior is opt-out (existing tests that don't pass the new kwargs keep their current shape, but they DO need updating because the default flips to `with_time_input=True` — handle via an explicit `with_time_input=False` in old tests).

---

## File structure

```
plugins/splunk-dashboards/
├── src/splunk_dashboards/
│   ├── create.py                # MODIFIED — new kwargs + emission logic
│   └── layout.py                # MODIFIED — optional drilldown field on Panel
└── tests/
    ├── test_create.py           # MODIFIED — new tests, existing pass with opt-out
    └── test_layout.py           # MODIFIED — drilldown roundtrip test
```

Expected test count after this sub-plan: **85 (prior) + 7 new = 92 tests** (T1: 3, T2: 2, T3: 1, T4: 1).

---

### Task T1: Global time input + defaults block (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_create.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/create.py`

- [ ] **Step 1: Append failing tests**

Append to `plugins/splunk-dashboards/tests/test_create.py`:

```python
def test_build_dashboard_with_time_input_emits_global_time():
    layout = Layout(project="x")
    data = DataSources(project="x", sources=[DataSource(question="q", spl="index=main | stats count")])
    result = build_dashboard(layout, data, title="t", description="", with_time_input=True)
    assert "input_global_time" in result["inputs"]
    tr = result["inputs"]["input_global_time"]
    assert tr["type"] == "input.timerange"
    assert tr["options"]["token"] == "global_time"
    # Defaults block wires panels to the token
    defaults = result["defaults"]["dataSources"]["global"]["options"]["queryParameters"]
    assert defaults["earliest"] == "$global_time.earliest$"
    assert defaults["latest"] == "$global_time.latest$"


def test_build_dashboard_panel_queries_use_token_when_time_input_enabled():
    layout = Layout(project="x")
    data = DataSources(project="x", sources=[
        DataSource(question="q1", spl="| makeresults count=1", earliest="-24h", latest="now"),
    ])
    result = build_dashboard(layout, data, title="t", description="", with_time_input=True)
    qp = result["dataSources"]["ds_1"]["options"]["queryParameters"]
    assert qp["earliest"] == "$global_time.earliest$"
    assert qp["latest"] == "$global_time.latest$"


def test_build_dashboard_without_time_input_keeps_raw_time_strings():
    layout = Layout(project="x")
    data = DataSources(project="x", sources=[DataSource(question="q", spl="q", earliest="-7d", latest="now")])
    result = build_dashboard(layout, data, title="t", description="", with_time_input=False)
    assert result["inputs"] == {}
    assert result["defaults"] == {}
    qp = result["dataSources"]["ds_1"]["options"]["queryParameters"]
    assert qp["earliest"] == "-7d"
    assert qp["latest"] == "now"
```

- [ ] **Step 2: Run — existing tests that check `inputs == {}` and `defaults == {}` and hard-coded `earliest/latest` will break (because the new default is `with_time_input=True`)**

First, update EXISTING tests in `test_create.py` to pass `with_time_input=False` explicitly to keep their current assertions valid:

```python
# In test_build_dashboard_empty_layout_returns_skeleton (and any test that asserts inputs == {} or earliest == "-24h"):
result = build_dashboard(layout, data, title="My Dash", description="desc", with_time_input=False)
```

Find all the existing `build_dashboard(...)` calls in `test_create.py` that don't set `with_time_input` and add `with_time_input=False` so they keep passing. Do NOT modify new tests (T1, T2, T3) — they explicitly test the new default.

Then run:

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_create.py -v
```

Expected: the 3 new tests fail (signature doesn't accept the kwarg yet).

- [ ] **Step 3: Implement in `create.py`**

Modify `build_dashboard` signature in `plugins/splunk-dashboards/src/splunk_dashboards/create.py`:

```python
def build_dashboard(
    layout: Layout,
    data: DataSources,
    title: str,
    description: str,
    with_time_input: bool = True,
) -> dict:
    """Build a Splunk Dashboard Studio JSON definition from a Layout + DataSources."""
    ds_map: dict = {}
    question_to_key: dict = {}
    for idx, source in enumerate(data.sources, start=1):
        key = f"ds_{idx}"
        earliest = "$global_time.earliest$" if with_time_input else source.earliest
        latest = "$global_time.latest$" if with_time_input else source.latest
        ds_map[key] = {
            "type": "ds.search",
            "name": source.name or source.question,
            "options": {
                "query": source.spl,
                "queryParameters": {"earliest": earliest, "latest": latest},
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

    inputs: dict = {}
    defaults: dict = {}
    if with_time_input:
        inputs["input_global_time"] = {
            "type": "input.timerange",
            "title": "Time range",
            "options": {
                "token": "global_time",
                "defaultValue": {"earliest": "-24h", "latest": "now"},
            },
        }
        defaults["dataSources"] = {
            "global": {
                "options": {
                    "queryParameters": {
                        "earliest": "$global_time.earliest$",
                        "latest": "$global_time.latest$",
                    }
                }
            }
        }

    return {
        "title": title,
        "description": description,
        "theme": layout.theme,
        "dataSources": ds_map,
        "visualizations": visualizations,
        "inputs": inputs,
        "defaults": defaults,
        "layout": {
            "type": "absolute",
            "options": {"width": 1440, "height": 960},
            "structure": structure,
        },
    }
```

- [ ] **Step 4: Run**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_create.py -v
```

Expected: 11 passed (8 prior + 3 new).

Full suite:

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: **88 passed**.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/create.py plugins/splunk-dashboards/tests/test_create.py
git commit -m "feat(splunk-dashboards): emit global time input + defaults in ds-create"
```

---

### Task T2: Panel drilldowns (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_layout.py`
- Modify: `plugins/splunk-dashboards/tests/test_create.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/layout.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/create.py`

- [ ] **Step 1: Add failing test for Panel roundtrip with drilldown**

Append to `plugins/splunk-dashboards/tests/test_layout.py`:

```python
def test_panel_with_drilldown_roundtrip():
    p = Panel(
        id="p1",
        title="T",
        drilldown={"type": "link.dashboard", "dashboard": "target_dash"},
    )
    data = p.to_dict()
    restored = Panel.from_dict(data)
    assert restored == p
```

- [ ] **Step 2: Update Panel dataclass**

In `plugins/splunk-dashboards/src/splunk_dashboards/layout.py`, add `drilldown: Optional[dict] = None` field to `Panel`:

```python
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
    drilldown: Optional[dict] = None  # NEW

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "Panel":
        return cls(**data)
```

- [ ] **Step 3: Add failing test in test_create.py**

```python
def test_build_dashboard_emits_drilldown_when_panel_has_one():
    layout = Layout(project="x", panels=[
        Panel(
            id="p1", title="T", viz_type="splunk.table",
            drilldown={"type": "link.dashboard", "dashboard": "other"},
        )
    ])
    data = DataSources(project="x")
    result = build_dashboard(layout, data, title="t", description="", with_time_input=False)
    viz = result["visualizations"]["viz_p1"]
    assert viz["options"]["drilldown"] == "all"
    assert viz["options"]["drilldownAction"] == {"type": "link.dashboard", "dashboard": "other"}
```

- [ ] **Step 4: Run — tests fail**

```bash
cd plugins/splunk-dashboards
python3 -m pytest tests/test_layout.py tests/test_create.py -v
```

- [ ] **Step 5: Update `build_dashboard` to emit drilldowns**

In `create.py`, inside the panel loop after the `visualizations[viz_key]` assignment:

```python
        if panel.drilldown:
            visualizations[viz_key]["options"]["drilldown"] = "all"
            visualizations[viz_key]["options"]["drilldownAction"] = panel.drilldown
```

- [ ] **Step 6: Run — expect pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: **90 passed**.

- [ ] **Step 7: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/layout.py plugins/splunk-dashboards/src/splunk_dashboards/create.py plugins/splunk-dashboards/tests/test_layout.py plugins/splunk-dashboards/tests/test_create.py
git commit -m "feat(splunk-dashboards): emit panel drilldowns when Panel.drilldown is set"
```

---

### Task T3: Grid layout option (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_create.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/create.py`

- [ ] **Step 1: Append failing test**

```python
def test_build_dashboard_grid_layout_emits_row_structure():
    layout = Layout(project="x", panels=[
        Panel(id="p1", title="A", x=0, y=0, w=6, h=4),
        Panel(id="p2", title="B", x=6, y=0, w=6, h=4),
        Panel(id="p3", title="C", x=0, y=4, w=12, h=4),
    ])
    data = DataSources(project="x")
    result = build_dashboard(layout, data, title="t", description="", with_time_input=False, layout_type="grid")
    assert result["layout"]["type"] == "grid"
    structure = result["layout"]["structure"]
    # Each row is a {"type": "row", "items": [...]}. Panels at the same y share a row.
    assert len(structure) == 2  # two rows (y=0 and y=4)
    assert structure[0]["type"] == "row"
    first_row_items = [it["item"] for it in structure[0]["items"]]
    assert "viz_p1" in first_row_items
    assert "viz_p2" in first_row_items
    # Second row has a single panel at y=4
    second_row_items = [it["item"] for it in structure[1]["items"]]
    assert second_row_items == ["viz_p3"]
```

- [ ] **Step 2: Run — test fails**

- [ ] **Step 3: Update build_dashboard**

Extend the signature:

```python
def build_dashboard(
    layout: Layout,
    data: DataSources,
    title: str,
    description: str,
    with_time_input: bool = True,
    layout_type: str = "absolute",
) -> dict:
```

Replace the layout emission at the bottom with:

```python
    if layout_type == "grid":
        # Group panels by y coordinate. Each unique y becomes a row.
        rows: dict = {}
        for panel in layout.panels:
            rows.setdefault(panel.y, []).append(panel)
        grid_structure = []
        for y in sorted(rows.keys()):
            row_panels = sorted(rows[y], key=lambda p: p.x)
            total_width = sum(p.w for p in row_panels) or 1
            grid_structure.append({
                "type": "row",
                "items": [
                    {"item": f"viz_{p.id}", "width": int(p.w / total_width * 100)}
                    for p in row_panels
                ],
            })
        layout_block = {"type": "grid", "structure": grid_structure}
    else:
        layout_block = {
            "type": "absolute",
            "options": {"width": 1440, "height": 960},
            "structure": structure,
        }

    return {
        "title": title,
        "description": description,
        "theme": layout.theme,
        "dataSources": ds_map,
        "visualizations": visualizations,
        "inputs": inputs,
        "defaults": defaults,
        "layout": layout_block,
    }
```

- [ ] **Step 4: Run — expect pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: **91 passed**.

- [ ] **Step 5: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/create.py plugins/splunk-dashboards/tests/test_create.py
git commit -m "feat(splunk-dashboards): add grid layout option to ds-create"
```

---

### Task T4: CLI flags + SKILL.md update (TDD)

**Files:**
- Modify: `plugins/splunk-dashboards/tests/test_create.py`
- Modify: `plugins/splunk-dashboards/src/splunk_dashboards/create.py`
- Modify: `plugins/splunk-dashboards/skills/ds-create/SKILL.md`

- [ ] **Step 1: Append failing CLI test**

```python
def test_cli_build_grid_layout_flag(tmp_path, monkeypatch):
    _prepare_workspace_at_designed(tmp_path, monkeypatch)
    result = _run_cli(
        ["build", "my-dash", "--title", "T", "--description", "", "--layout", "grid", "--no-time-input"],
        cwd=tmp_path,
    )
    assert result.returncode == 0, result.stderr
    dashboard = json.loads((tmp_path / ".splunk-dashboards" / "my-dash" / "dashboard.json").read_text())
    assert dashboard["layout"]["type"] == "grid"
    assert dashboard["inputs"] == {}
```

- [ ] **Step 2: Run — fails (flags don't exist yet)**

- [ ] **Step 3: Update the CLI**

In `create.py`, update `_cli`:

```python
    build.add_argument("--no-time-input", action="store_true",
                       help="Omit the global time-range input and defaults block")
    build.add_argument("--layout", choices=["absolute", "grid"], default="absolute",
                       help="Layout type (default: absolute)")
```

And in the build branch:

```python
        dashboard = build_dashboard(
            layout, data,
            title=args.title,
            description=args.description,
            with_time_input=not args.no_time_input,
            layout_type=args.layout,
        )
```

- [ ] **Step 4: Run — expect pass**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: **92 passed**.

- [ ] **Step 5: Update ds-create SKILL.md**

Append a "New: global time input, drilldowns, grid layout" subsection to `plugins/splunk-dashboards/skills/ds-create/SKILL.md` describing the new flags:

- `--no-time-input` omits the global time filter (useful when embedding).
- `--layout grid` emits a grid layout instead of absolute positioning.
- Panels can carry a `drilldown` field in `layout.json` which becomes the viz's `drilldownAction`.

- [ ] **Step 6: Commit**

```bash
git add plugins/splunk-dashboards/src/splunk_dashboards/create.py plugins/splunk-dashboards/tests/test_create.py plugins/splunk-dashboards/skills/ds-create/SKILL.md
git commit -m "feat(splunk-dashboards): add --no-time-input and --layout grid CLI flags"
```

---

### Task Z: Final verification + push

- [ ] **Step 1: Full suite**

```bash
cd plugins/splunk-dashboards
python3 -m pytest -q
```

Expected: **92 passed**, 0 failed.

- [ ] **Step 2: Push**

```bash
git push
git checkout main
git merge --ff-only splunk-dashboards-foundation
git push origin main
git checkout splunk-dashboards-foundation
```

---

## What this sub-plan delivers

- `ds-create` dashboards now include a working global time-range input wired into every panel query via tokens.
- Panels can carry drilldown metadata that becomes real click-through behavior in the rendered dashboard.
- `--layout grid` option produces responsive, row-based layouts.
- 7 new tests. Total: 92.
