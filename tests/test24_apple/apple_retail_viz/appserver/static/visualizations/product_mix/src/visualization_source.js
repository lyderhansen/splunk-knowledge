var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:8px 14px;' +
            'border-radius:10px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-size:12px;';
        this.el.appendChild(this._tooltip);

        this._segments = [];
        this._hoveredIdx = -1;
        this._lastData = null;
        this._lastConfig = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
            if (self._hoveredIdx !== -1) {
                self._hoveredIdx = -1;
                if (self._lastData && self._lastConfig) {
                    self._render(self._lastData, self._lastConfig);
                }
            }
        });
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
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
        if (!data || !data.rows || data.rows.length === 0) return;
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    _render: function(data, config) {
        var ns = theme.getNS(this);
        var themeMode = theme.getOption(config, ns, 'themeMode', 'auto');
        var isDark = themeMode === 'auto' ? theme.detectTheme() === 'dark' : themeMode === 'dark';
        var t = isDark ? theme.DARK : theme.LIGHT;

        var categoryField = theme.getOption(config, ns, 'categoryField', 'category');
        var valueField = theme.getOption(config, ns, 'valueField', 'revenue');
        var colorsStr = theme.getOption(config, ns, 'colors', '');
        var showReadout = theme.getOption(config, ns, 'showReadout', 'true') === 'true';
        var showLegend = theme.getOption(config, ns, 'showLegend', 'true') === 'true';
        var unitStr = theme.getOption(config, ns, 'unit', '$');
        var unitPos = theme.getOption(config, ns, 'unitPosition', 'before');
        var accentIntensity = parseInt(theme.getOption(config, ns, 'accentIntensity', '50'), 10);
        var ringWidth = theme.getOption(config, ns, 'ringWidth', 'auto');

        var colors = colorsStr ? colorsStr.split(',') : theme.CATEGORY_COLORS;
        for (var ci = 0; ci < colors.length; ci++) {
            colors[ci] = colors[ci].replace(/\s/g, '');
        }

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 200;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 200;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        var colIdx = data.colIdx;
        var catI = colIdx[categoryField];
        var valI = colIdx[valueField];

        // Parse data
        var items = [];
        var total = 0;
        for (var i = 0; i < data.rows.length; i++) {
            var row = data.rows[i];
            var val = valI !== undefined ? parseFloat(row[valI]) : 0;
            if (isNaN(val)) val = 0;
            var cat = theme.safeStr(catI !== undefined ? row[catI] : 'Category ' + (i + 1));
            items.push({ category: cat, value: val });
            total += val;
        }
        if (total === 0) total = 1;

        // Layout — donut on left/center, legend on right
        var pad = Math.max(12, Math.min(w, h) * 0.04);
        var legendW = showLegend ? Math.min(220, w * 0.35) : 0;
        var donutAreaW = w - legendW;
        var donutAreaH = h - pad * 2;

        var maxR = Math.min(donutAreaW, donutAreaH) / 2 - pad;
        var radius = Math.max(30, maxR);
        var cx = donutAreaW / 2;
        var cy = h / 2;

        var thick;
        if (ringWidth === 'auto') {
            thick = Math.max(12, radius * 0.22);
        } else {
            thick = Math.max(6, parseInt(ringWidth, 10) || radius * 0.22);
        }
        var innerR = radius - thick;

        // Draw segments
        var startAngle = -Math.PI / 2;
        var segGap = items.length > 1 ? 0.02 : 0;
        this._segments = [];
        this._donutCx = cx;
        this._donutCy = cy;
        this._donutInnerR = innerR;
        this._donutOuterR = radius;

        for (var j = 0; j < items.length; j++) {
            var pct = items[j].value / total;
            var sweep = Math.PI * 2 * pct - segGap;
            if (sweep < 0.01) sweep = 0.01;
            var endAngle = startAngle + sweep;
            var color = colors[j % colors.length];
            var hovered = j === this._hoveredIdx;

            // Draw arc segment
            ctx.beginPath();
            var drawR = hovered ? radius + 4 : radius;
            var drawInner = hovered ? innerR - 2 : innerR;
            ctx.arc(cx, cy, drawR, startAngle, endAngle);
            ctx.arc(cx, cy, drawInner, endAngle, startAngle, true);
            ctx.closePath();

            ctx.fillStyle = color;
            if (hovered) {
                ctx.globalAlpha = 1;
            } else if (this._hoveredIdx >= 0) {
                ctx.globalAlpha = 0.5;
            } else {
                ctx.globalAlpha = 0.85;
            }

            // Subtle glow on hovered segment
            var gi = accentIntensity / 50;
            if (hovered && gi > 0.2) {
                ctx.shadowColor = color;
                ctx.shadowBlur = 16 * gi;
            }
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.globalAlpha = 1;

            this._segments.push({
                startAngle: startAngle,
                endAngle: endAngle,
                category: items[j].category,
                value: items[j].value,
                pct: pct,
                color: color
            });

            startAngle = endAngle + segGap;
        }

        // Center readout
        if (showReadout) {
            var totalDisplay = theme.fmtNum(total);
            if (unitStr) {
                totalDisplay = unitPos === 'before' ? unitStr + totalDisplay : totalDisplay + unitStr;
            }

            var readoutFontSize = Math.max(14, innerR * 0.45);
            ctx.font = '600 ' + readoutFontSize + 'px ' + theme.FONTS.display;
            ctx.fillStyle = t.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(totalDisplay, cx, cy - readoutFontSize * 0.15);

            var sublabelSize = Math.max(7, innerR * 0.16);
            ctx.font = '500 ' + sublabelSize + 'px ' + theme.FONTS.display;
            ctx.fillStyle = t.textMuted;
            ctx.fillText('TOTAL', cx, cy + readoutFontSize * 0.55);
        }

        // Legend — right side
        if (showLegend && legendW > 0) {
            var legX = donutAreaW + pad;
            var legItemH = Math.max(22, Math.min(36, (h - pad * 2) / items.length));
            var legStartY = cy - (items.length * legItemH) / 2;
            var dotR = Math.max(4, legItemH * 0.15);
            var legFontSize = Math.max(9, legItemH * 0.38);
            var legValFontSize = Math.max(8, legItemH * 0.32);

            for (var k = 0; k < items.length; k++) {
                var ly = legStartY + k * legItemH + legItemH / 2;
                var color2 = colors[k % colors.length];

                // Color dot
                ctx.beginPath();
                ctx.arc(legX + dotR, ly, dotR, 0, Math.PI * 2);
                ctx.fillStyle = color2;
                ctx.fill();

                // Category name
                ctx.font = '400 ' + legFontSize + 'px ' + theme.FONTS.display;
                ctx.fillStyle = k === this._hoveredIdx ? t.text : t.textDim;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(items[k].category, legX + dotR * 2 + 8, ly);

                // Value + percentage
                var legVal = theme.fmtNum(items[k].value);
                if (unitStr) {
                    legVal = unitPos === 'before' ? unitStr + legVal : legVal + unitStr;
                }
                var pctText = ' (' + Math.round(items[k].value / total * 100) + '%)';
                ctx.font = '500 ' + legValFontSize + 'px ' + theme.FONTS.mono;
                ctx.fillStyle = t.textMuted;
                ctx.textAlign = 'right';
                ctx.fillText(legVal + pctText, w - pad, ly);
            }
        }

        // Tooltip styling
        this._tooltip.style.background = t.card;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.display;
        this._tooltip.style.boxShadow = '0 4px 20px ' + t.shadow;
    },

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        var dx = mx - this._donutCx;
        var dy = my - this._donutCy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var hit = -1;

        if (dist >= this._donutInnerR && dist <= this._donutOuterR + 6) {
            var angle = Math.atan2(dy, dx);
            if (angle < -Math.PI / 2) angle += Math.PI * 2;

            for (var i = 0; i < this._segments.length; i++) {
                var seg = this._segments[i];
                var sa = seg.startAngle;
                var ea = seg.endAngle;
                if (angle >= sa && angle <= ea) {
                    hit = i;
                    break;
                }
            }
        }

        if (hit >= 0) {
            var s = this._segments[hit];
            this._tooltip.textContent = s.category + ': ' +
                theme.fmtNum(s.value) + ' (' + Math.round(s.pct * 100) + '%)';
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = (mx + 14) + 'px';
            this._tooltip.style.top = (my - 10) + 'px';
            this._canvas.style.cursor = 'pointer';
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
        }

        if (hit !== this._hoveredIdx) {
            this._hoveredIdx = hit;
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
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
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
