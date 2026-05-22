// @viz-type: grid
var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var SplunkVisualizationUtils = require('api/SplunkVisualizationUtils');
var theme = require('shared/theme');

var escapeHtml = SplunkVisualizationUtils.escapeHtml;

function safeStr(val) {
    return (val != null && val !== '') ? String(val) : '';
}

function safeNum(val, fallback) {
    if (val == null || val === '') return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}

function hexFromSplunk(val, fallback) {
    if (val == null || val === '') return fallback;
    var s = String(val).trim();
    if (s.charAt(0) === '#') return s;
    if (s.indexOf('0x') === 0) return '#' + s.slice(2);
    var n = parseInt(s, 10);
    if (!isNaN(n) && n >= 0) return '#' + ('000000' + n.toString(16)).slice(-6);
    return fallback;
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
    return 'dark';
}

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function prefersReducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
}

function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }

function getSpeedMult(config, ns) {
    var speed = (config && config[ns + '.animationSpeed']) || 'normal';
    if (speed === 'slow') { return 1.5; }
    if (speed === 'fast') { return 0.6; }
    return 1.0;
}

function drawEmptyState(ctx, w, h, t, accent) {
    ctx.save();
    var cx = w / 2;
    var cy = h * 0.38;
    var r = Math.min(w, h) * 0.1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = theme.withAlpha(accent, 0.20);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    var fontSize = Math.max(11, Math.min(16, h * 0.07));
    ctx.font = fontSize + 'px ' + theme.FONTS.ui;
    ctx.fillStyle = theme.withAlpha(t.textFaint, 0.7);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('No data available', cx, cy + r + 10);
    ctx.restore();
}

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
        this.el.classList.add('redbull-sports-viz');
        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'position:absolute;top:0;left:0;';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:5px 10px;' +
            'border-radius:2px;pointer-events:none;white-space:nowrap;z-index:100;font-size:12px;';
        this.el.appendChild(this._tooltip);

        this._lastGoodData = null;
        this._entranceDone = false;
        this._animating = false;
        this._staggerProgress = [];
        this._hoverIdx = -1;
        this._hitRegions = [];
        this._showHoverEffect = true;
        this._currentPage = 0;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self._hoverIdx = -1;
        });
        this._canvas.addEventListener('click', function(e) {
            self._onClick(e);
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
        var result = { colIdx: colIdx, rows: data.rows, fields: data.fields };
        this._lastGoodData = result;
        return result;
    },

    updateView: function(data, config) {
        if (!data) {
            if (this._lastGoodData) data = this._lastGoodData;
            else return;
        }

        var ns = (function(viz) {
            try {
                var i = viz.getPropertyNamespaceInfo();
                return i && i.propertyNamespace ? i.propertyNamespace : '';
            } catch(e) { return ''; }
        })(this);

        function opt(key, fallback) { return getOption(config, ns, key, fallback); }

        var rankField    = opt('rankField', 'rank');
        var nameField    = opt('nameField', 'name');
        var scoreField   = opt('scoreField', 'score');
        var deltaField   = opt('deltaField', 'delta');
        var countryField = opt('countryField', 'country');
        var maxRows      = parseInt(opt('maxRows', '10'), 10);
        if (isNaN(maxRows) || maxRows < 1) maxRows = 10;
        var showMedals   = opt('showMedals', 'true') === 'true';
        var showPagination = opt('showPagination', 'true') === 'true';
        this._clickField = opt('drilldownField', 'name');
        this._showHoverEffect = opt('showHoverEffect', 'true') === 'true';

        var themeMode = opt('themeMode', 'auto');
        var isDark = themeMode === 'auto' ? detectTheme() === 'dark' : themeMode === 'dark';
        var t = theme.getTheme(isDark ? 'dark' : 'light');

        var gi = parseFloat(opt('accentIntensity', '50')) / 100;
        gi = gi < 0 ? 0 : gi;
        var glowScale = isDark ? 1.0 : 0.4;

        var accent = hexFromSplunk(opt('accentColor', ''), t.accent);
        var goldColor   = hexFromSplunk(opt('series1Color', ''), t.s2);
        var silverColor = hexFromSplunk(opt('series2Color', ''), t.s3);
        var bronzeColor = hexFromSplunk(opt('series3Color', ''), t.s1);
        var s4Color     = hexFromSplunk(opt('series4Color', ''), t.s4);
        var s5Color     = hexFromSplunk(opt('series5Color', ''), t.s5);
        var showGlow    = opt('showGlow', 'true') === 'true';

        // Animation — stagger entrance
        if (prefersReducedMotion()) {
            this._entranceDone = true;
            this._staggerProgress = [];
        }
        var showEntrance = opt('showEntrance', 'true') === 'true';
        if (!showEntrance) {
            this._entranceDone = true;
            this._staggerProgress = [];
        }

        var w = this.el.clientWidth || this.el.offsetWidth || 400;
        var h = this.el.clientHeight || this.el.offsetHeight || 400;
        if (w < 10) w = 400;
        if (h < 10) h = 400;

        var dpr = window.devicePixelRatio || 1;
        this._canvas.width = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        this._tooltip.style.background = t.panel;
        this._tooltip.style.color = t.text;
        this._tooltip.style.border = '1px solid ' + t.edge;
        this._tooltip.style.fontFamily = theme.FONTS.ui;

        // Empty state
        if (!data.rows || data.rows.length === 0) {
            drawEmptyState(ctx, w, h, t, accent);
            return;
        }

        var colIdx = data.colIdx;
        var allRows = data.rows;

        // Pagination
        var totalRows = allRows.length;
        var totalPages = Math.max(1, Math.ceil(totalRows / maxRows));
        if (this._currentPage >= totalPages) { this._currentPage = 0; }
        var startIdx = this._currentPage * maxRows;
        var endIdx = Math.min(startIdx + maxRows, totalRows);
        var rows = allRows.slice(startIdx, endIdx);

        if (showEntrance && !this._entranceDone) {
            this._startStaggeredEntrance(rows.length, config, ns);
        }

        // Layout
        var pad = theme.getSpacing(w);
        var footerH = showPagination && totalPages > 1 ? 28 : 0;
        var usableH = h - footerH - pad;
        var rowH = Math.max(22, Math.floor(usableH / rows.length));
        var labelSize = Math.max(10, Math.min(16, rowH * 0.52));
        var scoreSize = Math.max(10, Math.min(16, rowH * 0.52));
        var rankW = Math.max(28, Math.round(w * 0.07));
        var medalR = Math.max(7, Math.round(rowH * 0.28));
        var scoreW = Math.round(w * 0.2);
        var deltaW = Math.round(w * 0.12);
        var countryW = Math.round(w * 0.09);
        var nameW = w - rankW - pad * 3 - scoreW - deltaW - countryW - medalR * 2;

        this._hitRegions = [];
        var staggerProgress = this._staggerProgress;

        for (var ri = 0; ri < rows.length; ri++) {
            var row = rows[ri];
            var rankVal = safeStr(row[colIdx[rankField]]);
            var nameVal = safeStr(row[colIdx[nameField]]);
            var scoreVal = safeNum(row[colIdx[scoreField]], 0);
            var deltaVal = safeStr(row[colIdx[deltaField]]);
            var countryVal = safeStr(row[colIdx[countryField]]);

            var globalRank = startIdx + ri + 1; // actual rank in full dataset
            var isFirst   = globalRank === 1;
            var isSecond  = globalRank === 2;
            var isThird   = globalRank === 3;
            var isPodium  = isFirst || isSecond || isThird;

            var rowColor = isPodium ? (isFirst ? goldColor : isSecond ? silverColor : bronzeColor) : s4Color;

            var ry = ri * rowH + pad / 2;
            var rowAlpha = (staggerProgress.length > ri) ? easeOutQuad(staggerProgress[ri]) : 1;

            ctx.save();
            ctx.globalAlpha = rowAlpha;

            var isHovered = ri === this._hoverIdx;

            // Row background — alternating + hover
            if (isHovered) {
                ctx.fillStyle = theme.withAlpha(accent, 0.12);
                ctx.fillRect(0, ry, w, rowH);
            } else if (ri % 2 === 0 && isDark) {
                ctx.fillStyle = theme.withAlpha(t.panel, 0.3);
                ctx.fillRect(0, ry, w, rowH);
            }

            // Left accent stripe for top 3
            if (isPodium) {
                var stripeGrad = ctx.createLinearGradient(0, ry, 0, ry + rowH);
                stripeGrad.addColorStop(0, theme.withAlpha(rowColor, 0.6));
                stripeGrad.addColorStop(1, theme.withAlpha(rowColor, 0.2));
                ctx.fillStyle = stripeGrad;
                ctx.fillRect(0, ry, 3, rowH);
            }

            var centerY = ry + rowH / 2;
            var cx = pad;

            // Rank / medal indicator
            if (showMedals && isPodium) {
                // Medal circle
                ctx.save();
                if (showGlow && gi > 0 && isFirst) {
                    ctx.shadowColor = theme.withAlpha(rowColor, 0.4 * gi * glowScale);
                    ctx.shadowBlur = 8 * gi * glowScale;
                }
                ctx.beginPath();
                ctx.arc(cx + medalR, centerY, medalR, 0, Math.PI * 2);
                var mGrad = ctx.createRadialGradient(cx + medalR - 2, centerY - 2, 0, cx + medalR, centerY, medalR);
                mGrad.addColorStop(0, theme.withAlpha(rowColor, isDark ? 1 : 0.9));
                mGrad.addColorStop(1, theme.withAlpha(rowColor, isDark ? 0.6 : 0.7));
                ctx.fillStyle = mGrad;
                ctx.fill();
                // Medal rank number
                ctx.font = 'bold ' + Math.round(medalR * 0.9) + 'px ' + theme.FONTS.data;
                ctx.fillStyle = isDark ? '#000000' : '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(globalRank.toString(), cx + medalR, centerY);
                ctx.restore();
                cx += medalR * 2 + pad;
            } else {
                // Plain rank number
                ctx.font = 'bold ' + labelSize + 'px ' + theme.FONTS.data;
                ctx.fillStyle = t.textFaint;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(rankVal || String(globalRank), cx + rankW, centerY);
                cx += rankW + pad;
            }

            // Country code badge (compact)
            if (countryVal) {
                ctx.save();
                ctx.font = Math.max(8, Math.round(labelSize * 0.75)) + 'px ' + theme.FONTS.ui;
                ctx.fillStyle = t.textFaint;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(countryVal.toUpperCase(), cx, centerY);
                ctx.restore();
                cx += countryW;
            }

            // Athlete name
            ctx.font = (isPodium ? 'bold ' : '') + labelSize + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = isDark ? t.text : t.text;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            var dispName = nameVal;
            while (ctx.measureText(dispName).width > nameW && dispName.length > 2) {
                dispName = dispName.slice(0, -1);
            }
            ctx.fillText(dispName, cx, centerY);

            // Score (right-aligned)
            var scoreX = w - scoreW - deltaW - pad;
            ctx.font = 'bold ' + scoreSize + 'px ' + theme.FONTS.data;
            ctx.fillStyle = isPodium ? rowColor : (isDark ? t.text : t.text);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(theme.fmtNum(scoreVal) + ' pts', scoreX + scoreW - pad, centerY);

            // Delta indicator
            if (deltaVal) {
                var deltaNum = parseFloat(deltaVal);
                var isPos = !isNaN(deltaNum) ? deltaNum > 0 : deltaVal.charAt(0) === '+';
                var isNeg = !isNaN(deltaNum) ? deltaNum < 0 : deltaVal.charAt(0) === '-';
                var deltaColor = isPos ? t.success : (isNeg ? t.danger : t.textFaint);
                ctx.font = Math.max(9, Math.round(labelSize * 0.8)) + 'px ' + theme.FONTS.ui;
                ctx.fillStyle = deltaColor;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(deltaVal, w - pad, centerY);
            }

            // Divider line
            if (ri < rows.length - 1) {
                ctx.save();
                ctx.strokeStyle = t.edge;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(0, ry + rowH);
                ctx.lineTo(w, ry + rowH);
                ctx.stroke();
                ctx.restore();
            }

            ctx.restore();

            this._hitRegions.push({
                x: 0, y: ry, w: w, h: rowH,
                name: nameVal, score: scoreVal,
                tip: escapeHtml(nameVal) + ': <b>' + theme.fmtNum(scoreVal) + ' pts</b>'
            });
        }

        // Pagination controls
        if (showPagination && totalPages > 1) {
            var btnY = h - footerH + 2;
            var btnH = footerH - 4;
            ctx.save();
            ctx.font = Math.max(10, Math.round(footerH * 0.45)) + 'px ' + theme.FONTS.ui;
            ctx.fillStyle = t.textDim;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((this._currentPage + 1) + ' / ' + totalPages, w / 2, btnY + btnH / 2);

            if (this._currentPage > 0) {
                ctx.fillStyle = accent;
                ctx.textAlign = 'left';
                ctx.fillText('< Prev', pad * 2, btnY + btnH / 2);
                this._hitRegions.push({ x: 0, y: btnY, w: 80, h: btnH, type: 'prevPage', tip: '' });
            }
            if (this._currentPage < totalPages - 1) {
                ctx.fillStyle = accent;
                ctx.textAlign = 'right';
                ctx.fillText('Next >', w - pad * 2, btnY + btnH / 2);
                this._hitRegions.push({ x: w - 80, y: btnY, w: 80, h: btnH, type: 'nextPage', tip: '' });
            }
            ctx.restore();
        }

        ctx.globalAlpha = 1;
        this._lastRows = rows;
        this._colIdx = colIdx;
        this._nameField = nameField;
    },

    _startStaggeredEntrance: function(rowCount, config, ns) {
        if (this._animating) { return; }
        var animSpeed = opt('animationSpeed', 'normal'); var speedMult = (animSpeed === 'slow') ? 1.5 : (animSpeed === 'fast') ? 0.6 : 1.0;
        var perRowDelay = Math.min(500 / Math.max(rowCount, 1), 80);
        var rowDuration = 200 * speedMult;
        var startTime = null;
        var self = this;
        this._animating = true;
        for (var i = 0; i < rowCount; i++) { self._staggerProgress[i] = 0; }

        function step(timestamp) {
            if (!self._animating) { return; }
            if (!startTime) { startTime = timestamp; }
            var elapsed = timestamp - startTime;
            var allDone = true;
            for (var r = 0; r < rowCount; r++) {
                var rowElapsed = Math.max(0, elapsed - r * perRowDelay);
                var progress = Math.min(rowElapsed / rowDuration, 1);
                self._staggerProgress[r] = progress;
                if (progress < 1) { allDone = false; }
            }
            self.invalidateUpdateView();
            if (!allDone) {
                requestAnimationFrame(step);
            } else {
                self._entranceDone = true;
                self._animating = false;
            }
        }
        requestAnimationFrame(step);
    },

    _onMouseMove: function(e) {
        if (!this._showHoverEffect) { return; }
        var mx = e.offsetX;
        var my = e.offsetY;
        var hit = -1;
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (r.type) continue; // skip pagination controls
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                hit = i;
                break;
            }
        }
        if (hit !== this._hoverIdx) {
            this._hoverIdx = hit;
            this.invalidateUpdateView();
        }
        if (hit >= 0 && this._hitRegions[hit].tip) {
            this._tooltip.innerHTML = this._hitRegions[hit].tip;
            this._tooltip.style.display = 'block';
            var tx = mx + 12;
            var ty = my - 28;
            if (tx + 200 > this.el.offsetWidth) tx = mx - 212;
            if (ty < 0) ty = my + 10;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top = ty + 'px';
            this._canvas.style.cursor = 'pointer';
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
        }
    },

    _onClick: function(e) {
        var mx = e.offsetX;
        var my = e.offsetY;
        // Check pagination first
        for (var pi = 0; pi < this._hitRegions.length; pi++) {
            var pr = this._hitRegions[pi];
            if (!pr.type) continue;
            if (mx >= pr.x && mx <= pr.x + pr.w && my >= pr.y && my <= pr.y + pr.h) {
                if (pr.type === 'prevPage') { this._currentPage--; this.invalidateUpdateView(); return; }
                if (pr.type === 'nextPage') { this._currentPage++; this.invalidateUpdateView(); return; }
            }
        }
        if (!this._clickField) { return; }
        for (var i = 0; i < this._hitRegions.length; i++) {
            var r = this._hitRegions[i];
            if (r.type) continue;
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                var clickedVal = r.name;
                if (!clickedVal) { return; }
                var payload = {};
                payload[this._clickField] = clickedVal;
                try {
                    this.drilldown({
                        action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                        data: payload
                    }, e);
                } catch (ex) {}
                return;
            }
        }
    },

    reflow: function() {
        this.invalidateUpdateView();
    },

    destroy: function() {
        this._animating = false;
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }
});
