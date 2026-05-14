define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], function(SplunkVisualizationBase, SplunkVisualizationUtils) {

// ── Inlined theme.js ──
var theme = (function() {
/*
 * Hospital NPS Gauge — design tokens.
 * ES5 only — no const/let/arrow/template-literals.
 */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function withAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    var rr = Math.round(ar + (br - ar) * t);
    var gg = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + bl).toString(16).slice(1);
}

var DARK = {
    name: 'dark',
    bg: '#1A1D2E',
    panel: '#232740',
    panelHi: '#2C3054',
    edge: '#363B5C',
    edgeStrong: '#4A5080',
    grid: 'rgba(255,255,255,0.06)',
    text: '#F0F0F4',
    textDim: '#9DA3C0',
    textFaint: '#5C6290',
    s1: '#0077B6',
    s2: '#00B4D8',
    s3: '#48CAE4',
    s4: '#90E0EF',
    s5: '#CAF0F8',
    accent: '#0077B6',
    success: '#2DC653',
    warn: '#F4A261',
    danger: '#E63946',
    invert: '#0B0E1A'
};

var LIGHT = {
    name: 'light',
    bg: '#F8F7F4',
    panel: '#FFFFFF',
    panelHi: '#F0EDE8',
    edge: '#E0DDD6',
    edgeStrong: '#C8C4BC',
    grid: 'rgba(0,0,0,0.06)',
    text: '#1A1D2E',
    textDim: '#6B6E80',
    textFaint: '#A0A3B0',
    s1: '#0077B6',
    s2: '#0096C7',
    s3: '#00B4D8',
    s4: '#48CAE4',
    s5: '#90E0EF',
    accent: '#0077B6',
    success: '#2D8A4E',
    warn: '#D4842A',
    danger: '#C1292E',
    invert: '#F0F0F4'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '"SF Pro Display", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    ui: '"SF Pro Text", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
};

function severityColor(t, sev) {
    if (sev === 'critical' || sev === 'crit' || sev === 'error') return t.danger;
    if (sev === 'warning' || sev === 'warn') return t.warn;
    if (sev === 'ok' || sev === 'good' || sev === 'success') return t.success;
    return t.textDim;
}

function fmtNum(v, opts) {
    if (v == null || isNaN(v)) return '—';
    var abs = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
    if (abs < 1 && abs > 0) return sign + abs.toFixed(2);
    return sign + Math.round(abs).toString();
}

function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function drawPanel(ctx, t, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 6);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawHGrid(ctx, t, x, y, w, h, divisions) {
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 0.5;
    for (var i = 1; i < divisions; i++) {
        var gy = y + (h / divisions) * i;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
    }
}

function parseColors(raw, fallback) {
    if (!raw || typeof raw !== 'string') return fallback;
    return raw.split(',').map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
}

function parseInts(raw) {
    if (!raw || typeof raw !== 'string') return [];
    return raw.split(',').map(function(s) { return parseInt(s.trim(), 10); }).filter(function(n) { return !isNaN(n); });
}


    return { getTheme: getTheme,     withAlpha: withAlpha,     lerpColor: lerpColor,     severityColor: severityColor,     fmtNum: fmtNum,     roundRect: roundRect,     drawPanel: drawPanel,     drawHGrid: drawHGrid,     parseColors: parseColors,     parseInts: parseInts,     FONTS: FONTS };
})();

// ── Viz source ──



function safeStr(val) {
    return (val != null && val !== '') ? String(val) : '';
}

function safeNum(val, fallback) {
    if (val == null || val === '') return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}

function detectTheme() {
    try {
        if (typeof SplunkVisualizationUtils !== 'undefined' &&
            SplunkVisualizationUtils.getCurrentTheme) {
            var st = SplunkVisualizationUtils.getCurrentTheme();
            if (st === 'light' || st === 'dark') return st;
        }
    } catch (e) {}
    var body = document.body;
    if (body) {
        var dt = body.getAttribute('data-theme');
        if (dt === 'light' || dt === 'dark') return dt;
        if (body.classList.contains('dark')) return 'dark';
        if (body.classList.contains('light')) return 'light';
    }
    try {
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            return (parseInt(m[0])+parseInt(m[1])+parseInt(m[2]))/3 < 128
                   ? 'dark' : 'light';
        }
    } catch (e) {}
    return 'dark';
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function parseHexColor(raw) {
    if (!raw || typeof raw !== 'string') return null;
    var s = raw.replace(/^0x/, '#');
    if (s.charAt(0) !== '#') s = '#' + s;
    if (s.length === 4) {
        s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    }
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
    return null;
}

function fitText(ctx, text, maxWidth, maxFontSize, fontFamily) {
    var size = maxFontSize;
    ctx.font = size + 'px ' + fontFamily;
    while (ctx.measureText(text).width > maxWidth && size > 8) {
        size--;
        ctx.font = size + 'px ' + fontFamily;
    }
    return size;
}

return SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('hospital-nps-gauge-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._animTimer = null;
        this._animProgress = 1;
        this._pulseTimer = null;
        this._pulsePhase = 0;
        this._prevScore = null;
        this._hitZones = [];

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
        });
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
            return null;
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
        if (!data) {
            if (this._lastGoodData) data = this._lastGoodData;
            else return;
        }

        var ns = this.getPropertyNamespaceInfo().propertyNamespace;
        function opt(key, fallback) {
            var v = config[ns + key];
            return (v != null && v !== '') ? v : fallback;
        }

        var scoreField = opt('scoreField', 'score');
        var labelField = opt('labelField', 'label');
        var targetField = opt('targetField', 'target');
        var maxValue = safeNum(opt('maxValue', '100'), 100);
        var showTarget = opt('showTarget', 'true') === 'true';
        var showAnimation = opt('showAnimation', 'true') === 'true';
        var accentRaw = opt('accentColor', '0x0077B6');
        var accentColor = parseHexColor(accentRaw) || '#0077B6';
        var accentIntensity = safeNum(opt('accentIntensity', '50'), 50) / 100;
        var zoneLow = safeNum(opt('zoneLow', '30'), 30);
        var zoneHigh = safeNum(opt('zoneHigh', '60'), 60);
        var detractorRaw = opt('detractorColor', '0xE63946');
        var detractorColor = parseHexColor(detractorRaw);
        var passiveRaw = opt('passiveColor', '0xF4A261');
        var passiveColor = parseHexColor(passiveRaw);
        var promoterRaw = opt('promoterColor', '0x2DC653');
        var promoterColor = parseHexColor(promoterRaw);

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var row = data.rows[data.rows.length - 1];
        var scoreIdx = data.colIdx[scoreField];
        var labelIdx = data.colIdx[labelField];
        var targetIdx = data.colIdx[targetField];

        var score = safeNum(scoreIdx != null ? row[scoreIdx] : null, 0);
        var label = safeStr(labelIdx != null ? row[labelIdx] : '');
        var target = safeNum(targetIdx != null ? row[targetIdx] : null, -1);

        score = Math.max(0, Math.min(score, maxValue));
        if (target >= 0) target = Math.max(0, Math.min(target, maxValue));

        if (this._prevScore !== score) {
            this._prevScore = score;
            this._startAnim();
        }

        var isPromoter = (score / maxValue) > zHigh;
        if (showAnimation && isPromoter && !this._pulseTimer) {
            this._startPulse();
        } else if ((!showAnimation || !isPromoter) && this._pulseTimer) {
            this._stopPulse();
        }

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 200;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 200;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        this._tooltip.style.background = t.panelHi || t.panel;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        this._hitZones = [];

        var pad = Math.max(20, Math.min(w, h) * 0.08);
        var dim = Math.min(w - pad * 2, h - pad * 2);
        var arcThickness = Math.max(12, dim * 0.09);
        var radius = (dim - arcThickness) / 2;
        var cx = w / 2;
        var cy = h / 2 + dim * 0.04;

        if (cy - radius - arcThickness / 2 < pad) {
            cy = pad + radius + arcThickness / 2;
        }

        var SWEEP = 270;
        var START_ANGLE = 135;
        var END_ANGLE = START_ANGLE + SWEEP;

        var zLow = zoneLow / maxValue;
        var zHigh = zoneHigh / maxValue;
        var zones = [
            { from: 0,     to: zLow,  color: detractorColor || t.danger,  label: 'Detractor' },
            { from: zLow,  to: zHigh, color: passiveColor || t.warn,      label: 'Passive' },
            { from: zHigh, to: 1.00,  color: promoterColor || t.success,  label: 'Promoter' }
        ];

        ctx.lineCap = 'round';

        var trackAlpha = isDark ? 0.12 : 0.08;
        ctx.beginPath();
        ctx.arc(cx, cy, radius,
            (START_ANGLE - 90) * Math.PI / 180,
            (END_ANGLE - 90) * Math.PI / 180, false);
        ctx.strokeStyle = theme.withAlpha(t.textFaint, trackAlpha);
        ctx.lineWidth = arcThickness;
        ctx.stroke();

        var animatedScore = score * easeOutCubic(this._animProgress);
        var fraction = animatedScore / maxValue;

        for (var z = 0; z < zones.length; z++) {
            var zone = zones[z];
            var zStart = zone.from;
            var zEnd = zone.to;

            var fillStart = Math.max(zStart, 0);
            var fillEnd = Math.min(zEnd, fraction);

            if (fillEnd <= fillStart) continue;

            var aStart = START_ANGLE + fillStart * SWEEP;
            var aEnd = START_ANGLE + fillEnd * SWEEP;

            var pulseGlow = 0;
            if (this._pulseTimer && isPromoter && z === zones.length - 1) {
                pulseGlow = Math.sin(this._pulsePhase) * 0.5 + 0.5;
            }

            if (pulseGlow > 0.05) {
                ctx.save();
                ctx.shadowColor = theme.withAlpha(zone.color, 0.5 * pulseGlow * accentIntensity);
                ctx.shadowBlur = arcThickness * 1.5 * pulseGlow;
                ctx.beginPath();
                ctx.arc(cx, cy, radius,
                    (aStart - 90) * Math.PI / 180,
                    (aEnd - 90) * Math.PI / 180, false);
                ctx.strokeStyle = zone.color;
                ctx.lineWidth = arcThickness;
                ctx.stroke();
                ctx.restore();
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
            }

            ctx.beginPath();
            ctx.arc(cx, cy, radius,
                (aStart - 90) * Math.PI / 180,
                (aEnd - 90) * Math.PI / 180, false);
            ctx.strokeStyle = zone.color;
            ctx.lineWidth = arcThickness;
            ctx.stroke();

            this._hitZones.push({
                cx: cx, cy: cy, radius: radius,
                startAngle: (aStart - 90) * Math.PI / 180,
                endAngle: (aEnd - 90) * Math.PI / 180,
                thickness: arcThickness,
                label: zone.label + ' (' + Math.round(zone.from * maxValue) + '-' + Math.round(zone.to * maxValue) + ')',
                value: Math.round(animatedScore)
            });
        }

        var tickAlpha = isDark ? 0.3 : 0.2;
        var tickLen = arcThickness * 0.5;
        var tickValues = [0, Math.round(zoneLow), Math.round(zoneHigh), Math.round(maxValue)];
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = theme.withAlpha(t.text, tickAlpha);
        for (var ti = 0; ti < tickValues.length; ti++) {
            var tickFrac = tickValues[ti] / maxValue;
            var tickAngle = (START_ANGLE + tickFrac * SWEEP - 90) * Math.PI / 180;
            var outerR = radius + arcThickness / 2 + 2;
            var innerR = outerR + tickLen;
            ctx.beginPath();
            ctx.moveTo(cx + outerR * Math.cos(tickAngle), cy + outerR * Math.sin(tickAngle));
            ctx.lineTo(cx + innerR * Math.cos(tickAngle), cy + innerR * Math.sin(tickAngle));
            ctx.stroke();

            var tickLabelR = innerR + 12;
            var tickLabelX = cx + tickLabelR * Math.cos(tickAngle);
            var tickLabelY = cy + tickLabelR * Math.sin(tickAngle);
            var tickFontSize = Math.max(9, dim * 0.032);
            ctx.globalAlpha = 1;
            ctx.font = tickFontSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textFaint;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(tickValues[ti]), tickLabelX, tickLabelY);
        }

        if (showTarget && target >= 0 && this._animProgress >= 1) {
            var targetFrac = target / maxValue;
            var targetAngle = (START_ANGLE + targetFrac * SWEEP - 90) * Math.PI / 180;
            var markerOuterR = radius + arcThickness / 2 + 1;
            var markerInnerR = radius - arcThickness / 2 - 1;
            var markerLen = markerOuterR - markerInnerR;

            ctx.save();
            ctx.translate(cx + radius * Math.cos(targetAngle),
                         cy + radius * Math.sin(targetAngle));
            ctx.rotate(targetAngle + Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, -markerLen / 2);
            ctx.lineTo(0, markerLen / 2);
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(cx + radius * Math.cos(targetAngle),
                   cy + radius * Math.sin(targetAngle),
                   4, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        var displayScore = String(Math.round(animatedScore));
        var maxScoreFont = Math.max(28, dim * 0.22);
        var scoreFontSize = fitText(ctx, displayScore, radius * 1.4, maxScoreFont, theme.FONTS.data);
        ctx.font = '600 ' + scoreFontSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayScore, cx, cy - scoreFontSize * 0.08);

        var npsLabelSize = Math.max(10, dim * 0.05);
        ctx.font = '500 ' + npsLabelSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textDim;
        ctx.textBaseline = 'top';
        ctx.fillText('NPS', cx, cy + scoreFontSize * 0.42);

        if (label) {
            var labelSize = Math.max(10, dim * 0.04);
            var labelY = cy + scoreFontSize * 0.42 + npsLabelSize + dim * 0.02;
            ctx.font = labelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textFaint;
            ctx.textBaseline = 'top';
            ctx.fillText(label, cx, labelY);
        }

        if (showTarget && target >= 0 && this._animProgress >= 1) {
            var targetStr = 'Target: ' + Math.round(target);
            var targetLblSize = Math.max(9, dim * 0.032);
            ctx.font = targetLblSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = theme.withAlpha(accentColor, 0.8);
            ctx.textBaseline = 'top';
            var targetLblY = cy + radius + arcThickness / 2 + dim * 0.06;
            ctx.fillText(targetStr, cx, targetLblY);
        }

        var zoneBarY = h - pad * 0.6;
        var zoneBarW = dim * 0.5;
        var zoneBarH = Math.max(3, dim * 0.01);
        var zoneBarX = cx - zoneBarW / 2;
        var zoneLabels = [zones[0].label, zones[1].label, zones[2].label];
        var zoneColors = [zones[0].color, zones[1].color, zones[2].color];
        var segW = zoneBarW / 3;

        for (var zb = 0; zb < 3; zb++) {
            var zx = zoneBarX + zb * segW;
            theme.roundRect(ctx, zx + 1, zoneBarY, segW - 2, zoneBarH, zoneBarH / 2);
            ctx.fillStyle = theme.withAlpha(zoneColors[zb], 0.6);
            ctx.fill();

            var zbLabelSize = Math.max(8, dim * 0.028);
            ctx.globalAlpha = 1;
            ctx.font = zbLabelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textFaint;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(zoneLabels[zb], zx + segW / 2, zoneBarY + zoneBarH + 4);
        }

        ctx.textAlign = 'left';
    },

    _startAnim: function() {
        if (this._animTimer) clearInterval(this._animTimer);
        this._animProgress = 0;
        var self = this;
        this._animTimer = setInterval(function() {
            self._animProgress += 0.025;
            if (self._animProgress >= 1) {
                self._animProgress = 1;
                clearInterval(self._animTimer);
                self._animTimer = null;
            }
            self.invalidateUpdateView();
        }, 16);
    },

    _startPulse: function() {
        if (this._pulseTimer) return;
        this._pulsePhase = 0;
        var self = this;
        this._pulseTimer = setInterval(function() {
            self._pulsePhase += 0.04;
            if (self._pulsePhase > Math.PI * 2) self._pulsePhase -= Math.PI * 2;
            self.invalidateUpdateView();
        }, 50);
    },

    _stopPulse: function() {
        if (this._pulseTimer) {
            clearInterval(this._pulseTimer);
            this._pulseTimer = null;
        }
        this._pulsePhase = 0;
    },

    _onMouseMove: function(e) {
        var mx = e.offsetX;
        var my = e.offsetY;
        var hit = null;

        for (var i = 0; i < this._hitZones.length; i++) {
            var zone = this._hitZones[i];
            var dx = mx - zone.cx;
            var dy = my - zone.cy;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var halfT = zone.thickness / 2;

            if (dist < zone.radius - halfT - 4 || dist > zone.radius + halfT + 4) continue;

            var angle = Math.atan2(dy, dx);
            if (angle < 0) angle += Math.PI * 2;
            var start = zone.startAngle;
            var end = zone.endAngle;
            if (start < 0) start += Math.PI * 2;
            if (end < 0) end += Math.PI * 2;

            var inArc = false;
            if (start <= end) {
                inArc = angle >= start && angle <= end;
            } else {
                inArc = angle >= start || angle <= end;
            }

            if (inArc) {
                hit = zone;
                break;
            }
        }

        if (hit) {
            this._tooltip.innerHTML =
                '<strong>' + hit.label + '</strong><br>Score: ' + hit.value;
            this._tooltip.style.display = 'block';
            var tipW = this._tooltip.offsetWidth;
            var tipH = this._tooltip.offsetHeight;
            var w = this.el.clientWidth || 300;
            var tipX = Math.min(mx + 12, w - tipW - 8);
            var tipY = Math.max(my - tipH - 8, 4);
            this._tooltip.style.left = tipX + 'px';
            this._tooltip.style.top = tipY + 'px';
        } else {
            this._tooltip.style.display = 'none';
        }
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        if (this._animTimer) { clearInterval(this._animTimer); this._animTimer = null; }
        if (this._pulseTimer) { clearInterval(this._pulseTimer); this._pulseTimer = null; }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});


});