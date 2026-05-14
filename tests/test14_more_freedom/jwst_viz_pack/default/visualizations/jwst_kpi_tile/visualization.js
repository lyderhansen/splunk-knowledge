define(["api/SplunkVisualizationBase"], function(SplunkVisualizationBase) {

// --- shared/theme (inlined) ---
var theme = (function() {
// JWST Mission Operations — shared design tokens
// Required by all viz source files: var theme = require('shared/theme');

var PALETTES = {
    dark: {
        bg:      '#06080F',
        card:    '#0D1117',
        text:    '#E8ECF1',
        dim:     'rgba(232,236,241,0.45)',
        muted:   'rgba(232,236,241,0.08)',
        gold:    '#D4A537',
        cyan:    '#00B4D8',
        magenta: '#E040A0',
        green:   '#34D399',
        red:     '#FF4D4D',
        indigo:  '#1B1464'
    },
    light: {
        bg:      '#F0F2F5',
        card:    '#FFFFFF',
        text:    '#0D1117',
        dim:     'rgba(13,17,23,0.55)',
        muted:   'rgba(13,17,23,0.06)',
        gold:    '#B8860B',
        cyan:    '#0077B6',
        magenta: '#C0307A',
        green:   '#059669',
        red:     '#DC2626',
        indigo:  '#1B1464'
    }
};

var RAMP = ['#1B1464', '#00B4D8', '#E040A0', '#D4A537', '#FF4D4D'];

var FONTS = {
    display: 'Oxanium, sans-serif',
    mono:    '"JetBrains Mono", monospace'
};

function getTheme(mode) {
    var p = PALETTES[mode] || PALETTES.dark;
    return {
        bg:      p.bg,
        card:    p.card,
        text:    p.text,
        dim:     p.dim,
        muted:   p.muted,
        gold:    p.gold,
        cyan:    p.cyan,
        magenta: p.magenta,
        green:   p.green,
        red:     p.red,
        indigo:  p.indigo,
        ramp:    RAMP,
        fonts:   FONTS
    };
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

function lerpColor(a, b, t) {
    var c1 = hexToRgb(a);
    var c2 = hexToRgb(b);
    var r = Math.round(c1.r + (c2.r - c1.r) * t);
    var g = Math.round(c1.g + (c2.g - c1.g) * t);
    var bl = Math.round(c1.b + (c2.b - c1.b) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

function rampColor(value, min, max, ramp) {
    ramp = ramp || RAMP;
    if (max === min) return ramp[0];
    var t = Math.max(0, Math.min(1, (value - min) / (max - min)));
    var segCount = ramp.length - 1;
    var seg = Math.min(Math.floor(t * segCount), segCount - 1);
    var segT = (t * segCount) - seg;
    return lerpColor(ramp[seg], ramp[seg + 1], segT);
}

function rgba(hex, alpha) {
    var c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
}

function fmtNum(val, opts) {
    opts = opts || {};
    var decimals = opts.decimals !== undefined ? opts.decimals : -1;
    var compact = opts.compact !== undefined ? opts.compact : false;

    if (val === null || val === undefined || isNaN(val)) return '—';

    if (compact && Math.abs(val) >= 1e9) {
        return (val / 1e9).toFixed(1) + 'B';
    }
    if (compact && Math.abs(val) >= 1e6) {
        return (val / 1e6).toFixed(1) + 'M';
    }
    if (compact && Math.abs(val) >= 1e3) {
        return (val / 1e3).toFixed(1) + 'K';
    }
    if (decimals >= 0) {
        return val.toFixed(decimals);
    }
    if (Math.abs(val) < 10) return val.toFixed(2);
    if (Math.abs(val) < 100) return val.toFixed(1);
    return Math.round(val).toString();
}

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
}

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function setupCanvas(el) {
    var canvas = el.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        el.appendChild(canvas);
    }
    var rect = el.getBoundingClientRect();
    var w = Math.floor(rect.width) || 300;
    var h = Math.floor(rect.height) || 200;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { canvas: canvas, ctx: ctx, w: w, h: h, dpr: dpr };
}

function createTooltip(el) {
    var tip = document.createElement('div');
    tip.style.cssText =
        'position:absolute;display:none;padding:6px 10px;' +
        'background:rgba(6,8,15,0.92);color:#E8ECF1;font-size:11px;' +
        'border-radius:3px;pointer-events:none;white-space:nowrap;' +
        'z-index:100;font-family:"JetBrains Mono",monospace;' +
        'border:1px solid rgba(212,165,55,0.25);';
    el.style.position = 'relative';
    el.appendChild(tip);
    return tip;
}

function showTooltip(tip, e, canvas, html) {
    var rect = canvas.getBoundingClientRect();
    tip.innerHTML = html;
    tip.style.display = 'block';
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var tipW = tip.offsetWidth || 120;
    var tipH = tip.offsetHeight || 30;
    var x = mx + 14;
    var y = my - 10;
    if (x + tipW > rect.width) x = mx - tipW - 14;
    if (y + tipH > rect.height) y = my - tipH - 10;
    if (y < 0) y = 4;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
}

function hideTooltip(tip) {
    tip.style.display = 'none';
}

var _fontReady = false;
var _fontPending = false;

function waitForFont(fontFamily, callback) {
    if (_fontReady) { callback(); return; }
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) {
        setTimeout(callback, 300);
        return;
    }
    if (!_fontPending) {
        _fontPending = true;
        document.fonts.load('400 48px "' + fontFamily + '"').then(function() {
            _fontReady = true;
        });
    }
    var attempts = 0;
    var poll = function() {
        attempts++;
        if (_fontReady || attempts > 30) {
            _fontReady = true;
            callback();
            return;
        }
        setTimeout(poll, 100);
    };
    poll();
}

function drawHexCorners(ctx, x, y, w, h, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    var s = size;
    var hs = s * 0.866;
    // top-left hex notch
    ctx.beginPath();
    ctx.moveTo(x + s, y);
    ctx.lineTo(x + s * 0.5, y + hs);
    ctx.lineTo(x, y + hs);
    ctx.stroke();
    // bottom-right hex notch
    ctx.beginPath();
    ctx.moveTo(x + w - s, y + h);
    ctx.lineTo(x + w - s * 0.5, y + h - hs);
    ctx.lineTo(x + w, y + h - hs);
    ctx.stroke();
}

function resetShadow(ctx) {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

  return {
    getTheme: getTheme, hexToRgb: hexToRgb, lerpColor: lerpColor,
    rampColor: rampColor, rgba: rgba, fmtNum: fmtNum, getNS: getNS,
    getOption: getOption, setupCanvas: setupCanvas, createTooltip: createTooltip,
    showTooltip: showTooltip, hideTooltip: hideTooltip, waitForFont: waitForFont,
    drawHexCorners: drawHexCorners, resetShadow: resetShadow, RAMP: RAMP, FONTS: FONTS
  };
})();

// --- jwst_kpi_tile ---
// JWST KPI Tile — single-value KPI with sparkline, trend delta,
// threshold coloring, and hexagonal accent.
// Pure ES5. require()/module.exports. SplunkVisualizationBase.extend().


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

return SplunkVisualizationBase.extend({

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


});