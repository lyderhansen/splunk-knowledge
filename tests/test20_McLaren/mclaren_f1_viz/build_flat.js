#!/usr/bin/env node
// Flat AMD build — inlines shared/theme.js into each viz's visualization.js
// Usage: node build_flat.js

var fs = require('fs');
var path = require('path');

var VIZ_DIR = path.join(__dirname, 'appserver', 'static', 'visualizations');
var THEME_PATH = path.join(__dirname, 'shared', 'theme.js');

var themeRaw = fs.readFileSync(THEME_PATH, 'utf8');
var themeBody = themeRaw
    .replace(/^module\.exports\s*=\s*\{[\s\S]*?\};\s*$/m, '')
    .replace(/module\.exports\s*=[\s\S]*$/, '');
var exportsMatch = themeRaw.match(/module\.exports\s*=\s*(\{[\s\S]*?\});/);
var themeReturn = exportsMatch ? exportsMatch[1] : '{}';

var vizDirs = fs.readdirSync(VIZ_DIR).filter(function(d) {
    return fs.statSync(path.join(VIZ_DIR, d)).isDirectory();
});

var built = 0;
var errors = [];

vizDirs.forEach(function(vizName) {
    var srcPath = path.join(VIZ_DIR, vizName, 'src', 'visualization_source.js');
    var outPath = path.join(VIZ_DIR, vizName, 'visualization.js');

    if (!fs.existsSync(srcPath)) {
        console.log('  SKIP ' + vizName + ' (no src/visualization_source.js)');
        return;
    }

    var vizRaw = fs.readFileSync(srcPath, 'utf8');
    var vizBody = vizRaw
        .replace(/var\s+SplunkVisualizationBase\s*=\s*require\([^)]+\);\s*/g, '')
        .replace(/var\s+theme\s*=\s*require\([^)]+\);\s*/g, '')
        .replace(/module\.exports\s*=\s*/, 'return ');

    var output = [
        'define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], function(SplunkVisualizationBase, SplunkVisualizationUtils) {',
        '',
        '    var theme = (function() {',
        themeBody.split('\n').map(function(l) { return '        ' + l; }).join('\n'),
        '        return ' + themeReturn + ';',
        '    })();',
        '',
        vizBody,
        '',
        '});'
    ].join('\n');

    // Verify no ES6 leaked
    if (/(?:^|[^a-zA-Z0-9_$])(const |let |=>|`\$\{)/.test(output)) {
        errors.push(vizName + ': ES6 syntax detected in output!');
    }

    fs.writeFileSync(outPath, output, 'utf8');
    built++;
    console.log('  BUILT ' + vizName + '/visualization.js (' + Math.round(output.length / 1024) + ' KB)');
});

console.log('\n' + built + ' vizs built, ' + errors.length + ' errors');
if (errors.length) {
    errors.forEach(function(e) { console.error('  ERROR: ' + e); });
    process.exit(1);
}
