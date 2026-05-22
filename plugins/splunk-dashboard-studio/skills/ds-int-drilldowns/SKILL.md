---
name: ds-int-drilldowns
description: Splunk Dashboard Studio drilldown reference — click handlers that fire on row, point, or marker click. Covers setToken (key reads click context, value sets literal/computed), linkToSearch, linkToDashboard (ARRAY with value field only — NOT key, NOT object map), customUrl (|u mandatory), columnFormat.data (DS expression starting with >), and three-handler chain for cross-dashboard ±N minute time ranges. Use when the user asks about drilldowns, click handlers, eventHandlers, setToken, linkToDashboard, cross-dashboard navigation, or master-detail flows in Splunk Dashboard Studio.
---

# ds-int-drilldowns — click handler reference

Verified against Splunk Enterprise 10.2.1.
Live test bench: `splunk-knowledge-testing/ds_interactivity_core_dark`
§4 Drilldown panels.

## What a drilldown is

An entry in a visualization's `eventHandlers` array that runs when the
user clicks something inside that panel. The handler declares a `type`
and an `options` block specific to that type.

**Multiple handlers on one panel all fire on the same click**, in
array order — capture token AND navigate is a common pattern.

Drilldowns require `options.drilldown: "all"` (or `"row"` / `"cell"`
for tables) to be set on the panel — without it, clicks render no
handler events.

## The 4 action types

| Type | Effect |
|---|---|
| `drilldown.setToken` | Capture click context into named tokens. Updates dashboard in place. |
| `drilldown.linkToSearch` | Open Splunk Search UI with prefilled query and time range. |
| `drilldown.linkToDashboard` | Navigate to another dashboard, optionally passing tokens. |
| `drilldown.customUrl` | Open arbitrary URL (external system, ITSM, runbook). |

## Click context tokens

Transient — only exist during the click. Copy via `setToken` to
persist.

| Token | Available in | Meaning |
|---|---|---|
| `$row.<field>.value$` | Tables, events | Value of `<field>` in clicked row. |
| `$row.<field>.name$` | Tables, events | Field name (rare; generic handlers). |
| `$click.value$` | Charts | Category / x-axis value. |
| `$click.value2$` | Scatter, bubble, dual-axis | Y-axis or secondary value. |
| `$click.name$` | Charts | Field name on x-axis. |
| `$click.name2$` | Charts | Field name on y-axis. |

Tables emit `$row.*$`; charts emit `$click.*$`. Mutually exclusive.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Enable on panel:** `options.drilldown: "all"` (or `"row"` / `"cell"` for tables). | Skip — clicks fire no handlers. |
| **`setToken.tokens`:** array; use `key` to read click context OR `value` to set literal/computed. | `tokens: { selected_host: "row.host.value" }` — schema rejects map form. |
| **`linkToDashboard.tokens`:** array of `{token, value}` objects ONLY — `value` sets the URL parameter. | Use `key` in `linkToDashboard` — values arrive as `undefined` on target dashboard (live-tested). |
| **`linkToDashboard.tokens`:** array form only. | Object map `{ "name": "row.field.value" }` — `e.map is not a function` (live-tested). |
| **`key` / `value` are BARE** (`row.host.value`). | Wrap in `$...$` — treated as literal. |
| **`linkToDashboard.token`:** destination name on receiving dashboard. **No `form.` prefix.** | `"token": "form.host"` — Studio resolves raw names; `form.<name>` is Simple-XML/Classic. |
| **`customUrl`:** `\|u` filter on every interpolated token. | Skip `\|u` — `&` / `?` / `#` / `=` in values silently break the URL. |
| **Charts vs tables:** `$click.*$` for charts, `$row.<field>.value$` for tables. | Read `$click.value$` from a table — produces empty token. |
| **Multiple handlers:** stack in `eventHandlers` array (capture + navigate). | Try to share state across separate panels via `eventHandlers` — handlers are panel-local. |
| **Shape panels (ellipse/rectangle):** use as static buttons (`linkToDashboard` / `customUrl`). | Expect click `name`/`value`/`series` payload — shapes have none. |
| **`columnFormat.data`:** DS expression starting with `>`: `"> table | seriesByName(\"field\")"`. | Plain string `"field_name"` — `e.map is not a function` (live-tested). |

## `drilldown.setToken`

`tokens` supports two field types — `key` and `value` serve different purposes:

- **`key`** — reads FROM drilldown context (click event data). Use when the token value comes from what was clicked.
- **`value`** — sets a literal string, `$eval:name$` reference, or `$token$` reference. Use for computed/fixed values.

```json
"eventHandlers": [
  {
    "type": "drilldown.setToken",
    "options": {
      "tokens": [
        { "token": "selected_host",   "key": "row.host.value" },
        { "token": "selected_action", "key": "row.action.value" }
      ]
    }
  }
]
```

Both `key` and `value` are bare — no `$...$` wrapping. `token` is the destination name; created if it doesn't exist.

**Button handler example (uses `value` to set computed result):**
```json
{ "token": "detailsVisibility", "value": "$eval:toggleDetails$" }
```

## `drilldown.linkToSearch`

```json
{
  "type": "drilldown.linkToSearch",
  "options": {
    "query": "index=main host=$row.host.value$ | stats count by sourcetype",
    "earliest": "$global_time.earliest$",
    "latest":   "$global_time.latest$",
    "newTab":   true
  }
}
```

`query` interpolates `$row.<field>.value$` and other context tokens
before the URL is constructed.

## `drilldown.linkToDashboard`

```json
{
  "type": "drilldown.linkToDashboard",
  "options": {
    "app": "splunk-knowledge-testing",
    "dashboard": "ds_interactivity_core_dark",
    "newTab": true,
    "tokens": [
      { "token": "selected_host",        "value": "row.host.value" },
      { "token": "global_time.earliest", "value": "global_time.earliest" },
      { "token": "global_time.latest",   "value": "global_time.latest" }
    ]
  }
}
```

**Hard rules for `linkToDashboard.tokens` (live-tested):**

| # | Format | Result |
|---|--------|--------|
| Object map `{ "name": "row.field.value" }` | **`e.map is not a function`** — Splunk calls `.map()` on tokens |
| Array + `key` `[{ "token": "n", "key": "row.field.value" }]` | No error but values arrive as **`undefined`** on target |
| Array + `value` `[{ "token": "n", "value": "row.field.value" }]` | **WORKS** — matches Splunk UI "Token Value" column |

- `tokens` must be an **array** of `{token, value}` objects — use `value`, NOT `key`.
- Values are bare (`row.host.value`, no `$...$`).
- `token` is the destination name on the receiving dashboard. **No `form.` prefix.**
- To pass `$eval:name$` results, use the three-handler chain (see below) — eval does NOT recompute before navigation fires if passed directly.

The receiving dashboard must declare an input or `defaults.tokens.default` entry for each passed token.

## `drilldown.customUrl`

```json
{
  "type": "drilldown.customUrl",
  "options": {
    "url": "https://example.com/investigate?host=$row.host.value|u$&action=$row.action.value|u$",
    "newTab": true
  }
}
```

`|u` is **mandatory** for any token in a URL. Without it, values
containing `&`, `?`, `#`, `=` silently break the URL.

## `columnFormat.data` gotcha

`splunk.table` `columnFormat` entries require `data` to be a DS
expression starting with `>` — a plain string causes `e.map is not a
function`.

```text
WRONG: "columnFormat": { "field": { "data": "field_name" } }
RIGHT: "columnFormat": { "field": { "data": "> table | seriesByName(\"field_name\")" } }
```

Full official form (with row colors):
```json
"columnFormat": {
  "_time": {
    "data": "> table | seriesByName(\"_time\") | formatByType(_timeColumnFormatEditorConfig)"
  },
  "count": {
    "data": "> table | seriesByName(\"count\") | formatByType(countColumnFormatEditorConfig)",
    "rowColors": "> table | seriesByName(\"_has_stock\") | rangeValue(countRowColorsEditorConfig)"
  }
}
```

## Multiple handlers — capture AND navigate

```json
"eventHandlers": [
  {
    "type": "drilldown.setToken",
    "options": { "tokens": [{ "token": "selected_host", "key": "row.host.value" }] }
  },
  {
    "type": "drilldown.linkToDashboard",
    "options": {
      "app": "search",
      "dashboard": "host_detail_view",
      "tokens": [{ "token": "host", "value": "row.host.value" }]
    }
  }
]
```

Token write happens before navigation; on dashboard return, source
dashboard remembers click context.

## Cross-dashboard ±N minute time range recipe (three-handler chain)

**Use case:** Click an event in Dashboard 1, open Dashboard 2 showing events ±5 minutes around that timestamp. Requires Enterprise 10.2+ / Cloud 10.1.2507+ for `expressions.eval`.

**Why a chain?** `$eval:name$` passed directly to `linkToDashboard` does NOT work — eval does not recompute before navigation fires (live-tested: values arrive computed from defaults, not the clicked row). The fix is a second `setToken` that materializes the eval result into a regular token before navigation.

**SPL requirement:** Only one helper field: `eval _epoch_time=_time`. No `_earliest`/`_latest` pre-computation. The `expressions.eval` block handles the ±N arithmetic.

**`$toMillis()` note:** Not needed when `_epoch_time=_time` (numeric epoch). Only required when working with ISO 8601 string from `row._time.value`.

### Dashboard 1 — expressions block

```json
"expressions": {
  "eval": {
    "eval_earliest": { "name": "EARLIEST", "value": "$click_epoch$-300" },
    "eval_latest":   { "name": "LATEST",   "value": "$click_epoch$+300" }
  }
}
```

### Dashboard 1 — three-handler chain

```json
"eventHandlers": [
  {
    "type": "drilldown.setToken",
    "options": { "tokens": [{ "token": "click_epoch", "key": "row._epoch_time.value" }] }
  },
  {
    "type": "drilldown.setToken",
    "options": {
      "tokens": [
        { "token": "earliest", "value": "$eval:EARLIEST$" },
        { "token": "latest",   "value": "$eval:LATEST$"   }
      ]
    }
  },
  {
    "type": "drilldown.linkToDashboard",
    "options": {
      "app": "my_app",
      "dashboard": "event_context",
      "newTab": true,
      "tokens": [
        { "token": "click_time",     "value": "row._time.value" },
        { "token": "click_earliest", "value": "$earliest$" },
        { "token": "click_latest",   "value": "$latest$" },
        { "token": "click_host",     "value": "row.host.value" }
      ]
    }
  }
]
```

**How it works:**
1. Handler 1 (`setToken`): captures `row._epoch_time.value` → `$click_epoch$`
2. Eval expressions recompute: `$click_epoch$ ± 300`
3. Handler 2 (`setToken`): reads `$eval:EARLIEST$` / `$eval:LATEST$` → materializes into regular tokens `$earliest$` / `$latest$`
4. Handler 3 (`linkToDashboard`): passes `$earliest$` / `$latest$` as regular tokens (already resolved)
5. Dashboard 2: receives regular tokens → `input.timerange defaultValue` works

**Dashboard 2 time picker (seeded from regular tokens, NOT eval):**
```json
"input_time": {
  "type": "input.timerange",
  "options": {
    "token": "global_time",
    "defaultValue": "$click_earliest$,$click_latest$"
  }
}
```

**Note:** `$eval:name$` does NOT work in `input.timerange defaultValue` — shows "Invalid value" (live-tested). Always pass pre-materialized regular tokens.

**Full recipe details:** `tests/test40_rema/HANDOVER-token-eval.md` Part B. See also `ds-int-tokens` for `expressions.eval` JSONata syntax.

## Enabling drilldowns on the panel

```json
"options": { "drilldown": "all" }
```

Valid values:

- `"all"` — any click fires handlers (default for charts).
- `"row"` — table-only, click anywhere in a row.
- `"cell"` — table-only, specific cell. `$click.value$` is cell value.
- `"none"` — disabled.

If clicks aren't firing handlers, this is the second thing to check
after handler shape.

## See also

- `ds-int-tokens` — `$row.*$` / `$click.*$` context tokens explained.
- `ds-int-inputs` — receiving side for `linkToDashboard`-forwarded tokens.
- `ds-int-visibility` — what to do with `$selected_*$` tokens captured via
  `setToken` (RAG flips, panel show/hide).
- `ds-ref-syntax` — full event-handler option reference.
