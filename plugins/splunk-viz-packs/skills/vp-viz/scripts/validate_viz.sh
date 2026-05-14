#!/bin/bash
# validate_viz.sh — post-build validator for Splunk custom viz apps
# Usage: bash validate_viz.sh /path/to/app_dir
# Exit code: 0 = all pass, 1 = failures found

APP_DIR="${1:-.}"
TOTAL_FAIL=0

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

  # VIZ_NAMESPACE required, no hardcoded namespace
  HARDCODED=$(grep -cE 'name="[a-z_]+\.[a-z_]+\.' "$f" 2>/dev/null || true)
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

  # Control count
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
  ES6=$(grep -cE '\bconst \b|\blet \b| => ' "$f" 2>/dev/null || true)
  [ "$ES6" -gt 0 ] && { echo "  FAIL F3: $ES6 ES6 occurrences"; FAIL=1; }

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

# preview.png
for d in "$APP_DIR"/appserver/static/visualizations/*/; do
  [ -d "$d" ] || continue
  VIZ=$(basename "$d")
  [ ! -f "$d/preview.png" ] && { echo "  WARN R8: $VIZ missing preview.png"; }
done

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

echo ""
echo "============================================"
if [ "$TOTAL_FAIL" -eq 0 ]; then
  echo "  ALL CHECKS PASSED"
  exit 0
else
  echo "  FAILURES FOUND — fix before packaging"
  exit 1
fi
