var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// VIZ: charge_gauge
// Horizontal segmented bar gauge for charging power in kW
// 20 rounded-rect segments, left-to-right fill, power-surge glow on leading edge

var VIZ_NS = 'display.visualizations.custom.porsche_taycan_viz.charge_gauge.';

var ChargeGauge = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('charge-gauge-viz');
        theme.injectFonts(document);

        this._canvas = theme.setupCanvas(this.el);
        this._tooltip = theme.createTooltip(this.el);
        this._data = null;

        // HiDPI event listeners operate in CSS pixel space (pre-scale)
        this._onMouseMove = this._handleMouseMove.bind(this);
        this._onMouseLeave = this._handleMouseLeave.bind(this);
        this._canvas.addEventListener('mousemove', this._onMouseMove);
        this._canvas.addEventListener('mouseleave', this._onMouseLeave);

        // Hide Splunk "no results" placeholder
        var self = this;
        this._observer = new MutationObserver(function() {
            var placeholder = self.el.querySelector('.empty-results-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        });
        this._observer.observe(this.el, { childList: true, subtree: true });
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function(data) {
        if (!data || !data.rows || !data.rows.length) {
            return null;
        }
        var fields = data.fields || [];
        var row = data.rows[0];
        var result = {};

        for (var i = 0; i < fields.length; i++) {
            result[fields[i].name] = row[i];
        }
        return result;
    },

    updateView: function(data, config) {
        this._data = data;
        this._config = config;
        var self = this;
        theme.waitForFont(theme.FONT_DISPLAY, function() {
            self._render(data, config);
        });
    },

    _render: function(data, config) {
        var ns = theme.getNS(this) || VIZ_NS;
        var valueField   = theme.getOption(config, ns, 'valueField',   'value');
        var maxField     = theme.getOption(config, ns, 'maxField',      'maxValue');
        var maxDefault   = parseFloat(theme.getOption(config, ns, 'maxDefault',   270));
        var unitLabel    = theme.getOption(config, ns, 'unit',          'kW');
        var decimals     = parseInt(theme.getOption(config, ns, 'decimals',      1), 10);
        var accentColor  = theme.getOption(config, ns, 'accentColor',   '#3B82F6');
        var accentInt    = parseFloat(theme.getOption(config, ns, 'accentIntensity', 50)) / 100;
        var themeMode    = theme.getOption(config, ns, 'theme',         'dark');
        var segCount     = parseInt(theme.getOption(config, ns, 'segmentCount',   20), 10);
        var showSegs     = theme.getOption(config, ns, 'showSegments',  'true');
        showSegs = (showSegs === true || showSegs === 'true');

        var t = theme.getTheme(themeMode);
        var canvas = this._canvas;
        var sc = theme.scaleCanvas(canvas);
        var ctx = sc.ctx;
        var w = sc.w;
        var h = sc.h;

        // Clear — never fillRect with bg
        ctx.clearRect(0, 0, w, h);

        // --- Resolve values ---
        var value = 0;
        var maxValue = maxDefault;
        if (data) {
            if (data[valueField] !== undefined) {
                value = parseFloat(data[valueField]) || 0;
            }
            if (data[maxField] !== undefined) {
                var mv = parseFloat(data[maxField]);
                if (!isNaN(mv) && mv > 0) {
                    maxValue = mv;
                }
            }
        }
        var ratio = Math.min(1, Math.max(0, value / maxValue));

        // --- Layout ---
        // Bar area: middle 60% of panel height
        var barH = Math.round(h * 0.60);
        var barTop = Math.round((h - barH) / 2);

        // Typography zone above bar (value label)
        var labelH = 36;                         // font size in px
        var labelY = barTop - 10;               // baseline above bar

        // Reserve top region for label: shift bar down slightly if needed
        var topPad = 32;    // room for kW label above bar
        var botPad = 20;    // room for "CHARGING POWER" label below bar
        var innerBarH = Math.max(12, barH - topPad - botPad);
        var innerBarTop = barTop + topPad;
        var innerBarY = innerBarTop;

        // Horizontal margins
        var padX = 16;
        var barW = w - padX * 2;

        // --- Segment geometry ---
        var segGap = 2;
        var totalGap = segGap * (segCount - 1);
        var segW = (barW - totalGap) / segCount;
        var segRx = Math.min(3, segW * 0.3);
        var filledCount = Math.round(ratio * segCount);

        // Store segment rects for tooltip hit test
        this._barRect = { x: padX, y: innerBarY, w: barW, h: innerBarH };
        this._ratio = ratio;
        this._value = value;
        this._unitLabel = unitLabel;
        this._decimals = decimals;
        this._accentColor = accentColor;

        if (showSegs) {
            for (var i = 0; i < segCount; i++) {
                var sx = padX + i * (segW + segGap);
                var sy = innerBarY;
                var sw = segW;
                var sh = innerBarH;

                if (i < filledCount) {
                    // Filled segment
                    var isSurge = (i === filledCount - 1 && filledCount > 0);
                    var segColor = accentColor;

                    ctx.save();
                    ctx.beginPath();
                    theme.roundRect(ctx, sx, sy, sw, sh, segRx);

                    if (isSurge) {
                        // Power-surge: brightest fill + glow
                        ctx.shadowBlur = 14 * accentInt;
                        ctx.shadowColor = theme.hexToRgba(accentColor, 0.8 * accentInt);
                        ctx.fillStyle = theme.lerpColor(accentColor, '#FFFFFF', 0.3);
                    } else {
                        // Normal filled — slightly fade earlier segments
                        var fadeFactor = 0.65 + 0.35 * (i / Math.max(filledCount - 1, 1));
                        ctx.fillStyle = theme.hexToRgba(accentColor, fadeFactor);
                    }
                    ctx.fill();
                    theme.resetShadow(ctx);
                    ctx.restore();
                } else {
                    // Empty segment — gaugeTrack
                    ctx.save();
                    ctx.beginPath();
                    theme.roundRect(ctx, sx, sy, sw, sh, segRx);
                    ctx.fillStyle = t.gaugeTrack;
                    ctx.fill();
                    ctx.restore();
                }
            }
        } else {
            // Solid bar fallback (segmentCount irrelevant, showSegments=false)
            ctx.save();
            // Track
            ctx.beginPath();
            theme.roundRect(ctx, padX, innerBarY, barW, innerBarH, segRx);
            ctx.fillStyle = t.gaugeTrack;
            ctx.fill();
            // Fill
            if (ratio > 0) {
                var fillW = barW * ratio;
                ctx.beginPath();
                theme.roundRect(ctx, padX, innerBarY, fillW, innerBarH, segRx);
                ctx.shadowBlur = 12 * accentInt;
                ctx.shadowColor = theme.hexToRgba(accentColor, 0.7 * accentInt);
                ctx.fillStyle = accentColor;
                ctx.fill();
                theme.resetShadow(ctx);
            }
            ctx.restore();
        }

        // --- Value label above bar ---
        var kwStr = theme.fmtNum(value, { decimals: decimals });
        ctx.save();
        ctx.textBaseline = 'bottom';

        // Main value: 36px bold Outfit
        ctx.font = 'bold 36px "' + theme.FONT_DISPLAY + '", sans-serif';
        ctx.fillStyle = t.text;
        var kwX = padX;
        var kwY = innerBarY - 6;
        ctx.fillText(kwStr, kwX, kwY);

        // " / MAX kW" label to the right of value in 14px textDim
        var kwW = ctx.measureText(kwStr).width;
        ctx.font = '14px "' + theme.FONT_DISPLAY + '", sans-serif';
        ctx.fillStyle = t.textDim;
        var maxStr = ' / ' + theme.fmtNum(maxValue, { decimals: 0 }) + ' ' + unitLabel;
        ctx.fillText(maxStr, kwX + kwW + 4, kwY - 4);
        ctx.restore();

        // --- "CHARGING POWER" label below bar ---
        ctx.save();
        ctx.textBaseline = 'top';
        ctx.font = '9px "' + theme.FONT_DISPLAY + '", sans-serif';
        ctx.fillStyle = t.textWhisper;
        ctx.letterSpacing = '1.5px';
        ctx.fillText('CHARGING POWER', padX, innerBarY + innerBarH + 8);
        ctx.restore();
    },

    _handleMouseMove: function(evt) {
        if (!this._barRect) {
            theme.hideTooltip(this._tooltip);
            return;
        }
        var rect = this._canvas.getBoundingClientRect();
        var x = evt.clientX - rect.left;
        var y = evt.clientY - rect.top;
        var br = this._barRect;
        if (x >= br.x && x <= br.x + br.w && y >= br.y && y <= br.y + br.h) {
            var kwStr = theme.fmtNum(this._value, { decimals: this._decimals });
            theme.showTooltip(
                this._tooltip,
                'Charging: ' + kwStr + ' ' + this._unitLabel,
                x, y
            );
        } else {
            theme.hideTooltip(this._tooltip);
        }
    },

    _handleMouseLeave: function() {
        theme.hideTooltip(this._tooltip);
    },

    reflow: function() {
        if (this._data !== null || this._data === null) {
            // Re-render on resize using last config
            if (this._config) {
                var self = this;
                theme.waitForFont(theme.FONT_DISPLAY, function() {
                    self._render(self._data, self._config);
                });
            }
        }
    },

    destroy: function() {
        if (this._canvas) {
            this._canvas.removeEventListener('mousemove', this._onMouseMove);
            this._canvas.removeEventListener('mouseleave', this._onMouseLeave);
        }
        if (this._observer) {
            this._observer.disconnect();
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});

module.exports = ChargeGauge;
