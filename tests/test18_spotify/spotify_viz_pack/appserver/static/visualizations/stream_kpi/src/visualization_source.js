'use strict';

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('theme');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
}

// Parse sparkline string into array of numbers, normalised 0-1
function parseSparkline(raw) {
    if (!raw) return [];
    var parts = String(raw).split(',');
    var vals = [];
    for (var i = 0; i < parts.length; i++) {
        var v = parseFloat(parts[i]);
        if (!isNaN(v)) vals.push(v);
    }
    if (vals.length < 2) return [];
    var mn = vals[0];
    var mx = vals[0];
    for (var j = 1; j < vals.length; j++) {
        if (vals[j] < mn) mn = vals[j];
        if (vals[j] > mx) mx = vals[j];
    }
    var range = mx - mn;
    if (range === 0) {
        for (var k = 0; k < vals.length; k++) vals[k] = 0.5;
        return vals;
    }
    for (var m = 0; m < vals.length; m++) {
        vals[m] = (vals[m] - mn) / range;
    }
    return vals;
}

// Format the main value: compact by default, respects decimals setting
function formatValue(raw, decimals, unit, unitPosition) {
    var str = String(raw);
    var num = parseFloat(str);
    var isNum = !isNaN(num);

    var display;
    if (!str || str === '' || str === 'null') {
        display = '—';
    } else if (!isNum) {
        display = str;
    } else {
        var d = parseInt(decimals, 10);
        if (d >= 0) {
            display = num.toFixed(d);
        } else {
            // compact: 1.2M, 847K, etc.
            display = theme.fmtNum(num, { compact: true });
        }
    }

    var u = unit || '';
    if (!u) return display;
    if (unitPosition === 'before') return u + display;
    return display + u;
}

// Determine if delta is positive: starts with '+' or numeric > 0
function isDeltaPositive(delta) {
    if (!delta) return null;
    var s = String(delta).trim();
    if (s.charAt(0) === '+') return true;
    if (s.charAt(0) === '-') return false;
    var v = parseFloat(s);
    if (isNaN(v)) return null;
    return v > 0;
}

// ---------------------------------------------------------------------------
// Viz
// ---------------------------------------------------------------------------

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;display:block;';
        this.el.appendChild(this._canvas);

        // Hover glow overlay (invisible div that tracks mouse for glow state)
        this._hovered = false;

        // Tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:6px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-size:12px;line-height:1.4;';
        this.el.appendChild(this._tooltip);

        // Event listeners
        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._hovered = false;
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
            if (self._lastData && self._lastConfig) {
                self._render(self._lastData, self._lastConfig);
            }
        });

        this._lastData = null;
        this._lastConfig = null;
        this._lastGoodData = null;
        this._gi = 1; // accent intensity multiplier
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10
        };
    },

    formatData: function(data) {
        if (!data || !data.rows || data.rows.length === 0) {
            if (this._lastGoodData) return this._lastGoodData;
            return data;
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
        this._lastConfig = config;
        this._lastData = data;
        this._render(data, config);
    },

    _render: function(data, config) {
        var ns = getNS(this);

        // --- Config reads ---
        var valueField    = getOption(config, ns, 'valueField',    'value');
        var labelField    = getOption(config, ns, 'labelField',    'label');
        var deltaField    = getOption(config, ns, 'deltaField',    'delta');
        var sparkField    = getOption(config, ns, 'sparklineField','sparkline');
        var accentColor   = getOption(config, ns, 'accentColor',   '#1DB954');
        var accentInt     = getOption(config, ns, 'accentIntensity','50');
        var showDelta     = getOption(config, ns, 'showDelta',     'true');
        var showSparkline = getOption(config, ns, 'showSparkline', 'true');
        var decimals      = getOption(config, ns, 'decimals',      '-1');
        var unit          = getOption(config, ns, 'unit',          '');
        var unitPosition  = getOption(config, ns, 'unitPosition',  'after');

        var giRaw = parseFloat(accentInt);
        if (isNaN(giRaw)) giRaw = 50;
        this._gi = Math.max(0, Math.min(100, giRaw)) / 50; // 0-2 range

        var displayDelta     = (showDelta     !== 'false' && showDelta     !== false);
        var displaySparkline = (showSparkline !== 'false' && showSparkline !== false);

        // --- Dimensions ---
        var w = this.el.offsetWidth  || 300;
        var h = this.el.offsetHeight || 150;

        // HiDPI
        var dpr = window.devicePixelRatio || 1;
        this._canvas.width        = w * dpr;
        this._canvas.height       = h * dpr;
        this._canvas.style.width  = w + 'px';
        this._canvas.style.height = h + 'px';

        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // --- Theme ---
        var mode = theme.detectTheme(this.el);
        var t = theme.getTheme(mode);
        var fonts = theme.getFonts();

        // Style tooltip from theme
        this._tooltip.style.background  = t.panelHi;
        this._tooltip.style.color       = t.textBright;
        this._tooltip.style.fontFamily  = fonts.ui;
        this._tooltip.style.border      = '1px solid ' + theme.hexToRgba(accentColor, 0.3);

        // --- Data extraction ---
        var valueStr    = '—';
        var labelStr    = 'STREAMS';
        var deltaStr    = '';
        var sparkValues = [];

        if (data && data.colIdx && data.rows && data.rows.length > 0) {
            var row    = data.rows[0];
            var colIdx = data.colIdx;

            if (colIdx[valueField] !== undefined) {
                valueStr = String(row[colIdx[valueField]]);
            }
            if (colIdx[labelField] !== undefined) {
                labelStr = String(row[colIdx[labelField]]);
            }
            if (displayDelta && colIdx[deltaField] !== undefined) {
                deltaStr = String(row[colIdx[deltaField]]);
            }
            if (displaySparkline && colIdx[sparkField] !== undefined) {
                sparkValues = parseSparkline(String(row[colIdx[sparkField]]));
            }
        }

        var displayValue = formatValue(valueStr, decimals, unit, unitPosition);
        var positive     = isDeltaPositive(deltaStr);

        // --- Layout constants ---
        var pad           = Math.max(10, Math.round(w * 0.05));
        var sparkH        = displaySparkline && sparkValues.length > 1 ? Math.max(18, Math.round(h * 0.14)) : 0;
        var sparkPad      = sparkH > 0 ? 6 : 0;
        var labelFontSize = Math.max(7, Math.round(h * 0.08));
        var valueFontSize = Math.max(22, Math.round(h * 0.38));
        var deltaFontSize = Math.max(10, Math.round(h * 0.12));
        var rx            = 8; // Spotify corner radius

        // Vertical layout: label at top, value in center, delta below value, sparkline at bottom
        var labelY   = pad + labelFontSize;
        var contentH = h - labelY - sparkH - sparkPad - pad;
        var centerY  = labelY + contentH * 0.48 + valueFontSize * 0.36;
        var deltaY   = centerY + valueFontSize * 0.15 + deltaFontSize + 4;

        // --- Clear canvas (transparent bg — panel controls background) ---
        ctx.clearRect(0, 0, w, h);

        // --- Accent glow behind number (on hover) ---
        if (this._hovered && this._gi > 0) {
            var glowRadius = Math.min(w, h) * 0.55;
            var glowAlpha  = 0.12 * this._gi;
            var grad = ctx.createRadialGradient(w * 0.5, centerY - valueFontSize * 0.2, 0, w * 0.5, centerY - valueFontSize * 0.2, glowRadius);
            grad.addColorStop(0,   theme.hexToRgba(accentColor, glowAlpha));
            grad.addColorStop(0.5, theme.hexToRgba(accentColor, glowAlpha * 0.4));
            grad.addColorStop(1,   theme.hexToRgba(accentColor, 0));
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }

        // --- Whisper label (top, uppercase) ---
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.font         = 'bold ' + labelFontSize + 'px ' + fonts.ui;
        ctx.fillStyle    = theme.hexToRgba(t.textMuted || t.text, 0.6);
        ctx.fillText(labelStr.toUpperCase(), pad, labelY);

        // --- Main value (hero number) ---
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.font         = 'bold ' + valueFontSize + 'px ' + fonts.ui;

        // Subtle glow on value text when hovered
        if (this._hovered && this._gi > 0) {
            ctx.shadowColor   = theme.hexToRgba(accentColor, 0.55 * this._gi);
            ctx.shadowBlur    = 18 * this._gi;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        ctx.fillStyle = t.textBright;
        ctx.fillText(displayValue, w * 0.5, centerY);

        // Reset shadow
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // --- Delta trend ---
        if (displayDelta && deltaStr) {
            var deltaColor = positive === true ? accentColor : (positive === false ? t.coral : t.textMuted);

            // Pill background behind delta
            ctx.font = 'bold ' + deltaFontSize + 'px ' + fonts.ui;
            var dtw = ctx.measureText(deltaStr).width;
            var pillW = dtw + deltaFontSize * 1.2;
            var pillH = deltaFontSize * 1.5;
            var pillX = w * 0.5 - pillW * 0.5;
            var pillY = deltaY - deltaFontSize - 2;

            ctx.fillStyle = theme.hexToRgba(deltaColor, 0.12);
            theme.fillRoundRect(ctx, pillX, pillY, pillW, pillH, rx * 0.6);

            // Arrow indicator
            var arrowX = pillX + deltaFontSize * 0.35;
            var arrowCY = pillY + pillH * 0.5;
            var arrowSz = deltaFontSize * 0.38;
            ctx.fillStyle = deltaColor;
            ctx.beginPath();
            if (positive === true) {
                ctx.moveTo(arrowX, arrowCY + arrowSz);
                ctx.lineTo(arrowX + arrowSz, arrowCY - arrowSz);
                ctx.lineTo(arrowX + arrowSz * 2, arrowCY + arrowSz);
            } else if (positive === false) {
                ctx.moveTo(arrowX, arrowCY - arrowSz);
                ctx.lineTo(arrowX + arrowSz, arrowCY + arrowSz);
                ctx.lineTo(arrowX + arrowSz * 2, arrowCY - arrowSz);
            } else {
                // neutral dash
                ctx.rect(arrowX, arrowCY - 1, arrowSz * 2, 2);
            }
            ctx.closePath();
            ctx.fill();

            // Delta text
            ctx.fillStyle    = deltaColor;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.font         = 'bold ' + deltaFontSize + 'px ' + fonts.ui;
            ctx.fillText(deltaStr, w * 0.5 + deltaFontSize * 0.4, pillY + pillH * 0.5);
        }

        // --- Sparkline ---
        if (sparkH > 0 && sparkValues.length > 1) {
            var spY  = h - sparkH - sparkPad * 0.5;
            var spX  = pad;
            var spW  = w - pad * 2;

            // Track line
            ctx.strokeStyle = t.barTrack;
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(spX, spY + sparkH * 0.5);
            ctx.lineTo(spX + spW, spY + sparkH * 0.5);
            ctx.stroke();

            // Gradient fill under sparkline
            var sparkGrad = ctx.createLinearGradient(0, spY, 0, spY + sparkH);
            sparkGrad.addColorStop(0, theme.hexToRgba(accentColor, 0.25));
            sparkGrad.addColorStop(1, theme.hexToRgba(accentColor, 0));

            var ptX0 = spX;
            var ptY0 = spY + sparkH * (1 - sparkValues[0]);

            ctx.fillStyle = sparkGrad;
            ctx.beginPath();
            ctx.moveTo(ptX0, spY + sparkH); // bottom-left
            ctx.lineTo(ptX0, ptY0);

            for (var si = 1; si < sparkValues.length; si++) {
                var ptX = spX + (spW / (sparkValues.length - 1)) * si;
                var ptY = spY + sparkH * (1 - sparkValues[si]);
                ctx.lineTo(ptX, ptY);
            }
            ctx.lineTo(spX + spW, spY + sparkH); // bottom-right
            ctx.closePath();
            ctx.fill();

            // Line stroke on top of fill
            ctx.strokeStyle = accentColor;
            ctx.lineWidth   = 1.5;
            ctx.lineJoin    = 'round';
            ctx.lineCap     = 'round';
            ctx.beginPath();
            ctx.moveTo(ptX0, ptY0);
            for (var si2 = 1; si2 < sparkValues.length; si2++) {
                var ptX2 = spX + (spW / (sparkValues.length - 1)) * si2;
                var ptY2 = spY + sparkH * (1 - sparkValues[si2]);
                ctx.lineTo(ptX2, ptY2);
            }
            ctx.stroke();

            // Terminal dot (last point)
            var lastX = spX + spW;
            var lastY = spY + sparkH * (1 - sparkValues[sparkValues.length - 1]);
            ctx.beginPath();
            ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            if (this._gi > 0) {
                ctx.shadowColor   = theme.hexToRgba(accentColor, 0.7);
                ctx.shadowBlur    = 6 * this._gi;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            ctx.fill();
            ctx.shadowBlur    = 0;
            ctx.shadowColor   = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // Store hit geometry for tooltip
        this._hitZone = {
            valueStr: displayValue,
            labelStr: labelStr,
            deltaStr: deltaStr,
            x: 0, y: 0, w: w, h: h
        };
    },

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        var hz = this._hitZone;
        if (hz && mx >= hz.x && mx <= hz.x + hz.w && my >= hz.y && my <= hz.y + hz.h) {
            this._canvas.style.cursor = 'default';
            var tip = hz.labelStr + ': ' + hz.valueStr;
            if (hz.deltaStr) tip += '  ∆ ' + hz.deltaStr;
            this._tooltip.textContent = tip;
            this._tooltip.style.display = 'block';

            // Keep tooltip inside panel
            var tx = mx + 14;
            var ty = my - 8;
            if (tx + 160 > (this.el.offsetWidth || 300)) tx = mx - 160;
            if (ty < 0) ty = my + 14;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top  = ty + 'px';

            if (!this._hovered) {
                this._hovered = true;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
        } else {
            if (this._hovered) {
                this._hovered = false;
                this._tooltip.style.display = 'none';
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
        }
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        if (this._canvas && this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
