var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

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

function hexFromSplunk(val) {
    if (val == null || val === '') return null;
    var s = String(val);
    if (s.indexOf('0x') === 0) return '#' + s.slice(2);
    if (s.charAt(0) === '#') return s;
    var n = parseInt(s, 10);
    if (!isNaN(n) && n >= 0) {
        var hex = n.toString(16);
        while (hex.length < 6) hex = '0' + hex;
        return '#' + hex;
    }
    return null;
}

function formatTime(ts) {
    var d = new Date(ts);
    if (isNaN(d.getTime())) return safeStr(ts);
    var hh = d.getHours();
    var mm = d.getMinutes();
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('stripe-payment-ops-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;font-size:12px;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._points = [];
        this._hoverIdx = -1;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._hoverIdx = -1;
            self._tooltip.style.display = 'none';
            self.invalidateUpdateView();
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

        var timeField = opt('timeField', '_time');
        var valueField = opt('valueField', 'value');
        var thresholdVal = safeNum(opt('thresholdValue', '5'), 5);
        var thresholdLabel = opt('thresholdLabel', 'SLA Limit');
        var yLabel = opt('yLabel', 'Failure %');
        var showArea = opt('showArea', 'true') === 'true';
        var showDots = opt('showDots', 'true') === 'true';
        var lineHex = hexFromSplunk(opt('lineColor', '0x635BFF')) || '#635BFF';
        var threshHex = hexFromSplunk(opt('thresholdColor', '0xDF1B41')) || '#DF1B41';

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 600;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 250;
        if (w < 10) w = window.innerWidth || 600;
        if (h < 10) h = window.innerHeight || 250;

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

        var ci = data.colIdx;
        var rows = data.rows;
        var points = [];
        for (var i = 0; i < rows.length; i++) {
            var tv = ci[timeField] != null ? safeStr(rows[i][ci[timeField]]) : '';
            var vv = ci[valueField] != null ? safeNum(rows[i][ci[valueField]], null) : null;
            if (vv !== null) {
                points.push({ time: tv, val: vv, idx: i });
            }
        }
        if (points.length === 0) return;

        var padL = Math.max(45, w * 0.08);
        var padR = Math.max(15, w * 0.03);
        var padT = Math.max(15, h * 0.06);
        var padB = Math.max(35, h * 0.14);

        var plotW = w - padL - padR;
        var plotH = h - padT - padB;

        var minVal = points[0].val;
        var maxVal = points[0].val;
        for (i = 1; i < points.length; i++) {
            if (points[i].val < minVal) minVal = points[i].val;
            if (points[i].val > maxVal) maxVal = points[i].val;
        }
        if (thresholdVal > maxVal) maxVal = thresholdVal;
        if (thresholdVal < minVal) minVal = thresholdVal;

        var range = maxVal - minVal;
        if (range === 0) range = 1;
        var yPad = range * 0.1;
        var yMin = Math.max(0, minVal - yPad);
        var yMax = maxVal + yPad;
        var yRange = yMax - yMin;

        function xPos(idx) { return padL + (idx / Math.max(1, points.length - 1)) * plotW; }
        function yPos(val) { return padT + plotH - ((val - yMin) / yRange) * plotH; }

        var gridLines = 4;
        ctx.globalAlpha = 1;
        var axisFontSize = Math.max(9, h * 0.04);

        for (i = 0; i <= gridLines; i++) {
            var gv = yMin + (yRange / gridLines) * i;
            var gy = yPos(gv);
            ctx.beginPath();
            ctx.moveTo(padL, gy);
            ctx.lineTo(padL + plotW, gy);
            ctx.strokeStyle = t.grid;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            ctx.font = axisFontSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.textDim;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(gv.toFixed(1), padL - 6, gy);
        }

        ctx.font = axisFontSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textDim;
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(12, padT + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();

        var maxTimeLabels = Math.max(3, Math.floor(plotW / 70));
        var step = Math.max(1, Math.ceil(points.length / maxTimeLabels));
        ctx.font = axisFontSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.textDim;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (i = 0; i < points.length; i += step) {
            var lx = xPos(i);
            ctx.fillText(formatTime(points[i].time), lx, padT + plotH + 6);
        }

        if (showArea) {
            ctx.beginPath();
            ctx.moveTo(xPos(0), yPos(points[0].val));
            for (i = 1; i < points.length; i++) {
                ctx.lineTo(xPos(i), yPos(points[i].val));
            }
            ctx.lineTo(xPos(points.length - 1), padT + plotH);
            ctx.lineTo(xPos(0), padT + plotH);
            ctx.closePath();
            ctx.fillStyle = theme.withAlpha(lineHex, 0.08);
            ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(points[0].val));
        for (i = 1; i < points.length; i++) {
            ctx.lineTo(xPos(i), yPos(points[i].val));
        }
        ctx.strokeStyle = lineHex;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        if (showDots) {
            var dotR = Math.max(2.5, h * 0.012);
            for (i = 0; i < points.length; i++) {
                var px = xPos(i);
                var py = yPos(points[i].val);
                ctx.beginPath();
                ctx.arc(px, py, dotR, 0, Math.PI * 2);
                ctx.fillStyle = lineHex;
                ctx.fill();
            }
        }

        var threshY = yPos(thresholdVal);
        if (threshY >= padT && threshY <= padT + plotH) {
            ctx.beginPath();
            ctx.setLineDash([6, 4]);
            ctx.moveTo(padL, threshY);
            ctx.lineTo(padL + plotW, threshY);
            ctx.strokeStyle = threshHex;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = '500 ' + axisFontSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = threshHex;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(thresholdLabel + ' (' + thresholdVal + ')', padL + plotW, threshY - 4);
        }

        this._points = [];
        for (i = 0; i < points.length; i++) {
            this._points.push({
                x: xPos(i),
                y: yPos(points[i].val),
                time: points[i].time,
                val: points[i].val
            });
        }

        if (this._hoverIdx >= 0 && this._hoverIdx < this._points.length) {
            var hp = this._points[this._hoverIdx];

            ctx.beginPath();
            ctx.setLineDash([3, 3]);
            ctx.moveTo(hp.x, padT);
            ctx.lineTo(hp.x, padT + plotH);
            ctx.strokeStyle = t.textFaint;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(hp.x, hp.y, Math.max(4, h * 0.018), 0, Math.PI * 2);
            ctx.fillStyle = lineHex;
            ctx.fill();
            ctx.strokeStyle = t.panel;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    },

    _onMouseMove: function(e) {
        var mx = e.offsetX;
        var my = e.offsetY;

        if (this._points.length === 0) {
            this._tooltip.style.display = 'none';
            return;
        }

        var closest = -1;
        var closestDist = Infinity;
        for (var i = 0; i < this._points.length; i++) {
            var d = Math.abs(mx - this._points[i].x);
            if (d < closestDist) {
                closestDist = d;
                closest = i;
            }
        }

        if (closest >= 0 && closestDist < 30) {
            var pt = this._points[closest];
            this._tooltip.innerHTML = '<strong>' + formatTime(pt.time) + '</strong><br>' + pt.val.toFixed(1) + '%';
            this._tooltip.style.display = 'block';

            var ttW = this._tooltip.offsetWidth || 80;
            var ttX = pt.x + 12;
            var elW = this.el.clientWidth || 600;
            if (ttX + ttW > elW - 10) ttX = pt.x - ttW - 12;
            this._tooltip.style.left = ttX + 'px';
            this._tooltip.style.top = (pt.y - 30) + 'px';

            if (closest !== this._hoverIdx) {
                this._hoverIdx = closest;
                this.invalidateUpdateView();
            }
        } else {
            this._hoverIdx = -1;
            this._tooltip.style.display = 'none';
            this.invalidateUpdateView();
        }
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
