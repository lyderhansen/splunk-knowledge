# mvcombine — combine rows into a multivalue field

Source: Splunk Search Reference 10.2.0

## Syntax

    | mvcombine [delim=<string>] <field>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field` | Yes | — | Field whose single values should be combined across rows into a multivalue field |
| `delim` | No | `" "` (space) | Delimiter used to build the single-value representation of the combined field. Only visible after `| nomv` |

## What it does

`mvcombine` takes a group of events that are identical in ALL fields except the specified field, and merges them into one event where the specified field becomes a multivalue field containing all the individual values.

It is the logical inverse of `mvexpand`: if you `mvexpand` a field and then `mvcombine` it (with identical other fields), you get back to the original row.

## Examples

### Combine IPs per user

```spl
index=myindex | stats count by user, src_ip
| fields user, src_ip
| mvcombine src_ip
```

### Inverse of mvexpand — round-trip

```spl
| mvexpand tags
| eval tags = upper(tags)
| mvcombine tags
```

### Combine with custom delimiter, then convert to string

```spl
| stats max(bytes) AS max, min(bytes) AS min BY host
| mvcombine delim="," host
| nomv host
```

### Reduce lookup rows to one row per key

```spl
| inputlookup user_roles.csv
| fields username, role
| mvcombine role
| table username, role
```

## Gotchas

- **ALL other fields must match exactly** — rows are only merged if every field besides the specified one is identical. A single differing field (even a count or timestamp) prevents rows from merging. Use `| fields` to drop irrelevant fields before calling `mvcombine`.
- **`delim` only matters with `| nomv`** — the multivalue version of the field (shown by default in the UI and in JSON/XML export) ignores `delim`. The delimiter only affects the flat single-value string produced by `| nomv field`. This surprises users who expect comma-separated output without `nomv`.
- **Order is not guaranteed** — the order of values in the resulting multivalue field is not deterministic. Sort the input with `| sort field` before `mvcombine` if order matters.
- **Not the same as `stats values()`** — `stats values(field) BY group` collapses within groups defined by a BY clause. `mvcombine` collapses rows where ALL other fields are identical. For most aggregation needs, `stats list()` or `stats values()` is simpler and more predictable.
- **Transforming command** — `mvcombine` is a transforming command, meaning it operates on the full result set and cannot be pushed to indexers. Place it after any distributable commands.
- **Raw events have too many varying fields** — `mvcombine` rarely works as expected on raw events because `_time`, `_raw`, `linecount`, etc. differ per event. Pre-aggregate with `stats` or select specific fields with `| fields` first.

## Tips

If your goal is simply to display multiple values in one table cell (e.g., all roles for a user), use `stats values(role) BY username` — it is more predictable than `mvcombine`. Use `mvcombine` when you need a true multivalue field for downstream multivalue functions.

## See also

- `mvexpand.md` — inverse: expand a multivalue field into separate rows
- `makemv.md` — create multivalue field by splitting a delimited string
- `nomv.md` — convert multivalue field to a flat single-value string
- `stats.md` — `values()` and `list()` for aggregation-based multivalue
