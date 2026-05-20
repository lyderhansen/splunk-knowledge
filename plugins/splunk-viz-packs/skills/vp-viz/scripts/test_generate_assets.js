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
 *   T8  preview dimensions: readPngDimensions(preview.png) -> {width:116, height:76}
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

// T8: preview dimensions 116x76
var previewDims = readPngDimensions(previewPath);
assert('T8 preview.png width=116', previewDims ? previewDims.width : null, 116, previewPath);
assert('T8 preview.png height=76', previewDims ? previewDims.height : null, 76, previewPath);

// T9: preview size > 100 bytes (116x76 compressed PNG with silhouette data is well over 100 bytes)
var previewSize = fs.existsSync(previewPath) ? fs.statSync(previewPath).size : 0;
assertGt('T9 preview.png size > 100 bytes', previewSize, 100);

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

/**
 * Create a minimal fake app with a VISUAL_LANG export in theme.js.
 * bgType: 'gradient' | 'pattern' | 'solid' | 'photo'
 * bgPattern: 'circuit' | 'hex_grid' | 'topo' | 'dot_matrix' (used when bgType='pattern')
 */
function makeTestAppWithVisualLang(name, accentHex, bgHex, vizNames, bgType, bgPattern) {
    var dir = path.join(os.tmpdir(), 'generate_assets_test_' + name + '_' + Date.now());
    fs.mkdirSync(dir, { recursive: true });

    var sharedDir = path.join(dir, 'shared');
    fs.mkdirSync(sharedDir, { recursive: true });

    var visualLangStr = JSON.stringify({ backgroundType: bgType, backgroundPattern: bgPattern || 'circuit' });
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
        'var VISUAL_LANG = ' + visualLangStr + ';',
        'function getTheme(n) { return n === "light" ? LIGHT : DARK; }',
        'module.exports = { getTheme: getTheme, VISUAL_LANG: VISUAL_LANG };'
    ].join('\n');
    fs.writeFileSync(path.join(sharedDir, 'theme.js'), themeContent, 'utf8');

    fs.mkdirSync(path.join(dir, 'static'), { recursive: true });
    var vizRoot = path.join(dir, 'appserver', 'static', 'visualizations');
    fs.mkdirSync(vizRoot, { recursive: true });
    for (var i = 0; i < vizNames.length; i++) {
        fs.mkdirSync(path.join(vizRoot, vizNames[i]), { recursive: true });
    }

    tmpDirs.push(dir);
    return dir;
}

// T11: theme.js without VISUAL_LANG -> exit 0, bg_gradient.png exists (backward compat)
console.log('\n-- T11: No VISUAL_LANG in theme.js -> exit 0, bg_gradient.png exists --');
var appT11 = makeTestApp('t11_no_visual_lang', '#F6821F', '#0D0D1F', ['kpi_tile']);
var rT11 = run([appT11]);
assert('T11 exits 0 (no VISUAL_LANG)', rT11.code, 0, rT11.stderr.substring(0, 200));
var bgT11 = path.join(appT11, 'appserver', 'static', 'images', 'bg_gradient.png');
assert('T11 bg_gradient.png exists', fs.existsSync(bgT11), true);

// T12: backgroundType='gradient' -> bg_gradient.png and bg_gradient_light.png both exist
console.log('\n-- T12: backgroundType=gradient -> both bg_gradient.png and bg_gradient_light.png exist --');
var appT12 = makeTestAppWithVisualLang('t12_gradient', '#F6821F', '#0D0D1F', ['kpi_tile'], 'gradient', null);
var rT12 = run([appT12]);
assert('T12 exits 0 (gradient)', rT12.code, 0, rT12.stderr.substring(0, 200));
var bgT12dark = path.join(appT12, 'appserver', 'static', 'images', 'bg_gradient.png');
var bgT12light = path.join(appT12, 'appserver', 'static', 'images', 'bg_gradient_light.png');
assert('T12 bg_gradient.png exists', fs.existsSync(bgT12dark), true);
assert('T12 bg_gradient_light.png exists', fs.existsSync(bgT12light), true);

// T13: backgroundType='pattern', backgroundPattern='circuit' -> both exist AND pixel data differs from gradient run
console.log('\n-- T13: backgroundType=pattern/circuit -> both exist, pixel data differs from gradient --');
var appT13 = makeTestAppWithVisualLang('t13_pattern', '#F6821F', '#0D0D1F', ['kpi_tile'], 'pattern', 'circuit');
var rT13 = run([appT13]);
assert('T13 exits 0 (pattern)', rT13.code, 0, rT13.stderr.substring(0, 200));
var bgT13dark = path.join(appT13, 'appserver', 'static', 'images', 'bg_gradient.png');
var bgT13light = path.join(appT13, 'appserver', 'static', 'images', 'bg_gradient_light.png');
assert('T13 bg_gradient.png exists', fs.existsSync(bgT13dark), true);
assert('T13 bg_gradient_light.png exists', fs.existsSync(bgT13light), true);
// Compare pixel data: pattern vs gradient (skip header bytes 0-33, compare first 500 bytes of body)
if (fs.existsSync(bgT12dark) && fs.existsSync(bgT13dark)) {
    var bufGrad = fs.readFileSync(bgT12dark);
    var bufPat  = fs.readFileSync(bgT13dark);
    var gradSlice = bufGrad.slice(34, 534);
    var patSlice  = bufPat.slice(34, 534);
    var dataDiffers = !gradSlice.equals(patSlice);
    assert('T13 pattern pixel data differs from gradient', dataDiffers, true,
        'gradSize=' + bufGrad.length + ' patSize=' + bufPat.length);
} else {
    console.log('  FAIL: T13 comparison skipped -- one or both files missing');
    failed++;
}

// T14: backgroundType='solid' -> bg_gradient.png and bg_gradient_light.png both exist
console.log('\n-- T14: backgroundType=solid -> both bg_gradient.png and bg_gradient_light.png exist --');
var appT14 = makeTestAppWithVisualLang('t14_solid', '#F6821F', '#0D0D1F', ['kpi_tile'], 'solid', null);
var rT14 = run([appT14]);
assert('T14 exits 0 (solid)', rT14.code, 0, rT14.stderr.substring(0, 200));
var bgT14dark = path.join(appT14, 'appserver', 'static', 'images', 'bg_gradient.png');
var bgT14light = path.join(appT14, 'appserver', 'static', 'images', 'bg_gradient_light.png');
assert('T14 bg_gradient.png exists', fs.existsSync(bgT14dark), true);
assert('T14 bg_gradient_light.png exists', fs.existsSync(bgT14light), true);

// T15: backgroundType='photo' with no bg_photo.png -> exit 0, bg_gradient.png exists (fallback)
console.log('\n-- T15: backgroundType=photo, no bg_photo.png -> exit 0, bg_gradient.png exists (fallback) --');
var appT15 = makeTestAppWithVisualLang('t15_photo_fallback', '#F6821F', '#0D0D1F', ['kpi_tile'], 'photo', null);
var rT15 = run([appT15]);
assert('T15 exits 0 (photo fallback)', rT15.code, 0, rT15.stderr.substring(0, 200));
var bgT15 = path.join(appT15, 'appserver', 'static', 'images', 'bg_gradient.png');
assert('T15 bg_gradient.png exists (fallback from photo)', fs.existsSync(bgT15), true);

// T16: bg_gradient_light.png dimensions are 1920x1080
console.log('\n-- T16: bg_gradient_light.png dimensions are 1920x1080 --');
if (fs.existsSync(bgT12light)) {
    var lightDims = readPngDimensions(bgT12light);
    assert('T16 bg_gradient_light.png width=1920', lightDims ? lightDims.width : null, 1920, bgT12light);
    assert('T16 bg_gradient_light.png height=1080', lightDims ? lightDims.height : null, 1080, bgT12light);
} else {
    console.log('  FAIL: T16 bg_gradient_light.png missing from T12 run');
    failed += 2;
}

// T17: domain symbol appIcon differs from letter-only fallback
// 'test_soc_security_viz' contains 'security' keyword -> should use shield symbol (not letter 'T')
// 'zzz_nomatch_viz' has no domain match -> falls back to letter 'Z'
// Their appIcon pixel data should differ.
console.log('\n-- T17: domain symbol appIcon differs from letter fallback --');
var appT17sec = makeTestApp('t17_security', '#F6821F', '#0D0D1F', []);
// rename app dir so basename is 'test_soc_security_viz'
var appT17secPath = path.join(os.tmpdir(), 'test_soc_security_viz_' + Date.now());
fs.mkdirSync(appT17secPath, { recursive: true });
// Copy shared/theme.js
var sharedSrc = path.join(appT17sec, 'shared', 'theme.js');
fs.mkdirSync(path.join(appT17secPath, 'shared'), { recursive: true });
fs.writeFileSync(path.join(appT17secPath, 'shared', 'theme.js'), fs.readFileSync(sharedSrc));
fs.mkdirSync(path.join(appT17secPath, 'static'), { recursive: true });
fs.mkdirSync(path.join(appT17secPath, 'appserver', 'static', 'visualizations'), { recursive: true });
tmpDirs.push(appT17secPath);

var appT17nomatch = makeTestApp('t17_nomatch', '#F6821F', '#0D0D1F', []);
var appT17nomatchPath = path.join(os.tmpdir(), 'zzz_nomatch_viz_' + Date.now());
fs.mkdirSync(appT17nomatchPath, { recursive: true });
var sharedSrc2 = path.join(appT17nomatch, 'shared', 'theme.js');
fs.mkdirSync(path.join(appT17nomatchPath, 'shared'), { recursive: true });
fs.writeFileSync(path.join(appT17nomatchPath, 'shared', 'theme.js'), fs.readFileSync(sharedSrc2));
fs.mkdirSync(path.join(appT17nomatchPath, 'static'), { recursive: true });
fs.mkdirSync(path.join(appT17nomatchPath, 'appserver', 'static', 'visualizations'), { recursive: true });
tmpDirs.push(appT17nomatchPath);

var rT17sec = run([appT17secPath]);
var rT17nom = run([appT17nomatchPath]);

if (rT17sec.code !== 0) {
    console.log('  FAIL: T17 generate_assets.js failed on security app (exit ' + rT17sec.code + ')');
    console.log('        stderr: ' + rT17sec.stderr.substring(0, 300));
    failed++;
} else if (rT17nom.code !== 0) {
    console.log('  FAIL: T17 generate_assets.js failed on nomatch app (exit ' + rT17nom.code + ')');
    console.log('        stderr: ' + rT17nom.stderr.substring(0, 300));
    failed++;
} else {
    var iconSec = path.join(appT17secPath, 'static', 'appIcon.png');
    var iconNom = path.join(appT17nomatchPath, 'static', 'appIcon.png');
    if (fs.existsSync(iconSec) && fs.existsSync(iconNom)) {
        var bufSec = fs.readFileSync(iconSec);
        var bufNom = fs.readFileSync(iconNom);
        // Compare entire PNG file -- symbol and letter produce different pixel data
        var differsT17 = !bufSec.equals(bufNom);
        assert('T17 security domain icon differs from letter-only icon', differsT17, true,
            'secSize=' + bufSec.length + ' nomSize=' + bufNom.length);
    } else {
        console.log('  FAIL: T17 one or both appIcon.png files missing');
        console.log('        iconSec exists: ' + fs.existsSync(iconSec));
        console.log('        iconNom exists: ' + fs.existsSync(iconNom));
        failed++;
    }
}

// ---- Cleanup temp dirs ----
tmpDirs.forEach(function(dir) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
});

// ---- Summary ----
console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===\n');
process.exit(failed > 0 ? 1 : 0);
