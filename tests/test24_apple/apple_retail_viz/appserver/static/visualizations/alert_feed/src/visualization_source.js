var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
              'Jul','Aug','Sep','Oct','Nov','Dec'];

function parseTimestamp(s) {
    if (s == null || s === '') return '';
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (m) {
        var mon = MONTHS[parseInt(m[2], 10) - 1];
        return mon + ' ' + parseInt(m[3], 10) + ', ' + m[4] + ':' + m[5];
    }
    return String(s);
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:8px 14px;' +
            'border-radius:10px;pointer-events:none;z-index:100;' +
            'font-size:11px;max-width:300px;word-wrap:break-word;';
        this.el.appendChild(this._tooltip);

        this._hitRegions = [];
        this._hoveredIdx = -1;
        this._scrollOffset = 0;
        this._lastData = null;
        this._lastConfig = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
            if (self._hoveredIdx !== -1) {
                self._hoveredIdx = -1;
                if (self._lastData && self._lastConfig) {
                    self._render(self._lastData, self._lastConfig);
                }
            }
        });
        this._canvas.addEventListener('wheel', function(e) {
            e.preventDefault();
            self._scrollOffset += e.deltaY * 0.5;
            if (self._scrollOffset < 0) self._scrollOffset = 0;
            if (self._lastData && self._lastConfig) {
                self._render(self._lastData, self._lastConfig);
            }
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
        if (!data || !data.rows || data.rows.length === 0) return;
        this._lastData = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    _render: function(data, config) {
        var ns = theme.getNS(this);
        var themeMode = theme.getOption(config, ns, 'themeMode', 'auto');
        var isDark = themeMode === 'auto' ? theme.detectTheme() === 'dark' : themeMode === 'dark';
        var t = isDark ? theme.DARK : theme.LIGHT;

        var sevField = theme.getOption(config, ns, 'severityField', 'severity');
        var storeField = theme.getOption(config, ns, 'storeField', 'store');
        var msgField = theme.getOption(config, ns, 'messageField', 'message');
        var timeField = theme.getOption(config, ns, 'timeField', '_time');
        var maxRows = parseInt(theme.getOption(config, ns, 'maxRows', '20'), 10);
        var accentIntensity = parseInt(theme.getOption(config, ns, 'accentIntensity', '50'), 10);

        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;
        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 200;
        if (w < 10) w = window.innerWidth || 300;
        if (h < 10) h = window.innerHeight || 200;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        var colIdx = data.colIdx;
        var si = colIdx[sevField];
        var sti = colIdx[storeField];
        var mi = colIdx[msgField];
        var ti = colIdx[timeField];

        // Parse rows
        var items = [];
        var rows = data.rows;
        var count = Math.min(rows.length, maxRows);
        for (var i = 0; i < count; i++) {
            items.push({
                severity: theme.safeStr(si !== undefined ? rows[i][si] : '').toLowerCase(),
                store: theme.safeStr(sti !== undefined ? rows[i][sti] : ''),
                message: theme.safeStr(mi !== undefined ? rows[i][mi] : ''),
                time: theme.safeStr(ti !== undefined ? rows[i][ti] : '')
            });
        }

        // Severity colors
        var sevColors = {
            critical: isDark ? t.danger : t.danger,
            warning: isDark ? t.warning : t.warning,
            info: isDark ? t.accent : t.accent,
            low: isDark ? t.textDim : t.textDim
        };

        // Layout
        var padX = Math.max(12, w * 0.03);
        var padY = Math.max(8, h * 0.02);
        var rowGap = Math.max(4, h * 0.012);
        var rowH = Math.max(48, Math.min(72, (h - padY * 2) / Math.min(items.length, 6)));

        // Clamp scroll
        var totalH = items.length * (rowH + rowGap);
        var maxScroll = Math.max(0, totalH - h + padY * 2);
        if (this._scrollOffset > maxScroll) this._scrollOffset = maxScroll;

        this._hitRegions = [];

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.clip();

        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            var y = padY + j * (rowH + rowGap) - this._scrollOffset;

            // Skip if out of view
            if (y + rowH < -10 || y > h + 10) continue;

            var hovered = j === this._hoveredIdx;
            var sevColor = sevColors[item.severity] || sevColors.info;

            // Row background on hover
            if (hovered) {
                ctx.fillStyle = t.accentDim;
                this._roundRect(ctx, padX - 4, y - 2, w - padX * 2 + 8, rowH + 4, 8);
                ctx.fill();
            }

            // Severity badge — pill shape
            var badgeW = Math.max(50, Math.min(72, w * 0.06));
            var badgeH = Math.max(16, rowH * 0.30);
            var badgeX = padX;
            var badgeY = y + (rowH - badgeH) / 2;

            // Badge background
            ctx.globalAlpha = isDark ? 0.20 : 0.12;
            ctx.fillStyle = sevColor;
            this._roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Badge dot
            var dotR = Math.max(3, badgeH * 0.18);
            ctx.beginPath();
            ctx.arc(badgeX + badgeH / 2, badgeY + badgeH / 2, dotR, 0, Math.PI * 2);
            ctx.fillStyle = sevColor;
            ctx.fill();

            // Badge text
            var badgeFontSize = Math.max(7, badgeH * 0.48);
            ctx.font = '600 ' + badgeFontSize + 'px ' + theme.FONTS.display;
            ctx.fillStyle = sevColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            var sevLabel = item.severity.charAt(0).toUpperCase() + item.severity.slice(1);
            ctx.fillText(sevLabel, badgeX + badgeH + 2, badgeY + badgeH / 2);

            // Store name
            var contentX = padX + badgeW + 16;
            var storeFontSize = Math.max(9, rowH * 0.20);
            ctx.font = '600 ' + storeFontSize + 'px ' + theme.FONTS.display;
            ctx.fillStyle = t.text;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(item.store, contentX, y + rowH * 0.18);

            // Message
            var msgFontSize = Math.max(8, rowH * 0.17);
            ctx.font = '400 ' + msgFontSize + 'px ' + theme.FONTS.display;
            ctx.fillStyle = t.textDim;

            // Truncate message to fit
            var maxMsgW = w - contentX - padX - 90;
            var msgText = item.message;
            if (ctx.measureText(msgText).width > maxMsgW) {
                while (msgText.length > 0 && ctx.measureText(msgText + '...').width > maxMsgW) {
                    msgText = msgText.slice(0, -1);
                }
                msgText += '...';
            }
            ctx.fillText(msgText, contentX, y + rowH * 0.52);

            // Timestamp — right side
            if (item.time) {
                var timeFontSize = Math.max(7, rowH * 0.15);
                ctx.font = '400 ' + timeFontSize + 'px ' + theme.FONTS.mono;
                ctx.fillStyle = t.textMuted;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(parseTimestamp(item.time), w - padX, y + rowH / 2);
            }

            // Separator
            if (j < items.length - 1) {
                ctx.fillStyle = t.border;
                ctx.fillRect(contentX, y + rowH + rowGap / 2 - 0.5, w - contentX - padX, 1);
            }

            this._hitRegions.push({
                x: 0, y: y, w: w, h: rowH,
                store: item.store, message: item.message,
                severity: item.severity, time: item.time
            });
        }

        ctx.restore();

        // Scroll indicator
        if (totalH > h) {
            var scrollTrackH = h - padY * 4;
            var scrollThumbH = Math.max(20, scrollTrackH * (h / totalH));
            var scrollThumbY = padY * 2 + (this._scrollOffset / maxScroll) * (scrollTrackH - scrollThumbH);
            ctx.fillStyle = t.textMuted;
            ctx.globalAlpha = 0.3;
            this._roundRect(ctx, w - 6, scrollThumbY, 3, scrollThumbH, 1.5);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Tooltip styling
        this._tooltip.style.background = t.card;
        this._tooltip.style.color = t.text;
        this._tooltip.style.fontFamily = theme.FONTS.display;
        this._tooltip.style.boxShadow = '0 4px 20px ' + t.shadow;
    },

    _roundRect: function(ctx, x, y, w, h, r) {
        if (r > h / 2) r = h / 2;
        if (r > w / 2) r = w / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
        ctx.lineTo(x + w, y + h - r);
        ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
        ctx.lineTo(x + r, y + h);
        ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
        ctx.lineTo(x, y + r);
        ctx.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
        ctx.closePath();
    },

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        var hit = -1;
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                hit = i;
                break;
            }
        }

        if (hit >= 0) {
            var region = this._hitRegions[hit];
            this._tooltip.innerHTML = '<b>' + region.store + '</b><br>' + region.message;
            this._tooltip.style.display = 'block';
            this._tooltip.style.left = Math.min(mx + 14, this.el.clientWidth - 200) + 'px';
            this._tooltip.style.top = (my - 10) + 'px';
            this._canvas.style.cursor = 'pointer';
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
        }

        if (hit !== this._hoveredIdx) {
            this._hoveredIdx = hit;
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        }
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
