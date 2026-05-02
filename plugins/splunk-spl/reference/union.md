# union — combine multiple datasets

Source: Splunk Search Reference 8.2.12, page 632.

## Syntax

    | union [maxtime=<int>] [maxout=<int>] <subsearch> [<subsearch>]...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| subsearch | yes | — | Two or more searches in square brackets |
| maxtime | no | 60 | Max seconds per subsearch |
| maxout | no | 50000 | Max results per subsearch |

## Examples

### Combine firewall and auth logs

```spl
| union
    [search index=main sourcetype=firewall | stats count by src]
    [search index=main sourcetype=auth | stats count by src]
```

## Gotchas

- **Like SQL UNION ALL:** Does not deduplicate. Use `| dedup` after if needed.
- **Field alignment:** Fields are merged — if searches return different fields, nulls fill gaps.
- **Subsearch limits apply:** Each subsearch has independent 60s/50K limits.

## See also

- `append.md` — simpler two-search combine
- `multisearch.md` — parallel streaming alternative
- `set.md` — set operations (union, diff, intersect)
