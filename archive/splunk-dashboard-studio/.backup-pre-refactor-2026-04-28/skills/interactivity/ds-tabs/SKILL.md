---

## name: ds-tabs
description: Tabs split a single dashboard into multiple panel groups, each with its own grid layout, sharing the same inputs and data sources. Read when a dashboard has too many panels for one screen, when separating workflows by audience (operations vs investigators), or when adding a "details" sub-page that doesn't deserve its own dashboard. Triggers on 'tabs', 'tabbed dashboard', 'multiple pages in one dashboard', 'layoutDefinitions', 'tab bar position'.
version: 1.0
verified_against: Splunk Enterprise 10.2.1
test_dashboards:
  - splunk-knowledge-testing/ds_interactivity_tabs_dark
  - splunk-knowledge-testing/ds_interactivity_tabs_light

# `ds-tabs` — tabbed layouts

> Verified against `ds_interactivity_tabs_dark` / `_light`. Three tabs
> (Overview / Details / Threats), each with its own `layoutDefinitions`
> entry, sharing the dashboard's global time input.

## What tabs are

A tabbed layout splits a dashboard into N independently-laid-out
sections. The user clicks a tab in a tab bar (top or bottom of the
content area) to switch between them. Inputs declared at the dashboard
root with `globalInputs` are visible across all tabs; tab-scoped inputs
declared in `layoutDefinitions[].inputs` are visible only when that tab
is active.

Tabs are mutually exclusive with `absolute` and `grid` at the dashboard
root: `layout.type` is **either** absolute/grid **or** the dashboard
declares `layout.tabs` (and no `layout.type`). You cannot embed tabs
inside an absolute layout, and you cannot embed an absolute layout
*outside* a tabbed dashboard.

## Required shape

```json
"layout": {
  "globalInputs": ["input_global_time"],
  "tabs": {
    "items": [
      {"layoutId": "layout_overview", "label": "Overview"},
      {"layoutId": "layout_details",  "label": "Details"},
      {"layoutId": "layout_threats",  "label": "Threats"}
    ],
    "options": {
      "barPosition": "top",
      "showTabBar": true
    }
  },
  "layoutDefinitions": {
    "layout_overview": {
      "type": "grid",
      "structure": [ ... ]
    },
    "layout_details": {
      "type": "grid",
      "structure": [ ... ]
    },
    "layout_threats": {
      "type": "grid",
      "structure": [ ... ]
    }
  }
}
```

Three keys at `layout`-level:

- `globalInputs` — array of input IDs visible across all tabs (typically
the global time picker).
- `tabs.items` — array of `{layoutId, label}`. Order matches tab order
left-to-right. Each `layoutId` must be a key in `layoutDefinitions`.
- `tabs.options` — tab-bar styling (see below).
- `layoutDefinitions` — keyed by tab ID. Each entry is itself a layout
block (`type: "grid" | "absolute"`, plus its own `structure` and
optional `inputs`).

## `tabs.options`

Verified working options:


| Option        | Type                 | Default | Notes                                                                       |
| ------------- | -------------------- | ------- | --------------------------------------------------------------------------- |
| `barPosition` | `"top"` | `"bottom"` | `"top"` | Tab bar above or below content.                                             |
| `showTabBar`  | boolean              | `true`  | When `false`, tabs are hidden — useful for programmatic tab switching only. |


Hiding the tab bar (`showTabBar: false`) is rare but useful for
embedded dashboards where another widget controls which tab is active
via a token (you can drive `tabs` selection from a token in advanced
patterns, though that's outside the verified test bench).

## Tab-scoped inputs

Each `layoutDefinitions` entry can declare its own inputs:

```json
"layoutDefinitions": {
  "layout_details": {
    "type": "grid",
    "inputs": ["input_host_filter"],
    "structure": [ ... ]
  }
}
```

These render only when that tab is active. They do **not** appear in
`layout.globalInputs`. Inputs declared neither globally nor in any tab's
`inputs` array do not render.

## Mixing tab-local layouts

Each `layoutDefinitions` entry can independently choose `grid` or
`absolute`. The verified test bench uses `grid` for all three tabs —
that's the more common choice because grid auto-flows panel sizes.

```json
"layout_overview": { "type": "grid", "structure": [...] },
"layout_details":  { "type": "absolute", "options": {"width": 1440, "height": 1200}, "structure": [...] }
```

Mixing types is legal but visually disorienting — pick one for the
whole dashboard unless there's a specific reason.

## When to use tabs (vs separate dashboards)

Use tabs when:

- Multiple views *share* the same input filters (one time picker, one
host filter — same scope).
- The user workflow naturally moves between views without changing
context.
- Each view is small enough that it doesn't deserve a separate URL.

Use separate dashboards when:

- Views have distinct audiences (executives vs operators).
- The URL needs to be shareable / bookmarkable per-view.
- Filter scope differs significantly (different time horizons, different
inputs).

A common production pattern is to pair: a "summary" dashboard with no
tabs, and a "detail" dashboard with tabs for sub-sections. Drill from
the summary into the detail dashboard via `linkToDashboard`, optionally
landing on a specific tab via URL params (advanced).

## Common gotchas

- `**layout.type` must be omitted** when using tabs. Setting both
`layout.type: "absolute"` and `layout.tabs` produces undefined behaviour
(often "tabs ignored").
- `**layoutDefinitions` keys must match `tabs.items[].layoutId*`*
exactly. A typo → blank tab.
- **Each tab's own layout still needs `type` and `structure`.** They're
not optional on the inner layout — the outer dashboard's removal of
`layout.type` doesn't propagate.
- **Searches in hidden tabs still dispatch on dashboard load** by
default. If performance matters, gate with `visibility` on individual
panels, or split into separate dashboards.
- **Tabs cannot be nested.** A tab cannot itself contain another tabbed
layout.
- `**globalInputs` always render** above the tab bar regardless of
`barPosition`. Tab-scoped inputs render *inside* the tab content.
- `**labels` are user-visible strings**, not slugs — internationalise
freely. `layoutId` is the internal key — keep it stable.
- **No URL-level tab state** by default. The currently selected tab is
not preserved in the URL hash. Bookmarking always lands on the first
tab. Workarounds exist (token-driven tab selection) but are not part of
the verified surface.

## Quick recipes

### 3-tab dashboard with shared time picker

The verified test-bench shape — copy-pasteable:

```json
"layout": {
  "globalInputs": ["input_global_time"],
  "tabs": {
    "items": [
      {"layoutId": "tab_summary",  "label": "Summary"},
      {"layoutId": "tab_detail",   "label": "Detail"},
      {"layoutId": "tab_audit",    "label": "Audit"}
    ],
    "options": {"barPosition": "top", "showTabBar": true}
  },
  "layoutDefinitions": {
    "tab_summary": {"type": "grid", "structure": [...]},
    "tab_detail":  {"type": "grid", "structure": [...]},
    "tab_audit":   {"type": "grid", "structure": [...]}
  }
}
```

### Tab with its own host filter

```json
"layoutDefinitions": {
  "tab_detail": {
    "type": "grid",
    "inputs": ["input_host_filter"],
    "structure": [
      {"item": "viz_host_breakdown", "type": "block",
       "position": {"x": 0, "y": 0, "w": 1440, "h": 600}}
    ]
  }
}
```

The host filter only appears when "Detail" is active.

### Hidden tab bar (programmatic switching)

```json
"tabs": {
  "items": [
    {"layoutId": "view_a", "label": "A"},
    {"layoutId": "view_b", "label": "B"}
  ],
  "options": {"barPosition": "top", "showTabBar": false}
}
```

Plus an `input.dropdown` somewhere with the same items, driving tab
selection via token. (Token-driven tab selection is documented but
beyond the verified scope of this skill — test it before relying on it.)

## See also

- `ds-inputs` — `globalInputs` vs tab-scoped `inputs`.
- `ds-defaults` — global time wiring works the same in tabbed dashboards.
- `ds-drilldowns` — `linkToDashboard.tokens` to land on a specific tab
(token-driven only).
- `reference/ds-syntax` — the legacy monolith, with the original layout
reference covering grid, absolute, and tabs.

