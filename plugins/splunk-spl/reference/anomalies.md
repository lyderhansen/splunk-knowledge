# anomalies — compute unexpectedness score per event

Source: Splunk Search Reference 8.2.12, page 186.

## Syntax

    | anomalies [threshold=<float>] [field=<field>] [action=<annotate|filter|summary>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| threshold | no | 0.01 | Probability threshold below which events are flagged |
| field | no | — | Specific field to analyze |
| action | no | annotate | `annotate` (add score), `filter` (keep only anomalies), `summary` |

## Examples

```spl
index=main | anomalies threshold=0.05 | sort -log_event_prob | head 20
```

## See also

- `anomalousvalue.md` — per-field anomaly analysis
- `anomalydetection.md` — probabilistic model
- `outlier.md` — numeric outlier removal
- `cluster.md` — group similar events
