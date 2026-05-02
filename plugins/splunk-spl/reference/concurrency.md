# concurrency — find concurrent events by duration

Source: Splunk Search Reference 8.2.12, page 240.

## Syntax

    | concurrency duration=<field> [start=<field>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| duration | yes | — | Field containing event duration in seconds |
| start | no | _time | Field containing event start time |

## Examples

```spl
index=main sourcetype=access_combined
| eval duration = response_time / 1000
| concurrency duration=duration
| timechart max(concurrency) AS peak_concurrent
```

## See also

- `transaction.md` — group events into sessions
- `overlap.md` — find overlapping summary events
