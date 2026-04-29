---
name: ds-ref-pitfalls
description: Splunk Dashboard Studio cross-skill pitfalls matrix — the "if X is wrong, look here" first-stop reference. Maps common symptoms (panel renders empty, axes flipped, sparklines only on row 1, multiselect breaks IN(), threshold colours land in wrong bucket, validator rejects schema, drilldown payload missing) to the per-viz / interactivity / reference skill that owns the fix. Spans viz, interactivity, and schema concerns. Use when the user reports a Splunk Dashboard Studio panel that doesn't render correctly, when validating a JSON-rejected dashboard, or as the first stop for "why is X not working" debugging questions.
---

# ds-ref-pitfalls — cross-skill traps matrix

The "if X is wrong, look here" first-stop. Every row points to the
per-viz / interactivity / reference skill that owns the full fix.

## Empty / broken panels


| Symptom                                                                            | Likely cause                                                                                                           | Fix lives in                             |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `splunk.bar` renders with axes flipped, no bars                                    | Added `"x":` / `"y":` DOS options (those are scatter/bubble-only).                                                     | `ds-viz-bar` GOTCHAS #2                  |
| `splunk.column` renders no bars, flipped                                           | Same trap as above.                                                                                                    | `ds-viz-column` GOTCHAS #3               |
| `splunk.bar` renders bars in random order                                          | SPL didn't `| sort - <value>`.                                                                                         | `ds-viz-bar` GOTCHAS #6                  |
| `splunk.line` series silently disappears                                           | Field name starts with `_` (other than `_time`).                                                                       | `ds-viz-line` GOTCHAS #8                 |
| `splunk.line` log scale ate values                                                 | `yAxisScale: "log"` rejects ≤ 0; set `yAxisMin: "1"`.                                                                  | `ds-viz-line` GOTCHAS #4                 |
| `splunk.area` second / third tier flatlines                                        | Largest series at top of stack — re-sort SPL.                                                                          | `ds-viz-area` GOTCHAS #3                 |
| `splunk.pie` slice order random                                                    | Pie has no sort; `| sort - <value>` in SPL.                                                                            | `ds-viz-pie` GOTCHAS #1                  |
| `splunk.pie` `collapseThreshold` collapses everything                              | It's a fraction (0–1), not a percent. `0.05` = 5%.                                                                     | `ds-viz-pie` GOTCHAS #2                  |
| `splunk.map` empty basemap, no points                                              | Bubble layer needs `| geostats`, NOT `| table lat lon`.                                                                | `ds-viz-map` GOTCHAS #15                 |
| `splunk.map` choropleth all "no data" colour                                       | Wrong key shape: `geo_countries` keys on **full names** (`United States`), `geo://default/world` keys on ISO-2 (`US`). | `ds-viz-map` GOTCHAS #3                  |
| `splunk.map` choropleth dies with `Unexpected token 'N', "Null" is not valid JSON` | `tostring(NULL)` → `"Null"`. Add `| where isnotnull(geom)` BEFORE `tostring`.                                          | `ds-viz-map` GOTCHAS #13                 |
| `splunk.map` second layer disappears                                               | Multi-layer marker + bubble (or + choropleth) is unreliable. Use separate panels.                                      | `ds-viz-map` GOTCHAS #16                 |
| `splunk.map` bubble dataColors does nothing                                        | Bubble uses `> dataValues`, NOT `> primary | seriesByName(...)`.                                                       | `ds-viz-map` GOTCHAS #17                 |
| `splunk.choropleth.svg` no fills                                                   | Path IDs case-sensitive; `<rect>` / `<circle>` not picked up — convert to `<path>`.                                    | `ds-viz-choropleth-svg` Do/Don't         |
| `splunk.singlevalueicon` icon missing                                              | Icon URL is per-instance — re-pick on the target Splunk via editor.                                                    | `ds-viz-singlevalueicon` Two valid forms |
| `splunk.singlevalueicon` Title / Description don't show                            | Doesn't support panel title/description. Use sibling `splunk.markdown`.                                                | `ds-viz-singlevalueicon` OPTIONS         |
| `splunk.timeline` `category` rejected                                              | Must be DOS string `> primary | seriesByName('host')`, not bare `"host"`.                                              | `ds-viz-timeline` GOTCHAS #1             |
| `splunk.sankey` empty                                                              | Field names must be lowercase `source` / `target` / `value` — exactly.                                                 | `ds-viz-sankey` Do/Don't                 |
| `splunk.events` field summary rail empty                                           | Needs secondary `dataSources.fieldsummary` (`ds.chain` extending primary with `| fieldsummary`).                       | `ds-viz-events` Do/Don't                 |
| `splunk.markdown` table renders as raw `|`-text                                    | GFM pipe-tables not supported. Use bullet lists with bold field labels.                                                | `ds-viz-markdown` Do/Don't               |


## Sparkline / table issues


| Symptom                                      | Likely cause                                                                                                 | Fix lives in                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Sparkline column renders only on row 1       | `eval x="1,2,3" | makemv` only types row 1 as mv. Use `| stats sparkline(...) by <key>`.                     | `ds-viz-table` GOTCHAS #9                      |
| Sparkline colours don't apply                | Data density too low — `mvcount(trend_cpu)` ~ 3 means one datapoint. Widen synthetic time range.             | `ds-viz-table` GOTCHAS #12 + SPARKLINE-DATA.md |
| Per-column sparkline colour ignored          | `tableFormat.sparklineColors` distributes per-row, not per-column. Use `columnFormat.<col>.sparklineColors`. | `ds-viz-table` GOTCHAS #10                     |
| Heatmap row tinting wrong rows red           | Half-step thresholds (`1.5`, `2.5`) so integer ranks land cleanly.                                           | `ds-viz-table` PATTERNS #7                     |
| `_color_rank` column shows in rendered table | Missing `showInternalFields: false`.                                                                         | `ds-viz-table` GOTCHAS #1                      |
| Header unreadable in light theme             | Hardcoded `#0B0C0E` headerBackgroundColor. Don't set — let theme defaults track.                             | `ds-viz-table` GOTCHAS #5                      |


## Threshold / RAG colour bugs


| Symptom                                                                                | Likely cause                                                                     | Fix lives in                     |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------- |
| Boundary value `60` lands in red instead of amber                                      | `[{to:70}, {from:60, to:80}, {from:70}]` — overlap, top-down + first-match wins. | `ds-viz-singlevalue` GOTCHAS #3  |
| Middle bucket never seen on render                                                     | Demo data only hits two buckets. Use 20 / 60 / 95 against thresholds 60 / 80.    | `ds-viz-singlevalue` Do/Don't    |
| Whole-tile flips to dark, headline disappears                                          | `backgroundColor` dynamic without locking `majorColor`.                          | `ds-viz-singlevalue` GOTCHAS #6  |
| Trend doesn't auto-flip red/green                                                      | `trendColor` defaults to theme font colour. Drive with DOS expression.           | `ds-viz-singlevalue` GOTCHAS #1  |
| Choropleth empty area renders theme-grey                                               | When `showBaseLayer: false`, set `choroplethEmptyAreaColor` explicitly.          | `ds-viz-map` GOTCHAS #12         |
| `splunk.choropleth.svg` `areaColors: "#FF0000"` paints every region the literal string | Must be DOS string with `rangeValue` / `gradient`.                               | `ds-viz-choropleth-svg` Do/Don't |


## Interactivity bugs


| Symptom                                                          | Likely cause                                                                                         | Fix lives in                |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------- |
| Multiselect into SPL `IN()` breaks on hyphens / spaces           | Need `                                                                                               | s`filter:`IN ($status|s$)`. |
| "All" sentinel in multiselect produces invalid SPL               | Add `OR ("$tok$" = "*")` clause.                                                                     | `ds-int-tokens` Quick recipes   |
| Drilldown `customUrl` corrupted by `&` / `?`                     | Missing `                                                                                            | u` filter on tokens in URL. |
| `drilldown.linkToDashboard` tokens not forwarded                 | `tokens` must be array of `{token, value}`, not string-keyed map.                                    | `ds-int-drilldowns` Do/Don't    |
| Receiving dashboard's input doesn't pick up forwarded value      | `linkToDashboard.token` should be raw name, NO `form.` prefix.                                       | `ds-int-drilldowns` Do/Don't    |
| Visibility condition `S0201 Syntax error: "web" at position 5`   | Wrapped token in quotes (`"$selected_host$"`). Use bare `$selected_host$`.                           | `ds-int-visibility` Do/Don't    |
| Visibility condition `S0201 Syntax error: "isSet"`               | `isSet()` is Cloud-only. Use `$tok$ != ""`.                                                          | `ds-int-visibility` Do/Don't    |
| `visibility` rejected with `must NOT have additional properties` | Visibility is under `containerOptions`, never panel root.                                            | `ds-int-visibility` Do/Don't    |
| Token shows literal `$tok$` text in markdown panel               | Token interpolation works in markdown — wrap in inline code ``$tok$`` to avoid `*` / `_` collisions. | `ds-viz-markdown` Do/Don't  |
| Dashboard panel doesn't update on input change                   | Token name typo. Cmd-F across JSON; must match exactly.                                              | `ds-int-tokens` Debug ladder    |
| Dynamic dropdown frozen / not refreshing                         | `enableSmartSources: true` missing on parent search.                                                 | `ds-int-inputs` Do/Don't        |
| `input.timerange` schema error on save                           | `defaultValue` MUST be `"-24h@h,now"` string, NOT object.                                            | `ds-int-inputs` Do/Don't        |
| Tabbed dashboard panels missing                                  | `layoutId` mismatch with `layoutDefinitions` key, OR `layout.type` set alongside `layout.tabs`.      | `ds-int-tabs` Do/Don't          |
| Hidden tab still costing search dispatch                         | Add `containerOptions.visibility` to gate searches inside hidden tabs.                               | `ds-int-visibility` Caveats     |


## Schema rejections


| Symptom                                                       | Likely cause                                                                                    | Fix lives in                                           |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `seriesColors: must be array / must match pattern "^>.*"`     | CSV string `"#aaa,#bbb"` rejected. Use array `["#aaa", "#bbb"]`.                                | `ds-viz-sankey` Do/Don't, `ds-viz-timeline` GOTCHAS #3 |
| `dataSource name must match ^[A-Za-z0-9 \-_.]+$`              | `,` `(` `)` `/` `>` `:` in user-facing `name` field.                                            | `ds-ref-syntax` `name` field rule                          |
| `input.<id>.type: must be equal to one of the allowed values` | Tried `input.radio` / `input.number` / `input.date` — only 5 types exist.                       | `ds-int-inputs` 5 flavours                                 |
| `must NOT have additional properties` on multiselect          | Tried `valuePrefix` / `valueSuffix` / `delimiter` — Studio v2 doesn't support. Use `|s` filter. | `ds-int-inputs` `input.multiselect`                        |
| Validator rejects `splunk.choropleth.map` viz type            | Doesn't exist. Use `splunk.map` with `choropleth` layer.                                        | `ds-viz-map` Common confusions                         |


## Layout traps


| Symptom                                                                | Likely cause                                                | Fix lives in                                           |
| ---------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| Shape primitives (rectangle / ellipse / image) silently fail to render | Require `layout.type: "absolute"`. Skipped on grid / tabs.  | `ds-viz-rectangle`, `ds-viz-ellipse`, `ds-viz-image`   |
| `splunk.singlevalueicon` falls back to plain singlevalue               | Same: requires absolute layout.                             | `ds-viz-singlevalueicon`                               |
| KPI ring + singlevalue overlay shows ring on top                       | Z-order is `structure` array order. Earlier = behind.       | `ds-viz-rectangle` PATTERNS, `ds-viz-ellipse` PATTERNS |
| Categorical Timeline bars collapse into mush                           | Half-width panel — needs full row (`w: 1408`).              | `ds-viz-timeline` GOTCHAS #4                           |
| KPI tile bank looks like separate cards                                | `backgroundColor: "transparent"` on each tile + 4–8 px gap. | `ds-viz-markergauge` / `ds-viz-fillergauge` Do/Don't   |


## Image & SVG


| Symptom                                             | Likely cause                                                                                           | Fix lives in                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| External image URL renders as placeholder           | Domain must be on `dashboards_image_allow_list`. Splunk-bundled `/en-US/static/...` is always trusted. | `ds-viz-image`                   |
| External image URL doesn't render in PDF/PNG export | Only uploaded KV-store images render. Always upload for PDF.                                           | `ds-viz-image` Do/Don't          |
| SVG choropleth no fills                             | `<rect>` / `<circle>` not picked up — only `<path>` with unique `id`.                                  | `ds-viz-choropleth-svg` Do/Don't |


## Performance


| Symptom                           | Likely cause                                                                                                   | Fix lives in                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Searches hammer the indexer       | Every `ds.search` should bind `queryParameters.earliest` / `latest` via `defaults` block, not per-search.      | `ds-int-defaults`                                      |
| Same SPL runs N times             | Use `ds.chain` extending a single `ds.search` for variations.                                                  | `ds-ref-syntax` Base-search + chain pattern            |
| Hidden panel still dispatches     | Visibility-hidden panels skip dispatch; ensure `containerOptions.visibility` is set, not just `display: none`. | `ds-int-visibility` Caveats                            |
| `resultLimit` silently drops rows | Aggregate upstream with `| head N` / `| top limit=N` / `| sort -<val>`.                                        | `ds-viz-bar` GOTCHAS #11, `ds-viz-sankey` Do/Don't |


## When to use this skill

- **First stop** for any "Splunk dashboard panel doesn't render
correctly" ticket.
- **Triage layer** before opening per-viz GOTCHAS — points you at the
right skill in 1 lookup.
- **Cross-skill awareness** — same symptom (e.g. "schema rejects CSV
array") appears across sankey, timeline, ellipse, rectangle. This
matrix shows the pattern.

## See also

- `ds-ref-design-principles` — design-level antipatterns (rainbow on
ordered data, pie >6 slices, KPI uniformity).
- `ds-ref-syntax` — JSON envelope rules.
- Per-viz `GOTCHAS.md` files — full detail behind every entry above.