# Testing Patterns

**Analysis Date:** 2026-05-14

## Test Framework

**Runner:**
- pytest
- Config: `plugins/splunk-dashboard-studio/pyproject.toml` (`[tool.pytest.ini_options]`)
- `testpaths = ["tests"]`, `python_files = ["test_*.py"]`
- Requires Python 3.11+

**Assertion Library:**
- pytest built-in `assert` — no third-party matchers

**Run Commands:**
```bash
cd plugins/splunk-dashboard-studio
python -m pytest                    # Run all tests
python -m pytest tests/test_validate.py  # Single file
python -m pytest -v                 # Verbose output
```

No coverage configuration is present. No watch mode is configured.

---

## Test File Organization

**Location:**
- Separate `tests/` directory under `plugins/splunk-dashboard-studio/tests/`
- All test files are flat in that directory — no subdirectories
- No co-location with source files

**Naming:**
- `test_<module>.py` for unit tests matching a source module (e.g., `test_validate.py` → `validate.py`)
- `test_pipeline_<stage>.py` for integration tests spanning multiple modules (e.g., `test_pipeline_build.py`)
- `test_<cli>_cli.py` for CLI integration tests (e.g., `test_ds_init_cli.py`)

**Structure:**
```
plugins/splunk-dashboard-studio/tests/
├── __init__.py
├── test_create.py           # unit + CLI tests for create.py
├── test_data_sources.py     # unit + CLI tests for data_sources.py
├── test_deploy.py           # unit tests for deploy.py
├── test_design.py           # unit + HTTP server tests for design.py
├── test_ds_init_cli.py      # integration — ds-init CLI end-to-end
├── test_layout.py           # unit + CLI tests for layout.py
├── test_pipeline_build.py   # integration — init → mock → design → build
├── test_pipeline_data.py    # integration — init → mock pipeline
├── test_pipeline_design.py  # integration — init → mock → design (HTTP)
├── test_pipeline_ship.py    # integration — through deploy/ship
├── test_requirements.py     # unit tests for requirements.py
├── test_validate.py         # unit + CLI tests for validate.py
└── test_workspace.py        # unit + CLI tests for workspace.py
```

---

## Test Structure

**Module-level docstring on every test file:**
```python
"""Tests for validate module (lint checks + CLI)."""
```

**Path setup (in every test file):**
```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
```

**Test function naming:**
- `test_<thing>_<condition>` — describes the subject and the state being tested
- Example: `test_threshold_buckets_overlap_in_context_flagged`, `test_advance_stage_rejects_skipping`
- Positive cases: `test_*_passes`, `test_*_roundtrip`, `test_*_defaults`
- Negative cases: `test_*_flagged`, `test_*_raises`, `test_*_rejects_*`

**Suite structure:** Functions are grouped conceptually within a file but without `class`-based grouping. Tests for the same subject (e.g., all `check_threshold_buckets` tests) are placed adjacent.

**No fixtures defined** — no `conftest.py` exists. All setup is inline using pytest built-ins.

---

## Mocking

**Framework:** No mocking library. No `unittest.mock`, no `pytest-mock`.

**Pattern:** Isolation is achieved through:
1. `monkeypatch.chdir(tmp_path)` — redirects filesystem operations to a temp directory
2. `tmp_path` fixture — creates an isolated temp directory per test
3. Real function calls with real filesystem I/O against temp dirs

**No external service mocking.** The codebase has no network calls in the Python library (the deploy module builds tarballs but does not call Splunk APIs).

**What to isolate:**
- Always use `monkeypatch.chdir(tmp_path)` before calling any function that reads `Path.cwd()` — this includes `init_workspace`, `load_state`, `save_state`, and all workspace operations
- `tmp_path` is sufficient for tests that pass `cwd` explicitly to workspace functions

**What NOT to mock:**
- `json` parsing — test with real JSON strings
- `Path` operations — test against real tmp filesystem
- Module functions under test — always call real implementations

---

## Fixtures and Factories

**No pytest fixtures.** All setup is done through helper functions defined in the test file itself.

**Helper function pattern — workspace setup:**
```python
def _prepare_workspace_at_built(tmp_path, monkeypatch, dashboard: dict, project="my-dash"):
    monkeypatch.chdir(tmp_path)
    state = init_workspace(project, autopilot=False)
    for stage in ("data-ready", "designed", "built"):
        advance_stage(state, stage)
    save_state(state)
    (get_workspace_dir(project) / "dashboard.json").write_text(json.dumps(dashboard), encoding="utf-8")
```

- Helpers are prefixed with `_` and accept `tmp_path` + `monkeypatch`
- They advance the workspace to a specific stage so tests can start from the right precondition
- Stage names: `"scoped"` → `"data-ready"` → `"designed"` → `"built"` → `"validated"` → `"deployed"` → `"reviewed"`

**Dashboard factory for validate tests:**
```python
def _sample_dashboard(**overrides) -> dict:
    d = {
        "title": "t",
        "dataSources": {"ds_1": {"type": "ds.search", "name": "Search 1", ...}},
        "visualizations": {"viz_p1": {"type": "splunk.singlevalue", ...}},
        "layout": {...},
        ...
    }
    d.update(overrides)
    return d
```

Used throughout `test_validate.py` — pass `**overrides` to mutate specific fields without rebuilding the whole structure.

**CLI runner helper** (repeated in each test file):
```python
def _run_cli(args, cwd):
    env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent / "src")}
    return subprocess.run(
        [sys.executable, "-m", "splunk_dashboards.<module>", *args],
        cwd=cwd,
        env=env,
        capture_output=True,
        text=True,
    )
```

Multi-module integration tests use a generalised `_run(module, args, cwd, stdin=None)` that takes the module name as a string parameter.

---

## Coverage

**Requirements:** None enforced. No `--cov` configuration in `pyproject.toml`.

**View Coverage:**
```bash
cd plugins/splunk-dashboard-studio
python -m pytest --cov=splunk_dashboards --cov-report=term-missing
```

(requires `pytest-cov` install)

---

## Test Types

**Unit Tests:**
- Scope: single function or class method in isolation
- Use real objects (no mocks), real filesystem via `tmp_path`/`monkeypatch`
- Examples: `test_workspace.py`, `test_layout.py`, `test_requirements.py`, `test_validate.py`
- Pattern: one assertion group per test function; test functions are short (5–20 lines)

**CLI Integration Tests:**
- Scope: invoke the module as `python -m splunk_dashboards.<module>` via `subprocess`
- Check `returncode`, check filesystem side-effects, check `load_state()` afterwards
- Examples: `test_ds_init_cli.py`, CLI sections inside `test_validate.py`, `test_create.py`

**Pipeline Integration Tests:**
- Scope: chain multiple CLI modules end-to-end across a full pipeline stage sequence
- Use a real HTTP server (`create_server`) with a background daemon thread for design-stage tests
- Examples: `test_pipeline_data.py`, `test_pipeline_design.py`, `test_pipeline_build.py`, `test_pipeline_ship.py`
- Always shut down HTTP server in `finally` block and call `thread.join(timeout=2)`

**HTTP Server Tests (in `test_design.py`):**
- Start server on port `0` (OS assigns free port), retrieve assigned port from `server.server_address`
- Run `server.serve_forever()` in a daemon thread
- Use `urllib.request` (stdlib) for HTTP calls — no `requests` or `httpx`
- Always `server.shutdown()` + `server.server_close()` + `thread.join()` in `finally`

---

## Common Patterns

**Roundtrip serialization test:**
```python
def test_panel_to_dict_roundtrip():
    p = Panel(id="p2", title="Logins Over Time", x=6, y=0, w=6, h=4, viz_type="splunk.line")
    data = p.to_dict()
    restored = Panel.from_dict(data)
    assert restored == p
```

**Error-raising test:**
```python
def test_advance_stage_rejects_skipping(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    state = init_workspace("my-dash", autopilot=False)
    with pytest.raises(InvalidStageTransition):
        advance_stage(state, "built")  # skips data-ready and designed
```

**Validator returning findings (positive case):**
```python
def test_timerange_default_value_object_form_flagged():
    d = {"inputs": {"input_time": {"type": "input.timerange", "options": {"token": "t", "defaultValue": {"earliest": "-24h"}}}}}
    findings = check_timerange_default_value(d)
    assert len(findings) == 1
    assert findings[0].severity == "error"
    assert findings[0].code == "timerange-defaultvalue-not-string"
```

**Validator clean-pass test:**
```python
def test_timerange_default_value_string_form_passes():
    d = {"inputs": {"input_time": {"type": "input.timerange", "options": {"token": "t", "defaultValue": "-24h,now"}}}}
    assert check_timerange_default_value(d) == []
```

**CLI exit code + state check:**
```python
def test_cli_check_passes_clean_dashboard_and_advances_stage(tmp_path, monkeypatch):
    _prepare_workspace_at_built(tmp_path, monkeypatch, _sample_dashboard())
    result = _run_cli(["check", "my-dash"], cwd=tmp_path)
    assert result.returncode == 0, result.stderr
    state = load_state("my-dash")
    assert state.current_stage == "validated"
```

**HTTP server integration test shape:**
```python
def test_server_serves_get_layout_and_accepts_post_save(tmp_path, monkeypatch):
    _prepare_workspace_at_data_ready(tmp_path, monkeypatch)
    server = create_server(project="my-dash", port=0)
    host, port = server.server_address
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with urllib.request.urlopen(f"http://{host}:{port}/api/layout", timeout=5) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode())
            assert data["panels"] == []
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
```

---

## What Is NOT Tested

- **JavaScript viz code** — no automated JS tests exist; the `validate_viz.sh` shell script performs static checks (ES5 compliance, formatter rules) but is not a test suite
- **Splunk API calls** — no tests for actual Splunk deployment; the deploy module builds XML/tarballs only
- **splunk-spl plugin** — the `plugins/splunk-spl/` plugin has no test directory
- **splunk-viz-packs plugin** — no automated tests; validated via `vp-create/scripts/validate_viz.sh` and manual QA
- **Scripts** (`scripts/build-admin-conf-refs.py`, `scripts/generate_splunk_admin_conf_refs.py`) — standalone scripts, no test coverage

---

*Testing analysis: 2026-05-14*
