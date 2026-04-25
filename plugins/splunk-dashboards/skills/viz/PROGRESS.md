# Viz-skill progress tracker

Single source of truth for the viz-by-viz refactor. Each viz goes through the
same pipeline; we don't move on until every column for that row is ✅.

## Pipeline per viz

For each `splunk.<viz>`:

1. **Read PDF** — find the options table for this viz in
   `docs/SplunkCloud-10.4.2604-DashStudio.txt`. Note any options unique to this
   viz, default values, and gotchas.
2. **Test dashboard (dark)** — write a 12-panel option matrix in
   `skills/viz/ds-viz-<viz>/test-dashboard/dashboard.json`. SPL must be
   `makeresults`-based so it runs anywhere.
3. **Test dashboard (light)** — produce a light-theme variant with a remapped
   palette: `dashboard-light.json`.
4. **Validate** — run `splunk_dashboards.validate.check_all` on both. Errors
   must be zero.
5. **Deploy** — push both to the `splunk-knowledge-testing` app as
   `ds_viz_<viz>_dark` and `ds_viz_<viz>_light`.
6. **Visual QA** — run through the QA checklist below in Splunk for both
   themes. Capture any options that don't behave as the PDF claims.
7. **SKILL.md** — write the skill from verified evidence only. Cross-reference
   the 10.4 PDF section.
8. **Commit + push** — atomic commit per viz.

## QA checklist (run for every dashboard, both themes)

For each panel in the deployed dashboard:

- [ ] Panel renders without "Search returned no results" or schema warnings
- [ ] Title and description are visible (or hidden where intentional)
- [ ] Axis convention applied: `*TitleVisibility:"hide"`,
      `*LabelVisibility:"auto"`, `*MajorTickVisibility:"hide"`
- [ ] Series colours match the panel's palette intent (no fallback rainbow)
- [ ] Stack mode behaves as documented (auto / stacked / stacked100 produce
      visibly different shapes)
- [ ] Legend position renders where requested (or is hidden)
- [ ] Annotations appear at the right x-value with the right colour and label
- [ ] Dual-axis panels show two distinct y-axes with sensible ranges
- [ ] Split-series panels produce one sub-chart per series, not stacked
- [ ] Sparkline / sparkbar / hidden-chrome panels actually hide all chrome
- [ ] Light theme is readable (no white-on-white, no grey-on-grey)
- [ ] Dark theme is readable (no near-black-on-black, contrast OK)
- [ ] No panel scrolls vertically when the layout intends it not to
- [ ] No panel overflows or clips its content
- [ ] Tooltips on hover show the right field names and values

If any item fails, capture the panel name and failure mode in the notes column
of the matrix below before moving on.

## Master matrix

Legend: ✅ done · 🟡 in progress · ⬜ not started · ❌ blocked / known issue

| # | Viz                       | PDF read | Dark JSON | Light JSON | Validated | Deployed | QA dark | QA light | SKILL.md | Notes |
|---|---------------------------|----------|-----------|------------|-----------|----------|---------|----------|----------|-------|
| 1 | `splunk.line`             | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | Reference implementation. |
| 2 | `splunk.area`             | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ⬜       | Awaiting QA. |
| 3 | `splunk.column`           | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ⬜       | Awaiting QA. |
| 4 | `splunk.bar`              | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ⬜       | Awaiting QA. annotation* options listed in PDF text but not in option table — omitted from test bench. |
| 5 | `splunk.pie`              | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 6 | `splunk.scatter`          | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 7 | `splunk.bubble`           | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 8 | `splunk.singlevalue`      | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 9 | `splunk.singlevalueicon`  | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 10 | `splunk.singlevalueradial` | ⬜      | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 11 | `splunk.markergauge`      | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | gaugeRanges syntax verified in ceo_boardroom (#D41F1F / #CBA700 / #4fa484). |
| 12 | `splunk.fillergauge`      | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 13 | `splunk.table`            | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | showInternalFields:false convention verified. tableFormat / columnFormat patterns covered. |
| 14 | `splunk.events`           | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 15 | `splunk.timeline`         | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 16 | `splunk.punchcard`        | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 17 | `splunk.parallelcoordinates` | ⬜    | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 18 | `splunk.sankey`           | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 19 | `splunk.linkgraph`        | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 20 | `splunk.map`              | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | Known broken in ceo_boardroom — investigate. |
| 21 | `splunk.choropleth.svg`   | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 22 | `splunk.choropleth.map`   | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | Confirm if this type id is actually accepted by 10.2.1 (was rejected earlier). |
| 23 | `splunk.markdown`         | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | fontSize is a string enum (not int) — verified. |
| 24 | `splunk.image`            | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 25 | `splunk.rectangle`        | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |
| 26 | `splunk.ellipse`          | ⬜       | ⬜        | ⬜         | ⬜        | ⬜       | ⬜      | ⬜       | ⬜       | |

## Suggested order

Group by category so we build up a mental model viz-family at a time, instead
of jumping around.

**Charts (already started):**
1. line ✅ → 2. area 🟡 → 3. column 🟡 → 4. bar 🟡 → 5. pie

**Single-value family:**
6. singlevalue → 7. singlevalueicon → 8. singlevalueradial →
9. markergauge → 10. fillergauge

**Tabular / event:**
11. table → 12. events → 13. timeline

**Distribution / correlation:**
14. scatter → 15. bubble → 16. punchcard → 17. parallelcoordinates

**Flow / network:**
18. sankey → 19. linkgraph

**Static / shape (minimal options):**
20. markdown → 21. image → 22. rectangle → 23. ellipse

**Geo (last — most likely to have rendering issues):**
24. map → 25. choropleth.svg → 26. choropleth.map

## Cross-cutting notes

Things that apply across all viz and should land in the design-principles
skill (or its successor) once we've verified them on enough viz:

- Axis convention: hide title, auto labels, hide major ticks
- `showInternalFields: false` for table-shaped data
- `enableSmartSources: true` for token-driven dataSources
- DOS (Dynamic Options Syntax) for conditional colours on every viz that
  supports `seriesColors` / `dataValues` / `tableFormat`
- Per the user: dashboards SHOULD ship in dark + light variants by default
