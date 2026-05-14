// McLaren F1 Telemetry — stint_chart visualization
// Gantt-style horizontal chart showing tire strategy across race laps.
// Each row = one driver. Each horizontal segment = one stint, colored by compound.

var SplunkVisualizationBase = require('api/SplunkVisualizationBase');
var theme = require('shared/theme');

// ---------------------------------------------------------------------------
// Compound abbreviation map
// ---------------------------------------------------------------------------

var COMPOUND_ABBR = {
    'soft':   'S',
    'medium': 'M',
    'hard':   'H',
    'inter':  'I',
    'wet':    'W'
};

// Normalize compound name to lower-case key
function normalizeCompound(raw) {
    if (!raw) return '';
    var s = String(raw).trim().toLowerCase();
    // Support "intermediate" -> "inter"
    if (s === 'intermediate' || s === 'intermediates') return 'inter';
    return s;
}

// ---------------------------------------------------------------------------
// Driver data grouping
// ---------------------------------------------------------------------------

/**
 * Group flat rows into per-driver stints, preserving first-appearance order.
 * Returns:
 *   { driverOrder: ['Norris', ...], drivers: { 'Norris': [{stint, compound, start_lap, end_lap, avg_deg}, ...] } }
 */
function groupByDriver(rows, colIdx, driverF, stintF, compoundF, startLapF, endLapF, avgDegF) {
    var driverOrder = [];
    var drivers = {};

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];

        var driver   = (colIdx[driverF]   !== undefined) ? String(row[colIdx[driverF]]   || '') : '';
        var stintNum = (colIdx[stintF]     !== undefined) ? parseInt(row[colIdx[stintF]]   || '0', 10) : 0;
        var compound = (colIdx[compoundF]  !== undefined) ? String(row[colIdx[compoundF]]  || '') : '';
        var startLap = (colIdx[startLapF]  !== undefined) ? parseInt(row[colIdx[startLapF]] || '0', 10) : 0;
        var endLap   = (colIdx[endLapF]    !== undefined) ? parseInt(row[colIdx[endLapF]]   || '0', 10) : 0;
        var avgDeg   = (colIdx[avgDegF]    !== undefined && avgDegF !== '') ?
                            parseFloat(row[colIdx[avgDegF]] || '') : NaN;

        if (!driver) continue;

        if (!drivers[driver]) {
            drivers[driver] = [];
            driverOrder.push(driver);
        }

        drivers[driver].push({
            stint:    isNaN(stintNum) ? 0 : stintNum,
            compound: normalizeCompound(compound),
            rawCompound: compound,
            startLap: isNaN(startLap) ? 0 : startLap,
            endLap:   isNaN(endLap)   ? 0 : endLap,
            avgDeg:   avgDeg
        });
    }

    // Sort each driver's stints by start_lap
    for (var d = 0; d < driverOrder.length; d++) {
        var dname = driverOrder[d];
        drivers[dname].sort(function(a, b) {
            return a.startLap - b.startLap;
        });
    }

    return { driverOrder: driverOrder, drivers: drivers };
}

// ---------------------------------------------------------------------------
// Main viz
// ---------------------------------------------------------------------------

module.exports = SplunkVisualizationBase.extend({

    initialize: function() {
        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

        this.el.style.position = 'relative';
        this.el.style.overflow = 'hidden';

        // Canvas — manual creation (B17 corollary)
        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = 'display:block;width:100%;height:100%;';
        this.el.appendChild(this._canvas);

        // Tooltip (I1)
        this._tooltip = document.createElement('div');
        this._tooltip.style.cssText =
            'position:absolute;display:none;padding:6px 11px;border-radius:3px;' +
            'pointer-events:none;white-space:nowrap;z-index:100;font-size:11px;' +
            'line-height:1.7;';
        this.el.appendChild(this._tooltip);

        // Hit zones: array of {driver, stintData, x, y, w, h}
        this._hitZones = [];

        // Hover state: index into _hitZones or -1
        this._hoverIdx = -1;

        // Hovered identifier — used during rendering to avoid chicken-and-egg
        // with _hitZones rebuild. Set when hover changes.
        this._hoverDriver = null;
        this._hoverStint  = -1;

        // Caches for reflow (C6)
        this._lastData   = null;
        this._lastConfig = null;

        // Layout cache for tooltip positioning
        this._layoutCache = null;
        this._themeCache  = null;

        var self = this;
        this._canvas.addEventListener('mousemove', function(e) {
            self._onMouseMove(e);
        });
        this._canvas.addEventListener('mouseleave', function() {
            if (self._hoverIdx !== -1) {
                self._hoverIdx    = -1;
                self._hoverDriver = null;
                self._hoverStint  = -1;
                if (self._lastData && self._lastConfig) {
                    self._render(self._lastData, self._lastConfig);
                }
            }
            self._tooltip.style.display = 'none';
            self._canvas.style.cursor = 'default';
        });
    },

    // -----------------------------------------------------------------------
    // Data params (F4)
    // -----------------------------------------------------------------------

    getInitialDataParams: function() {
        return {
            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
            count: 10000
        };
    },

    // -----------------------------------------------------------------------
    // formatData — data only, no config reads (B4)
    // -----------------------------------------------------------------------

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

    // -----------------------------------------------------------------------
    // Render pipeline
    // -----------------------------------------------------------------------

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
        var ns = theme.getNS(this);

        // --- Config reads (all via getOption — B3) ---
        var themeMode      = theme.getOption(config, ns, 'theme',            'dark');
        var t              = theme.getTheme(themeMode);
        var driverField    = theme.getOption(config, ns, 'driverField',      'driver');
        var stintField     = theme.getOption(config, ns, 'stintField',       'stint');
        var compoundField  = theme.getOption(config, ns, 'compoundField',    'compound');
        var startLapField  = theme.getOption(config, ns, 'startLapField',    'start_lap');
        var endLapField    = theme.getOption(config, ns, 'endLapField',      'end_lap');
        var avgDegField    = theme.getOption(config, ns, 'avgDegField',      'avg_deg');
        var showLegend     = theme.parseBool(theme.getOption(config, ns, 'showLegend',      'true'), true);
        var showDeg        = theme.parseBool(theme.getOption(config, ns, 'showDegradation', 'true'), true);
        var accentInt      = theme.parseNum(theme.getOption(config, ns, 'accentIntensity',  '50'), 50);

        // --- HiDPI canvas (B2) ---
        var rect = this.el.getBoundingClientRect();
        var w    = rect.width  || this.el.offsetWidth  || 400;
        var h    = rect.height || this.el.offsetHeight || 300;
        var dpr  = window.devicePixelRatio || 1;
        this._canvas.width  = w * dpr;
        this._canvas.height = h * dpr;
        this._canvas.style.width  = w + 'px';
        this._canvas.style.height = h + 'px';
        var ctx = this._canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Clear canvas (B13)
        ctx.clearRect(0, 0, w, h);

        // --- Extract and group data ---
        var colIdx = (data && data.colIdx) ? data.colIdx : {};
        var rows   = (data && data.rows)   ? data.rows   : [];

        var grouped = groupByDriver(rows, colIdx,
            driverField, stintField, compoundField,
            startLapField, endLapField, avgDegField);

        var driverOrder = grouped.driverOrder;
        var drivers     = grouped.drivers;
        var numDrivers  = driverOrder.length;

        // Find max end_lap for x-axis range
        var maxLap = 0;
        for (var di = 0; di < driverOrder.length; di++) {
            var dStints = drivers[driverOrder[di]];
            for (var si = 0; si < dStints.length; si++) {
                if (dStints[si].endLap > maxLap) maxLap = dStints[si].endLap;
            }
        }
        if (maxLap < 1) maxLap = 60; // fallback for empty data

        // --- Layout constants (B8 — all scaled from container) ---
        var AXIS_TOP_H  = 30;                              // lap axis header
        var LEGEND_H    = showLegend ? 30 : 0;             // legend strip at bottom
        var LABEL_W     = Math.round(w * 0.15);            // driver name column
        var CHART_PAD_R = 5;                               // right padding

        var chartX = LABEL_W;                              // chart area left edge
        var chartW = w - LABEL_W - CHART_PAD_R;           // chart area width
        var chartY = AXIS_TOP_H;                           // chart area top edge
        var chartH = h - AXIS_TOP_H - LEGEND_H;           // chart area height

        // Row sizing (B8)
        var ROW_GAP  = Math.max(2, Math.round(chartH * 0.02));
        var rowH     = numDrivers > 0
                        ? Math.max(20, Math.floor((chartH - ROW_GAP * (numDrivers - 1)) / numDrivers))
                        : 24;

        // Font sizes (B8)
        var driverFontSize = Math.max(8,  Math.round(rowH * 0.38));
        var axisLabelSize  = Math.max(7,  Math.round(AXIS_TOP_H * 0.40));
        var compoundLetterSize = Math.max(7, Math.round(rowH * 0.60 * 0.55));
        var legendFontSize = Math.max(7,  Math.round(LEGEND_H * 0.50));

        // Compound color lookup from theme
        var compoundColors = {
            soft:   t.soft,
            medium: t.medium,
            hard:   t.hard,
            inter:  t.inter,
            wet:    t.wet
        };

        // Helper: lap position → canvas x coordinate
        var lapToX = function(lap) {
            return chartX + ((lap - 1) / Math.max(1, maxLap - 1)) * chartW;
        };

        // Update tooltip styling from current theme
        this._tooltip.style.background  = t.panelHi;
        this._tooltip.style.color       = t.text;
        this._tooltip.style.fontFamily  = theme.FONTS.data;
        this._tooltip.style.border      = '1px solid ' + theme.withAlpha(t.accent, 0.35);

        // -----------------------------------------------------------------------
        // Draw: vertical grid lines at every 10 laps
        // -----------------------------------------------------------------------
        ctx.save();
        ctx.strokeStyle = t.grid; // already 5% opacity in dark theme
        ctx.lineWidth = 1;
        var gridLap = 10;
        while (gridLap < maxLap) {
            var gx = lapToX(gridLap);
            ctx.beginPath();
            ctx.moveTo(gx, chartY);
            ctx.lineTo(gx, chartY + chartH);
            ctx.stroke();
            gridLap += 10;
        }
        ctx.restore();

        // -----------------------------------------------------------------------
        // Draw: x-axis (lap numbers at top)
        // -----------------------------------------------------------------------
        ctx.save();
        ctx.font = axisLabelSize + 'px ' + theme.FONTS.data;
        ctx.fillStyle = t.textDim;
        ctx.textBaseline = 'middle';

        // Tick marks every 5 laps, labels every 10
        var axisTickY     = AXIS_TOP_H - 6;
        var axisLabelY    = AXIS_TOP_H - 16;
        var axisTickEndY  = AXIS_TOP_H - 2;

        ctx.strokeStyle = theme.withAlpha(t.textFaint, 0.5);
        ctx.lineWidth = 1;

        var tickLap = 5;
        while (tickLap <= maxLap) {
            var tx = lapToX(tickLap);
            // Tick mark
            ctx.beginPath();
            ctx.moveTo(tx, axisTickY);
            ctx.lineTo(tx, axisTickEndY);
            ctx.stroke();
            // Label every 10
            if (tickLap % 10 === 0) {
                ctx.textAlign = 'center';
                ctx.fillText(String(tickLap), tx, axisLabelY);
            }
            tickLap += 5;
        }
        // "LAP 1" label on left
        ctx.textAlign = 'left';
        ctx.fillStyle = t.textFaint;
        ctx.fillText('LAP 1', chartX + 2, axisLabelY);
        ctx.restore();

        // Axis separator line
        ctx.save();
        ctx.strokeStyle = theme.withAlpha(t.edge, 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartX, AXIS_TOP_H);
        ctx.lineTo(w - CHART_PAD_R, AXIS_TOP_H);
        ctx.stroke();
        ctx.restore();

        // -----------------------------------------------------------------------
        // Draw: driver rows and stint bars
        // -----------------------------------------------------------------------
        this._hitZones = [];

        for (var ri = 0; ri < numDrivers; ri++) {
            var driverName = driverOrder[ri];
            var driverStints = drivers[driverName];
            var rowY  = chartY + ri * (rowH + ROW_GAP);
            var rowCY = rowY + Math.round(rowH * 0.5);

            // Alternating subtle row bg
            if (ri % 2 === 0) {
                ctx.save();
                ctx.fillStyle = theme.withAlpha(t.panelHi, 0.30);
                ctx.fillRect(0, rowY, w, rowH);
                ctx.restore();
            }

            // --- Driver label (left) ---
            ctx.save();
            ctx.font = driverFontSize + 'px ' + theme.FONTS.ui;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'right';
            ctx.fillStyle = t.text;
            ctx.beginPath();
            ctx.rect(0, rowY, LABEL_W - 6, rowH);
            ctx.clip();
            ctx.fillText(driverName, LABEL_W - 8, rowCY);
            ctx.restore();

            // --- Stint bars ---
            for (var si2 = 0; si2 < driverStints.length; si2++) {
                var stint = driverStints[si2];
                var cname = stint.compound;
                var ccolor = compoundColors[cname] || t.accent;

                // X range for this stint
                var barX0 = lapToX(stint.startLap);
                var barX1 = lapToX(stint.endLap);
                var barW  = Math.max(1, barX1 - barX0);

                // Bar height = 60% of row height, centered
                var barH  = Math.round(rowH * 0.60);
                var barY  = rowY + Math.round((rowH - barH) * 0.5);
                var barRx = 2; // slight rounded corners

                // Check if this stint is currently hovered.
                // Use _hoverDriver/_hoverStint (set at mouse event time) — not _hitZones
                // which is being rebuilt in this same pass.
                var isHovered = (this._hoverDriver === driverName &&
                    this._hoverStint === stint.stint);

                // Register hit zone
                this._hitZones.push({
                    x:         barX0,
                    y:         rowY,
                    w:         barW,
                    h:         rowH,
                    driver:    driverName,
                    stintData: stint,
                    rowIdx:    ri
                });

                ctx.save();

                if (isHovered && accentInt > 0) {
                    ctx.shadowColor   = ccolor;
                    ctx.shadowBlur    = Math.round((accentInt / 100) * 10);
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }

                if (showDeg && !isNaN(stint.avgDeg) && stint.avgDeg > 0 && barW > 4) {
                    // Degradation gradient: full opacity left → reduced opacity right
                    // Higher degradation = stronger fade. Typical range ~0.01–0.05 per lap.
                    var lapCount = Math.max(1, stint.endLap - stint.startLap);
                    var totalDeg = stint.avgDeg * lapCount;
                    // Map degradation to alpha drop: 0 deg = no fade, 0.5+ = fade to 55%
                    var minAlpha = Math.max(0.40, 1.0 - Math.min(0.60, totalDeg * 3));
                    var grad = ctx.createLinearGradient(barX0, 0, barX0 + barW, 0);
                    grad.addColorStop(0, theme.withAlpha(ccolor, isHovered ? 1.0 : 0.90));
                    grad.addColorStop(1, theme.withAlpha(ccolor, isHovered ? minAlpha + 0.1 : minAlpha));
                    ctx.fillStyle = grad;
                } else {
                    ctx.fillStyle = theme.withAlpha(ccolor, isHovered ? 1.0 : 0.85);
                }

                // Draw rounded-corner bar (rx:2)
                theme.roundRect(ctx, barX0, barY, barW, barH, barRx);
                ctx.fill();

                // Reset shadow (B6)
                ctx.shadowBlur    = 0;
                ctx.shadowColor   = 'transparent';
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // Compound letter inside bar if wide enough
                var abbr = COMPOUND_ABBR[cname] || String(cname).charAt(0).toUpperCase();
                if (barW > 16) {
                    ctx.font = 'bold ' + compoundLetterSize + 'px ' + theme.FONTS.data;
                    var letterW = ctx.measureText(abbr).width;
                    if (letterW <= barW - 4) {
                        // Pick text color: white on colored compounds, black on hard (white)
                        var letterColor = (cname === 'hard') ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.90)';
                        ctx.fillStyle = letterColor;
                        ctx.textBaseline = 'middle';
                        ctx.textAlign = 'center';
                        ctx.beginPath();
                        ctx.rect(barX0, barY, barW, barH);
                        ctx.clip();
                        ctx.fillText(abbr, barX0 + barW * 0.5, barY + barH * 0.5);
                    }
                }

                ctx.restore();

                // Pit stop marker: dashed vertical line at stint END (if not the last stint)
                if (si2 < driverStints.length - 1) {
                    var pitX = barX1;
                    ctx.save();
                    ctx.strokeStyle = theme.withAlpha(t.accent, 0.55);
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 3]);
                    ctx.beginPath();
                    ctx.moveTo(pitX, rowY);
                    ctx.lineTo(pitX, rowY + rowH);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.restore();
                }
            }

            // Row separator
            if (ri < numDrivers - 1) {
                ctx.save();
                ctx.strokeStyle = theme.withAlpha(t.grid, 0.8);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, rowY + rowH + Math.floor(ROW_GAP * 0.5));
                ctx.lineTo(w, rowY + rowH + Math.floor(ROW_GAP * 0.5));
                ctx.stroke();
                ctx.restore();
            }
        }

        // No-data message
        if (numDrivers === 0) {
            ctx.save();
            ctx.font = Math.max(11, Math.round(h * 0.05)) + 'px ' + theme.FONTS.ui;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = t.textFaint;
            ctx.fillText('No stint data', w / 2, h / 2);
            ctx.restore();
        }

        // -----------------------------------------------------------------------
        // Draw: legend at bottom
        // -----------------------------------------------------------------------
        if (showLegend && LEGEND_H > 0) {
            var legendY   = h - LEGEND_H;
            var compounds = [
                { key: 'soft',   label: 'Soft' },
                { key: 'medium', label: 'Medium' },
                { key: 'hard',   label: 'Hard' },
                { key: 'inter',  label: 'Inter' },
                { key: 'wet',    label: 'Wet' }
            ];
            // Measure total legend width to center it
            var dotR       = Math.max(4, Math.round(LEGEND_H * 0.22));
            var itemGap    = Math.max(12, Math.round(w * 0.04));
            var labelPad   = dotR * 2 + 4;

            ctx.font = legendFontSize + 'px ' + theme.FONTS.ui;
            var totalLegendW = 0;
            for (var li = 0; li < compounds.length; li++) {
                totalLegendW += labelPad + ctx.measureText(compounds[li].label).width;
                if (li < compounds.length - 1) totalLegendW += itemGap;
            }
            var legendStartX = Math.round((w - totalLegendW) / 2);
            var legendCY     = legendY + Math.round(LEGEND_H * 0.5);

            var lx = legendStartX;
            for (var li2 = 0; li2 < compounds.length; li2++) {
                var comp = compounds[li2];
                var lcolor = compoundColors[comp.key] || t.accent;
                var lw = ctx.measureText(comp.label).width;

                // Circle dot
                ctx.save();
                ctx.fillStyle = lcolor;
                ctx.beginPath();
                ctx.arc(lx + dotR, legendCY, dotR, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Label
                ctx.save();
                ctx.font = legendFontSize + 'px ' + theme.FONTS.ui;
                ctx.fillStyle = t.textDim;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';
                ctx.fillText(comp.label, lx + labelPad, legendCY);
                ctx.restore();

                lx += labelPad + lw + itemGap;
            }

            // Separator above legend
            ctx.save();
            ctx.strokeStyle = theme.withAlpha(t.edge, 0.4);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, legendY);
            ctx.lineTo(w, legendY);
            ctx.stroke();
            ctx.restore();
        }

        // Final shadow reset (B6)
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Cache for hit testing and tooltip positioning
        this._layoutCache = {
            w: w, h: h,
            chartX: chartX, chartY: chartY, chartW: chartW, chartH: chartH
        };
        this._themeCache  = t;
    },

    // -----------------------------------------------------------------------
    // Mouse interaction (I1, I2)
    // -----------------------------------------------------------------------

    _onMouseMove: function(e) {
        var rect = this._canvas.getBoundingClientRect();
        var mx   = e.clientX - rect.left;
        var my   = e.clientY - rect.top;
        var hitIdx = this._hitTest(mx, my);

        var changed = (hitIdx !== this._hoverIdx);
        if (changed) {
            this._hoverIdx = hitIdx;
            if (hitIdx >= 0 && this._hitZones[hitIdx]) {
                this._hoverDriver = this._hitZones[hitIdx].driver;
                this._hoverStint  = this._hitZones[hitIdx].stintData.stint;
            } else {
                this._hoverDriver = null;
                this._hoverStint  = -1;
            }
            if (this._lastData && this._lastConfig) {
                this._render(this._lastData, this._lastConfig);
            }
        }

        if (hitIdx >= 0) {
            this._showTooltip(this._hitZones[hitIdx], mx, my);
            this._canvas.style.cursor = 'crosshair';
        } else {
            this._tooltip.style.display = 'none';
            this._canvas.style.cursor = 'default';
        }
    },

    _hitTest: function(mx, my) {
        for (var i = 0; i < this._hitZones.length; i++) {
            var z = this._hitZones[i];
            if (mx >= z.x && mx < z.x + z.w &&
                my >= z.y && my < z.y + z.h) {
                return i;
            }
        }
        return -1;
    },

    _showTooltip: function(hit, mx, my) {
        if (!hit) { this._tooltip.style.display = 'none'; return; }

        var s = hit.stintData;
        var lapCount = s.endLap - s.startLap;

        var compoundDisplay = s.rawCompound || s.compound || '—';
        // Capitalize first letter
        if (compoundDisplay.length > 0) {
            compoundDisplay = compoundDisplay.charAt(0).toUpperCase() + compoundDisplay.slice(1);
        }

        var line1 = hit.driver + ' — Stint ' + s.stint + ': ' + compoundDisplay;
        var line2 = 'Laps ' + s.startLap + '–' + s.endLap + ' (' + lapCount + ' laps)';
        var line3 = '';
        if (!isNaN(s.avgDeg)) {
            line3 = 'Avg deg: ' + s.avgDeg.toFixed(3);
        }

        var html = line1 + '<br>' + line2;
        if (line3) html += '<br>' + line3;
        this._tooltip.innerHTML = html;
        this._tooltip.style.display = 'block';

        var tipW   = this._tooltip.offsetWidth  || 200;
        var tipH   = this._tooltip.offsetHeight || 60;
        var layout = this._layoutCache;
        var panelW = layout ? layout.w : 400;
        var panelH = layout ? layout.h : 300;

        var ttx = mx + 14;
        var tty = my - 8;
        if (ttx + tipW > panelW - 4) ttx = mx - tipW - 14;
        if (tty + tipH > panelH - 4) tty = panelH - tipH - 4;
        if (tty < 0) tty = 4;

        this._tooltip.style.left = ttx + 'px';
        this._tooltip.style.top  = tty + 'px';
    },

    // -----------------------------------------------------------------------
    // Cleanup (C5, I1)
    // -----------------------------------------------------------------------

    destroy: function() {
        if (this._tooltip && this._tooltip.parentNode) {
            this._tooltip.parentNode.removeChild(this._tooltip);
        }
        this._tooltip     = null;
        this._hitZones    = [];
        this._hoverIdx    = -1;
        this._hoverDriver = null;
        this._hoverStint  = -1;
        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);
    }

});
