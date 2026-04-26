---
name: ds-inputs
description: Inputs are the user-facing widgets — time pickers, dropdowns, multiselects, text fields, checkboxes, radios, number sliders — that write tokens consumed by every search and option on the dashboard. Read when adding a filter to a dashboard, when wiring a global time picker, when building a dynamic dropdown driven by SPL, or when a layout is missing a search filter widget. Triggers on 'input', 'time picker', 'dropdown', 'multiselect', 'global filter', 'how do I let users pick a value', 'dynamic dropdown'.
version: 1.0
verified_against: Splunk Enterprise 10.2.1
test_dashboards:
  - splunk-knowledge-testing/ds_interactivity_core_dark (§1)
  - splunk-knowledge-testing/ds_interactivity_core_light (§1)
---

# `ds-inputs` — input widget reference

> Verified against `ds_interactivity_core_dark` / `_light`. The first row of
> the live test bench renders all five flavours used in production:
> timerange, dropdown, multiselect, text, dynamic-dropdown.

## What an input does

An input renders a widget at the top of the dashboard (or inside a tab via
`layoutDefinitions[].inputs`) and writes a single named token whenever the
user changes its value. Every panel or option that reads `$token$` then
re-evaluates. See `ds-tokens` for the consumption side.

## The 7 flavours

| Type | Token shape | Common use |
|---|---|---|
| `input.timerange` | object — read via `.earliest` / `.latest` | Global time filter |
| `input.dropdown` | string | Single-pick filter (index, host, severity) |
| `input.multiselect` | array → `IN()` | Status codes, categories, tags |
| `input.text` | string | Free-text search keyword |
| `input.checkbox` | string | One-of-many, tri-state-style filters |
| `input.radio` | string | Mutually exclusive small set |
| `input.number` | number (slider/spinner) | Threshold, top-N |

The core test bench exercises the first four plus the dynamic-dropdown
pattern (which is `input.dropdown` with SPL-driven `items`).

## Required shape

Every input has the same skeleton:

```json
"input_index": {
  "type": "input.dropdown",
  "title": "Index",
  "options": {
    "token": "selected_index",
    "defaultValue": "*",
    "items": [
      {"label": "All", "value": "*"},
      {"label": "auth", "value": "auth"}
    ]
  }
}
```

| Field | Required | Notes |
|---|---|---|
| `type` | yes | One of the 7 above. |
| `title` | yes for layout | What renders above the widget. |
| `options.token` | yes | Token name written on change. No leading `$`. |
| `options.defaultValue` | strongly recommended | What the token resolves to before any user interaction. |
| `options.items` | type-dependent | Array for dropdown/multiselect/checkbox/radio; DOS expression for dynamic. |

To make the input *actually render*, list its key in either:

- `layout.globalInputs` — top of dashboard, shared across tabs.
- `layout.layoutDefinitions[].inputs` — scoped to one tab.

A declared input not on either list is dead JSON.

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

- **`defaultValue` is a comma-separated string**: `"<earliest>,<latest>"`.
  The schema rejects `{"earliest": "...", "latest": "..."}` form here.
- The **token has subfields**: read `$global_time.earliest$` and
  `$global_time.latest$` — never bare `$global_time$`.
- Wire to every search via `defaults.dataSources["ds.search"]
  .options.queryParameters` (see `ds-defaults`).

## `input.dropdown` — single string

Static items:

```json
"input_index": {
  "type": "input.dropdown",
  "options": {
    "token": "selected_index",
    "defaultValue": "*",
    "items": [
      {"label": "All", "value": "*"},
      {"label": "auth", "value": "auth"}
    ]
  }
}
```

`items` is `[{label, value}]`. `label` is shown; `value` is what the
token receives.

### Dynamic items (SPL-driven)

This is the harder pattern, and the one that breaks most often. Verified
working JSON from the live bench:

```json
"input_host_dynamic": {
  "type": "input.dropdown",
  "title": "Host (dynamic)",
  "dataSources": {"primary": "ds_hosts"},
  "options": {
    "token": "host_filter",
    "defaultValue": "*",
    "items": "> primary | frame(label, value) | prepend(formattedStatics) | objects()"
  },
  "context": {
    "formattedConfig": {"number": {"prefix": ""}},
    "formattedStatics": "> statics | formatByType(formattedConfig)",
    "statics": [["All"], ["*"]],
    "label": "> primary | seriesByName(\"label\") | renameSeries(\"label\") | formatByType(formattedConfig)",
    "value": "> primary | seriesByName(\"label\") | renameSeries(\"value\") | formatByType(formattedConfig)"
  }
}
```

Key facts:

- `items` is a **DOS string**, not a JSON array.
- The bound `ds.search` must produce two columns; rename to `label` and
  `value` in SPL or via `seriesByName(...) | renameSeries(...)`.
- `prepend(formattedStatics)` injects an "All / *" row at the top — this
  is the standard pattern for "no filter" semantics.
- The `context` block is required; DOS resolves `formattedStatics`,
  `label`, `value` from there.
- The host search `ds_hosts` should have
  `options.enableSmartSources: true` if it itself depends on upstream
  tokens (e.g. an index picker further upstream).

## `input.multiselect` — array with `IN()`

```json
"input_status": {
  "type": "input.multiselect",
  "options": {
    "token": "status",
    "defaultValue": ["200", "201"],
    "items": [
      {"label": "200 OK", "value": "200"},
      {"label": "404 Not Found", "value": "404"}
    ]
  }
}
```

- **`defaultValue` is an array**, not a comma-separated string.
- Consume in SPL with `IN()`:

  ```spl
  | search status IN($status$)
  ```

- Avoid `status=$status$` — that resolves to literal `"200,201"` and
  matches nothing.

## `input.text` — free text

```json
"input_search_text": {
  "type": "input.text",
  "options": {
    "token": "search_text",
    "defaultValue": "*"
  }
}
```

There is **no SPL-injection-safe filter** for text inputs. If the user
types `*) OR earliest=0 OR (` you have a problem. Treat free text as
substring search candidates only:

```spl
| search _raw="*$search_text$*"
```

…and even then, allow-list characters where you can. Prefer dropdowns
when the value space is enumerable.

## `input.checkbox` / `input.radio` — small enums

Same shape as dropdown (`items: [{label, value}]`), but the widget shape
differs. Use radio for ≤4 mutually exclusive options, checkbox for "this
or nothing" toggles.

## `input.number`

```json
"input_topn": {
  "type": "input.number",
  "options": {
    "token": "topn",
    "defaultValue": 10,
    "min": 1,
    "max": 100,
    "step": 1
  }
}
```

`min` / `max` / `step` are optional but recommended — without them the
widget is a free-form numeric.

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

`globalInputs` order = render order, left to right. Inputs are not
positioned with `x/y` like panels — Studio auto-arranges them.

For **tab-scoped** inputs, omit them from `globalInputs` and instead use:

```json
"layoutDefinitions": {
  "details_tab": {
    "type": "absolute",
    "inputs": ["input_host_dynamic"],
    "structure": [ ... ]
  }
}
```

See `ds-tabs`.

## Common gotchas

- **Bound dataSource `name` is regex-validated.** A dynamic dropdown
  references a `dataSource` (e.g. `ds_hosts` above). That dataSource's
  user-facing `name` field must match `^[A-Za-z0-9 \-_.]+$` — letters,
  numbers, spaces, dashes, underscores, periods only. Common offenders
  in question-driven names: `,` `(` `)` `/` `>` `:`. The Studio editor
  rejects illegal names on save. See `reference/ds-syntax` and
  `pipeline/ds-validate` (`dataSource-name-illegal-chars`).
- **Multiselect default must be an array.** A string default silently
  breaks; the input appears empty on first render.
- **Dynamic dropdown freezes if `enableSmartSources` is off** on the
  parent search. Smart sources is what makes the bound search re-fire
  when an upstream input changes.
- **`defaultValue` for timerange is `"-24h@h,now"`, not `["-24h@h",
  "now"]`.** Schema rejects array form here, accepts it for multiselect.
- **Tokens not declared on a layout don't render.** A common mistake when
  copy-pasting inputs across dashboards.
- **`title` is the visible label.** There's no separate `label` field.
- **Free-text inputs are SPL-injection vectors.** No built-in filter
  escapes SPL metacharacters. Allow-list, regex-validate, or use
  enumerated inputs instead.
- **Dynamic dropdown `items` is DOS, not JSON.** A literal array there
  is silently ignored.

## Quick recipes

### "All" option in a dynamic dropdown

The `prepend(formattedStatics)` pattern documented above. Without it,
your users can't see *all* hosts — they have to pick one.

### Two-stage cascading filters

1. Index picker (`input.dropdown`, static items) writes
   `selected_index`.
2. Host picker (`input.dropdown`, dynamic, bound to a search filtered by
   `index=$selected_index$`) writes `selected_host`.
3. Set `enableSmartSources: true` on the host search so it re-fires when
   index changes.

### Timerange + topN

Two inputs, two tokens, both consumed in one search:

```spl
| tstats count where index=* by host
  | head $topn$
  | sort -count
```

The `$global_time.earliest$ / $global_time.latest$` come in via
`defaults`, not by literal interpolation in the query.

## See also

- `ds-tokens` — the consumer side of every input.
- `ds-defaults` — wires `global_time` into every search automatically.
- `ds-tabs` — for `layoutDefinitions[].inputs` (tab-scoped inputs).
- `ds-drilldowns` — to populate input tokens from clicks.
- `reference/ds-syntax` — the legacy monolith.
