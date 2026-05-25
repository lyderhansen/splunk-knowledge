#!/usr/bin/env node
/*
 * boilerplate_emit.js — emits ES5 boilerplate for a Splunk custom viz source file.
 *
 * Usage:
 *   node boilerplate_emit.js <viz_name> <viz_namespace> > visualization_source_skeleton.js
 *
 * Output:
 *   ES5 source with require(), extend({...}), initialize, formatData,
 *   getInitialDataParams, destroy, reflow, helpers (safeStr, safeNum,
 *   hexFromSplunk, getOption, detectTheme), and EMPTY _renderDark and
 *   _renderLight stubs with TODO comments.
 *
 * The agent then fills _renderDark / _renderLight by translating the
 * visual_reference_html block from DESIGN-LOCK.md into Canvas calls.
 *
 * Pure ES5 CJS — no const/let/arrow functions.
 */

'use strict';

var args = process.argv.slice(2);
if (args.length < 2) {
    process.stderr.write('Usage: boilerplate_emit.js <viz_name> <viz_namespace>\n');
    process.exit(2);
}

var vizName = args[0];
// Validate viz_name: must be alphanumeric with underscores/hyphens only.
// Splunk app/viz names are restricted to this character class anyway, so
// this is both safe and defensive against accidental injection via odd inputs.
if (!/^[a-zA-Z0-9_-]+$/.test(vizName)) {
    process.stderr.write('Error: viz_name must match /^[a-zA-Z0-9_-]+$/ (got: ' + JSON.stringify(vizName) + ')\n');
    process.exit(2);
}
// Reserved for future use (formatter namespace injection in cv-create Task 3.x).
// Currently captured to enforce the 2-arg interface but not yet interpolated.
var vizNamespace = args[1];
// Reference the variable so linters don't flag it as unused.
void vizNamespace;

var template =
    'var SplunkVisualizationBase = require("api/SplunkVisualizationBase");\n' +
    'var SplunkVisualizationUtils = require("api/SplunkVisualizationUtils");\n' +
    'var theme = require("shared/theme");\n' +
    '\n' +
    '// === HELPERS — DO NOT MODIFY ===\n' +
    'function safeStr(val) {\n' +
    '    return (val != null && val !== "") ? String(val) : "";\n' +
    '}\n' +
    'function safeNum(val, fallback) {\n' +
    '    if (val == null || val === "") return fallback;\n' +
    '    var n = parseFloat(val);\n' +
    '    return isNaN(n) ? fallback : n;\n' +
    '}\n' +
    'function hexFromSplunk(val, fallback) {\n' +
    '    if (val == null || val === "") return fallback;\n' +
    '    var s = String(val).trim();\n' +
    '    if (s.charAt(0) === "#") return s;\n' +
    '    if (s.indexOf("0x") === 0) return "#" + s.slice(2);\n' +
    '    var n = parseInt(s, 10);\n' +
    '    if (!isNaN(n) && n >= 0) return "#" + ("000000" + n.toString(16)).slice(-6);\n' +
    '    return fallback;\n' +
    '}\n' +
    'function getOption(config, ns, key, defaultValue) {\n' +
    '    var v = config[ns + key];\n' +
    '    if (v !== undefined && v !== null) return v;\n' +
    '    v = config[key];\n' +
    '    if (v !== undefined && v !== null) return v;\n' +
    '    return defaultValue;\n' +
    '}\n' +
    'function detectTheme() {\n' +
    '    try {\n' +
    '        if (typeof SplunkVisualizationUtils !== "undefined" &&\n' +
    '            SplunkVisualizationUtils.getCurrentTheme) {\n' +
    '            var st = SplunkVisualizationUtils.getCurrentTheme();\n' +
    '            if (st === "light" || st === "dark") return st;\n' +
    '        }\n' +
    '    } catch (e) {}\n' +
    '    var body = document.body;\n' +
    '    if (body) {\n' +
    '        var dt = body.getAttribute("data-theme");\n' +
    '        if (dt === "light" || dt === "dark") return dt;\n' +
    '        if (body.classList.contains("dark")) return "dark";\n' +
    '        if (body.classList.contains("light")) return "light";\n' +
    '    }\n' +
    '    try {\n' +
    '        var bg = window.getComputedStyle(document.body).backgroundColor;\n' +
    '        var m = bg.match(/\\d+/g);\n' +
    '        if (m && m.length >= 3) {\n' +
    '            return (parseInt(m[0])+parseInt(m[1])+parseInt(m[2]))/3 < 128\n' +
    '                   ? "dark" : "light";\n' +
    '        }\n' +
    '    } catch (e) {}\n' +
    '    return "dark";\n' +
    '}\n' +
    '\n' +
    'module.exports = SplunkVisualizationBase.extend({\n' +
    '\n' +
    '    initialize: function() {\n' +
    '        SplunkVisualizationBase.prototype.initialize.apply(this, arguments);\n' +
    '        this.el.classList.add("' + vizName + '-viz");\n' +
    '        this.el.style.position = "relative";\n' +
    '        this.el.style.overflow = "hidden";\n' +
    '        this._canvas = document.createElement("canvas");\n' +
    '        this._canvas.style.cssText = "position:absolute;top:0;left:0;";\n' +
    '        this.el.appendChild(this._canvas);\n' +
    '        this._tooltip = document.createElement("div");\n' +
    '        this._tooltip.style.cssText = "position:absolute;display:none;padding:6px 10px;border-radius:4px;pointer-events:none;white-space:nowrap;z-index:100;";\n' +
    '        this.el.appendChild(this._tooltip);\n' +
    '        this._lastGoodData = null;\n' +
    '        var self = this;\n' +
    '        this._canvas.addEventListener("mousemove", function(e) { self._onMouseMove(e); });\n' +
    '        this._canvas.addEventListener("mouseleave", function() { self._tooltip.style.display = "none"; });\n' +
    '        this._canvas.addEventListener("click", function(e) { self._onClick(e); });\n' +
    '    },\n' +
    '\n' +
    '    getInitialDataParams: function() {\n' +
    '        return {\n' +
    '            outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,\n' +
    '            count: 10000\n' +
    '        };\n' +
    '    },\n' +
    '\n' +
    '    formatData: function(data) {\n' +
    '        if (!data || !data.rows || data.rows.length === 0 || !data.fields || data.fields.length === 0) {\n' +
    '            if (this._lastGoodData) return this._lastGoodData;\n' +
    '            return null;\n' +
    '        }\n' +
    '        var colIdx = {};\n' +
    '        for (var i = 0; i < data.fields.length; i++) {\n' +
    '            colIdx[data.fields[i].name] = i;\n' +
    '        }\n' +
    '        var result = { colIdx: colIdx, rows: data.rows, fields: data.fields };\n' +
    '        this._lastGoodData = result;\n' +
    '        return result;\n' +
    '    },\n' +
    '\n' +
    '    updateView: function(data, config) {\n' +
    '        if (!data) {\n' +
    '            if (this._lastGoodData) data = this._lastGoodData;\n' +
    '            else return;\n' +
    '        }\n' +
    '        var ns = (function(viz) { try { var i = viz.getPropertyNamespaceInfo(); return i && i.propertyNamespace ? i.propertyNamespace : ""; } catch(e) { return ""; } })(this);\n' +
    '        function opt(key, fallback) { return getOption(config, ns, key, fallback); }\n' +
    '\n' +
    '        var themeMode = opt("themeMode", "auto");\n' +
    '        var isDark = themeMode === "auto" ? detectTheme() === "dark" : themeMode === "dark";\n' +
    '        var t = theme.getTheme(isDark ? "dark" : "light");\n' +
    '\n' +
    '        var w = this.el.clientWidth || this.el.offsetWidth || window.innerWidth || 300;\n' +
    '        var h = this.el.clientHeight || this.el.offsetHeight || window.innerHeight || 200;\n' +
    '        if (w < 10) w = window.innerWidth || 300;\n' +
    '        if (h < 10) h = window.innerHeight || 200;\n' +
    '        var dpr = window.devicePixelRatio || 1;\n' +
    '        this._canvas.width = w * dpr;\n' +
    '        this._canvas.height = h * dpr;\n' +
    '        this._canvas.style.width = w + "px";\n' +
    '        this._canvas.style.height = h + "px";\n' +
    '        var ctx = this._canvas.getContext("2d");\n' +
    '        if (!ctx) return;\n' +
    '        ctx.scale(dpr, dpr);\n' +
    '        ctx.clearRect(0, 0, w, h);\n' +
    '\n' +
    '        if (isDark) { this._renderDark(ctx, data, t, w, h, opt); }\n' +
    '        else        { this._renderLight(ctx, data, t, w, h, opt); }\n' +
    '    },\n' +
    '\n' +
    '    // === CREATIVE PORT — AGENT FILLS THESE TWO FUNCTIONS ===\n' +
    '    //\n' +
    '    // Translate visual_reference_html [data-theme="dark"] CSS into Canvas calls.\n' +
    '    // Source-of-truth: the HTML block pasted as a comment above this function\n' +
    '    // by cv-create. Do NOT paraphrase from memory — re-read the CSS.\n' +
    '    //\n' +
    '    _renderDark: function(ctx, data, t, w, h, opt) {\n' +
    '        // TODO: implement per visual_reference_html [data-theme="dark"]\n' +
    '    },\n' +
    '\n' +
    '    // Translate visual_reference_html [data-theme="light"] CSS into Canvas calls.\n' +
    '    // This is a DIFFERENT code path. Light is NOT a dimmed dark.\n' +
    '    // Read DESIGN-LOCK visual_spec.fills.background_light for which effects to skip.\n' +
    '    //\n' +
    '    _renderLight: function(ctx, data, t, w, h, opt) {\n' +
    '        // TODO: implement per visual_reference_html [data-theme="light"]\n' +
    '    },\n' +
    '\n' +
    '    _onMouseMove: function(e) {\n' +
    '        // TODO: hit-test + tooltip positioning per visual_spec.hover\n' +
    '    },\n' +
    '\n' +
    '    _onClick: function(e) {\n' +
    '        // TODO: drilldown wiring if visual_spec defines clickable elements\n' +
    '        // Pattern:\n' +
    '        //   var payload = {};\n' +
    '        //   payload[this._clickField] = clickedVal;\n' +
    '        //   this.drilldown({ action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN, data: payload }, e);\n' +
    '    },\n' +
    '\n' +
    '    reflow: function() {\n' +
    '        this.invalidateUpdateView();\n' +
    '    },\n' +
    '\n' +
    '    destroy: function() {\n' +
    '        if (this._animationFrameId) { cancelAnimationFrame(this._animationFrameId); }\n' +
    '        if (this._pulseIntervalId)  { clearInterval(this._pulseIntervalId); }\n' +
    '        SplunkVisualizationBase.prototype.destroy.apply(this, arguments);\n' +
    '    }\n' +
    '});\n';

process.stdout.write(template);
process.exit(0);
