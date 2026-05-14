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

function parseBool(val, fallback) {
    if (val === undefined || val === null) return fallback;
    return val === 'true' || val === true || val === '1';
}

function formatNumber(n) {
    var s = String(Math.round(n));
    var result = '';
    var len = s.length;
    for (var i = 0; i < len; i++) {
        if (i > 0 && (len - i) % 3 === 0) {
            result += ',';
        }
        result += s[i];
    }
    return result;
}

function roundRect(ctx, x, y, w, h, r) {
    if (r === undefined) r = 4;
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

function withAlpha(hex, alpha) {
    if (!hex) return 'rgba(0,0,0,' + alpha + ')';
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

// ---------------------------------------------------------------------------
// Font loading
// ---------------------------------------------------------------------------

var _fontReady = false;
var _fontPending = false;

function loadFont(fontFamily, onReady) {
    if (_fontReady) { onReady(); return; }
    if (typeof document === 'undefined' || !document.fonts ||
        !document.fonts.load) {
        setTimeout(onReady, 200);
        return;
    }
    if (!_fontPending) {
        _fontPending = true;
        document.fonts.load('400 48px "' + fontFamily + '"').then(function() {
            _fontReady = true;
        });
    }
    var attempts = 0;
    var poll = function() {
        attempts++;
        if (_fontReady || attempts > 30) {
            _fontReady = true;
            onReady();
            return;
        }
        setTimeout(poll, 100);
    };
    poll();
}

// ---------------------------------------------------------------------------
// Viz definition
// ---------------------------------------------------------------------------

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';

        // Canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        // Tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 12px;' +
            'background:rgba(8,12,24,0.92);color:#C8D6E5;font-size:11px;' +
            'border-radius:3px;pointer-events:none;white-space:nowrap;z-index:100;' +
            'border:1px solid rgba(0,229,204,0.25);font-family:"IBM Plex Mono",monospace;';
        this.el.appendChild(this._tooltip);

        this._hitRegions = [];
        this._hoverIdx = -1;
        this._lastData = null;
        this._lastConfig = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
            if (self._hoverIdx !== -1) {
                self._hoverIdx = -1;
                if (self._lastData && self._lastConfig) {
                    self._render(self._lastData, self._lastConfig);
                }
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
        var self = this;
        var t = theme.getTheme();
        var fonts = theme.getFonts();
        loadFont(fonts.family.split(',')[0].replace(/"/g, '').trim(), function() {
            self._render(data, config);
        });
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    _render: function(data, config) {
        var ns = getNS(this);
        var t = theme.getTheme();
        var fonts = theme.getFonts();

        // --- Read options ---
        var nameField    = getOption(config, ns, 'nameField',          'service_name');
        var countField   = getOption(config, ns, 'countField',         'attack_count');
        var blockedField = getOption(config, ns, 'blockedField',       'blocked_count');
        var rateField    = getOption(config, ns, 'rateField',          'success_rate');
        var colorBlocked = getOption(config, ns, 'colorBlocked',       '#00E5CC');
        var colorPassed  = getOption(config, ns, 'colorPassed',        '#FFB020');
        var barBg        = getOption(config, ns, 'barBg',              '#1A2236');
        var showRate     = parseBool(getOption(config, ns, 'showRate', 'true'), true);
        var maxBars      = parseInt(getOption(config, ns, 'maxBars',   '10'), 10);
        var barHeight    = parseInt(getOption(config, ns, 'barHeight', '28'), 10);
        var barGap       = parseInt(getOption(config, ns, 'barGap',    '8'), 10);
        var barRadius    = parseInt(getOption(config, ns, 'barRadius', '3'), 10);
        var accentIntensity = parseFloat(getOption(config, ns, 'accentIntensity', '50'));
        var rateGood     = parseFloat(getOption(config, ns, 'rateThresholdGood', '99'));
        var rateWarn     = parseFloat(getOption(config, ns, 'rateThresholdWarn', '97'));

        if (isNaN(maxBars) || maxBars < 1) maxBars = 10;
        if (isNaN(barHeight) || barHeight < 8) barHeight = 28;
        if (isNaN(barGap) || barGap < 0) barGap = 8;
        if (isNaN(barRadius) || barRadius < 0) barRadius = 3;
        if (isNaN(accentIntensity)) accentIntensity = 50;
        var gi = Math.max(0, Math.min(100, accentIntensity)) / 50;

        // --- Canvas setup (HiDPI) ---
        var el = this.el;
        var w = el.offsetWidth;
        var h = el.offsetHeight;
        if (w < 1 || h < 1) return;

        var dpr = window.devicePixelRatio || 1;
        var canvas = this._canvas;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        // --- Resolve field indices ---
        var colIdx = data.colIdx || {};
        var nameIdx    = colIdx[nameField];
        var countIdx   = colIdx[countField];
        var blockedIdx = colIdx[blockedField];
        var rateIdx    = colIdx[rateField];

        var hasName    = nameIdx !== undefined;
        var hasCount   = countIdx !== undefined;
        var hasBlocked = blockedIdx !== undefined;
        var hasRate    = rateIdx !== undefined;

        if (!hasName || !hasCount) {
            ctx.fillStyle = t.textMuted;
            ctx.font = '11px ' + fonts.family;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No data — need ' + nameField + ', ' + countField, w / 2, h / 2);
            return;
        }

        // --- Parse and sort rows ---
        var parsed = [];
        for (var i = 0; i < data.rows.length; i++) {
            var row = data.rows[i];
            var name  = String(row[nameIdx] || '');
            var count = parseFloat(row[countIdx]) || 0;
            var blocked = hasBlocked ? (parseFloat(row[blockedIdx]) || 0) : count;
            var rateRaw = hasRate ? String(row[rateIdx] || '') : null;
            var rateVal = rateRaw ? parseFloat(rateRaw) : (count > 0 ? (blocked / count) * 100 : 100);
            parsed.push({
                name: name,
                count: count,
                blocked: blocked,
                rateRaw: rateRaw,
                rateVal: rateVal
            });
        }

        // Sort descending by count
        parsed.sort(function(a, b) { return b.count - a.count; });
        if (parsed.length > maxBars) parsed = parsed.slice(0, maxBars);

        var numRows = parsed.length;
        if (numRows === 0) return;

        var maxCount = parsed[0].count || 1;

        // --- Layout constants ---
        var padL = 12;
        var padR = 12;
        var padT = 28; // space for section header
        var padB = 8;

        var fontFamily = fonts.family;

        // Name column: measure the widest, cap at 200px
        ctx.font = '13px ' + fontFamily;
        var namColW = 0;
        for (var n = 0; n < numRows; n++) {
            var nw = ctx.measureText(parsed[n].name).width;
            if (nw > namColW) namColW = nw;
        }
        namColW = Math.min(namColW + 8, 200);
        namColW = Math.max(namColW, 80);

        // Rate badge column width (only when showRate)
        var badgeColW = showRate ? 72 : 0;
        // Count text after bar
        var countColW = 70;

        var barAreaX = padL + namColW + 8;
        var barAreaW = w - barAreaX - countColW - badgeColW - padR - 8;
        if (barAreaW < 20) barAreaW = 20;

        // --- Section header ---
        ctx.save();
        ctx.font = '600 10px ' + fontFamily;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'rgba(200,214,229,0.35)';
        ctx.letterSpacing = '1.5px';
        ctx.fillText('DEFENSE STATUS', padL, 16);
        ctx.letterSpacing = '0px';
        ctx.restore();

        // --- Draw rows ---
        this._hitRegions = [];

        for (var ri = 0; ri < numRows; ri++) {
            var item = parsed[ri];
            var rowY = padT + ri * (barHeight + barGap);
            var barCy = rowY + barHeight / 2;
            var isHover = (this._hoverIdx === ri);

            // --- Service name ---
            ctx.save();
            ctx.font = '13px ' + fontFamily;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isHover ? '#E8F0FE' : '#C8D6E5';

            var nameText = item.name;
            var measuredNW = ctx.measureText(nameText).width;
            if (measuredNW > namColW - 4) {
                // Truncate with ellipsis
                while (nameText.length > 1 && ctx.measureText(nameText + '…').width > namColW - 4) {
                    nameText = nameText.slice(0, -1);
                }
                nameText = nameText + '…';
            }
            ctx.fillText(nameText, padL, barCy);
            ctx.restore();

            // --- Bar background ---
            var barTotalW = (item.count / maxCount) * barAreaW;
            if (barTotalW < 2) barTotalW = 2;

            // Hover: brighten bar background slightly
            var bgColor = isHover ? withAlpha(barBg, 0.8) : barBg;
            roundRect(ctx, barAreaX, rowY, barAreaW, barHeight, barRadius);
            ctx.fillStyle = bgColor;
            ctx.fill();

            // Determine hover brightness multiplier for fills
            var hoverAlpha = isHover ? 1.0 : 0.85;

            // --- Blocked portion ---
            var passedCount = Math.max(0, item.count - item.blocked);
            var blockedW = item.count > 0 ? (item.blocked / item.count) * barTotalW : barTotalW;
            var passedW = barTotalW - blockedW;

            if (blockedW > 0) {
                if (passedW > 0) {
                    // Clip to blocked portion (left) with flat right edge
                    roundRect(ctx, barAreaX, rowY, blockedW + barRadius, barHeight, barRadius);
                    ctx.save();
                    ctx.clip();
                    roundRect(ctx, barAreaX, rowY, blockedW, barHeight, barRadius);
                    ctx.fillStyle = isHover ? '#1AFFEE' : colorBlocked;
                    ctx.globalAlpha = hoverAlpha;
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                    ctx.restore();
                } else {
                    // Only blocked — full rounded bar
                    roundRect(ctx, barAreaX, rowY, blockedW, barHeight, barRadius);
                    ctx.fillStyle = isHover ? '#1AFFEE' : colorBlocked;
                    ctx.globalAlpha = hoverAlpha;
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            }

            // --- Passed-through portion ---
            if (passedW > 0) {
                var passX = barAreaX + blockedW;
                if (blockedW > 0) {
                    // Clip to passed portion (right) with flat left edge
                    roundRect(ctx, passX - barRadius, rowY, passedW + barRadius, barHeight, barRadius);
                    ctx.save();
                    ctx.clip();
                    roundRect(ctx, passX, rowY, passedW, barHeight, barRadius);
                    ctx.fillStyle = isHover ? '#FFCA4A' : colorPassed;
                    ctx.globalAlpha = hoverAlpha;
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                    ctx.restore();
                } else {
                    roundRect(ctx, passX, rowY, passedW, barHeight, barRadius);
                    ctx.fillStyle = isHover ? '#FFCA4A' : colorPassed;
                    ctx.globalAlpha = hoverAlpha;
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            }

            // Subtle glow on hovered bar
            if (isHover && gi > 0) {
                ctx.save();
                ctx.shadowColor = withAlpha(colorBlocked, 0.35 * gi);
                ctx.shadowBlur = 10 * gi;
                roundRect(ctx, barAreaX, rowY, barTotalW, barHeight, barRadius);
                ctx.fillStyle = 'rgba(0,0,0,0.01)';
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
                ctx.restore();
            }

            // --- Attack count text (right of bar) ---
            var countX = barAreaX + barAreaW + 6;
            ctx.save();
            ctx.font = '12px ' + fontFamily;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#4A5875';
            ctx.fillText(formatNumber(item.count), countX, barCy);
            ctx.restore();

            // --- Success rate badge ---
            if (showRate) {
                var displayRate = item.rateRaw ? item.rateRaw : item.rateVal.toFixed(1) + '%';
                var rateV = item.rateVal;

                var badgeBg, badgeText;
                if (rateV >= rateGood) {
                    badgeBg  = 'rgba(0,229,204,0.12)';
                    badgeText = '#00E5CC';
                } else if (rateV >= rateWarn) {
                    badgeBg  = 'rgba(255,176,32,0.12)';
                    badgeText = '#FFB020';
                } else {
                    badgeBg  = 'rgba(217,70,239,0.12)';
                    badgeText = '#D946EF';
                }

                ctx.save();
                ctx.font = '600 11px ' + fontFamily;
                var rateTextW = ctx.measureText(displayRate).width;
                var bPadX = 8;
                var badgeW = rateTextW + bPadX * 2;
                var badgeH = Math.round(barHeight * 0.7);
                var badgeX = w - padR - badgeW;
                var badgeY = rowY + (barHeight - badgeH) / 2;

                roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 2);
                ctx.fillStyle = badgeBg;
                ctx.fill();

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = badgeText;
                ctx.fillText(displayRate, badgeX + badgeW / 2, badgeY + badgeH / 2);
                ctx.restore();

                // Glow for badge on hover
                if (isHover && gi > 0) {
                    ctx.save();
                    ctx.shadowColor = withAlpha(badgeText, 0.4 * gi);
                    ctx.shadowBlur = 8 * gi;
                    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.01)';
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                    ctx.restore();
                }
            }

            // --- Register hit region (full row) ---
            var tip = '<b style="color:#00E5CC">' + item.name + '</b> &mdash; ' +
                formatNumber(item.count) + ' attacks, ' +
                formatNumber(item.blocked) + ' blocked';
            if (showRate) {
                var dispR = item.rateRaw ? item.rateRaw : item.rateVal.toFixed(1) + '%';
                tip += ' (' + dispR + ')';
            }
            this._hitRegions.push({
                x: 0, y: rowY, w: w, h: barHeight,
                tip: tip
            });
        }

        // Reset shadow state
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    },

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (mx >= r.x && mx <= r.x + r.w &&
                my >= r.y && my <= r.y + r.h) {
                return i;
            }
        }
        return null;
    },

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitTest(mx, my);

        if (hit !== null) {
            var region = this._hitRegions[hit];
            this._tooltip.innerHTML = region.tip;
            this._tooltip.style.display = 'block';

            var tx = mx + 14;
            var ty = my - 10;
            if (tx + 200 > this.el.offsetWidth) tx = mx - 210;
            if (ty < 0) ty = my + 20;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top = ty + 'px';
            this._canvas.style.cursor = 'pointer';

            if (this._hoverIdx !== hit) {
                this._hoverIdx = hit;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
            if (this._hoverIdx !== -1) {
                this._hoverIdx = -1;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
        }
    },

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
