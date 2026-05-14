var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

module.exports = SplunkVisualizationBase.extend({
    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.overflow = 'hidden';
        this.el.style.position = 'relative';

        var canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        this.el.appendChild(canvas);
        this.canvas = canvas;

        this._lastData = null;
        this._lastConfig = null;
        this._lastGoodData = null;

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:8px 12px;' +
            'border-radius:2px;pointer-events:none;white-space:pre-line;' +
            'z-index:100;font-family:monospace;font-size:11px;max-width:280px;';
        this.el.appendChild(this._tooltip);

        this._hoverIdx = -1;
        this._hitRegions = [];

        var self = this;
        this.canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
        this.canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self.canvas.style.cursor = 'default';
            if (self._hoverIdx !== -1) {
                self._hoverIdx = -1;
                self._render(self._lastData, self._lastConfig);
            }
        });
        this.canvas.addEventListener('click', function(e) { self._onClick(e); });
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
        if (!data) {
            if (this._lastGoodData) data = this._lastGoodData;
            else return;
        }
        this._lastData = data;
        this._lastConfig = config;
        var self = this;
        theme.loadFonts(function() { self._render(data, config); });
    },

    _render: function(data, config) {
        var el = this.el;
        var w = el.offsetWidth;
        var h = el.offsetHeight;
        if (w <= 0 || h <= 0) return;

        var setup = theme.setupCanvas(el);
        this.canvas = setup.canvas;
        var ctx = setup.ctx;
        w = setup.w;
        h = setup.h;
        ctx.clearRect(0, 0, w, h);

        var ns = theme.getNS(this);
        var t = theme.getTheme(theme.getOption(config, ns, 'theme', 'dark'));
        var accentColor = theme.getOption(config, ns, 'accentColor', '#E50914');
        var gi = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50) / 50;

        this._tooltip.style.background = t.panelHi;
        this._tooltip.style.color = t.text;
        this._tooltip.style.border = '1px solid ' + t.edgeStrong;
        this._tooltip.style.fontFamily = theme.FONTS.data;

        var regionField = theme.getOption(config, ns, 'regionField', 'region');
        var subscribersField = theme.getOption(config, ns, 'subscribersField', 'subscribers');
        var revenueField = theme.getOption(config, ns, 'revenueField', 'revenue');
        var growthField = theme.getOption(config, ns, 'growthField', 'growth');
        var topTitleField = theme.getOption(config, ns, 'topTitleField', 'top_title');

        if (!data || !data.colIdx || !data.rows || data.rows.length === 0) return;

        var colIdx = data.colIdx;
        var rows = data.rows;

        // Parse regions
        var regions = [];
        for (var r = 0; r < rows.length; r++) {
            regions.push({
                name: (colIdx[regionField] !== undefined) ? String(rows[r][colIdx[regionField]] || '') : '',
                subscribers: (colIdx[subscribersField] !== undefined) ? parseFloat(rows[r][colIdx[subscribersField]]) : 0,
                revenue: (colIdx[revenueField] !== undefined) ? parseFloat(rows[r][colIdx[revenueField]]) : 0,
                growth: (colIdx[growthField] !== undefined) ? parseFloat(rows[r][colIdx[growthField]]) : 0,
                topTitle: (colIdx[topTitleField] !== undefined) ? String(rows[r][colIdx[topTitleField]] || '') : ''
            });
        }

        // Grid layout -- cards in a row
        var pad = Math.max(12, w * 0.02);
        var gap = Math.max(8, w * 0.01);
        var cols = Math.min(regions.length, Math.max(2, Math.floor(w / 300)));
        var rowCount = Math.ceil(regions.length / cols);
        var cardW = (w - pad * 2 - gap * (cols - 1)) / cols;
        var cardH = (h - pad * 2 - gap * (rowCount - 1)) / rowCount;

        this._hitRegions = [];

        for (var i = 0; i < regions.length; i++) {
            var region = regions[i];
            var col = i % cols;
            var row2 = Math.floor(i / cols);
            var cx = pad + col * (cardW + gap);
            var cy = pad + row2 * (cardH + gap);

            // Card background
            var isHover = this._hoverIdx === i;
            theme.roundRect(ctx, cx, cy, cardW, cardH, 4);
            ctx.fillStyle = isHover ? t.panelHi : t.panel;
            ctx.fill();
            ctx.strokeStyle = isHover ? theme.withAlpha(accentColor, 0.3 * gi) : t.edge;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Red accent line at top of card
            ctx.fillStyle = accentColor;
            theme.roundRect(ctx, cx, cy, cardW, 3, 4);
            ctx.fill();
            // Square off bottom corners of accent
            ctx.fillRect(cx, cy + 2, cardW, 1);

            var innerPad = Math.max(8, cardW * 0.06);
            var textX = cx + innerPad;
            var textW = cardW - innerPad * 2;

            // Region name
            var nameSize = Math.max(10, Math.min(16, cardH * 0.10));
            ctx.font = '700 ' + nameSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.text;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(region.name, textX, cy + 10);

            // Subscribers -- big number
            var subSize = Math.max(18, Math.min(36, cardH * 0.22));
            ctx.font = 'bold ' + subSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.text;
            ctx.fillText(theme.fmtNum(region.subscribers, { compact: true }), textX, cy + 10 + nameSize + 6);

            // Subscribers label
            var labelSize = Math.max(7, Math.min(10, cardH * 0.06));
            ctx.font = labelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textFaint;
            ctx.fillText('SUBSCRIBERS', textX, cy + 10 + nameSize + 6 + subSize + 2);

            // Growth indicator
            var growthY = cy + 10 + nameSize + 6 + subSize + 2 + labelSize + 10;
            var growthSize = Math.max(10, Math.min(16, cardH * 0.09));
            var growthColor = region.growth >= 0 ? t.success : t.danger;
            var growthArrow = region.growth >= 0 ? '▲' : '▼';
            ctx.font = 'bold ' + growthSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = growthColor;
            ctx.fillText(growthArrow + ' ' + Math.abs(region.growth).toFixed(1) + '%', textX, growthY);

            // Revenue
            var revY = growthY + growthSize + 8;
            var revSize = Math.max(9, Math.min(13, cardH * 0.07));
            ctx.font = revSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.textDim;
            ctx.fillText('$' + theme.fmtNum(region.revenue, { compact: true }), textX, revY);

            ctx.font = (revSize - 2) + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textFaint;
            ctx.fillText('REVENUE', textX + ctx.measureText('$' + theme.fmtNum(region.revenue, { compact: true })).width + 6, revY);

            // Top title
            if (region.topTitle) {
                var titleY = revY + revSize + 8;
                var titleSize = Math.max(8, Math.min(11, cardH * 0.06));
                ctx.font = titleSize + 'px ' + theme.FONTS.ui;
                ctx.fillStyle = t.textFaint;
                ctx.fillText('TOP: ', textX, titleY);
                var topW = ctx.measureText('TOP: ').width;
                ctx.fillStyle = accentColor;
                ctx.fillText(region.topTitle, textX + topW, titleY);
            }

            // Hit region
            this._hitRegions.push({
                x: cx, y: cy, w: cardW, h: cardH,
                tip: '<b>' + region.name + '</b><br>' +
                     'Subscribers: ' + theme.fmtNum(region.subscribers, { compact: true }) + '<br>' +
                     'Revenue: $' + theme.fmtNum(region.revenue, { compact: true }) + '<br>' +
                     'Growth: ' + (region.growth >= 0 ? '+' : '') + region.growth.toFixed(1) + '%<br>' +
                     'Top: ' + region.topTitle,
                drilldownData: { 'click.name': regionField, 'click.value': region.name }
            });
        }
    },

    _onMouseMove: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitTest(mx, my);
        if (hit !== null) {
            var region = this._hitRegions[hit];
            this._tooltip.innerHTML = region.tip;
            this._tooltip.style.display = 'block';
            var tx = mx + 14;
            var ty = my - 10;
            if (tx + 280 > this.el.offsetWidth) tx = mx - 280;
            if (ty < 0) ty = my + 20;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top = ty + 'px';
            this.canvas.style.cursor = 'pointer';
            if (this._hoverIdx !== hit) {
                this._hoverIdx = hit;
                this._render(this._lastData, this._lastConfig);
            }
        } else {
            this._tooltip.style.display = 'none';
            this.canvas.style.cursor = 'default';
            if (this._hoverIdx !== -1) {
                this._hoverIdx = -1;
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
        }
        return null;
    },

    _onClick: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitTest(mx, my);
        if (hit !== null) {
            try {
                this.drilldownToPayload({
                    action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                    data: this._hitRegions[hit].drilldownData
                });
            } catch (ex) {}
        }
    },

    reflow: function() {
        if (this._lastConfig) {
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
