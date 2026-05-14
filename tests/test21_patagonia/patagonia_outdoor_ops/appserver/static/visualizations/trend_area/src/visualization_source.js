// trend_area — Filled area chart: sustainability carbon offset over time
// Patagonia Outdoor Operations viz pack
// ES5 CommonJS — build script wraps in AMD define()

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

var TOOLTIP_STYLE = [
    'position:absolute',
    'pointer-events:none',
    'display:none',
    'border-radius:4px',
    'padding:7px 11px',
    'font-size:12px',
    'line-height:1.6',
    'white-space:nowrap',
    'z-index:9999',
    'max-width:260px'
].join(';');

// Abbreviated month parser — handles ISO dates, full names, abbreviations
function abbrevMonth(str) {
    if (!str) return '';
    var s = String(str).trim();
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    // ISO: "2026-03..." or "2026-03-15"
    var isoMatch = s.match(/^\d{4}-(\d{2})/);
    if (isoMatch) return months[parseInt(isoMatch[1], 10) - 1] || s;
    // Full name or abbreviation prefix match
    for (var i = 0; i < months.length; i++) {
        if (s.toLowerCase().indexOf(months[i].toLowerCase()) === 0) return months[i];
    }
    return s.slice(0, 3);
}

function niceYAxis(minVal, maxVal) {
    var range = maxVal - minVal;
    if (range <= 0) range = maxVal || 1;
    var raw = range / 4;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag;
    var nice;
    if (norm <= 1.5)      nice = 1;
    else if (norm <= 3)   nice = 2;
    else if (norm <= 7)   nice = 5;
    else                  nice = 10;
    var step = nice * mag;
    var lo = Math.floor(minVal / step) * step;
    var ticks = [];
    var v = lo;
    while (v <= maxVal + step * 0.5) {
        ticks.push(Math.round(v * 1e6) / 1e6);
        v += step;
    }
    return ticks;
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this._container   = null;
        this._canvas      = null;
        this._tooltip     = null;
        this._lastData    = null;
        this._lastConfig  = null;
        this._crosshairX  = -1;
        this._chartLayout = null;
        this._boundMouseMove  = null;
        this._boundMouseLeave = null;
    },

    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function (data) {
        if (!data || !data.rows || data.rows.length === 0) {
            return this._lastData || null;
        }
        // Store raw — field name mapping deferred to updateView
        var fields = data.fields;
        var colIdx = {};
        for (var fi = 0; fi < fields.length; fi++) {
            colIdx[fields[fi].name] = fi;
        }
        this._lastData = { colIdx: colIdx, rows: data.rows, fields: fields };
        return this._lastData;
    },

    _setupContainer: function () {
        if (this._container) return;

        var el = this.el;
        el.style.position = 'relative';
        el.style.overflow = 'hidden';


        var tip = document.createElement('div');
        tip.style.cssText = TOOLTIP_STYLE;
        el.appendChild(tip);
        this._tooltip = tip;

        var self = this;
        this._boundMouseMove  = function (e) { self._onMouseMove(e); };
        this._boundMouseLeave = function ()  { self._onMouseLeave(); };
        el.addEventListener('mousemove',  this._boundMouseMove);
        el.addEventListener('mouseleave', this._boundMouseLeave);
    },

    _onMouseMove: function (e) {
        if (!this._chartLayout || !this._lastPoints || !this._lastPoints.length) {
            this._hideTooltip();
            return;
        }

        var rect = this.el.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var lay = this._chartLayout;

        if (mx < lay.plotX || mx > lay.plotX + lay.plotW ||
            my < lay.plotY || my > lay.plotY + lay.plotH) {
            this._hideTooltip();
            if (this._crosshairX !== -1) {
                this._crosshairX = -1;
                if (this._lastData && this._lastConfig) this._render(this._lastData, this._lastConfig);
            }
            return;
        }

        var points = this._lastPoints;
        var n = points.length;
        var step = lay.plotW / Math.max(n - 1, 1);
        var nearIdx = Math.round((mx - lay.plotX) / step);
        if (nearIdx < 0) nearIdx = 0;
        if (nearIdx >= n) nearIdx = n - 1;

        var pt = points[nearIdx];
        var ptX = lay.plotX + nearIdx * step;

        if (Math.abs(mx - ptX) <= step * 0.65) {
            var lines = [];
            lines.push('<strong>' + pt.month + '</strong>');
            lines.push(this._yFieldLabel + ': ' + theme.fmtNum(pt.value, { compact: false, decimals: 1 }));
            if (pt.target !== null) {
                lines.push('Target: ' + theme.fmtNum(pt.target, { compact: false, decimals: 1 }));
                var delta = pt.value - pt.target;
                var sign = delta >= 0 ? '+' : '';
                lines.push('Delta: ' + sign + delta.toFixed(1));
            }

            var tip = this._tooltip;
            tip.innerHTML = lines.join('<br>');
            tip.style.display = 'block';

            var tx = Math.min(mx + 14, rect.width - 190);
            var ty = Math.max(my - 52, 4);
            tip.style.left = tx + 'px';
            tip.style.top  = ty + 'px';

            if (this._crosshairX !== nearIdx) {
                this._crosshairX = nearIdx;
                if (this._lastData && this._lastConfig) this._render(this._lastData, this._lastConfig);
            }
        } else {
            this._hideTooltip();
            if (this._crosshairX !== -1) {
                this._crosshairX = -1;
                if (this._lastData && this._lastConfig) this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _onMouseLeave: function () {
        this._hideTooltip();
        if (this._crosshairX !== -1) {
            this._crosshairX = -1;
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _hideTooltip: function () {
        if (this._tooltip) this._tooltip.style.display = 'none';
    },

    updateView: function (data, config) {
        this._setupContainer();
        this._lastConfig = config;

        if (!data || !data.rows || data.rows.length === 0) {
            this._drawEmpty(config);
            return;
        }

        this._render(data, config);
    },

    _render: function (data, config) {
        var ns = theme.getNS(this);

        // --- Read all config options ---
        var themeMode = theme.getOption(config, ns, 'themeMode', 'auto');
        if (themeMode === 'auto') themeMode = theme.detectTheme();
        var t  = theme.getTheme(themeMode);
        var p  = t.palette;

        var xField      = theme.getOption(config, ns, 'xField',      'month');
        var yField      = theme.getOption(config, ns, 'yField',      'carbon_offset_tons');
        var targetField = theme.getOption(config, ns, 'targetField', 'target_tons');
        var showDots    = theme.getOption(config, ns, 'showDots',    'true') === 'true';
        var showTarget  = theme.getOption(config, ns, 'showTarget',  'true') === 'true';
        var showLegend  = theme.getOption(config, ns, 'showLegend',  'true') === 'true';
        var areaColor   = theme.getOption(config, ns, 'areaColor',   p.green);
        var targetColor = theme.getOption(config, ns, 'targetColor', p.sandstone);
        var accentIntensity = parseFloat(theme.getOption(config, ns, 'accentIntensity', '50')) / 100;

        // Store for tooltip formatting
        this._yFieldLabel = yField.replace(/_/g, ' ');
        this._yFieldLabel = this._yFieldLabel.charAt(0).toUpperCase() + this._yFieldLabel.slice(1);

        // --- Build points from raw data ---
        var fields = data.fields;
        var rows   = data.rows;

        var xIdx = -1, yIdx = -1, tgIdx = -1;
        for (var fi = 0; fi < fields.length; fi++) {
            var fn = fields[fi].name;
            if (fn === xField)      xIdx  = fi;
            if (fn === yField)      yIdx  = fi;
            if (fn === targetField) tgIdx = fi;
        }
        // Fallback if field not found
        if (xIdx < 0 && fields.length > 0) xIdx = 0;
        if (yIdx < 0 && fields.length > 1) yIdx = 1;
        if (yIdx < 0) yIdx = 0;

        var points = [];
        for (var ri = 0; ri < rows.length; ri++) {
            var row = rows[ri];
            var month = String(row[xIdx] !== undefined ? row[xIdx] : '');
            var val   = parseFloat(row[yIdx]);
            if (isNaN(val)) val = 0;
            var target = (showTarget && tgIdx >= 0) ? parseFloat(row[tgIdx]) : NaN;

            points.push({
                month:      month,
                monthAbbr:  abbrevMonth(month),
                value:      val,
                target:     isNaN(target) ? null : target
            });
        }

        this._lastPoints = points;

        // --- Canvas setup ---
        var setup = theme.setupCanvas(this.el);
        var ctx = setup.ctx;
        var w   = setup.w;
        var h   = setup.h;
        this._canvas = setup.canvas;

        // Style tooltip
        var tip = this._tooltip;
        tip.style.background  = p.panelHi;
        tip.style.color       = p.text;
        tip.style.fontFamily  = t.fonts.ui;
        tip.style.border      = '1px solid ' + p.grid;

        ctx.clearRect(0, 0, w, h);

        var n = points.length;
        if (n === 0) return;

        var hasTarget = false;
        for (var pi = 0; pi < n; pi++) {
            if (points[pi].target !== null) { hasTarget = true; break; }
        }

        // --- Y range ---
        var allVals = [];
        for (var vi = 0; vi < n; vi++) {
            allVals.push(points[vi].value);
            if (points[vi].target !== null) allVals.push(points[vi].target);
        }
        var dataMin = allVals[0], dataMax = allVals[0];
        for (var ai = 1; ai < allVals.length; ai++) {
            if (allVals[ai] < dataMin) dataMin = allVals[ai];
            if (allVals[ai] > dataMax) dataMax = allVals[ai];
        }
        var yMin = Math.min(0, dataMin);
        var yMax = dataMax * 1.10;
        if (yMax <= yMin) yMax = yMin + 1;

        var yTicks = niceYAxis(yMin, yMax);
        if (yTicks.length > 0) {
            yMin = yTicks[0];
            yMax = yTicks[yTicks.length - 1];
        }
        var yRange = yMax - yMin || 1;

        // --- Layout ---
        var padT     = Math.max(12, Math.round(h * 0.06));
        var padB     = Math.max(28, Math.round(h * 0.14));
        var padL     = Math.max(40, Math.round(w * 0.09));
        var padR     = Math.max(12, Math.round(w * 0.04));
        var legendH  = showLegend ? Math.max(16, Math.round(h * 0.06)) : 0;
        var plotX    = padL;
        var plotY    = padT;
        var plotW    = w - padL - padR;
        var plotH    = h - padT - padB - legendH;

        this._chartLayout = { plotX: plotX, plotY: plotY, plotW: plotW, plotH: plotH };

        function toCanvasX(i) {
            return plotX + (i / Math.max(n - 1, 1)) * plotW;
        }
        function toCanvasY(val) {
            return plotY + plotH - ((val - yMin) / yRange) * plotH;
        }

        var axisFont  = Math.max(8, Math.round(h * 0.045)) + 'px ' + t.fonts.data;
        var labelFont = Math.max(8, Math.round(h * 0.042)) + 'px ' + t.fonts.data;

        // --- Horizontal grid lines ---
        ctx.save();
        ctx.strokeStyle = p.grid;
        ctx.lineWidth   = 1;
        ctx.setLineDash([]);
        for (var ti = 0; ti < yTicks.length; ti++) {
            var gy = toCanvasY(yTicks[ti]);
            if (gy < plotY - 2 || gy > plotY + plotH + 2) continue;
            ctx.beginPath();
            ctx.moveTo(plotX,          gy);
            ctx.lineTo(plotX + plotW,  gy);
            ctx.stroke();
        }
        ctx.restore();

        // --- Target area fill ---
        if (hasTarget && showTarget) {
            var firstTIdx = -1;
            for (var tfi = 0; tfi < n; tfi++) {
                if (points[tfi].target !== null) { firstTIdx = tfi; break; }
            }
            if (firstTIdx >= 0) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(toCanvasX(firstTIdx), toCanvasY(points[firstTIdx].target));
                for (var tli = firstTIdx + 1; tli < n; tli++) {
                    if (points[tli].target !== null) {
                        ctx.lineTo(toCanvasX(tli), toCanvasY(points[tli].target));
                    }
                }
                var lastTIdx2 = n - 1;
                while (lastTIdx2 > firstTIdx && points[lastTIdx2].target === null) lastTIdx2--;
                ctx.lineTo(toCanvasX(lastTIdx2), toCanvasY(yMin));
                ctx.lineTo(toCanvasX(firstTIdx), toCanvasY(yMin));
                ctx.closePath();
                ctx.fillStyle   = targetColor;
                ctx.globalAlpha = 0.08 + accentIntensity * 0.05;
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.restore();
            }
        }

        // --- Main area fill: areaColor top → transparent bottom ---
        ctx.save();
        var areaGrad = ctx.createLinearGradient(0, plotY, 0, plotY + plotH);
        var aAlpha0 = (0.50 + accentIntensity * 0.25).toFixed(2);
        var aAlpha1 = (0.30 + accentIntensity * 0.12).toFixed(2);
        var aAlpha2 = (0.12 + accentIntensity * 0.05).toFixed(2);
        areaGrad.addColorStop(0,    theme.hexToRgba(areaColor, parseFloat(aAlpha0)));
        areaGrad.addColorStop(0.40, theme.hexToRgba(areaColor, parseFloat(aAlpha1)));
        areaGrad.addColorStop(0.70, theme.hexToRgba(areaColor, parseFloat(aAlpha2)));
        areaGrad.addColorStop(1,    theme.hexToRgba(areaColor, 0));

        ctx.beginPath();
        ctx.moveTo(toCanvasX(0), toCanvasY(points[0].value));
        for (var ai2 = 1; ai2 < n; ai2++) {
            var prevX2 = toCanvasX(ai2 - 1);
            var prevY2 = toCanvasY(points[ai2 - 1].value);
            var currX2 = toCanvasX(ai2);
            var currY2 = toCanvasY(points[ai2].value);
            var cpx2   = (prevX2 + currX2) / 2;
            ctx.bezierCurveTo(cpx2, prevY2, cpx2, currY2, currX2, currY2);
        }
        ctx.lineTo(toCanvasX(n - 1), toCanvasY(yMin));
        ctx.lineTo(toCanvasX(0),     toCanvasY(yMin));
        ctx.closePath();
        ctx.fillStyle = areaGrad;
        ctx.fill();
        ctx.restore();

        // --- Main line ---
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(toCanvasX(0), toCanvasY(points[0].value));
        for (var li = 1; li < n; li++) {
            var lpx  = toCanvasX(li - 1);
            var lpy  = toCanvasY(points[li - 1].value);
            var lcx  = toCanvasX(li);
            var lcy  = toCanvasY(points[li].value);
            var lcpx = (lpx + lcx) / 2;
            ctx.bezierCurveTo(lcpx, lpy, lcpx, lcy, lcx, lcy);
        }
        ctx.strokeStyle = areaColor;
        ctx.lineWidth   = 2;
        ctx.lineJoin    = 'round';
        ctx.lineCap     = 'round';
        ctx.shadowBlur  = 6 * accentIntensity;
        ctx.shadowColor = theme.hexToRgba(areaColor, 0.35);
        ctx.stroke();
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.restore();

        // --- Target dashed line ---
        if (hasTarget && showTarget) {
            ctx.save();
            ctx.setLineDash([5, 4]);
            ctx.strokeStyle = targetColor;
            ctx.lineWidth   = 1.5;
            ctx.lineJoin    = 'round';
            ctx.lineCap     = 'round';
            ctx.globalAlpha = 0.82;

            var inTarget = false;
            ctx.beginPath();
            for (var tdi = 0; tdi < n; tdi++) {
                if (points[tdi].target === null) continue;
                var tdx = toCanvasX(tdi);
                var tdy = toCanvasY(points[tdi].target);
                if (!inTarget) {
                    ctx.moveTo(tdx, tdy);
                    inTarget = true;
                } else {
                    ctx.lineTo(tdx, tdy);
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        // --- Data point dots ---
        if (showDots) {
            ctx.save();
            var dotR = Math.max(2.5, Math.min(5, plotW / n * 0.2));
            for (var di = 0; di < n; di++) {
                var dx       = toCanvasX(di);
                var dy       = toCanvasY(points[di].value);
                var isActive = (di === this._crosshairX);

                ctx.beginPath();
                ctx.arc(dx, dy, isActive ? dotR * 1.7 : dotR, 0, Math.PI * 2);
                ctx.fillStyle   = areaColor;
                ctx.globalAlpha = isActive ? 1.0 : 0.75;
                ctx.fill();

                if (isActive) {
                    ctx.beginPath();
                    ctx.arc(dx, dy, dotR * 2.5, 0, Math.PI * 2);
                    ctx.strokeStyle = areaColor;
                    ctx.lineWidth   = 1;
                    ctx.globalAlpha = 0.35;
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }
            ctx.restore();
        }

        // --- Vertical crosshair ---
        if (this._crosshairX >= 0 && this._crosshairX < n) {
            var chX = toCanvasX(this._crosshairX);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(chX, plotY);
            ctx.lineTo(chX, plotY + plotH);
            ctx.strokeStyle = p.textMuted;
            ctx.lineWidth   = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // --- Y-axis labels ---
        ctx.save();
        ctx.font         = axisFont;
        ctx.fillStyle    = p.textMuted;
        ctx.textAlign    = 'right';
        ctx.textBaseline = 'middle';
        for (var yi = 0; yi < yTicks.length; yi++) {
            var yly = toCanvasY(yTicks[yi]);
            if (yly < plotY - 4 || yly > plotY + plotH + 4) continue;
            ctx.fillText(theme.fmtNum(yTicks[yi], { compact: true }), plotX - 5, yly);
        }
        ctx.restore();

        // --- X-axis labels ---
        var maxLabels = Math.floor(plotW / Math.max(30, w * 0.08));
        if (maxLabels < 2) maxLabels = 2;
        var labelStep = Math.max(1, Math.round(n / maxLabels));

        ctx.save();
        ctx.font         = labelFont;
        ctx.fillStyle    = p.textMuted;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        for (var xi = 0; xi < n; xi += labelStep) {
            ctx.fillText(points[xi].monthAbbr, toCanvasX(xi), plotY + plotH + 5);
        }
        var lastLabelIdx = n - 1;
        if (lastLabelIdx % labelStep !== 0) {
            ctx.fillText(points[lastLabelIdx].monthAbbr, toCanvasX(lastLabelIdx), plotY + plotH + 5);
        }
        ctx.restore();

        // --- Inline legend ---
        if (showLegend) {
            var legendY       = plotY + plotH + padB * 0.55;
            var legendFontSz  = Math.max(9, Math.round(h * 0.042));
            ctx.save();
            ctx.font         = legendFontSz + 'px ' + t.fonts.ui;
            ctx.textBaseline = 'middle';

            // Actual swatch
            ctx.beginPath();
            ctx.moveTo(plotX, legendY);
            ctx.lineTo(plotX + 18, legendY);
            ctx.strokeStyle = areaColor;
            ctx.lineWidth   = 2;
            ctx.stroke();
            ctx.fillStyle  = p.textMuted;
            ctx.textAlign  = 'left';
            ctx.fillText('Actual', plotX + 22, legendY);

            // Target swatch
            if (hasTarget && showTarget) {
                var actualW  = ctx.measureText('Actual').width;
                var targetLX = plotX + 22 + actualW + 20;
                ctx.save();
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.moveTo(targetLX, legendY);
                ctx.lineTo(targetLX + 18, legendY);
                ctx.strokeStyle = targetColor;
                ctx.lineWidth   = 1.5;
                ctx.globalAlpha = 0.82;
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
                ctx.restore();
                ctx.fillStyle = p.textMuted;
                ctx.fillText('Target', targetLX + 22, legendY);
            }
            ctx.restore();
        }
    },

    _drawEmpty: function (config) {
        if (!this._container) return;
        var ns = theme.getNS(this);
        var themeMode = theme.getOption(config || {}, ns, 'themeMode', 'auto');
        if (themeMode === 'auto') themeMode = theme.detectTheme();
        var t = theme.getTheme(themeMode);
        var setup = theme.setupCanvas(this.el);
        var ctx = setup.ctx;
        ctx.clearRect(0, 0, setup.w, setup.h);
        ctx.font         = '400 13px ' + t.fonts.ui;
        ctx.fillStyle    = t.palette.textMuted;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No data', setup.w / 2, setup.h / 2);
    },

    reflow: function () {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    destroy: function () {
        var el = this.el;
        if (this._boundMouseMove)  el.removeEventListener('mousemove',  this._boundMouseMove);
        if (this._boundMouseLeave) el.removeEventListener('mouseleave', this._boundMouseLeave);
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        this._container   = null;
        this._canvas      = null;
        this._tooltip     = null;
        this._lastData    = null;
        this._lastConfig  = null;
        this._lastPoints  = null;
        this._chartLayout = null;
        this._crosshairX  = -1;
        SplunkVisualizationBase.prototype.destroy && SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
