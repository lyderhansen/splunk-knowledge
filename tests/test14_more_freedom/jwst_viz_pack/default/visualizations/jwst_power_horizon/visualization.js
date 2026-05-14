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

// --- jwst_power_horizon ---
// JWST Power Horizon — dual-layer area chart
// Solar generation (gold, from top) vs instrument consumption (magenta, from bottom)
// Balance zone tinted green (surplus) or red (deficit)
// Battery % as dashed secondary axis on the right
// Pure ES5 — no const/let/arrow/template literals/for-of/destructuring


// ─── Margin constants ────────────────────────────────────────────────────────
var MARGIN_LEFT   = 52;   // Y-axis wattage labels
var MARGIN_RIGHT  = 44;   // Battery % secondary axis
var MARGIN_TOP    = 22;   // breathing room + top axis label
var MARGIN_BOTTOM = 28;   // X-axis time labels

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

function parseSafe(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}

// Simple cubic hermite spline through point array
// Returns a flat array of [x, y, x, y, ...] screen coords suitable for
// ctx.lineTo / bezierCurveTo usage. Kept simple: catmull-rom tangents.
// pts = [{x, y}, ...]
function buildSmoothPath(pts) {
    return pts; // smoothing done via bezierCurveTo in drawSmoothedPath
}

// Draw a smoothed path through pts using catmull-rom beziers (ES5-safe)
// pts = [{x, y}, ...]
function drawSmoothedPath(ctx, pts) {
    if (pts.length < 2) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y);
        return;
    }
    for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[Math.max(0, i - 1)];
        var p1 = pts[i];
        var p2 = pts[i + 1];
        var p3 = pts[Math.min(pts.length - 1, i + 2)];
        // catmull-rom → bezier control points (tension = 0.5)
        var cp1x = p1.x + (p2.x - p0.x) / 6;
        var cp1y = p1.y + (p2.y - p0.y) / 6;
        var cp2x = p2.x - (p3.x - p1.x) / 6;
        var cp2y = p2.y - (p3.y - p1.y) / 6;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
}

// Draw a linear path through pts
function drawLinearPath(ctx, pts) {
    if (pts.length === 0) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }
}

// ─── Viz ─────────────────────────────────────────────────────────────────────
return SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';

        // Canvas
        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:100%;height:100%;display:block;';
        this.el.appendChild(canvas);
        this._canvas = canvas;

        // Tooltip
        this._tooltip = theme.createTooltip(this.el);

        // Hover crosshair state
        this._hoverIdx = -1;
        this._parsedCache = null;
        this._configCache = null;

        // Suppress Splunk no-data placeholders
        this._observer = new MutationObserver(this._suppressPlaceholder.bind(this));
        this._observer.observe(this.el, { childList: true, subtree: true });

        var self = this;
        canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
        canvas.addEventListener('mouseleave', function()  { self._onMouseLeave(); });
    },

    _suppressPlaceholder: function() {
        var sels = [
            '.viz-placeholder', '.shared-viz-no-results',
            '[data-test="viz-no-results"]', '.viz-controller-no-results'
        ];
        for (var s = 0; s < sels.length; s++) {
            var nodes = this.el.querySelectorAll(sels[s]);
            for (var n = 0; n < nodes.length; n++) {
                nodes[n].style.display = 'none';
            }
        }
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

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
        var result = { colIdx: colIdx, rows: data.rows, fields: fields };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        if (!data || !data.rows) return;
        this._parsedCache = data;
        this._configCache = config;
        this._render(data, config);
    },

    reflow: function() {
        if (this._parsedCache && this._configCache) {
            this._render(this._parsedCache, this._configCache);
        }
    },

    _render: function(data, config) {
        // ── 1. Config reads ─────────────────────────────────────────────────
        var ns            = theme.getNS(this);
        var getOpt        = theme.getOption;

        var timeField     = getOpt(config, ns, 'timeField',        '_time');
        var genField      = getOpt(config, ns, 'generationField',  'solar_watts');
        var conField      = getOpt(config, ns, 'consumptionField', 'consumption_watts');
        var batField      = getOpt(config, ns, 'batteryField',     'battery_pct');
        var genColor      = getOpt(config, ns, 'generationColor',  '#D4A537');
        var conColor      = getOpt(config, ns, 'consumptionColor', '#E040A0');
        var surplusColor  = getOpt(config, ns, 'surplusColor',     '#34D399');
        var deficitColor  = getOpt(config, ns, 'deficitColor',     '#FF4D4D');
        var showBattery   = getOpt(config, ns, 'showBattery',      'true')  === 'true';
        var showBalance   = getOpt(config, ns, 'showBalance',      'true')  === 'true';
        var smoothing     = getOpt(config, ns, 'smoothing',        'true')  === 'true';
        var accentRaw     = getOpt(config, ns, 'accentIntensity',  '50');
        var gi            = parseInt(accentRaw, 10) / 100;
        var themeMode     = getOpt(config, ns, 'theme',            'dark');

        var t             = theme.getTheme(themeMode);

        // ── 2. Canvas setup ─────────────────────────────────────────────────
        var setup = theme.setupCanvas(this.el);
        if (!setup) return;
        var canvas = setup.canvas;
        var ctx    = setup.ctx;
        var W      = setup.w;
        var H      = setup.h;

        this._canvas = canvas;

        ctx.clearRect(0, 0, W, H);

        // Plot area
        var px = MARGIN_LEFT;
        var py = MARGIN_TOP;
        var pw = W - MARGIN_LEFT - MARGIN_RIGHT;
        var ph = H - MARGIN_TOP  - MARGIN_BOTTOM;

        if (pw < 20 || ph < 20) return;

        // ── 3. Parse rows ────────────────────────────────────────────────────
        var rows   = data.rows;
        var colIdx = data.colIdx;

        var tIdx   = colIdx[timeField]  !== undefined ? colIdx[timeField]  : 0;
        var gIdx   = colIdx[genField]   !== undefined ? colIdx[genField]   : 1;
        var cIdx   = colIdx[conField]   !== undefined ? colIdx[conField]   : 2;
        var bIdx   = colIdx[batField]   !== undefined ? colIdx[batField]   : -1;

        var points = [];
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            points.push({
                time: row[tIdx] || '',
                gen:  parseSafe(row[gIdx]),
                con:  parseSafe(row[cIdx]),
                bat:  (bIdx >= 0 && row[bIdx] !== undefined && row[bIdx] !== '') ? parseSafe(row[bIdx]) : -1
            });
        }

        if (points.length === 0) return;

        // ── 4. Scales ────────────────────────────────────────────────────────
        var maxW = 0;
        for (var j = 0; j < points.length; j++) {
            if (points[j].gen > maxW) maxW = points[j].gen;
            if (points[j].con > maxW) maxW = points[j].con;
        }
        if (maxW === 0) maxW = 100;
        var yPad = maxW * 0.08;
        var yMax = maxW + yPad;
        var yMin = 0;

        // wattY: maps a wattage value to a Y coordinate in plot area
        // gen area fills from TOP down → high wattage = HIGH on screen (small Y)
        // con area fills from BOTTOM up → high wattage = LOW on screen (large Y)
        // Both share the same linear Y scale: 0W = bottom, yMax = top
        function wattY(val) {
            var frac = (val - yMin) / (yMax - yMin);
            return py + ph * (1 - frac);
        }

        // xFor: maps data index to X coordinate in plot area
        function xFor(idx) {
            if (points.length === 1) return px + pw * 0.5;
            return px + pw * (idx / (points.length - 1));
        }

        // ── 5. Build screen point arrays ─────────────────────────────────────
        var genPts = [];
        var conPts = [];
        for (var k = 0; k < points.length; k++) {
            genPts.push({ x: xFor(k), y: wattY(points[k].gen) });
            conPts.push({ x: xFor(k), y: wattY(points[k].con) });
        }

        // Store for hit-test
        this._genPts  = genPts;
        this._conPts  = conPts;
        this._points  = points;
        this._px = px; this._py = py; this._pw = pw; this._ph = ph;
        this._xFor    = xFor;
        this._wattY   = wattY;
        this._hoverIdx = this._hoverIdx >= points.length ? -1 : this._hoverIdx;

        // ── 6. Grid lines ────────────────────────────────────────────────────
        ctx.save();
        var gridCount = 4;
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (var g = 0; g <= gridCount; g++) {
            var gy = py + ph * (g / gridCount);
            ctx.beginPath();
            ctx.moveTo(px, gy);
            ctx.lineTo(px + pw, gy);
            ctx.stroke();
        }
        ctx.restore();

        // ── 7. Balance zone (fill between curves) ────────────────────────────
        if (showBalance) {
            ctx.save();

            // We need to paint two separate fill zones:
            // surplus: where genY < conY (gen higher on screen = more watts)
            // deficit: where conY < genY
            // We split at crossover points for accurate coloring.

            var surplusRgba = theme.rgba(surplusColor, 0.20 * gi + 0.10);
            var deficitRgba = theme.rgba(deficitColor, 0.20 * gi + 0.10);

            // Build the top path (min of genY, conY per point) and
            // bottom path (max of genY, conY per point), separated by surplus/deficit.
            // Simple approach: render as a single clipped fill per zone.

            // For each segment between consecutive points, determine which zone.
            // Fill segment by segment with the correct color.
            for (var seg = 0; seg < points.length - 1; seg++) {
                var gY0 = genPts[seg].y,   gY1 = genPts[seg + 1].y;
                var cY0 = conPts[seg].y,   cY1 = conPts[seg + 1].y;
                var x0  = genPts[seg].x,   x1  = genPts[seg + 1].x;

                // Determine if there's a crossover within this segment
                // gen surplus when gY < cY (gen higher on screen)
                var startSurplus = (gY0 < cY0);
                var endSurplus   = (gY1 < cY1);

                if (startSurplus === endSurplus) {
                    // No crossover — fill entire segment with one color
                    ctx.fillStyle = startSurplus ? surplusRgba : deficitRgba;
                    ctx.beginPath();
                    if (smoothing && points.length > 2) {
                        ctx.moveTo(x0, gY0);
                        ctx.lineTo(x1, gY1);
                        ctx.lineTo(x1, cY1);
                        ctx.lineTo(x0, cY0);
                    } else {
                        ctx.moveTo(x0, gY0);
                        ctx.lineTo(x1, gY1);
                        ctx.lineTo(x1, cY1);
                        ctx.lineTo(x0, cY0);
                    }
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Crossover: find x,y where lines intersect
                    // parametric t: gY0 + t*(gY1-gY0) == cY0 + t*(cY1-cY0)
                    var dGen  = gY1 - gY0;
                    var dCon  = cY1 - cY0;
                    var dDiff = (gY0 - cY0);
                    var tCross = dDiff / ((dCon - dGen) || 0.0001);
                    tCross = clamp(tCross, 0, 1);
                    var xCross = x0 + tCross * (x1 - x0);
                    var yCross = gY0 + tCross * (gY1 - gY0);

                    // First half
                    ctx.fillStyle = startSurplus ? surplusRgba : deficitRgba;
                    ctx.beginPath();
                    ctx.moveTo(x0, gY0);
                    ctx.lineTo(xCross, yCross);
                    ctx.lineTo(xCross, yCross);
                    ctx.lineTo(x0, cY0);
                    ctx.closePath();
                    ctx.fill();

                    // Second half
                    ctx.fillStyle = endSurplus ? surplusRgba : deficitRgba;
                    ctx.beginPath();
                    ctx.moveTo(xCross, yCross);
                    ctx.lineTo(x1, gY1);
                    ctx.lineTo(x1, cY1);
                    ctx.lineTo(xCross, yCross);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        // ── 8. Solar generation area (gold, from top) ────────────────────────
        ctx.save();
        // Gradient: gold at data line, transparent at very top
        var gradGen = ctx.createLinearGradient(0, py, 0, py + ph);
        var genRgb  = theme.hexToRgb(genColor);
        gradGen.addColorStop(0,   'rgba(' + genRgb.r + ',' + genRgb.g + ',' + genRgb.b + ',' + (0.85 * gi + 0.08) + ')');
        gradGen.addColorStop(0.4, 'rgba(' + genRgb.r + ',' + genRgb.g + ',' + genRgb.b + ',' + (0.55 * gi + 0.05) + ')');
        gradGen.addColorStop(1,   'rgba(' + genRgb.r + ',' + genRgb.g + ',' + genRgb.b + ',0)');

        // Solar fills from top of chart DOWN to the generation curve
        ctx.beginPath();
        ctx.moveTo(genPts[0].x, py);          // top-left corner of plot
        // line along top
        ctx.lineTo(genPts[genPts.length - 1].x, py);   // top-right corner
        // right edge down to last gen point
        ctx.lineTo(genPts[genPts.length - 1].x, genPts[genPts.length - 1].y);
        // trace gen curve backwards (right to left)
        if (smoothing && genPts.length > 2) {
            var revGen = [];
            for (var rg = genPts.length - 1; rg >= 0; rg--) {
                revGen.push(genPts[rg]);
            }
            drawSmoothedPath(ctx, revGen);
        } else {
            for (var lg = genPts.length - 2; lg >= 0; lg--) {
                ctx.lineTo(genPts[lg].x, genPts[lg].y);
            }
        }
        ctx.closePath();
        ctx.fillStyle = gradGen;
        ctx.fill();

        // Solar line stroke
        theme.resetShadow(ctx);
        ctx.shadowBlur   = 8 * gi;
        ctx.shadowColor  = theme.rgba(genColor, 0.6 * gi);
        ctx.beginPath();
        if (smoothing && genPts.length > 2) {
            drawSmoothedPath(ctx, genPts);
        } else {
            drawLinearPath(ctx, genPts);
        }
        ctx.strokeStyle = genColor;
        ctx.lineWidth   = 2;
        ctx.stroke();
        theme.resetShadow(ctx);
        ctx.restore();

        // ── 9. Consumption area (magenta, from bottom) ───────────────────────
        ctx.save();
        var gradCon = ctx.createLinearGradient(0, py, 0, py + ph);
        var conRgb  = theme.hexToRgb(conColor);
        gradCon.addColorStop(0,   'rgba(' + conRgb.r + ',' + conRgb.g + ',' + conRgb.b + ',0)');
        gradCon.addColorStop(0.6, 'rgba(' + conRgb.r + ',' + conRgb.g + ',' + conRgb.b + ',' + (0.55 * gi + 0.05) + ')');
        gradCon.addColorStop(1,   'rgba(' + conRgb.r + ',' + conRgb.g + ',' + conRgb.b + ',' + (0.85 * gi + 0.08) + ')');

        // Consumption fills from BOTTOM of chart UP to consumption curve
        var chartBottom = py + ph;
        ctx.beginPath();
        ctx.moveTo(conPts[0].x, chartBottom);    // bottom-left
        // trace con curve left to right
        if (smoothing && conPts.length > 2) {
            drawSmoothedPath(ctx, conPts);
        } else {
            drawLinearPath(ctx, conPts);
        }
        // bottom-right corner, then back to bottom-left
        ctx.lineTo(conPts[conPts.length - 1].x, chartBottom);
        ctx.closePath();
        ctx.fillStyle = gradCon;
        ctx.fill();

        // Consumption line stroke
        ctx.shadowBlur   = 8 * gi;
        ctx.shadowColor  = theme.rgba(conColor, 0.6 * gi);
        ctx.beginPath();
        if (smoothing && conPts.length > 2) {
            drawSmoothedPath(ctx, conPts);
        } else {
            drawLinearPath(ctx, conPts);
        }
        ctx.strokeStyle = conColor;
        ctx.lineWidth   = 2;
        ctx.stroke();
        theme.resetShadow(ctx);
        ctx.restore();

        // ── 10. Battery % line ───────────────────────────────────────────────
        var hasBattery = showBattery && bIdx >= 0;
        if (hasBattery) {
            var batPts = [];
            for (var bi = 0; bi < points.length; bi++) {
                if (points[bi].bat >= 0) {
                    var batFrac = clamp(points[bi].bat, 0, 100) / 100;
                    var batY    = py + ph * (1 - batFrac);
                    batPts.push({ x: xFor(bi), y: batY });
                }
            }
            if (batPts.length >= 2) {
                ctx.save();
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = theme.rgba(genColor, 0.55);
                ctx.lineWidth   = 1;
                ctx.beginPath();
                if (smoothing && batPts.length > 2) {
                    drawSmoothedPath(ctx, batPts);
                } else {
                    drawLinearPath(ctx, batPts);
                }
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
            this._batPts = batPts;
        }

        // ── 11. Hover crosshair ──────────────────────────────────────────────
        var hi = this._hoverIdx;
        if (hi >= 0 && hi < points.length) {
            var hx = xFor(hi);
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth   = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(hx, py);
            ctx.lineTo(hx, py + ph);
            ctx.stroke();
            ctx.setLineDash([]);

            // Gen dot
            ctx.beginPath();
            ctx.arc(hx, genPts[hi].y, 4, 0, Math.PI * 2);
            ctx.fillStyle   = genColor;
            ctx.shadowBlur  = 10 * gi;
            ctx.shadowColor = theme.rgba(genColor, 0.8);
            ctx.fill();
            theme.resetShadow(ctx);

            // Con dot
            ctx.beginPath();
            ctx.arc(hx, conPts[hi].y, 4, 0, Math.PI * 2);
            ctx.fillStyle   = conColor;
            ctx.shadowBlur  = 10 * gi;
            ctx.shadowColor = theme.rgba(conColor, 0.8);
            ctx.fill();
            theme.resetShadow(ctx);

            // Battery dot
            if (hasBattery && this._batPts && this._batPts.length > hi) {
                var bp = this._batPts[hi];
                if (bp) {
                    ctx.beginPath();
                    ctx.arc(bp.x, bp.y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = theme.rgba(genColor, 0.6);
                    ctx.fill();
                }
            }
            ctx.restore();
        }

        // ── 12. Y-axis labels (left — wattage) ───────────────────────────────
        ctx.save();
        ctx.font      = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(232,236,241,0.30)';
        ctx.textAlign = 'right';
        for (var ya = 0; ya <= gridCount; ya++) {
            var yVal = yMin + (yMax - yMin) * (ya / gridCount);
            var yPx  = wattY(yVal);
            ctx.fillText(theme.fmtNum(yVal, { compact: true }), px - 6, yPx + 3);
        }

        // Y-axis label "SOLAR GEN (W)"
        ctx.save();
        ctx.font      = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(212,165,55,0.45)';
        ctx.textAlign = 'left';
        ctx.fillText('SOLAR GEN (W)', px + 4, py + 11);
        ctx.restore();

        // Y-axis label "CONSUMPTION (W)"
        ctx.save();
        ctx.font      = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(224,64,160,0.45)';
        ctx.textAlign = 'left';
        ctx.fillText('CONSUMPTION (W)', px + 4, py + ph - 5);
        ctx.restore();

        ctx.restore();

        // ── 13. Battery % axis labels (right) ────────────────────────────────
        if (hasBattery) {
            ctx.save();
            ctx.font      = '10px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(232,236,241,0.25)';
            ctx.textAlign = 'left';
            var batLabels = [0, 25, 50, 75, 100];
            for (var bl = 0; bl < batLabels.length; bl++) {
                var bPct = batLabels[bl];
                var bY   = py + ph * (1 - bPct / 100);
                ctx.fillText(bPct + '%', px + pw + 6, bY + 3);
            }
            ctx.restore();
        }

        // ── 14. X-axis time labels ────────────────────────────────────────────
        ctx.save();
        ctx.font      = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(232,236,241,0.30)';
        ctx.textAlign = 'center';

        var maxLabels = Math.max(2, Math.floor(pw / 80));
        var step      = Math.max(1, Math.floor(points.length / maxLabels));
        for (var xi = 0; xi < points.length; xi += step) {
            var label = _formatTimeLabel(points[xi].time);
            if (label) {
                ctx.fillText(label, xFor(xi), py + ph + 16);
            }
        }
        // Always render last label
        if (points.length > 1) {
            var lastLabel = _formatTimeLabel(points[points.length - 1].time);
            if (lastLabel) {
                ctx.textAlign = 'right';
                ctx.fillText(lastLabel, xFor(points.length - 1), py + ph + 16);
            }
        }
        ctx.restore();
    },

    _onMouseMove: function(e) {
        if (!this._points || this._points.length === 0) return;

        var rect  = this._canvas.getBoundingClientRect();
        var mx    = e.clientX - rect.left;

        var pw    = this._pw;
        var px    = this._px;
        var count = this._points.length;

        // Map mx to nearest data index
        var frac = (mx - px) / pw;
        var idx  = Math.round(frac * (count - 1));
        idx = clamp(idx, 0, count - 1);

        this._hoverIdx = idx;

        // Re-render with crosshair
        if (this._parsedCache && this._configCache) {
            this._render(this._parsedCache, this._configCache);
        }

        // Tooltip
        var pt  = this._points[idx];
        var bal = pt.gen - pt.con;
        var balSign = bal >= 0 ? '+' : '';
        var balColor = bal >= 0 ? '#34D399' : '#FF4D4D';

        var html = '<span style="color:#D4A537">GEN</span> '  + theme.fmtNum(pt.gen, { decimals: 1 }) + ' W' +
                   '&nbsp;&nbsp;' +
                   '<span style="color:#E040A0">CON</span> '  + theme.fmtNum(pt.con, { decimals: 1 }) + ' W' +
                   '&nbsp;&nbsp;' +
                   '<span style="color:' + balColor + '">' + balSign + theme.fmtNum(bal, { decimals: 1 }) + ' W</span>';

        if (pt.bat >= 0) {
            html += '&nbsp;&nbsp;<span style="color:rgba(212,165,55,0.7)">BAT</span> ' + theme.fmtNum(pt.bat, { decimals: 1 }) + '%';
        }
        if (pt.time) {
            html = '<span style="opacity:0.45;font-size:10px">' + pt.time + '</span><br>' + html;
        }

        theme.showTooltip(this._tooltip, e, this._canvas, html);
        this._canvas.style.cursor = 'crosshair';
    },

    _onMouseLeave: function() {
        this._hoverIdx = -1;
        theme.hideTooltip(this._tooltip);
        if (this._canvas) this._canvas.style.cursor = 'default';
        if (this._parsedCache && this._configCache) {
            this._render(this._parsedCache, this._configCache);
        }
    },

    destroy: function() {
        if (this._observer) { this._observer.disconnect(); }
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});

// ─── Module-level helper (not on prototype — no `this` scoping issue) ────────
function _formatTimeLabel(timeStr) {
    if (!timeStr) return '';
    // Try to extract HH:MM or MM-DD from ISO timestamps
    // Handles: "2024-01-15T14:30:00", "14:30:00", "2024-01-15 14:30:00"
    var s = String(timeStr);
    // ISO datetime
    var m = s.match(/T(\d{2}:\d{2})/);
    if (m) return m[1];
    // Space-separated datetime
    m = s.match(/\d{4}-\d{2}-\d{2} (\d{2}:\d{2})/);
    if (m) return m[1];
    // Just a time
    m = s.match(/^(\d{2}:\d{2})/);
    if (m) return m[1];
    // Date only (MM-DD)
    m = s.match(/\d{4}-(\d{2}-\d{2})/);
    if (m) return m[1];
    // Fallback: truncate to 8 chars
    return s.length > 8 ? s.substring(0, 8) : s;
}


});