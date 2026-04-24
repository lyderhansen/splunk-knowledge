---
name: ds-critique
description: Use this skill to run the Splunk Dashboard Slop Test against an existing dashboard.json or dashboard.xml and write critique.md with a blunt verdict (PASS / MIXED / SLOP) and a per-criterion scorecard. Narrower and more opinionated than ds-review — it only checks the design-principles Slop Test, reflex defaults, and absolute bans. Use when the user asks "is this dashboard AI slop?", "does this pass the Slop Test?", or wants a design-principles-only audit before ds-polish.
---

# ds-critique — Run the Slop Test against a dashboard

## When to use

- The user asks: *"is this dashboard AI slop?"*, *"does this pass the Slop Test?"*, *"critique this dashboard"*.
- Before `ds-polish` — to get a verdict on how much work polish will have to do.
- After `ds-create` on a dashboard you suspect hit a template default — to confirm the suspicion before changing anything.

## The stance

This skill does not review accessibility, performance, or schema correctness. It answers one question:

> *If someone said "an AI made this" — would an SRE, SOC analyst, or VP believe them immediately?*

If yes → the dashboard is slop, and the report says so in those words. No euphemism, no diplomatic hedging. The design principles in `ds-design-principles` are the scoring rubric.

## How ds-critique differs from ds-review and ds-polish

Three skills operate on an existing dashboard. They are not interchangeable:

| Skill | Lens | Mutates? | Output |
|---|---|---|---|
| `ds-review` | Broad audit — panel count, viz appropriateness, drilldowns, tokens, accessibility, SPL perf | No | `review.md` (findings, fixes suggested) |
| `ds-critique` | Narrow — Slop Test, reflex defaults, absolute bans | No | `critique.md` (verdict + scorecard) |
| `ds-polish` | Narrow — same rubric as critique, but applies fixes | Yes | mutated dashboard + `polish-report.md` |

**Typical routing**:
- User asks *"is this good?"* → `ds-review` (general audit).
- User asks *"is this AI slop?"* → `ds-critique` (Slop Test only).
- User says *"fix it"* or *"apply design principles"* → `ds-polish`.

`ds-critique` and `ds-polish` share the same rubric — both are derived from `ds-design-principles`. Critique is the read-only variant; polish is the write variant.

## Input / output contract

**Input** (one of):
- A workspace path containing `build/dashboard.json`.
- A direct file path to `dashboard.json` or `dashboard.xml`.

**Output**:
- `critique.md` written alongside the dashboard (or in the workspace root if inside a workspace).
- No mutation of the dashboard.
- A one-line verdict echoed to the user: `Verdict: SLOP (4/13 passed).`

## Required context

Critique is interpretive. Before scoring, confirm:

1. **Archetype** — a dashboard criticised for "no hero KPI" must be one where a hero is expected. Exec summaries expect heroes; dense NOC grids do not.
2. **Theme** — several criteria depend on whether the dashboard is dark, dark-NOC, or light.

If either is unknown, ask the user before running the scorecard. Do not guess — guessing produces a dishonest verdict.

## What ds-critique scores

See sections below.

---

## The scorecard

Each criterion produces one of three outcomes:

- **PASS** — evidence is present and correct.
- **FAIL** — evidence is absent or wrong. Cite what's broken.
- **N/A** — criterion does not apply to this archetype (e.g., hero KPI criterion on a dense NOC grid).

### Check 1: Archetype committed

- **DETECT**: Layout matches one of the four archetypes in `ds-design-principles` (executive summary, operational, analytical, SOC). A dashboard that mixes KPI-heavy exec layout with a detail table AND a geographic SOC map AND a correlation scatter is *uncommitted*.
- **EVIDENCE**: Panel count, viz-type mix, panel proportions. Match against archetype fingerprint.
- **VERDICT**: PASS if the panel mix matches a single archetype. FAIL if it reads as two archetypes fighting.

### Check 2: Theme derived from audience

- **DETECT**: `layout.options.backgroundColor` matches the theme expected from the audience (dark for ops/SOC/analytical, light for executive print/PDF, dark-NOC for 24/7 wall).
- **EVIDENCE**: Background hex value. Cross-reference with the archetype declared in Check 1.
- **VERDICT**: PASS if theme and archetype align. FAIL if light canvas on a NOC dashboard, or dark canvas on an exec PDF.

### Check 3: Canvas `backgroundColor` set

- **DETECT**: `layout.options.backgroundColor` is present AND is not the Splunk default grey (`#EDEDF4`, `#F4F4F4`, or absent).
- **EVIDENCE**: The exact hex value, or "absent".
- **VERDICT**: PASS if set to one of `#0b0c0e`, `#000000`, `#FAFAF7`, or a deliberate brand color. FAIL if absent, default, or generic.

### Check 4: KPI row has semantic polarity

- **DETECT**: For each `splunk.singlevalue` in a KPI row, `majorColor` is either (a) threshold-colored via DOS, or (b) a semantic-palette static hex chosen from the polarity rules in `ds-design-principles`.
- **EVIDENCE**: Per-KPI `majorColor` values. List them.
- **VERDICT**: PASS if polarity is applied to status metrics. FAIL if every KPI shares the same static color (classic `#006D9C` tell).

### Check 5: KPI row has visual hierarchy

- **DETECT**: Not every KPI in a row has identical `w` × `h`. One anchor KPI is visibly larger (≥ 1.5×) OR the row uses deliberately uniform sizing because the archetype demands it (NOC status grid).
- **EVIDENCE**: List panel dimensions. Note whether the archetype justifies uniformity.
- **VERDICT**: PASS if an anchor exists, or if uniform sizing fits the archetype (N/A applies here). FAIL if uniform-by-default on an archetype that expects hierarchy.

### Check 6: Every table has a drilldown

- **DETECT**: Every `splunk.table` has either `drilldown.link`, `drilldown.setToken`, or a custom action.
- **EVIDENCE**: Per-table drilldown status.
- **VERDICT**: PASS if all tables link out. FAIL on any dead-end table.

### Check 7: Every input has a default value

- **DETECT**: Every `input` of type `dropdown`, `multiselect`, or `text` has `options.defaultValue`, OR the bound token has a `default`.
- **EVIDENCE**: Per-input default status.
- **VERDICT**: PASS if every input resolves on first load. FAIL on any input that would render the dashboard empty.

### Check 8: Every search is time-bounded

- **DETECT**: Every `ds.search` has `earliest=` AND `latest=` in its `query`, OR binds `options.queryParameters.earliest` / `latest` to the global time token.
- **EVIDENCE**: Per-search time-binding status.
- **VERDICT**: PASS if every search is bounded. FAIL on any unbounded query — this is an absolute ban.

### Check 9: Series colors come from a categorical palette

- **DETECT**: Chart `seriesColors` or `chart.seriesColorsByField` values do NOT include any of the reserved semantic hexes: `#DC4E41`, `#F1813F`, `#F8BE34`, `#53A051`, `#006D9C` (when used in a non-status chart context).
- **EVIDENCE**: Per-chart series color list. Highlight reserved hexes that appear.
- **VERDICT**: PASS if semantic colors are reserved for status. FAIL on any leak — a green data series in a non-status chart is the classic tell.

### Check 10: Color is paired with icon / label / shape

- **DETECT**: For every status-colored element (red/green KPIs, severity-colored rows), there is a paired icon (`splunk.singlevalueicon`), text label column, or shape change.
- **EVIDENCE**: Per-status-element pairing status.
- **VERDICT**: PASS if every status signal has a non-color backup. FAIL on any color-only status differentiator — this is an absolute ban.

### Check 11: Pie charts have ≤ 6 slices

- **DETECT**: Every `splunk.pie` bound to SPL that produces ≤ 6 rows, OR the SPL contains a `| head 6` / Top-N aggregation, OR the chart has a deliberate slice-count limit.
- **EVIDENCE**: Per-pie row count.
- **VERDICT**: PASS if all pies ≤ 6 slices. FAIL on any pie exceeding — absolute ban.

### Check 12: Panel titles are ≤ 40 characters, title case

- **DETECT**: Every panel's `title` is ≤ 40 chars AND uses title case (not `snake_case_field_names`, not sentence-long descriptions).
- **EVIDENCE**: Per-panel title length + case check.
- **VERDICT**: PASS if all titles are concise and title-case. FAIL on any paragraph-title or raw field-name title.

### Check 13: Depth comes from layered rectangles

- **DETECT**: If the archetype calls for KPI card backgrounds or zone backgrounds (exec summary, operational, SOC), at least one `splunk.rectangle` is present in `layout.structure` to provide the layering.
- **EVIDENCE**: Rectangle count, placement (before or after KPI panels in the array).
- **VERDICT**: PASS if depth is present where the archetype expects it. N/A for dense-grid archetypes that do not use cards. FAIL if exec/ops/SOC dashboard has zero rectangles and KPIs float on the canvas.
