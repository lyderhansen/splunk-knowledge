define(["api/SplunkVisualizationBase"], function(SplunkVisualizationBase) {

// === Shared theme tokens ===
var theme = (function() {
// Patagonia Outdoor Operations — shared design tokens
// Mood: Organic | Tone: grounded, purposeful, organic

var PALETTES = {
    dark: {
        bg:        '#1C1A17',
        panel:     '#242220',
        panelHi:   '#2E2C29',
        text:      '#E6E1D9',
        textDim:   'rgba(230,225,217,0.50)',
        textMuted: 'rgba(230,225,217,0.25)',
        green:     '#5E8F5C',
        sandstone: '#C9956B',
        glacier:   '#6899A9',
        earth:     '#8B6B4A',
        rust:      '#B86B52',
        ridge:     '#3D5A3A',
        accent:    '#5E8F5C',
        grid:      'rgba(230,225,217,0.06)',
        edge:      'rgba(230,225,217,0.04)',
        glow:      'rgba(94,143,92,0.35)'
    },
    light: {
        bg:        '#F4F1EB',
        panel:     '#FFFFFF',
        panelHi:   '#F8F6F2',
        text:      '#1C1A17',
        textDim:   'rgba(28,26,23,0.50)',
        textMuted: 'rgba(28,26,23,0.25)',
        green:     '#4A7A48',
        sandstone: '#B07F55',
        glacier:   '#527F8F',
        earth:     '#6E5538',
        rust:      '#A05840',
        ridge:     '#6B8F68',
        accent:    '#4A7A48',
        grid:      'rgba(28,26,23,0.06)',
        edge:      'rgba(28,26,23,0.06)',
        glow:      'rgba(74,122,72,0.20)'
    }
};

var FONTS = {
    ui:   '"Barlow Semi Condensed", "Helvetica Neue", Helvetica, Arial, sans-serif',
    data: '"SF Mono", Menlo, Consolas, monospace'
};

var STATUS_COLORS = {
    dark: {
        healthy:  '#5E8F5C',
        warning:  '#C9956B',
        critical: '#B86B52',
        info:     '#6899A9'
    },
    light: {
        healthy:  '#4A7A48',
        warning:  '#B07F55',
        critical: '#A05840',
        info:     '#527F8F'
    }
};

var SERIES_COLORS = {
    dark: ['#5E8F5C', '#6899A9', '#C9956B', '#8B6B4A', '#B86B52', '#7EA97C', '#89B3C0'],
    light: ['#4A7A48', '#527F8F', '#B07F55', '#6E5538', '#A05840', '#6B8F68', '#6E99A8']
};

function getTheme(mode) {
    var m = (mode === 'light') ? 'light' : 'dark';
    return {
        palette: PALETTES[m],
        fonts: FONTS,
        status: STATUS_COLORS[m],
        series: SERIES_COLORS[m],
        mode: m
    };
}

function lerpColor(a, b, t) {
    var ah = parseInt(a.replace('#', ''), 16);
    var bh = parseInt(b.replace('#', ''), 16);
    var ar = (ah >> 16) & 0xFF, ag = (ah >> 8) & 0xFF, ab = ah & 0xFF;
    var br = (bh >> 16) & 0xFF, bg_ = (bh >> 8) & 0xFF, bb = bh & 0xFF;
    var rr = Math.round(ar + (br - ar) * t);
    var rg = Math.round(ag + (bg_ - ag) * t);
    var rb = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1);
}

function fmtNum(n, opts) {
    opts = opts || {};
    if (typeof n !== 'number' || isNaN(n)) return String(n || '—');
    if (opts.compact) {
        if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    }
    var d = (opts.decimals !== undefined && opts.decimals >= 0) ? opts.decimals : 0;
    var parts = n.toFixed(d).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var result = parts.join('.');
    if (opts.unit) {
        if (opts.unitPosition === 'before') return opts.unit + result;
        return result + opts.unit;
    }
    return result;
}

function setupCanvas(container) {
    var canvas = container.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;top:0;left:0;';
        container.appendChild(canvas);
    }
    var w = container.clientWidth || container.offsetWidth || window.innerWidth || 300;
    var h = container.clientHeight || container.offsetHeight || window.innerHeight || 200;
    if (w < 10) w = window.innerWidth || 300;
    if (h < 10) h = window.innerHeight || 200;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { canvas: canvas, ctx: ctx, w: w, h: h, dpr: dpr };
}

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

function detectTheme() {
    try {
        var body = document.body;
        if (body) {
            var dt = body.getAttribute('data-theme');
            if (dt === 'light' || dt === 'dark') return dt;
            if (body.classList.contains('light')) return 'light';
            if (body.classList.contains('dark')) return 'dark';
        }
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            var avg = (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3;
            return avg < 128 ? 'dark' : 'light';
        }
    } catch (e) {}
    return 'dark';
}

function hexToRgba(hex, alpha) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function drawRidgeline(ctx, x, y, width, height, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    var peaks = [
        [0.00, 1.0], [0.05, 0.7], [0.10, 0.5], [0.14, 0.3],
        [0.18, 0.55], [0.22, 0.2], [0.26, 0.45], [0.30, 0.1],
        [0.34, 0.35], [0.38, 0.0], [0.42, 0.25], [0.46, 0.4],
        [0.50, 0.15], [0.54, 0.5], [0.58, 0.3], [0.62, 0.05],
        [0.66, 0.35], [0.70, 0.55], [0.74, 0.2], [0.78, 0.45],
        [0.82, 0.6], [0.86, 0.4], [0.90, 0.7], [0.95, 0.85],
        [1.00, 1.0]
    ];
    for (var i = 0; i < peaks.length; i++) {
        var px = x + peaks[i][0] * width;
        var py = y + peaks[i][1] * height;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            var prev = peaks[i - 1];
            var cpx = x + (prev[0] + peaks[i][0]) * 0.5 * width;
            ctx.quadraticCurveTo(cpx, y + prev[1] * height, px, py);
        }
    }
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}


    return {
        PALETTES: PALETTES,
        FONTS: FONTS,
        STATUS_COLORS: STATUS_COLORS,
        SERIES_COLORS: SERIES_COLORS,
        getTheme: getTheme,
        detectTheme: detectTheme,
        lerpColor: lerpColor,
        hexToRgba: hexToRgba,
        fmtNum: fmtNum,
        setupCanvas: setupCanvas,
        getOption: getOption,
        getNS: getNS,
        drawRidgeline: drawRidgeline
    };
})();

// === Visualization source ===
// regional_bars — Horizontal bar chart: region composite scores
// Patagonia Outdoor Operations viz pack
// ES5 CommonJS — build script wraps in AMD define()

var TOOLTIP_STYLE = [
    'position:absolute',
    'pointer-events:none',
    'display:none',
    'border-radius:4px',
    'padding:7px 11px',
    'font-size:12px',
    'line-height:1.6',
    'white-space:nowrap',
    'z-index:9999',
    'max-width:300px'
].join(';');

return SplunkVisualizationBase.extend({

    initialize: function () {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this._container = null;
        this._canvas = null;
        this._tooltip = null;
        this._lastData = null;
        this._lastConfig = null;
        this._hitRegions = [];
        this._hoveredIdx = -1;
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

        var fields = data.fields;
        var rows = data.rows;

        // Field name lookup is deferred to updateView/config reads — store raw
        var colIdx = {};
        for (var fi = 0; fi < fields.length; fi++) {
            colIdx[fields[fi].name] = fi;
        }

        this._lastData = { colIdx: colIdx, rows: rows, fields: fields };
        return this._lastData;
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
        this._boundMouseMove = function (e) { self._onMouseMove(e); };
        this._boundMouseLeave = function () { self._onMouseLeave(); };
        el.addEventListener('mousemove', this._boundMouseMove);
        el.addEventListener('mouseleave', this._boundMouseLeave);
    },

    _onMouseMove: function (e) {
        if (!this._hitRegions.length || !this._lastData || !this._lastItems) {
            this._hideTooltip();
            return;
        }

        var rect = this.el.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = -1;

        for (var i = 0; i < this._hitRegions.length; i++) {
            var hr = this._hitRegions[i];
            if (mx >= hr.x && mx <= hr.x + hr.w && my >= hr.y && my <= hr.y + hr.h) {
                hit = i;
                break;
            }
        }

        if (hit >= 0) {
            var item = this._lastItems[hit];
            var lines = [];
            lines.push('<strong>' + item.region + '</strong>');
            lines.push(item.valueFieldName.replace(/_/g, ' ') + ': ' + item.score.toFixed(1));

            var keys = [];
            for (var k in item.extras) {
                if (Object.prototype.hasOwnProperty.call(item.extras, k)) keys.push(k);
            }
            for (var ki = 0; ki < keys.length; ki++) {
                var key = keys[ki];
                var val = item.extras[key];
                var num = parseFloat(val);
                var display = (isNaN(num) ? String(val) : num.toFixed(1));
                var label = key.replace(/_/g, ' ');
                label = label.charAt(0).toUpperCase() + label.slice(1);
                lines.push(label + ': ' + display);
            }

            var tip = this._tooltip;
            tip.innerHTML = lines.join('<br>');
            tip.style.display = 'block';

            var tx = Math.min(mx + 14, rect.width - 200);
            var ty = Math.max(my - 38, 4);
            tip.style.left = tx + 'px';
            tip.style.top = ty + 'px';

            if (hit !== this._hoveredIdx) {
                this._hoveredIdx = hit;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
            if (this._canvas) this._canvas.style.cursor = 'default';
        } else {
            if (this._hoveredIdx >= 0) {
                this._hoveredIdx = -1;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
            this._hideTooltip();
        }
    },

    _onMouseLeave: function () {
        this._hideTooltip();
        if (this._hoveredIdx >= 0) {
            this._hoveredIdx = -1;
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
            this._drawEmpty(config);
            return;
        }

        this._render(data, config);
    },

    _render: function (data, config) {
        var ns = theme.getNS(this);

        // --- Read all config options ---
        var themeMode = theme.getOption(config, ns, 'themeMode', 'auto');
        if (themeMode === 'auto') themeMode = theme.detectTheme();
        var t = theme.getTheme(themeMode);
        var p = t.palette;

        var regionField    = theme.getOption(config, ns, 'regionField', 'region');
        var valueField     = theme.getOption(config, ns, 'valueField', 'composite_score');
        var maxValue       = parseFloat(theme.getOption(config, ns, 'maxValue', '100'));
        if (isNaN(maxValue) || maxValue <= 0) maxValue = 100;
        var barRadius      = parseInt(theme.getOption(config, ns, 'barRadius', '4'), 10);
        if (isNaN(barRadius) || barRadius < 0) barRadius = 4;
        var showGridLines  = theme.getOption(config, ns, 'showGridLines', 'true') === 'true';
        var showValues     = theme.getOption(config, ns, 'showValues', 'true') === 'true';
        var sortOrder      = theme.getOption(config, ns, 'sortOrder', 'descending');
        var lowColor       = theme.getOption(config, ns, 'lowColor', p.earth);
        var highColor      = theme.getOption(config, ns, 'highColor', p.green);
        var accentIntensity = parseFloat(theme.getOption(config, ns, 'accentIntensity', '50')) / 100;

        // --- Build items from raw data (config-driven field names) ---
        var colIdx = data.colIdx;
        var rows = data.rows;
        var fields = data.fields;

        var regionColIdx = -1;
        var valueColIdx = -1;
        for (var fi = 0; fi < fields.length; fi++) {
            if (fields[fi].name === regionField) regionColIdx = fi;
            if (fields[fi].name === valueField)  valueColIdx = fi;
        }

        // Fallback: if named field not found try index 0 / 1
        if (regionColIdx < 0 && fields.length > 0) regionColIdx = 0;
        if (valueColIdx < 0  && fields.length > 1) valueColIdx = 1;
        if (valueColIdx < 0) valueColIdx = 0;

        var extraFieldDefs = [];
        for (var ef = 0; ef < fields.length; ef++) {
            if (ef !== regionColIdx && ef !== valueColIdx) {
                extraFieldDefs.push({ name: fields[ef].name, colIdx: ef });
            }
        }

        var items = [];
        for (var ri = 0; ri < rows.length; ri++) {
            var row = rows[ri];
            var region = String(row[regionColIdx] !== undefined ? row[regionColIdx] : '');
            var score = parseFloat(row[valueColIdx]);
            if (isNaN(score)) score = 0;

            var extras = {};
            for (var ei = 0; ei < extraFieldDefs.length; ei++) {
                extras[extraFieldDefs[ei].name] = row[extraFieldDefs[ei].colIdx];
            }

            items.push({
                region: region,
                score: score,
                valueFieldName: valueField,
                extras: extras
            });
        }

        // Sort
        if (sortOrder === 'descending') {
            items.sort(function (a, b) { return b.score - a.score; });
        } else if (sortOrder === 'ascending') {
            items.sort(function (a, b) { return a.score - b.score; });
        }
        // 'none' = data order

        this._lastItems = items;

        // --- Canvas setup ---
        var setup = theme.setupCanvas(this.el);
        var ctx = setup.ctx;
        var w = setup.w;
        var h = setup.h;
        this._canvas = setup.canvas;

        // Style tooltip
        var tip = this._tooltip;
        tip.style.background = p.panelHi;
        tip.style.color = p.text;
        tip.style.fontFamily = t.fonts.ui;
        tip.style.border = '1px solid ' + p.grid;

        ctx.clearRect(0, 0, w, h);

        var rowCount = items.length;
        if (rowCount === 0) return;

        // --- Layout ---
        var padV      = Math.max(6, Math.round(h * 0.03));
        var padH      = Math.max(6, Math.round(w * 0.015));
        var labelColW = Math.round(w * 0.28);
        var scoreColW = showValues ? Math.max(32, Math.round(w * 0.08)) : 0;
        var barAreaX  = padH + labelColW + Math.max(4, Math.round(w * 0.01));
        var barAreaW  = w - barAreaX - scoreColW - padH;
        var availH    = h - padV * 2;
        var rowGap    = Math.max(2, Math.round(availH * 0.06 / rowCount));
        var rowH      = Math.max(20, Math.floor((availH - rowGap * (rowCount - 1)) / rowCount));
        var fontSize  = Math.max(9, Math.round(rowH * 0.40));
        var scoreFontSize = Math.max(9, Math.round(rowH * 0.38));

        // --- Grid lines at 25, 50, 75 ---
        if (showGridLines) {
            ctx.save();
            ctx.strokeStyle = p.grid;
            ctx.lineWidth = 1;
            var gridMarks = [25, 50, 75];
            for (var gi = 0; gi < gridMarks.length; gi++) {
                var gx = barAreaX + (gridMarks[gi] / 100) * barAreaW;
                ctx.beginPath();
                ctx.moveTo(gx, padV);
                ctx.lineTo(gx, h - padV);
                ctx.stroke();
            }
            ctx.restore();
        }

        // --- Reset hit regions ---
        this._hitRegions = [];

        // --- Draw each row ---
        for (var i = 0; i < rowCount; i++) {
            var item = items[i];
            var rowY = padV + i * (rowH + rowGap);
            var isHovered = (i === this._hoveredIdx);
            var scoreFrac = Math.min(1, Math.max(0, item.score / maxValue));

            // Bar color: lerp lowColor → highColor
            var barColor = theme.lerpColor(lowColor, highColor, scoreFrac);
            if (isHovered) {
                barColor = theme.lerpColor(barColor, '#FFFFFF', 0.18);
            }

            var barW = Math.round(scoreFrac * barAreaW);

            // Hit region: full row width
            this._hitRegions.push({ x: 0, y: rowY, w: w, h: rowH });

            // Draw bar
            if (barW > 0) {
                var rx = Math.min(barRadius, Math.floor(rowH / 2), barW);

                var grad = ctx.createLinearGradient(barAreaX, rowY, barAreaX + barW, rowY);
                grad.addColorStop(0,   theme.lerpColor(lowColor, barColor, 0.3));
                grad.addColorStop(0.6, barColor);
                grad.addColorStop(1,   theme.lerpColor(barColor, highColor, 0.2));

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(barAreaX, rowY);
                ctx.lineTo(barAreaX + barW - rx, rowY);
                ctx.arcTo(barAreaX + barW, rowY,          barAreaX + barW, rowY + rowH, rx);
                ctx.arcTo(barAreaX + barW, rowY + rowH,   barAreaX,        rowY + rowH, rx);
                ctx.lineTo(barAreaX, rowY + rowH);
                ctx.closePath();

                ctx.globalAlpha = 0.82 + accentIntensity * 0.18;
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.globalAlpha = 1;

                // Subtle 1px top highlight
                ctx.beginPath();
                ctx.moveTo(barAreaX + 1, rowY + 1);
                ctx.lineTo(barAreaX + barW - rx, rowY + 1);
                ctx.strokeStyle = 'rgba(230,225,217,0.10)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.restore();
            }

            // 1px bottom separator
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(barAreaX, rowY + rowH);
            ctx.lineTo(barAreaX + barAreaW, rowY + rowH);
            ctx.strokeStyle = p.grid;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            // Region label
            ctx.save();
            ctx.font = (isHovered ? '600' : '500') + ' ' + fontSize + 'px ' + t.fonts.ui;
            ctx.fillStyle = isHovered ? p.text : p.textDim;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.save();
            ctx.beginPath();
            ctx.rect(padH, rowY, labelColW - 6, rowH);
            ctx.clip();
            ctx.fillText(item.region, padH, rowY + rowH * 0.5);
            ctx.restore();
            ctx.restore();

            // Score value
            if (showValues) {
                var scoreX = barAreaX + barAreaW + Math.max(4, Math.round(w * 0.008));
                ctx.save();
                ctx.font = '600 ' + scoreFontSize + 'px ' + t.fonts.data;
                ctx.fillStyle = isHovered ? p.text : p.textDim;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.score.toFixed(1), scoreX, rowY + rowH * 0.5);
                ctx.restore();
            }
        }
    },

    _drawEmpty: function (config) {
        if (!this._container) return;
        var ns = theme.getNS(this);
        var themeMode = theme.getOption(config || {}, ns, 'themeMode', 'auto');
        if (themeMode === 'auto') themeMode = theme.detectTheme();
        var t = theme.getTheme(themeMode);
        var setup = theme.setupCanvas(this.el);
        var ctx = setup.ctx;
        ctx.clearRect(0, 0, setup.w, setup.h);
        ctx.font = '400 13px ' + t.fonts.ui;
        ctx.fillStyle = t.palette.textMuted;
        ctx.textAlign = 'center';
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
        if (this._boundMouseMove)  el.removeEventListener('mousemove',  this._boundMouseMove);
        if (this._boundMouseLeave) el.removeEventListener('mouseleave', this._boundMouseLeave);
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        this._container  = null;
        this._canvas     = null;
        this._tooltip    = null;
        this._lastData   = null;
        this._lastConfig = null;
        this._lastItems  = null;
        this._hitRegions = [];
        SplunkVisualizationBase.prototype.destroy && SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});


});