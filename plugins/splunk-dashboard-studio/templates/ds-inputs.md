# Splunk Dashboard Studio — Design Inputs Template v1.0

---

# Overview

This template captures **everything `ds-couture` would otherwise ask you in Q&A** so you can hand the AI a single document and skip the back-and-forth init flow.

**You provide:**
- Engagement context (who it's for, what it's about)
- Persona / archetype selection (or "let AI pick" with reasoning)
- Tone, anti-references, brand assets
- Data sources and the KPIs / panels you want to see
- Constraints (Splunk version, screen size, theme, accessibility)

**The AI uses this directly:**
- No Design Context Protocol Q&A
- No "what archetype should we use?" round-trips
- Skips straight to the workflow tree (persona → archetype → theme → palette → typography → layout → encoding → anti-pattern check → JSON hand-off)

**Companion skills:** `ds-couture` orchestrates; the per-step decisions live in `ds-ref-personas`, `ds-ref-archetypes`, `ds-ref-color`, `ds-ref-typography`, `ds-ref-layout-grid`, `ds-ref-visual-encoding`, `ds-ref-anti-patterns`, `ds-ref-references`, `ds-ref-brand`, `ds-ref-themes`. You don't need to read those — the AI does.

**Sample / real data is optional** — AI can scaffold with `| makeresults` mock SPL, but a real dataset (or a clear "data shape" description) produces a more accurate first build.

> **Rule of thumb:** spend 15 minutes filling this in. It saves an hour of back-and-forth and produces a dashboard that actually looks like you wanted it.

---

# Section 0: Engagement Context

*Identifies the project. AI uses this to tag artefacts and keep multiple dashboards distinct.*

### 0.1 Engagement Information

| Field | Value |
|---|---|
| **Customer / org** | _[e.g. ACME Inc.]_ |
| **Project / dashboard name** | _[e.g. CISO Daily Controls]_ |
| **Author** | _[Your name / role]_ |
| **Date** | _[YYYY-MM-DD]_ |
| **Splunk app context** | _[e.g. `splunk-knowledge-testing` or app name]_ |
| **Dashboard ID (slug)** | _[e.g. `acme_daily_controls_v1` — must match `^[a-zA-Z0-9_-]+$`]_ |

### 0.2 Build Mode

_Select ONE. Controls how strictly the AI follows your inputs vs. expanding scope._

- [ ] **Strict** — Build only what's specified here. Don't add KPIs, panels, or sections beyond this template. Best when you know exactly what you want.
- [ ] **Curated** — Build what's specified, plus the AI may suggest 1–2 panels per section it thinks are missing (tagged `[AI-SUGGESTED]` so you can keep or drop). Best when you want a sanity check.
- [ ] **Exploratory** — AI expands liberally based on persona/archetype best practices. Use for prototyping or when you want to see "what good looks like" before narrowing scope.

---

# Section 1: Business Problem & Audience

*Without this section, dashboards regress to AI-generic. The AI literally cannot design well in the dark.*

### 1.1 What is this dashboard FOR?

_Describe the operational decision or action this dashboard should enable. Not "show security data" — "decide whether to page the on-call at 3am". One sentence._

```
Example: "Lets the CISO decide every weekday at 09:00 whether 
the security posture is on-track or needs an exec escalation 
before the C-staff sync at 10:00."
```

### 1.2 Audience

_Pick a primary persona. If multiple roles consume this, list secondary too._

- [ ] **CISO Sarah** — quarterly board read, exec lens, 1 KPI strip + 1 trend, no pivoting
- [ ] **SOC Operator Alex** — 8-hour shift, 27" wall, density tolerated, every panel must drilldown
- [ ] **NOC Engineer Jordan** — wall display, 100ft viewing distance, R/A/G only, no pivot
- [ ] **Sales VP Maria** — board meeting, projector, 5 minutes airtime, "good news / bad news"
- [ ] **Investigator Priya** — analytical deep-dive, hours of session, free-form filter pivot
- [ ] **Field Tech Rohan** — phone, on-call, single panel + assignment
- [ ] **Platform Engineer Devin** — internal service health, 4-quadrant SRE pattern
- [ ] **Compliance Officer Yuki** — audit-window read, evidence trail, not real-time
- [ ] **Custom** — describe below (the AI will model the persona)

```
If Custom or if you want to refine the chosen persona:
- Where do they look at this? [desk monitor / wall / projector / phone]
- For how long? [10 sec / 5 min / 8 hours]
- What time of day? [start of shift / 09:00 standup / on-call ping]
- Decision they need to make? [page on-call / trigger maintenance / accept the day]
```

### 1.3 Anti-personas

_Who should NOT be the design target? Important for archetype calibration._

```
Example: "This is NOT for SOC analysts — they have their own dashboard. 
This is for the CISO and her direct reports only. So: no event-row 
density, no per-host pivot, no SPL transparency."
```

### 1.4 Industry / vertical

_Helps with palette + tone calibration._

- [ ] Financial services (banking, insurance, capital markets)
- [ ] Cybersecurity / SOC / SIEM operations
- [ ] Cloud infrastructure / SRE / platform engineering
- [ ] E-commerce / retail
- [ ] Healthcare / pharma
- [ ] Manufacturing / OT / industrial
- [ ] Public sector / government
- [ ] Telecom / carriers
- [ ] Other: _______________

---

# Section 2: Archetype & Layout

*Picks the canvas shape. AI consults `ds-ref-archetypes`.*

### 2.1 Archetype

_Pick one. If hybrid, pick primary + note hybrid in 2.2._

- [ ] **Executive summary** — 1 KPI strip + 1 trend + 1 supporting panel. Single screen, no scroll. Restraint > density.
- [ ] **Operational monitoring** — Dense KPI grid, status tiles, primary trend, alert log. Designed for active workflow.
- [ ] **Analytical deep-dive** — Free-form filters + multi-panel drill. Investigator persona. Density expected.
- [ ] **SOC overview** — Wall + analyst console dual-context. R/A/G health roll-up + drilldown to detection layer.
- [ ] **Hybrid** — Describe below.

### 2.2 Hybrid notes (optional)

```
Example: "Primarily exec summary BUT we also need a 'recent alerts' 
table that the CISO can scan. So it's exec summary + one operational 
panel docked to the right. Not full operational dashboard."
```

### 2.3 Canvas size & layout

> **Layout defaults to `absolute`.** Grid layout is only used if you explicitly request it. You do not need to specify absolute — it's the enforced default.

> **Shadow rectangles are applied by default.** Every panel group gets a depth-layer rectangle behind it. Only omitted if you explicitly request no shadows.

_Default: 1920 × content-driven height. See `ds-ref-layout-grid` for archetype × width guidance._

- [ ] **1920 × 1080** — single screen, full HD, fits a 27" monitor or projector exactly
- [ ] **1920 × content-driven** — natural scroll OK; pick this if content overflows 1080
- [ ] **1440 × 960** — legacy / constrained / embed context (pick only if you know why)
- [ ] **Custom**: width _____ × height _____

### 2.4 Tabs / sections

_Should the dashboard have tabs (multiple sub-views) or stay single-pane?_

- [ ] **Single pane** — everything visible at once
- [ ] **Tabs** — describe the tabs:

| Tab | What it shows | When user switches to it |
|---|---|---|
| | | |
| | | |

---

# Section 3: Tone, Brand & Anti-References

*The most undertaught part of design. Without explicit tone, the AI averages every dashboard on GitHub and produces slop.*

### 3.1 Three tone words

_Concrete tone descriptors. NOT "modern", NOT "clean" — those are dead categories. Use words that imply specific design choices._

```
Examples that work:
- "Editorial / restrained / civic" → serif headers, lots of whitespace, single accent color
- "Trading floor / engineered / technical" → mono numbers, dense KPI strip, electric green
- "Couture / generous / quiet luxury" → tall canvas, hairline rules, large negative space
- "Operations / utilitarian / dense" → no decoration, high info density, status-only color

Examples that DON'T work:
- "Modern" → meaningless, AI will average
- "Clean" → meaningless, AI will produce default Splunk
- "Professional" → not a design choice
```

| # | Word | What it implies (one short note) |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |

### 3.2 Anti-references

_What should this dashboard EXPLICITLY NOT look like? At least one._

- [ ] **AI-generic Splunk demo** — 4 same-size KPIs, default rainbow palette, no hierarchy
- [ ] **Splunk default Studio template** — pastel cards, sample-data labels
- [ ] **NOC wall** (if not building one) — green/red blocks, no narrative
- [ ] **Marketing dashboard** — logos, banner images, gradient backgrounds
- [ ] **Tableau exec deck** — busy color, gradient fills, 3D effects
- [ ] **Spreadsheet** — uniform rows, no hierarchy
- [ ] **Custom anti-reference**:

```
Example: "Don't look like Datadog — too many sparklines side by side. 
Don't look like a Grafana SRE dashboard — too SREish for a CISO."
```

### 3.3 Positive references (optional)

_Dashboards / sites / images that the AI should aim toward._

| Reference | URL or screenshot path | What you like about it |
|---|---|---|
| | | |
| | | |

```
Example:
| Bloomberg Terminal | (mental model) | Density without slop, monospace numbers |
| Apple keynote slides | apple.com/event | Whitespace, single accent, restraint |
| FT graphics dept | ft.com/graphics | Editorial typography, civic color |
```

### 3.4 Brand context (optional)

_If this dashboard represents a specific brand. Leave blank if generic._

| Field | Value |
|---|---|
| **Brand name** | _[e.g. ACME]_ |
| **Brand primary color** | _[hex, e.g. `#FF2942` for ACME red]_ |
| **Brand secondary color** | _[hex, optional]_ |
| **Brand neutral / background** | _[hex, optional — e.g. `#0A0F1C` for dark navy]_ |
| **Brand font** | _[e.g. "Times New Roman" — must be one of Splunk's allowed enums; see ds-viz-markdown OPTIONS]_ |
| **Logo file** | _[path to PNG/SVG; place in `assets/`. Splunk uploads via KV-store; data URIs only work via splunk.choropleth.svg]_ |

> **Color collision warning:** if your brand color is red, amber, or
> green, the AI will route it AROUND the status R/A/G palette (status
> colors are sacred). See `ds-ref-color` for brand × status collision
> resolution.

### 3.5 Theme

- [ ] **Dark** (recommended for operational dashboards, wall displays, NOC/SOC)
- [ ] **Light** (recommended for executive reports, printed exports, board decks)
- [ ] **Both** (the AI builds dark + a light variant)

---

# Section 4: Data Sources & SPL

*What data drives this dashboard. AI uses this to build dataSources block and SPL.*

### 4.1 Data sources

_For each searchable thing on the dashboard, list one row. AI auto-generates SPL if you describe the calculation. If you have working SPL, paste it._

| Source label | Index / lookup / savedsearch | Calculation (plain language) | SPL (if you have it) |
|---|---|---|---|
| | | | |
| | | | |
| | | | |

```
Examples:
| critical_incidents | index=incidents severity=critical | Last 14 days daily count | (paste SPL) |
| edr_coverage | inputlookup edr_status.csv | Latest coverage % by org | (paste SPL) |
| controls_grid | savedsearch="Daily Controls" | Domain × control × status | (will generate) |
```

### 4.2 Mock data acceptable?

- [ ] **Yes — scaffold with `| makeresults`** (AI generates 14-day mock series for KPIs / trends)
- [ ] **No — must run against real indexes** (paste real SPL in 4.1)
- [ ] **Mixed** — note which sources need real SPL vs mock:

```

```

### 4.3 Time range

| Concern | Value |
|---|---|
| **Default time range** | _[e.g. `-24h@h,now` or `-7d@d,now`]_ |
| **User-adjustable?** | _[yes / no — if yes, AI adds `input.timerange` with token `global_time`]_ |
| **Per-panel overrides?** | _[note any panel that needs a different window, e.g. "trend = 14d, KPIs = 24h"]_ |

---

# Section 5: KPIs & Panels

*The actual content. AI uses this as the panel inventory.*

### 5.1 Hero KPIs (the headline numbers)

_Maximum 4. Pick the ones that answer "did the day go well?"_

| # | KPI label | Source | Number format | Threshold (R/A/G) | Drilldown to |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

```
Example:
| 1 | Active Critical Incidents | critical_incidents | integer | <1 green / 1-5 amber / >5 red | search index=incidents severity=critical status=open |
| 2 | EDR Coverage | edr_coverage | percent (1 dp) | <85 red / 85-95 amber / ≥95 green | search index=edr_coverage status=non-compliant |
```

### 5.2 Secondary tiles (the next layer down)

_Smaller KPIs, ~6 max. Threat pulse / status row / supporting metrics._

| # | Tile label | Source | Number format | Threshold | Drilldown to |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
| 6 | | | | | |

### 5.3 Trend / chart panels

| # | Title | Viz type | Source | Notes (smoothing, axis hidden, etc) |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |

```
Example:
| 1 | Incident Volume — Last 14 Days | splunk.line | trend_incidents_14d | linear smoothing (SOC), no axis titles |
| 2 | Top Targeted Hosts | splunk.bar | top_hosts | sorted desc, count label on bar |
```

### 5.4 Detail / table panels

| # | Title | Source | Columns (with widths if known) | Status column? |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |

```
Example:
| 1 | Control Health by Domain | controls_grid | Domain (90), Control (170), Status (130, color-coded), Last Tested (100) | yes |
```

### 5.5 Markdown / narrative panels

_Section headers, footers, escalation strips, status banners._

| # | Position | Content (one-line) |
|---|---|---|
| 1 | top header | |
| 2 | section divider | |
| 3 | footer | |

```
Example:
| 1 | top header | "ACME Daily Controls" wordmark + shield icon |
| 2 | section divider | "## Today's Posture" + "## Threat Pulse" + "## Trend & Control Health" |
| 3 | footer | Escalation contacts: runbook link, on-call PagerDuty, Slack channel, owner email |
```

### 5.6 Drilldowns

_Default behaviour: every entity-displaying panel drills down. Note exceptions._

- [ ] All panels drilldown by default (recommended)
- [ ] Specific panels should NOT drilldown — list:

```

```

---

# Section 6: Visualization Preferences

*Hard constraints on which viz types to use / avoid. AI consults `ds-ref-visual-encoding` + `ds-pick-viz`.*

### 6.1 Must-include viz types

_Check anything the dashboard MUST contain (because of brand, persona, or operational need)._

- [ ] `splunk.singlevalue` (KPI tiles)
- [ ] `splunk.singlevalueicon` (KPI with icon — absolute layout only)
- [ ] `splunk.line` (trend)
- [ ] `splunk.area` (volume trend)
- [ ] `splunk.column` (categorical bars)
- [ ] `splunk.bar` (horizontal bars / top-N)
- [ ] `splunk.table` (detail rows)
- [ ] `splunk.pie` (rare — only for ≤4-segment proportion)
- [ ] `splunk.map` (geographic — Leaflet basemap)
- [ ] `splunk.choropleth.svg` (custom SVG fills — floor plans, network topology, custom regions)
- [ ] `splunk.timeline` (time-ordered status stripe)
- [ ] `splunk.events` (raw event payloads)
- [ ] `splunk.markdown` (text / headers / narrative)
- [ ] `splunk.rectangle` (cards, dividers, hit-zones)
- [ ] `splunk.image` (logos, screenshots, diagrams)
- [ ] Other: _______________

### 6.2 Must-NOT-include viz types

_Banned from this dashboard. AI rejects requests for these even if data fits._

- [ ] `splunk.pie` (banned for >4 segments — use bar chart)
- [ ] `splunk.fillergauge` / `splunk.markergauge` (banned for executive — distracting)
- [ ] Other: _______________

### 6.3 Specific encoding rules

```
Examples:
- "Sparklines on every KPI tile (showSparklineAreaGraph: true)"
- "All status indicators must use ✓ / ⚠ / ✗ glyphs paired with color (colorblind-safe)"
- "Number format: thousands separator on, no abbreviation (1,234 not 1.2K)"
- "Cell-level color on Status column, not whole-row"
```

---

# Section 7: Constraints & Compliance

### 7.1 Splunk version

- [ ] **Splunk Cloud** (10.4.x — latest)
- [ ] **Splunk Enterprise 10.2.x** (some option enums differ — see ds-viz-* GOTCHAS)
- [ ] **Splunk Enterprise 9.x** (legacy — limited Dashboard Studio features)
- [ ] **Both** (build for the lower common denominator — usually 10.2.x)

### 7.2 Accessibility requirements

- [ ] **WCAG AA** (4.5:1 contrast, color + glyph redundancy, keyboard nav)
- [ ] **WCAG AAA** (7:1 contrast, stricter)
- [ ] **Colorblind-safe palette only** (no red/green only — must pair with glyph or shape)
- [ ] **Screen-reader compatible** (panel titles, alt text)

### 7.3 Performance constraints

| Concern | Limit |
|---|---|
| **Max search result count** | _[default: 50000 — Splunk hard cap]_ |
| **Max concurrent searches** | _[note if instance is constrained — use base+chain pattern]_ |
| **Refresh rate** | _[`30s` for ops, none for exec, custom]_ |
| **Auto-refresh enabled?** | _[yes / no]_ |

### 7.4 Export / sharing

- [ ] **PDF export expected** (no external image URLs, no GIF animation)
- [ ] **Scheduled email delivery** (PDF — same constraint)
- [ ] **Embed in another app** (note app context)
- [ ] **None — dashboard view only**

---

# Section 8: References & Assets

### 8.1 Existing dashboards to inherit from

| Dashboard / app | What to copy |
|---|---|
| | |

```
Example:
| Splunk demo "ds_soc_dark" | overall layout pattern + color palette |
| Our existing "executive_brief" dashboard | KPI strip styling + footer escalation |
```

### 8.2 Asset files

_Place in `assets/` folder of the project. List paths here._

| File | Purpose |
|---|---|
| | |

```
Example:
| assets/acme-logo.svg | Brand wordmark in header |
| assets/datacenter-floorplan.svg | Floor plan choropleth in operational dashboard |
| assets/network-topology.svg | Topology overlay |
```

### 8.3 Reference material

_Anything else the AI should read first._

- [ ] Brand book / style guide (paste path or URL)
- [ ] Existing SPL searches / saved searches (path or URL)
- [ ] Existing screenshots of "what good looks like" (path)
- [ ] Notes from stakeholder interview (path)
- [ ] Other: _______________

---

# Section 9: Iteration & Hand-off

### 9.1 Deployment target

| Field | Value |
|---|---|
| **Splunk instance URL** | _[e.g. `https://splunk.acme.com:8000`]_ |
| **App** | _[e.g. `splunk-knowledge-testing`]_ |
| **Dashboard slug** | _(matches Section 0.1)_ |
| **Auto-deploy after build?** | _[yes / no — if yes, AI uses `splunk_create_dashboard` MCP tool]_ |

### 9.2 Review iterations expected

- [ ] **One-shot** — build, deploy, done
- [ ] **2-3 review rounds** — expect screenshot feedback + refinement
- [ ] **Continuous** — open-ended polish (default for `ds-couture` flow)

### 9.3 Sign-off

- [ ] User approves AI to skip Q&A and proceed straight to build based on this template
- [ ] User wants AI to confirm Section 1.1, 2.1, and 3.1 verbally before starting (recommended for first dashboard with a new persona)

---

*This is the Inputs document only. Once filled, hand to `ds-couture` with: "Use the inputs in `<path>` to design the dashboard. Skip the Design Context Protocol Q&A — everything you need is in the template."*
