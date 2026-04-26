---
name: ds-visibility
description: Visibility expressions toggle individual panels on or off based on the current value of dashboard tokens. Read when adding progressive disclosure (panel only appears after a row click), when building wizard-style flows, or when hiding "no data selected" placeholders. Triggers on 'visibility', 'show hide panel', 'conditional panel', 'progressive disclosure', 'panel only when token is set'.
version: 1.0
verified_against: Splunk Enterprise 10.2.1
test_dashboards:
  - splunk-knowledge-testing/ds_interactivity_core_dark (§5)
  - splunk-knowledge-testing/ds_interactivity_core_light (§5)
---

# `ds-visibility` — conditional panel visibility

> Verified against `ds_interactivity_core_dark` / `_light` §5. Three
> panels demonstrate the three core states: visible-when-set, visible-on-
> match, visible-when-unset. Click a row in §4 to toggle them.

## What `visibility` does

`visibility` is a per-panel string that Studio evaluates to a boolean.
When the expression evaluates true, the panel renders; when false, the
panel is hidden (no DOM, no search dispatched). It runs every time a
referenced token changes — so panels appear/disappear in real time as
the user interacts.

This is the standard mechanism for:

- Progressive disclosure (panel only appears after a row click)
- "Empty state" hints (markdown shown when no row is selected)
- Wizard flows (each step visible only when the previous step's token
  is set)
- A/B layouts (different panels for different role tokens)

## Where it goes

Top-level on the visualization, sibling to `type`, `options`, etc.:

```json
"viz_visibility_a_set": {
  "type": "splunk.table",
  "title": "A — visible when $selected_host$ is set",
  "dataSources": {"primary": "ds_selected_detail"},
  "options": {"showInternalFields": false},
  "visibility": "$selected_host$!=\"\""
}
```

Note: **the value is a string**, not an object. Token references inside
use the same `$token$` syntax as everywhere else.

## The 3 verified patterns

All three are live in §5 of the test bench.

### 1. Visible when token is set (truthy)

```json
"visibility": "$selected_host$!=\"\""
```

- Compares to empty string. Returns false when the token has not been
  written yet (default empty), true once `setToken` populates it.
- Use case: detail panels that only make sense after a click.

### 2. Visible on exact match

```json
"visibility": "$selected_host$==\"web-01\""
```

- Compares to a literal value. Use for role-based panels, status-
  specific dashboards, or "show this insight only when status=critical"
  patterns.
- Both `$token$` and the literal must be quoted in the comparison —
  they're both strings.

### 3. Visible when token is *unset*

```json
"visibility": "$selected_host$==\"\""
```

- Inverse of pattern 1. Use for empty-state hints — "click a row to
  see details".
- Pair with pattern 1 on the actual content panel; the two are mutually
  exclusive, so the user always sees exactly one of them.

## Operators

The expression is a JS-flavoured boolean. Verified working operators:

| Operator | Meaning |
|---|---|
| `==` | Equals (string) |
| `!=` | Not equals |
| `&&` | And |
| `\|\|` | Or |
| `()` | Grouping |

Examples:

```json
"visibility": "$role$==\"admin\" && $env$==\"prod\""
"visibility": "$status$==\"critical\" || $status$==\"high\""
"visibility": "($selected_host$!=\"\" && $selected_action$==\"deny\")"
```

`>`, `<`, numeric compares, string `contains`, regex — **none of these
are well-documented**. Do not rely on them for production logic.
Convert numerics to enumerated string tokens (e.g. via input.dropdown
items mapping `value: "high"` to severity numbers) and compare with
`==`.

## Multiselect token gotcha

A multiselect token holds an *array* but **interpolates as a comma-
separated string** in `visibility`. So:

```json
"visibility": "$status$==\"200\""
```

…is true only when the user has *exactly* one status selected and that
one is `"200"`. With two values selected, the token expands to `"200,201"`
and the equality check fails.

For "is 200 in the selection" semantics, you generally need to drive
visibility off a separate single-select token, or off a setToken-derived
flag. The visibility expression language is not powerful enough for
contains-style checks.

## Common gotchas

- **`visibility` is a top-level panel key**, not under `options`. Place
  it next to `type`, `dataSources`, `eventHandlers`.
- **Empty-string check, not `null`.** Tokens that have never been
  written hold `""`, not `null`. Always compare to `""`.
- **Hidden panels don't dispatch their searches.** Useful for
  performance: a tab full of hidden detail panels won't run their SPL
  until they become visible. This is one of the cheaper ways to keep
  drill-down dashboards fast.
- **Don't use `visibility` for security.** A user with browser dev tools
  can read the panel definition regardless of `visibility`. If the data
  is sensitive, gate it server-side (RBAC on the index/dashboard).
- **Reference tokens, not literals.** `"true"` / `"false"` strings are
  fine for hardcoded testing, but the whole point is dynamic
  evaluation. A static panel doesn't need `visibility`.
- **Quotes inside JSON.** The expression itself is JSON-string-escaped:
  `"visibility": "$x$==\"foo\""`. Easy to mis-escape.

## Quick recipes

### Empty-state hint with detail content

```json
"viz_empty_hint": {
  "type": "splunk.markdown",
  "options": {"markdown": "_Click a row above to see the detail panel._"},
  "visibility": "$selected_host$==\"\""
},
"viz_detail": {
  "type": "splunk.table",
  "dataSources": {"primary": "ds_host_detail"},
  "visibility": "$selected_host$!=\"\""
}
```

The user always sees exactly one of the two.

### Role-based panel

```json
"visibility": "$user_role$==\"admin\""
```

Drive `user_role` from a hidden input, a `setToken` action, or a
`form.role` URL parameter. Note this is not a security control — it's a
UX simplification.

### Wizard step

Step 1 always visible; step 2 visible after step 1 token is set; step 3
visible after step 2 token is set:

```json
"step1": { "visibility": "1==1" },
"step2": { "visibility": "$step1_complete$==\"yes\"" },
"step3": { "visibility": "$step2_complete$==\"yes\"" }
```

Each step's panel sets the next step's token via a button or
drilldown.setToken handler.

### Multi-token combination

```json
"visibility": "$selected_host$!=\"\" && $selected_action$==\"deny\""
```

Detail panel only appears when *both* a row was clicked *and* the
action was a deny. Keeps the dashboard focused on actionable cases.

## See also

- `ds-tokens` — what visibility expressions evaluate against.
- `ds-drilldowns` — `setToken` is the most common way to populate
  visibility-driving tokens.
- `ds-inputs` — also writes tokens that visibility can read (e.g. a
  user-role dropdown).
- `reference/ds-syntax` — legacy monolith with original visibility
  documentation.
