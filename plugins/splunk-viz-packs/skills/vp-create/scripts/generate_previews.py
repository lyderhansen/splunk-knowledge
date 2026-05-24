"""generate_previews.py - Pillow-based per-viz preview.png generator for Splunk
custom visualization apps. Owns ONLY preview.png; appIcon.png and bg_gradient.png
remain in generate_assets.js. Per phase 41 / PP-01, PP-02.

3-tier detection cascade per D-04:
    Tier 1: @viz-type annotation in visualization_source.js (first 10 lines)
    Tier 2: Canvas API pattern detection (ctx.arc, ctx.fillRect, ctx.lineTo, ...)
    Tier 3: Branded generic fallback (brand bg + viz name in Inter font)

Reads brand colors from shared/theme.js via regex (NEVER dynamic eval - T-41-01).
Pillow auto-installs on first run via subprocess.check_call (D-02 fallback).

Usage: python3 generate_previews.py /path/to/app
Exit: 0=ok, 1=per-viz errors, 2=Pillow install failed (fall back to legacy JS).
"""
from __future__ import annotations

# ---- Section 2: Pillow auto-install gate (D-02) ----
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess
    import sys
    print("Installing Pillow (one-time)...", file=sys.stderr)
    try:
        # subprocess.check_call invocation: pip install pillow (T-41-02 mitigation:
        # pinned package name passed as separate argv element; no shell=True).
        _PIP_ARGS = [sys.executable, "-m", "pip", "install", "--quiet", "pillow"]
        subprocess.check_call(_PIP_ARGS)
        from PIL import Image, ImageDraw, ImageFont
    except Exception as e:
        print("Pillow install failed: " + str(e), file=sys.stderr)
        print(
            "Falling back to JS silhouette previews. Run: pip install pillow",
            file=sys.stderr,
        )
        sys.exit(2)

# ---- Section 3: Stdlib imports + constants ----
import argparse
import os
import re
import sys
from typing import Optional

PREVIEW_W = 116
PREVIEW_H = 76

FONT_PATH = os.path.join(os.path.dirname(__file__), "fonts", "Inter-Regular.ttf")

# D-03 font sizes (Hero, label, tick)
FONT_HERO = 22
FONT_LABEL = 10
FONT_TICK = 8

# Threat T-41-01 mitigation: validate every hex string parsed out of theme.js
HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{3,8}$")

# D-06 defaults if theme.js is missing or malformed
DEFAULT_THEME = {
    "bg": "#0B0F19",
    "text": "#FFFFFF",
    "textDim": "#8A8FA0",
    "accent": "#FF0000",
    "series": ["#FF0000", "#0099FF", "#FFCC00", "#00CC66"],
}

# Tier 3 hint dictionary - ported from generate_assets.js lines 300-340.
# Used to pick a decorative motif when source-content detection misses.
VIZ_TYPE_KEYWORDS = [
    ("bars", ["leaderboard", "leader", "ranking", "waterfall", "bullet",
              "bar_chart", "barchart", "histogram", "horizontal", "vertical",
              "ranked", "podium", "position_board", "bar", "bars", "column"]),
    ("gauge", ["kpi_gauge", "ring_gauge", "speedometer", "utilization", "battery",
               "fuel", "needle", "meter", "gauge", "arc", "ring", "donut", "dial", "radial"]),
    ("table", ["status_matrix", "health_grid", "attack_heatmap", "host_grid",
               "heatmap", "heat", "occupancy", "department", "severity",
               "grid", "table", "matrix", "cell"]),
    ("line", ["power_horizon", "spark_strip", "time_series", "timeseries",
              "area_chart", "linechart", "sparkline", "horizon",
              "line", "trend", "area", "spark"]),
    ("table", ["incident_feed", "event_feed", "live_ticker", "passenger_flow",
               "kill_chain", "pipeline", "process", "observation",
               "timeline", "gantt", "feed", "activity", "event",
               "stream", "log", "ticker", "incident", "queue", "flow"]),
    ("kpi", ["single_value", "satisfaction", "counter", "kpi", "metric", "score",
             "value", "number", "stat", "card", "tile", "badge", "nps"]),
]


# ---- Section 4: Color helpers (ported from generate_assets.js) ----

def hex_to_rgb(hex_str: str) -> tuple:
    """Convert #RRGGBB hex string to (r, g, b) tuple. Falls back to mid-grey on bad input."""
    if not isinstance(hex_str, str) or not HEX_COLOR_RE.match(hex_str):
        return (128, 128, 128)
    s = hex_str.lstrip("#")
    # Support #RGB shorthand by doubling each char
    if len(s) == 3:
        s = "".join(c + c for c in s)
    if len(s) >= 6:
        return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))
    return (128, 128, 128)


def preview_contrast_accent(accent_hex: str, bg_hex: str) -> tuple:
    """Ensure accent silhouette is visible on brand bg.

    Ported verbatim from generate_assets.js lines 280-296. If accent-on-bg
    perceived-luminance contrast is below 3:1, brighten the accent 30% toward white.
    Returns (r, g, b) tuple.
    """
    ar = hex_to_rgb(accent_hex)
    br = hex_to_rgb(bg_hex)
    a_lum = (ar[0] * 0.299 + ar[1] * 0.587 + ar[2] * 0.114) / 255.0
    b_lum = (br[0] * 0.299 + br[1] * 0.587 + br[2] * 0.114) / 255.0
    lighter = max(a_lum, b_lum) + 0.05
    darker = min(a_lum, b_lum) + 0.05
    contrast = lighter / darker
    if contrast < 3.0:
        return (
            min(255, round(ar[0] + (255 - ar[0]) * 0.3)),
            min(255, round(ar[1] + (255 - ar[1]) * 0.3)),
            min(255, round(ar[2] + (255 - ar[2]) * 0.3)),
        )
    return ar


def with_alpha(rgb: tuple, alpha: float, bg_rgb: tuple) -> tuple:
    """Blend rgb against bg_rgb with the given alpha (0..1). Returns (r,g,b)."""
    if alpha < 0:
        alpha = 0.0
    if alpha > 1:
        alpha = 1.0
    return tuple(
        int(round(c * alpha + b * (1 - alpha))) for c, b in zip(rgb, bg_rgb)
    )


# ---- Section 5: theme.js parser (D-06; security T-41-01 mitigation) ----

_BLOCK_RE = re.compile(r"var\s+DARK\s*=\s*\{([^}]*)\}", re.DOTALL)
_FIELD_RE = re.compile(r"(\w+)\s*:\s*['\"]([#0-9A-Fa-f]+)['\"]")
_SERIES_RE = re.compile(r"series\s*:\s*\[([^\]]+)\]", re.DOTALL)
_HEX_IN_LIST_RE = re.compile(r"['\"](#[0-9A-Fa-f]+)['\"]")


def parse_theme_js(theme_js_path: str) -> dict:
    """Extract DARK theme colors from shared/theme.js via regex (NEVER dynamic eval -
    threat T-41-01). Every hex value is validated against HEX_COLOR_RE; invalid
    values fall through to DEFAULT_THEME for that field.
    """
    result = dict(DEFAULT_THEME)
    result["series"] = list(DEFAULT_THEME["series"])
    if not theme_js_path or not os.path.isfile(theme_js_path):
        print("  WARNING: theme.js not found: " + str(theme_js_path), file=sys.stderr)
        return result
    try:
        with open(theme_js_path, "r", encoding="utf-8") as f:
            src = f.read()
    except (OSError, UnicodeDecodeError) as e:
        print("  WARNING: failed to read theme.js: " + str(e), file=sys.stderr)
        return result
    block_match = _BLOCK_RE.search(src)
    if not block_match:
        print("  WARNING: no var DARK = {...} block in theme.js", file=sys.stderr)
        return result
    body = block_match.group(1)
    # Per-field hex extract (bg, text, textDim, accent) - HEX_COLOR_RE validates each.
    for field, value in _FIELD_RE.findall(body):
        if field in ("bg", "text", "textDim", "accent") and HEX_COLOR_RE.match(value):
            result[field] = value
    # series array extract - HEX_COLOR_RE validates each.
    series_match = _SERIES_RE.search(body)
    if series_match:
        validated = [v for v in _HEX_IN_LIST_RE.findall(series_match.group(1))
                     if HEX_COLOR_RE.match(v)]
        if validated:
            result["series"] = validated
    return result


# ---- Section 6: 3-tier detection cascade (D-04) ----

VIZ_TYPE_ANNOTATION_RE = re.compile(r"//\s*@viz-type:\s*(\S+)")

# Source content detection patterns - bound at compile time for performance
_PAT_ARC = re.compile(r"\bctx\.arc\b")
_PAT_FILLRECT = re.compile(r"\bctx\.fillRect\b")
_PAT_LINETO = re.compile(r"\bctx\.lineTo\b")
_PAT_FILLTEXT = re.compile(r"\bctx\.fillText\b")
_PAT_COMPOSITE = re.compile(r"globalCompositeOperation\s*=\s*['\"]destination-out")
# Large fillText: any fillText call near a font size > 40 (heuristic for KPI hero text).
_PAT_LARGE_FILLTEXT_FONT = re.compile(r"font\s*=\s*['\"][^'\"]*\b([4-9]\d|\d{3})px")


def _find_source_path(viz_dir: str) -> Optional[str]:
    """Return path to the viz source JS file, or None if missing."""
    candidates = [
        os.path.join(viz_dir, "src", "visualization_source.js"),
        os.path.join(viz_dir, "visualization_source.js"),
        # Extension API path
        os.path.join(viz_dir, "src", "visualization.js"),
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    return None


def detect_viz_type(viz_dir: str) -> tuple:
    """Return (tier, type_name, detection_hint) for a viz subdirectory.

    Tier 1: @viz-type annotation in first 10 lines of source JS.
    Tier 2: Canvas API pattern counts (ctx.arc, fillRect, lineTo, fillText, ...).
    Tier 3: Generic fallback. detection_hint is a keyword for tier-3 motif selection.
    """
    src_path = _find_source_path(viz_dir)
    if src_path is None:
        return (3, "generic", None)

    # Tier 1: @viz-type annotation (first 10 lines only)
    try:
        with open(src_path, "r", encoding="utf-8") as f:
            head_lines = []
            for i, line in enumerate(f):
                if i >= 10:
                    break
                head_lines.append(line)
            head = "".join(head_lines)
    except (OSError, UnicodeDecodeError):
        head = ""

    annotation_match = VIZ_TYPE_ANNOTATION_RE.search(head)
    if annotation_match:
        return (1, annotation_match.group(1).lower(), None)

    # Tier 2: Source content detection - read up to 50KB to bound memory.
    try:
        with open(src_path, "r", encoding="utf-8") as f:
            src = f.read(50_000)
    except (OSError, UnicodeDecodeError):
        src = ""

    arc_count = len(_PAT_ARC.findall(src))
    fillrect_count = len(_PAT_FILLRECT.findall(src))
    lineto_count = len(_PAT_LINETO.findall(src))
    filltext_count = len(_PAT_FILLTEXT.findall(src))
    composite_op = bool(_PAT_COMPOSITE.search(src))
    large_filltext = bool(_PAT_LARGE_FILLTEXT_FONT.search(src))

    # Dispatch rules - first match wins, per D-04
    if arc_count > 2 and composite_op:
        return (2, "ring", "arc+composite")
    if arc_count > 2 and lineto_count == 0:
        return (2, "gauge", "arc-only")
    if fillrect_count > 5:
        return (2, "bars", "fillrect-many")
    if lineto_count > 3:
        return (2, "line", "lineto-chain")
    if filltext_count > 5:
        return (2, "table", "filltext-rows")
    if large_filltext:
        return (2, "kpi", "large-text")

    # Tier 3: Generic fallback - look up keyword hint for motif selection
    base = os.path.basename(viz_dir).lower()
    for type_name, keywords in VIZ_TYPE_KEYWORDS:
        for kw in keywords:
            if kw in base:
                return (3, "generic", type_name)
    return (3, "generic", None)


# ---- Section 7: Seven draw functions (D-05) ----

def _load_font(size: int):
    """Load Inter at the given size; fall back to PIL default on failure."""
    try:
        return ImageFont.truetype(FONT_PATH, size)
    except (OSError, IOError):
        return ImageFont.load_default()


def _new_img(theme: dict) -> tuple:
    """Create 116x76 RGB image, returning (img, draw, bg_rgb, accent_rgb, text_rgb)."""
    bg_hex = theme.get("bg", DEFAULT_THEME["bg"])
    bg_rgb = hex_to_rgb(bg_hex)
    accent_rgb = preview_contrast_accent(theme.get("accent", DEFAULT_THEME["accent"]), bg_hex)
    text_rgb = hex_to_rgb(theme.get("text", DEFAULT_THEME["text"]))
    img = Image.new("RGB", (PREVIEW_W, PREVIEW_H), bg_rgb)
    return img, ImageDraw.Draw(img), bg_rgb, accent_rgb, text_rgb


def _save(img, output_path: str) -> None:
    """Save in RGB mode at compress_level 6 (D-07)."""
    img.save(output_path, "PNG", compress_level=6)


def drawGauge(theme: dict, output_path: str, viz_name: str = "",
              detection_hint: Optional[str] = None) -> None:
    """240-deg arc with hero value text in centre. bg, accent arc, text label."""
    img, draw, _bg, accent_rgb, text_rgb = _new_img(theme)
    cx, cy, r = 58, 42, 28
    # 240 deg span: start 150, end 30 (clockwise). Pillow angles: 0=right, 90=down.
    draw.arc((cx - r, cy - r, cx + r, cy + r), start=150, end=30,
             fill=accent_rgb, width=6)
    draw.text((cx, cy + 2), "84", fill=text_rgb, font=_load_font(FONT_HERO), anchor="mm")
    _save(img, output_path)


def drawBars(theme: dict, output_path: str, viz_name: str = "",
             detection_hint: Optional[str] = None) -> None:
    """Six vertical bars alternating between series[0] and series[1] over a baseline."""
    img, draw, _bg, _ac, _tx = _new_img(theme)
    series = theme.get("series") or DEFAULT_THEME["series"]
    s0 = hex_to_rgb(series[0]) if series else hex_to_rgb(DEFAULT_THEME["series"][0])
    s1 = hex_to_rgb(series[1]) if len(series) >= 2 else s0
    textdim_rgb = hex_to_rgb(theme.get("textDim", DEFAULT_THEME["textDim"]))
    baseline = 64
    xs = [12, 26, 40, 54, 68, 82]
    heights = [38, 27, 46, 21, 34, 30]
    for i, (x, h) in enumerate(zip(xs, heights)):
        draw.rectangle((x, baseline - h, x + 10, baseline), fill=(s0 if i % 2 == 0 else s1))
    draw.line((8, baseline, 108, baseline), fill=textdim_rgb, width=1)
    _save(img, output_path)


def drawLine(theme: dict, output_path: str, viz_name: str = "",
             detection_hint: Optional[str] = None) -> None:
    """14-point sparkline + accent area fill below. Y values reproducible from viz_name."""
    img, draw, bg_rgb, accent_rgb, _tx = _new_img(theme)
    seed = abs(hash(viz_name or "line")) & 0xFFFFFFFF
    n_points, margin_x = 14, 8
    usable_w = PREVIEW_W - 2 * margin_x
    points = []
    for i in range(n_points):
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        y = 20 + (seed % 41)
        x = margin_x + int(round(i * usable_w / max(1, n_points - 1)))
        points.append((x, y))
    fill_rgb = with_alpha(accent_rgb, 0.30, bg_rgb)
    area = [(margin_x, PREVIEW_H - 6)] + points + [(PREVIEW_W - margin_x, PREVIEW_H - 6)]
    draw.polygon(area, fill=fill_rgb)
    draw.line(points, fill=accent_rgb, width=2)
    _save(img, output_path)


def drawTable(theme: dict, output_path: str, viz_name: str = "",
              detection_hint: Optional[str] = None) -> None:
    """4 rows + 3 cols. Header row in accent, alternating tinted body rows."""
    img, draw, bg_rgb, accent_rgb, text_rgb = _new_img(theme)
    textdim_rgb = hex_to_rgb(theme.get("textDim", DEFAULT_THEME["textDim"]))
    tint_rgb = tuple(int(round(b * 0.92 + t * 0.08)) for b, t in zip(bg_rgb, text_rgb))
    rows_y = [8, 24, 40, 56]
    row_h, margin_x = 12, 6
    draw.rectangle((margin_x, rows_y[0], PREVIEW_W - margin_x, rows_y[0] + row_h),
                   fill=accent_rgb)
    for i in range(1, 4):
        fill = tint_rgb if i % 2 == 1 else bg_rgb
        draw.rectangle((margin_x, rows_y[i], PREVIEW_W - margin_x, rows_y[i] + row_h),
                       fill=fill)
    for x in (42, 84):
        draw.line((x, rows_y[0], x, rows_y[3] + row_h), fill=textdim_rgb, width=1)
    _save(img, output_path)


def drawKpi(theme: dict, output_path: str, viz_name: str = "",
            detection_hint: Optional[str] = None) -> None:
    """Large hero number + small label below. Number=accent, label=textDim."""
    img, draw, _bg, accent_rgb, _tx = _new_img(theme)
    textdim_rgb = hex_to_rgb(theme.get("textDim", DEFAULT_THEME["textDim"]))
    candidates = ["42", "99%", "1.2K"]
    hero = candidates[abs(hash(viz_name or "kpi")) % len(candidates)]
    hero_font = _load_font(int(round(FONT_HERO * 1.4)))
    draw.text((PREVIEW_W / 2, 32), hero, fill=accent_rgb, font=hero_font, anchor="mm")
    draw.text((PREVIEW_W / 2, 60), "ACTIVE", fill=textdim_rgb,
              font=_load_font(FONT_LABEL), anchor="mm")
    _save(img, output_path)


def drawRing(theme: dict, output_path: str, viz_name: str = "",
             detection_hint: Optional[str] = None) -> None:
    """Donut at 65% fill, accent ring, value text centred. Pillow angles: 0=right, 270=top."""
    img, draw, bg_rgb, accent_rgb, text_rgb = _new_img(theme)
    cx, cy = 58, 42
    r_out, r_in = 24, 14
    # Start top (270), sweep clockwise 234 deg = 65% → end 270 + 234 - 360 = 144.
    draw.pieslice((cx - r_out, cy - r_out, cx + r_out, cy + r_out),
                  start=270, end=144, fill=accent_rgb)
    draw.ellipse((cx - r_in, cy - r_in, cx + r_in, cy + r_in), fill=bg_rgb)
    draw.text((cx, cy), "65%", fill=text_rgb, font=_load_font(FONT_LABEL), anchor="mm")
    _save(img, output_path)


def _measure_text(draw, label: str, font, size: int) -> float:
    """Measure text width with Pillow version fallbacks."""
    try:
        return draw.textlength(label, font=font)
    except AttributeError:
        try:
            bbox = draw.textbbox((0, 0), label, font=font)
            return bbox[2] - bbox[0]
        except Exception:
            return len(label) * size * 0.55


def drawGeneric(theme: dict, output_path: str, viz_name: str = "",
                detection_hint: Optional[str] = None) -> None:
    """Tier 3 fallback (D-04): brand bg + viz name in Inter + motif from hint.
    Every viz lands tier 1/2/3 with a distinct result; never a flat rectangle.
    """
    img, draw, bg_rgb, accent_rgb, text_rgb = _new_img(theme)
    # Auto-size viz_name to fit 100px wide. Decrease 2pt/step; floor 8.
    label = (viz_name or "viz").replace("_", " ")
    size = FONT_HERO
    font = _load_font(size)
    while size > 8 and _measure_text(draw, label, font, size) > 100:
        size -= 2
        font = _load_font(size)
    draw.text((PREVIEW_W / 2, 38), label, fill=text_rgb, font=font, anchor="mm")

    hint = (detection_hint or "").lower()
    if "arc" in hint or "gauge" in hint or "ring" in hint:
        draw.arc((78, 50, 110, 72), start=270, end=0, fill=accent_rgb, width=3)
    elif "bar" in hint:
        for i, h in enumerate([6, 10, 14]):
            x = 88 + i * 6
            draw.rectangle((x, 8, x + 4, 8 + h), fill=accent_rgb)
    elif "line" in hint:
        draw.line([(78, 64), (90, 56), (102, 64)], fill=accent_rgb, width=2)
    elif "table" in hint or "grid" in hint:
        for r in range(2):
            for c in range(2):
                x = 92 + c * 8
                y = 8 + r * 6
                draw.rectangle((x, y, x + 6, y + 4), fill=accent_rgb)
    else:
        draw.ellipse((96, 8, 106, 18), fill=accent_rgb)

    border_rgb = with_alpha(accent_rgb, 0.50, bg_rgb)
    draw.rectangle((0, 0, PREVIEW_W - 1, PREVIEW_H - 1), outline=border_rgb, width=1)
    _save(img, output_path)


# ---- Section 8: Dispatch function ----

DISPATCH = {
    "gauge": drawGauge, "bars": drawBars, "bar": drawBars,
    "line": drawLine, "table": drawTable, "grid": drawTable,
    "kpi": drawKpi, "ring": drawRing, "donut": drawRing,
}


def dispatch(tier: int, type_name: str, theme: dict, output_path: str,
             viz_name: str, detection_hint: Optional[str]) -> None:
    """Route to the appropriate draw function based on detection result."""
    if tier == 3:
        drawGeneric(theme, output_path, viz_name, detection_hint)
        return
    DISPATCH.get(type_name, drawGeneric)(theme, output_path, viz_name, detection_hint)


# ---- Section 9: Main loop ----

def _find_viz_root(app_dir: str) -> Optional[str]:
    """Return path to the visualizations directory (Classic or Extension API), or None."""
    classic = os.path.join(app_dir, "appserver", "static", "visualizations")
    if os.path.isdir(classic):
        return classic
    extension = os.path.join(app_dir, "visualizations")
    if os.path.isdir(extension):
        return extension
    return None


def _find_theme_js(app_dir: str) -> Optional[str]:
    """Return path to shared/theme.js, searching app_dir then one level up."""
    direct = os.path.join(app_dir, "shared", "theme.js")
    if os.path.isfile(direct):
        return direct
    parent = os.path.join(app_dir, "..", "shared", "theme.js")
    if os.path.isfile(parent):
        return parent
    return None


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser(description="Per-viz preview.png generator (Pillow).")
    parser.add_argument("app_dir", help="Splunk app directory (contains shared/theme.js)")
    args = parser.parse_args(argv)

    # Threat T-41-03 mitigation: validate app_dir before any iteration.
    if not os.path.isdir(args.app_dir):
        print("ERROR: app_dir does not exist: " + args.app_dir, file=sys.stderr)
        return 1
    viz_root = _find_viz_root(args.app_dir)
    if viz_root is None:
        print("ERROR: no visualizations directory at appserver/static/visualizations/ "
              "(Classic) or visualizations/ (Extension)", file=sys.stderr)
        return 1

    theme_js_path = _find_theme_js(args.app_dir)
    theme = parse_theme_js(theme_js_path) if theme_js_path else dict(DEFAULT_THEME)
    if theme_js_path is None:
        print("  WARNING: no shared/theme.js found - using DEFAULT_THEME", file=sys.stderr)

    errors = 0
    written = 0
    try:
        entries = sorted(os.listdir(viz_root))
    except OSError as e:
        print("ERROR: cannot list " + viz_root + ": " + str(e), file=sys.stderr)
        return 1

    for entry in entries:
        if entry.startswith("."):
            continue
        viz_dir = os.path.join(viz_root, entry)
        if not os.path.isdir(viz_dir):
            continue
        try:
            tier, type_name, hint = detect_viz_type(viz_dir)
            output_path = os.path.join(viz_dir, "preview.png")
            dispatch(tier, type_name, theme, output_path, entry, hint)
            print("  preview " + entry + ": tier " + str(tier) + " (" + type_name + ")")
            written += 1
        except Exception as e:
            print("  ERROR " + entry + ": " + str(e), file=sys.stderr)
            errors += 1

    print("generate_previews: wrote " + str(written) + " preview.png files, "
          + str(errors) + " errors")
    return 0 if errors == 0 else 1


# ---- Section 10: Entry point ----

if __name__ == "__main__":
    sys.exit(main())
