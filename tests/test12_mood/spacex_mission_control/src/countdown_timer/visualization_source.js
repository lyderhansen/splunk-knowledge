/*
 * SpaceX Mission Control — Countdown Timer Visualization
 *
 * Hero visualization: Hawthorne mission control countdown display.
 * Renders a T-minus countdown with DATA GLOW digits, ambient light,
 * crosshair accent lines, and vignette — no borders, merges with void.
 *
 * Expected SPL columns (last row used):
 *   countdown  — "T-00:12:34" or "00:12:34" or seconds as number (required)
 *   label      — string shown below the countdown (optional)
 *   phase      — mission phase string shown top-right (optional)
 */
var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// ── Internal helpers ───────────────────────────────────────────

    /**
     * Normalise the raw countdown value into a display string like "T-00:12:34".
     * Handles:
     *   "T-HH:MM:SS"  — already formatted, strip leading "T-" for digit block
     *   "HH:MM:SS"    — use as-is
     *   numeric (sec) — convert to HH:MM:SS
     */
    function parseCountdown(raw) {
        if (raw === null || raw === undefined || raw === '') {
            return { tPrefix: true, timeStr: '00:00:00', sign: '-', negative: false };
        }

        var s = String(raw).trim();

        // Check for T± prefix
        var hasTPrefix = false;
        var negative = true; // default T- (before launch)
        var sign = '-';

        if (s.charAt(0) === 'T' || s.charAt(0) === 't') {
            hasTPrefix = true;
            if (s.charAt(1) === '+') {
                negative = false;
                sign = '+';
            }
            s = s.substring(2); // strip "T-" or "T+"
        }

        // If it looks like HH:MM:SS
        if (s.indexOf(':') >= 0) {
            return { tPrefix: hasTPrefix, timeStr: s, sign: sign, negative: negative };
        }

        // Numeric seconds
        var totalSec = parseFloat(s);
        if (isNaN(totalSec)) {
            return { tPrefix: false, timeStr: s, sign: sign, negative: false };
        }

        if (totalSec < 0) {
            negative = true;
            sign = '-';
            totalSec = Math.abs(totalSec);
        } else if (hasTPrefix) {
            // already have sign
        } else {
            negative = false;
            sign = '+';
        }

        var h = Math.floor(totalSec / 3600);
        var m = Math.floor((totalSec % 3600) / 60);
        var sec = Math.floor(totalSec % 60);

        function pad2(n) { return n < 10 ? '0' + n : String(n); }
        var timeStr = pad2(h) + ':' + pad2(m) + ':' + pad2(sec);
        return { tPrefix: true, timeStr: timeStr, sign: sign, negative: negative };
    }

    /** Split a HH:MM:SS string into an array of three zero-padded parts. */
    function splitTimeParts(timeStr) {
        var parts = timeStr.split(':');
        while (parts.length < 3) parts.push('00');
        return [
            (parts[0].length < 2 ? '0' + parts[0] : parts[0]).substring(0, 2),
            (parts[1].length < 2 ? '0' + parts[1] : parts[1]).substring(0, 2),
            (parts[2].length < 2 ? '0' + parts[2] : parts[2]).substring(0, 2)
        ];
    }

    /**
     * Draw the colon separator with a subtle pulse encoded via a pre-computed alpha.
     */
    function drawColon(ctx, cx, cy, fontSize, color, alpha) {
        var dotR = Math.max(2, fontSize * 0.07);
        var spread = fontSize * 0.22;
        ctx.beginPath();
        ctx.arc(cx, cy - spread, dotR, 0, 2 * Math.PI);
        ctx.arc(cx, cy + spread, dotR, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }

    /**
     * Draw glowing digit block (two chars) centered at (cx, cy).
     * Renders the glow halo first (large shadow pass), then the crisp white digits.
     */
    function drawGlowDigits(ctx, text, cx, cy, font, glowColor, showGlow, gi) {
        gi = gi !== undefined ? gi : 1;
        ctx.save();
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (showGlow) {
            // Layer 1: wide diffuse halo
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 32 * gi;
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = 0.22 * gi;
            ctx.fillText(text, cx, cy);

            ctx.shadowBlur = 16 * gi;
            ctx.globalAlpha = 0.35 * gi;
            ctx.fillText(text, cx, cy);

            // Reset before crisp pass
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.globalAlpha = 1;
        }

        // Layer 3: crisp white digits
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, cx, cy);

        ctx.restore();
    }

    // ── Visualization ──────────────────────────────────────────────

    module.exports = SplunkVisualizationBase.extend({

        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.el.classList.add('spacex-countdown-viz');

            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = 'width:100%;height:100%;display:block;';
            this.el.appendChild(this.canvas);

            // Tooltip element
            this._tooltip = document.createElement('div');
            this._tooltip.style.cssText = [
                'position:absolute',
                'pointer-events:none',
                'display:none',
                'background:rgba(6,9,16,0.92)',
                'border:1px solid rgba(0,136,204,0.4)',
                'color:#E2E8F0',
                'font-family:"Chakra Petch",sans-serif',
                'font-size:12px',
                'padding:6px 10px',
                'border-radius:3px',
                'z-index:1000',
                'white-space:nowrap'
            ].join(';');
            this.el.style.position = 'relative';
            this.el.appendChild(this._tooltip);

            this._fontReady = false;
            this._fontPending = false;
            this._lastGoodData = null;
            this._colonAlpha = 1;
            this._colonIncreasing = false;
            this._animFrame = null;
            this._boundOnMouseMove = null;
            this._boundOnMouseLeave = null;

            this._startColonPulse();
            this._bindHover();
        },

        _startColonPulse: function() {
            var self = this;
            var PULSE_SPEED = 0.018;
            var MIN_ALPHA = 0.45;

            function tick() {
                if (self._colonIncreasing) {
                    self._colonAlpha += PULSE_SPEED;
                    if (self._colonAlpha >= 1) {
                        self._colonAlpha = 1;
                        self._colonIncreasing = false;
                    }
                } else {
                    self._colonAlpha -= PULSE_SPEED;
                    if (self._colonAlpha <= MIN_ALPHA) {
                        self._colonAlpha = MIN_ALPHA;
                        self._colonIncreasing = true;
                    }
                }
                // Re-render if we have data
                if (self._lastGoodData) {
                    self._renderFrame();
                }
                self._animFrame = requestAnimationFrame(tick);
            }

            self._animFrame = requestAnimationFrame(tick);
        },

        _bindHover: function() {
            var self = this;

            self._boundOnMouseMove = function(e) {
                if (!self._lastGoodData) return;
                var d = self._lastGoodData;
                var rect = self.el.getBoundingClientRect();
                var mx = e.clientX - rect.left;
                var my = e.clientY - rect.top;

                var ttip = self._tooltip;
                var html = '<strong style="color:#00B8D4">' + d.rawDisplay + '</strong>';
                if (d.label) {
                    html += '<br><span style="color:rgba(226,232,240,0.6)">' + d.label + '</span>';
                }
                ttip.innerHTML = html;
                ttip.style.display = 'block';

                var ttW = ttip.offsetWidth;
                var ttH = ttip.offsetHeight;
                var tx = mx + 14;
                var ty = my - 8;
                if (tx + ttW > rect.width - 8) { tx = mx - ttW - 14; }
                if (ty + ttH > rect.height - 8) { ty = my - ttH - 8; }
                ttip.style.left = tx + 'px';
                ttip.style.top = ty + 'px';
            };

            self._boundOnMouseLeave = function() {
                self._tooltip.style.display = 'none';
            };

            self.el.addEventListener('mousemove', self._boundOnMouseMove);
            self.el.addEventListener('mouseleave', self._boundOnMouseLeave);
        },

        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            };
        },

        formatData: function(data, config) {
            if (!data || !data.rows || data.rows.length === 0) {
                if (this._lastGoodData) return this._lastGoodData;
                // Return null to trigger no-data state gracefully
                return null;
            }

            var fields = data.fields;
            var colIdx = {};
            for (var i = 0; i < fields.length; i++) {
                colIdx[fields[i].name] = i;
            }

            var ns = theme.getNS(this);
            var valueField = theme.getOption(config, ns, 'valueField', 'countdown');
            var labelField = theme.getOption(config, ns, 'labelField', 'label');
            var phaseField = theme.getOption(config, ns, 'phaseField', 'phase');

            // Resolve column — try configured name, then fallback aliases
            var valueCol = colIdx[valueField];
            if (valueCol === undefined) valueCol = colIdx['value'];
            if (valueCol === undefined) {
                // Try first non-underscore column
                for (var k = 0; k < fields.length; k++) {
                    if (fields[k].name.charAt(0) !== '_') {
                        valueCol = k;
                        break;
                    }
                }
            }

            var row = data.rows[data.rows.length - 1];
            var rawVal = (valueCol !== undefined) ? row[valueCol] : null;
            var rawLabel = (colIdx[labelField] !== undefined) ? row[colIdx[labelField]] : '';
            var rawPhase = (colIdx[phaseField] !== undefined) ? row[colIdx[phaseField]] : '';

            var parsed = parseCountdown(rawVal);

            var result = {
                rawDisplay: (parsed.tPrefix ? ('T' + parsed.sign) : '') + parsed.timeStr,
                timeStr: parsed.timeStr,
                sign: parsed.sign,
                tPrefix: parsed.tPrefix,
                label: rawLabel ? String(rawLabel) : '',
                phase: rawPhase ? String(rawPhase) : '',
                noData: false
            };

            this._lastGoodData = result;
            return result;
        },

        updateView: function(data, config) {
            var self = this;

            // Resolve config options
            var ns = theme.getNS(this);
            var accentColor  = theme.getOption(config, ns, 'accentColor',   '#0088CC');
            var showGlow     = theme.parseBool(theme.getOption(config, ns, 'showGlow',         'true'),  true);
            var showVignette = theme.parseBool(theme.getOption(config, ns, 'showVignette',     'true'),  true);
            var showAccentLines = theme.parseBool(theme.getOption(config, ns, 'showAccentLines', 'true'), true);
            var themeMode    = theme.getOption(config, ns, 'theme', 'dark');
            var intensity    = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50) / 50;

            this._renderConfig = {
                accentColor: accentColor,
                showGlow: showGlow,
                showVignette: showVignette,
                showAccentLines: showAccentLines,
                themeMode: themeMode,
                intensity: intensity
            };

            if (!data || data.noData) {
                this._lastGoodData = {
                    rawDisplay: 'T-00:00:00',
                    timeStr: '00:00:00',
                    sign: '-',
                    tPrefix: true,
                    label: '',
                    phase: '',
                    noData: true
                };
            } else {
                this._lastGoodData = data;
            }

            if (!this._fontReady && !this._fontPending) {
                this._fontPending = true;
                theme.loadFonts(function() {
                    self._fontReady = true;
                    self._renderFrame();
                });
                return;
            }

            this._renderFrame();
        },

        _renderFrame: function() {
            var self = this;
            var data = self._lastGoodData;
            var cfg  = self._renderConfig;
            if (!cfg) return;

            var el = self.el;
            var rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;

            var dpr = window.devicePixelRatio || 1;
            self.canvas.width  = Math.round(rect.width  * dpr);
            self.canvas.height = Math.round(rect.height * dpr);
            var ctx = self.canvas.getContext('2d');
            if (!ctx) return;
            ctx.scale(dpr, dpr);

            var w = rect.width;
            var h = rect.height;

            var t = theme.getTheme(cfg.themeMode);
            var accent = cfg.accentColor || t.accent;
            var glowColor = t.glow;
            var gi = cfg.intensity !== undefined ? cfg.intensity : 1;

            ctx.clearRect(0, 0, w, h);

            theme.drawAmbientLight(ctx, w, h, accent, 0.07 * gi);

            if (cfg.showAccentLines) {
                theme.drawAccentLines(ctx, w, h, accent, 0.06 * gi);
            }

            // ── Sizing ──
            var isNoData = !data || data.noData;
            var timeStr  = (data && data.timeStr) ? data.timeStr : '00:00:00';
            var sign     = (data && data.sign)    ? data.sign    : '-';
            var tPrefix  = (data && data.tPrefix !== false);
            var label    = (data && data.label)   ? data.label   : (isNoData ? 'AWAITING SIGNAL' : '');
            var phase    = (data && data.phase)   ? data.phase   : '';

            var parts = splitTimeParts(timeStr);
            var hh = parts[0];
            var mm = parts[1];
            var ss = parts[2];

            // Digit font size: fill most of panel height (leave room for label below)
            var labelH = Math.max(18, h * 0.12);
            var phaseH = phase ? Math.max(16, h * 0.08) : 0;
            var topPad = Math.max(12, h * 0.1);
            var availH = h - topPad - labelH - 10;

            var digitFontSize = Math.max(20, Math.min(availH * 0.85, w * 0.18));
            var digitFont = 'bold ' + digitFontSize + 'px ' + theme.MONO_FONT;

            // T- prefix font (smaller, Chakra Petch SemiBold)
            var prefixFontSize = Math.max(14, digitFontSize * 0.38);
            var prefixFont = '600 ' + prefixFontSize + 'px ' + theme.DISPLAY_FONT;

            // Measure widths to compute layout
            ctx.font = digitFont;
            var digW  = ctx.measureText('00').width;
            var colonSpacing = digitFontSize * 0.18;
            var colonW = colonSpacing * 2;

            // Full row = [T-prefix] [HH] [:] [MM] [:] [SS]
            ctx.font = prefixFont;
            var prefixW = tPrefix ? ctx.measureText('T' + sign).width + digitFontSize * 0.12 : 0;

            var totalRowW = prefixW + digW + colonW + digW + colonW + digW;

            // Scale down if necessary
            var scaleF = 1;
            if (totalRowW > w * 0.94) {
                scaleF = (w * 0.94) / totalRowW;
                digitFontSize = digitFontSize * scaleF;
                prefixFontSize = prefixFontSize * scaleF;
                digitFont = 'bold ' + digitFontSize + 'px ' + theme.MONO_FONT;
                prefixFont = '600 ' + prefixFontSize + 'px ' + theme.DISPLAY_FONT;
                ctx.font = digitFont;
                digW = ctx.measureText('00').width;
                colonSpacing = digitFontSize * 0.18;
                colonW = colonSpacing * 2;
                ctx.font = prefixFont;
                prefixW = tPrefix ? ctx.measureText('T' + sign).width + digitFontSize * 0.12 : 0;
                totalRowW = prefixW + digW + colonW + digW + colonW + digW;
            }

            var rowCenterY = topPad + availH / 2;
            var rowStartX = (w - totalRowW) / 2;

            // ── T- prefix ──
            if (tPrefix) {
                ctx.save();
                ctx.font = prefixFont;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isNoData ? theme.withAlpha(t.text, 0.28) : theme.withAlpha(t.text, 0.72);
                ctx.fillText('T' + sign, rowStartX, rowCenterY - digitFontSize * 0.05);
                ctx.restore();
            }

            // ── Digit blocks with glow ──
            var digitAlpha = isNoData ? 0.3 : 1;
            var effectiveGlow = cfg.showGlow && !isNoData;

            var curX = rowStartX + prefixW;
            var hhCx = curX + digW / 2;
            curX += digW;
            var colon1X = curX + colonW / 2;
            curX += colonW;
            var mmCx = curX + digW / 2;
            curX += digW;
            var colon2X = curX + colonW / 2;
            curX += colonW;
            var ssCx = curX + digW / 2;

            // Save for tooltip hit detection (full panel = single hit zone)
            // HH
            if (isNoData) {
                ctx.save();
                ctx.font = digitFont;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme.withAlpha(t.text, 0.28);
                ctx.fillText(hh, hhCx, rowCenterY);
                ctx.restore();
            } else {
                drawGlowDigits(ctx, hh, hhCx, rowCenterY, digitFont, glowColor, effectiveGlow, gi);
            }

            // Colon 1
            drawColon(ctx, colon1X, rowCenterY, digitFontSize, isNoData ? theme.withAlpha(t.text, 0.28) : glowColor, self._colonAlpha);

            // MM
            if (isNoData) {
                ctx.save();
                ctx.font = digitFont;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme.withAlpha(t.text, 0.28);
                ctx.fillText(mm, mmCx, rowCenterY);
                ctx.restore();
            } else {
                drawGlowDigits(ctx, mm, mmCx, rowCenterY, digitFont, glowColor, effectiveGlow, gi);
            }

            // Colon 2
            drawColon(ctx, colon2X, rowCenterY, digitFontSize, isNoData ? theme.withAlpha(t.text, 0.28) : glowColor, self._colonAlpha);

            // SS
            if (isNoData) {
                ctx.save();
                ctx.font = digitFont;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme.withAlpha(t.text, 0.28);
                ctx.fillText(ss, ssCx, rowCenterY);
                ctx.restore();
            } else {
                drawGlowDigits(ctx, ss, ssCx, rowCenterY, digitFont, glowColor, effectiveGlow, gi);
            }

            // ── Label below countdown ──
            if (label) {
                var labelFontSize = Math.max(10, Math.min(labelH * 0.55, w * 0.025));
                var labelY = topPad + availH + labelH * 0.55;
                ctx.save();
                ctx.font = '400 ' + labelFontSize + 'px ' + theme.DISPLAY_FONT;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme.withAlpha(t.text, 0.30);
                // Spaced tracking for HUD feel
                theme.drawSpacedText(ctx, label.toUpperCase(), w / 2, labelY, labelFontSize * 0.12);
                ctx.restore();
            }

            // ── Phase badge top-right ──
            if (phase) {
                var phaseFontSize = Math.max(9, Math.min(14, w * 0.022));
                var phasePad = phaseFontSize * 0.6;
                ctx.save();
                ctx.font = '600 ' + phaseFontSize + 'px ' + theme.DISPLAY_FONT;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                var phaseText = phase.toUpperCase();
                var phaseTextW = ctx.measureText(phaseText).width;
                var phaseBoxW = phaseTextW + phasePad * 2;
                var phaseBoxH = phaseFontSize + phasePad;
                var phaseX = w - phaseBoxW - 10;
                var phaseY = 10;
                // Badge background
                theme.roundRect(ctx, phaseX, phaseY, phaseBoxW, phaseBoxH, 2);
                ctx.fillStyle = theme.withAlpha(accent, 0.12);
                ctx.fill();
                // Badge border
                theme.roundRect(ctx, phaseX + 0.5, phaseY + 0.5, phaseBoxW - 1, phaseBoxH - 1, 2);
                ctx.strokeStyle = theme.withAlpha(accent, 0.35);
                ctx.lineWidth = 1;
                ctx.stroke();
                // Badge text
                ctx.fillStyle = theme.withAlpha(accent, 0.85);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(phaseText, phaseX + phaseBoxW / 2, phaseY + phaseBoxH / 2);
                ctx.restore();
            }

            // ── Vignette last so it darkens edges without affecting glow halos ──
            if (cfg.showVignette) {
                theme.drawVignette(ctx, w, h, 0.45 * gi);
            }
        },

        reflow: function() {
            this._renderFrame();
        },

        destroy: function() {
            if (this._animFrame) {
                cancelAnimationFrame(this._animFrame);
                this._animFrame = null;
            }
            if (this._boundOnMouseMove) {
                this.el.removeEventListener('mousemove', this._boundOnMouseMove);
            }
            if (this._boundOnMouseLeave) {
                this.el.removeEventListener('mouseleave', this._boundOnMouseLeave);
            }
            SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
        }
    });
