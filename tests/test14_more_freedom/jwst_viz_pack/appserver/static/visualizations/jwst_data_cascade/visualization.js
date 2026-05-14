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

// --- jwst_data_cascade ---
// JWST Data Cascade — vertical waterfall of data download streams
// Each row = one frequency band flowing from L2 orbit to DSN ground station
// Particle animation proportional to transfer rate
'use strict';


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
var PAD_L       = 80;   // left margin (L2 ORBIT label + satellite area)
var PAD_R       = 80;   // right margin (DSN GROUND label + station area)
var PAD_TOP     = 36;   // top inset
var PAD_BOT     = 44;   // bottom inset (total progress bar)
var ROW_H       = 22;   // stream pipe height
var ROW_GAP     = 16;   // gap between rows
var LABEL_H     = 14;   // height reserved above each stream for band label
var PARTICLE_R  = 2;    // particle dot radius
var PARTICLE_SP = 22;   // spacing between particles along the stream
var TICK_MS     = 30;   // animation interval
var BASE_SPD    = 1.2;  // pixels/tick at 0 Mbps (still flows slowly)
var MAX_SPD     = 9;    // pixels/tick cap

// ---------------------------------------------------------------------------
// Visualization definition
// ---------------------------------------------------------------------------
return SplunkVisualizationBase.extend({

    // Internal state
    _canvas:    null,
    _ctx:       null,
    _tooltip:   null,
    _timer:     null,
    _particles: null,   // array of particle state objects
    _bands:     null,   // processed row data
    _layout:    null,   // cached layout geometry
    _animOn:    true,
    _hoverIdx:  -1,

    // -----------------------------------------------------------------------
    // initialize
    // -----------------------------------------------------------------------
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.overflow = 'hidden';
        this.el.style.position = 'relative';
        this._particles = [];
        this._bands     = [];
        this._layout    = null;
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    // -----------------------------------------------------------------------
    // formatData  — NO config access here
    // -----------------------------------------------------------------------
    formatData: function(data) {
        if (!data || !data.rows || !data.fields) return null;

        var rows   = data.rows;
        var fields = data.fields;

        var bandIdx  = 0;
        var xferIdx  = 1;
        var planIdx  = 2;
        var rateIdx  = 3;

        // Try to locate columns by name
        for (var fi = 0; fi < fields.length; fi++) {
            var fn = (fields[fi].name || fields[fi]).toLowerCase();
            if (fn === 'band')         bandIdx = fi;
            if (fn === 'transferred_gb') xferIdx = fi;
            if (fn === 'planned_gb')    planIdx = fi;
            if (fn === 'rate_mbps')     rateIdx = fi;
        }

        var result = [];
        for (var ri = 0; ri < rows.length; ri++) {
            var row   = rows[ri];
            var band  = String(row[bandIdx] || 'BAND-' + (ri + 1));
            var xfer  = parseFloat(row[xferIdx]) || 0;
            var plan  = parseFloat(row[planIdx])  || 1;
            var rate  = rateIdx < row.length ? (parseFloat(row[rateIdx]) || 0) : 0;
            if (plan <= 0) plan = 1;
            result.push({
                band:  band,
                xfer:  xfer,
                plan:  plan,
                rate:  rate,
                frac:  Math.min(1, Math.max(0, xfer / plan))
            });
        }
        return result;
    },

    // -----------------------------------------------------------------------
    // updateView
    // -----------------------------------------------------------------------
    updateView: function(formattedData, config) {
        this._lastData = formattedData;
        this._lastConfig = config;
        if (!formattedData || !formattedData.length) {
            this._clearCanvas();
            return;
        }

        var self   = this;
        var ns     = theme.getNS(this);
        var go     = function(key, def) {
            return theme.getOption(config, ns, key, def);
        };

        var mode        = go('theme',           'dark');
        var tk          = theme.getTheme(mode);
        var streamColor = go('streamColor',     tk.cyan);
        var completedColor = go('completedColor', tk.gold);
        var pendingColor   = go('pendingColor',  tk.muted);
        var showRate    = go('showRate',        'true') !== 'false';
        var animOn      = go('animateStreams',  'true') !== 'false';
        var gi          = parseInt(go('accentIntensity', '50'), 10) / 100;

        this._animOn    = animOn;
        this._bands     = formattedData;
        this._config    = {
            mode:           mode,
            tk:             tk,
            streamColor:    streamColor,
            completedColor: completedColor,
            pendingColor:   pendingColor,
            showRate:       showRate,
            gi:             gi
        };

        // Setup canvas
        var cv = theme.setupCanvas(this.el);
        this._canvas = cv.canvas;
        this._ctx    = cv.ctx;

        // Tooltip
        if (!this._tooltip) {
            this._tooltip = theme.createTooltip(this.el);
            this._bindEvents();
        }

        try {
            this._computeLayout(cv.w, cv.h);
            this._buildParticles();
            this._stopTimer();
            if (animOn) {
                this._startTimer();
            } else {
                this._draw();
            }
        } catch (e) {
            if (typeof console !== 'undefined') {
                console.error('JWST data_cascade render error:', e);
            }
        }
    },

    // -----------------------------------------------------------------------
    // _computeLayout  — derives row geometry from canvas size
    // -----------------------------------------------------------------------
    _computeLayout: function(w, h) {
        var bands  = this._bands;
        var n      = bands.length;
        var rowUnit = ROW_H + LABEL_H + ROW_GAP;
        var totalRows = n * rowUnit - ROW_GAP;

        // Vertical centering with padding
        var availH = h - PAD_TOP - PAD_BOT;
        var startY = PAD_TOP + Math.max(0, (availH - totalRows) / 2);

        var streamX = PAD_L;
        var streamW = Math.max(10, w - PAD_L - PAD_R);

        var rows = [];
        for (var i = 0; i < n; i++) {
            var y = startY + i * rowUnit;
            rows.push({
                labelY: y,
                pipeY:  y + LABEL_H,
                pipeH:  ROW_H,
                pipeX:  streamX,
                pipeW:  streamW
            });
        }

        this._layout = {
            w:          w,
            h:          h,
            streamX:    streamX,
            streamW:    streamW,
            rows:       rows,
            totalRows:  totalRows,
            startY:     startY,
            summaryY:   h - PAD_BOT + 12
        };
    },

    // -----------------------------------------------------------------------
    // _buildParticles  — one pool of particles per band row
    // -----------------------------------------------------------------------
    _buildParticles: function() {
        var bands   = this._bands;
        var layout  = this._layout;
        if (!layout) return;

        var pools = [];
        for (var i = 0; i < bands.length; i++) {
            var row  = layout.rows[i];
            var frac = bands[i].frac;
            var len  = row.pipeW * frac;          // transferred length in px
            if (len < 4) { pools.push([]); continue; }

            // Number of particles that fit in the stream
            var count = Math.max(1, Math.floor(len / PARTICLE_SP));
            var pool  = [];
            for (var p = 0; p < count; p++) {
                pool.push({
                    x:     row.pipeX + (p * PARTICLE_SP) % len,
                    alpha: 0.5 + Math.random() * 0.5
                });
            }
            pools.push(pool);
        }
        this._particles = pools;
    },

    // -----------------------------------------------------------------------
    // _startTimer / _stopTimer
    // -----------------------------------------------------------------------
    _startTimer: function() {
        var self = this;
        this._timer = setInterval(function() {
            self._tickParticles();
            self._draw();
        }, TICK_MS);
    },

    _stopTimer: function() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    },

    // -----------------------------------------------------------------------
    // _tickParticles  — advance positions each frame
    // -----------------------------------------------------------------------
    _tickParticles: function() {
        var bands   = this._bands;
        var layout  = this._layout;
        var pools   = this._particles;
        if (!layout) return;

        for (var i = 0; i < bands.length; i++) {
            var pool = pools[i];
            if (!pool || !pool.length) continue;

            var row   = layout.rows[i];
            var frac  = bands[i].frac;
            var rate  = bands[i].rate;   // Mbps
            var len   = row.pipeW * frac;

            // Speed: base + rate contribution, capped
            var spd   = BASE_SPD + Math.min(rate / 50, MAX_SPD - BASE_SPD);

            for (var p = 0; p < pool.length; p++) {
                pool[p].x += spd;
                // Wrap back to left edge when particle exits transferred zone
                if (pool[p].x > row.pipeX + len) {
                    pool[p].x = row.pipeX + (pool[p].x - (row.pipeX + len));
                }
            }
        }
    },

    // -----------------------------------------------------------------------
    // _draw  — full canvas redraw
    // -----------------------------------------------------------------------
    _draw: function() {
        var canvas = this._canvas;
        var ctx    = this._ctx;
        var layout = this._layout;
        var bands  = this._bands;
        var pools  = this._particles;
        var cfg    = this._config;
        if (!canvas || !ctx || !layout || !bands.length) return;

        var tk     = cfg.tk;
        var gi     = cfg.gi;
        var w      = layout.w;
        var h      = layout.h;

        ctx.clearRect(0, 0, w, h);

        // ---- side labels ----
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = tk.dim;
        ctx.textAlign = 'center';
        ctx.fillText('L2 ORBIT', PAD_L / 2, layout.startY + layout.totalRows / 2);
        ctx.fillText('DSN', w - PAD_R / 2, layout.startY + layout.totalRows / 2);
        ctx.fillText('GROUND', w - PAD_R / 2, layout.startY + layout.totalRows / 2 + 11);
        theme.resetShadow(ctx);

        // ---- satellite silhouette (minimal) ----
        this._drawSatelliteGlyph(ctx, PAD_L / 2, layout.startY + layout.totalRows / 2 - 28, tk);
        // ---- ground station glyph ----
        this._drawGroundGlyph(ctx, w - PAD_R / 2, layout.startY + layout.totalRows / 2 - 28, tk);

        // ---- per-band rows ----
        for (var i = 0; i < bands.length; i++) {
            var band = bands[i];
            var row  = layout.rows[i];
            var pool = pools[i] || [];
            var isHover = (i === this._hoverIdx);

            this._drawRow(ctx, band, row, pool, cfg, gi, isHover, i);
        }

        // ---- aggregate summary bar ----
        this._drawSummary(ctx, bands, layout, cfg, gi);

        theme.resetShadow(ctx);
    },

    // -----------------------------------------------------------------------
    // _drawRow  — single band stream
    // -----------------------------------------------------------------------
    _drawRow: function(ctx, band, row, pool, cfg, gi, isHover, idx) {
        var tk       = cfg.tk;
        var px       = row.pipeX;
        var py       = row.pipeY;
        var pw       = row.pipeW;
        var ph       = row.pipeH;
        var frac     = band.frac;
        var doneW    = pw * frac;
        var rx       = 3;  // corner radius

        // -- band label above stream --
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = isHover ? cfg.completedColor : tk.dim;
        ctx.fillText(band.band.toUpperCase(), px, row.labelY + 10);

        if (cfg.showRate && band.rate > 0) {
            ctx.textAlign = 'right';
            ctx.fillStyle = isHover ? cfg.completedColor : tk.dim;
            ctx.fillText(theme.fmtNum(band.rate, {decimals: 1}) + ' Mbps', px + pw, row.labelY + 10);
        }

        // -- pending trough (full width dotted) --
        ctx.save();
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = cfg.pendingColor;
        ctx.lineWidth = ph;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px + rx, py + ph / 2);
        ctx.lineTo(px + pw - rx, py + ph / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        if (doneW < 4) return;

        // -- transferred stream gradient --
        var grad = ctx.createLinearGradient(px, 0, px + doneW, 0);
        grad.addColorStop(0,   theme.rgba(cfg.streamColor.replace('#', '').length === 6 ? cfg.streamColor : tk.cyan, 0.55 + gi * 0.35));
        grad.addColorStop(0.6, cfg.streamColor || tk.cyan);
        grad.addColorStop(1,   cfg.completedColor || tk.gold);

        // subtle glow behind the stream
        if (gi > 0.1) {
            ctx.save();
            ctx.shadowColor = cfg.streamColor || tk.cyan;
            ctx.shadowBlur  = 6 + gi * 10;
            ctx.fillStyle   = grad;
            this._roundRect(ctx, px, py, doneW, ph, rx);
            ctx.fill();
            theme.resetShadow(ctx);
            ctx.restore();
        }

        ctx.fillStyle = grad;
        this._roundRect(ctx, px, py, doneW, ph, rx);
        ctx.fill();

        // -- leading edge glow pulse --
        var edgeX = px + doneW;
        if (isHover || gi > 0.3) {
            ctx.save();
            var edgeGrad = ctx.createRadialGradient(edgeX, py + ph / 2, 0, edgeX, py + ph / 2, ph * 2);
            edgeGrad.addColorStop(0, theme.rgba(tk.gold.replace(/[^a-fA-F0-9]/g, '').length === 6 ? tk.gold : '#D4A537', 0.6 * gi));
            edgeGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = edgeGrad;
            ctx.fillRect(edgeX - ph, py - ph, ph * 2, ph * 3);
            ctx.restore();
        }

        // -- particles --
        for (var p = 0; p < pool.length; p++) {
            var ptx = pool[p].x;
            if (ptx < px || ptx > px + doneW) continue;

            var t = (ptx - px) / doneW;
            var particleColor = theme.lerpColor(
                cfg.streamColor.charAt(0) === '#' ? cfg.streamColor : tk.cyan,
                cfg.completedColor.charAt(0) === '#' ? cfg.completedColor : tk.gold,
                t
            );

            ctx.save();
            ctx.shadowColor = particleColor;
            ctx.shadowBlur  = 5 + gi * 6;
            ctx.fillStyle   = particleColor;
            ctx.globalAlpha = pool[p].alpha;
            ctx.beginPath();
            ctx.arc(ptx, py + ph / 2, PARTICLE_R, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            theme.resetShadow(ctx);
        }

        // -- pct label at right end of done zone --
        if (doneW > 28) {
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillStyle = isHover ? '#FFFFFF' : tk.text;
            ctx.fillText(Math.round(frac * 100) + '%', px + doneW - 4, py + ph / 2 + 3);
        }

        theme.resetShadow(ctx);
    },

    // -----------------------------------------------------------------------
    // _drawSummary  — aggregate gold progress line at bottom
    // -----------------------------------------------------------------------
    _drawSummary: function(ctx, bands, layout, cfg, gi) {
        var totalXfer = 0;
        var totalPlan = 0;
        for (var i = 0; i < bands.length; i++) {
            totalXfer += bands[i].xfer;
            totalPlan += bands[i].plan;
        }
        var frac = totalPlan > 0 ? Math.min(1, totalXfer / totalPlan) : 0;

        var tk     = cfg.tk;
        var sx     = layout.streamX;
        var sw     = layout.streamW;
        var sy     = layout.summaryY;
        var barH   = 3;

        // track
        ctx.fillStyle = tk.muted;
        this._roundRect(ctx, sx, sy, sw, barH, 1);
        ctx.fill();

        // fill
        if (frac > 0) {
            var grad = ctx.createLinearGradient(sx, 0, sx + sw * frac, 0);
            grad.addColorStop(0, cfg.streamColor || tk.cyan);
            grad.addColorStop(1, cfg.completedColor || tk.gold);

            if (gi > 0.1) {
                ctx.save();
                ctx.shadowColor = cfg.completedColor || tk.gold;
                ctx.shadowBlur  = 4 + gi * 8;
                ctx.fillStyle   = grad;
                this._roundRect(ctx, sx, sy, sw * frac, barH, 1);
                ctx.fill();
                theme.resetShadow(ctx);
                ctx.restore();
            }

            ctx.fillStyle = grad;
            this._roundRect(ctx, sx, sy, sw * frac, barH, 1);
            ctx.fill();
        }

        // text
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = tk.dim;
        ctx.fillText('TOTAL TRANSFERRED:', sx, sy + 18);

        ctx.font = '11px Oxanium, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = cfg.completedColor || tk.gold;
        ctx.fillText(
            theme.fmtNum(totalXfer, {decimals: 1}) + ' / ' +
            theme.fmtNum(totalPlan, {decimals: 1}) + ' GB  (' +
            Math.round(frac * 100) + '%)',
            sx + sw, sy + 18
        );

        theme.resetShadow(ctx);
    },

    // -----------------------------------------------------------------------
    // _drawSatelliteGlyph  — tiny JWST silhouette (hex mirror + arms)
    // -----------------------------------------------------------------------
    _drawSatelliteGlyph: function(ctx, cx, cy, tk) {
        ctx.save();
        ctx.strokeStyle = theme.rgba('#00B4D8', 0.4);
        ctx.lineWidth   = 1;

        // primary mirror (hexagon)
        var r = 8;
        ctx.beginPath();
        for (var a = 0; a < 6; a++) {
            var ang = (a * Math.PI / 3) - Math.PI / 6;
            var vx  = cx + r * Math.cos(ang);
            var vy  = cy + r * Math.sin(ang);
            if (a === 0) ctx.moveTo(vx, vy);
            else         ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.stroke();

        // solar panel arms
        ctx.beginPath();
        ctx.moveTo(cx - r, cy);
        ctx.lineTo(cx - r - 10, cy - 4);
        ctx.lineTo(cx - r - 10, cy + 4);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + r, cy);
        ctx.lineTo(cx + r + 10, cy - 4);
        ctx.lineTo(cx + r + 10, cy + 4);
        ctx.closePath();
        ctx.stroke();

        // sunshield layers
        for (var layer = 0; layer < 3; layer++) {
            var lw = 16 + layer * 5;
            var lh = 2;
            var ly = cy + r + 3 + layer * 3;
            ctx.globalAlpha = 0.3 - layer * 0.07;
            ctx.strokeRect(cx - lw / 2, ly, lw, lh);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        theme.resetShadow(ctx);
    },

    // -----------------------------------------------------------------------
    // _drawGroundGlyph  — dish antenna
    // -----------------------------------------------------------------------
    _drawGroundGlyph: function(ctx, cx, cy, tk) {
        ctx.save();
        ctx.strokeStyle = theme.rgba('#D4A537', 0.35);
        ctx.lineWidth   = 1.2;

        // dish arc
        var rx = 10;
        var ry = 7;
        ctx.beginPath();
        ctx.ellipse(cx, cy + ry, rx, ry, 0, Math.PI, 0);
        ctx.stroke();

        // dish center feed
        ctx.beginPath();
        ctx.moveTo(cx, cy + ry);
        ctx.lineTo(cx, cy + ry + 6);
        ctx.stroke();

        // support arm
        ctx.beginPath();
        ctx.moveTo(cx - rx, cy + ry);
        ctx.lineTo(cx, cy + ry + 10);
        ctx.lineTo(cx + rx, cy + ry);
        ctx.stroke();

        // base
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy + ry + 10);
        ctx.lineTo(cx + 6, cy + ry + 10);
        ctx.stroke();

        ctx.restore();
        theme.resetShadow(ctx);
    },

    // -----------------------------------------------------------------------
    // _roundRect  — helper (no fill/stroke call, caller decides)
    // -----------------------------------------------------------------------
    _roundRect: function(ctx, x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    // -----------------------------------------------------------------------
    // _clearCanvas
    // -----------------------------------------------------------------------
    _clearCanvas: function() {
        if (this._ctx && this._layout) {
            this._ctx.clearRect(0, 0, this._layout.w, this._layout.h);
        }
    },

    // -----------------------------------------------------------------------
    // _bindEvents  — mousemove, mouseleave for hover tooltip
    // -----------------------------------------------------------------------
    _bindEvents: function() {
        var self    = this;
        var canvas  = this._canvas;
        var tip     = this._tooltip;

        canvas.addEventListener('mousemove', function(e) {
            var rect = canvas.getBoundingClientRect();
            var mx   = e.clientX - rect.left;
            var my   = e.clientY - rect.top;
            var hit  = self._hitTest(mx, my);
            self._hoverIdx = hit;

            if (hit >= 0 && self._bands && self._bands[hit]) {
                var b    = self._bands[hit];
                var pct  = Math.round(b.frac * 100);
                var html =
                    '<b style="color:#00B4D8">' + b.band.toUpperCase() + '</b><br>' +
                    'Transferred: <b>' + theme.fmtNum(b.xfer, {decimals: 2}) + ' GB</b><br>' +
                    'Planned: <b>' + theme.fmtNum(b.plan, {decimals: 2}) + ' GB</b><br>' +
                    'Progress: <b style="color:#D4A537">' + pct + '%</b>' +
                    (b.rate > 0 ? '<br>Rate: <b>' + theme.fmtNum(b.rate, {decimals: 1}) + ' Mbps</b>' : '');
                theme.showTooltip(tip, e, canvas, html);
            } else {
                theme.hideTooltip(tip);
            }
            if (!self._animOn) self._draw();
        });

        canvas.addEventListener('mouseleave', function() {
            self._hoverIdx = -1;
            theme.hideTooltip(tip);
            if (!self._animOn) self._draw();
        });
    },

    // -----------------------------------------------------------------------
    // _hitTest  — returns band index or -1
    // -----------------------------------------------------------------------
    _hitTest: function(mx, my) {
        var layout = this._layout;
        if (!layout) return -1;
        for (var i = 0; i < layout.rows.length; i++) {
            var row = layout.rows[i];
            if (mx >= row.pipeX && mx <= row.pipeX + row.pipeW &&
                my >= row.labelY && my <= row.pipeY + row.pipeH + 2) {
                return i;
            }
        }
        return -1;
    },

    // -----------------------------------------------------------------------
    // reflow
    // -----------------------------------------------------------------------
    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this.updateView(this._lastData, this._lastConfig);
        }
    },

    // -----------------------------------------------------------------------
    // destroy
    // -----------------------------------------------------------------------
    destroy: function() {
        this._stopTimer();
        if (this._canvas) {
            this._canvas.removeEventListener('mousemove', null);
            this._canvas.removeEventListener('mouseleave', null);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});


});