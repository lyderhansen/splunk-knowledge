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
        this._bars = [];
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

        var categoryField = opt('categoryField', 'category');
        var valueField = opt('valueField', 'value');
        var maxBars = parseInt(opt('maxBars', '8'), 10) || 8;
        var showValues = opt('showValues', 'true') === 'true';
        var unit = opt('unit', '%');
        var maxValue = safeNum(opt('maxValue', '100'), 0);
        var barColor = opt('barColor', '#F6821F');
        var showGradient = opt('showGradient', 'true') === 'true';

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

        var items = [];
        var limit = Math.min(data.rows.length, maxBars);
        for (var i = 0; i < limit; i++) {
            var row = data.rows[i];
            items.push({
                category: safeStr(row[data.colIdx[categoryField]]),
                value: safeNum(row[data.colIdx[valueField]], 0)
            });
        }

        if (maxValue <= 0) {
            maxValue = 0;
            for (var m = 0; m < items.length; m++) {
                if (items[m].value > maxValue) maxValue = items[m].value;
            }
            if (maxValue <= 0) maxValue = 100;
        }

        var pad = Math.max(10, w * 0.03);
        var labelW = Math.max(60, w * 0.18);
        var barAreaX = pad + labelW;
        var barAreaW = w - barAreaX - pad - (showValues ? 60 : 10);
        var rowH = Math.min(40, (h - pad * 2) / items.length);
        var barH = Math.max(12, rowH * 0.55);
        var gap = rowH - barH;
        var startY = pad + (h - pad * 2 - items.length * rowH) / 2;

        var labelSize = Math.max(9, Math.min(13, rowH * 0.4));
        var valueSize = Math.max(9, Math.min(12, rowH * 0.38));

        this._bars = [];

        for (var b = 0; b < items.length; b++) {
            var item = items[b];
            var by = startY + b * rowH + gap / 2;
            var ratio = Math.min(1, item.value / maxValue);
            var bw = barAreaW * ratio;
            var isHover = this._hoverIdx === b;

            this._bars.push({ x: barAreaX, y: by, w: bw, h: barH, maxW: barAreaW, idx: b });

            ctx.globalAlpha = 1;
            ctx.font = labelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = isHover ? t.text : t.textDim;
            ctx.textAlign = 'right';
            var catText = item.category;
            var maxLabelW = labelW - 8;
            while (ctx.measureText(catText).width > maxLabelW && catText.length > 3) {
                catText = catText.slice(0, -1);
            }
            if (catText !== item.category) catText += '…';
            ctx.fillText(catText, barAreaX - 8, by + barH * 0.72);

            theme.roundRect(ctx, barAreaX, by, barAreaW, barH, 3);
            ctx.fillStyle = theme.withAlpha(t.edge, 0.15);
            ctx.fill();

            if (bw > 2) {
                theme.roundRect(ctx, barAreaX, by, bw, barH, 3);
                if (showGradient) {
                    var grad = ctx.createLinearGradient(barAreaX, by, barAreaX + bw, by);
                    grad.addColorStop(0, theme.withAlpha(barColor, isDark ? 0.7 : 0.8));
                    grad.addColorStop(1, barColor);
                    ctx.fillStyle = grad;
                } else {
                    ctx.fillStyle = isHover ? barColor : theme.withAlpha(barColor, 0.85);
                }
                ctx.fill();

                if (isHover && isDark) {
                    ctx.shadowColor = theme.withAlpha(barColor, 0.4);
                    ctx.shadowBlur = 8;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                }
            }

            if (showValues) {
                ctx.font = '600 ' + valueSize + 'px ' + theme.FONTS.data;
                ctx.fillStyle = isHover ? t.text : t.textDim;
                ctx.textAlign = 'left';
                var valText = item.value.toFixed(1) + unit;
                ctx.fillText(valText, barAreaX + barAreaW + 8, by + barH * 0.72);
            }
        }

        ctx.globalAlpha = 1;
    },

    _onMouseMove: function(e) {
        var my = e.offsetY;
        var found = -1;
        for (var i = 0; i < this._bars.length; i++) {
            var b = this._bars[i];
            if (my >= b.y - 2 && my <= b.y + b.h + 2) {
                found = b.idx;
                break;
            }
        }
        if (found !== this._hoverIdx) {
            this._hoverIdx = found;
            this.invalidateUpdateView();
        }
        this._tooltip.style.display = 'none';
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
