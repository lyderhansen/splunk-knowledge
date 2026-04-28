#!/usr/bin/env python3
"""Sanitize Dashboard Studio JSON files so every `dataSource.name` matches
the Splunk Studio editor regex `^[A-Za-z0-9 \\-_.]+$`.

Usage:
    python3 sanitize_data_source_names.py [path ...]
    python3 sanitize_data_source_names.py --dry-run [path ...]

If no path is given, walks the workspace's `plugins/splunk-dashboards/skills/`
tree. Each path argument may be a `.json` file or a directory (walked
recursively for `*.json`).

Pairs with `audit_data_source_names.py` (run that first to scope the
problem) and the sanitization table in `pipeline/ds-create` SKILL.md
(rows below mirror that table).

Sanitization rules (verbatim from `pipeline/ds-create` SKILL.md):

| Found                                              | Replace with                |
|----------------------------------------------------|-----------------------------|
| `?` `!` `"` `'` smart quotes                       | drop                        |
| `/` `:` `(` `)` `[` `]` `\\|` `,` `&` `+` `*` `=`   | space or dash               |
| accented letters (æøåéüñ etc.)                     | ASCII fold                  |
| consecutive spaces                                  | single space                |
| leading/trailing whitespace                         | trim                        |

Beyond the table we also handle two characters seen in real benches:
- `>` (used in `landing -> product` and `>50`) → space (so `->` becomes a space; consecutive-space collapse fixes it)
- `<` (defensive — same reasoning)

Behaviour:
- Detects violations by JSON-parsing each file (read-only).
- Rewrites only the bytes inside the `name` value strings — the rest of
  the file is byte-identical to the input. Whitespace, blank lines,
  one-line `{ ... }` blocks, indentation are all preserved.
- For each violation we do a *targeted* string replacement: we find the
  exact `"name": "<old>"` substring inside the `ds_<id>` JSON block (so
  we never accidentally edit a different field with the same value).
- The JSON object key (e.g. `"ds_base":`) is the internal id and is
  left untouched — it is not subject to the editor rule.

Pairs with `pipeline/ds-create` and `pipeline/ds-validate`. Once
`validate.py` implements `dataSource-name-illegal-chars` natively this
script can be retired or kept as a batch fixer.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Iterable

ALLOWED = re.compile(r"^[A-Za-z0-9 \-_.]+$")

# Type-discriminator keys that appear under `dataSources` in a `defaults`
# block but are NOT real dataSource entries.
DEFAULTS_TYPE_KEYS = {"ds.search", "ds.savedSearch", "ds.chain", "ds.test"}

DEFAULT_ROOTS = [
    Path("plugins/splunk-dashboards/skills"),
]

# Characters per the ds-create table: drop these entirely.
DROP_CHARS = set("?!\"'\u2018\u2019\u201c\u201d")

# Characters per the ds-create table: turn into a space (then collapse).
# Includes the table chars + > and < seen in real benches.
TO_SPACE_CHARS = set("/:()[]|,&+*=<>")


def sanitize(name: str) -> str:
    """Apply the ds-create SKILL.md sanitization rules.

    Idempotent: feeding a sanitized name back through is a no-op.
    """
    folded = unicodedata.normalize("NFKD", name)
    folded = "".join(c for c in folded if not unicodedata.combining(c))

    out_chars: list[str] = []
    for ch in folded:
        if ch in DROP_CHARS:
            continue
        if ch in TO_SPACE_CHARS:
            out_chars.append(" ")
            continue
        out_chars.append(ch)

    out = "".join(out_chars)
    out = out.encode("ascii", "ignore").decode("ascii")
    out = re.sub(r"\s+", " ", out).strip()
    return out


def find_json_files(paths: Iterable[Path]) -> list[Path]:
    found: list[Path] = []
    for p in paths:
        if p.is_file() and p.suffix == ".json":
            found.append(p)
        elif p.is_dir():
            found.extend(sorted(p.rglob("*.json")))
    return found


def _json_string_literal(s: str) -> str:
    """Return the JSON-encoded form of `s` (with surrounding quotes).

    Uses `json.dumps` so escape rules match how the source files were
    originally written.
    """
    return json.dumps(s, ensure_ascii=False)


def _replace_name_in_block(
    text: str,
    block_start: int,
    block_end: int,
    old_literal: str,
    new_literal: str,
) -> tuple[str, bool]:
    """Replace the FIRST occurrence of `"name": <old_literal>` (with any
    inner whitespace between `:` and the value) inside text[block_start:block_end]
    with `"name": <new_literal>`.

    Returns (new_text, replaced).
    """
    block = text[block_start:block_end]
    pattern = re.compile(
        r'"name"\s*:\s*' + re.escape(old_literal),
    )
    m = pattern.search(block)
    if not m:
        return text, False
    new_segment = '"name": ' + new_literal
    new_block = block[: m.start()] + new_segment + block[m.end():]
    return text[:block_start] + new_block + text[block_end:], True


def _find_block_span(text: str, ds_id: str) -> tuple[int, int] | None:
    """Find the byte span of the JSON object that follows `"<ds_id>":`.

    Returns (start, end) where text[start] == '{' and text[end] is the
    position just past the matching closing '}'. Returns None if the key
    isn't found.
    """
    key_pattern = re.compile(r'"' + re.escape(ds_id) + r'"\s*:\s*\{')
    m = key_pattern.search(text)
    if not m:
        return None
    start = m.end() - 1  # position of the opening '{'
    depth = 0
    in_string = False
    escape = False
    i = start
    while i < len(text):
        ch = text[i]
        if escape:
            escape = False
        elif ch == "\\" and in_string:
            escape = True
        elif ch == '"':
            in_string = not in_string
        elif not in_string:
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return start, i + 1
        i += 1
    return None


def fix_file(path: Path, *, dry_run: bool) -> list[tuple[str, str, str]]:
    """Return list of (ds_id, before, after) for changes (or candidate
    changes if dry_run). Edits are byte-surgical: only the `name` value
    strings are rewritten."""
    raw = path.read_text()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []
    ds = data.get("dataSources")
    if not isinstance(ds, dict):
        return []

    text = raw
    changes: list[tuple[str, str, str]] = []
    for ds_id, ds_def in ds.items():
        if ds_id in DEFAULTS_TYPE_KEYS:
            continue
        if not isinstance(ds_def, dict):
            continue
        name = ds_def.get("name")
        if not isinstance(name, str):
            continue
        if ALLOWED.match(name):
            continue
        new_name = sanitize(name)
        if new_name == name:
            continue
        if not new_name:
            new_name = ds_id
        changes.append((ds_id, name, new_name))
        if dry_run:
            continue

        span = _find_block_span(text, ds_id)
        if span is None:
            print(
                f"warn: {path}\t{ds_id}\tcould not locate block in raw text; skipping",
                file=sys.stderr,
            )
            continue
        old_literal = _json_string_literal(name)
        new_literal = _json_string_literal(new_name)
        text, replaced = _replace_name_in_block(
            text, span[0], span[1], old_literal, new_literal
        )
        if not replaced:
            print(
                f"warn: {path}\t{ds_id}\t'name' literal not found verbatim; skipping",
                file=sys.stderr,
            )

    if changes and not dry_run and text != raw:
        path.write_text(text)
    return changes


def main(argv: list[str]) -> int:
    args = argv[1:]
    dry_run = False
    if args and args[0] == "--dry-run":
        dry_run = True
        args = args[1:]

    roots = [Path(a) for a in args] if args else DEFAULT_ROOTS
    files = find_json_files(roots)

    total_changes = 0
    files_with_changes = 0

    for path in files:
        rows = fix_file(path, dry_run=dry_run)
        if not rows:
            continue
        files_with_changes += 1
        for ds_id, before, after in rows:
            total_changes += 1
            print(f"{path}\t{ds_id}\t{before!r}\t->\t{after!r}")

    verb = "would rewrite" if dry_run else "rewrote"
    print(
        f"\n{verb} {total_changes} name(s) across {files_with_changes} "
        f"file(s) (of {len(files)} scanned).",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
