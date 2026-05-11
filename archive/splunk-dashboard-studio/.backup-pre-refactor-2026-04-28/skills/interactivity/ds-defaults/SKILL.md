---

## name: ds-defaults
description: The dashboard-root `defaults` block sets shared options on every data source or visualization of a given type — most commonly used to wire a global timerange into every `ds.search`, set a project-wide refresh cadence, or define dataset-wide visualization defaults. Read when adding a global time picker, when one search ignores the time picker, or when you want to set a default `refresh` / `refreshType` across all panels. Triggers on 'defaults block', 'global time not affecting all panels', 'refresh', 'queryParameters', 'shared options'.
version: 1.1
verified_against: Splunk Enterprise 10.2.1
verified_against_docs: Splunk Cloud Platform 10.1.2507
test_dashboards:
  - splunk-knowledge-testing/ds_interactivity_core_dark (root)
  - splunk-knowledge-testing/ds_interactivity_core_light (root)

# `ds-defaults` — dashboard-wide option defaults

> Verified against `ds_interactivity_core_dark` / `_light`. The root
> `defaults` block in that dashboard is what makes every search obey the
> §1 time picker.

## What `defaults` does

`defaults` is a dashboard-root key that lets you set option values once,
keyed by **type**, instead of pasting them onto every data source or
visualization. Anything you put under `defaults.dataSources["ds.search"]. options` is applied to every `ds.search` on the dashboard, unless that
search overrides the same key locally.

This is **the** mechanism for wiring a global timerange into every panel.
Most other use cases (per-search refresh, etc.) are minor.

## The canonical pattern: global timerange

```json
"defaults": {
  "dataSources": {
    "ds.search": {
      "options": {
        "queryParameters": {
          "earliest": "$global_time.earliest$",
          "latest": "$global_time.latest$"
        }
      }
    }
  }
}
```

This pairs with `input.timerange` writing `global_time`:

```json
"inputs": {
  "input_global_time": {
    "type": "input.timerange",
    "options": {
      "token": "global_time",
      "defaultValue": "-24h@h,now"
    }
  }
}
```

With both blocks in place, **every `ds.search`** on the dashboard
receives `earliest` and `latest` as Splunk REST query parameters when
the search runs. No need to put `earliest=$global_time.earliest$` in
each query string.

## Schema shape

```json
"defaults": {
  "dataSources": {
    "<type>": { "options": { ... } },
    "<type>": { "options": { ... } }
  },
  "visualizations": {
    "<type>": { "options": { ... } }
  }
}
```

Three top-level keys are supported:

- `dataSources` — keyed by data source `type` (`ds.search`,
`ds.savedSearch`, `ds.chain`, `ds.test`).
- `visualizations` — keyed by visualization `type` (`splunk.line`,
`splunk.singlevalue`, etc.).
- `tokens` — initial values for tokens that are written by drilldowns
or eval expressions later. See "Initialising tokens" below.

Anything you can set under a single instance's `options` you can set
here as a default.

## Initialising tokens with `defaults.tokens.default`

Tokens that aren't owned by an `input` (e.g. ones populated by
`drilldown.setToken` or by an `expressions.eval` block) are
**undefined** until something writes them. That's a problem for
visibility conditions and SPL interpolation, where an undefined
token compares oddly and an empty time range produces unexpected
results.

Declare a default value at the dashboard root:

```json
"defaults": {
  "tokens": {
    "default": {
      "selected_host":   { "value": "" },
      "selected_action": { "value": "" },
      "showTrend":       { "value": "false" },
      "metric":          { "value": "*" }
    }
  }
}
```

Each entry maps a token name to an initial `{ "value": <string> }`.
The dashboard now starts with these tokens defined, so:

- Visibility conditions like `$selected_host$ = ""` evaluate cleanly
before the first click instead of being skipped.
- SPL interpolation like `host=$selected_host$` becomes `host=` (empty)
instead of `host=` (literal `$selected_host$` token text), which
Splunk parses correctly.

This block lives at `defaults.tokens.default` (note the inner `default`
keyword — it's the bucket name, not a typo).

## What you can put under `dataSources["ds.search"].options`

The most useful keys:


| Key                        | Purpose                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `queryParameters.earliest` | Default earliest time (token-bindable).                    |
| `queryParameters.latest`   | Default latest time.                                       |
| `refresh`                  | Auto-refresh interval (`30s`, `5m`, etc.).                 |
| `refreshType`              | `"delay"` or `"interval"` — see below.                     |
| `enablePreview`            | `true` to stream preview results.                          |
| `cancelOnUnload`           | `true` to kill jobs when dashboard closes.                 |
| `enableSmartSources`       | `true` for inputs/searches that depend on upstream tokens. |


`refresh` + `refreshType` set a project-wide refresh cadence — useful for
wallboards. `"delay"` waits N seconds **after** results return before
the next run; `"interval"` re-fires every N seconds regardless.

## What you can put under `visualizations["splunk.<type>"].options`

This is rarely necessary but useful for project-wide style consistency:

```json
"defaults": {
  "visualizations": {
    "splunk.line": {
      "options": {
        "showLegend": true,
        "lineWidth": 2
      }
    }
  }
}
```

Every `splunk.line` panel inherits these unless its own `options`
override them.

## Override semantics

Local options always win. If a single search has:

```json
"ds_special": {
  "type": "ds.search",
  "options": {
    "queryParameters": { "earliest": "-7d", "latest": "now" }
  }
}
```

…then the dashboard's `defaults.queryParameters` does not apply to that
search. This is sometimes intentional (e.g. an "all-time" KPI panel
ignores the picker), and sometimes a bug (you forgot a search overrode it).

## Common gotchas

- `**defaults` is a top-level key**, sibling to `dataSources`,
`visualizations`, `inputs`, `layout`. Easy to nest by accident.
- **Bare `$global_time$` does not work.** Always use `.earliest` /
`.latest` subfields. The schema accepts the bare form silently and
produces no useful value.
- **Defaults run *before* token resolution** is a common misconception.
Defaults are *evaluated* at search dispatch time, like any other
option — they have full access to the current token state.
- **Override silence.** A panel ignoring your global time picker almost
always means that panel locally redeclares `queryParameters`. Grep the
JSON for `queryParameters` to find the culprit.
- **Refresh defaults are footgun-y.** Setting `refresh: "30s"` at the
dashboard root makes *every* search auto-refresh, including expensive
cluster scans. Prefer per-panel refresh on wallboards.
- `**ds.savedSearch` does not honour `queryParameters` defaults** the
same way as `ds.search`. Saved searches carry their own time bounds
unless explicitly overridden via `ds.savedSearch.options .queryParameters` — set those individually.
- **You cannot default `query`**. Only options that don't change the
identity of a data source (time bounds, refresh, etc.) make sense as
defaults. The actual SPL belongs on the individual `ds.search`.

## Quick recipes

### Project-wide refresh cadence

```json
"defaults": {
  "dataSources": {
    "ds.search": {
      "options": {
        "refresh": "60s",
        "refreshType": "delay",
        "queryParameters": {
          "earliest": "$global_time.earliest$",
          "latest":   "$global_time.latest$"
        }
      }
    }
  }
}
```

Wallboard pattern: time picker + 60-second delayed refresh, applied
uniformly. Override on a per-panel basis only when you need a fast lane
(e.g. 10s) or no refresh.

### One panel that ignores the global time picker

Put the override on that panel's data source:

```json
"ds_alltime_kpi": {
  "type": "ds.search",
  "options": {
    "query": "| stats count",
    "queryParameters": {"earliest": "0", "latest": "now"}
  }
}
```

The local `queryParameters` shadows the dashboard default for this one
search.

### Dashboard-wide line chart styling

```json
"defaults": {
  "visualizations": {
    "splunk.line": {
      "options": {
        "lineWidth": 2,
        "showLegend": true,
        "lineStyle": "smooth"
      }
    }
  }
}
```

Every line chart inherits this. Individual panels can still set their
own `lineWidth` to override.

### Always cancel on unload

```json
"defaults": {
  "dataSources": {
    "ds.search": {
      "options": {"cancelOnUnload": true}
    }
  }
}
```

Stops zombie searches consuming cluster resources after the user closes
the dashboard.

## See also

- `ds-inputs` — declares `input.timerange` that writes `global_time`.
- `ds-tokens` — explains `.earliest` / `.latest` subfields.
- `reference/ds-syntax` — legacy monolith with the full data-source option
reference.

