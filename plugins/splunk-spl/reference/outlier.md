# outlier — remove or truncate outlying numeric values

Source: Splunk Search Reference 10.2.0

## Syntax

    | outlier [action=remove|transform] [param=<float>] [uselower=<bool>] [mark=<bool>] [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `action` | No | `transform` | `remove` drops events containing outliers; `transform` truncates values to the IQR threshold. Abbreviations `rm` and `tf` are accepted |
| `param` | No | `2.5` | Multiplier applied to the IQR. Values outside `(Q1 - param*IQR)` or `(Q3 + param*IQR)` are treated as outliers |
| `uselower` | No | `false` | If `true`, also removes/transforms values below the lower IQR threshold (not just above) |
| `mark` | No | `false` | If `action=transform` and `mark=true`, prefixes outlying values with `000` for visual identification |
| `field-list` | No | all numeric | Space-delimited list of fields to inspect; defaults to all numeric fields |

## Usage

Filtering is based on the **inter-quartile range (IQR)**: the difference between the 25th and 75th percentile values. A value is an outlier if it exceeds `Q3 + param*IQR` (or falls below `Q1 - param*IQR` when `uselower=true`).

The default action is `transform` (truncate), not `remove`. This differs from what many users expect.

## Examples

### Remove events with outlying byte values from a web log analysis

    index=web sourcetype=access_combined
    | stats avg(bytes) AS avg_b by host
    | outlier action=remove param=3.0 avg_b

### Transform outliers in a timechart (flatten spikes without dropping rows)

    index=web | timechart span=1h avg(response_time) by host
    | outlier action=tf param=2.5

### Apply only to specific fields, ignore upper bound only

    index=metrics | stats avg(cpu_pct) AS cpu, avg(mem_pct) AS mem by host
    | outlier action=remove uselower=false cpu mem

## Gotchas

- **Default is `transform`, not `remove`** — `outlier` without `action=remove` clips values, it does not drop rows. Specify `action=remove` explicitly when you want to drop events.
- **`uselower=false` by default** — the command only removes values above the upper bound unless you set `uselower=true`. Low anomalies (e.g., suspiciously low traffic) are ignored otherwise.
- **This command removes outliers, it does not detect them** — for detecting and alerting on anomalies, use `anomalies`, `anomalydetection`, or the Splunk Machine Learning Toolkit instead.
- **Requires sufficient data** — IQR computation requires enough distinct values to make percentile estimates meaningful. Results on very small result sets (< 20 rows) may be unreliable.

## See also

- `anomalies.md` — assigns unexpectedness scores; more nuanced than IQR clipping
- `anomalydetection.md` — histogram, z-score, and IQR-based detection with filter/annotate actions
- `anomalousvalue.md` — per-field anomaly detection with configurable thresholds
