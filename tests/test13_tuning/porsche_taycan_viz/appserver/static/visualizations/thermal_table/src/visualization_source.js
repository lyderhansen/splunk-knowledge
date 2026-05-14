var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// VIZ: thermal_table
// Custom Canvas table for temperature sensors with drilldown, status chips,
// row hover, alternating rows, column sorting, and pagination.

var VIZ_NS = 'display.visualizations.custom.porsche_taycan_viz.thermal_table.';

var ThermalTable = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('thermal-table-viz');
        theme.injectFonts(document);

        this._canvas = theme.setupCanvas(this.el);
        this._tooltip = theme.createTooltip(this.el);
        this._data = null;
        this._config = null;
        this._rowRegions = [];
        this._hoveredRow = -1;

        // Sorting state
        this._sortField = null;   // column key: 'sensor'|'temp'|'max'|'status'
        this._sortDir   = null;   // 'asc'|'desc'|null

        // Pagination state
        this._currentPage = 0;
        this._pageControls = [];  // [{x,y,w,h,action:'prev'|'next'}, ...]

        // Header hit regions (for sort clicks)
        this._headerRegions = [];

        // Full + sorted row arrays
        this._allRows    = [];
        this._sortedRows = [];

        this._onMouseMove  = this._handleMouseMove.bind(this);
        this._onMouseLeave = this._handleMouseLeave.bind(this);
        this._onClick      = this._handleClick.bind(this);

        this._canvas.addEventListener('mousemove',  this._onMouseMove);
        this._canvas.addEventListener('mouseleave', this._onMouseLeave);
        this._canvas.addEventListener('click',      this._onClick);
        this._canvas.style.cursor = 'default';

        // Hide Splunk "no results" placeholder
        var self = this;
        this._observer = new MutationObserver(function() {
            var selectors = [
                '.viz-placeholder',
                '.shared-viz-no-results',
                '[data-test="viz-no-results"]',
                '.viz-controller-no-results',
                '.empty-results-placeholder',
                '.no-results-placeholder'
            ];
            for (var si = 0; si < selectors.length; si++) {
                var el = self.el.querySelector(selectors[si]);
                if (el) {
                    el.style.display = 'none';
                }
            }
        });
        this._observer.observe(this.el, { childList: true, subtree: true });
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 100000
        };
    },

    formatData: function(data) {
        if (!data || !data.rows || !data.rows.length) {
            return null;
        }
        var fields = (data.fields || []).map(function(f) { return f.name; });
        var rows = [];
        for (var i = 0; i < data.rows.length; i++) {
            var raw = data.rows[i];
            var obj = {};
            for (var j = 0; j < fields.length; j++) {
                obj[fields[j]] = raw[j];
            }
            rows.push(obj);
        }
        return { fields: fields, rows: rows };
    },

    updateView: function(data, config) {
        this._data   = data;
        this._config = config;

        // Rebuild full row array
        this._allRows = (data && data.rows) ? data.rows : [];

        // Apply current sort
        this._applySortAndResetPage();

        var self = this;
        theme.waitForFont(theme.FONT_DISPLAY, function() {
            self._render(self._data, self._config);
        });
    },

    // -----------------------------------------------------------------------
    // Sort / pagination helpers
    // -----------------------------------------------------------------------

    _applySortAndResetPage: function() {
        this._sortedRows = this._getSortedRows();
        // Do NOT reset page here — page resets happen only on explicit data
        // change (updateView). Sort direction toggles keep the page.
    },

    _getSortedRows: function() {
        var rows = this._allRows.slice(); // copy
        if (!this._sortField || !this._sortDir) {
            return rows;
        }
        var field   = this._sortField;
        var dir     = this._sortDir;

        rows.sort(function(a, b) {
            var av = a[field] !== undefined ? a[field] : '';
            var bv = b[field] !== undefined ? b[field] : '';

            // Numeric comparison when both look numeric
            var an = parseFloat(av);
            var bn = parseFloat(bv);
            var useNum = !isNaN(an) && !isNaN(bn);

            var cmp;
            if (useNum) {
                cmp = an - bn;
            } else {
                var as = String(av).toLowerCase();
                var bs = String(bv).toLowerCase();
                cmp = as < bs ? -1 : as > bs ? 1 : 0;
            }
            return dir === 'asc' ? cmp : -cmp;
        });
        return rows;
    },

    _cycleSort: function(colKey) {
        if (this._sortField !== colKey) {
            // New column: start ascending
            this._sortField = colKey;
            this._sortDir   = 'asc';
        } else if (this._sortDir === 'asc') {
            this._sortDir = 'desc';
        } else if (this._sortDir === 'desc') {
            this._sortField = null;
            this._sortDir   = null;
        }
        this._currentPage = 0; // reset to first page on sort change
        this._sortedRows  = this._getSortedRows();
    },

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    _render: function(data, config) {
        var ns = theme.getNS(this) || VIZ_NS;
        var sensorField  = theme.getOption(config, ns, 'sensorField',  'sensor');
        var tempField    = theme.getOption(config, ns, 'tempField',    'temp');
        var maxTempField = theme.getOption(config, ns, 'maxTempField', 'maxTemp');
        var statusField  = theme.getOption(config, ns, 'statusField',  'status');
        var accentColor  = theme.getOption(config, ns, 'accentColor',  '#00C9A7');
        var accentInt    = parseFloat(theme.getOption(config, ns, 'accentIntensity', 50)) / 100;
        var themeMode    = theme.getOption(config, ns, 'theme',        'dark');
        var normalColor  = theme.getOption(config, ns, 'normalColor',  '#10B981');
        var warmColor    = theme.getOption(config, ns, 'warmColor',    '#F59E0B');
        var hotColor     = theme.getOption(config, ns, 'hotColor',     '#EF4444');

        // Store fields for drilldown / tooltip
        this._sensorField  = sensorField;
        this._tempField    = tempField;
        this._maxTempField = maxTempField;
        this._statusField  = statusField;
        this._normalColor  = normalColor;
        this._warmColor    = warmColor;
        this._hotColor     = hotColor;

        var t      = theme.getTheme(themeMode);
        var canvas = this._canvas;
        var sc     = theme.scaleCanvas(canvas);
        var ctx    = sc.ctx;
        var w      = sc.w;
        var h      = sc.h;

        ctx.clearRect(0, 0, w, h);

        // --- Layout constants ---
        var padX       = 12;
        var rowH       = 36;
        var headerH    = rowH;
        var paginationH = 28;
        var innerW     = w - padX * 2;

        // Auto-calculate rows per page from available height
        var rowsPerPage = Math.max(1, Math.floor((h - headerH - paginationH) / rowH));

        var totalRows  = this._sortedRows.length;
        var totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

        // Clamp current page
        if (this._currentPage >= totalPages) {
            this._currentPage = totalPages - 1;
        }
        if (this._currentPage < 0) {
            this._currentPage = 0;
        }

        var pageStart = this._currentPage * rowsPerPage;
        var pageRows  = this._sortedRows.slice(pageStart, pageStart + rowsPerPage);

        // --- Column widths ---
        var colSensor = Math.round(innerW * 0.40);
        var colTemp   = Math.round(innerW * 0.20);
        var colMax    = Math.round(innerW * 0.20);
        var colStatus = innerW - colSensor - colTemp - colMax;

        var colX = [
            padX,
            padX + colSensor,
            padX + colSensor + colTemp,
            padX + colSensor + colTemp + colMax
        ];
        var colW = [colSensor, colTemp, colMax, colStatus];

        // Column metadata
        var colKeys    = [sensorField, tempField, maxTempField, statusField];
        var sortKeys   = ['sensor', 'temp', 'max', 'status']; // canonical sort ids
        var colLabels  = ['SENSOR', 'TEMP °C', 'MAX °C', 'STATUS'];
        var colAligns  = ['left', 'right', 'right', 'left'];

        // --- Header ---
        this._headerRegions = [];

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, headerH);
        ctx.fillStyle = t.headerBg;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.font = '11px "' + theme.FONT_DISPLAY + '", sans-serif';
        ctx.textBaseline = 'middle';

        for (var ci = 0; ci < colLabels.length; ci++) {
            var cx  = colX[ci];
            var cw  = colW[ci];
            var lbl = colLabels[ci];
            var sk  = sortKeys[ci];
            var isActive = (this._sortField === sk);

            ctx.fillStyle = isActive ? t.text : t.textWhisper;

            // Sort indicator
            var indicator = '';
            if (isActive && this._sortDir === 'asc')  { indicator = ' ▲'; }
            if (isActive && this._sortDir === 'desc') { indicator = ' ▼'; }
            var fullLbl = lbl + indicator;

            if (colAligns[ci] === 'right') {
                ctx.textAlign = 'right';
                ctx.fillText(fullLbl, cx + cw - 4, headerH / 2);
            } else {
                ctx.textAlign = 'left';
                ctx.fillText(fullLbl, ci === 0 ? cx + 4 : cx + 8, headerH / 2);
            }

            // Store hit region
            this._headerRegions.push({ x: cx, y: 0, w: cw, h: headerH, sortKey: sk, colKey: colKeys[ci] });
        }
        ctx.restore();

        // --- Data rows ---
        this._rowRegions = [];
        this._rows = pageRows;

        for (var ri = 0; ri < pageRows.length; ri++) {
            var rowObj = pageRows[ri];
            var ry = headerH + ri * rowH;

            this._rowRegions.push({ x: 0, y: ry, w: w, h: rowH, rowIndex: ri });

            var isHovered = (this._hoveredRow === ri);

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, ry, w, rowH);
            if (isHovered) {
                ctx.fillStyle = t.hoverBg;
            } else if (ri % 2 === 1) {
                ctx.fillStyle = 'rgba(255,255,255,0.015)';
            } else {
                ctx.fillStyle = 'transparent';
            }
            ctx.fill();
            ctx.restore();

            // Row separator
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(padX, ry + rowH - 0.5);
            ctx.lineTo(w - padX, ry + rowH - 0.5);
            ctx.strokeStyle = t.gridLine;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            // Sensor name — Outfit 13px
            var sensorVal = rowObj[sensorField] !== undefined ? String(rowObj[sensorField]) : '';
            ctx.save();
            ctx.font = '13px "' + theme.FONT_DISPLAY + '", sans-serif';
            ctx.fillStyle = t.text;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(sensorVal, colX[0] + 4, ry + rowH / 2);
            ctx.restore();

            // Temp — JetBrains Mono 13px right
            var tempVal = rowObj[tempField] !== undefined ? rowObj[tempField] : '';
            var tempNum = parseFloat(tempVal);
            var tempStr = isNaN(tempNum) ? String(tempVal) : theme.fmtNum(tempNum, { decimals: 1 });
            ctx.save();
            ctx.font = '13px "' + theme.FONT_MONO + '", monospace';
            ctx.fillStyle = t.text;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(tempStr, colX[1] + colW[1] - 4, ry + rowH / 2);
            ctx.restore();

            // Max — JetBrains Mono 13px right, textDim
            var maxVal = rowObj[maxTempField] !== undefined ? rowObj[maxTempField] : '';
            var maxNum = parseFloat(maxVal);
            var maxStr = isNaN(maxNum) ? String(maxVal) : theme.fmtNum(maxNum, { decimals: 1 });
            ctx.save();
            ctx.font = '13px "' + theme.FONT_MONO + '", monospace';
            ctx.fillStyle = t.textDim;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(maxStr, colX[2] + colW[2] - 4, ry + rowH / 2);
            ctx.restore();

            // Status — dot + label
            var statusVal = rowObj[statusField] !== undefined ? String(rowObj[statusField]) : '';
            var dotColor = normalColor;
            if (statusVal === 'Warm') { dotColor = warmColor; }
            if (statusVal === 'Hot')  { dotColor = hotColor; }

            var dotX = colX[3] + 10;
            var dotY = ry + rowH / 2;
            var dotR = 4;

            ctx.save();
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotR, 0, 2 * Math.PI);
            ctx.fillStyle = dotColor;
            ctx.shadowBlur  = 6;
            ctx.shadowColor = theme.hexToRgba(dotColor, 0.7);
            ctx.fill();
            theme.resetShadow(ctx);
            ctx.restore();

            ctx.save();
            ctx.font = '13px "' + theme.FONT_DISPLAY + '", sans-serif';
            ctx.fillStyle = dotColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(statusVal, dotX + dotR + 6, ry + rowH / 2);
            ctx.restore();
        }

        // --- Pagination bar ---
        this._pageControls = [];

        var paginationY = h - paginationH;

        // Separator above pagination
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(padX, paginationY);
        ctx.lineTo(w - padX, paginationY);
        ctx.strokeStyle = t.gridLine;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        var pageLabel = 'Page ' + (this._currentPage + 1) + ' of ' + totalPages;
        var hasPrev   = this._currentPage > 0;
        var hasNext   = this._currentPage < totalPages - 1;

        ctx.save();
        ctx.font = '10px "' + theme.FONT_DISPLAY + '", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // Measure label to center the whole group
        var labelW   = ctx.measureText(pageLabel).width;
        var chevW    = ctx.measureText('‹').width + 8; // 8px padding each side

        var groupW   = chevW + 4 + labelW + 4 + chevW;
        var groupX   = (w - groupW) / 2;
        var midY     = paginationY + paginationH / 2;

        // Prev ‹
        var prevX = groupX;
        ctx.fillStyle = hasPrev ? t.textDim : t.textWhisper;
        ctx.textAlign = 'center';
        ctx.fillText('‹', prevX + chevW / 2, midY);
        if (hasPrev) {
            this._pageControls.push({ x: prevX, y: paginationY, w: chevW, h: paginationH, action: 'prev' });
        }

        // Label
        var labelX = groupX + chevW + 4;
        ctx.fillStyle = t.textDim;
        ctx.textAlign = 'left';
        ctx.fillText(pageLabel, labelX, midY);

        // Next ›
        var nextX = labelX + labelW + 4;
        ctx.fillStyle = hasNext ? t.textDim : t.textWhisper;
        ctx.textAlign = 'center';
        ctx.fillText('›', nextX + chevW / 2, midY);
        if (hasNext) {
            this._pageControls.push({ x: nextX, y: paginationY, w: chevW, h: paginationH, action: 'next' });
        }

        ctx.restore();
    },

    // -----------------------------------------------------------------------
    // Hit testing
    // -----------------------------------------------------------------------

    _hitRow: function(x, y) {
        for (var i = 0; i < this._rowRegions.length; i++) {
            var r = this._rowRegions[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                return r.rowIndex;
            }
        }
        return -1;
    },

    _hitHeader: function(x, y) {
        for (var i = 0; i < this._headerRegions.length; i++) {
            var r = this._headerRegions[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                return r;
            }
        }
        return null;
    },

    _hitPageControl: function(x, y) {
        for (var i = 0; i < this._pageControls.length; i++) {
            var r = this._pageControls[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                return r;
            }
        }
        return null;
    },

    // -----------------------------------------------------------------------
    // Event handlers
    // -----------------------------------------------------------------------

    _handleMouseMove: function(evt) {
        var rect = this._canvas.getBoundingClientRect();
        var x    = evt.clientX - rect.left;
        var y    = evt.clientY - rect.top;

        var hitRow  = this._hitRow(x, y);
        var hitHdr  = this._hitHeader(x, y);
        var hitPage = this._hitPageControl(x, y);

        // Cursor
        if (hitRow >= 0 || hitHdr || hitPage) {
            this._canvas.style.cursor = 'pointer';
        } else {
            this._canvas.style.cursor = 'default';
        }

        // Row hover redraw
        if (hitRow !== this._hoveredRow) {
            this._hoveredRow = hitRow;
            if (this._data && this._config) {
                this._render(this._data, this._config);
            }
        }

        // Tooltip on data rows
        if (hitRow >= 0) {
            var row = this._rows && this._rows[hitRow];
            if (row) {
                var sensorVal = row[this._sensorField] !== undefined ? String(row[this._sensorField]) : '';
                var tempVal   = row[this._tempField]   !== undefined ? String(row[this._tempField])   : '';
                theme.showTooltip(this._tooltip, sensorVal + ': ' + tempVal + ' °C', x, y);
            }
        } else {
            theme.hideTooltip(this._tooltip);
        }
    },

    _handleMouseLeave: function() {
        this._hoveredRow = -1;
        this._canvas.style.cursor = 'default';
        theme.hideTooltip(this._tooltip);
        if (this._data && this._config) {
            this._render(this._data, this._config);
        }
    },

    _handleClick: function(evt) {
        var rect = this._canvas.getBoundingClientRect();
        var x    = evt.clientX - rect.left;
        var y    = evt.clientY - rect.top;

        // 1. Page controls
        var hitPage = this._hitPageControl(x, y);
        if (hitPage) {
            if (hitPage.action === 'prev') {
                this._currentPage = Math.max(0, this._currentPage - 1);
            } else {
                this._currentPage++;
            }
            this._hoveredRow = -1;
            if (this._data && this._config) {
                this._render(this._data, this._config);
            }
            return;
        }

        // 2. Header sort
        var hitHdr = this._hitHeader(x, y);
        if (hitHdr) {
            this._cycleSort(hitHdr.sortKey);
            this._hoveredRow = -1;
            if (this._data && this._config) {
                this._render(this._data, this._config);
            }
            return;
        }

        // 3. Row drilldown
        var hitRow = this._hitRow(x, y);
        if (hitRow < 0 || !this._rows) { return; }
        var row = this._rows[hitRow];
        if (!row) { return; }

        var sensorVal = row[this._sensorField] !== undefined ? String(row[this._sensorField]) : '';
        theme.safeDrilldown(this, { name1: this._sensorField, value1: sensorVal }, evt);
    },

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    reflow: function() {
        if (this._data !== null && this._config) {
            var self = this;
            theme.waitForFont(theme.FONT_DISPLAY, function() {
                self._render(self._data, self._config);
            });
        }
    },

    destroy: function() {
        if (this._canvas) {
            this._canvas.removeEventListener('mousemove',  this._onMouseMove);
            this._canvas.removeEventListener('mouseleave', this._onMouseLeave);
            this._canvas.removeEventListener('click',      this._onClick);
        }
        if (this._observer) {
            this._observer.disconnect();
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});

module.exports = ThermalTable;
