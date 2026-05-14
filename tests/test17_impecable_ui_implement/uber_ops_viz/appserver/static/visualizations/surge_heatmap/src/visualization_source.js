/*
 * Uber Operations — Surge Heatmap
 * Hour-by-zone grid showing surge pricing intensity.
 * 24 columns (hours) x N rows (zones). Color: green(1x) -> orange -> red(3x+).
 * ES5 only. No jQuery (F10). Uses clearRect (B13).
 */
var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.overflow = 'hidden';

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 12px;' +
            'pointer-events:none;white-space:nowrap;z-index:100;' +
            'font-size:11px;border-radius:2px;';
        this.el.style.position = 'relative';
        this.el.appendChild(this._tooltip);

        this._hitRegions = [];
        this._hoverIdx = -1;
        var self = this;
        this.el.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this.el.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            if (self._hoverIdx !== -1) {
                self._hoverIdx = -1;
                if (self._lastData && self._lastConfig) {
                    self._render(self._lastData, self._lastConfig);
                }
            }
        });

        this._lastData = null;
        this._lastConfig = null;
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
        if (!data || !data.colIdx || !data.rows || data.rows.length === 0) return;
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    _render: function(data, config) {
        var ns = theme.getNS(this);
        var t = theme.getTheme(theme.getOption(config, ns, 'theme', 'dark'));
        var gi = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50) / 50;
        this._gi = gi;

        var setup = theme.setupCanvas(this.el);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;
        this.canvas = setup.canvas;

        ctx.clearRect(0, 0, w, h);

        var hourField = theme.getOption(config, ns, 'hourField', 'hour');
        var zoneField = theme.getOption(config, ns, 'zoneField', 'zone');
        var surgeField = theme.getOption(config, ns, 'surgeField', 'surge');
        var lowColor = theme.getOption(config, ns, 'lowColor', t.s5);
        var midColor = theme.getOption(config, ns, 'midColor', '#FF6937');
        var highColor = theme.getOption(config, ns, 'highColor', '#E11900');

        var colIdx = data.colIdx;
        var hi = colIdx[hourField] !== undefined ? colIdx[hourField] : -1;
        var zi = colIdx[zoneField] !== undefined ? colIdx[zoneField] : -1;
        var si = colIdx[surgeField] !== undefined ? colIdx[surgeField] : -1;

        if (hi < 0 || zi < 0 || si < 0) return;

        /* Build zone list and data matrix */
        var zoneOrder = [];
        var zoneSet = {};
        var matrix = {};
        for (var r = 0; r < data.rows.length; r++) {
            var row = data.rows[r];
            var hour = parseInt(row[hi], 10);
            var zone = String(row[zi]);
            var surge = parseFloat(row[si]);
            if (isNaN(hour) || isNaN(surge)) continue;
            if (!zoneSet[zone]) {
                zoneSet[zone] = true;
                zoneOrder.push(zone);
            }
            matrix[zone + ':' + hour] = surge;
        }

        var numZones = zoneOrder.length;
        var numHours = 24;

        /* Layout — scale everything from container */
        var labelW = Math.round(w * 0.14);
        var headerH = Math.max(18, Math.round(h * 0.06));
        var padT = Math.max(4, Math.round(h * 0.02));
        var padB = Math.max(4, Math.round(h * 0.01));
        var cellGap = Math.max(1, Math.round(Math.min(w, h) * 0.004));
        var gridW = w - labelW - Math.round(w * 0.02);
        var gridH = h - headerH - padT - padB;
        var cellW = Math.max(4, Math.floor((gridW - cellGap * (numHours - 1)) / numHours));
        var cellH = Math.max(8, Math.floor((gridH - cellGap * (numZones - 1)) / numZones));
        var fontSize = Math.max(7, Math.min(11, cellH * 0.45));
        var labelFontSize = Math.max(7, Math.min(11, cellH * 0.55));

        this._hitRegions = [];

        /* Hour labels across top */
        ctx.font = fontSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.textFaint;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (var hh = 0; hh < numHours; hh++) {
            var hx = labelW + hh * (cellW + cellGap) + cellW / 2;
            var hy = padT + headerH / 2;
            var hlabel = hh < 10 ? '0' + hh : '' + hh;
            ctx.fillText(hlabel, hx, hy);
        }

        /* Zone rows */
        for (var z = 0; z < numZones; z++) {
            var zoneName = zoneOrder[z];
            var ry = padT + headerH + z * (cellH + cellGap);

            /* Zone label — left aligned, truncated */
            ctx.font = labelFontSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textDim;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(zoneName.substring(0, 14), labelW - 6, ry + cellH / 2);

            /* Cells for each hour */
            for (var hc = 0; hc < numHours; hc++) {
                var val = matrix[zoneName + ':' + hc];
                if (val === undefined) val = 1.0;
                var cx = labelW + hc * (cellW + cellGap);
                var cy = ry;

                /* Color mapping: 1.0 -> dim, 1.5 -> orange, 2.5+ -> red */
                var pct = Math.min(1, Math.max(0, (val - 1.0) / 2.0));
                var cellColor;
                if (pct <= 0.01) {
                    cellColor = theme.withAlpha(t.text, 0.06);
                } else if (pct < 0.5) {
                    cellColor = theme.lerpColor(lowColor, midColor, pct * 2);
                } else {
                    cellColor = theme.lerpColor(midColor, highColor, (pct - 0.5) * 2);
                }

                /* Draw cell with slight radius */
                theme.roundRect(ctx, cx, cy, cellW, cellH, 1);
                ctx.fillStyle = cellColor;

                /* Hover highlight */
                var regionIdx = z * numHours + hc;
                if (this._hoverIdx === regionIdx) {
                    ctx.fillStyle = theme.withAlpha('#FFFFFF', 0.25);
                }

                ctx.fill();

                /* If cell is hovered, show surge value in cell */
                if (this._hoverIdx === regionIdx && cellW > 16) {
                    ctx.font = 'bold ' + Math.max(7, fontSize) + 'px ' + theme.FONTS.data;
                    ctx.fillStyle = t.text;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(val.toFixed(1), cx + cellW / 2, cy + cellH / 2);
                }

                /* Glow for high surge cells */
                if (pct > 0.6 && gi > 0.1) {
                    ctx.save();
                    ctx.shadowColor = highColor;
                    ctx.shadowBlur = 4 * gi * pct;
                    theme.roundRect(ctx, cx, cy, cellW, cellH, 1);
                    ctx.fillStyle = 'rgba(0,0,0,0.01)';
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                    ctx.restore();
                }

                this._hitRegions.push({
                    x: cx, y: cy, w: cellW, h: cellH,
                    tip: zoneName + ' @ ' + (hc < 10 ? '0' + hc : hc) + ':00 — Surge: ' + val.toFixed(1) + 'x'
                });
            }
        }
    },

    _onMouseMove: function(e) {
        var canvas = this.canvas;
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitTest(mx, my);

        if (hit !== null) {
            var region = this._hitRegions[hit];
            this._tooltip.textContent = region.tip;
            var t = theme.getTheme('dark');
            this._tooltip.style.background = t.panelHi;
            this._tooltip.style.color = t.text;
            this._tooltip.style.border = '1px solid ' + t.edgeStrong;
            this._tooltip.style.fontFamily = theme.FONTS.data;
            this._tooltip.style.display = 'block';
            var tx = mx + 14;
            var ty = my - 10;
            if (tx + 180 > this.el.offsetWidth) tx = mx - 180;
            if (ty < 0) ty = my + 20;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top = ty + 'px';
            if (this._hoverIdx !== hit) {
                this._hoverIdx = hit;
                this._render(this._lastData, this._lastConfig);
            }
        } else {
            this._tooltip.style.display = 'none';
            if (this._hoverIdx !== -1) {
                this._hoverIdx = -1;
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return i;
            }
        }
        return null;
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
