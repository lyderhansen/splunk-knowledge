# anomalousvalue — find unusual field values

Source: Splunk Search Reference 8.2.12, page 190.

## Syntax

    | anomalousvalue [action=<annotate|filter|summary>] [pthresh=<float>] [minsupcount=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| action | no | annotate | `annotate`, `filter`, or `summary` |
| pthresh | no | 0.01 | P-value threshold for flagging |

## Examples

```spl
index=main | anomalousvalue action=filter | table _time, host, sourcetype
```

## See also

- `anomalies.md` — event-level anomaly scoring
- `outlier.md` — numeric outlier removal
