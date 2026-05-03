# appendpipe — apply subpipeline and append output

Source: Splunk Search Reference 10.2.0

## Syntax

    | appendpipe [run_in_preview=<bool>] [<subpipeline>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `subpipeline` | yes | — | A list of pipeline commands applied to the current result set |
| `run_in_preview` | no | true | When false, subpipeline output is hidden during preview but included in final results |

## Usage

Unlike `append` (which runs a separate independent search), `appendpipe` receives the current result set
as its input. The subpipeline transforms that copy of the results, then the transformed output is appended
to the original results. Both the original rows and the subpipeline rows appear together in the final output.

Common patterns: adding a TOTAL row, computing subtotals by a grouping dimension, or appending a
summary annotation row to a table.

## Examples

### Add a TOTAL row to a per-user action count

```spl
index=_audit | stats count by action, user
| appendpipe [stats sum(count) AS count by action | eval user = "TOTAL - ALL USERS"]
| sort action
```

### Add a grand total row to a bytes-by-sourcetype report

```spl
index=main | stats count, sum(bytes) AS total_bytes by sourcetype
| appendpipe [stats sum(count) AS count, sum(total_bytes) AS total_bytes
             | eval sourcetype = "** TOTAL **"]
```

### Append a row with percentages

```spl
index=main | stats count by status
| appendpipe [stats sum(count) AS grand_total | eval status = "TOTAL", count = grand_total]
| eval pct = round(count / max(count) * 100, 1)
```

## Gotchas

- **Operates on the current result set, not a new search** — the subpipeline cannot reach back to the
  index. If you need fresh data, use `append` with a full subsearch instead.
- **Both sets appear in output** — the original rows are not replaced; the subpipeline output is appended
  after them. Accidentally omitting the subpipeline produces a duplicate copy of all results.
- **Cannot be used after `map`** — placing `appendpipe` after a `map` command in the same pipeline is not
  supported and will cause an error.
- **`run_in_preview=false` hides the effect during search execution** — useful for slow subpipelines where
  you don't want to block preview rendering.

## Tips

- Combine with `eval` inside the subpipeline to set a literal label (e.g., `eval host = "ALL"`) so the
  summary row is easy to identify in a table or chart.
- Use `addtotals` for simple row/column numeric sums — it is simpler and faster than `appendpipe`.

## See also

- `append.md` — add results from a separate independent search
- `addtotals.md` — simpler way to add numeric row/column totals
- `appendcols.md` — add subsearch results as new columns
