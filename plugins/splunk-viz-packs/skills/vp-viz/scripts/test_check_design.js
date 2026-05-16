#!/usr/bin/env node
/*
 * test_check_design.js -- Test suite for check_design.js
 *
 * Run: node test_check_design.js
 * Exit 0 = all tests pass, 1 = failures
 *
 * Uses only Node.js built-ins: child_process, fs, path, os.
 * No test framework required.
 *
 * Tests:
 *   - Usage guard: no args exits 2 with Usage in stderr
 *   - D03 FAIL (no hero formula): missing Math.min/Math.max/getTypoScale
 *   - D03 PASS via getTypoScale: exits 0, no FAIL D03
 *   - D03 PASS via Math.min+Math.max: exits 0, no FAIL D03
 *   - D05 FAIL (< 4 sections): formatter has only 2 form[section-label]
 *   - D05 PASS: formatter has exactly 4 form[section-label]
 *   - D01 WARN (no gradient): exits 0 (WARN only), stdout has WARN D01
 *   - D02 WARN (no shadow): exits 0 (WARN only), stdout has WARN D02
 *   - D08 FAIL forward (formatter key not in JS): exits 1, stdout has FAIL D08
 *   - D08 PASS forward: formatter key referenced in JS, no FAIL D08
 *
 * Pure ES5 CJS -- no const/let/arrow functions/template literals/import.
 */

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var os = require('os');

var SCRIPT = path.join(__dirname, 'check_design.js');

// ---- Test infrastructure ----

var passed = 0;
var failed = 0;
var tmpFiles = [];

function tmpFile(name, content) {
    var p = path.join(os.tmpdir(), 'check_design_test_' + name);
    fs.writeFileSync(p, content, 'utf8');
    tmpFiles.push(p);
    return p;
}

function run(formatterPath, jsSrcPath, themePath) {
    try {
        var args = formatterPath ? [formatterPath, jsSrcPath, themePath] : [];
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
        console.log('        actual: ' + JSON.stringify(actual.substring(0, 400)));
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
        console.log('        actual: ' + JSON.stringify(actual.substring(0, 400)));
        failed++;
    }
}

// ---- Fixture templates ----

/*
 * A minimal theme.js that satisfies D04 (has rgba() values).
 * Used as background for tests focused on other checks.
 */
var THEME_WITH_RGBA = [
    'var DARK = { bg:"#0D0D1F", panel:rgba(22,22,48,1), text:"#E8ECF0" };',
    'var LIGHT = { bg:"#F0F2F5", panel:rgba(255,255,255,0.9), text:"#1B1B3A" };',
    'function getTheme(n) { return n === "light" ? LIGHT : DARK; }',
    'module.exports = { getTheme: getTheme };'
].join('\n');

/*
 * GOOD_JS: a JS source with all positive signals — Math.min/Math.max (D03 pass),
 * createLinearGradient (D01 pass), shadowBlur (D02 pass), opt() calls to match formatter keys.
 */
var GOOD_JS = [
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
    '    ctx.shadowBlur = 8;',
    '    ctx.shadowColor = "rgba(0,0,0,0.5)";',
    '    var label = opt("myControl", "default");',
    '    detectTheme();',
    '  }',
    '};',
    'module.exports = vis;'
].join('\n');

/*
 * Formatter with 4 sections, 2 color pickers, and a named control myControl.
 * Satisfies D05 (>= 4 sections) and D06 (>= 2 color pickers).
 */
var FORMATTER_4_SECTIONS = [
    '<form section-label="Data">',
    '  <splunk-control-group label="Label">',
    '    <splunk-text-input name="{{VIZ_NAMESPACE}}.myControl" value="default"></splunk-text-input>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Colors">',
    '  <splunk-control-group label="Primary">',
    '    <splunk-color-picker type="custom" name="{{VIZ_NAMESPACE}}.primaryColor" value="#007bff"></splunk-color-picker>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Theme">',
    '  <splunk-control-group label="Mode">',
    '    <splunk-radio-input name="{{VIZ_NAMESPACE}}.themeMode" value="auto">',
    '      <splunk-radio-input-option label="Auto" value="auto"></splunk-radio-input-option>',
    '    </splunk-radio-input>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Layout">',
    '  <splunk-control-group label="Padding">',
    '    <splunk-text-input name="{{VIZ_NAMESPACE}}.padding" value="8"></splunk-text-input>',
    '  </splunk-control-group>',
    '  <splunk-control-group label="Secondary">',
    '    <splunk-color-picker type="custom" name="{{VIZ_NAMESPACE}}.secondaryColor" value="#28a745"></splunk-color-picker>',
    '  </splunk-control-group>',
    '</form>'
].join('\n');

// ---- Tests ----

console.log('\n=== check_design.js Test Suite ===\n');

// --- Usage guard: no args ---
console.log('-- CLI: no args exits 2 --');
var r = run(null, null, null);
assert('no args exits 2', r.code, 2, r.stderr);
assertIncludes('no args shows Usage in stderr', r.stderr, 'Usage:');

// --- D03 FAIL: no hero formula ---
console.log('\n-- D03 FAIL: no hero sizing formula (no Math.min/max, no getTypoScale) --');
var NO_HERO_JS = tmpFile('no_hero.js', [
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var grad = ctx.createLinearGradient(0, 0, 100, 100);',
    '    ctx.shadowBlur = 8;',
    '    ctx.shadowColor = "rgba(0,0,0,0.5)";',
    '    var label = opt("myControl", "default");',
    '    detectTheme();',
    '  }',
    '};'
].join('\n'));
var FORMATTER_D03 = tmpFile('formatter_d03.html', FORMATTER_4_SECTIONS);
var THEME_D03 = tmpFile('theme_d03.js', THEME_WITH_RGBA);
r = run(FORMATTER_D03, NO_HERO_JS, THEME_D03);
assert('D03 FAIL exits 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('D03 FAIL stdout contains FAIL D03', r.stdout, 'FAIL D03');

// --- D03 PASS via getTypoScale ---
console.log('\n-- D03 PASS: getTypoScale present --');
var TYPO_JS = tmpFile('typo.js', [
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var scale = getTypoScale(this.el.clientWidth);',
    '    var grad = ctx.createLinearGradient(0, 0, 100, 100);',
    '    ctx.shadowBlur = 8;',
    '    ctx.shadowColor = "rgba(0,0,0,0.5)";',
    '    var label = opt("myControl", "default");',
    '    detectTheme();',
    '  }',
    '};'
].join('\n'));
var FORMATTER_TYPO = tmpFile('formatter_typo.html', FORMATTER_4_SECTIONS);
var THEME_TYPO = tmpFile('theme_typo.js', THEME_WITH_RGBA);
r = run(FORMATTER_TYPO, TYPO_JS, THEME_TYPO);
assertNotIncludes('D03 PASS (getTypoScale): no FAIL D03 in stdout', r.stdout, 'FAIL D03');

// --- D03 PASS via Math.min+Math.max ---
console.log('\n-- D03 PASS: Math.min + Math.max present --');
var MINMAX_JS = tmpFile('minmax.js', [
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
    '    ctx.shadowBlur = 8;',
    '    ctx.shadowColor = "rgba(0,0,0,0.5)";',
    '    var label = opt("myControl", "default");',
    '    detectTheme();',
    '  }',
    '};'
].join('\n'));
var FORMATTER_MINMAX = tmpFile('formatter_minmax.html', FORMATTER_4_SECTIONS);
var THEME_MINMAX = tmpFile('theme_minmax.js', THEME_WITH_RGBA);
r = run(FORMATTER_MINMAX, MINMAX_JS, THEME_MINMAX);
assertNotIncludes('D03 PASS (Math.min+Max): no FAIL D03 in stdout', r.stdout, 'FAIL D03');

// --- D05 FAIL: fewer than 4 sections ---
console.log('\n-- D05 FAIL: formatter has only 2 form[section-label] elements --');
var FORMATTER_2_SECTIONS = tmpFile('formatter_2sec.html', [
    '<form section-label="Data">',
    '  <splunk-control-group label="Label">',
    '    <splunk-text-input name="{{VIZ_NAMESPACE}}.myControl" value="default"></splunk-text-input>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Colors">',
    '  <splunk-control-group label="Primary">',
    '    <splunk-color-picker type="custom" name="{{VIZ_NAMESPACE}}.primaryColor" value="#007bff"></splunk-color-picker>',
    '  </splunk-control-group>',
    '  <splunk-control-group label="Secondary">',
    '    <splunk-color-picker type="custom" name="{{VIZ_NAMESPACE}}.secondaryColor" value="#28a745"></splunk-color-picker>',
    '  </splunk-control-group>',
    '</form>'
].join('\n'));
var JS_D05 = tmpFile('js_d05.js', GOOD_JS);
var THEME_D05 = tmpFile('theme_d05.js', THEME_WITH_RGBA);
r = run(FORMATTER_2_SECTIONS, JS_D05, THEME_D05);
assert('D05 FAIL exits 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('D05 FAIL stdout contains FAIL D05', r.stdout, 'FAIL D05');

// --- D05 PASS: exactly 4 sections ---
console.log('\n-- D05 PASS: formatter has exactly 4 form[section-label] elements --');
var FORMATTER_4 = tmpFile('formatter_4sec.html', FORMATTER_4_SECTIONS);
var JS_D05_PASS = tmpFile('js_d05_pass.js', GOOD_JS);
var THEME_D05_PASS = tmpFile('theme_d05_pass.js', THEME_WITH_RGBA);
r = run(FORMATTER_4, JS_D05_PASS, THEME_D05_PASS);
assertNotIncludes('D05 PASS: no FAIL D05 in stdout', r.stdout, 'FAIL D05');

// --- D01 WARN: no gradient calls ---
// Use a minimal formatter with one control only (to avoid D08 false positives).
// The JS has Math.min/Math.max (D03 pass) and shadow (D02 pass) but no gradient.
console.log('\n-- D01 WARN: no createLinearGradient or createRadialGradient (exits 0) --');
var FORMATTER_MINIMAL = [
    '<form section-label="Section1">',
    '  <splunk-control-group label="Label">',
    '    <splunk-text-input name="{{VIZ_NAMESPACE}}.myLabel" value="default"></splunk-text-input>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Section2">',
    '  <splunk-control-group label="Color">',
    '    <splunk-color-picker type="custom" name="{{VIZ_NAMESPACE}}.primaryColor" value="#007bff"></splunk-color-picker>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Section3">',
    '  <splunk-control-group label="Color2">',
    '    <splunk-color-picker type="custom" name="{{VIZ_NAMESPACE}}.bgColor" value="#28a745"></splunk-color-picker>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Section4">',
    '  <splunk-control-group label="Mode">',
    '    <splunk-text-input name="{{VIZ_NAMESPACE}}.themeMode" value="auto"></splunk-text-input>',
    '  </splunk-control-group>',
    '</form>'
].join('\n');
var NO_GRAD_JS = tmpFile('no_grad.js', [
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    ctx.shadowBlur = 8;',
    '    ctx.shadowColor = "rgba(0,0,0,0.5)";',
    '    var label = opt("myLabel", "default");',
    '    var color = opt("primaryColor", "#007bff");',
    '    var bg = opt("bgColor", "#28a745");',
    '    var mode = opt("themeMode", "auto");',
    '    detectTheme();',
    '  }',
    '};'
].join('\n'));
var FORMATTER_D01 = tmpFile('formatter_d01.html', FORMATTER_MINIMAL);
var THEME_D01 = tmpFile('theme_d01.js', THEME_WITH_RGBA);
r = run(FORMATTER_D01, NO_GRAD_JS, THEME_D01);
assert('D01 WARN exits 0 (WARN does not cause exit 1)', r.code, 0, r.stdout + r.stderr);
assertIncludes('D01 WARN stdout contains WARN D01', r.stdout, 'WARN D01');

// --- D02 WARN: no shadow effects ---
// The JS has Math.min/Math.max (D03 pass) and gradient (D01 pass) but no shadow.
console.log('\n-- D02 WARN: no shadowBlur or shadowColor (exits 0) --');
var NO_SHADOW_JS = tmpFile('no_shadow.js', [
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
    '    var label = opt("myLabel", "default");',
    '    var color = opt("primaryColor", "#007bff");',
    '    var bg = opt("bgColor", "#28a745");',
    '    var mode = opt("themeMode", "auto");',
    '    detectTheme();',
    '  }',
    '};'
].join('\n'));
var FORMATTER_D02 = tmpFile('formatter_d02.html', FORMATTER_MINIMAL);
var THEME_D02 = tmpFile('theme_d02.js', THEME_WITH_RGBA);
r = run(FORMATTER_D02, NO_SHADOW_JS, THEME_D02);
assert('D02 WARN exits 0 (WARN does not cause exit 1)', r.code, 0, r.stdout + r.stderr);
assertIncludes('D02 WARN stdout contains WARN D02', r.stdout, 'WARN D02');

// --- D08 FAIL forward: formatter key not referenced in JS ---
console.log('\n-- D08 FAIL forward: formatter declares myControl but JS does not reference it --');
var D08_FORMATTER = tmpFile('formatter_d08.html', [
    '<form section-label="Section1">',
    '  <splunk-control-group label="Control">',
    '    <splunk-text-input name="{{VIZ_NAMESPACE}}.myControl" value="default"></splunk-text-input>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Section2">',
    '  <splunk-control-group label="Color1">',
    '    <splunk-color-picker type="custom" name="{{VIZ_NAMESPACE}}.primaryColor" value="#007bff"></splunk-color-picker>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Section3">',
    '  <splunk-control-group label="Color2">',
    '    <splunk-color-picker type="custom" name="{{VIZ_NAMESPACE}}.secondaryColor" value="#28a745"></splunk-color-picker>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Section4">',
    '  <splunk-control-group label="Mode">',
    '    <splunk-text-input name="{{VIZ_NAMESPACE}}.themeMode" value="auto"></splunk-text-input>',
    '  </splunk-control-group>',
    '</form>'
].join('\n'));
// JS does NOT contain 'myControl' as a quoted string
var D08_JS_MISSING = tmpFile('js_d08_missing.js', [
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
    '    ctx.shadowBlur = 8;',
    '    ctx.shadowColor = "rgba(0,0,0,0.5)";',
    '    var color1 = opt("primaryColor", "#007bff");',
    '    var color2 = opt("secondaryColor", "#28a745");',
    '    var mode = opt("themeMode", "auto");',
    '    detectTheme();',
    '  }',
    '};'
].join('\n'));
var THEME_D08_FAIL = tmpFile('theme_d08_fail.js', THEME_WITH_RGBA);
r = run(D08_FORMATTER, D08_JS_MISSING, THEME_D08_FAIL);
assert('D08 FAIL forward exits 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('D08 FAIL forward stdout contains FAIL D08', r.stdout, 'FAIL D08');

// --- D08 PASS forward: formatter key referenced in JS ---
console.log('\n-- D08 PASS forward: all formatter keys referenced in JS --');
var D08_JS_PRESENT = tmpFile('js_d08_present.js', [
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
    '    ctx.shadowBlur = 8;',
    '    ctx.shadowColor = "rgba(0,0,0,0.5)";',
    '    var label = opt("myControl", "default");',
    '    var color1 = opt("primaryColor", "#007bff");',
    '    var color2 = opt("secondaryColor", "#28a745");',
    '    var mode = opt("themeMode", "auto");',
    '    detectTheme();',
    '  }',
    '};'
].join('\n'));
var D08_FORMATTER_PASS = tmpFile('formatter_d08_pass.html', D08_FORMATTER);
var THEME_D08_PASS = tmpFile('theme_d08_pass.js', THEME_WITH_RGBA);
r = run(D08_FORMATTER, D08_JS_PRESENT, THEME_D08_PASS);
assertNotIncludes('D08 PASS forward: no FAIL D08 in stdout', r.stdout, 'FAIL D08');

// ---- Cleanup temp files ----
tmpFiles.forEach(function(p) {
    try { fs.unlinkSync(p); } catch (e) {}
});

// ---- Summary ----
console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===\n');
process.exit(failed > 0 ? 1 : 0);
