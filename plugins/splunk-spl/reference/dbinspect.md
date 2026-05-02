# dbinspect — return index bucket information

Source: Splunk Search Reference 8.2.12, page 258.

## Syntax

    | dbinspect index=<string> [corruptonly=<bool>] [span=<timespan>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| index | yes | — | Index to inspect |
| span | no | — | Time span for bucketing results |

## Examples

```spl
| dbinspect index=main | stats sum(eventCount) AS total_events, dc(bucketId) AS buckets
```

## See also

- `metadata.md` — lighter metadata query
- `eventcount.md` — event counts
