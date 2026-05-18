#!/usr/bin/env node
/*
 * test_validate_dash.js -- TDD test suite for validate_dash.js
 *
 * Run: node test_validate_dash.js
 * Exit 0 = all tests pass, 1 = failures
 *
 * Uses only Node.js built-ins: child_process, fs, path, os.
 * No test framework required.
 */

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var os = require('os');

var SCRIPT = path.join(__dirname, 'validate_dash.js');

// Resolve the tests directory relative to this script location:
// scripts/ -> vp-viz/ -> skills/ -> splunk-viz-packs/ -> plugins/ -> (repo root) -> tests/
var REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');

var CLEAN_XML_TEST25 = path.join(REPO_ROOT, 'tests',
    'test25_v4', 'hospital_nps_gauge',
    'default', 'data', 'ui', 'views', 'nps_ring_gauge_demo.xml');

var DIRTY_XML_TEST28 = path.join(REPO_ROOT, 'tests',
    'test28_drilldown_tabs', 'cloudflare_noc',
    'default', 'data', 'ui', 'views', 'cloudflare_noc_overview.xml');

// ---- Test infrastructure ----

var passed = 0;
var failed = 0;
var tmpFiles = [];

function tmpFile(name, content) {
    var p = path.join(os.tmpdir(), 'validate_dash_test_' + name);
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

function parseFinding(stderr, code) {
    var lines = stderr.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf('FINDING:') === 0) {
            try {
                var obj = JSON.parse(line.substring(8));
                if (obj.code === code) {
                    return obj;
                }
            } catch (e) {
                // skip malformed lines
            }
        }
    }
    return null;
}

// ---- XML fixture helpers ----

function wrapXml(dashJson) {
    return '<dashboard version="2"><definition><![CDATA[' + JSON.stringify(dashJson) + ']]></definition></dashboard>';
}

// B9 type prefix fixture: viz type starts with "custom."
var XML_B9_PREFIX = tmpFile('b9_prefix.xml', wrapXml({
    dataSources: {
        ds_main: { type: 'ds.search', options: { query: '| makeresults' } }
    },
    visualizations: {
        viz_bad: {
            type: 'custom.myapp.my_kpi',
            dataSources: { primary: 'ds_main' },
            options: { 'myapp.my_kpi.label': 'Hello' }
        }
    }
}));

// B10 bare options fixture: custom viz with bare (no-dot) option keys
var XML_B10_BARE = tmpFile('b10_bare.xml', wrapXml({
    dataSources: {
        ds_main: { type: 'ds.search', options: { query: '| makeresults' } }
    },
    visualizations: {
        viz_bad: {
            type: 'myapp.kpi',
            dataSources: { primary: 'ds_main' },
            options: { label: 'foo' }
        }
    }
}));

// B10 namespaced options fixture: custom viz with properly namespaced keys + bg_gradient + markdown title
var XML_B10_NAMESPACED = tmpFile('b10_namespaced.xml', wrapXml({
    dataSources: {
        ds_main: { type: 'ds.search', options: { query: '| makeresults' } }
    },
    visualizations: {
        viz_ok: {
            type: 'myapp.kpi',
            dataSources: { primary: 'ds_main' },
            options: { 'myapp.kpi.label': 'foo' }
        },
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# My Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } },
            { vizId: 'viz_ok', position: { x: 20, y: 120, w: 400, h: 300 } }
        ]
    }
}));

// B10 builtin viz: splunk.* type with bare option keys -- should NOT trigger B10
// Includes bg_gradient + markdown to pass DS3/DS4
var XML_B10_BUILTIN = tmpFile('b10_builtin.xml', wrapXml({
    dataSources: {
        ds_main: { type: 'ds.search', options: { query: '| makeresults' } }
    },
    visualizations: {
        viz_builtin: {
            type: 'splunk.singlevalue',
            dataSources: { primary: 'ds_main' },
            options: { fillColor: 'red', sparklineDisplay: 'off' }
        },
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } },
            { vizId: 'viz_builtin', position: { x: 20, y: 120, w: 400, h: 300 } }
        ]
    }
}));

// B10 input viz: input.* type with bare option keys -- should NOT trigger B10
// Includes bg_gradient + markdown to pass DS3/DS4
var XML_B10_INPUT = tmpFile('b10_input.xml', wrapXml({
    dataSources: {},
    visualizations: {
        viz_input: {
            type: 'input.text',
            options: { token: 'search_text', defaultValue: '' }
        },
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } },
            { vizId: 'viz_input', position: { x: 20, y: 120, w: 400, h: 100 } }
        ]
    }
}));

// Data source missing: viz references ds_missing which is not declared
// (includes bg_gradient + markdown to avoid DS3/DS4 noise)
var XML_DS_MISSING = tmpFile('ds_missing.xml', wrapXml({
    dataSources: {
        ds_real: { type: 'ds.search', options: { query: '| makeresults' } }
    },
    visualizations: {
        viz_broken: {
            type: 'myapp.kpi',
            dataSources: { primary: 'ds_missing' },
            options: { 'myapp.kpi.label': 'foo' }
        },
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } },
            { vizId: 'viz_broken', position: { x: 20, y: 120, w: 400, h: 300 } }
        ]
    }
}));

// Data source OK: viz references ds_main which IS declared
// (includes bg_gradient + markdown to pass DS3/DS4 cleanly)
var XML_DS_OK = tmpFile('ds_ok.xml', wrapXml({
    dataSources: {
        ds_main: { type: 'ds.search', options: { query: '| makeresults' } }
    },
    visualizations: {
        viz_ok: {
            type: 'myapp.kpi',
            dataSources: { primary: 'ds_main' },
            options: { 'myapp.kpi.label': 'foo' }
        },
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } },
            { vizId: 'viz_ok', position: { x: 20, y: 120, w: 400, h: 300 } }
        ]
    }
}));

// ---- JSON mode fixtures ----

// JSON_VALID: includes bg_gradient + markdown title at y=10 to pass DS3/DS4
var JSON_VALID = tmpFile('valid.json', JSON.stringify({
    dataSources: {
        ds_main: { type: 'ds.search', options: { query: '| makeresults' } }
    },
    visualizations: {
        viz_ok: {
            type: 'myapp.kpi',
            dataSources: { primary: 'ds_main' },
            options: { 'myapp.kpi.label': 'foo' }
        },
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } },
            { vizId: 'viz_ok', position: { x: 20, y: 120, w: 400, h: 300 } }
        ]
    }
}));

// JSON_BARE_OPTIONS: has bare option key (B10) + bg_gradient + markdown to isolate B10 failure
var JSON_BARE_OPTIONS = tmpFile('bare_opts.json', JSON.stringify({
    dataSources: {
        ds_main: { type: 'ds.search', options: { query: '| makeresults' } }
    },
    visualizations: {
        viz_bad: {
            type: 'myapp.kpi',
            dataSources: { primary: 'ds_main' },
            options: { label: 'foo' }
        },
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } },
            { vizId: 'viz_bad', position: { x: 20, y: 120, w: 400, h: 300 } }
        ]
    }
}));

// ---- Tests ----

console.log('\n=== validate_dash.js Test Suite ===\n');

// --- CLI usage ---
console.log('-- CLI usage --');
var r = run([]);
assert('no args exits 2', r.code, 2, r.stderr);
assertIncludes('no args shows Usage on stderr', r.stderr, 'Usage');

r = run(['--unknown', '/tmp/somefile.xml']);
assert('unknown mode exits 2', r.code, 2, r.stderr);
assertIncludes('unknown mode shows stderr output', r.stderr, r.stderr.length > 0 ? r.stderr.substring(0, 1) : 'MISSING');

// --- --xml missing file ---
console.log('\n-- --xml missing file --');
r = run(['--xml', '/nonexistent/dashboard.xml']);
assert('missing xml file exits 1', r.code, 1);
assertIncludes('missing file shows error on stderr', r.stderr, 'not found');

// --- B9 type prefix ---
console.log('\n-- B9: custom. type prefix --');
r = run(['--xml', XML_B9_PREFIX]);
assert('custom. prefix exits 1', r.code, 1);
assertIncludes('custom. prefix reports FAIL B9 on stdout', r.stdout, 'FAIL B9');

var finding = parseFinding(r.stderr, 'B9');
assert('custom. prefix emits FINDING:{...} with code B9', finding !== null, true);
if (finding) {
    assert('B9 finding has file field', typeof finding.file, 'string');
    assert('B9 finding has vizId field', typeof finding.vizId, 'string');
    assert('B9 finding has message field', typeof finding.message, 'string');
    assert('B9 finding has code field', finding.code, 'B9');
}

// --- B9: correct custom viz type (no custom. prefix) should NOT fire B9 ---
console.log('\n-- B9: correct custom viz type (no custom. prefix) --');
r = run(['--xml', XML_B10_NAMESPACED]);
assertNotIncludes('namespaced viz type does not produce FAIL B9', r.stdout, 'FAIL B9');

// --- B10 bare option keys ---
console.log('\n-- B10: bare option keys in custom viz --');
r = run(['--xml', XML_B10_BARE]);
assert('bare options exits 1', r.code, 1);
assertIncludes('bare options reports FAIL B10 on stdout', r.stdout, 'FAIL B10');

finding = parseFinding(r.stderr, 'B10');
assert('bare options emits FINDING:{...} with code B10', finding !== null, true);
if (finding) {
    assert('B10 finding has file field', typeof finding.file, 'string');
    assert('B10 finding has vizId field', typeof finding.vizId, 'string');
    assert('B10 finding has code field', finding.code, 'B10');
}

// --- B10: namespaced options should exit 0 ---
console.log('\n-- B10: namespaced options (clean) --');
r = run(['--xml', XML_B10_NAMESPACED]);
assert('namespaced options exits 0', r.code, 0, r.stdout + r.stderr);
assertNotIncludes('namespaced options no FAIL B10', r.stdout, 'FAIL B10');

// --- B10: builtin splunk.* type should NOT trigger B10 ---
console.log('\n-- B10: builtin splunk.* viz type exempt from B10 --');
r = run(['--xml', XML_B10_BUILTIN]);
assertNotIncludes('splunk.* type does not trigger FAIL B10', r.stdout, 'FAIL B10');
assert('splunk.* type exits 0', r.code, 0, r.stdout + r.stderr);

// --- B10: input.* type should NOT trigger B10 ---
console.log('\n-- B10: input.* viz type exempt from B10 --');
r = run(['--xml', XML_B10_INPUT]);
assertNotIncludes('input.* type does not trigger FAIL B10', r.stdout, 'FAIL B10');
assert('input.* type exits 0', r.code, 0, r.stdout + r.stderr);

// --- Data source cross-reference ---
console.log('\n-- Data source: dangling reference --');
r = run(['--xml', XML_DS_MISSING]);
assert('dangling data source exits 1', r.code, 1);
assertIncludes('dangling data source reports FAIL DS1 on stdout', r.stdout, 'FAIL DS1');
assertNotIncludes('dangling data source does not produce FAIL B9', r.stdout, 'FAIL B9');

finding = parseFinding(r.stderr, 'DS1');
assert('dangling data source emits FINDING:{...} with code DS1', finding !== null, true);
if (finding) {
    assert('DS1 finding has file field', typeof finding.file, 'string');
    assert('DS1 finding has vizId field', typeof finding.vizId, 'string');
    assert('DS1 finding has code field', finding.code, 'DS1');
}

// --- Data source: declared reference is clean ---
console.log('\n-- Data source: declared reference (clean) --');
r = run(['--xml', XML_DS_OK]);
assert('declared data source exits 0', r.code, 0, r.stdout + r.stderr);
assertNotIncludes('declared data source no FAIL output', r.stdout, 'FAIL');

// --- Real file: test25 dashboard (legacy -- lacks bg_gradient/markdown, expects DS3+DS4) ---
// test25 was created before DS3/DS4 checks existed. It correctly exits 1 now (missing background/title).
// The check here validates B9/B10/DS1 are not reported (those it was clean for).
console.log('\n-- Real file: test25 nps_ring_gauge_demo.xml (legacy -- DS3/DS4 expected) --');
r = run(['--xml', CLEAN_XML_TEST25]);
assert('test25 dashboard exits 1 (DS3+DS4 violations expected for legacy file)', r.code, 1, r.stdout + r.stderr);
assertNotIncludes('test25 no FAIL B9', r.stdout, 'FAIL B9');
assertNotIncludes('test25 no FAIL B10', r.stdout, 'FAIL B10');
assertNotIncludes('test25 no FAIL DS1', r.stdout, 'FAIL DS1');

// --- Real file: test28 cloudflare_noc_overview.xml (legacy -- DS3/DS4 expected) ---
// test28 option keys have been fixed since initial creation (all properly namespaced).
// It now correctly exits 1 due to DS3/DS4 (missing bg_gradient + markdown title).
console.log('\n-- Real file: test28 cloudflare_noc_overview.xml (legacy -- DS3/DS4 expected) --');
r = run(['--xml', DIRTY_XML_TEST28]);
assert('test28 dashboard exits 1 (DS3+DS4 violations expected for legacy file)', r.code, 1);
assertNotIncludes('test28 no FAIL B10 (keys are now properly namespaced)', r.stdout, 'FAIL B10');
assertIncludes('test28 reports FAIL DS3 (no bg_gradient)', r.stdout, 'FAIL DS3');

// --- JSON mode ---
console.log('\n-- --json mode: valid JSON --');
r = run(['--json', JSON_VALID]);
assert('valid JSON exits 0', r.code, 0, r.stdout + r.stderr);
assertNotIncludes('valid JSON no FAIL output', r.stdout, 'FAIL');

console.log('\n-- --json mode: bare options --');
r = run(['--json', JSON_BARE_OPTIONS]);
assert('JSON bare options exits 1', r.code, 1);
assertIncludes('JSON bare options reports FAIL B10', r.stdout, 'FAIL B10');

// --- NDJSON structured output format ---
console.log('\n-- NDJSON output format (D-06) --');
r = run(['--xml', XML_B9_PREFIX]);
finding = parseFinding(r.stderr, 'B9');
assert('B9 FINDING is parseable JSON object', finding !== null, true);

r = run(['--xml', XML_B10_BARE]);
finding = parseFinding(r.stderr, 'B10');
assert('B10 FINDING is parseable JSON object', finding !== null, true);

// --- FAIL lines format ---
console.log('\n-- FAIL line format --');
r = run(['--xml', XML_B9_PREFIX]);
var hasLeadingSpaces = /^  FAIL /m.test(r.stdout);
assert('FAIL lines start with two leading spaces', hasLeadingSpaces, true);

// ---- DS2: Tab schema tests ----

console.log('\n-- DS2: array layoutDefinitions --');
var XML_DS2_ARRAY_LAYOUTDEFS = tmpFile('ds2_array_layoutdefs.xml', wrapXml({
    dataSources: {},
    visualizations: {
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        layoutDefinitions: [],
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } }
        ]
    }
}));
r = run(['--xml', XML_DS2_ARRAY_LAYOUTDEFS]);
assert('DS2 array layoutDefinitions: expect exit 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('DS2 array layoutDefinitions: expect FAIL DS2 in stdout', r.stdout, 'FAIL DS2');

console.log('\n-- DS2: tabBarPosition key in tabs.options --');
var XML_DS2_TABBARPOSITION = tmpFile('ds2_tabbarposition.xml', wrapXml({
    dataSources: {},
    visualizations: {
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        tabs: {
            items: [
                { layoutId: 'tab1', label: 'Tab One' }
            ],
            options: { tabBarPosition: 'top' }
        },
        layoutDefinitions: {
            tab1: {
                structure: [
                    { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
                    { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } }
                ]
            }
        }
    }
}));
r = run(['--xml', XML_DS2_TABBARPOSITION]);
assert('DS2 tabBarPosition: expect exit 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('DS2 tabBarPosition: expect FAIL DS2 in stdout', r.stdout, 'FAIL DS2');

console.log('\n-- DS2: string items in tabs.items --');
var XML_DS2_STRING_ITEMS = tmpFile('ds2_string_items.xml', wrapXml({
    dataSources: {},
    visualizations: {
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        tabs: {
            items: ['tab1', 'tab2'],
            options: { barPosition: 'top' }
        },
        layoutDefinitions: {
            tab1: {
                structure: [
                    { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
                    { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } }
                ]
            }
        }
    }
}));
r = run(['--xml', XML_DS2_STRING_ITEMS]);
assert('DS2 string items in tabs.items: expect exit 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('DS2 string items in tabs.items: expect FAIL DS2 in stdout', r.stdout, 'FAIL DS2');

console.log('\n-- DS2: valid tab schema (PASS) --');
var XML_DS2_PASS = tmpFile('ds2_pass.xml', wrapXml({
    dataSources: {},
    visualizations: {
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        tabs: {
            items: [
                { layoutId: 'tab1', label: 'Tab One' },
                { layoutId: 'tab2', label: 'Tab Two' }
            ],
            options: { barPosition: 'top' }
        },
        layoutDefinitions: {
            tab1: {
                structure: [
                    { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
                    { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } }
                ]
            },
            tab2: {
                structure: [
                    { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } }
                ]
            }
        }
    }
}));
r = run(['--xml', XML_DS2_PASS]);
assertNotIncludes('DS2 valid tab schema: no FAIL DS2 in stdout', r.stdout, 'FAIL DS2');

// ---- DS3: Background image tests ----

console.log('\n-- DS3: no splunk.image viz at all --');
var XML_DS3_NO_IMAGE = tmpFile('ds3_no_image.xml', wrapXml({
    dataSources: {},
    visualizations: {
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } }
        ]
    }
}));
r = run(['--xml', XML_DS3_NO_IMAGE]);
assert('DS3 no image: expect exit 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('DS3 no image: expect FAIL DS3 in stdout', r.stdout, 'FAIL DS3');

console.log('\n-- DS3: splunk.image present but id is "viz_logo" (not bg_gradient) --');
var XML_DS3_WRONG_IMAGE = tmpFile('ds3_wrong_image.xml', wrapXml({
    dataSources: {},
    visualizations: {
        viz_logo: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/logo.png', preserveAspectRatio: 'xMidYMid' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_logo', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } }
        ]
    }
}));
r = run(['--xml', XML_DS3_WRONG_IMAGE]);
assert('DS3 image without bg_gradient: expect exit 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('DS3 image without bg_gradient: expect FAIL DS3 in stdout', r.stdout, 'FAIL DS3');

console.log('\n-- DS3: splunk.image with bg_gradient in id (PASS) --');
var XML_DS3_PASS = tmpFile('ds3_pass.xml', wrapXml({
    dataSources: {},
    visualizations: {
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } }
        ]
    }
}));
r = run(['--xml', XML_DS3_PASS]);
assertNotIncludes('DS3 bg_gradient image present: no FAIL DS3 in stdout', r.stdout, 'FAIL DS3');

// ---- DS4: Markdown title panel tests ----

console.log('\n-- DS4: no splunk.markdown viz at all --');
var XML_DS4_NO_MARKDOWN = tmpFile('ds4_no_markdown.xml', wrapXml({
    dataSources: {},
    visualizations: {
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } }
        ]
    }
}));
r = run(['--xml', XML_DS4_NO_MARKDOWN]);
assert('DS4 no markdown: expect exit 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('DS4 no markdown: expect FAIL DS4 in stdout', r.stdout, 'FAIL DS4');

console.log('\n-- DS4: splunk.markdown at y=300 (too low) --');
var XML_DS4_MARKDOWN_TOO_LOW = tmpFile('ds4_markdown_low.xml', wrapXml({
    dataSources: {},
    visualizations: {
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 300, w: 800, h: 80 } }
        ]
    }
}));
r = run(['--xml', XML_DS4_MARKDOWN_TOO_LOW]);
assert('DS4 markdown at y=300: expect exit 1', r.code, 1, r.stdout + r.stderr);
assertIncludes('DS4 markdown at y=300: expect FAIL DS4 in stdout', r.stdout, 'FAIL DS4');

console.log('\n-- DS4: splunk.markdown at y=10 (PASS) --');
var XML_DS4_PASS = tmpFile('ds4_pass.xml', wrapXml({
    dataSources: {},
    visualizations: {
        viz_bg_gradient: {
            type: 'splunk.image',
            options: { src: '/static/app/myapp/bg_gradient.png', preserveAspectRatio: 'none' }
        },
        viz_title: {
            type: 'splunk.markdown',
            options: { markdown: '# Dashboard' }
        }
    },
    layout: {
        structure: [
            { vizId: 'viz_bg_gradient', position: { x: 0, y: 0, w: 1920, h: 1080 } },
            { vizId: 'viz_title', position: { x: 20, y: 10, w: 800, h: 80 } }
        ]
    }
}));
r = run(['--xml', XML_DS4_PASS]);
assertNotIncludes('DS4 markdown at y=10: no FAIL DS4 in stdout', r.stdout, 'FAIL DS4');

// DS2/DS3/DS4 tests: 10 added

// ---- Cleanup temp files ----
tmpFiles.forEach(function(p) {
    try { fs.unlinkSync(p); } catch (e) {}
});

// ---- Summary ----
console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===\n');
process.exit(failed > 0 ? 1 : 0);
