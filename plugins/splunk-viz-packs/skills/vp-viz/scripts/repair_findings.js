#!/usr/bin/env node
/*
 * repair_findings.js -- Auto-repair for fixable validate_viz.sh violations.
 *
 * Usage:
 *   node repair_findings.js <findings_ndjson> <app_dir> <repair_log> <attempt>
 *
 * Exit codes:
 *   0 -- repairs applied (or nothing to fix)
 *   1 -- error reading/writing files
 *   2 -- usage error
 *
 * Reads FINDING: NDJSON lines from <findings_ndjson>.
 * Fixes B10, B9 in dashboard XML (JSON.parse -> modify -> JSON.stringify).
 * Fixes B5, B7, B20 in formatter HTML (cheerio in-place patching).
 * Writes structured repair log to <repair_log>.
 *
 * Pure ES5 CJS -- no const/let/arrow functions/template literals/import.
 */

var fs = require('fs');
var path = require('path');

// Vendor path for cheerio (same as validate_ast.js)
var CHEERIO_PATH = path.join(__dirname, 'vendor', 'node_modules', 'cheerio');

// ---- CLI argument parsing ----

var args = process.argv.slice(2);

if (args.length < 4) {
    process.stderr.write('Usage: node repair_findings.js <findings_ndjson> <app_dir> <repair_log> <attempt>\n');
    process.exit(2);
}

var findingsFile = args[0];
var appDir       = path.resolve(args[1]);
var repairLog    = args[2];
var attempt      = parseInt(args[3], 10) || 1;

// Missing findings file = nothing to fix, not an error
if (!fs.existsSync(findingsFile)) {
    process.exit(0);
}

// ---- NDJSON group-by-file ----

// CONTRAST, DS1-DS5, XFILE, D-codes intentionally excluded — require human design decisions or schema corrections
var FIXABLE_CODES = ['B10', 'B9', 'B7', 'B5', 'B20'];

var lines = fs.readFileSync(findingsFile, 'utf8').split('\n');
var groups = {};  // key: resolved file path, value: array of finding objects

lines.forEach(function(line) {
    if (line.indexOf('FINDING:') !== 0) { return; }
    var finding;
    try {
        finding = JSON.parse(line.slice(8));
    } catch (e) {
        return;  // skip malformed lines (T-03-01 input validation)
    }
    if (!finding || !finding.code) { return; }
    if (FIXABLE_CODES.indexOf(finding.code) === -1) { return; }
    // Path traversal guard: file must be within appDir (T-03-02)
    var resolved = path.resolve(finding.file);
    var appDirWithSep = (appDir.slice(-1) === path.sep) ? appDir : (appDir + path.sep);
    if (resolved !== appDir && resolved.indexOf(appDirWithSep) !== 0) { return; }
    if (!groups[resolved]) { groups[resolved] = []; }
    groups[resolved].push(finding);
});

// ---- CDATA extract/reinject (copied verbatim from validate_dash.js) ----

function extractFromXml(xmlContent) {
    var match = xmlContent.match(/<definition>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/definition>/);
    if (!match) { return null; }
    try { return JSON.parse(match[1]); } catch (e) { return null; }
}

function reinjectCdata(xmlContent, dashJson) {
    var newStr = JSON.stringify(dashJson, null, 2);
    return xmlContent.replace(
        /<definition>\s*<!\[CDATA\[[\s\S]*?\]\]>\s*<\/definition>/,
        '<definition><![CDATA[' + newStr + ']]></definition>'
    );
}

// ---- XML fix functions ----

function fixB10(dashJson, vizId, vizType, bareKey) {
    var viz = dashJson.visualizations && dashJson.visualizations[vizId];
    if (!viz || !viz.options) { return false; }
    if (typeof viz.options[bareKey] === 'undefined') { return false; }
    viz.options[vizType + '.' + bareKey] = viz.options[bareKey];
    delete viz.options[bareKey];
    return true;
}

function fixB9(dashJson, vizId, vizType) {
    var viz = dashJson.visualizations && dashJson.visualizations[vizId];
    if (!viz) { return false; }
    viz.type = vizType.replace(/^custom\./, '');
    return true;
}

// ---- HTML fix function ----

function fixHtmlFile(filePath, findings) {
    var cheerio = require(CHEERIO_PATH);
    var html = fs.readFileSync(filePath, 'utf8');
    var $ = cheerio.load(html, null, false);  // fragment mode -- no <html><body> wrapping

    findings.forEach(function(f) {
        if (f.code === 'B7') {
            $('[default]').each(function(i, el) {
                var val = $(el).attr('default');
                $(el).removeAttr('default');
                $(el).attr('value', val);
            });
        }
        if (f.code === 'B5') {
            $('splunk-color-picker').each(function(i, el) {
                if ($(el).attr('type') !== 'custom') {
                    $(el).attr('type', 'custom');
                }
            });
        }
        if (f.code === 'B20') {
            $('splunk-radio-input').filter(function(i, el) {
                return ($(el).attr('name') || '').indexOf('themeMode') !== -1;
            }).each(function(i, el) {
                var hasAuto = false;
                $(el).find('option').each(function(j, opt) {
                    if ($(opt).attr('value') === 'auto') { hasAuto = true; }
                });
                if (!hasAuto) {
                    $(el).prepend('<option value="auto">Auto</option>');
                }
            });
        }
    });

    fs.writeFileSync(filePath, $.html(), 'utf8');
}

// ---- Repair log helper ----

function logRepair(entry) {
    fs.appendFileSync(repairLog, JSON.stringify(entry) + '\n', 'utf8');
}

// ---- Main: process each file group ----

var fileKeys = Object.keys(groups);
var totalRepairs = 0;

fileKeys.forEach(function(filePath) {
    var findings = groups[filePath];
    var ext = path.extname(filePath).toLowerCase();
    var fileRepairs = 0;

    if (ext === '.xml') {
        // XML: extract CDATA JSON, apply B10/B9 fixes, reinject
        var xmlContent;
        try {
            xmlContent = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            process.stderr.write('repair_findings: could not read ' + filePath + ': ' + e.message + '\n');
            return;
        }

        var dashJson = extractFromXml(xmlContent);
        if (!dashJson) {
            process.stderr.write('repair_findings: could not extract JSON from ' + filePath + '\n');
            return;
        }

        findings.forEach(function(f) {
            var fixed = false;
            if (f.code === 'B10' && f.context && f.context.vizType && f.context.bareKey) {
                fixed = fixB10(dashJson, f.vizId, f.context.vizType, f.context.bareKey);
                if (fixed) {
                    logRepair({ attempt: attempt, code: 'B10', file: filePath,
                        vizId: f.vizId, bareKey: f.context.bareKey,
                        action: 'prefixed with ' + f.context.vizType, result: 'fixed' });
                    fileRepairs++;
                }
            }
            if (f.code === 'B9' && f.context && f.context.vizType) {
                fixed = fixB9(dashJson, f.vizId, f.context.vizType);
                if (fixed) {
                    logRepair({ attempt: attempt, code: 'B9', file: filePath,
                        vizId: f.vizId, vizType: f.context.vizType,
                        action: 'removed custom. prefix', result: 'fixed' });
                    fileRepairs++;
                }
            }
        });

        if (fileRepairs > 0) {
            var newXml = reinjectCdata(xmlContent, dashJson);
            try {
                fs.writeFileSync(filePath, newXml, 'utf8');
            } catch (e) {
                process.stderr.write('repair_findings: could not write ' + filePath + ': ' + e.message + '\n');
                return;
            }
            logRepair({ attempt: attempt, file: filePath, summary: 'applied ' + fileRepairs + ' XML repairs' });
        }

    } else if (ext === '.html') {
        // HTML: cheerio patching for B5/B7/B20
        try {
            fixHtmlFile(filePath, findings);
            fileRepairs = findings.length;
            findings.forEach(function(f) {
                logRepair({ attempt: attempt, code: f.code, file: filePath,
                    action: 'cheerio HTML fix', result: 'fixed' });
            });
            logRepair({ attempt: attempt, file: filePath, summary: 'applied ' + fileRepairs + ' HTML repairs' });
        } catch (e) {
            process.stderr.write('repair_findings: HTML fix failed for ' + filePath + ': ' + e.message + '\n');
            return;
        }
    }

    totalRepairs += fileRepairs;
});

if (totalRepairs > 0) {
    process.stdout.write('repair_findings: applied ' + totalRepairs + ' repair(s) across ' + fileKeys.length + ' file(s)\n');
}

process.exit(0);
