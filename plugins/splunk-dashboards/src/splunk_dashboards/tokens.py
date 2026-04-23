"""Design tokens for Aurora — loads from data/tokens.json.

The JSON file is the source of truth; this module flattens it so every
token is a module-level constant (e.g. ``tokens.CANVAS_DARK``). To add
or override a token, edit ``data/tokens.json``.

Hex values are verified against Splunk's official design language
(splunkui.splunk.com). Spacing and type scale follow @splunk/themes
conventions.
"""
from __future__ import annotations

import json
from pathlib import Path

_DATA_PATH = Path(__file__).parent / "data" / "tokens.json"


def _load() -> dict:
    with _DATA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


_RAW = _load()


def _flatten(raw: dict) -> dict:
    out = {}
    for section, values in raw.items():
        if section.startswith("_"):
            continue
        for key, value in values.items():
            out[key] = value
    return out


_FLAT = _flatten(_RAW)
globals().update(_FLAT)

__all__ = sorted(_FLAT.keys())
