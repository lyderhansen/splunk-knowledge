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
    if (!val) return null;
    var s = String(val).replace(/^0x/, '#');
    if (s.charAt(0) !== '#') s = '#' + s;
    return s;
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('riot-liveops-viz');
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
        this._hitZones = [];

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self._hoveredIdx = -1;
            self.invalidateUpdateView();
        });

        theme.loadFonts();
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

        var regionField = opt('regionField', 'region');
        var latencyField = opt('latencyField', 'latency');
        var thresholdField = opt('thresholdField', 'threshold');
        var maxLatencyOpt = safeNum(opt('maxLatency', ''), 0);
        var warnThreshold = safeNum(opt('warningThreshold', '60'), 60);
        var critThreshold = safeNum(opt('criticalThreshold', '80'), 80);
        var showValues = opt('showValues', 'true') === 'true';
        var barHeightOpt = safeNum(opt('barHeight', '0'), 0);
        var barColor = hexFromSplunk(opt('barColor', '0x0AC8B9')) || '#0AC8B9';
        var glowIntensity = safeNum(opt('glowIntensity', '50'), 50) / 100;

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 350;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 350;

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
        var items = [];
        var maxVal = 0;

        for (var i = 0; i < rows.length; i++) {
            var region = ci[regionField] != null ? safeStr(rows[i][ci[regionField]]) : '';
            var latency = ci[latencyField] != null ? safeNum(rows[i][ci[latencyField]], 0) : 0;
            var thresh = ci[thresholdField] != null ? safeNum(rows[i][ci[thresholdField]], warnThreshold) : warnThreshold;
            items.push({ region: region, latency: latency, threshold: thresh });
            if (latency > maxVal) maxVal = latency;
        }

        var scaleMax = maxLatencyOpt > 0 ? maxLatencyOpt : Math.max(maxVal * 1.2, 10);
        var pad = Math.max(12, w * 0.03);
        var labelWidth = Math.max(40, w * 0.12);

        // Measure label widths dynamically
        var labelFontSize = Math.max(10, h * 0.035);
        ctx.font = '600 ' + labelFontSize + 'px ' + theme.FONTS.ui;
        var measuredLabelW = 0;
        for (var li = 0; li < items.length; li++) {
            var lm = ctx.measureText(items[li].region);
            if (lm.width > measuredLabelW) measuredLabelW = lm.width;
        }
        labelWidth = Math.max(labelWidth, measuredLabelW + 8);

        var barAreaX = pad + labelWidth + 8;
        var barAreaW = w - barAreaX - pad - (showValues ? 50 : 8);
        var totalBarH = h - pad * 2;
        var gap = Math.max(4, totalBarH * 0.03);
        var barH = barHeightOpt > 0 ? barHeightOpt
                 : Math.max(12, (totalBarH - gap * (items.length - 1)) / items.length);
        var totalUsedH = items.length * barH + (items.length - 1) * gap;
        var startY = pad + (totalBarH - totalUsedH) / 2;

        this._hitZones = [];

        for (var bi = 0; bi < items.length; bi++) {
            var item = items[bi];
            var by = startY + bi * (barH + gap);
            var barW = Math.max(2, (item.latency / scaleMax) * barAreaW);
            var ratio = item.latency / scaleMax;

            // Determine bar color based on thresholds
            var fillColor;
            if (item.latency >= critThreshold) {
                fillColor = t.danger;
            } else if (item.latency >= warnThreshold) {
                var warnRatio = (item.latency - warnThreshold) / (critThreshold - warnThreshold);
                fillColor = theme.lerpColor('#C89B3C', '#E84057', warnRatio);
            } else {
                fillColor = barColor;
            }

            // Bar track
            theme.roundRect(ctx, barAreaX, by, barAreaW, barH, 3);
            ctx.fillStyle = theme.withAlpha(t.edge, 0.3);
            ctx.fill();

            // Bar fill with gradient
            ctx.save();
            theme.roundRect(ctx, barAreaX, by, barW, barH, 3);
            ctx.clip();
            var barGrad = ctx.createLinearGradient(barAreaX, by, barAreaX + barW, by);
            barGrad.addColorStop(0, theme.withAlpha(fillColor, 0.6));
            barGrad.addColorStop(1, fillColor);
            ctx.fillStyle = barGrad;
            ctx.fillRect(barAreaX, by, barW, barH);

            // Glow effect on bars exceeding threshold
            if (item.latency >= warnThreshold && glowIntensity > 0) {
                ctx.shadowColor = fillColor;
                ctx.shadowBlur = 8 * glowIntensity;
                ctx.fillStyle = theme.withAlpha(fillColor, 0.3);
                ctx.fillRect(barAreaX, by, barW, barH);
                ctx.shadowBlur = 0;
            }
            ctx.restore();

            // Hover highlight
            if (this._hoveredIdx === bi) {
                theme.roundRect(ctx, barAreaX, by, barW, barH, 3);
                ctx.fillStyle = theme.withAlpha('#FFFFFF', 0.08);
                ctx.fill();
            }

            // Angular edge accent on bar end
            if (barW > 6) {
                ctx.strokeStyle = theme.withAlpha(fillColor, 0.9);
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                var edgeX = barAreaX + barW;
                ctx.moveTo(edgeX, by + 2);
                ctx.lineTo(edgeX, by + barH - 2);
                ctx.stroke();
            }

            // Region label
            ctx.globalAlpha = 1;
            ctx.font = '600 ' + labelFontSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = this._hoveredIdx === bi ? t.text : t.textDim;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.region, barAreaX - 8, by + barH / 2);

            // Value label at bar end
            if (showValues) {
                var valFontSize = Math.max(9, h * 0.03);
                ctx.font = '600 ' + valFontSize + 'px ' + theme.FONTS.ui;
                ctx.fillStyle = item.latency >= warnThreshold ? fillColor : t.textDim;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(Math.round(item.latency) + ' ms', barAreaX + barW + 8, by + barH / 2);
            }

            this._hitZones.push({
                x: barAreaX, y: by, w: barAreaW, h: barH,
                region: item.region, latency: item.latency
            });
        }

        // Threshold line (dashed vertical)
        var threshX = barAreaX + (warnThreshold / scaleMax) * barAreaW;
        if (threshX > barAreaX && threshX < barAreaX + barAreaW) {
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = theme.withAlpha('#C89B3C', 0.5);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(threshX, startY - 4);
            ctx.lineTo(threshX, startY + totalUsedH + 4);
            ctx.stroke();
            ctx.setLineDash([]);

            // Threshold label
            var threshLabelSize = Math.max(8, h * 0.025);
            ctx.font = '400 ' + threshLabelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = '#C89B3C';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(warnThreshold + 'ms SLA', threshX, startY - 6);
            ctx.restore();
        }
    },

    _onMouseMove: function(e) {
        var mx = e.offsetX;
        var my = e.offsetY;
        var hit = -1;
        for (var i = 0; i < this._hitZones.length; i++) {
            var z = this._hitZones[i];
            if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
                hit = i;
                break;
            }
        }
        if (hit !== this._hoveredIdx) {
            this._hoveredIdx = hit;
            this.invalidateUpdateView();
        }
        if (hit >= 0) {
            var zone = this._hitZones[hit];
            this._tooltip.innerHTML = '<strong>' + zone.region + '</strong>: ' + Math.round(zone.latency) + ' ms';
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = (mx + 12) + 'px';
            this._tooltip.style.top = (my - 20) + 'px';
        } else {
            this._tooltip.style.display = 'none';
        }
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
