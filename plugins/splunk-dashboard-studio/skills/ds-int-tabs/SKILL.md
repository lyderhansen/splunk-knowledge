---
name: ds-int-tabs
description: Splunk Dashboard Studio tabbed layouts — split a single dashboard into multiple panel groups, each with its own grid layout, sharing the same global inputs and data sources. Provides patterns for 3-tab analyst workflows, tab-scoped inputs (input_host_filter only on Detail tab), tab-bar position, and the global vs tab-scoped input split. Use when the user asks about tabs, tabbed dashboards, multiple pages in one dashboard, layoutDefinitions, tab bar position, or splitting workflows by audience in Splunk Dashboard Studio.
---

# ds-int-tabs — tabbed layouts

Verified against Splunk Enterprise 10.2.1.
Live test bench: `splunk-knowledge-testing/ds_interactivity_tabs_dark`.

A tabbed layout splits a dashboard into N independently-laid-out
sections. The user clicks a tab to switch between them.

## When to use tabs (vs separate dashboards)

| Use tabs when... | Use separate dashboards when... |
|---|---|
| Multiple views share the same input filters. | Distinct audiences (execs vs operators). |
| User workflow moves between views without changing context. | URL needs to be shareable / bookmarkable per-view. |
| Each view is small enough that it doesn't deserve own URL. | Filter scope differs (different time horizons, different inputs). |

Common production pattern: "summary" dashboard (no tabs) + "detail"
dashboard (with tabs for sub-sections). Drill from summary to detail
via `linkToDashboard`.

## Required shape

```json
"layout": {
  "globalInputs": ["input_global_time"],
  "tabs": {
    "items": [
      { "layoutId": "layout_overview", "label": "Overview" },
      { "layoutId": "layout_details",  "label": "Details" },
      { "layoutId": "layout_threats",  "label": "Threats" }
    ],
    "options": {
      "barPosition": "top",
      "showTabBar": true
    }
  },
  "layoutDefinitions": {
    "layout_overview": { "type": "grid", "structure": [ ... ] },
    "layout_details":  { "type": "grid", "structure": [ ... ] },
    "layout_threats":  { "type": "grid", "structure": [ ... ] }
  }
}
```

Three keys at `layout`-level:

- `globalInputs` — array of input IDs visible across all tabs.
- `tabs.items` — `[{layoutId, label}]`. Order matches tab order.
- `tabs.options` — tab-bar styling.
- `layoutDefinitions` — keyed by tab ID. Each entry is a layout block
  (`type`, `structure`, optional `inputs`).

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Tabbed dashboard:** omit `layout.type` at root. | Set both `layout.type: "absolute"` AND `layout.tabs` — tabs ignored. |
| **`layoutId` matches `tabs.items[].layoutId`** exactly. | Typo in either — blank tab. |
| **Each tab needs `type` AND `structure`** in its `layoutDefinitions` entry. | Skip `type` on the inner layout — outer omission doesn't propagate. |
| **Tab-scoped inputs:** declare in `layoutDefinitions[].inputs`. | Add tab-only inputs to `globalInputs` — they render across all tabs. |
| **`globalInputs` for shared filters** (time picker, account picker). | Duplicate the same input across every tab's `inputs` array. |
| **Mix grid + absolute** only with a specific reason. | Mix layout types arbitrarily — visually disorienting. |
| **Performance:** gate searches in hidden tabs with `visibility` if cost matters. | Trust hidden tabs to defer searches — they dispatch on dashboard load by default. |
| **Tabs are flat** — no nesting. | Embed a tabbed layout inside another tab — not supported. |

## `tabs.options`

| Option | Type | Default | Notes |
|---|---|---|---|
| `barPosition` | `"top"` \| `"bottom"` | `"top"` | Tab bar above or below content. |
| `showTabBar` | boolean | `true` | `false` for programmatic tab switching only. |

## Tab-scoped inputs

```json
"layoutDefinitions": {
  "layout_details": {
    "type": "grid",
    "inputs": ["input_host_filter"],
    "structure": [ ... ]
  }
}
```

The input renders **only when that tab is active**. Inputs declared
neither globally nor in any tab's `inputs` array do not render.

## Quick recipes

### 3-tab dashboard with shared time picker

```json
"layout": {
  "globalInputs": ["input_global_time"],
  "tabs": {
    "items": [
      { "layoutId": "tab_summary", "label": "Summary" },
      { "layoutId": "tab_detail",  "label": "Detail" },
      { "layoutId": "tab_audit",   "label": "Audit" }
    ],
    "options": { "barPosition": "top", "showTabBar": true }
  },
  "layoutDefinitions": {
    "tab_summary": { "type": "grid", "structure": [...] },
    "tab_detail":  { "type": "grid", "structure": [...] },
    "tab_audit":   { "type": "grid", "structure": [...] }
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
      { "item": "viz_host_breakdown", "type": "block",
        "position": { "x": 0, "y": 0, "w": 1440, "h": 600 } }
    ]
  }
}
```

### Hidden tab bar (programmatic switching)

```json
"tabs": {
  "items": [
    { "layoutId": "view_a", "label": "A" },
    { "layoutId": "view_b", "label": "B" }
  ],
  "options": { "barPosition": "top", "showTabBar": false }
}
```

Pair with an `input.dropdown` driving tab selection via token.
(Token-driven tab selection is documented but beyond verified scope —
test before relying on it.)

## Caveats

- **No URL-level tab state by default.** Bookmarking always lands on
  first tab. Token-driven workarounds exist.
- **`globalInputs` always render above the tab bar** regardless of
  `barPosition`. Tab-scoped inputs render inside tab content.
- **`labels` are user-visible** — internationalise. `layoutId` is
  internal — keep stable.

## See also

- `ds-int-inputs` — `globalInputs` vs tab-scoped `inputs`.
- `ds-int-defaults` — global time wiring works the same in tabbed
  dashboards.
- `ds-int-drilldowns` — `linkToDashboard.tokens` to land on a specific tab
  (token-driven only).
- `ds-ref-syntax` — full layout reference.
