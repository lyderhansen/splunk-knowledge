#!/bin/bash
# validate.sh — grep-based validator for splunk-custom-viz apps.
#
# Usage: validate.sh <app_dir> [<design_lock_path>]
#
# Exit codes:
#   0 — all checks pass (warnings allowed)
#   1 — one or more FAIL checks
#   2 — usage error

set -u

APP_DIR="${1:-}"
LOCK_PATH="${2:-.cv/$(basename "$APP_DIR")/DESIGN-LOCK.md}"

if [ -z "$APP_DIR" ] || [ ! -d "$APP_DIR" ]; then
    echo "Usage: validate.sh <app_dir> [<design_lock_path>]" >&2
    exit 2
fi

FAIL=0
WARN=0

fail() {
    echo "  FAIL $1: $2"
    FAIL=$((FAIL + 1))
}

warn() {
    echo "  WARN $1: $2"
    WARN=$((WARN + 1))
}

ok() {
    echo "  OK   $1"
}

echo "============================================"
echo "  splunk-custom-viz validator"
echo "  App: $APP_DIR"
echo "============================================"

# === FORMATTER CHECKS ===

echo ""
echo "--- formatter.html checks ---"

for f in "$APP_DIR"/appserver/static/visualizations/*/formatter.html; do
    [ -f "$f" ] || continue
    VIZ=$(basename "$(dirname "$f")")

    # B10 — VIZ_NAMESPACE required, no hardcoded namespace
    HARDCODED=$(grep -E 'name="[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\.' "$f" 2>/dev/null | grep -cv '{{VIZ_NAMESPACE}}' || true)
    if [ "$HARDCODED" -gt 0 ]; then
        fail B10 "$VIZ: $HARDCODED hardcoded namespace(s) in formatter — use {{VIZ_NAMESPACE}}"
    fi

    # B7 — value= not default=
    DEFAULT_COUNT=$(grep -cE 'default="[^"]*"' "$f" 2>/dev/null || true)
    if [ "$DEFAULT_COUNT" -gt 0 ]; then
        fail B7 "$VIZ: $DEFAULT_COUNT use(s) of default= — must be value="
    fi

    # B5 — type="custom" on color pickers
    PICKERS=$(grep -c '<splunk-color-picker' "$f" 2>/dev/null || true)
    CUSTOM=$(grep -cE 'splunk-color-picker[^>]*type="custom"' "$f" 2>/dev/null || true)
    if [ "$PICKERS" -gt "$CUSTOM" ]; then
        fail B5 "$VIZ: $((PICKERS - CUSTOM)) color picker(s) missing type=\"custom\""
    fi

    # B20 — themeMode default "auto"
    if grep -q 'themeMode' "$f"; then
        if ! grep -qE 'name="{{VIZ_NAMESPACE}}\.themeMode"[^>]*value="auto"' "$f"; then
            fail B20 "$VIZ: themeMode default must be \"auto\""
        fi
    fi

    # Section labels
    SECTIONS=$(grep -c 'class="splunk-formatter-section"' "$f" 2>/dev/null || true)
    if [ "$SECTIONS" -lt 3 ]; then
        warn "SEC" "$VIZ: only $SECTIONS section(s) — minimum 3 (Data display, Color and style, Effects)"
    fi
done

# === JS CHECKS ===

echo ""
echo "--- visualization_source.js checks ---"

for f in "$APP_DIR"/appserver/static/visualizations/*/src/visualization_source.js; do
    [ -f "$f" ] || continue
    VIZ=$(basename "$(dirname "$(dirname "$f")")")

    # F3 — ES5 only (no const/let/arrow/template literals)
    ES6=$(grep -cE '\b(const|let)\s|=>|`[^`]*`' "$f" 2>/dev/null || true)
    if [ "$ES6" -gt 0 ]; then
        fail F3 "$VIZ: $ES6 ES6+ syntax violation(s) (const/let/arrow/template literal)"
    fi

    # F6 — require()/module.exports, not define()
    if grep -qE '^\s*define\s*\(' "$f"; then
        fail F6 "$VIZ: uses define() — source must use require()/module.exports, build_flat.js adds AMD wrapper"
    fi

    # F10 — no jQuery
    if grep -qE '\$\.|jQuery|\$\(' "$f"; then
        warn F10 "$VIZ: possible jQuery usage — DS v2 has no \$el; use standard DOM"
    fi

    # B22 — hexFromSplunk wraps color picker reads
    COLOR_READS=$(grep -cE "opt\(['\"][^'\"]*[Cc]olor['\"]" "$f" 2>/dev/null || true)
    HEX_WRAPS=$(grep -cE 'hexFromSplunk\(' "$f" 2>/dev/null || true)
    if [ "$COLOR_READS" -gt 0 ] && [ "$HEX_WRAPS" -lt 1 ]; then
        warn B22 "$VIZ: reads color settings without hexFromSplunk wrapper — Splunk may return integers"
    fi
done

# === STRUCTURE CHECKS ===

echo ""
echo "--- structure checks ---"

# app.conf
if [ ! -f "$APP_DIR/default/app.conf" ]; then
    fail STR "missing default/app.conf"
else
    if ! grep -q '^\[package\]' "$APP_DIR/default/app.conf"; then
        fail STR "app.conf missing [package] stanza"
    fi
    if ! grep -qE '^version\s*=\s*[0-9]+\.[0-9]+\.[0-9]+' "$APP_DIR/default/app.conf"; then
        fail STR "app.conf version must be Major.Minor.Revision"
    fi
fi

# default.meta
if [ ! -f "$APP_DIR/metadata/default.meta" ]; then
    fail STR "missing metadata/default.meta"
fi

# theme.js
if [ ! -f "$APP_DIR/shared/theme.js" ]; then
    fail STR "missing shared/theme.js"
fi

# .DS_Store / ._* / local/
if find "$APP_DIR" -name '.DS_Store' -o -name '._*' 2>/dev/null | grep -q .; then
    fail STR "macOS metadata files found (.DS_Store / ._*) — must be cleaned before tar"
fi
if [ -d "$APP_DIR/local" ]; then
    fail STR "local/ directory present — must be removed for Splunk Cloud"
fi

# === KNOWN-CORRECTIONS ENFORCEMENT (2026-05-25) ===
#
# These checks enforce the corrections in KNOWN-CORRECTIONS.md. Each one prevents
# a real shipped failure mode that previously slipped past validation.

echo ""
echo "--- KNOWN-CORRECTIONS checks ---"

# K1 — Every color picker in formatter.html MUST be consumed by visualization_source.js
# (Correction 2 in KNOWN-CORRECTIONS.md)
for f in "$APP_DIR"/appserver/static/visualizations/*/formatter.html; do
    [ -f "$f" ] || continue
    VIZ_DIR=$(dirname "$f")
    VIZ=$(basename "$VIZ_DIR")
    SRC="$VIZ_DIR/src/visualization_source.js"
    [ -f "$SRC" ] || SRC="$VIZ_DIR/visualization_source.js"
    [ -f "$SRC" ] || continue

    # Extract every color picker key from formatter.html. Pattern matches:
    #   <splunk-color-picker name="{{VIZ_NAMESPACE}}.someColor" ...>
    PICKER_KEYS=$(grep -oE 'splunk-color-picker[^>]*name="\{\{VIZ_NAMESPACE\}\}\.[a-zA-Z0-9_]+' "$f" 2>/dev/null \
                  | sed -E 's/.*\{\{VIZ_NAMESPACE\}\}\.//' | sort -u)

    for K in $PICKER_KEYS; do
        # Must appear as opt("K"...) somewhere in the source
        if ! grep -qE "opt\(['\"]${K}['\"]" "$SRC"; then
            fail K1 "$VIZ: color picker \"$K\" in formatter.html is not consumed by visualization_source.js (dead UI). Add to _resolveTheme(t, opt). See KNOWN-CORRECTIONS.md #2."
        fi
    done
done

# K2 — invalidateUpdateView() MUST NOT appear inside requestAnimationFrame callback
# (Correction 4 in KNOWN-CORRECTIONS.md — Patrol Coverage stack overflow)
for f in "$APP_DIR"/appserver/static/visualizations/*/src/visualization_source.js; do
    [ -f "$f" ] || continue
    VIZ=$(basename "$(dirname "$(dirname "$f")")")

    # Match: requestAnimationFrame(function(...) { ... invalidateUpdateView( ... }) within ~8 lines.
    # Ignore matches inside // comment lines (otherwise the safety note in canonical code
    # itself would trigger). Require an opening paren after invalidateUpdateView to confirm a call.
    HITS=$(awk '
        /requestAnimationFrame/ { inRAF = 1; window = 8; next }
        inRAF && window > 0 {
            # Strip leading whitespace, check if line starts with //
            line = $0
            sub(/^[ \t]+/, "", line)
            isComment = (substr(line, 1, 2) == "//")
            if (!isComment && /invalidateUpdateView\(/) { print FILENAME ":" NR; found = 1 }
            window--
            if (window <= 0) inRAF = 0
        }
        END { if (found) exit 0; else exit 1 }
    ' "$f" 2>/dev/null)

    if [ -n "$HITS" ]; then
        fail K2 "$VIZ: invalidateUpdateView() inside requestAnimationFrame — re-enters synchronously, blows stack. Use cached-config pattern. See KNOWN-CORRECTIONS.md #4."
    fi
done

# K3 — Dashboard XML (or JSON in CDATA) MUST NOT contain bare-string token defaults
# (Correction 1 in KNOWN-CORRECTIONS.md)
# Look in default/data/ui/views/*.xml for tokens defaults pattern
for xml in "$APP_DIR"/default/data/ui/views/*.xml; do
    [ -f "$xml" ] || continue
    XML=$(basename "$xml")
    # Pattern: "selected_anything": "*"   (bare string instead of object)
    # Match also: "selected_*": "literal_string" — any bare string default
    if grep -qE '"selected_[a-zA-Z0-9_]+"[[:space:]]*:[[:space:]]*"[^{]*"' "$xml"; then
        fail K3 "$XML: bare-string token default found (e.g. \"selected_x\":\"*\") — must be {\"value\":\"*\"}. See KNOWN-CORRECTIONS.md #1."
    fi
done

# === DESIGN FIDELITY CHECK (NEW in v6) ===

echo ""
echo "--- design fidelity checks ---"

if [ -f "$LOCK_PATH" ]; then
    # For each viz: if spec declares an animation, source should have requestAnimationFrame
    # or setInterval. If spec declares linear_gradient fills, source should have
    # createLinearGradient.
    #
    # This is contract verification ("did you implement what you committed to"),
    # not aesthetic judgment.

    # Grep the lock for animation-declaring vizs
    if grep -qE 'breathe_animation|pulse|entrance' "$LOCK_PATH" 2>/dev/null; then
        for f in "$APP_DIR"/appserver/static/visualizations/*/src/visualization_source.js; do
            [ -f "$f" ] || continue
            VIZ=$(basename "$(dirname "$(dirname "$f")")")

            if grep -qE "^\s*-\s*name:\s*${VIZ}\s*$" "$LOCK_PATH"; then
                # Check if this viz's lock entry declares an animation
                if awk "/name: ${VIZ}/,/^  - name:|^[a-z]+:/" "$LOCK_PATH" | grep -qE 'breathe_animation|pulse|entrance'; then
                    if ! grep -qE 'requestAnimationFrame|setInterval' "$f"; then
                        warn FID "$VIZ: spec declares animation but source has no requestAnimationFrame/setInterval"
                    fi
                fi
            fi
        done
    fi

    # Gradient check
    if grep -qE 'linear_gradient|radial_gradient' "$LOCK_PATH" 2>/dev/null; then
        for f in "$APP_DIR"/appserver/static/visualizations/*/src/visualization_source.js; do
            [ -f "$f" ] || continue
            VIZ=$(basename "$(dirname "$(dirname "$f")")")

            if awk "/name: ${VIZ}/,/^  - name:|^[a-z]+:/" "$LOCK_PATH" | grep -qE 'linear_gradient|radial_gradient'; then
                if ! grep -qE 'createLinearGradient|createRadialGradient' "$f"; then
                    warn FID "$VIZ: spec declares gradient but source has no createLinearGradient/Radial"
                fi
            fi
        done
    fi
else
    warn FID "no DESIGN-LOCK.md at $LOCK_PATH — skipping fidelity check"
fi

# === ABSOLUTE BANS GREP (BAN-1, BAN-2) ===

echo ""
echo "--- absolute bans grep ---"

for f in "$APP_DIR"/appserver/static/visualizations/*/visualization.css; do
    [ -f "$f" ] || continue
    VIZ=$(basename "$(dirname "$f")")

    if grep -qE 'border-(left|right):\s*[2-9][0-9]*px' "$f"; then
        warn BAN1 "$VIZ: border-left/right > 1px detected (BAN-1: side-stripe borders)"
    fi
    if grep -qE 'background-clip:\s*text' "$f"; then
        warn BAN2 "$VIZ: background-clip:text detected (BAN-2: gradient text)"
    fi
done

# Canvas-equivalent BANs in visualization_source.js
for f in "$APP_DIR"/appserver/static/visualizations/*/src/visualization_source.js; do
    [ -f "$f" ] || continue
    VIZ=$(basename "$(dirname "$(dirname "$f")")")

    # BAN-1 Canvas variant: drawing a colored vertical bar at left/right edge as status indicator
    # Heuristic: ctx.fillRect(0, ..., 2..5, h) — narrow bar at x=0 with width 2-5px
    if grep -qE 'fillRect\(\s*0\s*,\s*[^,]+,\s*[2-5]\s*,' "$f"; then
        warn BAN1 "$VIZ: possible side-stripe drawing pattern (BAN-1) in visualization_source.js"
    fi
    # BAN-2 Canvas variant: gradient as fillStyle for fillText
    if grep -B 1 -A 1 'createLinearGradient\|createRadialGradient' "$f" | grep -q 'fillText\|fillStyle.*=.*grad'; then
        # Specifically: if a gradient is created and then used as fillStyle before fillText
        if grep -qE 'fillStyle\s*=\s*\w*[Gg]rad.*\n.*fillText' "$f" 2>/dev/null; then
            warn BAN2 "$VIZ: gradient as text fill pattern (BAN-2) in visualization_source.js"
        fi
    fi
done

# === SUMMARY ===

echo ""
echo "============================================"
echo "  Validation summary"
echo "============================================"
echo "  FAILs: $FAIL"
echo "  WARNs: $WARN"
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo "  Validation FAILED — fix errors before packaging."
    exit 1
fi

echo "  Validation passed."
exit 0
