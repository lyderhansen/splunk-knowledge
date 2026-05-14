#!/usr/bin/env node
// Flat AMD build — inlines shared/theme.js into each viz source
var fs = require('fs');
var path = require('path');

var vizDir = path.join(__dirname, 'appserver', 'static', 'visualizations');
var themeFile = path.join(__dirname, 'appserver', 'static', 'shared', 'theme.js');

var themeRaw = fs.readFileSync(themeFile, 'utf8');
var themeClean = themeRaw
    .replace(/if\s*\(typeof module[\s\S]*$/, '');

var vizDirs = fs.readdirSync(vizDir).filter(function(d) {
    return fs.statSync(path.join(vizDir, d)).isDirectory();
});

var built = 0;
vizDirs.forEach(function(vd) {
    var srcFile = path.join(vizDir, vd, 'src', 'visualization_source.js');
    if (!fs.existsSync(srcFile)) {
        console.log('  SKIP ' + vd + ' — no src/visualization_source.js');
        return;
    }

    var srcRaw = fs.readFileSync(srcFile, 'utf8');
    var srcClean = srcRaw
        .replace(/var\s+SplunkVisualizationBase\s*=\s*require\([^)]+\);?\s*/g, '')
        .replace(/var\s+theme\s*=\s*require\([^)]+\);?\s*/g, '')
        .replace(/module\.exports\s*=\s*/g, 'return ');

    var output = [
        'define(["api/SplunkVisualizationBase"], function(SplunkVisualizationBase) {',
        '',
        '// === Shared theme tokens ===',
        'var theme = (function() {',
        themeClean,
        '    return {',
        '        PALETTES: PALETTES,',
        '        FONTS: FONTS,',
        '        STATUS_COLORS: STATUS_COLORS,',
        '        SERIES_COLORS: SERIES_COLORS,',
        '        getTheme: getTheme,',
        '        detectTheme: detectTheme,',
        '        lerpColor: lerpColor,',
        '        hexToRgba: hexToRgba,',
        '        fmtNum: fmtNum,',
        '        setupCanvas: setupCanvas,',
        '        getOption: getOption,',
        '        getNS: getNS,',
        '        drawRidgeline: drawRidgeline',
        '    };',
        '})();',
        '',
        '// === Visualization source ===',
        srcClean,
        '',
        '});'
    ].join('\n');

    var outFile = path.join(vizDir, vd, 'visualization.js');
    fs.writeFileSync(outFile, output, 'utf8');
    console.log('  BUILT ' + vd + '/visualization.js (' + Math.round(output.length / 1024) + 'KB)');
    built++;
});

console.log('\nDone — ' + built + ' visualizations built.');
