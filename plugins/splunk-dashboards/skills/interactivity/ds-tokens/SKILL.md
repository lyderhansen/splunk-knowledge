---
name: ds-tokens
description: Tokens are how Dashboard Studio passes user-facing values into searches and visualization options. Read when wiring inputs to data sources, when a panel is not updating, or when adding token filters (|h, |u, |s). Covers $token$ syntax, $token.subfield$ for timerange tokens, $row.<field>.value$ inside drilldowns, $click.value$, token filters, and the most common 'tokens don't resolve' debugging steps. Triggers on 'tokens', 'token filter', '$tok$', 'inputs not affecting search', 'why is my panel not updating'.
version: 1.0
verified_against: Splunk Enterprise 10.2.1
test_dashboards:
  - splunk-knowledge-testing/ds_interactivity_core_dark (§1, §2)
  - splunk-knowledge-testing/ds_interactivity_core_light (§1, §2)
---

# `ds-tokens` — token reference

> Verified live against `ds_interactivity_core_dark` / `_light`. Open the
> dashboard, change any input at the top, and watch the **§1 Token echo**
> panel string update in real time. That panel is just a `splunk.singlevalue`
> bound to a `makeresults | eval msg=...` search that interpolates every
> token — it's the simplest possible proof that token resolution works.

## What a token is

A token is a named value that lives on the dashboard. Inputs *write* tokens
when the user picks a value. Searches and visualization options *read*
tokens via `$token_name$` syntax. When a token's value changes, every
search and option that references it re-evaluates.

Tokens have **no declaration block**. They come into existence the moment
an input declares one in `options.token`, or a drilldown writes one via
`drilldown.setToken`. There is no `tokens: { ... }` top-level key.

## The 4 places tokens come from

1. **Inputs** — `inputs.<id>.options.token: "name"` declares a writeable
   token. The user controls it via the rendered widget. Every input flavour
   (timerange, dropdown, multiselect, text, checkbox, radio, number) emits
   exactly one token.

2. **Drilldown setToken** — `eventHandlers[].type: "drilldown.setToken"`
   captures click context (`row.<field>.value`, `click.value`,
   `click.value2`) into a named token. See `ds-drilldowns`.

3. **URL parameters** — When you navigate to a dashboard from another
   dashboard via `drilldown.linkToDashboard` with `tokens: { "form.host":
   "..." }`, those `form.<name>` URL params populate matching input tokens
   on load.

4. **Defaults** (special) — The `defaults` block at the dashboard root
   uses tokens like `$global_time.earliest$` to wire a global value into
   every `ds.search`. See `ds-defaults`.

## Reading a token

### In SPL (`ds.search.options.query`)

```spl
| stats count by host | search status=$status$ index=$selected_index$
```

### In a visualization option

```json
"options": {
  "majorValue": "$selected_count$"
}
```

### In a DOS expression

Inside DOS strings (the `> primary | ...` syntax), bare `$` characters get
interpreted as token boundaries. Escape with `\$` when you need a literal
dollar sign:

```json
"options": {
  "majorValue": "> primary | seriesByName(\"count\") | lastPoint() | prefix(\"\\$\")"
}
```

## Subfield accessors (timerange only)

`input.timerange` is the one input type whose token is *not* a single
string. It exposes two read-only sub-tokens:

| Token | Value |
|---|---|
| `$global_time.earliest$` | The relative or absolute earliest expression (e.g. `-24h@h`) |
| `$global_time.latest$` | The latest expression (e.g. `now`) |

The bare token `$global_time$` is **not useful** — read either subfield
instead. This is wired into searches via the `defaults` block (see
`ds-defaults`).

## Drilldown context tokens

Inside `eventHandlers` only, additional contextual tokens exist:

| Token | Meaning |
|---|---|
| `$row.<field>.value$` | The value of `<field>` in the clicked row (table/event panels) |
| `$click.value$` | The category / x-axis value the user clicked (charts) |
| `$click.value2$` | The series / second axis value (where applicable, e.g. y in scatter) |
| `$click.name$` | Field name (where applicable) |
| `$click.name2$` | Second field name |

These do **not** persist after the click — they're scoped to the event
handler. To make them persist, use `drilldown.setToken` to copy them into
a named token. See `ds-drilldowns`.

## Token filters

Append `|<filter>` to a token name to transform the value at substitution time:

| Syntax | Filter | Use case |
|---|---|---|
| `$token|s$` | Raw string (default) | SPL search strings (no transformation) |
| `$token|h$` | HTML escape | Injecting into `splunk.markdown` text panels (XSS-safe) |
| `$token|u$` | URL encode | `drilldown.customUrl` and any URL-bound interpolation |

Example from the live test bench:

```json
"url": "https://example.com/investigate?host=$row.host.value|u$&action=$row.action.value|u$"
```

`|u` is mandatory inside `customUrl` — without it a row value containing
`&` or `?` will silently corrupt the URL.

## Multiselect tokens

`input.multiselect` produces a token whose **runtime expansion** depends on
context. The token *value* is an array; when interpolated into SPL it
expands to a comma-separated quoted list. Use it inside `IN()`:

```spl
| where status IN($status$)
```

This is how the live `ds_token_demo` search renders `status=$status$` in
the §1 Token echo output — the array is joined into the literal string.

## "My panel is not updating" — debug ladder

In order from most-likely to least-likely:

1. **Token name typo.** `$selected_index$` vs `$select_index$`. Cmd-F the
   token name across the JSON; it must appear *exactly* the same wherever
   it's read or written.
2. **Input never wrote the token.** Verify `inputs.<id>.options.token`
   matches what searches read. The widget can render fine and still write
   to a different token name.
3. **Input is not on the layout.** An input declared but not listed in
   `layout.globalInputs` (or in a `tabs.layoutDefinitions[].inputs`) does
   not render → can't be changed → token stays at `defaultValue`.
4. **Search does not actually reference the token.** Maybe the search has
   a hardcoded value that overrides where you think the token goes.
5. **`enableSmartSources` is off.** When using DOS-typed tokens for input
   items (the dynamic dropdown pattern), the parent `ds.search` must
   have `options.enableSmartSources: true` to re-fire when the upstream
   input changes. Without it, the dropdown items render once and freeze.
6. **Scope problem with timerange.** Always use `$token.earliest$` /
   `$token.latest$`, never bare `$token$`, for `input.timerange`.

The §1 Token echo panel is purpose-built for step 4 — if the value shows
up there, the token is resolving. If it doesn't, the wiring is broken
upstream.

## Reserved namespaces

- `form.<name>` — populated from URL query params on dashboard load. Used
  by `drilldown.linkToDashboard` to pass values across dashboards.
- `row.<field>.value` / `row.<field>.name` — drilldown event scope only.
- `click.*` — drilldown event scope only.
- `<token>.earliest` / `<token>.latest` — automatic for `input.timerange`.

Avoid using these prefixes for your own input tokens.

## Common gotchas

- **Quotes in DOS context.** Inside DOS strings, fields are referenced
  with escaped double quotes: `seriesByName(\"count\")`. The token
  expansion happens before DOS parses, so a token containing a `"` will
  break DOS — sanitize with allow-listed values.
- **Token filters apply at substitution time.** They run on the *value*,
  not on the search. So `$search_text|s$` keeps the value raw — it does
  *not* escape SPL metacharacters. There is no SPL-injection-safe filter;
  use input allow-lists instead of free text where possible.
- **`defaultValue` is a string for most inputs, an array for multiselect,
  and a comma-separated string for timerange.** Schema validation rejects
  the object form for timerange (see `ds-inputs`).
- **`$row.<field>.value$` is case-sensitive.** Field name must match what
  Splunk produces. If your SPL renames a field, the renamed name is what
  the drilldown sees.
- **You cannot read a token before any input has written to it.** On
  first load, before defaults populate, inputs may briefly show empty
  values. Set `defaultValue` on every input you depend on.

## Quick recipes

### Echo every token to a single panel

Best debug pattern. The `§1 Token echo` panel in the live test bench:

```json
"ds_token_demo": {
  "type": "ds.search",
  "options": {
    "query": "| makeresults | eval msg=\"index=$selected_index$ status=$status$ filter=$search_text$ host=$host_filter$ time=$global_time.earliest$..$global_time.latest$\" | table msg"
  }
},
"viz_token_echo": {
  "type": "splunk.singlevalue",
  "dataSources": {"primary": "ds_token_demo"},
  "options": {
    "majorValue": "> primary | seriesByName(\"msg\") | lastPoint()"
  }
}
```

### Use a multiselect inside a search

```spl
| stats count by host | where status IN($status$)
```

`status` is declared as `input.multiselect` with `defaultValue: ["200","201"]`.

### Pass tokens to another dashboard

```json
{
  "type": "drilldown.linkToDashboard",
  "options": {
    "app": "search",
    "dashboard": "host_detail_view",
    "tokens": {
      "form.host":     "$row.host.value$",
      "form.earliest": "$global_time.earliest$"
    }
  }
}
```

The receiving dashboard must declare an input with `token: "host"` for
`form.host` to land somewhere readable.

## See also

- `ds-inputs` — for declaring what writes tokens.
- `ds-defaults` — for wiring tokens (specifically `global_time`) into every
  `ds.search`.
- `ds-drilldowns` — for the click-time tokens (`row.*`, `click.*`) and
  `setToken` action.
- `ds-visibility` — for using token state to show/hide panels.
- `reference/ds-syntax` — the legacy monolith. Same content, less focus.
