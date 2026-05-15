#!/usr/bin/env node
/*
 * test_repair_findings.js -- TDD test suite for repair_findings.js
 *
 * Run: node test_repair_findings.js
 * Exit 0 = all tests pass, 1 = failures
 *
 * Uses only Node.js built-ins: child_process, fs, path, os.
 * No test framework required.
 */

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var os = require('os');

var SCRIPT = path.join(__dirname, 'repair_findings.js');

// Resolve repo root: scripts/ -> vp-viz/ -> skills/ -> splunk-viz-packs/ -> plugins/ -> repo root
var REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

// ---- Test infrastructure ----

var passed = 0;
var failed = 0;
var tmpFiles = [];
var tmpDirs = [];

function tmpFile(name, content) {
    var p = path.join(os.tmpdir(), 'repair_findings_test_' + name);
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
        return { stdout: result.stdout || '', stderr: result.stderr || '', code: result.status };
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

// ---- XML fixture helper ----

function wrapXml(dashJson) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<dashboard version="2"><definition><![CDATA[' +
        JSON.stringify(dashJson, null, 2) +
        ']]></definition></dashboard>';
}

// ---- Tests ----

console.log('\n=== repair_findings.js Test Suite ===\n');

// --- CLI usage ---
console.log('-- CLI usage --');
var r = run([]);
assert('no args exits 2', r.code, 2);
assertIncludes('no args shows Usage on stderr', r.stderr, 'Usage');

r = run(['a', 'b', 'c']);
assert('3 args exits 2 (need 4)', r.code, 2);

// --- Missing findings file: exit 0 (no-op) ---
console.log('\n-- Missing findings file exits 0 --');
r = run(['/nonexistent/findings.ndjson', '/tmp', '/tmp/repairlog.ndjson', '1']);
assert('missing findings file exits 0', r.code, 0);

// --- B10: bare option key fix in XML ---
console.log('\n-- B10: bare option key fix in XML --');

var DIRTY_XML = wrapXml({
    visualizations: {
        viz_kpi: {
            type: 'myapp.kpi_tile',
            options: { valueField: 'count', labelField: 'name' }
        }
    },
    dataSources: {}
});

var DIRTY_XML_FILE = tmpFile('b10_dirty.xml', DIRTY_XML);
var REPAIR_LOG_B10 = tmpFile('b10_repair.ndjson', '');

// Two findings for the same file — both should be fixed in one write cycle
var FINDINGS_B10 = tmpFile('b10.ndjson', [
    'FINDING:' + JSON.stringify({
        type: 'FAIL', code: 'B10', file: DIRTY_XML_FILE,
        vizId: 'viz_kpi', message: 'bare key valueField',
        context: { vizType: 'myapp.kpi_tile', bareKey: 'valueField' }
    }),
    'FINDING:' + JSON.stringify({
        type: 'FAIL', code: 'B10', file: DIRTY_XML_FILE,
        vizId: 'viz_kpi', message: 'bare key labelField',
        context: { vizType: 'myapp.kpi_tile', bareKey: 'labelField' }
    })
].join('\n'));

r = run([FINDINGS_B10, os.tmpdir(), REPAIR_LOG_B10, '1']);
assert('B10 repair exits 0', r.code, 0, r.stderr);

var repaired = fs.readFileSync(DIRTY_XML_FILE, 'utf8');
assertIncludes('B10: valueField prefixed to myapp.kpi_tile.valueField', repaired, 'myapp.kpi_tile.valueField');
assertIncludes('B10: labelField prefixed to myapp.kpi_tile.labelField', repaired, 'myapp.kpi_tile.labelField');
assertNotIncludes('B10: bare valueField removed', repaired, '"valueField": ');
assertNotIncludes('B10: bare labelField removed', repaired, '"labelField": ');

// Verify repair log was written
var repairLogContent = fs.readFileSync(REPAIR_LOG_B10, 'utf8');
assertIncludes('B10: repair log contains B10 entry', repairLogContent, '"code":"B10"');
assertIncludes('B10: repair log contains valueField', repairLogContent, 'valueField');

// --- B9: custom. prefix fix in XML ---
console.log('\n-- B9: custom. prefix fix in XML --');

var B9_XML = wrapXml({
    visualizations: {
        viz_gauge: {
            type: 'custom.myapp.gauge',
            options: { 'myapp.gauge.label': 'Score' }
        }
    },
    dataSources: {}
});

var B9_XML_FILE = tmpFile('b9_dirty.xml', B9_XML);
var REPAIR_LOG_B9 = tmpFile('b9_repair.ndjson', '');

var FINDINGS_B9 = tmpFile('b9.ndjson',
    'FINDING:' + JSON.stringify({
        type: 'FAIL', code: 'B9', file: B9_XML_FILE,
        vizId: 'viz_gauge', message: 'custom. prefix',
        context: { vizType: 'custom.myapp.gauge' }
    })
);

r = run([FINDINGS_B9, os.tmpdir(), REPAIR_LOG_B9, '1']);
assert('B9 repair exits 0', r.code, 0, r.stderr);

var b9Repaired = fs.readFileSync(B9_XML_FILE, 'utf8');
assertIncludes('B9: type changed to myapp.gauge', b9Repaired, '"myapp.gauge"');
assertNotIncludes('B9: custom. prefix removed', b9Repaired, '"custom.myapp.gauge"');

// --- B7: default= fix in HTML ---
console.log('\n-- B7: default= attribute fix in HTML --');

var DIRTY_HTML_B7 = '<form section-label="Settings">' +
    '<input name="{{VIZ_NAMESPACE}}.threshold" default="50">' +
    '<input name="{{VIZ_NAMESPACE}}.label" default="Score">' +
    '</form>';

var B7_HTML_FILE = tmpFile('b7_dirty.html', DIRTY_HTML_B7);
var REPAIR_LOG_B7 = tmpFile('b7_repair.ndjson', '');

var FINDINGS_B7 = tmpFile('b7.ndjson',
    'FINDING:' + JSON.stringify({
        type: 'FAIL', code: 'B7', file: B7_HTML_FILE,
        message: '2 default= attr(s)',
        context: { count: 2 }
    })
);

r = run([FINDINGS_B7, os.tmpdir(), REPAIR_LOG_B7, '1']);
assert('B7 repair exits 0', r.code, 0, r.stderr);

var b7Repaired = fs.readFileSync(B7_HTML_FILE, 'utf8');
assertIncludes('B7: value= appears after repair', b7Repaired, 'value="50"');
assertIncludes('B7: second value= appears after repair', b7Repaired, 'value="Score"');
assertNotIncludes('B7: no default= remains', b7Repaired, 'default=');

// --- B5: type="custom" fix in HTML ---
console.log('\n-- B5: splunk-color-picker type="custom" fix --');

var DIRTY_HTML_B5 = '<form section-label="Style">' +
    '<splunk-color-picker name="{{VIZ_NAMESPACE}}.accentColor"></splunk-color-picker>' +
    '</form>';

var B5_HTML_FILE = tmpFile('b5_dirty.html', DIRTY_HTML_B5);
var REPAIR_LOG_B5 = tmpFile('b5_repair.ndjson', '');

var FINDINGS_B5 = tmpFile('b5.ndjson',
    'FINDING:' + JSON.stringify({
        type: 'FAIL', code: 'B5', file: B5_HTML_FILE,
        message: '1 color picker(s) missing type="custom"',
        context: { count: 1 }
    })
);

r = run([FINDINGS_B5, os.tmpdir(), REPAIR_LOG_B5, '1']);
assert('B5 repair exits 0', r.code, 0, r.stderr);

var b5Repaired = fs.readFileSync(B5_HTML_FILE, 'utf8');
assertIncludes('B5: type="custom" added to color picker', b5Repaired, 'type="custom"');

// --- B20: auto option injection in HTML ---
console.log('\n-- B20: themeMode auto option injection --');

var DIRTY_HTML_B20 = '<form section-label="Theme">' +
    '<splunk-radio-input name="{{VIZ_NAMESPACE}}.themeMode">' +
    '<option value="dark">Dark</option>' +
    '<option value="light">Light</option>' +
    '</splunk-radio-input>' +
    '</form>';

var B20_HTML_FILE = tmpFile('b20_dirty.html', DIRTY_HTML_B20);
var REPAIR_LOG_B20 = tmpFile('b20_repair.ndjson', '');

var FINDINGS_B20 = tmpFile('b20.ndjson',
    'FINDING:' + JSON.stringify({
        type: 'FAIL', code: 'B20', file: B20_HTML_FILE,
        message: 'themeMode has no "auto" option',
        context: {}
    })
);

r = run([FINDINGS_B20, os.tmpdir(), REPAIR_LOG_B20, '1']);
assert('B20 repair exits 0', r.code, 0, r.stderr);

var b20Repaired = fs.readFileSync(B20_HTML_FILE, 'utf8');
assertIncludes('B20: auto option added', b20Repaired, 'value="auto"');
assertIncludes('B20: dark option preserved', b20Repaired, 'value="dark"');

// --- Path traversal guard: file outside appDir is skipped ---
console.log('\n-- Path traversal guard --');

var OUTSIDE_FILE = tmpFile('outside.xml', wrapXml({
    visualizations: { viz_x: { type: 'myapp.x', options: { label: 'foo' } } },
    dataSources: {}
}));
var REPAIR_LOG_PT = tmpFile('pt_repair.ndjson', '');

// Restrict appDir to /nonexistent -- OUTSIDE_FILE is in os.tmpdir(), outside that
var FINDINGS_PT = tmpFile('pt.ndjson',
    'FINDING:' + JSON.stringify({
        type: 'FAIL', code: 'B10', file: OUTSIDE_FILE,
        vizId: 'viz_x', message: 'bare key label',
        context: { vizType: 'myapp.x', bareKey: 'label' }
    })
);

r = run([FINDINGS_PT, '/nonexistent/safedir', REPAIR_LOG_PT, '1']);
assert('path traversal: exits 0 (finding skipped)', r.code, 0);

// File should be unchanged -- the finding was skipped
var outsideContent = fs.readFileSync(OUTSIDE_FILE, 'utf8');
assertIncludes('path traversal: bare key not modified (skipped)', outsideContent, '"label"');
assertNotIncludes('path traversal: namespaced key not added', outsideContent, 'myapp.x.label');

// --- Malformed NDJSON lines are skipped gracefully ---
console.log('\n-- Malformed NDJSON lines skipped --');

var B10_XML2 = wrapXml({
    visualizations: {
        viz_b: { type: 'appx.widget', options: { score: '100' } }
    },
    dataSources: {}
});
var B10_XML2_FILE = tmpFile('b10_malformed_test.xml', B10_XML2);
var REPAIR_LOG_MALFORMED = tmpFile('malformed_repair.ndjson', '');

var FINDINGS_MALFORMED = tmpFile('malformed.ndjson', [
    'FINDING:{this is not valid json}',
    'NOT_A_FINDING_LINE',
    'FINDING:' + JSON.stringify({
        type: 'FAIL', code: 'B10', file: B10_XML2_FILE,
        vizId: 'viz_b', message: 'bare key score',
        context: { vizType: 'appx.widget', bareKey: 'score' }
    })
].join('\n'));

r = run([FINDINGS_MALFORMED, os.tmpdir(), REPAIR_LOG_MALFORMED, '1']);
assert('malformed lines: exits 0', r.code, 0, r.stderr);

var b10_2Repaired = fs.readFileSync(B10_XML2_FILE, 'utf8');
assertIncludes('malformed lines: valid finding still applied', b10_2Repaired, 'appx.widget.score');

// ---- Cleanup temp files ----
tmpFiles.forEach(function(p) {
    try { fs.unlinkSync(p); } catch (e) {}
});

// ---- Summary ----
console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===\n');
process.exit(failed > 0 ? 1 : 0);
