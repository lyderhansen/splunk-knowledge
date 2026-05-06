---
name: ds-ref-anti-patterns
description: AI-slop and anti-pattern catalog for Splunk Dashboard Studio — the reflex defaults to refuse (uniform-color KPI rows, default Splunk grey canvas, 7-slice pies, rainbow on ordered severity), absolute bans (status colors as series colors, red/green sole differentiator, unbounded searches, defaultless inputs), and the Splunk Dashboard Slop Test (13-item quality gate). Use when reviewing for slop, when ds-critique is scoring, or when ds-polish is applying corrective fixes.
---

# ds-ref-anti-patterns — AI-slop and anti-pattern catalog

> **Status:** skeleton only. Body extracted from `ds-ref-design-principles` in a follow-up task.

## Scope (what's IN)

- 8 reflex defaults to reject (DETECT / WHY / REWRITE format).
- 5 absolute bans (BAN / PATTERN / WHY / REWRITE format).
- The Splunk Dashboard Slop Test (13-item quality gate).
- Archetype-conditional anti-pattern matrix (some patterns OK on SOC wall, slop on exec).

## Out of scope (what's NOT here)

- Auto-fix actions — see `ds-polish`.
- Scoring against criteria — see `ds-critique`.
- Color-specific rules — see `ds-ref-color` (referenced from this skill, not duplicated).

## Consults

- `ds-ref-color` (for color-specific bans).
- `ds-ref-archetypes` (for archetype-conditional patterns).

## Consulted by

- `ds-couture` (slop refusal mid-design).
- `ds-critique` (scorecard).
- `ds-polish` (fix catalog source).

## Source / migration

- Extracted from: `ds-ref-design-principles` "Reflex defaults to reject", "Absolute bans", "The Splunk Dashboard Slop Test" sections (most of the Phase 1 impeccable-style additions).
- New content: archetype-conditional anti-pattern matrix.

## Estimated size

L

---

## Reflex defaults to reject

These are the eight default outputs Claude (or any generative tool)
reaches for when given a Splunk dashboard task without enough context.
Each one is a tell — the moment one appears, the dashboard reads as
"AI made this". Refuse them on first draft, not on review.

| # | Reflex | Why bad | Rewrite |
|---|---|---|---|
| 1 | **Uniform-colour KPI row** — all `majorColor: #006D9C`. | Loses semantic polarity; everything reads "neutral". | Classify each KPI's polarity. Use DOS threshold-colouring for status; static `#006D9C` only for true counts. |
| 2 | **Uniform-size KPI row** — flat hierarchy. | Eye has no anchor. | One anchor KPI hero-sized (≥ 1.5× others). For SOC/analytical, rank by criticality. |
| 3 | **Default Splunk canvas** — no `backgroundColor` set. | Signals untouched AI output. | Always set `layout.options.backgroundColor` per archetype. |
| 4 | **"4 KPIs + 1 line + 1 table" autotemplate** — same composition regardless of archetype. | Fine for exec summary, wrong for everything else. | Archetype drives layout. SOC = geo + timeline + severity. Analytical = filter bar + scatter + multi-series + detail table. |
| 5 | **Rainbow on ordered data** — severity as red/orange/yellow/green/blue/purple. | "Different kinds" not "more or less". | Sequential single-hue gradient (red → amber for severity). |
| 6 | **Tables without drilldown** — `splunk.table` with no event handler. | Dead end. | Every table links to detail / sets a token / opens a search. |
| 7 | **Raw `_time`** in tables. | Operators can't read epoch / ISO at a glance. | `\| eval _time=strftime(_time, "%Y-%m-%d %H:%M:%S")` in SPL. |
| 8 | **Pie by default for breakdown** — `splunk.pie` regardless of cardinality. | Pie >6 slices unreadable. | `splunk.bar` (sorted), or `splunk.pie` ONLY if ≤6 categories AND one dominates. |

## Absolute bans

Never acceptable on any archetype, theme, or audience. These are not
"usually wrong" — they are wrong in 100% of cases observed in
production Splunk deployments.

| # | Pattern | Why | Rewrite |
|---|---|---|---|
| 1 | **Status colours as series colours** — `#DC4E41` etc. in `seriesColors`. | Operator muscle memory. Green line in time series reads as "OK" even when crashing. | Use `SERIES_CATEGORICAL_10` or `SERIES_STUDIO_20`. Reserve semantic palette for `majorColor` only. |
| 2 | **Red/green as sole differentiator** — colour-only pass/fail. | ~8% of men colourblind. Excludes them entirely. | `splunk.singlevalueicon` (icon + colour). For tables, severity label column. |
| 3 | **Pie >6 slices** — slice angles indistinguishable. | Pie fails its job. | `splunk.bar` (horizontal sorted). Aggregate to Top 5 + "Other" upstream. |
| 4 | **Searches without `earliest` / `latest`** — full-index scans. | Single dashboard with 5 unbounded searches saturates indexer. | Bind `defaults.dataSources.ds.search.options.queryParameters.earliest` to `$global_time.earliest$`. |
| 5 | **Inputs without `defaultValue`** — empty render. | User assumes dashboard broken. | Always set `defaultValue` (`"*"` for open filters). |
| 6 | **Solid-color banner** — flat single-color rectangle as header. | Screams "AI-generated" and "PowerPoint 2010." Zero design value. | Gradient (2-3 stops), image banner, or no banner at all. |
| 7 | **50/50 symmetric panels** — left and right columns identical width. | No visual hierarchy, feels like a spreadsheet. | 60/40 or 70/30 asymmetry. One side is primary. |
| 8 | **Uniform spacing** — every gap identical (16px everywhere). | Mechanical, not designed. No visual grouping. | 8px within groups, 24-32px between sections, 48px+ between zones. |

## The Splunk Dashboard Slop Test

> *If I showed this dashboard to an SRE, a SOC analyst, or a VP of
> Engineering and said "an AI made this" — would they nod without
> hesitation?*

If yes, the dashboard has failed. A well-made Splunk dashboard makes
an operator ask "who built this?" not "which model generated this?"

Run before completion. A single NO means rewrite:

- [ ] Archetype committed (one of four).
- [ ] Theme derived from audience (NOC=dark, exec PDF=light).
- [ ] Canvas `backgroundColor` set explicitly.
- [ ] KPI row has semantic polarity (status ≠ informational).
- [ ] KPI row has visual hierarchy (anchor KPI hero-sized).
- [ ] Every table has a drilldown.
- [ ] Every input has a `defaultValue`.
- [ ] Every search is time-bounded.
- [ ] Series colours from categorical palette (semantic never leaks).
- [ ] Colour paired with icon / label / shape.
- [ ] Pie ≤6 slices (or replaced with bar).
- [ ] Panel titles ≤40 chars, Title Case.
- [ ] Depth from layered rectangles where archetype calls for them.

## Archetype-conditional anti-patterns

Not every anti-pattern is universally slop. Some patterns that read as
lazy AI output on an executive summary are *intentional* on a SOC wall
display, where density and at-a-glance status colour matter more than
elegance. Use this matrix to decide whether a pattern in front of you
is a problem in *this* archetype.

Cell values:
- `slop` — refuse it; dashboard fails Slop Test.
- `OK` — acceptable in this archetype, sometimes preferred.
- `BAN` — absolute ban, rewrite regardless of archetype.

| Anti-pattern | Exec | Operational | Analytical | SOC |
|---|---|---|---|---|
| Uniform-colour KPI row (all `#006D9C`) | slop | slop | slop | OK |
| Uniform-size KPI row (no hero anchor) | slop | slop | slop | OK |
| All-caps panel titles | slop | slop | slop | OK |
| No `backgroundColor` set on canvas | slop | slop | slop | slop |
| >12 panels on one tab | slop | slop | OK | OK |
| Pie chart with >6 slices | BAN | BAN | BAN | BAN |
| Status colours in `seriesColors` | BAN | BAN | BAN | BAN |
| Red/green as sole pass/fail signal | BAN | BAN | BAN | BAN |
| Searches without `earliest`/`latest` | BAN | BAN | BAN | BAN |
| Inputs without `defaultValue` | BAN | BAN | BAN | BAN |
| Dense 12+ panel grid (no whitespace zones) | slop | OK | OK | OK |
| Saturated reds across multiple panels | slop | slop | slop | OK |
| Tables without drilldown | slop | slop | slop | slop |
| Sparkline-only KPIs (no major value) | slop | OK | OK | OK |
| Generic "Dashboard" / "Overview" titles | slop | slop | slop | slop |
| Identical viz type across all panels | slop | slop | OK | slop |
| Default categorical palette on ordered data | slop | slop | slop | slop |
| Mixed dark/light theme on one canvas | slop | slop | slop | slop |

### Why some patterns are OK on SOC and slop on exec

**Uniform-colour KPI row.** On an exec summary, every KPI is a
distinct business question (revenue, churn, NPS, latency) and each
demands its own polarity reading. Uniform colour erases that. On a
SOC wall, the KPI row is often a single concept — *threats by
severity* or *open incidents by tier* — where the row reads as a
unified scoreboard and per-cell semantic colour would over-signal.

**All-caps panel titles.** On an exec summary all-caps reads as
shouting and undermines the calm-deliberate tone leadership expects.
On a 100-foot SOC wall, all-caps survives the viewing distance where
sentence-case becomes illegible. Wall typography rules differ from
laptop typography rules.

**Dense 12+ panel grid.** Exec summaries demand whitespace zones
because the audience scans for one calm story; dense panels overwhelm
a 90-second viewing. Operational and SOC dashboards live in front of
operators all shift; density is a feature because parallel signals
are the work.

**Sparkline-only KPIs.** Exec audiences want the major value
front-and-centre with one number that travels into a slide deck.
Operators already know the absolute scale of latency or queue depth
and care about the trend; a clean sparkline strip uses less canvas
than a row of large KPIs.

**Identical viz type across all panels.** On an analytical deep-dive
this is sometimes deliberate — a wall of small-multiples
`splunk.line` charts where each panel is one cohort, all axes shared.
On every other archetype, a wall of identical viz suggests the author
ran out of ideas.

**Saturated reds across multiple panels.** SOC overviews are designed
around severity at a glance and the canvas tolerates more red because
red *is* the data. On exec or analytical, multiple saturated reds
read as "everything is on fire" even when only one panel is genuinely
critical.

### When `BAN` overrides archetype

The five rows marked `BAN` are non-negotiable. A SOC analyst is *more*
likely to be colourblind-affected by a red/green-only pass/fail than
an exec, because they stare at the wall for 8h shifts. A SOC wall
dashboard is *more* expensive to run unbounded than an exec dashboard
because it refreshes every 30 seconds. Archetype permissiveness
applies to taste choices (density, colour uniformity, type case).
It never applies to correctness or accessibility.

### How `slop`-but-tolerated rows interact with the Slop Test

The 13-item Slop Test above runs against every dashboard regardless of
archetype. The matrix is the layer beneath: when a Slop Test item
("KPI row has visual hierarchy") fires on a SOC dashboard, consult
this matrix first. If the cell is `OK`, the Slop Test item passes
because the archetype tolerates the pattern. If the cell is `slop`
or `BAN`, the dashboard rewrites.
