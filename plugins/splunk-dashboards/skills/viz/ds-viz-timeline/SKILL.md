---
name: ds-viz-timeline
description: |
  splunk.timeline - plots discrete events along a horizontal time axis,
  optionally grouped into lanes by category. Best for sparse event streams
  (deploys, alerts, audits). NOT documented in the 10.4 reference PDF -
  options below are verified empirically.
version: 1.0.0
verified_against: Splunk Cloud 10.2.x (empirical - not in 10.4 PDF)
test_dashboards:
  - ds_viz_timeline_dark
  - ds_viz_timeline_light
---

# splunk.timeline

> **Documentation status**: `splunk.timeline` is in the validator's accepted enum but is **NOT documented** in the 10.4 reference PDF. Options here are verified empirically against Splunk Cloud 10.2.x.

The timeline plots discrete events along a horizontal time axis. Each event is a marker; lanes are derived from a `category` field via Dynamic Options Syntax (DOS).

## When to use it

| Story                                       | Pick                  |
| ------------------------------------------- | --------------------- |
| "When did things happen?" (sparse events)   | `splunk.timeline`     |
| "How many things happened over time?"       | `splunk.column` / `splunk.line` |
| "Show me the raw events"                    | `splunk.events`       |
| "Stack incidents on a chart"                | `splunk.line` with annotations |

Pick `splunk.timeline` when:

- Events are **discrete and sparse** (deploys, alerts, audits) - not continuous metrics
- You want **multiple lanes** that share the same time axis
- The story is **temporal pattern recognition** rather than counting
- The user needs **per-event drilldown**

## Data shape

The timeline expects results with:

- `_time` - mandatory; positions the marker on the x-axis
- A field used as the **lane** (referenced via `category` DOS expression)
- Optional `label`, `severity`, or other metadata fields

```spl
| makeresults count=12
| streamstats count AS rn
| eval _time = relative_time(now(), "-" . tostring(24-rn*2) . "h")
| eval category = case(rn%3==0, "deploy", rn%3==1, "alert", 1==1, "audit")
| eval label = "event_" . tostring(rn)
| table _time category label
```

## Options (verified)

| Option            | Type            | Default       | Notes                                                                    |
| ----------------- | --------------- | ------------- | ------------------------------------------------------------------------ |
| `category`        | DOS string      | -             | `> primary \| seriesByName('field_name')` - selects the lane field       |
| `legendDisplay`   | string enum     | `"right"`     | `"right"`, `"left"`, `"top"`, `"bottom"`, `"off"`                        |
| `backgroundColor` | string          | theme default | Tints the events area                                                    |
| `seriesColors`    | string array    | theme palette | Per-lane colors. Maps by series order (alphabetical on the category)     |
| `axisVisibility`  | string enum     | `"show"`      | `"show"`, `"hide"` - hides the time axis labels                          |

Standard panel options also apply:
- `showProgressBar`, `showLastUpdated` (chrome)

## Verified patterns (from test-dashboard)

| # | Pattern                            | Key options                                                  |
| - | ---------------------------------- | ------------------------------------------------------------ |
| 1 | Default - single lane              | `dataSources.primary` only                                   |
| 2 | `category` lane via DOS            | `category: "> primary \| seriesByName('category')"`          |
| 3 | Legend off                         | `legendDisplay: "off"`                                       |
| 4 | Legend bottom                      | `legendDisplay: "bottom"`                                    |
| 5 | Custom palette                     | `seriesColors: ["#FFB627", "#FF2D95", "#33FF99"]`           |
| 6 | Custom panel tint                  | `backgroundColor` + `seriesColors`                           |
| 7 | Time axis hidden                   | `axisVisibility: "hide"`                                     |
| 8 | SOC attack-types pattern           | 5-lane palette + lanes from `attack_type`                    |
| 9 | Deploy timeline (env lanes)        | `category: "> primary \| seriesByName('env')"`              |
| 10 | Dense (40 events stress test)     | confirms cluster behavior                                    |
| 11 | No title (section element)        | omit `title` for editorial layouts                           |

## Drilldown

`primary.click` drilldowns work the same as line/column charts. The clicked event's row is exposed via `row.<field>` tokens.

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

- **`category` is DOS, not a plain field name.** Use `> primary | seriesByName('field_name')`, not `"field_name"`. Without DOS, the viz won't pick up the lane.
- **Series order is alphabetical** on the category field. `seriesColors[0]` maps to the first lane in alphabetical order. If you want a specific color for `"alert"`, count where `"alert"` falls alphabetically and place its color accordingly.
- **Dense events cluster but stay interactive.** The viz handles 40+ events on a single lane reasonably well, but readability degrades fast - prefer column/area charts when counts matter.
- **Not in the 10.4 PDF.** Some option behaviors may shift across Splunk versions. Lock dashboards to verified patterns above.
- **No `dataValuesDisplay`, `yAxis*`, or annotation support.** Timeline is intentionally simple; for richer features use `splunk.line` with the timestamp on the x-axis.

## Cross-references

- [`ds-viz-events`](../ds-viz-events/SKILL.md) - for showing the raw events with field metadata
- [`ds-viz-line`](../ds-viz-line/SKILL.md) - for continuous time series with annotations
- [`ds-viz-column`](../ds-viz-column/SKILL.md) - when you want event counts over time
- [`ds-design-principles`](../../design/ds-design-principles/SKILL.md) - investigation/SOC patterns
