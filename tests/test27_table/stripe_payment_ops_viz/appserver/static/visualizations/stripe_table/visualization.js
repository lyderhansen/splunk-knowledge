define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], function(SplunkVisualizationBase, SplunkVisualizationUtils) {

// ── Inlined theme.js ──
var theme = (function() {
/*
 * Stripe Payment Operations — design tokens.
 * ES5 only — no const/let/arrow/template-literals.
 */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function withAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    var rr = Math.round(ar + (br - ar) * t);
    var gg = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + bl).toString(16).slice(1);
}

var DARK = {
    name: 'dark',
    bg: '#0A2540',
    panel: '#132F4C',
    panelHi: '#1A3A5C',
    edge: '#1E4976',
    edgeStrong: '#2D6AA0',
    grid: 'rgba(255,255,255,0.06)',
    text: '#E8ECF0',
    textDim: '#8898AA',
    textFaint: '#5A6B7D',
    s1: '#635BFF',
    s2: '#80E9FF',
    s3: '#0048E5',
    s4: '#11CCE8',
    s5: '#9A6CFF',
    accent: '#635BFF',
    success: '#3ECF8E',
    warn: '#F5A623',
    danger: '#DF1B41',
    invert: '#F6F9FC'
};

var LIGHT = {
    name: 'light',
    bg: '#F6F9FC',
    panel: '#FFFFFF',
    panelHi: '#F0F3F7',
    edge: '#E3E8EE',
    edgeStrong: '#C1C9D2',
    grid: 'rgba(0,0,0,0.06)',
    text: '#0A2540',
    textDim: '#6B7C93',
    textFaint: '#A3ACB9',
    s1: '#635BFF',
    s2: '#0048E5',
    s3: '#11CCE8',
    s4: '#9A6CFF',
    s5: '#80E9FF',
    accent: '#635BFF',
    success: '#2DB87D',
    warn: '#D97917',
    danger: '#DF1B41',
    invert: '#0A2540'
};

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

function severityColor(t, sev) {
    if (sev === 'critical' || sev === 'crit' || sev === 'error') return t.danger;
    if (sev === 'warning' || sev === 'warn') return t.warn;
    if (sev === 'ok' || sev === 'good' || sev === 'success') return t.success;
    return t.textDim;
}

function fmtNum(v, opts) {
    if (v == null || isNaN(v)) return '—';
    var abs = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
    if (abs < 1 && abs > 0) return sign + abs.toFixed(2);
    return sign + Math.round(abs).toString();
}

function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
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

function drawPanel(ctx, t, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 6);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawHGrid(ctx, t, x, y, w, h, divisions) {
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 0.5;
    for (var i = 1; i < divisions; i++) {
        var gy = y + (h / divisions) * i;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
    }
}

function parseColors(raw, fallback) {
    if (!raw || typeof raw !== 'string') return fallback;
    return raw.split(',').map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
}

function parseInts(raw) {
    if (!raw || typeof raw !== 'string') return [];
    return raw.split(',').map(function(s) { return parseInt(s.trim(), 10); }).filter(function(n) { return !isNaN(n); });
}


    return { getTheme: getTheme,     withAlpha: withAlpha,     lerpColor: lerpColor,     severityColor: severityColor,     fmtNum: fmtNum,     roundRect: roundRect,     drawPanel: drawPanel,     drawHGrid: drawHGrid,     parseColors: parseColors,     parseInts: parseInts,     FONTS: FONTS };
})();

// ── Viz source ──



function safeStr(val) {
    return (val != null && val !== '') ? String(val) : '';
}

function safeNum(val, fallback) {
    if (val == null || val === '') return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}

function detectTheme() {
    try {
        if (typeof SplunkVisualizationUtils !== 'undefined' &&
            SplunkVisualizationUtils.getCurrentTheme) {
            var st = SplunkVisualizationUtils.getCurrentTheme();
            if (st === 'light' || st === 'dark') return st;
        }
    } catch (e) {}
    var body = document.body;
    if (body) {
        var dt = body.getAttribute('data-theme');
        if (dt === 'light' || dt === 'dark') return dt;
        if (body.classList.contains('dark')) return 'dark';
        if (body.classList.contains('light')) return 'light';
    }
    try {
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            return (parseInt(m[0])+parseInt(m[1])+parseInt(m[2]))/3 < 128
                   ? 'dark' : 'light';
        }
    } catch (e) {}
    return 'dark';
}

function hexFromSplunk(val) {
    if (val == null || val === '') return null;
    var s = String(val);
    if (s.indexOf('0x') === 0) return '#' + s.slice(2);
    if (s.charAt(0) === '#') return s;
    var n = parseInt(s, 10);
    if (!isNaN(n) && n >= 0) {
        var hex = n.toString(16);
        while (hex.length < 6) hex = '0' + hex;
        return '#' + hex;
    }
    return null;
}

function parseCSV(raw) {
    if (!raw || typeof raw !== 'string') return [];
    return raw.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
}

function parseColWidthSlot(raw) {
    if (!raw || typeof raw !== 'string') return null;
    var parts = raw.split(':');
    if (parts.length !== 2) return null;
    var field = parts[0].trim();
    var px = parseInt(parts[1].trim(), 10);
    if (!field || isNaN(px) || px <= 0) return null;
    return { field: field, width: px };
}

function statusColor(t, status) {
    var s = String(status).toLowerCase();
    if (s === 'succeeded' || s === 'success' || s === 'ok') return t.success;
    if (s === 'failed' || s === 'failure' || s === 'error') return t.danger;
    if (s === 'disputed' || s === 'warning' || s === 'pending') return t.warn;
    if (s === 'refunded' || s === 'cancelled') return t.textDim;
    return t.textDim;
}

function naturalCompare(a, b) {
    var ax = safeNum(a, null);
    var bx = safeNum(b, null);
    if (ax !== null && bx !== null) return ax - bx;
    return String(a || '').localeCompare(String(b || ''));
}

return SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('stripe-payment-ops-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;font-size:12px;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._sortCol = -1;
        this._sortAsc = false;
        this._page = 0;
        this._hoverRow = -1;
        this._colRects = [];
        this._rowRects = [];
        this._pageRects = {};
        this._colMenuOpen = false;
        this._colMenuBtnRect = null;
        this._colMenuRects = [];
        this._localHidden = {};

        var self = this;
        this._canvas.addEventListener('click', function(e) { self._onClick(e); });
        this._canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
        this._canvas.addEventListener('mouseleave', function() {
            self._hoverRow = -1;
            self._tooltip.style.display = 'none';
            self.invalidateUpdateView();
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
            return null;
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
        if (!data) {
            if (this._lastGoodData) data = this._lastGoodData;
            else return;
        }

        var ns = this.getPropertyNamespaceInfo().propertyNamespace;
        function opt(key, fallback) {
            var v = config[ns + key];
            return (v != null && v !== '') ? v : fallback;
        }

        var hiddenCols = parseCSV(opt('hiddenColumns', ''));
        var colWidthsMap = {};
        for (var cwi = 1; cwi <= 8; cwi++) {
            var slot = parseColWidthSlot(opt('cw' + cwi, ''));
            if (slot) colWidthsMap[slot.field] = slot.width;
        }
        var moneyFields = parseCSV(opt('moneyFields', 'amount'));
        var maxRows = Math.max(5, Math.min(100, parseInt(opt('maxRows', '20'), 10) || 20));
        var sortFieldSetting = opt('sortField', '_time');
        var sortOrderSetting = opt('sortOrder', 'desc');
        var showRowNums = opt('showRowNumbers', 'true') === 'true';
        var stripeRows = opt('stripeRows', 'true') === 'true';
        var showStatusColors = opt('showStatusColors', 'true') === 'true';
        var accentHex = hexFromSplunk(opt('accentColor', '0x635BFF')) || '#635BFF';

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark'
                   : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 600;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 400;
        if (w < 10) w = window.innerWidth || 600;
        if (h < 10) h = window.innerHeight || 400;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        this._tooltip.style.background = t.panelHi || t.panel;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        var allFields = data.fields || [];
        var allHidden = {};
        var i, j;
        for (i = 0; i < hiddenCols.length; i++) allHidden[hiddenCols[i]] = true;
        for (var lk in this._localHidden) {
            if (this._localHidden[lk]) allHidden[lk] = true;
        }

        var visibleFields = [];
        for (i = 0; i < allFields.length; i++) {
            if (!allHidden[allFields[i].name]) {
                visibleFields.push({ name: allFields[i].name, idx: i });
            }
        }

        if (visibleFields.length === 0) return;

        var allRows = data.rows.slice();
        if (this._sortCol === -1) {
            for (i = 0; i < allFields.length; i++) {
                if (allFields[i].name === sortFieldSetting) {
                    this._sortCol = i;
                    this._sortAsc = sortOrderSetting === 'asc';
                    break;
                }
            }
        }

        if (this._sortCol >= 0) {
            var sc = this._sortCol;
            var asc = this._sortAsc;
            allRows.sort(function(a, b) {
                var cmp = naturalCompare(a[sc], b[sc]);
                return asc ? cmp : -cmp;
            });
        }

        var totalRows = allRows.length;
        var totalPages = Math.max(1, Math.ceil(totalRows / maxRows));
        if (this._page >= totalPages) this._page = totalPages - 1;
        if (this._page < 0) this._page = 0;
        var startIdx = this._page * maxRows;
        var pageRows = allRows.slice(startIdx, startIdx + maxRows);

        var pad = Math.max(8, w * 0.015);
        var headerH = Math.max(28, h * 0.08);
        var rowH = Math.max(24, h * 0.06);
        var footerH = Math.max(28, h * 0.07);
        var fontSize = Math.max(11, Math.min(14, h * 0.032));
        var headerFontSize = Math.max(10, Math.min(12, h * 0.028));
        var moneySet = {};
        for (i = 0; i < moneyFields.length; i++) moneySet[moneyFields[i]] = true;

        var tableW = w - pad * 2;
        var numColW = showRowNums ? Math.max(30, tableW * 0.05) : 0;
        var contentW = tableW - numColW;

        var colWidths = [];
        var fixedW = 0;
        var flexCount = 0;
        for (i = 0; i < visibleFields.length; i++) {
            var cw = colWidthsMap[visibleFields[i].name];
            if (cw && parseInt(cw, 10) > 0) {
                colWidths.push(parseInt(cw, 10));
                fixedW += parseInt(cw, 10);
            } else {
                colWidths.push(0);
                flexCount++;
            }
        }
        var flexW = flexCount > 0 ? Math.max(50, (contentW - fixedW) / flexCount) : 0;
        for (i = 0; i < colWidths.length; i++) {
            if (colWidths[i] === 0) colWidths[i] = flexW;
        }

        var totalColW = 0;
        for (i = 0; i < colWidths.length; i++) totalColW += colWidths[i];
        if (totalColW > contentW && totalColW > 0) {
            var scale = contentW / totalColW;
            for (i = 0; i < colWidths.length; i++) colWidths[i] = Math.floor(colWidths[i] * scale);
        }

        var tableX = pad;
        var tableY = pad;

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(tableX, tableY + headerH);
        ctx.lineTo(tableX + tableW, tableY + headerH);
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 2;
        ctx.stroke();

        this._colRects = [];
        var cx = tableX + numColW;
        ctx.font = '600 ' + headerFontSize + 'px ' + theme.FONTS.ui;
        ctx.textBaseline = 'middle';

        for (i = 0; i < visibleFields.length; i++) {
            var fname = visibleFields[i].name;
            var displayName = fname.replace(/_/g, ' ');
            var colX = cx;
            var colW = colWidths[i];

            var isSort = visibleFields[i].idx === this._sortCol;
            ctx.fillStyle = isSort ? t.text : t.textDim;
            ctx.textAlign = 'left';

            var labelText = displayName.length > 0
                ? displayName.charAt(0).toUpperCase() + displayName.slice(1)
                : '';
            var maxLabelW = colW - 20;
            while (ctx.measureText(labelText).width > maxLabelW && labelText.length > 3) {
                labelText = labelText.slice(0, -1);
            }
            if (labelText.length < displayName.length) labelText += '…';

            ctx.fillText(labelText, colX + 6, tableY + headerH / 2);

            if (isSort) {
                var arrowX = colX + 6 + ctx.measureText(labelText).width + 6;
                var arrowY = tableY + headerH / 2;
                ctx.fillStyle = accentHex;
                ctx.font = '600 ' + (headerFontSize - 1) + 'px ' + theme.FONTS.ui;
                ctx.fillText(this._sortAsc ? '▲' : '▼', arrowX, arrowY);
                ctx.font = '600 ' + headerFontSize + 'px ' + theme.FONTS.ui;
            }

            this._colRects.push({ x: colX, y: tableY, w: colW, h: headerH, fieldIdx: visibleFields[i].idx, name: fname });
            cx += colW;
        }

        var menuBtnSize = Math.max(16, headerH * 0.55);
        var menuBtnX = tableX + tableW - menuBtnSize - 4;
        var menuBtnY = tableY + (headerH - menuBtnSize) / 2;
        this._colMenuBtnRect = { x: menuBtnX, y: menuBtnY, w: menuBtnSize, h: menuBtnSize };

        ctx.fillStyle = t.textFaint;
        ctx.font = Math.max(10, menuBtnSize * 0.7) + 'px ' + theme.FONTS.ui;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚙', menuBtnX + menuBtnSize / 2, menuBtnY + menuBtnSize / 2);

        this._rowRects = [];
        var dataY = tableY + headerH + 2;
        ctx.font = fontSize + 'px ' + theme.FONTS.data;

        for (i = 0; i < pageRows.length; i++) {
            var ry = dataY + i * rowH;
            if (ry + rowH > h - footerH - pad) break;

            if (this._hoverRow === i) {
                ctx.fillStyle = theme.withAlpha(accentHex, 0.08);
                ctx.fillRect(tableX, ry, tableW, rowH);
            } else if (stripeRows && i % 2 === 0) {
                ctx.fillStyle = isDark
                    ? theme.withAlpha('#FFFFFF', 0.02)
                    : theme.withAlpha('#000000', 0.02);
                ctx.fillRect(tableX, ry, tableW, rowH);
            }

            ctx.beginPath();
            ctx.moveTo(tableX, ry + rowH);
            ctx.lineTo(tableX + tableW, ry + rowH);
            ctx.strokeStyle = t.edge;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            if (showRowNums) {
                ctx.fillStyle = t.textFaint;
                ctx.textAlign = 'right';
                ctx.font = (fontSize - 1) + 'px ' + theme.FONTS.data;
                ctx.fillText(String(startIdx + i + 1), tableX + numColW - 8, ry + rowH / 2);
                ctx.font = fontSize + 'px ' + theme.FONTS.data;
            }

            var rx = tableX + numColW;
            for (j = 0; j < visibleFields.length; j++) {
                var fIdx = visibleFields[j].idx;
                var cellVal = safeStr(pageRows[i][fIdx]);
                var cellW = colWidths[j];
                var cellX = rx + 6;
                var maxCellW = cellW - 12;

                ctx.textAlign = 'left';

                if (showStatusColors && visibleFields[j].name === 'status') {
                    var sc2 = statusColor(t, cellVal);
                    var dotR = Math.max(3, fontSize * 0.25);
                    ctx.beginPath();
                    ctx.arc(cellX + dotR, ry + rowH / 2, dotR, 0, Math.PI * 2);
                    ctx.fillStyle = sc2;
                    ctx.fill();
                    ctx.fillStyle = t.text;
                    var statusText = cellVal;
                    while (ctx.measureText(statusText).width > maxCellW - dotR * 2 - 8 && statusText.length > 2) {
                        statusText = statusText.slice(0, -1);
                    }
                    ctx.fillText(statusText, cellX + dotR * 2 + 6, ry + rowH / 2);
                } else if (moneySet[visibleFields[j].name]) {
                    var numV = safeNum(cellVal, null);
                    var moneyText = numV !== null ? numV.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : cellVal;
                    ctx.fillStyle = t.text;
                    ctx.font = fontSize + 'px ' + theme.FONTS.data;
                    while (ctx.measureText(moneyText).width > maxCellW && moneyText.length > 2) {
                        moneyText = moneyText.slice(0, -1);
                    }
                    ctx.fillText(moneyText, cellX, ry + rowH / 2);
                } else {
                    ctx.fillStyle = t.text;
                    var displayText = cellVal;
                    while (ctx.measureText(displayText).width > maxCellW && displayText.length > 2) {
                        displayText = displayText.slice(0, -1);
                    }
                    if (displayText.length < cellVal.length) displayText += '…';
                    ctx.fillText(displayText, cellX, ry + rowH / 2);
                }

                rx += cellW;
            }

            this._rowRects.push({ x: tableX, y: ry, w: tableW, h: rowH, rowIdx: i });
        }

        ctx.textBaseline = 'middle';
        var footerY = h - footerH;
        ctx.beginPath();
        ctx.moveTo(tableX, footerY);
        ctx.lineTo(tableX + tableW, footerY);
        ctx.strokeStyle = t.edge;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        var pageText = 'Page ' + (this._page + 1) + ' of ' + totalPages + '  ·  ' + totalRows + ' rows';
        ctx.font = '500 ' + Math.max(10, fontSize - 1) + 'px ' + theme.FONTS.ui;
        ctx.fillStyle = t.textDim;
        ctx.textAlign = 'left';
        ctx.fillText(pageText, tableX + 8, footerY + footerH / 2);

        var navFontSize = Math.max(12, fontSize);
        ctx.font = '500 ' + navFontSize + 'px ' + theme.FONTS.ui;

        var nextText = 'Next ›';
        var prevText = '‹ Prev';
        var nextW = ctx.measureText(nextText).width + 16;
        var prevW = ctx.measureText(prevText).width + 16;

        var nextX = tableX + tableW - nextW - 4;
        var prevX = nextX - prevW - 8;

        this._pageRects = {};

        if (this._page > 0) {
            ctx.fillStyle = accentHex;
            ctx.textAlign = 'center';
            ctx.fillText(prevText, prevX + prevW / 2, footerY + footerH / 2);
            this._pageRects.prev = { x: prevX, y: footerY, w: prevW, h: footerH };
        }
        if (this._page < totalPages - 1) {
            ctx.fillStyle = accentHex;
            ctx.textAlign = 'center';
            ctx.fillText(nextText, nextX + nextW / 2, footerY + footerH / 2);
            this._pageRects.next = { x: nextX, y: footerY, w: nextW, h: footerH };
        }

        if (this._colMenuOpen) {
            this._drawColumnMenu(ctx, t, allFields, allHidden, accentHex, w, h, headerH, pad);
        }
    },

    _drawColumnMenu: function(ctx, t, allFields, allHidden, accentHex, w, h, headerH, pad) {
        var menuW = Math.min(200, w * 0.35);
        var itemH = Math.max(22, headerH * 0.7);
        var menuH = allFields.length * itemH + 8;
        var menuX = w - menuW - pad - 4;
        var menuY = pad + headerH + 4;

        if (menuY + menuH > h - 10) menuH = h - menuY - 10;

        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        theme.roundRect(ctx, menuX, menuY, menuW, menuH, 6);
        ctx.fillStyle = t.panel;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle = t.edge;
        ctx.lineWidth = 1;
        ctx.stroke();

        this._colMenuRects = [];
        var fontSize = Math.max(10, itemH * 0.5);
        ctx.font = fontSize + 'px ' + theme.FONTS.ui;
        ctx.textBaseline = 'middle';

        for (var i = 0; i < allFields.length; i++) {
            var iy = menuY + 4 + i * itemH;
            if (iy + itemH > menuY + menuH) break;
            var fn = allFields[i].name;
            var hidden = !!allHidden[fn];

            var checkX = menuX + 10;
            var checkSize = Math.max(10, itemH * 0.45);
            var checkY = iy + (itemH - checkSize) / 2;

            theme.roundRect(ctx, checkX, checkY, checkSize, checkSize, 2);
            ctx.strokeStyle = hidden ? t.textFaint : accentHex;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            if (!hidden) {
                ctx.fillStyle = accentHex;
                ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold ' + (checkSize * 0.7) + 'px ' + theme.FONTS.ui;
                ctx.textAlign = 'center';
                ctx.fillText('✓', checkX + checkSize / 2, checkY + checkSize / 2);
                ctx.font = fontSize + 'px ' + theme.FONTS.ui;
            }

            ctx.fillStyle = hidden ? t.textFaint : t.text;
            ctx.textAlign = 'left';
            var displayFn = fn.replace(/_/g, ' ');
            displayFn = displayFn.charAt(0).toUpperCase() + displayFn.slice(1);
            ctx.fillText(displayFn, checkX + checkSize + 8, iy + itemH / 2);

            this._colMenuRects.push({ x: menuX, y: iy, w: menuW, h: itemH, fieldName: fn });
        }
    },

    _onClick: function(e) {
        var mx = e.offsetX;
        var my = e.offsetY;
        var i;

        if (this._colMenuOpen) {
            for (i = 0; i < this._colMenuRects.length; i++) {
                var mr = this._colMenuRects[i];
                if (mx >= mr.x && mx <= mr.x + mr.w && my >= mr.y && my <= mr.y + mr.h) {
                    var fn = mr.fieldName;
                    this._localHidden[fn] = !this._localHidden[fn];
                    this.invalidateUpdateView();
                    return;
                }
            }
            this._colMenuOpen = false;
            this.invalidateUpdateView();
            return;
        }

        if (this._colMenuBtnRect) {
            var btn = this._colMenuBtnRect;
            if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                this._colMenuOpen = !this._colMenuOpen;
                this.invalidateUpdateView();
                return;
            }
        }

        for (i = 0; i < this._colRects.length; i++) {
            var cr = this._colRects[i];
            if (mx >= cr.x && mx <= cr.x + cr.w && my >= cr.y && my <= cr.y + cr.h) {
                if (this._sortCol === cr.fieldIdx) {
                    this._sortAsc = !this._sortAsc;
                } else {
                    this._sortCol = cr.fieldIdx;
                    this._sortAsc = true;
                }
                this._page = 0;
                this.invalidateUpdateView();
                return;
            }
        }

        if (this._pageRects.prev) {
            var pr = this._pageRects.prev;
            if (mx >= pr.x && mx <= pr.x + pr.w && my >= pr.y && my <= pr.y + pr.h) {
                this._page = Math.max(0, this._page - 1);
                this.invalidateUpdateView();
                return;
            }
        }
        if (this._pageRects.next) {
            var nr = this._pageRects.next;
            if (mx >= nr.x && mx <= nr.x + nr.w && my >= nr.y && my <= nr.y + nr.h) {
                this._page = this._page + 1;
                this.invalidateUpdateView();
                return;
            }
        }

        for (i = 0; i < this._rowRects.length; i++) {
            var rr = this._rowRects[i];
            if (mx >= rr.x && mx <= rr.x + rr.w && my >= rr.y && my <= rr.y + rr.h) {
                try {
                    this.drilldown({
                        action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                        data: {}
                    }, e);
                } catch (ex) {}
                return;
            }
        }
    },

    _onMouseMove: function(e) {
        var mx = e.offsetX;
        var my = e.offsetY;
        var newHover = -1;

        for (var i = 0; i < this._rowRects.length; i++) {
            var rr = this._rowRects[i];
            if (mx >= rr.x && mx <= rr.x + rr.w && my >= rr.y && my <= rr.y + rr.h) {
                newHover = i;
                break;
            }
        }

        var inHeader = false;
        for (var j = 0; j < this._colRects.length; j++) {
            var cr = this._colRects[j];
            if (mx >= cr.x && mx <= cr.x + cr.w && my >= cr.y && my <= cr.y + cr.h) {
                inHeader = true;
                break;
            }
        }

        var inPager = false;
        if (this._pageRects.prev) {
            var pr = this._pageRects.prev;
            if (mx >= pr.x && mx <= pr.x + pr.w && my >= pr.y && my <= pr.y + pr.h) inPager = true;
        }
        if (this._pageRects.next) {
            var nr = this._pageRects.next;
            if (mx >= nr.x && mx <= nr.x + nr.w && my >= nr.y && my <= nr.y + nr.h) inPager = true;
        }

        this._canvas.style.cursor = (inHeader || inPager || newHover >= 0) ? 'pointer' : 'default';

        if (newHover !== this._hoverRow) {
            this._hoverRow = newHover;
            this.invalidateUpdateView();
        }
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});


});