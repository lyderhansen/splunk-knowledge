#!/usr/bin/env python3
"""Audit Dashboard Studio JSON files for illegal `dataSource.name` values.

Usage:
    python3 audit_data_source_names.py [path ...]

If no path is given, walks the workspace's `plugins/splunk-dashboards/skills/`
tree. Each path argument may be a `.json` file or a directory (walked
recursively for `*.json`).

Rule under test (per Splunk Dashboard Studio editor):

    `dataSource.name` (the user-facing "Data source name" field)
    must match `^[A-Za-z0-9 \\-_.]+$`.
    Allowed: letters, numbers, spaces, dashes, underscores, periods.

This rule applies ONLY to the user-facing `name` field. The JSON object
key (e.g. `"ds_base":`) is an internal ID with looser rules and is not
checked.

Behaviour:
- Reads each JSON file. Files that fail to parse are reported as `parse-error`.
- For every entry under `dataSources` (skipping the `defaults`-block keys
  `ds.search`, `ds.savedSearch`, `ds.chain`, `ds.test`, which are
  type-keyed and not real dataSource entries), checks the `name` value.
- Prints one line per violation: `<file>\t<ds_id>\t<bad_chars>\t<name>`.
- Exit code 0 if no violations, 1 if any.

Pairs with `pipeline/ds-validate` (`dataSource-name-illegal-chars`).

For sanitization helpers (e.g. when wiring this into a fixer), see the
suggestion table in `pipeline/ds-create` SKILL.md.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Iterable

ALLOWED = re.compile(r"^[A-Za-z0-9 \-_.]+$")
SINGLE_CHAR_ALLOWED = re.compile(r"[A-Za-z0-9 \-_.]")

# Keys that appear under `dataSources` in a `defaults` block but are NOT
# dataSource entries (they're type discriminators). Skip them.
DEFAULTS_TYPE_KEYS = {"ds.search", "ds.savedSearch", "ds.chain", "ds.test"}

DEFAULT_ROOTS = [
    Path("plugins/splunk-dashboards/skills"),
]


def find_json_files(paths: Iterable[Path]) -> list[Path]:
    found: list[Path] = []
    for p in paths:
        if p.is_file() and p.suffix == ".json":
            found.append(p)
        elif p.is_dir():
            found.extend(sorted(p.rglob("*.json")))
    return found


def audit_file(path: Path) -> list[tuple[str, str, str]]:
    """Return list of (ds_id, bad_chars, name) tuples for violations."""
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        return [("__parse__", "parse-error", str(e))]
    except OSError as e:
        return [("__io__", "io-error", str(e))]

    ds = data.get("dataSources")
    if not isinstance(ds, dict):
        return []

    violations: list[tuple[str, str, str]] = []
    for ds_id, ds_def in ds.items():
        if ds_id in DEFAULTS_TYPE_KEYS:
            continue
        if not isinstance(ds_def, dict):
            continue
        name = ds_def.get("name")
        if name is None or not isinstance(name, str):
            continue
        if ALLOWED.match(name):
            continue
        bad = "".join(sorted({c for c in name if not SINGLE_CHAR_ALLOWED.match(c)}))
        violations.append((ds_id, bad, name))
    return violations


def main(argv: list[str]) -> int:
    if argv[1:]:
        roots = [Path(a) for a in argv[1:]]
    else:
        roots = DEFAULT_ROOTS

    files = find_json_files(roots)
    total_violations = 0
    files_with_violations = 0

    for path in files:
        rows = audit_file(path)
        if not rows:
            continue
        files_with_violations += 1
        for ds_id, bad_chars, name in rows:
            total_violations += 1
            print(f"{path}\t{ds_id}\t{bad_chars}\t{name}")

    if total_violations == 0:
        print(f"\nOK: {len(files)} files scanned, no violations.", file=sys.stderr)
        return 0

    print(
        f"\n{total_violations} violation(s) across {files_with_violations} "
        f"file(s) (of {len(files)} scanned).",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
