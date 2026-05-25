---
name: ds-ref-jsonata
description: JSONata syntax reference for Splunk Dashboard Studio eval expressions and conditions — operators (arithmetic, comparison, ternary, string &), string functions ($substring, $uppercase, $trim, $replace, $split, $join), numeric functions ($round, $floor, $ceil, $abs, $formatNumber), date/time functions ($now, $millis, $toMillis, $fromMillis), array operations ($map, $filter, $reduce, $count, $sort), path expressions, lambdas, and common recipes (RAG thresholds, dynamic labels, toggles, time arithmetic). Use when writing expressions.eval or expressions.conditions in Dashboard Studio JSON.
---

# ds-ref-jsonata — JSONata reference for Dashboard Studio

Splunk Dashboard Studio uses **JSONata** (not SPL eval) as the
expression language for both the `expressions.eval` and
`expressions.conditions` stanzas. JSONata is a small functional
expression language originally designed for JSON transformation; the
DS runtime evaluates it client-side. This skill is the reference for
agents writing those stanzas.

Two confidence tiers are used throughout:

- **[Confirmed]** — verified in Dashboard Studio either via official
  Splunk 10.4 docs or via live test (HANDOVER-token-eval.md,
  2026-05-22).
- **[Standard JSONata]** — present in the JSONata spec and expected
  to work because Splunk docs state "JSONata's built-in functions"
  are available, but not individually verified in DS.

## Gotchas and limitations (read first)

The first eight traps cover ~95% of the silent failures we have seen.

### Trap 1: JSONata is NOT SPL eval — HIGHEST FREQUENCY ERROR

The single most common failure: writing SPL syntax inside an
`expressions.eval` value. The expression parses without error and
then produces wrong or empty values.

| Operation              | JSONata (correct)            | SPL eval (WRONG)         |
| ---------------------- | ---------------------------- | ------------------------ |
| String concat          | `'a' & 'b'`                  | `'a' . 'b'` or `'a'+'b'` |
| Conditional            | `x > 10 ? 'high' : 'low'`    | `if(x>10,"high","low")`  |
| Current date           | `$now('[Y0001]-[M01]-[D01]')`| `strftime(now(),"%F")`   |
| Equality               | `$tok$ = 'true'`             | `$tok$ == 'true'`        |
| Substring              | `$substring($s, 0, 3)`       | `substr(s, 1, 3)`        |
| Round                  | `$round($n, 2)`              | `round(n, 2)`            |
| Sum field              | `$sum($arr)`                 | `sum(arr)` (no $)        |

Symptoms when SPL syntax slips in: expression silently evaluates to
an empty string, the literal source text, or `null`. There is no
runtime error in the dashboard.

### Trap 2: `$eval:name$` does NOT resolve in some token contexts

`$eval:name$` works in most token contexts but is **rejected** in:

- `input.timerange defaultValue` — UI shows "Invalid value" (live-tested 2026-05-22).
- Direct in `linkToDashboard.tokens[].value` — eval does not recompute before navigation.

Workaround for cross-dashboard time ranges: use the **three-handler
chain** (setToken → setToken → linkToDashboard) to materialise the
eval into a regular token before navigation. See `ds-int-drilldowns`.

### Trap 3: `conditions` are source-code-only

The Token Manager UI in Splunk 10.4 creates `expressions.eval`
entries only. Adding `expressions.conditions` requires editing the
JSON directly (Source view) — the UI will not scaffold them.

### Trap 4: Single `=` for equality (NOT `==`)

JSONata uses a single equals sign. `==` is invalid; expressions
containing it silently produce wrong results.

### Trap 5: `isSet()` is Cloud-only

`isSet($tok$)` works on Splunk Cloud (10.1.2507+) but Enterprise 10.2.x
rejects it. For portability use the empty-string comparison: `$tok$ != ""`.

### Trap 6: Object key vs `name` field

The expression's **`name`** field — NOT the JSON object key — is what
`$eval:name$` references.

```json
"eval": {
  "eval_uniqueObjectKey": {     // internal key, NOT referenced
    "name": "CombinedRevenue",  // THIS is the $eval:name$ identifier
    "value": "$A$+$B$"
  }
}
```

Reference: `$eval:CombinedRevenue$` works; `$eval:eval_uniqueObjectKey$`
silently returns the literal string.

### Trap 7: Expressions require Enterprise 10.2+ / Cloud 10.1.2507+

The `expressions` stanza was announced 2025-10-29. On older Splunk
versions the entire stanza is ignored — no error, just no derived
values. Confirm the deployment target before authoring.

### Trap 8: Token references are bare inside expressions

Inside both `eval` and `conditions` values, write `$tok$` (bare), NOT
`"$tok$"` (quoted). Quoting produces a literal string that never
matches.

```text
Correct:  "value": "$selected_host$ = \"web-01\""    // bare $tok$, quoted literal
Wrong:    "value": "\"$selected_host$\" = \"web-01\""
```

## The `expressions` stanza

Top-level sibling of `dataSources`, `visualizations`, `inputs`,
`layout`. Two sub-objects: `conditions` (boolean predicates) and
`eval` (derived values).

```json
{
  "expressions": {
    "conditions": {
      "condition_abc123": {
        "name": "show details",
        "value": "$detailsVisibility$ = \"true\""
      }
    },
    "eval": {
      "eval_V7nqJNlY": {
        "name": "CombinedRevenue",
        "value": "$NovaStreamRevenue$+$NovaAnalyticsRevenue$"
      }
    }
  }
}
```

### Key points

- `conditions` evaluate to **boolean**. Used by
  `containerOptions.visibility.showConditions` /
  `hideConditions`.
- `eval` evaluates to **string, number, boolean, or array**.
  Referenced everywhere tokens work via `$eval:<name>$`.
- The **`name`** field is the reference identifier; the object key
  is internal.
- Expressions re-evaluate whenever any token they reference changes.

### Version requirements

| Feature                                  | Cloud      | Enterprise |
| ---------------------------------------- | ---------- | ---------- |
| Token eval (`expressions.eval`)          | 10.1.2507  | 10.2       |
| `expressions.conditions`                 | 10.1.2507  | 10.2       |
| `containerOptions.visibility`            | 10.1.2507  | 10.2       |
| Conditional panel visibility (basic)     | 9.0.2303   | 9.1        |

## `$eval:name$` reference syntax

The `name` field of an `eval` expression is referenced via
`$eval:<name>$` (see Trap 6 for `name` vs object key). Works
everywhere tokens work, with the exceptions listed in Trap 2.

| Location                       | Status  | Example                                               |
| ------------------------------ | ------- | ----------------------------------------------------- |
| Markdown                       | works   | `"markdown": "## $eval:welcome message$"`             |
| SPL queries                    | works   | `"query": "\| makeresults \| eval f=$eval:Combined$"` |
| Input labels                   | works   | `"label": "$eval:detailsBtnLabel$"`                   |
| Panel titles                   | works   | `"title": "Region: $eval:regionLabel$"`               |
| Visualization option values    | works   | `"majorValue": "$eval:CombinedRevenue$"`              |
| `setToken.value`               | works   | `"value": "$eval:toggleDetails$"`                     |
| `queryParameters`              | works\* | \*defeats the time picker — prefer regular tokens     |
| `input.timerange defaultValue` | FAILS   | UI: "Invalid value"                                   |
| `linkToDashboard.tokens[].value` (direct) | FAILS | Eval doesn't recompute before navigation   |

For cross-dashboard time ranges, use the three-handler chain
(`ds-int-drilldowns`) to materialise the eval into a regular token.

## Conditions syntax

`expressions.conditions` uses a strict subset of JSONata: comparison
operators, boolean operators, parentheses, and bare token references.
No JSONata functions appear in any confirmed condition example.

| Operator             | Meaning                       |
| -------------------- | ----------------------------- |
| `=`                  | Equals (single `=`, NOT `==`) |
| `!=`                 | Not equals                    |
| `<`, `>`, `<=`, `>=` | Numeric comparison            |
| `and`, `or`, `not`   | Boolean (lowercase)           |
| `( )`                | Grouping                      |

```json
"conditions": {
  "host_is_set":     { "name": "host is set",
                       "value": "$selected_host$ != \"\"" },
  "in_maint_window": { "name": "in maint",
                       "value": "$mode$ = \"maint\" and $hour$ < 8" },
  "details_visible": { "name": "details visible",
                       "value": "$detailsVisibility$ = \"true\"" }
}
```

Wiring conditions to panel visibility is documented in
`ds-int-visibility` (`containerOptions.visibility.showConditions`
takes an array of condition names).

For Cloud/Enterprise portability use `$tok$ != ""` rather than the
Cloud-only `isSet($tok$)` (see Trap 5).

## Operators (eval expressions)

Operators valid inside `expressions.eval` values.

| Category       | Operators / Syntax                          | Tier        |
| -------------- | ------------------------------------------- | ----------- |
| Arithmetic     | `+`, `-`, `*`, `/`                          | [Confirmed] |
| Modulo         | `%`                                         | [Standard]  |
| Comparison     | `=`, `!=`, `<`, `>`, `<=`, `>=`             | [Confirmed] |
| Boolean        | `and`, `or`, `not`                          | [Confirmed] |
| Ternary        | `cond ? true_val : false_val`               | [Confirmed] |
| String concat  | `&` (NOT `+`, NOT `.`)                      | [Confirmed] |
| Range          | `[start..end]` — array of integers          | [Standard]  |
| Wildcard       | `*` — match any field at this level         | [Standard]  |
| Descendent     | `**` — match at any depth                   | [Standard]  |
| Parent         | `%` — refer to parent in path expression    | [Standard]  |
| Function chain | `~>` — pipe value into next function        | [Standard]  |
| Variable bind  | `$myVar := expr`                            | [Standard]  |

## String functions

`&` is the **only** confirmed string-producing operator. The rest are
standard JSONata, expected to work.

| Function          | Signature                              | Description                            | Tier        |
| ----------------- | -------------------------------------- | -------------------------------------- | ----------- |
| `&`               | `'a' & 'b'`                            | String concatenation                   | [Confirmed] |
| `$string`         | `$string(value)`                       | Convert value to string                | [Standard]  |
| `$length`         | `$length(str)`                         | Character count                        | [Standard]  |
| `$substring`      | `$substring(str, start [, len])`       | 0-indexed substring                    | [Standard]  |
| `$substringBefore`| `$substringBefore(str, chars)`         | Portion before first match             | [Standard]  |
| `$substringAfter` | `$substringAfter(str, chars)`          | Portion after first match              | [Standard]  |
| `$uppercase`      | `$uppercase(str)`                      | Convert to uppercase                   | [Standard]  |
| `$lowercase`      | `$lowercase(str)`                      | Convert to lowercase                   | [Standard]  |
| `$trim`           | `$trim(str)`                           | Strip leading/trailing whitespace      | [Standard]  |
| `$pad`            | `$pad(str, width [, char])`            | Pad to width (negative = right-pad)    | [Standard]  |
| `$contains`       | `$contains(str, pattern)`              | Returns boolean                        | [Standard]  |
| `$split`          | `$split(str, sep [, limit])`           | Split into array                       | [Standard]  |
| `$join`           | `$join(arr [, sep])`                   | Join array into string                 | [Standard]  |
| `$match`          | `$match(str, regex [, limit])`         | Regex match → array of result objects  | [Standard]  |
| `$replace`        | `$replace(str, pattern, replacement)`  | String or regex replace                | [Standard]  |

Note: JSONata is 0-indexed. SPL is 1-indexed. Watch for off-by-one
when porting SPL `substr()` calls.

## Numeric functions

| Function        | Signature                          | Description                            | Tier        |
| --------------- | ---------------------------------- | -------------------------------------- | ----------- |
| `+`, `-`, `*`, `/` | numeric ops                     | Arithmetic                             | [Confirmed] |
| `$number`       | `$number(value)`                   | Cast to number (string → number)       | [Standard]  |
| `$abs`          | `$abs(n)`                          | Absolute value                         | [Standard]  |
| `$floor`        | `$floor(n)`                        | Round down                             | [Standard]  |
| `$ceil`         | `$ceil(n)`                         | Round up                               | [Standard]  |
| `$round`        | `$round(n [, precision])`          | Banker's rounding to `precision`       | [Standard]  |
| `$power`        | `$power(base, exp)`                | Exponentiation                         | [Standard]  |
| `$sqrt`         | `$sqrt(n)`                         | Square root                            | [Standard]  |
| `$random`       | `$random()`                        | Random in [0, 1)                       | [Standard]  |
| `$formatNumber` | `$formatNumber(n, picture)`        | Format with picture string             | [Standard]  |

`$formatNumber` picture strings: `'0.00'` (two decimals),
`'#,##0'` (thousands separators), `'0.00%'` (percent),
`'$0,000.00'` (currency). Pattern matches XPath 2.0 number formats.

## Date/time functions

`$now()` with an XPath picture string is the **confirmed** date
function. Epoch arithmetic is the confirmed pattern for time math.
`$toMillis` / `$fromMillis` are standard JSONata and expected to work
for ISO 8601 strings.

| Function     | Signature                          | Description                                  | Tier        |
| ------------ | ---------------------------------- | -------------------------------------------- | ----------- |
| `$now`       | `$now(picture [, timezone])`       | Current time formatted by picture            | [Confirmed] |
| `$millis`    | `$millis()`                        | Current epoch in milliseconds                | [Standard]  |
| `$toMillis`  | `$toMillis(iso8601 [, picture])`   | ISO 8601 → epoch ms                          | [Standard]  |
| `$fromMillis`| `$fromMillis(ms [, picture])`      | Epoch ms → ISO 8601 or picture-formatted     | [Standard]  |

### XPath picture format tokens used by `$now()`

| Token        | Meaning                                |
| ------------ | -------------------------------------- |
| `[Y0001]`    | Year, 4 digits (e.g., `2026`)          |
| `[M01]`      | Month, 2 digits (`01`–`12`)            |
| `[MNn,-3]`   | Month name abbreviated (e.g., `May`)   |
| `[MNn]`      | Month name full (e.g., `May`)          |
| `[D01]`      | Day of month, 2 digits                 |
| `[H01]`      | Hour 24h, 2 digits                     |
| `[h01]`      | Hour 12h, 2 digits                     |
| `[m01]`      | Minute, 2 digits                       |
| `[s01]`      | Second, 2 digits                       |
| `[P]`        | AM/PM marker                           |
| `[Z]`        | Timezone offset                        |

Example: `$now('[MNn,-3] [D01], [Y0001]')` → `May 23, 2026`.

For DS time-range arithmetic, the confirmed pattern is **epoch
arithmetic** on a numeric token (capture `_epoch_time=_time` in SPL,
expose via `drilldown.setToken`, then `$click_epoch$ ± seconds`).
See Recipe 4 below. Avoid ISO 8601 manipulation when epoch
arithmetic suffices.

## Aggregation and boolean functions

| Function    | Signature              | Description                  | Tier       |
| ----------- | ---------------------- | ---------------------------- | ---------- |
| `$sum`      | `$sum(array)`          | Sum of numeric array         | [Standard] |
| `$max`      | `$max(array)`          | Maximum                      | [Standard] |
| `$min`      | `$min(array)`          | Minimum                      | [Standard] |
| `$average`  | `$average(array)`      | Arithmetic mean              | [Standard] |
| `$count`    | `$count(array)`        | Element count                | [Standard] |
| `$boolean`  | `$boolean(value)`      | Truthy cast                  | [Standard] |
| `$not`      | `$not(boolean)`        | Boolean negation             | [Standard] |
| `$exists`   | `$exists(value)`       | Value is defined and not null| [Standard] |

In DS expressions, aggregation functions are most useful inside an
`eval` that references a multi-value token (e.g., from a multiselect
input transformed via `$split`).

## Array functions

| Function    | Signature                  | Description                          | Tier       |
| ----------- | -------------------------- | ------------------------------------ | ---------- |
| `$count`    | `$count(array)`            | Length                               | [Standard] |
| `$append`   | `$append(a1, a2)`          | Concatenate two arrays               | [Standard] |
| `$sort`     | `$sort(array [, comparator])` | Stable sort                       | [Standard] |
| `$reverse`  | `$reverse(array)`          | Reverse order                        | [Standard] |
| `$shuffle`  | `$shuffle(array)`          | Randomise order                      | [Standard] |
| `$distinct` | `$distinct(array)`         | Remove duplicates                    | [Standard] |
| `$zip`      | `$zip(a1, a2, ...)`        | Element-wise tuples                  | [Standard] |

## Higher-order functions

| Function   | Signature                              | Description                              | Tier       |
| ---------- | -------------------------------------- | ---------------------------------------- | ---------- |
| `$map`     | `$map(array, function($v){...})`       | Transform each element                   | [Standard] |
| `$filter`  | `$filter(array, function($v){...})`    | Keep elements where lambda is truthy     | [Standard] |
| `$reduce`  | `$reduce(array, function($a,$v){...} [, init])` | Fold into single value          | [Standard] |
| `$single`  | `$single(array, function($v){...})`    | Find unique match (errors on 0 or many)  | [Standard] |

### Lambda syntax

```text
function($v) { $v * 2 }
function($acc, $v) { $acc + $v }
```

Lambdas are JSONata expressions, not JavaScript. No `return`
keyword — the last expression is the value.

> **[Standard JSONata] confidence note:** `$map`/`$filter`/`$reduce` and lambda syntax are not individually confirmed against a live Dashboard Studio instance. They are standard JSONata and expected to work because Splunk docs state "JSONata's built-in functions" are available — but test output in DS before relying on higher-order expressions in production dashboards.

## Common recipes

Each recipe shows the **pure JSONata expression** and the **full
Dashboard Studio JSON wrapper**. Copy-paste ready.

### Recipe 1: RAG threshold coloring

Map a numeric token to a status string via nested ternary.

Pure JSONata: `$cpu_percent$ > 90 ? 'critical' : $cpu_percent$ > 75 ? 'warning' : 'normal'`

```json
"expressions": {
  "eval": {
    "eval_cpuStatus": {
      "name": "cpuStatus",
      "value": "$cpu_percent$ > 90 ? 'critical' : $cpu_percent$ > 75 ? 'warning' : 'normal'"
    }
  }
}
```

Reference: `## CPU: $eval:cpuStatus$` in markdown, or feed the status
string into a `seriesColorsByValue` map.

### Recipe 2: Dynamic label / title

Build a panel title from one or more tokens with string concat (`&`).

Pure JSONata: `'Region: ' & $uppercase($region$) & ' — ' & $timeWindow$`

```json
"expressions": {
  "eval": {
    "eval_panelTitle": {
      "name": "panelTitle",
      "value": "'Region: ' & $uppercase($region$) & ' — ' & $timeWindow$"
    }
  }
},
"visualizations": {
  "viz_main": { "title": "$eval:panelTitle$" }
}
```

### Recipe 3: Toggle visibility (button + ternary)

Two cooperating evals — one for the button label, one for the new
token value. The button's `drilldown.setToken` writes the toggled
value back to the same token.

```json
"expressions": {
  "eval": {
    "expr_label":  { "name": "detailsBtnLabel",
                     "value": "$detailsVisibility$ = 'true' ? 'Show overview' : 'Show details'" },
    "expr_toggle": { "name": "toggleDetails",
                     "value": "$detailsVisibility$ = 'true' ? 'false' : 'true'" }
  }
},
"inputs": {
  "input_toggle": {
    "type": "input.button",
    "options": { "text": "$eval:detailsBtnLabel$" },
    "eventHandlers": [
      { "type": "drilldown.setToken",
        "options": { "token": "detailsVisibility", "value": "$eval:toggleDetails$" } }
    ]
  }
}
```

### Recipe 4: Time arithmetic (epoch ± seconds)

Cross-dashboard time-range drilldown — capture click epoch, compute
earliest/latest, pass to linked dashboard via the three-handler chain
(see `ds-int-drilldowns`).

```json
"expressions": {
  "eval": {
    "eval_earliest": { "name": "EARLIEST", "value": "$click_epoch$-300" },
    "eval_latest":   { "name": "LATEST",   "value": "$click_epoch$+300" }
  }
}
```

For ISO 8601 inputs use `$toMillis($iso_string$)/1000`; for SPL-side
epoch use `_epoch_time=_time` and pass the integer through.

### Recipe 5: Conditional formatting (multi-condition ternary)

Display a status label based on multiple thresholds.

Pure JSONata: `$errors$ > 100 ? 'Critical' : $errors$ > 10 ? 'Elevated' : $errors$ > 0 ? 'Normal' : 'Idle'`

```json
"expressions": {
  "eval": {
    "eval_errStatus": {
      "name": "errStatus",
      "value": "$errors$ > 100 ? 'Critical' : $errors$ > 10 ? 'Elevated' : $errors$ > 0 ? 'Normal' : 'Idle'"
    }
  }
}
```

### Recipe 6: Multi-token aggregation

Combine multiple numeric tokens — sum of two revenue streams plus tax.

Pure JSONata: `($streamA$ + $streamB$) * (1 + $taxRate$)`

```json
"expressions": {
  "eval": {
    "eval_grandTotal": {
      "name": "grandTotal",
      "value": "($streamA$ + $streamB$) * (1 + $taxRate$)"
    }
  }
}
```

Reference: `"majorValue": "$eval:grandTotal$"` or SPL
`| eval total=$eval:grandTotal$`.

## See also

- `ds-int-tokens` — token reference, where derived tokens are
  consumed, debug ladder for "panel not updating".
- `ds-int-visibility` — `containerOptions.visibility.showConditions` /
  `hideConditions` schema; consumes `expressions.conditions`.
- `ds-int-drilldowns` — three-handler chain recipe for materialising
  `$eval:name$` into a regular token before navigation.
- `ds-ref-syntax` — top-level `expressions` stanza placement in the
  Dashboard Studio JSON envelope.
- `ds-int-defaults` — initialising tokens that feed expressions.
- JSONata official docs: https://docs.jsonata.org/overview.html
  (Splunk implements the subset relevant to DS — confirmed features
  are tagged [Confirmed] above).
