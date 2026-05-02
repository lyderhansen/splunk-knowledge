# kmeans — k-means clustering on numeric fields

Source: Splunk Search Reference 8.2.12, page 368.

## Syntax

    | kmeans [k=<int>] [maxiters=<int>] <field-list>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| k | no | — | Number of clusters (required unless using `reps`) |
| field-list | yes | — | Numeric fields to cluster on |
| maxiters | no | 100 | Max iterations |

## Examples

```spl
index=main | stats avg(bytes) AS avg_bytes, avg(duration) AS avg_dur by src
| kmeans k=3 avg_bytes, avg_dur
```

## See also

- `cluster.md` — text-based event clustering
- `anomalies.md` — anomaly detection
