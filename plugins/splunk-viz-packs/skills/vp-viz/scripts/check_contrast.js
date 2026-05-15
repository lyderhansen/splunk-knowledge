#!/usr/bin/env node
/*
 * check_contrast.js -- WCAG AA contrast checker for theme.js color tokens.
 *
 * Usage:
 *   node check_contrast.js <theme_js_path>
 *
 * Exit codes:
 *   0 -- all pairs pass (WARN does not cause exit 1)
 *   1 -- one or more FAIL pairs found (ratio < threshold for FAIL-level pairs)
 *   2 -- usage error (no arguments)
 *
 * Output: FAIL/WARN lines on stdout (two leading spaces, matching validate_viz.sh format).
 * Structured: FINDING: NDJSON on stderr (one line per failing pair).
 *
 * Pairs checked (text-on-background):
 *   text/bg, text/panel, text/panelHi      -- FAIL if < 4.5:1
 *   textDim/bg, textDim/panel, textDim/panelHi -- FAIL if < 4.5:1
 *   textFaint/bg                           -- WARN if < 3.0:1 (informational only)
 *
 * Non-hex values (rgba grid tokens) are skipped silently via isHex().
 * theme.js is loaded via require() + getTheme() -- no eval(), no regex parsing.
 *
 * Pure ES5 CJS -- no const/let/arrow functions/template literals/import.
 */

var fs = require('fs');
var path = require('path');

// ---- CLI argument parsing ----

var args = process.argv.slice(2);

if (args.length < 1) {
    process.stderr.write('Usage: node check_contrast.js <theme_js_path>\n');
    process.exit(2);
}

var themeJsPath = args[0];

if (!fs.existsSync(themeJsPath)) {
    process.stderr.write('Error: file not found: ' + themeJsPath + '\n');
    process.exit(1);
}

// ---- WCAG 2.1 SC 1.4.3 formula (W3C exact) ----

function hexToLinear(channel) {
    var s = channel / 255;
    return (s <= 0.03928) ? (s / 12.92) : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hexColor) {
    var r = parseInt(hexColor.slice(1, 3), 16);
    var g = parseInt(hexColor.slice(3, 5), 16);
    var b = parseInt(hexColor.slice(5, 7), 16);
    return (0.2126 * hexToLinear(r)) + (0.7152 * hexToLinear(g)) + (0.0722 * hexToLinear(b));
}

function contrastRatio(hex1, hex2) {
    var L1 = relativeLuminance(hex1);
    var L2 = relativeLuminance(hex2);
    var lighter = (L1 > L2) ? L1 : L2;
    var darker  = (L1 > L2) ? L2 : L1;
    return (lighter + 0.05) / (darker + 0.05);
}

// Skip non-hex values (rgba grid tokens) -- verified: only grid uses rgba
function isHex(val) {
    return typeof val === 'string' && /^#[0-9A-Fa-f]{6}$/.test(val);
}

// ---- Pair definitions (D-11) ----

var PAIRS = [
    { text: 'text',      bg: 'bg',       threshold: 4.5, level: 'FAIL' },
    { text: 'text',      bg: 'panel',    threshold: 4.5, level: 'FAIL' },
    { text: 'text',      bg: 'panelHi',  threshold: 4.5, level: 'FAIL' },
    { text: 'textDim',   bg: 'bg',       threshold: 4.5, level: 'FAIL' },
    { text: 'textDim',   bg: 'panel',    threshold: 4.5, level: 'FAIL' },
    { text: 'textDim',   bg: 'panelHi',  threshold: 4.5, level: 'FAIL' },
    { text: 'textFaint', bg: 'bg',       threshold: 3.0, level: 'WARN' }
];

// ---- Load theme module ----

var themeModule;
try {
    themeModule = require(path.resolve(themeJsPath));
} catch (e) {
    process.stderr.write('Error: could not load theme.js: ' + themeJsPath + '\n');
    process.stderr.write('  ' + String(e) + '\n');
    process.exit(1);
}

if (typeof themeModule.getTheme !== 'function') {
    process.stderr.write('Error: theme.js does not export getTheme(name): ' + themeJsPath + '\n');
    process.exit(1);
}

var dark  = themeModule.getTheme('dark');
var light = themeModule.getTheme('light');

// ---- Run pair checks ----

var violations = 0;
var themes = ['dark', 'light'];

for (var ti = 0; ti < themes.length; ti++) {
    var themeName = themes[ti];
    var t = (themeName === 'dark') ? dark : light;

    for (var pi = 0; pi < PAIRS.length; pi++) {
        var pair = PAIRS[pi];
        var textHex = t[pair.text];
        var bgHex   = t[pair.bg];

        // Skip non-hex tokens silently (e.g. rgba() grid values)
        if (!isHex(textHex) || !isHex(bgHex)) { continue; }

        var ratio = contrastRatio(textHex, bgHex);

        if (ratio < pair.threshold) {
            // stdout: matches validate_viz.sh FAIL/WARN format exactly
            process.stdout.write('  ' + pair.level + ' CONTRAST: ' + themeName + '.' +
                pair.text + '/' + pair.bg + ' = ' + ratio.toFixed(2) + ':1 ' +
                '(need ' + pair.threshold + ':1) fg=' + textHex + ' bg=' + bgHex + '\n');

            // stderr: FINDING: NDJSON (same shape as validate_dash.js emitFail)
            process.stderr.write('FINDING:' + JSON.stringify({
                type: pair.level,
                code: 'CONTRAST',
                file: themeJsPath,
                message: themeName + '.' + pair.text + '/' + pair.bg +
                    ' = ' + ratio.toFixed(2) + ':1 fg=' + textHex + ' bg=' + bgHex,
                context: {
                    theme: themeName,
                    textKey: pair.text,
                    bgKey: pair.bg,
                    ratio: ratio,
                    threshold: pair.threshold
                }
            }) + '\n');

            if (pair.level === 'FAIL') { violations++; }
        }
    }
}

process.exit(violations > 0 ? 1 : 0);
