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
        this._sortCol = null;
        this._sortDir = 'desc';
        this._currentPage = 0;
        this._headerH = 0;

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:2px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-family:monospace;font-size:11px;';
        this.el.appendChild(this._tooltip);

        this._hoverIdx = -1;
        this._hitRegions = [];
        this._headerRegions = [];
        this._pageRegions = [];

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
        this.canvas.addEventListener('mousedown', function(e) { self._onMouseDown(e); });
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
        var result = { colIdx: colIdx, rows: data.rows, fields: fields };
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

        var columnsStr = theme.getOption(config, ns, 'columns', 'title_name,type,views,rating,weeks_in_top10,genre');
        var columns = columnsStr.split(',');
        for (var ci = 0; ci < columns.length; ci++) columns[ci] = columns[ci].trim();
        var maxRows = parseInt(theme.getOption(config, ns, 'maxRows', '0'), 10);

        if (!data || !data.colIdx || !data.rows || data.rows.length === 0) return;

        var colIdx = data.colIdx;
        var allRows = [];
        for (var ri = 0; ri < data.rows.length; ri++) {
            allRows.push(data.rows[ri].slice());
        }

        // Sort
        if (this._sortCol !== null && colIdx[this._sortCol] !== undefined) {
            var si = colIdx[this._sortCol];
            var dir = this._sortDir === 'asc' ? 1 : -1;
            allRows.sort(function(a, b) {
                var va = parseFloat(a[si]);
                var vb = parseFloat(b[si]);
                if (!isNaN(va) && !isNaN(vb)) return (va - vb) * dir;
                var sa = String(a[si] || '');
                var sb = String(b[si] || '');
                return sa.localeCompare(sb) * dir;
            });
        }

        if (maxRows > 0 && allRows.length > maxRows) {
            allRows = allRows.slice(0, maxRows);
        }

        // Layout
        var pad = Math.max(8, w * 0.015);
        var headerH = Math.max(28, Math.round(h * 0.08));
        var footerH = 28;
        var fontSize = Math.max(10, Math.min(14, Math.round(h * 0.035)));
        var headerFontSize = Math.max(8, fontSize - 1);
        var rowH = Math.max(22, Math.round(fontSize * 2.2));
        var rowsPerPage = Math.max(1, Math.floor((h - headerH - footerH) / rowH));
        var totalPages = Math.max(1, Math.ceil(allRows.length / rowsPerPage));
        if (this._currentPage >= totalPages) this._currentPage = totalPages - 1;
        var pageRows = allRows.slice(this._currentPage * rowsPerPage, (this._currentPage + 1) * rowsPerPage);

        this._headerH = headerH;

        // Column widths -- proportional
        var tableW = w - pad * 2;
        var colWidths = [];
        var totalWeight = 0;
        for (var cw = 0; cw < columns.length; cw++) {
            var weight = (columns[cw] === 'title_name') ? 2.5 : 1;
            colWidths.push(weight);
            totalWeight += weight;
        }
        for (var cw2 = 0; cw2 < colWidths.length; cw2++) {
            colWidths[cw2] = (colWidths[cw2] / totalWeight) * tableW;
        }

        // Header
        this._headerRegions = [];
        var hx = pad;
        ctx.font = '600 ' + headerFontSize + 'px ' + theme.FONTS.ui;
        ctx.textBaseline = 'middle';

        // Header background
        ctx.fillStyle = t.name === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
        ctx.fillRect(pad, 0, tableW, headerH);

        // Header underline
        ctx.strokeStyle = t.edgeStrong;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad, headerH + 0.5);
        ctx.lineTo(pad + tableW, headerH + 0.5);
        ctx.stroke();

        for (var hi = 0; hi < columns.length; hi++) {
            var headerLabel = columns[hi].replace(/_/g, ' ').toUpperCase();
            ctx.fillStyle = t.textFaint;
            ctx.textAlign = 'left';
            ctx.fillText(headerLabel, hx + 8, headerH / 2);

            // Sort indicator
            if (this._sortCol === columns[hi]) {
                var arrow = this._sortDir === 'asc' ? ' ▲' : ' ▼';
                var labelW = ctx.measureText(headerLabel).width;
                ctx.fillStyle = accentColor;
                ctx.fillText(arrow, hx + 8 + labelW, headerH / 2);
            }

            this._headerRegions.push({ x: hx, y: 0, w: colWidths[hi], h: headerH, col: columns[hi] });
            hx += colWidths[hi];
        }

        // Rows
        this._hitRegions = [];
        for (var r = 0; r < pageRows.length; r++) {
            var row = pageRows[r];
            var ry = headerH + r * rowH;

            // Alternate row bg
            if (r % 2 === 1) {
                ctx.fillStyle = t.name === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
                ctx.fillRect(pad, ry, tableW, rowH);
            }

            // Hover highlight
            if (this._hoverIdx === r) {
                ctx.fillStyle = theme.withAlpha(accentColor, 0.08 * gi);
                ctx.fillRect(pad, ry, tableW, rowH);
            }

            var rx = pad;
            for (var c = 0; c < columns.length; c++) {
                var cellVal = (colIdx[columns[c]] !== undefined) ? String(row[colIdx[columns[c]]] || '') : '';
                var cellY = ry + rowH / 2;

                // Special rendering for type (pill badge)
                if (columns[c] === 'type' && cellVal) {
                    var pillColor = cellVal === 'Series' ? '#E50914' : '#B20710';
                    ctx.font = '500 ' + (fontSize - 2) + 'px ' + theme.FONTS.ui;
                    var pillW = ctx.measureText(cellVal).width + 16;
                    var pillH = fontSize + 4;
                    theme.roundRect(ctx, rx + 8, cellY - pillH / 2, pillW, pillH, pillH / 2);
                    ctx.fillStyle = theme.withAlpha(pillColor, 0.15);
                    ctx.fill();
                    ctx.strokeStyle = theme.withAlpha(pillColor, 0.4);
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.fillStyle = pillColor;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(cellVal, rx + 16, cellY);
                }
                // Rating badge
                else if (columns[c] === 'rating' && cellVal) {
                    var ratingVal = parseFloat(cellVal);
                    var ratingColor = ratingVal >= 8 ? t.success : (ratingVal >= 7 ? t.warn : t.textDim);
                    ctx.font = 'bold ' + fontSize + 'px ' + theme.FONTS.data;
                    ctx.fillStyle = ratingColor;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(cellVal, rx + 8, cellY);
                }
                // Genre pill
                else if (columns[c] === 'genre' && cellVal) {
                    var genreColors = [t.s1, t.s2, t.s3, t.s4, t.s5];
                    var genreHash = 0;
                    for (var gh = 0; gh < cellVal.length; gh++) genreHash += cellVal.charCodeAt(gh);
                    var gc = genreColors[genreHash % genreColors.length];
                    ctx.font = (fontSize - 1) + 'px ' + theme.FONTS.ui;
                    var gw = ctx.measureText(cellVal).width + 14;
                    var gh2 = fontSize + 2;
                    theme.roundRect(ctx, rx + 8, cellY - gh2 / 2, gw, gh2, 3);
                    ctx.fillStyle = theme.withAlpha(gc, 0.12);
                    ctx.fill();
                    ctx.fillStyle = gc;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(cellVal, rx + 15, cellY);
                }
                // Numeric values
                else {
                    var numVal = parseFloat(cellVal);
                    if (!isNaN(numVal) && columns[c] !== 'title_name') {
                        ctx.font = fontSize + 'px ' + theme.FONTS.data;
                        ctx.fillStyle = t.text;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(theme.fmtNum(numVal, { compact: true }), rx + 8, cellY);
                    } else {
                        ctx.font = fontSize + 'px ' + theme.FONTS.ui;
                        ctx.fillStyle = t.text;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        // Truncate long titles
                        var maxCellW = colWidths[c] - 16;
                        var truncated = cellVal;
                        while (ctx.measureText(truncated).width > maxCellW && truncated.length > 3) {
                            truncated = truncated.substring(0, truncated.length - 2) + '...';
                        }
                        ctx.fillText(truncated, rx + 8, cellY);
                    }
                }

                rx += colWidths[c];
            }

            // Build tooltip for row
            var tipParts = [];
            for (var tc = 0; tc < columns.length; tc++) {
                var tv = (colIdx[columns[tc]] !== undefined) ? String(row[colIdx[columns[tc]]] || '') : '';
                tipParts.push('<b>' + columns[tc].replace(/_/g, ' ') + '</b>: ' + tv);
            }

            this._hitRegions.push({
                x: pad, y: ry, w: tableW, h: rowH,
                tip: tipParts.join('<br>'),
                drilldownData: {
                    'click.name': columns[0],
                    'click.value': (colIdx[columns[0]] !== undefined) ? String(row[colIdx[columns[0]]] || '') : ''
                }
            });
        }

        // Row separator lines
        for (var sl = 1; sl < pageRows.length; sl++) {
            var sly = headerH + sl * rowH;
            ctx.strokeStyle = t.grid;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad, sly + 0.5);
            ctx.lineTo(pad + tableW, sly + 0.5);
            ctx.stroke();
        }

        // Pagination footer
        this._pageRegions = [];
        if (totalPages > 1) {
            var footerY = h - footerH;
            ctx.font = (fontSize - 1) + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textDim;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            var pageText = 'Page ' + (this._currentPage + 1) + ' of ' + totalPages;
            ctx.fillText(pageText, w / 2, footerY + footerH / 2);

            // Prev button
            if (this._currentPage > 0) {
                ctx.fillStyle = t.textDim;
                ctx.textAlign = 'center';
                ctx.fillText('< Prev', w / 2 - 80, footerY + footerH / 2);
                this._pageRegions.push({ x: w / 2 - 110, y: footerY, w: 60, h: footerH, action: 'prev' });
            }
            // Next button
            if (this._currentPage < totalPages - 1) {
                ctx.fillStyle = t.textDim;
                ctx.textAlign = 'center';
                ctx.fillText('Next >', w / 2 + 80, footerY + footerH / 2);
                this._pageRegions.push({ x: w / 2 + 50, y: footerY, w: 60, h: footerH, action: 'next' });
            }
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
            if (tx + 300 > this.el.offsetWidth) tx = mx - 300;
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
            // Check if over header for sort cursor
            var overHeader = false;
            for (var hi = 0; hi < this._headerRegions.length; hi++) {
                var hr = this._headerRegions[hi];
                if (mx >= hr.x && mx <= hr.x + hr.w && my >= hr.y && my <= hr.y + hr.h) {
                    overHeader = true;
                    break;
                }
            }
            this.canvas.style.cursor = overHeader ? 'pointer' : 'default';
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

    _onMouseDown: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        // Header click -> sort
        for (var hi = 0; hi < this._headerRegions.length; hi++) {
            var hr = this._headerRegions[hi];
            if (mx >= hr.x && mx <= hr.x + hr.w && my >= hr.y && my <= hr.y + hr.h) {
                if (this._sortCol === hr.col) {
                    this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this._sortCol = hr.col;
                    this._sortDir = 'desc';
                }
                this._currentPage = 0;
                this._render(this._lastData, this._lastConfig);
                return;
            }
        }

        // Pagination click
        for (var pi = 0; pi < this._pageRegions.length; pi++) {
            var pr = this._pageRegions[pi];
            if (mx >= pr.x && mx <= pr.x + pr.w && my >= pr.y && my <= pr.y + pr.h) {
                if (pr.action === 'prev') this._currentPage--;
                if (pr.action === 'next') this._currentPage++;
                this._render(this._lastData, this._lastConfig);
                return;
            }
        }
    },

    _onClick: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitTest(mx, my);
        if (hit !== null) {
            var region = this._hitRegions[hit];
            try {
                this.drilldownToPayload({
                    action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                    data: region.drilldownData
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
