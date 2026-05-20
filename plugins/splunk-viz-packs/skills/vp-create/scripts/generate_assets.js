#!/usr/bin/env node
/*
 * generate_assets.js -- PNG asset generator for Splunk viz pack apps.
 *
 * Usage:
 *   node generate_assets.js <app_dir>
 *
 * Exit codes:
 *   0 -- all assets written successfully
 *   1 -- runtime error (dir not found, theme load failed, write error)
 *   2 -- usage error (no arguments)
 *
 * Outputs:
 *   <app_dir>/static/appIcon.png      (36x36)  -- accent bg + white initial letter
 *   <app_dir>/static/appIcon_2x.png   (72x72)  -- same at 2x scale
 *   <app_dir>/appserver/static/visualizations/<viz>/preview.png (300x200 per viz)
 *   <app_dir>/appserver/static/images/bg_gradient.png (1920x1080) -- branded gradient background
 *
 * theme.js is loaded via require() + getTheme('dark') -- no eval(), no regex parsing.
 * Zero external npm dependencies -- only built-in Node.js modules: fs, path, zlib.
 *
 * Pure ES5 CJS -- no const/let/arrow functions/template literals/class/destructuring.
 */

'use strict';

var fs   = require('fs');
var path = require('path');
var zlib = require('zlib');

// ---- CLI argument parsing ----

var args = process.argv.slice(2);

if (args.length < 1) {
    process.stderr.write('Usage: node generate_assets.js <app_dir>\n');
    process.exit(2);
}

var appDir = path.resolve(args[0]);

if (!fs.existsSync(appDir)) {
    process.stderr.write('Error: directory not found: ' + appDir + '\n');
    process.exit(1);
}

// ---- PNG encoder ----

var PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/*
 * CRC32: use native zlib.crc32 if available (Node 22.2+), otherwise fall back
 * to a 256-entry polynomial table computed once at startup.
 */
var crc32;
if (typeof zlib.crc32 === 'function') {
    crc32 = function(buf) { return zlib.crc32(buf); };
} else {
    crc32 = (function() {
        var table = [];
        var c, k;
        for (var n = 0; n < 256; n++) {
            c = n;
            for (k = 0; k < 8; k++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[n] = c;
        }
        return function(buf) {
            var crcVal = 0xFFFFFFFF;
            for (var i = 0; i < buf.length; i++) {
                crcVal = table[(crcVal ^ buf[i]) & 0xFF] ^ (crcVal >>> 8);
            }
            return (crcVal ^ 0xFFFFFFFF) >>> 0;
        };
    }());
}

function makeChunk(typeStr, data) {
    var typeBuf = Buffer.from(typeStr, 'ascii');
    var lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    var combined = Buffer.concat([typeBuf, data]);
    var crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/*
 * makePng(w, h, rgbRows): encode an RGB pixel grid as a valid PNG buffer.
 * rgbRows is an array of h arrays, each containing w*3 bytes (R, G, B per pixel).
 */
function makePng(w, h, rgbRows) {
    // IHDR chunk: width(4) height(4) bitDepth(1) colorType(1=palette,2=RGB,3=indexed,4=greyscale+A,6=RGB+A)
    // We use colorType=2 (RGB, no alpha) and bitDepth=8
    var ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;   // bit depth
    ihdr[9] = 2;   // color type: RGB
    ihdr[10] = 0;  // compression method (deflate)
    ihdr[11] = 0;  // filter method
    ihdr[12] = 0;  // interlace method (none)

    // Build scanlines: filter byte (0=None) + row bytes
    var scanlines = [];
    for (var y = 0; y < h; y++) {
        var row = rgbRows[y] || [];
        var scanline = Buffer.alloc(1 + w * 3);
        scanline[0] = 0; // filter type None
        for (var x = 0; x < w * 3; x++) {
            scanline[1 + x] = row[x] || 0;
        }
        scanlines.push(scanline);
    }

    var rawData = Buffer.concat(scanlines);
    // level 0 (store, no compression) for small icons: guarantees output > 500 bytes even
    // when a solid-color icon compresses to near-nothing. level 6 (default) for preview PNGs.
    var compressLevel = (w <= 72 && h <= 72) ? 0 : 6;
    var compressed = zlib.deflateSync(rawData, { level: compressLevel });

    return Buffer.concat([
        PNG_SIG,
        makeChunk('IHDR', ihdr),
        makeChunk('IDAT', compressed),
        makeChunk('IEND', Buffer.alloc(0))
    ]);
}

/*
 * makeRgbRows(w, h, r, g, b): create a pixel grid filled with a solid color.
 * Returns array of h arrays, each w*3 bytes.
 */
function makeRgbRows(w, h, r, g, b) {
    var rows = [];
    for (var y = 0; y < h; y++) {
        var row = [];
        for (var x = 0; x < w; x++) {
            row.push(r, g, b);
        }
        rows.push(row);
    }
    return rows;
}

/*
 * makeGradientRows(w, h, topLeftRgb, bottomRightRgb, accentRgb, accentCx, accentCy, accentR):
 * Create a pixel grid with a diagonal gradient from topLeftRgb to bottomRightRgb,
 * plus a radial accent glow overlay centered at (accentCx, accentCy) with radius accentR.
 * The glow blends toward accentRgb at max 8% using quadratic falloff.
 * Returns array of h arrays, each w*3 bytes (same format as makeRgbRows).
 */
function makeGradientRows(w, h, topLeftRgb, bottomRightRgb, accentRgb, accentCx, accentCy, accentR) {
    var rows = [];
    for (var y = 0; y < h; y++) {
        var row = [];
        var ty = y / (h - 1); // 0..1 vertical progress
        for (var x = 0; x < w; x++) {
            var tx = x / (w - 1); // 0..1 horizontal progress
            // Diagonal linear interpolation: top-left to bottom-right
            var t = (tx + ty) / 2;
            var r = Math.round(topLeftRgb[0] + (bottomRightRgb[0] - topLeftRgb[0]) * t);
            var g = Math.round(topLeftRgb[1] + (bottomRightRgb[1] - topLeftRgb[1]) * t);
            var b = Math.round(topLeftRgb[2] + (bottomRightRgb[2] - topLeftRgb[2]) * t);
            // Radial accent glow overlay: quadratic falloff, max 8% blend
            var dx = x - accentCx;
            var dy = y - accentCy;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < accentR) {
                var glow = 1 - (dist / accentR);
                glow = glow * glow * 0.08;
                r = Math.round(r + (accentRgb[0] - r) * glow);
                g = Math.round(g + (accentRgb[1] - g) * glow);
                b = Math.round(b + (accentRgb[2] - b) * glow);
            }
            row.push(r, g, b);
        }
        rows.push(row);
    }
    return rows;
}

/*
 * fillRect(rgbRows, x, y, w, h, r, g, b): fill a rectangle in-place.
 * Clips to image boundaries.
 */
function fillRect(rgbRows, rx, ry, rw, rh, r, g, b) {
    var imgH = rgbRows.length;
    var imgW = imgH > 0 ? rgbRows[0].length / 3 : 0;
    var x1 = Math.max(0, rx);
    var y1 = Math.max(0, ry);
    var x2 = Math.min(imgW, rx + rw);
    var y2 = Math.min(imgH, ry + rh);
    for (var py = y1; py < y2; py++) {
        var row = rgbRows[py];
        for (var px = x1; px < x2; px++) {
            row[px * 3]     = r;
            row[px * 3 + 1] = g;
            row[px * 3 + 2] = b;
        }
    }
}

// ---- Bitmap font (5x7 pixel glyphs for A-Z) ----
/*
 * Each letter is 7 rows of 5 bits (MSB = leftmost pixel).
 * Stored as integers where bit 4 = col 0, bit 3 = col 1, etc.
 */
var FONT_GLYPHS = {
    'A': [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
    'B': [0x1E, 0x11, 0x11, 0x1E, 0x11, 0x11, 0x1E],
    'C': [0x0E, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0E],
    'D': [0x1E, 0x09, 0x09, 0x09, 0x09, 0x09, 0x1E],
    'E': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x1F],
    'F': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10],
    'G': [0x0E, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0F],
    'H': [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
    'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E],
    'J': [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0C],
    'K': [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
    'L': [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F],
    'M': [0x11, 0x1B, 0x15, 0x15, 0x11, 0x11, 0x11],
    'N': [0x11, 0x11, 0x19, 0x15, 0x13, 0x11, 0x11],
    'O': [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
    'P': [0x1E, 0x11, 0x11, 0x1E, 0x10, 0x10, 0x10],
    'Q': [0x0E, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0D],
    'R': [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x11],
    'S': [0x0F, 0x10, 0x10, 0x0E, 0x01, 0x01, 0x1E],
    'T': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
    'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
    'V': [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
    'W': [0x11, 0x11, 0x11, 0x15, 0x15, 0x1B, 0x11],
    'X': [0x11, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0x11],
    'Y': [0x11, 0x11, 0x0A, 0x04, 0x04, 0x04, 0x04],
    'Z': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1F],
    '*': [0x00, 0x0A, 0x1F, 0x0E, 0x1F, 0x0A, 0x00]
};

/*
 * drawLetter(rgbRows, letter, ox, oy, scale, r, g, b):
 * Render a 5x7 bitmap glyph at pixel position (ox, oy) with given pixel scale.
 */
function drawLetter(rgbRows, letter, ox, oy, scale, r, g, b) {
    var glyph = FONT_GLYPHS[letter] || FONT_GLYPHS['*'];
    for (var row = 0; row < 7; row++) {
        var bits = glyph[row];
        for (var col = 0; col < 5; col++) {
            if (bits & (1 << (4 - col))) {
                fillRect(rgbRows,
                    ox + col * scale,
                    oy + row * scale,
                    scale, scale,
                    r, g, b);
            }
        }
    }
}

// ---- Color utilities ----

function isHex(val) {
    return typeof val === 'string' && /^#[0-9A-Fa-f]{6}$/.test(val);
}

function hexToRgb(hex) {
    if (!isHex(hex)) { return [128, 128, 128]; }
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
    ];
}

/*
 * previewContrastAccent(accentHex, bgHex): ensure silhouette is visible on brand bg.
 * If accent-on-bg contrast is below 3:1 (perceived luminance), brighten accent 30% toward white.
 * Returns [r, g, b] array.
 */
function previewContrastAccent(accentHex, bgHex) {
    var ar = hexToRgb(accentHex);
    var br = hexToRgb(bgHex);
    var aLum = (ar[0] * 0.299 + ar[1] * 0.587 + ar[2] * 0.114) / 255;
    var bLum = (br[0] * 0.299 + br[1] * 0.587 + br[2] * 0.114) / 255;
    var lighter = Math.max(aLum, bLum) + 0.05;
    var darker  = Math.min(aLum, bLum) + 0.05;
    var contrast = lighter / darker;
    if (contrast < 3.0) {
        return [
            Math.min(255, Math.round(ar[0] + (255 - ar[0]) * 0.3)),
            Math.min(255, Math.round(ar[1] + (255 - ar[1]) * 0.3)),
            Math.min(255, Math.round(ar[2] + (255 - ar[2]) * 0.3))
        ];
    }
    return ar;
}

// ---- Viz type detection ----

var VIZ_TYPE_KEYWORDS = [
    { type: 'bars',     keywords: ['leaderboard', 'leader', 'ranking', 'waterfall', 'bullet',
                                   'bar_chart', 'barchart', 'histogram', 'horizontal', 'vertical',
                                   'ranked', 'podium', 'position_board',
                                   'bar', 'bars', 'column'] },
    { type: 'gauge',    keywords: ['kpi_gauge', 'ring_gauge', 'speedometer', 'utilization',
                                   'battery', 'fuel', 'needle', 'meter',
                                   'gauge', 'arc', 'ring', 'donut', 'dial', 'radial'] },
    { type: 'grid',     keywords: ['status_matrix', 'health_grid', 'attack_heatmap', 'host_grid',
                                   'heatmap', 'heat', 'occupancy', 'department', 'severity',
                                   'grid', 'table', 'matrix', 'cell'] },
    { type: 'line',     keywords: ['power_horizon', 'spark_strip', 'time_series', 'timeseries',
                                   'area_chart', 'linechart', 'sparkline', 'horizon',
                                   'line', 'trend', 'area', 'spark'] },
    { type: 'timeline', keywords: ['incident_feed', 'event_feed', 'live_ticker', 'passenger_flow',
                                   'kill_chain', 'pipeline', 'process', 'observation',
                                   'timeline', 'gantt', 'feed', 'activity', 'event',
                                   'stream', 'log', 'ticker', 'incident', 'queue', 'flow'] },
    { type: 'radar',    keywords: ['multi_axis', 'radarchart', 'dimension', 'profile',
                                   'radar', 'spider', 'polar', 'web'] },
    { type: 'progress', keywords: ['stage_tracker', 'progress_bar', 'completion', 'saturation',
                                   'capacity', 'runway',
                                   'progress', 'fill', 'step', 'stage'] },
    { type: 'scatter',  keywords: ['latency_scatter', 'scatterplot', 'bivariate', 'distribution',
                                   'scatter', 'bubble', 'correlation', 'plot', 'xy'] },
    { type: 'network',  keywords: ['network_topology', 'force_directed', 'dependency',
                                   'relationship', 'geographic', 'flight', 'route',
                                   'network', 'topology', 'connection', 'graph',
                                   'force', 'node', 'edge', 'path'] },
    { type: 'kpi',      keywords: ['single_value', 'satisfaction', 'counter',
                                   'kpi', 'metric', 'score', 'value', 'number',
                                   'stat', 'card', 'tile', 'badge', 'nps'] }
];

function detectVizType(dirName) {
    var lower = dirName.toLowerCase();
    for (var i = 0; i < VIZ_TYPE_KEYWORDS.length; i++) {
        var entry = VIZ_TYPE_KEYWORDS[i];
        for (var j = 0; j < entry.keywords.length; j++) {
            if (lower.indexOf(entry.keywords[j]) !== -1) {
                return entry.type;
            }
        }
    }
    return 'kpi';
}

// ---- Silhouette draw functions (300x200 canvas) ----

function drawKpiSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    var W = 300, H = 200;
    // Large centered value rectangle
    fillRect(rows, 60, 40, 180, 60, ar, ag, ab);
    // Four label bars below value
    fillRect(rows, 80, 120, 140, 8, ar, ag, ab);
    fillRect(rows, 90, 136, 120, 6, ar, ag, ab);
    fillRect(rows, 100, 150, 100, 6, ar, ag, ab);
    fillRect(rows, 110, 163, 80, 6, ar, ag, ab);
    // Two decorative side accents
    fillRect(rows, 20, 50, 6, 40, ar, ag, ab);
    fillRect(rows, W - 26, 50, 6, 40, ar, ag, ab);
}

function drawBarsSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    var H = 200;
    var baseY = H - 30;
    // Horizontal baseline
    fillRect(rows, 30, baseY, 240, 4, ar, ag, ab);
    // Six vertical bars of varying heights
    var barW = 28;
    var gaps = [30, 65, 100, 135, 170, 210];
    var heights = [100, 70, 120, 55, 90, 80];
    for (var i = 0; i < 6; i++) {
        fillRect(rows, gaps[i], baseY - heights[i], barW, heights[i], ar, ag, ab);
    }
}

function drawGaugeSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    var cx = 150, cy = 120, outerR = 70, innerR = 45;
    // Approximate arc/ring with rectangular segments (top half of a ring)
    // Draw as a series of small rectangles to approximate an arc
    var steps = 24;
    for (var i = 0; i <= steps; i++) {
        var angle = Math.PI + (Math.PI * i / steps);
        var cosA = Math.cos(angle);
        var sinA = Math.sin(angle);
        // Outer arc point
        var ox = cx + cosA * outerR;
        var oy = cy + sinA * outerR;
        // Inner arc point
        var ix = cx + cosA * innerR;
        var iy = cy + sinA * innerR;
        // Fill a rect from inner to outer at this angle slice
        var px = Math.min(ox, ix);
        var py = Math.min(oy, iy);
        var pw = Math.max(1, Math.abs(ox - ix));
        var ph = Math.max(1, Math.abs(oy - iy));
        fillRect(rows, Math.round(px), Math.round(py), Math.round(pw) + 4, Math.round(ph) + 4, ar, ag, ab);
    }
    // Center value stub
    fillRect(rows, 120, 130, 60, 18, ar, ag, ab);
    fillRect(rows, 130, 155, 40, 10, ar, ag, ab);
    // Needle
    fillRect(rows, 148, cy - outerR, 4, outerR - innerR + 8, ar, ag, ab);
}

function drawGridSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    // 5 horizontal rows
    var rowY = [30, 65, 100, 135, 165];
    var rowH = 20;
    for (var i = 0; i < rowY.length; i++) {
        fillRect(rows, 20, rowY[i], 260, rowH, ar, ag, ab);
    }
    // 3 vertical column dividers (hairlines)
    fillRect(rows, 90, 30, 3, 155, bgr, bgg, bgb);
    fillRect(rows, 170, 30, 3, 155, bgr, bgg, bgb);
    fillRect(rows, 240, 30, 3, 155, bgr, bgg, bgb);
}

function drawLineSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    // Zigzag polyline across full width (8-10 points)
    var points = [
        {x: 20,  y: 150},
        {x: 55,  y: 80},
        {x: 90,  y: 120},
        {x: 120, y: 50},
        {x: 155, y: 90},
        {x: 185, y: 60},
        {x: 215, y: 100},
        {x: 245, y: 70},
        {x: 275, y: 110}
    ];
    // Draw line segments as thick rectangles
    for (var i = 0; i < points.length - 1; i++) {
        var p1 = points[i];
        var p2 = points[i + 1];
        var steps = Math.max(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
        for (var s = 0; s <= steps; s++) {
            var t = s / steps;
            var px = Math.round(p1.x + (p2.x - p1.x) * t);
            var py = Math.round(p1.y + (p2.y - p1.y) * t);
            fillRect(rows, px - 1, py - 1, 4, 4, ar, ag, ab);
        }
    }
    // Filled area under line (partial)
    fillRect(rows, 20, 150, 255, 20, ar, ag, ab);
    // Axis lines
    fillRect(rows, 20, 170, 255, 3, ar, ag, ab);
    fillRect(rows, 20, 30, 3, 140, ar, ag, ab);
}

function drawTimelineSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    // 5 horizontal event bars of varying widths (event feed rows)
    var yPositions = [30, 65, 100, 135, 165];
    var widths     = [220, 140, 190, 110, 160];
    var barH = 22;
    for (var i = 0; i < yPositions.length; i++) {
        fillRect(rows, 30, yPositions[i], widths[i], barH, ar, ag, ab);
    }
    // Left time indicator dots
    for (var j = 0; j < yPositions.length; j++) {
        fillRect(rows, 12, yPositions[j] + 6, 10, 10, ar, ag, ab);
    }
}

function drawRadarSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    // Approximate hexagonal radar with concentric rect outlines and spokes
    var cx = 150, cy = 100;
    var sizes = [70, 50, 30, 15];
    // Concentric hexagonal approximation using rotated rects
    for (var i = 0; i < sizes.length; i++) {
        var s = sizes[i];
        // Top/bottom horizontal bars of hexagon
        fillRect(rows, cx - s, cy - Math.round(s * 0.6), s * 2, 4, ar, ag, ab);
        fillRect(rows, cx - s, cy + Math.round(s * 0.6), s * 2, 4, ar, ag, ab);
        // Left/right edges
        fillRect(rows, cx - s - 2, cy - Math.round(s * 0.6), 4, Math.round(s * 1.2) + 4, ar, ag, ab);
        fillRect(rows, cx + s - 2, cy - Math.round(s * 0.6), 4, Math.round(s * 1.2) + 4, ar, ag, ab);
    }
    // 6 spokes from center
    var spokeAngles = [0, 60, 120, 180, 240, 300];
    for (var k = 0; k < spokeAngles.length; k++) {
        var rad = spokeAngles[k] * Math.PI / 180;
        var spokeLen = 65;
        var steps = spokeLen;
        for (var s2 = 0; s2 <= steps; s2++) {
            var t = s2 / steps;
            var px = Math.round(cx + Math.cos(rad) * spokeLen * t);
            var py = Math.round(cy + Math.sin(rad) * spokeLen * t);
            fillRect(rows, px, py, 2, 2, ar, ag, ab);
        }
    }
}

function drawProgressSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    // 4 horizontal progress bar segments at different fill percentages
    var barY    = [30, 75, 120, 160];
    var barH    = 22;
    var maxW    = 240;
    var fills   = [0.82, 0.57, 0.95, 0.43];
    for (var i = 0; i < 4; i++) {
        // Track (dim background behind bar)
        fillRect(rows, 50, barY[i], maxW, barH, ar, ag, ab);
        // Filled portion (use brighter color -- overdraw with bg to show unfilled part)
        var unfillX = 50 + Math.round(maxW * fills[i]);
        var unfillW = Math.round(maxW * (1 - fills[i]));
        if (unfillW > 0) {
            // Darken the unfilled section by drawing bg-blended rect
            fillRect(rows, unfillX, barY[i], unfillW, barH,
                Math.round((ar + bgr * 3) / 4),
                Math.round((ag + bgg * 3) / 4),
                Math.round((ab + bgb * 3) / 4));
        }
        // Label stub on left
        fillRect(rows, 10, barY[i] + 4, 35, 10, ar, ag, ab);
    }
}

function drawScatterSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    // Axis lines
    fillRect(rows, 25, 170, 250, 3, ar, ag, ab);  // x-axis
    fillRect(rows, 25, 20, 3, 150, ar, ag, ab);   // y-axis
    // 12 data points as filled squares (approximating circles)
    var points = [
        {x: 60,  y: 140, r: 8},  {x: 90,  y: 100, r: 12},
        {x: 130, y: 130, r: 6},  {x: 160, y: 70,  r: 10},
        {x: 185, y: 50,  r: 14}, {x: 200, y: 110, r: 7},
        {x: 220, y: 85,  r: 9},  {x: 75,  y: 60,  r: 5},
        {x: 110, y: 45,  r: 11}, {x: 245, y: 40,  r: 8},
        {x: 245, y: 120, r: 6},  {x: 145, y: 150, r: 7}
    ];
    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        fillRect(rows, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2, ar, ag, ab);
    }
}

function drawNetworkSilhouette(rows, ar, ag, ab, bgr, bgg, bgb) {
    var nodes = [
        {x: 150, y: 100},  // center hub
        {x: 80,  y: 50},  {x: 220, y: 50},
        {x: 60,  y: 130}, {x: 240, y: 130},
        {x: 100, y: 165}, {x: 200, y: 165},
        {x: 150, y: 170}
    ];
    // Edges from hub to spokes
    var hub = nodes[0];
    for (var i = 1; i < nodes.length; i++) {
        var n = nodes[i];
        var steps = Math.max(Math.abs(n.x - hub.x), Math.abs(n.y - hub.y));
        for (var s = 0; s <= steps; s++) {
            var t = s / steps;
            var px = Math.round(hub.x + (n.x - hub.x) * t);
            var py = Math.round(hub.y + (n.y - hub.y) * t);
            fillRect(rows, px, py, 2, 2, ar, ag, ab);
        }
    }
    // Peripheral ring edges
    var ring = [1, 2, 4, 7, 6, 5, 3];
    for (var j = 0; j < ring.length - 1; j++) {
        var n1 = nodes[ring[j]], n2 = nodes[ring[j + 1]];
        var steps2 = Math.max(Math.abs(n2.x - n1.x), Math.abs(n2.y - n1.y));
        for (var k = 0; k <= steps2; k++) {
            var t2 = k / steps2;
            var px2 = Math.round(n1.x + (n2.x - n1.x) * t2);
            var py2 = Math.round(n1.y + (n2.y - n1.y) * t2);
            fillRect(rows, px2, py2, 2, 2, ar, ag, ab);
        }
    }
    // Node dots (hub larger)
    for (var ni = 0; ni < nodes.length; ni++) {
        var r = (ni === 0) ? 8 : 5;
        fillRect(rows, nodes[ni].x - r, nodes[ni].y - r, r * 2, r * 2, ar, ag, ab);
    }
}

function drawSilhouette(rows, type, ar, ag, ab, bgr, bgg, bgb) {
    if (type === 'bars')     { drawBarsSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'gauge')    { drawGaugeSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'grid')     { drawGridSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'line')     { drawLineSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'timeline') { drawTimelineSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'radar')    { drawRadarSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'progress') { drawProgressSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'scatter')  { drawScatterSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'network')  { drawNetworkSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    // Default: kpi
    drawKpiSilhouette(rows, ar, ag, ab, bgr, bgg, bgb);
}

// ---- Asset generators ----

/*
 * generateAppIcon(appDir, dark):
 * Creates static/appIcon.png (36x36) and static/appIcon_2x.png (72x72).
 * Icon: accent background + white initial letter from basename(appDir).
 */
function generateAppIcon(appDir, dark) {
    var accentRgb = hexToRgb(dark.accent);
    var ar = accentRgb[0], ag = accentRgb[1], ab = accentRgb[2];

    var baseName = path.basename(appDir);
    var initial = baseName[0] ? baseName[0].toUpperCase() : 'S';
    if (!FONT_GLYPHS[initial]) { initial = '*'; }

    var iconDir = path.join(appDir, 'static');
    if (!fs.existsSync(iconDir)) { fs.mkdirSync(iconDir, { recursive: true }); }

    // 36x36 icon (scale=4: glyph is 20x28px, centered in 36x36)
    var W1 = 36, H1 = 36, scale1 = 4;
    var glyphW1 = 5 * scale1, glyphH1 = 7 * scale1; // 20x28
    var ox1 = Math.round((W1 - glyphW1) / 2);
    var oy1 = Math.round((H1 - glyphH1) / 2);
    var rows1 = makeRgbRows(W1, H1, ar, ag, ab);
    drawLetter(rows1, initial, ox1, oy1, scale1, 255, 255, 255);
    var png1 = makePng(W1, H1, rows1);
    fs.writeFileSync(path.join(iconDir, 'appIcon.png'), png1);

    // 72x72 icon (scale=8: glyph is 40x56px, centered in 72x72)
    var W2 = 72, H2 = 72, scale2 = 8;
    var glyphW2 = 5 * scale2, glyphH2 = 7 * scale2; // 40x56
    var ox2 = Math.round((W2 - glyphW2) / 2);
    var oy2 = Math.round((H2 - glyphH2) / 2);
    var rows2 = makeRgbRows(W2, H2, ar, ag, ab);
    drawLetter(rows2, initial, ox2, oy2, scale2, 255, 255, 255);
    var png2 = makePng(W2, H2, rows2);
    fs.writeFileSync(path.join(iconDir, 'appIcon_2x.png'), png2);
}

/*
 * generatePreviews(appDir, dark):
 * Creates appserver/static/visualizations/<viz>/preview.png (300x200) for each viz subdirectory.
 * Silhouette style is determined by viz directory name.
 */
function generatePreviews(appDir, dark) {
    var previewRgb = previewContrastAccent(dark.accent, dark.bg);
    var ar = previewRgb[0], ag = previewRgb[1], ab = previewRgb[2];
    var bgRgb = hexToRgb(dark.bg);
    var bgr = bgRgb[0], bgg = bgRgb[1], bgb = bgRgb[2];

    var vizRoot = path.join(appDir, 'appserver', 'static', 'visualizations');
    if (!fs.existsSync(vizRoot)) {
        process.stdout.write('  INFO: no visualizations directory at ' + vizRoot + '\n');
        return;
    }

    var entries = fs.readdirSync(vizRoot);
    for (var i = 0; i < entries.length; i++) {
        var name = entries[i];
        var vizDir = path.join(vizRoot, name);
        try {
            var stat = fs.statSync(vizDir);
            if (!stat.isDirectory()) { continue; }
        } catch (e) {
            continue;
        }

        // Try @viz-type annotation from source file first, fall back to keyword detection
        var type = null;
        var srcPath = path.join(vizDir, 'src', 'visualization_source.js');
        if (!fs.existsSync(srcPath)) { srcPath = path.join(vizDir, 'visualization_source.js'); }
        if (fs.existsSync(srcPath)) {
            try {
                var firstLine = fs.readFileSync(srcPath, 'utf8').split('\n')[0];
                var match = firstLine.match(/\/\/\s*@viz-type:\s*(\S+)/);
                if (match) { type = match[1].toLowerCase(); }
            } catch (e) {}
        }
        if (!type) { type = detectVizType(name); }
        var W = 300, H = 200;
        var rows = makeRgbRows(W, H, bgr, bgg, bgb);
        drawSilhouette(rows, type, ar, ag, ab, bgr, bgg, bgb);

        var pngBuf = makePng(W, H, rows);
        var outPath = path.join(vizDir, 'preview.png');
        fs.writeFileSync(outPath, pngBuf);
        process.stdout.write('  wrote: ' + outPath + '\n');
    }
}

/*
 * generateGradientBg(appDir, dark, light):
 * Creates appserver/static/images/bg_gradient.png (1920x1080) using dark theme.
 * Also creates bg_gradient_light.png using light theme (or safe fallback if light is null).
 * Gradient: diagonal from bg (top-left) to panel (bottom-right, 60% blend for dark / 0.4 for light),
 * with a radial accent glow at 30% left / 20% top.
 * If panel is not available, falls back to bg (solid color, no gradient).
 */
function generateGradientBg(appDir, dark, light) {
    var W = 1920, H = 1080;
    var imagesDir = path.join(appDir, 'appserver', 'static', 'images');
    fs.mkdirSync(imagesDir, { recursive: true });

    // --- dark variant ---
    var bgRgb = hexToRgb(dark.bg);
    var bottomRightRgb;
    if (dark.panel && isHex(dark.panel)) {
        var panelRgb = hexToRgb(dark.panel);
        bottomRightRgb = [
            Math.round(bgRgb[0] + (panelRgb[0] - bgRgb[0]) * 0.6),
            Math.round(bgRgb[1] + (panelRgb[1] - bgRgb[1]) * 0.6),
            Math.round(bgRgb[2] + (panelRgb[2] - bgRgb[2]) * 0.6)
        ];
    } else {
        bottomRightRgb = [bgRgb[0], bgRgb[1], bgRgb[2]];
    }
    var accentRgb = hexToRgb(dark.accent);
    var accentCx = Math.round(W * 0.3);
    var accentCy = Math.round(H * 0.2);
    var accentR = 600;
    var rows = makeGradientRows(W, H, bgRgb, bottomRightRgb, accentRgb, accentCx, accentCy, accentR);
    var pngBuf = makePng(W, H, rows);
    var outPath = path.join(imagesDir, 'bg_gradient.png');
    fs.writeFileSync(outPath, pngBuf);
    process.stdout.write('  wrote: ' + outPath + '\n');

    // --- light variant ---
    var lightTheme = light || { bg: '#F0F2F5', panel: '#FFFFFF', accent: dark.accent };
    var lBgRgb = hexToRgb(lightTheme.bg || '#F0F2F5');
    var lBottomRightRgb;
    if (lightTheme.panel && isHex(lightTheme.panel)) {
        var lPanelRgb = hexToRgb(lightTheme.panel);
        lBottomRightRgb = [
            Math.round(lBgRgb[0] + (lPanelRgb[0] - lBgRgb[0]) * 0.4),
            Math.round(lBgRgb[1] + (lPanelRgb[1] - lBgRgb[1]) * 0.4),
            Math.round(lBgRgb[2] + (lPanelRgb[2] - lBgRgb[2]) * 0.4)
        ];
    } else {
        lBottomRightRgb = [lBgRgb[0], lBgRgb[1], lBgRgb[2]];
    }
    var lAccentRgb = hexToRgb(lightTheme.accent || dark.accent);
    var lRows = makeGradientRows(W, H, lBgRgb, lBottomRightRgb, lAccentRgb, accentCx, accentCy, 400);
    var lPngBuf = makePng(W, H, lRows);
    var lOutPath = path.join(imagesDir, 'bg_gradient_light.png');
    fs.writeFileSync(lOutPath, lPngBuf);
    process.stdout.write('  wrote: ' + lOutPath + '\n');
}

/*
 * generateSolidBg(appDir, dark, light):
 * Creates bg_gradient.png (dark) and bg_gradient_light.png (light) as solid fills
 * with subtle LCG noise (15% of pixels perturbed by delta in -7..+8 range).
 */
function generateSolidBg(appDir, dark, light) {
    var W = 1920, H = 1080;
    var imagesDir = path.join(appDir, 'appserver', 'static', 'images');
    fs.mkdirSync(imagesDir, { recursive: true });

    // Linear congruential generator: seed=12345, mult=1664525, inc=1013904223
    function makeSolidRows(baseRgb) {
        var rows = makeRgbRows(W, H, baseRgb[0], baseRgb[1], baseRgb[2]);
        var lcg = 12345;
        var noisePixels = Math.round(W * H * 0.15);
        for (var i = 0; i < noisePixels; i++) {
            lcg = ((Math.imul ? Math.imul(lcg, 1664525) : ((lcg * 1664525) | 0)) + 1013904223) | 0;
            var idx = ((lcg >>> 0) % (W * H));
            var px = idx % W;
            var py = Math.floor(idx / W);
            var row = rows[py];
            lcg = ((Math.imul ? Math.imul(lcg, 1664525) : ((lcg * 1664525) | 0)) + 1013904223) | 0;
            var delta = ((lcg >>> 0) & 0xF) - 7; // -7..+8
            var base3 = px * 3;
            row[base3]     = Math.max(0, Math.min(255, row[base3]     + delta));
            row[base3 + 1] = Math.max(0, Math.min(255, row[base3 + 1] + delta));
            row[base3 + 2] = Math.max(0, Math.min(255, row[base3 + 2] + delta));
        }
        return rows;
    }

    // dark variant
    var dRows = makeSolidRows(hexToRgb(dark.bg));
    fs.writeFileSync(path.join(imagesDir, 'bg_gradient.png'), makePng(W, H, dRows));
    process.stdout.write('  wrote: ' + path.join(imagesDir, 'bg_gradient.png') + '\n');

    // light variant
    var lightTheme = light || { bg: '#F0F2F5' };
    var lRows = makeSolidRows(hexToRgb(lightTheme.bg || '#F0F2F5'));
    fs.writeFileSync(path.join(imagesDir, 'bg_gradient_light.png'), makePng(W, H, lRows));
    process.stdout.write('  wrote: ' + path.join(imagesDir, 'bg_gradient_light.png') + '\n');
}

/*
 * fillRectBlend(rows, rx, ry, rw, rh, accentRgb, alpha):
 * Blend accentRgb into existing pixels at alpha (0..1) within the rectangle.
 */
function fillRectBlend(rows, rx, ry, rw, rh, accentRgb, alpha) {
    var imgH = rows.length;
    var imgW = imgH > 0 ? rows[0].length / 3 : 0;
    var x1 = Math.max(0, rx);
    var y1 = Math.max(0, ry);
    var x2 = Math.min(imgW, rx + rw);
    var y2 = Math.min(imgH, ry + rh);
    var ar = accentRgb[0], ag = accentRgb[1], ab = accentRgb[2];
    for (var py = y1; py < y2; py++) {
        var row = rows[py];
        for (var px = x1; px < x2; px++) {
            var i3 = px * 3;
            row[i3]     = Math.round(row[i3]     + (ar - row[i3])     * alpha);
            row[i3 + 1] = Math.round(row[i3 + 1] + (ag - row[i3 + 1]) * alpha);
            row[i3 + 2] = Math.round(row[i3 + 2] + (ab - row[i3 + 2]) * alpha);
        }
    }
}

/*
 * generatePatternBg(appDir, dark, light, bgPattern):
 * Creates bg_gradient.png (dark) and bg_gradient_light.png (light) with geometric pattern overlay.
 * Pattern types: 'circuit' (default), 'dot_matrix', 'hex_grid', 'topo'.
 */
function generatePatternBg(appDir, dark, light, bgPattern) {
    var W = 1920, H = 1080;
    var imagesDir = path.join(appDir, 'appserver', 'static', 'images');
    fs.mkdirSync(imagesDir, { recursive: true });

    var pat = bgPattern || 'circuit';

    function applyPattern(rows, accentRgb, alpha) {
        var px, py;
        if (pat === 'dot_matrix') {
            // Grid of 4x4 squares at 60px spacing
            for (py = 0; py < H; py += 60) {
                for (px = 0; px < W; px += 60) {
                    fillRectBlend(rows, px, py, 4, 4, accentRgb, alpha);
                }
            }
        } else if (pat === 'hex_grid') {
            // Hex grid using center calculation
            var hexR = 40;
            var hexH = Math.round(Math.sqrt(3) * hexR);
            for (py = 0; py < H; py++) {
                for (px = 0; px < W; px++) {
                    // Find nearest hex center
                    var col = Math.round(px / (hexR * 1.5));
                    var row0 = Math.round((py - (col % 2) * hexH / 2) / hexH);
                    var cx0 = col * hexR * 1.5;
                    var cy0 = row0 * hexH + (col % 2) * hexH / 2;
                    var dx = px - cx0;
                    var dy = py - cy0;
                    // Hex boundary: use angular distance
                    var angle = Math.atan2(dy, dx);
                    // Distance from hex edge at this angle (simplified: use distance to center vs hexR)
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    var borderDist = hexR - dist;
                    if (borderDist >= 0 && borderDist < 2) {
                        fillRectBlend(rows, px, py, 1, 1, accentRgb, alpha);
                    }
                }
            }
        } else if (pat === 'topo') {
            // Topographic lines using sine waves
            for (py = 0; py < H; py++) {
                for (px = 0; px < W; px++) {
                    var elev = Math.sin(px * 0.02 + 3 * Math.sin(py * 0.015)) + 0.7 * Math.cos(px * 0.03 + py * 0.025);
                    if (Math.abs(elev % 0.4) < 0.03) {
                        fillRectBlend(rows, px, py, 1, 1, accentRgb, alpha);
                    }
                }
            }
        } else {
            // 'circuit' (default): horizontal and vertical line segments on 80px grid
            var spacing = 80;
            for (py = 0; py < H; py += spacing) {
                for (px = 0; px < W; px += spacing) {
                    // Horizontal segment (40px wide, 2px tall)
                    fillRectBlend(rows, px, py, 40, 2, accentRgb, alpha);
                    // Vertical segment (2px wide, 40px tall)
                    fillRectBlend(rows, px, py, 2, 40, accentRgb, alpha);
                }
            }
        }
    }

    // dark variant: gradient base + pattern overlay at 12%
    var darkBgRgb = hexToRgb(dark.bg);
    var darkPanelRgb = dark.panel && isHex(dark.panel) ? hexToRgb(dark.panel) : darkBgRgb;
    var darkBottomRight = [
        Math.round(darkBgRgb[0] + (darkPanelRgb[0] - darkBgRgb[0]) * 0.6),
        Math.round(darkBgRgb[1] + (darkPanelRgb[1] - darkBgRgb[1]) * 0.6),
        Math.round(darkBgRgb[2] + (darkPanelRgb[2] - darkBgRgb[2]) * 0.6)
    ];
    var darkAccentRgb = hexToRgb(dark.accent);
    var dRows = makeGradientRows(W, H, darkBgRgb, darkBottomRight, darkAccentRgb,
        Math.round(W * 0.3), Math.round(H * 0.2), 600);
    applyPattern(dRows, darkAccentRgb, 0.12);
    fs.writeFileSync(path.join(imagesDir, 'bg_gradient.png'), makePng(W, H, dRows));
    process.stdout.write('  wrote: ' + path.join(imagesDir, 'bg_gradient.png') + '\n');

    // light variant: light base + pattern overlay at 8%
    var lightTheme = light || { bg: '#F0F2F5', panel: '#FFFFFF', accent: dark.accent };
    var lBgRgb = hexToRgb(lightTheme.bg || '#F0F2F5');
    var lPanelRgb = lightTheme.panel && isHex(lightTheme.panel) ? hexToRgb(lightTheme.panel) : lBgRgb;
    var lBottomRight = [
        Math.round(lBgRgb[0] + (lPanelRgb[0] - lBgRgb[0]) * 0.4),
        Math.round(lBgRgb[1] + (lPanelRgb[1] - lBgRgb[1]) * 0.4),
        Math.round(lBgRgb[2] + (lPanelRgb[2] - lBgRgb[2]) * 0.4)
    ];
    var lAccentRgb = hexToRgb(lightTheme.accent || dark.accent);
    var lRows = makeGradientRows(W, H, lBgRgb, lBottomRight, lAccentRgb,
        Math.round(W * 0.3), Math.round(H * 0.2), 400);
    applyPattern(lRows, lAccentRgb, 0.08);
    fs.writeFileSync(path.join(imagesDir, 'bg_gradient_light.png'), makePng(W, H, lRows));
    process.stdout.write('  wrote: ' + path.join(imagesDir, 'bg_gradient_light.png') + '\n');
}

/*
 * generatePhotoBg(appDir, dark, light):
 * Creates bg_gradient.png and bg_gradient_light.png using shared/bg_photo.png as overlay.
 * Falls back to generateGradientBg() if:
 *   - shared/bg_photo.png is absent
 *   - PNG signature mismatch
 *   - Any decode error
 * T-25-02: zlib.inflateSync wrapped in try/catch — on any error, fall back to gradient.
 */
function generatePhotoBg(appDir, dark, light) {
    var photoPath = path.join(appDir, 'shared', 'bg_photo.png');

    // Check for photo file
    if (!fs.existsSync(photoPath)) {
        process.stdout.write('  INFO: shared/bg_photo.png not found; falling back to gradient\n');
        generateGradientBg(appDir, dark, light);
        return;
    }

    var photoBuf;
    try {
        photoBuf = fs.readFileSync(photoPath);
    } catch (e) {
        process.stderr.write('  WARN: could not read shared/bg_photo.png: ' + String(e) + '; falling back to gradient\n');
        generateGradientBg(appDir, dark, light);
        return;
    }

    // Check PNG signature
    var SIG = [137, 80, 78, 71, 13, 10, 26, 10];
    for (var si = 0; si < 8; si++) {
        if (photoBuf[si] !== SIG[si]) {
            process.stderr.write('  WARN: shared/bg_photo.png has invalid PNG signature; falling back to gradient\n');
            generateGradientBg(appDir, dark, light);
            return;
        }
    }

    // Read IHDR chunk for dimensions (bytes 16-19=width, 20-23=height)
    var photoW, photoH;
    try {
        photoW = photoBuf.readUInt32BE(16);
        photoH = photoBuf.readUInt32BE(20);
    } catch (e) {
        process.stderr.write('  WARN: could not read photo dimensions; falling back to gradient\n');
        generateGradientBg(appDir, dark, light);
        return;
    }

    // Attempt minimal PNG decode — collect IDAT chunks and inflate
    var photoData = null;
    try {
        var idatChunks = [];
        var offset = 8; // skip signature
        while (offset + 12 <= photoBuf.length) {
            var chunkLen = photoBuf.readUInt32BE(offset);
            var chunkType = photoBuf.slice(offset + 4, offset + 8).toString('ascii');
            var chunkData = photoBuf.slice(offset + 8, offset + 8 + chunkLen);
            if (chunkType === 'IDAT') { idatChunks.push(chunkData); }
            if (chunkType === 'IEND') { break; }
            offset += 12 + chunkLen;
        }
        if (idatChunks.length === 0) { throw new Error('no IDAT chunks'); }
        var idatBuf = Buffer.concat(idatChunks);
        // T-25-02: wrap inflate in try/catch
        var inflated = zlib.inflateSync(idatBuf);
        // Build pixel grid from scanlines (filter byte 0 = None assumed)
        var bytesPerPixel = 3; // RGB
        var scanlineLen = 1 + photoW * bytesPerPixel;
        photoData = [];
        for (var sy = 0; sy < photoH; sy++) {
            var scanRow = [];
            var scanOff = sy * scanlineLen + 1; // skip filter byte
            for (var sx = 0; sx < photoW; sx++) {
                scanRow.push(
                    inflated[scanOff + sx * bytesPerPixel]     || 0,
                    inflated[scanOff + sx * bytesPerPixel + 1] || 0,
                    inflated[scanOff + sx * bytesPerPixel + 2] || 0
                );
            }
            photoData.push(scanRow);
        }
    } catch (e) {
        process.stderr.write('  WARN: PNG decode failed (' + String(e) + '); falling back to gradient\n');
        generateGradientBg(appDir, dark, light);
        return;
    }

    // Bilinear sample from photo data
    function samplePhoto(px, py, data, srcW, srcH) {
        var sx = Math.max(0, Math.min(srcW - 1, Math.round(px / 1919 * (srcW - 1))));
        var sy = Math.max(0, Math.min(srcH - 1, Math.round(py / 1079 * (srcH - 1))));
        var row = data[sy];
        var i3 = sx * 3;
        return [row[i3] || 0, row[i3 + 1] || 0, row[i3 + 2] || 0];
    }

    var W = 1920, H = 1080;
    var imagesDir = path.join(appDir, 'appserver', 'static', 'images');
    fs.mkdirSync(imagesDir, { recursive: true });

    // dark variant: gradient base + 55% photo overlay
    var darkBgRgb = hexToRgb(dark.bg);
    var darkPanelRgb = dark.panel && isHex(dark.panel) ? hexToRgb(dark.panel) : darkBgRgb;
    var darkBottomRight = [
        Math.round(darkBgRgb[0] + (darkPanelRgb[0] - darkBgRgb[0]) * 0.6),
        Math.round(darkBgRgb[1] + (darkPanelRgb[1] - darkBgRgb[1]) * 0.6),
        Math.round(darkBgRgb[2] + (darkPanelRgb[2] - darkBgRgb[2]) * 0.6)
    ];
    var darkAccentRgb = hexToRgb(dark.accent);
    var dRows = makeGradientRows(W, H, darkBgRgb, darkBottomRight, darkAccentRgb,
        Math.round(W * 0.3), Math.round(H * 0.2), 600);
    for (var dy = 0; dy < H; dy++) {
        for (var dx = 0; dx < W; dx++) {
            var photoPixel = samplePhoto(dx, dy, photoData, photoW, photoH);
            var i3 = dx * 3;
            dRows[dy][i3]     = Math.round(photoPixel[0] * 0.55 + dRows[dy][i3]     * 0.45);
            dRows[dy][i3 + 1] = Math.round(photoPixel[1] * 0.55 + dRows[dy][i3 + 1] * 0.45);
            dRows[dy][i3 + 2] = Math.round(photoPixel[2] * 0.55 + dRows[dy][i3 + 2] * 0.45);
        }
    }
    fs.writeFileSync(path.join(imagesDir, 'bg_gradient.png'), makePng(W, H, dRows));
    process.stdout.write('  wrote: ' + path.join(imagesDir, 'bg_gradient.png') + '\n');

    // light variant: light base + 15% photo overlay
    var lightTheme = light || { bg: '#F0F2F5', panel: '#FFFFFF', accent: dark.accent };
    var lBgRgb = hexToRgb(lightTheme.bg || '#F0F2F5');
    var lPanelRgb = lightTheme.panel && isHex(lightTheme.panel) ? hexToRgb(lightTheme.panel) : lBgRgb;
    var lBottomRight = [
        Math.round(lBgRgb[0] + (lPanelRgb[0] - lBgRgb[0]) * 0.4),
        Math.round(lBgRgb[1] + (lPanelRgb[1] - lBgRgb[1]) * 0.4),
        Math.round(lBgRgb[2] + (lPanelRgb[2] - lBgRgb[2]) * 0.4)
    ];
    var lAccentRgb = hexToRgb(lightTheme.accent || dark.accent);
    var lRows = makeGradientRows(W, H, lBgRgb, lBottomRight, lAccentRgb,
        Math.round(W * 0.3), Math.round(H * 0.2), 400);
    for (var ly = 0; ly < H; ly++) {
        for (var lx = 0; lx < W; lx++) {
            var lPhotoPixel = samplePhoto(lx, ly, photoData, photoW, photoH);
            var li3 = lx * 3;
            lRows[ly][li3]     = Math.round(lPhotoPixel[0] * 0.15 + lRows[ly][li3]     * 0.85);
            lRows[ly][li3 + 1] = Math.round(lPhotoPixel[1] * 0.15 + lRows[ly][li3 + 1] * 0.85);
            lRows[ly][li3 + 2] = Math.round(lPhotoPixel[2] * 0.15 + lRows[ly][li3 + 2] * 0.85);
        }
    }
    fs.writeFileSync(path.join(imagesDir, 'bg_gradient_light.png'), makePng(W, H, lRows));
    process.stdout.write('  wrote: ' + path.join(imagesDir, 'bg_gradient_light.png') + '\n');
}

/*
 * generateBackground(appDir, dark, light, visualLang):
 * Dispatcher that routes to the appropriate background generator based on visualLang.backgroundType.
 * Falls back to gradient if backgroundType is absent or unknown.
 */
function generateBackground(appDir, dark, light, visualLang) {
    var bgType = (visualLang && visualLang.backgroundType) ? visualLang.backgroundType : 'gradient';
    var bgPat  = (visualLang && visualLang.backgroundPattern) ? visualLang.backgroundPattern : 'circuit';
    if (bgType === 'pattern') {
        generatePatternBg(appDir, dark, light, bgPat);
    } else if (bgType === 'solid') {
        generateSolidBg(appDir, dark, light);
    } else if (bgType === 'photo') {
        generatePhotoBg(appDir, dark, light);
    } else {
        // 'gradient' and any unknown value
        generateGradientBg(appDir, dark, light);
    }
}

// ---- Main ----

function main() {
    var themeJsPath = path.join(appDir, 'shared', 'theme.js');

    if (!fs.existsSync(themeJsPath)) {
        process.stderr.write('Error: shared/theme.js not found: ' + themeJsPath + '\n');
        process.exit(1);
    }

    var themeModule;
    try {
        themeModule = require(themeJsPath);
    } catch (e) {
        process.stderr.write('Error: could not load theme.js: ' + themeJsPath + '\n');
        process.stderr.write('  ' + String(e) + '\n');
        process.exit(1);
    }

    if (typeof themeModule.getTheme !== 'function') {
        process.stderr.write('Error: theme.js does not export getTheme(name): ' + themeJsPath + '\n');
        process.exit(1);
    }

    var dark = themeModule.getTheme('dark');
    if (!dark || !dark.accent) {
        process.stderr.write('Error: getTheme("dark") did not return an object with .accent\n');
        process.exit(1);
    }

    // Load light theme -- fall back to safe defaults if getTheme('light') is unavailable or throws
    var light;
    try {
        light = themeModule.getTheme('light');
        if (!light || typeof light !== 'object') {
            light = { bg: '#F0F2F5', panel: '#FFFFFF', accent: dark.accent, text: '#1D2033' };
        }
    } catch (e) {
        light = { bg: '#F0F2F5', panel: '#FFFFFF', accent: dark.accent, text: '#1D2033' };
    }

    // Load visual language -- silently default to empty if not present (backward compat T11)
    var visualLang = themeModule.VISUAL_LANG || {};

    var errors = 0;

    try {
        generateAppIcon(appDir, dark);
        process.stdout.write('  wrote: ' + path.join(appDir, 'static', 'appIcon.png') + '\n');
        process.stdout.write('  wrote: ' + path.join(appDir, 'static', 'appIcon_2x.png') + '\n');
    } catch (e) {
        process.stderr.write('Error generating appIcon: ' + String(e) + '\n');
        errors++;
    }

    try {
        generatePreviews(appDir, dark);
    } catch (e) {
        process.stderr.write('Error generating previews: ' + String(e) + '\n');
        errors++;
    }

    try {
        generateBackground(appDir, dark, light, visualLang);
    } catch (e) {
        process.stderr.write('Error generating background: ' + String(e) + '\n');
        errors++;
    }

    process.exit(errors > 0 ? 1 : 0);
}

main();
