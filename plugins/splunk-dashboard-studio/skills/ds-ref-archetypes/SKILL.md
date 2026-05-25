---
name: ds-ref-archetypes
description: Splunk Dashboard Studio archetypes reference — the four canonical layouts (executive summary, operational monitoring, analytical deep-dive, SOC overview / wall) with panel-mix fingerprints, audience profiles, viewing context, and per-archetype defaults. Use when picking layout shape for a new dashboard, when ds-couture commits to an archetype, or when the user asks "what should this look like for X audience?".
---

# ds-ref-archetypes — Splunk dashboard archetypes

## Scope (what's IN)

- The 4 archetypes (executive summary, operational monitoring, analytical deep-dive, SOC overview / wall) with deep-dive per archetype.
- Panel-mix fingerprints per archetype.
- Canvas dimensions per archetype (1920×1080 minimum all archetypes, per ds-ref-layout-grid §Canvas Sizes).
- When-to-use rules per archetype.
- Hybrid examples and smells (when archetypes mix).

## Out of scope (what's NOT here)

- Color palette per archetype — see `ds-ref-color`.
- Grid/spacing math — see `ds-ref-layout-grid`.
- Anti-pattern detection per archetype — see `ds-ref-anti-patterns`.

## Consults

- `ds-ref-personas` (persona → archetype mapping).

## Consulted by

- `ds-couture` (after Design Context Protocol, when committing to an archetype).
- `ds-design` (when wireframing a new layout).
- `ds-init` (during scope phase).

## The four archetypes at a glance

| Archetype | Audience | Panels | Primary question |
|---|---|---|---|
| **Executive summary** | Leadership | 6–8 | Is everything healthy right now? |
| **Operational monitoring** | On-call, NOC | 8–12 | What is happening right now? |
| **Analytical deep-dive** | Analysts, investigators | 10–14 (use tabs) | What caused this and what does the data show? |
| **SOC overview** | SOC analysts | 7–10 | Where are threats, how severe, what just happened? |

Each archetype below documents audience, panel count, purpose, typical
panel mix, canvas dimensions, and an ASCII layout sketch.

### Executive summary

- **Audience:** Leadership — VPs, directors, business owners.
- **Panel count:** 6–8 panels. Anything more dilutes the story.
- **Canvas:** 1920×1080 minimum. (ds-ref-layout-grid §Canvas Sizes mandates 1920×1080 minimum for all archetypes.)
- **Primary question:** *Is everything healthy right now?*
- **Purpose:** A single calm story per dashboard. Each panel answers
  "yes / no / by how much" against a target. The viewer spends ~90
  seconds scanning before clicking away or asking a follow-up.

**Typical panel mix:**

- 4-KPI strip across the top (the headline numbers, with trend deltas
  and units).
- 1 trend chart (line) showing the headline metric over the period.
- 1 part-to-whole (pie / donut ≤6 slices, or sorted bar) for mix.
- 1 status table (top-N services / regions / business units, status
  coloured).
- Optional: 1 markdown panel framing the period and the takeaway.

**ASCII layout:**

```
+-----------------------------------------------------------+
|  KPI 1     |   KPI 2    |   KPI 3    |   KPI 4            |
|  big num   |   big num  |   big num  |   big num          |
+-----------------------------------------------------------+
|                                                           |
|   Trend over time (line)                                  |
|                                                           |
+-------------------------------+---------------------------+
|                               |                           |
|   Mix (pie / sorted bar)      |   Top-N status (table)    |
|                               |                           |
+-------------------------------+---------------------------+
```

### Operational monitoring

- **Audience:** On-call SREs, NOC operators, platform teams.
- **Panel count:** 8–12 panels.
- **Canvas:** 1920×1080 minimum.
- **Primary question:** *What is happening right now?*
- **Purpose:** A dense status surface that surfaces the live state of
  every critical service. The viewer drops in for 5–15 minute
  check-ins, scans the wall for red, and drills into specifics.

**Typical panel mix:**

- Service / host status grid (singlevalueicon or coloured table rows).
- 2–4 line / area charts for core metrics (latency p95, error rate,
  throughput, saturation — RED + USE).
- 1 event / alert feed (events viz or table sorted by time).
- 1 capacity gauge (fillergauge or markergauge).
- Heatmap or punchcard for hour×weekday patterns when relevant.

**ASCII layout:**

```
+---------------------+---------------------+---------------------+
|  Service status     |  Active alerts      |  Capacity gauge     |
|  (icon grid)        |  (count + severity) |  (fillergauge)      |
+---------------------+---------------------+---------------------+
|                                                                 |
|   Latency p95 (line)              Error rate (line)             |
|                                                                 |
+-----------------------------------------------------------------+
|                                                                 |
|   Throughput (area)               Saturation (line)             |
|                                                                 |
+-----------------------------------------------------------------+
|                                                                 |
|   Recent events / alerts (events or table, time-sorted)         |
|                                                                 |
+-----------------------------------------------------------------+
```

### Analytical deep-dive

- **Audience:** Analysts, investigators, capacity planners, data
  scientists.
- **Panel count:** 10–14 panels — **use tabs** to keep any single tab
  under 8.
- **Canvas:** 1920×1080 minimum, often scrollable vertically.
- **Primary question:** *What caused this, and what does the data
  show?*
- **Purpose:** A guided exploration surface. The viewer expects to
  pivot, filter, drill, and compare across multiple dimensions. They
  spend 15+ minutes per session and tolerate higher density in
  exchange for analytical depth.

**Typical panel mix:**

- Filter / parameter panel (inputs at top: time range, dimension
  pickers, comparison toggles).
- Summary KPI strip with deltas vs. previous period.
- Time-series lines with comparison overlays.
- Distribution / breakdown (column, bar, histogram).
- Detail table with drilldown (the workhorse).
- Optional: scatter / bubble / parallelcoordinates / sankey for
  correlation and flow analysis.
- Tabs split the surface: *Overview / By region / By segment / Detail*.

**ASCII layout:**

```
+-----------------------------------------------------------------+
| [Time range] [Dimension] [Compare]    Inputs / parameters       |
+-----------------------------------------------------------------+
|  KPI w/ delta  |  KPI w/ delta  |  KPI w/ delta                 |
+-----------------------------------------------------------------+
| Tab: Overview | By region | By segment | Detail                 |
+-----------------------------------------------------------------+
|                                                                 |
|   Trend with comparison overlay (line)                          |
|                                                                 |
+--------------------------------+--------------------------------+
|                                |                                |
|   Distribution (column)        |   Correlation (scatter)        |
|                                |                                |
+--------------------------------+--------------------------------+
|                                                                 |
|   Detail table (drilldown enabled)                              |
|                                                                 |
+-----------------------------------------------------------------+
```

### SOC overview

- **Audience:** SOC analysts (tier-1 triage, tier-2 investigation),
  threat hunters.
- **Panel count:** 7–10 panels.
- **Canvas:** 1920×1080 wall display, often replicated to multiple
  screens. Dark theme mandatory.
- **Primary question:** *Where are threats, how severe, what just
  happened?*
- **Purpose:** A 24/7 vigilance surface. The viewer is on a multi-hour
  shift watching for anomalies; the dashboard must be readable from
  across the room and never strobe or distract.

**Typical panel mix:**

- Severity-coloured event count strip (critical / high / warning /
  info — semantic palette).
- Geographic origin map (`splunk.map` markers or
  `splunk.choropleth.svg`).
- Top attackers / top targets / top techniques (sorted bars or
  tables).
- MITRE ATT&CK heatmap or punchcard for technique frequency.
- Recent high-severity events feed (events viz, severity-coloured).
- Optional: link graph for entity relationships during investigation.

**ASCII layout:**

```
+---------+---------+---------+---------+---------+
| CRIT    | HIGH    | WARN    | INFO    | TOTAL   |
| count   | count   | count   | count   | count   |
+---------+---------+---------+---------+---------+
|                                                  \
|   Geographic origin (map markers)                |
|                                                  |
+-----------------------------+--------------------+
|                             |                    |
|   Top attackers (bar)       |   ATT&CK heatmap   |
|                             |                    |
+-----------------------------+--------------------+
|                                                  |
|   Recent high-severity events (events viz,       |
|   severity-coloured rows)                        |
|                                                  |
+--------------------------------------------------+
```

#### SOC wall sub-archetype — dual-context default

The SOC overview is almost never deployed to a wall display only. The wall and the paired **analyst console** share the **same dashboard definition** — same JSON, same panels, same data sources. The wall is the always-on ambient surface; the console is the click-through investigation surface.

This means:

- **Drilldowns are mandatory** on every entity-displaying panel (host, IP, user, hash, severity bucket, geo location, MITRE technique-id). Zero visual cost on the wall (the wall ignores click handlers); critical value on the console (the analyst clicks through to investigate). "Wall display has no input device" is NOT a valid waiver for dropping drilldowns.
- **Tabs add value, not subtract.** The wall shows tab 1 (auto-cycle or static via deep-link); the console gets all of them (live threats, past trends, compliance posture, asset health). Never reflexively reject tabs because "SOC walls don't have tabs" — that guideline applies only to pure ambient walls without paired consoles, which is rare.
- **`eventActions` and row-level click handlers** belong on every events-viz and table panel. Same logic as drilldowns: invisible on the wall, essential on the console.
- **Section header markdowns** explain what each zone shows and where to escalate. New analyst on shift needs to read the dashboard cold; section headers carry that load.
- **Footer with runbook + on-call link + Slack channel** is mandatory for SOC archetypes. The wall doesn't read it; the console operator does.

The dashboard is **dual-context by default**. Authoring a SOC overview as if it's "wall only" is a Scope Check rejection — see ds-couture's Scope Check gate.

If a deployment is genuinely wall-only with no paired console (rare — confirm with the user before assuming), the interactivity affordances can be downgraded with explicit waivers. But the default is dual-context, not wall-only.

---

## Hybrids and smells

When two archetypes blend in one dashboard:

- **Exec + analytical** — usually a smell. The two have opposite
  density tolerances. Exec wants 6–8 calm panels with one story;
  analytical wants 10–14 with pivoting depth. If the user asks for a
  "drill-down summary," pick analytical and add a small KPI strip on
  top — not the other way around. An exec dashboard with a buried
  detail table reads as cluttered to leadership and shallow to
  analysts. Pick one master archetype and let the other show up as a
  single supporting panel, not as a co-equal half.

- **Operational + SOC** — common and OK; both expect dense grids,
  status colours, dark theme, and 24/7 viewing. The fingerprint
  differences are panel-mix (geo / severity / MITRE in SOC,
  metric-time-series / capacity in ops). A combined NOC+SOC wall is a
  legitimate pattern when one team owns both reliability and security
  triage. Keep semantic colours consistent (critical = red, warning =
  amber) and split the canvas into clear ops-zone vs. SOC-zone bands.

- **Exec + SOC** — almost always wrong. Exec demands generous spacing
  and one calm story; SOC demands density, parallel signals, and dark
  theme. Leadership does not need a wall display, and SOC analysts do
  not need quarterly KPIs. If asked for "an exec view of SOC," build a
  small exec dashboard whose KPIs link out to the SOC dashboard via
  drilldown — keep them as two surfaces.

- **Analytical + SOC** — possible for tier-2 SOC investigation
  consoles. Treat as analytical-with-severity-colouring rather than
  trying to merge fingerprints: keep the analytical layout (inputs,
  tabs, detail table, scatter / link graph) and apply the SOC dark
  theme + semantic severity palette. The MITRE heatmap belongs on the
  pure SOC overview, not on the investigation console.

**Rule of thumb:** if you cannot name the master archetype in one
word, the dashboard is probably trying to be two things at once. Split
it.

---

## Audience-context expansion

For each archetype, four context dimensions shape every downstream
decision (colour, typography, density, drilldown depth):

| Dimension | Executive | Operational | Analytical | SOC |
|---|---|---|---|---|
| **Viewing distance** | ~50 cm (laptop) | ~70 cm (NOC monitor) | ~50 cm (laptop) | ~100 ft (wall) |
| **Time-on-screen** | 90 sec scan | 5–15 min check-in | 15+ min session | 8 h shift |
| **Decision consequence** | Quarterly review | On-call page / runbook | Multi-day investigation | Immediate response |
| **Lighting** | Mixed office | 24/7 dim NOC | Mixed office | Dark wall display |

**How each dimension cascades:**

- **Viewing distance** drives KPI font size and minimum panel
  dimensions. SOC wall at 100 ft needs 56–72 px majors and 4×4 grid
  cells minimum; exec at 50 cm tolerates 36–48 px.
- **Time-on-screen** drives information density. A 90-second exec
  scan cannot afford >8 panels; an 8-hour SOC shift can absorb 10
  parallel signals because the operator returns repeatedly.
- **Decision consequence** drives semantic colour weight. A red KPI
  that pages an on-call must look unmistakably critical; a red KPI
  that informs a quarterly review can be muted.
- **Lighting** drives theme choice. Dark NOC / SOC walls demand dark
  theme with high-contrast semantic colours; mixed-lighting offices
  default to light theme.

**Use this table as a checklist** when picking an archetype: if the
user's stated audience does not match the row's four dimensions, ask
again before committing.
