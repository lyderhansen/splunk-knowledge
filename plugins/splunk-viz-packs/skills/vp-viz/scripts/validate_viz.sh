#!/bin/bash
# validate_viz.sh — post-build validator for Splunk custom viz apps
# Usage: bash validate_viz.sh [--repair] /path/to/app_dir
# Exit code: 0 = all pass, 1 = failures found, 2 = usage error

# --- ARGUMENT PARSING ---
REPAIR_MODE=0
APP_DIR=""
for arg in "$@"; do
  if [ "$arg" = "--repair" ]; then
    REPAIR_MODE=1
  else
    APP_DIR="$arg"
  fi
done

APP_DIR="${APP_DIR:-.}"
if [ ! -d "$APP_DIR" ]; then
    echo "Error: directory not found: $APP_DIR"
    echo "Usage: bash validate_viz.sh [--repair] /path/to/app_dir"
    exit 2
fi
TOTAL_FAIL=0

# --- NODE CAPABILITY DETECTION ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VALIDATE_AST="$SCRIPT_DIR/validate_ast.js"
VENDOR_DIR="$SCRIPT_DIR/vendor/node_modules"
HAS_NODE=0
HAS_VENDOR=0
USE_AST=0

command -v node > /dev/null 2>&1 && HAS_NODE=1
if [ -f "$VENDOR_DIR/acorn/dist/acorn.js" ] && [ -d "$VENDOR_DIR/cheerio" ]; then
  HAS_VENDOR=1
fi

if [ "$HAS_NODE" -eq 1 ] && [ "$HAS_VENDOR" -eq 1 ] && [ -f "$VALIDATE_AST" ]; then
  USE_AST=1
else
  echo "  WARN: validate_ast.js not available — using grep fallback"
fi

# --- PHASE 2 CAPABILITY DETECTION ---
VALIDATE_DASH="$SCRIPT_DIR/validate_dash.js"
HAS_DASH=0
if [ "$HAS_NODE" -eq 1 ] && [ -f "$VALIDATE_DASH" ] && [ -f "$VENDOR_DIR/ajv/dist/ajv.js" ]; then
  HAS_DASH=1
fi

# --- PHASE 3 CAPABILITY DETECTION ---
REPAIR_FINDINGS="$SCRIPT_DIR/repair_findings.js"
CHECK_CONTRAST="$SCRIPT_DIR/check_contrast.js"

# FINDINGS_FILE: sibling of app dir, consumed by Phase 3 repair loop
FINDINGS_FILE="$(dirname "$APP_DIR")/validate_findings.ndjson"
> "$FINDINGS_FILE"  # truncate/create

echo "============================================"
echo "  Viz Pack Validator"
echo "============================================"

# --- FORMATTER CHECKS ---
for f in "$APP_DIR"/appserver/static/visualizations/*/formatter.html; do
  [ -f "$f" ] || continue
  VIZ=$(basename "$(dirname "$f")")
  FAIL=0
  echo ""
  echo "--- formatter: $VIZ ---"

  if [ "$USE_AST" -eq 1 ]; then
    HTML_OUT=$(node "$VALIDATE_AST" --html "$f" 2>/tmp/html_err_$$)
    AST_EXIT=$?
    [ -n "$HTML_OUT" ] && echo "$HTML_OUT"
    grep '^FINDING:' /tmp/html_err_$$ >> "$FINDINGS_FILE" 2>/dev/null
    rm -f /tmp/html_err_$$
    [ "$AST_EXIT" -ne 0 ] && FAIL=1
    # --- PHASE 2: cross-file check (formatter vs JS option names) ---
    vizdir="$(dirname "$f")"
    JS_SRC="$vizdir/src/visualization_source.js"
    if [ -f "$JS_SRC" ]; then
      CROSS_OUT=$(node "$VALIDATE_AST" --cross "$f" "$JS_SRC" 2>/tmp/cross_err_$$)
      CROSS_EXIT=$?
      [ -n "$CROSS_OUT" ] && echo "$CROSS_OUT"
      grep '^FINDING:' /tmp/cross_err_$$ >> "$FINDINGS_FILE" 2>/dev/null
      rm -f /tmp/cross_err_$$
      [ "$CROSS_EXIT" -ne 0 ] && FAIL=1
    fi
  else
    # Fallback: grep-based checks

    # VIZ_NAMESPACE required, no hardcoded namespace
    HARDCODED=$(grep -cE 'name="[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\.' "$f" 2>/dev/null || true)
    TEMPLATE=$(grep -c '{{VIZ_NAMESPACE}}' "$f" 2>/dev/null || true)
    [ "$HARDCODED" -gt 0 ] && { echo "  FAIL B10: $HARDCODED hardcoded namespace(s)"; FAIL=1; }
    [ "$TEMPLATE" -eq 0 ] && { echo "  FAIL B10: no {{VIZ_NAMESPACE}} found"; FAIL=1; }

    # value= not default=
    DEFAULTS=$(grep -c 'default=' "$f" 2>/dev/null || true)
    [ "$DEFAULTS" -gt 0 ] && { echo "  FAIL B7: $DEFAULTS default= attrs (use value=)"; FAIL=1; }

    # type="custom" on color pickers (count opening tags only)
    PICKERS=$(grep -c '<splunk-color-picker ' "$f" 2>/dev/null || true)
    CUSTOM=$(grep -c 'type="custom"' "$f" 2>/dev/null || true)
    [ "$PICKERS" -gt 0 ] && [ "$CUSTOM" -lt "$PICKERS" ] && { echo "  FAIL B5: color picker without type=\"custom\""; FAIL=1; }

    # section-label on every <form>
    FORMS=$(grep -c '<form' "$f" 2>/dev/null || true)
    LABELS=$(grep -c 'section-label=' "$f" 2>/dev/null || true)
    [ "$FORMS" -gt "$LABELS" ] && { echo "  FAIL B5: $((FORMS-LABELS)) <form> without section-label"; FAIL=1; }

    # Theme default must be "auto"
    THEME_DARK=$(grep -c 'themeMode.*value="dark"' "$f" 2>/dev/null || true)
    [ "$THEME_DARK" -gt 0 ] && { echo "  FAIL B20: themeMode defaults to dark (must be auto)"; FAIL=1; }
  fi

  # Control count (always check, regardless of AST mode)
  CONTROLS=$(grep -c 'splunk-control-group' "$f" 2>/dev/null || true)
  [ "$CONTROLS" -lt 7 ] && echo "  WARN: only $CONTROLS controls (recommend 7+)"

  [ "$FAIL" -eq 0 ] && echo "  OK" || TOTAL_FAIL=1
done

# --- JS CHECKS (check SOURCE files first, fall back to built bundles) ---
for vizdir in "$APP_DIR"/appserver/static/visualizations/*/; do
  [ -d "$vizdir" ] || continue
  VIZ=$(basename "$vizdir")

  # Prefer source file for checks (not minified)
  if [ -f "$vizdir/src/visualization_source.js" ]; then
    f="$vizdir/src/visualization_source.js"
    SRC="source"
  elif [ -f "$vizdir/visualization.js" ]; then
    f="$vizdir/visualization.js"
    SRC="bundle"
  else
    echo ""
    echo "--- JS: $VIZ --- NO JS FILE FOUND"
    TOTAL_FAIL=1
    continue
  fi

  FAIL=0
  echo ""
  echo "--- JS ($SRC): $VIZ ---"

  # Syntax check (bundle only — source may use require())
  if [ "$SRC" = "bundle" ]; then
    node --check "$f" 2>/dev/null || { echo "  FAIL: syntax error"; FAIL=1; }
    head -1 "$f" | grep -q 'define(\[' || { echo "  FAIL: missing AMD define wrapper"; FAIL=1; }
  fi

  # ES5 compliance
  if [ "$USE_AST" -eq 1 ]; then
    OUTPUT=$(node "$VALIDATE_AST" --js "$f" 2>&1)
    AST_EXIT=$?
    [ -n "$OUTPUT" ] && echo "$OUTPUT"
    [ "$AST_EXIT" -ne 0 ] && FAIL=1
  else
    # Fallback grep check
    ES6=$(grep -cE '\bconst \b|\blet \b| => ' "$f" 2>/dev/null || true)
    [ "$ES6" -gt 0 ] && { echo "  FAIL F3: $ES6 ES6 occurrences (grep fallback — no line numbers)"; FAIL=1; }
  fi

  # Theme detection
  grep -qE 'detectTheme|getCurrentTheme' "$f" || { echo "  FAIL B20: no theme detection"; FAIL=1; }

  # Null guards
  grep -qE '!= null|safeStr|safeNum' "$f" || { echo "  FAIL B21: no null guards"; FAIL=1; }

  # No getBoundingClientRect for canvas sizing (allow in mouse handlers)
  # Heuristic: flag if getBCR appears near canvas.width or clientWidth
  GBCR=$(grep -c 'getBoundingClientRect' "$f" 2>/dev/null || true)
  [ "$GBCR" -gt 0 ] && echo "  WARN B17: $GBCR getBoundingClientRect usage (OK if only in mouse handlers)"

  [ "$FAIL" -eq 0 ] && echo "  OK" || TOTAL_FAIL=1
done

# --- STRUCTURE CHECKS ---
echo ""
echo "--- Structure ---"

# preview.png (FAIL — viz picker shows black box without it)
for d in "$APP_DIR"/appserver/static/visualizations/*/; do
  [ -d "$d" ] || continue
  VIZ=$(basename "$d")
  if [ ! -f "$d/preview.png" ]; then
    echo "  FAIL R8: $VIZ missing preview.png — run step 3c in vp-create"
    TOTAL_FAIL=1
  else
    SIZE=$(wc -c < "$d/preview.png")
    [ "$SIZE" -lt 100 ] && { echo "  FAIL R8: $VIZ preview.png too small ($SIZE bytes)"; TOTAL_FAIL=1; }
  fi
done

# appIcon.png (FAIL — Splunk shows grey placeholder without it)
if [ ! -f "$APP_DIR/static/appIcon.png" ]; then
  echo "  FAIL: missing static/appIcon.png — run step 3b in vp-create"
  TOTAL_FAIL=1
fi

# visualizations.conf
[ -f "$APP_DIR/default/visualizations.conf" ] || { echo "  FAIL: missing visualizations.conf"; TOTAL_FAIL=1; }
grep -q 'allow_user_selection' "$APP_DIR/default/visualizations.conf" 2>/dev/null || { echo "  FAIL: missing allow_user_selection"; TOTAL_FAIL=1; }

# savedsearches.conf.spec
[ -f "$APP_DIR/README/savedsearches.conf.spec" ] || { echo "  FAIL R6: missing savedsearches.conf.spec"; TOTAL_FAIL=1; }

# Nav bar
[ -f "$APP_DIR/default/data/ui/nav/default.xml" ] || echo "  WARN: missing nav bar"

# app.conf stanzas
if [ -f "$APP_DIR/default/app.conf" ]; then
  STANZAS=$(grep -c '^\[' "$APP_DIR/default/app.conf")
  [ "$STANZAS" -lt 5 ] && { echo "  FAIL R1: app.conf has $STANZAS stanzas (need 5)"; TOTAL_FAIL=1; }
else
  echo "  FAIL R1: missing app.conf"
  TOTAL_FAIL=1
fi

# --- PHASE 2: Dashboard XML checks via validate_dash.js (replaces grep-based B9/B10 heuristics) ---
echo ""
echo "--- Dashboard XML ---"
for xml in "$APP_DIR"/default/data/ui/views/*.xml; do
  [ -f "$xml" ] || continue
  XMLNAME=$(basename "$xml")
  echo ""
  echo "--- dashboard: $XMLNAME ---"
  if [ "$HAS_DASH" -eq 1 ]; then
    OUTPUT=$(node "$VALIDATE_DASH" --xml "$xml" 2>/tmp/dash_err_$$)
    DASH_EXIT=$?
    [ -n "$OUTPUT" ] && echo "$OUTPUT"
    grep '^FINDING:' /tmp/dash_err_$$ >> "$FINDINGS_FILE" 2>/dev/null
    rm -f /tmp/dash_err_$$
    [ "$DASH_EXIT" -ne 0 ] && TOTAL_FAIL=1
    [ "$DASH_EXIT" -eq 0 ] && echo "  OK"
  else
    # Existing grep fallback (preserved from Phase 1, skips comment lines)
    CUSTOM_PREFIX=$(grep -v '^#' "$xml" 2>/dev/null | grep -c '"custom\.' || true)
    [ "$CUSTOM_PREFIX" -gt 0 ] && { echo "  FAIL B9: $XMLNAME has 'custom.' prefix in viz type — use '{app}.{viz}' format"; TOTAL_FAIL=1; }
  fi
done

# --- PHASE 3: Contrast Check ---
echo ""
echo "--- Contrast Check ---"
THEME_JS="$APP_DIR/shared/theme.js"
if [ "$HAS_NODE" -eq 1 ] && [ -f "$CHECK_CONTRAST" ] && [ -f "$THEME_JS" ]; then
  CONTRAST_OUT=$(node "$CHECK_CONTRAST" "$THEME_JS" 2>/tmp/contrast_err_$$)
  CONTRAST_EXIT=$?
  [ -n "$CONTRAST_OUT" ] && echo "$CONTRAST_OUT"
  grep '^FINDING:' /tmp/contrast_err_$$ >> "$FINDINGS_FILE" 2>/dev/null
  rm -f /tmp/contrast_err_$$
  if [ "$CONTRAST_EXIT" -ne 0 ]; then
    TOTAL_FAIL=1
  else
    echo "  OK"
  fi
else
  echo "  SKIP: shared/theme.js not found or Node.js unavailable"
fi

# --- PHASE 3: Repair Loop ---
if [ "$TOTAL_FAIL" -ne 0 ] && [ "$REPAIR_MODE" -eq 1 ] && [ "$HAS_NODE" -eq 1 ] && [ -f "$REPAIR_FINDINGS" ]; then
  REPAIR_LOG="$(dirname "$APP_DIR")/validate_repair_log.ndjson"
  > "$REPAIR_LOG"
  ATTEMPT=0
  MAX_ATTEMPTS=3
  BUILD_FLAT="$SCRIPT_DIR/build_flat.js"
  while [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ] && [ "$TOTAL_FAIL" -ne 0 ]; do
    ATTEMPT=$((ATTEMPT+1))
    echo ""
    echo "--- Repair attempt $ATTEMPT ---"
    REPAIR_OUT=$(node "$REPAIR_FINDINGS" "$FINDINGS_FILE" "$APP_DIR" "$REPAIR_LOG" "$ATTEMPT")
    REPAIR_EXIT=$?
    [ -n "$REPAIR_OUT" ] && echo "$REPAIR_OUT"
    if [ "$REPAIR_EXIT" -ne 0 ]; then
      echo "  repair_findings.js exited $REPAIR_EXIT — stopping repair loop"
      break
    fi
    # If repair_findings produced no output, no repairs were applied — stop early
    if [ -z "$REPAIR_OUT" ]; then
      echo "  No repairs applied — remaining failures are not auto-fixable"
      break
    fi
    if [ -f "$BUILD_FLAT" ]; then
      node "$BUILD_FLAT" "$APP_DIR"
      BUILD_EXIT=$?
      if [ "$BUILD_EXIT" -ne 0 ]; then
        echo "  build_flat.js exited $BUILD_EXIT — stopping repair loop"
        break
      fi
    fi
    > "$FINDINGS_FILE"
    bash "$0" "$APP_DIR"
    TOTAL_FAIL=$?
  done
fi

echo ""
echo "============================================"
if [ "$TOTAL_FAIL" -eq 0 ]; then
  echo "  ALL CHECKS PASSED"
  exit 0
else
  echo "  FAILURES FOUND — fix before packaging"
  exit 1
fi
