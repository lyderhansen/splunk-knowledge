# Splunk Dashboard Studio — Design Inputs (Example: ACME Daily Controls)

> **This is a worked example** based on the CISO field-test dashboard
> built in test04/ciso-daily-controls. Use it as a reference for how
> filled-out inputs look. Copy `ds-inputs.md` for your own project.

---

# Section 0: Engagement Context

### 0.1 Engagement Information

| Field | Value |
|---|---|
| **Customer / org** | ACME Inc. |
| **Project / dashboard name** | CISO Daily Controls |
| **Author** | Lyder Hansen |
| **Date** | 2026-04-30 |
| **Splunk app context** | `splunk-knowledge-testing` |
| **Dashboard ID (slug)** | `acme_daily_controls_v1` |

### 0.2 Build Mode

- [x] **Strict** — Build only what's specified here.
- [ ] Curated
- [ ] Exploratory

---

# Section 1: Business Problem & Audience

### 1.1 What is this dashboard FOR?

> "Lets the ACME CISO decide every weekday morning whether the
> security posture is on-track or needs an exec escalation before the
> 09:30 staff sync. Single screen. No pivoting. The shape of the day
> in 5 seconds."

### 1.2 Audience

- [x] **CISO Sarah** — quarterly board read, exec lens, 1 KPI strip + 1 trend, no pivoting

Refinement notes:
- Where: 27" desk monitor at the CISO's office
- For how long: 30 seconds at 09:00, again at 17:00
- Decision: trigger exec escalation Y/N + decide what to brief at the C-staff sync

### 1.3 Anti-personas

> Not for SOC analysts (they have their own dashboard). Not for
> auditors (no evidence trail needed). Not for the SRE team (no host /
> service detail). So: no event-row density, no per-host pivot, no SPL
> transparency.

### 1.4 Industry / vertical

- [x] Cybersecurity / SOC / SIEM operations

---

# Section 2: Archetype & Layout

### 2.1 Archetype

- [x] **Executive summary** — 1 KPI strip + 1 trend + 1 supporting panel.

### 2.2 Hybrid notes

> Pure exec summary, BUT with a supplementary "Threat Pulse" tile row
> (6 small KPIs) below the hero strip. CISO wants to scan secondary
> indicators without losing the executive lens. NO operational table,
> NO event log.

### 2.3 Canvas size

- [x] **1920 × content-driven**  (estimated 960px content height)

### 2.4 Tabs / sections

- [x] **Single pane**

---

# Section 3: Tone, Brand & Anti-References

### 3.1 Three tone words

| # | Word | What it implies |
|---|---|---|
| 1 | Editorial | Times New Roman serif headers; civic typography; like a newspaper front page |
| 2 | Trading-floor | Dark navy canvas; electric green for positive metrics; mono numbers |
| 3 | Restrained | Lots of whitespace; single brand accent (red); no decorative palette |

### 3.2 Anti-references

- [x] **AI-generic Splunk demo** — 4 same-size KPIs, default rainbow palette, no hierarchy
- [x] **Splunk default Studio template** — pastel cards, sample-data labels
- [x] **Custom anti-reference**:

> Don't look like Datadog (too many sparklines side by side, too SREish).
> Don't look like a Grafana SOC overview (too utilitarian for a CISO).
> Don't look like a Tableau exec deck (too gradient-y, too polished).

### 3.3 Positive references

| Reference | URL or path | What you like about it |
|---|---|---|
| Bloomberg Terminal | (mental model) | Density without slop, mono numbers, electric accent |
| FT graphics dept | ft.com/graphics | Editorial typography, civic color, restraint |
| Apple keynote — security slides | apple.com/event | Whitespace, single accent, gravitas |

### 3.4 Brand context

| Field | Value |
|---|---|
| **Brand name** | ACME |
| **Brand primary color** | `#FF2942` (ACME red) |
| **Brand secondary color** | (none — restraint preferred) |
| **Brand neutral / background** | `#0A0F1C` (deep navy, near-black) |
| **Brand font** | `Times New Roman` (Splunk markdown enum) |
| **Logo file** | inline shield SVG via `splunk.choropleth.svg` data URI (red, 24×24) |

> Note: brand red collides with the status R/A/G "critical" red. Solved by
> reserving brand red for header/wordmark only; status uses
> `#FF4D4D` (slightly different shade) so the eye reads them as
> distinct semantically.

### 3.5 Theme

- [x] **Dark**

---

# Section 4: Data Sources & SPL

### 4.1 Data sources

| Source label | Index / lookup / savedsearch | Calculation | SPL |
|---|---|---|---|
| `kpi_critical_incidents` | (mock) | Last 14 days daily count of severity=critical incidents | `\| makeresults count=14 \| streamstats count as day \| eval _time=now()-86400*(14-day) \| eval count=case(...)` |
| `kpi_edr_coverage` | (mock) | Latest EDR coverage % by org | `... \| eval pct=case(...)` |
| `kpi_patch_compliance` | (mock) | Latest patch compliance % | `... \| eval pct=case(...)` |
| `kpi_alerts_triaged` | (mock) | Daily alert triage count | `... \| eval count=case(...)` |
| `tile_*` (×6) | (mock) | Threat pulse secondary tiles | `... \| eval count=case(...)` |
| `trend_incidents_14d` | (mock) | 14-day incident volume trend | `... \| eval incidents=case(...)` |
| `controls_grid` | (mock — `\| makeresults count=10`) | Control × domain × status grid | `\| makeresults count=10 \| streamstats count as i \| eval domain=case(...) \| eval status=case(...)` |

### 4.2 Mock data acceptable?

- [x] **Yes — scaffold with `\| makeresults`**

> Real indexes will be wired in v2 once the design is signed off. For
> now, mock data with realistic 14-day shapes is fine.

### 4.3 Time range

| Concern | Value |
|---|---|
| **Default time range** | `-24h@h,now` (set in `defaults.dataSources.ds.search.options.queryParameters`) |
| **User-adjustable?** | No — exec dashboard, fixed window |
| **Per-panel overrides?** | Trend panel uses 14-day window via inline SPL `now()-86400*(14-day)`, KPIs are 24h |

---

# Section 5: KPIs & Panels

### 5.1 Hero KPIs

| # | KPI label | Source | Number format | Threshold | Drilldown to |
|---|---|---|---|---|---|
| 1 | Active Critical Incidents | `kpi_critical_incidents` | integer | <1 green / 1-5 amber / >5 red | `index=incidents severity=critical status=open` |
| 2 | EDR Coverage | `kpi_edr_coverage` | percent (1 dp) | <85 red / 85-95 amber / ≥95 green | `index=edr_coverage status=non-compliant` |
| 3 | Patch Compliance | `kpi_patch_compliance` | percent (1 dp) | <80 red / 80-90 amber / ≥90 green | `index=patch_status status=missing` |
| 4 | Alerts Triaged Today | `kpi_alerts_triaged` | integer | static blue (no threshold — informational) | `index=triage_history earliest=@d` |

> Hero gets 60px font for #1 (the only metric the CISO truly cares about);
> #2-#4 get 36px to maintain hierarchy.

### 5.2 Secondary tiles (Threat Pulse)

| # | Tile label | Source | Threshold | Drilldown to |
|---|---|---|---|---|
| 1 | Incidents 14d | `tile_incidents_24h` | <1g / 1-10a / >10r | (none) |
| 2 | Open Cases | `tile_open_cases` | static purple — informational | (none) |
| 3 | Failed Logins 24h | `tile_failed_logins` | <100g / 100-500a / >500r | (none) |
| 4 | Suspicious DNS | `tile_dns_suspicious` | <1g / 1-10a / >10r | (none) |
| 5 | Critical Vulns | `tile_critical_vulns` | <1g / 1-5a / >5r | (none) |
| 6 | Untested Controls | `tile_untested_controls` | <1g / 1-5a / >5r | (none) |

### 5.3 Trend / chart panels

| # | Title | Viz type | Source | Notes |
|---|---|---|---|---|
| 1 | Incident Volume — Last 14 Days | `splunk.line` | `trend_incidents_14d` | `lineWidth: 3`, `lineSmoothing: "linear"` (SOC truth), green stroke `#22C55E`, axis titles hidden |

### 5.4 Detail / table panels

| # | Title | Source | Columns | Status column? |
|---|---|---|---|---|
| 1 | Control Health by Domain | `controls_grid` | Domain (90), Control (170), Status (130, cell-level color via `matchValue`), Last Tested (100) | Yes — OK ✓ green / DEGRADED ⚠ amber / FAILED ✗ red |

### 5.5 Markdown / narrative panels

| # | Position | Content |
|---|---|---|
| 1 | top header | "ACME" wordmark (Times New Roman extraLarge, brand red) + shield icon (inline SVG via splunk.choropleth.svg) + 4px brand stripe |
| 2 | section divider 1 | `## Today's Posture` |
| 3 | section divider 2 | `## Threat Pulse` |
| 4 | section divider 3 | `## Trend & Control Health` |
| 5 | hairline divider | 2px height, `#2A3349` (just-above-canvas) — separates Threat Pulse from Trend section |
| 6 | footer | Escalation strip: runbook link · on-call (Sec-Ops Tier-2 PagerDuty) · Slack #sec-controls-daily · ciso-controls@acme.com |

### 5.6 Drilldowns

- [x] All panels drilldown by default

> All 4 hero KPIs + the trend chart drilldown to pre-filtered Splunk
> searches. Tiles are decorative-only (no drilldown — too much
> visual cost for the small surface). Table rows drilldown by
> `$row.Control$` to per-control history.

---

# Section 6: Visualization Preferences

### 6.1 Must-include viz types

- [x] `splunk.singlevalue` — KPIs + tiles
- [x] `splunk.line` — trend
- [x] `splunk.table` — controls grid
- [x] `splunk.markdown` — section headers + footer
- [x] `splunk.rectangle` — shadow cards behind chart panels (depth)
- [x] `splunk.choropleth.svg` — inline shield icon hack (data URI)

### 6.2 Must-NOT-include viz types

- [x] `splunk.pie` — banned
- [x] `splunk.fillergauge` / `splunk.markergauge` — distracting for exec
- [x] Other: `splunk.image` (data URIs don't work; use choropleth.svg trick instead)

### 6.3 Specific encoding rules

> - Sparklines on EVERY KPI tile (`showSparklineAreaGraph: true`,
>   `sparklineDisplay: "below"`)
> - All status indicators use `✓ / ⚠ / ✗` glyphs paired with color
>   (colorblind-safe redundancy)
> - Number format: thousand-separator on, no abbreviation
> - Cell-level status color (NOT whole-row tinting) via
>   `columnFormat.Status.rowBackgroundColors` + `matchValue`
> - `cornerRadius: [12,12,12,12]` at top-level on every chart panel
>   (NOT inside `options`)
> - Shadow cards (`splunk.rectangle` BEHIND, `cornerRadius:
>   [14,14,14,14]`) for depth. Layered offset by 3-4px for
>   pseudo-shadow effect.

---

# Section 7: Constraints & Compliance

### 7.1 Splunk version

- [x] **Splunk Cloud** (10.4.x) — primary target
- [x] **Splunk Enterprise 10.2.x** — also supported (verified empirically during build)

### 7.2 Accessibility

- [x] **Colorblind-safe palette only** (status uses glyph + color always)
- [x] **WCAG AA** contrast on all text/background combos

### 7.3 Performance constraints

| Concern | Limit |
|---|---|
| **Refresh rate** | None (exec dashboard, manual refresh) |
| **Auto-refresh enabled?** | No |

### 7.4 Export / sharing

- [ ] PDF export NOT required for v1 (would require swapping data URI shield → KV-store icon)

---

# Section 8: References & Assets

### 8.1 Existing dashboards to inherit from

| Dashboard | What to copy |
|---|---|
| `ds_soc_dark` (Splunk demo) | Dark canvas baseline; reject the rainbow palette |
| `ds_viz_singlevalueicon_dark` | KPI strip rhythm + 4-tile spacing |

### 8.2 Asset files

| File | Purpose |
|---|---|
| (inline SVG shield via data URI) | Brand mark next to wordmark |

### 8.3 Reference material

- [x] (mental model) — Bloomberg Terminal, FT graphics, Apple keynote security slides
- [x] Splunk PDF docs (`docs/SplunkCloud-10.4.2604-DashStudio.pdf`) — already loaded
- [x] `_schemas/` directory — authoritative option schemas (loaded by skills as needed)

---

# Section 9: Iteration & Hand-off

### 9.1 Deployment target

| Field | Value |
|---|---|
| **Splunk instance URL** | (local docker — credential via MCP) |
| **App** | `splunk-knowledge-testing` |
| **Dashboard slug** | `acme_daily_controls_v1` |
| **Auto-deploy after build?** | Yes — use `splunk_update_dashboard` MCP tool |

### 9.2 Review iterations expected

- [x] **Continuous** — open-ended polish

> 6 review rounds expected based on field-test history. Each round
> surfaces platform findings that flow back into skill docs.

### 9.3 Sign-off

- [x] Skip Q&A and proceed straight to build based on this template

---

*Hand-off prompt to AI:*

> "Use the inputs in `templates/ds-inputs-EXAMPLE-acme-ciso.md` to design the
> dashboard. Skip the Design Context Protocol Q&A — everything you need is
> in the template. Build it, deploy to `splunk-knowledge-testing` as
> `acme_daily_controls_v1`, and surface the rendered URL when done."
