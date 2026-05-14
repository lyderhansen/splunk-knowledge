#!/bin/bash
# validate_viz.sh — run from the app root directory
# Usage: bash validate_viz.sh /path/to/app_dir

APP_DIR="${1:-.}"
TOTAL_FAIL=0

echo "============================================"
echo "  Viz Pack Validator"
echo "============================================"

# --- FORMATTER CHECKS (per viz) ---
for f in "$APP_DIR"/appserver/static/visualizations/*/formatter.html; do
  VIZ=$(basename "$(dirname "$f")")
  FAIL=0
  echo ""
  echo "--- formatter: $VIZ ---"

  # F1. {{VIZ_NAMESPACE}} required, no hardcoded namespace
  HARDCODED=$(grep -cE 'name="[a-z_]+\.[a-z_]+\.' "$f" 2>/dev/null || true)
  TEMPLATE=$(grep -c '{{VIZ_NAMESPACE}}' "$f" 2>/dev/null || true)
  if [ "$HARDCODED" -gt 0 ]; then
    echo "  FAIL B10: $HARDCODED hardcoded namespace(s) — use {{VIZ_NAMESPACE}}"
    FAIL=1
  fi
  if [ "$TEMPLATE" -eq 0 ]; then
    echo "  FAIL B10: no {{VIZ_NAMESPACE}} found"
    FAIL=1
  fi

  # F2. value= not default=
  DEFAULTS=$(grep -c 'default=' "$f" 2>/dev/null || true)
  if [ "$DEFAULTS" -gt 0 ]; then
    echo "  FAIL B7: $DEFAULTS default= attributes — use value="
    FAIL=1
  fi

  # F3. type="custom" on color pickers
  PICKERS=$(grep -c '<splunk-color-picker ' "$f" 2>/dev/null || true)
  CUSTOM=$(grep -c 'type="custom"' "$f" 2>/dev/null || true)
  if [ "$PICKERS" -gt 0 ] && [ "$CUSTOM" -lt "$PICKERS" ]; then
    echo "  FAIL B5: color picker without type=\"custom\""
    FAIL=1
  fi

  # F4. section-label on every <form>
  FORMS=$(grep -c '<form' "$f" 2>/dev/null || true)
  LABELS=$(grep -c 'section-label=' "$f" 2>/dev/null || true)
  if [ "$FORMS" -gt "$LABELS" ]; then
    echo "  FAIL B5: $((FORMS - LABELS)) <form> without section-label"
    FAIL=1
  fi

  # F5. Minimum control count
  CONTROLS=$(grep -c 'splunk-control-group' "$f" 2>/dev/null || true)
  if [ "$CONTROLS" -lt 10 ]; then
    echo "  WARN: only $CONTROLS controls (minimum 10)"
  fi

  # F6. Theme default must be "auto"
  THEME_DARK=$(grep -c 'themeMode.*value="dark"' "$f" 2>/dev/null || true)
  if [ "$THEME_DARK" -gt 0 ]; then
    echo "  FAIL B20: themeMode defaults to dark — must be auto"
    FAIL=1
  fi

  [ "$FAIL" -eq 0 ] && echo "  OK" || TOTAL_FAIL=1
done

# --- JS CHECKS (per viz) ---
for f in "$APP_DIR"/appserver/static/visualizations/*/visualization.js; do
  VIZ=$(basename "$(dirname "$f")")
  FAIL=0
  echo ""
  echo "--- JS: $VIZ ---"

  # J1. Syntax check
  node --check "$f" 2>/dev/null || { echo "  FAIL: syntax error"; FAIL=1; }

  # J2. AMD wrapper
  head -1 "$f" | grep -q 'define(\[' || { echo "  FAIL: missing AMD define"; FAIL=1; }

  # J3. ES5 compliance
  ES6=$(grep -cE '\bconst \b|\blet \b| => ' "$f" 2>/dev/null || true)
  [ "$ES6" -gt 0 ] && { echo "  FAIL F3: $ES6 ES6 occurrences"; FAIL=1; }

  # J4. Theme detection
  grep -qE 'detectTheme|getCurrentTheme' "$f" || { echo "  FAIL B20: no theme detection"; FAIL=1; }

  # J5. Null guards
  grep -qE '!= null|safeStr' "$f" || { echo "  FAIL B21: no null guards"; FAIL=1; }

  # J6. No getBoundingClientRect
  GBCR=$(grep -c 'getBoundingClientRect' "$f" 2>/dev/null || true)
  [ "$GBCR" -gt 0 ] && { echo "  FAIL B17: uses getBoundingClientRect ($GBCR)"; FAIL=1; }

  # J7. No new Date(string)
  NEWDATE=$(grep -cE 'new Date\([^)]*["\x27]' "$f" 2>/dev/null || true)
  [ "$NEWDATE" -gt 0 ] && { echo "  FAIL B19: uses new Date(string)"; FAIL=1; }

  [ "$FAIL" -eq 0 ] && echo "  OK" || TOTAL_FAIL=1
done

# --- STRUCTURE CHECKS ---
echo ""
echo "--- Structure ---"

# S1. preview.png in every viz
for d in "$APP_DIR"/appserver/static/visualizations/*/; do
  VIZ=$(basename "$d")
  [ ! -f "$d/preview.png" ] && { echo "  FAIL R8: $VIZ missing preview.png"; TOTAL_FAIL=1; }
done

# S2. visualizations.conf
grep -q 'allow_user_selection' "$APP_DIR/default/visualizations.conf" 2>/dev/null \
  || { echo "  FAIL: visualizations.conf missing allow_user_selection"; TOTAL_FAIL=1; }

# S3. savedsearches.conf.spec
[ -f "$APP_DIR/README/savedsearches.conf.spec" ] \
  || { echo "  FAIL R6: missing savedsearches.conf.spec"; TOTAL_FAIL=1; }

# S4. Nav bar
[ -f "$APP_DIR/default/data/ui/nav/default.xml" ] \
  || { echo "  FAIL: missing nav bar default.xml"; TOTAL_FAIL=1; }

echo ""
echo "============================================"
if [ "$TOTAL_FAIL" -eq 0 ]; then
  echo "  ALL CHECKS PASSED — safe to package"
else
  echo "  FAILURES FOUND — fix before packaging"
fi
echo "============================================"
