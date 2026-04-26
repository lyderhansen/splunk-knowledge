#!/usr/bin/env python3
"""Convert a dark-theme Dashboard Studio JSON to a light-theme variant.

Usage:
    python3 make_light.py path/to/dashboard.json [path/to/dashboard-light.json]

If the output path is omitted, writes a sibling file named `dashboard-light.json`.

The script:
  1. Switches `theme` to `"light"` (keeps the JSON structure otherwise identical).
  2. Appends ` (light)` to the title (idempotent).
  3. Remaps known dark-palette hex colors to their light-palette equivalents
     using COLOR_MAP. Any hex color not in the map is left untouched.

The mapping was derived from the existing `viz/ds-viz-*/test-dashboard/`
dual-theme pairs. Extend COLOR_MAP if a new dark color should be remapped
in light theme.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Dark hex -> light hex. Keys are uppercase, no shorthand.
# Derived from frequency analysis of every viz/ds-viz-*/test-dashboard/ pair.
COLOR_MAP: dict[str, str] = {
    # Primary palette swaps (dark neon -> light muted)
    "#FF2D95": "#C2185B",  # pink/critical
    "#FFB627": "#E89A2C",  # amber/warning
    "#33FF99": "#2E8B57",  # green/healthy
    "#7AA2FF": "#3F6FB7",  # blue/info
    "#00D9FF": "#1F77B4",  # cyan/accent
    "#FF677B": "#C62368",  # coral/critical-alt
    "#FFD166": "#B36B00",  # gold
    "#7B56DB": "#7B49B7",  # purple
    "#B57BFF": "#7B49B7",
    "#9B5DE5": "#7B49B7",
    "#26A69A": "#0E7C70",  # teal
    "#1F77B4": "#1F77B4",  # blue (same)
    "#4A6BD9": "#4A6BD9",

    # Backgrounds and chrome
    "#0F1729": "#FAEAD8",  # dark canvas -> warm light canvas
    "#1A2440": "#EFE7D3",
    "#1A2540": "#EFE7D3",  # near-twin of #1A2440
    "#151B3A": "#EFE7D3",
    "#1B0E1F": "#FAEAD8",
    "#1F3A5F": "#D8E0F2",
    "#3D1E1E": "#F4D9D9",  # alert-red bg dark -> alert-red bg light tint
    "#FF6B6B": "#B91C1C",  # alert-red text dark -> dark red text on light

    # Text
    "#FFFFFF": "#1A1A1A",
    "#E8E8E8": "#3C444D",
    "#C3CBD4": "#3C444D",

    # Light contextual range (for rangeValue background tints)
    "#152034": "#F6F1E4",
    "#A85A1F": "#F4D9A8",
    "#8B1F3A": "#F4B5B5",
}

HEX_RE = re.compile(r"#[0-9A-Fa-f]{6}\b")


def remap_colors(text: str) -> str:
    def repl(m: re.Match) -> str:
        h = m.group(0).upper()
        return COLOR_MAP.get(h, m.group(0))
    return HEX_RE.sub(repl, text)


def make_light(src: Path, dst: Path) -> None:
    raw = src.read_text()
    data = json.loads(raw)
    data["theme"] = "light"
    title = data.get("title", "")
    if title:
        normalized = title
        if normalized.endswith("(dark)"):
            normalized = normalized[: -len("(dark)")].rstrip()
        if not normalized.endswith("(light)"):
            normalized = f"{normalized} (light)"
        data["title"] = normalized
    serialized = json.dumps(data, indent=2)
    serialized = remap_colors(serialized)
    dst.write_text(serialized + "\n")


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__, file=sys.stderr)
        return 2
    src = Path(argv[1])
    if not src.exists():
        print(f"error: {src} not found", file=sys.stderr)
        return 1
    dst = Path(argv[2]) if len(argv) > 2 else src.with_name("dashboard-light.json")
    make_light(src, dst)
    print(f"wrote {dst}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
