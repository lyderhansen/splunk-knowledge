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
 *   - D01 FAIL gradient-required: theme.js has fillTechnique:'gradient', JS has no gradient calls, exits 1 FAIL D01
 *   - D01 WARN no-fillTechnique declared: theme.js has no fillTechnique, JS has no gradient calls, exits 0 WARN D01
 *   - D01 PASS gradient-required with gradient calls: theme.js has fillTechnique:'gradient', JS has createLinearGradient, no D01
 *   - D02 WARN (no shadow): exits 0 (WARN only), stdout has WARN D02
 *   - D08 FAIL forward (formatter key not in JS): exits 1, stdout has FAIL D08
 *   - D08 PASS forward: formatter key referenced in JS, no FAIL D08
 *   - D09 FAIL ternary cap: gi > 1 ? 1 : gi pattern detected
 *   - D09 FAIL Math.min cap: Math.min(gi, 1) pattern detected
 *   - D09 PASS uncapped: no ceiling clamp on gi
 *   - D10 FAIL missing annotation: no @viz-type on first line
 *   - D10 PASS valid annotation: // @viz-type: kpi on first line
 *   - D10 WARN invalid type: // @viz-type: foobar on first line
 *   - D11 FAIL no guard: _onMouseMove without showHoverEffect guard
 *   - D11 PASS with guard: _onMouseMove has early-exit guard
 *   - D11 PASS no mousemove: no _onMouseMove present
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
 * createLinearGradient (D01 pass), shadowBlur (D02 pass), opt() calls to match formatter keys,
 * and @viz-type annotation on first line (D10 pass).
 */
var GOOD_JS = [
    '// @viz-type: kpi',
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
    '// @viz-type: kpi',
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
    '// @viz-type: kpi',
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
    '// @viz-type: kpi',
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
    '// @viz-type: kpi',
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

// --- D01 FAIL gradient-required: theme declares fillTechnique:'gradient', JS has no gradient calls ---
// Theme has fillTechnique set to 'gradient'; JS has no createLinearGradient or createRadialGradient.
// Expected: exit 1, stdout contains 'FAIL D01'.
console.log('\n-- D01 FAIL gradient-required: fillTechnique:gradient in theme, no gradient calls in JS --');
var THEME_FILL_GRADIENT = [
    'var VISUAL_LANG = { fillTechnique: \'gradient\' };',
    'var DARK = { bg:"#0D0D1F", panel:rgba(22,22,48,1), text:"#E8ECF0" };',
    'var LIGHT = { bg:"#F0F2F5", panel:rgba(255,255,255,0.9), text:"#1B1B3A" };',
    'function getTheme(n) { return n === "light" ? LIGHT : DARK; }',
    'module.exports = { getTheme: getTheme, VISUAL_LANG: VISUAL_LANG };'
].join('\n');
var D01_GRAD_REQ_JS = tmpFile('d01_grad_req.js', [
    '// @viz-type: kpi',
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
var D01_GRAD_REQ_FORMATTER = tmpFile('formatter_d01_grad_req.html', FORMATTER_MINIMAL);
var D01_GRAD_REQ_THEME = tmpFile('theme_d01_grad_req.js', THEME_FILL_GRADIENT);
r = run(D01_GRAD_REQ_FORMATTER, D01_GRAD_REQ_JS, D01_GRAD_REQ_THEME);
assert('D01 FAIL gradient-required exits 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('D01 FAIL gradient-required stdout contains FAIL D01', r.stdout, 'FAIL D01');

// --- D01 WARN no-fillTechnique declared: theme has no fillTechnique, JS has no gradient calls ---
// Confirms existing WARN behavior is unchanged when fillTechnique is not declared.
// Expected: exit 0, stdout contains 'WARN D01'.
console.log('\n-- D01 WARN no-fillTechnique declared: no fillTechnique in theme, no gradient calls in JS --');
var D01_NO_FT_JS = tmpFile('d01_no_ft.js', [
    '// @viz-type: kpi',
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
var D01_NO_FT_FORMATTER = tmpFile('formatter_d01_no_ft.html', FORMATTER_MINIMAL);
var D01_NO_FT_THEME = tmpFile('theme_d01_no_ft.js', THEME_WITH_RGBA);
r = run(D01_NO_FT_FORMATTER, D01_NO_FT_JS, D01_NO_FT_THEME);
assert('D01 WARN no-fillTechnique exits 0 (stays WARN, not FAIL)', r.code, 0, r.stdout + r.stderr);
assertIncludes('D01 WARN no-fillTechnique stdout contains WARN D01', r.stdout, 'WARN D01');

// --- D01 PASS gradient-required with gradient calls ---
// Theme has fillTechnique:'gradient'; JS has createLinearGradient. D01 not emitted.
// Expected: stdout does NOT contain 'D01'.
console.log('\n-- D01 PASS gradient-required with gradient calls: fillTechnique:gradient + createLinearGradient in JS --');
var D01_GRAD_PASS_JS = tmpFile('d01_grad_pass.js', [
    '// @viz-type: kpi',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
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
var D01_GRAD_PASS_FORMATTER = tmpFile('formatter_d01_grad_pass.html', FORMATTER_MINIMAL);
var D01_GRAD_PASS_THEME = tmpFile('theme_d01_grad_pass.js', THEME_FILL_GRADIENT);
r = run(D01_GRAD_PASS_FORMATTER, D01_GRAD_PASS_JS, D01_GRAD_PASS_THEME);
assertNotIncludes('D01 PASS gradient-required with gradient calls: no D01 in stdout', r.stdout, 'D01');

// --- D02 WARN: no shadow effects ---
// The JS has Math.min/Math.max (D03 pass) and gradient (D01 pass) but no shadow.
console.log('\n-- D02 WARN: no shadowBlur or shadowColor (exits 0) --');
var NO_SHADOW_JS = tmpFile('no_shadow.js', [
    '// @viz-type: kpi',
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
    '// @viz-type: kpi',
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
    '// @viz-type: kpi',
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

// ---- D09: accentIntensity (gi) cap detection ----

/*
 * Base JS for D09/D11 tests: has gradient, shadow, Math.min+Max, @viz-type on first line,
 * valid formatter keys, and no _onMouseMove. Avoids noise from D01/D02/D03/D10.
 */
var D_BASE_FORMATTER = [
    '<form section-label="Data">',
    '  <splunk-control-group label="Intensity">',
    '    <splunk-text-input name="{{VIZ_NAMESPACE}}.accentIntensity" value="1.5"></splunk-text-input>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Colors">',
    '  <splunk-control-group label="Primary">',
    '    <splunk-color-picker type="custom" name="{{VIZ_NAMESPACE}}.primaryColor" value="#007bff"></splunk-color-picker>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Theme">',
    '  <splunk-control-group label="Mode">',
    '    <splunk-text-input name="{{VIZ_NAMESPACE}}.themeMode" value="auto"></splunk-text-input>',
    '  </splunk-control-group>',
    '</form>',
    '<form section-label="Layout">',
    '  <splunk-control-group label="Accent">',
    '    <splunk-color-picker type="custom" name="{{VIZ_NAMESPACE}}.accentColor" value="#ff6b00"></splunk-color-picker>',
    '  </splunk-control-group>',
    '</form>'
].join('\n');

function makeBaseJs(extraLines) {
    return [
        '// @viz-type: kpi',
        'var vis = {',
        '  updateView: function(data, config) {',
        '    var w = Math.min(this.el.clientWidth, 1920);',
        '    var h = Math.max(this.el.clientHeight, 100);',
        '    var grad = ctx.createLinearGradient(0, 0, w, h);',
        '    ctx.shadowBlur = 8;',
        '    ctx.shadowColor = "rgba(0,0,0,0.5)";',
        '    var gi = opt("accentIntensity", 1.5);',
        '    var color1 = opt("primaryColor", "#007bff");',
        '    var mode = opt("themeMode", "auto");',
        '    var accent = opt("accentColor", "#ff6b00");',
        '    detectTheme();',
        extraLines || '',
        '  }',
        '};',
        'module.exports = vis;'
    ].join('\n');
}

// --- D09 FAIL: ternary cap ---
console.log('\n-- D09 FAIL: gi ternary cap pattern (gi > 1 ? 1 : gi) --');
var D09_TERNARY_JS = tmpFile('d09_ternary.js', makeBaseJs('    gi = gi < 0 ? 0 : gi > 1 ? 1 : gi;'));
var D09_FORMATTER = tmpFile('d09_formatter.html', D_BASE_FORMATTER);
var D09_THEME = tmpFile('d09_theme.js', THEME_WITH_RGBA);
r = run(D09_FORMATTER, D09_TERNARY_JS, D09_THEME);
assert('D09 FAIL ternary cap exits 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('D09 FAIL ternary cap stdout contains FAIL D09', r.stdout, 'FAIL D09');

// --- D09 FAIL: Math.min cap ---
console.log('\n-- D09 FAIL: Math.min(gi, 1) cap pattern --');
var D09_MATHMIN_JS = tmpFile('d09_mathmin.js', makeBaseJs('    gi = Math.min(gi, 1);'));
var D09_MATHMIN_FORMATTER = tmpFile('d09_mathmin_formatter.html', D_BASE_FORMATTER);
var D09_MATHMIN_THEME = tmpFile('d09_mathmin_theme.js', THEME_WITH_RGBA);
r = run(D09_MATHMIN_FORMATTER, D09_MATHMIN_JS, D09_MATHMIN_THEME);
assert('D09 FAIL Math.min cap exits 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('D09 FAIL Math.min cap stdout contains FAIL D09', r.stdout, 'FAIL D09');

// --- D09 PASS: no ceiling clamp ---
console.log('\n-- D09 PASS: gi has floor clamp only (no ceiling) --');
var D09_UNCAPPED_JS = tmpFile('d09_uncapped.js', makeBaseJs('    gi = gi < 0 ? 0 : gi;'));
var D09_UNCAPPED_FORMATTER = tmpFile('d09_uncapped_formatter.html', D_BASE_FORMATTER);
var D09_UNCAPPED_THEME = tmpFile('d09_uncapped_theme.js', THEME_WITH_RGBA);
r = run(D09_UNCAPPED_FORMATTER, D09_UNCAPPED_JS, D09_UNCAPPED_THEME);
assertNotIncludes('D09 PASS uncapped: no FAIL D09 in stdout', r.stdout, 'FAIL D09');

// ---- D10: @viz-type annotation on first line ----

/*
 * Base formatter for D10 tests: 4 sections, 2 color pickers, keys: myLabel, primaryColor, bgColor, themeMode.
 * Reuses FORMATTER_MINIMAL defined earlier.
 */

// --- D10 FAIL: missing annotation ---
console.log('\n-- D10 FAIL: no @viz-type annotation on first line --');
var D10_NO_ANNOT_JS = tmpFile('d10_no_annot.js', [
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
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
var D10_FORMATTER = tmpFile('d10_formatter.html', FORMATTER_MINIMAL);
var D10_THEME = tmpFile('d10_theme.js', THEME_WITH_RGBA);
r = run(D10_FORMATTER, D10_NO_ANNOT_JS, D10_THEME);
assert('D10 FAIL missing annotation exits 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('D10 FAIL missing annotation stdout contains FAIL D10', r.stdout, 'FAIL D10');

// --- D10 PASS: valid annotation ---
console.log('\n-- D10 PASS: // @viz-type: kpi on first line --');
var D10_VALID_JS = tmpFile('d10_valid.js', [
    '// @viz-type: kpi',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
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
var D10_VALID_FORMATTER = tmpFile('d10_valid_formatter.html', FORMATTER_MINIMAL);
var D10_VALID_THEME = tmpFile('d10_valid_theme.js', THEME_WITH_RGBA);
r = run(D10_VALID_FORMATTER, D10_VALID_JS, D10_VALID_THEME);
assertNotIncludes('D10 PASS valid annotation: no FAIL D10 in stdout', r.stdout, 'FAIL D10');

// --- D10 WARN: unrecognized viz type ---
console.log('\n-- D10 WARN: // @viz-type: foobar (unrecognized type) --');
var D10_INVALID_JS = tmpFile('d10_invalid.js', [
    '// @viz-type: foobar',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
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
var D10_INVALID_FORMATTER = tmpFile('d10_invalid_formatter.html', FORMATTER_MINIMAL);
var D10_INVALID_THEME = tmpFile('d10_invalid_theme.js', THEME_WITH_RGBA);
r = run(D10_INVALID_FORMATTER, D10_INVALID_JS, D10_INVALID_THEME);
assertIncludes('D10 WARN invalid type stdout contains WARN D10', r.stdout, 'WARN D10');
assertNotIncludes('D10 WARN invalid type does not FAIL (exits 0)', r.stdout, 'FAIL D10');

// ---- D11: showHoverEffect early-exit guard in _onMouseMove ----

// --- D11 FAIL: _onMouseMove without guard ---
console.log('\n-- D11 FAIL: _onMouseMove present but no showHoverEffect guard --');
var D11_NO_GUARD_JS = tmpFile('d11_no_guard.js', [
    '// @viz-type: kpi',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
    '    ctx.shadowBlur = 8;',
    '    ctx.shadowColor = "rgba(0,0,0,0.5)";',
    '    var gi = opt("accentIntensity", 1.5);',
    '    var color1 = opt("primaryColor", "#007bff");',
    '    var mode = opt("themeMode", "auto");',
    '    var accent = opt("accentColor", "#ff6b00");',
    '    detectTheme();',
    '  },',
    '  _onMouseMove: function(e) {',
    '    var x = e.offsetX;',
    '    var y = e.offsetY;',
    '    this._render(x, y);',
    '  }',
    '};',
    'module.exports = vis;'
].join('\n'));
var D11_NO_GUARD_FORMATTER = tmpFile('d11_no_guard_formatter.html', D_BASE_FORMATTER);
var D11_NO_GUARD_THEME = tmpFile('d11_no_guard_theme.js', THEME_WITH_RGBA);
r = run(D11_NO_GUARD_FORMATTER, D11_NO_GUARD_JS, D11_NO_GUARD_THEME);
assert('D11 FAIL no guard exits 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('D11 FAIL no guard stdout contains FAIL D11', r.stdout, 'FAIL D11');

// --- D11 PASS: _onMouseMove with guard ---
console.log('\n-- D11 PASS: _onMouseMove has if (!this._showHoverEffect) return; guard --');
var D11_WITH_GUARD_JS = tmpFile('d11_with_guard.js', [
    '// @viz-type: kpi',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
    '    ctx.shadowBlur = 8;',
    '    ctx.shadowColor = "rgba(0,0,0,0.5)";',
    '    var gi = opt("accentIntensity", 1.5);',
    '    var color1 = opt("primaryColor", "#007bff");',
    '    var mode = opt("themeMode", "auto");',
    '    var accent = opt("accentColor", "#ff6b00");',
    '    this._showHoverEffect = opt("showHoverEffect", true);',
    '    detectTheme();',
    '  },',
    '  _onMouseMove: function(e) {',
    '    if (!this._showHoverEffect) return;',
    '    var x = e.offsetX;',
    '    var y = e.offsetY;',
    '    this._render(x, y);',
    '  }',
    '};',
    'module.exports = vis;'
].join('\n'));
var D11_GUARD_FORMATTER = tmpFile('d11_guard_formatter.html', D_BASE_FORMATTER);
var D11_GUARD_THEME = tmpFile('d11_guard_theme.js', THEME_WITH_RGBA);
r = run(D11_GUARD_FORMATTER, D11_WITH_GUARD_JS, D11_GUARD_THEME);
assertNotIncludes('D11 PASS with guard: no FAIL D11 in stdout', r.stdout, 'FAIL D11');

// --- D11 PASS: no _onMouseMove at all ---
console.log('\n-- D11 PASS: no _onMouseMove present (D11 skips) --');
var D11_NO_MOUSEMOVE_JS = tmpFile('d11_no_mm.js', makeBaseJs(''));
var D11_NO_MM_FORMATTER = tmpFile('d11_no_mm_formatter.html', D_BASE_FORMATTER);
var D11_NO_MM_THEME = tmpFile('d11_no_mm_theme.js', THEME_WITH_RGBA);
r = run(D11_NO_MM_FORMATTER, D11_NO_MOUSEMOVE_JS, D11_NO_MM_THEME);
assertNotIncludes('D11 PASS no _onMouseMove: no FAIL D11 in stdout', r.stdout, 'FAIL D11');

// --- D11 PASS: comment mentions _onMouseMove before actual definition with guard ---
// Proves lastIndexOf fix (VF-02): indexOf returns the comment position; the guard is
// beyond the 1500-char scan window from the comment, so indexOf would report FAIL D11.
// lastIndexOf returns the actual method definition where the guard IS present -- PASS.
// The comment and definition are separated by > 1500 chars of filler code.
console.log('\n-- D11 PASS comment before definition: no FAIL D11 (VF-02 regression) --');
var D11_COMMENT_FIRST_JS = tmpFile('d11_comment_first.js', [
    '// @viz-type: kpi',
    '// delegated from _onMouseMove when hover is active',
    '// (the above comment mentions _onMouseMove but the method definition is far below)',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = Math.min(this.el.clientWidth, 1920);',
    '    var h = Math.max(this.el.clientHeight, 100);',
    '    var grad = ctx.createLinearGradient(0, 0, w, h);',
    '    ctx.shadowBlur = 8;',
    '    ctx.shadowColor = "rgba(0,0,0,0.5)";',
    '    var gi = opt("accentIntensity", 1.5);',
    '    var color1 = opt("primaryColor", "#007bff");',
    '    var mode = opt("themeMode", "auto");',
    '    var accent = opt("accentColor", "#ff6b00");',
    // Filler: > 1500 chars between comment and definition to expose the indexOf bug.
    '    var _filler = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";',
    '    var _filler2 = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";',
    '    var _filler3 = "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";',
    '    var _filler4 = "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";',
    '    var _filler5 = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";',
    '    var _filler6 = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";',
    '    var _filler7 = "gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg";',
    '    var _filler8 = "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh";',
    '    var _filler9 = "iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii";',
    '    var _filler10 = "jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj";',
    '    var _filler11 = "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk";',
    '    var _filler12 = "llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll";',
    '    detectTheme();',
    '  },',
    '  _onMouseMove: function(e) {',
    '    if (!this._showHoverEffect) return;',
    '    var x = e.offsetX;',
    '    var y = e.offsetY;',
    '    this._render(x, y);',
    '  }',
    '};',
    'module.exports = vis;'
].join('\n'));
var D11_COMMENT_FORMATTER = tmpFile('d11_comment_formatter.html', D_BASE_FORMATTER);
var D11_COMMENT_THEME = tmpFile('d11_comment_theme.js', THEME_WITH_RGBA);
r = run(D11_COMMENT_FORMATTER, D11_COMMENT_FIRST_JS, D11_COMMENT_THEME);
assertNotIncludes('D11 PASS comment before definition: no FAIL D11', r.stdout, 'FAIL D11');

// ---- Cleanup temp files ----
tmpFiles.forEach(function(p) {
    try { fs.unlinkSync(p); } catch (e) {}
});

// ---- Summary ----
console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===\n');
process.exit(failed > 0 ? 1 : 0);
