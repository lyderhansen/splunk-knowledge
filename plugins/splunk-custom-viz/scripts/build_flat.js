#!/usr/bin/env node
/*
 * build_flat.js — Flat AMD builder for Splunk custom viz packs.
 *
 * For each viz under appserver/static/visualizations/<viz>/:
 *   1. Read src/visualization_source.js
 *   2. Inline shared/theme.js (replace `require("shared/theme")` with the theme code)
 *   3. Wrap as AMD module
 *   4. Write to appserver/static/visualizations/<viz>/visualization.js
 *
 * Usage: node build_flat.js [app_dir]
 *   app_dir defaults to current working directory.
 *
 * Exit codes:
 *   0 — all vizs built
 *   1 — error (theme.js not found, viz dir empty, etc.)
 *
 * Pure ES5 CJS — no external deps.
 */

'use strict';

var fs = require('fs');
var path = require('path');

var appDir = process.argv[2] || process.cwd();
appDir = path.resolve(appDir);

var SHARED = path.join(appDir, 'shared');
var VIZ_ROOT = path.join(appDir, 'appserver', 'static', 'visualizations');

if (!fs.existsSync(SHARED) || !fs.existsSync(path.join(SHARED, 'theme.js'))) {
    process.stderr.write('Error: shared/theme.js not found at ' + SHARED + '\n');
    process.exit(1);
}
if (!fs.existsSync(VIZ_ROOT)) {
    process.stderr.write('Error: viz root not found at ' + VIZ_ROOT + '\n');
    process.exit(1);
}

var themeSrc = fs.readFileSync(path.join(SHARED, 'theme.js'), 'utf8');

// Strip module.exports from theme.js so it can be inlined as an expression.
// Pattern: module.exports = <expression>;
// Replace with: var theme = <expression>;
var themeBody = themeSrc.replace(/module\.exports\s*=\s*/, 'var theme = ');

var vizDirs = fs.readdirSync(VIZ_ROOT).filter(function(name) {
    var p = path.join(VIZ_ROOT, name);
    return fs.statSync(p).isDirectory();
});

if (vizDirs.length === 0) {
    process.stderr.write('Error: no viz directories under ' + VIZ_ROOT + '\n');
    process.exit(1);
}

var builtCount = 0;
for (var i = 0; i < vizDirs.length; i++) {
    var viz = vizDirs[i];
    var srcPath = path.join(VIZ_ROOT, viz, 'src', 'visualization_source.js');
    var outPath = path.join(VIZ_ROOT, viz, 'visualization.js');

    if (!fs.existsSync(srcPath)) {
        process.stderr.write('Skip: no src/visualization_source.js in ' + viz + '\n');
        continue;
    }

    var srcCode = fs.readFileSync(srcPath, 'utf8');

    // Strip the require("shared/theme") line — theme is inlined below it.
    srcCode = srcCode.replace(/var\s+theme\s*=\s*require\(["']shared\/theme["']\);?\s*\n/, '');

    // Strip require lines for SplunkVisualizationBase and Utils — they become AMD deps.
    srcCode = srcCode.replace(/var\s+SplunkVisualizationBase\s*=\s*require\(["']api\/SplunkVisualizationBase["']\);?\s*\n/, '');
    srcCode = srcCode.replace(/var\s+SplunkVisualizationUtils\s*=\s*require\(["']api\/SplunkVisualizationUtils["']\);?\s*\n/, '');

    // Strip module.exports = — replace with `return ` for AMD return.
    srcCode = srcCode.replace(/module\.exports\s*=\s*/, 'return ');

    var amdWrapped =
        'define([\n' +
        '    "api/SplunkVisualizationBase",\n' +
        '    "api/SplunkVisualizationUtils"\n' +
        '], function(SplunkVisualizationBase, SplunkVisualizationUtils) {\n' +
        '\n' +
        themeBody + '\n' +
        '\n' +
        srcCode + '\n' +
        '});\n';

    fs.writeFileSync(outPath, amdWrapped, 'utf8');
    process.stdout.write('Built: ' + viz + '/visualization.js (' + amdWrapped.length + ' bytes)\n');
    builtCount++;
}

process.stdout.write('\n' + builtCount + ' viz(s) built.\n');
process.exit(0);
