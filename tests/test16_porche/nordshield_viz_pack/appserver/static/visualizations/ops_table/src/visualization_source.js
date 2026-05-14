'use strict';

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('theme');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
}

function withAlpha(hex, alpha) {
    if (!hex) return 'rgba(0,0,0,' + alpha + ')';
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function roundRect(ctx, x, y, w, h, r) {
    if (r === undefined) r = 2;
    r = Math.min(r, w / 2, h / 2);
    if (r < 0) r = 0;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function truncate(ctx, text, maxW) {
    if (!text) return '';
    var s = String(text);
    if (ctx.measureText(s).width <= maxW) return s;
    var ellipsis = '…';
    var len = s.length;
    while (len > 0) {
        len--;
        var candidate = s.slice(0, len) + ellipsis;
        if (ctx.measureText(candidate).width <= maxW) return candidate;
    }
    return ellipsis;
}

function parseChipColorMap(raw) {
    var map = {};
    if (!raw) return map;
    var pairs = String(raw).split(',');
    for (var i = 0; i < pairs.length; i++) {
        var kv = pairs[i].trim();
        var colon = kv.indexOf(':');
        if (colon < 1) continue;
        var key = kv.slice(0, colon).trim();
        var val = kv.slice(colon + 1).trim();
        if (key && val) map[key] = val;
    }
    return map;
}

function parseFields(raw, defaultVal) {
    if (!raw) return defaultVal;
    var parts = String(raw).split(',');
    var out = [];
    for (var i = 0; i < parts.length; i++) {
        var f = parts[i].trim();
        if (f) out.push(f);
    }
    return out.length ? out : defaultVal;
}

function compareValues(a, b) {
    // Try numeric comparison first
    var na = parseFloat(a);
    var nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb) && String(na) === String(a) && String(nb) === String(b)) {
        return na - nb;
    }
    var sa = String(a || '').toLowerCase();
    var sb = String(b || '').toLowerCase();
    return sa.localeCompare(sb);
}

// ---------------------------------------------------------------------------
// Viz
// ---------------------------------------------------------------------------

module.exports = SplunkVisualizationBase.extend({

    // ---- State ------------------------------------------------------------

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'display:block;width:100%;height:100%;';
        this.el.appendChild(this._canvas);

        // Tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:5px 10px;' +
            'background:rgba(15,22,40,0.96);color:#C8D6E5;font-size:11px;' +
            'border:1px solid rgba(0,229,204,0.18);border-radius:2px;' +
            'pointer-events:none;white-space:nowrap;z-index:100;' +
            'font-family:"IBM Plex Mono",monospace;';
        this.el.appendChild(this._tooltip);

        // Sort / page state
        this._sortField = null;
        this._sortDir = 'asc';
        this._currentPage = 0;
        this._pageSize = 10;
        this._allRows = [];
        this._columnWidths = [];
        this._fields = [];
        this._labels = [];
        this._colIdx = {};

        // Hit regions
        this._rowHitRegions = [];   // {x,y,w,h, rowIdx}
        this._headerHitRegions = []; // {x,y,w,h, fieldIdx}
        this._pagePrevRegion = null;
        this._pageNextRegion = null;
        this._pageSizeRegions = [];

        // Hover
        this._hoverRowIdx = -1;    // index in current-page rows

        // Cached render params
        this._lastData = null;
        this._lastConfig = null;

        var self = this;

        this._clickHandler = function(e) { self._onClick(e); };
        this._mousemoveHandler = function(e) { self._onMouseMove(e); };
        this._mouseleaveHandler = function() { self._onMouseLeave(); };

        this._canvas.addEventListener('click', this._clickHandler);
        this._canvas.addEventListener('mousemove', this._mousemoveHandler);
        this._canvas.addEventListener('mouseleave', this._mouseleaveHandler);
    },

    // ---- Data pipeline ----------------------------------------------------

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 100000
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
        var result = { colIdx: colIdx, fields: fields, rows: data.rows };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    // ---- Core render ------------------------------------------------------

    _render: function(data, config) {
        if (!data || !data.rows) return;

        var canvas = this._canvas;
        var el = this.el;
        var w = el.offsetWidth;
        var h = el.offsetHeight;
        if (w <= 0 || h <= 0) return;

        var dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        var ns = getNS(this);
        var t = theme.getTheme();
        var fonts = theme.getFonts();
        var fontFamily = fonts.family;

        // Config
        var fields = parseFields(
            getOption(config, ns, 'fields', null),
            ['incident_id', 'status', 'severity', 'duration', 'affected_hosts', 'technique']
        );
        var labels = parseFields(
            getOption(config, ns, 'fieldLabels', null),
            ['ID', 'Status', 'Severity', 'Duration', 'Hosts', 'Technique']
        );
        // Align label count
        while (labels.length < fields.length) labels.push(fields[labels.length]);
        while (labels.length > fields.length) labels.pop();

        var pageSizeOpt = parseInt(getOption(config, ns, 'pageSize', '10'), 10);
        if (isNaN(pageSizeOpt) || pageSizeOpt < 1) pageSizeOpt = 10;

        var pageSizesRaw = getOption(config, ns, 'pageSizes', '10,25,50');
        var pageSizeOptions = parseFields(pageSizesRaw, ['10', '25', '50']);

        var defaultSort = getOption(config, ns, 'defaultSort', 'severity');
        var defaultSortDir = getOption(config, ns, 'defaultSortDir', 'desc');
        var statusField = getOption(config, ns, 'statusField', 'status');
        var chipColorMapRaw = getOption(config, ns, 'chipColorMap',
            'P1:#FFB020,P2:#D946EF,Investigating:#38BDF8,Contained:#00E5CC,Resolved:#475569,Closed:#475569');
        var chipColorMap = parseChipColorMap(chipColorMapRaw);
        var headerBg = getOption(config, ns, 'headerBg', '#0F1628');
        var rowHeight = parseInt(getOption(config, ns, 'rowHeight', '36'), 10);
        var headerHeight = parseInt(getOption(config, ns, 'headerHeight', '40'), 10);
        if (isNaN(rowHeight) || rowHeight < 20) rowHeight = 36;
        if (isNaN(headerHeight) || headerHeight < 20) headerHeight = 40;

        // Page size may have changed from config
        if (this._pageSize !== pageSizeOpt) {
            this._pageSize = pageSizeOpt;
            this._currentPage = 0;
        }

        // Apply default sort on first render (if no sort set yet)
        if (this._sortField === null && defaultSort) {
            // Check that defaultSort is an actual field in the dataset
            var colIdx = data.colIdx;
            if (colIdx && colIdx[defaultSort] !== undefined) {
                this._sortField = defaultSort;
                this._sortDir = defaultSortDir === 'desc' ? 'desc' : 'asc';
            }
        }

        // Build allRows from data, respecting fields order
        this._fields = fields;
        this._labels = labels;
        this._colIdx = data.colIdx || {};

        var rawRows = data.rows;

        // Sort
        var sortField = this._sortField;
        var sortDir = this._sortDir;
        var colIdx2 = data.colIdx || {};

        var sorted = rawRows.slice();
        if (sortField && colIdx2[sortField] !== undefined) {
            var si = colIdx2[sortField];
            var dir = sortDir === 'desc' ? -1 : 1;
            sorted.sort(function(a, b) {
                return dir * compareValues(a[si], b[si]);
            });
        }
        this._allRows = sorted;

        // Clamp page
        var totalPages = Math.max(1, Math.ceil(sorted.length / this._pageSize));
        if (this._currentPage >= totalPages) this._currentPage = totalPages - 1;
        if (this._currentPage < 0) this._currentPage = 0;

        var pageStart = this._currentPage * this._pageSize;
        var pageEnd = Math.min(pageStart + this._pageSize, sorted.length);
        var pageRows = sorted.slice(pageStart, pageEnd);

        // Layout
        var PAD_X = 12;
        var PAGINATION_H = 36;
        var tableH = h - PAGINATION_H;
        var tableW = w;

        // Calculate column widths
        ctx.font = '600 13px ' + fontFamily;
        var colWidths = this._calcColumnWidths(ctx, fields, labels, pageRows, colIdx2, tableW, PAD_X, fontFamily);

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Header
        this._drawHeader(ctx, fields, labels, colWidths, headerBg, headerHeight, fontFamily, PAD_X, w, sortField, sortDir);

        // Rows
        this._rowHitRegions = [];
        this._drawRows(ctx, pageRows, fields, colWidths, headerHeight, rowHeight, tableH,
            PAD_X, fontFamily, statusField, chipColorMap, pageStart, w);

        // Pagination
        this._drawPagination(ctx, tableH, w, PAGINATION_H, totalPages, pageSizeOptions, fontFamily, t);

        // Store layout for hit test
        this._layout = {
            PAD_X: PAD_X,
            headerHeight: headerHeight,
            rowHeight: rowHeight,
            tableH: tableH,
            PAGINATION_H: PAGINATION_H,
            colWidths: colWidths,
            fields: fields,
            labels: labels,
            w: w,
            h: h,
            pageRows: pageRows,
            pageStart: pageStart,
            totalPages: totalPages,
            pageSizeOptions: pageSizeOptions,
            fontFamily: fontFamily
        };
    },

    // ---- Column width calc ------------------------------------------------

    _calcColumnWidths: function(ctx, fields, labels, pageRows, colIdx, tableW, padX, fontFamily) {
        var numCols = fields.length;
        if (numCols === 0) return [];

        var MIN_W = 60;
        var CELL_PAD = padX * 2; // left + right padding per cell
        var SORT_ARROW_W = 18;
        var available = tableW;

        // Measure header widths
        ctx.font = '600 13px ' + fontFamily;
        var headerWidths = [];
        for (var i = 0; i < labels.length; i++) {
            headerWidths.push(ctx.measureText(labels[i]).width + CELL_PAD + SORT_ARROW_W);
        }

        // Sample up to 20 rows for content widths
        ctx.font = '400 13px ' + fontFamily;
        var contentWidths = [];
        for (var ci = 0; ci < numCols; ci++) {
            contentWidths.push(MIN_W);
        }
        var sampleCount = Math.min(20, pageRows.length);
        for (var ri = 0; ri < sampleCount; ri++) {
            var row = pageRows[ri];
            for (var fi = 0; fi < numCols; fi++) {
                var field = fields[fi];
                var cidx = colIdx[field];
                var val = (cidx !== undefined && row[cidx] !== undefined && row[cidx] !== null)
                    ? String(row[cidx]) : '';
                var vw = ctx.measureText(val).width + CELL_PAD;
                if (vw > contentWidths[fi]) contentWidths[fi] = vw;
            }
        }

        // Preferred = max(header, content, MIN_W)
        var preferred = [];
        var totalPreferred = 0;
        for (var pi = 0; pi < numCols; pi++) {
            var pw = Math.max(MIN_W, headerWidths[pi] || MIN_W, contentWidths[pi] || MIN_W);
            preferred.push(pw);
            totalPreferred += pw;
        }

        // Scale if needed
        var result = [];
        if (totalPreferred <= available) {
            // Distribute extra space proportionally
            var extra = available - totalPreferred;
            var totalProp = totalPreferred;
            for (var ei = 0; ei < numCols; ei++) {
                result.push(Math.floor(preferred[ei] + (preferred[ei] / totalProp) * extra));
            }
            // Fix rounding — give remainder to last column
            var assigned = 0;
            for (var ri2 = 0; ri2 < result.length; ri2++) assigned += result[ri2];
            result[result.length - 1] += available - assigned;
        } else {
            // Scale down proportionally but respect MIN_W
            var scale = available / totalPreferred;
            for (var si = 0; si < numCols; si++) {
                result.push(Math.max(MIN_W, Math.floor(preferred[si] * scale)));
            }
        }

        return result;
    },

    // ---- Draw header ------------------------------------------------------

    _drawHeader: function(ctx, fields, labels, colWidths, headerBg, headerHeight, fontFamily, padX, w, sortField, sortDir) {
        // Background
        ctx.fillStyle = headerBg;
        ctx.fillRect(0, 0, w, headerHeight);

        // Bottom border
        ctx.strokeStyle = 'rgba(0,229,204,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, headerHeight - 0.5);
        ctx.lineTo(w, headerHeight - 0.5);
        ctx.stroke();

        ctx.textBaseline = 'middle';
        var x = 0;
        this._headerHitRegions = [];

        for (var i = 0; i < fields.length; i++) {
            var cw = colWidths[i] || 60;
            var label = labels[i] || fields[i];
            var isActive = (fields[i] === sortField);

            // Header text color
            ctx.fillStyle = isActive ? '#E8F0FE' : '#C8D6E5';
            ctx.font = '600 13px ' + fontFamily;
            ctx.textAlign = 'left';

            // Label (truncated to leave room for arrow)
            var arrowW = 14;
            var textMaxW = cw - padX * 2 - arrowW;
            var labelText = truncate(ctx, label.toUpperCase(), textMaxW);
            ctx.fillText(labelText, x + padX, headerHeight / 2);

            // Sort arrow
            if (isActive) {
                var arrowX = x + padX + ctx.measureText(labelText).width + 6;
                var arrowY = headerHeight / 2;
                ctx.fillStyle = '#00E5CC';
                ctx.font = '11px ' + fontFamily;
                ctx.fillText(sortDir === 'desc' ? '▼' : '▲', arrowX, arrowY);
            }

            // Column separator
            if (i < fields.length - 1) {
                ctx.strokeStyle = 'rgba(0,229,204,0.06)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + cw - 0.5, 6);
                ctx.lineTo(x + cw - 0.5, headerHeight - 6);
                ctx.stroke();
            }

            this._headerHitRegions.push({ x: x, y: 0, w: cw, h: headerHeight, fieldIdx: i });
            x += cw;
        }
    },

    // ---- Draw rows --------------------------------------------------------

    _drawRows: function(ctx, pageRows, fields, colWidths, headerHeight, rowHeight, tableH, padX, fontFamily, statusField, chipColorMap, pageStart, w) {
        var t = theme.getTheme();
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.font = '400 13px ' + fontFamily;

        var colIdx = this._colIdx;
        var visibleCount = Math.floor((tableH - headerHeight) / rowHeight);

        for (var ri = 0; ri < pageRows.length; ri++) {
            var row = pageRows[ri];
            var ry = headerHeight + ri * rowHeight;

            if (ry + rowHeight > tableH) break;

            // Alternating row background
            if (ri % 2 === 1) {
                ctx.fillStyle = 'rgba(0,229,204,0.02)';
                ctx.fillRect(0, ry, w, rowHeight);
            }

            // Hover highlight
            if (ri === this._hoverRowIdx) {
                ctx.fillStyle = 'rgba(0,229,204,0.08)';
                ctx.fillRect(0, ry, w, rowHeight);
            }

            // Row bottom border
            ctx.strokeStyle = 'rgba(0,229,204,0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, ry + rowHeight - 0.5);
            ctx.lineTo(w, ry + rowHeight - 0.5);
            ctx.stroke();

            // Store hit region
            this._rowHitRegions.push({ x: 0, y: ry, w: w, h: rowHeight, rowIdx: ri });

            // Cells
            var x = 0;
            for (var ci = 0; ci < fields.length; ci++) {
                var cw = colWidths[ci] || 60;
                var field = fields[ci];
                var cidx = colIdx[field];
                var val = (cidx !== undefined && row[cidx] !== undefined && row[cidx] !== null)
                    ? String(row[cidx]) : '';

                var cy = ry + rowHeight / 2;
                var isStatusField = (field === statusField);

                if (isStatusField && chipColorMap[val]) {
                    this._drawChip(ctx, val, x + padX, cy, cw - padX * 2, rowHeight, chipColorMap[val], fontFamily);
                } else {
                    ctx.fillStyle = '#C8D6E5';
                    ctx.font = '400 13px ' + fontFamily;
                    var cellMaxW = cw - padX * 2;
                    var displayText = truncate(ctx, val, cellMaxW);
                    ctx.fillText(displayText, x + padX, cy);
                }

                x += cw;
            }
        }
    },

    // ---- Draw chip --------------------------------------------------------

    _drawChip: function(ctx, text, cellX, cellY, maxW, rowH, color, fontFamily) {
        ctx.font = '400 13px ' + fontFamily;
        var textW = ctx.measureText(text).width;
        var chipPadX = 8;
        var chipPadY = 3;
        var chipW = Math.min(textW + chipPadX * 2, maxW);
        var chipH = Math.round(rowH * 0.55);
        var chipX = cellX;
        var chipYTop = cellY - chipH / 2;

        // Background fill at 15% opacity
        roundRect(ctx, chipX, chipYTop, chipW, chipH, 2);
        ctx.fillStyle = withAlpha(color, 0.15);
        ctx.fill();

        // Text in full color
        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        // Center text within chip
        var textX = chipX + (chipW - textW) / 2;
        ctx.fillText(text, textX, cellY);
    },

    // ---- Draw pagination --------------------------------------------------

    _drawPagination: function(ctx, tableH, w, paginationH, totalPages, pageSizeOptions, fontFamily, t) {
        var y = tableH;
        var h = paginationH;
        var currentPage = this._currentPage;
        var pageSize = this._pageSize;

        // Background
        ctx.fillStyle = '#0F1628';
        ctx.fillRect(0, y, w, h);

        // Top border
        ctx.strokeStyle = 'rgba(0,229,204,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
        ctx.stroke();

        var cy = y + h / 2;
        var PAD = 14;

        ctx.textBaseline = 'middle';
        ctx.font = '400 12px ' + fontFamily;

        // Page size options (right side)
        var pageSizeLabel = 'per page';
        var pageSizeLabelW = ctx.measureText(pageSizeLabel).width;
        var rightX = w - PAD;

        // Draw page size label
        ctx.fillStyle = 'rgba(200,214,229,0.4)';
        ctx.textAlign = 'right';
        ctx.fillText(pageSizeLabel, rightX, cy);
        rightX -= pageSizeLabelW + 8;

        this._pageSizeRegions = [];
        // Draw size options right-to-left
        for (var si = pageSizeOptions.length - 1; si >= 0; si--) {
            var sizeVal = parseInt(pageSizeOptions[si], 10);
            if (isNaN(sizeVal)) continue;
            var sizeStr = String(sizeVal);
            var sizeW = ctx.measureText(sizeStr).width + 14;
            var sizeX = rightX - sizeW;
            var isActive = (sizeVal === pageSize);

            if (isActive) {
                roundRect(ctx, sizeX + 2, cy - 9, sizeW - 4, 18, 2);
                ctx.fillStyle = 'rgba(0,229,204,0.12)';
                ctx.fill();
                ctx.fillStyle = '#00E5CC';
            } else {
                ctx.fillStyle = 'rgba(200,214,229,0.45)';
            }
            ctx.textAlign = 'center';
            ctx.fillText(sizeStr, sizeX + sizeW / 2, cy);

            this._pageSizeRegions.unshift({
                x: sizeX, y: y, w: sizeW, h: h,
                size: sizeVal
            });
            rightX = sizeX - 4;
        }

        // Separator dot
        ctx.fillStyle = 'rgba(200,214,229,0.2)';
        ctx.textAlign = 'center';
        ctx.fillText('·', rightX - 8, cy);
        rightX -= 20;

        // Navigation controls (center)
        var pageLabel = 'Page ' + (currentPage + 1) + ' of ' + totalPages;
        var pageLabelW = ctx.measureText(pageLabel).width;

        var prevText = '‹ Prev';
        var nextText = 'Next ›';
        var prevW = ctx.measureText(prevText).width + 16;
        var nextW = ctx.measureText(nextText).width + 16;

        var navTotalW = prevW + pageLabelW + nextW + 16;
        var navStartX = (w / 2) - (navTotalW / 2);

        // Prev button
        var prevX = navStartX;
        var canPrev = currentPage > 0;
        ctx.textAlign = 'center';
        ctx.fillStyle = canPrev ? '#C8D6E5' : 'rgba(200,214,229,0.25)';
        ctx.fillText(prevText, prevX + prevW / 2, cy);
        this._pagePrevRegion = canPrev ? { x: prevX, y: y, w: prevW, h: h } : null;

        // Page indicator
        ctx.fillStyle = 'rgba(200,214,229,0.6)';
        ctx.textAlign = 'center';
        ctx.fillText(pageLabel, prevX + prevW + pageLabelW / 2 + 8, cy);

        // Next button
        var nextX = prevX + prevW + pageLabelW + 16;
        var canNext = currentPage < totalPages - 1;
        ctx.fillStyle = canNext ? '#C8D6E5' : 'rgba(200,214,229,0.25)';
        ctx.textAlign = 'center';
        ctx.fillText(nextText, nextX + nextW / 2, cy);
        this._pageNextRegion = canNext ? { x: nextX, y: y, w: nextW, h: h } : null;
    },

    // ---- Click handler ----------------------------------------------------

    _onClick: function(e) {
        if (!this._layout) return;
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        // Header click → sort
        for (var hi = 0; hi < this._headerHitRegions.length; hi++) {
            var hr = this._headerHitRegions[hi];
            if (mx >= hr.x && mx < hr.x + hr.w && my >= hr.y && my < hr.y + hr.h) {
                var clickedField = this._layout.fields[hr.fieldIdx];
                if (this._sortField === clickedField) {
                    this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this._sortField = clickedField;
                    this._sortDir = 'asc';
                }
                this._currentPage = 0;
                this._render(this._lastData, this._lastConfig);
                return;
            }
        }

        // Pagination: prev
        if (this._pagePrevRegion) {
            var pp = this._pagePrevRegion;
            if (mx >= pp.x && mx < pp.x + pp.w && my >= pp.y && my < pp.y + pp.h) {
                this._currentPage--;
                this._hoverRowIdx = -1;
                this._render(this._lastData, this._lastConfig);
                return;
            }
        }

        // Pagination: next
        if (this._pageNextRegion) {
            var pn = this._pageNextRegion;
            if (mx >= pn.x && mx < pn.x + pn.w && my >= pn.y && my < pn.y + pn.h) {
                this._currentPage++;
                this._hoverRowIdx = -1;
                this._render(this._lastData, this._lastConfig);
                return;
            }
        }

        // Page size selection
        for (var psi = 0; psi < this._pageSizeRegions.length; psi++) {
            var psr = this._pageSizeRegions[psi];
            if (mx >= psr.x && mx < psr.x + psr.w && my >= psr.y && my < psr.y + psr.h) {
                this._pageSize = psr.size;
                this._currentPage = 0;
                this._hoverRowIdx = -1;
                this._render(this._lastData, this._lastConfig);
                return;
            }
        }

        // Row click → drilldown
        for (var rhi = 0; rhi < this._rowHitRegions.length; rhi++) {
            var rhr = this._rowHitRegions[rhi];
            if (mx >= rhr.x && mx < rhr.x + rhr.w && my >= rhr.y && my < rhr.y + rhr.h) {
                var rowData = this._layout.pageRows[rhr.rowIdx];
                if (!rowData) return;
                var payload = {};
                var colIdx = this._colIdx;
                var fields = this._layout.fields;
                for (var fi = 0; fi < fields.length; fi++) {
                    var ci = colIdx[fields[fi]];
                    if (ci !== undefined) payload[fields[fi]] = rowData[ci];
                }
                try {
                    this.drilldown({
                        action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                        data: payload
                    }, e);
                } catch (err) {}
                return;
            }
        }
    },

    // ---- Mouse handlers ---------------------------------------------------

    _onMouseMove: function(e) {
        if (!this._layout) return;
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        // Check header hover — show sort cursor
        for (var hi = 0; hi < this._headerHitRegions.length; hi++) {
            var hr = this._headerHitRegions[hi];
            if (mx >= hr.x && mx < hr.x + hr.w && my >= hr.y && my < hr.y + hr.h) {
                this._canvas.style.cursor = 'pointer';
                if (this._hoverRowIdx !== -1) {
                    this._hoverRowIdx = -1;
                    this._render(this._lastData, this._lastConfig);
                }
                this._tooltip.style.display = 'none';
                return;
            }
        }

        // Check pagination hover
        var inPaginationBar = (my >= this._layout.tableH);
        if (inPaginationBar) {
            var isClickable = false;
            if (this._pagePrevRegion) {
                var pp = this._pagePrevRegion;
                if (mx >= pp.x && mx < pp.x + pp.w) isClickable = true;
            }
            if (this._pageNextRegion) {
                var pn = this._pageNextRegion;
                if (mx >= pn.x && mx < pn.x + pn.w) isClickable = true;
            }
            for (var psi = 0; psi < this._pageSizeRegions.length; psi++) {
                var psr = this._pageSizeRegions[psi];
                if (mx >= psr.x && mx < psr.x + psr.w) isClickable = true;
            }
            this._canvas.style.cursor = isClickable ? 'pointer' : 'default';
            if (this._hoverRowIdx !== -1) {
                this._hoverRowIdx = -1;
                this._render(this._lastData, this._lastConfig);
            }
            this._tooltip.style.display = 'none';
            return;
        }

        // Row hover
        var hitRow = -1;
        for (var ri = 0; ri < this._rowHitRegions.length; ri++) {
            var rhr = this._rowHitRegions[ri];
            if (mx >= rhr.x && mx < rhr.x + rhr.w && my >= rhr.y && my < rhr.y + rhr.h) {
                hitRow = ri;
                break;
            }
        }

        if (hitRow !== -1) {
            this._canvas.style.cursor = 'pointer';

            if (this._hoverRowIdx !== hitRow) {
                this._hoverRowIdx = hitRow;
                this._render(this._lastData, this._lastConfig);
            }

            // Tooltip: show all fields for hovered row
            var row = this._layout.pageRows[hitRow];
            if (row) {
                var colIdx = this._colIdx;
                var fields = this._layout.fields;
                var labels = this._layout.labels;
                var tipParts = [];
                for (var fi = 0; fi < fields.length; fi++) {
                    var cidx = colIdx[fields[fi]];
                    var val = (cidx !== undefined && row[cidx] !== undefined) ? String(row[cidx]) : '';
                    if (val) tipParts.push('<b>' + labels[fi] + '</b>: ' + val);
                }
                this._tooltip.innerHTML = tipParts.join('  &nbsp;·&nbsp;  ');
                this._tooltip.style.display = 'block';

                var tx = mx + 14;
                var ty = my - 18;
                if (tx + 200 > this.el.offsetWidth) tx = mx - 210;
                if (ty < 0) ty = my + 20;
                this._tooltip.style.left = tx + 'px';
                this._tooltip.style.top = ty + 'px';
            }
        } else {
            this._canvas.style.cursor = 'default';
            this._tooltip.style.display = 'none';
            if (this._hoverRowIdx !== -1) {
                this._hoverRowIdx = -1;
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _onMouseLeave: function() {
        this._tooltip.style.display = 'none';
        this._canvas.style.cursor = 'default';
        if (this._hoverRowIdx !== -1) {
            this._hoverRowIdx = -1;
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    // ---- Cleanup ----------------------------------------------------------

    destroy: function() {
        if (this._clickHandler) {
            this._canvas.removeEventListener('click', this._clickHandler);
        }
        if (this._mousemoveHandler) {
            this._canvas.removeEventListener('mousemove', this._mousemoveHandler);
        }
        if (this._mouseleaveHandler) {
            this._canvas.removeEventListener('mouseleave', this._mouseleaveHandler);
        }
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
