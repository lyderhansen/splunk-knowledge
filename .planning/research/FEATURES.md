# Feature Landscape: v5.2.0 Smart Vizs & Domain Identity

**Domain:** Splunk custom visualization generation — auto-field discovery, domain-specific viz ideation, accent/series color separation
**Researched:** 2026-05-18
**Milestone context:** Tests 30-32 (Cloudflare SOC, Tesla Energy, Avinor Airport) all produced the same 5-6 viz type inventory with different colors. The viz TYPE is what makes a pack feel branded, not the colors.

---

## Table Stakes

Features users expect. Missing = pack feels like a color-swapped template, not a brand artifact.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Dynamic field reading | Hardcoded `colIdx['location']` breaks on any real dataset; users expect vizs to work with their actual SPL output | Med | `data.fields` array already populated in `formatData()`; colIdx map already built — just not used dynamically |
| Domain-first viz ideation gate | Three consecutive packs (Cloudflare/Tesla/Avinor) shipped identical inventories — current vp-design workflow does not enforce a domain-lookup step before choosing viz types | Low | Checklist item + hard requirement in vp-design workflow, not a code change |
| Accent color restricted to highlights only | Accent color bleeds into data series fills in current generated code — violates 60/30/10 rule stated in vp-design SKILL.md but not enforced in vp-viz | Low | Instruction change + formatter default separation |
| Domain-specific viz names | "threat_gauge" vs "ring_gauge" communicates intent; named types prevent fallback to the generic blueprint list | Low | Naming convention in domain-templates.md, no code change |
| Dashboard that includes every viz | vp-create already references a dashboard step but it is not mandatory; packs ship without a dashboard that exercises all vizs | Med | Step enforcement in vp-create workflow |

## Differentiators

Features that set this milestone apart from v5.1.0. Not expected, but make the pack feel alive.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto numeric column detection | Viz reads ALL numeric columns and plots them as series — no formatter wiring required for common multi-series vizs | Med | Loop `data.fields`, detect numeric via `!isNaN(safeNum(row[i], NaN))`, store detected series list in `formatData()` result |
| Domain viz expansion: SOC/Security | kill-chain stage flow, threat-volume-by-tactic heatmap, dwell-time distribution, MITRE coverage matrix — none appear in current domain-templates.md | Med | New entries in domain-templates.md, new blueprint stubs in viz-blueprints.md |
| Domain viz expansion: Energy/Utilities | generation-mix Sankey, grid-frequency deviation band chart, state-of-charge thermometer, energy-flow directional arrow chart | Med | Same as above |
| Domain viz expansion: Aviation/Transport | gate-status matrix (departure boards), on-time performance radial burst, delay-cascade waterfall, runway throughput timeline | Med | Same as above |
| Domain viz expansion: Healthcare/Clinical | bed-occupancy fill bars per ward, patient-flow Sankey (ED to ward to discharge), triage-queue horizon chart, vital-signs sparkline matrix | Med | Same as above |
| Domain viz expansion: Fintech/Trading | P&L waterfall, candlestick with volume profile, order-book depth chart (bid/ask stacked bar), drawdown area | High | Candlestick requires OHLC data contract — complex but score-5 novelty |
| Accent vs series color separation in theme.js | theme.js already exposes `accent` but no `series[]` array; current generated vizs reuse accent for data fills — correct separation requires a series palette in the design brief and theme | Low-Med | Add `series` array to theme.js template; update vp-design brief format to require series colors distinct from accent |
| Series auto-palette generation | When designer only provides one accent, auto-derive 4-6 series colors using HSL rotation (shift hue 60deg per step, reduce saturation 15% per step) | Med | Pure JS utility function in theme.js; no external dep required |
| "Domain lock" checklist in vp-design | Before finalizing viz inventory, force a domain lookup: (1) check domain-templates.md, (2) check viz-novelty-scores.md, (3) assert at least one domain-unique type is present | Low | Instruction + checklist change only |

## Anti-Features

Features to explicitly NOT build for v5.2.0.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Generic field-name auto-detection wizard (UI prompt asking user to map fields) | Adds friction at install time; users expect the viz to just work with standard SPL output | Use configurable formatter defaults that match domain conventions (e.g., `host`, `count`, `severity` for SOC); auto-detect by position as fallback |
| Per-domain SKILL.md files | Would fragment the skill system and blow the 500-line budget; domain knowledge belongs in reference files loaded on demand | Extend domain-templates.md and viz-blueprints.md with domain-specific sections |
| Webpack or npm for auto-palette generation | Zero user deps constraint; adds install friction | Implement HSL rotation as ES5 utility in shared theme.js — pure math, no library needed |
| Forcing every pack to use domain-unique-only vizs | Some universal viz types (KPI tile, data table) are domain-agnostic and still needed | Require minimum 2 domain-specific types out of 5-8 total; universal types allowed as supporting vizs |
| Removing formatter field-name inputs | Field discovery reduces required wiring but should not eliminate configurability | Keep formatter inputs as overrides; auto-detect by position/name as defaults when formatter input is blank |

---

## Feature Deep-Dives

### 1. Auto-Field Discovery

**Problem:** Current `formatData()` builds `colIdx` from `data.fields`, but `updateView()` hardcodes lookups: `var host = safeStr(row[colIdx['host']])`. When the user's SPL output has a column named `src_host` or `device`, the viz shows nothing.

**Solution architecture — three resolver tiers:**

Tier 1 (formatter override): check formatter config first (`opt('hostField', '')`) — if set, use it explicitly.

Tier 2 (domain convention scan): if blank, scan `data.fields` for name match against a domain-convention list. For SOC: try `['host', 'src', 'device', 'src_host']` in order. For energy: try `['asset', 'device_id', 'meter_id']`. This list lives in the domain-templates.md entry for each viz type.

Tier 3 (position fallback): if still no match, use field by position — first string column as label field, first numeric column as value field.

**Multi-series auto-detection (for line, bar, sparkline vizs):**

In `formatData()`, after building `colIdx`, detect ALL numeric columns not already reserved as label/x fields:

```javascript
var numericCols = [];
for (var i = 0; i < fields.length; i++) {
    if (fields[i].name === '_time' || fields[i].name === '_raw') continue;
    var testVal = rows[0] ? rows[0][i] : null;
    if (!isNaN(safeNum(testVal, NaN))) {
        numericCols.push({ name: fields[i].name, idx: i });
    }
}
result.numericCols = numericCols;
```

The viz then iterates `numericCols` to render each as a series with `theme.series[i % seriesLen]` coloring.

**This is table-stakes.** Every multi-series viz blueprint must include this pattern. Single-value vizs (KPI, gauge) only need the Tier 1 + Tier 2 resolver.

**Complexity assessment:** Medium. The pattern is straightforward but must be added to every affected viz blueprint's Technical rules section and to the vp-viz template's `formatData()` block so Claude applies it consistently. The primary risk is that Claude forgets to apply it to newly written vizs — the vp-viz pre-code checklist needs a checkbox.

### 2. Domain-Specific Viz Ideation

**Root cause of tests 30-32 failure:** The current vp-design workflow calls domain-templates.md but that file's five domain sections (F1, SOC, Retail, Healthcare, NOC) only list viz names that all map to existing blueprints in viz-blueprints.md. Claude reads "threat_gauge" as Ring Gauge, "alert_ticker" as Live Ticker — they are just rebranded generics. The domain-templates entries need to include 2-3 types per domain that have no generic blueprint equivalent.

**What makes a viz domain-specific (not just domain-named):**

1. Shape metaphor matches the domain's mental model. A departure board is a fixed-column grid with runway-style horizontal bands — not a repurposed status matrix. A SOC analyst looking at a MITRE tactic matrix should recognize it as an ATT&CK heatmap without reading the label.

2. Data contract reflects domain data structures. A kill-chain stage flow expects `mitre_tactic + count` with stages in a fixed canonical order (Recon → Weaponize → Deliver → Exploit → Install → C2 → Act). A generic process flow has no fixed stage ordering.

3. At least one viz in the pack has no generic equivalent — something that could only exist in this domain.

**Rule to add to vp-design:** The domain lock assertion. Before finalizing the inventory, the agent must assert: "Could this inventory come from a different domain with different colors?" If yes, require at least one viz replacement that is domain-locked.

**New domain viz types needed in domain-templates.md:**

SOC/Security:
- `kill_chain_stage_flow` — horizontal stage band chart with fixed stage ordering (Recon through Act), band width encodes alert volume. Data: `stage + count`. Distinct from process flow: stages are fixed MITRE categories, not user-defined pipeline steps.
- `threat_tactic_heatmap` — MITRE ATT&CK tactic (x) by severity (y) cell grid. Data: `tactic + severity + count`. Distinct from generic heatmap: tactic column ordering is fixed to ATT&CK spec, not alphabetical.
- `dwell_time_histogram` — detection gap distribution in days (log-scale x-axis). Data: `dwell_days + count`. Domain concept with no generic equivalent: "dwell time" is a specific SOC measurement.
- `attack_velocity_sparklines` — per-tactic attack rate over time, one sparkline row per tactic. Data: `_time + tactic + count`. Multi-series sparkline matrix with fixed row labels from ATT&CK taxonomy.

Energy/Utilities:
- `generation_mix_sankey` — directional flow from source (solar/wind/gas/nuclear) to load type. Data: `source + destination + mwh`. Domain-unique visual: energy flows require directional arrows; bars cannot encode directionality.
- `grid_frequency_band` — frequency deviation chart with colored tolerance bands as horizontal gradient fills. Data: `_time + freq_hz`. Domain-unique: the ±0.2Hz amber and ±0.5Hz red bands ARE the story; a generic line chart with threshold lines misses the band-fill encoding.
- `soc_thermometer` — vertical fill bar styled as a battery (top cap, segmented fill, bottom base). Data: `soc_pct`. Distinct from ring gauge: battery shape is domain-specific visual language for state of charge.
- `asset_health_floor_plan` — spatial grid with assets in fixed positions, color-coded by health status. Data: `asset_id + status + position`. Distinct from status matrix: positions are not alphabetical, they mirror physical plant/substation layout.

Aviation/Transport:
- `departure_board` — monospace fixed-column display: Flight | Destination | Scheduled | Actual | Status. Data: `flight + dest + sched_time + status`. Distinct from data table: fixed-width columns, high-contrast, status encoding matches real airport display conventions.
- `on_time_radial_burst` — polar bar chart, each spoke = a route, spoke length = on-time %, color = terminal or carrier. Data: `route + pct_on_time`. Domain-unique: circular because routes have no natural linear ranking; ATC engineers think in terms of route coverage not ranked lists.
- `delay_cascade_waterfall` — additive waterfall showing how a mechanical delay becomes a gate delay becomes a turnaround delay. Data: `delay_type + minutes`. The data contract and label conventions are aviation-specific.
- `runway_throughput_timeline` — horizontal lane chart: each lane = a runway, each time slot = a movement (arrival/departure). Data: `_time + runway + movement_type`. Domain-unique: lane metaphor mirrors physical runway layout.

Healthcare/Clinical:
- `ward_occupancy_bars` — one bar per ward, fill = occupancy %, reference line = target capacity, zone colors = safe/amber/critical. Data: `ward + occupied + capacity`. Distinct from horizontal bar list: reference lines and zone colors are clinical-requirement driven, not optional decoration.
- `patient_flow_sankey` — patient movement: ED to observation to ward to ICU to discharge/transfer. Data: `from_location + to_location + patient_count`. Domain-unique: flow encoding with band width = patient volume mirrors how clinical operators think about throughput.
- `triage_horizon_chart` — horizon chart of wait time by triage category over the day. Data: `hour + triage_cat + avg_wait_min`. Horizon chart is a distinct chart type (stacked area chart folded at a horizon baseline) not in the current blueprint catalog; domain match is strong.
- `vital_sparkline_matrix` — grid of patient rows x vital columns (HR, SpO2, BP, Temp), each cell a tiny sparkline, critical cells pulsing. Data: `patient_id + hr + spo2 + bp + temp + _time`. Domain-unique: the grid shape mirrors ICU whiteboard; no generic blueprint produces this layout.

Fintech/Trading:
- `pnl_waterfall` — positive (green) and negative (red) bars from period-start to period-end with running total. Data: `category + value`. Standard waterfall but with strict domain conventions: green = gain, red = loss, total bar always last.
- `candlestick_volume` — OHLC bars with volume histogram below. Data: `_time + open + high + low + close + volume`. Score-5 novelty; data contract requires all five fields; signals domain expertise immediately.
- `drawdown_area` — area chart with the "underwater" region (below peak) filled in a loss-red gradient. Data: `_time + value`. Domain-unique rendering: the underwater shading IS the visual language of drawdown; a generic area chart does not have this.
- `order_book_depth` — bid/ask stacked horizontal bars from mid-price outward. Data: `price + bid_qty + ask_qty`. Highly specific; no generic equivalent; immediately recognizable to any trading floor analyst.

### 3. Accent vs Series Color Separation

**Current state:** vp-design produces a design brief with `accent={hex}`. vp-viz reads `opt('accentColor', ...)` and uses this color for bar fills, arc fills, sparkline lines, gauge fills — essentially all data rendering. Accent intensity (`gi`) controls how vivid everything appears.

**The problem:** Accent color is semantically a highlight / call-to-action color. In all major production design systems (Atlassian 94-token data viz system, AWS Cloudscape, USWDS 60/30/10 model) accent color is reserved for interactive affordances, critical thresholds, and focus indicators — NOT data series fills. Data series need a separate multi-step categorical palette.

**Correct token model:**
- `accent` — one color, high saturation, reserved for: threshold breach highlights, focus rings, interactive hover states, critical alert flashes (`flashCritical`), call-to-action markers. 10% of visual weight.
- `series[]` — 4-6 colors, moderate saturation, ordered for visual distinctness at adjacent positions. Used for: bar fills, arc segments, line colors, legend swatches. Derive from brand primary hue using HSL rotation.
- `neutral` — used to de-emphasize non-highlighted data when one series needs to stand out (Atlassian pattern: set non-highlighted series to `color.chart.neutral`).

**60/30/10 rule application (already stated in vp-design SKILL.md but not enforced in vp-viz):**
- 60% = background/panel neutrals (t.bg, t.panel)
- 30% = brand primary fills (series[0] and series[1], derived from brand primary hue)
- 10% = accent highlights only (threshold lines, hover focus, critical states)

**Changes needed:**

theme.js template additions in getTheme() return object:
```javascript
series: [
    '#BRAND_PRIMARY',         // series[0] — dominant, derived from brand primary
    '#BRAND_PRIMARY_60',      // series[1] — 60% saturation variant
    '#BRAND_COMPLEMENTARY',   // series[2] — complementary hue (+180deg)
    '#BRAND_ANALOGOUS_1',     // series[3] — analogous (+60deg)
    '#BRAND_ANALOGOUS_2',     // series[4] — analogous (-60deg)
    '#NEUTRAL_HIGHLIGHT'      // series[5] — muted, for de-emphasis
]
```

vp-design brief format additions:
```
Dark palette:  bg=#0a0d14 card=#12172a text=#e8ecf5 accent=#FF6B35 series=#3A86FF,#52B788,#FFB703,#F72585,#4CC9F0
Light palette: bg=#f5f7fa card=#ffffff text=#1a1a2e accent=#FF6B35 series=#2563eb,#16a34a,#d97706,#dc2626,#7c3aed
```

vp-viz generated code pattern for data fills:
```javascript
// Data fills: use series[], NOT accent
var t = theme.getTheme(isDark ? 'dark' : 'light');
var seriesColors = t.series || [hexFromSplunk(opt('accentColor', '#3A86FF'), '#3A86FF')];
ctx.fillStyle = seriesColors[barIdx % seriesColors.length];

// Accent reserved for:
ctx.strokeStyle = accent;                        // threshold / reference line
ctx.shadowColor = accent;                        // flashCritical glow
ctx.fillStyle = theme.withAlpha(accent, 0.15);   // hover highlight tint
```

**Accent IS appropriate for:**
- `flashCritical` LED pulse fill and glow
- Threshold / reference lines on charts
- Hover highlight tint (semi-transparent fill behind hovered row)
- Focus ring on interactive elements
- Zone breach coloring (value exceeds danger threshold)
- Single-series vizs where there is only ONE data series (it is the primary visual — accent emphasis is correct)

**Accent is NOT appropriate for:**
- Multi-series fills where each series needs its own distinct color
- Default bar/arc/segment fill when no threshold context applies
- Background fills or decorative gradients (use brand-derived neutrals)

**Auto-derive series palette (when designer provides only one accent):**

Pure ES5, no library dependency, lives in shared theme.js as a build-time utility:
```javascript
function deriveSeriesPalette(baseHex, count) {
    var hsl = hexToHSL(baseHex);
    var colors = [];
    for (var i = 0; i < count; i++) {
        var h = (hsl.h + i * 60) % 360;
        var s = Math.max(30, hsl.s - i * 10);
        colors.push(hslToHex(h, s, hsl.l));
    }
    return colors;
}
```

This is Medium complexity overall. The math is straightforward; the change surface is: (1) theme.js template, (2) vp-design brief format string, (3) code examples in affected viz blueprints, (4) one new checklist item in vp-viz pre-code checklist.

---

## Feature Dependencies

```
Auto-field discovery → no upstream change required (data.fields already available)
Domain viz expansion → domain-templates.md + viz-blueprints.md additions
Accent/series separation → theme.js template + vp-design brief format + vp-viz blueprint code examples
Auto-palette derivation → depends on series separation (series array must exist first)
Domain lock checklist → depends on domain viz expansion (new domain types must be in domain-templates.md)
Mandatory dashboard step → independent; vp-create workflow only
```

---

## MVP Recommendation for v5.2.0

**Phase ordering rationale:** Fix the color model first (accent separation) because it is the root cause of the "generic look despite different colors" problem — a pack can have domain-specific viz types but still feel wrong if data fills use an intense accent color instead of a harmonious series palette. Then expand domain viz types for the two documented failing domains. Field discovery is orthogonal but should land in the same milestone since hardcoded field names prevent real-world deployment.

1. **Accent vs series color separation** — highest impact per effort. Changes: theme.js template, design brief format, viz blueprint code examples, pre-code checklist. Low-Med complexity.

2. **Domain viz expansion: SOC + Energy** — two documented failing test domains. Add 3-4 domain-unique viz types per domain to domain-templates.md and brief stubs to viz-blueprints.md. Med complexity.

3. **Auto-field discovery (Tier 1 formatter + Tier 3 position fallback)** — adds two-step resolver to all viz blueprints and the vp-viz template. Full multi-series auto-detection can follow as Phase 2. Med complexity.

4. **Domain lock checklist in vp-design** — one assertion: "Does at least one viz in this inventory have no generic equivalent?" Low complexity, prevents regression.

**Defer to later milestone:**
- Aviation domain expansion (Avinor = test32) — lower-frequency domain; add after SOC/Energy patterns validated
- Fintech candlestick — OHLC data contract is high complexity; low user frequency
- Auto-palette derivation — convenient but series colors can be manually specified in brief; correctness fix first
- Mandatory dashboard step — independent of domain identity goal; own phase

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Auto-field discovery pattern | HIGH | Splunk custom viz API confirmed; `data.fields` in ROW_MAJOR_OUTPUT_MODE is documented; pattern is straightforward |
| Domain-specific viz inventory: SOC | HIGH | MITRE ATT&CK stage flow and tactic heatmap confirmed by multiple authoritative sources (Exabeam, MITRE, SOC design literature) |
| Domain-specific viz inventory: Energy | MEDIUM | Generation-mix Sankey and grid frequency band confirmed; battery SOC thermometer is inferred from domain conventions, not from a specific authoritative source |
| Domain-specific viz inventory: Aviation | MEDIUM | Departure board and radial burst confirmed; runway timeline is inferred from domain knowledge and one aviation KPI article |
| Domain-specific viz inventory: Healthcare | HIGH | Patient-flow Sankey, ward occupancy bars, vital sparkline matrix confirmed in ICU dashboard literature (including peer-reviewed PMC study) |
| Domain-specific viz inventory: Fintech | HIGH | Candlestick, order book depth, P&L waterfall, drawdown area are industry-standard types confirmed by trading platform research |
| Accent vs series color separation | HIGH | Atlassian, Cloudscape, USWDS all implement this separation explicitly; 60/30/10 rule already stated in vp-design SKILL.md |
| Auto-palette HSL rotation algorithm | MEDIUM | HSL rotation is a standard technique; specific step parameters (60deg hue, 10% sat reduction) are reasonable defaults but need visual validation against test packs |

---

## Sources

- [Splunk Custom Visualization API Reference](https://help.splunk.com/en/splunk-cloud-platform/developing-views-and-apps-for-splunk-web/10.0.2503/custom-visualizations/custom-visualization-api-reference) — ROW_MAJOR_OUTPUT_MODE data structure confirmation
- [Atlassian Data Visualization Color Overview](https://atlassian.design/foundations/color-new/data-visualization-color) — 94-token system, categorical vs accent token separation
- [Cloudscape Design System Data Visualization Colors](https://cloudscape.design/foundation/visual-foundation/data-vis-colors/) — series vs accent vs neutral token roles
- [Designing the Perfect SOC Security Dashboard — Medium](https://medium.com/@adarshpandey180/designing-the-perfect-soc-security-dashboard-a8deea653eb0) — SOC viz type requirements
- [SOC Overview Dashboard — Exabeam](https://docs.exabeam.com/en/dashboard/all/dashboard-guide/pre-built-dashboards/security-operations-center-management-dashboards/soc-overview.html) — canonical SOC dashboard structure
- [MITRE ATT&CK Framework](https://attack.mitre.org/) — tactic/technique ordering for kill-chain and matrix vizs
- [Air Traffic Data Visualization — LightningChart](https://lightningchart.com/blog/python/air-traffic-data-visualization/) — aviation-specific chart patterns
- [23 Visuals to Boost Your Airline KPI Dashboard](https://www.informationdesign.io/2020/03/10/23-visuals-to-boost-your-airline-kpi-dashboard/) — departure board and route radial patterns
- [Healthcare Data Visualization — CleanChart 2026](https://www.cleanchart.app/blog/healthcare-data-visualization) — patient flow Sankey, ward occupancy, vital sparkline matrix
- [ICU Dashboard Design — PMC/NCBI](https://pmc.ncbi.nlm.nih.gov/articles/PMC10565627/) — peer-reviewed ICU dashboard study; sparkline matrix and ward overview confirmed
- [Order Book Heatmap — Bookmap](https://bookmap.com/blog/heatmap-in-trading-the-complete-guide-to-market-depth-visualization) — fintech-specific viz types
- [Bold BI Energy Dashboard Examples](https://www.boldbi.com/dashboard-examples/energy/) — energy domain viz inventory
- [USWDS Theme Color Tokens](https://designsystem.digital.gov/design-tokens/color/theme-tokens/) — 60/30/10 and accent role separation
