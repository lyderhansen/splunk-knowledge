# Viz-skill progress tracker

Single source of truth for the viz-by-viz refactor. Each viz goes through the
same pipeline; we don't move on until every column for that row is ✅.

## Status snapshot (2026-04-28)

Latest QA pass against the live `splunk-knowledge-testing` dashboards:

- **Confirmed clean by user:** `area`, `scatter`, `bubble`, `punchcard`,
  `parallelcoordinates`, `column`, `bar`, the entire single-value family
  (`singlevalue`, `singlevalueicon`, `singlevalueradial`, `markergauge`,
  `fillergauge`), `markdown`, `image`, `table`, `pie`, `events`,
  `rectangle`, `ellipse`, `sankey`, **`timeline`** (categorical-stripe
  bench expansion confirmed clean 2026-04-27 PM), **`linkgraph`**
  (full-row layout cleanup confirmed clean 2026-04-27 PM).
- **`map`** — choropleth (panel 5) confirmed clean by user 2026-04-28.
  Panel 9 reworked from broken multi-layer to canonical splunk-ui
  "Bubble Map - dynamic coloring" example after user reported only the
  marker rendered. Awaiting final QA on bubble panels (4 + 9).
- **`choropleth.svg`** — bench expanded to 9 panels, deployed and
  pending final user QA. 2026-04-28: panel 7 (World continents)
  redrawn with proper equirectangular-projected coastline traces +
  graticule decorations; all 6 data sources converted from `ds.test`
  to `ds.search` so the SPL can be opened in a new tab. New
  `SVG-AUTHORING.md` companion file documents inline-SVG escaping,
  path syntax, working from Inkscape exports, programmatic
  generation, projection helpers, and SVG-only pitfalls.

`punchcard` SKILL.md now documents a "Minimum readable panel size" rule
(≥ 500 × 300 px) — under that the visible bubble outpaces the hover
hit-zone and the user can't read off values.

`table` SKILL.md now documents the canonical `stats sparkline()` pattern,
calls out the `eval | makemv` anti-pattern explicitly, warns about the
`dataSource.name` regex (`^[A-Za-z0-9 \-_.]+$` — no slashes), and
clarifies the `tableFormat.sparklineColors` (`string[][]`, per-row-per-series)
vs `columnFormat.<col>.sparklineColors` (`string[]`, per-column) distinction
with side-by-side test panels 8a/8b.

### Geo round (2026-04-27 PM): map + choropleth.svg expansion

**`splunk.map`** — fixed three broken panels and added five new
choropleth examples per user request:

- **Fixed**: panel 4 (bubble layer sized by count), panel 5 (choropleth
  layer with country shading), panel 9 (multi-layer marker + bubble in
  one map). Root cause for all three: `bubbleSize` data binding was
  `seriesByName("count")` which gives a series, not a frame — the viz
  needs `frameWithoutSeriesNames("lat","lon","method") |
  frameBySeriesTypes("number")` to expose a numeric column the bubble
  layer can read for sizing. Panel 5 also lacked
  `additionalTooltipFields:["count"]` so hover gave nothing useful.
- **Added (panels 11-15)**: choropleth opacity 0.5 with
  `additionalTooltipFields` + `tooltipHeaderField:"country"` (panel 11);
  `resultLimit:1` to demo top-N truncation (panel 12); choropleth driven
  by stringified `geom` from `geom geo_countries | tostring(json_geom)`
  (panel 13); a tile-less "World" panel with
  `showBaseLayer:false / showZoomControls:false / showScale:false /
  zoom:0.5 / center:[15,0] / choroplethStrokeColor:"#000" /
  choroplethEmptyAreaColor:"#888" / choroplethOpacity:1.0` (panel 14);
  and a tile-less "US" panel with `backgroundColor:"#888"`,
  `zoom:3 / center:[39,-98] / choroplethStrokeColor:"#888" /
  choroplethEmptyAreaColor:"#fff" / choroplethOpacity:1.0` plus
  `dataColors` driven by `rangeValue(rangeValueConfig)` for visible
  state-level shading without the OSM tiles competing for attention
  (panel 15).
- **SKILL.md**: added previously-undocumented options to the top-level
  and per-layer tables (`showZoomControls`, `showCoordinates`,
  `showBaseLayer`, `source`, `geom`, `featureIdField`,
  `tooltipHeaderField`, `choroplethOpacity`, `choroplethStrokeColor`,
  `choroplethEmptyAreaColor`); corrected the `bubbleSize` binding
  pattern; expanded the "Verified patterns" table to all 15 panels;
  added "Tile-less choropleth" quick recipe and four new gotchas
  (#11-#14 covering `bubbleSize` framing, `geom` as string, `center`
  coordinate order, and tile-suppression interactions).

**`splunk.choropleth.svg`** — added five new SVG examples beyond the
4-panel option matrix. User asked for a floor plan plus more variety;
the SVG snippet they pasted was a base64-encoded PNG (no vector
`<path id="…">` elements, so the viz couldn't fill anything), so I
designed five purpose-built SVGs with proper path IDs:

- Panel 5: office floor plan, 7 rooms with varying shapes including a
  multi-segment `CORRIDOR` path (occupancy %).
- Panel 6: network topology, 8 service boxes connected by `<line>`
  elements (errors per minute — SVC-PAYMENTS lit red).
- Panel 7: stylised world continents, 6 hand-rolled continent paths
  (NOT a real geographic projection; documented as the pattern when
  you want continent-level shading without dragging in
  `geom geo_countries`).
- Panel 8: dense datacenter rack grid, 20 racks in 4 rows × 5 columns
  with cooling units (proves SVG choropleth scales without performance
  issues).
- Panel 9: pipeline process flow, 6 chevron stages (lag in ms).

Each panel uses only the same five documented options — the variety
lives entirely in the SVG markup. SKILL.md updated to enumerate all 9
panels plus the "what kinds of bespoke geometry the choropleth viz can
drive" guidance.

**Deploy**: all four dashboards (map dark, map light, choropleth.svg
dark, choropleth.svg light) deployed to the `splunk-knowledge-testing`
app via `splunk_update_dashboard` MCP — all four returned status 200.
Light themes regenerated via `make_light.py`, which had to be extended
to handle 3-digit hex codes (`#444`, `#fff`, `#888`) baked into the
embedded SVGs — added `SHORT_HEX_RE` + `SHORT_HEX_MAP` and bumped the
6-digit `COLOR_MAP` with the new SVG fills/strokes/text colours. QA on
both viz still ⬜ pending user sign-off.

### Geo round addendum (2026-04-28): bubble Data Colors + multi-layer caveat

Two findings from QA on the geo round:

- **Choropleth (panel 5)**: confirmed clean by user.
- **Multi-layer marker + bubble (panel 9)**: user reported only the
  marker rendered. Cross-checked Splunk's own
  [Maps doc](https://help.splunk.com/en/splunk-enterprise/create-dashboards-and-reports/dashboard-studio/10.2/visualizations/maps)
  and the [splunk-ui Map package](https://splunkui.splunk.com/Packages/visualizations/Map):
  **none** of the four official map examples (Marker Cluster, Bubble
  static, Bubble dynamic, Bubble dynamic with coloring) stack
  `marker` + `bubble` in one `layers[]`. Concluded multi-layer
  stacking is unreliable in current builds — second layer drops
  silently with no error.

Resulting changes:

- Panel 9 replaced with **`viz_bubble_data_colors`** — verbatim
  adaptation of the splunk-ui doc's "Bubble Map - dynamic coloring":
  `dataColors: "> dataValues | rangeValue(dataColorsEditorConfig)"`
  over a `geostats` source. The `dataValues` token is auto-exposed
  by the bubble layer and pairs with a `rangeValue` config in the
  viz's `context`. New synth datasource `ds_bubble_get_only` with
  count values (2-90) tuned to the 4-bucket palette.
- New SKILL.md gotchas: #16 (don't stack marker + bubble; use
  separate panels in the layout), #17 (bubble `dataColors` uses
  `> dataValues | rangeValue(...)`, not `seriesByName(...)` — the
  marker pattern silently does nothing on bubble layers).
- Multi-layer recipe in SKILL.md retitled to **"Anti-pattern"**,
  kept verbatim under that heading so engineers recognise the
  broken pattern when they encounter it elsewhere.
- `ds-viz-choropleth-map` decision tree updated: "Choropleth + markers
  / bubbles in one view" now points to "two separate `splunk.map`
  panels in the dashboard layout" with cross-reference to
  `ds-viz-map` gotcha #16.
- Panel 11 SKILL.md table row updated to reflect the new panel 9
  contents (Bubble Type Map - Data Colors).
- Both dark + light dashboards regenerated and redeployed (status 200).


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
| 2 | `splunk.area`             | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: confirmed clean by user, no follow-ups. |
| 3 | `splunk.column`           | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: panel 9 annotation example wasn't rendering because annotationX was a string-category (`"Mar"` / `"Nov"`) on a categorical x-axis. PDF requires annotationX to match the primary search's x-axis, which for time-series is `_time`. Rewrote `ds_annotations_data` and `ds_annotations_marks` to time-based SPL with three deploy/incident markers across 12 hours of traffic. User confirmed clean on re-QA 2026-04-27. |
| 4 | `splunk.bar`              | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: panel 12 sparkbar still showed major horizontal gridlines because `showYMajorGridLines` defaults to `true` on bar (the y-axis is the category axis but the option still draws horizontal grid lines). Added `showYMajorGridLines: false` to panel 12 + SKILL.md "Sparkbar (hidden chrome)" pattern. annotation* options omitted intentionally — bar uses categorical x-axis and PDF requires annotationX to match the x-axis (typically `_time`), so the pattern doesn't generalize cleanly to bar. User confirmed clean on re-QA 2026-04-27. |
| 5 | `splunk.pie`              | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: confirmed clean by user. Trellis section added per user request: `viz_trellis_intro` (markdown explainer) + `viz_trellis_status_by_region` (3-column trellis with `seriesColorsByField` for traffic-light semantics + `trellisSharedScale: true`) + `viz_trellis_browser_by_country` (4-country × 5-browser grid using `trellisMinColumnWidth: 240` for responsive flow + `trellisPageCount: 12`). Layout height bumped, dark and light themes regenerated via `make_light.py`. SKILL.md already covered the trellis options matrix. |
| 6 | `splunk.scatter`          | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: confirmed OK by user, no follow-ups. |
| 7 | `splunk.bubble`           | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: confirmed clean by user. SKILL.md retains the "Bubble sizing scales with absolute pixels" gotcha with a panel-width → size table. |
| 8 | `splunk.singlevalue`      | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: rangeValue thresholds reworked to disjoint, gap-free buckets `[{"to":60}, {"from":60,"to":80}, {"from":80}]`; SPL `health` query rewritten to swing 38-97 across all RAG buckets; panel 5/6 descriptions corrected to match. SKILL.md adds "Threshold semantics" note. |
| 9 | `splunk.singlevalueicon`  | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: same rangeValue / health-swing fixes as `splunk.singlevalue`. Panels 5, 6, and 10 descriptions updated to declare disjoint thresholds explicitly. SKILL.md adds "Threshold semantics" note. |
| 10 | `splunk.singlevalueradial` | ✅      | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: added `ds_health_swing` (27-96) for panels 5+6 so all 3 RAG buckets demo on reload; rewrote `ds_disk_usage` SPL to swing 158-860 so panels 9+10 demo all RAG buckets. Panel descriptions updated to declare disjoint thresholds + data ranges explicitly. SKILL.md adds "Threshold semantics" note. |
| 11 | `splunk.markergauge`      | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: gaugeRanges are display bands (not threshold buckets) — static-value test data is correct because the marker movement IS the message. Panels 1-3 (low/mid/high) prove the marker tracks the value. Bands documented as "MUST be contiguous" in the skill. No data-swing fix needed. |
| 12 | `splunk.fillergauge`      | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: added `ds_health_swing` for panel 7 and rewrote `ds_disk_used` to swing 30-95 for panel 8 so all 3 RAG buckets demo on reload. Disjoint, gap-free thresholds already canonical. SKILL.md adds "Threshold semantics" note. |
| 13 | `splunk.table`            | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: confirmed clean by user ("Table = Ok") after the sparkline-colours clarification round. Final landing: canonical SPL is `\| stats latest(...) AS current_x, sparkline(avg(x), 30m) AS trend_x by host` over a full 24h window (288 events × 5-min spacing → ~51 real points per row); `tableFormat.sparklineColors: string[][]` (outer rows × inner left-to-right sparkline columns; one outer entry broadcasts to all rows) vs `columnFormat.<col>.sparklineColors: string[]` (single colour per column applied per row). Panel 8 split into 8a (`tableFormat`, canonical) and 8b (`columnFormat`, single-colour-per-column) for side-by-side comparison. Side fixes: sanitised `ds_sparkline.name` (no slashes), removed `columnFormat.cellTypes` for auto-detection, dropped `viz_heatmap` header overrides so it renders in light theme. Earlier rounds documented the `eval \| makemv` anti-pattern (`tokenizer=","` rejects as invalid regex; even `delim` only colours row 1 because the result is a string, not a multivalue), and the data-density gotcha (Splunk falls back to a flat default colour past row 1 when the sparkline is mostly empty buckets). Both gotchas remain in SKILL.md. |
| 14 | `splunk.events`           | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: confirmed clean by user ("events = OK"). |
| 15 | `splunk.timeline`         | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27 PM: confirmed clean by user ("timeline og linkgraph ser bra ut nå marker som done") after the categorical-stripe expansion round. Final landing: 4 new full-row panels above the existing option matrix — `viz_categorical_lanes` (canonical Splunk UI Timeline doc reproduction: 56 events / 7 lanes / status enum via `matchValue`), `viz_categorical_tooltip` (same data + `additionalTooltipFields: ["foo","bar"]` matching the doc's "Additional Tooltip Fields" example), `viz_categorical_dense` (SRE variant: 80 events / 5 host lanes / severity enum), `viz_user_sessions_categorical` (audit variant: 60 sessions / 8 user lanes / action enum). Layout height 4760 → 7080 px. SKILL.md bumped to v1.2.0 with the "The 'Categorical Timeline' pattern (compound colour stripes)" section documenting the 3-setting recipe (`duration` + long time window + `dataColors` keyed on enum) that turns per-event bars into per-lane compound stripes. `make_light.py` `COLOR_MAP` extended with `#0B0C0E → #F5F1E8` and `#101A33 → #EFE7D3` so the timeline / linkgraph hero canvas backgrounds remap automatically. Round 1 (earlier today) already added `viz_duration`, `dataColors`/`dataColorConfig` for `rangeValue` + `matchValue`, `additionalTooltipFields`, `yAxisLabelWidth`, `legendTruncation`, `resultLimit`. |
| 16 | `splunk.punchcard`        | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: panel 9/10 `bubbleRadiusMax` lowered to 8, SPL rewritten from `\| table` to `\| stats sum(metric) by dim1 dim2` so the punch grid actually fills both dimensions (previous data put every bubble on a single row). User confirmed clean on re-QA. SKILL.md now also has a "Minimum readable panel size" section flagging that panels under 500x300 px shrink the hover hit-zone faster than the visible bubble — recommend swapping to singlevalue / line / drilldown-from-tile patterns instead. |
| 17 | `splunk.parallelcoordinates` | ✅    | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: looks good in both themes, no follow-ups. |
| 18 | `splunk.sankey`           | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: confirmed clean by user ("sankey ser greit ut") after the schema-fix round. Round summary: `seriesColors` rejects CSV strings — schema accepts EITHER `string[]` (literal hex array) OR a DOS expression (`> ...`). PDF examples showed the CSV form which the runtime rejects. Fix: rewrote both `viz_custom_palette` and `viz_alert_palette` `seriesColors` as JSON arrays; added the missing `linkColorRangeConfig` array to `viz_dynamic_color` (severity 1→cool blue … 5→hot pink, gap-free RAG buckets mirroring the `splunk.timeline` `dataColorConfig` pattern). SKILL.md `seriesColors` type now reads `string[] \| DOS string ("^>.*")` with a "Schema vs PDF disagreement" note. |
| 19 | `splunk.linkgraph`        | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27 PM: confirmed clean by user ("timeline og linkgraph ser bra ut nå marker som done") after the full-row layout cleanup. Final landing: promoted `viz_network_4col` (4-col CIDR flow), `viz_attack_path_thick` (thick-link kill chain), `viz_dense_test` (density stress test) from half-row (w:680) to full-row (w:1400); bumped each panel's `nodeWidth` (220-280), `nodeSpacingX` (60-80), `nodeSpacingY` (12-16) so the graphs use the new horizontal space rather than rendering small in a wide canvas. Layout height 6000 → 6580 px. SKILL.md bumped to v1.1.0 with the "Layout: when a linkgraph deserves a full row" section + decision table — 4+ columns, hero sizing (`nodeWidth ≥ 280`), long labels (CIDRs/FQDNs/technique names), or `linkWidth ≥ 6` all force full-row. Earlier-today bench expansion (still in place): 7 new larger panels including `viz_kill_chain_5col`, `viz_itsm_5col`, `viz_service_chain_5col`, `viz_network_4col`, `viz_kill_chain_5col_inverted`, `viz_attack_path_thick`, `viz_dense_test`. Both themes regenerated via `make_light.py`. |
| 20 | `splunk.map`              | ✅       | ✅        | ✅         | ✅        | 🟡       | 🟡      | 🟡       | ✅       | QA 2026-04-28: choropleth (panel 5) confirmed clean by user. Panel 4 (bubble) and panel 9 (originally multi-layer marker+bubble) reworked twice. Round 2 (today): user reported only marker rendered in the multi-layer panel — confirmed by re-reading Splunk-ui's Maps doc that **none** of the official examples stack marker+bubble in one `layers[]`, and live builds drop the second layer silently. Panel 9 replaced with `viz_bubble_data_colors`, a verbatim adaptation of the splunk-ui doc's "Bubble Map example - dynamic coloring": `dataColors: "> dataValues \| rangeValue(dataColorsEditorConfig)"` over a `geostats` source for traffic-light bucketing on the bubbles themselves. Two new gotchas added to SKILL.md: #16 (don't stack marker+bubble — use separate panels) + #17 (`dataColors` on bubble uses the `dataValues` token, NOT `seriesByName(...)`; the marker pattern silently does nothing on bubble layers). Round 1 (2026-04-27 PM, recorded earlier in this row's history): bench expanded from 10 to 15 panels covering choropleth opacity + tooltips, `resultLimit`, `geom`-as-string, tile-less "World" + tile-less "US" with `dataColors` rangeValue. SKILL.md previously gained `showZoomControls`, `showCoordinates`, `showBaseLayer`, `source`, `geom`, `featureIdField`, `tooltipHeaderField`, `choroplethOpacity`, `choroplethStrokeColor`, `choroplethEmptyAreaColor`, the "Tile-less choropleth" quick recipe, and gotchas #11-#15. `ds-viz-choropleth-map` decision tree updated to reflect the multi-layer caveat. PDF source-editor table only enums marker/bubble for layer type but choropleth is fully supported and verified live. `center` is `[lat,lon]`, not `[lon,lat]`. Awaiting final QA on panel 9 + panel 4 after today's redeploy. |
| 21 | `splunk.choropleth.svg`   | ✅       | ✅        | ✅         | ✅        | ✅       | 🟡      | 🟡       | ✅       | QA 2026-04-28: panel 7 (World continents) feedback was the original stylised blobs looked unrealistic. Redrew using a proper equirectangular projection (lon −180..180 → x 0..800; lat 90..−90 → y 0..400) with ~25-50 hand-traced coastline vertices per continent + a dashed graticule (lon/lat grid + equator) drawn as `<line>` decorations so they aren't picked up by the choropleth fill. ASCII-rasterized output verified all six silhouettes are recognisable (Alaska→Florida, S. America taper, India peninsula, Australia, etc.). All 6 `dataSources` converted from `ds.test` (inline columns - can't be opened in search) to `ds.search` with `makeresults | streamstats | eval ... | table` SPL — every panel's search now opens in a new tab. **New `SVG-AUTHORING.md` companion file** alongside `SKILL.md` documents the full SVG-side authoring pattern: how to JSON-escape inline SVG into the `svg` option, the path-syntax subset you actually need (M/L/H/V/Q/C/Z), multi-region paths via multiple `M…Z` subpaths, ID conventions, `<path>` vs `<rect>`/`<line>`/`<text>` rules, working from Inkscape/Illustrator exports (incl. trace-bitmap workflow for scanned floor plans), programmatic SVG generation patterns (rack grids, lon/lat projection helpers), label/stroke conventions, light/dark theme integration with `make_light.py`, common SVG pitfalls (winding, self-intersecting, tiny regions, duplicate IDs), and what the viz does NOT support (animation, external resources, JS). Deployed dark + light via `docker cp` + REST `_reload` (HTTP 200). Round 1 (2026-04-27 PM, recorded earlier in this row's history): bench expanded from 4 to 9 panels with proper vector SVGs after user pasted a base64-PNG (no `<path id="...">` elements). `make_light.py` extended with `SHORT_HEX_RE` + `SHORT_HEX_MAP` for 3-digit hex codes. Only 5 options total (svg/areaIds/areaValues/areaColors/backgroundColor). PDF prerequisites say web SVG URLs are unsupported — embed inline or as data URI. Drilldown payload returns clicked path id + value. |
| 22 | `splunk.choropleth.map`   | ✅       | n/a       | n/a        | n/a       | n/a      | n/a     | n/a      | ✅       | **Not a Studio viz type.** Confirmed across the entire 24k-line PDF: the only choropleth type is `splunk.choropleth.svg`. The "Choropleth map" PDF section (page 381) belongs to a Simple-XML / Classic appendix with options `source`/`projection`/`fillColor`/`strokeColor` that don't apply to Studio. In Studio, country/state shading is a `choropleth`-typed **layer** inside `splunk.map` (see `ds-viz-map`). The skill is rewritten as a disambiguation/redirect doc. |
| 23 | `splunk.markdown`         | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: fontFamily is a strict enum of 7 named fonts (Splunk Platform Sans/Data Sans/Platform Mono, Arial, Helvetica, Times New Roman, Comic Sans MS) plus DOS tokens — CSS stacks like `Georgia, serif` are rejected. fontSize/fontColor/fontFamily apply uniformly to the whole panel — no inline mixing. Bench restructured: 2a-2e (one panel per fontSize) + 13a-13g (full 7-font showcase, same sample text in each for direct visual comparison). Also fixed `make_light.py`: title no longer accumulates `(dark) (light)`, and added remaps for `#1A2540`, `#3D1E1E`, `#FF6B6B`. |
| 24 | `splunk.image`            | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-26: Splunk now blocks **all** external image URLs whose domain isn't on the per-instance Dashboards Trusted Domains List (`web.conf -> dashboards_image_allow_list`). The previous `splunk.com/etc.clientlibs/...` URL 404'd. Bench now uses `www.splunk.com/content/dam/.../splunk-white-black-bg.png` (dark) / `splunk-black-white-bg.png` (light) and `logo-splunk-corp-rgb-k-web.svg` for SVG panels. Added prominent `viz_trust_warning` panel under the title that documents the trust-list rule and where to configure it, so future readers don't re-discover the placeholder issue. SKILL.md updated with the literal in-app error message and the web.conf snippet. |
| 25 | `splunk.rectangle`        | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: confirmed clean by user ("rectangle og ellipse har vi gått igjennom så de bør være oppdatert"). Canonical option names are fillColor/strokeColor (not fill/stroke as in some legacy PDF examples). Supports onSelectionChanged for hit-zone overlays. |
| 26 | `splunk.ellipse`          | ✅       | ✅        | ✅         | ✅        | ✅       | ✅      | ✅       | ✅       | QA 2026-04-27: confirmed clean by user. 6 options total (no rx/ry/strokeJoinStyle). Shape determined by panel aspect ratio. Drilldown fires but payload is n/a. |

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
**complete**. With the 2026-04-27 PM sign-off on `splunk.timeline` and
`splunk.linkgraph`, the only QA columns still ⬜ are `splunk.map` and
`splunk.choropleth.svg` (geo family). Every other viz is fully
✅-across-the-row. Both geo-family dashboards were re-expanded and
re-deployed 2026-04-27 evening (see "Geo round" in the status snapshot
above) — they are awaiting visual sign-off, not awaiting build work.

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
