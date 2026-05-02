# kmeans — k-means clustering on numeric fields

Source: Splunk Search Reference 10.2.0

## Syntax

    | kmeans [k=<int>|<int>-<int>] [reps=<int>] [maxiters=<int>] [t=<num>]
             [cfield=<field>] [dt=l1|l2|cos] [showcentroid=<bool>]
             [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field-list` | No | all numeric | Space-delimited list of numeric fields to cluster on |
| `k` | No | `2` | Number of clusters as a scalar (e.g., `k=4`) or a range (e.g., `k=2-8`) |
| `reps` | No | `10` | Number of random restarts. Higher values improve the chance of finding the global optimum |
| `maxiters` | No | `10000` | Maximum iterations before declaring non-convergence |
| `t` | No | `0` | Convergence tolerance. Larger values allow earlier stopping |
| `cfield` | No | `CLUSTERNUM` | Name of the output field containing the cluster number for each event |
| `dt` | No | `sqeuclidean` | Distance metric: `l1`/`cityblock`, `l2`/`sqeuclidean`, or `cos`/`cosine` |
| `showcentroid` | No | `true` | If `true`, centroid coordinates are included in output |

## Usage

`kmeans` partitions events into k clusters based on the Euclidean distance between numeric field values. Events are annotated with their cluster number in `CLUSTERNUM` (or the `cfield` value). Events within the same cluster are grouped together in the results.

When `k` is a range (e.g., `k=2-8`), kmeans produces a summary showing cluster sizes and a `distortion` metric (how tightly grouped clusters are) rather than individual event annotations. Use this to find the optimal `k` value before running a final annotating pass.

## Examples

### Cluster hosts by average CPU and memory usage

    index=metrics
    | stats avg(cpu_pct) AS cpu, avg(mem_pct) AS mem by host
    | kmeans k=4 cpu mem
    | table host, cpu, mem, CLUSTERNUM
    | sort CLUSTERNUM

### Find optimal k using a range

    index=metrics
    | stats avg(cpu_pct) AS cpu, avg(mem_pct) AS mem by host
    | kmeans k=2-8 cpu mem
    | table k, distortion

### Use cosine distance for text-derived numeric vectors

    index=docs
    | stats count(eval(match(body,"error"))) AS err_ct, count(eval(match(body,"warn"))) AS warn_ct by doc_id
    | kmeans k=3 dt=cos err_ct warn_ct

## Gotchas

- **Non-numeric fields are skipped silently** — if a named field contains strings, that event is skipped in clustering without an error. Pre-filter with `where isnum(field)` to avoid silent exclusions.
- **k defaults to 2** — forgetting `k=` produces two clusters, which may not be useful. Always specify `k` explicitly.
- **k must be > 1** — `k=1` is not valid. The maximum `k` is controlled by `maxkvalue` in `limits.conf` (default 1000).
- **Random starting centroids** — results may differ between runs due to random initialization. Increase `reps` for more stable results at the cost of performance.
- **Range mode changes output format** — `k=2-8` does not annotate events; it returns a distortion summary table. Check which mode you need before building downstream visualizations.

## See also

- `cluster.md` — text-similarity-based event clustering (non-numeric)
- `anomalies.md` — unexpectedness scoring as an alternative to clustering
- `anomalydetection.md` — IQR and z-score based anomaly detection
