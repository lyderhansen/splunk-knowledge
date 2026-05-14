// SpaceX Mission Control — Burn Tracker
// Landing burn descent visualization — altitude vs velocity trajectory
// with color-coded burn phase segments.
// Tone: Precision / Frontier / Audacious

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// Phase → color key mapping (must be pure strings, no computed props)
var PHASE_COLORS = {
    'Boostback Burn': 'accent',
    'Entry Burn':     'burn',
    'Landing Burn':   'nominal',
    'Coast':          'dim'
};

// Chart margins (in CSS pixels)
var MARGIN_LEFT   = 58;
var MARGIN_RIGHT  = 110; // room for phase labels
var MARGIN_TOP    = 24;
var MARGIN_BOTTOM = 48;

// ── Helper: compute a nice axis step size ──────────────────────────────────

function niceStep(range, targetCount) {
    if (range <= 0) return 1;
    var rough    = range / targetCount;
    var mag      = Math.pow(10, Math.floor(Math.log(rough) / Math.LN10));
    var residual = rough / mag;
    var nice;
    if (residual < 1.5)      nice = 1;
    else if (residual < 3.5) nice = 2;
    else if (residual < 7.5) nice = 5;
    else                     nice = 10;
    return nice * mag;
}

// ── Helper: format a numeric axis value ───────────────────────────────────

function fmtAxisVal(v) {
    var abs = Math.abs(v);
    if (abs >= 1000) return (v / 1000).toFixed(1) + 'k';
    if (abs >= 10)   return Math.round(v).toString();
    if (abs >= 1)    return v.toFixed(1);
    return v.toFixed(2);
}

// ── Helper: resolve a phase to a canvas color ──────────────────────────────

function phaseColor(phase, t, accentHex) {
    if (!phase) return theme.withAlpha(t.text, 0.30);
    if (phase === 'Boostback Burn') return accentHex || t.accent;
    if (phase === 'Entry Burn')     return t.burn;
    if (phase === 'Landing Burn')   return t.nominal;
    if (phase === 'Coast')          return theme.withAlpha(t.text, 0.30);
    return theme.withAlpha(t.text, 0.30);
}

// ── Visualization ──────────────────────────────────────────────────────────

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this._canvas      = null;
        this._tooltip     = null;
        this._lastData    = null;
        this._lastConfig  = null;
        this._lastParsed  = null;
        this._hoverIdx    = -1;
        this._mouseX      = 0;
        this._mouseY      = 0;

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        this._canvas = document.createElement('canvas');
        this._canvas.style.display = 'block';
        this._canvas.style.width   = '100%';
        this._canvas.style.height  = '100%';
        this.el.appendChild(this._canvas);

        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText = [
            'position:absolute',
            'pointer-events:none',
            'display:none',
            'background:rgba(6,9,16,0.93)',
            'border:1px solid rgba(0,136,204,0.40)',
            'color:#E2E8F0',
            'font-family:"JetBrains Mono",monospace',
            'font-size:11px',
            'line-height:1.6',
            'padding:7px 11px',
            'border-radius:2px',
            'white-space:nowrap',
            'z-index:100'
        ].join(';');
        this.el.appendChild(this._tooltip);

        var self = this;
        this._onMouseMove = function(e) { self._handleMouseMove(e); };
        this._onMouseOut  = function()  { self._handleMouseOut();   };

        this._canvas.addEventListener('mousemove', this._onMouseMove);
        this._canvas.addEventListener('mouseout',  this._onMouseOut);
    },

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 50000
        };
    },

    updateView: function(data, config) {
        this._lastConfig = config;
        this._lastParsed = this._parseData(data, config);

        var self = this;
        theme.loadFonts(function() {
            self._draw(self._lastParsed, self._lastConfig, self._hoverIdx);
        });
    },

    reflow: function() {
        if (this._lastParsed) {
            this._draw(this._lastParsed, this._lastConfig, this._hoverIdx);
        }
    },

    destroy: function() {
        if (this._canvas) {
            this._canvas.removeEventListener('mousemove', this._onMouseMove);
            this._canvas.removeEventListener('mouseout',  this._onMouseOut);
        }
    },

    // ── Data parsing ─────────────────────────────────────────────────────────

    _parseData: function(data, config) {
        var ns = theme.getNS(this);

        var altField   = theme.getOption(config, ns, 'altitudeField', 'altitude');
        var velField   = theme.getOption(config, ns, 'velocityField', 'velocity');
        var phaseField = theme.getOption(config, ns, 'phaseField',    'phase');
        var timeField  = theme.getOption(config, ns, 'timeField',     'time');

        var result = {
            hasData: false,
            points:  [],
            altMin:  0,
            altMax:  100,
            velMin:  -3000,
            velMax:  0
        };

        if (!data || !data.rows || data.rows.length === 0) {
            return result;
        }

        var cols = data.fields;

        function colIndex(name) {
            for (var i = 0; i < cols.length; i++) {
                if (cols[i].name === name) return i;
            }
            return -1;
        }

        var ai = colIndex(altField);
        var vi = colIndex(velField);
        var pi = colIndex(phaseField);
        var ti = colIndex(timeField);

        if (ai < 0 || vi < 0) {
            return result;
        }

        var points = [];
        for (var r = 0; r < data.rows.length; r++) {
            var row = data.rows[r];
            var alt = parseFloat(row[ai]);
            var vel = parseFloat(row[vi]);
            if (isNaN(alt) || isNaN(vel)) continue;

            var pt = {
                altitude: alt,
                velocity: vel,
                phase:    (pi >= 0 && row[pi] !== undefined && row[pi] !== null) ? String(row[pi]) : '',
                time:     (ti >= 0 && row[ti] !== undefined && row[ti] !== null) ? String(row[ti]) : ''
            };
            points.push(pt);
        }

        if (points.length === 0) {
            return result;
        }

        // Compute data extents
        var altMin = points[0].altitude;
        var altMax = points[0].altitude;
        var velMin = points[0].velocity;
        var velMax = points[0].velocity;

        for (var i = 1; i < points.length; i++) {
            var p = points[i];
            if (p.altitude < altMin) altMin = p.altitude;
            if (p.altitude > altMax) altMax = p.altitude;
            if (p.velocity < velMin) velMin = p.velocity;
            if (p.velocity > velMax) velMax = p.velocity;
        }

        // Pad extents so points don't clip against axes
        var altPad = Math.max(1,  (altMax - altMin) * 0.08);
        var velPad = Math.max(10, (velMax - velMin) * 0.08);

        // Always include 0 altitude (ground)
        altMin = Math.max(0, altMin - altPad);
        altMax = altMax + altPad;

        // Velocity: allow negative descending values; ensure range includes a small margin past 0
        velMin = velMin - velPad;
        velMax = Math.max(0, velMax + velPad);

        result.hasData = true;
        result.points  = points;
        result.altMin  = altMin;
        result.altMax  = altMax;
        result.velMin  = velMin;
        result.velMax  = velMax;

        return result;
    },

    // ── Rendering ─────────────────────────────────────────────────────────────

    _draw: function(parsed, config, hoverIdx) {
        if (!this._canvas) return;

        var ns  = theme.getNS(this);
        var cfg = config || {};

        var themeMode       = theme.getOption(cfg, ns, 'theme',           'dark');
        var accentHex       = theme.getOption(cfg, ns, 'accentColor',     '#0088CC');
        var gi              = theme.parseNum(theme.getOption(cfg, ns, 'accentIntensity', '50'), 50) / 50;
        this._gi = gi;
        var showGrid        = theme.parseBool(theme.getOption(cfg, ns, 'showGrid',        'true'), true);
        var showPhaseLabels = theme.parseBool(theme.getOption(cfg, ns, 'showPhaseLabels', 'true'), true);

        var t = theme.getTheme(themeMode);

        var canvas = this._canvas;
        var dpr    = window.devicePixelRatio || 1;
        var w      = canvas.offsetWidth;
        var h      = canvas.offsetHeight;
        if (w === 0 || h === 0) return;

        canvas.width  = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);

        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        // Ambient light — subtle top-left glow
        theme.drawAmbientLight(ctx, w, h, accentHex, 0.05 * gi);

        // Plot area bounds
        var px0 = MARGIN_LEFT;
        var px1 = w - MARGIN_RIGHT;
        var py0 = MARGIN_TOP;
        var py1 = h - MARGIN_BOTTOM;
        var pw  = px1 - px0;
        var ph  = py1 - py0;

        if (!parsed || !parsed.hasData) {
            this._drawNoData(ctx, w, h, px0, py0, px1, py1, pw, ph, t, showGrid, accentHex);
            return;
        }

        var altMin   = parsed.altMin;
        var altMax   = parsed.altMax;
        var velMin   = parsed.velMin;
        var velMax   = parsed.velMax;
        var altRange = altMax - altMin;
        var velRange = velMax - velMin;

        // Map data → canvas coords
        // X: velocity (velMin = left, velMax = right)
        // Y: altitude (altMin = bottom, altMax = top)
        function toCanvasX(vel) {
            if (velRange === 0) return px0 + pw / 2;
            return px0 + ((vel - velMin) / velRange) * pw;
        }
        function toCanvasY(alt) {
            if (altRange === 0) return py0 + ph / 2;
            return py1 - ((alt - altMin) / altRange) * ph;
        }

        // ── Grid ───────────────────────────────────────────────────────────
        if (showGrid) {
            this._drawGrid(ctx, px0, py0, px1, py1, pw, ph,
                           altMin, altMax, velMin, velMax,
                           toCanvasX, toCanvasY, t, accentHex);
        }

        // ── Ground line at altitude = 0 ────────────────────────────────────
        var groundY = toCanvasY(0);
        if (groundY >= py0 && groundY <= py1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(px0, groundY);
            ctx.lineTo(px1, groundY);
            ctx.strokeStyle = theme.withAlpha(t.warn, 0.40);
            ctx.lineWidth   = 1;
            ctx.setLineDash([]);
            ctx.stroke();
            ctx.restore();

            // "LANDING ZONE" label
            ctx.save();
            ctx.font         = '600 10px ' + theme.DISPLAY_FONT;
            ctx.textAlign    = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle    = theme.withAlpha(t.warn, 0.30);
            ctx.fillText('LANDING ZONE', px1 - 4, groundY - 3);
            ctx.restore();
        }

        // ── Trajectory polyline (phase-colored segments) ───────────────────
        var points = parsed.points;
        this._drawTrajectory(ctx, points, toCanvasX, toCanvasY, t, accentHex);

        // ── Data point dots ────────────────────────────────────────────────
        this._drawDots(ctx, points, toCanvasX, toCanvasY, t, accentHex, hoverIdx);

        // ── Phase labels along right edge ──────────────────────────────────
        if (showPhaseLabels) {
            this._drawPhaseLabels(ctx, points, toCanvasX, toCanvasY, px1, py0, py1, t, accentHex);
        }

        // ── Axis labels ────────────────────────────────────────────────────
        this._drawAxes(ctx, px0, py0, px1, py1, pw, ph,
                       altMin, altMax, velMin, velMax,
                       toCanvasX, toCanvasY, t);

        // ── Hover crosshair ────────────────────────────────────────────────
        if (hoverIdx >= 0 && hoverIdx < points.length) {
            var hp = points[hoverIdx];
            var hx = toCanvasX(hp.velocity);
            var hy = toCanvasY(hp.altitude);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(hx, py0);
            ctx.lineTo(hx, py1);
            ctx.strokeStyle = theme.withAlpha(accentHex, 0.30);
            ctx.lineWidth   = 1;
            ctx.setLineDash([3, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    },

    _drawGrid: function(ctx, px0, py0, px1, py1, pw, ph,
                        altMin, altMax, velMin, velMax,
                        toCanvasX, toCanvasY, t, accentHex) {
        ctx.save();
        ctx.strokeStyle = t.grid;
        ctx.lineWidth   = 1;
        ctx.setLineDash([3, 6]);

        // Horizontal grid lines (altitude)
        var altStep  = niceStep(altMax - altMin, 5);
        var altStart = Math.ceil(altMin / altStep) * altStep;
        var altCur   = altStart;
        while (altCur <= altMax) {
            var gy = toCanvasY(altCur);
            if (gy >= py0 && gy <= py1) {
                ctx.beginPath();
                ctx.moveTo(px0, gy);
                ctx.lineTo(px1, gy);
                ctx.stroke();
            }
            altCur += altStep;
        }

        // Vertical grid lines (velocity)
        var velStep  = niceStep(velMax - velMin, 5);
        var velStart = Math.ceil(velMin / velStep) * velStep;
        var velCur   = velStart;
        while (velCur <= velMax) {
            var gx = toCanvasX(velCur);
            if (gx >= px0 && gx <= px1) {
                ctx.beginPath();
                ctx.moveTo(gx, py0);
                ctx.lineTo(gx, py1);
                ctx.stroke();
            }
            velCur += velStep;
        }

        ctx.setLineDash([]);
        ctx.restore();
    },

    _drawTrajectory: function(ctx, points, toCanvasX, toCanvasY, t, accentHex) {
        if (points.length < 2) return;

        // Draw segments between consecutive points, colored by source point's phase
        for (var i = 0; i < points.length - 1; i++) {
            var p0 = points[i];
            var p1 = points[i + 1];
            var x0 = toCanvasX(p0.velocity);
            var y0 = toCanvasY(p0.altitude);
            var x1 = toCanvasX(p1.velocity);
            var y1 = toCanvasY(p1.altitude);

            var segColor = phaseColor(p0.phase, t, accentHex);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.strokeStyle = segColor;
            ctx.lineWidth   = 2;
            ctx.lineCap     = 'round';
            ctx.lineJoin    = 'round';
            ctx.stroke();
            ctx.restore();
        }
    },

    _drawDots: function(ctx, points, toCanvasX, toCanvasY, t, accentHex, hoverIdx) {
        var latestIdx = points.length - 1;

        for (var i = 0; i < points.length; i++) {
            var p  = points[i];
            var px = toCanvasX(p.velocity);
            var py = toCanvasY(p.altitude);
            var pc = phaseColor(p.phase, t, accentHex);

            var isLatest = (i === latestIdx);
            var isHover  = (i === hoverIdx);

            if (isLatest) {
                // Glow ring for current/latest point
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, 10, 0, 2 * Math.PI, false);
                ctx.fillStyle   = theme.withAlpha(pc, 0.12);
                ctx.shadowColor = pc;
                ctx.shadowBlur  = 14 * (this._gi || 1);
                ctx.fill();
                ctx.shadowBlur  = 0;
                ctx.restore();

                // Outer ring
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, 7, 0, 2 * Math.PI, false);
                ctx.strokeStyle = theme.withAlpha(pc, 0.55);
                ctx.lineWidth   = 1.5;
                ctx.stroke();
                ctx.restore();

                // Inner filled dot
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, 2 * Math.PI, false);
                ctx.fillStyle   = pc;
                ctx.shadowColor = pc;
                ctx.shadowBlur  = 8 * (this._gi || 1);
                ctx.fill();
                ctx.shadowBlur  = 0;
                ctx.restore();

            } else if (isHover) {
                // Hover highlight dot
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, 2 * Math.PI, false);
                ctx.fillStyle   = pc;
                ctx.shadowColor = pc;
                ctx.shadowBlur  = 10;
                ctx.fill();
                ctx.shadowBlur  = 0;
                ctx.restore();

            } else {
                // Normal small dot
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, 2 * Math.PI, false);
                ctx.fillStyle = theme.withAlpha(pc, 0.70);
                ctx.fill();
                ctx.restore();
            }
        }
    },

    _drawPhaseLabels: function(ctx, points, toCanvasX, toCanvasY,
                               px1, py0, py1, t, accentHex) {
        // Collect unique phases in order of first occurrence
        var seen    = {};
        var phases  = [];
        var phaseYs = {};

        for (var i = 0; i < points.length; i++) {
            var ph = points[i].phase;
            if (!ph) continue;
            if (!seen[ph]) {
                seen[ph]    = true;
                phases.push(ph);
                phaseYs[ph] = toCanvasY(points[i].altitude);
            }
        }

        if (phases.length === 0) return;

        var labelX   = px1 + 10;
        var dotR     = 4;
        var fontSize = 10;

        ctx.save();
        ctx.font         = fontSize + 'px ' + theme.MONO_FONT;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';

        for (var j = 0; j < phases.length; j++) {
            var phase  = phases[j];
            var color  = phaseColor(phase, t, accentHex);
            var labelY = phaseYs[phase];

            // Clamp to plot area
            if (labelY < py0 + 6) labelY = py0 + 6;
            if (labelY > py1 - 6) labelY = py1 - 6;

            // Phase dot
            ctx.beginPath();
            ctx.arc(labelX + dotR, labelY, dotR, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();

            // Phase label text
            ctx.fillStyle = theme.withAlpha(t.text, 0.70);
            ctx.fillText(phase.toUpperCase(), labelX + dotR * 2 + 5, labelY);
        }

        ctx.restore();
    },

    _drawAxes: function(ctx, px0, py0, px1, py1, pw, ph,
                        altMin, altMax, velMin, velMax,
                        toCanvasX, toCanvasY, t) {
        var fontSize = 10;
        ctx.save();
        ctx.font      = fontSize + 'px ' + theme.MONO_FONT;
        ctx.fillStyle = theme.withAlpha(t.text, 0.35);

        // ── Y-axis: altitude labels (left) ────────────────────────────────
        ctx.textAlign    = 'right';
        ctx.textBaseline = 'middle';

        var altStep  = niceStep(altMax - altMin, 5);
        var altStart = Math.ceil(altMin / altStep) * altStep;
        var altCur   = altStart;
        while (altCur <= altMax) {
            var ly = toCanvasY(altCur);
            if (ly >= py0 - 2 && ly <= py1 + 2) {
                ctx.fillText(fmtAxisVal(altCur), px0 - 6, ly);
            }
            altCur += altStep;
        }

        // Y-axis title
        ctx.save();
        ctx.translate(px0 - 44, py0 + ph / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = theme.withAlpha(t.text, 0.28);
        ctx.fillText('ALT (km)', 0, 0);
        ctx.restore();

        // ── X-axis: velocity labels (bottom) ──────────────────────────────
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';

        var velStep  = niceStep(velMax - velMin, 5);
        var velStart = Math.ceil(velMin / velStep) * velStep;
        var velCur   = velStart;
        while (velCur <= velMax) {
            var lx = toCanvasX(velCur);
            if (lx >= px0 - 2 && lx <= px1 + 2) {
                ctx.fillStyle = theme.withAlpha(t.text, 0.35);
                ctx.fillText(fmtAxisVal(velCur), lx, py1 + 6);
            }
            velCur += velStep;
        }

        // X-axis title
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle    = theme.withAlpha(t.text, 0.28);
        ctx.fillText('VEL (m/s)', px0 + pw / 2, py1 + 40);

        ctx.restore();
    },

    _drawNoData: function(ctx, w, h, px0, py0, px1, py1, pw, ph, t, showGrid, accentHex) {
        // Draw empty grid
        if (showGrid) {
            ctx.save();
            ctx.strokeStyle = t.grid;
            ctx.lineWidth   = 1;
            ctx.setLineDash([3, 6]);
            var colCount = 6;
            var rowCount = 5;
            for (var ci = 0; ci <= colCount; ci++) {
                var gx = px0 + (pw / colCount) * ci;
                ctx.beginPath();
                ctx.moveTo(gx, py0);
                ctx.lineTo(gx, py1);
                ctx.stroke();
            }
            for (var ri = 0; ri <= rowCount; ri++) {
                var gy = py0 + (ph / rowCount) * ri;
                ctx.beginPath();
                ctx.moveTo(px0, gy);
                ctx.lineTo(px1, gy);
                ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Axis placeholders
        ctx.save();
        ctx.font         = '10px ' + theme.MONO_FONT;
        ctx.fillStyle    = theme.withAlpha(t.text, 0.20);
        ctx.textAlign    = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('ALT (km)', px0 - 8, py0 + ph / 2);
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('VEL (m/s)', px0 + pw / 2, py1 + 6);
        ctx.restore();

        // "AWAITING TELEMETRY" centered in plot area
        ctx.save();
        ctx.font         = '600 13px ' + theme.DISPLAY_FONT;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = theme.withAlpha(t.text, 0.20);

        // Letter-spaced rendering
        var msg     = 'AWAITING TELEMETRY';
        var cx      = px0 + pw / 2;
        var cy      = py0 + ph / 2;
        var chars   = msg.split('');
        var spacing = 2;
        var totalW  = ctx.measureText(msg).width + spacing * (chars.length - 1);
        var curX    = cx - totalW / 2;
        ctx.textAlign = 'left';
        for (var c = 0; c < chars.length; c++) {
            var cw = ctx.measureText(chars[c]).width;
            ctx.fillText(chars[c], curX, cy);
            curX += cw + spacing;
        }
        ctx.restore();
    },

    // ── Hover / Tooltip ───────────────────────────────────────────────────────

    _handleMouseMove: function(e) {
        if (!this._lastParsed || !this._canvas) return;

        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;

        this._mouseX = mx;
        this._mouseY = my;

        if (!this._lastParsed.hasData) {
            this._tooltip.style.display = 'none';
            return;
        }

        var w   = this._canvas.offsetWidth;
        var h   = this._canvas.offsetHeight;
        var px0 = MARGIN_LEFT;
        var px1 = w - MARGIN_RIGHT;
        var py0 = MARGIN_TOP;
        var py1 = h - MARGIN_BOTTOM;
        var pw  = px1 - px0;
        var ph  = py1 - py0;

        // Only respond within plot area
        if (mx < px0 || mx > px1 || my < py0 || my > py1) {
            this._hoverIdx = -1;
            this._tooltip.style.display = 'none';
            this._draw(this._lastParsed, this._lastConfig, -1);
            return;
        }

        var parsed   = this._lastParsed;
        var points   = parsed.points;
        var velRange = parsed.velMax - parsed.velMin;

        function toCanvasX(vel) {
            if (velRange === 0) return px0 + pw / 2;
            return px0 + ((vel - parsed.velMin) / velRange) * pw;
        }

        // Find nearest point by x-position
        var bestIdx  = -1;
        var bestDist = Infinity;
        for (var i = 0; i < points.length; i++) {
            var cx   = toCanvasX(points[i].velocity);
            var dx   = mx - cx;
            var dist = Math.abs(dx);
            if (dist < bestDist) {
                bestDist = dist;
                bestIdx  = i;
            }
        }

        if (bestIdx >= 0 && bestDist < 40) {
            if (this._hoverIdx !== bestIdx) {
                this._hoverIdx = bestIdx;
                this._draw(this._lastParsed, this._lastConfig, bestIdx);
            }
            this._updateTooltip(points[bestIdx], mx, my);
        } else {
            this._hoverIdx = -1;
            this._tooltip.style.display = 'none';
            this._draw(this._lastParsed, this._lastConfig, -1);
        }
    },

    _handleMouseOut: function() {
        this._hoverIdx = -1;
        this._tooltip.style.display = 'none';
        if (this._lastParsed) {
            this._draw(this._lastParsed, this._lastConfig, -1);
        }
    },

    _updateTooltip: function(pt, mx, my) {
        var lines = [];

        if (pt.phase) {
            lines.push('<span style="color:rgba(226,232,240,0.50);font-size:10px">' + pt.phase.toUpperCase() + '</span>');
        }
        lines.push('<span style="color:#0088CC">ALT</span>  ' + pt.altitude.toFixed(2) + ' km');
        lines.push('<span style="color:#0088CC">VEL</span>  ' + Math.round(pt.velocity) + ' m/s');
        if (pt.time) {
            lines.push('<span style="color:rgba(226,232,240,0.40)">T  ' + pt.time + '</span>');
        }

        this._tooltip.innerHTML = lines.join('<br>');

        var tw = this._tooltip.offsetWidth  || 110;
        var th = this._tooltip.offsetHeight || 72;
        var cw = this.el.offsetWidth;
        var ch = this.el.offsetHeight;

        var tx = mx + 16;
        var ty = my - th / 2;
        if (tx + tw > cw - 4) tx = mx - tw - 16;
        if (ty < 4)            ty = 4;
        if (ty + th > ch - 4)  ty = ch - th - 4;

        this._tooltip.style.left    = tx + 'px';
        this._tooltip.style.top     = ty + 'px';
        this._tooltip.style.display = 'block';
    }

});
