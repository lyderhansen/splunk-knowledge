'use strict';

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('theme');

// ─── helpers ────────────────────────────────────────────────────────────────

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
}

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function clamp(val, lo, hi) {
    return Math.max(lo, Math.min(hi, val));
}

function hexToRgba(hex, alpha) {
    var h = hex.replace('#', '');
    if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}

// Resolve score to zone name and color
function resolveZone(score, thresholds, colors) {
    if (score <= thresholds.low)  return { name: 'MINIMAL',  color: colors.minimal  };
    if (score <= thresholds.med)  return { name: 'LOW',      color: colors.low      };
    if (score <= thresholds.high) return { name: 'ELEVATED', color: colors.elevated };
    return                               { name: 'CRITICAL', color: colors.critical };
}

// ─── module ─────────────────────────────────────────────────────────────────

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.display = 'block';
        this._canvas.style.width = '100%';
        this._canvas.style.height = '100%';
        this.el.appendChild(this._canvas);

        // Tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText = [
            'position:absolute',
            'display:none',
            'pointer-events:none',
            'background:#0F1628',
            'border:1px solid rgba(0,229,204,0.2)',
            'border-radius:2px',
            'padding:6px 10px',
            'font-family:"IBM Plex Mono",monospace',
            'font-size:12px',
            'color:#C8D6E5',
            'white-space:nowrap',
            'z-index:10'
        ].join(';') + ';';
        this.el.appendChild(this._tooltip);

        // Pulse animation state
        this._pulsePhase = 0;
        this._animFrame = null;
        this._isPulsing = false;

        // Cache for reflow
        this._lastData = null;
        this._lastConfig = null;

        // Tooltip hit regions populated during render
        this._hitRegions = [];

        // Mouse events
        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
        });
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
        var result = { colIdx: colIdx, rows: data.rows, fields: fields };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    _render: function(data, config) {
        var t = theme.getTheme();
        var ns = getNS(this);

        // ── Config options ──────────────────────────────────────────────
        var valueField      = getOption(config, ns, 'valueField',      'threat_score');
        var labelField      = getOption(config, ns, 'labelField',      'zone');
        var thresholdLow    = parseInt(getOption(config, ns, 'thresholdLow',  '25'),  10);
        var thresholdMed    = parseInt(getOption(config, ns, 'thresholdMed',  '50'),  10);
        var thresholdHigh   = parseInt(getOption(config, ns, 'thresholdHigh', '75'),  10);
        var accentIntensity = parseFloat(getOption(config, ns, 'accentIntensity', '50'));
        var pulseOnCritical = getOption(config, ns, 'pulseOnCritical', 'true') !== 'false';
        var showBar         = getOption(config, ns, 'showBar',   'true') !== 'false';
        var showLabel       = getOption(config, ns, 'showLabel', 'true') !== 'false';
        var colorMinimal    = getOption(config, ns, 'colorMinimal',  '#475569');
        var colorLow        = getOption(config, ns, 'colorLow',      '#38BDF8');
        var colorElevated   = getOption(config, ns, 'colorElevated', '#D946EF');
        var colorCritical   = getOption(config, ns, 'colorCritical', '#FFB020');

        if (isNaN(thresholdLow))    thresholdLow  = 25;
        if (isNaN(thresholdMed))    thresholdMed  = 50;
        if (isNaN(thresholdHigh))   thresholdHigh = 75;
        if (isNaN(accentIntensity)) accentIntensity = 50;
        accentIntensity = clamp(accentIntensity, 0, 100);

        var thresholds = { low: thresholdLow, med: thresholdMed, high: thresholdHigh };
        var colors     = { minimal: colorMinimal, low: colorLow, elevated: colorElevated, critical: colorCritical };

        // ── Extract value from data ────────────────────────────────────
        var score = null;
        var zoneLabel = null;
        var hasData = data && data.rows && data.rows.length > 0 && data.colIdx;

        if (hasData) {
            var colIdx = data.colIdx;
            var row = data.rows[0];

            var valIdx   = (colIdx[valueField] !== undefined) ? colIdx[valueField] : -1;
            var labelIdx = (colIdx[labelField] !== undefined) ? colIdx[labelField] : -1;

            if (valIdx >= 0 && row[valIdx] !== null && row[valIdx] !== undefined && row[valIdx] !== '') {
                var rawScore = parseFloat(row[valIdx]);
                if (!isNaN(rawScore)) {
                    score = clamp(rawScore, 0, 100);
                }
            }
            if (labelIdx >= 0 && row[labelIdx] !== null && row[labelIdx] !== undefined) {
                zoneLabel = String(row[labelIdx]);
            }
        }

        // ── Canvas setup (HiDPI) ───────────────────────────────────────
        var canvas = this._canvas;
        var w = this.el.offsetWidth  || 300;
        var h = this.el.offsetHeight || 200;
        var dpr = window.devicePixelRatio || 1;

        canvas.width  = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width  = w + 'px';
        canvas.style.height = h + 'px';

        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Clear (transparent bg — Dashboard Studio controls panel bg)
        ctx.clearRect(0, 0, w, h);

        // ── Layout constants (all scale-responsive) ────────────────────
        var refSize    = 300;
        var scale      = Math.min(w, h) / refSize;
        var pad        = Math.max(8,  Math.round(w * 0.05));
        var barH       = Math.max(6,  Math.round(h * 0.06));
        var barY       = showLabel ? h - pad - barH - Math.round(h * 0.10) : h - pad - barH;
        var indicatorH = Math.max(5, Math.round(barH * 1.2));

        // Number zone: top 60% of height
        var numZoneBottom = showBar ? barY - Math.round(h * 0.06) : h - pad;
        var numZoneTop    = pad;
        var numZoneMid    = numZoneTop + (numZoneBottom - numZoneTop) * 0.55;

        // ── Font size — hero scaling ───────────────────────────────────
        // Scale from panel height, floor at 18, cap guided by width
        var heroSize = Math.max(18, Math.min(
            Math.round(h * 0.38),
            Math.round(w * 0.25)
        ));
        var labelFontSize = Math.max(8, Math.round(heroSize * 0.18));

        // ── Determine zone ────────────────────────────────────────────
        var zone = (score !== null) ? resolveZone(score, thresholds, colors) : null;
        var isCritical = zone && zone.name === 'CRITICAL';
        var glowIntensity = accentIntensity / 50; // 0-2, default 1

        // ── DRAW: big number ──────────────────────────────────────────
        var displayValue = (score !== null) ? Math.round(score).toString() : '—';

        ctx.save();
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.font         = '700 ' + heroSize + 'px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';

        if (isCritical && pulseOnCritical && !this._isPulsing) {
            // Static render with fixed glow; pulse loop will handle animation
            var staticGlowAlpha = 0.5 * glowIntensity;
            ctx.shadowColor  = hexToRgba(colorCritical, staticGlowAlpha);
            ctx.shadowBlur   = 18 * glowIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        ctx.fillStyle = '#E8F0FE';
        ctx.fillText(displayValue, w / 2, numZoneMid);

        // Reset shadow
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.restore();

        // ── DRAW: segmented bar ───────────────────────────────────────
        if (showBar) {
            var barX  = pad;
            var barW  = w - pad * 2;
            var totalRange = 100;
            var segments = [
                { lo: 0,                   hi: thresholdLow,  color: colorMinimal  },
                { lo: thresholdLow  + 1,   hi: thresholdMed,  color: colorLow      },
                { lo: thresholdMed  + 1,   hi: thresholdHigh, color: colorElevated },
                { lo: thresholdHigh + 1,   hi: 100,           color: colorCritical }
            ];
            var segGap = Math.max(1, Math.round(scale * 2));
            var totalGaps = segGap * (segments.length - 1);
            var usableBarW = barW - totalGaps;
            var rx = Math.max(1, Math.round(barH / 3));

            ctx.save();
            var curX = barX;
            for (var i = 0; i < segments.length; i++) {
                var seg = segments[i];
                var segRange = seg.hi - seg.lo + 1;
                var segW = Math.round(usableBarW * (segRange / totalRange));

                // Dim inactive segments
                var isActive = zone && (score >= seg.lo && score <= seg.hi);
                ctx.globalAlpha = isActive ? 1.0 : 0.35;
                ctx.fillStyle = seg.color;

                // Rounded rect (ES5 manual implementation)
                _fillRoundRect(ctx, curX, barY, segW, barH, rx);

                ctx.globalAlpha = 1.0;
                curX += segW + segGap;
            }
            ctx.restore();

            // ── DRAW: triangular indicator ────────────────────────────
            if (score !== null) {
                var indicatorX = barX + Math.round(barW * (score / 100));
                indicatorX = clamp(indicatorX, barX + 4, barX + barW - 4);
                var indicatorY = barY - indicatorH - 1;
                var indicatorHalfW = Math.max(3, Math.round(indicatorH * 0.75));

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(indicatorX, barY - 1);                          // tip (pointing down)
                ctx.lineTo(indicatorX - indicatorHalfW, indicatorY);       // top-left
                ctx.lineTo(indicatorX + indicatorHalfW, indicatorY);       // top-right
                ctx.closePath();
                ctx.fillStyle = zone ? zone.color : '#C8D6E5';

                // Subtle glow on indicator matching zone color
                if (zone) {
                    ctx.shadowColor  = hexToRgba(zone.color, 0.6);
                    ctx.shadowBlur   = 6;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
                ctx.restore();
            }

            // ── DRAW: zone label below bar ────────────────────────────
            if (showLabel) {
                var computedLabel = zoneLabel || (zone ? zone.name : (score === null ? 'NO DATA' : ''));
                if (computedLabel) {
                    var labelY = barY + barH + Math.round(h * 0.05);
                    ctx.save();
                    ctx.textAlign    = 'center';
                    ctx.textBaseline = 'top';
                    ctx.font         = '500 ' + labelFontSize + 'px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
                    ctx.fillStyle    = '#4A5875';
                    ctx.letterSpacing = '0.12em';  // may not work everywhere — cosmetic only
                    ctx.fillText(computedLabel.toUpperCase(), w / 2, labelY);
                    ctx.restore();
                }
            }
        }

        // ── Store hit regions for tooltip ──────────────────────────────
        this._hitRegions = [];
        if (score !== null) {
            this._hitRegions.push({
                x1: 0, y1: 0, x2: w, y2: h,
                label: zone ? zone.name : 'Score',
                value: Math.round(score) + ' / 100'
            });
        }
        if (showBar && score !== null && zone) {
            this._hitRegions.push({
                x1: pad, y1: barY, x2: pad + (w - pad * 2), y2: barY + barH,
                label: 'Zone',
                value: zone.name + ' (' + thresholds.low + '-' + thresholds.high + ')'
            });
        }

        // ── Pulse animation management ────────────────────────────────
        if (isCritical && pulseOnCritical && accentIntensity > 0) {
            if (!this._isPulsing) {
                this._isPulsing = true;
                this._pulsePhase = 0;
                this._startPulse(data, config, heroSize, numZoneMid, w, h, dpr, colorCritical, glowIntensity, displayValue);
            }
            // If already pulsing, the loop handles it
        } else {
            if (this._animFrame) {
                cancelAnimationFrame(this._animFrame);
                this._animFrame = null;
            }
            this._isPulsing = false;
        }
    },

    _startPulse: function(data, config, heroSize, numZoneMid, w, h, dpr, criticalColor, glowIntensity, displayValue) {
        var self = this;

        function pulse() {
            if (!self._isPulsing) return;

            // Check canvas dimensions haven't changed (reflow)
            var currentW = self.el.offsetWidth  || 300;
            var currentH = self.el.offsetHeight || 200;
            if (currentW !== w || currentH !== h) {
                // Panel resized — stop this loop, reflow will restart
                self._isPulsing = false;
                self._animFrame = null;
                return;
            }

            self._pulsePhase += 1;
            var sinVal    = Math.sin(self._pulsePhase * 0.031416); // 2s period at 60fps ≈ 120 frames
            var glowAlpha = (0.3 + 0.3 * sinVal) * glowIntensity;
            glowAlpha = clamp(glowAlpha, 0, 1);

            var canvas = self._canvas;
            var ctx    = canvas.getContext('2d');

            // Clear just the number zone (avoid full redraw for perf)
            // We only re-draw the number on top of cleared area
            var pad         = Math.max(8, Math.round(w * 0.05));
            var barH        = Math.max(6, Math.round(h * 0.06));
            var showBar     = true; // already rendered below
            var numZoneTop  = pad;
            var numZoneH    = numZoneMid + heroSize * 0.7 - numZoneTop;

            ctx.clearRect(0, numZoneTop, w, numZoneH);

            ctx.save();
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.font         = '700 ' + heroSize + 'px "IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
            ctx.shadowColor  = hexToRgba(criticalColor, glowAlpha);
            ctx.shadowBlur   = 20 * glowIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle    = '#E8F0FE';
            ctx.fillText(displayValue, w / 2, numZoneMid);
            ctx.shadowBlur   = 0;
            ctx.shadowColor  = 'transparent';
            ctx.restore();

            self._animFrame = requestAnimationFrame(pulse);
        }

        this._animFrame = requestAnimationFrame(pulse);
    },

    _onMouseMove: function(e) {
        var rect   = this._canvas.getBoundingClientRect();
        var mx     = e.clientX - rect.left;
        var my     = e.clientY - rect.top;
        var hit    = null;

        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x1 && mx <= r.x2 && my >= r.y1 && my <= r.y2) {
                hit = r;
                break;
            }
        }

        if (hit) {
            this._tooltip.textContent = hit.label + ': ' + hit.value;
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = (mx + 14) + 'px';
            this._tooltip.style.top  = Math.max(0, my - 10) + 'px';
            this._canvas.style.cursor = 'default';
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor   = 'default';
        }
    },

    reflow: function() {
        if (this._lastData !== null && this._lastConfig !== null) {
            // Stop pulse loop before full re-render to avoid double loop
            if (this._animFrame) {
                cancelAnimationFrame(this._animFrame);
                this._animFrame = null;
            }
            this._isPulsing = false;
            this._render(this._lastData, this._lastConfig);
        }
    },

    remove: function() {
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
        this._isPulsing = false;
        SplunkVisualizationBase.prototype.remove.apply(this, arguments);
    }
});

// ── Private utility: ES5 rounded-rect fill ───────────────────────────────────
// (Defined outside the extend object to avoid B14 scope leakage)
function _fillRoundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
    ctx.fill();
}
