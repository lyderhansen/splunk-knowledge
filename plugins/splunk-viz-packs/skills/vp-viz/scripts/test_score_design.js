#!/usr/bin/env node
/*
 * test_score_design.js -- Unit tests for score_design.js
 *
 * Run: node test_score_design.js
 * Exit 0 = all tests pass, 1 = any failure
 *
 * Uses only Node.js built-ins: child_process, fs, path, os.
 * No test framework required.
 *
 * Tests:
 *   T1 -- Minimal viz: no gradients, one font size, hardcoded pixels, 2 colors, no animation
 *   T2 -- Rich viz: 2+ gradients, 3+ font sizes, 4+ dynamic spacing, 5+ colors with accent, rAF + hover
 *   T3 -- Gradient: exactly 1 createLinearGradient call -> gradient=10
 *   T4 -- Gradient: 1 linear + 1 radial call -> gradient=20
 *   T5 -- Animation: only requestAnimationFrame, no hover -> animation=10
 *   T6 -- Color bonus: 5+ fillStyle values plus t.accent usage -> color=20
 *   T7 -- Viz name argument: output contains [viz_name] in SCORE line
 *   T8 -- Missing file: pass nonexistent path -> exit 2
 *
 * Pure ES5 CJS -- no const/let/arrow functions/template literals/import.
 */

var child_process = require('child_process');
var fs            = require('fs');
var path          = require('path');
var os            = require('os');

var SCRIPT = path.join(__dirname, 'score_design.js');

// ---- Test infrastructure ----

var passed = 0;
var failed = 0;
var tmpDirs = [];

function makeTmpDir(suffix) {
    var dir = path.join(os.tmpdir(), 'test_score_design_' + suffix);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
    tmpDirs.push(dir);
    return dir;
}

function writeFile(dir, name, content) {
    var p = path.join(dir, name);
    fs.writeFileSync(p, content, 'utf8');
    return p;
}

function runScore(jsSrcPath, themePath, vizName) {
    try {
        var args = [SCRIPT];
        if (jsSrcPath) { args.push(jsSrcPath); }
        if (themePath)  { args.push(themePath); }
        if (vizName)    { args.push(vizName); }
        var result = child_process.spawnSync('node', args, { encoding: 'utf8', timeout: 15000 });
        return {
            stdout: result.stdout || '',
            stderr: result.stderr || '',
            code: result.status
        };
    } catch (e) {
        return { stdout: '', stderr: String(e), code: -1 };
    }
}

function parseDimension(stdout, dim) {
    // Extract "dim: N" from SCORE line
    var pat = new RegExp(dim + ':\\s*(\\d+)');
    var m = pat.exec(stdout);
    if (!m) { return -1; }
    return parseInt(m[1], 10);
}

function parseTotal(stdout) {
    var m = /SCORE[^\d]*(\d+)\/100/.exec(stdout);
    if (!m) { return -1; }
    return parseInt(m[1], 10);
}

function assert(description, actual, expected, detail) {
    if (actual === expected) {
        console.log('PASS: ' + description);
        passed++;
    } else {
        console.log('FAIL: ' + description);
        console.log('      expected: ' + JSON.stringify(expected));
        console.log('      actual:   ' + JSON.stringify(actual));
        if (detail) { console.log('      detail:   ' + detail); }
        failed++;
    }
}

function assertInRange(description, actual, min, max, detail) {
    if (actual >= min && actual <= max) {
        console.log('PASS: ' + description + ' (' + actual + ' in [' + min + ',' + max + '])');
        passed++;
    } else {
        console.log('FAIL: ' + description);
        console.log('      expected: between ' + min + ' and ' + max);
        console.log('      actual:   ' + actual);
        if (detail) { console.log('      detail:   ' + detail); }
        failed++;
    }
}

function assertIncludes(description, actual, needle) {
    if (actual.indexOf(needle) !== -1) {
        console.log('PASS: ' + description);
        passed++;
    } else {
        console.log('FAIL: ' + description);
        console.log('      expected to contain: ' + JSON.stringify(needle));
        console.log('      actual: ' + JSON.stringify(actual.substring(0, 400)));
        failed++;
    }
}

function cleanupTmpDirs() {
    for (var i = 0; i < tmpDirs.length; i++) {
        try {
            var dir = tmpDirs[i];
            var files = fs.readdirSync(dir);
            for (var j = 0; j < files.length; j++) {
                fs.unlinkSync(path.join(dir, files[j]));
            }
            fs.rmdirSync(dir);
        } catch (e) { /* ignore cleanup errors */ }
    }
}

// ---- Minimal theme.js fixture (used by most tests) ----

var MINIMAL_THEME = [
    'var DARK = { bg: "#0D0D1F", text: "#E8ECF0", accent: "#00BFFF" };',
    'var LIGHT = { bg: "#FFFFFF", text: "#1B1B3A", accent: "#0066CC" };',
    'function getTheme(n) { return n === "light" ? LIGHT : DARK; }',
    'module.exports = { getTheme: getTheme };'
].join('\n');

// ---- T1: Minimal viz ----
// No gradients, one font size, hardcoded pixels, two colors, no animation.
// Expected: gradient=0, typography=5, spacing=5, color=5, animation=0. Total=15.

console.log('\n=== T1: Minimal viz ===');
var d1 = makeTmpDir('1');
var t1VizSrc = [
    '// @viz-type: kpi',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    ctx.font = "bold 18px Arial";',
    '    ctx.fillStyle = "#ffffff";',
    '    ctx.fillRect(10, 10, 100, 50);',
    '    ctx.strokeStyle = "#000000";',
    '    ctx.strokeRect(10, 10, 100, 50);',
    '  }',
    '};',
    'module.exports = vis;'
].join('\n');
writeFile(d1, 'visualization_source.js', t1VizSrc);
writeFile(d1, 'theme.js', MINIMAL_THEME);
var r1 = runScore(path.join(d1, 'visualization_source.js'), path.join(d1, 'theme.js'));
assert('T1 -- exit 0', r1.code, 0, r1.stderr);
assert('T1 -- gradient=0', parseDimension(r1.stdout, 'gradient'), 0, r1.stdout);
assert('T1 -- typography=5', parseDimension(r1.stdout, 'typography'), 5, r1.stdout);
assert('T1 -- spacing=5', parseDimension(r1.stdout, 'spacing'), 5, r1.stdout);
assert('T1 -- color=5', parseDimension(r1.stdout, 'color'), 5, r1.stdout);
assert('T1 -- animation=0', parseDimension(r1.stdout, 'animation'), 0, r1.stdout);
assert('T1 -- total=15', parseTotal(r1.stdout), 15, r1.stdout);

// ---- T2: Rich viz ----
// 2+ gradients, 3+ font sizes, 4+ dynamic spacing, 5+ colors with t.accent, rAF + _onMouseMove.
// Expected: all dimensions at or near max. Total >= 85.

console.log('\n=== T2: Rich viz ===');
var d2 = makeTmpDir('2');
var t2VizSrc = [
    '// @viz-type: kpi',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var w = this.el.clientWidth;',
    '    var h = this.el.clientHeight;',
    '    var grad1 = ctx.createLinearGradient(0, 0, w, h);',
    '    var grad2 = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.4);',
    '    var grad3 = ctx.createLinearGradient(0, h, w, 0);',
    '    ctx.font = "bold 36px Arial";',
    '    ctx.font = "24px Arial";',
    '    ctx.font = "12px Arial";',
    '    ctx.fillStyle = t.text;',
    '    ctx.fillStyle = t.accent;',
    '    ctx.fillStyle = "#FF5500";',
    '    ctx.fillStyle = "#00BFFF";',
    '    ctx.fillStyle = "rgba(0,0,0,0.5)";',
    '    ctx.strokeStyle = t.series[0];',
    '    var x1 = w * 0.1;',
    '    var x2 = w * 0.5;',
    '    var y1 = h * 0.2;',
    '    var y2 = h * 0.8;',
    '    requestAnimationFrame(function() {});',
    '  },',
    '  _onMouseMove: function(e) {',
    '    if (!this._showHoverEffect) return;',
    '    this._render();',
    '  }',
    '};',
    'module.exports = vis;'
].join('\n');
writeFile(d2, 'visualization_source.js', t2VizSrc);
writeFile(d2, 'theme.js', MINIMAL_THEME);
var r2 = runScore(path.join(d2, 'visualization_source.js'), path.join(d2, 'theme.js'));
assert('T2 -- exit 0', r2.code, 0, r2.stderr);
assert('T2 -- gradient=20', parseDimension(r2.stdout, 'gradient'), 20, r2.stdout);
assert('T2 -- typography=20', parseDimension(r2.stdout, 'typography'), 20, r2.stdout);
assert('T2 -- spacing=20', parseDimension(r2.stdout, 'spacing'), 20, r2.stdout);
assert('T2 -- color=20', parseDimension(r2.stdout, 'color'), 20, r2.stdout);
assert('T2 -- animation=20', parseDimension(r2.stdout, 'animation'), 20, r2.stdout);
assertInRange('T2 -- total>=85', parseTotal(r2.stdout), 85, 100, r2.stdout);

// ---- T3: Gradient dimension -- exactly 1 linear gradient ----

console.log('\n=== T3: Gradient dimension -- 1 linear gradient ===');
var d3 = makeTmpDir('3');
var t3VizSrc = [
    '// @viz-type: kpi',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var grad = ctx.createLinearGradient(0, 0, 100, 100);',
    '  }',
    '};',
    'module.exports = vis;'
].join('\n');
writeFile(d3, 'visualization_source.js', t3VizSrc);
writeFile(d3, 'theme.js', MINIMAL_THEME);
var r3 = runScore(path.join(d3, 'visualization_source.js'), path.join(d3, 'theme.js'));
assert('T3 -- gradient=10', parseDimension(r3.stdout, 'gradient'), 10, r3.stdout);

// ---- T4: Gradient dimension -- 1 linear + 1 radial (2+ calls) ----

console.log('\n=== T4: Gradient dimension -- 1 linear + 1 radial ===');
var d4 = makeTmpDir('4');
var t4VizSrc = [
    '// @viz-type: kpi',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    var g1 = ctx.createLinearGradient(0, 0, 100, 0);',
    '    var g2 = ctx.createRadialGradient(50, 50, 0, 50, 50, 50);',
    '  }',
    '};',
    'module.exports = vis;'
].join('\n');
writeFile(d4, 'visualization_source.js', t4VizSrc);
writeFile(d4, 'theme.js', MINIMAL_THEME);
var r4 = runScore(path.join(d4, 'visualization_source.js'), path.join(d4, 'theme.js'));
assert('T4 -- gradient=20', parseDimension(r4.stdout, 'gradient'), 20, r4.stdout);

// ---- T5: Animation dimension -- only requestAnimationFrame, no _onMouseMove ----

console.log('\n=== T5: Animation dimension -- rAF only ===');
var d5 = makeTmpDir('5');
var t5VizSrc = [
    '// @viz-type: kpi',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    requestAnimationFrame(function() { vis._render(); });',
    '  }',
    '};',
    'module.exports = vis;'
].join('\n');
writeFile(d5, 'visualization_source.js', t5VizSrc);
writeFile(d5, 'theme.js', MINIMAL_THEME);
var r5 = runScore(path.join(d5, 'visualization_source.js'), path.join(d5, 'theme.js'));
assert('T5 -- animation=10', parseDimension(r5.stdout, 'animation'), 10, r5.stdout);

// ---- T6: Color bonus -- 5+ fillStyle values plus t.accent ----

console.log('\n=== T6: Color bonus -- 5+ colors with t.accent ===');
var d6 = makeTmpDir('6');
var t6VizSrc = [
    '// @viz-type: kpi',
    'var vis = {',
    '  updateView: function(data, config) {',
    '    ctx.fillStyle = "#FF0000";',
    '    ctx.fillStyle = "#00FF00";',
    '    ctx.fillStyle = "#0000FF";',
    '    ctx.fillStyle = "#FFFF00";',
    '    ctx.fillStyle = "#FF00FF";',
    '    ctx.fillStyle = t.accent;',
    '  }',
    '};',
    'module.exports = vis;'
].join('\n');
writeFile(d6, 'visualization_source.js', t6VizSrc);
writeFile(d6, 'theme.js', MINIMAL_THEME);
var r6 = runScore(path.join(d6, 'visualization_source.js'), path.join(d6, 'theme.js'));
assert('T6 -- color=20', parseDimension(r6.stdout, 'color'), 20, r6.stdout);

// ---- T7: Viz name argument ----

console.log('\n=== T7: Viz name argument ===');
var d7 = makeTmpDir('7');
writeFile(d7, 'visualization_source.js', t1VizSrc);
writeFile(d7, 'theme.js', MINIMAL_THEME);
var r7 = runScore(
    path.join(d7, 'visualization_source.js'),
    path.join(d7, 'theme.js'),
    'my_test_viz'
);
assertIncludes('T7 -- output contains [my_test_viz]', r7.stdout, '[my_test_viz]');
assert('T7 -- exit 0', r7.code, 0, r7.stderr);

// ---- T8: Missing file -- exit 2 ----

console.log('\n=== T8: Missing file -> exit 2 ===');
var r8 = runScore('/nonexistent/path/visualization_source.js', '/nonexistent/theme.js');
assert('T8 -- exit 2 for missing file', r8.code, 2, r8.stderr);

// ---- Cleanup ----

cleanupTmpDirs();

// ---- Summary ----

console.log('\n--- Summary ---');
console.log((passed + failed) + ' tests: ' + passed + ' passed, ' + failed + ' failed');
console.log(passed + '/' + (passed + failed) + ' tests passed');

process.exit(failed > 0 ? 1 : 0);
