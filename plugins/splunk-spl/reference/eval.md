# eval — compute new fields from expressions

Source: Splunk Search Reference 8.2.12, page 277. Evaluation Functions: page 31.

## Syntax

    | eval <field>=<expression> [, <field>=<expression>]...

Multiple assignments in one `eval` call are separated by commas. They are evaluated
left-to-right and later expressions can reference fields created by earlier ones.

## Quoting rules

| Context | Single quotes `'...'` | Double quotes `"..."` | No quotes |
|---|---|---|---|
| Field name (simple) | `'src'` | never | `src` |
| Field name (dotted/special chars) | `'src.ip'`, `'my-field'` | never | — |
| String literal | never | `"Success"` | never |
| Operators | `'field'!="val"` | `field="value"` | `field=simple` |

**Critical rule:** `"fieldname"` in eval is a **string literal**, not a field
reference. `eval x = "status"` sets x to the string "status". Use `eval x = status`
or `eval x = 'status'` to copy the field value.

## Operators

| Type | Operators |
|---|---|
| Arithmetic | `+ - * / %` |
| Concatenation | `.` (period) — concatenates strings and numbers |
| Comparison | `< > <= >= != = ==` (single `=` and `==` are synonymous in expressions) |
| Boolean | `AND OR NOT XOR` |
| Pattern | `LIKE` (`%` = any chars, `_` = single char) |

## Function categories with examples

### Conditional

`if(condition, true_val, false_val)` — ternary:

    | eval status_label = if(status >= 400, "Error", "OK")
    | eval is_internal = if(cidrmatch("10.0.0.0/8", src_ip), 1, 0)

`case(cond1, val1, cond2, val2, ..., true(), default_val)` — multi-branch:

    | eval severity = case(
        response_ms > 5000, "critical",
        response_ms > 1000, "slow",
        response_ms > 200,  "normal",
        true(),             "fast"
    )

`coalesce(field1, field2, ...)` — first non-null:

    | eval ip = coalesce(src_ip, client_ip, "unknown")

`nullif(X, Y)` — returns NULL if X equals Y, else X:

    | eval clean_status = nullif(status, "-")

`in(field, val1, val2, ...)` — set membership (use inside `if()`):

    | eval is_blocked = if(in(action, "deny", "drop", "blocked"), 1, 0)

### String

    | eval domain   = mvindex(split(email, "@"), 1)
    | eval short_id = substr(transaction_id, 1, 8)
    | eval label    = upper(category) . ": " . tostring(count, "commas")
    | eval has_err  = if(like(message, "%error%"), 1, 0)
    | eval masked   = replace(ssn, "\d{3}-\d{2}-(\d{4})", "XXX-XX-\1")
    | eval host_lc  = lower(host)
    | eval path_len = len(uri_path)

`tostring(X, format)` formats numbers:

    | eval display = tostring(bytes, "commas")      -- "1,234,567"
    | eval dur_str = tostring(elapsed_s, "duration") -- "01:23:45"
    | eval hex_val = tostring(num, "hex")            -- "0xff"

`printf(format, args)` C-style formatting:

    | eval msg = printf("User %s: %d events (%.1f%%)", user, count, pct)

### Numeric

    | eval mb          = round(bytes / 1024 / 1024, 2)
    | eval pct         = round(errors / total * 100, 1)
    | eval abs_lag     = abs(expected - actual)
    | eval clamped     = max(0, min(value, 100))
    | eval log2_size   = log(file_size, 2)

`tonumber(string, base)` — convert string to number:

    | eval port_num = tonumber(port_str)
    | eval hex_dec  = tonumber("ff", 16)

### Type and informational

    | eval type_label = if(isnum(value), "number", if(isstr(value), "string", "other"))
    | eval has_data   = isnotnull(payload)
    | eval safe_num   = if(isnum(bytes), bytes, 0)
    | eval field_type = typeof(value)   -- returns "Number", "String", "Boolean", "NULL"

### Time

`strftime(epoch, format)` — epoch to formatted string:

    | eval ts_display = strftime(_time, "%Y-%m-%d %H:%M:%S")
    | eval date_only  = strftime(_time, "%Y-%m-%d")
    | eval hour_of_day = strftime(_time, "%H")

`strptime(string, format)` — formatted string to epoch:

    | eval epoch = strptime(date_field, "%Y-%m-%d %H:%M:%S")

`relative_time(epoch, modifier)` — time arithmetic:

    | eval yesterday_start = relative_time(now(), "-1d@d")
    | eval age_days         = round((now() - _time) / 86400, 1)

Common snap-to modifiers: `@d` (start of today), `-1d@d` (yesterday midnight),
`@mon` (start of month), `-1mon@mon` (start of last month), `@y` (start of year).

### JSON

    | eval tenant = json_extract(payload, "context.tenantId")
    | eval first  = json_extract(payload, "items{0}.sku")
    | eval all_ids = json_extract(payload, "items{}.id")
    | eval obj    = json_object("user", user, "count", count)
    | eval valid  = json_valid(_raw)

### Multivalue

    | eval parts     = split(url, "/")
    | eval first_seg = mvindex(parts, 0)
    | eval last_seg  = mvindex(parts, -1)
    | eval tag_count = mvcount(tags)
    | eval combined  = mvappend(field1, field2, field3)
    | eval joined    = mvjoin(tags, ", ")
    | eval critical  = mvfilter(match(alerts, "critical|high"))

### Cryptographic

    | eval fingerprint = sha256(user . src_ip)
    | eval hash_id     = md5(transaction_id)

## Dashboard-specific pattern: classification field for chart coloring

Add a derived field that a viz can use for conditional color or icon selection:

    index=orders sourcetype=order_events
    | stats sum(order_total) AS revenue, count AS orders by region
    | eval performance = case(
        revenue > 100000, "high",
        revenue > 50000,  "medium",
        true(),           "low"
    )
    | eval revenue_fmt = "$" . tostring(round(revenue, 0), "commas")

## Gotchas

- **`case()` default trap — never use `true =` or `true() =`**

  Three forms look like defaults but silently never fire:

  | Written form | Problem | Fix |
  |---|---|---|
  | `..., true = "low"` | `true` is read as a field name, not a boolean | `..., true(), "low"` |
  | `..., true() = "low"` | `true() = "low"` is a comparison (always false) | `..., true(), "low"` (remove `=`) |
  | no default branch | `case()` returns NULL when no condition matches | add `true(), "default"` |

  The rule: inside `case()`, condition and value are separated by a **comma**, never `=`.

- **Dotted field names must be single-quoted** — `'properties.status'` is a field
  reference; `properties.status` without quotes is parsed as a sub-expression and
  silently returns wrong results. This applies in `eval`, `where`, `if`, `case`, and
  `search`. It does NOT apply in `stats`, `table`, `fields`, or `rename`.

- **`"fieldname"` is a string, not a field** — `eval x = "status"` assigns the
  literal string "status" to x. Use `eval x = status` or `eval x = 'status'`.

- **`in()` requires exact match — no wildcards** — `in(action, "den*")` does not
  work. For pattern matching use `like()` or `match()`. Also, `in()` must be wrapped
  in `if()` when used inside `eval`; it cannot be assigned directly.

- **`case()` returns NULL if no branch matches** — a `stats` grouping on a
  `case()`-derived field will silently drop events where the result is NULL. Always
  include a catch-all `true(), "Other"` unless you intentionally want to drop them.

- **`null()` is not the same as `""`** — `field != ""` does NOT exclude null fields.
  Use `isnotnull(field)` to test for null, and `field != ""` to test for empty string.
  Use both together to exclude null-or-empty: `isnotnull(field) AND field != ""`.

- **Division by zero returns NULL**, not an error — downstream `stats` and display
  operations will silently drop or blank those events. Guard with:
  `eval rate = if(total > 0, success / total, 0)`

- **`eval` is distributable streaming** — it runs on indexers. Keep `eval` before
  any transforming command (`stats`, `chart`, `timechart`) to maximize performance.

## New in Splunk 10.2

### Bitwise functions

```spl
| eval result = bit_and(0xFF, 0x0F)           -- 0x0F
| eval result = bit_or(0xF0, 0x0F)            -- 0xFF
| eval result = bit_not(0xFF, 8)              -- 0x00 (8-bit mask)
| eval result = bit_xor(0xFF, 0x0F)           -- 0xF0
| eval result = bit_shift_left(1, 4)          -- 16
| eval result = bit_shift_right(16, 4)        -- 1
```

### Extended type conversion

```spl
| eval arr = toarray(1, 2, 3)                 -- JSON array [1,2,3]
| eval b = tobool("true")                     -- boolean true
| eval d = todouble("3.14")                   -- double 3.14
| eval i = toint("42")                        -- integer 42
| eval mv = tomv(json_array)                  -- multivalue from JSON array
| eval obj = toobject("key", "val")           -- JSON object {"key":"val"}
| eval masked = ipmask("255.255.255.0", src)  -- mask IP to subnet
```

### Extended type checking

```spl
| eval is_arr = isarray(field)                -- true if JSON array
| eval is_bool = isbool(field)                -- true if boolean
| eval is_dbl = isdouble(field)               -- true if double/float
| eval is_int = isint(field)                   -- true if integer
| eval is_mv = ismv(field)                     -- true if multivalue
| eval is_obj = isobject(field)               -- true if JSON object
```

These complement the existing `isnum()`, `isstr()`, `isnull()`,
`isnotnull()` functions with more specific type discrimination.

## See also

- `stats.md` — aggregation; `eval` expressions can appear inside stats functions
- `where.md` — filter using eval-style expressions
- `fieldformat.md` — display formatting without changing the field value
