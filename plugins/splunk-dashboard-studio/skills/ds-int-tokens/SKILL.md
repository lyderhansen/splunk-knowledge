---
name: ds-int-tokens
description: Splunk Dashboard Studio token reference — how dashboards pass user-facing values into searches and visualization options. Covers $token$ syntax, $token.subfield$, token filters (|h |u |s), expressions stanza (eval and conditions), $eval:name$ reference syntax (works in markdown/SPL/setToken value, does NOT work in input.timerange defaultValue), JSONata syntax (NOT SPL eval — & for concat, ? : ternary, $now()), and version requirements (Enterprise 10.2+ / Cloud 10.1.2507+). Use when the user asks about tokens, eval expressions, derived tokens, $eval:name$, why a panel isn't updating, or token filters in Splunk Dashboard Studio.
---

# ds-int-tokens — token reference

Verified against Splunk Enterprise 10.2.1.
Live test bench: `splunk-knowledge-testing/ds_interactivity_core_dark`
§1 Token echo panel.

## What a token is

A named value that lives on the dashboard. Inputs **write** tokens
when the user picks a value. Searches and viz options **read** tokens
via `$token_name$` syntax. When a token's value changes, every search
and option that references it re-evaluates.

**No declaration block.** Tokens come into existence when an input
declares one in `options.token`, or when a drilldown writes one via
`drilldown.setToken`. There is no `tokens: { ... }` top-level key.
The `expressions` stanza (Enterprise 10.2+ / Cloud 10.1.2507+) is now
a supported top-level key for derived/computed tokens.

## The 5 places tokens come from

1. **Inputs** — `inputs.<id>.options.token: "name"` declares a
   writeable token.
2. **Drilldown setToken** — `eventHandlers[].type: "drilldown.setToken"`
   captures click context (`row.<field>.value`, `click.value`,
   `click.value2`) into a named token.
3. **URL parameters** — `drilldown.linkToDashboard` passes `form.<name>`
   URL params that populate matching input tokens on load.
4. **Defaults** — `defaults.tokens.default` initialises tokens to
   stable values before first interaction.
5. **Eval expressions** — `expressions.eval` computes derived values from
   other tokens. Referenced via `$eval:name$`. Requires Enterprise 10.2+
   / Cloud 10.1.2507+.

## Reading a token

```spl
# In SPL (ds.search.options.query)
| stats count by host | search status=$status$ index=$selected_index$
```

```json
"options": { "majorValue": "$selected_count$" }
```

Inside DOS strings, escape literal `$`:

```json
"options": {
  "majorValue": "> primary | seriesByName('count') | lastPoint() | prefix('\\$')"
}
```

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Multiselect into SPL `IN()`:** `IN ($status\|s$)`. Quotes each value. | `IN ($status$)` — joins with commas, no quotes; `web-01,web-02` parses literally and chokes on the dash. |
| **Multiselect "All" sentinel:** `WHERE x IN ($tok\|s$) OR ("$tok$" = "*")`. | Skip the OR clause — selecting "*" produces invalid SPL. |
| **Timerange:** `$global_time.earliest$` / `$global_time.latest$`. | Bare `$global_time$` — not useful, returns a non-string container. |
| **URL drilldown:** `|u` filter mandatory inside `customUrl`. | Skip `|u` — values containing `&` or `?` silently corrupt the URL. |
| **Markdown XSS-safe:** `|h` filter when interpolating user-controlled tokens. | Pass raw user-controlled tokens into `splunk.markdown` — XSS surface. |
| **Initial state:** seed tokens via `defaults.tokens.default`. | Read tokens before any input has written — you'll get blank or break visibility conditions. |
| **Drilldown token capture:** `drilldown.setToken` to persist `row.*` / `click.*` after the click. | Try to read `$row.<field>.value$` outside an event handler — scoped to the click only. |
| **Token names:** match exactly across reads + writes. | `$selected_index$` vs `$select_index$` — typos = silent no-update. |
| **Reserved namespaces:** avoid `form.*`, `row.*`, `click.*`, `<token>.earliest` / `.latest` for your own tokens. | Reuse reserved names — they collide with framework. |
| **Eval expressions:** use `$eval:name$` for derived/computed values (JSONata). | SPL eval syntax in expressions — Dashboard Studio uses JSONata, not SPL. |
| **`$eval:name$`:** use in markdown, SPL queries, panel titles, `setToken.value`. | `$eval:name$` in `input.timerange defaultValue` — shows "Invalid value" (live-tested). |

## Token filters

Append `|<filter>` to transform value at substitution time:

| Filter | What it does | Use case |
|---|---|---|
| `\|s` | **Quote each value** (string-quote) | Multiselect → SPL `IN()` |
| `\|h` | HTML escape | Inside `splunk.markdown` (XSS-safe) |
| `\|u` | URL encode | `drilldown.customUrl`, any URL interpolation |

Default (no filter) emits raw value: a string for single tokens; a
comma-separated joined list for multiselect arrays (no quoting).

## Subfield accessors (timerange only)

| Token | Value |
|---|---|
| `$global_time.earliest$` | Earliest expression (e.g. `-24h@h`). |
| `$global_time.latest$` | Latest expression (e.g. `now`). |

Wired into searches via the `defaults` block — see `ds-int-defaults`.

## Drilldown context tokens (event-scoped)

| Token | Meaning |
|---|---|
| `$row.<field>.value$` | Value of `<field>` in clicked row (table/event panels). |
| `$click.value$` | Category / x-axis value the user clicked (charts). |
| `$click.value2$` | Series / second axis value (scatter, bubble, sankey). |
| `$click.name$` / `$click.name2$` | Field names where applicable. |

These do **not** persist after the click. Use `drilldown.setToken` to
copy them into a named token. See `ds-int-drilldowns`.

## "Panel not updating" — debug ladder

In order from most-likely to least-likely:

1. **Token name typo.** Cmd-F across the JSON; must appear *exactly*
   the same wherever read or written.
2. **Input never wrote the token.** Verify
   `inputs.<id>.options.token` matches what searches read.
3. **Input is not on the layout.** Declared but not listed in
   `layout.globalInputs` or `tabs.layoutDefinitions[].inputs` →
   doesn't render → can't be changed → token stays at `defaultValue`.
4. **Search does not actually reference the token.** Hardcoded value
   may be overriding where you think the token goes.
5. **`enableSmartSources` is off.** Required for DOS-typed dynamic
   dropdown items to refresh on upstream changes.
6. **Scope problem with timerange.** Use `$token.earliest$` /
   `$token.latest$`, never bare `$token$`.

The §1 Token echo panel in the live bench is purpose-built for step 4
— if the value shows up there, the token is resolving. If not, the
wiring is broken upstream.

## Quick recipes

### Echo every token to a single panel (debug)

```json
"ds_token_demo": {
  "type": "ds.search",
  "options": {
    "query": "| makeresults | eval msg=\"index=$selected_index$ status=$status$ filter=$search_text$ host=$host_filter$ time=$global_time.earliest$..$global_time.latest$\" | table msg"
  }
},
"viz_token_echo": {
  "type": "splunk.markdown",
  "options": {
    "markdown": "**Resolved**: `index=$selected_index$ status=$status$ time=$global_time.earliest$..$global_time.latest$`"
  }
}
```

Markdown form is preferred — supports token interpolation natively
without an SPL round-trip.

### Multiselect inside a search

```spl
| stats count by host | where status IN ($status|s$) OR ("$status$" = "*")
```

`status` declared as `input.multiselect` with `defaultValue: ["200","201"]`.

### Pass tokens to another dashboard

```json
{
  "type": "drilldown.linkToDashboard",
  "options": {
    "app": "search",
    "dashboard": "host_detail_view",
    "tokens": [
      { "token": "host",     "value": "row.host.value" },
      { "token": "earliest", "value": "global_time.earliest" }
    ]
  }
}
```

`tokens` is an **array of `{token, value}` objects**, NOT a map.
Receiving dashboard must declare inputs with matching `token` names.

## Token eval expressions (Enterprise 10.2+ / Cloud 10.1.2507+)

**Announced:** October 29, 2025. Official docs: [Splunk 10.4 Token Manager](https://help.splunk.com/en/splunk-cloud-platform/create-dashboards-and-reports/dashboard-studio/10.4.2604/make-dashboards-dynamic-and-interactive/tokens/token-manager)

### Version requirements

| Feature | Splunk Cloud | Splunk Enterprise |
|---|---|---|
| Token eval (`expressions.eval`) | 10.1.2507 | 10.2 |
| `input.button` | 10.1.2507 | 10.2 |
| `containerOptions.visibility` | 10.1.2507 | 10.2 |
| Conditional panel visibility | 9.0.2303 | 9.1 |

### The `expressions` stanza (JSON syntax)

Top-level sibling of `dataSources`, `visualizations`, `layout`:

```json
{
  "expressions": {
    "conditions": {
      "condition_abc": {
        "name": "show details",
        "value": "$detailsVisibility$ = \"true\""
      }
    },
    "eval": {
      "eval_uniqueId": {
        "name": "expressionName",
        "value": "JSONata expression here"
      }
    }
  }
}
```

**Key points:**
- `conditions` evaluate to boolean — used for visibility (`showConditions`/`hideConditions`)
- `eval` expressions evaluate to string, number, boolean, or array
- Object keys (`eval_uniqueId`) are internal IDs — `name` is the reference identifier used in `$eval:name$`
- Expressions re-evaluate whenever their dependency tokens change

### CRITICAL: JSONata syntax, NOT SPL eval

Dashboard Studio uses **JSONata** (https://docs.jsonata.org/overview.html), NOT SPL eval. Common differences:

| Operation | JSONata | SPL eval |
|---|---|---|
| String concatenation | `&` | `.` or `+` |
| Ternary | `condition ? value : other` | `if()` |
| Date function | `$now('format')` | `strftime()` |
| Token reference | `$name$` inside expression | — |

### $eval:name$ reference syntax

The `name` field (NOT the object key) is used in `$eval:name$`:

**Confirmed working locations:**
- Markdown: `"markdown": "## $eval:welcome message$"`
- SPL queries: `"query": "| makeresults | eval field=$eval:CombinedRevenue$"`
- Input labels: `"label": "$eval:detailsBtnLabel$"`
- Panel titles, options values
- `setToken.value`: `"value": "$eval:toggleDetails$"`

**Does NOT work:**
- `input.timerange defaultValue` — shows "Invalid value" (live-tested)
- Direct `$eval:name$` in `linkToDashboard` tokens — eval does not recompute before navigation fires. Use the three-handler chain instead (see `ds-int-drilldowns`).

### Working examples (from official Splunk 10.4 docs)

**Arithmetic — addition:**
```json
"eval_V7nqJNlY": {
  "name": "CombinedRevenue",
  "value": "$NovaStreamRevenue$+$NovaAnalyticsRevenue$"
}
```
Used in SPL: `"query": "| makeresults | eval field=$eval:CombinedRevenue$"`

**String with date function:**
```json
"eval_YKKOO7sw": {
  "name": "welcome message",
  "value": "'Hello!\\nToday is ' & $now('[MNn,-3] [D01], [Y0001]')"
}
```

**Ternary toggle (two dependent evals):**
```json
"expr_1": {
  "name": "detailsBtnLabel",
  "value": "$detailsVisibility$ = 'true' ? 'Show overview' : 'Show details'"
},
"expr_2": {
  "name": "toggleDetails",
  "value": "$detailsVisibility$ = 'true' ? 'false' : 'true'"
}
```

**Epoch arithmetic (±N minutes for cross-dashboard time ranges):**
```json
"eval_earliest": { "name": "EARLIEST", "value": "$click_epoch$-300" },
"eval_latest":   { "name": "LATEST",   "value": "$click_epoch$+300" }
```
Note: `_epoch_time=_time` in SPL gives numeric epoch; `$toMillis()` is only needed for ISO 8601 strings from `row._time.value`.

### JSONata operators

| Category | Operators |
|---|---|
| Arithmetic | `+`, `-`, `*`, `/` |
| Comparison | `=`, `!=`, `<`, `>`, `<=`, `>=` |
| Ternary | `condition ? true_value : false_value` |
| String concat | `&` (NOT `+` or `.`) |
| Functions | `$now('format')`, full JSONata library |

Reference: https://docs.jsonata.org/overview.html

## See also

- `ds-int-inputs` — declaring widgets that write tokens.
- `ds-int-defaults` — wiring tokens (especially `global_time`) into every
  `ds.search`.
- `ds-int-drilldowns` — click-time tokens (`row.*`, `click.*`) +
  `setToken` action + three-handler chain cross-dashboard recipe.
- `ds-int-visibility` — using token state and `expressions.eval` to show/hide panels.
- `ds-ref-syntax` — JSON envelope.
