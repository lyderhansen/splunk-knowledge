// Porsche Motorsport Viz Pack — shared design tokens and utilities
// ES5 only — no const/let/arrow/template literals

var DARK = {
    bg:          "#000000",
    panel:       "rgba(0, 0, 0, 0.88)",
    panelSolid:  "#000000",
    panelStroke: "rgba(255, 255, 255, 0.06)",
    text:        "#FFFFFF",
    textDim:     "rgba(255, 255, 255, 0.60)",
    textWhisper: "rgba(255, 255, 255, 0.30)",
    accent:      "#D5001C",
    accentGlow:  "rgba(213, 0, 28, 0.35)",
    silver:      "#8C8C8C",
    warmGrey:    "#A7A8AA",
    gaugeTrack:  "rgba(255, 255, 255, 0.05)",
    gridLine:    "rgba(255, 255, 255, 0.06)",
    hoverBg:     "rgba(213, 0, 28, 0.08)",
    headerBg:    "rgba(255, 255, 255, 0.03)",
    compoundSoft:   "#D5001C",
    compoundMedium: "#FFC907",
    compoundHard:   "#FFFFFF",
    compoundInter:  "#39B54A",
    compoundWet:    "#0072C6",
    energyAttack:   "#D5001C",
    energyDefend:   "#0072C6",
    energyNeutral:  "#8C8C8C",
    deltaBest:      "#A855F7",
    deltaImproved:  "#22C55E",
    deltaSlower:    "#FFC907",
    deltaNeutral:   "#8C8C8C"
};

var LIGHT = {
    bg:          "#F0F2F5",
    panel:       "rgba(255, 255, 255, 0.92)",
    panelSolid:  "#FFFFFF",
    panelStroke: "rgba(0, 0, 0, 0.08)",
    text:        "#0B0E1A",
    textDim:     "rgba(11, 14, 26, 0.60)",
    textWhisper: "rgba(11, 14, 26, 0.30)",
    accent:      "#D5001C",
    accentGlow:  "rgba(213, 0, 28, 0.20)",
    silver:      "#6B6B6B",
    warmGrey:    "#707172",
    gaugeTrack:  "rgba(0, 0, 0, 0.06)",
    gridLine:    "rgba(0, 0, 0, 0.06)",
    hoverBg:     "rgba(213, 0, 28, 0.06)",
    headerBg:    "rgba(0, 0, 0, 0.03)",
    compoundSoft:   "#D5001C",
    compoundMedium: "#D4A600",
    compoundHard:   "#3A3A3A",
    compoundInter:  "#2D8F3C",
    compoundWet:    "#0060A8",
    energyAttack:   "#D5001C",
    energyDefend:   "#0060A8",
    energyNeutral:  "#6B6B6B",
    deltaBest:      "#9333EA",
    deltaImproved:  "#16A34A",
    deltaSlower:    "#D4A600",
    deltaNeutral:   "#6B6B6B"
};

var FONT_DATA = '"SF Mono", Menlo, Consolas, monospace';
var FONT_UI   = '"Helvetica Neue", Helvetica, Arial, sans-serif';

function getTheme(mode) {
    return mode === "light" ? LIGHT : DARK;
}

function withAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}

function lerpColor(a, b, t) {
    var ar = parseInt(a.slice(1, 3), 16);
    var ag = parseInt(a.slice(3, 5), 16);
    var ab = parseInt(a.slice(5, 7), 16);
    var br = parseInt(b.slice(1, 3), 16);
    var bg = parseInt(b.slice(3, 5), 16);
    var bb = parseInt(b.slice(5, 7), 16);
    var rr = Math.round(ar + (br - ar) * t);
    var rg = Math.round(ag + (bg - ag) * t);
    var rb = Math.round(ab + (bb - ab) * t);
    return "#" + ((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1);
}

function setupCanvas(el) {
    var dpr = window.devicePixelRatio || 1;
    var rect = el.getBoundingClientRect();
    el.width = rect.width * dpr;
    el.height = rect.height * dpr;
    var ctx = el.getContext("2d");
    ctx.scale(dpr, dpr);
    return { ctx: ctx, w: rect.width, h: rect.height, dpr: dpr };
}

function getNS(viz) {
    var parts = viz.type ? viz.type.split(".") : [];
    return parts.length > 1 ? parts[parts.length - 1] : "";
}

function getOption(config, ns, key, fallback) {
    var full = "display.visualizations.custom." + ns + "." + key;
    if (config && config[full] !== undefined && config[full] !== null && config[full] !== "") {
        return config[full];
    }
    return fallback;
}

function parseFloat2(v, fallback) {
    var n = parseFloat(v);
    return isNaN(n) ? fallback : n;
}

function fmtNum(v, decimals) {
    if (v === null || v === undefined) return "";
    var n = parseFloat(v);
    if (isNaN(n)) return String(v);
    if (decimals !== undefined) return n.toFixed(decimals);
    if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "K";
    return Math.abs(n) < 10 ? n.toFixed(1) : Math.round(n).toString();
}

function roundRect(ctx, x, y, w, h, r) {
    if (r > h / 2) r = h / 2;
    if (r > w / 2) r = w / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

function createTooltip() {
    var tip = document.createElement("div");
    tip.style.cssText = "position:fixed;pointer-events:none;padding:6px 10px;" +
        "font:11px " + FONT_DATA + ";color:#fff;background:rgba(0,0,0,0.88);" +
        "border:1px solid rgba(255,255,255,0.12);z-index:99999;display:none;" +
        "white-space:nowrap;max-width:320px";
    document.body.appendChild(tip);
    return tip;
}

function showTooltip(tip, html, x, y) {
    tip.innerHTML = html;
    tip.style.display = "block";
    var bw = window.innerWidth;
    var bh = window.innerHeight;
    var tw = tip.offsetWidth;
    var th = tip.offsetHeight;
    var tx = x + 12;
    var ty = y - th - 8;
    if (tx + tw > bw - 8) tx = x - tw - 12;
    if (ty < 8) ty = y + 16;
    tip.style.left = tx + "px";
    tip.style.top = ty + "px";
}

function hideTooltip(tip) {
    tip.style.display = "none";
}

module.exports = {
    DARK: DARK,
    LIGHT: LIGHT,
    FONT_DATA: FONT_DATA,
    FONT_UI: FONT_UI,
    getTheme: getTheme,
    withAlpha: withAlpha,
    lerpColor: lerpColor,
    setupCanvas: setupCanvas,
    getNS: getNS,
    getOption: getOption,
    parseFloat2: parseFloat2,
    fmtNum: fmtNum,
    roundRect: roundRect,
    createTooltip: createTooltip,
    showTooltip: showTooltip,
    hideTooltip: hideTooltip
};
