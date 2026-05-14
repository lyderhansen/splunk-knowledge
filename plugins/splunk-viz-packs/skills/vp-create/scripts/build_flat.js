#!/usr/bin/env node
/*
 * build_flat.js — Flat AMD builder for Splunk custom vizs.
 * Canonical source: vp-viz/scripts/build_flat.js (edit there first, copy here)
 * Inlines theme.js into each viz and wraps as AMD module.
 *
 * Usage: node build_flat.js [app_dir]
 *   app_dir defaults to parent of _build/ if run from _build/,
 *   or current directory otherwise.
 *
 * The module.exports regex does NOT use the m flag — with m,
 * $ matches end-of-line and only strips the first line, leaving
 * a stray } that breaks the IIFE.
 */
var fs = require('fs');
var path = require('path');

// Resolve app directory
var appDir = process.argv[2];
if (!appDir) {
    if (path.basename(process.cwd()) === '_build') {
        appDir = path.resolve('..');
    } else {
        appDir = process.cwd();
    }
}
appDir = path.resolve(appDir);

var VIZ_ROOT = path.join(appDir, 'appserver', 'static', 'visualizations');
var SHARED = path.join(appDir, 'shared');

if (!fs.existsSync(path.join(SHARED, 'theme.js'))) {
    console.error('ERROR: shared/theme.js not found in ' + appDir);
    process.exit(1);
}

var themeRaw = fs.readFileSync(path.join(SHARED, 'theme.js'), 'utf8');

// Strip require/module.exports from theme to make it inlineable
var themeBody = themeRaw
    .replace(/^var\s+\w+\s*=\s*require\(.+\);?\s*$/gm, '')
    .replace(/module\.exports\s*=\s*\{[\s\S]*$/, '');

// Detect which functions theme.js actually exports
var exportMatch = themeRaw.match(/module\.exports\s*=\s*\{([^}]+)\}/);
var exportList = 'getTheme:getTheme, withAlpha:withAlpha, lerpColor:lerpColor, ' +
    'severityColor:severityColor, fmtNum:fmtNum, roundRect:roundRect, ' +
    'drawPanel:drawPanel, drawHGrid:drawHGrid, parseColors:parseColors, ' +
    'parseInts:parseInts, FONTS:FONTS';
if (exportMatch) {
    exportList = exportMatch[1].trim().replace(/\n/g, ' ');
}

var vizDirs = fs.readdirSync(VIZ_ROOT).filter(function(n) {
    var srcPath = path.join(VIZ_ROOT, n, 'src', 'visualization_source.js');
    return fs.existsSync(srcPath);
});

if (vizDirs.length === 0) {
    console.error('ERROR: no viz source files found in ' + VIZ_ROOT);
    process.exit(1);
}

console.log('Building ' + vizDirs.length + ' viz(s) from ' + appDir);

var errors = 0;

vizDirs.forEach(function(vizName) {
    var srcPath = path.join(VIZ_ROOT, vizName, 'src', 'visualization_source.js');
    var outPath = path.join(VIZ_ROOT, vizName, 'visualization.js');
    var src = fs.readFileSync(srcPath, 'utf8');

    // Strip require lines
    src = src.replace(/^var\s+\w+\s*=\s*require\(.+\);?\s*$/gm, '');

    // Convert module.exports = X; to return X;
    src = src.replace(/^module\.exports\s*=\s*/m, 'return ');

    var output = [
        'define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], ' +
        'function(SplunkVisualizationBase, SplunkVisualizationUtils) {',
        '',
        '// ── Inlined theme.js ──',
        'var theme = (function() {',
        themeBody,
        '    return { ' + exportList + ' };',
        '})();',
        '',
        '// ── Viz source ──',
        src,
        '',
        '});'
    ].join('\n');

    fs.writeFileSync(outPath, output);

    // Quick validation
    var firstLine = output.split('\n')[0];
    if (firstLine.indexOf('define([') !== 0) {
        console.error('  ERROR: ' + vizName + ' — missing AMD define wrapper');
        errors++;
    } else {
        console.log('  OK: ' + vizName + '/visualization.js');
    }
});

console.log('Done — ' + vizDirs.length + ' viz(s) built.');
if (errors > 0) {
    console.error(errors + ' error(s) found.');
    process.exit(1);
}
