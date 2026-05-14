# Coding Conventions

**Analysis Date:** 2026-05-14

## Overview

This repo has two distinct code layers with their own conventions:

1. **Python** — `plugins/splunk-dashboard-studio/src/` — the plugin runtime library
2. **JavaScript (ES5)** — `test*/*/shared/theme.js` and `test*/*/appserver/static/visualizations/*/src/visualization_source.js` — Splunk custom viz code

---

## Python Conventions

### Naming Patterns

**Files:**
- `snake_case.py` — all module files use snake_case (e.g., `data_sources.py`, `workspace.py`)
- Prefix `test_` for test files (e.g., `test_validate.py`, `test_pipeline_build.py`)
- Internal helpers prefixed with `_` (e.g., `_cli`, `_collect_declared_tokens`, `_data_sources_path`)

**Classes:**
- `PascalCase` for domain model classes and exceptions
- Examples: `WorkspaceState`, `DataSource`, `DataSources`, `Layout`, `Panel`, `Finding`, `Requirements`
- Custom exception classes: `InvalidStageTransition`, `StageAdvanceError`

**Functions:**
- `snake_case` for all public functions
- `_snake_case` prefix for private/internal helpers
- Consistent verb prefixes: `check_*` for validators, `build_*` for constructors, `handle_*` for HTTP handlers, `save_*`/`load_*` for I/O, `init_*` for setup
- CLI entry point always named `_cli(argv=None) -> int`

**Variables:**
- `snake_case` throughout
- Type-aliased literals use `PascalCase`: `Severity`, `HasData`, `Customization`, `Source`, `Theme`
- Constants: `UPPER_SNAKE_CASE` (e.g., `STAGES`, `GRID_UNIT_W`, `WORKSPACE_ROOT`, `BUILT_IN_TOKENS`)

**Type Annotations:**
- Full type annotations on all public functions (`-> return_type`)
- `from __future__ import annotations` at top of every source module
- `Optional[T]` for nullable fields (imported from `typing`)
- `list[T]` and `dict` as built-in generics (Python 3.11+)
- `Literal["a", "b"]` used to define constrained string types

### Module Structure Pattern

Every source module follows this layout:
```python
"""Module docstring — one-line purpose statement."""
from __future__ import annotations

# stdlib imports
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal, Optional

# cross-module constants / types

# dataclass models with to_dict() / from_dict() classmethods

# pure functions (business logic)

# I/O functions (save_*/load_*)

# CLI section — late imports, then _cli() function
import sys as _sys  # note: late imports aliased with underscore

if __name__ == "__main__":
    _sys.exit(_cli())
```

Key pattern: stdlib imports for CLI entry points are **deferred** to a local import block inside `_cli()` or at the bottom of the module, aliased with `_` prefix (e.g., `import sys as _sys`, `import json as _json`). This avoids circular imports and keeps the module testable in isolation.

### Data Model Pattern

All domain models use `@dataclass` with explicit `to_dict()` / `from_dict()` methods:

```python
@dataclass
class Panel:
    id: str
    title: str
    x: int = 0
    viz_type: str = "splunk.singlevalue"
    data_source_ref: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "Panel":
        return cls(**data)
```

Do NOT use `json.dumps(dataclass_instance)` directly — always call `.to_dict()` first. Roundtrip fidelity (serialize → deserialize == original) is verified by tests for every model.

### Error Handling

**Patterns:**
- Raise domain-specific exception subclasses, never bare `Exception`: `InvalidStageTransition`, `StageAdvanceError`
- Use `FileNotFoundError` for missing workspace/file conditions (stdlib, not custom)
- HTTP handlers return `(status: int, body: str)` tuples — they do NOT raise; callers check status
- CLI functions return integer exit codes (0 = success, non-zero = failure), print errors to `stderr`
- Validators return `list[Finding]` — no exceptions raised; empty list = clean

**Exception chaining pattern:**
```python
except InvalidStageTransition as e:
    raise StageAdvanceError(str(e)) from e
```

**JSON parse errors:**
```python
try:
    payload = json.loads(body)
except json.JSONDecodeError as e:
    return 400, f"Invalid JSON: {e}"
```

### Import Organization

**Order:**
1. `from __future__ import annotations` (always first)
2. stdlib imports (alphabetical within group)
3. intra-package imports (`from splunk_dashboards.workspace import ...`)
4. Deferred late imports at module bottom (CLI-only deps, aliased with `_`)

**No third-party deps** in the source package — stdlib only (`json`, `pathlib`, `dataclasses`, `re`, `tarfile`, `http.server`, `threading`).

### Logging

No logging framework. Use `print()` to stdout for success output, `print(..., file=sys.stderr)` for errors. No log levels.

### Comments

**Module-level docstrings:** Every module has a one-line `"""Purpose statement."""` docstring.

**Function docstrings:** Public functions that return non-obvious values document the return shape:
```python
def handle_get_layout(project: str) -> tuple[int, str]:
    """Returns (status, body) for GET /api/layout."""
```

**Inline comments:** Used for non-obvious algorithmic choices, especially in `validate.py` for Splunk-specific edge cases. Test functions use comments to label pipeline steps numerically (`# 1. ds-init`, `# 2. ds-mock`, etc.).

---

## JavaScript (Viz Pack) Conventions

All viz pack JavaScript is **ES5 strict** — no `const`/`let`, no arrow functions, no template literals, no classes. The `validate_viz.sh` script enforces this with a build-time check (`FAIL F3`).

### Naming Patterns

**Files:**
- `visualization_source.js` — canonical source file for each viz
- `visualization.js` — AMD bundle output (generated, not edited)
- `shared/theme.js` — brand-specific design token module (one per viz pack app)

**Functions:**
- `camelCase` for all functions: `safeStr`, `safeNum`, `detectTheme`, `hexFromSplunk`, `withAlpha`, `lerpColor`, `roundRect`, `drawPanel`
- Verb prefix pattern: `draw*` for canvas rendering, `parse*` for parsing, `fmt*` for formatting, `get*` for lookups

**Variables:**
- `var` declarations only (no `const`/`let`)
- Theme objects: `DARK`, `LIGHT` (UPPER_SNAKE_CASE)
- Font config: `FONTS` (UPPER_SNAKE_CASE)

**Theme module structure** (every viz pack has one `shared/theme.js`):
```javascript
var DARK = { name: 'dark', bg: '...', panel: '...', text: '...', ... };
var LIGHT = { name: 'light', bg: '...', panel: '...', text: '...', ... };

function getTheme(name) { return (name === 'light') ? LIGHT : DARK; }
var FONTS = { data: '...', ui: '...' };

// Utility functions: withAlpha, lerpColor, clamp01, severityColor, fmtNum
// Canvas helpers: roundRect, drawPanel, drawHGrid
// Parse helpers: parseColors, parseInts

module.exports = { getTheme, withAlpha, ..., FONTS };
```

### Formatter Conventions

Each viz has a `formatter.html` that MUST:
- Use `{{VIZ_NAMESPACE}}` (not hardcoded namespace) in all `name=` attributes — enforced by `FAIL B10`
- Use `value=` (not `default=`) on form controls — enforced by `FAIL B7`
- Use `type="custom"` on `<splunk-color-picker>` — enforced by `FAIL B5`
- Set `themeMode` default to `"auto"` (not `"dark"`) — enforced by `FAIL B20`
- Include `section-label=` on every `<form>` — enforced by `FAIL B5`

### Canvas Viz Pattern

All custom vizs extend `SplunkVisualizationBase`:
```javascript
module.exports = SplunkVisualizationBase.extend({
    initialize: function() { /* create canvas + tooltip DOM elements, call theme.loadFonts() */ },
    getInitialDataParams: function() { return { outputMode: ROW_MAJOR_OUTPUT_MODE, count: 10000 }; },
    formatData: function(data) { /* return null or parsed data, cache in this._lastGoodData */ },
    updateView: function(data, config) { /* resize canvas, get theme, draw */ },
    getConfig: function() { /* return formatted config from formatter */ }
});
```

**Required patterns in every viz:**
- `detectTheme()` call inside `updateView` — enforced by `FAIL B20`
- Null guards on all data fields using `safeStr(val)` / `safeNum(val, fallback)` — enforced by `FAIL B21`
- `this._lastGoodData` cache to preserve last valid render on empty updates
- Store field names in `this._fieldName` during `updateView` for use in event handlers (`_onClick`, `_onMouseMove`)

### Build Validation

The build pipeline enforces conventions automatically. All new vizs must pass `validate_viz.sh` before packaging. See `plugins/splunk-viz-packs/skills/vp-create/scripts/validate_viz.sh` for the full list of checks.

---

## SKILL.md Conventions

Skill definition files follow a YAML front-matter + Markdown body pattern:

```yaml
---
name: skill-name
description: "One sentence about what this skill does."
when_to_use: "Trigger phrases that activate this skill."
disable-model-invocation: true
allowed-tools: Bash(node *) Bash(tar *)
model: sonnet
---
```

- All SKILL.md files are written in **English** (repo-wide requirement per CLAUDE.md)
- Workflow sections use a checkbox task list for progress tracking
- Code examples are complete and runnable — no pseudocode

---

*Convention analysis: 2026-05-14*
