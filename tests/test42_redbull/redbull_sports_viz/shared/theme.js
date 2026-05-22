/*
 * Red Bull Sports Viz — design tokens.
 * ES5 only — no const/let/arrow/template-literals.
 * Brand palette: midnight blue #0C1B3A, silver #C8C8C8, Red Bull red #DB0032, gold #F5C518
 */

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

function withAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp01(alpha) + ')';
}

function lerpColor(a, b, t) {
    t = clamp01(t);
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    var rr = Math.round(ar + (br - ar) * t);
    var gg = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return '#' + ((1 << 24) + (rr << 16) + (gg << 8) + bl).toString(16).slice(1);
}

// Visual Language — Red Bull: sharp, kinetic, aggressive
// fillTechnique: 'gradient' — used by check_design.js D01
var VISUAL_LANG = {
    fillTechnique:     'gradient',   // gradient fills throughout — brand-mandated
    backgroundType:    'photo',      // athletic brand — dynamic background
    backgroundPattern: ''            // not used when backgroundType=photo
};

var DARK = {
    name: 'dark',
    bg:          '#060E1F',          // deeper midnight — near-black with strong blue tint
    panel:       '#0C1B3A',          // Red Bull midnight blue — brand bg
    panelHi:     '#142444',          // slightly lighter panel for hover
    edge:        'rgba(200,200,200,0.12)',  // silver-tinted edge
    edgeStrong:  'rgba(200,200,200,0.25)', // stronger silver separator
    grid:        'rgba(200,200,200,0.06)', // very subtle silver gridlines
    text:        '#FFFFFF',          // pure white for maximum contrast on dark bg
    textDim:     '#C8C8C8',          // silver — brand secondary color
    textFaint:   '#8090A8',          // muted blue-silver for whisper labels
    s1:          '#DB0032',          // Red Bull red — primary series
    s2:          '#F5C518',          // gold — secondary series
    s3:          '#C8C8C8',          // silver — tertiary series
    s4:          '#1A6FBF',          // electric blue — quaternary
    s5:          '#FF5C00',          // energy orange — quinary
    series: ['#DB0032', '#F5C518', '#C8C8C8', '#1A6FBF', '#FF5C00'],
    accent:      '#F5C518',          // gold accent — hover/glow/selection (NOT for data fills)
    success:     '#00C851',          // green — performance achieved
    warn:        '#FF8800',          // orange — approaching limit
    danger:      '#DB0032',          // Red Bull red as danger (thematic)
    invert:      '#060E1F'           // inverted (dark text on light surface)
};

// Light theme — NOT an inversion of dark. Independent design.
var LIGHT = {
    name: 'light',
    bg:          '#F0F2F5',          // cool grey — never pure white (glare)
    panel:       '#FFFFFF',          // pure white panels
    panelHi:     '#F7F8FA',          // hover/selected state
    edge:        'rgba(0,0,0,0.10)', // subtle 10% black separator
    edgeStrong:  'rgba(0,0,0,0.20)', // stronger separator
    grid:        'rgba(0,0,0,0.06)', // very subtle gridlines
    text:        '#0B0E1A',          // near-black — D-08: ALWAYS use for hero text
    textDim:     '#3D4050',          // secondary text — readable on white
    textFaint:   '#6B7080',          // whisper labels — WCAG AA 3:1 on #F0F2F5 bg
    s1:          '#B00028',          // darker red for light bg readability
    s2:          '#C8A000',          // darker gold for light bg readability
    s3:          '#5A6070',          // mid-grey series
    s4:          '#1055A0',          // darker blue for light bg
    s5:          '#CC4400',          // darker orange for light bg
    series: ['#B00028', '#C8A000', '#5A6070', '#1055A0', '#CC4400'],
    accent:      '#C8A000',          // gold accent on light (slightly dimmed)
    success:     '#00875A',          // WCAG AA on white
    warn:        '#A66200',          // WCAG AA on white
    danger:      '#C7001E',          // WCAG AA on white
    invert:      '#FFFFFF'           // inverted text on dark surfaces
};

// D-08 STRUCTURAL RULE: hero text ALWAYS uses t.text on light theme.
// NEVER use t.textDim or t.textFaint for hero/primary values on light bg.

function getTheme(name) {
    return (name === 'light') ? LIGHT : DARK;
}

var FONTS = {
    data: 'Impact, "Arial Narrow", "Arial Black", sans-serif',
    ui:   '"Arial Narrow", Arial, "Helvetica Neue", sans-serif'
};

function severityColor(t, sev) {
    if (sev === 'critical' || sev === 'crit' || sev === 'error') return t.danger;
    if (sev === 'warning' || sev === 'warn') return t.warn;
    if (sev === 'ok' || sev === 'good' || sev === 'success') return t.success;
    return t.textDim;
}

function fmtNum(v, opts) {
    if (v == null || isNaN(v)) return '—';
    var abs = Math.abs(v);
    var sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + 'K';
    if (abs < 1 && abs > 0) return sign + abs.toFixed(2);
    return sign + Math.round(abs).toString();
}

function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    if (r < 0) r = 0;
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

function drawPanel(ctx, t, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 2);  // sharp corners — Red Bull is sharp/kinetic
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.strokeStyle = t.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawHGrid(ctx, t, x, y, w, h, divisions) {
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 0.5;
    for (var i = 1; i < divisions; i++) {
        var gy = y + (h / divisions) * i;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
    }
}

function parseColors(raw, fallback) {
    if (!raw || typeof raw !== 'string') return fallback;
    return raw.split(',').map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
}

function parseInts(raw) {
    if (!raw || typeof raw !== 'string') return [];
    return raw.split(',').map(function(s) { return parseInt(s.trim(), 10); }).filter(function(n) { return !isNaN(n); });
}

function safeStr(v) {
    if (v === null || v === undefined) return '';
    return String(v);
}

function safeNum(v, fallback) {
    if (v === null || v === undefined || v === '') return fallback;
    var n = parseFloat(v);
    return isNaN(n) ? fallback : n;
}

// CON-01: responsive spacing base unit
function getSpacing(w) {
    return Math.max(4, Math.round(w * 0.025));
}

// CON-02: consistent hover highlight alpha
function getHoverAlpha() {
    return 0.12;
}

// CON-03: returns {hero, body, whisper} font sizes in px
function getTypoScale(w, h) {
    var dim = Math.min(w, h);
    return {
        hero:    Math.max(36, Math.min(72, dim * 0.35)),
        body:    Math.max(14, Math.min(24, dim * 0.14)),
        whisper: Math.max(8,  Math.min(11, dim * 0.07))
    };
}

// ACC-01: Data fills use series colors, not accent.
function getSeriesColor(i, t) {
    var s = t.series || [t.s1, t.s2, t.s3, t.s4, t.s5];
    var base = s[i % s.length];
    var pass = Math.floor(i / s.length);
    if (pass === 0) return base;
    var alpha = Math.max(0.3, 1.0 - pass * 0.4);
    return withAlpha(base, alpha);
}

module.exports = {
    getTheme: getTheme,
    withAlpha: withAlpha,
    lerpColor: lerpColor,
    severityColor: severityColor,
    fmtNum: fmtNum,
    roundRect: roundRect,
    drawPanel: drawPanel,
    drawHGrid: drawHGrid,
    parseColors: parseColors,
    parseInts: parseInts,
    safeStr: safeStr,
    safeNum: safeNum,
    FONTS: FONTS,
    VISUAL_LANG: VISUAL_LANG,
    getSpacing: getSpacing,
    getHoverAlpha: getHoverAlpha,
    getTypoScale: getTypoScale,
    getSeriesColor: getSeriesColor
};
