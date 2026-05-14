// SpaceX Mission Control — Telemetry Gauge
// 270-degree aerospace instrument arc gauge
// Tone: Precision / Frontier / Audacious

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

var GAUGE_START_RAD = (135 * Math.PI) / 180; // 135 degrees in radians
var GAUGE_END_RAD   = (405 * Math.PI) / 180; // 405 degrees (= 45°) in radians
var GAUGE_SPAN_RAD  = (270 * Math.PI) / 180; // total sweep

// Arc geometry
var ARC_THICKNESS = 9;
var TICK_SMALL_LEN = 7;
var TICK_LARGE_LEN = 13;
var TICK_OFFSET    = 6; // gap between arc outer edge and tick start

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this._canvas    = null;
        this._tooltip   = null;
        this._lastData  = null;
        this._animFrame = null;
        this._displayed = 0;   // animated current value (0-1 fraction)
        this._target    = 0;
        this._animStart = null;
        this._animFrom  = 0;
        this._hovered   = false;
        this._mouseX    = 0;
        this._mouseY    = 0;
        this._lastParsed = null;
        this._lastConfig = null;

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.display = 'block';
        this._canvas.style.width  = '100%';
        this._canvas.style.height = '100%';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText = [
            'position:absolute',
            'pointer-events:none',
            'display:none',
            'background:rgba(6,9,16,0.92)',
            'border:1px solid rgba(0,136,204,0.35)',
            'color:#E2E8F0',
            'font-family:"JetBrains Mono",monospace',
            'font-size:11px',
            'line-height:1.5',
            'padding:6px 10px',
            'border-radius:2px',
            'white-space:nowrap',
            'z-index:100'
        ].join(';');
        this.el.appendChild(this._tooltip);

        var self = this;
        this._onMouseMove = function(e) { self._handleMouseMove(e); };
        this._onMouseOut  = function()  { self._handleMouseOut();   };

        this._canvas.addEventListener('mousemove', this._onMouseMove);
        this._canvas.addEventListener('mouseout',  this._onMouseOut);
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function(data) {
        return data;
    },

    updateView: function(data, config) {
        this._lastConfig = config;
        var parsed = this._parseData(data, config);
        this._lastParsed = parsed;

        var fraction = 0;
        if (parsed.hasData && parsed.range > 0) {
            fraction = Math.min(1, Math.max(0, (parsed.value - parsed.min) / parsed.range));
        }

        // Animate from current displayed to new target
        this._animFrom  = this._displayed;
        this._target    = fraction;
        this._animStart = null;

        var self = this;
        theme.loadFonts(function() {
            self._scheduleAnimate();
        });
    },

    reflow: function() {
        if (this._lastParsed) {
            this._draw(this._lastParsed, this._lastConfig, this._displayed);
        }
    },

    destroy: function() {
        if (this._canvas) {
            this._canvas.removeEventListener('mousemove', this._onMouseMove);
            this._canvas.removeEventListener('mouseout',  this._onMouseOut);
        }
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
        }
    },

    // ── Animation ─────────────────────────────────────────────────────────────

    _scheduleAnimate: function() {
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
        }
        var self = this;
        this._animFrame = requestAnimationFrame(function(ts) {
            self._stepAnimate(ts);
        });
    },

    _stepAnimate: function(ts) {
        var DURATION = 800; // ms

        if (!this._animStart) {
            this._animStart = ts;
        }
        var elapsed = ts - this._animStart;
        var t = Math.min(1, elapsed / DURATION);
        // ease-out cubic
        var ease = 1 - Math.pow(1 - t, 3);

        this._displayed = this._animFrom + (this._target - this._animFrom) * ease;
        this._draw(this._lastParsed, this._lastConfig, this._displayed);

        if (t < 1) {
            var self = this;
            this._animFrame = requestAnimationFrame(function(t2) {
                self._stepAnimate(t2);
            });
        } else {
            this._displayed = this._target;
            this._animFrame = null;
        }
    },

    // ── Data parsing ──────────────────────────────────────────────────────────

    _parseData: function(data, config) {
        var ns = theme.getNS(this);

        var valueField = theme.getOption(config, ns, 'valueField', 'value');
        var labelField = theme.getOption(config, ns, 'labelField', 'label');
        var unitField  = theme.getOption(config, ns, 'unitField',  'unit');
        var minField   = theme.getOption(config, ns, 'minField',   'min');
        var maxField   = theme.getOption(config, ns, 'maxField',   'max');
        var minStatic  = theme.parseNum(theme.getOption(config, ns, 'minValue',  '0'),    0);
        var maxStatic  = theme.parseNum(theme.getOption(config, ns, 'maxValue',  '100'),  100);
        var decimals   = theme.parseNum(theme.getOption(config, ns, 'decimals',  '-1'),  -1);

        var result = {
            hasData:  false,
            value:    0,
            label:    '',
            unit:     '',
            min:      minStatic,
            max:      maxStatic,
            range:    maxStatic - minStatic,
            decimals: decimals
        };

        if (!data || !data.rows || data.rows.length === 0) {
            return result;
        }

        var row  = data.rows[0];
        var cols = data.fields;

        function colIndex(name) {
            for (var i = 0; i < cols.length; i++) {
                if (cols[i].name === name) return i;
            }
            return -1;
        }

        var vi = colIndex(valueField);
        if (vi < 0) return result;
        var rawVal = parseFloat(row[vi]);
        if (isNaN(rawVal)) return result;

        result.hasData = true;
        result.value   = rawVal;

        var li = colIndex(labelField);
        if (li >= 0 && row[li] !== undefined && row[li] !== null) {
            result.label = String(row[li]);
        }

        var ui = colIndex(unitField);
        if (ui >= 0 && row[ui] !== undefined && row[ui] !== null) {
            result.unit = String(row[ui]);
        }

        var mni = colIndex(minField);
        if (mni >= 0 && row[mni] !== undefined && row[mni] !== null) {
            var parsedMin = parseFloat(row[mni]);
            if (!isNaN(parsedMin)) result.min = parsedMin;
        }

        var mxi = colIndex(maxField);
        if (mxi >= 0 && row[mxi] !== undefined && row[mxi] !== null) {
            var parsedMax = parseFloat(row[mxi]);
            if (!isNaN(parsedMax)) result.max = parsedMax;
        }

        result.range = result.max - result.min;
        return result;
    },

    // ── Rendering ─────────────────────────────────────────────────────────────

    _draw: function(parsed, config, fraction) {
        if (!this._canvas) return;

        var ns  = theme.getNS(this);
        var cfg = config || {};

        var themeMode    = theme.getOption(cfg, ns, 'theme',            'dark');
        var accentHex    = theme.getOption(cfg, ns, 'accentColor',      '#0088CC');
        var gi           = theme.parseNum(theme.getOption(cfg, ns, 'accentIntensity', '50'), 50) / 50;
        this._gi = gi;
        var showTicks    = theme.parseBool(theme.getOption(cfg, ns, 'showTickMarks',   'true'), true);
        var showAccLines = theme.parseBool(theme.getOption(cfg, ns, 'showAccentLines', 'true'), true);

        var t = theme.getTheme(themeMode);

        var canvas = this._canvas;
        var dpr    = window.devicePixelRatio || 1;
        var w      = canvas.offsetWidth;
        var h      = canvas.offsetHeight;
        if (w === 0 || h === 0) return;

        canvas.width  = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);

        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        // Optional subtle background accent lines at 4% opacity
        if (showAccLines) {
            theme.drawAccentLines(ctx, w, h, accentHex, 0.04 * gi);
        }

        var cx = w / 2;
        var cy = h / 2 + h * 0.04; // nudge center slightly down so label has room below

        // Gauge radius: fit into the smaller of width/height with padding
        var minDim = Math.min(w, h);
        var outerR = minDim * 0.42;
        var arcW   = Math.max(6, Math.min(ARC_THICKNESS, outerR * 0.06));
        var innerR = outerR - arcW;

        // ── Background arc (track) ────────────────────────────────────────────
        ctx.beginPath();
        ctx.arc(cx, cy, (innerR + outerR) / 2, GAUGE_START_RAD, GAUGE_END_RAD, false);
        ctx.strokeStyle = 'rgba(226,232,240,0.06)';
        ctx.lineWidth   = arcW;
        ctx.lineCap     = 'butt';
        ctx.stroke();

        // ── Filled arc (gradient mission-blue → cyan glow) ────────────────────
        if (fraction > 0) {
            var fillEnd = GAUGE_START_RAD + GAUGE_SPAN_RAD * fraction;
            var midR    = (innerR + outerR) / 2;

            var arcGrad = ctx.createLinearGradient(
                cx + midR * Math.cos(GAUGE_START_RAD),
                cy + midR * Math.sin(GAUGE_START_RAD),
                cx + midR * Math.cos(fillEnd),
                cy + midR * Math.sin(fillEnd)
            );
            arcGrad.addColorStop(0, accentHex);
            arcGrad.addColorStop(1, t.glow);

            ctx.beginPath();
            ctx.arc(cx, cy, midR, GAUGE_START_RAD, fillEnd, false);
            ctx.strokeStyle = arcGrad;
            ctx.lineWidth   = arcW;
            ctx.lineCap     = 'butt';
            ctx.stroke();

            // Soft glow halo on the filled arc
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, midR, GAUGE_START_RAD, fillEnd, false);
            ctx.strokeStyle = theme.withAlpha(t.glow, 0.25);
            ctx.lineWidth   = arcW + 6;
            ctx.lineCap     = 'butt';
            ctx.shadowColor = t.glow;
            ctx.shadowBlur  = 12 * gi;
            ctx.stroke();
            ctx.shadowBlur  = 0;
            ctx.restore();
        }

        // ── Tick marks ────────────────────────────────────────────────────────
        if (showTicks) {
            this._drawTicks(ctx, cx, cy, outerR, fraction, accentHex, t);
        }

        // ── Min / max labels ──────────────────────────────────────────────────
        if (parsed && parsed.hasData) {
            this._drawMinMax(ctx, cx, cy, outerR, arcW, parsed, t);
        }

        // ── Center value display ──────────────────────────────────────────────
        this._drawCenter(ctx, cx, cy, innerR, parsed, fraction, t);

        // ── Hover tooltip update ──────────────────────────────────────────────
        if (this._hovered && parsed) {
            this._updateTooltip(parsed, fraction, cx, cy, outerR, arcW);
        }
    },

    _drawTicks: function(ctx, cx, cy, outerR, fraction, accentHex, t) {
        var tickCount = 10; // 11 positions at 0,10,20...100%

        for (var i = 0; i <= tickCount; i++) {
            var pct  = i / tickCount;
            var ang  = GAUGE_START_RAD + GAUGE_SPAN_RAD * pct;

            var tickLen = TICK_SMALL_LEN;
            // Large ticks at 0%, 25%, 50%, 75%, 100%
            var normalized = i / tickCount; // 0..1
            if (Math.abs(normalized - 0) < 0.01 ||
                Math.abs(normalized - 0.25) < 0.01 ||
                Math.abs(normalized - 0.5) < 0.01 ||
                Math.abs(normalized - 0.75) < 0.01 ||
                Math.abs(normalized - 1.0) < 0.01) {
                tickLen = TICK_LARGE_LEN;
            }

            var sinA = Math.sin(ang);
            var cosA = Math.cos(ang);
            var startR = outerR + TICK_OFFSET;
            var endR   = outerR + TICK_OFFSET + tickLen;

            var x1 = cx + cosA * startR;
            var y1 = cy + sinA * startR;
            var x2 = cx + cosA * endR;
            var y2 = cy + sinA * endR;

            var isFilled = pct <= fraction;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);

            if (isFilled) {
                ctx.strokeStyle = tickLen === TICK_LARGE_LEN
                    ? theme.withAlpha(t.glow, 0.90)
                    : theme.withAlpha(accentHex, 0.75);
                ctx.lineWidth = tickLen === TICK_LARGE_LEN ? 1.5 : 1;
            } else {
                ctx.strokeStyle = 'rgba(226,232,240,0.18)';
                ctx.lineWidth   = tickLen === TICK_LARGE_LEN ? 1.5 : 0.75;
            }
            ctx.stroke();
        }

        // Additional 20-tick pass for finer granularity (every 5%) with thinner lines
        for (var j = 1; j < 20; j++) {
            if (j % 2 === 0) continue; // skip even — already drawn above as 10-tick grid
            var pct2 = j / 20;
            var ang2 = GAUGE_START_RAD + GAUGE_SPAN_RAD * pct2;
            var cosA2 = Math.cos(ang2);
            var sinA2 = Math.sin(ang2);
            var startR2 = outerR + TICK_OFFSET;
            var endR2   = outerR + TICK_OFFSET + TICK_SMALL_LEN * 0.6;
            var isFilled2 = pct2 <= fraction;

            ctx.beginPath();
            ctx.moveTo(cx + cosA2 * startR2, cy + sinA2 * startR2);
            ctx.lineTo(cx + cosA2 * endR2,   cy + sinA2 * endR2);
            ctx.strokeStyle = isFilled2
                ? theme.withAlpha(accentHex, 0.40)
                : 'rgba(226,232,240,0.10)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    },

    _drawMinMax: function(ctx, cx, cy, outerR, arcW, parsed, t) {
        var labelR = outerR + TICK_OFFSET + TICK_LARGE_LEN + 14;
        var fontSize = Math.max(9, Math.min(12, outerR * 0.10));
        ctx.font          = fontSize + 'px ' + theme.MONO_FONT;
        ctx.textAlign     = 'center';
        ctx.textBaseline  = 'middle';
        ctx.fillStyle     = 'rgba(226,232,240,0.35)';

        // Min label at start of arc (135°)
        var minX = cx + Math.cos(GAUGE_START_RAD) * labelR;
        var minY = cy + Math.sin(GAUGE_START_RAD) * labelR;
        ctx.fillText(String(parsed.min), minX, minY);

        // Max label at end of arc (405°/45°)
        var maxX = cx + Math.cos(GAUGE_END_RAD) * labelR;
        var maxY = cy + Math.sin(GAUGE_END_RAD) * labelR;
        ctx.fillText(String(parsed.max), maxX, maxY);
    },

    _drawCenter: function(ctx, cx, cy, innerR, parsed, fraction, t) {
        var hasData = parsed && parsed.hasData;

        // Value string
        var valStr = '—';
        if (hasData) {
            var dec = parsed.decimals;
            if (dec < 0) {
                // auto: show decimals only if non-integer
                var v = parsed.value;
                valStr = (v === Math.floor(v)) ? String(v) : v.toFixed(1);
            } else {
                valStr = parsed.value.toFixed(dec);
            }
        }

        // Fit the value text within 70% of inner radius
        var maxValW = innerR * 1.35;
        var valSize = theme.fitText(ctx, valStr, maxValW, Math.max(24, innerR * 0.55), 14, theme.MONO_FONT);
        var valFont = 'bold ' + valSize + 'px ' + theme.MONO_FONT;

        // Layout: value + unit + label stacked
        var unitSize  = Math.max(10, valSize * 0.35);
        var labelSize = Math.max(10, valSize * 0.32);
        var lineGap   = valSize * 0.18;

        var totalH = valSize + lineGap + unitSize + (parsed && parsed.label ? lineGap + labelSize : 0);
        var startY = cy - totalH / 2 + valSize / 2;

        // Value with data glow
        if (hasData) {
            theme.drawTextGlow(ctx, valStr, cx, startY, valFont, t.glow, 14 * (this._gi || 1));
        } else {
            ctx.save();
            ctx.font         = valFont;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = 'rgba(226,232,240,0.20)';
            ctx.fillText(valStr, cx, startY);
            ctx.restore();
        }

        var yOff = startY + valSize / 2 + lineGap;

        // Unit text
        if (parsed && parsed.unit) {
            ctx.save();
            ctx.font         = unitSize + 'px ' + theme.DISPLAY_FONT;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = t.textDim;
            ctx.fillText(parsed.unit, cx, yOff + unitSize / 2);
            ctx.restore();
            yOff += unitSize + lineGap;
        }

        // Label text with letter spacing
        if (parsed && parsed.label) {
            ctx.save();
            ctx.font         = '600 ' + labelSize + 'px ' + theme.DISPLAY_FONT;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = t.text;
            ctx.globalAlpha  = 0.85;
            theme.drawSpacedText(ctx, parsed.label.toUpperCase(), cx, yOff + labelSize / 2, 1.5);
            ctx.restore();
        }
    },

    // ── Hover / Tooltip ───────────────────────────────────────────────────────

    _handleMouseMove: function(e) {
        if (!this._lastParsed || !this._canvas) return;

        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        this._mouseX = mx;
        this._mouseY = my;

        var w  = this._canvas.offsetWidth;
        var h  = this._canvas.offsetHeight;
        var cx = w / 2;
        var cy = h / 2 + h * 0.04;
        var minDim = Math.min(w, h);
        var outerR = minDim * 0.42;
        var arcW   = Math.max(6, Math.min(ARC_THICKNESS, outerR * 0.06));
        var innerR = outerR - arcW;

        var dx   = mx - cx;
        var dy   = my - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);

        // Hit zone: between innerR-4 and outerR + tick zone
        var hitInner = innerR - 4;
        var hitOuter = outerR + TICK_OFFSET + TICK_LARGE_LEN + 4;

        if (dist >= hitInner && dist <= hitOuter) {
            // Check angle is within the 270-degree arc
            var ang = Math.atan2(dy, dx);
            // Normalize angle to [0, 2π)
            if (ang < 0) ang += 2 * Math.PI;
            // Gauge starts at 135° (2.356 rad), ends at 405° mod 360° = 45°
            // Normalize against start
            var startNorm = GAUGE_START_RAD;
            var angOffset = ang - startNorm;
            if (angOffset < 0) angOffset += 2 * Math.PI;

            if (angOffset <= GAUGE_SPAN_RAD) {
                this._hovered = true;
                this._updateTooltip(this._lastParsed, this._displayed, cx, cy, outerR, arcW);
                return;
            }
        }

        this._hovered = false;
        this._tooltip.style.display = 'none';
    },

    _handleMouseOut: function() {
        this._hovered = false;
        this._tooltip.style.display = 'none';
    },

    _updateTooltip: function(parsed, fraction, cx, cy, outerR, arcW) {
        if (!parsed || !parsed.hasData) {
            this._tooltip.style.display = 'none';
            return;
        }

        var pct = Math.round(fraction * 100);
        var dec = parsed.decimals;
        var valStr;
        if (dec < 0) {
            var v = parsed.value;
            valStr = (v === Math.floor(v)) ? String(v) : v.toFixed(2);
        } else {
            valStr = parsed.value.toFixed(dec);
        }

        var lines = [];
        if (parsed.label) {
            lines.push('<span style="color:rgba(226,232,240,0.55);font-size:10px">' + parsed.label.toUpperCase() + '</span>');
        }
        lines.push('<span style="color:#00B8D4;font-weight:700">' + valStr + (parsed.unit ? ' ' + parsed.unit : '') + '</span>');
        lines.push('<span style="color:rgba(226,232,240,0.45)">' + pct + '%</span>');

        this._tooltip.innerHTML = lines.join('<br>');

        var mx = this._mouseX;
        var my = this._mouseY;
        var tw = this._tooltip.offsetWidth || 90;
        var th = this._tooltip.offsetHeight || 58;
        var cw = this.el.offsetWidth;
        var ch = this.el.offsetHeight;

        var tx = mx + 14;
        var ty = my - th / 2;
        if (tx + tw > cw - 4) tx = mx - tw - 14;
        if (ty < 4) ty = 4;
        if (ty + th > ch - 4) ty = ch - th - 4;

        this._tooltip.style.left    = tx + 'px';
        this._tooltip.style.top     = ty + 'px';
        this._tooltip.style.display = 'block';
    }

});
