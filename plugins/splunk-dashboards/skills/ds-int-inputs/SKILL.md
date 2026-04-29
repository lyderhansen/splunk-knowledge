---
name: ds-int-inputs
description: Splunk Dashboard Studio input widget reference — time pickers, dropdowns, multiselects, text fields, and checkboxes that write tokens consumed by every search and option on the dashboard. Provides patterns for global time pickers, dynamic SPL-driven dropdowns, multiselect with All sentinel, cascading two-stage filters, and the workarounds for missing input.radio / input.number. Use when the user asks about inputs, time pickers, dropdowns, multiselect, global filters, dynamic dropdowns, or "how do I let users pick a value" in Splunk Dashboard Studio.
---

# ds-int-inputs — input widget reference

Verified against Splunk Cloud 10.4.2604 + Splunk Enterprise 10.2.1.
Live test bench: `splunk-knowledge-testing/ds_interactivity_core_dark`
§1 Inputs row.

## What an input does

Renders a widget at the top of the dashboard (or inside a tab via
`layoutDefinitions[].inputs`) and writes a single named token whenever
the user changes its value. Every panel or option that reads
`$token$` then re-evaluates.

## The 5 flavours (all that exist)

Per the Splunk Cloud 10.4.2604 reference, **only these five `type`
values are accepted**. Anything else fails schema validation.

| Type | Token shape | Use |
|---|---|---|
| `input.timerange` | object → read via `.earliest` / `.latest` | Global time filter. |
| `input.dropdown` | string | Single-pick filter. |
| `input.multiselect` | array → SPL `IN()` | Status codes, categories, tags. |
| `input.text` | string | Free-text keyword search. |
| `input.checkbox` | string | Tri-state / on-off filter. |

**Common mistakes:** `input.radio`, `input.number`, `input.date`,
`input.search` are NOT valid in Dashboard Studio v2. Workarounds at
end of this skill.

## Required shape

```json
"input_index": {
  "type": "input.dropdown",
  "title": "Index",
  "options": {
    "token": "selected_index",
    "defaultValue": "*",
    "items": [
      { "label": "All", "value": "*" },
      { "label": "auth", "value": "auth" }
    ]
  }
}
```

To make the input render, list its key in:

- `layout.globalInputs` — top of dashboard, shared across tabs.
- `layout.layoutDefinitions[].inputs` — scoped to one tab.

A declared input not on either list is dead JSON.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Five flavours only:** `timerange`, `dropdown`, `multiselect`, `text`, `checkbox`. | `input.radio` / `input.number` / `input.date` — fail schema validation. |
| **Timerange `defaultValue`:** comma-separated string `"-24h@h,now"`. | `{"earliest": "-24h@h", "latest": "now"}` — schema rejects object form for timerange. |
| **Multiselect `defaultValue`:** array `["200", "201"]`. | Comma-separated string — silently breaks; input appears empty on first render. |
| **Multiselect into SPL `IN()`:** `IN ($status\|s$)`. | `IN ($status$)` — joins commas with no quotes; `web-01,web-02` chokes. |
| **Numeric input:** `input.text` + `tonumber($val$)` in SPL. | Try `input.number` — doesn't exist. |
| **Dynamic dropdown:** DOS string `> primary \| frame(label, value) \| objects()`. | Literal JSON array for dynamic items — silently ignored. |
| **Dynamic dropdown `enableSmartSources: true`** on the parent search if it depends on upstream tokens. | Skip it — dropdown items render once and freeze. |
| **dataSource `name`:** match regex `^[A-Za-z0-9 \-_.]+$`. | Use `,` `(` `)` `/` `>` `:` in dataSource user-facing names — Studio editor rejects on save. |
| **Layout placement:** list in `globalInputs` or `layoutDefinitions[].inputs`. | Declare an input but skip the layout list — dead JSON. |
| **Free-text:** allow-list / regex-validate, or prefer dropdowns. | Trust free text — no SPL-injection-safe filter exists. |

## `input.timerange` — the special one

```json
"input_global_time": {
  "type": "input.timerange",
  "title": "Time range",
  "options": {
    "token": "global_time",
    "defaultValue": "-24h@h,now"
  }
}
```

- `defaultValue` is **comma-separated string** (NOT object).
- Token has subfields: read `$global_time.earliest$` / `.latest$`,
  never bare `$global_time$`.
- Wire to every search via `defaults.dataSources["ds.search"]
  .options.queryParameters` — see `ds-int-defaults`.

## `input.dropdown` — static items

```json
"options": {
  "token": "selected_index",
  "defaultValue": "*",
  "items": [
    { "label": "All", "value": "*" },
    { "label": "auth", "value": "auth" }
  ]
}
```

`label` shown; `value` written to token.

## `input.dropdown` — dynamic (SPL-driven)

The harder pattern. Verified working JSON:

```json
"input_host_dynamic": {
  "type": "input.dropdown",
  "title": "Host (dynamic)",
  "dataSources": { "primary": "ds_hosts" },
  "options": {
    "token": "host_filter",
    "defaultValue": "*",
    "items": "> primary | frame(label, value) | prepend(formattedStatics) | objects()"
  },
  "context": {
    "formattedConfig": { "number": { "prefix": "" } },
    "formattedStatics": "> statics | formatByType(formattedConfig)",
    "statics": [["All"], ["*"]],
    "label": "> primary | seriesByName('label') | renameSeries('label') | formatByType(formattedConfig)",
    "value": "> primary | seriesByName('label') | renameSeries('value') | formatByType(formattedConfig)"
  }
}
```

Key facts:

- `items` is a **DOS string**, not a JSON array.
- Bound search must produce two columns; rename to `label` / `value`.
- `prepend(formattedStatics)` injects an "All / *" row at the top.
- `context` block required.
- Set `enableSmartSources: true` on `ds_hosts` if it depends on
  upstream tokens.

## `input.multiselect`

```json
"options": {
  "token": "status",
  "defaultValue": ["200", "201"],
  "items": [
    { "label": "200 OK", "value": "200" },
    { "label": "404 Not Found", "value": "404" }
  ]
}
```

Consume in SPL with `|s` filter:

```spl
| search status IN ($status|s$) OR ("$status$" = "*")
```

`|s` quotes each value so `IN()` parses cleanly. The OR clause handles
the "All" sentinel.

**Studio v2 does NOT support** `valuePrefix` / `valueSuffix` /
`delimiter` properties — schema rejects with `must NOT have additional
properties`. Use `|s` filter at consumption time instead.

## `input.text` — free text

```json
"options": { "token": "search_text", "defaultValue": "*" }
```

No SPL-injection-safe filter exists. Treat as substring search:

```spl
| search _raw="*$search_text$*"
```

…and allow-list characters where you can. Prefer dropdowns when the
value space is enumerable.

## `input.checkbox` — tri-state

```json
"options": {
  "token": "only_errors",
  "defaultValue": "false",
  "items": [{ "label": "Errors only", "value": "true" }]
}
```

Token receives the `value` of the checked item, or empty string when
unchecked. Single tri-state; for multi-pick use `input.multiselect`.

## Workarounds for missing types

### Numeric input

```json
"input_topn": {
  "type": "input.text",
  "options": { "token": "topn", "defaultValue": "10" }
}
```

```spl
| eval threshold = tonumber($topn$)
```

If the value space is small, prefer `input.dropdown` with numeric
labels.

### Radio button group

Use `input.dropdown` with the same `items` array. Canonical
single-select widget in Dashboard Studio v2.

## Layout placement

```json
"layout": {
  "type": "absolute",
  "globalInputs": [
    "input_global_time",
    "input_index",
    "input_status",
    "input_search_text",
    "input_host_dynamic"
  ],
  "structure": [ ... panels ... ]
}
```

`globalInputs` order = render order, left to right. Inputs are
auto-arranged (no `x/y`).

For tab-scoped inputs, use
`layoutDefinitions.<tab>.inputs` — see `ds-int-tabs`.

## Two-stage cascading filters

1. Index picker (`input.dropdown`, static) writes `selected_index`.
2. Host picker (`input.dropdown`, dynamic, bound to search filtered by
   `index=$selected_index$`) writes `selected_host`.
3. `enableSmartSources: true` on host search.

## See also

- `ds-int-tokens` — the consumer side of every input.
- `ds-int-defaults` — wires `global_time` into every search automatically.
- `ds-int-tabs` — `layoutDefinitions[].inputs` (tab-scoped).
- `ds-int-drilldowns` — populate input tokens from clicks.
- `ds-ref-syntax` — JSON envelope.
