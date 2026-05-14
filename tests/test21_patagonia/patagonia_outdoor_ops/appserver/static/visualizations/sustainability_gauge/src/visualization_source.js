// sustainability_gauge — Hero arc gauge for carbon offset progress
// Patagonia Outdoor Operations viz pack
// ES5 CommonJS — build script wraps in AMD define()

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// Arc geometry: 180-degree semi-circle, opening upward
// 9 o'clock (PI) to 3 o'clock (2*PI), counterclockwise=false
var ARC_START = Math.PI;
var ARC_END   = Math.PI * 2;

var TOOLTIP_STYLE = [
    'position:absolute',
    'pointer-events:none',
    'display:none',
    'background:rgba(28,26,23,0.92)',
    'border:1px solid rgba(230,225,217,0.12)',
    'border-radius:4px',
    'padding:6px 10px',
    'color:#E6E1D9',
    'font-size:12px',
    'line-height:1.5',
    'white-space:nowrap',
    'z-index:9999',
    'max-width:260px'
].join(';');

module.exports = SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this._container  = null;
        this._canvas     = null;
        this._tooltip    = null;
        this._lastData   = null;
        this._lastConfig = null;
        this._arcHit     = null;
        this._boundMouseMove  = null;
        this._boundMouseLeave = null;
    },

    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    // formatData: build a generic column-index map; field-name resolution stays in updateView
    formatData: function (data) {
        if (!data || !data.rows || data.rows.length === 0) {
            return this._lastData || null;
        }
        var fields = data.fields;
        var colIdx = {};
        for (var i = 0; i < fields.length; i++) {
            colIdx[fields[i].name] = i;
        }
        var result = { colIdx: colIdx, rows: data.rows };
        this._lastData = result;
        return result;
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
        this._boundMouseLeave = function ()  { self._hideTooltip(); };
        el.addEventListener('mousemove',  this._boundMouseMove);
        el.addEventListener('mouseleave', this._boundMouseLeave);
    },

    _onMouseMove: function (e) {
        if (!this._arcHit || !this._lastParsed) {
            this._hideTooltip();
            return;
        }
        var rect = this.el.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;
        var h    = this._arcHit;

        if (mx >= h.x && mx <= h.x + h.w && my >= h.y && my <= h.y + h.h) {
            var d   = this._lastParsed;
            var tip = this._tooltip;
            var pctDisplay = Math.round(d.pct * 100);
            var lines = [
                '<strong>' + (d.label || 'Sustainability Progress') + '</strong>',
                'Progress: ' + pctDisplay + '% of goal',
                'Current: '  + d.value.toLocaleString() + ' / Target: ' + d.target.toLocaleString(),
                'Remaining: ' + Math.max(0, d.target - d.value).toLocaleString()
            ];
            tip.innerHTML = lines.join('<br>');
            tip.style.display = 'block';
            var tx = Math.min(mx + 14, rect.width - 200);
            var ty = Math.max(my - 60, 4);
            tip.style.left = tx + 'px';
            tip.style.top  = ty + 'px';
        } else {
            this._hideTooltip();
        }
    },

    _hideTooltip: function () {
        if (this._tooltip) this._tooltip.style.display = 'none';
    },

    updateView: function (data, config) {
        this._setupContainer();
        this._lastConfig = config;

        if (!data) {
            this._drawEmpty();
            return;
        }

        var ns = theme.getNS(this);

        // ── Theme (with auto-detection) ──
        var themeMode = theme.getOption(config, ns, 'themeMode', 'auto');
        if (themeMode === 'auto') themeMode = theme.detectTheme();
        var t = theme.getTheme(themeMode);
        var p = t.palette;

        // ── Field names from config ──
        var valueField  = theme.getOption(config, ns, 'valueField',  'value');
        var targetField = theme.getOption(config, ns, 'targetField', 'target');
        var labelField  = theme.getOption(config, ns, 'labelField',  'label');

        // ── Display options ──
        var maxValue        = parseFloat(theme.getOption(config, ns, 'maxValue',        '100'));
        if (isNaN(maxValue) || maxValue <= 0) maxValue = 100;
        var accentIntensity = parseFloat(theme.getOption(config, ns, 'accentIntensity', '50')) / 100;
        var showRidgeline   = theme.getOption(config, ns, 'showRidgeline',   'true') === 'true';
        var showTargetText  = theme.getOption(config, ns, 'showTargetText',  'true') === 'true';
        var gaugeStartColor = theme.getOption(config, ns, 'gaugeStartColor', '#8B6B4A');
        var gaugeEndColor   = theme.getOption(config, ns, 'gaugeEndColor',   '#5E8F5C');
        var decimalsStr     = theme.getOption(config, ns, 'decimals',        '0');
        var decimals        = parseInt(decimalsStr, 10);
        if (isNaN(decimals) || decimals < 0) decimals = 0;

        // ── Resolve data from colIdx ──
        var colIdx    = data.colIdx;
        var row       = data.rows[0];
        var valueIdx  = (colIdx[valueField]  !== undefined) ? colIdx[valueField]  : -1;
        var targetIdx = (colIdx[targetField] !== undefined) ? colIdx[targetField] : -1;
        var labelIdx  = (colIdx[labelField]  !== undefined) ? colIdx[labelField]  : -1;

        if (valueIdx < 0 || targetIdx < 0) {
            this._drawEmpty();
            return;
        }

        var value  = parseFloat(row[valueIdx]);
        var target = parseFloat(row[targetIdx]);
        if (isNaN(value) || isNaN(target)) {
            this._drawEmpty();
            return;
        }

        var label       = labelIdx >= 0 ? String(row[labelIdx]) : '';
        var clampedPct  = Math.min((target > 0) ? (value / target) : 0, 1.0);

        // Cache for tooltip
        this._lastParsed = {
            value:  value,
            target: target,
            label:  label,
            pct:    clampedPct
        };

        // ── Canvas setup ──
        var setup = theme.setupCanvas(this.el);
        var ctx   = setup.ctx;
        var w     = setup.w;
        var h     = setup.h;
        this._canvas = setup.canvas;

        ctx.clearRect(0, 0, w, h);

        // ── Layout — arc must fit inside panel with padding ──
        var pad      = Math.max(12, Math.min(w, h) * 0.06);
        var maxR_w   = (w - pad * 2) / 2;
        var maxR_h   = (h - pad) * 0.55;
        var radius   = Math.min(maxR_w, maxR_h);
        var arcThick = Math.max(8, radius * 0.12);
        var cx       = w / 2;
        var cy       = pad + radius + arcThick / 2;

        // ── Mountain ridgeline silhouette (faint background) ──
        if (showRidgeline) {
            var ridgeLeft  = cx - radius * 0.85;
            var ridgeRight = cx + radius * 0.85;
            var ridgeTop   = cy - radius * 0.65;
            var ridgeH     = radius * 0.50;
            ctx.globalAlpha = 0.07;
            theme.drawRidgeline(ctx, ridgeLeft, ridgeTop, ridgeRight - ridgeLeft, ridgeH, p.ridge);
            ctx.globalAlpha = 1;
        }

        // ── Arc track (background) ──
        ctx.beginPath();
        ctx.arc(cx, cy, radius, ARC_START, ARC_END, false);
        ctx.strokeStyle = p.panel;
        ctx.lineWidth   = arcThick;
        ctx.lineCap     = 'round';
        ctx.globalAlpha = 0.22;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // ── Arc fill (gradient from gaugeStartColor to gaugeEndColor) ──
        if (clampedPct > 0.001) {
            var fillEndAngle = ARC_START + clampedPct * Math.PI;
            var gradX1 = cx - radius;
            var gradX2 = cx + radius;
            var grad   = ctx.createLinearGradient(gradX1, cy, gradX2, cy);

            if (clampedPct >= 1.0) {
                grad.addColorStop(0, gaugeStartColor);
                grad.addColorStop(1, gaugeEndColor);
            } else {
                grad.addColorStop(0, gaugeStartColor);
                grad.addColorStop(Math.min(clampedPct, 1), theme.lerpColor(gaugeStartColor, gaugeEndColor, clampedPct));
                if (clampedPct < 0.98) grad.addColorStop(1, gaugeEndColor);
            }

            ctx.beginPath();
            ctx.arc(cx, cy, radius, ARC_START, fillEndAngle, false);
            ctx.strokeStyle = grad;
            ctx.lineWidth   = arcThick;
            ctx.lineCap     = 'round';
            ctx.stroke();
        }

        // ── Glow at arc endpoint ──
        if (clampedPct > 0.05 && accentIntensity > 0) {
            var glowAngle  = ARC_START + clampedPct * Math.PI;
            var glowX      = cx + radius * Math.cos(glowAngle);
            var glowY      = cy + radius * Math.sin(glowAngle);
            var glowRadius = arcThick * (1.8 + accentIntensity * 1.5);
            var glowColor  = clampedPct >= 0.8
                ? gaugeEndColor
                : theme.lerpColor(gaugeStartColor, gaugeEndColor, clampedPct);

            var gh       = parseInt(glowColor.replace('#', ''), 16);
            var gr       = (gh >> 16) & 0xFF;
            var gg       = (gh >> 8)  & 0xFF;
            var gb       = gh & 0xFF;
            var glowAlpha = 0.55 * accentIntensity;

            var glowGrad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowRadius);
            glowGrad.addColorStop(0,   'rgba(' + gr + ',' + gg + ',' + gb + ',' + glowAlpha + ')');
            glowGrad.addColorStop(0.5, 'rgba(' + gr + ',' + gg + ',' + gb + ',' + (glowAlpha * 0.4) + ')');
            glowGrad.addColorStop(1,   'rgba(' + gr + ',' + gg + ',' + gb + ',0)');

            ctx.beginPath();
            ctx.arc(glowX, glowY, glowRadius, 0, Math.PI * 2);
            ctx.fillStyle = glowGrad;
            ctx.fill();

            // Reset shadow state
            ctx.shadowBlur    = 0;
            ctx.shadowColor   = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // ── Center: percentage ──
        var pctDisplay  = (clampedPct * 100).toFixed(decimals);
        var pctFontSize = Math.max(18, h * 0.22);
        var textCY      = cy - radius * 0.12;

        ctx.font         = '700 ' + pctFontSize + 'px ' + t.fonts.ui;
        ctx.fillStyle    = p.text;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(pctDisplay + '%', cx, textCY);

        // ── "of annual goal" subtitle ──
        var subFontSize = Math.max(9, h * 0.06);
        ctx.font         = '400 ' + subFontSize + 'px ' + t.fonts.ui;
        ctx.fillStyle    = p.textDim;
        ctx.textBaseline = 'top';
        ctx.fillText('of annual goal', cx, textCY + pctFontSize * 0.18);

        // ── Value / target readout ──
        if (showTargetText) {
            var valueStr = theme.fmtNum(value,  { compact: false, decimals: decimals }) +
                           ' / ' +
                           theme.fmtNum(target, { compact: false, decimals: decimals });
            var tonsFontSize = Math.max(8, h * 0.055);
            var tonsY = textCY + pctFontSize * 0.18 + subFontSize + 6;
            ctx.font         = '400 ' + tonsFontSize + 'px ' + t.fonts.data;
            ctx.fillStyle    = p.textDim;
            ctx.textBaseline = 'top';
            ctx.fillText(valueStr, cx, tonsY);

            // ── Custom label ──
            if (label) {
                var lblFontSize = Math.max(9, h * 0.065);
                ctx.font         = '500 ' + lblFontSize + 'px ' + t.fonts.ui;
                ctx.fillStyle    = p.textMuted;
                ctx.textBaseline = 'top';
                ctx.fillText(label.toUpperCase(), cx, tonsY + tonsFontSize + 8);
            }
        }

        // Store hit region covering the arc and center text area
        this._arcHit = {
            x: cx - radius - arcThick,
            y: cy - radius - arcThick,
            w: (radius + arcThick) * 2,
            h: radius + arcThick * 2
        };
    },

    _drawEmpty: function () {
        if (!this._container) return;
        var t     = theme.getTheme('dark');
        var setup = theme.setupCanvas(this.el);
        var ctx   = setup.ctx;
        ctx.clearRect(0, 0, setup.w, setup.h);
        ctx.font         = '400 13px ' + t.fonts.ui;
        ctx.fillStyle    = 'rgba(230,225,217,0.25)';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No data', setup.w / 2, setup.h / 2);
    },

    reflow: function () {
        if (this._lastData && this._lastConfig) {
            this.updateView(this._lastData, this._lastConfig);
        }
    },

    destroy: function () {
        var el = this.el;
        if (this._boundMouseMove)  el.removeEventListener('mousemove',  this._boundMouseMove);
        if (this._boundMouseLeave) el.removeEventListener('mouseleave', this._boundMouseLeave);
        this._container  = null;
        this._canvas     = null;
        this._tooltip    = null;
        this._lastData   = null;
        this._lastConfig = null;
        this._lastParsed = null;
        this._arcHit     = null;
        if (SplunkVisualizationBase.prototype.destroy) {
            SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
        }
    }

});
