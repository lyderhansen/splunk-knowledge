---
name: ds-visibility
description: Visibility rules toggle individual panels on or off based on the current value of dashboard tokens. Read when adding progressive disclosure (panel only appears after a row click), when building wizard-style flows, or when hiding "no data selected" placeholders. Triggers on 'visibility', 'show hide panel', 'conditional panel', 'progressive disclosure', 'panel only when token is set', 'showConditions', 'hideWhenNoData'.
version: 1.2
verified_against: Splunk Enterprise 10.2.1 (live test bench)
verified_against_docs: Splunk Cloud Platform 10.1.2507 (showHide doc)
test_dashboards:
  - splunk-knowledge-testing/ds_interactivity_core_dark (§5)
  - splunk-knowledge-testing/ds_interactivity_core_light (§5)
---

# `ds-visibility` — conditional panel visibility

> Verified against `ds_interactivity_core_dark` / `_light` §5. Three
> panels demonstrate the three core states: visible-when-set, visible-on-
> match, visible-when-unset. Click a row in §4 to toggle them.

## What `visibility` does

`visibility` is a per-panel **object** that toggles the panel on or off
based on dashboard expressions. When the referenced expression evaluates
true, the panel renders; when false, the panel is hidden (no DOM, no
search dispatched).

This is the standard mechanism for:

- Progressive disclosure (panel only appears after a row click)
- "Empty state" hints (markdown shown when no row is selected)
- Wizard flows (each step visible only when the previous step's token
  is set)
- A/B layouts (different panels for different role tokens)

## Schema (what the editor accepts)

`visibility` is **always under `containerOptions`** — never at the panel
root. This applies to visualizations, inputs, and any other dashboard
element that supports conditional rendering.

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

| Key                   | Type                         | Meaning |
|-----------------------|------------------------------|---------|
| `showConditions`      | `string[]`                   | Array of condition IDs. Panel is **shown** when conditions evaluate true (default: any-true). |
| `showWhenConditions`  | `"any-true"` \| `"all-true"` | When `showConditions` has multiple entries, controls whether ANY or ALL must be true. Defaults to `any-true`. |
| `hideConditions`      | `string[]`                   | Array of condition IDs. Panel is **hidden** when **any** referenced condition evaluates true. `hideConditions` wins over `showConditions`. |
| `hideWhenNoData`      | `boolean`                    | Auto-hide the panel when its primary data source returns 0 rows. Useful for KPI tiles that should disappear when there's nothing to show. |
| `hideInViewMode`      | `boolean`                    | Hide entirely in view mode but show in edit mode. Used on debug / scaffolding inputs. |

> **Hard rule #1.** `visibility` is **nested under `containerOptions`**.
> Putting it at the panel root (or under `options`) is rejected by the
> editor with `must NOT have additional properties`. Every example in
> the official Splunk Cloud doc puts it at `containerOptions.visibility`.
>
> **Hard rule #2.** `visibility` is an **object**, not a string. The
> Simple-XML form `"visibility": "$tok$ != \"\""` doesn't apply here.
> Always use `{ showConditions: [...] }` and put the actual expression
> in `expressions.conditions`.

## Where conditions live

The condition IDs in `showConditions`/`hideConditions` reference entries
in a top-level **`expressions.conditions`** block on the dashboard root,
sibling to `dataSources` and `visualizations`:

```json
{
  "title": "...",
  "dataSources": { ... },
  "visualizations": {
    "viz_a": {
      "containerOptions": {
        "visibility": { "showConditions": ["condition_host_set"] }
      }
    }
  },
  "expressions": {
    "conditions": {
      "condition_host_set": {
        "name": "host is set",
        "value": "\"$selected_host$\" != \"\""
      },
      "condition_host_is_web01": {
        "name": "host is web-01",
        "value": "\"$selected_host$\" = \"web-01\""
      }
    }
  }
}
```

A condition is a small named record:

| Key     | Type     | Notes |
|---------|----------|-------|
| `name`  | `string` | Friendly label shown in the editor's expressions panel. Free text. |
| `value` | `string` | The actual boolean expression. **Token references are bare** (`$tok$`, NOT `"$tok$"`); string literals on the right side of comparisons ARE quoted. |

### Expression syntax (the `value` field)

The expression language is a small SPL-flavoured dialect with two core
constructs: equality/inequality on token values, and boolean
composition.

```text
$selected_host$ != ""
$selected_host$ = ""
$selected_host$ = "web-01"
$role$ = "admin" and $env$ = "prod"
$status$ = "critical" or $status$ = "high"
$env:user$ != "" and $env:user$ != "splunk-system-user"
```

| Operator   | Meaning                 |
|------------|-------------------------|
| `=`        | Equals (single equals). |
| `!=`       | Not equals.             |
| `and`      | Logical and (lowercase).|
| `or`       | Logical or (lowercase). |
| `not`      | Negation (lowercase).   |
| `()`       | Grouping.               |

> **Hard rule — token references are BARE in conditions.** Writing
> `"$selected_host$" = "web-01"` looks safe, but the runtime expands the
> token inside the quotes (`"web-01" = "web-01"`) and the SPL parser
> trips on the hyphen with `S0201 Syntax error: "web" at position 5` —
> any token value containing `-`, `:`, ` `, etc. blows up the
> expression. Write `$selected_host$ = "web-01"` instead.

> **Hard rule — test for "set" with `!= ""`, not `isSet()`.** The
> Splunk Cloud Platform 10.1.2507 docs introduce an `isSet($tok$)`
> function for checking token presence, but Splunk Enterprise 10.2.x
> still routes condition expressions through the SPL parser, which
> rejects `isSet` with `S0201 Syntax error: "isSet" at position N`.
> The portable form that works on every version we tested is plain
> `$tok$ != ""` (set) / `$tok$ = ""` (unset). For this to evaluate
> cleanly **before** the token has ever been written, declare a
> default value at the dashboard root:
>
> ```json
> "defaults": {
>   "tokens": {
>     "default": {
>       "selected_host":   { "value": "" },
>       "selected_action": { "value": "" }
>     }
>   }
> }
> ```
>
> With this in place, `$selected_host$ = ""` is true on first render
> (no click), and a `setToken` drilldown later writes a non-empty
> value that flips it to false. Without the default block, undefined
> tokens behave inconsistently — sometimes treated as empty, sometimes
> not evaluated at all.

`>`, `<`, regex, `LIKE` — not portable across versions. Convert
numeric compares to enumerated string tokens (e.g. via
`input.dropdown` items mapping `value: "high"` to severity tiers) and
compare with `=`.

## The 3 verified patterns

All three are live in §5 of the test bench.

### 1. Visible when token is set (truthy)

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

- Returns false when the token has not been written yet (token defaults
  to empty), true once `setToken` populates it.
- Use case: detail panels that only make sense after a click.

### 2. Visible on exact match

```json
"containerOptions": {
  "visibility": { "showConditions": ["condition_host_is_web01"] }
}
```

```json
"condition_host_is_web01": {
  "name": "host is web-01",
  "value": "$selected_host$ = \"web-01\""
}
```

- Bare token on the left, quoted literal on the right. Use for role-
  based panels, status-specific dashboards, or "show this insight only
  when status=critical" patterns.

### 3. Visible when token is *unset*

```json
"containerOptions": {
  "visibility": { "showConditions": ["condition_host_unset"] }
}
```

```json
"condition_host_unset": {
  "name": "host is unset",
  "value": "$selected_host$ = \"\""
}
```

- Inverse of pattern 1. Use for empty-state hints — "click a row to
  see details".
- Pair with pattern 1 on the actual content panel; the two are mutually
  exclusive, so the user always sees exactly one of them.

## `hideWhenNoData` — the auto-hide shortcut

The simplest visibility rule is "hide me when my search returns nothing":

```json
"containerOptions": {
  "visibility": { "hideWhenNoData": true }
}
```

No conditions, no expressions block. The panel just disappears when
its primary data source comes back empty.

Pairs naturally with KPI tiles, summary tables, and "recent X" lists
that look stupid when they show "0 events" or render an empty grid.

You can combine `hideWhenNoData` with `showConditions` on the same
panel — the panel is shown only if **both**: the condition is true
AND there's data.

## Reusing conditions

Condition IDs are dashboard-wide. The same `condition_host_set` can be
referenced by 3 different panels' `showConditions` and one other panel's
`hideConditions` — Splunk evaluates the condition once and broadcasts.

That makes them **the unit of state**, not the panel. When you find
yourself writing the same expression on 4 panels, declare one condition
and reference it 4 times.

## Multiselect token gotcha

A multiselect token holds an *array* but **interpolates as a comma-
separated string** inside conditions. So:

```text
$status$ = "200"
```

…is true only when the user has *exactly* one status selected and that
one is `"200"`. With two values selected, the token expands to
`200,201` and the equality check fails.

The condition language has no `IN`-like operator. Workarounds:

1. Drive visibility off a separate single-select token.
2. Use a `setToken` drilldown to derive a flag (`any_status_set`,
   `status_includes_500`) from the multiselect, and reference the flag
   in the condition.
3. Test for *any* selection with `$status$ != ""` — true when the user
   has picked at least one value.
4. Use a hidden SPL search that processes the multiselect and writes
   a derived flag token via `eval` + `<change>`-style result-driven
   token wiring.

For the **search side** of multiselect (not visibility), the
documented pattern is `... | where field IN ($token|s$) OR ("$token$"
= "*")` — the `|s` filter quotes each array element, so
`$status|s$` with `["200", "404"]` becomes `"200","404"` and `IN()`
parses cleanly. See `ds-tokens` for the full token-filter table.

## Common gotchas

- **`visibility` lives under `containerOptions`.** Putting it at the
  panel root is rejected with `must NOT have additional properties`.
  Even though the legacy Simple-XML form uses `<panel visibility=...>`,
  Studio v2 nests it: `containerOptions.visibility.showConditions`.
- **`visibility` is an object, not a string.** Setting it to a raw
  expression string is rejected.
- **Token references in conditions are bare.** Write `$selected_host$`,
  not `"$selected_host$"`. Wrapping the token in quotes makes the
  parser treat the expanded value as a literal — `"web-01"` becomes
  the token replacement target and the parser breaks at the dash with
  `S0201 Syntax error: "web" at position 5`.
- **`isSet($tok$)` is Cloud-only.** The Splunk Cloud Platform 10.1.2507
  docs introduce `isSet()` for token-presence checks. Splunk Enterprise
  10.2.x routes condition expressions through the SPL parser, which
  rejects `isSet` with `S0201 Syntax error: "isSet" at position N`.
  Use `$tok$ != ""` (set) and `$tok$ = ""` (unset) for portability —
  these forms work on every version we tested. Tokens that have never
  been written compare cleanly as empty strings.
- **Boolean operators are lowercase.** `and` / `or` / `not` — the
  uppercase forms (`AND` / `OR`) are NOT accepted by the condition
  parser. (Different from SPL itself, where uppercase works.)
- **Single equals in conditions, double equals nowhere.** The condition
  language uses `=` / `!=`, not `==`.
- **Conditions must exist.** If `showConditions` references an ID that
  isn't in `expressions.conditions`, the editor doesn't error loudly —
  it just silently treats the condition as false and your panel never
  shows.
- **`expressions.conditions` is a top-level dashboard key**, not
  inside `defaults` or per-viz `context`.
- **Hidden panels don't dispatch their searches.** Useful for
  performance: a hidden detail panel won't run its SPL until it
  becomes visible. One of the cheaper ways to keep drill-down
  dashboards fast.
- **Don't use `visibility` for security.** A user with browser dev
  tools can read the full panel definition. Gate sensitive data
  server-side (RBAC on the index/dashboard).

## Quick recipes

### Empty-state hint with detail content

```json
"visualizations": {
  "viz_empty_hint": {
    "type": "splunk.markdown",
    "options": {"markdown": "_Click a row above to see the detail panel._"},
    "containerOptions": {
      "visibility": { "showConditions": ["condition_host_unset"] }
    }
  },
  "viz_detail": {
    "type": "splunk.table",
    "dataSources": {"primary": "ds_host_detail"},
    "containerOptions": {
      "visibility": { "showConditions": ["condition_host_set"] }
    }
  }
},
"expressions": {
  "conditions": {
    "condition_host_unset": {
      "name": "host unset",
      "value": "$selected_host$ = \"\""
    },
    "condition_host_set": {
      "name": "host set",
      "value": "$selected_host$ != \"\""
    }
  }
}
```

The user always sees exactly one of the two.

### Role-based panel

```json
"viz_admin_only": {
  "containerOptions": {
    "visibility": { "showConditions": ["condition_is_admin"] }
  }
}
```

```json
"condition_is_admin": {
  "name": "admin role",
  "value": "$user_role$ = \"admin\""
}
```

Drive `user_role` from a hidden input, a `setToken` action, or a
`form.role` URL parameter. Note this is not a security control — it's a
UX simplification.

### Auto-hide empty KPIs

```json
"viz_recent_alerts": {
  "type": "splunk.singlevalue",
  "dataSources": {"primary": "ds_alerts_count"},
  "containerOptions": {
    "visibility": { "hideWhenNoData": true }
  }
}
```

When the alerts search returns 0 rows, the KPI tile disappears
entirely instead of showing a `0`. Pair with a sibling "all clear"
panel guarded by an inverted condition.

### Wizard step

Step 1 always visible; step 2 visible after step 1 token is set; step 3
after step 2:

```json
"viz_step1": { /* always visible — no visibility key */ },
"viz_step2": {
  "containerOptions": {
    "visibility": { "showConditions": ["condition_step1_done"] }
  }
},
"viz_step3": {
  "containerOptions": {
    "visibility": { "showConditions": ["condition_step2_done"] }
  }
}
```

```json
"condition_step1_done": {
  "name": "step 1 done",
  "value": "$step1_complete$ = \"yes\""
},
"condition_step2_done": {
  "name": "step 2 done",
  "value": "$step2_complete$ = \"yes\""
}
```

Each step's panel sets the next step's token via a button or
`drilldown.setToken` handler.

### Multi-token combination

```json
"condition_clicked_and_denied": {
  "name": "row clicked and action is deny",
  "value": "$selected_host$ != \"\" and $selected_action$ = \"deny\""
}
```

```json
"viz_focused_detail": {
  "containerOptions": {
    "visibility": { "showConditions": ["condition_clicked_and_denied"] }
  }
}
```

Detail panel only appears when *both* a row was clicked *and* the
action was a deny. Keeps the dashboard focused on actionable cases.

## See also

- `ds-tokens` — what condition expressions evaluate against.
- `ds-drilldowns` — `setToken` is the most common way to populate the
  tokens that drive visibility.
- `ds-inputs` — also writes tokens that conditions can read (e.g. a
  user-role dropdown).
- `reference/ds-syntax` — JSON schema reference covering the
  `expressions` top-level block.
