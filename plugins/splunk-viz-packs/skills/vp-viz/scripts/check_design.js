#!/usr/bin/env node
/*
 * check_design.js -- Design quality gate for Splunk viz pack formatter + JS + theme.
 *
 * Usage:
 *   node check_design.js <formatter.html> <visualization_source.js> <theme.js>
 *
 * Exit codes:
 *   0 -- no FAIL findings (WARNs do not cause exit 1)
 *   1 -- one or more FAIL findings
 *   2 -- usage error (fewer than 3 arguments)
 *
 * Output:
 *   stdout -- FAIL/WARN lines with two leading spaces (matching validate_viz.sh format)
 *   stderr -- FINDING: NDJSON for FAIL only (WARNs do NOT write to stderr)
 *
 * Checks (D01-D06, D08-D11 -- DQG-01 through DQG-11, skipping DQG-07):
 *   D01 (WARN) -- visualization_source.js has no gradient calls
 *   D02 (WARN) -- visualization_source.js has no shadow effects
 *   D03 (FAIL) -- visualization_source.js has no hero sizing formula
 *   D04 (WARN) -- theme.js has no rgba() or tint references
 *   D05 (FAIL) -- formatter has fewer than 4 form[section-label] elements
 *   D06 (WARN) -- formatter has fewer than 2 splunk-color-picker elements
 *   D08 (FAIL forward, WARN reverse) -- bidirectional wiring check
 *   D09 (FAIL) -- visualization_source.js caps accentIntensity (gi) at 1.0 (CQ-02)
 *   D10 (FAIL) -- visualization_source.js missing @viz-type annotation on first line (CQ-05)
 *   D11 (FAIL) -- _onMouseMove lacks showHoverEffect early-exit guard (CQ-03)
 *
 * Pure ES5 CJS -- no const/let/arrow functions/template literals/import.
 */

var fs   = require('fs');
var path = require('path');

// ---- CLI argument parsing ----

var args = process.argv.slice(2);

if (args.length < 3) {
    process.stderr.write('Usage: node check_design.js <formatter.html> <visualization_source.js> <theme.js>\n');
    process.exit(2);
}

var formatterPath = args[0];
var jsSrcPath     = args[1];
var themeJsPath   = args[2];

// Verify all three files exist before proceeding
if (!fs.existsSync(formatterPath)) {
    process.stderr.write('Error: file not found: ' + formatterPath + '\n');
    process.exit(1);
}
if (!fs.existsSync(jsSrcPath)) {
    process.stderr.write('Error: file not found: ' + jsSrcPath + '\n');
    process.exit(1);
}
if (!fs.existsSync(themeJsPath)) {
    process.stderr.write('Error: file not found: ' + themeJsPath + '\n');
    process.exit(1);
}

// ---- Load file contents ----

var html         = fs.readFileSync(formatterPath, 'utf8');
var jsSrc        = fs.readFileSync(jsSrcPath, 'utf8');
var themeContent = fs.readFileSync(themeJsPath, 'utf8');

// ---- Load cheerio for HTML DOM parsing ----

var cheerio = require(path.join(__dirname, 'vendor', 'node_modules', 'cheerio'));
var $       = cheerio.load(html, null, false);  // false = no html/body wrapping

// ---- Emit helpers ----

var failures = 0;

function emitFail(code, file, message, context) {
    process.stdout.write('  FAIL ' + code + ': ' + message + '\n');
    process.stderr.write('FINDING:' + JSON.stringify({
        type: 'FAIL',
        code: code,
        file: file,
        message: message,
        context: context
    }) + '\n');
    failures++;
}

function emitWarn(code, message) {
    process.stdout.write('  WARN ' + code + ': ' + message + '\n');
    // No stderr write for WARN (only FAIL writes FINDING: NDJSON)
}

// ---- D01 (WARN, DQG-01): Gradient usage in visualization_source.js ----

if (jsSrc.indexOf('createLinearGradient') === -1 && jsSrc.indexOf('createRadialGradient') === -1) {
    emitWarn('D01', 'visualization_source.js has no gradient calls (createLinearGradient or createRadialGradient); consider adding depth via gradients');
}

// ---- D02 (WARN, DQG-02): Shadow effects in visualization_source.js ----

if (jsSrc.indexOf('shadowBlur') === -1 && jsSrc.indexOf('shadowColor') === -1) {
    emitWarn('D02', 'visualization_source.js has no shadow effects (shadowBlur or shadowColor); consider adding subtle depth');
}

// ---- D03 (FAIL, DQG-03): Hero sizing formula in visualization_source.js ----

var hasTypoScale = jsSrc.indexOf('getTypoScale') !== -1;
var hasMin       = jsSrc.indexOf('Math.min') !== -1;
var hasMax       = jsSrc.indexOf('Math.max') !== -1;

if (!hasTypoScale && !(hasMin && hasMax)) {
    emitFail('D03', jsSrcPath,
        'visualization_source.js has no hero sizing formula; must use getTypoScale() or both Math.min and Math.max for dynamic text sizing',
        { hasTypoScale: hasTypoScale, hasMin: hasMin, hasMax: hasMax });
}

// ---- D04 (WARN, DQG-04): Tinted neutrals in theme.js ----

if (themeContent.indexOf('rgba(') === -1 && themeContent.toLowerCase().indexOf('tint') === -1) {
    emitWarn('D04', 'theme.js has no rgba() values or tint references; consider using tinted neutrals for brand-specific depth');
}

// ---- D05 (FAIL, DQG-05): Minimum 4 formatter sections ----

var sectionCount = $('form[section-label]').length;
if (sectionCount < 4) {
    emitFail('D05', formatterPath,
        'formatter has only ' + sectionCount + ' section-label(s); minimum 4 required for a complete settings panel',
        { count: sectionCount, required: 4 });
}

// ---- D06 (WARN, DQG-06): Minimum 2 color pickers ----

var colorPickerCount = $('splunk-color-picker').length;
if (colorPickerCount < 2) {
    emitWarn('D06', 'formatter has only ' + colorPickerCount + ' splunk-color-picker element(s); minimum 2 recommended for theme customization');
}

// ---- D08 (FAIL forward, WARN reverse, DQG-08): Bidirectional wiring check ----

// Forward: extract formatter control keys by stripping {{VIZ_NAMESPACE}}. prefix from name= attrs
var formatterKeys = [];
$('[name]').each(function(i, el) {
    var nameAttr = $(el).attr('name');
    if (nameAttr) {
        // Strip namespace prefix: everything up to and including the last dot
        var lastDot = nameAttr.lastIndexOf('.');
        var key = (lastDot !== -1) ? nameAttr.slice(lastDot + 1) : nameAttr;
        if (key && formatterKeys.indexOf(key) === -1) {
            formatterKeys.push(key);
        }
    }
});

// Check forward: each formatter key must appear as a quoted string in jsSrc
for (var fi = 0; fi < formatterKeys.length; fi++) {
    var fkey = formatterKeys[fi];
    var singleQuoted = "'" + fkey + "'";
    var doubleQuoted = '"' + fkey + '"';
    if (jsSrc.indexOf(singleQuoted) === -1 && jsSrc.indexOf(doubleQuoted) === -1) {
        emitFail('D08', formatterPath,
            'formatter control "' + fkey + '" not referenced in visualization_source.js',
            { key: fkey, direction: 'forward' });
    }
}

// Reverse: extract opt('key') and getOption(config, ns, 'key') calls from jsSrc
// For opt('key', 'fallback') — capture only the first quoted arg (the key, not the fallback)
// For getOption(config, ns, 'key', fallback) — capture the third arg (after two non-string args)
var optPattern = /\bopt\(\s*(['"])([^'"]+)\1/g;
var getOptPattern = /\bgetOption\([^,]+,\s*[^,]+,\s*(['"])([^'"]+)\1/g;
var FALLBACK_STRINGS = {'true':1,'false':1,'auto':1,'dark':1,'light':1,'normal':1,'slow':1,'fast':1,'center':1,'top':1,'left':1,'right':1,'none':1,'default':1,'0':1,'1':1,'50':1,'100':1,'-1':1,'':1};
var optMatch;
while ((optMatch = optPattern.exec(jsSrc)) !== null) {
    var optKey = optMatch[2];
    if (FALLBACK_STRINGS[optKey]) continue;
    if (formatterKeys.indexOf(optKey) === -1) {
        emitWarn('D08', 'JS calls opt("' + optKey + '") but no matching formatter control found');
    }
}
while ((optMatch = getOptPattern.exec(jsSrc)) !== null) {
    var optKey2 = optMatch[2];
    if (FALLBACK_STRINGS[optKey2]) continue;
    if (formatterKeys.indexOf(optKey2) === -1) {
        emitWarn('D08', 'JS calls getOption("' + optKey2 + '") but no matching formatter control found');
    }
}

// ---- D09 (FAIL, CQ-02): accentIntensity (gi) capped at 1.0 ----
// Values above 100 are intentional for extreme glow effects; a ceiling clamp silently truncates them.

var d09_ternary = /gi\s*>\s*1\s*\?\s*1\s*:\s*gi/;
var d09_mathMin1 = /Math\.min\s*\(\s*gi\s*,\s*1\s*\)/;
var d09_mathMin2 = /Math\.min\s*\(\s*1\s*,\s*gi\s*\)/;
var d09_doubleTernary = /gi\s*=\s*gi\s*<\s*0\s*\?\s*0\s*:\s*gi\s*>\s*1\s*\?\s*1\s*:\s*gi/;

var d09MatchedPattern = null;
if (d09_doubleTernary.test(jsSrc)) {
    d09MatchedPattern = 'gi = gi < 0 ? 0 : gi > 1 ? 1 : gi';
} else if (d09_ternary.test(jsSrc)) {
    d09MatchedPattern = 'gi > 1 ? 1 : gi';
} else if (d09_mathMin1.test(jsSrc)) {
    d09MatchedPattern = 'Math.min(gi, 1)';
} else if (d09_mathMin2.test(jsSrc)) {
    d09MatchedPattern = 'Math.min(1, gi)';
}

if (d09MatchedPattern !== null) {
    emitFail('D09', jsSrcPath,
        'accentIntensity (gi) is capped at 1.0 -- values above 100 are intentional for extreme glow effects; remove the ceiling clamp (ACC-03/CQ-02)',
        { pattern: d09MatchedPattern });
}

// ---- D10 (FAIL, CQ-05): @viz-type annotation on first line ----
// Required for preview.png silhouette selection.

var VALID_VIZ_TYPES = ['kpi', 'gauge', 'bars', 'grid', 'line', 'timeline', 'radar', 'progress', 'scatter', 'network'];
var jsSrcFirstLine = jsSrc.split('\n')[0] || '';
var d10AnnotationPattern = /^\/\/\s*@viz-type:\s*(\S+)/;
var d10Match = d10AnnotationPattern.exec(jsSrcFirstLine);

if (!d10Match) {
    emitFail('D10', jsSrcPath,
        'first line must be: // @viz-type: <type> (one of: ' + VALID_VIZ_TYPES.join(', ') + ') -- required for preview.png silhouette selection (CQ-05)',
        { firstLine: jsSrcFirstLine });
} else {
    var d10VizType = d10Match[1];
    if (VALID_VIZ_TYPES.indexOf(d10VizType) === -1) {
        emitWarn('D10', 'unrecognized @viz-type: "' + d10VizType + '" -- valid types are: ' + VALID_VIZ_TYPES.join(', '));
    }
}

// ---- D11 (FAIL, CQ-03): showHoverEffect early-exit guard in _onMouseMove ----
// Ensures _onMouseMove exits early when user disables hover via the formatter setting.

if (jsSrc.indexOf('_onMouseMove') !== -1) {
    // Extract approximate block starting at _onMouseMove (heuristic: next 1500 chars covers most functions)
    var mouseMovIdx = jsSrc.indexOf('_onMouseMove');
    var mouseMovBlock = jsSrc.slice(mouseMovIdx, mouseMovIdx + 1500);

    var d11GuardPattern = /(showHover|hoverEnabled|hoverEffect).*return|if\s*\(\s*!\s*(this\.)?_?showHover/;
    if (!d11GuardPattern.test(mouseMovBlock)) {
        emitFail('D11', jsSrcPath,
            '_onMouseMove has no showHoverEffect early-exit guard -- add: if (!this._showHoverEffect) return; at the top of _onMouseMove (CQ-03)',
            { functionStart: mouseMovIdx });
    }
}

// ---- Exit ----

process.exit(failures > 0 ? 1 : 0);
