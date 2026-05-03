# appendcols — add subsearch results as new columns

Source: Splunk Search Reference 10.2.0

## Syntax

    | appendcols [override=<bool>] [maxtime=<int>] [maxout=<int>] [timeout=<int>] [<subsearch>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `subsearch` | yes | — | A secondary search enclosed in square brackets |
| `override` | no | false | If true, subsearch field values overwrite main result values when field names collide |
| `maxtime` | no | 60 | Maximum seconds to spend executing the subsearch before finalizing |
| `maxout` | no | 50000 | Maximum number of rows the subsearch may return |
| `timeout` | no | 60 | Maximum seconds to wait for the subsearch to fully complete |

## Usage

`appendcols` must follow a transforming command such as `stats`, `chart`, `timechart`, or `table`.
It merges columns positionally: row 1 of the subsearch → row 1 of the main results, row 2 → row 2, etc.
If the subsearch returns fewer rows than the main results, the extra main rows receive null values in the
appended fields. Internal fields (`_raw`, `_time`, etc.) from the subsearch are not merged.

## Examples

### Append a distinct-count column to a stats table

```spl
index=main | stats count by host
| appendcols [search index=main | stats dc(sourcetype) AS type_count by host | fields type_count]
```

### Calculate a ratio across two separate aggregations

```spl
| stats dc(userID) AS totalUsers
| appendcols
  [ search specific.server "text"
  | stats count(field) AS variableA ]
| eval ratio = exact(variableA / totalUsers)
```

### Override a conflicting field with the subsearch value

```spl
index=main | stats count by src
| appendcols override=true
  [ search index=enrichment | table src, geo_region ]
```

## Gotchas

- **Positional alignment only** — rows are joined by position, not by key. If the subsearch results are
  in a different order than the main results, field values will be mismatigned. Sort both sides consistently
  or use `join` for key-based merging.
- **Must follow a transforming command** — placing `appendcols` before `stats`/`table`/`chart` causes an
  error because there is no table-formatted result set to append to.
- **Field collisions drop subsearch values by default** — unless `override=true`, fields that exist in both
  the main results and the subsearch are silently taken from the main results.
- **Subsearch row limit** — the default `maxout=50000` truncates large subsearches. Raise it explicitly
  when appending from a high-cardinality lookup.

## Tips

- Use `| fields <only-what-you-need>` at the end of the subsearch to avoid importing unwanted columns.
- For key-based column merging (e.g., join on `host`), prefer `join` or `lookup` — they are more reliable
  than relying on row order.

## See also

- `append.md` — add rows instead of columns
- `join.md` — key-based column merging
- `appendpipe.md` — append results of a subpipeline on the current result set
