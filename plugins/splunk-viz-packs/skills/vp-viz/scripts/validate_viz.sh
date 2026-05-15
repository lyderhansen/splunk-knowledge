#!/bin/bash
# validate_viz.sh — post-build validator for Splunk custom viz apps
# Usage: bash validate_viz.sh /path/to/app_dir
# Exit code: 0 = all pass, 1 = failures found

APP_DIR="${1:-.}"
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
    OUTPUT=$(node "$VALIDATE_AST" --html "$f" 2>&1)
    AST_EXIT=$?
    [ -n "$OUTPUT" ] && echo "$OUTPUT"
    [ "$AST_EXIT" -ne 0 ] && FAIL=1
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
fi

# B9: Dashboard type format — check for "custom." prefix in dashboard XML
for xml in "$APP_DIR"/default/data/ui/views/*.xml; do
  [ -f "$xml" ] || continue
  XMLNAME=$(basename "$xml")
  CUSTOM_PREFIX=$(grep -c '"custom\.' "$xml" 2>/dev/null || true)
  [ "$CUSTOM_PREFIX" -gt 0 ] && { echo "  FAIL B9: $XMLNAME has 'custom.' prefix in viz type — use '{app}.{viz}' format"; TOTAL_FAIL=1; }
done

# B10: Dashboard JSON options must be namespaced
# Check if any dashboard has bare option keys for custom vizs
APP_NAME=$(basename "$APP_DIR")
for xml in "$APP_DIR"/default/data/ui/views/*.xml; do
  [ -f "$xml" ] || continue
  XMLNAME=$(basename "$xml")
  # Look for options that have simple keys (no dots) next to a custom viz type
  # Heuristic: if the file contains our app name as a type but options without dots
  if grep -q "\"$APP_NAME\." "$xml" 2>/dev/null; then
    # Extract options blocks and check for bare keys
    BARE_KEYS=$(grep -oE '"[a-zA-Z]+": "' "$xml" 2>/dev/null | grep -cvE '"type"|"primary"|"ds_' || true)
    [ "$BARE_KEYS" -gt 3 ] && echo "  WARN B10: $XMLNAME may have bare option keys (need {app}.{viz}.key namespace)"
  fi
done

echo ""
echo "============================================"
if [ "$TOTAL_FAIL" -eq 0 ]; then
  echo "  ALL CHECKS PASSED"
  exit 0
else
  echo "  FAILURES FOUND — fix before packaging"
  exit 1
fi
