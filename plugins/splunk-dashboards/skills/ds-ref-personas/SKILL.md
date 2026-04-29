---
name: ds-ref-personas
description: Audience personas for Splunk dashboard design — pre-defined viewer archetypes with viewing context, time budget, decision consequence, screen environment, and emotional load. CISO Sarah (90 sec, iPad, morning coffee), SOC Operator Alex (8h shift, 27" wall, 3am page), NOC engineer (24/7 wall, 100ft viewing distance), Sales VP Maria (board meeting, projector). Each persona maps to archetypes and constrains color/typography/density. Use when ds-couture's Design Context Protocol gathers audience info, or when picking an archetype for a stated audience.
---

# ds-ref-personas — Audience personas for Splunk dashboards

> **Status:** skeleton only. Body authored as new content in a follow-up task.

## Scope (what's IN)

- 6–8 named personas with full context profiles (audience, viewing context, time budget, decision consequence, emotional load).
- Persona → archetype mapping.
- Persona → color theme bias (NOC dark, exec light).
- Persona → density tolerance (NOC dense grid, exec generous spacing).
- Persona → criticality (does a red KPI page someone, or inform a quarterly review?).

## Out of scope (what's NOT here)

- Archetype shapes — see `ds-ref-archetypes`.
- Color choice — see `ds-ref-color`.
- Layout density math — see `ds-ref-layout-grid`.

## Consults

- (consulted FIRST in the Design Context Protocol — does not pull from other refs).

## Consulted by

- `ds-couture` (Design Context Protocol).
- `ds-init` (during scope phase).
- `ds-ref-archetypes` (persona → archetype suggestion).

## Source / migration

- New content (no existing source). Distilled from `ds-couture`'s Design Context Protocol questions and broader audience-context discussion in PROGRESS.md.

## Estimated size

M

---

## How personas fit the Design Context Protocol

This skill is consulted FIRST in `ds-couture`'s Design Context Protocol. Before `ds-couture` opens any JSON, before any archetype is picked, before any palette is reasoned about — it asks who is going to look at the dashboard. That single answer narrows every downstream decision:

- **Persona → archetype suggestion.** A CISO does not get a SOC overview; a tier-1 analyst does not get an executive summary.
- **Persona → theme bias.** NOC viewing → dark or dark-NOC. Boardroom projector → light. On-call phone outdoors → light with high contrast.
- **Persona → density tolerance.** A wall-display ops user can read 16 status tiles. A 90-second board read cannot.
- **Persona → criticality.** Does a red KPI page someone tonight, or does it inform a quarterly review? This determines whether the dashboard needs alert thresholds, drilldowns, and refresh intervals — or whether it needs a clean narrative.
- **Persona → typography weight, hero size, spacing rhythm.** Downstream of `ds-ref-typography` and `ds-ref-layout-grid`, but *gated* by the persona answer.

If `ds-couture` cannot match the user's stated audience to a known persona below, it falls back to extracting the same five attributes by direct questioning (see `## When the user names a NEW persona`).

## The personas (8)

Each persona below is a viewer archetype, not a job title. Two CISOs in different industries can map to different personas if their viewing context differs.

### CISO Sarah — quarterly board read

- **Audience:** C-suite security leader, financial-services org
- **Viewing context:** iPad, morning coffee, 90 seconds per check
- **Time budget:** 90 seconds
- **Decision consequence:** quarterly board narrative, budget defense, regulator-facing posture summary
- **Lighting:** mixed, mostly indoor office daylight
- **Maps to archetype:** executive summary
- **Theme bias:** light (printable, projector-safe, screenshot-friendly for slide decks)
- **Density tolerance:** low — 6–8 panels max, hero KPI dominant
- **Criticality:** quarterly review; not a pager

Design implications:
- One hero number per zone, not three.
- Trend arrow + delta vs prior quarter on every KPI.
- No raw event tables; only summaries with named meaning.
- Drilldowns optional — Sarah will not click during a board meeting, but a follow-up analyst might.

### SOC Operator Alex — 8-hour shift, 27" wall

- **Audience:** tier-1/2 SOC analyst on rotation
- **Viewing context:** 27" desk monitor, dim NOC environment, 8-hour shift, includes 3am pages
- **Time budget:** 5–15 second checks every 1–2 minutes; 8 hours total
- **Decision consequence:** immediate triage decisions — escalate, suppress, investigate, dispatch
- **Lighting:** 24/7 dim
- **Maps to archetype:** SOC overview
- **Theme bias:** dark (operator eye comfort, long-shift sustainability)
- **Density tolerance:** high — 10–14 panels OK if grouped by signal class
- **Criticality:** real-time pager territory

Design implications:
- Status semantic colors must be unmistakable at peripheral glance.
- Top-of-screen real estate reserved for active-incident counters and severity buckets.
- Auto-refresh on a tight cadence (15s–60s) is expected.
- Drilldowns to raw events are mandatory — Alex investigates, doesn't admire.

### NOC Engineer Jordan — wall display, 100ft

- **Audience:** ops/network NOC team in shared room
- **Viewing context:** 65–80" wall display, viewed from 10–100ft, multiple operators reading at once
- **Time budget:** continuous ambient awareness; deep checks on demand
- **Decision consequence:** fleet-wide health visibility, on-call escalation trigger
- **Lighting:** dim NOC, sometimes pure-black canvas for contrast
- **Maps to archetype:** operational monitoring
- **Theme bias:** dark-NOC (#000 canvas, neon accents tuned for distance legibility)
- **Density tolerance:** very high — 12–16 status tiles plus supporting trend charts
- **Criticality:** ambient + on-call escalation

Design implications:
- Type sizes scale up substantially — body text that works on Alex's 27" is unreadable from 30ft.
- Use status semantics that remain distinct under low ambient + high screen brightness.
- Avoid hover-only affordances; the wall is rarely the input device.
- Geographic or topology maps are common heroes.

### Sales VP Maria — board meeting, projector

- **Audience:** sales leadership presenting upward
- **Viewing context:** boardroom projector, sometimes printed deck, sometimes shared screen on a video call
- **Time budget:** 5–10 minutes during a quarterly business review
- **Decision consequence:** strategic narrative — pipeline confidence, region allocation, hiring plan
- **Lighting:** bright meeting room with dim projector, or printed page
- **Maps to archetype:** executive summary
- **Theme bias:** light (projector legibility, print fidelity)
- **Density tolerance:** very low — 4–6 panels, hero KPI prominent, narrative arc top-to-bottom
- **Criticality:** narrative, not action

Design implications:
- The dashboard IS the slide. It must read at projection scale (4ft+ throw distance).
- One opinion per panel. No exploratory facets, no faceted small multiples.
- Color used sparingly for emphasis; near-monochrome by default.
- Captions and editorial markdown carry the story between numbers.

### Investigator Priya — analytical deep-dive

- **Audience:** fraud / SOC investigator, data analyst, threat hunter
- **Viewing context:** dual 27" monitors, hours per session, frequent pivots between filters and views
- **Time budget:** open-ended exploration — minutes to hours
- **Decision consequence:** investigation outcomes (case open/close, indictment-grade evidence)
- **Lighting:** office daylight or dim analyst environment, sustained sessions
- **Maps to archetype:** analytical deep-dive
- **Theme bias:** dark for long sessions (eye fatigue mitigation)
- **Density tolerance:** very high — many filters, tables, correlation charts, raw-event drawer
- **Criticality:** deliberate, slow; not pager territory

Design implications:
- Filter controls are first-class citizens — multi-select, time range with relative+absolute, tokenised.
- Drilldowns capture context (clicked entity, time window) and pass to deeper views.
- Tables expose every relevant field; column visibility user-toggleable.
- Color used for category identity (per-actor, per-entity), not status.

### Field Tech Rohan — phone on-call

- **Audience:** field service technician, on-site operator
- **Viewing context:** phone screen, often outdoors, on-call, gloved hands, intermittent signal
- **Time budget:** 10–30 seconds per check while on a job
- **Decision consequence:** on-site triage and dispatch — replace this part now, escalate, move to next ticket
- **Lighting:** highly variable (sun glare, rain, dim site, vehicle interior)
- **Maps to archetype:** simplified operational
- **Theme bias:** light (sun-glare resistance, high contrast against varied backgrounds)
- **Density tolerance:** very low — 3–5 panels, single column, generous tap targets
- **Criticality:** field action

Design implications:
- Single-column layout, no horizontal scroll, no tiny inputs.
- One action per screen. Either "what is the status" or "what should I do next" — not both at once.
- Touch targets 44pt+ minimum. No hover affordances.
- Status text spelled out, not abbreviated. Color reinforces, never carries the meaning alone.

### Platform Engineer Devin — internal service health

- **Audience:** SRE / platform engineer owning a fleet of internal services
- **Viewing context:** 27" monitor mixed with terminal windows, IDE, Slack; dashboard is one tab among many
- **Time budget:** 30-second checks during incident response; 2–5 minute scans during weekly reviews
- **Decision consequence:** roll back a deploy, page a service owner, open a Jira, accept the risk
- **Lighting:** office daylight or home-office daylight, sustained
- **Maps to archetype:** operational monitoring
- **Theme bias:** dark (matches IDE/terminal palette, lower context-switch cost)
- **Density tolerance:** medium-high — 8–12 panels grouped by service or SLO
- **Criticality:** mostly self-serve; pager only on declared incident

Design implications:
- SLO/error-budget panels are first-class — burn rate, remaining budget, time-to-exhaustion.
- Service identity expressed through a stable categorical palette, not status colors.
- Drilldowns to logs and traces (URL drilldown to Splunk search or external APM) are expected.
- Time-range selector defaults to "last 4 hours" or "last 1 day" — not "now" and not "last 7 days".

### Compliance Officer Yuki — audit-window read

- **Audience:** compliance, GRC, internal audit
- **Viewing context:** desk monitor in office, occasional printed export for audit binders
- **Time budget:** 10–30 minutes during a control review; daily 2-minute spot-check during audit windows
- **Decision consequence:** evidence of control operation, attestation language, audit finding open or closed
- **Lighting:** office daylight, sometimes printed page
- **Maps to archetype:** executive summary (control-status flavor)
- **Theme bias:** light (printable, audit-binder fidelity, screenshot-friendly)
- **Density tolerance:** low-medium — 6–10 panels, control-by-control or framework-by-framework
- **Criticality:** narrative + evidence; not pager territory but high-stakes timestamp accuracy

Design implications:
- Every panel needs an unambiguous as-of timestamp and source-of-record citation.
- Status colors map to compliant / non-compliant / not-applicable — three states, not five.
- Tables expose framework, control ID, owner, last-tested date — these are the audit-binder fields.
- Drilldowns go to evidence (specific events, ticket IDs) — auditors click through.

## Persona-to-archetype reference

| Persona | Archetype | Theme | Density | Criticality |
|---|---|---|---|---|
| CISO Sarah | executive summary | light | low | quarterly |
| SOC Alex | SOC overview | dark | high | pager |
| NOC Jordan | operational monitoring | dark-NOC | very high | ambient + escalate |
| Sales VP Maria | executive summary | light | very low | narrative |
| Investigator Priya | analytical deep-dive | dark | very high | deliberate |
| Field Tech Rohan | simplified ops | light | very low | field action |
| Platform Eng Devin | operational monitoring | dark | medium-high | self-serve + incident |
| Compliance Officer Yuki | executive (controls) | light | low-medium | audit + attestation |

## When the user names a NEW persona

If the user supplies an audience that does not match any pre-defined persona above, `ds-couture` extracts the same five attributes by direct questioning, then routes downstream from there:

1. **Viewing context** — what device, what screen size, what viewing distance, indoor or outdoor, light or dim?
2. **Time budget** — seconds per glance, or minutes per session, or open-ended?
3. **Decision consequence** — what happens after they read a value? Pager? Board slide? Case closed? Field action?
4. **Lighting** — sustained dim, sustained bright, variable, projector?
5. **Maps-to archetype** — once the four above are known, which of the canonical archetypes (executive summary, operational monitoring, analytical deep-dive, SOC overview, simplified ops) is the closest match?

Once these five are pinned down, the new persona behaves identically to a pre-defined one for downstream theme, density, and criticality decisions. Optionally name the new persona inline in the workspace plan so subsequent skills (`ds-ref-archetypes`, `ds-ref-color`, `ds-ref-typography`) can refer back to the same identity.
