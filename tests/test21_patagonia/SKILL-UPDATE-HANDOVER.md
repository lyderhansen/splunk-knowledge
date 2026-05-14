# Skill Update Handover — splunk-viz-packs Plugin

Post-mortem from the Patagonia Outdoor Operations build (2026-05-13).
16 failures across 6 fix rounds. This document lists every skill gap
and the exact update needed to prevent recurrence.

---

## Failures by category

### Category A: Skill gaps (rules that don't exist yet)

#### A1. `new Date()` fails in sandboxed iframe
**What happened:** alert_feed timestamps all showed "Jan 1 01:33".
`new Date("2026-05-13T08:42:00")` returns Invalid Date in Splunk's
`about:srcdoc` iframe (origin: null).

**Skill to update:** `vp-ref-gotchas`
**Proposed rule:** Add as **B18**:
```
B18. new Date() MUST NOT be used for string parsing in viz code

The custom viz iframe has src="about:srcdoc" and origin null.
The Date constructor silently fails for ISO 8601 strings in this
context, returning Invalid Date or epoch 0.

Always parse timestamps with regex:
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (m) {
        var mon = MONTHS[parseInt(m[2], 10) - 1];
        return mon + ' ' + parseInt(m[3], 10) + ' ' + m[4] + ':' + m[5];
    }

For epoch values, parseFloat + new Date(n * 1000) works because
epoch is numeric, not string-parsed.
```

---

#### A2. No theme auto-detection documented
**What happened:** All 6 vizs hardcoded `themeMode = 'dark'`, ignoring
Splunk's light/dark mode setting. Users switching themes saw wrong colors.

**Skill to update:** `vp-ref-gotchas`
**Proposed rule:** Add as **B19**:
```
B19. Vizs MUST auto-detect Splunk dark/light theme

The default themeMode formatter value MUST be 'auto', NEVER 'dark'
or 'light'. When 'auto', detect from the iframe DOM:

    function detectTheme() {
        var body = document.body;
        if (body) {
            var dt = body.getAttribute('data-theme');
            if (dt === 'light' || dt === 'dark') return dt;
            if (body.classList.contains('light')) return 'light';
            if (body.classList.contains('dark')) return 'dark';
        }
        var bg = window.getComputedStyle(document.body).backgroundColor;
        var m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
            return (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 < 128
                   ? 'dark' : 'light';
        }
        return 'dark';
    }

Every viz formatter MUST offer: auto | dark | light (default: auto).
```

---

#### A3. `splunk.image` preserveAspectRatio schema undocumented
**What happened:** Dashboard JSON used `"preserveAspectRatio": "none"`
on a `splunk.image` viz. Dashboard Studio rejected it with schema error:
`must be boolean` or `must match pattern "^>.*"`.

**Skill to update:** `ds-viz-image` in splunk-dashboard-studio plugin
**Proposed addition:**
```
preserveAspectRatio accepts ONLY:
  - boolean: true | false
  - string matching ^>.* (e.g. ">xMidYMid meet")
  - NOT SVG-style strings like "none", "xMinYMin"
When omitted, the image scales to fill the panel.
```

---

#### A4. setupCanvas MUST use clientWidth, not getBoundingClientRect
**What happened:** All 6 vizs rendered content at wrong size or stuck
in corner. Two separate bugs compounded:

1. Vizs created a wrapper `<div>` and passed it to `setupCanvas()`.
   The wrapper had no computed layout yet, so `getBoundingClientRect()`
   returned collapsed dimensions.
2. Even after fixing to use `this.el`, `getBoundingClientRect()` still
   returned unreliable dimensions in some panel configurations.

**Root cause:** `getBoundingClientRect()` can return fractional,
transitional, or zero values during Splunk's layout cycle. The
`width:100%; height:100%` CSS on `this.el` can also break Splunk's
framework-managed sizing.

**Skill to update:** `vp-ref-gotchas` — replace B17 entirely
**Proposed rule:**
```
B17. setupCanvas MUST use this.el with clientWidth/clientHeight

NEVER create wrapper divs. NEVER set width/height on this.el.
NEVER use getBoundingClientRect() for canvas sizing.

    // WRONG — all of these produce wrong dimensions:
    var wrap = document.createElement('div');
    el.appendChild(wrap);
    theme.setupCanvas(wrap);              // wrapper not laid out

    el.style.width = '100%';             // breaks Splunk sizing
    el.style.height = '100%';

    var rect = el.getBoundingClientRect(); // unreliable during layout

    // CORRECT:
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    // DO NOT set width/height — Splunk manages these

The setupCanvas function MUST use this dimension chain:
    var w = container.clientWidth || container.offsetWidth
            || window.innerWidth || 300;
    var h = container.clientHeight || container.offsetHeight
            || window.innerHeight || 200;
    if (w < 10) w = window.innerWidth || 300;
    if (h < 10) h = window.innerHeight || 200;

window.innerWidth/innerHeight are the iframe viewport dimensions
— they always match the panel size in Dashboard Studio and serve
as a reliable fallback.

Canvas element style must be position:absolute;top:0;left:0; to
fill the container without affecting its measured dimensions.
```

---

#### A5. Gauge arc overflow — no constraint formula
**What happened:** Sustainability gauge used
`radius = Math.min(w * 0.42, h * 0.70)` with `cy = h * 0.62`.
At w=904, h=318: radius=223, cy=197, top of arc = 197-223 = -26px.
Arc drew above and outside the panel.

**Skill to update:** `vp-ref-gotchas` B8 scaling table
**Proposed addition to B8:**
```
Gauge / arc viz layout constraint:
    var pad    = Math.max(12, Math.min(w, h) * 0.06);
    var maxR_w = (w - pad * 2) / 2;
    var maxR_h = (h - pad) * 0.55;
    var radius = Math.min(maxR_w, maxR_h);
    var cx     = w / 2;
    var cy     = pad + radius + arcThick / 2;

The center Y MUST be positioned so that cy - radius >= pad.
Never calculate radius and cy independently — they are coupled.
```

---

#### A6. String(null) produces "null" in display values
**What happened:** KPI tiles showed "284.5Knull" and "87null". The
unit field was empty in the CSV. Splunk delivers empty CSV fields as
`null`. `String(null)` produces the literal string `"null"`, which
was appended as the unit.

**Skill to update:** `vp-ref-gotchas`
**Proposed rule:** Add as **B20**:
```
B20. Always null-guard field values before String() conversion

Splunk delivers empty CSV fields and missing SPL fields as null.
String(null) === "null" and String(undefined) === "undefined".
Both render as visible text on canvas.

    // WRONG — shows "284.5Knull" when unit is empty
    var unit = String(row[unitIdx]);

    // CORRECT — null/undefined/empty become empty string
    var raw = row[unitIdx];
    var unit = (raw != null && raw !== '') ? String(raw) : '';

Apply this pattern to EVERY field read from row data, not just
unit fields. Label, category, region, and any optional field can
be null.
```

---

#### A7. Font scaling caps prevent responsive sizing
**What happened:** KPI value font used `Math.min(36, h * 0.28)` which
capped at 36px regardless of panel size. At h=700 (large panel), the
value rendered as tiny 36px text in a huge space — not responsive.

**Skill to update:** `vp-ref-gotchas` B8
**Proposed addition to B8:**
```
Font scaling MUST use floor only, NEVER an upper cap:

    // WRONG — caps at 36px, doesn't scale to large panels
    var fontSize = Math.max(12, Math.min(36, h * 0.28));

    // CORRECT — floor prevents unreadable, no cap allows growth
    var fontSize = Math.max(14, h * 0.30);

Upper caps were added to prevent overflow in small panels, but
the correct fix is to use a smaller ratio (e.g. 0.28 instead of
0.35), not a pixel cap. Caps break responsive scaling.

Exception: if a viz has a FIXED layout with multiple text elements
that must coexist (e.g. value + label + sparkline in a KPI), use
proportional ratios that sum to < 1.0 of the available height.
```

---

#### A8. Missing preview.png for all visualizations
**What happened:** No viz has a `preview.png` file. Splunk shows a
generic placeholder icon in the viz picker (Search → Visualization
tab) instead of a branded preview thumbnail. Users can't visually
identify which viz to select.

**Skill to update:** `vp-create` and `vp-ref-gotchas`
**Proposed rule:** Add as **R8** (AppInspect/quality):
```
R8. Every viz MUST include a preview.png

Each visualization directory must contain a preview.png at
250×150px (or 500×300px @2x). This thumbnail is shown in the
Splunk viz picker when users select a visualization type in
ad-hoc search.

    appserver/static/visualizations/{viz_name}/preview.png

Generate preview.png during the build step:
  - Render the viz to a canvas with sample data
  - Export as PNG via canvas.toDataURL()
  - Or create a static screenshot/mockup

Without preview.png, users see a generic bar-chart placeholder
and cannot distinguish between custom vizs.
```

**Skill to update:** `vp-create` packaging checklist
**Proposed addition:**
```
Pre-package checklist:
  □ Every viz directory has preview.png (250×150 or 500×300)
```

---

### Category B: Build/packaging rules missing

#### B1. build_flat.js regex bug
**What happened:** Template regex `/if\s*\(typeof module[\s\S]*?$/m`
used `m` flag, making `$` match end-of-line instead of end-of-string.
Only the first line of the `if (typeof module...)` block was stripped,
leaving a stray `}` that broke every viz's IIFE.

**Skill to update:** `vp-create`
**Fix:** Remove the `m` flag from the regex:
```javascript
var themeClean = themeRaw.replace(/if\s*\(typeof module[\s\S]*$/, '');
```
Without `m`, `$` matches end-of-string, stripping the entire block.

---

#### B2. No post-build validation step
**What happened:** The broken build was packaged and installed without
any syntax check. The stray `}` would have been caught by `node --check`.

**Skill to update:** `vp-create`
**Proposed addition:**
```
After build_flat.js, ALWAYS run these checks:

1. Syntax:     node --check visualization.js
2. AMD start:  head -1 must be: define(["api/SplunkVisualizationBase"]
3. AMD end:    tail -1 must be: });
4. ES5:        grep -c 'const \|let \| => ' must be 0
5. Theme:      grep -c 'detectTheme' must be >= 1
6. Null guard: grep -c '!= null' must be >= 1

If ANY check fails, do NOT package. Fix and rebuild.
```

---

#### B3. Tarball packaging from wrong directory — recurring
**What happened:** Occurred in rounds 2, 5, and 6. `cd` during build
steps moved cwd into the app directory. Subsequent `tar` either
produced empty archives (336 bytes) or included nested tarballs.

**Skill to update:** `vp-create`
**Proposed addition:**
```
ALWAYS use absolute paths for tar packaging. ALWAYS exclude *.tar.gz
from the archive. ALWAYS verify after packaging:

    APP_DIR="/absolute/path/to/app_dir"
    PARENT_DIR="$(dirname "$APP_DIR")"
    cd "$PARENT_DIR"
    rm -f "${APP_NAME}.tar.gz"
    COPYFILE_DISABLE=1 tar czf "${APP_NAME}.tar.gz" \
        --exclude='*.tar.gz' \
        --exclude='.DS_Store' \
        --exclude='*/src/visualization_source.js' \
        --exclude='build_flat.js' \
        --exclude='*/shared' \
        "${APP_NAME}/"

    # Verify:
    tar tzf "${APP_NAME}.tar.gz" | head -1
    # Must be: ${APP_NAME}/
    tar tzf "${APP_NAME}.tar.gz" | grep '\.tar\.gz' && echo "NESTED ARCHIVE!" && exit 1
```

---

### Category C: Subagent enforcement gaps (rules exist but weren't followed)

#### C1. Formatters without section-label
**Existing rule:** B5 documents exact section-label casing.
**What happened:** 2 of 6 formatters used bare `<form>` without
`class="splunk-formatter-section"` or `section-label`. Invisible in
ad-hoc search Format panel.
**Fix:** Add to `vp-couture` subagent enforcement checklist.

#### C2. Font scaling without proper ratios
**Existing rule:** B8 has scaling table with floors.
**What happened:** KPI used `h*0.35` without considering that value +
label + sparkline must sum to < 1.0 of height. Overflowed at h=100.
**Fix:** Add to `vp-couture` subagent enforcement checklist.

#### C3. Minimal formatter controls
**Existing rule:** B16 lists mandatory formatter categories.
**What happened:** Subagents produced 2-4 controls per viz instead of
the 10-14 needed. No field name configurability.
**Fix:** Add minimum control count to `vp-couture`.

#### C4. Dead code that still throws
**What happened:** alert_feed had `sColor.replace('#', 'rgba(')` on
line 361 that created an invalid CSS color. The gradient was then
overwritten on line 365, but line 361 already threw
`Failed to execute 'addColorStop'`.
**Fix:** Add to `vp-ref-gotchas` as a cosmetic rule.

#### C5. Wrapper div anti-pattern propagated to all vizs
**Existing rule:** B17 says pass container, not canvas to setupCanvas.
**What happened:** All 6 subagents created wrapper `<div>` elements
and passed them to setupCanvas instead of using `this.el` directly.
The rule existed but said "pass container element" which was ambiguous —
subagents interpreted "container" as "a container I create" instead
of `this.el`.
**Fix:** Strengthen B17 wording (see A4 above). Add to subagent checklist.

---

### Category D: Dashboard JSON gaps

#### D1. Markdown heading overflow
**What happened:** Banner used `# PATAGONIA` (H1) in a 72px strip.
H1 renders at ~32px with line-height, plus H3 below = ~60px total.
Overflowed the strip height.
**Fix:** Add to `ds-create` rules: markdown in absolute-positioned
panels must use `fontSize` option, not heading markup.

---

## Subagent checklist — proposed addition to vp-couture

Add this block at the TOP of every vp-viz subagent prompt:

```
BEFORE WRITING ANY CODE, VERIFY EVERY ITEM:
□ setupCanvas(this.el), NOT setupCanvas(wrapper_div) — B17
□ Do NOT set width/height on this.el — Splunk manages sizing — B17
□ Do NOT use getBoundingClientRect — use clientWidth/clientHeight — B17
□ Every <form> has class="splunk-formatter-section" section-label="..." — B5
□ Font sizes: Math.max(floor, h * ratio) — floor only, NO upper cap — B8
□ Every getOption() has a matching formatter control — B16
□ Minimum 10 formatter controls per viz (fields + display + colors)
□ themeMode default is 'auto', detectTheme() called when auto — B19
□ No new Date(string) — use regex for ISO parsing — B18
□ Every row[idx] null-guarded before String() conversion — B20
□ Arc/gauge: cy - radius >= padding (coupled constraint) — B8
□ Shadow state reset after every glow draw — B6
□ No dead code paths that execute before being overwritten
□ All field names from config, never hardcoded in formatData — B4/B16
□ preview.png exists in each viz directory (250×150 or 500×300) — R8
```

---

## Priority order for skill updates

| # | Skill | Update | Impact |
|---|---|---|---|
| 1 | `vp-ref-gotchas` | Rewrite B17 (clientWidth, no wrapper, no el sizing) | FATAL — all vizs break |
| 2 | `vp-ref-gotchas` | Add B18 (Date in iframe) | BROKEN — timestamps wrong |
| 3 | `vp-ref-gotchas` | Add B19 (theme auto-detect) | BROKEN — wrong theme |
| 4 | `vp-ref-gotchas` | Add B20 (null-guard String conversion) | BROKEN — "null" in text |
| 5 | `vp-create` | Fix build_flat.js regex (remove m flag) | FATAL — all vizs break |
| 6 | `vp-create` | Add post-build validation checklist | Process — catches 1-5 |
| 7 | `vp-create` | Fix tarball packaging (absolute paths, verify) | Process — recurring |
| 8 | `vp-couture` | Add subagent checklist at TOP of prompt | Quality — prevents C1-C5 |
| 9 | `vp-ref-gotchas` | Add gauge constraint formula to B8 | BROKEN — arc overflow |
| 10 | `vp-ref-gotchas` | Add font scaling guidance to B8 (no upper caps) | BROKEN — no scaling |
| 11 | `vp-viz` | Require field configurability + min 10 controls | Quality |
| 12 | `vp-create` | Add R8: preview.png required for every viz | Quality — viz picker |
| 13 | `ds-viz-image` | Document preserveAspectRatio constraints | BROKEN |
| 14 | `ds-create` | Markdown sizing in absolute panels | Cosmetic |

---

## Failure timeline

| Round | Build | Failures fixed | Root causes |
|---|---|---|---|
| 1 | build 1→2 | IIFE stray `}` broke all vizs | B1: regex `m` flag |
| 2 | build 2→3 | preserveAspectRatio, rgba color, formatter section-label | A3, C4, C1 |
| 3 | build 3→4 | Timestamps, KPI font 35px, no theme detect, minimal formatters | A1, A2, C2, C3 |
| 4 | build 4→5 | setupCanvas wrapper div, gauge overflow, el sizing override | A4, A5, A7 |
| 5 | build 5→6 | String(null) → "null" in KPI units | A6 |
| — | — | Still open: regional bar gradient could be more distinctive | Design polish |

## Patterns

1. **The wrapper div anti-pattern** (A4, C5) caused the most damage —
   affected all 6 vizs across 2 rounds of fixes. This is the #1 rule
   to add.

2. **Null handling** (A6, B20) is a category of bugs that will recur.
   Any field from Splunk data can be null. The skill should mandate
   null guards on ALL row reads, not just unit fields.

3. **Subagent prompt structure matters more than content volume.**
   The gotchas document has 400+ lines of rules. Subagents received
   100-line prompts. They followed the design spec faithfully but
   skimmed technical rules. A 14-item checklist at the TOP of the
   prompt would have caught 80% of issues.

4. **Packaging is fragile.** 3 of 6 rounds had tar issues. The skill
   needs a copy-pasteable packaging script, not prose instructions.
