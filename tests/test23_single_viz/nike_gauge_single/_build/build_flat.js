var fs = require('fs');
var path = require('path');

var VIZ_ROOT = path.resolve(__dirname, '..', 'appserver', 'static', 'visualizations');
var SHARED = path.resolve(__dirname, '..', 'shared');
var themeRaw = fs.readFileSync(path.join(SHARED, 'theme.js'), 'utf8');

var themeBody = themeRaw
    .replace(/^var\s+\w+\s*=\s*require\(.+\);?\s*$/gm, '')
    .replace(/module\.exports\s*=\s*\{[\s\S]*$/, '');

var vizDirs = fs.readdirSync(VIZ_ROOT).filter(function(n) {
    var srcPath = path.join(VIZ_ROOT, n, 'src', 'visualization_source.js');
    return fs.existsSync(srcPath);
});

vizDirs.forEach(function(vizName) {
    var srcPath = path.join(VIZ_ROOT, vizName, 'src', 'visualization_source.js');
    var outPath = path.join(VIZ_ROOT, vizName, 'visualization.js');
    var src = fs.readFileSync(srcPath, 'utf8');

    src = src.replace(/^var\s+\w+\s*=\s*require\(.+\);?\s*$/gm, '');
    src = src.replace(/^module\.exports\s*=\s*/m, 'return ');

    var output = [
        'define(["api/SplunkVisualizationBase","api/SplunkVisualizationUtils"], ' +
        'function(SplunkVisualizationBase, SplunkVisualizationUtils) {',
        '',
        '// ── Inlined theme.js ──',
        'var theme = (function() {',
        themeBody,
        '    return { getTheme:getTheme, withAlpha:withAlpha, lerpColor:lerpColor,',
        '        hexToRgb:hexToRgb, fmtNum:fmtNum, FONTS:FONTS };',
        '})();',
        '',
        '// ── Viz source ──',
        src,
        '',
        '});'
    ].join('\n');

    fs.writeFileSync(outPath, output);
    console.log('  Built: ' + vizName + '/visualization.js');
});

console.log('Done — ' + vizDirs.length + ' vizs built (flat AMD).');
