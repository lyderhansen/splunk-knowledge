# collect — write results to a summary index

Source: Splunk Search Reference 8.2.12, page 236.

## Syntax

    | collect [index=<string>] [file=<string>] [spool=<bool>] [testmode=<bool>] [addtime=<bool>] [marker=<string>] [run_in_preview=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| index | no | summary | Target summary index |
| marker | no | — | Tag string added to collected events (e.g., `marker="report=daily"`) |
| testmode | no | false | If true, show what would be collected without writing |
| addtime | no | true | Add `_time` to collected events |

## Examples

### Scheduled daily collection

```spl
index=main | stats count by src, action | collect index=summary marker="report=daily_src"
```

## Gotchas

- **Events get original `_time`:** Collected events retain their `_time`, not the time they were collected. This is by design — but can confuse time-range searches of the summary index.
- **Use `marker` for identification:** Without a marker, collected events are hard to distinguish from other summary data.

## See also

- `overlap.md` — check for missed/overlapping collections
- `mcollect.md` — write to metric index instead
- `tscollect.md` — write tsidx for tstats
