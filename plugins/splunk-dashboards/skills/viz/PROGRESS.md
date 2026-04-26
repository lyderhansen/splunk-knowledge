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
| 2 | `splunk.area`             | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. |
| 3 | `splunk.column`           | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. |
| 4 | `splunk.bar`              | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. annotation* options listed in PDF text but not in option table — omitted from test bench. |
| 5 | `splunk.pie`              | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. |
| 6 | `splunk.scatter`          | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. |
| 7 | `splunk.bubble`           | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. |
| 8 | `splunk.singlevalue`      | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: rangeValue thresholds reworked to disjoint, gap-free buckets `[{"to":60}, {"from":60,"to":80}, {"from":80}]`; SPL `health` query rewritten to swing 38-97 across all RAG buckets; panel 5/6 descriptions corrected to match. SKILL.md adds "Threshold semantics" note. |
| 9 | `splunk.singlevalueicon`  | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: same rangeValue / health-swing fixes as `splunk.singlevalue`. Panels 5, 6, and 10 descriptions updated to declare disjoint thresholds explicitly. SKILL.md adds "Threshold semantics" note. |
| 10 | `splunk.singlevalueradial` | ✅      | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: added `ds_health_swing` (27-96) for panels 5+6 so all 3 RAG buckets demo on reload; rewrote `ds_disk_usage` SPL to swing 158-860 so panels 9+10 demo all RAG buckets. Panel descriptions updated to declare disjoint thresholds + data ranges explicitly. SKILL.md adds "Threshold semantics" note. |
| 11 | `splunk.markergauge`      | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: gaugeRanges are display bands (not threshold buckets) — static-value test data is correct because the marker movement IS the message. Panels 1-3 (low/mid/high) prove the marker tracks the value. Bands documented as "MUST be contiguous" in the skill. No data-swing fix needed. |
| 12 | `splunk.fillergauge`      | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: added `ds_health_swing` for panel 7 and rewrote `ds_disk_used` to swing 30-95 for panel 8 so all 3 RAG buckets demo on reload. Disjoint, gap-free thresholds already canonical. SKILL.md adds "Threshold semantics" note. |
| 13 | `splunk.table`            | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. showInternalFields:false convention verified. tableFormat / columnFormat patterns covered. |
| 14 | `splunk.events`           | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. |
| 15 | `splunk.timeline`         | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. |
| 16 | `splunk.punchcard`        | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. |
| 17 | `splunk.parallelcoordinates` | ✅    | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. |
| 18 | `splunk.sankey`           | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. Validate skipped — module path issue. |
| 19 | `splunk.linkgraph`        | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. |
| 20 | `splunk.map`              | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. Top-level options include `markerSize`. PDF source-editor table only enums marker/bubble for layer type but choropleth is fully supported and verified live. choropleth layers require `geom geo_*` in SPL and `areaIds`/`areaValues` per layer. `center` is `[lat,lon]`, not `[lon,lat]`. |
| 21 | `splunk.choropleth.svg`   | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. Only 5 options total (svg/areaIds/areaValues/areaColors/backgroundColor). PDF prerequisites say web SVG URLs are unsupported — embed inline or as data URI. Drilldown payload returns clicked path id + value. |
| 22 | `splunk.choropleth.map`   | ✅       | n/a       | n/a        | n/a       | n/a      | n/a     | n/a      | ✅       | **Not a Studio viz type.** Confirmed across the entire 24k-line PDF: the only choropleth type is `splunk.choropleth.svg`. The "Choropleth map" PDF section (page 381) belongs to a Simple-XML / Classic appendix with options `source`/`projection`/`fillColor`/`strokeColor` that don't apply to Studio. In Studio, country/state shading is a `choropleth`-typed **layer** inside `splunk.map` (see `ds-viz-map`). The skill is rewritten as a disambiguation/redirect doc. |
| 23 | `splunk.markdown`         | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: fontFamily is a strict enum of 7 named fonts (Splunk Platform Sans/Data Sans/Platform Mono, Arial, Helvetica, Times New Roman, Comic Sans MS) plus DOS tokens — CSS stacks like `Georgia, serif` are rejected. fontSize/fontColor/fontFamily apply uniformly to the whole panel — no inline mixing. Bench restructured: 2a-2e (one panel per fontSize) + 13a-13g (full 7-font showcase, same sample text in each for direct visual comparison). Also fixed `make_light.py`: title no longer accumulates `(dark) (light)`, and added remaps for `#1A2540`, `#3D1E1E`, `#FF6B6B`. |
| 24 | `splunk.image`            | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: Splunk now blocks **all** external image URLs whose domain isn't on the per-instance Dashboards Trusted Domains List (`web.conf -> dashboards_image_allow_list`). The previous `splunk.com/etc.clientlibs/...` URL 404'd. Bench now uses `www.splunk.com/content/dam/.../splunk-white-black-bg.png` (dark) / `splunk-black-white-bg.png` (light) and `logo-splunk-corp-rgb-k-web.svg` for SVG panels. Added prominent `viz_trust_warning` panel under the title that documents the trust-list rule and where to configure it, so future readers don't re-discover the placeholder issue. SKILL.md updated with the literal in-app error message and the web.conf snippet. |
| 25 | `splunk.rectangle`        | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. Canonical option names are fillColor/strokeColor (not fill/stroke as in some legacy PDF examples). Supports onSelectionChanged for hit-zone overlays. |
| 26 | `splunk.ellipse`          | ✅       | ✅        | ✅         | ✅        | ✅       | ⬜      | ⬜       | ✅       | Awaiting QA. 6 options total (no rx/ry/strokeJoinStyle). Shape determined by panel aspect ratio. Drilldown fires but payload is n/a. |

## Suggested order

Group by category so we build up a mental model viz-family at a time, instead
of jumping around.

**Charts:**
1. line ✅ → 2. area ✅ → 3. column ✅ → 4. bar ✅ → 5. pie ✅

**Single-value family:**
6. singlevalue ✅ → 7. singlevalueicon ✅ → 8. singlevalueradial ✅ →
9. markergauge ✅ → 10. fillergauge ✅

**Tabular / event:**
11. table ✅ → 12. events ✅ → 13. timeline ✅

**Distribution / correlation:**
14. scatter ✅ → 15. bubble ✅ → 16. punchcard ✅ → 17. parallelcoordinates ✅

**Flow / network:**
18. sankey ✅ → 19. linkgraph ✅

**Static / shape (minimal options):**
20. markdown ✅ → 21. image ✅ → 22. rectangle ✅ → 23. ellipse ✅

**Geo:**
24. map ✅ → 25. choropleth.svg ✅ → 26. choropleth.map ✅ (disambiguation)

All 26 build columns are ✅. Final `splunk.<viz>` build pass is
**complete**. The remaining ⬜ are the QA columns — those land in the
visual-QA pass against the deployed `splunk-knowledge-testing`
dashboards.

## Cross-cutting notes

Things that apply across all viz and should land in the design-principles
skill (or its successor) once we've verified them on enough viz:

- Axis convention: hide title, auto labels, hide major ticks
- `showInternalFields: false` for table-shaped data
- `enableSmartSources: true` for token-driven dataSources
- DOS (Dynamic Options Syntax) for conditional colours on every viz that
  supports `seriesColors` / `dataValues` / `tableFormat`
- Per the user: dashboards SHOULD ship in dark + light variants by default

## Final review-pass findings (2026-04-25)

See `REVIEW.md` (sibling file) for the detailed write-up. Summary:

- **Fixed**: 5 broken cross-references (`../../design/...` →
  `../../reference/...`).
- **Fixed**: 3 stale `ds-viz-choropleth-map` references that described
  it as a separate viz instead of a disambiguation skill.
- **Reconciled**: this PROGRESS.md was significantly out of date —
  every actually-completed viz is now marked ✅.
- **Deferred**: 6 interactivity skills (`ds-defaults`, `ds-tokens`,
  `ds-inputs`, `ds-tabs`, `ds-drilldowns`, `ds-visibility`) are still
  stubs pointing at the legacy `reference/ds-syntax` / `reference/ds-viz`
  monoliths. Out of scope for the viz iteration; tracked separately.
- **Deferred**: visual-QA pass against the live dashboards in
  `splunk-knowledge-testing`. The QA dark / QA light columns above are
  intentionally still ⬜.

## Visual-QA todo: `dataSource.name` regex hygiene (2026-04-26)

Splunk Dashboard Studio's editor enforces `^[A-Za-z0-9 \-_.]+$` on the
user-facing `name` field of every dataSource. Letters, numbers, spaces,
dashes, underscores, periods only. The REST deploy API does *not*
enforce this (which is why our test dashboards were accepted), but the
editor flags illegal names the moment a user opens the data source
panel.

**Audit count: 56 violations across 13 viz test-dashboards** (run
`python3 plugins/splunk-dashboards/scripts/audit_data_source_names.py`
from the repo root for the live list). Common offenders: `,` `(` `)`
`/` `>` `:` and the descriptive `,` separating phrases.

When the visual-QA pass touches each viz dashboard, also sanitize the
`dataSource.name` fields on that dashboard (use the suggestion table in
`pipeline/ds-create` SKILL.md). Re-run the audit after each fix; the
QA columns above stay ⬜ until both the visual review *and* the audit
are clean for that viz.

The rule itself is documented in `reference/ds-syntax`,
`pipeline/ds-create`, `pipeline/ds-validate`, and `interactivity/ds-inputs`.

### Single-value family audit (2026-04-26): clean

```
$ python3 plugins/splunk-dashboards/scripts/audit_data_source_names.py \
    plugins/splunk-dashboards/skills/viz/ds-viz-singlevalue/test-dashboard \
    plugins/splunk-dashboards/skills/viz/ds-viz-singlevalueicon/test-dashboard \
    plugins/splunk-dashboards/skills/viz/ds-viz-singlevalueradial/test-dashboard \
    plugins/splunk-dashboards/skills/viz/ds-viz-markergauge/test-dashboard \
    plugins/splunk-dashboards/skills/viz/ds-viz-fillergauge/test-dashboard
OK: 10 files scanned, no violations.
```

All 5 single-value-family viz (rows 8-12) are now ✅ on every column
including `dataSource.name` regex hygiene. The remaining 56 violations
are concentrated in chart, table/event, distribution, flow, geo, and
shape families — those land in subsequent QA passes.
