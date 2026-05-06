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
    "#0B0C0E": "#F5F1E8",  # Splunk Prisma dark canvas -> warm parchment light canvas (timeline default)
    "#0F1729": "#FAEAD8",  # dark canvas -> warm light canvas
    "#101A33": "#EFE7D3",  # SOC slate -> warm light canvas (linkgraph hero)
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

    # SVG palette for ds-viz-choropleth-svg richer panels (panels 5-9)
    "#0F1F3D": "#F6F1E4",  # SVG canvas dark -> warm light parchment
    "#1F2A4A": "#E8DEC4",  # secondary dark slab -> light slab tint
    "#3A4A6B": "#A89C7A",  # SVG borders dark -> warm dark border on light
    "#5C7099": "#7B6B4A",  # connector lines / strokes dark -> warm mid stroke
    "#7FAFCC": "#5A7090",  # cool decoration text dark -> medium cool
    "#FFE9B0": "#B36B00",  # very-light warning fill -> deeper warning text on light
    "#0E7C70": "#0E7C70",  # already light-friendly teal
}

HEX_RE = re.compile(r"#[0-9A-Fa-f]{6}\b")
SHORT_HEX_RE = re.compile(r"#([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])\b")

SHORT_HEX_MAP: dict[str, str] = {
    "#fff": "#1A1A1A",  # white in dark SVGs -> dark text on light
    "#FFF": "#1A1A1A",
    "#444": "#D8D2C0",  # neutral mid-grey region default -> warm light-grey region default
    "#888": "#7A6E50",  # mid-grey decoration -> warm muted brown
    "#9AB": "#7A6E50",  # cool muted text -> warm muted brown
    "#666": "#7A6E50",
    "#222": "#1A1A1A",
}


def remap_colors(text: str) -> str:
    def long_repl(m: re.Match) -> str:
        h = m.group(0).upper()
        return COLOR_MAP.get(h, m.group(0))
    def short_repl(m: re.Match) -> str:
        original = m.group(0)
        if original in SHORT_HEX_MAP:
            return SHORT_HEX_MAP[original]
        lowered = original.lower()
        if lowered in SHORT_HEX_MAP:
            return SHORT_HEX_MAP[lowered]
        return original
    text = HEX_RE.sub(long_repl, text)
    text = SHORT_HEX_RE.sub(short_repl, text)
    return text


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
