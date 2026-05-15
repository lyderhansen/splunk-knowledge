#!/usr/bin/env node
/*
 * test_generate_assets.js -- TDD test suite for generate_assets.js
 *
 * Run: node test_generate_assets.js
 * Exit 0 = all tests pass, 1 = failures
 *
 * Uses only Node.js built-ins: child_process, fs, path, os.
 * No test framework required.
 *
 * Tests:
 *   T1  Usage error: no args -> exit 2
 *   T2  Missing dir: nonexistent path -> exit 1
 *   T3  appIcon created: runs on app with accent=#F6821F, bg=#0D0D1F, vizNames=['kpi_tile'] -> exit 0, static/appIcon.png exists
 *   T4  appIcon dimensions: readPngDimensions(appIcon.png) -> {width:36, height:36}
 *   T5  appIcon_2x dimensions: readPngDimensions(appIcon_2x.png) -> {width:72, height:72}
 *   T6  appIcon size: fs.statSync(appIcon.png).size > 500
 *   T7  preview created: preview.png exists at appserver/static/visualizations/kpi_tile/preview.png
 *   T8  preview dimensions: readPngDimensions(preview.png) -> {width:300, height:200}
 *   T9  preview size: fs.statSync(preview.png).size > 500
 *   T10 bars silhouette differs from kpi: preview.png for bar_chart vs kpi_tile differ (different pixel data)
 *
 * Pure ES5 CJS -- no const/let/arrow functions/template literals/import.
 */

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var os = require('os');

var SCRIPT = path.join(__dirname, 'generate_assets.js');

// ---- Test infrastructure ----

var passed = 0;
var failed = 0;
var tmpDirs = [];

/**
 * Create a minimal fake Splunk viz pack app directory with theme.js and viz subdirectories.
 * Returns path to the temporary app directory.
 */
function makeTestApp(name, accentHex, bgHex, vizNames) {
    var dir = path.join(os.tmpdir(), 'generate_assets_test_' + name + '_' + Date.now());
    fs.mkdirSync(dir, { recursive: true });

    // shared/theme.js
    var sharedDir = path.join(dir, 'shared');
    fs.mkdirSync(sharedDir, { recursive: true });
    var themeContent = [
        'var DARK = {',
        '  accent: "' + accentHex + '",',
        '  bg: "' + bgHex + '",',
        '  panel: "#161630",',
        '  panelHi: "#1E1E42",',
        '  text: "#E8ECF0"',
        '};',
        'var LIGHT = {',
        '  accent: "' + accentHex + '",',
        '  bg: "#F0F2F5",',
        '  panel: "#FFFFFF",',
        '  panelHi: "#F8F9FA",',
        '  text: "#1B1B3A"',
        '};',
        'function getTheme(n) { return n === "light" ? LIGHT : DARK; }',
        'module.exports = { getTheme: getTheme };'
    ].join('\n');
    fs.writeFileSync(path.join(sharedDir, 'theme.js'), themeContent, 'utf8');

    // static/ directory (for appIcon)
    var staticDir = path.join(dir, 'static');
    fs.mkdirSync(staticDir, { recursive: true });

    // appserver/static/visualizations/<viz>/ per vizNames
    var vizRoot = path.join(dir, 'appserver', 'static', 'visualizations');
    fs.mkdirSync(vizRoot, { recursive: true });
    for (var i = 0; i < vizNames.length; i++) {
        fs.mkdirSync(path.join(vizRoot, vizNames[i]), { recursive: true });
    }

    tmpDirs.push(dir);
    return dir;
}

/**
 * Read PNG dimensions from file.
 * PNG IHDR: bytes 16-19 = width (big-endian uint32), bytes 20-23 = height.
 * Returns {width: N, height: N} or null if file is not a valid PNG.
 */
function readPngDimensions(filePath) {
    try {
        var buf = fs.readFileSync(filePath);
        // PNG signature is first 8 bytes
        if (buf.length < 24) { return null; }
        var width = buf.readUInt32BE(16);
        var height = buf.readUInt32BE(20);
        return { width: width, height: height };
    } catch (e) {
        return null;
    }
}

/**
 * Run the generate_assets.js script with the given arguments.
 * Returns {stdout, stderr, code}.
 */
function run(args) {
    try {
        var result = child_process.spawnSync(
            'node',
            [SCRIPT].concat(args),
            { encoding: 'utf8', timeout: 30000 }
        );
        return {
            stdout: result.stdout || '',
            stderr: result.stderr || '',
            code: result.status
        };
    } catch (e) {
        return { stdout: '', stderr: String(e), code: -1 };
    }
}

function assert(description, actual, expected, detail) {
    if (actual === expected) {
        console.log('  PASS: ' + description);
        passed++;
    } else {
        console.log('  FAIL: ' + description);
        console.log('        expected: ' + JSON.stringify(expected));
        console.log('        actual:   ' + JSON.stringify(actual));
        if (detail) { console.log('        detail:   ' + detail); }
        failed++;
    }
}

function assertGt(description, actual, minVal, detail) {
    if (actual > minVal) {
        console.log('  PASS: ' + description + ' (' + actual + ' > ' + minVal + ')');
        passed++;
    } else {
        console.log('  FAIL: ' + description);
        console.log('        expected: > ' + minVal);
        console.log('        actual:   ' + actual);
        if (detail) { console.log('        detail:   ' + detail); }
        failed++;
    }
}

function assertIncludes(description, actual, needle) {
    if (actual.indexOf(needle) !== -1) {
        console.log('  PASS: ' + description);
        passed++;
    } else {
        console.log('  FAIL: ' + description);
        console.log('        expected to contain: ' + JSON.stringify(needle));
        console.log('        actual: ' + JSON.stringify(actual.substring(0, 300)));
        failed++;
    }
}

// ---- Tests ----

console.log('\n=== generate_assets.js Test Suite ===\n');

// T1: Usage error -- no args -> exit 2
console.log('-- T1: Usage error (no args -> exit 2) --');
var r = run([]);
assert('T1 no args exits 2', r.code, 2);

// T2: Missing dir -> exit 1
console.log('\n-- T2: Nonexistent directory -> exit 1 --');
r = run(['/tmp/nonexistent_splunk_app_xyz_abc_does_not_exist']);
assert('T2 nonexistent dir exits 1', r.code, 1);

// T3-T9: Full run on a real test app
console.log('\n-- T3-T9: Full run with kpi_tile viz --');
var testApp = makeTestApp('kpi_tile_test', '#F6821F', '#0D0D1F', ['kpi_tile']);
r = run([testApp]);
if (r.code !== 0) {
    console.log('  ERROR: generate_assets.js failed (exit ' + r.code + ')');
    console.log('  stdout: ' + r.stdout.substring(0, 500));
    console.log('  stderr: ' + r.stderr.substring(0, 500));
}

// T3: exit 0
assert('T3 exits 0 on success', r.code, 0, r.stderr.substring(0, 200));

// T3: appIcon.png exists
var appIconPath = path.join(testApp, 'static', 'appIcon.png');
assert('T3 static/appIcon.png exists', fs.existsSync(appIconPath), true);

// T4: appIcon dimensions 36x36
var iconDims = readPngDimensions(appIconPath);
assert('T4 appIcon.png width=36', iconDims ? iconDims.width : null, 36, appIconPath);
assert('T4 appIcon.png height=36', iconDims ? iconDims.height : null, 36, appIconPath);

// T5: appIcon_2x dimensions 72x72
var appIcon2xPath = path.join(testApp, 'static', 'appIcon_2x.png');
assert('T5 static/appIcon_2x.png exists', fs.existsSync(appIcon2xPath), true);
var icon2xDims = readPngDimensions(appIcon2xPath);
assert('T5 appIcon_2x.png width=72', icon2xDims ? icon2xDims.width : null, 72, appIcon2xPath);
assert('T5 appIcon_2x.png height=72', icon2xDims ? icon2xDims.height : null, 72, appIcon2xPath);

// T6: appIcon size > 500 bytes
var iconSize = fs.existsSync(appIconPath) ? fs.statSync(appIconPath).size : 0;
assertGt('T6 appIcon.png size > 500 bytes', iconSize, 500);

// T7: preview.png exists
var previewPath = path.join(testApp, 'appserver', 'static', 'visualizations', 'kpi_tile', 'preview.png');
assert('T7 kpi_tile/preview.png exists', fs.existsSync(previewPath), true);

// T8: preview dimensions 300x200
var previewDims = readPngDimensions(previewPath);
assert('T8 preview.png width=300', previewDims ? previewDims.width : null, 300, previewPath);
assert('T8 preview.png height=200', previewDims ? previewDims.height : null, 200, previewPath);

// T9: preview size > 500 bytes
var previewSize = fs.existsSync(previewPath) ? fs.statSync(previewPath).size : 0;
assertGt('T9 preview.png size > 500 bytes', previewSize, 500);

// T10: bars silhouette differs from kpi silhouette
console.log('\n-- T10: bar_chart silhouette differs from kpi_tile silhouette --');
var testApp2 = makeTestApp('bars_test', '#F6821F', '#0D0D1F', ['bar_chart', 'kpi_tile']);
r = run([testApp2]);
if (r.code === 0) {
    var barPreview = path.join(testApp2, 'appserver', 'static', 'visualizations', 'bar_chart', 'preview.png');
    var kpiPreview = path.join(testApp2, 'appserver', 'static', 'visualizations', 'kpi_tile', 'preview.png');
    var barExists = fs.existsSync(barPreview);
    var kpiExists = fs.existsSync(kpiPreview);
    assert('T10 bar_chart/preview.png exists', barExists, true);
    assert('T10 kpi_tile/preview.png exists (in bars app)', kpiExists, true);
    if (barExists && kpiExists) {
        var barBuf = fs.readFileSync(barPreview);
        var kpiBuf = fs.readFileSync(kpiPreview);
        // Files should differ -- different silhouettes
        var different = !barBuf.equals(kpiBuf);
        assert('T10 bar_chart and kpi_tile previews are different files', different, true,
            'barSize=' + barBuf.length + ' kpiSize=' + kpiBuf.length);
    }
} else {
    console.log('  FAIL: T10 generate_assets.js failed on bars_test app (exit ' + r.code + ')');
    console.log('        stderr: ' + r.stderr.substring(0, 300));
    failed++;
}

// ---- Cleanup temp dirs ----
tmpDirs.forEach(function(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
});

// ---- Summary ----
console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===\n');
process.exit(failed > 0 ? 1 : 0);
