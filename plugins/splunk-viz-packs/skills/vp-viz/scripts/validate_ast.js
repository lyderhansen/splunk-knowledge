#!/usr/bin/env node
/*
 * validate_ast.js — AST/DOM validator for Splunk custom viz packs.
 *
 * Usage:
 *   node validate_ast.js --js <file>    Check JS source for ES6+ violations (FAIL F3)
 *   node validate_ast.js --html <file>  Check formatter HTML for B-series violations
 *
 * Exit codes:
 *   0 — no violations found
 *   1 — one or more violations found (or file not found)
 *   2 — usage error (bad arguments)
 *
 * Output format: two leading spaces, e.g.  "  FAIL F3: const at line 3: const FOO ="
 * Matches validate_viz.sh FAIL/WARN format exactly.
 *
 * Pure ES5 CJS — no const/let/arrow/template literals/import.
 */

var fs = require('fs');
var path = require('path');

// Vendor paths relative to this script's directory
var ACORN_PATH = path.join(__dirname, 'vendor', 'node_modules', 'acorn', 'dist', 'acorn.js');
var CHEERIO_PATH = path.join(__dirname, 'vendor', 'node_modules', 'cheerio');

// ---- CLI argument parsing ----

var args = process.argv.slice(2);

if (args.length < 2) {
    process.stderr.write('Usage: node validate_ast.js --js <file>\n');
    process.stderr.write('       node validate_ast.js --html <file>\n');
    process.exit(2);
}

var mode = args[0];
var filePath = args[1];

if (mode !== '--js' && mode !== '--html') {
    process.stderr.write('Error: unknown mode "' + mode + '". Use --js or --html.\n');
    process.stderr.write('Usage: node validate_ast.js --js <file>\n');
    process.stderr.write('       node validate_ast.js --html <file>\n');
    process.exit(2);
}

if (!fs.existsSync(filePath)) {
    process.stderr.write('Error: file not found: ' + filePath + '\n');
    process.exit(1);
}

// ---- Main dispatch ----

if (mode === '--js') {
    runJsChecks(filePath);
} else {
    runHtmlChecks(filePath);
}

// ---- JS checks via acorn AST walk ----

function runJsChecks(file) {
    var acorn = require(ACORN_PATH);
    var code = fs.readFileSync(file, 'utf8');
    var lines = code.split('\n');

    var ast;
    try {
        ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
    } catch (e) {
        // If acorn can't parse at all, fall back gracefully
        process.stderr.write('Warning: acorn parse error: ' + e.message + '\n');
        process.exit(1);
    }

    var violations = [];
    var visited = [];

    function hasVisited(node) {
        for (var i = 0; i < visited.length; i++) {
            if (visited[i] === node) return true;
        }
        return false;
    }

    function markVisited(node) {
        visited.push(node);
    }

    function snippet(loc) {
        if (!loc || !loc.start) return '';
        var lineIdx = loc.start.line - 1;
        if (lineIdx < 0 || lineIdx >= lines.length) return '';
        var line = lines[lineIdx];
        return line.substring(0, 60).replace(/^\s+/, '');
    }

    function report(node, desc) {
        if (hasVisited(node)) return;
        markVisited(node);
        var line = node.loc && node.loc.start ? node.loc.start.line : '?';
        var snip = snippet(node.loc);
        violations.push('  FAIL F3: ' + desc + ' at line ' + line + ': ' + snip);
    }

    function walk(node) {
        if (!node || typeof node !== 'object') return;
        if (typeof node.type !== 'string') return;

        switch (node.type) {
            case 'VariableDeclaration':
                if (node.kind === 'const' || node.kind === 'let') {
                    report(node, node.kind + ' declaration');
                }
                break;
            case 'ArrowFunctionExpression':
                report(node, 'arrow function');
                break;
            case 'TemplateLiteral':
                report(node, 'template literal');
                break;
            case 'TaggedTemplateExpression':
                report(node, 'tagged template literal');
                break;
            case 'ClassDeclaration':
                report(node, 'class declaration');
                break;
            case 'ClassExpression':
                report(node, 'class expression');
                break;
            case 'ObjectPattern':
                report(node, 'object destructuring');
                break;
            case 'ArrayPattern':
                report(node, 'array destructuring');
                break;
        }

        // Recurse into child nodes
        var keys = Object.keys(node);
        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            if (key === 'type' || key === 'loc' || key === 'start' || key === 'end') continue;
            var child = node[key];
            if (Array.isArray(child)) {
                for (var i = 0; i < child.length; i++) {
                    walk(child[i]);
                }
            } else if (child && typeof child === 'object' && typeof child.type === 'string') {
                walk(child);
            }
        }
    }

    walk(ast);

    for (var v = 0; v < violations.length; v++) {
        process.stdout.write(violations[v] + '\n');
    }

    process.exit(violations.length > 0 ? 1 : 0);
}

// ---- HTML checks via cheerio DOM parsing ----

function runHtmlChecks(file) {
    var cheerio = require(CHEERIO_PATH);
    var html = fs.readFileSync(file, 'utf8');

    // Fragment mode: do not wrap in <html><body>
    var $ = cheerio.load(html, null, false);

    var violations = [];

    // B7: default= attribute — should use value= instead
    var defaultAttrs = $('[default]');
    if (defaultAttrs.length > 0) {
        violations.push('  FAIL B7: ' + defaultAttrs.length + ' default= attr(s) — use value= instead');
    }

    // B10: namespace checks
    // Rule 1: {{VIZ_NAMESPACE}} must appear in at least one name= attribute
    var nameAttrs = $('[name]');
    var hasTemplate = false;
    var hardcodedCount = 0;

    nameAttrs.each(function(i, el) {
        var nameVal = $(el).attr('name') || '';
        if (nameVal.indexOf('{{VIZ_NAMESPACE}}') !== -1) {
            hasTemplate = true;
        } else if (/^[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+/.test(nameVal)) {
            // Looks like a hardcoded namespace: word.word or word.word.word
            hardcodedCount++;
        }
    });

    if (!hasTemplate && nameAttrs.length > 0) {
        violations.push('  FAIL B10: no {{VIZ_NAMESPACE}} found in formatter');
    }
    if (hardcodedCount > 0) {
        violations.push('  FAIL B10: ' + hardcodedCount + ' hardcoded namespace(s)');
    }

    // B5a: splunk-color-picker must have type="custom"
    var colorPickers = $('splunk-color-picker');
    var badPickers = 0;
    colorPickers.each(function(i, el) {
        var typeVal = $(el).attr('type') || '';
        if (typeVal !== 'custom') {
            badPickers++;
        }
    });
    if (badPickers > 0) {
        violations.push('  FAIL B5: ' + badPickers + ' color picker(s) missing type="custom"');
    }

    // B5b: every <form> must have section-label=
    var forms = $('form');
    var badForms = 0;
    forms.each(function(i, el) {
        var sectionLabel = $(el).attr('section-label');
        if (sectionLabel === undefined || sectionLabel === null) {
            badForms++;
        }
    });
    if (badForms > 0) {
        violations.push('  FAIL B5: ' + badForms + ' <form>(s) missing section-label=');
    }

    // B20: themeMode radio must have an "auto" option
    // Find radio inputs named *.themeMode or with name containing themeMode
    var themeModeRadios = $('splunk-radio-input').filter(function(i, el) {
        var nameVal = $(el).attr('name') || '';
        return nameVal.indexOf('themeMode') !== -1;
    });

    themeModeRadios.each(function(i, el) {
        var options = $(el).find('option');
        var hasAuto = false;
        options.each(function(j, opt) {
            if ($(opt).attr('value') === 'auto') {
                hasAuto = true;
            }
        });
        if (!hasAuto) {
            violations.push('  FAIL B20: themeMode has no "auto" option');
        }
    });

    for (var v = 0; v < violations.length; v++) {
        process.stdout.write(violations[v] + '\n');
    }

    process.exit(violations.length > 0 ? 1 : 0);
}
