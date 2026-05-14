var fs = require('fs');
var path = require('path');

var VIZ_DIR = path.join(__dirname, 'appserver', 'static', 'visualizations');
var THEME_PATH = path.join(__dirname, 'shared', 'theme.js');

var themeRaw = fs.readFileSync(THEME_PATH, 'utf8');
var themeClean = themeRaw
    .replace(/if\s*\(typeof module[\s\S]*$/m, '')
    .trim();

var vizDirs = fs.readdirSync(VIZ_DIR).filter(function(d) {
    return fs.statSync(path.join(VIZ_DIR, d)).isDirectory();
});

vizDirs.forEach(function(vizName) {
    var srcPath = path.join(VIZ_DIR, vizName, 'src', 'visualization_source.js');
    if (!fs.existsSync(srcPath)) {
        console.log('SKIP ' + vizName + ' (no src/visualization_source.js)');
        return;
    }

    var src = fs.readFileSync(srcPath, 'utf8');

    src = src.replace(/var\s+SplunkVisualizationBase\s*=\s*require\([^)]+\);\s*/g, '');
    src = src.replace(/var\s+theme\s*=\s*require\([^)]+\);\s*/g, '');
    src = src.replace(/module\.exports\s*=\s*/, 'return ');

    var output = [
        'define(["api/SplunkVisualizationBase"], function(SplunkVisualizationBase) {',
        '',
        '// --- theme.js (inlined) ---',
        'var theme = (function() {',
        themeClean,
        'return {',
        '    FONTS: FONTS,',
        '    DARK: DARK,',
        '    LIGHT: LIGHT,',
        '    SEMANTIC: SEMANTIC,',
        '    CATEGORY_COLORS: CATEGORY_COLORS,',
        '    getTheme: getTheme,',
        '    getSemantic: getSemantic,',
        '    detectTheme: detectTheme,',
        '    safeStr: safeStr,',
        '    fmtNum: fmtNum,',
        '    getOption: getOption,',
        '    getNS: getNS,',
        '    lerpColor: lerpColor',
        '};',
        '})();',
        '',
        '// --- visualization source ---',
        src,
        '',
        '});'
    ].join('\n');

    var outPath = path.join(VIZ_DIR, vizName, 'visualization.js');
    fs.writeFileSync(outPath, output, 'utf8');
    console.log('OK ' + vizName + ' → visualization.js (' + output.length + ' bytes)');
});

console.log('\nBuild complete.');
