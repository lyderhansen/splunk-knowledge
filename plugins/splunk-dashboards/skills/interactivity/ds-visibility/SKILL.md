---
name: ds-visibility
description: Splunk Dashboard Studio conditional panel visibility — toggle individual panels on or off based on dashboard token values. Provides patterns for progressive disclosure (panel only after row click), empty-state hints, wizard flows, role-based panels, hideWhenNoData auto-hide, and the portable "$tok$ != ""/=" expression syntax that works on Enterprise + Cloud. Use when the user asks about visibility, show/hide panel, conditional panels, progressive disclosure, showConditions, hideWhenNoData, or "panel only when token is set" in Splunk Dashboard Studio.
---

# ds-visibility — conditional panel visibility

Verified against Splunk Enterprise 10.2.1 + Splunk Cloud 10.1.2507.
Live test bench: `splunk-knowledge-testing/ds_interactivity_core_dark`
§5 Visibility panels.

## What `visibility` does

A per-panel **object** that toggles the panel on or off based on
dashboard expressions. When the referenced expression evaluates true,
the panel renders; when false, the panel is hidden (no DOM, no search
dispatched).

Standard mechanism for:

- **Progressive disclosure** — panel only appears after a row click.
- **Empty-state hints** — markdown shown when no row selected.
- **Wizard flows** — each step visible only when previous step's
  token is set.
- **A/B layouts** — different panels for different role tokens.

## Schema (what the editor accepts)

`visibility` is **always nested under `containerOptions`** — never at
the panel root.

```json
"viz_x": {
  "type": "splunk.table",
  "containerOptions": {
    "visibility": {
      "showConditions": ["condition_id_1", "condition_id_2"],
      "showWhenConditions": "any-true",
      "hideConditions": ["condition_id_3"],
      "hideWhenNoData": true
    }
  }
}
```

| Key | Type | Meaning |
|---|---|---|
| `showConditions` | `string[]` | Condition IDs. Panel **shown** when conditions evaluate true. |
| `showWhenConditions` | `"any-true"` \| `"all-true"` | When `showConditions` has multiple entries, ANY or ALL must be true. Default `any-true`. |
| `hideConditions` | `string[]` | Panel **hidden** when **any** referenced condition is true. **Wins over `showConditions`.** |
| `hideWhenNoData` | boolean | Auto-hide when primary data source returns 0 rows. |
| `hideInViewMode` | boolean | Hide in view mode but show in edit mode. For debug / scaffolding. |

## Where conditions live

Top-level **`expressions.conditions`** block on dashboard root, sibling
to `dataSources` and `visualizations`:

```json
{
  "expressions": {
    "conditions": {
      "condition_host_set": {
        "name": "host is set",
        "value": "$selected_host$ != \"\""
      },
      "condition_host_is_web01": {
        "name": "host is web-01",
        "value": "$selected_host$ = \"web-01\""
      }
    }
  }
}
```

Each condition is a `{ name, value }` record:

- `name` — friendly label shown in editor's expressions panel.
- `value` — the actual boolean expression.

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| **Nest under `containerOptions`:** `containerOptions.visibility.showConditions`. | Put `visibility` at panel root or under `options` — schema rejects with `must NOT have additional properties`. |
| **Object form:** `{ showConditions: [...] }`. | String form `"visibility": "$tok$ != \"\""` (Simple-XML pattern) — schema rejects. |
| **Bare token in conditions:** `$selected_host$ = "web-01"`. | `"$selected_host$" = "web-01"` (quoted) — runtime expands inside quotes; SPL parser breaks at `web-01` hyphen with `S0201`. |
| **Test set/unset:** `$tok$ != ""` / `$tok$ = ""`. | `isSet($tok$)` — Cloud-only. Enterprise 10.2.x rejects with `S0201 Syntax error: "isSet"`. |
| **Initialise tokens:** `defaults.tokens.default` so unset tokens compare cleanly to `""`. | Skip default — undefined tokens behave inconsistently before first click. |
| **Boolean operators lowercase:** `and` / `or` / `not`. | `AND` / `OR` — NOT accepted by condition parser. |
| **Single equals:** `=` / `!=`. | `==` — not in the expression language. |
| **Reuse conditions** across panels via `expressions.conditions`. | Duplicate the same expression in 4 panels — declare once, reference 4 times. |
| **Performance:** rely on hidden panels not dispatching searches. | Dispatch hidden searches via custom hooks — visibility-hidden panels skip dispatch by design. |
| **Security:** gate server-side (RBAC). | Use `visibility` for security — dev tools see full panel definition. |

## Expression syntax

```text
$selected_host$ != ""
$selected_host$ = ""
$selected_host$ = "web-01"
$role$ = "admin" and $env$ = "prod"
$status$ = "critical" or $status$ = "high"
not ($user_role$ = "admin")
```

| Operator | Meaning |
|---|---|
| `=` | Equals (single equals). |
| `!=` | Not equals. |
| `and` | Logical and (lowercase). |
| `or` | Logical or (lowercase). |
| `not` | Negation (lowercase). |
| `()` | Grouping. |

`>`, `<`, regex, `LIKE` — not portable. Convert numeric compares to
enumerated string tokens (e.g. severity tiers via `input.dropdown`)
and compare with `=`.

## The 3 verified patterns

All live in §5 of the test bench.

### 1. Visible when token is set

```json
"containerOptions": {
  "visibility": { "showConditions": ["condition_host_set"] }
}
```

```json
"condition_host_set": {
  "name": "host is set",
  "value": "$selected_host$ != \"\""
}
```

For detail panels that only make sense after a click.

### 2. Visible on exact match

```json
"condition_host_is_web01": {
  "name": "host is web-01",
  "value": "$selected_host$ = \"web-01\""
}
```

For role-based panels, status-specific dashboards, "show this only
when status=critical".

### 3. Visible when token is unset

```json
"condition_host_unset": {
  "name": "host is unset",
  "value": "$selected_host$ = \"\""
}
```

Inverse of pattern 1. Empty-state hints. Pair with pattern 1 — user
always sees exactly one.

## `hideWhenNoData` — auto-hide shortcut

```json
"containerOptions": { "visibility": { "hideWhenNoData": true } }
```

Panel disappears when its primary data source comes back empty. No
conditions, no expressions block needed.

Pairs naturally with KPI tiles, summary tables, and "recent X" lists.

Combine with `showConditions` for **both** rules — panel shown only
when condition is true AND data exists.

## Multiselect token gotcha

A multiselect token holds an *array* but interpolates as a
**comma-separated string** in conditions:

```text
$status$ = "200"
```

True only when user has *exactly one* status selected and that one is
`"200"`. With two selected, the token expands to `200,201` and
equality fails.

Condition language has no `IN`-like operator. Workarounds:

1. Drive visibility off a separate single-select token.
2. Use `setToken` to derive a flag (`any_status_set`) from the
   multiselect.
3. Test for **any** selection: `$status$ != ""` — true when ≥ 1 value.

For the **search side** of multiselect (not visibility), use
`| where field IN ($token|s$) OR ("$token$" = "*")` — see `ds-tokens`.

## Quick recipes

### Empty-state hint + detail content

```json
"viz_empty_hint": {
  "type": "splunk.markdown",
  "options": { "markdown": "_Click a row above to see the detail panel._" },
  "containerOptions": {
    "visibility": { "showConditions": ["condition_host_unset"] }
  }
},
"viz_detail": {
  "type": "splunk.table",
  "dataSources": { "primary": "ds_host_detail" },
  "containerOptions": {
    "visibility": { "showConditions": ["condition_host_set"] }
  }
}
```

The user always sees exactly one of the two.

### Auto-hide empty KPIs

```json
"viz_recent_alerts": {
  "type": "splunk.singlevalue",
  "dataSources": { "primary": "ds_alerts_count" },
  "containerOptions": { "visibility": { "hideWhenNoData": true } }
}
```

### Multi-token combination

```json
"condition_clicked_and_denied": {
  "name": "row clicked and action is deny",
  "value": "$selected_host$ != \"\" and $selected_action$ = \"deny\""
}
```

Detail panel only appears when both: row clicked AND action was deny.

## Caveats

- **Conditions must exist.** Reference an ID not in
  `expressions.conditions` and the editor silently treats it as
  false — panel never shows.
- **`expressions.conditions` is top-level**, not inside `defaults` or
  per-viz `context`.

## See also

- `ds-tokens` — what condition expressions evaluate against.
- `ds-drilldowns` — `setToken` is the most common way to populate
  tokens that drive visibility.
- `ds-inputs` — also writes tokens conditions can read.
- `ds-defaults` — `defaults.tokens.default` for stable initial state.
- `reference/ds-syntax` — JSON schema reference.
