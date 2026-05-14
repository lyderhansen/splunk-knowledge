// SpaceX Mission Control — Stage Tracker
// Horizontal mission timeline with diamond nodes, connection lines,
// and an animated pulse ring on the active stage.

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// ---------------------------------------------------------------------------
// No-data placeholder stages
// ---------------------------------------------------------------------------
var PLACEHOLDER_STAGES = [
    { stage: '—', status: 'pending', order: 1 },
    { stage: '—', status: 'pending', order: 2 },
    { stage: '—', status: 'pending', order: 3 },
    { stage: '—', status: 'pending', order: 4 },
    { stage: '—', status: 'pending', order: 5 }
];

// ---------------------------------------------------------------------------
// Visualization definition
// ---------------------------------------------------------------------------
module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        // Canvas + HiDPI setup
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = 'display:block;width:100%;height:100%;';
        this.el.appendChild(this.canvas);

        // Tooltip DOM element
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 12px;' +
            'background:rgba(0,0,0,0.92);color:#E2E8F0;font-size:11px;' +
            'border-radius:3px;pointer-events:none;white-space:nowrap;' +
            'z-index:100;font-family:"Chakra Petch",sans-serif;letter-spacing:0.05em;' +
            'border:1px solid rgba(0,136,204,0.35);' +
            'box-shadow:0 4px 16px rgba(0,0,0,0.6);';
        this.el.style.position = 'relative';
        this.el.appendChild(this._tooltip);

        // Hit regions for hover
        this._hitRegions = [];
        this._hoverIdx = -1;

        // Animation state
        this._animTimer = null;
        this._pulsePhase = 0;

        // Last render data cache
        this._lastData = null;
        this._lastConfig = null;

        var self = this;
        this.canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this.canvas.addEventListener('mouseleave', function() {
            self._tooltip.style.display = 'none';
            self.canvas.style.cursor = 'default';
            if (self._hoverIdx !== -1) {
                self._hoverIdx = -1;
                self._render(self._lastData, self._lastConfig);
            }
        });
    },

    // -------------------------------------------------------------------------
    // Data contract
    // -------------------------------------------------------------------------
    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------
    updateView: function(data, config) {
        this._lastConfig = config;
        this._lastData = data;

        var ns = theme.getNS(this);
        var showPulse = theme.parseBool(
            theme.getOption(config, ns, 'showPulse', 'true'), true
        );
        var hasActive = this._dataHasActive(data, config);

        // Manage pulse animation timer
        if (showPulse && hasActive) {
            if (!this._animTimer) {
                var self = this;
                this._animTimer = setInterval(function() {
                    self._pulsePhase = (self._pulsePhase + 0.07) % (Math.PI * 2);
                    self._render(self._lastData, self._lastConfig);
                }, 33);
            }
        } else {
            if (this._animTimer) {
                clearInterval(this._animTimer);
                this._animTimer = null;
            }
            this._pulsePhase = 0;
        }

        var self = this;
        theme.loadFonts(function() {
            self._render(data, config);
        });
    },

    // -------------------------------------------------------------------------
    // Check if any row has status === 'active'
    // -------------------------------------------------------------------------
    _dataHasActive: function(data, config) {
        if (!data || !data.fields || !data.rows || data.rows.length === 0) {
            return false;
        }
        var ns = theme.getNS(this);
        var statusField = theme.getOption(config, ns, 'statusField', 'status');
        var statusIdx = -1;
        for (var i = 0; i < data.fields.length; i++) {
            if (data.fields[i].name === statusField) { statusIdx = i; break; }
        }
        if (statusIdx === -1) return false;
        for (var r = 0; r < data.rows.length; r++) {
            if ((data.rows[r][statusIdx] || '').toLowerCase() === 'active') return true;
        }
        return false;
    },

    // -------------------------------------------------------------------------
    // Parse rows into stage objects
    // -------------------------------------------------------------------------
    _parseStages: function(data, config) {
        var ns = theme.getNS(this);
        var stageField  = theme.getOption(config, ns, 'stageField',  'stage');
        var statusField = theme.getOption(config, ns, 'statusField', 'status');
        var orderField  = theme.getOption(config, ns, 'orderField',  'order');

        if (!data || !data.fields || !data.rows || data.rows.length === 0) {
            return PLACEHOLDER_STAGES.slice();
        }

        var stageIdx  = -1;
        var statusIdx = -1;
        var orderIdx  = -1;
        for (var i = 0; i < data.fields.length; i++) {
            var fname = data.fields[i].name;
            if (fname === stageField)  stageIdx  = i;
            if (fname === statusField) statusIdx = i;
            if (fname === orderField)  orderIdx  = i;
        }

        var stages = [];
        for (var r = 0; r < data.rows.length; r++) {
            var row = data.rows[r];
            var stageName  = stageIdx  >= 0 ? (row[stageIdx]  || '—') : '—';
            var statusVal  = statusIdx >= 0 ? (row[statusIdx] || 'pending').toLowerCase() : 'pending';
            var orderVal   = orderIdx  >= 0 ? parseFloat(row[orderIdx]) : r;
            if (isNaN(orderVal)) orderVal = r;
            stages.push({ stage: stageName, status: statusVal, order: orderVal });
        }

        // Sort by order
        stages.sort(function(a, b) { return a.order - b.order; });
        return stages;
    },

    // -------------------------------------------------------------------------
    // Main render
    // -------------------------------------------------------------------------
    _render: function(data, config) {
        if (!config) return;
        var ns = theme.getNS(this);

        // Config values
        var themeMode    = theme.getOption(config, ns, 'theme',         'dark');
        var accentColor  = theme.getOption(config, ns, 'accentColor',   '#0088CC');
        var gi = theme.parseNum(theme.getOption(config, ns, 'accentIntensity', '50'), 50) / 50;
        var completeColor = theme.getOption(config, ns, 'completeColor', '#00C853');
        var failColor    = theme.getOption(config, ns, 'failColor',     '#FF1744');

        var t = theme.getTheme(themeMode);

        // Canvas sizing with HiDPI
        var dpr = window.devicePixelRatio || 1;
        var cssW = this.el.offsetWidth  || 400;
        var cssH = this.el.offsetHeight || 80;
        if (cssW < 1 || cssH < 1) return;

        this.canvas.width  = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);

        var ctx = this.canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        var w = cssW;
        var h = cssH;

        ctx.clearRect(0, 0, w, h);

        // Parse stages
        var stages = this._parseStages(data, config);
        if (!stages || stages.length === 0) return;

        var n = stages.length;

        // Layout constants
        var padX       = Math.max(24, w * 0.06);
        var nodeY      = h * 0.42;                  // vertical center of nodes
        var labelY     = nodeY + 22;                // label baseline below node
        var trackY     = nodeY;
        var nodeSize   = 10;                        // half-diagonal of diamond
        var activeExtra = 4;                        // extra size for active node
        var hitRadius  = 18;                        // circular hit zone radius

        // Distribute nodes evenly
        var usableW = w - padX * 2;
        var nodeXs = [];
        for (var i = 0; i < n; i++) {
            nodeXs.push(padX + (n === 1 ? usableW / 2 : (usableW / (n - 1)) * i));
        }

        // Hit regions reset
        this._hitRegions = [];

        // ----------------------------------------------------------------
        // Draw baseline track
        // ----------------------------------------------------------------
        ctx.save();
        ctx.strokeStyle = theme.withAlpha(t.text, 0.06);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padX, trackY);
        ctx.lineTo(w - padX, trackY);
        ctx.stroke();
        ctx.restore();

        // ----------------------------------------------------------------
        // Draw connection lines (between adjacent nodes)
        // ----------------------------------------------------------------
        for (var ci = 0; ci < n - 1; ci++) {
            var fromStage = stages[ci];
            var lineColor;
            if (fromStage.status === 'complete') {
                lineColor = completeColor;
            } else if (fromStage.status === 'active') {
                lineColor = accentColor;
            } else if (fromStage.status === 'failed') {
                lineColor = failColor;
            } else {
                lineColor = theme.withAlpha(t.text, 0.15);
            }

            ctx.save();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            // For complete lines, add a subtle glow
            if (fromStage.status === 'complete') {
                ctx.shadowColor = theme.withAlpha(completeColor, 0.4);
                ctx.shadowBlur = 4 * gi;
            } else if (fromStage.status === 'active') {
                ctx.shadowColor = theme.withAlpha(accentColor, 0.5);
                ctx.shadowBlur = 6 * gi;
            } else {
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
            }
            ctx.beginPath();
            ctx.moveTo(nodeXs[ci],     trackY);
            ctx.lineTo(nodeXs[ci + 1], trackY);
            ctx.stroke();
            // Reset shadow
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.restore();
        }

        // ----------------------------------------------------------------
        // Draw pulse ring for active node (behind the node itself)
        // ----------------------------------------------------------------
        for (var pi = 0; pi < n; pi++) {
            if (stages[pi].status !== 'active') continue;
            var px = nodeXs[pi];
            var pulseProgress = (Math.sin(this._pulsePhase) + 1) / 2; // 0..1
            var pulseR = nodeSize + activeExtra + pulseProgress * 20;
            var pulseAlpha = 0.3 * (1 - pulseProgress);

            ctx.save();
            ctx.beginPath();
            ctx.arc(px, nodeY, pulseR, 0, Math.PI * 2);
            ctx.strokeStyle = theme.withAlpha(accentColor, pulseAlpha);
            ctx.lineWidth = 1.5;
            ctx.shadowColor = theme.withAlpha(accentColor, pulseAlpha * 0.6);
            ctx.shadowBlur = 8 * gi;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.restore();
        }

        // ----------------------------------------------------------------
        // Draw nodes (diamonds)
        // ----------------------------------------------------------------
        for (var ni = 0; ni < n; ni++) {
            var stage  = stages[ni];
            var nx     = nodeXs[ni];
            var isHover  = (this._hoverIdx === ni);
            var isActive = (stage.status === 'active');
            var s = nodeSize;
            if (isActive) s += activeExtra;
            if (isHover)  s += 3;

            // Determine fill / stroke colors
            var fillColor, strokeColor, glowColor, isFilled;
            if (stage.status === 'complete') {
                fillColor   = completeColor;
                strokeColor = completeColor;
                glowColor   = completeColor;
                isFilled    = true;
            } else if (stage.status === 'active') {
                fillColor   = accentColor;
                strokeColor = accentColor;
                glowColor   = accentColor;
                isFilled    = true;
            } else if (stage.status === 'failed') {
                fillColor   = failColor;
                strokeColor = failColor;
                glowColor   = failColor;
                isFilled    = true;
            } else {
                // pending
                fillColor   = 'transparent';
                strokeColor = theme.withAlpha(t.text, 0.3);
                glowColor   = null;
                isFilled    = false;
            }

            // Diamond path helper (rotated square)
            function drawDiamond(cx, cy, size) {
                ctx.beginPath();
                ctx.moveTo(cx,        cy - size);
                ctx.lineTo(cx + size, cy);
                ctx.lineTo(cx,        cy + size);
                ctx.lineTo(cx - size, cy);
                ctx.closePath();
            }

            ctx.save();

            // Glow pass for filled nodes
            if (isFilled && glowColor) {
                ctx.shadowColor = theme.withAlpha(glowColor, isActive ? 0.7 : 0.4);
                ctx.shadowBlur  = (isActive ? 14 : 8) * gi;
                drawDiamond(nx, nodeY, s);
                ctx.fillStyle = theme.withAlpha(glowColor, 0.01);
                ctx.fill();
                // Reset shadow before main fill
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
            }

            // Fill
            drawDiamond(nx, nodeY, s);
            if (isFilled) {
                ctx.fillStyle = fillColor;
                ctx.fill();
            } else {
                ctx.fillStyle = 'transparent';
            }

            // Stroke
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = isActive ? 2 : 1.5;
            ctx.stroke();

            ctx.restore();

            // Register hit region
            this._hitRegions.push({
                cx: nx,
                cy: nodeY,
                r: hitRadius,
                tip: '<span style="color:' + strokeColor + ';font-weight:600;">' +
                     stage.stage + '</span> &nbsp; ' + stage.status.toUpperCase()
            });
        }

        // ----------------------------------------------------------------
        // Draw labels
        // ----------------------------------------------------------------
        ctx.save();
        ctx.font = '400 10px ' + theme.DISPLAY_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (var li = 0; li < n; li++) {
            var lstage  = stages[li];
            var lx      = nodeXs[li];
            var isAct   = (lstage.status === 'active');
            var isHov   = (this._hoverIdx === li);

            ctx.fillStyle = isAct || isHov
                ? t.text
                : theme.withAlpha(t.text, 0.6);

            if (isAct) {
                ctx.shadowColor = theme.withAlpha(accentColor, 0.5);
                ctx.shadowBlur  = 6;
            } else {
                ctx.shadowBlur  = 0;
                ctx.shadowColor = 'transparent';
            }

            // Truncate long labels
            var label = lstage.stage;
            var maxLabelW = (usableW / n) - 4;
            while (label.length > 1 && ctx.measureText(label).width > maxLabelW) {
                label = label.slice(0, -1);
            }
            if (label !== lstage.stage) label = label + '…';

            ctx.fillText(label, lx, labelY);
        }

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.restore();
    },

    // -------------------------------------------------------------------------
    // Mouse move / hit test
    // -------------------------------------------------------------------------
    _onMouseMove: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var hit = this._hitTest(mx, my);

        if (hit !== null) {
            var region = this._hitRegions[hit];
            this._tooltip.innerHTML = region.tip;
            this._tooltip.style.display = 'block';

            var tx = mx + 14;
            var ty = my - 32;
            if (tx + 180 > this.el.offsetWidth) tx = mx - 190;
            if (ty < 0) ty = my + 16;
            this._tooltip.style.left = tx + 'px';
            this._tooltip.style.top  = ty + 'px';
            this.canvas.style.cursor = 'pointer';

            if (this._hoverIdx !== hit) {
                this._hoverIdx = hit;
                this._render(this._lastData, this._lastConfig);
            }
        } else {
            this._tooltip.style.display = 'none';
            this.canvas.style.cursor = 'default';
            if (this._hoverIdx !== -1) {
                this._hoverIdx = -1;
                this._render(this._lastData, this._lastConfig);
            }
        }
    },

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._hitRegions.length; i++) {
            var reg = this._hitRegions[i];
            var dx = mx - reg.cx;
            var dy = my - reg.cy;
            if (dx * dx + dy * dy <= reg.r * reg.r) return i;
        }
        return null;
    },

    // -------------------------------------------------------------------------
    // Destroy
    // -------------------------------------------------------------------------
    destroy: function() {
        if (this._animTimer) {
            clearInterval(this._animTimer);
            this._animTimer = null;
        }
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
