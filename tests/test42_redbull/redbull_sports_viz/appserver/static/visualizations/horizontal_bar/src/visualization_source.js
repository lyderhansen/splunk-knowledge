// @viz-type: bars
var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

var escapeHtml = SplunkVisualizationUtils.escapeHtml;

function safeStr(val) {
    return (val != null && val !== '') ? String(val) : '';
}

function safeNum(val, fallback) {
    if (val == null || val === '') return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}

function hexFromSplunk(val, fallback) {
    if (val == null || val === '') return fallback;
    var s = String(val).trim();
    if (s.charAt(0) === '#') return s;
    if (s.indexOf('0x') === 0) return '#' + s.slice(2);
    var n = parseInt(s, 10);
    if (!isNaN(n) && n >= 0) return '#' + ('000000' + n.toString(16)).slice(-6);
    return fallback;
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
    return 'dark';
}

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function prefersReducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
}

function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

function getSpeedMult(config, ns) {
    var speed = (config && config[ns + '.animationSpeed']) || 'normal';
    if (speed === 'slow') { return 1.5; }
    if (speed === 'fast') { return 0.6; }
    return 1.0;
}

function drawEmptyState(ctx, w, h, t, accent) {
    ctx.save();
    var cx = w / 2;
    var cy = h * 0.38;
    var r = Math.min(w, h) * 0.1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = theme.withAlpha(accent, 0.20);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    var fontSize = Math.max(11, Math.min(16, h * 0.07));
    ctx.font = fontSize + 'px ' + theme.FONTS.ui;
    ctx.fillStyle = theme.withAlpha(t.textFaint, 0.7);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('No data available', cx, cy + r + 10);
    ctx.restore();
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('redbull-sports-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:5px 10px;' +
            'border-radius:2px;pointer-events:none;white-space:nowrap;z-index:100;font-size:12px;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._entranceDone = false;
        this._animating = false;
        this._entranceProgress = 1;
        this._hoverIdx = -1;
        this._hitRegions = [];
        this._showHoverEffect = true;
        this._clickField = 'label';

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self._hoverIdx = -1;
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
        var result = { colIdx: colIdx, rows: data.rows, fields: data.fields };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        if (!data) {
            if (this._lastGoodData) data = this._lastGoodData;
            else return;
        }

        var ns = (function(viz) {
            try {
                var i = viz.getPropertyNamespaceInfo();
                return i && i.propertyNamespace ? i.propertyNamespace : '';
            } catch(e) { return ''; }
        })(this);

        function opt(key, fallback) { return getOption(config, ns, key, fallback); }

        var labelField = opt('labelField', 'label');
        var valueField = opt('valueField', 'value');
        var unitSuffix = opt('unit', '');
        var maxBars = parseInt(opt('maxBars', '10'), 10);
        if (isNaN(maxBars) || maxBars < 1) maxBars = 10;
        var showValues = opt('showValues', 'true') === 'true';
        var chartTitle = opt('title', '');

        this._clickField = opt('drilldownField', 'label');
        this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var gi = parseFloat(opt('accentIntensity', '50')) / 100;
        gi = gi < 0 ? 0 : gi;
        var glowScale = isDark ? 1.0 : 0.4;

        var accent = hexFromSplunk(opt('accentColor', ''), t.accent);
        var s1 = hexFromSplunk(opt('series1Color', ''), t.s1);
        var s2 = hexFromSplunk(opt('series2Color', ''), t.s2);
        var s3 = hexFromSplunk(opt('series3Color', ''), t.s3);
        var s4 = hexFromSplunk(opt('series4Color', ''), t.s4);
        var s5 = hexFromSplunk(opt('series5Color', ''), t.s5);
        var seriesColorsOverflow = opt('seriesColorsOverflow', '');
        var showGlow = opt('showGlow', 'true') === 'true';

        var seriesPalette = [s2, s3, s4, s1, s5]; // gold for #1, silver for #2, then red/blue/orange
        // Actually: index 0 = top bar (gold), index 1 = second (silver/red), rest = default

        // Animation
        if (prefersReducedMotion()) {
            this._entranceDone = true;
            this._entranceProgress = 1;
        }
        var showEntrance = opt('showEntrance', 'true') === 'true';
        if (!showEntrance) {
            this._entranceDone = true;
            this._entranceProgress = 1;
        }
        if (showEntrance && !this._entranceDone) {
            var _sm=(function(s){return s==="slow"?1.5:s==="fast"?0.6:1.0;})(opt("animationSpeed","normal"));this._startEntrance(_sm);
        }

        var w = this.el.clientWidth || this.el.offsetWidth || 400;
        var h = this.el.clientHeight || this.el.offsetHeight || 300;
        if (w < 10) w = 400;
        if (h < 10) h = 300;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        this._tooltip.style.background = t.panel;
        this._tooltip.style.color = t.text;
        this._tooltip.style.border = '1px solid ' + t.edge;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        // Empty state
        if (!data.rows || data.rows.length === 0) {
            drawEmptyState(ctx, w, h, t, accent);
            return;
        }

        var colIdx = data.colIdx;
        var rows = data.rows.slice(0, maxBars);

        // Find max value for scaling
        var maxVal = 0;
        for (var i = 0; i < rows.length; i++) {
            var v = safeNum(rows[i][colIdx[valueField]], 0);
            if (v > maxVal) maxVal = v;
        }
        if (maxVal === 0) maxVal = 1;

        // Layout
        var pad = theme.getSpacing(w);
        var titleH = chartTitle ? Math.max(16, Math.round(h * 0.08)) : 0;
        var topPad = pad + titleH;
        var labelColW = Math.min(180, Math.round(w * 0.28));
        var valueColW = showValues ? Math.min(60, Math.round(w * 0.1)) : 0;
        var barAreaX = labelColW + pad;
        var barAreaW = w - barAreaX - valueColW - pad;
        var availH = h - topPad - pad;
        var rowH = Math.max(14, Math.floor(availH / rows.length));
        var barH = Math.max(6, Math.round(rowH * 0.55));
        var labelSize = Math.max(10, Math.min(14, rowH * 0.5));
        var valueSize = Math.max(9, Math.min(12, rowH * 0.45));

        // Title
        if (chartTitle) {
            ctx.save();
            ctx.font = 'bold ' + Math.max(12, Math.round(titleH * 0.7)) + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = isDark ? t.textDim : t.textDim;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(chartTitle.toUpperCase(), pad, pad + titleH / 2);
            ctx.restore();
        }

        this._hitRegions = [];

        for (var ri = 0; ri < rows.length; ri++) {
            var row = rows[ri];
            var labelVal = safeStr(row[colIdx[labelField]]);
            var numVal = safeNum(row[colIdx[valueField]], 0);

            var ry = topPad + ri * rowH + (rowH - barH) / 2;
            var barFillW = barAreaW * (numVal / maxVal) * easeOutQuart(this._entranceProgress);

            // Color by rank — top 3 get special colors
            var barColor;
            if (ri === 0) barColor = s2;       // gold for #1
            else if (ri === 1) barColor = s3;   // silver for #2
            else if (ri === 2) barColor = s1;   // red for #3
            else barColor = s4;                 // blue for rest

            // Hover highlight
            var isHovered = ri === this._hoverIdx;
            if (isHovered) {
                ctx.save();
                ctx.fillStyle = theme.withAlpha(accent, 0.10);
                ctx.fillRect(0, topPad + ri * rowH, w, rowH);
                ctx.restore();
            }

            // Rank number (tight, left-side)
            var rankText = (ri + 1).toString();
            ctx.save();
            ctx.font = 'bold ' + labelSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = ri < 3 ? barColor : t.textFaint;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(rankText, pad + Math.max(14, Math.round(labelSize * 1.2)), ry + barH / 2);
            ctx.restore();

            // Label text (truncated)
            ctx.save();
            ctx.font = labelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = isDark ? t.text : t.text;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            var labelX = pad + Math.max(20, Math.round(labelSize * 1.5));
            var labelMaxW = labelColW - labelX - 4;
            var labelTxt = labelVal;
            while (ctx.measureText(labelTxt).width > labelMaxW && labelTxt.length > 2) {
                labelTxt = labelTxt.slice(0, -1);
            }
            ctx.fillText(labelTxt, labelX, ry + barH / 2);
            ctx.restore();

            // Bar gradient fill
            if (barFillW > 0) {
                var barGrad = ctx.createLinearGradient(barAreaX, 0, barAreaX + barFillW, 0);
                barGrad.addColorStop(0, barColor);
                barGrad.addColorStop(1, theme.withAlpha(barColor, isDark ? 0.5 : 0.7));
                ctx.save();
                if (showGlow && ri === 0 && gi > 0) {
                    ctx.shadowColor = theme.withAlpha(barColor, 0.5 * gi * glowScale);
                    ctx.shadowBlur = 8 * gi * glowScale;
                }
                theme.roundRect(ctx, barAreaX, ry, barFillW, barH, 1);
                ctx.fillStyle = barGrad;
                ctx.fill();
                ctx.restore();

                // Accent end cap (thin vertical line at bar end)
                ctx.save();
                ctx.fillStyle = theme.withAlpha(accent, 0.6);
                ctx.fillRect(barAreaX + barFillW - 2, ry, 2, barH);
                ctx.restore();
            }

            // Value text
            if (showValues && barFillW > 0) {
                var valueText = theme.fmtNum(numVal) + (unitSuffix || '');
                ctx.save();
                ctx.font = 'bold ' + valueSize + 'px ' + theme.FONTS.data;
                ctx.fillStyle = isDark ? t.textDim : t.textDim;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(valueText, barAreaX + barFillW + 4, ry + barH / 2);
                ctx.restore();
            }

            // Hit region
            this._hitRegions.push({
                x: 0, y: topPad + ri * rowH, w: w, h: rowH,
                label: labelVal, value: numVal, tip: escapeHtml(labelVal) + ': <b>' + theme.fmtNum(numVal) + (unitSuffix || '') + '</b>'
            });
        }

        ctx.globalAlpha = 1;
        this._lastRows = rows;
        this._colIdx = colIdx;
        this._labelField = labelField;
    },

    _startEntrance: function(speedMult) {
        if (this._animating) { return; }
        var duration = 400 * speedMult;
        this._animating = true;
        var startTime = null;
        var self = this;
        function step(timestamp) {
            if (!self._animating) { return; }
            if (!startTime) { startTime = timestamp; }
            var progress = Math.min((timestamp - startTime) / duration, 1);
            self._entranceProgress = progress;
            self.invalidateUpdateView();
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                self._entranceDone = true;
                self._animating = false;
            }
        }
        requestAnimationFrame(step);
    },

    _onMouseMove: function(e) {
        if (!this._showHoverEffect) { return; }
        var mx = e.offsetX;
        var my = e.offsetY;
        var hit = -1;
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                hit = i;
                break;
            }
        }
        if (hit !== this._hoverIdx) {
            this._hoverIdx = hit;
            this.invalidateUpdateView();
        }
        if (hit >= 0) {
            this._tooltip.innerHTML = this._hitRegions[hit].tip;
            this._tooltip.style.display = 'block';
            var tx = mx + 12;
            var ty = my - 28;
            if (tx + 180 > this.el.offsetWidth) tx = mx - 192;
            if (ty < 0) ty = my + 10;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top = ty + 'px';
            this._canvas.style.cursor = 'pointer';
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
        }
    },

    _onClick: function(e) {
        if (!this._clickField) { return; }
        var mx = e.offsetX;
        var my = e.offsetY;
        var hit = -1;
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                hit = i;
                break;
            }
        }
        if (hit < 0) { return; }
        var clickedVal = this._hitRegions[hit].label;
        if (!clickedVal) { return; }
        var payload = {};
        payload[this._clickField] = clickedVal;
        try {
            this.drilldown({
                action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                data: payload
            }, e);
        } catch (ex) {}
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        this._animating = false;
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
