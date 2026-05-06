# Splunk Dashboard Studio — Design Inputs (Example: Fjellbryggeri Brewfloor Live)

> **This is a fictional example** for a Norwegian craft brewery's
> production-floor dashboard. Different vertical (manufacturing / F&B),
> persona (brewmaster), archetype (operational), and aesthetic (Nordic
> craft) from the ACME CISO example. Use it to see how the template
> stretches across very different design contexts.

---

# Section 0: Engagement Context

### 0.1 Engagement Information

| Field | Value |
|---|---|
| **Customer / org** | Fjellbryggeri Co. (fictional Norwegian craft brewery in Voss) |
| **Project / dashboard name** | Brewfloor Live |
| **Author** | Astrid Lien (head of operations) |
| **Date** | 2026-04-30 |
| **Splunk app context** | `fjellbryggeri_ops` |
| **Dashboard ID (slug)** | `brewfloor_live_v1` |

### 0.2 Build Mode

- [x] **Curated** — Build what's specified, plus the AI may suggest 1–2 panels per section it thinks are missing.

> Reasoning: Astrid has a clear panel inventory but trusts a Splunk
> design pass to surface missing-but-obvious-in-hindsight items
> (e.g. dissolved oxygen trend, CIP compliance verification).

---

# Section 1: Business Problem & Audience

### 1.1 What is this dashboard FOR?

> "Lets the brewmaster on shift decide, in real time, whether each
> active batch is tracking to its target spec — or whether to
> intervene (adjust temp, pull sample, abort). Designed to live on the
> wall above the brewfloor and on every brewer's tablet during their
> shift. Brewmaster's first scan: which tank needs me right now?"

### 1.2 Audience

- [ ] CISO Sarah
- [ ] SOC Operator Alex
- [x] **Custom** — see below
- [ ] (other personas not applicable)

> **Custom persona — "Brewmaster Ingrid"**
> - Where: 55" wall display above the brewfloor + 10" rugged tablet
>   (Samsung Active Tab) carried during shift
> - For how long: glance every 5–15 minutes during 8-hour shift
> - Decision: "which tank needs me, what intervention, when?"
> - Tolerates: dense sensor data, many simultaneous tanks
> - Does NOT tolerate: ambiguous status, decorative chrome, anything
>   that takes more than 2 seconds to read
> - Reads Norwegian + English fluently — labels are English (Splunk
>   convention) but tank IDs and step names match the Norwegian
>   batch-management software (Beerware Pro)

### 1.3 Anti-personas

> Not for the brewery owner / financials lens (no revenue, no margin).
> Not for the tasting room / front-of-house staff (they have a
> separate menu screen). Not for facility managers (HVAC and energy
> live on a separate dashboard). So: no business KPIs, no money
> metrics, no facility-level data.

### 1.4 Industry / vertical

- [x] Manufacturing / OT / industrial
- [x] **Food & Beverage** (sub-vertical: brewing / fermentation)

---

# Section 2: Archetype & Layout

### 2.1 Archetype

- [x] **Operational monitoring** — Dense KPI grid, status tiles, primary trend, alert log. Designed for active workflow.

### 2.2 Hybrid notes

> Pure operational. NO executive lens, NO analytical deep-dive.
> Multiple active tanks visible simultaneously is the central UX
> requirement — operators glance at the wall and see all 8 tanks at
> once.

### 2.3 Canvas size

- [x] **1920 × 1080** — fits 55" wall display exactly + the Samsung tablet auto-scales

> Wall is the primary viewing context; tablet inherits. NOT designed
> for projector or phone.

### 2.4 Tabs / sections

- [x] **Single pane** for v1.

> Reasoning: shift-context. Tabs require clicks. Brewmaster doesn't
> click during a busy boil. Single pane forces hierarchy discipline.
> If the dashboard outgrows 1080px, we re-evaluate tabs in v2 —
> not before.

---

# Section 3: Tone, Brand & Anti-References

### 3.1 Three tone words

| # | Word | What it implies |
|---|---|---|
| 1 | **Craft** | Hand-built feel; warm neutrals (not cold corporate gray); legible at distance |
| 2 | **Nordic** | Generous whitespace; restraint; muted palette (deep forest, warm wood-tone, copper accents); clear typography |
| 3 | **Measured** | Calm under load; no animation; no surprise; status changes are gentle (no flashing, no pulsing); the dashboard is a quiet witness |

> Translation rules consulted from `ds-ref-brand`: "craft" → no
> defaults, hand-tuned spacing; "Nordic" → muted palette inspired by
> Norwegian Folkemuseum / Fjellsmuseet wayfinding; "measured" →
> restraint > density, but NOT exec-level restraint (this is still
> operational, just tonally calm).

### 3.2 Anti-references

- [x] **AI-generic Splunk demo** — 4 same-size KPIs, default rainbow palette, no hierarchy
- [x] **Custom anti-references**:

> 1. **Old-school SCADA HMI** — gray tank schematics with red
>    blinking alarms. Functional but visually punishing.
> 2. **Brewery competitor websites** — heavy on stock photos of
>    barrels and hops. We're showing data, not selling beer.
> 3. **Generic "smart factory" dashboard from a vendor demo** —
>    too clean, too futuristic, too "concept render". Ours is
>    actually used during shift; it must feel inhabited.
> 4. **Datadog / New Relic SRE dashboards** — too many sparklines
>    side by side. We have 8 tanks, not 800 hosts.

### 3.3 Positive references

| Reference | URL or path | What you like about it |
|---|---|---|
| Norwegian railway departure boards (Vy) | (mental model) | High contrast, single accent for status changes, calm under high load |
| Garmin Forerunner activity screen | (mental model) | Dense data, clearly grouped, no decoration, instant glance read |
| Fjällräven retail wayfinding | (mental model) | Warm neutrals + occasional accent; the "Nordic operational" tone we want |
| MSC Voss alpine ski-area control room | (visited 2025-09) | Wall-format dashboard with calm color, single primary metric per zone |

### 3.4 Brand context

| Field | Value |
|---|---|
| **Brand name** | Fjellbryggeri |
| **Brand primary color** | `#3D5A3F` (dypskog — deep forest green) |
| **Brand secondary color** | `#B5651D` (kobber — copper accent, used sparingly for "needs attention") |
| **Brand neutral / background** | `#F2EDE4` (varm beige — warm beige, light theme) AND `#1F1B16` (tjærenatt — tar-night, dark theme) |
| **Brand font** | `Splunk Platform Sans` (Splunk's default — bryggeri brand uses a custom serif on packaging but it's not in the markdown enum, so platform sans is the conformant fallback) |
| **Logo file** | `assets/fjellbryggeri-logomark.svg` (mountain silhouette + "FB" monogram, monochrome, copper or forest depending on theme) |

> **Color collision warning:** brand copper `#B5651D` is in the
> amber/warning hue range. Solved by reserving copper for "neutral
> attention needed — operator decision required, not auto-fail" and
> using `#FFB627` for actual amber/warning thresholds. Forest green
> stays brand-only; status green is `#22C55E` (slightly more
> saturated, reads as "healthy" not "brand").

### 3.5 Theme

- [x] **Both** — dark for the wall display (less glare in dim brewfloor lighting), light for the tablet (used in well-lit office spaces and during cellar audits).

> AI builds dark first, then a light variant via the same JSON with
> theme-token swaps.

---

# Section 4: Data Sources & SPL

### 4.1 Data sources

| Source label | Index / lookup / savedsearch | Calculation | SPL (paste if available) |
|---|---|---|---|
| `tanks_active` | `index=brewery sourcetype=opcua_tank` | Latest tank state per tank_id (8 tanks, BL01-BL08) | `index=brewery sourcetype=opcua_tank \| stats latest(temperature_c) as temp latest(pressure_mbar) as pressure latest(plato) as gravity latest(stage) as stage latest(batch_id) as batch by tank_id` |
| `fermentation_curves` | `index=brewery sourcetype=opcua_tank` | 48-hour gravity + temp curve per active tank | `index=brewery sourcetype=opcua_tank earliest=-48h \| timechart span=15m avg(plato) as gravity avg(temperature_c) as temp by tank_id` |
| `cip_status` | `inputlookup cip_log.csv` | Last CIP cycle per tank with pass/fail | `\| inputlookup cip_log.csv \| stats latest(cycle_end) as last_clean latest(result) as cip_result by tank_id` |
| `dissolved_oxygen` | `index=brewery sourcetype=opcua_do_meter` | DO ppb at boil-out and post-fermentation sample points | `index=brewery sourcetype=opcua_do_meter \| stats latest(do_ppb) as do_ppb latest(sample_point) as point by tank_id batch_id` |
| `batch_progress` | `index=brewery sourcetype=beerware_batch` | Stage progression vs target spec for each active batch | `index=brewery sourcetype=beerware_batch status=active \| eval pct_complete=100*hours_in_stage/target_hours \| table batch_id recipe_name stage pct_complete eta_hours` |
| `quality_alerts` | `index=brewery sourcetype=quality_alert` | Last 24h quality alerts (out-of-spec, sensor faults, intervention required) | `index=brewery sourcetype=quality_alert earliest=-24h \| sort -_time \| table _time tank_id alert_type severity message acknowledged_by` |

### 4.2 Mock data acceptable?

- [x] **No — must run against real indexes**

> The OPC-UA pipeline from the brewfloor PLCs to Splunk is already
> live (built on Cisco Edge Intelligence + IFM TN2531 sensors). Use
> real data. Mock data would defeat the purpose — operators need to
> trust the dashboard.

### 4.3 Time range

| Concern | Value |
|---|---|
| **Default time range** | `-15m` for live state, `-48h` for fermentation curves, `-24h` for alerts (per-panel override) |
| **User-adjustable?** | No — operational dashboard, fixed windows per panel |
| **Per-panel overrides?** | Yes: live tanks (last 15min), curves (48h), CIP status (last cycle), DO (current batch only), batch progress (active batches), alerts (24h) |

---

# Section 5: KPIs & Panels

### 5.1 Hero KPIs (the headline numbers)

> Brewmaster's first-scan questions: "Are all 8 tanks running? Any
> alarms? Any batch off-spec? When's the next critical step?"

| # | KPI label | Source | Number format | Threshold (R/A/G) | Drilldown to |
|---|---|---|---|---|---|
| 1 | Active Tanks | `tanks_active` | `N of 8` (integer fraction) | <8 amber (planned downtime) / =8 green | search `index=brewery sourcetype=opcua_tank` |
| 2 | Open Quality Alerts | `quality_alerts` | integer | =0 green / 1-2 amber / >2 red | search `index=brewery sourcetype=quality_alert acknowledged_by="" earliest=-24h` |
| 3 | Batches On-Spec | `batch_progress` | `N/M on track` | all=green / 1-off=amber / 2+off=red | search `index=brewery sourcetype=beerware_batch status=active` |
| 4 | Next Critical Step | `batch_progress` | duration text (e.g. "BL03 boil-out in 47m") | <30m copper (brand attention) / ≥30m green | search filtered to that batch |

### 5.2 Secondary tiles (8 tank tiles — the central operational artefact)

> Replaces the "threat pulse" pattern with a **per-tank tile grid**.
> Each tile is one tank: status color, temp, gravity (Plato),
> fermentation stage. Drilldowns open the per-tank deep-dive.

| # | Tile label | Source | Number format | Threshold | Drilldown to |
|---|---|---|---|---|---|
| 1 | BL01 (Tank 1) | `tanks_active` filter `tank_id="BL01"` | temp °C + plato | per recipe spec | search by tank |
| 2 | BL02 (Tank 2) | filter `tank_id="BL02"` | same | same | search by tank |
| 3 | BL03 (Tank 3) | filter `tank_id="BL03"` | same | same | search by tank |
| 4 | BL04 (Tank 4) | filter `tank_id="BL04"` | same | same | search by tank |
| 5 | BL05 (Tank 5) | filter `tank_id="BL05"` | same | same | search by tank |
| 6 | BL06 (Tank 6) | filter `tank_id="BL06"` | same | same | search by tank |
| 7 | BL07 (Tank 7) | filter `tank_id="BL07"` | same | same | search by tank |
| 8 | BL08 (Tank 8) | filter `tank_id="BL08"` | same | same | search by tank |

> 8 tiles in 2 rows of 4. Each ~440×120px. Tile shows: tank name,
> current stage (text), temp °C (large), Plato (medium), batch ID
> (small). Tile background tints based on out-of-spec deviation
> (default = warm neutral, copper = decision needed, red = abort).

### 5.3 Trend / chart panels

| # | Title | Viz type | Source | Notes |
|---|---|---|---|---|
| 1 | Fermentation Curves — last 48h | `splunk.line` (multi-series, one per active tank) | `fermentation_curves` | `lineSmoothing: "smooth"` (fermentation curves ARE smooth in nature, this is editorial-honest), `lineWidth: 2`, dual-axis: gravity left / temp right, legend below |
| 2 | Dissolved Oxygen by Sample Point | `splunk.column` | `dissolved_oxygen` | Categorical bars per sample point (boil-out, post-knockout, post-fermentation), threshold band overlay for HACCP limits |

### 5.4 Detail / table panels

| # | Title | Source | Columns | Status column? |
|---|---|---|---|---|
| 1 | Active Batches — Stage Progress | `batch_progress` | Batch ID (90), Recipe (140), Stage (120), Progress (100, % bar via cellTypes), ETA (90) | No — progress is the visual indicator |
| 2 | Quality Alerts — Last 24h | `quality_alerts` | Time (110), Tank (60), Type (130), Severity (110, cell-color), Message (260), Ack (110) | Yes — Severity column color-coded via `matchValue` (`OK ✓` transparent, `WARN ⚠` amber, `CRITICAL ✗` red) |
| 3 | CIP Status by Tank | `cip_status` | Tank (60), Last Clean (130), Hours Since (90), Result (100, cell-color) | Yes — Result colored (`PASS ✓` green, `FAIL ✗` red, `OVERDUE ⚠` amber) |

### 5.5 Markdown / narrative panels

| # | Position | Content (one-line) |
|---|---|---|
| 1 | top header | "Fjellbryggeri" wordmark (Platform Sans large) + mountain logomark + 4px brand stripe (forest green) |
| 2 | section divider 1 | `## Brewfloor Live` (top-of-fold, hero KPI section) |
| 3 | section divider 2 | `## Tank Status` (8-tile grid) |
| 4 | section divider 3 | `## Fermentation Trends & Quality` (charts) |
| 5 | section divider 4 | `## Active Batches & Alerts` (tables) |
| 6 | hairline divider | 2px horizontal, copper `#B5651D` at 40% opacity, between tank-grid and trends |
| 7 | footer | Shift handover info: shift lead, on-call brewmaster, emergency contact (HACCP coordinator), Beerware batch system link |

### 5.6 Drilldowns

- [x] All panels drilldown by default (recommended)

> Tank tiles drilldown to per-tank historical view (separate
> dashboard `tank_deepdive_v1` — out of scope for this build but
> link present). Charts drilldown to filtered SPL. Tables drilldown
> by row to per-batch / per-alert detail.

---

# Section 6: Visualization Preferences

### 6.1 Must-include viz types

- [x] `splunk.singlevalue` — hero KPIs + 8 tank tiles
- [x] `splunk.line` — fermentation curves (multi-series, smoothed)
- [x] `splunk.column` — DO by sample point
- [x] `splunk.table` — batches, alerts, CIP
- [x] `splunk.markdown` — section headers + footer
- [x] `splunk.rectangle` — tile background cards (depth) + section dividers
- [x] `splunk.image` — Fjellbryggeri logomark in header

### 6.2 Must-NOT-include viz types

- [x] `splunk.pie` — banned (categorical proportions don't apply here)
- [x] `splunk.fillergauge` / `splunk.markergauge` — banned (felt too "Tableau exec deck" for craft-Nordic tone; thresholded singlevalue carries the same info more honestly)
- [x] `splunk.choropleth.svg` for floor plan — considered, deferred to v2 (would need to vector-trace the actual brewfloor — out of scope)
- [x] Other: `splunk.area` chart fills (too decorative — line is honest)

### 6.3 Specific encoding rules

> - Tank tiles: NO sparkline (8 sparklines × 8 tiles = visual chaos).
>   Just current value + status color. The fermentation curves panel
>   carries the trend info.
> - Status indicators always pair color with text glyph (`✓ ⚠ ✗`) —
>   colorblind redundancy.
> - Number format: 1 decimal place for °C and Plato, integer for
>   pressure mbar, no thousand-separator (numbers are small).
> - `cornerRadius: [10,10,10,10]` at TOP-LEVEL on every chart panel
>   (slightly less rounded than the CISO example — craft tone wants
>   gentler corners, less app-store-icon-y).
> - Cell-level color on Severity + Result columns ONLY, not whole-row.
> - Chart axis titles HIDDEN — panel title carries the meaning.
> - Tank tile background: forest-green tinted card on dark theme,
>   warm-beige on light. Card depth via subtle shadow rectangle
>   (offset 3px, 50% opacity).
> - Mountain logomark: monochrome, copper on dark / forest on light.

---

# Section 7: Constraints & Compliance

### 7.1 Splunk version

- [x] **Splunk Enterprise 10.2.x** — on-prem, deployed on the brewery's local Cisco UCS rack

> No cloud — Norwegian food production data stays in-country (Voss
> data center). All Dashboard Studio features available on 10.2.x;
> verified empirically during ACME field test.

### 7.2 Accessibility requirements

- [x] **Colorblind-safe palette only** — color always paired with glyph or shape

> 2 of the 4 brewmasters have red-green color confusion. Status
> indicators MUST pair color with `✓ / ⚠ / ✗` glyph. Tested on shift
> with Astrid before sign-off.

- [x] **WCAG AA** contrast (4.5:1) for the tablet view (well-lit office)
- [x] Wall display: contrast ratio higher (7:1) for distance-readability — light text on dark background, larger font sizes

### 7.3 Performance constraints

| Concern | Limit |
|---|---|
| **Max search result count** | 50000 default — sensors emit ~1 data point per second per tank, 8 tanks × 60 = 480 points/min. 48-hour window = ~1.4M points; mitigated by `timechart span=15m` aggregation upstream |
| **Max concurrent searches** | 6 (instance has 4 cores). Use base + chain pattern for the 8 tank tiles (one base search, 8 chains) |
| **Refresh rate** | Live tanks: `30s`; charts: `60s`; CIP/batch tables: `5m` |
| **Auto-refresh enabled?** | Yes — wall display must auto-update. Tablet inherits |

### 7.4 Export / sharing

- [ ] PDF export not required — wall display is the primary artefact
- [ ] Scheduled email — N/A
- [x] **Embed in another app** — Beerware Pro (the batch management web UI) embeds this dashboard via iframe in the "Operations" tab

> Iframe embed means: must work without scroll bars at 1920×1080,
> must NOT depend on Splunk navbar, must work with `embed.enabled=true`.

---

# Section 8: References & Assets

### 8.1 Existing dashboards to inherit from

| Dashboard / app | What to copy |
|---|---|
| `ds_soc_dark` (Splunk demo) | Dark canvas baseline + KPI strip rhythm; reject the rainbow series colors |
| `ds_viz_singlevalueicon_dark` | Tile spacing + icon sizing for the 8-tank grid |
| Splunk Industrial Asset Intelligence demo | NOT directly — too "factory floor" (anti-reference), but useful for what NOT to do |

### 8.2 Asset files

| File | Purpose |
|---|---|
| `assets/fjellbryggeri-logomark.svg` | Mountain + FB monogram, monochrome, ~80×80px in dashboard header |
| `assets/fjellbryggeri-wordmark.svg` | "Fjellbryggeri" text logo, used standalone or with logomark |
| `assets/recipes/sommernatt-target-curve.csv` | Reference fermentation curve for the flagship Pilsner — used as overlay band on fermentation chart |
| `assets/recipes/julestjerne-target-curve.csv` | Reference curve for Christmas seasonal beer (October–December only) |

### 8.3 Reference material

- [x] Fjellbryggeri brand book (`docs/fjellbryggeri-brand-2024.pdf`) — color codes, logomark usage, tone-of-voice
- [x] Recipe specifications for active batches (`docs/recipes/*.json`) — used to compute "on-spec" thresholds dynamically per batch
- [x] HACCP plan (`docs/haccp-plan-2025.pdf`) — defines critical control points (CCP) the dashboard must surface
- [x] Photos of the brewfloor wall location (`docs/wall-photos-2025-08.jpg`) — for sizing/glare context
- [ ] Existing Splunk dashboards (none — greenfield)

---

# Section 9: Iteration & Hand-off

### 9.1 Deployment target

| Field | Value |
|---|---|
| **Splunk instance URL** | `https://splunk.fjellbryggeri.local:8000` (LAN only, no public access) |
| **App** | `fjellbryggeri_ops` |
| **Dashboard slug** | `brewfloor_live_v1` |
| **Auto-deploy after build?** | Yes — use `splunk_update_dashboard` MCP tool. Initial build via `splunk_create_dashboard`. |

### 9.2 Review iterations expected

- [x] **2-3 review rounds** — expect screenshot feedback + refinement

> Astrid will run it on the actual wall + tablet during a Wednesday
> production day. Real shift validation > office screenshot review.
> Expect feedback on: tile color thresholds, fermentation curve
> readability at 5m wall distance, alert acknowledgment workflow.

### 9.3 Sign-off

- [x] Skip Q&A and proceed straight to build based on this template
- [x] User wants AI to confirm Sections 1.1, 2.1, and 3.1 verbally before starting

> One-line confirmations expected:
> 1. "Building an operational monitoring dashboard for Brewmaster
>    Ingrid: real-time decision support during shift, wall + tablet,
>    8 tanks visible simultaneously."
> 2. "Tone: craft / Nordic / measured. Anti-ref: SCADA HMI, generic
>    factory dashboard, brewery vendor demo."
> 3. "Brand: Fjellbryggeri forest-green + copper accent, dark-first
>    with light variant, Splunk Platform Sans (brand serif not in
>    enum)."

---

*Hand-off prompt to AI:*

> "Use the inputs in `templates/ds-inputs-EXAMPLE-fjellbryggeri-brewfloor.md`
> to design and build the dashboard. Skip the Design Context Protocol
> Q&A — everything you need is in the template. Build dark theme first,
> then a light variant. Deploy to `fjellbryggeri_ops` as
> `brewfloor_live_v1`. Surface the rendered URLs (dark + light) when
> done. Expect a 2-3 round review cycle with Astrid during the next
> production shift."
