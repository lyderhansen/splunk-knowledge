// JWST KPI Tile — single-value KPI with sparkline, trend delta,
// threshold coloring, and hexagonal accent.
// Pure ES5. require()/module.exports. SplunkVisualizationBase.extend().

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// Value size map: valueSize setting → font size in px
var VALUE_SIZES = { hero: 48, large: 36, medium: 24, small: 18 };

// Compact number formatting — only applied when value is numeric
// and no explicit decimals override is needed
function compactNum(val, decimals) {
    var absVal = Math.abs(val);
    if (absVal >= 1e9) return (val / 1e9).toFixed(1) + 'B';
    if (absVal >= 1e6) return (val / 1e6).toFixed(1) + 'M';
    if (absVal >= 1e3) return (val / 1e3).toFixed(1) + 'K';
    return val.toFixed(decimals);
}

// Parse a row value string — returns { isNumeric, numVal, displayStr }
// following B11: parseFloat truncates, so we must validate carefully
function parseValue(raw, decimals) {
    var str = String(raw === null || raw === undefined ? '' : raw).trim();
    if (str === '') {
        return { isNumeric: false, numVal: NaN, displayStr: '—' };
    }
    var fv = parseFloat(str);
    // Non-numeric passthrough: NaN or the string has extra characters
    // that parseFloat silently truncates (e.g. "1:21.584", "P1", "NOMINAL")
    var isNum = !isNaN(fv) && (String(fv) === str || str === String(fv));
    if (!isNum) {
        // Allow leading sign / spaces but reject embedded non-numeric chars
        // e.g. "+4.271" is numeric, "4.271s" is not
        var cleaned = str.replace(/^[+\-\s]+/, '');
        var fv2 = parseFloat(cleaned);
        isNum = !isNaN(fv2) && String(fv2) === cleaned;
        if (isNum) fv = parseFloat(str);
    }
    if (!isNum) {
        return { isNumeric: false, numVal: NaN, displayStr: str };
    }
    var disp;
    var dec = parseInt(decimals, 10);
    if (dec >= 0) {
        // Explicit decimal count — no compact, just toFixed
        disp = fv.toFixed(dec);
    } else {
        // Auto compact for large numbers
        disp = compactNum(fv, 1);
    }
    return { isNumeric: true, numVal: fv, displayStr: disp };
}

// Parse comma-separated sparkline string into array of floats
function parseSparkline(str) {
    if (!str) return [];
    var parts = String(str).split(',');
    var out = [];
    for (var i = 0; i < parts.length; i++) {
        var v = parseFloat(parts[i]);
        if (!isNaN(v)) out.push(v);
    }
    return out;
}

// Draw a regular hexagon (flat-top orientation) outline
// cx/cy = center, r = circumradius, strokeColor, lineWidth
function drawHexOutline(ctx, cx, cy, r, strokeColor, lineWidth) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
        // flat-top: start angle = 0 degrees
        var angle = (Math.PI / 3) * i;
        var px = cx + r * Math.cos(angle);
        var py = cy + r * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.lineWidth = lineWidth || 1;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        // Create canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'width:100%;height:100%;display:block;';
        this.el.style.position = 'relative';
        this.el.appendChild(this._canvas);

        // Tooltip (I1)
        this._tooltip = theme.createTooltip(this.el);

        // Last render cache (C6)
        this._lastData = null;
        this._lastConfig = null;

        // Accent intensity state (B14)
        this._gi = 0.5;

        var self = this;

        // Mouse events
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            theme.hideTooltip(self._tooltip);
        });

        // Hide Splunk no-data placeholder (C2)
        this._observer = new MutationObserver(function() {
            var nodes = self.el.querySelectorAll(
                '.viz-placeholder, .shared-viz-no-results, ' +
                '[data-test="viz-no-results"], .viz-controller-no-results'
            );
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].style.display = 'none';
            }
        });
        this._observer.observe(this.el, { childList: true, subtree: true });
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    // formatData — data processing only, NO config reads (B4)
    formatData: function(data) {
        if (!data || !data.rows || data.rows.length === 0) {
            if (this._lastGoodData) return this._lastGoodData;
            return data;
        }
        var fields = data.fields;
        var colIdx = {};
        for (var i = 0; i < fields.length; i++) {
            colIdx[fields[i].name] = i;
        }
        var result = { colIdx: colIdx, rows: data.rows };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    _render: function(data, config) {
        var self = this;
        var ns = theme.getNS(this);
        var getOpt = function(key, def) {
            return theme.getOption(config, ns, key, def);
        };

        // --- Read all settings (updateView context, never formatData) ---
        var valueField     = getOpt('valueField',     'value');
        var labelField     = getOpt('labelField',     'label');
        var unitField      = getOpt('unitField',      'unit');
        var trendField     = getOpt('trendField',     'trend');
        var sparklineField = getOpt('sparklineField', 'sparkline');
        var warnThresh     = getOpt('warningThreshold',  '');
        var critThresh     = getOpt('criticalThreshold', '');
        var valueDecimals  = getOpt('valueDecimals',  '1');
        var valueSize      = getOpt('valueSize',      'hero');
        var showSparkline  = getOpt('showSparkline',  'true') !== 'false';
        var showTrend      = getOpt('showTrend',      'true') !== 'false';
        var sparklineColor = getOpt('sparklineColor', '#00B4D8');
        var normalColor    = getOpt('normalColor',    '#E8ECF1');
        var warningColor   = getOpt('warningColor',   '#D4A537');
        var criticalColor  = getOpt('criticalColor',  '#FF4D4D');
        var hexAccent      = getOpt('hexAccent',      'true') !== 'false';
        var accentIntensity = getOpt('accentIntensity', '50');
        var themeMode      = getOpt('theme',          'dark');

        // accentIntensity (rule 11)
        this._gi = parseInt(accentIntensity, 10) / 100;
        if (isNaN(this._gi)) this._gi = 0.5;

        var t = theme.getTheme(themeMode);
        var valueFontPx = VALUE_SIZES[valueSize] || 48;

        // --- Extract data ---
        var rowValue = '';
        var rowLabel = '';
        var rowUnit = '';
        var rowTrend = '';
        var rowSparkline = '';
        var rawNumFull = NaN; // full unformatted number for threshold tests

        if (data && data.colIdx && data.rows && data.rows.length > 0) {
            var ci = data.colIdx;
            var row = data.rows[0];
            if (ci[valueField] !== undefined)     rowValue     = row[ci[valueField]];
            if (ci[labelField] !== undefined)     rowLabel     = row[ci[labelField]];
            if (ci[unitField] !== undefined)      rowUnit      = row[ci[unitField]];
            if (ci[trendField] !== undefined)     rowTrend     = row[ci[trendField]];
            if (ci[sparklineField] !== undefined) rowSparkline = row[ci[sparklineField]];
        }

        // Parse value (B11)
        var parsed = parseValue(rowValue, valueDecimals);
        rawNumFull = parsed.numVal;
        var displayValue = parsed.displayStr;
        var isNumeric = parsed.isNumeric;

        // Parse trend
        var trendVal = parseFloat(rowTrend);
        var hasTrend = showTrend && !isNaN(trendVal);

        // Parse sparkline data
        var sparkData = showSparkline ? parseSparkline(rowSparkline) : [];

        // Threshold state (only applies to numeric values)
        var isCritical = false;
        var isWarning = false;
        if (isNumeric) {
            var critNum = parseFloat(critThresh);
            var warnNum = parseFloat(warnThresh);
            if (!isNaN(critNum) && rawNumFull >= critNum) {
                isCritical = true;
            } else if (!isNaN(warnNum) && rawNumFull >= warnNum) {
                isWarning = true;
            }
        }

        // Determine value color
        var valueColor = normalColor;
        if (isCritical) valueColor = criticalColor;
        else if (isWarning) valueColor = warningColor;

        // Store tooltip content
        this._tooltipHtml =
            '<span style="opacity:0.6">' +
            (rowLabel ? String(rowLabel).toUpperCase() : 'VALUE') +
            '</span><br>' +
            String(rowValue || '—') +
            (rowUnit ? ' ' + rowUnit : '');

        // --- Setup canvas (B2, HiDPI) ---
        var cs = theme.setupCanvas(this.el);
        var canvas = cs.canvas;
        var ctx = cs.ctx;
        var w = cs.w;
        var h = cs.h;

        // Replace stored canvas reference (element could be recreated by setupCanvas)
        this._canvas = canvas;

        // Reattach mouse handlers if canvas was recreated
        var self2 = this;
        canvas.onmousemove = function(e) { self2._onMouseMove(e); };
        canvas.onmouseleave = function() { theme.hideTooltip(self2._tooltip); };

        // --- Clear canvas (B13) ---
        ctx.clearRect(0, 0, w, h);

        // --- Layout constants ---
        var pad = 12; // inner padding
        var hexR = 14; // hexagon accent circumradius

        // Sparkline occupies bottom 28% of the tile (if shown)
        var sparkH = showSparkline && sparkData.length > 1 ? Math.round(h * 0.26) : 0;
        var contentH = h - sparkH;

        // Vertical centering of value + label block
        var unitFontPx = Math.round(valueFontPx * 0.55);
        var labelFontPx = 10;
        var trendFontPx = 12;

        // Estimate block height: value line + small gap + label line
        var blockH = valueFontPx + 6 + labelFontPx;
        var blockTop = Math.round((contentH - blockH) / 2);
        if (blockTop < pad) blockTop = pad;

        var valueY = blockTop + valueFontPx; // baseline of value text
        var labelY = valueY + 8 + labelFontPx;

        // Trend block sits to the right of value (vertically centered with value)
        var trendAreaX = w - pad - 60; // rightmost content area X (reserved for trend)

        // =====================================================================
        // 1. Hexagonal accent — top-right corner (design brief: 4px side / 15% gold)
        // =====================================================================
        if (hexAccent) {
            var hexOpacity = 0.15 * Math.max(0.2, this._gi + 0.5);
            var hexColor = theme.rgba(t.gold, hexOpacity);
            var hexCX = w - pad - hexR;
            var hexCY = pad + hexR;
            drawHexOutline(ctx, hexCX, hexCY, hexR, hexColor, 1);
        }

        // =====================================================================
        // 2. Value text — Oxanium font
        // =====================================================================
        var self3 = this;
        theme.waitForFont('Oxanium', function() {
            self3._drawContent(
                ctx, w, h, pad, t,
                displayValue, valueColor, valueFontPx,
                rowUnit, unitFontPx, valueY,
                rowLabel, labelFontPx, labelY,
                hasTrend, trendVal, trendFontPx,
                isCritical, criticalColor,
                sparkData, sparklineColor, sparkH,
                trendAreaX,
                hexAccent, hexR,
                self3._gi
            );
        });
    },

    _drawContent: function(
        ctx, w, h, pad, t,
        displayValue, valueColor, valueFontPx,
        rowUnit, unitFontPx, valueY,
        rowLabel, labelFontPx, labelY,
        hasTrend, trendVal, trendFontPx,
        isCritical, criticalColor,
        sparkData, sparklineColor, sparkH,
        trendAreaX,
        hexAccent, hexR,
        gi
    ) {
        // Critical glow on the value
        if (isCritical) {
            ctx.shadowColor = theme.rgba(criticalColor, 0.55 * gi);
            ctx.shadowBlur = 18 * gi;
        }

        ctx.font = 'bold ' + valueFontPx + 'px Oxanium, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = valueColor;

        // Measure value text
        var valueText = displayValue;
        var valueMeas = ctx.measureText(valueText);
        var valueX = pad;

        // If unit is "before", render unit first
        var unitBeforeW = 0;
        if (rowUnit) {
            // Always render unit after value (spec: position after by default)
            // The formatter exposes a unitPosition setting — here we always
            // draw unit to the right of the value with a small gap
            // (handled below after we know value width)
        }

        ctx.fillText(valueText, valueX, valueY);
        theme.resetShadow(ctx);

        // Unit text — JetBrains Mono at 40% opacity
        if (rowUnit) {
            var unitX = valueX + valueMeas.width + 5;
            // Limit unit to not overflow into trend area
            var unitText = String(rowUnit);
            ctx.font = unitFontPx + 'px "JetBrains Mono", monospace';
            ctx.fillStyle = theme.rgba(t.text, 0.4);
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
            ctx.fillText(unitText, unitX, valueY - Math.round(valueFontPx * 0.08));
        }

        // Label — JetBrains Mono, 30% opacity, uppercase, 10px
        if (rowLabel) {
            ctx.font = labelFontPx + 'px "JetBrains Mono", monospace';
            ctx.fillStyle = theme.rgba(t.text, 0.30);
            ctx.textBaseline = 'alphabetic';
            ctx.textAlign = 'left';
            ctx.fillText(String(rowLabel).toUpperCase(), pad, labelY);
        }

        // =====================================================================
        // 3. Trend delta — arrow + percentage, right of value
        // =====================================================================
        if (hasTrend) {
            var trendPositive = trendVal >= 0;
            var trendColor = trendPositive ? t.green : t.red;
            var trendSign = trendPositive ? '+' : '';
            var trendText = trendSign + trendVal.toFixed(1) + '%';

            // Arrow triangle
            var arrowSize = 7;
            var arrowX = trendAreaX + 4;
            var arrowY = valueY - Math.round(valueFontPx * 0.55);

            ctx.fillStyle = trendColor;
            ctx.beginPath();
            if (trendPositive) {
                // Up triangle
                ctx.moveTo(arrowX + arrowSize / 2, arrowY);
                ctx.lineTo(arrowX + arrowSize, arrowY + arrowSize);
                ctx.lineTo(arrowX, arrowY + arrowSize);
            } else {
                // Down triangle
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(arrowX + arrowSize, arrowY);
                ctx.lineTo(arrowX + arrowSize / 2, arrowY + arrowSize);
            }
            ctx.closePath();
            ctx.fill();

            // Trend text
            ctx.font = trendFontPx + 'px "JetBrains Mono", monospace';
            ctx.fillStyle = trendColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(trendText, arrowX + arrowSize + 4, valueY - Math.round(valueFontPx * 0.4));
        }

        // =====================================================================
        // 4. Sparkline — thin cyan line at bottom third of tile
        // =====================================================================
        if (sparkData.length > 1 && sparkH > 0) {
            var sparkTop = h - sparkH;
            var sparkPad = 8;
            var sparkW = w - sparkPad * 2;
            var sparkBottom = h - 6;
            var sparkInnerH = sparkBottom - sparkTop - 6;

            // Find min/max of sparkline data
            var sMin = sparkData[0];
            var sMax = sparkData[0];
            for (var i = 1; i < sparkData.length; i++) {
                if (sparkData[i] < sMin) sMin = sparkData[i];
                if (sparkData[i] > sMax) sMax = sparkData[i];
            }
            var sRange = sMax - sMin;
            if (sRange === 0) sRange = 1;

            var stepX = sparkW / (sparkData.length - 1);

            // Build path
            var points = [];
            for (var j = 0; j < sparkData.length; j++) {
                var px = sparkPad + j * stepX;
                var py = sparkBottom - ((sparkData[j] - sMin) / sRange) * sparkInnerH;
                points.push({ x: px, y: py });
            }

            // Fill below the line — 8% sparkline color opacity
            ctx.beginPath();
            ctx.moveTo(points[0].x, sparkBottom);
            ctx.lineTo(points[0].x, points[0].y);
            for (var k = 1; k < points.length; k++) {
                ctx.lineTo(points[k].x, points[k].y);
            }
            ctx.lineTo(points[points.length - 1].x, sparkBottom);
            ctx.closePath();
            ctx.fillStyle = theme.rgba(sparklineColor, 0.08);
            ctx.fill();

            // Sparkline line
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (var m = 1; m < points.length; m++) {
                ctx.lineTo(points[m].x, points[m].y);
            }
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = sparklineColor;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke();

            theme.resetShadow(ctx);
        }
    },

    _onMouseMove: function(e) {
        // KPI tile: entire panel is the hit zone (I1 pattern)
        var html = this._tooltipHtml ||
            '<span style="opacity:0.6">VALUE</span><br>—';
        theme.showTooltip(this._tooltip, e, this._canvas, html);
        this._canvas.style.cursor = 'default';
    },

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        if (this._observer) {
            this._observer.disconnect();
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
