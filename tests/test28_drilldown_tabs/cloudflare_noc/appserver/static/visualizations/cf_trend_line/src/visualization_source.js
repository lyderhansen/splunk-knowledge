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

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('cloudflare_noc-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;font-size:11px;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._points = [];
        this._hoverIdx = -1;
        this._chartArea = null;

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
        var label = opt('label', '');
        var unit = opt('unit', '');
        var thresholdVal = safeNum(opt('threshold', '-1'), -1);
        var showFill = opt('showFill', 'true') === 'true';
        var showDots = opt('showDots', 'false') === 'true';
        var lineColor = opt('lineColor', '#F6821F');
        var thresholdColor = opt('thresholdColor', '#EF4444');

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 500;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 300;
        if (w < 10) w = window.innerWidth || 500;
        if (h < 10) h = window.innerHeight || 300;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        var points = [];
        for (var i = 0; i < data.rows.length; i++) {
            var row = data.rows[i];
            var tv = safeStr(row[data.colIdx[timeField]]);
            var vv = safeNum(row[data.colIdx[valueField]], null);
            if (vv !== null) {
                points.push({ time: tv, value: vv, idx: i });
            }
        }
        if (points.length === 0) return;

        var labelFontSize = Math.max(9, Math.min(12, h * 0.04));
        var padL = Math.max(50, w * 0.06);
        var padR = Math.max(16, w * 0.02);
        var padT = Math.max(16, h * 0.06);
        var padB = Math.max(30, h * 0.10);

        var chartX = padL;
        var chartY = padT;
        var chartW = w - padL - padR;
        var chartH = h - padT - padB;

        this._chartArea = { x: chartX, y: chartY, w: chartW, h: chartH };

        var minV = points[0].value, maxV = points[0].value;
        for (var j = 1; j < points.length; j++) {
            if (points[j].value < minV) minV = points[j].value;
            if (points[j].value > maxV) maxV = points[j].value;
        }
        if (thresholdVal >= 0) {
            if (thresholdVal > maxV) maxV = thresholdVal * 1.1;
            if (thresholdVal < minV) minV = thresholdVal * 0.9;
        }
        var range = maxV - minV;
        if (range === 0) range = 1;
        var vPad = range * 0.1;
        minV -= vPad;
        maxV += vPad;
        range = maxV - minV;

        var gridLines = 4;
        ctx.strokeStyle = t.grid;
        ctx.lineWidth = 0.5;
        ctx.font = labelFontSize + 'px ' + theme.FONTS.data;
        ctx.textAlign = 'right';
        ctx.fillStyle = t.textFaint;
        for (var g = 0; g <= gridLines; g++) {
            var gy = chartY + chartH - (chartH / gridLines) * g;
            ctx.beginPath();
            ctx.moveTo(chartX, gy);
            ctx.lineTo(chartX + chartW, gy);
            ctx.stroke();
            var gVal = minV + (range / gridLines) * g;
            ctx.fillText(theme.fmtNum(gVal) + (unit ? unit : ''), chartX - 6, gy + 3);
        }

        this._points = [];
        for (var k = 0; k < points.length; k++) {
            var px = chartX + (chartW / (points.length - 1 || 1)) * k;
            var py = chartY + chartH - ((points[k].value - minV) / range) * chartH;
            this._points.push({ x: px, y: py, time: points[k].time, value: points[k].value });
        }

        if (showFill && this._points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this._points[0].x, this._points[0].y);
            for (var f = 1; f < this._points.length; f++) {
                ctx.lineTo(this._points[f].x, this._points[f].y);
            }
            ctx.lineTo(this._points[this._points.length - 1].x, chartY + chartH);
            ctx.lineTo(this._points[0].x, chartY + chartH);
            ctx.closePath();
            var grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
            grad.addColorStop(0, theme.withAlpha(lineColor, 0.25));
            grad.addColorStop(1, theme.withAlpha(lineColor, 0.02));
            ctx.fillStyle = grad;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(this._points[0].x, this._points[0].y);
        for (var l = 1; l < this._points.length; l++) {
            ctx.lineTo(this._points[l].x, this._points[l].y);
        }
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        if (showDots) {
            for (var d = 0; d < this._points.length; d++) {
                ctx.beginPath();
                ctx.arc(this._points[d].x, this._points[d].y, 3, 0, Math.PI * 2);
                ctx.fillStyle = lineColor;
                ctx.fill();
            }
        }

        if (thresholdVal >= 0) {
            var tY = chartY + chartH - ((thresholdVal - minV) / range) * chartH;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(chartX, tY);
            ctx.lineTo(chartX + chartW, tY);
            ctx.strokeStyle = thresholdColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = '600 ' + (labelFontSize - 1) + 'px ' + theme.FONTS.ui;
            ctx.textAlign = 'left';
            ctx.fillStyle = thresholdColor;
            ctx.fillText('THRESHOLD ' + theme.fmtNum(thresholdVal), chartX + 4, tY - 5);
        }

        if (this._hoverIdx >= 0 && this._hoverIdx < this._points.length) {
            var hp = this._points[this._hoverIdx];
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = theme.withAlpha(t.text, 0.3);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hp.x, chartY);
            ctx.lineTo(hp.x, chartY + chartH);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(hp.x, hp.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = lineColor;
            ctx.fill();
            ctx.strokeStyle = t.text;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        var axisLabelSize = Math.max(8, Math.min(10, h * 0.035));
        ctx.font = axisLabelSize + 'px ' + theme.FONTS.data;
        ctx.textAlign = 'center';
        ctx.fillStyle = t.textFaint;
        var step = Math.max(1, Math.floor(points.length / 6));
        for (var a = 0; a < this._points.length; a += step) {
            var timeStr = this._points[a].time;
            if (timeStr.length > 5) {
                var parts = timeStr.split(/[T ]/);
                timeStr = parts.length > 1 ? parts[1].substring(0, 5) : timeStr.substring(0, 5);
            }
            ctx.fillText(timeStr, this._points[a].x, chartY + chartH + padB * 0.6);
        }

        if (label) {
            ctx.save();
            ctx.font = '500 ' + labelFontSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textDim;
            ctx.textAlign = 'center';
            ctx.translate(14, chartY + chartH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(label, 0, 0);
            ctx.restore();
        }

        ctx.globalAlpha = 1;
    },

    _onMouseMove: function(e) {
        var mx = e.offsetX;
        if (!this._chartArea || this._points.length === 0) return;
        var ca = this._chartArea;
        if (mx < ca.x || mx > ca.x + ca.w) {
            if (this._hoverIdx !== -1) {
                this._hoverIdx = -1;
                this._tooltip.style.display = 'none';
                this.invalidateUpdateView();
            }
            return;
        }
        var closest = 0;
        var minDist = Math.abs(mx - this._points[0].x);
        for (var i = 1; i < this._points.length; i++) {
            var dist = Math.abs(mx - this._points[i].x);
            if (dist < minDist) { minDist = dist; closest = i; }
        }
        if (closest !== this._hoverIdx) {
            this._hoverIdx = closest;
            this.invalidateUpdateView();
        }
        var p = this._points[closest];
        this._tooltip.innerHTML = '<b>' + p.time + '</b><br/>' + theme.fmtNum(p.value);
        this._tooltip.style.display = 'block';
        var tipX = Math.min(p.x + 12, this.el.clientWidth - 100);
        this._tooltip.style.left = tipX + 'px';
        this._tooltip.style.top = (p.y - 40) + 'px';
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
