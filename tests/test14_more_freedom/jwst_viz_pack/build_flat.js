var fs = require('fs');
var path = require('path');

var BASE = __dirname;
var VIZ_DIR = path.join(BASE, 'default', 'visualizations');
var THEME_PATH = path.join(VIZ_DIR, 'shared', 'theme.js');

var themeRaw = fs.readFileSync(THEME_PATH, 'utf8');

// Extract theme body: everything between the first line and module.exports
var themeLines = themeRaw.split('\n');
var themeBody = [];
var inExports = false;
for (var ti = 0; ti < themeLines.length; ti++) {
    var tl = themeLines[ti];
    if (/^module\.exports\s*=/.test(tl)) { inExports = true; continue; }
    if (inExports) continue;
    themeBody.push(tl);
}

var vizDirs = fs.readdirSync(VIZ_DIR).filter(function(d) {
    return d.indexOf('jwst_') === 0 && fs.statSync(path.join(VIZ_DIR, d)).isDirectory();
});

vizDirs.forEach(function(vizName) {
    var srcPath = path.join(VIZ_DIR, vizName, 'src', 'visualization_source.js');
    var outPath = path.join(VIZ_DIR, vizName, 'visualization.js');

    if (!fs.existsSync(srcPath)) {
        console.log('  SKIP ' + vizName);
        return;
    }

    var srcRaw = fs.readFileSync(srcPath, 'utf8');
    var srcLines = srcRaw.split('\n');

    // Process source lines
    var processedLines = [];
    for (var si = 0; si < srcLines.length; si++) {
        var line = srcLines[si];

        // Remove require() lines
        if (/^\s*var\s+\w+\s*=\s*require\s*\(/.test(line)) continue;

        // Convert module.exports = X; to return X;
        if (/^\s*module\.exports\s*=/.test(line)) {
            line = line.replace(/module\.exports\s*=/, 'return');
        }

        processedLines.push(line);
    }

    // Build output
    var out = [];
    out.push('define(["api/SplunkVisualizationBase"], function(SplunkVisualizationBase) {');
    out.push('');
    out.push('// --- shared/theme (inlined) ---');
    out.push('var theme = (function() {');
    for (var bi = 0; bi < themeBody.length; bi++) {
        out.push(themeBody[bi]);
    }
    out.push('  return {');
    out.push('    getTheme: getTheme, hexToRgb: hexToRgb, lerpColor: lerpColor,');
    out.push('    rampColor: rampColor, rgba: rgba, fmtNum: fmtNum, getNS: getNS,');
    out.push('    getOption: getOption, setupCanvas: setupCanvas, createTooltip: createTooltip,');
    out.push('    showTooltip: showTooltip, hideTooltip: hideTooltip, waitForFont: waitForFont,');
    out.push('    drawHexCorners: drawHexCorners, resetShadow: resetShadow, RAMP: RAMP, FONTS: FONTS');
    out.push('  };');
    out.push('})();');
    out.push('');
    out.push('// --- ' + vizName + ' ---');
    for (var pi = 0; pi < processedLines.length; pi++) {
        out.push(processedLines[pi]);
    }
    out.push('');
    out.push('});');

    var finalStr = out.join('\n');
    fs.writeFileSync(outPath, finalStr, 'utf8');

    // Verify
    var issues = [];
    if (finalStr.indexOf('define(') !== 0) issues.push('NO-define');
    if (!/\breturn\s+\w/.test(finalStr)) issues.push('NO-return');
    if (/^\s*var\s+\w+\s*=\s*require\s*\(/m.test(finalStr)) issues.push('HAS-require-var');
    if (/^\s*module\.exports/m.test(finalStr)) issues.push('HAS-module.exports');
    if (/[^=!<>]=>/.test(finalStr)) issues.push('HAS-arrow');
    if (/\b(const|let)\s/.test(finalStr)) issues.push('HAS-const/let');

    var trimmed = finalStr.trim();
    if (trimmed.substring(trimmed.length - 3) !== '});') issues.push('BAD-ending');

    var sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
    if (issues.length === 0) {
        console.log('  OK  ' + vizName + ' (' + sizeKB + 'KB)');
    } else {
        console.log('  FAIL ' + vizName + ' (' + sizeKB + 'KB): ' + issues.join(', '));
    }
});
