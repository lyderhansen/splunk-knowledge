/*
 * Uber Operations — Routes Table
 * Ranked route table with sort, pagination, avg fare, satisfaction.
 * Columns: rank, route, trips, avg fare, avg duration, satisfaction.
 * Sort by clicking column headers. Paginate with controls at bottom.
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
        this._sortCol = -1;
        this._sortAsc = true;
        this._page = 0;

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
        this.el.addEventListener('click', function(e) {
            self._onClick(e);
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
        var rowsPerPage = theme.parseNum(theme.getOption(config, ns, 'rowsPerPage', '10'), 10);
        var accentColor = theme.getOption(config, ns, 'accentColor', t.accent);

        /* Column definitions */
        var cols = [
            { field: theme.getOption(config, ns, 'rankField', 'rank'), label: '#', align: 'center', width: 0.06, numeric: true },
            { field: theme.getOption(config, ns, 'routeField', 'route'), label: 'ROUTE', align: 'left', width: 0.30, numeric: false },
            { field: theme.getOption(config, ns, 'tripCountField', 'trip_count'), label: 'TRIPS', align: 'right', width: 0.14, numeric: true },
            { field: theme.getOption(config, ns, 'avgFareField', 'avg_fare'), label: 'AVG FARE', align: 'right', width: 0.14, numeric: true },
            { field: theme.getOption(config, ns, 'avgDurationField', 'avg_duration'), label: 'DURATION', align: 'right', width: 0.16, numeric: false },
            { field: theme.getOption(config, ns, 'satisfactionField', 'satisfaction'), label: 'SAT', align: 'right', width: 0.20, numeric: false }
        ];

        /* Map columns to data indices */
        for (var ci = 0; ci < cols.length; ci++) {
            cols[ci].idx = colIdx[cols[ci].field] !== undefined ? colIdx[cols[ci].field] : -1;
        }

        /* Sort the data */
        var allRows = data.rows.slice();
        var sortCol = this._sortCol;
        var sortAsc = this._sortAsc;
        if (sortCol >= 0 && sortCol < cols.length && cols[sortCol].idx >= 0) {
            var si = cols[sortCol].idx;
            var isNum = cols[sortCol].numeric;
            allRows.sort(function(a, b) {
                var va = a[si];
                var vb = b[si];
                if (isNum) {
                    va = parseFloat(String(va).replace(/[^0-9.\-]/g, ''));
                    vb = parseFloat(String(vb).replace(/[^0-9.\-]/g, ''));
                    if (isNaN(va)) va = 0;
                    if (isNaN(vb)) vb = 0;
                } else {
                    va = String(va || '').toLowerCase();
                    vb = String(vb || '').toLowerCase();
                }
                if (va < vb) return sortAsc ? -1 : 1;
                if (va > vb) return sortAsc ? 1 : -1;
                return 0;
            });
        }

        /* Pagination */
        var totalPages = Math.ceil(allRows.length / rowsPerPage);
        if (this._page >= totalPages) this._page = Math.max(0, totalPages - 1);
        var startIdx = this._page * rowsPerPage;
        var pageRows = allRows.slice(startIdx, startIdx + rowsPerPage);

        /* Layout */
        var pad = Math.max(6, w * 0.02);
        var headerH = Math.max(24, h * 0.08);
        var footerH = Math.max(24, h * 0.07);
        var availH = h - headerH - footerH;
        var rowH = Math.max(20, Math.floor(availH / Math.max(1, rowsPerPage)));
        var headerFont = Math.max(7, Math.min(10, headerH * 0.4));
        var bodyFont = Math.max(8, Math.min(13, rowH * 0.42));
        var footerFont = Math.max(8, Math.min(11, footerH * 0.45));

        this._hitRegions = [];
        this._headerRegions = [];
        this._paginationRegions = [];

        /* Column x positions */
        var colX = [];
        var cx = pad;
        for (var c = 0; c < cols.length; c++) {
            colX.push(cx);
            cx += Math.round(cols[c].width * (w - pad * 2));
        }

        /* Header row */
        ctx.fillStyle = theme.withAlpha(t.text, 0.03);
        ctx.fillRect(pad, 0, w - pad * 2, headerH);

        /* Header accent line at bottom */
        ctx.fillStyle = accentColor;
        ctx.fillRect(pad, headerH - 2, w - pad * 2, 2);

        ctx.font = 'bold ' + headerFont + 'px ' + theme.FONTS.ui;
        ctx.textBaseline = 'middle';
        for (var ch = 0; ch < cols.length; ch++) {
            var colW = ch < cols.length - 1 ? colX[ch + 1] - colX[ch] : (w - pad - colX[ch]);
            ctx.textAlign = cols[ch].align;
            var hx = cols[ch].align === 'right' ? colX[ch] + colW - 4 :
                     cols[ch].align === 'center' ? colX[ch] + colW / 2 : colX[ch] + 4;

            /* Sort indicator */
            var isActive = sortCol === ch;
            ctx.fillStyle = isActive ? accentColor : t.textFaint;
            var headerLabel = cols[ch].label;
            if (isActive) {
                headerLabel += sortAsc ? ' ▲' : ' ▼';
            }
            ctx.fillText(headerLabel, hx, headerH / 2);

            this._headerRegions.push({
                x: colX[ch], y: 0, w: colW, h: headerH, col: ch
            });
        }

        /* Data rows */
        for (var r = 0; r < pageRows.length; r++) {
            var row = pageRows[r];
            var ry = headerH + r * rowH;
            var isHovered = this._hoverIdx === r;

            /* Alternating row bg */
            if (r % 2 === 0) {
                ctx.fillStyle = theme.withAlpha(t.text, 0.015);
                ctx.fillRect(pad, ry, w - pad * 2, rowH);
            }

            /* Hover highlight */
            if (isHovered) {
                ctx.fillStyle = theme.withAlpha(accentColor, 0.08);
                ctx.fillRect(pad, ry, w - pad * 2, rowH);
            }

            /* Cell values */
            ctx.font = bodyFont + 'px ' + theme.FONTS.data;
            ctx.textBaseline = 'middle';
            for (var cc = 0; cc < cols.length; cc++) {
                var cellW = cc < cols.length - 1 ? colX[cc + 1] - colX[cc] : (w - pad - colX[cc]);
                var cellVal = cols[cc].idx >= 0 ? String(row[cols[cc].idx] || '') : '';

                /* Special formatting for satisfaction — pill badge */
                if (cols[cc].field === theme.getOption(config, ns, 'satisfactionField', 'satisfaction') && cellVal) {
                    var satVal = parseFloat(cellVal.replace('%', ''));
                    var satColor = !isNaN(satVal) && satVal >= 97 ? '#06C167' :
                                   !isNaN(satVal) && satVal >= 95 ? '#276EF1' : '#FF6937';
                    var pillW = ctx.measureText(cellVal).width + 16;
                    var pillH = rowH * 0.55;
                    var pillX = colX[cc] + cellW - pillW - 4;
                    var pillY = ry + (rowH - pillH) / 2;
                    theme.roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
                    ctx.fillStyle = theme.withAlpha(satColor, 0.15);
                    ctx.fill();
                    ctx.strokeStyle = theme.withAlpha(satColor, 0.4);
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.fillStyle = satColor;
                    ctx.textAlign = 'center';
                    ctx.fillText(cellVal, pillX + pillW / 2, ry + rowH / 2);
                    continue;
                }

                /* Special formatting for avg fare — dollar prefix */
                if (cols[cc].field === theme.getOption(config, ns, 'avgFareField', 'avg_fare') && cellVal) {
                    var fareVal = parseFloat(cellVal);
                    if (!isNaN(fareVal)) {
                        cellVal = '$' + fareVal.toFixed(2);
                    }
                }

                /* Rank column — bold accent */
                if (cc === 0) {
                    ctx.font = 'bold ' + bodyFont + 'px ' + theme.FONTS.data;
                    ctx.fillStyle = theme.withAlpha(accentColor, 0.6);
                } else if (cc === 1) {
                    ctx.font = bodyFont + 'px ' + theme.FONTS.ui;
                    ctx.fillStyle = t.text;
                } else {
                    ctx.font = bodyFont + 'px ' + theme.FONTS.data;
                    ctx.fillStyle = t.textDim;
                }

                ctx.textAlign = cols[cc].align;
                var cellX = cols[cc].align === 'right' ? colX[cc] + cellW - 4 :
                            cols[cc].align === 'center' ? colX[cc] + cellW / 2 : colX[cc] + 4;
                ctx.fillText(cellVal, cellX, ry + rowH / 2);
            }

            /* Row separator */
            ctx.fillStyle = t.grid;
            ctx.fillRect(pad, ry + rowH - 1, w - pad * 2, 1);

            /* Hit region */
            var tipParts = [];
            for (var tc = 0; tc < cols.length; tc++) {
                var tv = cols[tc].idx >= 0 ? String(row[cols[tc].idx] || '') : '';
                tipParts.push(cols[tc].label + ': ' + tv);
            }
            this._hitRegions.push({
                x: pad, y: ry, w: w - pad * 2, h: rowH,
                tip: tipParts.join('  |  ')
            });
        }

        /* Footer — pagination controls */
        var footerY = h - footerH;
        ctx.fillStyle = theme.withAlpha(t.text, 0.02);
        ctx.fillRect(pad, footerY, w - pad * 2, footerH);

        ctx.font = footerFont + 'px ' + theme.FONTS.data;
        ctx.textBaseline = 'middle';

        /* Page info */
        var pageInfo = 'Page ' + (this._page + 1) + ' of ' + totalPages + '  (' + allRows.length + ' routes)';
        ctx.fillStyle = t.textDim;
        ctx.textAlign = 'center';
        ctx.fillText(pageInfo, w / 2, footerY + footerH / 2);

        /* Prev button */
        var btnW = Math.max(40, w * 0.05);
        var btnH = footerH * 0.65;
        var prevX = pad + 4;
        var btnY = footerY + (footerH - btnH) / 2;
        var canPrev = this._page > 0;
        theme.roundRect(ctx, prevX, btnY, btnW, btnH, 2);
        ctx.fillStyle = canPrev ? theme.withAlpha(accentColor, 0.15) : theme.withAlpha(t.text, 0.04);
        ctx.fill();
        ctx.font = 'bold ' + footerFont + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = canPrev ? accentColor : t.textFaint;
        ctx.textAlign = 'center';
        ctx.fillText('◀ PREV', prevX + btnW / 2, footerY + footerH / 2);
        this._paginationRegions.push({ x: prevX, y: btnY, w: btnW, h: btnH, action: 'prev' });

        /* Next button */
        var nextX = w - pad - btnW - 4;
        var canNext = this._page < totalPages - 1;
        theme.roundRect(ctx, nextX, btnY, btnW, btnH, 2);
        ctx.fillStyle = canNext ? theme.withAlpha(accentColor, 0.15) : theme.withAlpha(t.text, 0.04);
        ctx.fill();
        ctx.fillStyle = canNext ? accentColor : t.textFaint;
        ctx.textAlign = 'center';
        ctx.fillText('NEXT ▶', nextX + btnW / 2, footerY + footerH / 2);
        this._paginationRegions.push({ x: nextX, y: btnY, w: btnW, h: btnH, action: 'next' });
    },

    _onMouseMove: function(e) {
        var canvas = this.canvas;
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        /* Check header hover for sort cursor */
        var headerHit = false;
        for (var hh = 0; hh < this._headerRegions.length; hh++) {
            var hr = this._headerRegions[hh];
            if (mx >= hr.x && mx <= hr.x + hr.w && my >= hr.y && my <= hr.y + hr.h) {
                canvas.style.cursor = 'pointer';
                headerHit = true;
                break;
            }
        }

        /* Check pagination hover */
        if (!headerHit) {
            for (var pp = 0; pp < this._paginationRegions.length; pp++) {
                var pr = this._paginationRegions[pp];
                if (mx >= pr.x && mx <= pr.x + pr.w && my >= pr.y && my <= pr.y + pr.h) {
                    canvas.style.cursor = 'pointer';
                    headerHit = true;
                    break;
                }
            }
        }

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
            if (tx + 280 > this.el.offsetWidth) tx = mx - 280;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top = ty + 'px';
            if (!headerHit) canvas.style.cursor = 'pointer';
            if (this._hoverIdx !== hit) {
                this._hoverIdx = hit;
                this._render(this._lastData, this._lastConfig);
            }
        } else {
            this._tooltip.style.display = 'none';
            if (!headerHit) canvas.style.cursor = 'default';
            if (this._hoverIdx !== -1) {
                this._hoverIdx = -1;
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _onClick: function(e) {
        var canvas = this.canvas;
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        /* Check header click for sort */
        for (var hh = 0; hh < this._headerRegions.length; hh++) {
            var hr = this._headerRegions[hh];
            if (mx >= hr.x && mx <= hr.x + hr.w && my >= hr.y && my <= hr.y + hr.h) {
                if (this._sortCol === hr.col) {
                    this._sortAsc = !this._sortAsc;
                } else {
                    this._sortCol = hr.col;
                    this._sortAsc = true;
                }
                this._page = 0;
                this._render(this._lastData, this._lastConfig);
                return;
            }
        }

        /* Check pagination click */
        for (var pp = 0; pp < this._paginationRegions.length; pp++) {
            var pr = this._paginationRegions[pp];
            if (mx >= pr.x && mx <= pr.x + pr.w && my >= pr.y && my <= pr.y + pr.h) {
                if (pr.action === 'prev' && this._page > 0) {
                    this._page--;
                } else if (pr.action === 'next') {
                    this._page++;
                }
                this._render(this._lastData, this._lastConfig);
                return;
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
