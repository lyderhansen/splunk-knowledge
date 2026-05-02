# outlier — remove outlying numeric values

Source: Splunk Search Reference 8.2.12, page 439.

## Syntax

    | outlier [action=<remove|transform>] [param=<float>] [uselower=<bool>] [mark=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| action | no | remove | `remove` (drop outliers) or `transform` (replace with threshold) |
| param | no | 2.5 | Number of standard deviations to consider outlier |

## Examples

```spl
index=main | outlier action=remove param=3.0
```

## See also

- `anomalies.md` — anomaly scoring (more sophisticated)
- `where.md` — manual threshold filtering
