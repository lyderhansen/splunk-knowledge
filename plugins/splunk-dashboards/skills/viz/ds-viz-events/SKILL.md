---
name: ds-viz-events
description: |
  splunk.events - the events viewer. Renders raw _raw log payloads with expandable
  per-event metadata. Pairs with an optional `fieldsummary` data source for the
  field summary rail. Supports row-level eventActions and per-field fieldActions
  for drilldowns. Six options total.
version: 1.0.0
verified_against: SplunkCloud-10.4.2604-DashStudio
test_dashboards:
  - ds_viz_events_dark
  - ds_viz_events_light
---

# splunk.events

The events viewer. Renders raw `_raw` log payloads with expandable per-event metadata.

## When to use it

Pick `splunk.events` when the **message is "show me the raw events"** - investigators want the original log line preserved with field decorations, the schema varies per event, and field/event drilldowns matter.

Pick something else when:

| Decision                  | Use instead                                          |
| ------------------------- | ---------------------------------------------------- |
| Stable schema, tabular    | `splunk.table`                                       |
| Time-ordered records      | `splunk.timeline`                                    |
| Aggregated counts         | `splunk.column` / `splunk.bar` / `splunk.singlevalue`|

## Data shape

The viewer renders one row per result from `dataSources.primary`. The `_raw` field is preserved verbatim and surfaced as the body of each event. All other fields become expandable metadata.

```spl
| makeresults count=8
| eval _raw = "2026-04-25 12:00:00 host=web-01 status=500 message=request_failed"
| table _time _raw host status sourcetype
```

The events viewer **also** accepts an optional secondary data source under `dataSources.fieldsummary` - a `ds.chain` extending the primary with `| fieldsummary maxvals=10`. This drives the left-rail field summary.

```json
"dataSources": {
  "ds_events": { "type": "ds.search", "options": { "query": "..." } },
  "ds_fieldsummary": {
    "type": "ds.chain",
    "options": { "extend": "ds_events", "query": "| fieldsummary maxvals=10" }
  }
}
```

```json
"viz_events": {
  "type": "splunk.events",
  "dataSources": {
    "primary":      "ds_events",
    "fieldsummary": "ds_fieldsummary"
  }
}
```

## Options (all 6)

| Option                   | Type    | Default                | Notes                                                                  |
| ------------------------ | ------- | ---------------------- | ---------------------------------------------------------------------- |
| `backgroundColor`        | string  | theme default          | Tints the events area (not the panel chrome).                          |
| `eventActions`           | array   | -                      | Row-level click actions. `[{ eventType, label }]`.                     |
| `fieldActions`           | object  | -                      | Per-field click actions, keyed by field name. `default` key applies to all fields. |
| `footerFields`           | array   | -                      | Fields pinned to the per-event footer. Surfaced inline without expansion. |
| `highlightValuesByField` | object  | -                      | Highlight specific field-value pairs across all events. `{ field: value }` |
| `showFieldSummary`       | boolean | `true`                 | Show/hide the left-rail field summary. Requires `dataSources.fieldsummary`. |

## Verified patterns (from test-dashboard)

| # | Pattern                              | Key options                                                |
| - | ------------------------------------ | ---------------------------------------------------------- |
| 1 | Default with field summary           | `dataSources.fieldsummary` set                             |
| 2 | No field summary                     | `showFieldSummary: false`                                  |
| 3 | Custom panel tint                    | `backgroundColor: "#0F1729"`                               |
| 4 | Pinned footer fields                 | `footerFields: ["host", "source"]`                         |
| 5 | Highlights                           | `highlightValuesByField: { host: "web-01", status: "500" }`|
| 6 | Compact (3 events)                   | small dataset + `showFieldSummary: false`                  |
| 7 | Row-level event action               | `eventActions: [{ eventType, label }]`                     |
| 8 | Per-field action                     | `fieldActions: { default: [...], host: [...] }`            |
| 9 | All options stacked                  | every option simultaneously                                |

## Drilldown patterns

`eventActions` fire when an event row is clicked:

```json
"eventActions": [
  { "eventType": "eventAction.openInvestigation.click", "label": "Open investigation" }
]
```

`fieldActions` fire when a specific field value is clicked. Key by field name, or use `default` for actions that apply to every field:

```json
"fieldActions": {
  "default": [{ "eventType": "fieldAction.copyValue.click", "label": "Copy" }],
  "host":    [{ "eventType": "fieldAction.investigateHost.click", "label": "Investigate host" }]
}
```

Pair with `primary.click` drilldowns at the panel level to wire the action to a navigation, search, or token mutation.

> **Convention**: Event types should end in `.click` if you're wiring them to event handlers.

## Gotchas

- **`showFieldSummary: true` requires a secondary data source** under `dataSources.fieldsummary`. Without it, the viewer either renders an empty rail or prompts for one. Pair them or set `showFieldSummary: false`.
- **`fieldsummary` must be a chain** off the primary, not a separate search. Use `ds.chain` with `extend: "<primary_id>"` and `query: "| fieldsummary maxvals=10"`.
- **`backgroundColor` tints the events area**, not the panel chrome. The header/title still uses theme defaults.
- **`footerFields` is per-event** - the listed fields appear in every event's footer. Use it for high-signal fields you don't want hidden behind the expand action.
- **`highlightValuesByField` does not filter** - it just highlights matching events. Filtering is upstream in SPL.

## Cross-references

- [`ds-viz-table`](../ds-viz-table/SKILL.md) - for tabular data without the `_raw` payload
- [`ds-viz-timeline`](../ds-viz-timeline/SKILL.md) - for time-ordered records visualised as a chart
- [`ds-design-principles`](../../reference/ds-design-principles/SKILL.md) - investigation/SOC patterns
