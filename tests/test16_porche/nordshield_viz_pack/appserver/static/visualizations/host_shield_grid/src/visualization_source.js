'use strict';

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('theme');

// ---------------------------------------------------------------------------
// Helpers — all ES5, no const/let/arrow/template literals
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

function withAlpha(hex, alpha) {
    if (!hex) return 'rgba(0,0,0,' + alpha + ')';
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

// Draw a rounded rectangle using arc() — no canvas.roundRect (not in ES5)
function roundRect(ctx, x, y, w, h, r) {
    if (r === undefined) r = 0;
    r = Math.min(r, w / 2, h / 2);
    if (r < 0) r = 0;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,     y + h - r, r);
    ctx.lineTo(x,     y + r);
    ctx.arcTo(x,     y,     x + r, y,          r);
    ctx.closePath();
}

// Severity sort weight: lower number = drawn first (top-left)
var SEVERITY_ORDER = {
    'critical': 0,
    'warning':  1,
    'degraded': 2,
    'offline':  3,
    'healthy':  4
};

function severityWeight(status) {
    var s = (status || '').toLowerCase();
    var w = SEVERITY_ORDER[s];
    return (w !== undefined) ? w : 5;
}

// ---------------------------------------------------------------------------
// Viz module
// ---------------------------------------------------------------------------

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;display:block;';
        this.el.appendChild(this._canvas);

        // Tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 10px;' +
            'background:rgba(8,12,24,0.92);color:#C8D6E5;font-size:11px;' +
            'border:1px solid rgba(0,229,204,0.25);border-radius:2px;' +
            'pointer-events:none;white-space:nowrap;z-index:100;' +
            'font-family:"IBM Plex Mono",monospace;line-height:1.5;';
        this.el.appendChild(this._tooltip);

        // Hit regions: array of { x, y, w, h, hostname, os, status, lastSeen }
        this._hitRegions = [];
        this._hoverIdx = -1;

        // Cached data for reflow
        this._lastData   = null;
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
        this._lastData   = data;
        this._lastConfig = config;
        this._render(data, config);
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this._render(this._lastData, this._lastConfig);
        }
    },

    // -----------------------------------------------------------------------
    // Core render
    // -----------------------------------------------------------------------
    _render: function(data, config) {
        var ns = getNS(this);

        // --- Field settings ---
        var hostnameField = getOption(config, ns, 'hostnameField', 'hostname');
        var statusField   = getOption(config, ns, 'statusField',   'status');
        var osField       = getOption(config, ns, 'osField',       'os');
        var lastSeenField = getOption(config, ns, 'lastSeenField', 'last_seen');

        // --- Color settings ---
        var colorHealthy  = getOption(config, ns, 'colorHealthy',  '#00E5CC');
        var colorDegraded = getOption(config, ns, 'colorDegraded', '#38BDF8');
        var colorWarning  = getOption(config, ns, 'colorWarning',  '#FFB020');
        var colorCritical = getOption(config, ns, 'colorCritical', '#FFB020');
        var colorOffline  = getOption(config, ns, 'colorOffline',  '#1E293B');

        // --- Layout settings ---
        var cellGap         = parseInt(getOption(config, ns, 'cellGap',    '3'),  10);
        var cellRadius      = parseInt(getOption(config, ns, 'cellRadius', '2'),  10);
        var sortBySeverity  = parseBool(getOption(config, ns, 'sortBySeverity', 'true'), true);
        var showSummary     = parseBool(getOption(config, ns, 'showSummary',    'true'), true);
        var accentIntensity = parseInt(getOption(config, ns, 'accentIntensity', '50'), 10);

        if (isNaN(cellGap))         cellGap         = 3;
        if (isNaN(cellRadius))      cellRadius      = 2;
        if (isNaN(accentIntensity)) accentIntensity = 50;
        accentIntensity = Math.max(0, Math.min(100, accentIntensity));

        // --- Panel dimensions ---
        var w = this.el.offsetWidth  || 600;
        var h = this.el.offsetHeight || 400;

        // HiDPI scaling
        var dpr = window.devicePixelRatio || 1;
        this._canvas.width  = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width  = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Clear — transparent only
        ctx.clearRect(0, 0, w, h);

        // --- Guard: no data ---
        if (!data || !data.rows || data.rows.length === 0) {
            this._drawNoData(ctx, w, h);
            return;
        }

        var colIdx = data.colIdx || {};
        var rows   = data.rows;
        var hIdx   = (hostnameField in colIdx) ? colIdx[hostnameField] : -1;
        var sIdx   = (statusField   in colIdx) ? colIdx[statusField]   : -1;
        var oIdx   = (osField       in colIdx) ? colIdx[osField]       : -1;
        var lIdx   = (lastSeenField in colIdx) ? colIdx[lastSeenField] : -1;

        // --- Build host array ---
        var hosts = [];
        for (var i = 0; i < rows.length; i++) {
            var row      = rows[i];
            var hostname = (hIdx >= 0) ? (row[hIdx] || 'unknown-' + i) : ('host-' + i);
            var status   = (sIdx >= 0) ? (row[sIdx] || 'healthy')      : 'healthy';
            var os       = (oIdx >= 0) ? (row[oIdx] || '')             : '';
            var lastSeen = (lIdx >= 0) ? (row[lIdx] || '')             : '';
            hosts.push({
                hostname: hostname,
                status:   status,
                os:       os,
                lastSeen: lastSeen
            });
        }

        // --- Sort by severity ---
        if (sortBySeverity) {
            hosts.sort(function(a, b) {
                return severityWeight(a.status) - severityWeight(b.status);
            });
        }

        // --- Count per status ---
        var counts = { healthy: 0, degraded: 0, warning: 0, critical: 0, offline: 0, other: 0 };
        for (var j = 0; j < hosts.length; j++) {
            var st = (hosts[j].status || '').toLowerCase();
            if (counts[st] !== undefined) {
                counts[st]++;
            } else {
                counts.other++;
            }
        }

        // --- Layout geometry ---
        var SUMMARY_H = showSummary ? 28 : 0;
        var padTop    = SUMMARY_H + 4;
        var padLeft   = 4;
        var padRight  = 4;
        var padBottom = 4;

        var gridW = w - padLeft - padRight;
        var gridH = h - padTop  - padBottom;
        var N     = hosts.length;

        // Find optimal cell size: largest square that fits N cells in gridW × gridH
        var cellSize = Math.max(4, Math.floor(Math.sqrt((gridW * gridH) / N)));
        // Refine: iterate a few steps to nail the best fit
        for (var iter = 0; iter < 5; iter++) {
            var cols = Math.max(1, Math.floor((gridW + cellGap) / (cellSize + cellGap)));
            var rowsNeeded = Math.ceil(N / cols);
            var totalH = rowsNeeded * (cellSize + cellGap) - cellGap;
            if (totalH <= gridH) {
                break; // fits — keep this size
            }
            // Doesn't fit vertically — shrink
            cellSize = Math.max(4, cellSize - 1);
        }

        // Final column count and verify
        var numCols    = Math.max(1, Math.floor((gridW + cellGap) / (cellSize + cellGap)));
        var numRows    = Math.ceil(N / numCols);

        // Center the grid
        var totalUsedW = numCols * (cellSize + cellGap) - cellGap;
        var totalUsedH = numRows * (cellSize + cellGap) - cellGap;
        var offsetX    = padLeft  + Math.floor((gridW - totalUsedW) / 2);
        var offsetY    = padTop   + Math.floor((gridH - totalUsedH) / 2);
        if (offsetX < padLeft)  offsetX = padLeft;
        if (offsetY < padTop)   offsetY = padTop;

        // --- Draw summary strip ---
        if (showSummary) {
            this._drawSummary(ctx, counts, colorHealthy, colorDegraded, colorWarning, colorCritical, colorOffline, w, SUMMARY_H);
        }

        // --- Draw cells ---
        this._hitRegions = [];

        var t = theme.getTheme();
        var fontFamily = theme.getFonts().family;

        for (var ci = 0; ci < hosts.length; ci++) {
            var host   = hosts[ci];
            var col    = ci % numCols;
            var rowNum = Math.floor(ci / numCols);

            var cx = offsetX + col * (cellSize + cellGap);
            var cy = offsetY + rowNum * (cellSize + cellGap);

            var stLower   = (host.status || '').toLowerCase();
            var fillColor, fillAlpha, isCritical, isOffline;

            isCritical = (stLower === 'critical');
            isOffline  = (stLower === 'offline');

            if (stLower === 'healthy') {
                fillColor = colorHealthy;
                fillAlpha = 0.50;
            } else if (stLower === 'degraded') {
                fillColor = colorDegraded;
                fillAlpha = 0.80;
            } else if (stLower === 'warning') {
                fillColor = colorWarning;
                fillAlpha = 0.90;
            } else if (isCritical) {
                fillColor = colorCritical;
                fillAlpha = 1.0;
            } else if (isOffline) {
                fillColor = colorOffline;
                fillAlpha = 1.0;
            } else {
                // Unknown status — use muted color
                fillColor = t.textMuted || '#475569';
                fillAlpha = 0.60;
            }

            // Hover brightening
            var isHovered = (this._hoverIdx === ci);
            if (isHovered) {
                fillAlpha = Math.min(1, fillAlpha + 0.25);
            }

            // Glow for critical cells
            if (isCritical && accentIntensity > 0) {
                var glowBlur = Math.round(8 * (accentIntensity / 100));
                ctx.shadowColor  = withAlpha(colorCritical, 0.8);
                ctx.shadowBlur   = glowBlur;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }

            // Draw cell
            roundRect(ctx, cx, cy, cellSize, cellSize, cellRadius);

            if (isOffline) {
                // Offline: dark fill + thin border
                ctx.fillStyle = withAlpha(fillColor, 1.0);
                ctx.fill();
                ctx.strokeStyle = '#475569';
                ctx.lineWidth   = 1;
                ctx.stroke();
            } else {
                ctx.fillStyle = withAlpha(fillColor, fillAlpha);
                ctx.fill();
            }

            // Reset shadow after critical cells
            if (isCritical && accentIntensity > 0) {
                ctx.shadowBlur    = 0;
                ctx.shadowColor   = 'transparent';
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }

            // Hover highlight ring
            if (isHovered) {
                ctx.strokeStyle = withAlpha(fillColor, 0.9);
                ctx.lineWidth   = 1.5;
                roundRect(ctx, cx + 0.75, cy + 0.75, cellSize - 1.5, cellSize - 1.5, Math.max(0, cellRadius - 1));
                ctx.stroke();
            }

            // Register hit region
            this._hitRegions.push({
                x:        cx,
                y:        cy,
                w:        cellSize,
                h:        cellSize,
                hostname: host.hostname,
                status:   host.status,
                os:       host.os,
                lastSeen: host.lastSeen
            });
        }
    },

    // -----------------------------------------------------------------------
    // Summary strip — "142 Healthy · 5 Warning · 2 Critical · 1 Offline"
    // -----------------------------------------------------------------------
    _drawSummary: function(ctx, counts, colorHealthy, colorDegraded, colorWarning, colorCritical, colorOffline, w, stripH) {
        var fontFamily = '"IBM Plex Mono",monospace';
        var fontSize   = 11;
        ctx.font = fontSize + 'px ' + fontFamily;
        ctx.textBaseline = 'middle';

        var parts = [];
        if (counts.critical > 0) {
            parts.push({ label: counts.critical + ' Critical', color: colorCritical });
        }
        if (counts.warning > 0) {
            parts.push({ label: counts.warning  + ' Warning',  color: colorWarning  });
        }
        if (counts.degraded > 0) {
            parts.push({ label: counts.degraded + ' Degraded', color: colorDegraded });
        }
        if (counts.offline > 0) {
            parts.push({ label: counts.offline  + ' Offline',  color: '#94A3B8'     });
        }
        if (counts.healthy > 0) {
            parts.push({ label: counts.healthy  + ' Healthy',  color: colorHealthy  });
        }
        if (counts.other > 0) {
            parts.push({ label: counts.other    + ' Other',    color: '#64748B'     });
        }

        if (parts.length === 0) return;

        // Measure total width to center
        var DOT_W  = ctx.measureText(' · ').width;
        var totalW = 0;
        for (var i = 0; i < parts.length; i++) {
            totalW += ctx.measureText(parts[i].label).width;
            if (i < parts.length - 1) totalW += DOT_W;
        }

        var startX = Math.max(4, Math.floor((w - totalW) / 2));
        var midY   = Math.floor(stripH / 2);
        var curX   = startX;

        for (var j = 0; j < parts.length; j++) {
            var part = parts[j];
            ctx.fillStyle = part.color;
            ctx.fillText(part.label, curX, midY);
            curX += ctx.measureText(part.label).width;

            if (j < parts.length - 1) {
                ctx.fillStyle = 'rgba(71, 85, 105, 0.7)';
                ctx.fillText(' · ', curX, midY);
                curX += DOT_W;
            }
        }
    },

    // -----------------------------------------------------------------------
    // No-data state
    // -----------------------------------------------------------------------
    _drawNoData: function(ctx, w, h) {
        ctx.font = '12px "IBM Plex Mono",monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = 'rgba(71, 85, 105, 0.7)';
        ctx.fillText('No host data', w / 2, h / 2);
    },

    // -----------------------------------------------------------------------
    // Mouse interaction
    // -----------------------------------------------------------------------
    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;
        var hit  = this._hitTest(mx, my);

        if (hit !== null) {
            var region   = this._hitRegions[hit];
            var stLower  = (region.status || '').toLowerCase();
            var stLabel  = stLower.charAt(0).toUpperCase() + stLower.slice(1);
            var tipLines = '<b style="color:#E8F0FE">' + region.hostname + '</b>';
            if (region.os) {
                tipLines += ' <span style="color:#64748B">|</span> ' +
                            '<span style="color:#94A3B8">' + region.os + '</span>';
            }
            tipLines += '<br>' +
                        '<span style="color:#64748B">Status:</span> ' + stLabel;
            if (region.lastSeen) {
                tipLines += ' <span style="color:#64748B">|</span> ' +
                            '<span style="color:#64748B">Last seen:</span> ' + region.lastSeen;
            }
            this._tooltip.innerHTML = tipLines;
            this._tooltip.style.display = 'block';

            var tx = mx + 14;
            var ty = my - 10;
            if (tx + 220 > this.el.offsetWidth)  tx = mx - 224;
            if (ty < 0)                           ty = my + 20;
            if (ty + 50 > this.el.offsetHeight)   ty = this.el.offsetHeight - 54;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top  = ty + 'px';
            this._canvas.style.cursor = 'pointer';

            if (this._hoverIdx !== hit) {
                this._hoverIdx = hit;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor   = 'default';
            if (this._hoverIdx !== -1) {
                this._hoverIdx = -1;
                if (this._lastData && this._lastConfig) {
                    this._render(this._lastData, this._lastConfig);
                }
            }
        }
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

    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------
    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
