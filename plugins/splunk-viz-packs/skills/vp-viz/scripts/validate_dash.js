#!/usr/bin/env node
/*
 * validate_dash.js -- Dashboard Studio JSON schema validator for Splunk viz packs.
 *
 * Usage:
 *   node validate_dash.js --xml <file>   Check dashboard XML (extracts CDATA JSON)
 *   node validate_dash.js --json <file>  Check raw dashboard JSON file
 *
 * Exit codes:
 *   0 -- no violations found
 *   1 -- one or more violations found (or file not found / parse error)
 *   2 -- usage error (bad arguments)
 *
 * Output format (stdout): two leading spaces, e.g. "  FAIL B9: custom. prefix..."
 * Matches validate_viz.sh FAIL/WARN format exactly.
 *
 * Structured output (stderr): NDJSON lines for Phase 3 repair loop.
 * Pattern: FINDING:{json} where json has type, code, file, vizId, message, context.
 *
 * Checks performed:
 *   B9  -- viz type starts with "custom." (wrong format; should be "app.viz")
 *   B10 -- custom viz has bare option keys (without "app.viz.key" namespace prefix)
 *   DS1 -- viz references undeclared data source
 *
 * Pure ES5 CJS -- no const/let/arrow functions/template literals/import.
 */

var fs = require('fs');
var path = require('path');

// Vendor path for ajv
var AJV_PATH = path.join(__dirname, 'vendor', 'node_modules', 'ajv', 'dist', 'ajv.js');

// ---- CLI argument parsing ----

var args = process.argv.slice(2);

if (args.length < 2) {
    process.stderr.write('Usage: node validate_dash.js --xml <file>\n');
    process.stderr.write('       node validate_dash.js --json <file>\n');
    process.exit(2);
}

var mode = args[0];
var filePath = args[1];

if (mode !== '--xml' && mode !== '--json') {
    process.stderr.write('Error: unknown mode "' + mode + '". Use --xml or --json.\n');
    process.stderr.write('Usage: node validate_dash.js --xml <file>\n');
    process.stderr.write('       node validate_dash.js --json <file>\n');
    process.exit(2);
}

if (!fs.existsSync(filePath)) {
    process.stderr.write('Error: file not found: ' + filePath + '\n');
    process.exit(1);
}

// ---- ajv initialization ----

var AjvModule = require(AJV_PATH);
var Ajv = AjvModule.default || AjvModule;
var ajv = new Ajv({ allErrors: true });

// Minimal structural schema for Dashboard Studio JSON
var dashSchema = {
    type: 'object',
    properties: {
        visualizations: { type: 'object' },
        dataSources: { type: 'object' }
    },
    required: ['visualizations']
};

var validateSchema = ajv.compile(dashSchema);

// ---- CDATA extraction ----

function extractFromXml(xmlContent) {
    var match = xmlContent.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
    if (!match) {
        return null;
    }
    try {
        return JSON.parse(match[1]);
    } catch (e) {
        return null;
    }
}

// ---- Violation emitter ----

function emitFail(code, vizId, detail, context) {
    process.stdout.write('  FAIL ' + code + ': ' + detail + '\n');
    process.stderr.write('FINDING:' + JSON.stringify({
        type: 'FAIL',
        code: code,
        file: filePath,
        vizId: vizId,
        message: detail,
        context: context || {}
    }) + '\n');
}

// ---- Type prefix helpers ----

function isBuiltinType(vizType) {
    if (!vizType) { return false; }
    return (vizType.indexOf('splunk.') === 0 || vizType.indexOf('input.') === 0);
}

function isCustomDotPrefix(vizType) {
    if (!vizType) { return false; }
    return vizType.indexOf('custom.') === 0;
}

// ---- Main check runner ----

function runDashChecks(filePathArg, dashJson) {
    var violations = 0;

    // Validate basic schema structure
    var valid = validateSchema(dashJson);
    if (!valid) {
        process.stderr.write('Warning: dashboard JSON does not match expected schema structure\n');
        // Continue checking anyway -- schema mismatch is informational
    }

    var vizMap = dashJson.visualizations || {};
    var vizIds = Object.keys(vizMap);
    var declared = Object.keys(dashJson.dataSources || {});

    for (var i = 0; i < vizIds.length; i++) {
        var vizId = vizIds[i];
        var viz = vizMap[vizId];
        var vizType = viz.type || '';

        // Check 1: B9 -- wrong type format (starts with "custom.")
        if (isCustomDotPrefix(vizType)) {
            emitFail('B9',
                vizId,
                'viz "' + vizId + '" has type "' + vizType + '" -- use "app.viz_name" format, not "custom." prefix',
                { vizType: vizType }
            );
            violations++;
        }

        // Check 2: B10 -- bare option keys in custom viz options{}
        // Only flag custom vizs (not splunk.* or input.*)
        if (!isBuiltinType(vizType) && !isCustomDotPrefix(vizType)) {
            var options = viz.options || {};
            var optKeys = Object.keys(options);
            for (var j = 0; j < optKeys.length; j++) {
                var key = optKeys[j];
                if (key.indexOf('.') === -1) {
                    emitFail('B10',
                        vizId,
                        'viz "' + vizId + '" option key "' + key + '" is bare -- use "' + vizType + '.' + key + '" format',
                        { vizType: vizType, bareKey: key }
                    );
                    violations++;
                }
            }
        }

        // Check 3: Data source cross-reference -- viz.dataSources[role] must be declared
        var vizDataSources = viz.dataSources || {};
        var roles = Object.keys(vizDataSources);
        for (var k = 0; k < roles.length; k++) {
            var role = roles[k];
            var dsRef = vizDataSources[role];
            if (declared.indexOf(dsRef) === -1) {
                emitFail('DS1',
                    vizId,
                    'viz "' + vizId + '" references data source "' + dsRef + '" which is not declared in dataSources',
                    { dsRef: dsRef, declared: declared }
                );
                violations++;
            }
        }
    }

    process.exit(violations > 0 ? 1 : 0);
}

// ---- Mode dispatch ----

function runXmlChecks(filePathArg) {
    var xmlContent;
    try {
        xmlContent = fs.readFileSync(filePathArg, 'utf8');
    } catch (e) {
        process.stderr.write('Error: could not read file: ' + filePathArg + '\n');
        process.exit(1);
    }

    var dashJson = extractFromXml(xmlContent);
    if (dashJson === null) {
        process.stderr.write('Error: could not extract or parse JSON from CDATA in: ' + filePathArg + '\n');
        process.exit(1);
    }

    runDashChecks(filePathArg, dashJson);
}

function runJsonChecks(filePathArg) {
    var content;
    try {
        content = fs.readFileSync(filePathArg, 'utf8');
    } catch (e) {
        process.stderr.write('Error: could not read file: ' + filePathArg + '\n');
        process.exit(1);
    }

    var dashJson;
    try {
        dashJson = JSON.parse(content);
    } catch (e) {
        process.stderr.write('Error: invalid JSON in file: ' + filePathArg + '\n');
        process.exit(1);
    }

    runDashChecks(filePathArg, dashJson);
}

if (mode === '--xml') {
    runXmlChecks(filePath);
} else {
    runJsonChecks(filePath);
}
