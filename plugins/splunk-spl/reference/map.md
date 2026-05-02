# map — run a search for each result (loop)

Source: Splunk Search Reference 8.2.12, page 394.

## Syntax

    | map search=<search-string> [maxsearches=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| search | yes | — | Template search string with `$field$` tokens |
| maxsearches | no | 10 | Max number of iterations |

## Examples

### Follow-up search per IP

```spl
index=main action=deny | stats count by src | head 5
| map maxsearches=5 search="search index=main src=$src$ | stats dc(dest) AS targets"
```

## Gotchas

- **Default maxsearches=10:** Only processes the first 10 results. Increase with `maxsearches=100` but beware performance.
- **Expensive:** Launches a new search per result. For large datasets, prefer `join`, `lookup`, or `stats`-based patterns.
- **Token syntax:** Use `$field$` to reference fields from the preceding results.

## See also

- `join.md` — often more efficient for the same task
- `foreach.md` — iterate over fields, not results
