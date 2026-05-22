#!/usr/bin/env node
/*
 * score_design.js -- Aesthetic scoring for Splunk viz pack source files.
 *
 * Usage:
 *   node score_design.js <visualization_source.js> <theme.js> [viz_name]
 *
 * Exit codes:
 *   0 -- scored successfully (always 0 -- scoring is informational only)
 *   2 -- usage error (fewer than 2 arguments or file not found)
 *
 * Output:
 *   stdout -- single SCORE line with per-dimension breakdown
 *   Format: "  SCORE: {total}/100 (gradient: {g}, typography: {t}, spacing: {s}, color: {c}, animation: {a})"
 *   With viz_name: "  SCORE [{viz_name}]: {total}/100 ..."
 *
 * Dimensions (5 x 20 points each, total 100):
 *   1. Gradient usage (0-20):   createLinearGradient / createRadialGradient call count
 *   2. Typography hierarchy (0-20): distinct numeric font sizes in ctx.font assignments
 *   3. Spacing ratios (0-20):   dynamic vs hardcoded position/size patterns
 *   4. Color variety (0-20):    distinct fillStyle/strokeStyle assignments + accent bonus
 *   5. Animation presence (0-20): requestAnimationFrame / setInterval / hover patterns
 *
 * Pure ES5 CJS -- no const/let/arrow functions/template literals/import.
 */

var fs   = require('fs');
var path = require('path');

// ---- CLI argument parsing ----

var args = process.argv.slice(2);

if (args.length < 2) {
    process.stderr.write('Usage: node score_design.js <visualization_source.js> <theme.js> [viz_name]\n');
    process.exit(2);
}

var jsSrcPath   = args[0];
var themeJsPath = args[1];
var vizName     = (args.length >= 3 && args[2]) ? args[2] : '';

if (!fs.existsSync(jsSrcPath)) {
    process.stderr.write('Error: file not found: ' + jsSrcPath + '\n');
    process.exit(2);
}
if (!fs.existsSync(themeJsPath)) {
    process.stderr.write('Error: file not found: ' + themeJsPath + '\n');
    process.exit(2);
}

// ---- Load file contents ----

var jsSrc        = fs.readFileSync(jsSrcPath, 'utf8');
var themeContent = fs.readFileSync(themeJsPath, 'utf8');

// ---- Dimension 1: Gradient usage (0-20) ----
// Count createLinearGradient and createRadialGradient calls.
// 0 calls = 0, 1 call = 10, 2+ calls = 20.

function scoreGradient(src) {
    var linearCount  = 0;
    var radialCount  = 0;
    var linearPat    = /createLinearGradient/g;
    var radialPat    = /createRadialGradient/g;
    while (linearPat.exec(src) !== null) { linearCount++; }
    while (radialPat.exec(src)  !== null) { radialCount++; }
    var total = linearCount + radialCount;
    if (total === 0) { return 0; }
    if (total === 1) { return 10; }
    return 20;
}

// ---- Dimension 2: Typography hierarchy (0-20) ----
// Extract numeric font sizes from ctx.font = "...Npx..." patterns.
// Distinct sizes: 1 = 5 pts, 2 = 10 pts, 3+ = 20 pts.

function scoreTypography(src) {
    var sizeSet = {};
    // Match patterns like: ctx.font = "bold 24px ..." or ctx.font = h*0.1 +"px ..."
    // 1. Direct string literals: number followed by px
    var strFontPat = /(\d+(?:\.\d+)?)\s*px/g;
    var m;
    while ((m = strFontPat.exec(src)) !== null) {
        sizeSet[m[1]] = 1;
    }
    // 2. Variable-based font assignment: variable followed by 'px' (arithmetic)
    // e.g., (h * 0.1) + 'px' -- count as a distinct size pattern per expression
    var varFontPat = /\.\s*font\s*=\s*[^;'"]{0,80}(?:\+\s*['"]px|px['"])/g;
    while ((m = varFontPat.exec(src)) !== null) {
        // Extract any numeric literals within this assignment for the set
        var assignStr = m[0];
        var numPat = /\b(\d+(?:\.\d+)?)\b/g;
        var n2;
        while ((n2 = numPat.exec(assignStr)) !== null) {
            // Only track values plausible as font sizes (6-200)
            var val = parseFloat(n2[1]);
            if (val >= 6 && val <= 200) {
                sizeSet[n2[1]] = 1;
            }
        }
    }
    var uniqueCount = Object.keys(sizeSet).length;
    // Filter to plausible font sizes only
    var plausible = 0;
    for (var k in sizeSet) {
        var v = parseFloat(k);
        if (v >= 6 && v <= 200) { plausible++; }
    }
    if (plausible >= 3) { return 20; }
    if (plausible === 2) { return 10; }
    if (plausible === 1) { return 5; }
    return 0;
}

// ---- Dimension 3: Spacing ratios (0-20) ----
// Count dynamic spacing patterns (multiplication with dimension vars).
// 0 dynamic = 5, 1-3 = 10, 4+ = 20.
// The baseline 5 points represents at least hardcoded layout (any viz has some structure).

function scoreSpacing(src) {
    // Dynamic: multiplication with w, h, width, height, canvas.width, canvas.height
    var dynamicPat = /\b(?:w|h|width|height|canvas\.width|canvas\.height|this\.el\.clientWidth|this\.el\.clientHeight)\s*\*\s*[\d.]+|[\d.]+\s*\*\s*(?:w|h|width|height|canvas\.width|canvas\.height|this\.el\.clientWidth|this\.el\.clientHeight)/g;
    var dynamicCount = 0;
    while (dynamicPat.exec(src) !== null) { dynamicCount++; }

    if (dynamicCount === 0) { return 5; }
    if (dynamicCount <= 3)  { return 10; }
    return 20;
}

// ---- Dimension 4: Color variety (0-20) ----
// Count distinct fillStyle / strokeStyle string assignments.
// 1-2 unique = 5, 3-4 = 10, 5+ = 15, +5 bonus if t.accent or t.series appear (capped at 20).

function scoreColor(src) {
    var colorSet = {};

    // Capture quoted string values assigned to fillStyle or strokeStyle
    var stylePat = /(?:fillStyle|strokeStyle)\s*=\s*(['"])((?:\\.|[^'"\\])+)\1/g;
    var m;
    while ((m = stylePat.exec(src)) !== null) {
        var val = m[2].trim().toLowerCase();
        if (val.length > 0) { colorSet[val] = 1; }
    }

    // Also capture unquoted theme token references: fillStyle = t.accent, t.text, etc.
    var tokenPat = /(?:fillStyle|strokeStyle)\s*=\s*(t\.[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)?)/g;
    while ((m = tokenPat.exec(src)) !== null) {
        colorSet[m[1]] = 1;
    }

    var unique = Object.keys(colorSet).length;
    var base;
    if (unique >= 5)      { base = 15; }
    else if (unique >= 3) { base = 10; }
    else if (unique >= 1) { base = 5; }
    else                  { base = 0; }

    // +5 bonus if accent or series colors appear
    var hasAccentOrSeries = (src.indexOf('t.accent') !== -1) || (src.indexOf('t.series') !== -1);
    var bonus = hasAccentOrSeries ? 5 : 0;

    return Math.min(20, base + bonus);
}

// ---- Dimension 5: Animation presence (0-20) ----
// None = 0, one type (rAF or setInterval) = 10,
// both types OR one type + _onMouseMove hover handler = 20.

function scoreAnimation(src) {
    var hasRAF      = src.indexOf('requestAnimationFrame') !== -1;
    var hasInterval = src.indexOf('setInterval') !== -1;
    var hasHover    = src.indexOf('_onMouseMove') !== -1;

    if (!hasRAF && !hasInterval) { return 0; }
    if ((hasRAF && hasInterval) || (hasHover && (hasRAF || hasInterval))) { return 20; }
    return 10;
}

// ---- Compute scores ----

var gScore = scoreGradient(jsSrc);
var tScore = scoreTypography(jsSrc);
var sScore = scoreSpacing(jsSrc);
var cScore = scoreColor(jsSrc);
var aScore = scoreAnimation(jsSrc);
var total  = gScore + tScore + sScore + cScore + aScore;

// ---- Emit score line ----

var prefix = vizName ? '  SCORE [' + vizName + ']: ' : '  SCORE: ';
process.stdout.write(
    prefix +
    total + '/100 ' +
    '(gradient: ' + gScore +
    ', typography: ' + tScore +
    ', spacing: ' + sScore +
    ', color: ' + cScore +
    ', animation: ' + aScore + ')' +
    '\n'
);

process.exit(0);
