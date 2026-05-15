#!/usr/bin/env node
/*
 * test_check_contrast.js -- TDD test suite for check_contrast.js
 *
 * Run: node test_check_contrast.js
 * Exit 0 = all tests pass, 1 = failures
 *
 * Uses only Node.js built-ins: child_process, fs, path, os.
 * No test framework required.
 *
 * Tests:
 *   Unit tests (synthetic fixtures):
 *     - BAD_THEME: low-contrast light theme → exit 1 + FAIL CONTRAST + FINDING:
 *     - GOOD_THEME: high-contrast dark+light → exit 0, no FAIL CONTRAST
 *     - WARN_ONLY: textFaint below 3.0:1 but all FAIL pairs pass → exit 0 + WARN CONTRAST
 *     - No args → exit 2
 *     - Nonexistent file → exit 1
 *
 *   Integration tests (real theme.js files from tests/):
 *     - REAL_THEME_TEST28 (if file exists): check_contrast.js runs without crashing;
 *       any FAIL CONTRAST found is expected (these themes have known contrast issues
 *       that check_contrast.js is designed to surface -- see memory note).
 *     - REAL_THEME_TEST25 (if file exists): same.
 *
 * Pure ES5 CJS -- no const/let/arrow functions/template literals/import.
 */

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var os = require('os');

var SCRIPT = path.join(__dirname, 'check_contrast.js');
var REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

var REAL_THEME_TEST28 = path.join(REPO_ROOT,
    'tests', 'test28_drilldown_tabs', 'cloudflare_noc', 'shared', 'theme.js');
var REAL_THEME_TEST25 = path.join(REPO_ROOT,
    'tests', 'test25_v4', 'hospital_nps_gauge', 'shared', 'theme.js');

// ---- Test infrastructure ----

var passed = 0;
var failed = 0;
var tmpFiles = [];

function tmpFile(name, content) {
    var p = path.join(os.tmpdir(), 'check_contrast_test_' + name);
    fs.writeFileSync(p, content, 'utf8');
    tmpFiles.push(p);
    return p;
}

function run(args) {
    try {
        var result = child_process.spawnSync(
            'node',
            [SCRIPT].concat(args),
            { encoding: 'utf8', timeout: 15000 }
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

function assertNotIncludes(description, actual, needle) {
    if (actual.indexOf(needle) === -1) {
        console.log('  PASS: ' + description);
        passed++;
    } else {
        console.log('  FAIL: ' + description);
        console.log('        expected NOT to contain: ' + JSON.stringify(needle));
        console.log('        actual: ' + JSON.stringify(actual.substring(0, 300)));
        failed++;
    }
}

// ---- Synthetic fixtures ----

/*
 * BAD_THEME: LIGHT has text=#AAAAAA on bg=#FFFFFF = ~2.32:1 (must FAIL at 4.5:1 threshold).
 * DARK tokens are fine (high contrast) so only LIGHT pairs fail.
 */
var BAD_THEME = tmpFile('bad_theme.js', [
    'var DARK = { bg:"#0D0D1F", panel:"#161630", panelHi:"#1E1E42",',
    '  text:"#E8ECF0", textDim:"#8B8FA3", textFaint:"#555874" };',
    'var LIGHT = { bg:"#FFFFFF", panel:"#FFFFFF", panelHi:"#FFFFFF",',
    '  text:"#AAAAAA", textDim:"#BBBBBB", textFaint:"#CCCCCC" };',
    'function getTheme(n) { return n === "light" ? LIGHT : DARK; }',
    'module.exports = { getTheme: getTheme };'
].join('\n'));

/*
 * GOOD_THEME: both DARK and LIGHT have genuinely high-contrast text pairs.
 * DARK: text=#E8ECF0 on bg=#0D0D1F (~14.5:1) -- well above 4.5:1
 * LIGHT: text=#1B1B3A on bg=#F0F2F5 (~13.8:1) -- well above 4.5:1
 * textFaint values also exceed 3.0:1 threshold.
 */
var GOOD_THEME = tmpFile('good_theme.js', [
    'var DARK = { bg:"#0D0D1F", panel:"#161630", panelHi:"#1E1E42",',
    '  text:"#E8ECF0", textDim:"#B0B4C8", textFaint:"#7A7F9A" };',
    'var LIGHT = { bg:"#F0F2F5", panel:"#FFFFFF", panelHi:"#F8F9FA",',
    '  text:"#1B1B3A", textDim:"#3D4152", textFaint:"#4A4F66" };',
    'function getTheme(n) { return n === "light" ? LIGHT : DARK; }',
    'module.exports = { getTheme: getTheme };'
].join('\n'));

/*
 * WARN_ONLY theme: all FAIL pairs pass (>= 4.5:1) but textFaint/bg is below 3.0:1.
 * LIGHT textFaint = #C0C0C0 on bg = #F0F2F5:
 *   luminance(#C0C0C0) ~ 0.502, luminance(#F0F2F5) ~ 0.871
 *   ratio = (0.871+0.05)/(0.502+0.05) = 0.921/0.552 ~ 1.67:1 -- below 3.0 WARN threshold.
 * All text/panel/panelHi pairs use dark text (#1B1B3A) which is high contrast.
 */
var WARN_ONLY = tmpFile('warn_only.js', [
    'var DARK = { bg:"#0D0D1F", panel:"#161630", panelHi:"#1E1E42",',
    '  text:"#E8ECF0", textDim:"#B0B4C8", textFaint:"#7A7F9A" };',
    'var LIGHT = { bg:"#F0F2F5", panel:"#FFFFFF", panelHi:"#F8F9FA",',
    '  text:"#1B1B3A", textDim:"#3D4152", textFaint:"#C0C0C0" };',
    'function getTheme(n) { return n === "light" ? LIGHT : DARK; }',
    'module.exports = { getTheme: getTheme };'
].join('\n'));

// ---- Tests ----

console.log('\n=== check_contrast.js Test Suite ===\n');

// --- CLI usage ---
console.log('-- CLI: no args exits 2 --');
var r = run([]);
assert('no args exits 2', r.code, 2, r.stderr);
assertIncludes('no args shows Usage in stderr', r.stderr, 'Usage');

// --- Nonexistent file ---
console.log('\n-- CLI: nonexistent file exits 1 --');
r = run(['/tmp/nonexistent_theme_xyz_abc.js']);
assert('nonexistent file exits 1', r.code, 1, r.stderr);
assertIncludes('nonexistent file shows error in stderr', r.stderr, 'not found');

// --- BAD_THEME: low-contrast light tokens ---
console.log('\n-- Unit: BAD_THEME (LIGHT text=#AAAAAA on bg=#FFFFFF ~2.32:1) --');
r = run([BAD_THEME]);
assert('BAD_THEME exits 1 (FAIL violations)', r.code, 1, r.stdout + r.stderr);
assertIncludes('BAD_THEME stdout contains FAIL CONTRAST', r.stdout, 'FAIL CONTRAST');
assertIncludes('BAD_THEME stdout mentions light.text/bg', r.stdout, 'light.text/bg');
assertIncludes('BAD_THEME stderr contains FINDING:', r.stderr, 'FINDING:');
assertIncludes('BAD_THEME FINDING: has code CONTRAST', r.stderr, '"code":"CONTRAST"');

// --- GOOD_THEME: all pairs pass ---
console.log('\n-- Unit: GOOD_THEME (all pairs >= 4.5:1) --');
r = run([GOOD_THEME]);
assert('GOOD_THEME exits 0', r.code, 0, r.stdout + r.stderr);
assertNotIncludes('GOOD_THEME has no FAIL CONTRAST in stdout', r.stdout, 'FAIL CONTRAST');

// --- WARN_ONLY: textFaint fails 3.0:1 but no FAIL pairs ---
console.log('\n-- Unit: WARN_ONLY (textFaint below 3.0:1 WARN threshold only) --');
r = run([WARN_ONLY]);
assert('WARN_ONLY exits 0 (WARN does not cause exit 1)', r.code, 0, r.stdout + r.stderr);
assertIncludes('WARN_ONLY stdout contains WARN CONTRAST', r.stdout, 'WARN CONTRAST');
assertNotIncludes('WARN_ONLY has no FAIL CONTRAST in stdout', r.stdout, 'FAIL CONTRAST');

// --- Output format check ---
console.log('\n-- Output format: two leading spaces --');
r = run([BAD_THEME]);
if (r.stdout.indexOf('FAIL CONTRAST') !== -1) {
    var firstLine = r.stdout.split('\n')[0];
    assert('FAIL CONTRAST line starts with two spaces', firstLine.slice(0, 2), '  ', firstLine);
} else {
    console.log('  SKIP: no FAIL CONTRAST output to check format');
}

// --- Integration tests (real theme.js files) ---

console.log('\n-- Integration: real theme.js files --');

if (fs.existsSync(REAL_THEME_TEST28)) {
    r = run([REAL_THEME_TEST28]);
    // The real test28 theme has known light.textDim contrast issues that this tool surfaces.
    // We assert that the script runs cleanly (exit 0 or 1 only, not crash) and produces
    // structured NDJSON output if failures are found. This validates correct tool behavior.
    assert('test28 real theme exits 0 or 1 (no crash)', r.code === 0 || r.code === 1, true,
        'exit: ' + r.code + '\nstdout: ' + r.stdout.substring(0, 200));
    if (r.code === 1) {
        assertIncludes('test28 FAIL includes FINDING: NDJSON', r.stderr, 'FINDING:');
        console.log('  INFO: test28 theme has contrast issues (expected -- tool is working correctly)');
        console.log('  INFO: ' + r.stdout.replace(/\n/g, '\n  INFO: ').trim());
    } else {
        console.log('  INFO: test28 theme passes all contrast checks');
    }
} else {
    console.log('  SKIP: test28 real theme.js not found at: ' + REAL_THEME_TEST28);
}

if (fs.existsSync(REAL_THEME_TEST25)) {
    r = run([REAL_THEME_TEST25]);
    assert('test25 real theme exits 0 or 1 (no crash)', r.code === 0 || r.code === 1, true,
        'exit: ' + r.code + '\nstdout: ' + r.stdout.substring(0, 200));
    if (r.code === 1) {
        assertIncludes('test25 FAIL includes FINDING: NDJSON', r.stderr, 'FINDING:');
        console.log('  INFO: test25 theme has contrast issues (expected -- tool is working correctly)');
        console.log('  INFO: ' + r.stdout.replace(/\n/g, '\n  INFO: ').trim());
    } else {
        console.log('  INFO: test25 theme passes all contrast checks');
    }
} else {
    console.log('  SKIP: test25 real theme.js not found at: ' + REAL_THEME_TEST25);
}

// ---- Cleanup temp files ----
tmpFiles.forEach(function(p) {
    try { fs.unlinkSync(p); } catch (e) {}
});

// ---- Summary ----
console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===\n');
process.exit(failed > 0 ? 1 : 0);
