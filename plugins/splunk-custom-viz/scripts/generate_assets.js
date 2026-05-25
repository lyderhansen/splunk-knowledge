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
 *   <app_dir>/appserver/static/visualizations/<viz>/preview.png (116x76 per viz)
 *   <app_dir>/appserver/static/images/bg_gradient.png (1920x1080) -- branded gradient background
 *
 * theme.js is loaded via require() + getTheme('dark') -- no eval(), no regex parsing.
 * Zero external npm dependencies -- only built-in Node.js modules: fs, path, zlib.
 *
 * Pure ES5 CJS -- no const/let/arrow functions/template literals/class/destructuring.
 */

'use strict';

var fs   = require('fs');
var VIZ_LABEL = '';  // set by generatePreviews before calling drawSilhouette
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

// ---- Silhouette draw functions (116x76 canvas) ----
// All coordinates are pre-scaled from the original 300x200 grid using
// SCALE_X = 116/300 ~= 0.387, SCALE_Y = 76/200 = 0.38.
// Each function accepts s1r, s1g, s1b as secondary color for contrast fills.











// Per-type silhouette renderers — each draws a recognizable shape for that viz family.
// Canvas: 116x76. Drawing area: x∈[8,108], y∈[8,60]. Bottom 6px reserved for accent bar.
// All shapes use accent (ar,ag,ab) as primary; secondary (s1r,s1g,s1b) for outlines/contrast.

function _drawGauge(rows, ar, ag, ab, s1r, s1g, s1b) {
    // 9 segments forming a semicircle, like a battery / RPM gauge
    var cx = 58, cy = 50, segs = 9;
    for (var i = 0; i < segs; i++) {
        var ang = Math.PI + (Math.PI / (segs - 1)) * i;
        var px = Math.round(cx + Math.cos(ang) * 38);
        var py = Math.round(cy + Math.sin(ang) * 24);
        var r = (i < 6) ? ar : s1r, g = (i < 6) ? ag : s1g, b = (i < 6) ? ab : s1b;
        fillRect(rows, px - 3, py - 3, 6, 6, r, g, b);
    }
    fillRect(rows, cx - 2, cy - 2, 4, 4, ar, ag, ab);
}

function _drawBars(rows, ar, ag, ab, s1r, s1g, s1b) {
    var heights = [22, 36, 28, 44, 18];
    var x = 22;
    for (var i = 0; i < heights.length; i++) {
        var h = heights[i];
        var r = (i === 3) ? ar : s1r, g = (i === 3) ? ag : s1g, b = (i === 3) ? ab : s1b;
        fillRect(rows, x, 60 - h, 12, h, r, g, b);
        x += 16;
    }
}

function _drawLine(rows, ar, ag, ab, s1r, s1g, s1b) {
    var pts = [
        {x: 12, y: 48}, {x: 24, y: 36}, {x: 36, y: 42}, {x: 48, y: 28},
        {x: 60, y: 32}, {x: 72, y: 20}, {x: 84, y: 26}, {x: 96, y: 18}, {x: 104, y: 14}
    ];
    for (var i = 0; i < pts.length - 1; i++) {
        var dx = pts[i + 1].x - pts[i].x;
        var dy = pts[i + 1].y - pts[i].y;
        var steps = Math.max(Math.abs(dx), Math.abs(dy));
        for (var s = 0; s <= steps; s++) {
            fillRect(rows,
                Math.round(pts[i].x + (dx * s) / steps),
                Math.round(pts[i].y + (dy * s) / steps),
                2, 2, s1r, s1g, s1b);
        }
    }
    var last = pts[pts.length - 1];
    fillRect(rows, last.x - 2, last.y - 2, 5, 5, ar, ag, ab);
}

function _drawTimeline(rows, ar, ag, ab, s1r, s1g, s1b) {
    var lanes = [
        {y: 18, segs: [[14, 24], [44, 18], [78, 20]]},
        {y: 32, segs: [[10, 32], [50, 16], [76, 24]]},
        {y: 46, segs: [[18, 14], [40, 30], [78, 22]]}
    ];
    for (var l = 0; l < lanes.length; l++) {
        fillRect(rows, 10, lanes[l].y + 3, 96, 1, s1r, s1g, s1b);
        for (var s = 0; s < lanes[l].segs.length; s++) {
            var seg = lanes[l].segs[s];
            var isAccent = (l === 1 && s === 1);
            var r = isAccent ? ar : s1r, g = isAccent ? ag : s1g, b = isAccent ? ab : s1b;
            fillRect(rows, seg[0], lanes[l].y, seg[1], 6, r, g, b);
        }
    }
}

function _drawGrid(rows, ar, ag, ab, s1r, s1g, s1b) {
    var cellW = 14, cellH = 11, gap = 2, startX = 12, startY = 12;
    var pattern = [
        [1, 0, 2, 1, 0, 2],
        [2, 1, 1, 2, 1, 0],
        [0, 2, 1, 0, 2, 1],
        [1, 0, 2, 1, 1, 2]
    ];
    for (var ry = 0; ry < 4; ry++) {
        for (var rx = 0; rx < 6; rx++) {
            var v = pattern[ry][rx];
            if (v === 0) continue;
            var r = (v === 2) ? ar : s1r, g = (v === 2) ? ag : s1g, b = (v === 2) ? ab : s1b;
            fillRect(rows,
                startX + rx * (cellW + gap),
                startY + ry * (cellH + gap),
                cellW, cellH, r, g, b);
        }
    }
}

function _drawKpi(rows, ar, ag, ab, s1r, s1g, s1b) {
    // Big-number tile: render two letter-blocks as stand-in for digits + caption bar
    drawLetter(rows, 'I', 30, 14, 5, ar, ag, ab);
    drawLetter(rows, 'O', 56, 14, 5, ar, ag, ab);
    fillRect(rows, 32, 56, 52, 2, s1r, s1g, s1b);
}

function _drawProgress(rows, ar, ag, ab, s1r, s1g, s1b) {
    fillRect(rows, 10, 28, 96, 12, s1r, s1g, s1b);
    fillRect(rows, 10, 28, 62, 12, ar, ag, ab);
    for (var i = 0; i <= 4; i++) {
        var tx = 10 + Math.round((i / 4) * 96);
        fillRect(rows, tx - 1, 44, 2, 4, s1r, s1g, s1b);
    }
}

function _drawScatter(rows, ar, ag, ab, s1r, s1g, s1b) {
    var pts = [
        {x: 18, y: 42, a: 0}, {x: 28, y: 22, a: 1}, {x: 42, y: 50, a: 0},
        {x: 50, y: 30, a: 0}, {x: 60, y: 18, a: 1}, {x: 68, y: 44, a: 0},
        {x: 76, y: 28, a: 0}, {x: 84, y: 14, a: 1}, {x: 92, y: 38, a: 0},
        {x: 22, y: 32, a: 0}, {x: 38, y: 16, a: 1}, {x: 100, y: 26, a: 0}
    ];
    fillRect(rows, 10, 8, 1, 52, s1r, s1g, s1b);
    fillRect(rows, 10, 59, 100, 1, s1r, s1g, s1b);
    for (var i = 0; i < pts.length; i++) {
        var r = pts[i].a ? ar : s1r, g = pts[i].a ? ag : s1g, b = pts[i].a ? ab : s1b;
        var sz = pts[i].a ? 5 : 4;
        fillRect(rows, pts[i].x, pts[i].y, sz, sz, r, g, b);
    }
}

function _drawNetwork(rows, ar, ag, ab, s1r, s1g, s1b) {
    var hub = {x: 58, y: 36};
    var spokes = [
        {x: 18, y: 16}, {x: 96, y: 16}, {x: 100, y: 50}, {x: 28, y: 56}, {x: 14, y: 36}
    ];
    for (var i = 0; i < spokes.length; i++) {
        var dx = spokes[i].x - hub.x, dy = spokes[i].y - hub.y;
        var steps = Math.max(Math.abs(dx), Math.abs(dy));
        for (var s = 0; s <= steps; s += 2) {
            fillRect(rows,
                Math.round(hub.x + (dx * s) / steps),
                Math.round(hub.y + (dy * s) / steps),
                1, 1, s1r, s1g, s1b);
        }
    }
    fillRect(rows, hub.x - 4, hub.y - 4, 9, 9, ar, ag, ab);
    for (var j = 0; j < spokes.length; j++) {
        fillRect(rows, spokes[j].x - 3, spokes[j].y - 3, 6, 6, s1r, s1g, s1b);
    }
}

function _drawRadar(rows, ar, ag, ab, s1r, s1g, s1b) {
    var cx = 58, cy = 36, axes = 6;
    var radii = [22, 18, 26, 16, 20, 24];
    var pts = [];
    for (var i = 0; i < axes; i++) {
        var ang = -Math.PI / 2 + (Math.PI * 2 / axes) * i;
        pts.push({
            x: Math.round(cx + Math.cos(ang) * radii[i]),
            y: Math.round(cy + Math.sin(ang) * radii[i])
        });
        var endx = Math.round(cx + Math.cos(ang) * 28);
        var endy = Math.round(cy + Math.sin(ang) * 28);
        var dxA = endx - cx, dyA = endy - cy;
        var stepsA = Math.max(Math.abs(dxA), Math.abs(dyA));
        for (var s = 0; s <= stepsA; s += 2) {
            fillRect(rows,
                Math.round(cx + (dxA * s) / stepsA),
                Math.round(cy + (dyA * s) / stepsA),
                1, 1, s1r, s1g, s1b);
        }
    }
    for (var p = 0; p < pts.length; p++) {
        var next = pts[(p + 1) % pts.length];
        var dxE = next.x - pts[p].x, dyE = next.y - pts[p].y;
        var stepsE = Math.max(Math.abs(dxE), Math.abs(dyE));
        for (var sE = 0; sE <= stepsE; sE++) {
            fillRect(rows,
                Math.round(pts[p].x + (dxE * sE) / stepsE),
                Math.round(pts[p].y + (dyE * sE) / stepsE),
                2, 2, ar, ag, ab);
        }
    }
}

function drawSilhouette(rows, type, ar, ag, ab, bgr, bgg, bgb, s1r, s1g, s1b) {
    fillRect(rows, 0, 0, 116, 76, bgr, bgg, bgb);
    switch (type) {
        case 'gauge':    _drawGauge(rows, ar, ag, ab, s1r, s1g, s1b); break;
        case 'bars':     _drawBars(rows, ar, ag, ab, s1r, s1g, s1b); break;
        case 'line':     _drawLine(rows, ar, ag, ab, s1r, s1g, s1b); break;
        case 'timeline': _drawTimeline(rows, ar, ag, ab, s1r, s1g, s1b); break;
        case 'grid':     _drawGrid(rows, ar, ag, ab, s1r, s1g, s1b); break;
        case 'kpi':      _drawKpi(rows, ar, ag, ab, s1r, s1g, s1b); break;
        case 'progress': _drawProgress(rows, ar, ag, ab, s1r, s1g, s1b); break;
        case 'scatter':  _drawScatter(rows, ar, ag, ab, s1r, s1g, s1b); break;
        case 'network':  _drawNetwork(rows, ar, ag, ab, s1r, s1g, s1b); break;
        case 'radar':    _drawRadar(rows, ar, ag, ab, s1r, s1g, s1b); break;
        default:
            var letter = (typeof VIZ_LABEL === 'string' && VIZ_LABEL.length > 0)
                ? VIZ_LABEL.charAt(0).toUpperCase() : 'V';
            if (!FONT_GLYPHS[letter]) letter = '*';
            drawLetter(rows, letter, 50, 22, 3, ar, ag, ab);
    }
    fillRect(rows, 0, 76 - 6, 116, 6, ar, ag, ab);
}

// ---- Asset generators ----

// ---- Domain symbol cascade (D-09 / D-10) ----

/*
 * DOMAIN_SYMBOLS: maps domain name to keyword array for app basename matching.
 * Keywords are matched case-insensitively against the app directory basename.
 */
var DOMAIN_SYMBOLS = {
    'healthcare': ['hospital', 'health', 'medical', 'clinic', 'patient', 'pharma', 'nps', 'care'],
    'security':   ['security', 'soc', 'cyber', 'threat', 'firewall', 'intrusion', 'siem', 'ips', 'ids',
                   'cloudflare', 'fortinet', 'crowdstrike'],
    'network':    ['network', 'topology', 'infra', 'router', 'switch', 'bgp', 'ospf', 'dns', 'bandwidth'],
    'automotive': ['car', 'auto', 'vehicle', 'fleet', 'taycan', 'porsche', 'bmw', 'tesla', 'ev', 'driving'],
    'energy':     ['energy', 'power', 'grid', 'solar', 'wind', 'electric', 'utility', 'kwh', 'watt'],
    'finance':    ['finance', 'bank', 'payment', 'revenue', 'cost', 'billing', 'invoice', 'trading',
                   'market', 'stock', 'crypto'],
    'retail':     ['retail', 'store', 'shop', 'ecommerce', 'order', 'inventory', 'checkout', 'cart',
                   'product', 'sku'],
    'aviation':   ['aviation', 'airline', 'flight', 'airport', 'aircraft', 'pilot', 'runway', 'atc'],
    'education':  ['education', 'school', 'university', 'course', 'student', 'learning', 'academy',
                   'campus', 'lms'],
    'tech':       ['saas', 'devops', 'api', 'microservice', 'kubernetes', 'docker', 'cloud', 'aws',
                   'azure', 'gcp', 'ci', 'cd', 'engineering'],
    'music':      ['music', 'audio', 'stream', 'spotify', 'podcast', 'playlist', 'artist', 'album',
                   'track'],
    'sports':     ['sports', 'athlete', 'team', 'score', 'league', 'match', 'fitness', 'gym',
                   'exercise', 'running', 'marathon', 'strava'],
    'food':       ['food', 'restaurant', 'menu', 'recipe', 'delivery', 'kitchen', 'chef', 'dining'],
    'travel':     ['travel', 'hotel', 'booking', 'trip', 'destination', 'tourism', 'vacation',
                   'passport', 'visa'],
    'manufacturing': ['manufacturing', 'factory', 'production', 'assembly', 'iot', 'plc', 'scada',
                      'supply', 'logistics', 'warehouse']
};

/*
 * matchDomain(baseName): return domain name matching baseName keywords, or null.
 */
function matchDomain(baseName) {
    var lower = baseName.toLowerCase();
    for (var domain in DOMAIN_SYMBOLS) {
        if (!DOMAIN_SYMBOLS.hasOwnProperty(domain)) { continue; }
        var keywords = DOMAIN_SYMBOLS[domain];
        for (var k = 0; k < keywords.length; k++) {
            if (lower.indexOf(keywords[k]) !== -1) { return domain; }
        }
    }
    return null;
}

/*
 * drawSymbol(rows, symbolName, ox, oy, r, g, b):
 * Draw a domain-specific icon in a 28x28 area starting at (ox, oy) using fillRect().
 * All 15 symbols are pixel-art shapes using the specified RGB color.
 */
function drawSymbol(rows, symbolName, ox, oy, r, g, b) {
    var x = ox, y = oy;
    if (symbolName === 'healthcare') {
        // White cross: horizontal bar (12x4, centered at y=12) + vertical bar (4x12, centered at x=12)
        fillRect(rows, x + 8, y + 12, 12, 4, r, g, b);
        fillRect(rows, x + 12, y + 8, 4, 12, r, g, b);
    } else if (symbolName === 'security') {
        // Shield: top bar (12px wide), left/right sides, bottom point
        fillRect(rows, x + 8, y + 4, 12, 3, r, g, b);   // top bar
        fillRect(rows, x + 8, y + 4, 3, 10, r, g, b);   // left side
        fillRect(rows, x + 17, y + 4, 3, 10, r, g, b);  // right side
        fillRect(rows, x + 10, y + 14, 8, 3, r, g, b);  // bottom bar
        fillRect(rows, x + 12, y + 17, 4, 4, r, g, b);  // point
    } else if (symbolName === 'network') {
        // Hub and spoke: center dot + 3 nodes with connecting lines
        fillRect(rows, x + 12, y + 12, 4, 4, r, g, b);   // hub
        fillRect(rows, x + 4, y + 4, 4, 4, r, g, b);     // top-left node
        fillRect(rows, x + 20, y + 4, 4, 4, r, g, b);    // top-right node
        fillRect(rows, x + 12, y + 20, 4, 4, r, g, b);   // bottom node
        // Connecting lines (2px wide)
        fillRect(rows, x + 8, y + 8, 6, 2, r, g, b);     // hub to top-left (diagonal approx)
        fillRect(rows, x + 16, y + 8, 6, 2, r, g, b);    // hub to top-right (diagonal approx)
        fillRect(rows, x + 13, y + 14, 2, 8, r, g, b);   // hub to bottom
    } else if (symbolName === 'automotive') {
        // Checkered flag: 4x4 grid of alternating 3x3 squares in 12x12 area + pole
        fillRect(rows, x + 4, y + 4, 2, 20, r, g, b);    // pole
        for (var fy = 0; fy < 4; fy++) {
            for (var fx = 0; fx < 4; fx++) {
                if ((fx + fy) % 2 === 0) {
                    fillRect(rows, x + 8 + fx * 3, y + 4 + fy * 3, 3, 3, r, g, b);
                }
            }
        }
    } else if (symbolName === 'energy') {
        // Lightning bolt: Z-shape with 3 diagonal fillRects
        fillRect(rows, x + 14, y + 4, 6, 3, r, g, b);    // top segment
        fillRect(rows, x + 10, y + 11, 8, 4, r, g, b);   // middle diagonal
        fillRect(rows, x + 8, y + 19, 6, 3, r, g, b);    // bottom segment
        fillRect(rows, x + 12, y + 7, 4, 6, r, g, b);    // connector top-mid
        fillRect(rows, x + 10, y + 15, 4, 6, r, g, b);   // connector mid-bot
    } else if (symbolName === 'finance') {
        // Rising chart line: 5 ascending points connected by 2px line segments
        var fpts = [{x: 4, y: 20}, {x: 9, y: 16}, {x: 14, y: 12}, {x: 19, y: 8}, {x: 24, y: 4}];
        for (var fi = 0; fi < fpts.length; fi++) {
            fillRect(rows, x + fpts[fi].x, y + fpts[fi].y, 3, 3, r, g, b);
        }
        for (var fi2 = 0; fi2 < fpts.length - 1; fi2++) {
            fillRect(rows, x + fpts[fi2].x + 1, y + fpts[fi2].y + 1,
                fpts[fi2 + 1].x - fpts[fi2].x, 2, r, g, b);
        }
        // X and Y axes
        fillRect(rows, x + 4, y + 4, 2, 18, r, g, b);
        fillRect(rows, x + 4, y + 22, 20, 2, r, g, b);
    } else if (symbolName === 'retail') {
        // Shopping cart: base (14x2), back wall (2x8), handle (12x2), two wheels (3x3)
        fillRect(rows, x + 6, y + 14, 14, 2, r, g, b);   // base
        fillRect(rows, x + 6, y + 6, 2, 10, r, g, b);    // back wall
        fillRect(rows, x + 6, y + 6, 12, 2, r, g, b);    // handle bar
        fillRect(rows, x + 8, y + 19, 3, 3, r, g, b);    // wheel left
        fillRect(rows, x + 16, y + 19, 3, 3, r, g, b);   // wheel right
    } else if (symbolName === 'aviation') {
        // Plane silhouette: fuselage + wing + tail
        fillRect(rows, x + 6, y + 12, 16, 4, r, g, b);   // fuselage
        fillRect(rows, x + 8, y + 10, 12, 2, r, g, b);   // wing top
        fillRect(rows, x + 8, y + 16, 12, 2, r, g, b);   // wing bottom
        fillRect(rows, x + 20, y + 8, 2, 12, r, g, b);   // tail fin
        fillRect(rows, x + 4, y + 13, 3, 2, r, g, b);    // nose
    } else if (symbolName === 'education') {
        // Book: spine (2x12) + left page (8x12) + right page (8x12)
        fillRect(rows, x + 13, y + 8, 2, 12, r, g, b);   // spine
        fillRect(rows, x + 5, y + 8, 8, 12, r, g, b);    // left page
        fillRect(rows, x + 15, y + 8, 8, 12, r, g, b);   // right page
        fillRect(rows, x + 5, y + 20, 18, 2, r, g, b);   // bottom edge
    } else if (symbolName === 'tech') {
        // Circuit: 3 horizontal traces + 2 vertical vias
        fillRect(rows, x + 4, y + 8, 20, 2, r, g, b);    // trace top
        fillRect(rows, x + 4, y + 14, 20, 2, r, g, b);   // trace middle
        fillRect(rows, x + 4, y + 20, 20, 2, r, g, b);   // trace bottom
        fillRect(rows, x + 10, y + 8, 2, 6, r, g, b);    // via left
        fillRect(rows, x + 18, y + 14, 2, 6, r, g, b);   // via right
        // Pads
        fillRect(rows, x + 4, y + 7, 4, 4, r, g, b);
        fillRect(rows, x + 22, y + 13, 4, 4, r, g, b);
    } else if (symbolName === 'music') {
        // Quarter note: filled circle (6x6) + vertical stem (2x14)
        fillRect(rows, x + 6, y + 16, 6, 6, r, g, b);    // note head
        fillRect(rows, x + 12, y + 4, 2, 14, r, g, b);   // stem
        fillRect(rows, x + 12, y + 4, 8, 2, r, g, b);    // flag top
    } else if (symbolName === 'sports') {
        // Trophy: cup (trapezoid via two rects), pedestal, base
        fillRect(rows, x + 9, y + 4, 10, 6, r, g, b);    // cup top
        fillRect(rows, x + 11, y + 10, 6, 4, r, g, b);   // cup bottom
        fillRect(rows, x + 12, y + 14, 4, 4, r, g, b);   // pedestal
        fillRect(rows, x + 10, y + 18, 8, 2, r, g, b);   // base
        // Handles
        fillRect(rows, x + 6, y + 5, 3, 4, r, g, b);
        fillRect(rows, x + 19, y + 5, 3, 4, r, g, b);
    } else if (symbolName === 'food') {
        // Fork: three tines + handle
        fillRect(rows, x + 8, y + 4, 2, 8, r, g, b);     // tine left
        fillRect(rows, x + 12, y + 4, 2, 8, r, g, b);    // tine middle
        fillRect(rows, x + 16, y + 4, 2, 8, r, g, b);    // tine right
        fillRect(rows, x + 10, y + 12, 8, 3, r, g, b);   // tine base joining
        fillRect(rows, x + 12, y + 15, 4, 10, r, g, b);  // handle
    } else if (symbolName === 'travel') {
        // Globe outline: equator bar + meridian bar + bounding box border
        fillRect(rows, x + 7, y + 14, 14, 2, r, g, b);   // equator
        fillRect(rows, x + 13, y + 7, 2, 14, r, g, b);   // meridian
        fillRect(rows, x + 7, y + 7, 14, 2, r, g, b);    // top border
        fillRect(rows, x + 7, y + 21, 14, 2, r, g, b);   // bottom border
        fillRect(rows, x + 7, y + 7, 2, 16, r, g, b);    // left border
        fillRect(rows, x + 19, y + 7, 2, 16, r, g, b);   // right border
    } else {
        // 'manufacturing': gear — center square + 4 teeth
        fillRect(rows, x + 10, y + 10, 8, 8, r, g, b);   // center square
        fillRect(rows, x + 12, y + 6, 4, 4, r, g, b);    // top tooth
        fillRect(rows, x + 12, y + 18, 4, 4, r, g, b);   // bottom tooth
        fillRect(rows, x + 6, y + 12, 4, 4, r, g, b);    // left tooth
        fillRect(rows, x + 18, y + 12, 4, 4, r, g, b);   // right tooth
    }
}

/*
 * drawSymbol2x(rows, symbolName, ox, oy, r, g, b):
 * Double-size variant of drawSymbol for 72x72 appIcon_2x (56x56 drawing area).
 * All coordinates and dimensions doubled.
 */
function drawSymbol2x(rows, symbolName, ox, oy, r, g, b) {
    var x = ox, y = oy;
    if (symbolName === 'healthcare') {
        fillRect(rows, x + 16, y + 24, 24, 8, r, g, b);
        fillRect(rows, x + 24, y + 16, 8, 24, r, g, b);
    } else if (symbolName === 'security') {
        fillRect(rows, x + 16, y + 8, 24, 6, r, g, b);
        fillRect(rows, x + 16, y + 8, 6, 20, r, g, b);
        fillRect(rows, x + 34, y + 8, 6, 20, r, g, b);
        fillRect(rows, x + 20, y + 28, 16, 6, r, g, b);
        fillRect(rows, x + 24, y + 34, 8, 8, r, g, b);
    } else if (symbolName === 'network') {
        fillRect(rows, x + 24, y + 24, 8, 8, r, g, b);
        fillRect(rows, x + 8, y + 8, 8, 8, r, g, b);
        fillRect(rows, x + 40, y + 8, 8, 8, r, g, b);
        fillRect(rows, x + 24, y + 40, 8, 8, r, g, b);
        fillRect(rows, x + 16, y + 16, 12, 4, r, g, b);
        fillRect(rows, x + 32, y + 16, 12, 4, r, g, b);
        fillRect(rows, x + 26, y + 28, 4, 16, r, g, b);
    } else if (symbolName === 'automotive') {
        fillRect(rows, x + 8, y + 8, 4, 40, r, g, b);
        for (var fy = 0; fy < 4; fy++) {
            for (var fx = 0; fx < 4; fx++) {
                if ((fx + fy) % 2 === 0) {
                    fillRect(rows, x + 16 + fx * 6, y + 8 + fy * 6, 6, 6, r, g, b);
                }
            }
        }
    } else if (symbolName === 'energy') {
        fillRect(rows, x + 28, y + 8, 12, 6, r, g, b);
        fillRect(rows, x + 20, y + 22, 16, 8, r, g, b);
        fillRect(rows, x + 16, y + 38, 12, 6, r, g, b);
        fillRect(rows, x + 24, y + 14, 8, 12, r, g, b);
        fillRect(rows, x + 20, y + 30, 8, 12, r, g, b);
    } else if (symbolName === 'finance') {
        var fpts2 = [{x: 8, y: 40}, {x: 18, y: 32}, {x: 28, y: 24}, {x: 38, y: 16}, {x: 48, y: 8}];
        for (var fi3 = 0; fi3 < fpts2.length; fi3++) {
            fillRect(rows, x + fpts2[fi3].x, y + fpts2[fi3].y, 6, 6, r, g, b);
        }
        for (var fi4 = 0; fi4 < fpts2.length - 1; fi4++) {
            fillRect(rows, x + fpts2[fi4].x + 2, y + fpts2[fi4].y + 2,
                fpts2[fi4 + 1].x - fpts2[fi4].x, 4, r, g, b);
        }
        fillRect(rows, x + 8, y + 8, 4, 36, r, g, b);
        fillRect(rows, x + 8, y + 44, 40, 4, r, g, b);
    } else if (symbolName === 'retail') {
        fillRect(rows, x + 12, y + 28, 28, 4, r, g, b);
        fillRect(rows, x + 12, y + 12, 4, 20, r, g, b);
        fillRect(rows, x + 12, y + 12, 24, 4, r, g, b);
        fillRect(rows, x + 16, y + 38, 6, 6, r, g, b);
        fillRect(rows, x + 32, y + 38, 6, 6, r, g, b);
    } else if (symbolName === 'aviation') {
        fillRect(rows, x + 12, y + 24, 32, 8, r, g, b);
        fillRect(rows, x + 16, y + 20, 24, 4, r, g, b);
        fillRect(rows, x + 16, y + 32, 24, 4, r, g, b);
        fillRect(rows, x + 40, y + 16, 4, 24, r, g, b);
        fillRect(rows, x + 8, y + 26, 6, 4, r, g, b);
    } else if (symbolName === 'education') {
        fillRect(rows, x + 26, y + 16, 4, 24, r, g, b);
        fillRect(rows, x + 10, y + 16, 16, 24, r, g, b);
        fillRect(rows, x + 30, y + 16, 16, 24, r, g, b);
        fillRect(rows, x + 10, y + 40, 36, 4, r, g, b);
    } else if (symbolName === 'tech') {
        fillRect(rows, x + 8, y + 16, 40, 4, r, g, b);
        fillRect(rows, x + 8, y + 28, 40, 4, r, g, b);
        fillRect(rows, x + 8, y + 40, 40, 4, r, g, b);
        fillRect(rows, x + 20, y + 16, 4, 12, r, g, b);
        fillRect(rows, x + 36, y + 28, 4, 12, r, g, b);
        fillRect(rows, x + 8, y + 14, 8, 8, r, g, b);
        fillRect(rows, x + 44, y + 26, 8, 8, r, g, b);
    } else if (symbolName === 'music') {
        fillRect(rows, x + 12, y + 32, 12, 12, r, g, b);
        fillRect(rows, x + 24, y + 8, 4, 28, r, g, b);
        fillRect(rows, x + 24, y + 8, 16, 4, r, g, b);
    } else if (symbolName === 'sports') {
        fillRect(rows, x + 18, y + 8, 20, 12, r, g, b);
        fillRect(rows, x + 22, y + 20, 12, 8, r, g, b);
        fillRect(rows, x + 24, y + 28, 8, 8, r, g, b);
        fillRect(rows, x + 20, y + 36, 16, 4, r, g, b);
        fillRect(rows, x + 12, y + 10, 6, 8, r, g, b);
        fillRect(rows, x + 38, y + 10, 6, 8, r, g, b);
    } else if (symbolName === 'food') {
        fillRect(rows, x + 16, y + 8, 4, 16, r, g, b);
        fillRect(rows, x + 24, y + 8, 4, 16, r, g, b);
        fillRect(rows, x + 32, y + 8, 4, 16, r, g, b);
        fillRect(rows, x + 20, y + 24, 16, 6, r, g, b);
        fillRect(rows, x + 24, y + 30, 8, 20, r, g, b);
    } else if (symbolName === 'travel') {
        fillRect(rows, x + 14, y + 28, 28, 4, r, g, b);
        fillRect(rows, x + 26, y + 14, 4, 28, r, g, b);
        fillRect(rows, x + 14, y + 14, 28, 4, r, g, b);
        fillRect(rows, x + 14, y + 42, 28, 4, r, g, b);
        fillRect(rows, x + 14, y + 14, 4, 32, r, g, b);
        fillRect(rows, x + 38, y + 14, 4, 32, r, g, b);
    } else {
        // manufacturing (2x)
        fillRect(rows, x + 20, y + 20, 16, 16, r, g, b);
        fillRect(rows, x + 24, y + 12, 8, 8, r, g, b);
        fillRect(rows, x + 24, y + 36, 8, 8, r, g, b);
        fillRect(rows, x + 12, y + 24, 8, 8, r, g, b);
        fillRect(rows, x + 36, y + 24, 8, 8, r, g, b);
    }
}

/*
 * generateAppIcon(appDir, dark):
 * Creates static/appIcon.png (36x36) and static/appIcon_2x.png (72x72).
 * Icon: accent background + domain symbol (3-tier cascade: domain keyword → @viz-type → letter).
 */
function generateAppIcon(appDir, dark) {
    var accentRgb = hexToRgb(dark.accent);
    var ar = accentRgb[0], ag = accentRgb[1], ab = accentRgb[2];

    var baseName = path.basename(appDir);

    // Tier 1: domain keyword match
    var domain = matchDomain(baseName);

    // Tier 2: @viz-type annotation from first viz source file
    var vizType = null;
    if (!domain) {
        var vizRoot = path.join(appDir, 'appserver', 'static', 'visualizations');
        if (fs.existsSync(vizRoot)) {
            var vizEntries = fs.readdirSync(vizRoot);
            for (var ve = 0; ve < vizEntries.length; ve++) {
                var vizDir = path.join(vizRoot, vizEntries[ve]);
                try {
                    if (!fs.statSync(vizDir).isDirectory()) { continue; }
                } catch (e) { continue; }
                var srcPath = path.join(vizDir, 'src', 'visualization_source.js');
                if (!fs.existsSync(srcPath)) { srcPath = path.join(vizDir, 'visualization_source.js'); }
                if (fs.existsSync(srcPath)) {
                    try {
                        var firstLine = fs.readFileSync(srcPath, 'utf8').split('\n')[0];
                        var vtMatch = firstLine.match(/\/\/\s*@viz-type:\s*(\S+)/);
                        if (vtMatch) { vizType = vtMatch[1].toLowerCase(); break; }
                    } catch (e) {}
                }
            }
        }
        // Map viz type to a domain symbol
        if (vizType) {
            var VIZ_TO_DOMAIN = {
                'gauge': 'finance', 'kpi': 'finance', 'bar': 'finance',
                'bars': 'finance', 'line': 'finance', 'scatter': 'finance',
                'table': 'tech', 'grid': 'tech',
                'leaderboard': 'sports', 'timeline': 'tech',
                'network': 'network', 'progress': 'energy'
            };
            domain = VIZ_TO_DOMAIN[vizType] || null;
        }
    }

    var iconDir = path.join(appDir, 'static');
    if (!fs.existsSync(iconDir)) { fs.mkdirSync(iconDir, { recursive: true }); }

    // 36x36 icon: drawing area 28x28 centered at (4,4)
    var W1 = 36, H1 = 36, scale1 = 4;
    var rows1 = makeRgbRows(W1, H1, ar, ag, ab);
    if (domain) {
        drawSymbol(rows1, domain, 4, 4, 255, 255, 255);
    } else {
        // Tier 3: letter fallback
        var initial = baseName[0] ? baseName[0].toUpperCase() : 'S';
        if (!FONT_GLYPHS[initial]) { initial = '*'; }
        var glyphW1 = 5 * scale1, glyphH1 = 7 * scale1; // 20x28
        var ox1 = Math.round((W1 - glyphW1) / 2);
        var oy1 = Math.round((H1 - glyphH1) / 2);
        drawLetter(rows1, initial, ox1, oy1, scale1, 255, 255, 255);
    }
    var png1 = makePng(W1, H1, rows1);
    fs.writeFileSync(path.join(iconDir, 'appIcon.png'), png1);

    // 72x72 icon: drawing area 56x56 centered at (8,8)
    var W2 = 72, H2 = 72, scale2 = 8;
    var rows2 = makeRgbRows(W2, H2, ar, ag, ab);
    if (domain) {
        drawSymbol2x(rows2, domain, 8, 8, 255, 255, 255);
    } else {
        var initial2 = baseName[0] ? baseName[0].toUpperCase() : 'S';
        if (!FONT_GLYPHS[initial2]) { initial2 = '*'; }
        var glyphW2 = 5 * scale2, glyphH2 = 7 * scale2; // 40x56
        var ox2 = Math.round((W2 - glyphW2) / 2);
        var oy2 = Math.round((H2 - glyphH2) / 2);
        drawLetter(rows2, initial2, ox2, oy2, scale2, 255, 255, 255);
    }
    var png2 = makePng(W2, H2, rows2);
    fs.writeFileSync(path.join(iconDir, 'appIcon_2x.png'), png2);
}

/*
 * generatePreviews(appDir, dark):
 * Creates appserver/static/visualizations/<viz>/preview.png (116x76) for each viz subdirectory.
 * Silhouette style is determined by viz directory name.
 * Uses two fill colors: primary accent and a secondary derived from dark.s1 (or computed fallback).
 */
function generatePreviews(appDir, dark) {
    var previewRgb = previewContrastAccent(dark.accent, dark.bg);
    var ar = previewRgb[0], ag = previewRgb[1], ab = previewRgb[2];
    var bgRgb = hexToRgb(dark.bg);
    var bgr = bgRgb[0], bgg = bgRgb[1], bgb = bgRgb[2];

    // Secondary color: prefer dark.s1 series color, otherwise derive from accent
    var s1r, s1g, s1b;
    if (dark.series && isHex(dark.series[0])) {
        var s1Rgb = hexToRgb(dark.series[0]);
        s1r = s1Rgb[0]; s1g = s1Rgb[1]; s1b = s1Rgb[2];
    } else if (dark.s1 && isHex(dark.s1)) {
        var s1Rgb2 = hexToRgb(dark.s1);
        s1r = s1Rgb2[0]; s1g = s1Rgb2[1]; s1b = s1Rgb2[2];
    } else {
        // Derive secondary by shifting hue: darken red/green, keep blue component
        s1r = Math.min(255, Math.round(ar * 0.7 + 80));
        s1g = Math.min(255, Math.round(ag * 0.7 + 80));
        s1b = Math.min(255, Math.round(ab * 0.7));
    }

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
        var W = 116, H = 76;
        var rows = makeRgbRows(W, H, bgr, bgg, bgb);
        VIZ_LABEL = name;  // set global for drawSilhouette
        drawSilhouette(rows, type, ar, ag, ab, bgr, bgg, bgb, s1r, s1g, s1b);

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
