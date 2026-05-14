// SpaceX Mission Control — Fuel Gauge
// Vertical fill gauge showing propellant levels (LOX / RP-1 style)
// Liquid gradient + meniscus surface + danger pulse below 15%

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

    // ── Helpers ────────────────────────────────────────────────────────────────

    function getNS(viz) {
        try {
            var info = viz.getPropertyNamespaceInfo();
            if (info && info.propertyNamespace) return info.propertyNamespace;
        } catch (e) {}
        return '';
    }

    // Darken a hex color by factor (0–1 means darker, factor < 0 brightens)
    function darkenHex(hex, factor) {
        var h = hex.replace('#', '');
        if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
        var r = parseInt(h.substring(0, 2), 16);
        var g = parseInt(h.substring(2, 4), 16);
        var b = parseInt(h.substring(4, 6), 16);
        r = Math.max(0, Math.min(255, Math.round(r * (1 - factor))));
        g = Math.max(0, Math.min(255, Math.round(g * (1 - factor))));
        b = Math.max(0, Math.min(255, Math.round(b * (1 - factor))));
        var rh = r.toString(16); if (rh.length < 2) rh = '0' + rh;
        var gh = g.toString(16); if (gh.length < 2) gh = '0' + gh;
        var bh = b.toString(16); if (bh.length < 2) bh = '0' + bh;
        return '#' + rh + gh + bh;
    }

    // ── Visualization ──────────────────────────────────────────────────────────

    module.exports = SplunkVisualizationBase.extend({

        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.el.style.overflow = 'hidden';
            this.el.style.position = 'relative';

            var canvas = document.createElement('canvas');
            canvas.style.display = 'block';
            this.el.appendChild(canvas);
            this.canvas = canvas;

            this._lastData   = null;
            this._lastConfig = null;
            this._lastGoodData = null;
            this._hitRegions = [];
            this._hoverIdx   = -1;
            this._animFrame  = null;
            this._pulsePhase = 0;

            // Tooltip
            this._tooltip = document.createElement('div');
            this._tooltip.style.cssText =
                'position:absolute;display:none;padding:6px 12px;' +
                'background:rgba(6,9,16,0.95);color:#E2E8F0;font-size:12px;' +
                'border-radius:4px;pointer-events:none;white-space:nowrap;' +
                'z-index:100;font-family:"JetBrains Mono",monospace;' +
                'border:1px solid rgba(0,136,204,0.35);' +
                'box-shadow:0 4px 16px rgba(0,0,0,0.5);letter-spacing:0.04em;';
            this.el.appendChild(this._tooltip);

            var self = this;
            this.canvas.addEventListener('mousemove', function(e) {
                self._onMouseMove(e);
            });
            this.canvas.addEventListener('mouseleave', function() {
                self._tooltip.style.display = 'none';
                self.canvas.style.cursor = 'default';
                if (self._hoverIdx !== -1) {
                    self._hoverIdx = -1;
                    if (self._lastData) {
                        self._render(self._lastData, self._lastConfig);
                    }
                }
            });
        },

        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 50
            };
        },

        formatData: function(data) {
            if (!data || !data.rows || data.rows.length === 0) {
                if (this._lastGoodData) return this._lastGoodData;
                return { noData: true, colIdx: {}, rows: [] };
            }
            var fields = data.fields;
            var colIdx = {};
            for (var i = 0; i < fields.length; i++) {
                colIdx[fields[i].name] = i;
            }
            var result = { noData: false, colIdx: colIdx, rows: data.rows };
            this._lastGoodData = result;
            return result;
        },

        updateView: function(data, config) {
            if (!data) return;
            this._lastData   = data;
            this._lastConfig = config;

            var self = this;
            theme.loadFonts(function() {
                self._render(self._lastData, self._lastConfig);
            });
        },

        _render: function(data, config) {
            var el = this.el;
            var w  = el.offsetWidth;
            var h  = el.offsetHeight;
            if (w <= 0 || h <= 0) return;

            var dpr = window.devicePixelRatio || 1;
            var canvas = this.canvas;
            canvas.width  = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width  = w + 'px';
            canvas.style.height = h + 'px';

            var ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, w, h);

            var ns = getNS(this);
            var t  = theme.getTheme(theme.getOption(config, ns, 'theme', 'dark'));

            // ── Read config ──────────────────────────────────────────────────
            var valueField  = theme.getOption(config, ns, 'valueField',  'value');
            var labelField  = theme.getOption(config, ns, 'labelField',  'label');
            var maxField    = theme.getOption(config, ns, 'maxField',    'max');
            var maxValueCfg = theme.parseNum(theme.getOption(config, ns, 'maxValue', '100'), 100);
            var decimals    = theme.parseNum(theme.getOption(config, ns, 'decimals', '1'), 1);
            var accentColor = theme.getOption(config, ns, 'accentColor', t.accent);
            var gi = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50) / 50;
            var dangerThresh = theme.parseNum(theme.getOption(config, ns, 'dangerThreshold', '15'), 15);
            var showMarks   = theme.parseBool(theme.getOption(config, ns, 'showLevelMarks', 'true'), true);

            // ── Extract data ─────────────────────────────────────────────────
            var noData    = data.noData;
            var colIdx    = data.colIdx;
            var rows      = data.rows;
            var rawValue  = null;
            var rawLabel  = '';
            var rawMax    = maxValueCfg;

            if (!noData && rows.length > 0) {
                var row = rows[rows.length - 1];
                if (colIdx[valueField] !== undefined) {
                    rawValue = parseFloat(row[colIdx[valueField]]);
                }
                if (colIdx[labelField] !== undefined) {
                    rawLabel = String(row[colIdx[labelField]] || '');
                }
                if (colIdx[maxField] !== undefined) {
                    var mf = parseFloat(row[colIdx[maxField]]);
                    if (!isNaN(mf)) rawMax = mf;
                }
            }

            var hasValue = (!noData) && (rawValue !== null) && (!isNaN(rawValue));
            var value    = hasValue ? rawValue : 0;
            var maxVal   = rawMax > 0 ? rawMax : 100;
            var pct      = hasValue ? Math.max(0, Math.min(100, (value / maxVal) * 100)) : 0;
            var label    = hasValue ? rawLabel : 'NO DATA';

            // ── Danger state ─────────────────────────────────────────────────
            var isDanger  = hasValue && (pct <= dangerThresh);
            var fillColor = isDanger ? t.danger : accentColor;

            // ── Layout ───────────────────────────────────────────────────────
            // Tube geometry
            var pad        = Math.max(12, Math.min(24, w * 0.08));
            var markW      = showMarks ? Math.max(18, Math.min(32, w * 0.12)) : 0;
            var markGap    = showMarks ? 6 : 0;

            // Percentage display above tube
            var pctFontSize = Math.max(20, Math.min(48, Math.min(w, h) * 0.14));
            var topLabelH   = pctFontSize + 10;

            // Bottom label
            var lblFontSize = Math.max(8, Math.min(14, Math.min(w, h) * 0.06));
            var botLabelH   = lblFontSize + 12;

            var tubeLeft   = pad + markW + markGap;
            var tubeWidth  = Math.max(16, w - tubeLeft - pad);
            var tubeTop    = pad + topLabelH;
            var tubeHeight = Math.max(40, h - tubeTop - botLabelH - pad);

            // Clamp tube to a nice aspect — not too fat, not too thin
            var maxTubeW = Math.min(tubeWidth, tubeHeight * 0.28);
            if (maxTubeW < tubeWidth) {
                var excess = tubeWidth - maxTubeW;
                tubeLeft  += Math.floor(excess / 2);
                tubeWidth  = maxTubeW;
            }

            var cx = tubeLeft + tubeWidth / 2;
            var tubeR  = 4;

            // ── 1. Background — transparent (tube IS the chrome) ─────────────
            // No panel fill. Draw only tube chrome.

            // ── 2. Tube shell — dark background ──────────────────────────────
            var tubeBgGrad = ctx.createLinearGradient(
                tubeLeft, 0, tubeLeft + tubeWidth, 0
            );
            tubeBgGrad.addColorStop(0,   'rgba(255,255,255,0.03)');
            tubeBgGrad.addColorStop(0.35, theme.withAlpha(t.surface, 0.80));
            tubeBgGrad.addColorStop(0.65, theme.withAlpha(t.surface, 0.80));
            tubeBgGrad.addColorStop(1,   'rgba(255,255,255,0.03)');

            theme.roundRect(ctx, tubeLeft, tubeTop, tubeWidth, tubeHeight, tubeR);
            ctx.fillStyle = tubeBgGrad;
            ctx.fill();

            // Inner shadow on top edge (depth)
            ctx.save();
            theme.roundRect(ctx, tubeLeft, tubeTop, tubeWidth, tubeHeight, tubeR);
            ctx.clip();
            var innerTopGrad = ctx.createLinearGradient(0, tubeTop, 0, tubeTop + 8);
            innerTopGrad.addColorStop(0, 'rgba(0,0,0,0.25)');
            innerTopGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = innerTopGrad;
            ctx.fillRect(tubeLeft, tubeTop, tubeWidth, 8);
            ctx.restore();

            // ── 3. Liquid fill (clipped to tube) ─────────────────────────────
            if (pct > 0) {
                var fillH    = (pct / 100) * tubeHeight;
                var fillTop  = tubeTop + tubeHeight - fillH;

                ctx.save();
                theme.roundRect(ctx, tubeLeft, tubeTop, tubeWidth, tubeHeight, tubeR);
                ctx.clip();

                // Liquid gradient — darker at bottom, brighter/glowing at top
                var darkColor  = darkenHex(fillColor, 0.45);
                var midColor   = fillColor;
                var lightColor = theme.lerpColor(fillColor, t.glow, 0.55);

                var liquidGrad = ctx.createLinearGradient(0, fillTop, 0, tubeTop + tubeHeight);
                liquidGrad.addColorStop(0,    lightColor);
                liquidGrad.addColorStop(0.18, midColor);
                liquidGrad.addColorStop(0.7,  midColor);
                liquidGrad.addColorStop(1,    darkColor);
                ctx.fillStyle = liquidGrad;
                ctx.fillRect(tubeLeft, fillTop, tubeWidth, fillH);

                // Side sheen — bright highlight strip on the left third of tube
                var sheenGrad = ctx.createLinearGradient(
                    tubeLeft, 0, tubeLeft + tubeWidth * 0.55, 0
                );
                sheenGrad.addColorStop(0,    'rgba(255,255,255,0.14)');
                sheenGrad.addColorStop(0.35, 'rgba(255,255,255,0.06)');
                sheenGrad.addColorStop(1,    'rgba(255,255,255,0)');
                ctx.fillStyle = sheenGrad;
                ctx.fillRect(tubeLeft, fillTop, tubeWidth, fillH);

                // ── Meniscus / surface tension effect ──────────────────────
                // Slight upward curve at the top of the liquid surface
                var mY  = fillTop;
                var mH  = Math.min(fillH * 0.06, 5);      // meniscus depth (concave)
                var mBulge = mH * 0.8;

                // Concave meniscus curve drawn as a clipping fill
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(tubeLeft, mY + mBulge);
                // Left side curves down (wall wetting)
                ctx.quadraticCurveTo(
                    tubeLeft + tubeWidth * 0.1, mY - mH * 0.5,
                    tubeLeft + tubeWidth * 0.25, mY + mBulge * 0.6
                );
                // Center of meniscus — slightly lower (concave)
                ctx.quadraticCurveTo(
                    cx, mY + mH * 1.4,
                    tubeLeft + tubeWidth * 0.75, mY + mBulge * 0.6
                );
                // Right side curves down (wall wetting)
                ctx.quadraticCurveTo(
                    tubeLeft + tubeWidth * 0.9, mY - mH * 0.5,
                    tubeLeft + tubeWidth, mY + mBulge
                );
                ctx.lineTo(tubeLeft + tubeWidth, mY - 4);
                ctx.lineTo(tubeLeft, mY - 4);
                ctx.closePath();
                ctx.fillStyle = theme.withAlpha(lightColor, 0.18);
                ctx.fill();
                ctx.restore();

                // Bright meniscus rim line
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(tubeLeft, mY + mBulge);
                ctx.quadraticCurveTo(
                    tubeLeft + tubeWidth * 0.1, mY - mH * 0.5,
                    tubeLeft + tubeWidth * 0.25, mY + mBulge * 0.6
                );
                ctx.quadraticCurveTo(
                    cx, mY + mH * 1.4,
                    tubeLeft + tubeWidth * 0.75, mY + mBulge * 0.6
                );
                ctx.quadraticCurveTo(
                    tubeLeft + tubeWidth * 0.9, mY - mH * 0.5,
                    tubeLeft + tubeWidth, mY + mBulge
                );
                ctx.strokeStyle = theme.withAlpha(lightColor, 0.70);
                ctx.lineWidth   = 1.5;
                ctx.shadowColor = theme.withAlpha(t.glow, 0.8);
                ctx.shadowBlur  = 4 * gi;
                ctx.stroke();
                ctx.shadowBlur  = 0;
                ctx.shadowColor = 'transparent';
                ctx.restore();

                // Glow emanating from liquid fill (bottom of tube, inner)
                var glowGrad = ctx.createRadialGradient(
                    cx, tubeTop + tubeHeight - 2,
                    0,
                    cx, tubeTop + tubeHeight - 2,
                    tubeWidth * 0.9
                );
                glowGrad.addColorStop(0,   theme.withAlpha(fillColor, isDanger ? 0.25 : 0.15));
                glowGrad.addColorStop(0.6, theme.withAlpha(fillColor, 0.04));
                glowGrad.addColorStop(1,   'transparent');
                ctx.fillStyle = glowGrad;
                ctx.fillRect(tubeLeft, fillTop, tubeWidth, fillH);

                ctx.restore(); // end tube clip
            }

            // ── 4. Tube border (1px accent edge) ─────────────────────────────
            theme.roundRect(
                ctx,
                tubeLeft + 0.5, tubeTop + 0.5,
                tubeWidth - 1, tubeHeight - 1,
                tubeR
            );
            ctx.strokeStyle = theme.withAlpha(fillColor, isDanger ? 0.40 : 0.12);
            ctx.lineWidth   = 1;
            ctx.stroke();

            // ── 5. Level marks (left side) ────────────────────────────────────
            if (showMarks) {
                var markLevels = [0, 25, 50, 75, 100];
                var tickLen    = 8;
                var monoSize   = Math.max(8, Math.min(11, w * 0.045));

                ctx.save();
                ctx.font      = monoSize + 'px ' + theme.MONO_FONT;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';

                for (var mi = 0; mi < markLevels.length; mi++) {
                    var ml  = markLevels[mi];
                    var mty = tubeTop + tubeHeight - (ml / 100) * tubeHeight;

                    // Tick line
                    ctx.strokeStyle = theme.withAlpha(t.textDim, 0.5);
                    ctx.lineWidth   = 1;
                    ctx.beginPath();
                    ctx.moveTo(tubeLeft - markGap - tickLen, mty);
                    ctx.lineTo(tubeLeft - markGap, mty);
                    ctx.stroke();

                    // Percentage label
                    ctx.fillStyle = theme.withAlpha(t.textDim, ml === 0 || ml === 100 ? 0.65 : 0.45);
                    ctx.fillText(ml + '%', tubeLeft - markGap - tickLen - 3, mty);
                }

                // Current level tick — highlighted
                var currentTickY = tubeTop + tubeHeight - (pct / 100) * tubeHeight;
                if (pct > 0 && pct < 100) {
                    ctx.strokeStyle = theme.withAlpha(fillColor, 0.80);
                    ctx.lineWidth   = 1.5;
                    ctx.shadowColor = theme.withAlpha(fillColor, 0.5);
                    ctx.shadowBlur  = 4 * gi;
                    ctx.beginPath();
                    ctx.moveTo(tubeLeft - markGap - tickLen - 2, currentTickY);
                    ctx.lineTo(tubeLeft - markGap + 2, currentTickY);
                    ctx.stroke();
                    ctx.shadowBlur  = 0;
                    ctx.shadowColor = 'transparent';
                }

                ctx.restore();
            }

            // ── 6. Percentage readout above the tube ─────────────────────────
            var pctStr   = hasValue ? theme.formatValue(pct, decimals, false) + '%' : '—%';
            var pctFontStr = 'bold ' + pctFontSize + 'px ' + theme.MONO_FONT;
            var pctY = tubeTop - topLabelH * 0.38;

            ctx.save();
            ctx.font         = pctFontStr;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';

            if (hasValue) {
                // Glow pass
                ctx.shadowColor  = theme.withAlpha(fillColor, 0.85);
                ctx.shadowBlur   = isDanger ? 18 : 10;
                ctx.fillStyle    = theme.withAlpha(fillColor, 0.45);
                ctx.globalAlpha  = 0.9;
                ctx.fillText(pctStr, cx, pctY);
                ctx.fillText(pctStr, cx, pctY);
                // Crisp pass
                ctx.shadowBlur   = 0;
                ctx.shadowColor  = 'transparent';
                ctx.globalAlpha  = 1.0;
                ctx.fillStyle    = t.text;
                ctx.fillText(pctStr, cx, pctY);
            } else {
                ctx.fillStyle    = theme.withAlpha(t.textDim, 0.5);
                ctx.fillText(pctStr, cx, pctY);
            }
            ctx.restore();

            // ── 7. Label below the tube ───────────────────────────────────────
            if (label) {
                var lblY = tubeTop + tubeHeight + Math.ceil(botLabelH * 0.55);
                ctx.save();
                ctx.font         = '600 ' + lblFontSize + 'px ' + theme.DISPLAY_FONT;
                ctx.textAlign    = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle    = theme.withAlpha(t.text, noData ? 0.35 : 0.30);

                // Spaced label for the branded look
                theme.drawSpacedText(ctx, label.toUpperCase(), cx, lblY, 3);
                ctx.restore();
            }

            // ── 8. Danger pulse (tube border flicker) ────────────────────────
            if (isDanger) {
                this._ensurePulse();
                var pulseAlpha = 0.08 + Math.abs(Math.sin(this._pulsePhase)) * 0.18;
                theme.roundRect(
                    ctx,
                    tubeLeft - 2, tubeTop - 2,
                    tubeWidth + 4, tubeHeight + 4,
                    tubeR + 2
                );
                ctx.strokeStyle = theme.withAlpha(t.danger, pulseAlpha);
                ctx.lineWidth   = 2;
                ctx.stroke();
            } else {
                this._stopPulse();
            }

            // ── 9. Register hit region ────────────────────────────────────────
            this._hitRegions = [];
            if (hasValue) {
                var tipLabel = label || 'Fuel';
                var tipVal   = theme.formatValue(value, decimals, false);
                var tipMax   = theme.formatValue(maxVal, decimals, false);
                var tipPct   = theme.formatValue(pct, decimals, false);
                this._hitRegions.push({
                    x: tubeLeft, y: tubeTop,
                    w: tubeWidth, h: tubeHeight,
                    tip: '<b>' + tipLabel + '</b> ' +
                         tipVal + ' / ' + tipMax +
                         ' <span style="color:' + fillColor + '">(' + tipPct + '%)</span>'
                });
            }

            // Hover highlight — subtle outer glow on the tube
            if (this._hoverIdx === 0 && this._hitRegions.length > 0) {
                theme.roundRect(
                    ctx,
                    tubeLeft - 1.5, tubeTop - 1.5,
                    tubeWidth + 3, tubeHeight + 3,
                    tubeR + 1
                );
                ctx.strokeStyle = theme.withAlpha(fillColor, 0.35);
                ctx.lineWidth   = 1.5;
                ctx.stroke();
            }
        },

        // ── Pulse animation ──────────────────────────────────────────────────

        _ensurePulse: function() {
            if (this._animFrame) return;
            var self = this;
            var tick = function() {
                self._pulsePhase = (self._pulsePhase + 0.04) % (Math.PI * 2);
                if (self._lastData && self._lastConfig) {
                    self._render(self._lastData, self._lastConfig);
                }
                self._animFrame = requestAnimationFrame(tick);
            };
            this._animFrame = requestAnimationFrame(tick);
        },

        _stopPulse: function() {
            if (this._animFrame) {
                cancelAnimationFrame(this._animFrame);
                this._animFrame  = null;
                this._pulsePhase = 0;
            }
        },

        // ── Hover ────────────────────────────────────────────────────────────

        _onMouseMove: function(e) {
            var rect = this.canvas.getBoundingClientRect();
            var mx   = e.clientX - rect.left;
            var my   = e.clientY - rect.top;
            var hit  = this._hitTest(mx, my);

            if (hit !== null) {
                var region = this._hitRegions[hit];
                this._tooltip.innerHTML = region.tip;
                this._tooltip.style.display = 'block';

                var tx = mx + 14;
                var ty = my - 10;
                if (tx + 200 > this.el.offsetWidth) tx = mx - 210;
                if (ty < 0) ty = my + 20;
                this._tooltip.style.left = tx + 'px';
                this._tooltip.style.top  = ty + 'px';
                this.canvas.style.cursor = 'crosshair';

                if (this._hoverIdx !== hit) {
                    this._hoverIdx = hit;
                    if (this._lastData) {
                        this._render(this._lastData, this._lastConfig);
                    }
                }
            } else {
                this._tooltip.style.display = 'none';
                this.canvas.style.cursor    = 'default';
                if (this._hoverIdx !== -1) {
                    this._hoverIdx = -1;
                    if (this._lastData) {
                        this._render(this._lastData, this._lastConfig);
                    }
                }
            }
        },

        _hitTest: function(mx, my) {
            for (var i = 0; i < this._hitRegions.length; i++) {
                var r = this._hitRegions[i];
                if (mx >= r.x && mx <= r.x + r.w &&
                    my >= r.y && my <= r.y + r.h) {
                    return i;
                }
            }
            return null;
        },

        // ── Lifecycle ────────────────────────────────────────────────────────

        reflow: function() {
            if (this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        },

        destroy: function() {
            this._stopPulse();
            if (this._tooltip && this._tooltip.parentNode) {
                this._tooltip.parentNode.removeChild(this._tooltip);
            }
            SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
        }
    });
