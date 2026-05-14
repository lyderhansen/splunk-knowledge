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

function statusToKey(s) {
    s = s.toLowerCase();
    if (s === 'green' || s === 'healthy' || s === 'ok' || s === 'up') return 'healthy';
    if (s === 'amber' || s === 'yellow' || s === 'degraded' || s === 'warning' || s === 'warn') return 'degraded';
    if (s === 'red' || s === 'down' || s === 'critical' || s === 'error') return 'down';
    return 'healthy';
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('cloudflare_noc-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;cursor:pointer;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;font-size:12px;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._cells = [];
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
        this._canvas.addEventListener('click', function(e) {
            self._onClick(e);
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

        var locationField = opt('locationField', 'location');
        var statusField = opt('statusField', 'status');
        var latencyField = opt('latencyField', 'latency');
        this._locationField = locationField;
        this._statusField = statusField;
        var cols = parseInt(opt('columns', '5'), 10) || 5;
        var showLatency = opt('showLatency', 'true') === 'true';
        var showLabels = opt('showLabels', 'true') === 'true';
        var healthyColor = opt('healthyColor', '#34D399');
        var degradedColor = opt('degradedColor', '#FBBF24');
        var downColor = opt('downColor', '#EF4444');

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 400;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 300;
        if (w < 10) w = window.innerWidth || 400;
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
        for (var i = 0; i < data.rows.length; i++) {
            var row = data.rows[i];
            items.push({
                location: safeStr(row[data.colIdx[locationField]]),
                status: statusToKey(safeStr(row[data.colIdx[statusField]])),
                latency: safeNum(row[data.colIdx[latencyField]], null)
            });
        }

        var colorMap = { healthy: healthyColor, degraded: degradedColor, down: downColor };

        var pad = Math.max(6, w * 0.015);
        var rows = Math.ceil(items.length / cols);
        var cellW = (w - pad * (cols + 1)) / cols;
        var cellH = (h - pad * (rows + 1)) / rows;

        this._cells = [];
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var idx = r * cols + c;
                if (idx >= items.length) break;
                var cx = pad + c * (cellW + pad);
                var cy = pad + r * (cellH + pad);
                this._cells.push({ x: cx, y: cy, w: cellW, h: cellH, idx: idx });

                var item = items[idx];
                var fill = colorMap[item.status] || t.textDim;
                var isHover = this._hoverIdx === idx;

                theme.roundRect(ctx, cx, cy, cellW, cellH, 4);
                ctx.fillStyle = theme.withAlpha(fill, isHover ? 0.30 : 0.15);
                ctx.fill();

                ctx.strokeStyle = isHover ? fill : theme.withAlpha(fill, 0.4);
                ctx.lineWidth = isHover ? 2 : 1;
                ctx.stroke();

                var dotR = Math.max(3, Math.min(5, cellH * 0.06));
                ctx.beginPath();
                ctx.arc(cx + cellW - 8, cy + 8, dotR, 0, Math.PI * 2);
                ctx.fillStyle = fill;
                ctx.fill();

                ctx.globalAlpha = 1;
                ctx.textAlign = 'center';

                if (showLabels) {
                    var labelSize = Math.max(8, Math.min(12, cellH * 0.18));
                    ctx.font = '600 ' + labelSize + 'px ' + theme.FONTS.ui;
                    ctx.fillStyle = t.text;
                    var locText = item.location;
                    var maxLabelW = cellW - 10;
                    while (ctx.measureText(locText).width > maxLabelW && locText.length > 3) {
                        locText = locText.slice(0, -1);
                    }
                    if (locText !== item.location) locText += '…';
                    var textY = showLatency ? cy + cellH * 0.42 : cy + cellH * 0.55;
                    ctx.fillText(locText, cx + cellW / 2, textY);
                }

                if (showLatency && item.latency !== null) {
                    var latSize = Math.max(7, Math.min(10, cellH * 0.14));
                    ctx.font = '400 ' + latSize + 'px ' + theme.FONTS.data;
                    ctx.fillStyle = t.textDim;
                    ctx.fillText(item.latency.toFixed(0) + 'ms', cx + cellW / 2, cy + cellH * 0.68);
                }
            }
        }

        ctx.globalAlpha = 1;
    },

    _onMouseMove: function(e) {
        var mx = e.offsetX;
        var my = e.offsetY;
        var found = -1;
        for (var i = 0; i < this._cells.length; i++) {
            var c = this._cells[i];
            if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
                found = c.idx;
                break;
            }
        }
        if (found !== this._hoverIdx) {
            this._hoverIdx = found;
            this.invalidateUpdateView();
        }
        if (found >= 0 && this._lastGoodData) {
            var row = this._lastGoodData.rows[found];
            var locF = this._locationField || 'location';
            var statF = this._statusField || 'status';
            var loc = safeStr(row[this._lastGoodData.colIdx[locF]]);
            var stat = safeStr(row[this._lastGoodData.colIdx[statF]]);
            this._tooltip.innerHTML = '<b>' + loc + '</b> — ' + stat;
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = Math.min(mx + 12, this.el.clientWidth - 120) + 'px';
            this._tooltip.style.top = (my - 30) + 'px';
        } else {
            this._tooltip.style.display = 'none';
        }
    },

    _onClick: function(e) {
        var mx = e.offsetX;
        var my = e.offsetY;
        var locF = this._locationField || 'location';
        for (var i = 0; i < this._cells.length; i++) {
            var c = this._cells[i];
            if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
                var row = this._lastGoodData.rows[c.idx];
                var loc = safeStr(row[this._lastGoodData.colIdx[locF]]);
                try {
                    this.drilldown({
                        action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                        data: { 'click.value': loc, 'click.name': locF }
                    }, e);
                } catch (ex) {}
                break;
            }
        }
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
