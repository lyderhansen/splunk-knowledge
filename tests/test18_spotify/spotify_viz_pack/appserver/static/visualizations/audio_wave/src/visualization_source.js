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

// Format a numeric value compactly or with explicit decimals
function fmtDisplay(raw) {
    var str = String(raw);
    if (!str || str === '' || str === 'null' || str === 'undefined') return '';
    var num = parseFloat(str);
    if (isNaN(num)) return str;
    return theme.fmtNum(num, { compact: true });
}

// ---------------------------------------------------------------------------
// Bar configuration — 7 bars, center tallest (equalizer silhouette)
// Each bar has: baseRatio, amplitude, freq, phase
// baseRatio: fraction of available height that is the midpoint (0-1)
// amplitude: fraction of available height to oscillate above/below
// freq: oscillation frequency multiplier (relative to base speed)
// phase: phase offset in radians
// ---------------------------------------------------------------------------

var BAR_PROFILES_7 = [
    { baseRatio: 0.45, amplitude: 0.22, freq: 1.17, phase: 0.00 },
    { baseRatio: 0.58, amplitude: 0.28, freq: 0.93, phase: 0.72 },
    { baseRatio: 0.72, amplitude: 0.32, freq: 1.08, phase: 1.40 },
    { baseRatio: 0.80, amplitude: 0.36, freq: 1.00, phase: 2.10 }, // center — tallest
    { baseRatio: 0.72, amplitude: 0.32, freq: 1.05, phase: 0.85 },
    { baseRatio: 0.58, amplitude: 0.28, freq: 1.22, phase: 1.90 },
    { baseRatio: 0.45, amplitude: 0.22, freq: 0.88, phase: 0.30 }
];

var BAR_PROFILES_5 = [
    { baseRatio: 0.52, amplitude: 0.26, freq: 1.10, phase: 0.00 },
    { baseRatio: 0.68, amplitude: 0.30, freq: 0.95, phase: 0.90 },
    { baseRatio: 0.82, amplitude: 0.36, freq: 1.00, phase: 1.80 }, // center
    { baseRatio: 0.68, amplitude: 0.30, freq: 1.15, phase: 0.60 },
    { baseRatio: 0.52, amplitude: 0.26, freq: 0.87, phase: 1.30 }
];

var BAR_PROFILES_9 = [
    { baseRatio: 0.38, amplitude: 0.18, freq: 1.20, phase: 0.00 },
    { baseRatio: 0.48, amplitude: 0.24, freq: 1.05, phase: 0.55 },
    { baseRatio: 0.60, amplitude: 0.28, freq: 0.92, phase: 1.10 },
    { baseRatio: 0.70, amplitude: 0.32, freq: 1.08, phase: 1.65 },
    { baseRatio: 0.78, amplitude: 0.36, freq: 1.00, phase: 2.20 }, // center
    { baseRatio: 0.70, amplitude: 0.32, freq: 1.12, phase: 0.80 },
    { baseRatio: 0.60, amplitude: 0.28, freq: 0.96, phase: 1.35 },
    { baseRatio: 0.48, amplitude: 0.24, freq: 1.18, phase: 1.90 },
    { baseRatio: 0.38, amplitude: 0.18, freq: 0.85, phase: 0.40 }
];

var SPEED_MULTIPLIERS = {
    slow: 0.55,
    normal: 1.00,
    fast: 1.75
};

function getBarProfiles(count) {
    var n = parseInt(count, 10);
    if (n === 5) return BAR_PROFILES_5;
    if (n === 9) return BAR_PROFILES_9;
    return BAR_PROFILES_7; // default
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

        // Tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 12px;' +
            'border-radius:6px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-size:12px;line-height:1.4;';
        this.el.appendChild(this._tooltip);

        // Animation state
        this._animFrame = null;
        this._startTime = null;

        // Cached render state (set during each _renderFrame call)
        this._barRects = []; // hit zones: [{x, y, w, h, barIndex}]

        // Hover state
        this._hoverBarIndex = -1;

        // Cache for reflow and anim loop
        this._lastData = null;
        this._lastConfig = null;
        this._lastGoodData = null;

        // Parsed config cache (set in updateView, read in anim loop)
        this._accentColor = '#1DB954';
        this._gi = 1; // accent intensity 0-2
        this._showGlow = true;
        this._showReflection = true;
        this._profiles = BAR_PROFILES_7;
        this._speedMult = 1.0;
        this._valueScale = 1.0; // driven by data value

        // Event listeners
        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._hoverBarIndex = -1;
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
        });

        // MutationObserver: suppress Splunk "no results" placeholder
        this._observer = new MutationObserver(function() {
            var nodes = self.el.querySelectorAll(
                '.viz-placeholder, .shared-viz-no-results, ' +
                '[data-test="viz-no-results"], .viz-controller-no-results'
            );
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].style.display = 'none';
            }
        });
        this._observer.observe(this.el, { childList: true, subtree: true });
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 1
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
        this._lastData = data;
        this._lastConfig = config;

        var ns = getNS(this);

        // --- Parse all config options ---
        var valueField    = getOption(config, ns, 'valueField',      'value');
        var labelField    = getOption(config, ns, 'labelField',      'label');
        var statusField   = getOption(config, ns, 'statusField',     'status');
        var barCount      = getOption(config, ns, 'barCount',        '7');
        this._accentColor = getOption(config, ns, 'accentColor',     '#1DB954');
        var accentInt     = getOption(config, ns, 'accentIntensity', '50');
        var animSpeed     = getOption(config, ns, 'animationSpeed',  'normal');
        var showGlowStr   = getOption(config, ns, 'showGlow',        'true');
        var showReflStr   = getOption(config, ns, 'showReflection',  'true');

        var giRaw = parseFloat(accentInt);
        if (isNaN(giRaw)) giRaw = 50;
        this._gi = Math.max(0, Math.min(100, giRaw)) / 50;

        this._showGlow       = (showGlowStr !== 'false' && showGlowStr !== false);
        this._showReflection = (showReflStr !== 'false' && showReflStr !== false);
        this._profiles       = getBarProfiles(barCount);
        this._speedMult      = SPEED_MULTIPLIERS[animSpeed] || 1.0;

        // --- Extract data values ---
        this._displayValue  = '';
        this._displayLabel  = '';
        this._displayStatus = '';
        this._valueScale    = 1.0;

        if (data && data.colIdx && data.rows && data.rows.length > 0) {
            var row    = data.rows[0];
            var colIdx = data.colIdx;

            if (colIdx[valueField] !== undefined) {
                var raw = row[colIdx[valueField]];
                this._displayValue = fmtDisplay(raw);
                // Scale bar heights by value: normalize 0-1 based on typical stream counts
                // We use log scale for wide ranges; default to 1.0 if not numeric
                var num = parseFloat(String(raw));
                if (!isNaN(num) && num > 0) {
                    // Treat up to 50M as full scale (adjust per domain)
                    this._valueScale = Math.min(1.0, Math.max(0.3, Math.log(num + 1) / Math.log(5e7 + 1)));
                }
            }
            if (colIdx[labelField] !== undefined) {
                this._displayLabel = String(row[colIdx[labelField]]);
            }
            if (colIdx[statusField] !== undefined) {
                this._displayStatus = String(row[colIdx[statusField]]);
            }
        }

        // --- Restart animation ---
        this._stopAnimation();
        this._startAnimation();
    },

    // -------------------------------------------------------------------------
    // Animation loop
    // -------------------------------------------------------------------------

    _startAnimation: function() {
        var self = this;
        this._startTime = null;

        function loop(ts) {
            if (!self._startTime) self._startTime = ts;
            var elapsed = (ts - self._startTime) / 1000; // seconds
            self._renderFrame(elapsed);
            self._animFrame = requestAnimationFrame(loop);
        }

        this._animFrame = requestAnimationFrame(loop);
    },

    _stopAnimation: function() {
        if (this._animFrame !== null) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
    },

    // -------------------------------------------------------------------------
    // Per-frame render
    // -------------------------------------------------------------------------

    _renderFrame: function(elapsed) {
        var w = this.el.offsetWidth  || 300;
        var h = this.el.offsetHeight || 200;

        // HiDPI scaling
        var dpr = window.devicePixelRatio || 1;
        if (this._canvas.width !== Math.round(w * dpr) || this._canvas.height !== Math.round(h * dpr)) {
            this._canvas.width        = Math.round(w * dpr);
            this._canvas.height       = Math.round(h * dpr);
            this._canvas.style.width  = w + 'px';
            this._canvas.style.height = h + 'px';
        }

        var ctx = this._canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Theme
        var mode = theme.detectTheme(this.el);
        var t    = theme.getTheme(mode);
        var fonts = theme.getFonts();

        // Style tooltip
        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color      = t.textBright;
        this._tooltip.style.fontFamily = fonts.ui;
        this._tooltip.style.border     = '1px solid ' + theme.hexToRgba(this._accentColor, 0.35);

        // Clear
        ctx.clearRect(0, 0, w, h);

        // --- Layout ---
        var pad         = Math.max(10, Math.round(w * 0.05));
        var statusH     = this._displayStatus ? Math.max(11, Math.round(h * 0.10)) : 0;
        var valueH      = this._displayValue  ? Math.max(16, Math.round(h * 0.14)) : 0;
        var labelH      = this._displayLabel  ? Math.max(10, Math.round(h * 0.09)) : 0;
        var reflH       = this._showReflection ? Math.max(10, Math.round(h * 0.14)) : 0;
        var topPad      = pad + statusH + (statusH > 0 ? 6 : 0) + (valueH > 0 ? valueH + 4 : 0);
        var botPad      = pad + labelH + (labelH > 0 ? 6 : 0) + reflH;
        var barsAreaH   = Math.max(20, h - topPad - botPad);
        var barsAreaY   = topPad;

        var profiles    = this._profiles;
        var numBars     = profiles.length;
        var totalW      = w - pad * 2;
        // barWidth + gap = totalW / numBars; gap = barWidth * 0.4 => barWidth * 1.4 = totalW / numBars
        var barWidth    = Math.max(4, totalW / (numBars * 1.4));
        var gap         = barWidth * 0.4;
        var groupW      = barWidth * numBars + gap * (numBars - 1);
        var startX      = (w - groupW) / 2;

        // --- Draw reflection (mirror of bars below floor, faded) ---
        if (this._showReflection && reflH > 0) {
            var floorY = barsAreaY + barsAreaH;
            for (var ri = 0; ri < numBars; ri++) {
                var rp     = profiles[ri];
                var rPhase = rp.phase;
                var rFreq  = rp.freq * this._speedMult;
                var rSine  = Math.sin(elapsed * rFreq * 1.8 + rPhase);
                var rH     = (rp.baseRatio + rp.amplitude * rSine) * barsAreaH * this._valueScale;
                rH         = Math.max(4, rH);
                var rx2    = startX + ri * (barWidth + gap);
                var rReflH = Math.min(reflH, rH * 0.35);
                var rRadius = Math.min(barWidth * 0.5, rReflH * 0.5);

                // Reflection gradient: accent → transparent downward
                var reflGrad = ctx.createLinearGradient(0, floorY, 0, floorY + rReflH);
                reflGrad.addColorStop(0,   theme.hexToRgba(this._accentColor, 0.18 * this._gi));
                reflGrad.addColorStop(1,   theme.hexToRgba(this._accentColor, 0));
                ctx.fillStyle = reflGrad;

                // Draw reflected pill (rounded bottom only)
                var rrx = rx2;
                var rry = floorY;
                var rrw = barWidth;
                var rrh = rReflH;
                ctx.beginPath();
                ctx.moveTo(rrx, rry);
                ctx.lineTo(rrx + rrw, rry);
                ctx.lineTo(rrx + rrw, rry + rrh - rRadius);
                ctx.arcTo(rrx + rrw, rry + rrh, rrx + rrw - rRadius, rry + rrh, rRadius);
                ctx.arcTo(rrx, rry + rrh, rrx, rry + rrh - rRadius, rRadius);
                ctx.lineTo(rrx, rry);
                ctx.closePath();
                ctx.fill();
            }
        }

        // --- Draw bars ---
        var newBarRects = [];

        for (var bi = 0; bi < numBars; bi++) {
            var bp     = profiles[bi];
            var bPhase = bp.phase;
            var bFreq  = bp.freq * this._speedMult;

            // Sine oscillation: slow undulation
            var bSine  = Math.sin(elapsed * bFreq * 1.8 + bPhase);
            var bH     = (bp.baseRatio + bp.amplitude * bSine) * barsAreaH * this._valueScale;
            bH         = Math.max(6, bH);

            var bx     = startX + bi * (barWidth + gap);
            var by     = barsAreaY + barsAreaH - bH;
            var bRadius = Math.min(barWidth * 0.5, bH * 0.5);

            var isHovered = (this._hoverBarIndex === bi);

            // Glow behind bar
            if (this._showGlow && this._gi > 0) {
                var glowIntensity = isHovered ? Math.min(1.0, this._gi * 1.4) : this._gi * 0.65;
                ctx.shadowColor   = theme.hexToRgba(this._accentColor, 0.55 * glowIntensity);
                ctx.shadowBlur    = barWidth * 1.8 * glowIntensity;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }

            // Bar fill: vertical gradient from accent at bottom to accentHover at top
            var barGrad = ctx.createLinearGradient(bx, by, bx, by + bH);
            if (isHovered) {
                barGrad.addColorStop(0, '#1ED760'); // accentHover
                barGrad.addColorStop(0.5, this._accentColor);
                barGrad.addColorStop(1, theme.hexToRgba(this._accentColor, 0.75));
            } else {
                barGrad.addColorStop(0, theme.hexToRgba(this._accentColor, 0.80));
                barGrad.addColorStop(0.4, this._accentColor);
                barGrad.addColorStop(1, theme.hexToRgba(this._accentColor, 0.60));
            }
            ctx.fillStyle = barGrad;

            // Rounded pill shape (both ends)
            ctx.beginPath();
            if (bH < barWidth) {
                // Very short bar: full circle
                ctx.arc(bx + barWidth / 2, by + bH / 2, bH / 2, 0, Math.PI * 2);
            } else {
                ctx.moveTo(bx + bRadius, by);
                ctx.arcTo(bx + barWidth, by, bx + barWidth, by + bRadius, bRadius);
                ctx.lineTo(bx + barWidth, by + bH - bRadius);
                ctx.arcTo(bx + barWidth, by + bH, bx + barWidth - bRadius, by + bH, bRadius);
                ctx.arcTo(bx, by + bH, bx, by + bH - bRadius, bRadius);
                ctx.lineTo(bx, by + bRadius);
                ctx.arcTo(bx, by, bx + bRadius, by, bRadius);
            }
            ctx.closePath();
            ctx.fill();

            // Reset shadow
            ctx.shadowBlur    = 0;
            ctx.shadowColor   = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Highlight sheen on left edge (inner light)
            var sheenGrad = ctx.createLinearGradient(bx, 0, bx + barWidth, 0);
            sheenGrad.addColorStop(0,    'rgba(255,255,255,0.18)');
            sheenGrad.addColorStop(0.35, 'rgba(255,255,255,0.04)');
            sheenGrad.addColorStop(1,    'rgba(255,255,255,0)');
            ctx.fillStyle = sheenGrad;
            ctx.beginPath();
            if (bH < barWidth) {
                ctx.arc(bx + barWidth / 2, by + bH / 2, bH / 2, 0, Math.PI * 2);
            } else {
                ctx.moveTo(bx + bRadius, by);
                ctx.arcTo(bx + barWidth, by, bx + barWidth, by + bRadius, bRadius);
                ctx.lineTo(bx + barWidth, by + bH - bRadius);
                ctx.arcTo(bx + barWidth, by + bH, bx + barWidth - bRadius, by + bH, bRadius);
                ctx.arcTo(bx, by + bH, bx, by + bH - bRadius, bRadius);
                ctx.lineTo(bx, by + bRadius);
                ctx.arcTo(bx, by, bx + bRadius, by, bRadius);
            }
            ctx.closePath();
            ctx.fill();

            // Store hit rect (use extended area for easier hover)
            newBarRects.push({
                x:        bx - gap * 0.5,
                y:        barsAreaY,
                w:        barWidth + gap,
                h:        barsAreaH,
                barIndex: bi,
                barH:     bH
            });
        }

        this._barRects = newBarRects;

        // --- Status text (above bars, e.g. "NOW PLAYING") ---
        if (this._displayStatus) {
            var statusFontSz = Math.max(8, statusH * 0.70);
            ctx.font         = '600 ' + statusFontSz + 'px ' + fonts.ui;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle    = theme.hexToRgba(this._accentColor, 0.90);

            // Subtle letter-spacing effect via wider tracking (measure and space out)
            var statusText = this._displayStatus.toUpperCase();
            ctx.fillText(statusText, w * 0.5, pad + statusH * 0.85);
        }

        // --- Value text (below status, above bars) ---
        if (this._displayValue) {
            var valFontSz  = Math.max(13, valueH * 0.78);
            var valY       = pad + statusH + (statusH > 0 ? 6 : 0) + valFontSz;
            ctx.font       = 'bold ' + valFontSz + 'px ' + fonts.ui;
            ctx.textAlign  = 'center';
            ctx.textBaseline = 'alphabetic';

            // Glow on value
            if (this._showGlow && this._gi > 0) {
                ctx.shadowColor   = theme.hexToRgba(this._accentColor, 0.40 * this._gi);
                ctx.shadowBlur    = 10 * this._gi;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            ctx.fillStyle = t.textBright;
            ctx.fillText(this._displayValue, w * 0.5, valY);
            ctx.shadowBlur    = 0;
            ctx.shadowColor   = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // --- Label text (below bars) ---
        if (this._displayLabel) {
            var lblFontSz  = Math.max(8, labelH * 0.72);
            var lblY       = h - pad - (reflH > 0 ? reflH + 4 : 0);
            ctx.font       = '500 ' + lblFontSz + 'px ' + fonts.ui;
            ctx.textAlign  = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle  = theme.hexToRgba(t.text, 0.60);
            ctx.fillText(this._displayLabel.toUpperCase(), w * 0.5, lblY);
        }

        // --- Ambient glow pulse on canvas (very subtle, always-on) ---
        // Only render when gi > 0.4 to avoid visual noise at low intensity
        if (this._showGlow && this._gi > 0.4) {
            var pulseAlpha = 0.025 * this._gi * (0.7 + 0.3 * Math.sin(elapsed * 1.2));
            var cxCenter   = w * 0.5;
            var cyCenter   = barsAreaY + barsAreaH * 0.5;
            var glowR      = Math.min(w, barsAreaH) * 0.7;
            var ambientGrad = ctx.createRadialGradient(cxCenter, cyCenter, 0, cxCenter, cyCenter, glowR);
            ambientGrad.addColorStop(0,   theme.hexToRgba(this._accentColor, pulseAlpha));
            ambientGrad.addColorStop(0.6, theme.hexToRgba(this._accentColor, pulseAlpha * 0.4));
            ambientGrad.addColorStop(1,   theme.hexToRgba(this._accentColor, 0));
            ctx.fillStyle = ambientGrad;
            ctx.fillRect(0, barsAreaY, w, barsAreaH);
        }
    },

    // -------------------------------------------------------------------------
    // Mouse interaction
    // -------------------------------------------------------------------------

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        var hitIdx = -1;
        for (var i = 0; i < this._barRects.length; i++) {
            var r = this._barRects[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                hitIdx = r.barIndex;
                break;
            }
        }

        if (hitIdx !== this._hoverBarIndex) {
            this._hoverBarIndex = hitIdx;
        }

        if (hitIdx >= 0) {
            this._canvas.style.cursor = 'default';
            var tip = 'Bar ' + (hitIdx + 1) + ' of ' + this._barRects.length;
            if (this._displayValue) {
                tip = (this._displayLabel || 'Value') + ': ' + this._displayValue;
            }
            this._tooltip.textContent = tip;
            this._tooltip.style.display = 'block';

            var tx = mx + 14;
            var ty = my - 28;
            if (tx + 160 > (this.el.offsetWidth || 300)) tx = mx - 170;
            if (ty < 0) ty = my + 14;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top  = ty + 'px';
        } else {
            this._tooltip.style.display = 'none';
        }
    },

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    reflow: function() {
        // Animation loop already re-reads el.offsetWidth/Height each frame;
        // just ensure canvas size is refreshed on next frame.
        // If animation was stopped (edge case), restart it.
        if (this._animFrame === null && this._lastData !== null) {
            this._startAnimation();
        }
    },

    destroy: function() {
        this._stopAnimation();
        if (this._observer) {
            this._observer.disconnect();
        }
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        if (this._canvas && this._canvas.parentNode) {
            this._canvas.parentNode.removeChild(this._canvas);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
