---
name: ds-viz-timeline
description: |
  splunk.timeline - plots discrete events along a horizontal time axis,
  optionally grouped into lanes by category, with optional intervals,
  dynamic per-event coloring, and tooltip enrichment. Best for sparse
  event streams (deploys, alerts, audits, batch jobs).
version: 1.2.0
verified_against: Splunk Cloud 10.3.2512 (official docs) + Cloud 10.2.x runtime
test_dashboards:
  - ds_viz_timeline_dark
  - ds_viz_timeline_light
docs:
  - https://help.splunk.com/en/splunk-cloud-platform/create-dashboards-and-reports/dashboard-studio/10.3.2512/visualizations/timelines
---

# splunk.timeline

> **Documentation status (updated)**: although `splunk.timeline` is **not in the 10.4 reference PDF**, it is fully documented at help.splunk.com under Cloud 10.3.2512. The option surface below is taken from that page and verified empirically against Cloud 10.2.x runtime.

The timeline plots discrete events along a horizontal time axis. Events with a `duration` field render as **horizontal bars** (intervals); events without one render as **circles**. Lanes are derived from a `category` field via Dynamic Options Syntax (DOS).

## When to use it

| Story                                          | Pick                  |
| ---------------------------------------------- | --------------------- |
| "When did things happen?" (sparse events)      | `splunk.timeline`     |
| "How long did each thing take?" (intervals)    | `splunk.timeline` with `duration` |
| "How many things happened over time?"          | `splunk.column` / `splunk.line` |
| "Show me the raw events"                       | `splunk.events`       |
| "Stack incidents on top of a metric"           | `splunk.line` with annotations |

Pick `splunk.timeline` when:

- Events are **discrete and sparse** (deploys, alerts, audits, batch jobs)
- You want **multiple lanes** that share the same time axis
- The story is **temporal pattern recognition** rather than counting
- Some events have **meaningful duration** (jobs, releases, incidents) and you want to see length-on-time-axis

## Data shape

The timeline expects results with:

- `_time` - mandatory; positions the marker on the x-axis
- A **lane field** (referenced via `category` DOS, e.g. `host`, `env`, `feature`)
- Optional `duration` (in seconds; `0` forces a circle for that row)
- Optional **color field** (numeric for `rangeValue`, string for `matchValue`)
- Optional fields for `additionalTooltipFields`

```spl
| makeresults count=12
| streamstats count AS rn
| eval _time = relative_time(now(), "-" . tostring(24-rn*2) . "h")
| eval category = case(rn%3==0, "deploy", rn%3==1, "alert", 1==1, "audit")
| eval duration = if(category=="deploy", 1800+rn*60, 0)
| eval severity = if(category=="alert", random()%3+1, 1)
| table _time category duration severity
```

## Options (canonical, from help.splunk.com)

| Property                  | Type                          | Default                                                       | Notes |
| ------------------------- | ----------------------------- | ------------------------------------------------------------- | ----- |
| `x`                       | DOS                           | `> primary \| seriesByType("time")`                           | x-axis source |
| `y`                       | DOS                           | `> primary \| seriesByPrioritizedTypes("string","number")`    | y-axis source |
| `xField`                  | string                        | `> x \| getField()`                                           | x-axis field name |
| `yField`                  | string                        | `> y \| getField()`                                           | y-axis field name |
| `category`                | DOS                           | `> primary \| seriesByName("category")`                       | lane field |
| `categoryField`           | string                        | `> category \| getField()`                                    | category field name |
| `duration`                | DOS                           | `> primary \| seriesByPrioritizedTypes("number","time")`      | interval length in seconds |
| `durationField`           | string                        | `> duration \| getField()`                                    | duration field name |
| `additionalTooltipFields` | `string[]`                    | `[]`                                                          | extra fields shown on hover |
| `backgroundColor`         | string (hex)                  | theme default                                                 | events-area tint |
| `dataColors`              | DOS or `string[]`             | falls back to `seriesColors`                                  | per-event color via `dataColorConfig` |
| `legendDisplay`           | enum                          | `"off"`                                                       | `"right"`, `"bottom"`, `"off"` |
| `legendTruncation`        | enum                          | `"ellipsisEnd"`                                               | `"ellipsisEnd"`, `"ellipsisMiddle"`, `"ellipsisStart"`, `"off"` |
| `resultLimit`             | number                        | `10000`                                                       | max events; truncates first N |
| `seriesColors`            | `string[]`                    | Splunk Prisma 20-color palette                                | lane palette - **must be array, not CSV** |
| `yAxisLabelWidth`         | number                        | `100`                                                         | px width for lane labels |

> **Schema gotcha**: `seriesColors` and `dataColors` (when used as a literal palette) must be **JSON arrays**, not CSV strings. Passing `"#aaa,#bbb"` triggers `must be array / must match pattern "^>.*"`. Same rule as `splunk.sankey`.

## Two flavors of dynamic coloring

`splunk.timeline` supports **dynamic per-event coloring** through `dataColors` + `dataColorConfig`. Two variants:

### `rangeValue` - numeric thresholds

Color by a numeric field bucketed into ranges. Canonical for severity, percent-utilization, latency.

```json
"options": {
  "category": "> primary | seriesByName('host')",
  "dataColors": "> primary | seriesByName('cpu_pct') | rangeValue(dataColorConfig)",
  "dataColorConfig": [
    { "to": 30,                "value": "#1F77B4" },
    { "from": 30, "to": 60,    "value": "#FFB627" },
    { "from": 60, "to": 80,    "value": "#FF6B35" },
    { "from": 80,              "value": "#FF2D95" }
  ]
}
```

### `matchValue` - exact string match

Color by exact string match, with optional `*` wildcard. Canonical for status enums (red/amber/green) where the same value must always carry the same color.

```json
"options": {
  "category": "> primary | seriesByName('feature')",
  "duration": "> primary | seriesByName('duration')",
  "dataColors": "> primary | seriesByName('status') | matchValue(dataColorConfig)",
  "dataColorConfig": [
    { "match": "deployed",    "value": "#33FF99" },
    { "match": "in_progress", "value": "#7AA2FF" },
    { "match": "failed",      "value": "#FF2D95" },
    { "match": "reverted",    "value": "#FFB627" }
  ]
}
```

Wildcard rules: `*` matches any number of characters. Exact matches win first; longer/less-wildcarded patterns win next; ties resolve in declaration order.

## The "Categorical Timeline" pattern (compound colour stripes)

The headline pattern from the [Splunk UI Timeline package docs](https://splunkui.splunk.com/Packages/visualizations/Timeline) - the screenshot with `Lane 1 ... Lane 7` and bars of mixed colours touching inside each lane - is **not a different visualization**. It's the same `splunk.timeline` configured with three things at once:

1. **Many short-`duration` events per lane** (so events render as bars, not circles).
2. **A long time window** (months, not hours) so bars are pixel-narrow and crowd against each other.
3. **`dataColors` + `matchValue`** keyed on a status / severity / action enum so adjacent bars in the same lane carry different colours.

When those three line up, the per-event bars stop reading as individual events and start reading as a **compound multi-colour stripe per lane**. The visual question shifts from *"what is this one event?"* to *"how busy was this lane and in which colours across the period?"*. This is the dominant production pattern for SOC incident lanes, SRE host-week views, and audit-by-user feeds.

Canonical configuration:

```json
"viz_categorical_lanes": {
  "type": "splunk.timeline",
  "title": "Categorical Timeline",
  "dataSources": { "primary": "ds_categorical_lanes" },
  "options": {
    "category":   "> primary | seriesByName('lane')",
    "duration":   "> primary | seriesByName('duration')",
    "dataColors": "> primary | seriesByName('status') | matchValue(dataColorConfig)",
    "dataColorConfig": [
      { "match": "running",       "value": "#7AA2FF" },
      { "match": "degraded",      "value": "#FFB627" },
      { "match": "resolved",      "value": "#33FF99" },
      { "match": "investigating", "value": "#FF6B35" },
      { "match": "queued",        "value": "#7B56DB" }
    ],
    "yAxisLabelWidth": 80,
    "legendDisplay":   "off"
  }
}
```

Layout rule: **always full-row width** (`w: 1408` in a 1440-grid layout). Compound stripes need horizontal space to breathe; half-width panels collapse the bars into unreadable mush.

Three production specializations of this pattern are in the test dashboard:

- `viz_categorical_lanes` - the canonical doc reproduction (7 lanes / status enum)
- `viz_categorical_tooltip` - same data + `additionalTooltipFields: ["foo","bar"]` for audit context
- `viz_categorical_dense` - SRE variant: 5 host lanes / severity enum / 80 events
- `viz_user_sessions_categorical` - identity / audit variant: 8 user lanes / action enum

## Verified patterns (from test-dashboard)

| #  | Pattern                                | Key options |
| -- | -------------------------------------- | ----------- |
| C1 | **Categorical Timeline** (canonical from Splunk UI docs) | full-row, 56 events / 7 lanes, `matchValue` colour by status enum |
| C2 | **Additional Tooltip Fields** (canonical doc example)    | C1 + `additionalTooltipFields: ["foo","bar"]` |
| C3 | **Dense categorical** (SRE host-week)  | 80 events / 5 host lanes, `matchValue` colour by severity |
| C4 | **User session feed** (identity / audit) | 60 sessions / 8 user lanes, `matchValue` colour by action |
| 1  | Default                                | `dataSources.primary` only - single lane, circles only |
| 2  | `category` - lanes via DOS             | `category: "> primary \| seriesByName('category')"` |
| 3  | `duration` - intervals as bars         | adds `duration` DOS - circles become bars |
| 4  | Real intervals - release windows       | `category` + `duration` + wider `yAxisLabelWidth` |
| 5  | `dataColors` + `rangeValue` (CPU)      | numeric heatmap - cool/warm/hot ranges |
| 6  | `dataColors` + `matchValue` (status)   | red/amber/green for deployment status |
| 7  | `matchValue` - CI pipeline stages      | enum-based colors that follow the run |
| 8  | `additionalTooltipFields`              | enriched hover with `user`, `ip`, `result` |
| 9  | `legendDisplay: off`                   | hide legend entirely |
| 10 | `legendDisplay: bottom` + truncation   | bottom legend with `legendTruncation: "ellipsisMiddle"` |
| 11 | `yAxisLabelWidth: 200`                 | wider lane labels for long names |
| 12 | `resultLimit: 6`                       | hard truncation - first 6 rows in source order |
| 13 | `seriesColors` - custom palette        | array of hex |
| 14 | `backgroundColor` - editorial tint     | dark slate panel |
| 15 | SOC pattern (canonical from docs)      | full Prisma palette + attack-type lanes |
| 16 | Deploy timeline (env lanes)            | three-lane env pattern |
| 17 | Dense (40 events stress test)          | clustering / interactivity |
| 18 | No title (section element)             | omit `title` for editorial layouts |

## Drilldown

`primary.click` drilldowns work like other charts. The clicked event's row is exposed via `row.<field>` tokens.

```json
"viz_timeline": {
  "type": "splunk.timeline",
  "dataSources": { "primary": "ds_incidents" },
  "options": { "category": "> primary | seriesByName('category')" },
  "eventHandlers": [
    {
      "type": "drilldown.customUrl",
      "options": {
        "url": "/app/myapp/incident_detail?id=$row.label$"
      }
    }
  ]
}
```

## Gotchas

- **`category` and `duration` are DOS, not plain field names.** Use `> primary | seriesByName('field_name')`, not `"field_name"`. Without the `>` prefix the validator rejects the option or the viz silently picks the wrong field.
- **Series order is alphabetical** on the category field. `seriesColors[0]` maps to the first lane in alphabetical order. If you want a specific color for `"alert"`, count where `"alert"` falls alphabetically and place its color accordingly. Use `dataColors + matchValue` instead when you need fixed semantic mapping.
- **`seriesColors` must be an array, not a CSV string.** Same schema rule as `splunk.sankey` - the validator rejects `"#aaa,#bbb"` with `must be array / must match pattern "^>.*"`.
- **Dense events cluster but stay interactive.** The viz handles 40+ events on a single lane reasonably well, but readability degrades fast - prefer column/area charts when counts matter, or split lanes more aggressively.
- **`resultLimit` is hard truncation, not top-N.** It picks the first N rows in source order. If you want top-N, sort in SPL first.
- **No `dataValuesDisplay`, `yAxis*`, or annotation support.** Timeline is intentionally simple; for richer features use `splunk.line` with timestamps on the x-axis.
- **`duration` of 0 forces a circle.** Useful when you have a duration column but specific events are instantaneous.
- **`legendDisplay` defaults to `"off"`.** Most other charts default to a visible legend; timeline doesn't. Set it explicitly when you want the legend.

## Cross-references

- [`ds-viz-events`](../ds-viz-events/SKILL.md) - for showing the raw events with field metadata
- [`ds-viz-line`](../ds-viz-line/SKILL.md) - for continuous time series with annotations
- [`ds-viz-column`](../ds-viz-column/SKILL.md) - when you want event counts over time
- [`ds-design-principles`](../../reference/ds-design-principles/SKILL.md) - investigation/SOC patterns
