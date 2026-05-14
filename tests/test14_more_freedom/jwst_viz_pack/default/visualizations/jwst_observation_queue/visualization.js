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

// --- jwst_observation_queue ---
// jwst_observation_queue — Prioritized observation target queue
// Splunk custom visualization — pure ES5, Canvas 2D
// Part of jwst_viz_pack


// ─── constants ───────────────────────────────────────────────────────────────
var CARD_H       = 52;   // px per card
var CARD_GAP     = 4;    // px between cards
var STAGGER_STEP = 2;    // px indent added per subsequent card
var PAD_LEFT     = 14;   // left content padding (after diamond)
var PAD_RIGHT    = 12;   // right content padding
var DIAMOND_W    = 16;   // diamond indicator width
var DIAMOND_H    = 16;   // diamond indicator height
var BADGE_H      = 18;   // instrument badge height
var BAR_H        = 4;    // duration bar height
var IP_BORDER_W  = 3;    // in_progress left border width
var SCAN_PERIOD  = 2800; // ms for one full scan sweep

// ─── module.exports ──────────────────────────────────────────────────────────
return SplunkVisualizationBase.extend({

    // ── lifecycle ─────────────────────────────────────────────────────────────

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._tip = theme.createTooltip(this.el);
        this._hitRegions = [];
        this._scanPhase = 0;
        this._animTimer = null;
        this._ipCardIndex = -1;
        this._lastData   = null;
        this._lastConfig = null;
        this._eventsAttached = false;
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
        var result = { colIdx: colIdx, rows: data.rows };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        this._lastData   = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    destroy: function() {
        this._stopAnimation();
        if (this._tip && this._tip.parentNode) {
            this._tip.parentNode.removeChild(this._tip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    },

    // ── rendering ─────────────────────────────────────────────────────────────

    _render: function(data, config) {
        var ns    = theme.getNS(this);
        var t     = theme.getTheme(theme.getOption(config, ns, 'theme', 'dark'));
        var gi    = parseInt(theme.getOption(config, ns, 'accentIntensity', '50'), 10) / 100;

        // field names
        var targetField     = theme.getOption(config, ns, 'targetField',     'target_name');
        var priorityField   = theme.getOption(config, ns, 'priorityField',   'priority');
        var durationField   = theme.getOption(config, ns, 'durationField',   'estimated_hours');
        var instrumentField = theme.getOption(config, ns, 'instrumentField', 'instrument');
        var statusField     = theme.getOption(config, ns, 'statusField',     'status');

        // color tokens
        var highColor  = theme.getOption(config, ns, 'priorityHighColor', '#D4A537');
        var medColor   = theme.getOption(config, ns, 'priorityMedColor',  '#00B4D8');
        var lowColor   = theme.getOption(config, ns, 'priorityLowColor',  'rgba(232,236,241,0.30)');
        var ipColor    = theme.getOption(config, ns, 'inProgressColor',   '#E040A0');

        // options
        var maxItems      = parseInt(theme.getOption(config, ns, 'maxItems',      '5'), 10)  || 5;
        var showInstrument = theme.getOption(config, ns, 'showInstrument', 'true') !== 'false';

        // canvas setup
        var setup = theme.setupCanvas(this.el);
        this._canvas = setup.canvas;
        var ctx = setup.ctx;
        var W   = setup.w;
        var H   = setup.h;

        if (!this._eventsAttached) {
            this._eventsAttached = true;
            var self = this;
            this._canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
            this._canvas.addEventListener('mouseleave', function() {
                theme.hideTooltip(self._tip);
                self._canvas.style.cursor = 'default';
            });
        }

        ctx.clearRect(0, 0, W, H);

        // parse rows
        if (!data || !data.rows || data.rows.length === 0) {
            this._drawEmpty(ctx, W, H, t);
            return;
        }

        var colIdx = data.colIdx;
        var rows   = data.rows;

        // build item list
        var items = [];
        for (var ri = 0; ri < rows.length && items.length < maxItems; ri++) {
            var row = rows[ri];
            var item = {
                target:     String(row[colIdx[targetField]]     || '—'),
                priority:   parseInt(row[colIdx[priorityField]] || '3', 10),
                duration:   parseFloat(row[colIdx[durationField]] || '0'),
                instrument: colIdx[instrumentField] !== undefined ? String(row[colIdx[instrumentField]] || '') : '',
                status:     colIdx[statusField]     !== undefined ? String(row[colIdx[statusField]]     || 'queued').toLowerCase() : 'queued'
            };
            items.push(item);
        }

        if (items.length === 0) {
            this._drawEmpty(ctx, W, H, t);
            return;
        }

        // max duration for bar scaling
        var maxDuration = 0;
        for (var ii = 0; ii < items.length; ii++) {
            if (items[ii].duration > maxDuration) maxDuration = items[ii].duration;
        }
        if (maxDuration === 0) maxDuration = 1;

        // layout
        var totalH = items.length * (CARD_H + CARD_GAP) - CARD_GAP;
        var startY = Math.max(8, (H - totalH) / 2);

        // detect in_progress card
        this._ipCardIndex = -1;
        for (var ki = 0; ki < items.length; ki++) {
            if (items[ki].status === 'in_progress') {
                this._ipCardIndex = ki;
                break;
            }
        }

        // start / restart scan animation if there is an in_progress card
        if (this._ipCardIndex >= 0) {
            this._startAnimation();
        } else {
            this._stopAnimation();
        }

        // store for hit testing and incremental redraws
        this._items      = items;
        this._startY     = startY;
        this._maxDuration = maxDuration;
        this._renderConfig = {
            t: t, gi: gi,
            highColor: highColor, medColor: medColor, lowColor: lowColor,
            ipColor: ipColor, showInstrument: showInstrument, W: W
        };

        this._drawAllCards(ctx, W, H);
    },

    _drawAllCards: function(ctx, W, H) {
        var items      = this._items;
        var startY     = this._startY;
        var maxDuration = this._maxDuration;
        var rc         = this._renderConfig;
        var t          = rc.t;
        var gi         = rc.gi;

        ctx.clearRect(0, 0, W, H);

        this._hitRegions = [];

        for (var i = 0; i < items.length; i++) {
            var item   = items[i];
            var indent = i * STAGGER_STEP;
            var cardX  = indent;
            var cardW  = W - indent;
            var cardY  = startY + i * (CARD_H + CARD_GAP);

            this._drawCard(ctx, cardX, cardY, cardW, CARD_H, item, i, maxDuration, rc);

            this._hitRegions.push({
                x: cardX, y: cardY, w: cardW, h: CARD_H,
                item: item, index: i
            });
        }
    },

    _drawCard: function(ctx, x, y, w, h, item, idx, maxDuration, rc) {
        var t             = rc.t;
        var gi            = rc.gi;
        var highColor     = rc.highColor;
        var medColor      = rc.medColor;
        var lowColor      = rc.lowColor;
        var ipColor       = rc.ipColor;
        var showInstrument = rc.showInstrument;

        var isIP        = (item.status === 'in_progress');
        var isCompleted = (item.status === 'completed');
        var alpha       = isCompleted ? 0.30 : 1.0;

        ctx.save();
        ctx.globalAlpha = alpha;

        // ── card background ──────────────────────────────────────────────────
        ctx.fillStyle = t.card;
        ctx.fillRect(x, y, w, h);

        // ── 1px border (4% white) ────────────────────────────────────────────
        ctx.strokeStyle = 'rgba(232,236,241,0.04)';
        ctx.lineWidth   = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

        // ── in_progress: glowing magenta left border ─────────────────────────
        if (isIP) {
            ctx.shadowColor  = theme.rgba(ipColor, 0.55 * gi);
            ctx.shadowBlur   = 12 * gi;
            ctx.fillStyle    = ipColor;
            ctx.fillRect(x, y, IP_BORDER_W, h);
            theme.resetShadow(ctx);
        }

        // ── priority diamond ─────────────────────────────────────────────────
        var diamondColor = this._priorityColor(item.priority, highColor, medColor, lowColor);
        var dx = x + IP_BORDER_W + 10;
        var dy = y + h / 2;

        ctx.save();
        if (isIP || item.priority <= 2) {
            ctx.shadowColor = theme.rgba(diamondColor, 0.6 * gi);
            ctx.shadowBlur  = 8 * gi;
        }
        ctx.fillStyle = diamondColor;
        ctx.beginPath();
        ctx.moveTo(dx,                dy - DIAMOND_H / 2);
        ctx.lineTo(dx + DIAMOND_W / 2, dy);
        ctx.lineTo(dx,                dy + DIAMOND_H / 2);
        ctx.lineTo(dx - DIAMOND_W / 2, dy);
        ctx.closePath();
        ctx.fill();
        theme.resetShadow(ctx);
        ctx.restore();

        // ── content area (right of diamond) ──────────────────────────────────
        var contentX = x + IP_BORDER_W + PAD_LEFT + DIAMOND_W;
        var contentW = w - IP_BORDER_W - PAD_LEFT - DIAMOND_W - PAD_RIGHT;

        // instrument badge width reservation
        var badgeW    = 0;
        var badgePadX = 6;
        var badgePadY = 2;
        if (showInstrument && item.instrument) {
            ctx.font = '10px "JetBrains Mono", monospace';
            var abbr   = this._instrumentAbbr(item.instrument);
            badgeW = Math.ceil(ctx.measureText(abbr).width) + badgePadX * 2;
        }

        var nameW = contentW - (badgeW > 0 ? badgeW + 8 : 0);

        // target name
        ctx.font      = 'bold 14px Oxanium, sans-serif';
        ctx.fillStyle = t.text;
        ctx.textBaseline = 'alphabetic';

        var nameStr = this._truncateText(ctx, item.target, nameW);
        ctx.fillText(nameStr, contentX, y + 22);

        // duration bar
        var barY  = y + h - 12;
        var barX  = contentX;
        var barFW = Math.min(nameW, nameW); // full bar width = nameW
        var barFillW = Math.round(barFW * (item.duration / maxDuration));

        // bar track
        ctx.fillStyle = t.muted;
        ctx.fillRect(barX, barY, barFW, BAR_H);

        // bar fill
        var barColor = diamondColor;
        if (isIP) {
            // gradient fill from ipColor to diamondColor
            var grad = ctx.createLinearGradient(barX, 0, barX + barFW, 0);
            grad.addColorStop(0, theme.rgba(ipColor, 0.9));
            grad.addColorStop(1, theme.rgba(diamondColor, 0.6));
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = theme.rgba(barColor, 0.70);
        }
        if (barFillW > 0) {
            ctx.fillRect(barX, barY, barFillW, BAR_H);
        }

        // duration label
        var durStr   = theme.fmtNum(item.duration, { decimals: 1 }) + 'h';
        ctx.font      = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = t.dim;
        ctx.textBaseline = 'middle';
        ctx.fillText(durStr, barX, y + 36);

        // priority number (small, right of duration)
        var prioStr  = 'P' + item.priority;
        var prioX    = barX + ctx.measureText(durStr).width + 8;
        ctx.fillStyle = theme.rgba(diamondColor, 0.7);
        ctx.fillText(prioStr, prioX, y + 36);

        // instrument badge
        if (showInstrument && item.instrument && badgeW > 0) {
            var abbr2  = this._instrumentAbbr(item.instrument);
            var badgeX = x + w - PAD_RIGHT - badgeW;
            var badgeY = y + (h - BADGE_H) / 2;

            ctx.fillStyle = theme.rgba(diamondColor, 0.15);
            this._fillRoundRect(ctx, badgeX, badgeY, badgeW, BADGE_H, 3);

            ctx.strokeStyle = theme.rgba(diamondColor, 0.35);
            ctx.lineWidth   = 1;
            this._strokeRoundRect(ctx, badgeX + 0.5, badgeY + 0.5, badgeW - 1, BADGE_H - 1, 3);

            ctx.font         = 'bold 10px "JetBrains Mono", monospace';
            ctx.fillStyle    = diamondColor;
            ctx.textBaseline = 'middle';
            ctx.textAlign    = 'center';
            ctx.fillText(abbr2, badgeX + badgeW / 2, badgeY + BADGE_H / 2);
            ctx.textAlign    = 'left';
        }

        // ── scan line (in_progress only) ─────────────────────────────────────
        if (isIP) {
            this._drawScanLine(ctx, x, y, w, h, ipColor, gi);
        }

        ctx.restore();
    },

    _drawScanLine: function(ctx, x, y, w, h, ipColor, gi) {
        var scanX = x + Math.round(this._scanPhase * w);

        // gradient: fade in from left edge, bright at center, fade out to right
        var fadeW = Math.min(60, w * 0.18);
        var grad  = ctx.createLinearGradient(scanX - fadeW, 0, scanX + fadeW, 0);
        grad.addColorStop(0,   'rgba(255,255,255,0)');
        grad.addColorStop(0.45, theme.rgba(ipColor, 0.20 * gi));
        grad.addColorStop(0.5,  theme.rgba(ipColor, 0.85 * gi));
        grad.addColorStop(0.55, theme.rgba(ipColor, 0.20 * gi));
        grad.addColorStop(1,   'rgba(255,255,255,0)');

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        ctx.fillStyle = grad;
        ctx.fillRect(scanX - fadeW, y, fadeW * 2, h);

        // the thin bright line itself
        ctx.strokeStyle = theme.rgba(ipColor, 0.70 * gi);
        ctx.lineWidth   = 1.5;
        ctx.shadowColor  = theme.rgba(ipColor, 0.5 * gi);
        ctx.shadowBlur   = 6 * gi;
        ctx.beginPath();
        ctx.moveTo(scanX, y + 2);
        ctx.lineTo(scanX, y + h - 2);
        ctx.stroke();
        theme.resetShadow(ctx);

        ctx.restore();
    },

    _drawEmpty: function(ctx, W, H, t) {
        ctx.clearRect(0, 0, W, H);
        ctx.font         = '13px "JetBrains Mono", monospace';
        ctx.fillStyle    = t.dim;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NO OBSERVATIONS IN QUEUE', W / 2, H / 2);
        ctx.textAlign    = 'left';
    },

    // ── animation ─────────────────────────────────────────────────────────────

    _startAnimation: function() {
        if (this._animTimer !== null) return;
        var self      = this;
        var last      = Date.now();
        this._animTimer = setInterval(function() {
            var now   = Date.now();
            var delta = now - last;
            last      = now;
            self._scanPhase = (self._scanPhase + delta / SCAN_PERIOD) % 1;

            if (self._items && self._renderConfig) {
                var setup = theme.setupCanvas(self.el);
                self._drawAllCards(setup.ctx, setup.w, setup.h);
            }
        }, 30);
    },

    _stopAnimation: function() {
        if (this._animTimer !== null) {
            clearInterval(this._animTimer);
            this._animTimer = null;
        }
        this._scanPhase = 0;
    },

    // ── tooltip & hover ───────────────────────────────────────────────────────

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        var hit = this._hitTest(mx, my);
        if (hit) {
            var item    = hit.item;
            var statStr = item.status.replace(/_/g, ' ').toUpperCase();
            var html    = '<strong>' + this._esc(item.target) + '</strong><br>' +
                          'Priority: P' + item.priority + ' &nbsp; ' +
                          'Duration: ' + theme.fmtNum(item.duration, { decimals: 1 }) + 'h<br>' +
                          (item.instrument ? 'Instrument: ' + this._esc(item.instrument) + '<br>' : '') +
                          'Status: ' + statStr;
            theme.showTooltip(this._tip, e, this._canvas, html);
            this._canvas.style.cursor = 'default';
        } else {
            theme.hideTooltip(this._tip);
            this._canvas.style.cursor = 'default';
        }
    },

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return r;
            }
        }
        return null;
    },

    // ── helpers ───────────────────────────────────────────────────────────────

    _priorityColor: function(priority, highColor, medColor, lowColor) {
        if (priority <= 2) return highColor;
        if (priority === 3) return medColor;
        return lowColor;
    },

    _instrumentAbbr: function(instrument) {
        if (!instrument) return '';
        // common JWST instruments
        var map = {
            'nircam':    'NC',
            'nirspec':   'NS',
            'miri':      'MI',
            'fgs':       'FG',
            'niriss':    'NI'
        };
        var key = instrument.toLowerCase().replace(/[^a-z]/g, '');
        if (map[key]) return map[key];
        // fallback: first 2-3 chars uppercase
        return instrument.substring(0, 3).toUpperCase();
    },

    _truncateText: function(ctx, text, maxW) {
        if (ctx.measureText(text).width <= maxW) return text;
        var ellipsis = '...';
        var truncated = text;
        while (truncated.length > 1 && ctx.measureText(truncated + ellipsis).width > maxW) {
            truncated = truncated.substring(0, truncated.length - 1);
        }
        return truncated + ellipsis;
    },

    _fillRoundRect: function(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y,         x + r, y);
        ctx.closePath();
        ctx.fill();
    },

    _strokeRoundRect: function(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y,         x + r, y);
        ctx.closePath();
        ctx.stroke();
    },

    _esc: function(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

});


});