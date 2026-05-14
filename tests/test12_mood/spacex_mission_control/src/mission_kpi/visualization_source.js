// SpaceX Mission Control — mission_kpi visualization
// Single-value KPI tile for mission statistics
// ES5 strict: var, function(), string concatenation only

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

module.exports = SplunkVisualizationBase.extend({

        // ----------------------------------------------------------------
        // Lifecycle
        // ----------------------------------------------------------------

        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

            // Canvas
            this.canvas = document.createElement('canvas');
            this.canvas.style.display = 'block';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.el.appendChild(this.canvas);

            // Tooltip
            this._tooltip = document.createElement('div');
            this._tooltip.style.cssText =
                'position:absolute;display:none;padding:5px 10px;' +
                'background:rgba(6,9,16,0.92);color:#E2E8F0;font-size:11px;' +
                'border-radius:2px;pointer-events:none;white-space:nowrap;' +
                'z-index:100;font-family:"Chakra Petch",sans-serif;letter-spacing:0.03em;' +
                'border:1px solid rgba(0,136,204,0.25);' +
                'box-shadow:0 2px 8px rgba(0,0,0,0.5);';
            this.el.style.position = 'relative';
            this.el.appendChild(this._tooltip);

            this._hitPanel = null;
            this._lastData = null;
            this._lastConfig = null;
            this._fontsReady = false;

            var self = this;
            this.canvas.addEventListener('mousemove', function(e) {
                self._onMouseMove(e);
            });
            this.canvas.addEventListener('mouseleave', function() {
                self._tooltip.style.display = 'none';
                self.canvas.style.cursor = 'default';
            });
        },

        // ----------------------------------------------------------------
        // Data params
        // ----------------------------------------------------------------

        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 1
            };
        },

        // ----------------------------------------------------------------
        // Update
        // ----------------------------------------------------------------

        updateView: function(data, config) {
            this._lastData = data;
            this._lastConfig = config;

            var self = this;
            if (!this._fontsReady) {
                theme.loadFonts(function() {
                    self._fontsReady = true;
                    self._render(self._lastData, self._lastConfig);
                });
                return;
            }
            this._render(data, config);
        },

        // ----------------------------------------------------------------
        // Main render
        // ----------------------------------------------------------------

        _render: function(data, config) {
            var canvas = this.canvas;
            var dpr = window.devicePixelRatio || 1;
            var cssW = this.el.offsetWidth;
            var cssH = this.el.offsetHeight;
            if (cssW < 1 || cssH < 1) return;

            canvas.width = Math.round(cssW * dpr);
            canvas.height = Math.round(cssH * dpr);

            var ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            var w = cssW;
            var h = cssH;

            // Config
            var ns = theme.getNS(this);
            var themeName = theme.getOption(config, ns, 'theme', 'dark');
            var t = theme.getTheme(themeName);

            var valueField   = theme.getOption(config, ns, 'valueField', 'value');
            var labelField   = theme.getOption(config, ns, 'labelField', 'label');
            var unitField    = theme.getOption(config, ns, 'unitField', 'unit');
            var trendField   = theme.getOption(config, ns, 'trendField', 'trend');
            var decimals     = theme.parseNum(theme.getOption(config, ns, 'decimals', '-1'), -1);
            var accentHex    = theme.getOption(config, ns, 'accentColor', '#0088CC');
            var gi           = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50) / 50;
            var warnThr      = theme.getOption(config, ns, 'warnThreshold', '');
            var dangerThr    = theme.getOption(config, ns, 'dangerThreshold', '');
            var showTrend    = theme.parseBool(theme.getOption(config, ns, 'showTrend', 'true'), true);

            // Extract data fields
            var rawValueStr  = '—';
            var rawLabelStr  = 'AWAITING DATA';
            var rawUnitStr   = '';
            var rawTrendNum  = null;
            var hasData      = false;

            if (data && data.rows && data.rows.length > 0 && data.fields && data.fields.length > 0) {
                hasData = true;
                var row = data.rows[0];
                var fieldNames = [];
                for (var fi = 0; fi < data.fields.length; fi++) {
                    fieldNames.push(data.fields[fi].name);
                }

                var vIdx = fieldNames.indexOf(valueField);
                var lIdx = fieldNames.indexOf(labelField);
                var uIdx = fieldNames.indexOf(unitField);
                var trIdx = fieldNames.indexOf(trendField);

                if (vIdx >= 0 && row[vIdx] !== null && row[vIdx] !== undefined) {
                    rawValueStr = String(row[vIdx]);
                }
                if (lIdx >= 0 && row[lIdx] !== null && row[lIdx] !== undefined) {
                    rawLabelStr = String(row[lIdx]).toUpperCase();
                }
                if (uIdx >= 0 && row[uIdx] !== null && row[uIdx] !== undefined) {
                    rawUnitStr = String(row[uIdx]);
                }
                if (trIdx >= 0 && row[trIdx] !== null && row[trIdx] !== undefined) {
                    var trParsed = parseFloat(row[trIdx]);
                    if (!isNaN(trParsed)) rawTrendNum = trParsed;
                }
            }

            // Determine if value is numeric
            // Guard: T+02:34, 1:21.584, GO, status codes must pass through as-is
            var isNumeric = false;
            var numericValue = null;
            var displayValue = rawValueStr;

            if (rawValueStr !== '—') {
                var stripped = rawValueStr.replace(/^[+\s]+/, '');
                var parsed = parseFloat(stripped);
                if (!isNaN(parsed) && String(parsed) === stripped) {
                    isNumeric = true;
                    numericValue = parsed;
                    if (decimals === -1) {
                        displayValue = theme.formatValue(numericValue, -1, true);
                    } else {
                        displayValue = numericValue.toFixed(decimals);
                    }
                }
                // Non-numeric: display as-is (lap times, status codes, mission times)
            }

            if (!hasData) {
                displayValue = '—';
                rawLabelStr = 'AWAITING DATA';
            }

            // Threshold-based accent shift
            var accentColor = accentHex;
            if (isNumeric && numericValue !== null) {
                var dangerVal = theme.parseNum(dangerThr, null);
                var warnVal   = theme.parseNum(warnThr, null);
                if (dangerVal !== null && numericValue >= dangerVal) {
                    accentColor = t.danger;
                } else if (warnVal !== null && numericValue >= warnVal) {
                    accentColor = t.burn;
                }
            }

            // Trend color
            var trendColor = (rawTrendNum !== null && rawTrendNum >= 0) ? t.nominal : t.danger;
            var trendArrow = (rawTrendNum !== null && rawTrendNum >= 0) ? '▲' : '▼';
            var trendText  = rawTrendNum !== null
                ? (trendArrow + ' ' + Math.abs(rawTrendNum).toFixed(1) + '%')
                : '';

            // -------------------------------------------------------
            // Layout metrics (additive positioning, NOT % of height)
            // -------------------------------------------------------
            var padX = Math.max(10, Math.min(w * 0.06, 20));
            var padY = Math.max(8, Math.min(h * 0.07, 14));

            var labelSize  = Math.max(8,  Math.min(h * 0.10, 11));
            var unitSize   = Math.max(8,  Math.min(h * 0.09, 13));
            var trendSize  = Math.max(8,  Math.min(h * 0.09, 12));

            // Value font: auto-fit to available width
            var valueMaxW  = w - padX * 2;
            var valueStartSize = Math.max(14, Math.min(h * 0.45, 72));
            var valueFontSize  = theme.fitText(
                ctx, displayValue, valueMaxW, valueStartSize, 12, theme.MONO_FONT
            );

            // Additive Y positions (all baseline = middle)
            var labelY  = padY + labelSize;
            var valueY  = labelY + labelSize * 0.5 + Math.max(4, h * 0.03) + valueFontSize * 0.5;
            var unitY   = valueY + valueFontSize * 0.5 + Math.max(3, h * 0.02) + unitSize * 0.5;
            var trendY  = unitY + unitSize * 0.5 + Math.max(2, h * 0.015) + trendSize * 0.5;

            // Clamp so we never render off-canvas
            if (trendY + trendSize > h - padY) {
                // Compress gaps proportionally
                var totalNeeded = labelSize + valueFontSize + unitSize + trendSize;
                var available   = h - padY * 2;
                var gapUnit     = Math.max(1, (available - totalNeeded) / 3);
                labelY  = padY + labelSize;
                valueY  = labelY + labelSize * 0.5 + gapUnit + valueFontSize * 0.5;
                unitY   = valueY + valueFontSize * 0.5 + gapUnit * 0.5 + unitSize * 0.5;
                trendY  = unitY + unitSize * 0.5 + gapUnit * 0.5 + trendSize * 0.5;
            }

            var cx = w / 2;

            // -------------------------------------------------------
            // Draw: background fill
            // -------------------------------------------------------
            ctx.clearRect(0, 0, w, h);

            // Top-edge instrument backlight (3px accent glow band)
            ctx.save();
            theme.roundRect(ctx, 0, 0, w, h, 2);
            ctx.clip();
            var topGrad = ctx.createLinearGradient(0, 0, 0, 4);
            topGrad.addColorStop(0, theme.withAlpha(accentColor, 0.18 * gi));
            topGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, w, 4);
            ctx.restore();

            // Subtle ambient light from top-left (SpaceX instrument feel)
            var ambGrad = ctx.createRadialGradient(w * 0.1, h * 0.05, 0, w * 0.1, h * 0.05, w * 0.8);
            ambGrad.addColorStop(0, theme.withAlpha(accentColor, 0.04 * gi));
            ambGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = ambGrad;
            ctx.fillRect(0, 0, w, h);

            // -------------------------------------------------------
            // Draw: LABEL
            // -------------------------------------------------------
            ctx.save();
            ctx.font = '600 ' + labelSize + 'px ' + theme.DISPLAY_FONT;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = theme.withAlpha(t.text, 0.30);
            // Letter-spaced label using drawSpacedText
            theme.drawSpacedText(ctx, rawLabelStr, cx, labelY, 3);
            ctx.restore();

            // -------------------------------------------------------
            // Draw: VALUE (with very subtle data glow — just a hint)
            // -------------------------------------------------------
            var valueFont = 'bold ' + valueFontSize + 'px ' + theme.MONO_FONT;

            ctx.save();
            ctx.font = valueFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Soft glow pass (low intensity — not the countdown LED style)
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 8 * gi;
            ctx.fillStyle = theme.withAlpha(accentColor, 0.25 * gi);
            ctx.globalAlpha = 0.5;
            ctx.fillText(displayValue, cx, valueY);
            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';

            // Crisp white value on top
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = t.text;
            ctx.fillText(displayValue, cx, valueY);
            ctx.restore();

            // -------------------------------------------------------
            // Draw: UNIT
            // -------------------------------------------------------
            if (rawUnitStr) {
                ctx.save();
                ctx.font = '400 ' + unitSize + 'px ' + theme.DISPLAY_FONT;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme.withAlpha(t.text, 0.45);
                ctx.fillText(rawUnitStr, cx, unitY);
                ctx.restore();
            }

            // -------------------------------------------------------
            // Draw: TREND (delta arrow + percentage)
            // -------------------------------------------------------
            if (showTrend && trendText && unitY + unitSize * 0.5 + trendSize + padY < h) {
                ctx.save();
                ctx.font = '400 ' + trendSize + 'px ' + theme.MONO_FONT;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = trendColor;
                ctx.fillText(trendText, cx, trendY);
                ctx.restore();
            }

            // -------------------------------------------------------
            // Hit region for tooltip
            // -------------------------------------------------------
            var labelDisplay = rawLabelStr || '';
            var unitDisplay  = rawUnitStr  || '';
            this._hitPanel = {
                x: 0, y: 0, w: w, h: h,
                tip: (labelDisplay ? labelDisplay + ': ' : '') +
                     displayValue +
                     (unitDisplay ? ' ' + unitDisplay : '')
            };
        },

        // ----------------------------------------------------------------
        // Mouse handling
        // ----------------------------------------------------------------

        _onMouseMove: function(e) {
            if (!this._hitPanel) return;
            var rect = this.canvas.getBoundingClientRect();
            var mx = e.clientX - rect.left;
            var my = e.clientY - rect.top;
            var r = this._hitPanel;

            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                this._tooltip.innerHTML = r.tip;
                this._tooltip.style.display = 'block';

                var tx = mx + 14;
                var ty = my - 10;
                if (tx + 200 > this.el.offsetWidth) tx = mx - 200;
                if (ty < 0) ty = my + 20;
                this._tooltip.style.left = tx + 'px';
                this._tooltip.style.top  = ty + 'px';
                this.canvas.style.cursor = 'crosshair';
            } else {
                this._tooltip.style.display = 'none';
                this.canvas.style.cursor = 'default';
            }
        },

        // ----------------------------------------------------------------
        // Cleanup
        // ----------------------------------------------------------------

        destroy: function() {
            if (this._tooltip && this._tooltip.parentNode) {
                this._tooltip.parentNode.removeChild(this._tooltip);
            }
            SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
        }

    });
