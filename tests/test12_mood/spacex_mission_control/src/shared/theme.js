// SpaceX Mission Control — shared design tokens
// Fonts: Chakra Petch (display) + JetBrains Mono (telemetry)
// Tone: Precision / Frontier / Audacious

var THEMES = {
    dark: {
        bg:       '#060910',
        panel:    '#0C1018',
        surface:  '#141A24',
        text:     '#E2E8F0',
        textDim:  'rgba(226,232,240,0.45)',
        accent:   '#0088CC',
        glow:     '#00B8D4',
        burn:     '#FF6B35',
        nominal:  '#00C853',
        danger:   '#FF1744',
        edge:     'rgba(0,136,204,0.12)',
        grid:     'rgba(226,232,240,0.04)',
        warn:     '#FFB300'
    },
    light: {
        bg:       '#F0F2F5',
        panel:    '#FFFFFF',
        surface:  '#F8F9FA',
        text:     '#0B0E1A',
        textDim:  'rgba(11,14,26,0.55)',
        accent:   '#006AA7',
        glow:     '#0097A7',
        burn:     '#E65100',
        nominal:  '#00890E',
        danger:   '#D50000',
        edge:     'rgba(0,106,167,0.12)',
        grid:     'rgba(11,14,26,0.05)',
        warn:     '#E69500'
    }
};

function getTheme(mode) {
    return THEMES[mode] || THEMES.dark;
}

function withAlpha(hex, alpha) {
    if (!hex) return 'rgba(0,0,0,' + alpha + ')';
    if (hex.indexOf('rgba') === 0) {
        var parts = hex.match(/[\d.]+/g);
        if (parts && parts.length >= 3) {
            return 'rgba(' + parts[0] + ',' + parts[1] + ',' + parts[2] + ',' + alpha + ')';
        }
    }
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function lerpColor(a, b, t) {
    var ah = a.replace('#',''), bh = b.replace('#','');
    if (ah.length === 3) ah = ah[0]+ah[0]+ah[1]+ah[1]+ah[2]+ah[2];
    if (bh.length === 3) bh = bh[0]+bh[0]+bh[1]+bh[1]+bh[2]+bh[2];
    var ar = parseInt(ah.substring(0,2),16), ag = parseInt(ah.substring(2,4),16), ab = parseInt(ah.substring(4,6),16);
    var br = parseInt(bh.substring(0,2),16), bg = parseInt(bh.substring(2,4),16), bb = parseInt(bh.substring(4,6),16);
    var r = Math.round(ar + (br - ar) * t);
    var g = Math.round(ag + (bg - ag) * t);
    var bl = Math.round(ab + (bb - ab) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

function roundRect(ctx, x, y, w, h, r) {
    if (r === undefined) r = 2;
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

// SpaceX panel chrome: sharp edges, no border, subtle top-edge glow
function drawMissionPanel(ctx, t, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 2);
    ctx.fillStyle = t.panel;
    ctx.fill();
    // top-edge instrument backlight
    ctx.save();
    roundRect(ctx, x, y, w, h, 2);
    ctx.clip();
    var topGrad = ctx.createLinearGradient(x, y, x, y + 4);
    topGrad.addColorStop(0, withAlpha(t.accent, 0.18));
    topGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = topGrad;
    ctx.fillRect(x, y, w, 4);
    ctx.restore();
}

// Glass panel for hero-overlaid elements
function drawGlassPanel(ctx, t, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 2);
    ctx.fillStyle = withAlpha(t.bg, 0.75);
    ctx.fill();
    // top highlight
    ctx.save();
    roundRect(ctx, x, y, w, h, 2);
    ctx.clip();
    var topGrad = ctx.createLinearGradient(x, y, x, y + 3);
    topGrad.addColorStop(0, 'rgba(255,255,255,0.07)');
    topGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(x, y, w, 3);
    ctx.restore();
    // subtle edge
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 2);
    ctx.strokeStyle = withAlpha(t.accent, 0.10);
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawTextGlow(ctx, text, x, y, font, color, glowRadius) {
    ctx.save();
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = glowRadius || 12;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.fillText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawAmbientLight(ctx, w, h, color, intensity) {
    var grad = ctx.createRadialGradient(w * 0.15, h * 0.1, 0, w * 0.15, h * 0.1, w * 0.9);
    grad.addColorStop(0, withAlpha(color, intensity || 0.06));
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}

function drawVignette(ctx, w, h, strength) {
    var cx = w / 2, cy = h / 2;
    var r = Math.max(w, h) * 0.7;
    var grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, withAlpha('#000000', strength || 0.3));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
}

function drawAccentLines(ctx, w, h, color, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity || 0.06;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    var cx = w / 2, cy = h / 2;
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    var br = 16;
    ctx.beginPath();
    ctx.moveTo(0, br); ctx.lineTo(0, 0); ctx.lineTo(br, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w, h - br); ctx.lineTo(w, h); ctx.lineTo(w - br, h);
    ctx.stroke();
    ctx.restore();
}

function drawSpacedText(ctx, text, x, y, spacing) {
    var chars = text.split('');
    var totalW = 0;
    var widths = [];
    for (var i = 0; i < chars.length; i++) {
        var cw = ctx.measureText(chars[i]).width;
        widths.push(cw);
        totalW += cw + (i < chars.length - 1 ? spacing : 0);
    }
    var startX = x - totalW / 2;
    for (var j = 0; j < chars.length; j++) {
        ctx.fillText(chars[j], startX + widths[j] / 2, y);
        startX += widths[j] + spacing;
    }
}

function fitText(ctx, text, maxWidth, startSize, minSize, fontFamily) {
    var size = startSize;
    var min = minSize || 8;
    var family = fontFamily || 'sans-serif';
    ctx.font = 'bold ' + size + 'px ' + family;
    while (ctx.measureText(text).width > maxWidth && size > min) {
        size -= 1;
        ctx.font = 'bold ' + size + 'px ' + family;
    }
    return size;
}

function fmtNum(v, opts) {
    opts = opts || {};
    if (v === null || v === undefined || isNaN(v)) return '—';
    var abs = Math.abs(v);
    if (opts.compact && abs >= 1000) {
        if (abs >= 1e9) return (v / 1e9).toFixed(1) + 'B';
        if (abs >= 1e6) return (v / 1e6).toFixed(1) + 'M';
        if (abs >= 1e3) return (v / 1e3).toFixed(1) + 'k';
    }
    if (opts.fixed !== undefined) return v.toFixed(opts.fixed);
    return Math.round(v).toLocaleString('en-US');
}

function formatValue(raw, decimals, compact) {
    if (raw === null || raw === undefined || isNaN(raw)) return '—';
    if (decimals >= 0) return raw.toFixed(decimals);
    if (compact) return fmtNum(raw, { compact: true });
    return String(raw);
}

function getOption(config, ns, key, defaultValue) {
    var v = config[ns + key];
    if (v !== undefined && v !== null) return v;
    v = config[key];
    if (v !== undefined && v !== null) return v;
    return defaultValue;
}

function getNS(viz) {
    try {
        var info = viz.getPropertyNamespaceInfo();
        if (info && info.propertyNamespace) return info.propertyNamespace;
    } catch (e) {}
    return '';
}

function parseBool(val, fallback) {
    if (val === undefined || val === null) return fallback;
    return val === 'true' || val === true || val === '1';
}

function parseNum(val, fallback) {
    if (val === undefined || val === null) return fallback;
    var n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}

// Font families (must match visualization.css @font-face)
var DISPLAY_FONT = '"Chakra Petch", sans-serif';
var MONO_FONT = '"JetBrains Mono", monospace';

// Font readiness
var _fontReady = false;
var _fontPending = false;

function loadFonts(onReady) {
    if (_fontReady) { onReady(); return; }
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) {
        setTimeout(onReady, 200);
        return;
    }
    if (!_fontPending) {
        _fontPending = true;
        document.fonts.load('400 48px "Chakra Petch"');
        document.fonts.load('600 48px "Chakra Petch"');
        document.fonts.load('400 48px "JetBrains Mono"');
    }
    var attempts = 0;
    var poll = function() {
        attempts++;
        if (_fontReady || attempts > 30) {
            _fontReady = true;
            onReady();
            return;
        }
        setTimeout(poll, 100);
    };
    poll();
}

module.exports = {
    getTheme: getTheme,
    withAlpha: withAlpha,
    lerpColor: lerpColor,
    roundRect: roundRect,
    drawMissionPanel: drawMissionPanel,
    drawGlassPanel: drawGlassPanel,
    drawTextGlow: drawTextGlow,
    drawAmbientLight: drawAmbientLight,
    drawVignette: drawVignette,
    drawAccentLines: drawAccentLines,
    drawSpacedText: drawSpacedText,
    fitText: fitText,
    fmtNum: fmtNum,
    formatValue: formatValue,
    getOption: getOption,
    getNS: getNS,
    parseBool: parseBool,
    parseNum: parseNum,
    DISPLAY_FONT: DISPLAY_FONT,
    MONO_FONT: MONO_FONT,
    loadFonts: loadFonts
};
