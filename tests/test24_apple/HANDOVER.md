# Apple Retail Analytics — Test24 Handover

## What was built

A complete Splunk app (`apple_retail_viz`) with:
- **5 custom Canvas 2D visualizations** (kpi_tile, revenue_bars, satisfaction_gauge, product_mix, alert_feed)
- **Dashboard Studio v2 dashboard** with absolute layout (1920x1200, light theme)
- **6 CSV lookup files** for demo data (no real Splunk indexes needed)
- **Shared theme.js** with dark/light tokens, Apple color palette, utility functions
- **Flat AMD build pipeline** (build_flat.js) — no webpack dependency
- **App shell** with nav, app.conf, default.meta, visualizations.conf

Location: `test24_apple/apple_retail_viz/`
Package: `test24_apple/apple_retail_viz.tar.gz` (21KB)

---

## What went well

1. **Revenue bars viz** — closest to Apple aesthetic. Precise spacing, ranked horizontal bars with subtle gradient fill, delta badges, hover highlight. User confirmed "kanskje apple revenue bar som ser mest lik ut som apple."

2. **Works in both contexts** — all 5 vizs render in Dashboard Studio AND ad-hoc search. Formatter settings show and apply correctly in both contexts.

3. **Design direction is right** — light #F5F5F7 canvas, white cards with rx:12, section labels that whisper, blue accent line. The overall feel is Apple-adjacent.

4. **Technical compliance** — all tier-1 gotcha checks pass: ES5, ROW_MAJOR_OUTPUT_MODE, `{{VIZ_NAMESPACE}}`, clearRect, HiDPI scaling, null guards, auto theme detection.

5. **Alert feed** — scrollable with wheel support, severity badges with colored pills. Layout and information hierarchy are good.

6. **Product mix donut** — segment gap, hover glow, legend with percentages. Composition is solid.

---

## Issues to fix (Priority order)

### P0 — Blocking / schema errors

**1. Dashboard fontFamily validation error**
- File: `default/data/ui/views/apple_retail_dashboard.xml`
- Viz: `viz_header_title`
- Problem: `fontFamily: "\"SF Pro Display\", -apple-system, ..."` fails schema validation
- Fix: Remove `fontFamily` entirely OR use `"Splunk Platform Sans"` — Dashboard Studio only allows: Splunk Platform Sans, Splunk Data Sans, Splunk Platform Mono, Arial, Helvetica, Times New Roman, Comic Sans MS
- **Key learning:** `fontFamily` is ONLY available on `splunk.markdown` — no other Dashboard Studio viz type supports it. Custom fonts are only possible inside Canvas 2D viz code (via base64 embedding or system font stacks).
- Saved as memory: `feedback_ds_fontfamily_enum.md`

### P1 — Visual bugs (text contrast, overflow)

**2. KPI tile text nearly invisible on light theme**
- File: `appserver/static/visualizations/kpi_tile/src/visualization_source.js`
- Problem: Value rendered with full `t.text` color but appears ghostly in screenshot. The issue is likely that the Canvas text is rendering at very low opacity or the font weight is too light at that size on the specific panel dimensions.
- Fix: Increase font weight from `600` to `700` for the hero value. Ensure `ctx.globalAlpha = 1` before drawing value text. Consider increasing valueFontSize ratio from `h * 0.32` to `h * 0.38` for more presence.

**3. Gauge text overlaps arc — "NET PROMOTER SCORE" too large**
- File: `appserver/static/visualizations/satisfaction_gauge/src/visualization_source.js`
- Problem: Label text below center value is sized relative to `innerR * 0.16` which is too large when the panel is tall. The letter-spaced uppercase label extends beyond the arc width.
- Fix: 
  - Reduce label font ratio from `innerR * 0.16` to `innerR * 0.11`
  - Clamp label width: measure text width and if it exceeds `radius * 1.6`, reduce font size
  - Move label Y position down: increase spacing between value and label
  - The value "72" is also too faint — same contrast issue as KPI tiles

**4. Donut center readout "$284.9M" barely visible**
- File: `appserver/static/visualizations/product_mix/src/visualization_source.js`
- Problem: Center readout uses `t.text` at full opacity but `ctx.globalAlpha` might be affected by the segment drawing above (the unhovered segments use `ctx.globalAlpha = 0.85`).
- Fix: Add `ctx.globalAlpha = 1;` explicitly before drawing the center readout text. Increase readout font weight to `700`.

**5. Alert feed severity badge text overflow**
- File: `appserver/static/visualizations/alert_feed/src/visualization_source.js`
- Problem: Badge text ("Critical", "Warning") overflows the pill shape. The `badgeW` calculation (`w * 0.06` = ~47px at 780px panel width) is too small for the text.
- Fix:
  - Measure text width FIRST, then size badge: `badgeW = ctx.measureText(sevLabel).width + badgeH + 12`
  - OR reduce font size inside badge: from `badgeH * 0.48` to `badgeH * 0.38`
  - OR abbreviate labels: "CRIT", "WARN", "INFO" with smaller font

**6. Alert feed store name too faint**
- Same light-theme contrast issue. Store names use `t.text` but appear ghostly.
- Fix: Ensure `ctx.globalAlpha = 1` before drawing store name.

### P2 — Design improvements

**7. Weekly trend uses built-in splunk.line — should be custom viz**
- The user expected ALL data panels to use custom vizs (per established feedback: "every data panel must be custom Canvas viz, built-in Splunk vizs break brand identity")
- Fix: Build a 6th custom viz `weekly_trend` that draws a Canvas line chart with:
  - Two series (revenue + target) with distinct styling
  - Target as dashed line, revenue as solid
  - Apple-blue for revenue, warm gray for target with BETTER contrast than #E5E5EA
  - Data point dots on hover
  - Y-axis labels in SF Mono
- This is a significant addition — ~200 lines of Canvas code

**8. Apple logo SVG looks rough**
- File: `appserver/static/images/apple_logo.svg`
- Problem: Hand-drawn path approximation of Apple logo has wrong proportions
- Fix: Download the official Apple logo SVG from a reputable source. Place in `appserver/static/images/`. The SVG text element "Retail Analytics" can remain but should use proper font rendering.
- Saved as memory: `feedback_download_real_logos.md`

**9. Preview PNGs are blank**
- All 5 `preview.png` files are solid #F5F5F7 rectangles — they show nothing useful in the Splunk viz picker
- Fix: Either:
  - Render each viz to a canvas with sample data programmatically and export as PNG
  - OR create static mockup screenshots at 250x150px / 500x300px
  - The build script could potentially generate these using a headless canvas (node-canvas or similar)

**10. Transparent background shouldn't be hardcoded default**
- The dashboard JSON sets `"backgroundColor": "transparent"` on every custom viz
- Problem: This is correct for the DASHBOARD context (where the card rectangle provides the background), but in AD-HOC search there's no card rectangle — transparent means the viz floats on whatever page bg exists
- Fix: 
  - Add a `backgroundColor` formatter setting to each viz (default: "transparent")
  - In viz code: if backgroundColor !== "transparent", draw `ctx.fillRect(0, 0, w, h)` with that color
  - Dashboard JSON can still set transparent, but ad-hoc users can pick a bg color

**11. More formatter settings needed**
- Users want more customization. Each viz should have at minimum:
  - `fontSize` override (auto/small/medium/large)
  - `showTooltip` toggle
  - `alignment` (left/center/right) for KPI tile
  - `sortOrder` (asc/desc/none) for revenue bars
  - `showTarget` toggle for gauges
  - `animateOnLoad` toggle
  - Consider adding `backgroundColor` setting (see #10)

---

## File manifest — what to edit for each fix

| Fix # | File(s) to edit |
|-------|----------------|
| 1 | `default/data/ui/views/apple_retail_dashboard.xml` — remove `fontFamily` from viz_header_title |
| 2 | `kpi_tile/src/visualization_source.js` — font weight, globalAlpha, size ratio |
| 3 | `satisfaction_gauge/src/visualization_source.js` — label size ratio, text clamping, value contrast |
| 4 | `product_mix/src/visualization_source.js` — globalAlpha reset before center readout |
| 5 | `alert_feed/src/visualization_source.js` — badge width from text measurement |
| 6 | `alert_feed/src/visualization_source.js` — globalAlpha before store name |
| 7 | NEW: `weekly_trend/` — entire new viz + update visualizations.conf, default.meta, dashboard XML |
| 8 | `appserver/static/images/apple_logo.svg` — replace with downloaded official logo |
| 9 | All 5 `preview.png` files — generate real previews |
| 10 | All 5 viz source + formatter files — add backgroundColor setting |
| 11 | All 5 formatter.html files — add missing controls |

After editing source files, re-run: `node build_flat.js`
Then re-package: `COPYFILE_DISABLE=1 tar czf apple_retail_viz.tar.gz --exclude='.*' --exclude='node_modules' --exclude='src' --exclude='build_flat.js' --exclude='shared' apple_retail_viz`

---

## Cross-cutting lessons (apply to ALL fixes)

### 1. All sizing must be fully dynamic
Every text element, badge, arc label, and spacing value must adapt to the container dimensions. Vizs render at many different sizes — from tiny KPI tiles (200x100) to full-width panels (900x400) to ad-hoc search (variable width). The root cause of P1 issues #3 and #5 (gauge label overflow, badge text overflow) is sizing that worked at one panel size but broke at the actual rendered size.

**Pattern for every text draw:**
1. Calculate font size from container: `Math.max(floor, dimension * ratio)`
2. Measure text width with `ctx.measureText(text).width` BEFORE drawing
3. If text exceeds available space → reduce font size or truncate with `...`
4. Never use pixel caps (`Math.min(36, ...)`) — use smaller ratios instead

**Test at 3 sizes minimum:** small (200x120), medium (450x300), large (900x500).

Saved as memory: `feedback_viz_dynamic_sizing.md`

### 2. fontFamily only exists on splunk.markdown
Dashboard Studio `fontFamily` is ONLY available on `splunk.markdown` panels — not on any other visualization type. And even on markdown, it only allows a strict enum (Splunk Platform Sans, Arial, Helvetica, etc.). Custom font strings fail schema validation. For brand typography, use Canvas 2D code in custom vizs where any font works.

Saved as memory: `feedback_ds_fontfamily_enum.md`

---

## Architecture notes for next session

- **Build pipeline**: `shared/theme.js` is inlined into each viz by `build_flat.js`. Edit the source in `src/visualization_source.js`, then run `node build_flat.js` to produce the flat AMD `visualization.js`.
- **Theme tokens**: All colors come from `shared/theme.js`. DARK and LIGHT palettes are independent (not derived).
- **No webpack**: Using flat AMD build (F11 from gotchas) — simpler, no node_modules needed.
- **Dashboard JSON**: Embedded in CDATA inside `apple_retail_dashboard.xml`. Edit the JSON directly.
- **Viz type prefix**: `apple_retail_viz.{viz_name}` in dashboard JSON.
- **Gotchas loaded**: vp-ref-gotchas rules are critical — reload in next session before editing viz code.

---

## Quality scores (pre-fix)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Visual hierarchy | 5/10 | Value text too faint — no clear hero. Needs contrast fix. |
| Whitespace quality | 7/10 | Good spacing, Apple-style padding. Card layout works. |
| Brand distinctiveness | 6/10 | Revenue bars feel Apple. Others are generic-with-blue-accent. Logo hurts. |
| Emotional resonance | 5/10 | "Professional but forgettable" — needs the contrast fix + real logo to land. |
| Technical compliance | 9/10 | Only the fontFamily schema error. Everything else validates. |

**Post-fix estimate**: With P0+P1 fixed, scores should reach 7-8 across the board. Adding the weekly_trend custom viz (P2 #7) would push brand distinctiveness to 8+.
