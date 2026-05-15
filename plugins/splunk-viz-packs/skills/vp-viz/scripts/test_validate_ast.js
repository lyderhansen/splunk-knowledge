#!/usr/bin/env node
/*
 * test_validate_ast.js — TDD test suite for validate_ast.js
 *
 * Run: node test_validate_ast.js
 * Exit 0 = all tests pass, 1 = failures
 *
 * Uses only Node.js built-ins: child_process, fs, path, os.
 * No test framework required.
 */

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var os = require('os');

var SCRIPT = path.join(__dirname, 'validate_ast.js');
var TESTS_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', '..', '..', 'tests');

// Resolve the tests directory relative to this script location:
// scripts/ -> vp-viz/ -> skills/ -> splunk-viz-packs/ -> plugins/ -> (repo root) -> tests/
var REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
TESTS_ROOT = path.join(REPO_ROOT, 'tests');

var CLEAN_JS = path.join(TESTS_ROOT,
    'test28_drilldown_tabs', 'cloudflare_noc',
    'appserver', 'static', 'visualizations', 'cf_kpi_tile',
    'src', 'visualization_source.js');

var CLEAN_HTML = path.join(TESTS_ROOT,
    'test28_drilldown_tabs', 'cloudflare_noc',
    'appserver', 'static', 'visualizations', 'cf_kpi_tile',
    'formatter.html');

// ---- Test infrastructure ----

var passed = 0;
var failed = 0;
var tmpFiles = [];

function tmpFile(name, content) {
    var p = path.join(os.tmpdir(), 'validate_ast_test_' + name);
    fs.writeFileSync(p, content, 'utf8');
    tmpFiles.push(p);
    return p;
}

function run(args) {
    try {
        var result = child_process.spawnSync(
            'node',
            [SCRIPT].concat(args),
            { encoding: 'utf8', timeout: 10000 }
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
        if (detail) console.log('        detail:   ' + detail);
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
        console.log('        actual: ' + JSON.stringify(actual.substring(0, 200)));
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
        console.log('        actual: ' + JSON.stringify(actual.substring(0, 200)));
        failed++;
    }
}

function assertMatches(description, actual, regex) {
    if (regex.test(actual)) {
        console.log('  PASS: ' + description);
        passed++;
    } else {
        console.log('  FAIL: ' + description);
        console.log('        expected to match: ' + regex);
        console.log('        actual: ' + JSON.stringify(actual.substring(0, 300)));
        failed++;
    }
}

// ---- Tests ----

console.log('\n=== validate_ast.js Test Suite ===\n');

// --- CLI usage ---
console.log('-- CLI usage --');
var r = run([]);
assert('no args exits 2', r.code, 2, r.stderr);
assertIncludes('no args shows usage on stderr', r.stderr, 'Usage');

// --- --js missing file ---
console.log('\n-- --js missing file --');
r = run(['--js', '/nonexistent/file.js']);
assert('missing file exits 1', r.code, 1);

// --- --js clean ES5 ---
console.log('\n-- --js clean ES5 (test28 cf_kpi_tile source) --');
r = run(['--js', CLEAN_JS]);
assert('clean ES5 exits 0', r.code, 0, r.stdout + r.stderr);
assertNotIncludes('clean ES5 no FAIL output', r.stdout, 'FAIL');

// --- --js ES6 violations ---
console.log('\n-- --js ES6 violations --');

var ES6_CONST = tmpFile('es6_const.js', [
    'var x = require("something");',
    'const FOO = 42;',
    'function doThing() {',
    '  var y = 1;',
    '  return y;',
    '}',
    'module.exports = doThing;'
].join('\n'));
r = run(['--js', ES6_CONST]);
assert('const violation exits 1', r.code, 1);
assertIncludes('const violation reports FAIL F3', r.stdout, 'FAIL F3');
assertMatches('const violation includes line number', r.stdout, /FAIL F3:.*at line \d+/);

var ES6_LET = tmpFile('es6_let.js', [
    'function doThing() {',
    '  let y = 1;',
    '  return y;',
    '}',
    'module.exports = doThing;'
].join('\n'));
r = run(['--js', ES6_LET]);
assert('let violation exits 1', r.code, 1);
assertIncludes('let violation reports FAIL F3', r.stdout, 'FAIL F3');

var ES6_ARROW = tmpFile('es6_arrow.js', [
    'var fn = function() {',
    '  var arr = [1,2,3];',
    '  var doubled = arr.map(function(x) { return x * 2; });',
    '  var tripled = arr.map(function(x) { return x * 3; });',
    '  var quadrupled = arr.map(function(x) { return x * 4; });',
    '};',
    'var arrowFn = (x) => x * 2;',
    'module.exports = fn;'
].join('\n'));
r = run(['--js', ES6_ARROW]);
assert('arrow function exits 1', r.code, 1);
assertIncludes('arrow function reports FAIL F3', r.stdout, 'FAIL F3');

var ES6_TEMPLATE = tmpFile('es6_template.js', [
    'function doThing(name) {',
    '  var msg = `Hello ${name}`;',
    '  return msg;',
    '}',
    'module.exports = doThing;'
].join('\n'));
r = run(['--js', ES6_TEMPLATE]);
assert('template literal exits 1', r.code, 1);
assertIncludes('template literal reports FAIL F3', r.stdout, 'FAIL F3');

var ES6_CLASS = tmpFile('es6_class.js', [
    'class Foo {',
    '  constructor() {',
    '    this.x = 1;',
    '  }',
    '}',
    'module.exports = Foo;'
].join('\n'));
r = run(['--js', ES6_CLASS]);
assert('class declaration exits 1', r.code, 1);
assertIncludes('class declaration reports FAIL F3', r.stdout, 'FAIL F3');

var ES6_DESTRUCTURE = tmpFile('es6_destructure.js', [
    'function doThing(obj) {',
    '  var { a, b } = obj;',
    '  return a + b;',
    '}',
    'module.exports = doThing;'
].join('\n'));
r = run(['--js', ES6_DESTRUCTURE]);
assert('object destructuring exits 1', r.code, 1);
assertIncludes('object destructuring reports FAIL F3', r.stdout, 'FAIL F3');

// --- --html missing file ---
console.log('\n-- --html missing file --');
r = run(['--html', '/nonexistent/formatter.html']);
assert('missing html exits 1', r.code, 1);

// --- --html clean formatter ---
console.log('\n-- --html clean formatter (test28 cf_kpi_tile) --');
r = run(['--html', CLEAN_HTML]);
assert('clean formatter exits 0', r.code, 0, r.stdout + r.stderr);
assertNotIncludes('clean formatter no FAIL output', r.stdout, 'FAIL');

// --- --html B7 default= attribute ---
console.log('\n-- --html B7: default= attribute --');
var HTML_DEFAULT_ATTR = tmpFile('bad_default.html', [
    '<form class="splunk-formatter-section" section-label="Settings">',
    '  <splunk-control-group label="Value">',
    '    <splunk-text-input name="{{VIZ_NAMESPACE}}.valueField" default="value">',
    '    </splunk-text-input>',
    '  </splunk-control-group>',
    '  <splunk-control-group label="Theme">',
    '    <splunk-radio-input name="{{VIZ_NAMESPACE}}.themeMode" value="auto">',
    '      <option value="auto">Auto</option>',
    '      <option value="dark">Dark</option>',
    '    </splunk-radio-input>',
    '  </splunk-control-group>',
    '</form>'
].join('\n'));
r = run(['--html', HTML_DEFAULT_ATTR]);
assert('default= attr exits 1', r.code, 1);
assertIncludes('default= reports FAIL B7', r.stdout, 'FAIL B7');

// --- --html B10 no VIZ_NAMESPACE ---
console.log('\n-- --html B10: no {{VIZ_NAMESPACE}} --');
var HTML_NO_NS = tmpFile('no_ns.html', [
    '<form class="splunk-formatter-section" section-label="Settings">',
    '  <splunk-control-group label="Value">',
    '    <splunk-text-input name="myapp_myvis.valueField" value="value">',
    '    </splunk-text-input>',
    '  </splunk-control-group>',
    '</form>'
].join('\n'));
r = run(['--html', HTML_NO_NS]);
assert('hardcoded namespace exits 1', r.code, 1);
assertIncludes('hardcoded namespace reports FAIL B10', r.stdout, 'FAIL B10');

// --- --html B10 hardcoded namespace ---
console.log('\n-- --html B10: hardcoded namespace (dot pattern) --');
var HTML_HARDCODED = tmpFile('hardcoded_ns.html', [
    '<form class="splunk-formatter-section" section-label="Settings">',
    '  <splunk-control-group label="Value">',
    '    <splunk-text-input name="cloudflare_noc.cf_kpi.valueField" value="value">',
    '    </splunk-text-input>',
    '  </splunk-control-group>',
    '</form>'
].join('\n'));
r = run(['--html', HTML_HARDCODED]);
assert('hardcoded dot-namespace exits 1', r.code, 1);
assertIncludes('hardcoded dot-namespace reports FAIL B10', r.stdout, 'FAIL B10');

// --- --html B5 color picker without type="custom" ---
console.log('\n-- --html B5: color-picker without type="custom" --');
var HTML_BAD_PICKER = tmpFile('bad_picker.html', [
    '<form class="splunk-formatter-section" section-label="Colors">',
    '  <splunk-control-group label="Accent">',
    '    <splunk-color-picker name="{{VIZ_NAMESPACE}}.accentColor" value="#FF0000">',
    '      <splunk-color>#FF0000</splunk-color>',
    '    </splunk-color-picker>',
    '  </splunk-control-group>',
    '</form>'
].join('\n'));
r = run(['--html', HTML_BAD_PICKER]);
assert('color-picker no type=custom exits 1', r.code, 1);
assertIncludes('color-picker no type=custom reports FAIL B5', r.stdout, 'FAIL B5');

// --- --html B5 form without section-label ---
console.log('\n-- --html B5: form without section-label --');
var HTML_NO_SECTION = tmpFile('no_section.html', [
    '<form class="splunk-formatter-section">',
    '  <splunk-control-group label="Value">',
    '    <splunk-text-input name="{{VIZ_NAMESPACE}}.valueField" value="value">',
    '    </splunk-text-input>',
    '  </splunk-control-group>',
    '</form>'
].join('\n'));
r = run(['--html', HTML_NO_SECTION]);
assert('form without section-label exits 1', r.code, 1);
assertIncludes('form without section-label reports FAIL B5', r.stdout, 'FAIL B5');

// --- --html B20 themeMode no "auto" option ---
console.log('\n-- --html B20: themeMode no "auto" option --');
var HTML_NO_AUTO = tmpFile('no_auto.html', [
    '<form class="splunk-formatter-section" section-label="Theme">',
    '  <splunk-control-group label="Theme">',
    '    <splunk-radio-input name="{{VIZ_NAMESPACE}}.themeMode" value="dark">',
    '      <option value="dark">Dark</option>',
    '      <option value="light">Light</option>',
    '    </splunk-radio-input>',
    '  </splunk-control-group>',
    '</form>'
].join('\n'));
r = run(['--html', HTML_NO_AUTO]);
assert('themeMode no auto option exits 1', r.code, 1);
assertIncludes('themeMode no auto reports FAIL B20', r.stdout, 'FAIL B20');

// --- Output format ---
console.log('\n-- Output format --');
r = run(['--js', ES6_CONST]);
assertMatches('FAIL lines start with two spaces', r.stdout, /^  FAIL /m);

// ---- Cleanup temp files ----
tmpFiles.forEach(function(p) {
    try { fs.unlinkSync(p); } catch (e) {}
});

// ---- Summary ----
console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===\n');
process.exit(failed > 0 ? 1 : 0);
