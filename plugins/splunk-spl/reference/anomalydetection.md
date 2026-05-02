# anomalydetection — probabilistic anomaly detection

Source: Splunk Search Reference 8.2.12, page 195.

## Syntax

    | anomalydetection [method=<histogram|zscore|iqr>] [pthresh=<float>] [action=<annotate|filter|summary>] [field=<field>]...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| method | no | histogram | Detection method |
| pthresh | no | 0.01 | Threshold |
| field | no | all | Specific fields to analyze |

## Examples

```spl
index=main | anomalydetection method=zscore field=bytes | where isnotnull(probable_cause)
```

## See also

- `anomalies.md` — simpler event scoring
- `anomalousvalue.md` — per-field analysis
