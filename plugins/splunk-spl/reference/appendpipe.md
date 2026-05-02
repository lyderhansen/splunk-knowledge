# appendpipe — apply subpipeline and append output

Source: Splunk Search Reference 8.2.12, page 204.

## Syntax

    | appendpipe [run_in_preview=<bool>] [<subpipeline>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| subpipeline | yes | — | Pipeline commands in square brackets applied to current results |
| run_in_preview | no | true | Whether to run during preview mode |

## Examples

### Add a totals row

```spl
index=main | stats count, sum(bytes) AS total_bytes by sourcetype
| appendpipe [stats sum(count) AS count, sum(total_bytes) AS total_bytes | eval sourcetype="TOTAL"]
```

## Gotchas

- **Operates on current results, not a new search:** Unlike `append`, this doesn't run a new search — it processes the current result set through the subpipeline.
- **Appended results are added to the original:** Both the original results and the subpipeline output appear in the final result set.

## See also

- `append.md` — add results from a separate search
- `addtotals.md` — simpler way to add row/column totals
