"""generate_previews.py - Pillow-based per-viz preview.png generator for Splunk
custom visualization apps. Owns ONLY preview.png; appIcon.png and bg_gradient.png
remain in generate_assets.js. Per phase 41 / PP-01, PP-02.

3-tier detection cascade per (Phase 41 D-04):
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
import math
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


# ---- Section 4b: viz-name-derived helpers for Correction #13 ----
#
# These helpers turn the viz_name string into deterministic per-viz signals
# that drive renderer choices:
#   - _seed(viz_name, salt): repeatable integer seed
#   - _lcg(seed): next LCG step for sequence generation
#   - _pick_primary(theme, viz_name): rotates through theme.series so a pack
#     of N same-type vizs renders in N different palette colors instead of all
#     using theme.accent. Pure brand colors; never invents off-palette hues.
#   - _pick_variant(viz_name, n_variants): rotates through composition layouts
#     so renderers can implement 2-3 sub-styles dispatched per-viz.

def _seed(viz_name, salt=0):
    return (abs(hash(viz_name or "x")) + salt) & 0xFFFFFFFF


def _lcg(seed):
    return (seed * 1103515245 + 12345) & 0x7FFFFFFF


def _pick_primary(theme, viz_name, salt=None):
    """Pick the primary (data) color from theme.series via hash(viz_name).
    Falls back to theme.accent if series is empty or invalid. Returns (r, g, b).

    Rationale (Correction #13 enhancement): same-type vizs in a pack should
    render in different palette colors, not all in the accent. The series
    palette is the brand-curated set of cohesive colors; rotating through it
    keeps the pack on-brand while making each viz visually distinct."""
    if salt is None:
        salt = _SALT_PRIMARY
    series = theme.get("series") or []
    pool = [c for c in series if isinstance(c, str) and HEX_COLOR_RE.match(c)]
    if not pool:
        return hex_to_rgb(theme.get("accent", DEFAULT_THEME["accent"]))
    return hex_to_rgb(pool[_seed(viz_name, salt) % len(pool)])


def _pick_variant(viz_name, n_variants):
    """Pick a composition variant index (0..n_variants-1) deterministically
    from viz_name. Used by drawKpi/drawGauge/drawRing to dispatch between
    sub-layouts so packs feel less templated."""
    if n_variants <= 1:
        return 0
    return _seed(viz_name, _SALT_VARIANT) % n_variants


# Shared hero-value pool — 22 candidates covering integers, percents, decimals,
# abbreviated thousands/millions, durations, currency-like values. Larger pool
# = lower hero-collision rate (1/22 ≈ 4.5%, vs 1/12 ≈ 8% before).
HERO_POOL = [
    "42",   "87",    "128",   "256",   "1.2K",  "4.7K",  "18.3K", "1.4M",
    "99%",  "73%",   "12%",   "3.14",  "0.92",  "12.5",  "62",
    "$2.4M","$847",  "$1.1B", "2:14",  "0:47",  "94 ms", "1.8s",
]


# Salt constants — keep each dimension's hash statistically independent so a
# hash collision on one (e.g. color) doesn't drag the others (hero, variant)
# along with it. Numeric values are arbitrary but distinct primes; do NOT
# reuse the same salt for two different picks.
_SALT_PRIMARY = 0
_SALT_HERO    = 29
_SALT_VARIANT = 17
_SALT_DELTA   = 37
_SALT_SECOND  = 23   # secondary color in nested rings, etc.


def _pick_hero(viz_name, salt=_SALT_HERO):
    """Return a hero string from HERO_POOL chosen deterministically from viz_name."""
    return HERO_POOL[_seed(viz_name, salt) % len(HERO_POOL)]


def _pick_delta(viz_name, salt=_SALT_DELTA):
    """Return a (sign_char, percent_int, color_hint) tuple for a delta indicator.
    sign_char is "▲" or "▼"; color_hint is "up" or "down" — caller decides what
    that maps to (typically up=accent, down=textDim or a red series color)."""
    seed = _seed(viz_name, salt)
    pct = 2 + (seed % 28)  # 2..29
    is_up = (seed >> 8) & 1
    return ("▲" if is_up else "▼", pct, "up" if is_up else "down")


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


# ---- Section 6: 4-tier detection cascade ----
#
# Tier 1a (NEW v6.0.6): // @preview-layout: <layout-name>
#   Compositional layout for multi-element vizs (e.g. "kpi-ratio-footer",
#   "heatmap-with-marks", "composite-stack"). When present, takes priority
#   over @viz-type because the layout describes the FULL composition, not
#   just the data primitive. Routes to LAYOUT_DISPATCH.
#
# Tier 1b: // @viz-type: <type>
#   Data primitive (gauge, kpi, bars, line, etc.). Routes to DISPATCH.
#
# Tier 2: Canvas API pattern scan of visualization_source.js
#   ctx.arc count > 2 = gauge, fillRect > 5 = bars, etc.
#
# Tier 3: Keyword fallback on viz directory name → drawGeneric with hint
#
# The cascade order matters: a complex composite KPI viz might have @viz-type=kpi
# but @preview-layout=kpi-ratio-footer. The layout annotation wins so the preview
# matches the full visual fingerprint, not just the data primitive.

PREVIEW_LAYOUT_ANNOTATION_RE = re.compile(r"//\s*@preview-layout:\s*(\S+)")
VIZ_TYPE_ANNOTATION_RE = re.compile(r"//\s*@viz-type:\s*(\S+)")

# Source content detection patterns - bound at compile time for performance
_PAT_ARC = re.compile(r"\bctx\.arc\b")
_PAT_FILLRECT = re.compile(r"\bctx\.fillRect\b")
_PAT_LINETO = re.compile(r"\bctx\.lineTo\b")
_PAT_FILLTEXT = re.compile(r"\bctx\.fillText\b")
_PAT_COMPOSITE = re.compile(r"globalCompositeOperation\s*=\s*['\"]destination-out")
# Large fillText: any fillText call near a font size > 40 (heuristic for KPI hero text).
_PAT_LARGE_FILLTEXT_FONT = re.compile(r"font\s*=\s*['\"][^'\"]*\b([4-9]\d|\d{3})px")
# Nested for-loop: a `for (...)` whose body contains another `for (...)` within ~200 chars.
# Used to distinguish grid heatmaps (2D iteration) from bars (1D iteration). Both use fillRect.
_PAT_NESTED_FOR = re.compile(r"for\s*\([^)]{0,80}\)\s*\{[^{}]{0,200}\bfor\s*\(", re.DOTALL)


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

    Tier 1a: @preview-layout annotation in first 10 lines (NEW v6.0.6).
             When present, type_name is a layout key routed to LAYOUT_DISPATCH.
             Compositional layouts override primitive types because they
             describe the FULL composition.
    Tier 1b: @viz-type annotation. Routes to DISPATCH (primitive renderers).
    Tier 2:  Canvas API pattern counts (ctx.arc, fillRect, lineTo, fillText, ...).
    Tier 3:  Generic fallback. detection_hint is a keyword for tier-3 motif selection.
    """
    src_path = _find_source_path(viz_dir)
    if src_path is None:
        return (3, "generic", None)

    # Read first 10 lines for annotation scan
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

    # Tier 1a: @preview-layout annotation (compositional layout)
    layout_match = PREVIEW_LAYOUT_ANNOTATION_RE.search(head)
    if layout_match:
        return (1, layout_match.group(1).lower(), "layout")

    # Tier 1b: @viz-type annotation (data primitive)
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
    nested_for = bool(_PAT_NESTED_FOR.search(src))

    # Dispatch rules - first match wins, per (Phase 41 D-04)
    if arc_count > 2 and composite_op:
        return (2, "ring", "arc+composite")
    if arc_count > 2 and lineto_count == 0:
        return (2, "gauge", "arc-only")
    if fillrect_count > 5:
        # Distinguish grid (2D nested fillRect loop) from bars (1D fillRect loop).
        # Both render many rectangles, but heatmaps iterate row*col.
        if nested_for:
            return (2, "grid", "fillrect-nested-for")
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


def _label_band(draw, viz_name: str, y: int, color: tuple, max_w: int = 104) -> None:
    """Render viz_name as a bottom label band — uppercased, underscores swapped
    for spaces, auto-shrunk from FONT_LABEL down to size 7 to fit max_w pixels.
    The single primitive that satisfies Correction #13 requirement 1."""
    label = (viz_name or "viz").replace("_", " ").upper()
    size = FONT_LABEL
    label_font = _load_font(size)
    while size > 7 and _measure_text(draw, label, label_font, size) > max_w:
        size -= 1
        label_font = _load_font(size)
    draw.text((PREVIEW_W / 2, y), label, fill=color,
              font=label_font, anchor="mm")


def _gauge_v1_classic(draw, theme, bg_rgb, primary_rgb, text_rgb, textdim_rgb, viz_name):
    """V1 — Classic 240° arc with hash-picked hero centered."""
    cx, cy, r = 58, 38, 26
    bg_arc = with_alpha(primary_rgb, 0.15, bg_rgb)
    draw.arc((cx - r, cy - r, cx + r, cy + r), start=150, end=30,
             fill=bg_arc, width=5)
    pct = 0.30 + (_seed(viz_name) % 70) / 100.0
    sweep = int(round(240 * pct))
    draw.arc((cx - r, cy - r, cx + r, cy + r),
             start=150, end=(150 + sweep) % 360,
             fill=primary_rgb, width=5)
    hero = _pick_hero(viz_name)
    draw.text((cx, cy + 2), hero, fill=text_rgb,
              font=_load_font(int(round(FONT_HERO * 1.05))), anchor="mm")


def _gauge_v2_hero_above(draw, theme, bg_rgb, primary_rgb, text_rgb, textdim_rgb, viz_name):
    """V2 — Hero ABOVE the arc + arc + small "/ TARGET" subtitle inside."""
    cx, cy, r = 58, 50, 22
    # Hero number above the arc
    hero = _pick_hero(viz_name)
    draw.text((cx, 16), hero, fill=primary_rgb,
              font=_load_font(int(round(FONT_HERO * 0.95))), anchor="mm")
    # Faint background arc
    bg_arc = with_alpha(primary_rgb, 0.15, bg_rgb)
    draw.arc((cx - r, cy - r, cx + r, cy + r), start=150, end=30,
             fill=bg_arc, width=4)
    pct = 0.30 + (_seed(viz_name) % 70) / 100.0
    sweep = int(round(240 * pct))
    draw.arc((cx - r, cy - r, cx + r, cy + r),
             start=150, end=(150 + sweep) % 360,
             fill=primary_rgb, width=4)
    # Tiny "of 100" style subtitle inside the arc bottom
    draw.text((cx, cy + 6), "/ 100", fill=textdim_rgb,
              font=_load_font(FONT_TICK), anchor="mm")


def _gauge_v3_marker(draw, theme, bg_rgb, primary_rgb, text_rgb, textdim_rgb, viz_name):
    """V3 — Classic arc + triangular marker pip at the fill endpoint."""
    cx, cy, r = 58, 38, 26
    bg_arc = with_alpha(primary_rgb, 0.15, bg_rgb)
    draw.arc((cx - r, cy - r, cx + r, cy + r), start=150, end=30,
             fill=bg_arc, width=5)
    pct = 0.30 + (_seed(viz_name) % 70) / 100.0
    sweep_deg = 240 * pct
    end_deg = 150 + sweep_deg
    draw.arc((cx - r, cy - r, cx + r, cy + r),
             start=150, end=end_deg % 360,
             fill=primary_rgb, width=5)
    # Triangular marker at the fill endpoint, pointing outward
    end_rad = math.radians(end_deg)
    tip_x = cx + math.cos(end_rad) * (r + 5)
    tip_y = cy + math.sin(end_rad) * (r + 5)
    perp = end_rad + math.pi / 2
    base_w = 3
    b1x = cx + math.cos(end_rad) * (r - 1) + math.cos(perp) * base_w
    b1y = cy + math.sin(end_rad) * (r - 1) + math.sin(perp) * base_w
    b2x = cx + math.cos(end_rad) * (r - 1) - math.cos(perp) * base_w
    b2y = cy + math.sin(end_rad) * (r - 1) - math.sin(perp) * base_w
    draw.polygon([(b1x, b1y), (b2x, b2y), (tip_x, tip_y)], fill=primary_rgb)
    # Hero in center
    hero = _pick_hero(viz_name)
    draw.text((cx, cy + 2), hero, fill=text_rgb,
              font=_load_font(int(round(FONT_HERO * 1.05))), anchor="mm")


_GAUGE_VARIANTS = [_gauge_v1_classic, _gauge_v2_hero_above, _gauge_v3_marker]


def drawGauge(theme: dict, output_path: str, viz_name: str = "",
              detection_hint: Optional[str] = None) -> None:
    """240-deg arc gauge — 3 composition variants (classic / hero-above /
    marker), dispatched by hash(viz_name) % 3. Primary color rotates through
    theme.series so same-type vizs render in different palette colors. Hero
    text picked from HERO_POOL; viz_name as label band.

    Correction #13 compliant: viz_name drives variant choice, primary color,
    fill percentage, hero text, AND label. Five stacked differentiators."""
    img, draw, bg_rgb, _accent, text_rgb = _new_img(theme)
    textdim_rgb = hex_to_rgb(theme.get("textDim", DEFAULT_THEME["textDim"]))
    primary_rgb = _pick_primary(theme, viz_name)
    variant_idx = _pick_variant(viz_name, len(_GAUGE_VARIANTS))
    _GAUGE_VARIANTS[variant_idx](draw, theme, bg_rgb, primary_rgb, text_rgb, textdim_rgb, viz_name)
    _label_band(draw, viz_name, 68, textdim_rgb)
    _save(img, output_path)


def drawBars(theme: dict, output_path: str, viz_name: str = "",
             detection_hint: Optional[str] = None) -> None:
    """Six vertical bars alternating between series[0] and series[1] over a baseline.
    Heights are deterministically seeded from viz_name so same-type vizs render distinctly."""
    img, draw, _bg, _ac, _tx = _new_img(theme)
    series = theme.get("series") or DEFAULT_THEME["series"]
    s0 = hex_to_rgb(series[0]) if series else hex_to_rgb(DEFAULT_THEME["series"][0])
    s1 = hex_to_rgb(series[1]) if len(series) >= 2 else s0
    textdim_rgb = hex_to_rgb(theme.get("textDim", DEFAULT_THEME["textDim"]))
    baseline = 64
    xs = [12, 26, 40, 54, 68, 82]
    seed = abs(hash(viz_name or "bars")) & 0xFFFFFFFF
    heights = []
    for _ in range(6):
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        heights.append(18 + (seed % 31))  # 18..48px
    for i, (x, h) in enumerate(zip(xs, heights)):
        draw.rectangle((x, baseline - h, x + 10, baseline), fill=(s0 if i % 2 == 0 else s1))
    draw.line((8, baseline, 108, baseline), fill=textdim_rgb, width=1)
    _save(img, output_path)


def drawTimeline(theme: dict, output_path: str, viz_name: str = "",
                 detection_hint: Optional[str] = None) -> None:
    """3 horizontal lanes with event segments. Segment widths + middle-lane accent
    bursts seeded from viz_name so different timeline vizs look distinct."""
    img, draw, bg_rgb, accent_rgb, _tx = _new_img(theme)
    series = theme.get("series") or DEFAULT_THEME["series"]
    s0 = hex_to_rgb(series[0]) if series else accent_rgb
    textdim_rgb = hex_to_rgb(theme.get("textDim", DEFAULT_THEME["textDim"]))
    lane_ys = [16, 34, 52]
    lane_h = 8
    seed = abs(hash(viz_name or "timeline")) & 0xFFFFFFFF
    for li, ly in enumerate(lane_ys):
        # Faint lane baseline
        draw.line((8, ly + lane_h + 1, 108, ly + lane_h + 1),
                  fill=textdim_rgb, width=1)
        x = 10
        while x < 100:
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
            seg_w = 8 + (seed % 26)  # 8..34
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
            gap = 3 + (seed % 9)
            # Middle lane occasionally renders in accent (alert highlight)
            is_accent = (li == 1) and (seed & 1) == 0
            color = accent_rgb if is_accent else s0
            if x + seg_w > 105:
                seg_w = max(0, 105 - x)
            if seg_w >= 4:
                draw.rectangle((x, ly, x + seg_w, ly + lane_h), fill=color)
            x += seg_w + gap
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


def drawHeatmap(theme: dict, output_path: str, viz_name: str = "",
                detection_hint: Optional[str] = None) -> None:
    """Grid of cells with per-cell opacity blended toward accent. Cell intensities
    seeded from viz_name so different heatmaps render distinctly. This is the
    'grid' renderer — distinct from drawTable's row-based layout."""
    img, draw, bg_rgb, accent_rgb, _tx = _new_img(theme)
    cols, rows = 8, 4
    margin_x, margin_y = 8, 10
    gap = 2
    cell_w = (PREVIEW_W - 2 * margin_x - (cols - 1) * gap) // cols
    cell_h = (PREVIEW_H - 2 * margin_y - (rows - 1) * gap) // rows
    seed = abs(hash(viz_name or "heatmap")) & 0xFFFFFFFF
    for ry in range(rows):
        for cx in range(cols):
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
            # Intensity buckets: 0 (empty), 0.10, 0.25, 0.45, 0.70, 0.95
            bucket = seed % 6
            intensities = [0.0, 0.10, 0.25, 0.45, 0.70, 0.95]
            alpha = intensities[bucket]
            x0 = margin_x + cx * (cell_w + gap)
            y0 = margin_y + ry * (cell_h + gap)
            x1 = x0 + cell_w
            y1 = y0 + cell_h
            if alpha <= 0.0:
                # Faint cell outline only — preserves grid structure where empty
                grid_rgb = with_alpha(accent_rgb, 0.06, bg_rgb)
                draw.rectangle((x0, y0, x1, y1), fill=grid_rgb)
            else:
                fill_rgb = with_alpha(accent_rgb, alpha, bg_rgb)
                draw.rectangle((x0, y0, x1, y1), fill=fill_rgb)
    _save(img, output_path)


def _kpi_v1_sparkline(draw, theme, bg_rgb, primary_rgb, textdim_rgb, viz_name):
    """V1 — Hero + hash-seeded mini sparkline (the current default)."""
    hero = _pick_hero(viz_name)
    draw.text((PREVIEW_W / 2, 26), hero, fill=primary_rgb,
              font=_load_font(int(round(FONT_HERO * 1.4))), anchor="mm")
    spark_w, spark_h = 80, 8
    spark_x = (PREVIEW_W - spark_w) // 2
    spark_y = 46
    seed = _seed(viz_name)
    points = []
    for i in range(10):
        seed = _lcg(seed)
        y_off = seed % spark_h
        x_pt = spark_x + int(round(i * spark_w / 9))
        points.append((x_pt, spark_y + spark_h - y_off))
    if len(points) >= 2:
        draw.line(points, fill=with_alpha(primary_rgb, 0.55, bg_rgb), width=1)


def _kpi_v2_hero_only(draw, theme, bg_rgb, primary_rgb, textdim_rgb, viz_name):
    """V2 — Minimalist: hero only, larger, no sparkline."""
    hero = _pick_hero(viz_name)
    draw.text((PREVIEW_W / 2, 34), hero, fill=primary_rgb,
              font=_load_font(int(round(FONT_HERO * 1.7))), anchor="mm")


def _kpi_v3_hero_delta(draw, theme, bg_rgb, primary_rgb, textdim_rgb, viz_name):
    """V3 — Hero + small delta-pill (▲ N% or ▼ N%) below."""
    hero = _pick_hero(viz_name)
    draw.text((PREVIEW_W / 2, 28), hero, fill=primary_rgb,
              font=_load_font(int(round(FONT_HERO * 1.3))), anchor="mm")
    sign, pct, direction = _pick_delta(viz_name)
    # Up = primary color (positive). Down = textDim (neutral; avoid red/green
    # encoding to remain colorblind-friendly and palette-respectful).
    delta_color = primary_rgb if direction == "up" else textdim_rgb
    delta_text = sign + " " + str(pct) + "%"
    draw.text((PREVIEW_W / 2, 50), delta_text, fill=delta_color,
              font=_load_font(FONT_LABEL + 1), anchor="mm")


_KPI_VARIANTS = [_kpi_v1_sparkline, _kpi_v2_hero_only, _kpi_v3_hero_delta]


def drawKpi(theme: dict, output_path: str, viz_name: str = "",
            detection_hint: Optional[str] = None) -> None:
    """Large hero number + viz_name label — 3 composition variants (sparkline /
    minimalist / delta-pill), dispatched by hash(viz_name) % 3. Primary color
    rotates through theme.series so same-type KPIs render in different palette
    colors. Hero text picked from HERO_POOL.

    Correction #13 compliant: viz_name drives variant choice, primary color,
    hero text, sparkline shape (V1), delta direction (V3), AND label. Six
    stacked differentiators."""
    img, draw, bg_rgb, _accent, _text = _new_img(theme)
    textdim_rgb = hex_to_rgb(theme.get("textDim", DEFAULT_THEME["textDim"]))
    primary_rgb = _pick_primary(theme, viz_name)
    variant_idx = _pick_variant(viz_name, len(_KPI_VARIANTS))
    _KPI_VARIANTS[variant_idx](draw, theme, bg_rgb, primary_rgb, textdim_rgb, viz_name)
    _label_band(draw, viz_name, 64, textdim_rgb)
    _save(img, output_path)


def _ring_v1_donut(draw, theme, bg_rgb, primary_rgb, text_rgb, textdim_rgb, viz_name):
    """V1 — Classic donut with % in hole (current default)."""
    cx, cy, r_out, r_in = 58, 36, 24, 14
    pct = 0.35 + (_seed(viz_name) % 60) / 100.0
    draw.pieslice((cx - r_out, cy - r_out, cx + r_out, cy + r_out),
                  start=0, end=360, fill=with_alpha(primary_rgb, 0.18, bg_rgb))
    sweep = pct * 360
    draw.pieslice((cx - r_out, cy - r_out, cx + r_out, cy + r_out),
                  start=270, end=(270 + sweep) % 360, fill=primary_rgb)
    draw.ellipse((cx - r_in, cy - r_in, cx + r_in, cy + r_in), fill=bg_rgb)
    pct_text = str(int(round(pct * 100))) + "%"
    draw.text((cx, cy), pct_text, fill=text_rgb,
              font=_load_font(FONT_LABEL + 2), anchor="mm")


def _ring_v2_bead(draw, theme, bg_rgb, primary_rgb, text_rgb, textdim_rgb, viz_name):
    """V2 — Thin ring outline + accent arc to fill + white bead at endpoint."""
    cx, cy, r = 58, 36, 24
    pct = 0.15 + (_seed(viz_name) % 80) / 100.0
    draw.arc((cx - r, cy - r, cx + r, cy + r), start=0, end=360,
             fill=with_alpha(primary_rgb, 0.20, bg_rgb), width=2)
    sweep = pct * 360
    end_deg = (270 + sweep) % 360
    draw.arc((cx - r, cy - r, cx + r, cy + r),
             start=270, end=end_deg, fill=primary_rgb, width=4)
    bead_rad = math.radians(end_deg)
    bx = cx + math.cos(bead_rad) * r
    by = cy + math.sin(bead_rad) * r
    draw.ellipse((bx - 4, by - 4, bx + 4, by + 4), fill=text_rgb)
    draw.ellipse((bx - 2, by - 2, bx + 2, by + 2), fill=primary_rgb)
    hero = _pick_hero(viz_name)
    draw.text((cx, cy), hero, fill=text_rgb,
              font=_load_font(FONT_LABEL + 2), anchor="mm")


def _ring_v3_nested(draw, theme, bg_rgb, primary_rgb, text_rgb, textdim_rgb, viz_name):
    """V3 — Two concentric thin rings, outer + inner at independent hash%."""
    cx, cy = 58, 36
    series = theme.get("series") or []
    pool = [c for c in series if isinstance(c, str) and HEX_COLOR_RE.match(c)]
    secondary_rgb = (hex_to_rgb(pool[_seed(viz_name, _SALT_SECOND) % len(pool)])
                     if pool else primary_rgb)
    pct_outer = 0.30 + (_seed(viz_name, salt=3) % 70) / 100.0
    pct_inner = 0.20 + (_seed(viz_name, salt=11) % 75) / 100.0
    # Outer
    r_out = 24
    draw.arc((cx - r_out, cy - r_out, cx + r_out, cy + r_out),
             start=0, end=360, fill=with_alpha(primary_rgb, 0.20, bg_rgb), width=3)
    sweep_out = pct_outer * 360
    draw.arc((cx - r_out, cy - r_out, cx + r_out, cy + r_out),
             start=270, end=(270 + sweep_out) % 360, fill=primary_rgb, width=3)
    # Inner
    r_in = 16
    draw.arc((cx - r_in, cy - r_in, cx + r_in, cy + r_in),
             start=0, end=360, fill=with_alpha(secondary_rgb, 0.20, bg_rgb), width=3)
    sweep_in = pct_inner * 360
    draw.arc((cx - r_in, cy - r_in, cx + r_in, cy + r_in),
             start=270, end=(270 + sweep_in) % 360, fill=secondary_rgb, width=3)


_RING_VARIANTS = [_ring_v1_donut, _ring_v2_bead, _ring_v3_nested]


def drawRing(theme: dict, output_path: str, viz_name: str = "",
             detection_hint: Optional[str] = None) -> None:
    """Donut — 3 composition variants (classic / bead-marker / nested), dispatched
    by hash(viz_name) % 3. Primary color rotates through theme.series.

    Correction #13 compliant: viz_name drives variant choice, primary color,
    fill percentage(s), hero text (V2), AND label band."""
    img, draw, bg_rgb, _accent, text_rgb = _new_img(theme)
    textdim_rgb = hex_to_rgb(theme.get("textDim", DEFAULT_THEME["textDim"]))
    primary_rgb = _pick_primary(theme, viz_name)
    variant_idx = _pick_variant(viz_name, len(_RING_VARIANTS))
    _RING_VARIANTS[variant_idx](draw, theme, bg_rgb, primary_rgb, text_rgb, textdim_rgb, viz_name)
    _label_band(draw, viz_name, 68, textdim_rgb)
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
    """Tier 3 fallback (Phase 41 D-04): brand bg + viz name in Inter + motif from hint.
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


# ---- Section 7c: Composite layout renderers (Correction #14, v6.0.6) ----
#
# These render *compositions* (multi-element fingerprints) rather than single
# data primitives. Routed via @preview-layout annotation, NOT @viz-type.
# Each maps to a common real-viz composition observed in production packs.
#
# Naming: "<primitive>-<modifier>". kpi-ratio = KPI showing a ratio (X/Y).
# heatmap-with-marks = heatmap + highlighted cells + corner marker.
# composite-stack = subject ID + multiple stacked mini-charts.

def _sparkline_helper(draw, x, y, w, h, color, seed):
    """Draw a 10-point hash-seeded sparkline; helper used by composite renderers."""
    pts = []
    for i in range(10):
        seed = _lcg(seed)
        y_off = seed % h
        pts.append((x + int(round(i * w / 9)), y + h - y_off))
    if len(pts) >= 2:
        draw.line(pts, fill=color, width=1)


def drawKpiRatioFooter(theme: dict, output_path: str, viz_name: str = "",
                       detection_hint: Optional[str] = None) -> None:
    """Composition: big ratio (X/Y) top-left + delta-pill + sparkline top-right
    + 2-stat footer row. Modeled on the WWF active_collars panel.

    Hash-derived ratio + delta sign/percent + sparkline + footer stats.
    Correction #13 compliant — viz_name drives ratio choice, primary color
    (rotates through series), and label band."""
    img, draw, bg_rgb, accent_rgb, text_rgb = _new_img(theme)
    textdim_rgb = hex_to_rgb(theme.get("textDim", DEFAULT_THEME["textDim"]))
    primary_rgb = _pick_primary(theme, viz_name)

    seed = _seed(viz_name)
    nums = [("142", "168"), ("87", "94"), ("231", "256"), ("4.7", "5.0"),
            ("62", "75"), ("18", "24"), ("3.2K", "4.0K"), ("89", "100")]
    num, den = nums[seed % len(nums)]

    # Big numerator top-left
    num_font = _load_font(int(round(FONT_HERO * 1.4)))
    draw.text((8, 16), num, fill=text_rgb, font=num_font, anchor="lm")
    num_w = _measure_text(draw, num, num_font, int(round(FONT_HERO * 1.4)))
    draw.text((8 + num_w + 4, 22), "/ " + den, fill=textdim_rgb,
              font=_load_font(FONT_LABEL), anchor="lm")

    # Delta indicator below
    seed = _lcg(seed)
    pct = 2 + (seed % 20)
    sign = "▼" if (seed >> 4) & 1 else "▲"
    draw.text((8, 36), sign + " " + str(pct) + "%", fill=primary_rgb,
              font=_load_font(FONT_LABEL), anchor="lm")

    # Mini sparkline top-right
    _sparkline_helper(draw, PREVIEW_W - 46, 18, 40, 10,
                      with_alpha(primary_rgb, 0.6, bg_rgb), _lcg(seed))

    # Footer divider + 2-stat row
    draw.line((6, 48, PREVIEW_W - 6, 48),
              fill=with_alpha(textdim_rgb, 0.3, bg_rgb), width=1)
    # Footer stats hash-picked from small candidate pools
    seed = _lcg(seed)
    foot_left_pool = ["57 MIN", "12 SEC", "1.2 H", "47 MIN", "3.4 H"]
    foot_right_pool = ["84.5%", "92.1%", "78.3%", "99.0%", "61.7%"]
    draw.text((8, 56), foot_left_pool[seed % len(foot_left_pool)],
              fill=textdim_rgb, font=_load_font(FONT_TICK), anchor="lm")
    draw.text((PREVIEW_W - 8, 56), foot_right_pool[seed % len(foot_right_pool)],
              fill=textdim_rgb, font=_load_font(FONT_TICK), anchor="rm")

    _label_band(draw, viz_name, 68, textdim_rgb)
    _save(img, output_path)


def drawHeatmapWithMarks(theme: dict, output_path: str, viz_name: str = "",
                         detection_hint: Optional[str] = None) -> None:
    """Composition: heatmap grid + 2 hot-bordered cells + corner compass triangle.
    Modeled on the WWF species_grid panel.

    Same per-cell hash-seeded intensities as drawHeatmap, but adds the
    accent-bordered "hot zone" marks and the corner direction indicator that
    real spatial/grid vizs typically have."""
    img, draw, bg_rgb, accent_rgb, text_rgb = _new_img(theme)
    textdim_rgb = hex_to_rgb(theme.get("textDim", DEFAULT_THEME["textDim"]))
    primary_rgb = _pick_primary(theme, viz_name)

    cols, rows = 8, 4
    margin_x, margin_y, gap = 6, 10, 1
    cell_w = (PREVIEW_W - 2 * margin_x - (cols - 1) * gap) // cols
    cell_h = ((PREVIEW_H - 18) - 2 * margin_y - (rows - 1) * gap) // rows

    seed = _seed(viz_name)
    intensities = []
    for ry in range(rows):
        for cx in range(cols):
            seed = _lcg(seed)
            alpha = [0.0, 0.10, 0.20, 0.35, 0.55, 0.80][seed % 6]
            intensities.append((ry, cx, alpha))
            x0 = margin_x + cx * (cell_w + gap)
            y0 = margin_y + ry * (cell_h + gap)
            draw.rectangle((x0, y0, x0 + cell_w, y0 + cell_h),
                           fill=with_alpha(primary_rgb, max(alpha, 0.06), bg_rgb))

    # Top-2 cells get accent borders (hot zones)
    intensities.sort(key=lambda t: -t[2])
    for ry, cx, _ in intensities[:2]:
        x0 = margin_x + cx * (cell_w + gap)
        y0 = margin_y + ry * (cell_h + gap)
        draw.rectangle((x0, y0, x0 + cell_w, y0 + cell_h),
                       outline=accent_rgb, width=1)

    # Corner compass triangle (top-right)
    cr_x, cr_y = PREVIEW_W - 8, 8
    draw.polygon([(cr_x, cr_y - 3), (cr_x - 2, cr_y + 2), (cr_x + 2, cr_y + 2)],
                 fill=accent_rgb)

    _label_band(draw, viz_name, 68, textdim_rgb)
    _save(img, output_path)


def drawCompositeStack(theme: dict, output_path: str, viz_name: str = "",
                       detection_hint: Optional[str] = None) -> None:
    """Composition: big subject identifier left + 3 stacked mini-rows on right
    (sparkline / categorical bars / sparkline with spike marker).
    Modeled on the WWF mc01_composite panel.

    Subject ID is the viz_name's first underscore segment, uppercased. Categorical
    bars rotate through series colors, with occasional accent bursts (alarmed-event
    signal). Bottom row line has a hash-positioned spike + accent marker."""
    img, draw, bg_rgb, accent_rgb, text_rgb = _new_img(theme)
    textdim_rgb = hex_to_rgb(theme.get("textDim", DEFAULT_THEME["textDim"]))
    series = theme.get("series") or [theme.get("accent", DEFAULT_THEME["accent"])]
    s0 = hex_to_rgb(series[0])
    s1 = hex_to_rgb(series[1]) if len(series) > 1 else s0
    s2 = hex_to_rgb(series[2]) if len(series) > 2 else s0
    s3 = hex_to_rgb(series[3]) if len(series) > 3 else s1

    subject = (viz_name or "viz").split("_")[0].upper()
    draw.text((8, 14), subject, fill=text_rgb,
              font=_load_font(int(round(FONT_HERO * 1.0))), anchor="lm")

    seed = _seed(viz_name)
    # Row 1: mini sparkline
    _sparkline_helper(draw, PREVIEW_W - 76, 26, 70, 6, s0, seed)

    # Row 2: categorical bars (24 thin, palette rotation, occasional accent burst)
    r2_y, r2_w, r2_x, r2_h = 40, 100, 6, 6
    n_bars = 24
    bar_w = (r2_w - (n_bars - 1)) // n_bars
    palette = [s0, s3, s1, s2]
    for i in range(n_bars):
        seed = _lcg(seed)
        color = palette[seed % len(palette)]
        if (seed % 16) == 0:
            color = accent_rgb
        bx = r2_x + i * (bar_w + 1)
        draw.rectangle((bx, r2_y, bx + bar_w, r2_y + r2_h), fill=color)

    # Row 3: line with spike + accent marker
    r3_y, r3_w, r3_x, r3_h = 52, 100, 6, 8
    spike_pos = 4 + (_seed(viz_name, salt=7) % 6)
    pts = []
    for i in range(12):
        seed = _lcg(seed)
        y_off = (r3_h - 1) if i == spike_pos else r3_h // 2 + ((seed % 3) - 1)
        pts.append((r3_x + int(round(i * r3_w / 11)), r3_y + r3_h - y_off))
    if len(pts) >= 2:
        draw.line(pts, fill=text_rgb, width=1)
    sx, sy = pts[spike_pos]
    draw.ellipse((sx - 2, sy - 2, sx + 2, sy + 2), fill=accent_rgb)

    _label_band(draw, viz_name, 68, textdim_rgb)
    _save(img, output_path)


# ---- Section 8: Dispatch function ----

DISPATCH = {
    "gauge": drawGauge, "bars": drawBars, "bar": drawBars,
    "line": drawLine, "table": drawTable,
    "grid": drawHeatmap, "heatmap": drawHeatmap, "matrix": drawHeatmap,
    "kpi": drawKpi, "ring": drawRing, "donut": drawRing,
    "timeline": drawTimeline,
}

# Tier 1a layout dispatch — compositional renderers, picked via @preview-layout.
# Distinct from DISPATCH because layouts describe full compositions, not primitives.
# Synonyms (kpi-ratio / kpi-ratio-footer / ratio-footer) all map to the same
# renderer so the annotation can be naturally worded.
LAYOUT_DISPATCH = {
    "kpi-ratio":          drawKpiRatioFooter,
    "kpi-ratio-footer":   drawKpiRatioFooter,
    "ratio-footer":       drawKpiRatioFooter,
    "heatmap-with-marks": drawHeatmapWithMarks,
    "grid-with-marks":    drawHeatmapWithMarks,
    "heatmap-hotzones":   drawHeatmapWithMarks,
    "composite-stack":    drawCompositeStack,
    "subject-stack":      drawCompositeStack,
    "telemetry-stack":    drawCompositeStack,
}


def dispatch(tier: int, type_name: str, theme: dict, output_path: str,
             viz_name: str, detection_hint: Optional[str]) -> None:
    """Route to the appropriate draw function based on detection result.

    Detection-hint 'layout' (set by Tier 1a) routes to LAYOUT_DISPATCH first.
    Falls back to DISPATCH (primitive renderers) if the layout name is unknown
    — keeps a misspelled @preview-layout from breaking the build."""
    if tier == 3:
        drawGeneric(theme, output_path, viz_name, detection_hint)
        return
    if detection_hint == "layout":
        renderer = LAYOUT_DISPATCH.get(type_name)
        if renderer is not None:
            renderer(theme, output_path, viz_name, detection_hint)
            return
        # Unknown layout name — fall through to primitive dispatch
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
