# sort — sort results by field values

Source: Splunk Search Reference 10.2.0

## Syntax

    | sort [<count>] [<sort-by-clause>]... [desc]

    <sort-by-clause>  ::=  [-|+] <sort-field>
    <sort-field>      ::=  <field> | auto(<field>) | ip(<field>) | num(<field>) | str(<field>)
    <count>           ::=  <int> | limit=<int>

Results missing a field sort to the smallest possible value in ascending order,
or the largest possible value in descending order.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `sort-by-clause` | Yes | — | One or more `[-\|+]<field>` expressions; `-` = descending, `+` = ascending |
| `count` / `limit` | No | 10000 | Max results to return; use `0` for all results |
| `desc` | No | — | Reverses the sort order for all specified fields |

### Sort field type modifiers

| Modifier | Behaviour |
|---|---|
| `auto(field)` | Splunk auto-detects numeric, IP, or string and sorts accordingly |
| `num(field)` | Force numeric sort — treats values as numbers |
| `ip(field)` | Force IP-address sort — sorts octets correctly |
| `str(field)` | Force lexicographic (string) sort |

## Examples

### Sort all results descending by count

```spl
| sort 0 -count
```

### Multi-field sort: descending count, ascending user

```spl
| sort 0 -count, +user
```

### IP-aware sort

```spl
| sort 0 ip(src_ip)
```

### Most recent event first

```spl
| sort 1 -_time
```

### Sort with explicit limit label

```spl
| sort limit=100 -bytes
```

### Sort by time bucket and average response time

```spl
| bin _time span=1h
| stats avg(response_time) AS avg_rt by _time
| sort 0 +_time
```

## Gotchas

- **Default limit 10,000 — silent truncation:** Without an explicit `count`, `sort`
  returns at most 10,000 results and silently discards the rest. **Always use `sort 0`**
  when you need all results sorted. This is one of the most common Splunk gotchas.

- **Dataset processing command — runs on the search head:** `sort` collects all results
  on the search head before sorting. On searches returning millions of events this can
  be slow and memory-intensive. Pre-filter aggressively before calling `sort`.

- **Lexicographic trap for alphanumeric fields:** By default, Splunk auto-detects the
  sort type. Alphanumeric strings are sorted based on the first character: `"9"` sorts
  after `"10"` because `9 > 1` lexicographically. Use `num(field)` to force numeric
  ordering when field values look like numbers but are stored as strings.

- **Mixed numeric and string values sort inconsistently:** The sort order is determined
  pairwise. Some pairs may sort numerically, others lexicographically, depending on
  field contents. Explicitly cast with `num()` or `str()` to avoid surprises.

- **`sort 0` performance warning:** The official docs note that `sort 0` can negatively
  impact performance for very large result sets. Use it only when you need all rows.

## Tips

- Prefer `| head N` over `| sort N -field` if you only need the top-N and do not need
  the full sorted list — `head` is a streaming command and far more efficient.
- Use `sort 1 -_time` as a fast way to retrieve the single most recent event for a
  given filtered set.

## See also

- `reverse.md` — reverse result order without re-sorting
- `head.md` — first N results (streaming, more efficient than `sort N`)
- `tail.md` — last N results
