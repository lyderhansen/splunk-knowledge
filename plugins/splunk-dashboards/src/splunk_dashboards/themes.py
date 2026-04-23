"""Aurora themes registry — loads from data/themes.json.

A Theme captures tokens and behavior hints that the Aurora engine uses
to emit definition.defaults and per-viz overrides. Patterns are separate
(see patterns/ package).

Token references: values like ``"@STATUS_INFO"`` in themes.json resolve
to ``tokens.STATUS_INFO``. Literals (``"#009CEB"``, ``"rgba(...)"``) pass
through unchanged. A slice spec ``{"source": "@SERIES_X", "end": N}``
yields the first ``N`` colors of the referenced palette.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Literal, Tuple

from splunk_dashboards import tokens as T


ThemeMode = Literal["dark", "light"]

_DATA_PATH = Path(__file__).parent / "data" / "themes.json"


@dataclass(frozen=True)
class Theme:
    name: str
    mode: ThemeMode
    canvas: str
    panel: str
    panel_stroke: str
    text_primary: str
    text_secondary: str
    accent: str
    series_colors: list
    semantic_colors: Dict[str, str]
    default_patterns: Tuple[str, ...]
    uses_gradient_canvas: bool = False


def _resolve(value: Any) -> Any:
    """Resolve @TOKEN refs and slice specs against the tokens module."""
    if isinstance(value, str) and value.startswith("@"):
        token_name = value[1:]
        if not hasattr(T, token_name):
            raise KeyError(f"Unknown token reference in themes.json: {value}")
        resolved = getattr(T, token_name)
        return list(resolved) if isinstance(resolved, list) else resolved
    if isinstance(value, dict) and "source" in value:
        source = _resolve(value["source"])
        start = value.get("start", 0)
        end = value.get("end")
        return list(source[start:end]) if end is not None else list(source[start:])
    if isinstance(value, dict):
        return {k: _resolve(v) for k, v in value.items()}
    return value


def _build_theme(name: str, spec: Dict[str, Any]) -> Theme:
    series = spec.get("series_colors")
    if series is None:
        series = spec.get("series_colors_slice")
    return Theme(
        name=name,
        mode=spec["mode"],
        canvas=_resolve(spec["canvas"]),
        panel=_resolve(spec["panel"]),
        panel_stroke=_resolve(spec["panel_stroke"]),
        text_primary=_resolve(spec["text_primary"]),
        text_secondary=_resolve(spec["text_secondary"]),
        accent=_resolve(spec["accent"]),
        series_colors=_resolve(series),
        semantic_colors=_resolve(spec["semantic_colors"]),
        default_patterns=tuple(spec["default_patterns"]),
        uses_gradient_canvas=spec.get("uses_gradient_canvas", False),
    )


def _load() -> Tuple[Dict[str, Theme], Dict[str, str]]:
    with _DATA_PATH.open("r", encoding="utf-8") as f:
        raw = json.load(f)
    themes = {name: _build_theme(name, spec) for name, spec in raw["themes"].items()}
    aliases = dict(raw.get("legacy_aliases", {}))
    return themes, aliases


THEMES, LEGACY_ALIASES = _load()

PRO = THEMES["pro"]
GLASS = THEMES["glass"]
EXEC = THEMES["exec"]
NOC = THEMES["noc"]


def get_theme(name: str) -> Theme:
    """Resolve a theme name, supporting legacy aliases."""
    canonical = LEGACY_ALIASES.get(name, name)
    if canonical not in THEMES:
        raise KeyError(f"Unknown theme: {name}. Available: {list_themes()}")
    return THEMES[canonical]


def list_themes() -> List[str]:
    """Return canonical Aurora theme names only (not legacy aliases)."""
    return list(THEMES.keys())


def register_theme(theme: Theme) -> None:
    """Add a theme to the registry. Overwrites if name already exists."""
    THEMES[theme.name] = theme
