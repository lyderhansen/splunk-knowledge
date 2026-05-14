// inventory_bars — Segmented horizontal bars: stock health by product category
// Patagonia Outdoor Operations viz pack
// ES5 CommonJS — build script wraps in AMD define()

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

var TOOLTIP_STYLE = [
    'position:absolute',
    'pointer-events:none',
    'display:none',
    'border-radius:4px',
    'padding:7px 11px',
    'font-size:12px',
    'line-height:1.7',
    'white-space:nowrap',
    'z-index:9999',
    'max-width:320px'
].join(';');

// Segment gap in CSS pixels
var SEG_GAP = 1;

module.exports = SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this._container = null;
        this._canvas = null;
        this._tooltip = null;
        this._lastData = null;
        this._lastConfig = null;
        // Each hit region: { rowIdx, segIdx (0=in_stock,1=low_stock,2=critical), x, y, w, h }
        this._hitRegions = [];
        this._hoveredHit = null;  // { rowIdx, segIdx } or null
        this._boundMouseMove = null;
        this._boundMouseLeave = null;
    },

    getInitialDataParams: function () {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    formatData: function (data) {
        if (!data || !data.rows || data.rows.length === 0) {
            return this._lastData || null;
        }

        // NOTE: field names come from config in updateView, not here (B4).
        // formatData only extracts raw rows using default field names as fallback.
        // Config-driven field lookup happens in _render via _parseItems().
        var fields = data.fields;
        var rows = data.rows;

        var colIdx = {};
        for (var i = 0; i < fields.length; i++) {
            colIdx[fields[i].name] = i;
        }

        this._lastData = { colIdx: colIdx, rows: rows };
        return this._lastData;
    },

    _parseItems: function (data, config, ns) {
        var colIdx = data.colIdx;
        var rows   = data.rows;

        var catField      = theme.getOption(config, ns, 'categoryField',  'category');
        var inStockField  = theme.getOption(config, ns, 'inStockField',   'in_stock');
        var lowStockField = theme.getOption(config, ns, 'lowStockField',  'low_stock');
        var criticalField = theme.getOption(config, ns, 'criticalField',  'critical');
        var totalField    = theme.getOption(config, ns, 'totalField',     'total_units');

        function fi(name) {
            return (colIdx[name] !== undefined) ? colIdx[name] : -1;
        }

        var catIdx      = fi(catField);
        var inStockIdx  = fi(inStockField);
        var lowStockIdx = fi(lowStockField);
        var criticalIdx = fi(criticalField);
        var totalIdx    = fi(totalField);

        if (catIdx < 0 || inStockIdx < 0 || lowStockIdx < 0 || criticalIdx < 0) {
            return null;
        }

        var items = [];
        for (var ri = 0; ri < rows.length; ri++) {
            var row      = rows[ri];
            var category = String(row[catIdx]);
            var inStock  = parseFloat(row[inStockIdx])  || 0;
            var lowStock = parseFloat(row[lowStockIdx]) || 0;
            var critical = parseFloat(row[criticalIdx]) || 0;
            var total    = (totalIdx >= 0 && row[totalIdx] !== undefined)
                           ? (parseFloat(row[totalIdx]) || 0)
                           : (inStock + lowStock + critical);

            items.push({
                category: category,
                inStock:  inStock,
                lowStock: lowStock,
                critical: critical,
                total:    total
            });
        }

        // Sort: worst health first (critical + low_stock descending)
        items.sort(function (a, b) {
            var badA = a.critical + a.lowStock;
            var badB = b.critical + b.lowStock;
            if (badB !== badA) return badB - badA;
            return b.total - a.total;
        });

        return items;
    },

    _setupContainer: function () {
        if (this._container) return;

        var el = this.el;
        el.style.position = 'relative';
        el.style.overflow = 'hidden';


        var tip = document.createElement('div');
        tip.style.cssText = TOOLTIP_STYLE;
        el.appendChild(tip);
        this._tooltip = tip;

        var self = this;
        this._boundMouseMove  = function (e) { self._onMouseMove(e); };
        this._boundMouseLeave = function ()  { self._onMouseLeave(); };
        el.addEventListener('mousemove',  this._boundMouseMove);
        el.addEventListener('mouseleave', this._boundMouseLeave);
    },

    _hitTest: function (mx, my) {
        for (var i = 0; i < this._hitRegions.length; i++) {
            var hr = this._hitRegions[i];
            if (mx >= hr.x && mx <= hr.x + hr.w && my >= hr.y && my <= hr.y + hr.h) {
                return { rowIdx: hr.rowIdx, segIdx: hr.segIdx };
            }
        }
        return null;
    },

    _onMouseMove: function (e) {
        if (!this._renderItems) {
            this._hideTooltip();
            return;
        }

        var rect = this.el.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitTest(mx, my);

        if (hit) {
            var item = this._renderItems[hit.rowIdx];
            var segNames  = ['In Stock', 'Low Stock', 'Critical'];
            var segValues = [item.inStock, item.lowStock, item.critical];

            var lines = [];
            lines.push('<strong>' + item.category + '</strong>');
            lines.push('&nbsp;');
            lines.push('<span style="color:' + this._colorIn  + '">&#9632;</span> In Stock: '  + theme.fmtNum(item.inStock,  { compact: true }));
            lines.push('<span style="color:' + this._colorLow + '">&#9632;</span> Low Stock: ' + theme.fmtNum(item.lowStock, { compact: true }));
            lines.push('<span style="color:' + this._colorCri + '">&#9632;</span> Critical: '  + theme.fmtNum(item.critical, { compact: true }));
            lines.push('Total units: ' + theme.fmtNum(item.total, { compact: true }));
            lines.push('<em>Hover: ' + segNames[hit.segIdx] + ' (' + theme.fmtNum(segValues[hit.segIdx], { compact: true }) + ')</em>');

            var tip = this._tooltip;
            tip.innerHTML = lines.join('<br>');
            tip.style.display = 'block';

            var tw = Math.min(mx + 16, rect.width - 220);
            var ty = Math.max(my - 40, 4);
            tip.style.left = tw + 'px';
            tip.style.top  = ty + 'px';

            var prevHit = this._hoveredHit;
            var changed = !prevHit || prevHit.rowIdx !== hit.rowIdx || prevHit.segIdx !== hit.segIdx;
            if (changed) {
                this._hoveredHit = hit;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
        } else {
            if (this._hoveredHit) {
                this._hoveredHit = null;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
            this._hideTooltip();
        }
    },

    _onMouseLeave: function () {
        this._hideTooltip();
        if (this._hoveredHit) {
            this._hoveredHit = null;
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _hideTooltip: function () {
        if (this._tooltip) this._tooltip.style.display = 'none';
    },

    updateView: function (data, config) {
        this._setupContainer();
        this._lastConfig = config;

        if (!data || !data.rows || data.rows.length === 0) {
            this._drawEmpty();
            return;
        }

        this._lastData = data;
        this._render(data, config);
    },

    _render: function (data, config) {
        var ns          = theme.getNS(this);
        var themeMode   = theme.getOption(config, ns, 'themeMode', 'auto');
        if (themeMode === 'auto') { themeMode = theme.detectTheme(); }

        var accentIntensity = parseFloat(theme.getOption(config, ns, 'accentIntensity', '50')) / 100;
        var showTotals  = theme.getOption(config, ns, 'showTotals',  'true')  === 'true';
        var showLegend  = theme.getOption(config, ns, 'showLegend',  'true')  === 'true';

        // Configurable segment colors
        var colorIn  = theme.getOption(config, ns, 'colorInStock',  '#5E8F5C');
        var colorLow = theme.getOption(config, ns, 'colorLowStock', '#C9956B');
        var colorCri = theme.getOption(config, ns, 'colorCritical', '#B86B52');

        // Cache for tooltip use
        this._colorIn  = colorIn;
        this._colorLow = colorLow;
        this._colorCri = colorCri;

        var t = theme.getTheme(themeMode);
        var p = t.palette;

        // Parse items using config-driven field names
        var items = this._parseItems(data, config, ns);
        if (!items || items.length === 0) {
            this._drawEmpty();
            return;
        }
        this._renderItems = items;

        var setup = theme.setupCanvas(this.el);
        var ctx   = setup.ctx;
        var w     = setup.w;
        var h     = setup.h;
        this._canvas = setup.canvas;

        // Style tooltip
        var tip = this._tooltip;
        tip.style.background = p.panelHi;
        tip.style.color      = p.text;
        tip.style.fontFamily = t.fonts.ui;
        tip.style.border     = '1px solid ' + p.grid;

        ctx.clearRect(0, 0, w, h);

        var rowCount = items.length;
        if (rowCount === 0) return;

        // Layout
        var LEGEND_H = showLegend ? Math.max(22, h * 0.06) : 0;
        var padTop   = Math.max(8,  h * 0.03);
        var padBot   = LEGEND_H + Math.max(6, h * 0.02);
        var padLeft  = Math.max(6,  w * 0.015);
        var padRight = Math.max(6,  w * 0.015);

        var LABEL_W   = Math.round(w * 0.28);
        var TOTAL_W   = showTotals ? Math.round(w * 0.10) : 0;
        var RIGHT_PAD = Math.round(w * 0.05);
        var barAreaX  = padLeft + LABEL_W + Math.round(w * 0.01);
        var barAreaW  = w - barAreaX - TOTAL_W - RIGHT_PAD;

        var availH   = h - padTop - padBot;
        var rowGap   = Math.max(2, Math.round(h * 0.015));
        var rowH     = Math.max(18, Math.floor((availH - rowGap * (rowCount - 1)) / rowCount));
        var fontSize  = Math.max(9,  Math.round(rowH * 0.42));
        var datFontSz = Math.max(8,  Math.round(rowH * 0.38));
        var barRx     = Math.min(3, rowH / 2);

        this._hitRegions = [];

        for (var i = 0; i < rowCount; i++) {
            var item  = items[i];
            var rowY  = padTop + i * (rowH + rowGap);
            var total = item.inStock + item.lowStock + item.critical;
            if (total <= 0) continue;

            var fracIn  = item.inStock  / total;
            var fracLow = item.lowStock / total;

            // Pixel widths — distribute remainder to avoid rounding gaps
            var wIn  = Math.round(fracIn  * barAreaW);
            var wLow = Math.round(fracLow * barAreaW);
            var wCri = barAreaW - wIn - wLow;
            if (wCri < 0) { wCri = 0; wLow = barAreaW - wIn; }

            var segs = [
                { val: item.inStock,  segW: wIn,  color: colorIn,  segIdx: 0 },
                { val: item.lowStock, segW: wLow, color: colorLow, segIdx: 1 },
                { val: item.critical, segW: wCri, color: colorCri, segIdx: 2 }
            ];

            // Determine hovered segment for this row
            var hovRow = this._hoveredHit && this._hoveredHit.rowIdx === i ? this._hoveredHit.segIdx : -1;

            // Draw each segment
            var curX = barAreaX;
            for (var si = 0; si < segs.length; si++) {
                var seg = segs[si];
                if (seg.segW <= 0) { continue; }

                var isHovSeg = (hovRow === seg.segIdx);

                // Determine if this is the last visible segment
                var isLast = true;
                for (var sj = si + 1; sj < segs.length; sj++) {
                    if (segs[sj].segW > 0) { isLast = false; break; }
                }

                var segX = curX;
                var segW = isLast ? seg.segW : (seg.segW - SEG_GAP);
                if (segW <= 0) { curX += seg.segW; continue; }

                // Independent left/right radius
                var rxLeft  = (si === 0) ? barRx : 0;
                var rxRight = isLast     ? barRx : 0;

                var baseAlpha = 0.72 + accentIntensity * 0.28;
                var drawColor = seg.color;
                if (isHovSeg) {
                    drawColor = theme.lerpColor(drawColor, '#FFFFFF', 0.20);
                    baseAlpha = 1.0;
                }

                // Strata gradient: lighter top, darker bottom
                var grad = ctx.createLinearGradient(segX, rowY, segX, rowY + rowH);
                grad.addColorStop(0,   theme.lerpColor(drawColor, '#FFFFFF', 0.12));
                grad.addColorStop(0.5, drawColor);
                grad.addColorStop(1,   theme.lerpColor(drawColor, '#000000', 0.15));

                ctx.save();
                ctx.globalAlpha = baseAlpha;
                ctx.beginPath();

                var bx = segX;
                var by = rowY;
                var bw = segW;
                var bh = rowH;

                ctx.moveTo(bx + rxLeft, by);
                ctx.lineTo(bx + bw - rxRight, by);
                if (rxRight > 0) {
                    ctx.arcTo(bx + bw, by,      bx + bw, by + bh, rxRight);
                    ctx.arcTo(bx + bw, by + bh, bx,      by + bh, rxRight);
                } else {
                    ctx.lineTo(bx + bw, by);
                    ctx.lineTo(bx + bw, by + bh);
                }
                ctx.lineTo(bx + rxLeft, by + bh);
                if (rxLeft > 0) {
                    ctx.arcTo(bx, by + bh, bx, by, rxLeft);
                    ctx.arcTo(bx, by,      bx + bw, by, rxLeft);
                } else {
                    ctx.lineTo(bx, by + bh);
                    ctx.lineTo(bx, by);
                }
                ctx.closePath();

                ctx.fillStyle = grad;
                ctx.fill();

                // Thin top highlight — strata surface sheen
                ctx.beginPath();
                ctx.moveTo(bx + rxLeft, by + 1);
                ctx.lineTo(bx + bw - rxRight, by + 1);
                ctx.strokeStyle = 'rgba(255,255,255,0.10)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.restore();

                // Glow layer for hovered segment
                if (isHovSeg) {
                    ctx.save();
                    ctx.shadowBlur  = Math.round(rowH * 0.5 * accentIntensity);
                    ctx.shadowColor = drawColor;
                    ctx.globalAlpha = 0.25 * accentIntensity;
                    ctx.fillStyle   = drawColor;
                    ctx.beginPath();
                    ctx.rect(bx, by, bw, bh);
                    ctx.fill();
                    ctx.shadowBlur  = 0;
                    ctx.shadowColor = 'transparent';
                    ctx.restore();
                }

                // Register hit region
                this._hitRegions.push({
                    rowIdx: i,
                    segIdx: seg.segIdx,
                    x: segX,
                    y: rowY,
                    w: seg.segW,
                    h: rowH
                });

                curX += seg.segW;
            }

            // Row separator line
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(barAreaX, rowY + rowH + Math.floor(rowGap / 2));
            ctx.lineTo(barAreaX + barAreaW, rowY + rowH + Math.floor(rowGap / 2));
            ctx.strokeStyle = p.edge;
            ctx.lineWidth   = 1;
            ctx.stroke();
            ctx.restore();

            // Category label — left-aligned, clipped to label column
            ctx.save();
            ctx.font         = '500 ' + fontSize + 'px ' + t.fonts.ui;
            ctx.fillStyle    = (hovRow >= 0) ? p.text : p.textDim;
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            ctx.beginPath();
            ctx.rect(padLeft, rowY, LABEL_W - 4, rowH);
            ctx.clip();
            ctx.fillText(item.category, padLeft, rowY + rowH * 0.5);
            ctx.restore();

            // Total units — right of bar
            if (showTotals && TOTAL_W > 0) {
                var totalX = barAreaX + barAreaW + Math.round(w * 0.01);
                ctx.save();
                ctx.font         = '400 ' + datFontSz + 'px ' + t.fonts.data;
                ctx.fillStyle    = (hovRow >= 0) ? p.textDim : p.textMuted;
                ctx.textAlign    = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(theme.fmtNum(item.total, { compact: true }), totalX, rowY + rowH * 0.5);
                ctx.restore();
            }
        }

        // Legend at bottom
        if (showLegend && LEGEND_H > 0) {
            this._drawLegend(ctx, w, h, LEGEND_H, t, p, accentIntensity,
                colorIn, colorLow, colorCri);
        }
    },

    _drawLegend: function (ctx, w, h, legendH, t, p, accentIntensity,
                           colorIn, colorLow, colorCri) {
        var legendY     = h - legendH;
        var itemSpacing = Math.round(w * 0.22);
        var dotSize     = Math.max(7, legendH * 0.32);
        var legendFsz   = Math.max(9, legendH * 0.38);
        var labels      = ['In Stock', 'Low Stock', 'Critical'];
        var colors      = [colorIn, colorLow, colorCri];
        var totalLegW   = itemSpacing * 3;
        var startX      = Math.round((w - totalLegW) / 2) + Math.round(itemSpacing / 2);

        // Thin rule above legend
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, legendY);
        ctx.lineTo(w, legendY);
        ctx.strokeStyle = p.edge;
        ctx.lineWidth   = 1;
        ctx.stroke();
        ctx.restore();

        for (var li = 0; li < labels.length; li++) {
            var lx = startX + li * itemSpacing;
            var ly = legendY + legendH * 0.5;

            ctx.save();
            ctx.fillStyle   = colors[li];
            ctx.globalAlpha = 0.75 + accentIntensity * 0.25;
            ctx.beginPath();
            ctx.rect(lx - dotSize / 2, ly - dotSize / 2, dotSize, dotSize);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.restore();

            ctx.save();
            ctx.font         = '400 ' + legendFsz + 'px ' + t.fonts.ui;
            ctx.fillStyle    = p.textMuted;
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(labels[li], lx + dotSize / 2 + 5, ly);
            ctx.restore();
        }
    },

    _drawEmpty: function () {
        if (!this._container) return;
        var setup = theme.setupCanvas(this.el);
        var ctx   = setup.ctx;
        ctx.clearRect(0, 0, setup.w, setup.h);
        ctx.font         = '400 13px ' + theme.getTheme('dark').fonts.ui;
        ctx.fillStyle    = 'rgba(230,225,217,0.25)';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No data', setup.w / 2, setup.h / 2);
    },

    reflow: function () {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    destroy: function () {
        var el = this.el;
        if (this._boundMouseMove)  { el.removeEventListener('mousemove',  this._boundMouseMove); }
        if (this._boundMouseLeave) { el.removeEventListener('mouseleave', this._boundMouseLeave); }
        this._container   = null;
        this._canvas      = null;
        this._tooltip     = null;
        this._lastData    = null;
        this._lastConfig  = null;
        this._hitRegions  = [];
        this._hoveredHit  = null;
        this._renderItems = null;
        SplunkVisualizationBase.prototype.destroy && SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
