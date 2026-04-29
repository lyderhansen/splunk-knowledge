---
name: ds-viz-events
description: Splunk Dashboard Studio splunk.events visualization — raw event viewer with expandable per-event metadata. Provides patterns for field summary rail, row-level eventActions, per-field fieldActions, pinned footer fields, and value highlights for SOC investigations and log inspection. Use when the user asks about event viewer, raw events, log payloads, fieldsummary, eventActions, or fieldActions in Splunk Dashboard Studio.
---

# splunk.events — raw event viewer

Verified against Splunk Cloud 10.4.2604.
Live test bench: `ds_viz_events_dark` / `ds_viz_events_light`.

`splunk.events` renders raw `_raw` log payloads with expandable
per-event metadata. Pairs with an optional `fieldsummary` data source
for the left field-summary rail.

## When to use

- Investigators want the original log line preserved with field
  decorations.
- Schema varies per event (varying field sets are fine).
- Field/event drilldowns matter.

## When NOT to use

| Decision | Use instead |
|---|---|
| Stable schema, tabular | `splunk.table` |
| Time-ordered records as a chart | `splunk.timeline` |
| Aggregated counts | `splunk.column` / `splunk.bar` / `splunk.singlevalue` |

## Quick start

```json
{
  "type": "splunk.events",
  "title": "Recent errors",
  "dataSources": {
    "primary":      "ds_events",
    "fieldsummary": "ds_fieldsummary"
  },
  "options": {
    "showFieldSummary": true,
    "footerFields": ["host", "source"]
  }
}
```

```json
"dataSources": {
  "ds_events": {
    "type": "ds.search",
    "options": { "query": "search index=app status>=500 | head 100" }
  },
  "ds_fieldsummary": {
    "type": "ds.chain",
    "options": {
      "extend": "ds_events",
      "query": "| fieldsummary maxvals=10"
    }
  }
}
```

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Field summary:** secondary `ds.chain` extending primary with `\| fieldsummary maxvals=10`. | Use a separate `ds.search` for fieldsummary — it'll re-run the search and double cost. |
| **Highlights:** `highlightValuesByField: { host: "web-01" }` for visual emphasis. | Expect highlights to **filter** — they only highlight matching events. Filter upstream in SPL. |
| **Drilldown:** `eventActions: [{ eventType, label }]` for row-level, `fieldActions: { default | <field>: [...] }` for field-level. | Mix `eventActions` and `fieldActions` event types — keep names consistent (`.click` suffix). |
| **Footer fields:** `footerFields: ["host", "source"]` pins high-signal fields inline. | Pin >5 fields — defeats the per-event compactness. |
| **Background:** tints the events area, not panel chrome. Use for editorial styling. | Set `backgroundColor` on the panel envelope expecting it to override viz. |
| **Schema:** preserve `_raw` end-to-end. | Strip `_raw` in SPL — viewer renders nothing useful without it. |

## Six options total

| Option | Type | Default | Notes |
|---|---|---|---|
| `backgroundColor` | string | theme | Tints events area only. |
| `eventActions` | array | — | Row-level click actions: `[{ eventType, label }]`. |
| `fieldActions` | object | — | Per-field click actions, keyed by field name. `default` applies to all fields. |
| `footerFields` | array | — | Fields pinned to per-event footer; surfaced inline without expansion. |
| `highlightValuesByField` | object | — | `{ field: value }` highlights matching events; does NOT filter. |
| `showFieldSummary` | boolean | `true` | Show/hide the left rail. **Requires `dataSources.fieldsummary`.** |

## Drilldown

Row-level (clicking an event):

```json
"eventActions": [
  { "eventType": "eventAction.openInvestigation.click", "label": "Open investigation" }
]
```

Field-level (clicking a specific field value):

```json
"fieldActions": {
  "default": [{ "eventType": "fieldAction.copyValue.click", "label": "Copy" }],
  "host":    [{ "eventType": "fieldAction.investigateHost.click", "label": "Investigate host" }]
}
```

Pair with `eventHandlers` at the panel level to wire each `eventType` to a navigation, search, or token mutation.

## Gotchas

- `showFieldSummary: true` **requires** `dataSources.fieldsummary`. Without it, the rail prompts or renders empty.
- `fieldsummary` must be `ds.chain` extending the primary, NOT a separate `ds.search` (would double cost).
- `backgroundColor` tints events area only — header/title still uses theme defaults.
- `highlightValuesByField` does NOT filter — filter upstream in SPL.
- `_raw` is the only required field; everything else is metadata.

## See also

- `ds-viz-table` — tabular records without `_raw`.
- `ds-viz-timeline` — time-ordered records as chart.
- `interactivity/ds-drilldowns` — wiring `eventType` strings to handlers.
- `ds-design-principles` — investigation/SOC patterns.
