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
 *   DS2 -- tab schema errors: array layoutDefinitions, tabBarPosition key, non-object tabs.items (DQ-01)
 *   DS3 -- no splunk.image viz with bg_gradient in id or src (DQ-02/D-03)
 *   DS4 -- no splunk.markdown title panel at y <= 200 (DQ-03/D-05/D-06)
 *   DS5 -- drilldown token set via setToken has no defaults.tokens.default entry (INT-03)
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
    var match = xmlContent.match(/<definition>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/definition>/);
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
        // DS v2 built-in keys are bare by design — whitelist them
        var DS2_BUILTIN_KEYS = ['drilldown', 'context', 'encoding'];
        if (!isBuiltinType(vizType) && !isCustomDotPrefix(vizType)) {
            var options = viz.options || {};
            var optKeys = Object.keys(options);
            for (var j = 0; j < optKeys.length; j++) {
                var key = optKeys[j];
                if (key.indexOf('.') === -1 && DS2_BUILTIN_KEYS.indexOf(key) === -1) {
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

    // ---- DS2: Tab schema correctness (DQ-01) ----
    var layout = dashJson.layout || {};

    // DS2 sub-check A: layoutDefinitions must be an object, not an array
    if (layout.layoutDefinitions && Array.isArray(layout.layoutDefinitions)) {
        emitFail('DS2', 'layout',
            'layoutDefinitions must be an object (not array) -- wrong tab schema (DQ-01)',
            { pattern: 'array layoutDefinitions' }
        );
        violations++;
    }

    // DS2 sub-check B: tabs.items entries must be objects with layoutId and label
    var tabs = layout.tabs || null;
    if (tabs && Array.isArray(tabs.items)) {
        for (var ti = 0; ti < tabs.items.length; ti++) {
            var tabItem = tabs.items[ti];
            if (typeof tabItem !== 'object' || tabItem === null) {
                emitFail('DS2', 'layout',
                    'tabs.items entries must be objects with layoutId and label -- found bare string or null (DQ-01)',
                    { pattern: 'string item in tabs.items', index: ti }
                );
                violations++;
            }
        }
    }

    // DS2 sub-check C: tabs.options must not use tabBarPosition key (use barPosition)
    if (tabs && tabs.options && Object.prototype.hasOwnProperty.call(tabs.options, 'tabBarPosition')) {
        emitFail('DS2', 'layout',
            'use barPosition not tabBarPosition in tabs.options (DQ-01)',
            { pattern: 'tabBarPosition key' }
        );
        violations++;
    }

    // ---- DS3: Background image (bg_gradient) must be present (DQ-02/D-03) ----
    var bgGradientCount = 0;
    for (var vi = 0; vi < vizIds.length; vi++) {
        var bgVizId = vizIds[vi];
        var bgViz = vizMap[bgVizId];
        if (bgViz.type === 'splunk.image') {
            var hasIdMatch = bgVizId.indexOf('bg_gradient') !== -1;
            var hasSrcMatch = bgViz.options && bgViz.options.src &&
                bgViz.options.src.indexOf('bg_gradient') !== -1;
            if (hasIdMatch || hasSrcMatch) {
                bgGradientCount++;
            }
        }
    }
    if (bgGradientCount === 0) {
        emitFail('DS3', 'layout',
            'dashboard has no bg_gradient background image -- add bg_gradient.png as first structure item (DQ-02/D-03)',
            { count: 0 }
        );
        violations++;
    }

    // ---- DS4: Markdown title panel must exist at y <= 200 (DQ-03/D-05/D-06) ----
    var markdownIds = [];
    for (var mi = 0; mi < vizIds.length; mi++) {
        var mdVizId = vizIds[mi];
        if (vizMap[mdVizId].type === 'splunk.markdown') {
            markdownIds.push(mdVizId);
        }
    }

    if (markdownIds.length === 0) {
        emitFail('DS4', 'layout',
            'dashboard has no splunk.markdown viz -- add a branded title panel at the top (DQ-03/D-05)',
            { count: 0 }
        );
        violations++;
    } else {
        // Helper: check if any structure item for a markdown viz is at y <= 200
        function hasTitleAtTop(structureArray, mdIds) {
            if (!Array.isArray(structureArray)) { return false; }
            for (var si = 0; si < structureArray.length; si++) {
                var item = structureArray[si];
                if (!item || !item.position) { continue; }
                if (mdIds.indexOf(item.vizId) !== -1 && item.position.y <= 200) {
                    return true;
                }
            }
            return false;
        }

        var foundTitleAtTop = false;
        var layoutDefs = layout.layoutDefinitions;

        if (layoutDefs && !Array.isArray(layoutDefs) && typeof layoutDefs === 'object') {
            // Tabbed layout: check all layoutDefinition structure arrays
            var defKeys = Object.keys(layoutDefs);
            for (var di = 0; di < defKeys.length; di++) {
                var defKey = defKeys[di];
                var def = layoutDefs[defKey];
                if (def && hasTitleAtTop(def.structure, markdownIds)) {
                    foundTitleAtTop = true;
                    break;
                }
            }
        } else {
            // Simple layout: check layout.structure
            foundTitleAtTop = hasTitleAtTop(layout.structure, markdownIds);
        }

        if (!foundTitleAtTop) {
            emitFail('DS4', 'layout',
                'no splunk.markdown panel found in top 200px of canvas -- title panel must be at y <= 200 (DQ-03/D-06)',
                { markdownIds: markdownIds }
            );
            violations++;
        }
    }

    // ---- DS5: drilldown tokens must have defaults.tokens.default entries ----
    var defaults = dashJson.defaults || {};
    var defaultTokens = (defaults.tokens && defaults.tokens.default) ? defaults.tokens.default : {};
    var setTokenNames = [];

    for (var dvi = 0; dvi < vizIds.length; dvi++) {
        var dvizId = vizIds[dvi];
        var dviz = vizMap[dvizId];
        var handlers = dviz.eventHandlers;
        if (!Array.isArray(handlers)) { continue; }
        for (var hi = 0; hi < handlers.length; hi++) {
            var handler = handlers[hi];
            if (!handler || handler.type !== 'drilldown.setToken') { continue; }
            var toks = (handler.options && Array.isArray(handler.options.tokens))
                ? handler.options.tokens : [];
            for (var ti2 = 0; ti2 < toks.length; ti2++) {
                if (!toks[ti2]) { continue; }
                var tokName = toks[ti2].token;
                if (tokName && setTokenNames.indexOf(tokName) === -1) {
                    setTokenNames.push(tokName);
                }
            }
        }
    }

    for (var si2 = 0; si2 < setTokenNames.length; si2++) {
        var stn = setTokenNames[si2];
        if (!Object.prototype.hasOwnProperty.call(defaultTokens, stn)) {
            emitFail('DS5', 'defaults',
                'drilldown token "' + stn + '" is set via setToken but has no defaults.tokens.default entry -- dashboard will render empty before first click (INT-03)',
                { tokenName: stn }
            );
            violations++;
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
