---
name: ds-drilldowns
description: Drilldowns are click handlers that fire when a user clicks a row, point, or marker in a panel. They power setToken (capture click context into a named token), linkToSearch (open Splunk search prefilled), linkToDashboard (navigate to another dashboard with form tokens), and customUrl (open an arbitrary external URL with URL-encoded values). Read when adding click-to-investigate behaviour, when wiring multi-panel drill flows, or when a click on a chart isn't triggering anything. Triggers on 'drilldown', 'click handler', 'eventHandlers', 'setToken', 'linkToSearch', 'linkToDashboard', 'customUrl', 'when I click a row'.
version: 1.0
verified_against: Splunk Enterprise 10.2.1
test_dashboards:
  - splunk-knowledge-testing/ds_interactivity_core_dark (§4)
  - splunk-knowledge-testing/ds_interactivity_core_light (§4)
---

# `ds-drilldowns` — click handler reference

> Verified against `ds_interactivity_core_dark` / `_light` §4. Four
> separate panels demonstrate one drilldown action each:
> `setToken`, `linkToSearch`, `linkToDashboard`, `customUrl`.

## What a drilldown is

A drilldown is an entry in a visualization's `eventHandlers` array that
runs when the user clicks something inside that panel. The handler
declares a `type` and an `options` block specific to that type. Multiple
handlers on one panel all fire on the same click — which is how the
"§4 Drilldown source" panel in the live bench captures `selected_host`
and `selected_action` in two separate `setToken` declarations.

Drilldowns require `options.drilldown: "all"` (or `"row"` / `"cell"` for
tables) to be set on the panel — without it, clicks render no handler
events.

## The 4 action types

| Type | Effect |
|---|---|
| `drilldown.setToken` | Capture click context into named tokens. Updates the dashboard in place. |
| `drilldown.linkToSearch` | Open Splunk Search UI with a prefilled query and time range. |
| `drilldown.linkToDashboard` | Navigate to another dashboard, optionally passing `form.<name>` URL tokens. |
| `drilldown.customUrl` | Open an arbitrary URL (external system, ITSM ticket, runbook). |

## Click context tokens

Every drilldown action has access to a transient set of tokens that only
exist during the click. These do **not** persist after the handler
finishes — to keep them alive, copy into a named token via `setToken`.

| Token | Available in | Meaning |
|---|---|---|
| `$row.<field>.value$` | Tables, events | Value of `<field>` in the clicked row |
| `$row.<field>.name$` | Tables, events | Field name (rare, useful for generic handlers) |
| `$click.value$` | Charts | Category / x-axis value of the clicked point |
| `$click.value2$` | Scatter, bubble, dual-axis | Y-axis or secondary value |
| `$click.name$` | Charts | Field name on x-axis |
| `$click.name2$` | Charts | Field name on y-axis |

`$row.*$` is what tables and event panels expose. `$click.*$` is what
chart-style panels expose. They are mutually exclusive — a click on a
table never produces `$click.value$`, and a click on a chart never
produces `$row.<field>.value$`.

## `drilldown.setToken`

The most common pattern. Verified shape from the live test bench:

```json
"eventHandlers": [
  {
    "type": "drilldown.setToken",
    "options": {
      "tokens": [
        {"token": "selected_host",   "key": "row.host.value"},
        {"token": "selected_action", "key": "row.action.value"}
      ]
    }
  }
]
```

Notes:

- `tokens` is an **array** of `{token, key}` pairs. Don't write
  `{key: value}` form — schema rejects it.
- `key` does **not** start with `$`. It's the bare context-token name
  (`row.host.value`, `click.value`, `click.value2`).
- `token` is the destination name. The token does not need to exist
  beforehand — `setToken` creates it.
- After the click, `$selected_host$` is readable everywhere on the
  dashboard. Use it in SPL, options, or `visibility`.

The §5 visibility panels in the live bench all read `$selected_host$`,
which is populated by §4's `setToken` handler.

## `drilldown.linkToSearch`

Opens the Splunk Search UI in a new (or current) tab with a prefilled
query and time bounds.

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

| Option | Required | Notes |
|---|---|---|
| `query` | yes | Full SPL string, with token interpolation. |
| `earliest` | no | Defaults to the dashboard's current time range. Set explicitly to override. |
| `latest` | no | Same. |
| `newTab` | no | `true` opens a new tab. Defaults to `false`. |
| `app` | no | Splunk app to open Search in. Defaults to current app. |

The `query` field is the right place to interpolate `$row.<field>.
value$` and any other context tokens — they'll be resolved before the
URL is constructed.

## `drilldown.linkToDashboard`

```json
{
  "type": "drilldown.linkToDashboard",
  "options": {
    "app": "search",
    "dashboard": "host_detail_view",
    "newTab": true,
    "tokens": {
      "form.host":     "$row.host.value$",
      "form.earliest": "$global_time.earliest$"
    }
  }
}
```

| Option | Required | Notes |
|---|---|---|
| `app` | yes | App ID containing the target dashboard. |
| `dashboard` | yes | Dashboard ID (the URL slug, not the title). |
| `tokens` | no | `{form.<name>: $value$}` map. The receiving dashboard sees these as `form.<name>` URL params, which populate matching input tokens by name. |
| `newTab` | no | `true` opens in a new tab. |

The receiving dashboard must have an input declared with token name
matching the destination — i.e. `form.host` arrives as the `host` token
on the target. **Always prefix the key with `form.`** — without it the
URL param is malformed and the receiving dashboard ignores it.

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

| Option | Required | Notes |
|---|---|---|
| `url` | yes | Full URL with optional token interpolation. |
| `newTab` | no | `true` opens in a new tab. |

**`|u` is mandatory** for any token interpolated into a URL. Without it,
a row value containing `&`, `?`, `#`, or `=` will silently break the
URL. The live bench uses `$row.host.value|u$` and
`$row.action.value|u$` for this reason.

## Multiple handlers on one panel

You can stack multiple handlers in `eventHandlers`. They all fire on
the same click, in array order. Useful pattern: capture a token *and*
navigate.

```json
"eventHandlers": [
  {
    "type": "drilldown.setToken",
    "options": {
      "tokens": [{"token": "selected_host", "key": "row.host.value"}]
    }
  },
  {
    "type": "drilldown.linkToDashboard",
    "options": {
      "app": "search",
      "dashboard": "host_detail_view",
      "tokens": {"form.host": "$row.host.value$"}
    }
  }
]
```

The token write happens before the navigation — so on dashboard return,
the source dashboard remembers the click context.

## Enabling drilldowns on the panel

The handler list is necessary but not sufficient. You also need:

```json
"options": {
  "drilldown": "all"
}
```

Valid values:

- `"all"` — any click on the panel fires handlers (default for charts).
- `"row"` — table-only, click anywhere in a row.
- `"cell"` — table-only, click a specific cell. `$row.<field>.value$`
  is still the row value, but `$click.value$` is the cell value.
- `"none"` — drilldowns disabled on this panel.

If clicks aren't firing handlers, this is the second thing to check
after handler shape.

## Common gotchas

- **`tokens` shape differs by action type.** `setToken` wants an
  *array* of `{token, key}`; `linkToDashboard` wants an *object*
  `{form.foo: $bar$}`. Easy to copy from one and break the other.
- **`key` in `setToken` has no `$`.** Everywhere else, you'd write
  `$row.host.value$`. Inside the `key` field of `setToken`, you write
  `row.host.value` — bare. The `$` form there is treated as a literal.
- **`form.` prefix is required for `linkToDashboard.tokens`.**
  `{"host": "..."}` does nothing on the target. `{"form.host": "..."}`
  works.
- **`customUrl` without `|u` breaks on special chars.** Always use
  `$row.<field>.value|u$` for tokens going into URLs.
- **Charts emit `$click.*$`, tables emit `$row.*$`.** Picking the wrong
  one for the panel type results in unresolved (empty) tokens.
- **Drilldown clicks on `splunk.ellipse`/`splunk.rectangle` produce no
  `name`/`value`/`series`** — the per-viz drilldown table in the 10.4
  PDF documents this. For shape panels, use them as static buttons
  (linkToDashboard / customUrl) rather than expecting click context.
- **`drilldown: "all"` must be set.** Frequently forgotten, especially
  on tables which default to `"row"`.

## Quick recipes

### Click a row → filter the rest of the dashboard

Source panel:

```json
"eventHandlers": [{
  "type": "drilldown.setToken",
  "options": {
    "tokens": [{"token": "selected_host", "key": "row.host.value"}]
  }
}]
```

Downstream search:

```spl
| stats count by action where host="$selected_host$"
```

### Click a chart point → open Splunk Search

```json
"eventHandlers": [{
  "type": "drilldown.linkToSearch",
  "options": {
    "query": "index=main sourcetype=$click.name$ host=$click.value$",
    "earliest": "$global_time.earliest$",
    "latest":   "$global_time.latest$",
    "newTab": true
  }
}]
```

### Click a row → open ITSM ticket in new tab

```json
"eventHandlers": [{
  "type": "drilldown.customUrl",
  "options": {
    "url": "https://itsm.example.com/incidents/new?subject=Investigate%20$row.host.value|u$",
    "newTab": true
  }
}]
```

### Click a row → drill to host detail dashboard

```json
"eventHandlers": [{
  "type": "drilldown.linkToDashboard",
  "options": {
    "app": "search",
    "dashboard": "host_detail_view",
    "newTab": true,
    "tokens": {
      "form.host":     "$row.host.value$",
      "form.earliest": "$global_time.earliest$",
      "form.latest":   "$global_time.latest$"
    }
  }
}]
```

The target dashboard declares matching `host` / `time` inputs; the
`form.*` URL params populate them on load.

## See also

- `ds-tokens` — `$row.*$` / `$click.*$` context tokens explained.
- `ds-inputs` — receiving side: `form.<name>` inputs that catch URL
  tokens from `linkToDashboard`.
- `ds-visibility` — what to do with `$selected_*$` tokens captured via
  `setToken`.
- `reference/ds-syntax` — legacy monolith with full event-handler option
  reference.
