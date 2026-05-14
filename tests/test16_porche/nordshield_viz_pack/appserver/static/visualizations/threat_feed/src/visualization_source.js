'use strict';

// threat_feed — NordShield Arctic Power
// Real-time vertical scrolling alert ticker (SOC heartbeat)
// ES5 only: no const/let/=>/`/destructuring/class/for-of

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');

// ─── helpers ────────────────────────────────────────────────────────────────

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

function formatTimeAgo(ts) {
    // ts: ISO string or epoch (seconds or ms)
    var ms;
    if (typeof ts === 'string') {
        // try numeric first
        var n = parseFloat(ts);
        if (!isNaN(n)) {
            ms = n < 1e10 ? n * 1000 : n; // seconds vs ms
        } else {
            ms = Date.parse(ts);
        }
    } else if (typeof ts === 'number') {
        ms = ts < 1e10 ? ts * 1000 : ts;
    } else {
        return '?';
    }
    if (isNaN(ms)) return '?';
    var diff = Math.max(0, Date.now() - ms);
    var sec = Math.floor(diff / 1000);
    if (sec < 60) return sec + 's ago';
    var min = Math.floor(sec / 60);
    if (min < 60) return min + 'm ago';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + 'h ago';
    var days = Math.floor(hr / 24);
    return days + 'd ago';
}

function hexToRgba(hex, alpha) {
    var h = hex.replace('#', '');
    if (h.length === 3) { h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]; }
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

// ─── module ─────────────────────────────────────────────────────────────────

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // canvas
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;display:block;';
        this.el.appendChild(this._canvas);
        this._ctx = this._canvas.getContext('2d');

        // tooltip
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:7px 12px;' +
            'background:rgba(8,12,24,0.95);color:#C8D6E5;font-size:11px;' +
            'border:1px solid rgba(0,229,204,0.2);border-radius:2px;' +
            'pointer-events:none;white-space:nowrap;z-index:100;' +
            'font-family:"IBM Plex Mono",monospace;line-height:1.6;';
        this.el.appendChild(this._tooltip);

        // state
        this._entries = [];
        this._scrollOffset = 0;
        this._isHovered = false;
        this._lastFrameTime = null;
        this._rafId = null;
        this._lastData = null;
        this._lastConfig = null;
        this._fontReady = false;
        this._fontPending = false;
        this._hoveredIdx = -1;

        var self = this;

        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._isHovered = false;
            self._hoveredIdx = -1;
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
        });
        this._canvas.addEventListener('mouseenter', function() {
            self._isHovered = true;
        });

        // Splunk "no results" placeholder suppressor
        this._observer = new MutationObserver(function() {
            var sels = [
                '.viz-placeholder', '.shared-viz-no-results',
                '[data-test="viz-no-results"]', '.viz-controller-no-results'
            ];
            for (var s = 0; s < sels.length; s++) {
                var nodes = self.el.querySelectorAll(sels[s]);
                for (var n = 0; n < nodes.length; n++) {
                    nodes[n].style.display = 'none';
                }
            }
        });
        this._observer.observe(this.el, { childList: true, subtree: true });

        this._loadFont();
    },

    // ── font loading ─────────────────────────────────────────────────────────

    _loadFont: function() {
        var self = this;
        if (this._fontReady) return;
        if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) {
            setTimeout(function() { self._fontReady = true; }, 200);
            return;
        }
        if (!this._fontPending) {
            this._fontPending = true;
            document.fonts.load('400 13px "IBM Plex Mono"').then(function() {
                self._fontReady = true;
            });
        }
        var attempts = 0;
        var poll = function() {
            attempts++;
            if (self._fontReady || attempts > 30) {
                self._fontReady = true;
                return;
            }
            setTimeout(poll, 100);
        };
        poll();
    },

    // ── Splunk lifecycle ─────────────────────────────────────────────────────

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
        this._lastData = data;
        this._lastConfig = config;

        if (!data || !data.rows || data.rows.length === 0) {
            this._entries = [];
            this._startAnimLoop();
            return;
        }

        var ns = getNS(this);
        var timeField     = getOption(config, ns, 'timeField',     '_time');
        var nameField     = getOption(config, ns, 'nameField',     'alert_name');
        var severityField = getOption(config, ns, 'severityField', 'severity');
        var analystField  = getOption(config, ns, 'analystField',  'analyst_assigned');
        var maxVisible    = parseInt(getOption(config, ns, 'maxVisible', '50'), 10);
        if (isNaN(maxVisible) || maxVisible < 1) maxVisible = 50;

        var colIdx = data.colIdx;
        var rows = data.rows;

        // build entry list — newest first (data should already be sorted -_time)
        var newEntries = [];
        var limit = Math.min(rows.length, maxVisible);
        for (var i = 0; i < limit; i++) {
            var row = rows[i];
            var timeVal     = colIdx[timeField]     !== undefined ? row[colIdx[timeField]]     : '';
            var nameVal     = colIdx[nameField]     !== undefined ? row[colIdx[nameField]]     : 'Unknown Alert';
            var severityVal = colIdx[severityField] !== undefined ? row[colIdx[severityField]] : 'low';
            var analystVal  = colIdx[analystField]  !== undefined ? row[colIdx[analystField]]  : '';

            newEntries.push({
                timeRaw:  timeVal,
                timeAgo:  formatTimeAgo(timeVal),
                name:     String(nameVal || 'Unknown Alert'),
                severity: String(severityVal || 'low').toLowerCase(),
                analyst:  String(analystVal || ''),
                // store full data for tooltip
                _row: row,
                _fields: data.fields
            });
        }
        this._entries = newEntries;

        // reset scroll so new data starts from top
        this._scrollOffset = 0;
        this._startAnimLoop();
    },

    reflow: function() {
        if (this._lastData && this._lastConfig) {
            this.updateView(this._lastData, this._lastConfig);
        }
    },

    destroy: function() {
        this._stopAnimLoop();
        if (this._observer) this._observer.disconnect();
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    },

    // ── animation loop ───────────────────────────────────────────────────────

    _startAnimLoop: function() {
        var self = this;
        if (this._rafId) return; // already running
        var loop = function(ts) {
            self._tick(ts);
            self._rafId = requestAnimationFrame(loop);
        };
        this._rafId = requestAnimationFrame(loop);
    },

    _stopAnimLoop: function() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this._lastFrameTime = null;
    },

    _tick: function(ts) {
        if (!this._lastFrameTime) this._lastFrameTime = ts;
        var dt = (ts - this._lastFrameTime) / 1000; // seconds
        this._lastFrameTime = ts;

        if (!this._isHovered && this._entries.length > 0) {
            var config = this._lastConfig || {};
            var ns = getNS(this);
            var speed = parseFloat(getOption(config, ns, 'scrollSpeed', '30'));
            if (isNaN(speed) || speed <= 0) speed = 30;

            var rowH = this._currentRowH || 36;
            var totalContentH = this._entries.length * rowH;
            var panelH = this.el.offsetHeight || 300;

            if (totalContentH > panelH) {
                this._scrollOffset += speed * dt;
                // loop when the last entry scrolls fully off top
                if (this._scrollOffset >= totalContentH) {
                    this._scrollOffset = 0;
                }
            }
        }

        this._render();
    },

    // ── rendering ────────────────────────────────────────────────────────────

    _render: function() {
        var canvas = this._canvas;
        var w = this.el.offsetWidth;
        var h = this.el.offsetHeight;
        if (!w || !h) return;

        // HiDPI — resize and re-scale context on dimension change
        var dpr = window.devicePixelRatio || 1;
        var targetW = Math.round(w * dpr);
        var targetH = Math.round(h * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width  = targetW;
            canvas.height = targetH;
            canvas.style.width  = w + 'px';
            canvas.style.height = h + 'px';
            // re-obtain context to reset transform state, then scale
            this._ctx = canvas.getContext('2d');
            this._ctx.scale(dpr, dpr);
        }
        var ctx = this._ctx;

        ctx.clearRect(0, 0, w, h);

        var config = this._lastConfig || {};
        var ns = getNS(this);

        // colors from config (with defaults matching formatter)
        var colCritical = getOption(config, ns, 'colorCritical', '#FFB020');
        var colHigh     = getOption(config, ns, 'colorHigh',     '#D946EF');
        var colMedium   = getOption(config, ns, 'colorMedium',   '#38BDF8');
        var colLow      = getOption(config, ns, 'colorLow',      '#475569');
        var showAnalyst = getOption(config, ns, 'showAnalyst',   'true') !== 'false';

        var accentRaw = parseFloat(getOption(config, ns, 'accentIntensity', '50'));
        var accentMult = Math.max(0, Math.min(100, isNaN(accentRaw) ? 50 : accentRaw)) / 50;

        // layout
        var headerH = 28;
        var pad = 12;
        var barW = 3;
        var barGap = 8;

        // scale row height to panel: target 36px but adapt to count & space
        var availH = h - headerH - pad;
        var entryCount = this._entries.length || 1;
        var rowH = Math.max(28, Math.min(44, Math.floor(availH / Math.min(entryCount, 10))));
        // clamp to design target
        rowH = Math.min(rowH, 40);
        this._currentRowH = rowH;

        // fonts
        var fontFamily = '"IBM Plex Mono", "SFMono-Regular", Consolas, monospace';
        var timeFontSize  = Math.max(10, Math.round(rowH * 0.32));
        var nameFontSize  = Math.max(11, Math.round(rowH * 0.36));
        var labelFontSize = 10;

        // ── section header ──────────────────────────────────────────────────
        ctx.save();
        ctx.font = '500 ' + labelFontSize + 'px ' + fontFamily;
        ctx.letterSpacing = '0.15em';
        ctx.fillStyle = 'rgba(200, 214, 229, 0.35)';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText('LIVE THREAT FEED', pad + barW + barGap, headerH / 2);
        ctx.restore();

        // ── accent line under header ────────────────────────────────────────
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 229, 204, ' + (0.12 * accentMult) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, headerH - 0.5);
        ctx.lineTo(w, headerH - 0.5);
        ctx.stroke();
        ctx.restore();

        // ── entries ─────────────────────────────────────────────────────────
        if (!this._entries.length) {
            ctx.save();
            ctx.font = '400 ' + nameFontSize + 'px ' + fontFamily;
            ctx.fillStyle = 'rgba(74, 88, 117, 0.6)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Awaiting threat data...', w / 2, headerH + availH / 2);
            ctx.restore();
            return;
        }

        // clipping region for entries area
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, headerH, w, h - headerH);
        ctx.clip();

        var totalContentH = this._entries.length * rowH;
        var scrollOff = this._scrollOffset;

        // analyst column width — measure "ANALYST" header approximate
        var analystW = showAnalyst ? Math.round(w * 0.18) : 0;
        var timeW = Math.round(w * 0.14);
        // min widths
        if (analystW < 80 && showAnalyst) analystW = 80;
        if (timeW < 60) timeW = 60;

        for (var i = 0; i < this._entries.length; i++) {
            var entry = this._entries[i];
            var yTop = headerH + (i * rowH) - scrollOff;

            // virtual scroll — skip off-screen rows
            if (yTop + rowH < headerH) continue;
            if (yTop > h) break;

            var isHovered = (i === this._hoveredIdx);

            // row background
            var drawRowBg = false;
            if (isHovered) {
                ctx.fillStyle = 'rgba(0, 229, 204, 0.08)';
                drawRowBg = true;
            } else if (i % 2 === 1) {
                ctx.fillStyle = 'rgba(0, 229, 204, 0.02)';
                drawRowBg = true;
            }
            if (drawRowBg) {
                ctx.fillRect(0, yTop, w, rowH);
            }

            // severity color
            var sevColor = this._getSeverityColor(entry.severity, colCritical, colHigh, colMedium, colLow);

            // left severity bar — glow effect on hover
            ctx.save();
            if (isHovered) {
                ctx.shadowColor = hexToRgba(sevColor, 0.7 * accentMult);
                ctx.shadowBlur = 8 * accentMult;
            }
            ctx.fillStyle = sevColor;
            ctx.fillRect(0, yTop + 2, barW, rowH - 4);
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.restore();

            var xContent = barW + barGap + pad;
            var yCenterRow = yTop + rowH / 2;

            // time ago
            ctx.save();
            ctx.font = '400 ' + timeFontSize + 'px ' + fontFamily;
            ctx.fillStyle = '#4A5875';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(entry.timeAgo, xContent, yCenterRow);
            ctx.restore();

            // alert name — truncate if needed
            var nameX = xContent + timeW;
            var nameMaxW = w - nameX - analystW - pad;
            ctx.save();
            ctx.font = '400 ' + nameFontSize + 'px ' + fontFamily;
            ctx.fillStyle = isHovered ? '#E8F0FE' : '#C8D6E5';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            var nameText = this._truncateText(ctx, entry.name, nameMaxW);
            ctx.fillText(nameText, nameX, yCenterRow);
            ctx.restore();

            // analyst (right-aligned)
            if (showAnalyst && entry.analyst) {
                ctx.save();
                ctx.font = '400 ' + timeFontSize + 'px ' + fontFamily;
                ctx.fillStyle = '#4A5875';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'right';
                var analystText = this._truncateText(ctx, entry.analyst, analystW - 4);
                ctx.fillText(analystText, w - pad, yCenterRow);
                ctx.restore();
            }

            // row divider
            ctx.save();
            ctx.strokeStyle = 'rgba(74, 88, 117, 0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(barW + barGap, yTop + rowH - 0.5);
            ctx.lineTo(w, yTop + rowH - 0.5);
            ctx.stroke();
            ctx.restore();
        }

        // gradient fade at bottom
        var fadeH = Math.min(48, h * 0.12);
        var fadeGrad = ctx.createLinearGradient(0, h - fadeH, 0, h);
        fadeGrad.addColorStop(0, 'rgba(8,12,24,0)');
        fadeGrad.addColorStop(1, 'rgba(8,12,24,0.7)');
        ctx.fillStyle = fadeGrad;
        ctx.fillRect(0, h - fadeH, w, fadeH);

        ctx.restore(); // pop clip
    },

    _getSeverityColor: function(sev, cCritical, cHigh, cMedium, cLow) {
        var s = (sev || '').toLowerCase();
        if (s === 'critical') return cCritical || '#FFB020';
        if (s === 'high')     return cHigh     || '#D946EF';
        if (s === 'medium')   return cMedium   || '#38BDF8';
        if (s === 'low')      return cLow      || '#475569';
        return cLow || '#475569';
    },

    _truncateText: function(ctx, text, maxW) {
        if (!text) return '';
        if (ctx.measureText(text).width <= maxW) return text;
        var truncated = text;
        while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxW) {
            truncated = truncated.slice(0, -1);
        }
        return truncated + '…';
    },

    // ── mouse interaction ────────────────────────────────────────────────────

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        var headerH = 28;
        if (my < headerH) {
            this._hoveredIdx = -1;
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
            return;
        }

        var rowH = this._currentRowH || 36;
        var relY = my - headerH + this._scrollOffset;
        var idx = Math.floor(relY / rowH);

        if (idx < 0 || idx >= this._entries.length) {
            this._hoveredIdx = -1;
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
            return;
        }

        this._hoveredIdx = idx;
        this._canvas.style.cursor = 'pointer';

        var entry = this._entries[idx];
        var lines = [];
        lines.push(entry.severity.toUpperCase() + ' — ' + entry.name);
        lines.push('Time: ' + entry.timeAgo);
        if (entry.analyst) lines.push('Analyst: ' + entry.analyst);
        this._tooltip.innerHTML = lines.join('<br>');
        this._tooltip.style.display = 'block';

        var tx = mx + 14;
        var ty = my - 8;
        var tw = this._tooltip.offsetWidth || 200;
        var th = this._tooltip.offsetHeight || 60;
        var cw = this.el.offsetWidth;
        var ch = this.el.offsetHeight;
        if (tx + tw > cw - 8) tx = mx - tw - 14;
        if (ty + th > ch - 8) ty = ch - th - 8;
        this._tooltip.style.left = tx + 'px';
        this._tooltip.style.top  = ty + 'px';
    }

});
