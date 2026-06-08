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

# === KNOWN-CORRECTIONS HARDENING (Phase 47, 2026-06-08) ===
#
# K1b/K5/K6/K7 extend the K1/K2/K3 enforcement: each closes a real shipped
# failure mode from test51_cucm (Cisco UC) or test52_asus_rog (Asus ROG)
# under v6.0.8. Implementation style mirrors K1/K2/K3 (pure bash + grep
# + awk + sed, no new dependencies, BSD/macOS-compatible -oE only).

echo ""
echo "--- Phase 47 hardening checks (K1b/K5/K6/K7) ---"

# K1b — Color picker opt() value MUST reach a Canvas (ctx.*) call
# (Correction 23 in KNOWN-CORRECTIONS.md — test52 rog_session_timeline _hoverTint)
#
# Heuristic: capture the LHS variable name assigned from opt("<key>"...), then
# verify that name appears elsewhere in the file (preferably on a ctx.* line,
# but ANY non-assignment reference counts as "reached" because helper functions
# like drawBand(color, ...) consume the value indirectly). This widens the
# CONTEXT.md draft 30-line window to cover cross-function reach (e.g.
# mos_health_gauge _resolveTheme -> drawBand -> ctx.fillStyle).
check_k1b() {
    for f in "$APP_DIR"/appserver/static/visualizations/*/formatter.html; do
        [ -f "$f" ] || continue
        VIZ_DIR=$(dirname "$f")
        VIZ=$(basename "$VIZ_DIR")
        SRC="$VIZ_DIR/src/visualization_source.js"
        [ -f "$SRC" ] || SRC="$VIZ_DIR/visualization_source.js"
        [ -f "$SRC" ] || continue

        PICKER_KEYS=$(grep -oE 'splunk-color-picker[^>]*name="\{\{VIZ_NAMESPACE\}\}\.[a-zA-Z0-9_]+' "$f" 2>/dev/null \
                      | sed -E 's/.*\{\{VIZ_NAMESPACE\}\}\.//' | sort -u)

        for K in $PICKER_KEYS; do
            # Defensive skip — K1 already FAILed when opt() is not called at all
            grep -qE "opt\([\"']${K}[\"']" "$SRC" || continue

            # Capture LHS variable names from any assignment whose RHS calls opt("K"...)
            # Patterns: `var name = ... opt("K"...)`, `c.name = ... opt("K"...)`, `t.name = ... opt("K"...)`
            LHS_NAMES=$(grep -oE "(var[[:space:]]+|c\.|t\.)[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*=[^;]*opt\([\"']${K}[\"']" "$SRC" 2>/dev/null \
                        | grep -oE "(var[[:space:]]+|c\.|t\.)[a-zA-Z_][a-zA-Z0-9_]*" \
                        | sed -E 's/^(var[[:space:]]+|c\.|t\.)//' | sort -u)

            # If no LHS captured, the opt() call is inline (e.g. `someFn(opt("K"))`)
            # — that's a direct reach into a call, count as PASS.
            if [ -z "$LHS_NAMES" ]; then
                continue
            fi

            FOUND_REACH=0
            for LHS in $LHS_NAMES; do
                # Primary signal: LHS name appears on a line containing ctx.
                if grep -E "ctx\." "$SRC" 2>/dev/null | grep -qE "[.[:space:]]${LHS}\b"; then
                    FOUND_REACH=1
                    break
                fi
                # Secondary signal: LHS name appears in ANY line other than its own
                # opt-assignment (helper-function reach, e.g. drawBand(t.good, ...)).
                # Count total occurrences; if > 1, it is referenced beyond the assignment.
                OCCURRENCES=$(grep -cE "\b${LHS}\b" "$SRC" 2>/dev/null || echo 0)
                if [ "${OCCURRENCES:-0}" -gt 1 ]; then
                    FOUND_REACH=1
                    break
                fi
            done

            if [ "$FOUND_REACH" -eq 0 ]; then
                fail K1b "$VIZ: color picker \"$K\" is opt()-read but the value never reaches a ctx.* call (dead value). See KNOWN-CORRECTIONS.md #23."
            fi
        done
    done
}
check_k1b

# K5 — Text-input / number-input opt() value MUST reach a Canvas (ctx.*) call
# (Correction 15 in KNOWN-CORRECTIONS.md — test51 accentIntensity / tollThreshold / synthThreshold)
#
# Exemption: keys ending in "Field" (e.g. mosField, rigField, recordsField) are
# field-name overrides, not visual params. Researcher A5 empirically confirmed
# the suffix convention.
check_k5() {
    for f in "$APP_DIR"/appserver/static/visualizations/*/formatter.html; do
        [ -f "$f" ] || continue
        VIZ_DIR=$(dirname "$f")
        VIZ=$(basename "$VIZ_DIR")
        SRC="$VIZ_DIR/src/visualization_source.js"
        [ -f "$SRC" ] || SRC="$VIZ_DIR/visualization_source.js"
        [ -f "$SRC" ] || continue

        INPUT_KEYS=$(grep -oE 'splunk-(text|number)-input[^>]*name="\{\{VIZ_NAMESPACE\}\}\.[a-zA-Z0-9_]+' "$f" 2>/dev/null \
                     | sed -E 's/.*\{\{VIZ_NAMESPACE\}\}\.//' | sort -u)

        for K in $INPUT_KEYS; do
            # Exempt field-name overrides (suffix convention)
            case "$K" in *Field) continue;; esac

            # Case A: opt() never called -> dead UI (FAIL)
            if ! grep -qE "opt\([\"']${K}[\"']" "$SRC"; then
                fail K5 "$VIZ: text-input \"$K\" is declared in formatter.html but never opt()-read (dead UI). See KNOWN-CORRECTIONS.md #15."
                continue
            fi

            # Case B: opt() called -> verify reach via variable-name tracking
            LHS_NAMES=$(grep -oE "(var[[:space:]]+|c\.|t\.|this\.)[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*=[^;]*opt\([\"']${K}[\"']" "$SRC" 2>/dev/null \
                        | grep -oE "(var[[:space:]]+|c\.|t\.|this\.)[a-zA-Z_][a-zA-Z0-9_]*" \
                        | sed -E 's/^(var[[:space:]]+|c\.|t\.|this\.)//' | sort -u)

            # If no LHS captured, opt() is consumed inline -> PASS (e.g. `ctx.lineWidth = opt("lineWidth")`)
            if [ -z "$LHS_NAMES" ]; then
                continue
            fi

            FOUND_REACH=0
            for LHS in $LHS_NAMES; do
                if grep -E "ctx\." "$SRC" 2>/dev/null | grep -qE "[.[:space:]]${LHS}\b"; then
                    FOUND_REACH=1
                    break
                fi
                OCCURRENCES=$(grep -cE "\b${LHS}\b" "$SRC" 2>/dev/null || echo 0)
                if [ "${OCCURRENCES:-0}" -gt 1 ]; then
                    FOUND_REACH=1
                    break
                fi
            done

            if [ "$FOUND_REACH" -eq 0 ]; then
                fail K5 "$VIZ: text-input \"$K\" is opt()-read but the value never reaches a ctx.* call (dead UI). See KNOWN-CORRECTIONS.md #15."
            fi
        done
    done
}
check_k5

# K6 — Every distinct font family in ctx.font = '... "<family>" ...' MUST have
# a matching @font-face block in the same viz's visualization.css.
# (Correction 26 in KNOWN-CORRECTIONS.md — test52 Chakra Petch / JetBrains Mono)
#
# Scope: grep only */src/visualization_source.js (NOT shared/theme.js — Pitfall #3).
# Exempt families: CSS generics + bundled/universal system fonts.
check_k6() {
    EXEMPT_FAMILIES="sans-serif monospace serif system-ui Inter Arial Helvetica"

    for f in "$APP_DIR"/appserver/static/visualizations/*/src/visualization_source.js; do
        [ -f "$f" ] || continue
        VIZ_DIR=$(dirname "$(dirname "$f")")
        VIZ=$(basename "$VIZ_DIR")
        CSS="$VIZ_DIR/visualization.css"

        # Extract every quoted family token from ctx.font assignment lines.
        # Pattern accepts either single- or double-quoted outer strings;
        # the family token itself is always double-quoted inside.
        # Iterate newline-delimited (families may contain spaces, e.g. "Chakra Petch").
        FAMILIES=$(grep -hE 'ctx\.font[[:space:]]*=' "$f" 2>/dev/null \
                   | grep -oE '"[A-Za-z][A-Za-z0-9 _-]*"' | tr -d '"' | sort -u)

        OLDIFS="$IFS"
        IFS='
'
        for FAM in $FAMILIES; do
            IFS="$OLDIFS"
            # Skip empty
            [ -z "$FAM" ] && { IFS='
'; continue; }
            # Skip exempt families
            IS_EXEMPT=0
            for E in $EXEMPT_FAMILIES; do
                if [ "$FAM" = "$E" ]; then
                    IS_EXEMPT=1
                    break
                fi
            done
            if [ "$IS_EXEMPT" -eq 1 ]; then
                IFS='
'
                continue
            fi

            # Require @font-face block in visualization.css for this family
            if [ ! -f "$CSS" ] || ! grep -qE "@font-face[^}]*font-family:[[:space:]]*[\"']${FAM}[\"']" "$CSS"; then
                fail K6 "$VIZ: font \"$FAM\" used in ctx.font but no @font-face declaration in visualization.css. See KNOWN-CORRECTIONS.md #26."
            fi
            IFS='
'
        done
        IFS="$OLDIFS"
    done
}
check_k6

# K7 — Dashboard XML viz type prefix MUST match parent app's [package] id
# (Correction 24 in KNOWN-CORRECTIONS.md — test52 cross-app merge)
#
# Skip standalone viz packs (no views/ directory). Exempt Splunk built-in
# type prefixes: splunk, ds, input, drilldown.
check_k7() {
    # Skip if no dashboards (standalone viz pack)
    [ -d "$APP_DIR/default/data/ui/views" ] || return 0
    [ -f "$APP_DIR/default/app.conf" ] || return 0

    # Extract parent app id from [package] stanza
    APP_ID=$(awk '/^\[package\]/{in_pkg=1;next} /^\[/{in_pkg=0} in_pkg && /^[[:space:]]*id[[:space:]]*=/{
        sub(/^[[:space:]]*id[[:space:]]*=[[:space:]]*/,"");
        sub(/[[:space:]]*$/,"");
        print; exit
    }' "$APP_DIR/default/app.conf")
    [ -n "$APP_ID" ] || return 0

    for xml in "$APP_DIR"/default/data/ui/views/*.xml; do
        [ -f "$xml" ] || continue
        XML=$(basename "$xml")

        # Extract all "type": "<prefix>.<viz>" prefixes (just the prefix part)
        PREFIXES=$(grep -oE '"type":[[:space:]]*"[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*"' "$xml" 2>/dev/null \
                   | grep -oE '"[a-zA-Z_][a-zA-Z0-9_]*\.' | tr -d '".' | sort -u)

        for PFX in $PREFIXES; do
            # Exempt Splunk built-in prefixes
            case "$PFX" in splunk|ds|input|drilldown) continue;; esac
            if [ "$PFX" != "$APP_ID" ]; then
                fail K7 "$XML: viz type prefix \"$PFX\" does not match parent app id \"$APP_ID\" (incomplete cross-app merge). See KNOWN-CORRECTIONS.md #24."
            fi
        done
    done
}
check_k7

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
