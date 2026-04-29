---
name: ds-drilldowns
description: Splunk Dashboard Studio drilldown reference — click handlers that fire on row, point, or marker click. Covers setToken (capture click context into named tokens), linkToSearch (open Splunk search prefilled), linkToDashboard (navigate with form tokens, ARRAY shape), customUrl (open external URL with URL-encoded values, |u mandatory). Use when the user asks about drilldowns, click handlers, eventHandlers, setToken, linkToSearch, linkToDashboard, customUrl, "when I click a row", or master-detail flows in Splunk Dashboard Studio.
---

# ds-drilldowns — click handler reference

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
| **`setToken.tokens`:** array of `{token, key}` objects. | `tokens: { selected_host: "row.host.value" }` — schema rejects map form. |
| **`linkToDashboard.tokens`:** array of `{token, value}` objects. | `tokens: { "form.host": "$row.host.value$" }` (Simple-XML map) — silently dropped, link navigates with no tokens. |
| **`key` / `value` are BARE** (`row.host.value`). | Wrap in `$...$` — treated as literal. |
| **`linkToDashboard.token`:** destination name on receiving dashboard. **No `form.` prefix.** | `"token": "form.host"` — Studio resolves raw names; `form.<name>` is Simple-XML/Classic. |
| **`customUrl`:** `\|u` filter on every interpolated token. | Skip `\|u` — `&` / `?` / `#` / `=` in values silently break the URL. |
| **Charts vs tables:** `$click.*$` for charts, `$row.<field>.value$` for tables. | Read `$click.value$` from a table — produces empty token. |
| **Multiple handlers:** stack in `eventHandlers` array (capture + navigate). | Try to share state across separate panels via `eventHandlers` — handlers are panel-local. |
| **Shape panels (ellipse/rectangle):** use as static buttons (`linkToDashboard` / `customUrl`). | Expect click `name`/`value`/`series` payload — shapes have none. |

## `drilldown.setToken`

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

- `tokens` is an **array** of `{token, key}` pairs.
- `key` is bare (`row.host.value`), no `$...$`.
- `token` is destination name; created if it doesn't exist.

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

**Hard rule:** `tokens` is an **array** of `{token, value}` objects,
NOT a string-keyed map. The Simple-XML form `{ "form.host":
"$row.host.value$" }` looks superficially right but Studio silently
drops it.

Differences from `setToken`:

- Field name is `value` (not `key`).
- Same bare-token-name convention (`row.host.value`, no `$...$`).
- `token` is the destination name on the receiving dashboard. **No
  `form.` prefix.** Studio resolves raw names.

The receiving dashboard must declare an input writing the destination
token name, or some other mechanism that writes that token.

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

- `ds-tokens` — `$row.*$` / `$click.*$` context tokens explained.
- `ds-inputs` — receiving side for `linkToDashboard`-forwarded tokens.
- `ds-visibility` — what to do with `$selected_*$` tokens captured via
  `setToken` (RAG flips, panel show/hide).
- `reference/ds-syntax` — full event-handler option reference.
