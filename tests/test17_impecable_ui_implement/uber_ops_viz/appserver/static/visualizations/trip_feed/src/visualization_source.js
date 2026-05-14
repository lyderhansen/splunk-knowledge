/*
 * Uber Operations — Trip Feed
 * Live scrolling feed of completed trips with fare, distance, duration, rating.
 * Each row: left accent bar + route + fare + stats strip.
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
            'pointer-events:none;white-space:pre-line;z-index:100;' +
            'font-size:11px;border-radius:2px;max-width:280px;';
        this.el.style.position = 'relative';
        this.el.appendChild(this._tooltip);

        this._hitRegions = [];
        this._hoverIdx = -1;
        this._scrollOffset = 0;
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
        this.el.addEventListener('wheel', function(e) {
            e.preventDefault();
            self._scrollOffset = Math.max(0, self._scrollOffset + (e.deltaY > 0 ? 1 : -1));
            if (self._lastData && self._lastConfig) {
                self._render(self._lastData, self._lastConfig);
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

        var colIdx = data.colIdx;
        var tripIdField = theme.getOption(config, ns, 'tripIdField', 'trip_id');
        var originField = theme.getOption(config, ns, 'originField', 'origin');
        var destField = theme.getOption(config, ns, 'destinationField', 'destination');
        var fareField = theme.getOption(config, ns, 'fareField', 'fare');
        var distField = theme.getOption(config, ns, 'distanceField', 'distance');
        var durField = theme.getOption(config, ns, 'durationField', 'duration');
        var ratingField = theme.getOption(config, ns, 'ratingField', 'rating');
        var accentColor = theme.getOption(config, ns, 'accentColor', t.accent);

        var tii = colIdx[tripIdField] !== undefined ? colIdx[tripIdField] : -1;
        var oi = colIdx[originField] !== undefined ? colIdx[originField] : -1;
        var dsi = colIdx[destField] !== undefined ? colIdx[destField] : -1;
        var fi = colIdx[fareField] !== undefined ? colIdx[fareField] : -1;
        var dii = colIdx[distField] !== undefined ? colIdx[distField] : -1;
        var dui = colIdx[durField] !== undefined ? colIdx[durField] : -1;
        var rii = colIdx[ratingField] !== undefined ? colIdx[ratingField] : -1;

        /* Layout scaling */
        var pad = Math.max(6, w * 0.02);
        var gap = Math.max(2, h * 0.008);
        var rowH = Math.max(32, Math.floor(h * 0.11));
        var barW = Math.max(3, Math.round(w * 0.006));
        var routeFont = Math.max(9, Math.round(rowH * 0.32));
        var fareFont = Math.max(10, Math.round(rowH * 0.38));
        var metaFont = Math.max(7, Math.round(rowH * 0.22));

        var visibleRows = Math.floor((h - pad) / (rowH + gap));
        var maxScroll = Math.max(0, data.rows.length - visibleRows);
        if (this._scrollOffset > maxScroll) this._scrollOffset = maxScroll;
        var startRow = this._scrollOffset;

        this._hitRegions = [];

        for (var r = 0; r < visibleRows && (startRow + r) < data.rows.length; r++) {
            var row = data.rows[startRow + r];
            var ry = pad + r * (rowH + gap);

            var tripId = tii >= 0 ? String(row[tii] || '') : '';
            var origin = oi >= 0 ? String(row[oi] || '') : '';
            var dest = dsi >= 0 ? String(row[dsi] || '') : '';
            var fare = fi >= 0 ? String(row[fi] || '') : '';
            var dist = dii >= 0 ? String(row[dii] || '') : '';
            var dur = dui >= 0 ? String(row[dui] || '') : '';
            var rating = rii >= 0 ? String(row[rii] || '') : '';

            var isHovered = (this._hoverIdx === r);

            /* Row background with hover */
            if (isHovered) {
                theme.roundRect(ctx, pad, ry, w - pad * 2, rowH, 2);
                ctx.fillStyle = theme.withAlpha(accentColor, 0.08);
                ctx.fill();
            }

            /* Row separator line */
            ctx.fillStyle = t.edge;
            ctx.fillRect(pad + barW + 8, ry + rowH - 1, w - pad * 2 - barW - 8, 1);

            /* Left accent bar — color by rating */
            var rVal = parseFloat(rating);
            var barColor = accentColor;
            if (!isNaN(rVal)) {
                if (rVal >= 4.8) barColor = '#06C167';
                else if (rVal >= 4.5) barColor = '#276EF1';
                else barColor = '#FF6937';
            }
            ctx.fillStyle = barColor;
            ctx.fillRect(pad, ry + 2, barW, rowH - 4);

            /* Route line: Origin -> Destination */
            var routeX = pad + barW + 10;
            ctx.font = 'bold ' + routeFont + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.text;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            var routeStr = origin + '  →  ' + dest;
            ctx.fillText(routeStr, routeX, ry + rowH * 0.12);

            /* Fare — right-aligned, prominent */
            var fareStr = '$' + fare;
            ctx.font = 'bold ' + fareFont + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.text;
            ctx.textAlign = 'right';
            ctx.fillText(fareStr, w - pad - 4, ry + rowH * 0.08);

            /* Meta line: distance | duration | rating | trip ID */
            ctx.font = metaFont + 'px ' + theme.FONTS.data;
            ctx.fillStyle = t.textDim;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            var metaParts = [];
            if (dist) metaParts.push(dist + ' mi');
            if (dur) metaParts.push(dur);
            if (rating) metaParts.push('★ ' + rating);
            if (tripId) metaParts.push(tripId);
            ctx.fillText(metaParts.join('  ·  '), routeX, ry + rowH - 4);

            /* Hit region */
            this._hitRegions.push({
                x: pad, y: ry, w: w - pad * 2, h: rowH,
                tip: tripId + '\n' + origin + ' → ' + dest +
                    '\nFare: $' + fare + '  Distance: ' + dist + ' mi' +
                    '\nDuration: ' + dur + '  Rating: ' + rating
            });
        }

        /* Scroll indicator */
        if (data.rows.length > visibleRows) {
            var scrollH = h - pad * 2;
            var thumbH = Math.max(20, scrollH * (visibleRows / data.rows.length));
            var thumbY = pad + (scrollH - thumbH) * (this._scrollOffset / maxScroll);
            ctx.fillStyle = theme.withAlpha(t.text, 0.12);
            ctx.fillRect(w - 3, pad, 2, scrollH);
            ctx.fillStyle = theme.withAlpha(accentColor, 0.4);
            theme.roundRect(ctx, w - 3, thumbY, 2, thumbH, 1);
            ctx.fill();
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
            if (tx + 200 > this.el.offsetWidth) tx = mx - 200;
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
