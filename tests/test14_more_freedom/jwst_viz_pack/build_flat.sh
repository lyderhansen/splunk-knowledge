#!/bin/bash
set -e
BASE="$(cd "$(dirname "$0")" && pwd)"
THEME="$BASE/default/visualizations/shared/theme.js"

for VIZ_DIR in "$BASE/default/visualizations"/jwst_*/; do
    VIZ_NAME=$(basename "$VIZ_DIR")
    SRC="$VIZ_DIR/src/visualization_source.js"
    OUT="$VIZ_DIR/visualization.js"
    
    if [ ! -f "$SRC" ]; then
        echo "  SKIP $VIZ_NAME — no source"
        continue
    fi
    
    # Strip require() lines and module.exports from source — we'll wrap manually
    # Also strip require() lines from theme.js
    
    cat > "$OUT" << 'HEADER'
define(["api/SplunkVisualizationBase"], function(SplunkVisualizationBase) {

// === shared/theme.js (inlined) ===
var __theme = (function() {
HEADER
    
    # Inline theme.js but strip its require/module.exports lines
    grep -v '^var.*= require(' "$THEME" | grep -v '^module\.exports' >> "$OUT"
    
    # Close the theme IIFE and assign exports
    cat >> "$OUT" << 'THEME_CLOSE'

    return {
        getTheme:     getTheme,
        hexToRgb:     hexToRgb,
        lerpColor:    lerpColor,
        rampColor:    rampColor,
        rgba:         rgba,
        fmtNum:       fmtNum,
        getNS:        getNS,
        getOption:    getOption,
        setupCanvas:  setupCanvas,
        createTooltip: createTooltip,
        showTooltip:  showTooltip,
        hideTooltip:  hideTooltip,
        waitForFont:  waitForFont,
        drawHexCorners: drawHexCorners,
        resetShadow:  resetShadow,
        RAMP:         RAMP,
        FONTS:        FONTS
    };
})();

// === visualization source ===
var theme = __theme;
THEME_CLOSE
    
    # Inline viz source but strip require() and module.exports lines
    # Replace `require('shared/theme')` with already-defined `theme`
    # Replace `require('api/SplunkVisualizationBase')` with already-defined param
    grep -v "^var.*= require(" "$SRC" | \
        grep -v "^module\.exports" | \
        sed 's/require(.*SplunkVisualizationBase.*)/SplunkVisualizationBase/' >> "$OUT"
    
    # Close with return and module end
    cat >> "$OUT" << 'FOOTER'

return SplunkVisualizationBase.extend(
FOOTER
    
    echo "  BUILT $VIZ_NAME — $(wc -c < "$OUT" | tr -d ' ') bytes"
done
