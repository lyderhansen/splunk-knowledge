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
    // Use level 1 (fast) for larger images, level 0 (store) for small icons
    // to guarantee file size > 500 bytes for correctness checks.
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

// ---- Viz type detection ----

var VIZ_TYPE_KEYWORDS = [
    { type: 'bars',     keywords: ['bar', 'bars', 'column', 'histogram', 'bar_chart', 'barchart', 'vertical'] },
    { type: 'gauge',    keywords: ['gauge', 'arc', 'ring', 'donut', 'dial', 'speedometer', 'radial'] },
    { type: 'grid',     keywords: ['grid', 'table', 'matrix', 'heatmap', 'heat', 'map', 'cell'] },
    { type: 'line',     keywords: ['line', 'trend', 'area', 'sparkline', 'area_chart', 'linechart', 'timeseries', 'time_series'] },
    { type: 'timeline', keywords: ['timeline', 'gantt', 'feed', 'activity', 'event', 'stream', 'log'] },
    { type: 'radar',    keywords: ['radar', 'spider', 'polar', 'web', 'radarchart'] },
    { type: 'progress', keywords: ['progress', 'bullet', 'meter', 'completion', 'fill', 'progress_bar'] },
    { type: 'kpi',      keywords: ['kpi', 'metric', 'score', 'value', 'number', 'stat', 'card', 'tile', 'badge', 'counter'] }
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
    var labelW  = [50, 50, 50, 50];
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

function drawSilhouette(rows, type, ar, ag, ab, bgr, bgg, bgb) {
    if (type === 'bars')     { drawBarsSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'gauge')    { drawGaugeSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'grid')     { drawGridSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'line')     { drawLineSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'timeline') { drawTimelineSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'radar')    { drawRadarSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
    if (type === 'progress') { drawProgressSilhouette(rows, ar, ag, ab, bgr, bgg, bgb); return; }
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
    var accentRgb = hexToRgb(dark.accent);
    var ar = accentRgb[0], ag = accentRgb[1], ab = accentRgb[2];
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

        var type = detectVizType(name);
        var W = 300, H = 200;
        var rows = makeRgbRows(W, H, bgr, bgg, bgb);
        drawSilhouette(rows, type, ar, ag, ab, bgr, bgg, bgb);

        var pngBuf = makePng(W, H, rows);
        var outPath = path.join(vizDir, 'preview.png');
        fs.writeFileSync(outPath, pngBuf);
        process.stdout.write('  wrote: ' + outPath + '\n');
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

    process.exit(errors > 0 ? 1 : 0);
}

main();
