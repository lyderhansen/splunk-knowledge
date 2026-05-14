// McLaren F1 Telemetry — kpi_tile visualization
// Single-value KPI tile with accent bar, optional trend delta, and sparkline

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// ---------------------------------------------------------------------------
// Helpers — string-safe value display (B11)
// ---------------------------------------------------------------------------

function isNumericString(str) {
    // Returns true only if str can be treated as a number AND parseFloat
    // round-trips cleanly — "P1", "1:21.584", "+0.197s" all return false
    if (!str || str === '') return false;
    var s = String(str).trim();
    // Allow optional leading sign then digits, optional decimal
    if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return false;
    var n = parseFloat(s);
    return !isNaN(n);
}

function parseSparkline(raw) {
    if (!raw) return [];
    var parts = String(raw).split(',');
    var out = [];
    for (var i = 0; i < parts.length; i++) {
        var n = parseFloat(parts[i].trim());
        if (!isNaN(n)) out.push(n);
    }
    return out;
}

// ---------------------------------------------------------------------------
// Main viz
// ---------------------------------------------------------------------------

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Create canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'display:block;width:100%;height:100%;';
        this.el.appendChild(this._canvas);

        // Tooltip (I1)
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:5px 9px;border-radius:3px;' +
            'pointer-events:none;white-space:nowrap;z-index:100;font-size:11px;';
        this.el.appendChild(this._tooltip);

        // Event listeners
        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
        });

        // Cache for reflow (C6)
        this._lastData = null;
        this._lastConfig = null;
    },

    // -----------------------------------------------------------------------
    // Data contract
    // -----------------------------------------------------------------------

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function(data) {
        // Only data processing here, never config reads (B4)
        if (!data || !data.rows || data.rows.length === 0) {
            if (this._lastGoodData) return this._lastGoodData;
            return data;
        }
        var fields = data.fields;
        var colIdx = {};
        for (var i = 0; i < fields.length; i++) {
            colIdx[fields[i].name] = i;
        }
        var result = { colIdx: colIdx, rows: data.rows, fields: fields };
        this._lastGoodData = result;
        return result;
    },

    // -----------------------------------------------------------------------
    // Render pipeline
    // -----------------------------------------------------------------------

    updateView: function(data, config) {
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    // -----------------------------------------------------------------------
    // Core render
    // -----------------------------------------------------------------------

    _render: function(data, config) {
        var ns = theme.getNS(this);
        var t = theme.getTheme(theme.getOption(config, ns, 'theme', 'dark'));

        // HiDPI canvas (B2) — manual since we own the canvas
        var rect = this.el.getBoundingClientRect();
        var w = rect.width || this.el.offsetWidth || 300;
        var h = rect.height || this.el.offsetHeight || 150;
        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Clear — NEVER fillRect with bg (B13)
        ctx.clearRect(0, 0, w, h);

        // Config reads (all via getOption — B3)
        var valueField     = theme.getOption(config, ns, 'valueField',     'value');
        var labelField     = theme.getOption(config, ns, 'labelField',     'label');
        var trendField     = theme.getOption(config, ns, 'trendField',     'trend');
        var sparklineField = theme.getOption(config, ns, 'sparklineField', 'sparkline');
        var unitField      = theme.getOption(config, ns, 'unitField',      'unit');
        var unitPosition   = theme.getOption(config, ns, 'unitPosition',   'after');
        var accentColor    = theme.getOption(config, ns, 'accentColor',    '#FF8000');
        var showTrend      = theme.parseBool(theme.getOption(config, ns, 'showTrend', 'true'), true);
        var showSparkline  = theme.parseBool(theme.getOption(config, ns, 'showSparkline', 'true'), true);
        var decimals       = theme.parseNum(theme.getOption(config, ns, 'decimals', '-1'), -1);
        var accentIntensity = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50);

        // Extract data values
        var colIdx = (data && data.colIdx) ? data.colIdx : {};
        var rows   = (data && data.rows)   ? data.rows   : [];
        var row    = rows.length > 0 ? rows[0] : [];

        var rawValue     = (colIdx[valueField]     !== undefined) ? String(row[colIdx[valueField]]     || '')   : '';
        var rawLabel     = (colIdx[labelField]      !== undefined) ? String(row[colIdx[labelField]]     || '')   : labelField;
        var rawTrend     = (colIdx[trendField]      !== undefined) ? String(row[colIdx[trendField]]     || '')   : '';
        var rawSparkline = (colIdx[sparklineField]  !== undefined) ? String(row[colIdx[sparklineField]] || '')   : '';
        var rawUnit      = (colIdx[unitField]        !== undefined) ? String(row[colIdx[unitField]]      || '')   : '';

        // Format display value (B11 — non-numeric strings rendered as-is)
        var displayValue;
        if (!rawValue) {
            displayValue = '—';
        } else if (isNumericString(rawValue)) {
            var numVal = parseFloat(rawValue);
            if (decimals >= 0) {
                displayValue = numVal.toFixed(decimals);
            } else {
                displayValue = theme.fmtNum(numVal, { compact: false });
            }
        } else {
            // lap times, positions, gaps — display as-is
            displayValue = rawValue;
        }

        // Apply unit
        if (rawUnit) {
            if (unitPosition === 'before') {
                displayValue = rawUnit + displayValue;
            } else {
                displayValue = displayValue + rawUnit;
            }
        }

        // Trend delta
        var trendNum = parseFloat(rawTrend);
        var hasTrend = showTrend && rawTrend !== '' && !isNaN(trendNum);

        // Sparkline
        var sparkData = (showSparkline && rawSparkline) ? parseSparkline(rawSparkline) : [];

        // ---------------------------------------------------------------------------
        // Layout constants — all scaled from container (B8)
        // ---------------------------------------------------------------------------
        var ACCENT_W = 4;
        var pad = Math.max(8, Math.round(w * 0.06));
        var innerX = ACCENT_W + pad;
        var innerW = w - innerX - pad;

        // Font sizes
        var labelFontSize   = Math.max(7,  Math.round(h * 0.09));
        var valueFontSize   = Math.max(18, Math.round(h * 0.38));
        var trendFontSize   = Math.max(8,  Math.round(h * 0.10));
        var glowAlpha       = Math.min(0.5, (accentIntensity / 100) * 0.5);

        // Fit value text into available width
        var fittedSize = theme.fitText(ctx, displayValue, innerW, valueFontSize, 14, theme.FONTS.data);

        // ---------------------------------------------------------------------------
        // Draw sparkline background (area chart, 15% accent opacity)
        // ---------------------------------------------------------------------------
        if (sparkData.length >= 2) {
            var spMin = sparkData[0], spMax = sparkData[0];
            for (var i = 1; i < sparkData.length; i++) {
                if (sparkData[i] < spMin) spMin = sparkData[i];
                if (sparkData[i] > spMax) spMax = sparkData[i];
            }
            var spRange = spMax - spMin;
            if (spRange === 0) spRange = 1;

            var spPad = Math.round(h * 0.04);
            var spH = h - spPad * 2;
            var spW = w - ACCENT_W;
            var spX = ACCENT_W;
            var spStep = spW / (sparkData.length - 1);

            ctx.save();
            // Gradient fill
            var spGrad = ctx.createLinearGradient(spX, spPad, spX, spPad + spH);
            spGrad.addColorStop(0, theme.withAlpha(accentColor, 0.15));
            spGrad.addColorStop(1, theme.withAlpha(accentColor, 0.00));
            ctx.fillStyle = spGrad;
            ctx.beginPath();
            ctx.moveTo(spX, spPad + spH);
            for (var si = 0; si < sparkData.length; si++) {
                var sx = spX + si * spStep;
                var sy = spPad + spH - ((sparkData[si] - spMin) / spRange) * spH;
                if (si === 0) ctx.lineTo(sx, sy);
                else ctx.lineTo(sx, sy);
            }
            ctx.lineTo(spX + spW, spPad + spH);
            ctx.closePath();
            ctx.fill();
            // Stroke line
            ctx.strokeStyle = theme.withAlpha(accentColor, 0.25);
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (var sl = 0; sl < sparkData.length; sl++) {
                var slx = spX + sl * spStep;
                var sly = spPad + spH - ((sparkData[sl] - spMin) / spRange) * spH;
                if (sl === 0) ctx.moveTo(slx, sly);
                else ctx.lineTo(slx, sly);
            }
            ctx.stroke();
            ctx.restore();
        }

        // ---------------------------------------------------------------------------
        // Draw left accent bar
        // ---------------------------------------------------------------------------
        if (accentIntensity > 0) {
            // Glow behind bar
            ctx.save();
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = Math.max(0, (accentIntensity / 100) * 18);
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = accentColor;
            ctx.fillRect(0, 0, ACCENT_W, h);
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.restore();
        } else {
            ctx.fillStyle = accentColor;
            ctx.fillRect(0, 0, ACCENT_W, h);
        }
        // Reset shadow (B6)
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // ---------------------------------------------------------------------------
        // Vertical layout — additive positioning (no percentage overlap)
        // ---------------------------------------------------------------------------
        // Determine how many lines we're drawing
        var lineCount = 2 + (hasTrend ? 1 : 0);
        var totalTextH = fittedSize + labelFontSize * 1.8 + (hasTrend ? trendFontSize * 1.6 : 0);
        var startY = Math.round((h - totalTextH) / 2) + fittedSize * 0.85;
        if (startY < fittedSize) startY = fittedSize + 4;

        var valueY = startY;
        var labelY = valueY + labelFontSize * 1.6;
        var trendY = labelY + trendFontSize * 1.6;

        // ---------------------------------------------------------------------------
        // Draw main value
        // ---------------------------------------------------------------------------
        ctx.save();
        ctx.font = 'bold ' + fittedSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Subtle glow on value at higher intensities
        if (accentIntensity > 40) {
            ctx.shadowColor = theme.withAlpha(accentColor, glowAlpha);
            ctx.shadowBlur = Math.max(0, (accentIntensity / 100) * 8);
        }
        ctx.fillText(displayValue, innerX, valueY);
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.restore();

        // ---------------------------------------------------------------------------
        // Draw label
        // ---------------------------------------------------------------------------
        var labelText = rawLabel.toUpperCase();
        ctx.save();
        ctx.font = labelFontSize + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textFaint;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.letterSpacing = '1px'; // ignored by Canvas but harmless
        ctx.fillText(labelText, innerX, labelY);
        ctx.restore();

        // ---------------------------------------------------------------------------
        // Draw trend delta
        // ---------------------------------------------------------------------------
        if (hasTrend) {
            var isPositive = trendNum >= 0;
            var arrow = isPositive ? '▲' : '▼';
            var trendColor = isPositive ? t.safe : t.danger;
            var trendSign = isPositive ? '+' : '';
            var trendText = arrow + ' ' + trendSign + theme.fmtNum(trendNum, { fixed: 3 });

            ctx.save();
            ctx.font = 'bold ' + trendFontSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = trendColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(trendText, innerX, trendY);
            ctx.restore();
        }

        // ---------------------------------------------------------------------------
        // Store hit region for tooltip (I1)
        // ---------------------------------------------------------------------------
        this._hitRegion = {
            x: 0, y: 0, w: w, h: h,
            label: rawLabel || valueField,
            value: rawValue || '—',
            trend: hasTrend ? (trendNum >= 0 ? '+' : '') + trendNum : null
        };

        // Style tooltip from theme
        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.data;
        this._tooltip.style.border = '1px solid ' + theme.withAlpha(accentColor, 0.4);
    },

    // -----------------------------------------------------------------------
    // Mouse interaction (I1)
    // -----------------------------------------------------------------------

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitRegion;

        if (hit && mx >= hit.x && mx <= hit.x + hit.w &&
                   my >= hit.y && my <= hit.y + hit.h) {
            var tip = hit.label + ': ' + hit.value;
            if (hit.trend !== null) tip += '  Δ' + hit.trend;
            this._tooltip.textContent = tip;
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = (mx + 12) + 'px';
            this._tooltip.style.top  = (my - 8) + 'px';
            this._canvas.style.cursor = 'default';
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
        }
    },

    // -----------------------------------------------------------------------
    // Cleanup (C5, I1)
    // -----------------------------------------------------------------------

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        this._tooltip = null;
        this._hitRegion = null;
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
