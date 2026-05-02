# sort — sort results by field values

Source: Splunk Search Reference 8.2.12, page 524.

## Syntax

    | sort [<count>] [<sort-by-clause>]... [desc]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| sort-by-clause | yes | — | `[-|+]<field>` — `-` descending, `+` ascending |
| count | no | 10000 | Max results to return. Use `0` for all |
| desc | no | — | Reverse all sort orders |

Sort field options: `auto(<field>)`, `ip(<field>)`, `num(<field>)`, `str(<field>)`.

## Examples

### Sort all results descending

```spl
| sort 0 -count
```

### Multi-field sort

```spl
| sort 0 -count, +user
```

### IP-aware sort

```spl
| sort 0 ip(src)
```

## Gotchas

- **Default limit 10000:** Without a count, `sort` silently returns only 10,000 results. ALWAYS use `sort 0` to sort all results. This is trap #5.
- **Dataset processing command:** Runs on the search head, not indexers. Performance degrades with millions of results.
- **Lexicographic gotcha:** Alphanumeric strings sort lexicographically by first character. `"9"` sorts after `"10"` because `9` > `1`. Use `num(field)` to force numeric sorting.

## See also

- `reverse.md` — reverse result order
- `head.md` — first N results
- `tail.md` — last N results
