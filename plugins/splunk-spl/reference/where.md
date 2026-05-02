# where — filter events using eval expressions

Source: Splunk Search Reference 8.2.12, page 645.

## Syntax

    | where <eval-expression>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<eval-expression>` | Yes | — | Any boolean eval expression; events for which the expression evaluates to `true` (non-zero, non-null) are kept |

`where` accepts the full eval function library: `like()`, `match()`, `in()`, `isnotnull()`, `cidrmatch()`, `len()`, etc.
Boolean operators: `AND`, `OR`, `NOT` (also `&&`, `||`, `!`).

## Comparison with `search`

| Feature | `search` | `where` |
|---|---|---|
| Wildcards | `field=*error*` | `like(field, "%error%")` or `match(field, "error")` |
| Null check | `field=*` (field exists) | `isnotnull(field)` |
| Not equal | `field!=val` (keeps nulls!) | `field!="val"` (excludes nulls) |
| Numeric compare | `=` and `!=` only | `<`, `>`, `<=`, `>=` |
| Field vs field | not supported | `where src_ip = dest_ip` |
| Eval functions | not supported | `where len(url) > 100` |

## Examples

### Numeric comparison and function

    index=web sourcetype=access_combined
    | where status >= 400 AND len(uri) > 200
    | stats count by status, uri

### Field vs field comparison

    index=network
    | where src_ip = dest_ip
    | stats count by src_ip

### Null-safe exclusion

Exclude status 200 while also dropping events where status is null:

    index=web
    | where isnotnull(status) AND status != 200

### CIDR and regex combined

    index=firewall
    | where cidrmatch("10.0.0.0/8", src_ip) AND match(url, "(?i)passwd|shadow|etc")

## Gotchas

- **Double quotes for string literals, single quotes for field names** — `where status = "200"` compares the field `status` to the string literal `"200"`. `where 'nested.field' = "value"` is how dotted field names work. Never use double quotes for a field name in `where` — `where "status" = 200` treats `"status"` as a string literal, not a field.

- **`!=` in `where` excludes nulls** — unlike `search`, `where status != 200` drops rows where `status` is null. This is usually correct behavior but can hide events. Add `OR isnull(status)` if you want to keep them.

- **`where` runs on the search head after any transforming command** — it is a distributable streaming command when placed before `stats`/`chart`, but becomes search-head-only after. Place simple keyword filters as early as possible in the pipeline using `search` instead.

## See also

- `search.md` — keyword-based filtering; runs on indexers, supports wildcards
- `eval.md` — full eval function reference
- `regex.md` — regex filtering without the overhead of named capture groups
