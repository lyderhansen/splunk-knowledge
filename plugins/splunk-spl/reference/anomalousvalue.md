# anomalousvalue — detect statistically unusual field values

Source: Splunk Search Reference 10.2.0.

> Note: Splunk recommends using the Splunk Machine Learning Toolkit (MLTK) for advanced anomaly detection in production. `anomalousvalue` is a simpler built-in alternative.

## Syntax

    | anomalousvalue [action=annotate|filter|summary]
                    [pthresh=<float>]
                    [minsupcount=<int>]
                    [minsupfreq=<float>]
                    [maxanofreq=<float>]
                    [minnormfreq=<float>]
                    [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `action` | No | `filter` | `annotate`: add anomaly score fields; `filter`: return only anomalous events; `summary`: return per-field statistics table |
| `pthresh` | No | `0.01` | P-value threshold; values below this are flagged as anomalous |
| `minsupcount` | No | 100 | Drop fields with fewer than N occurrences in input |
| `minsupfreq` | No | `0.05` | Drop fields whose occurrence ratio across all events is below this |
| `maxanofreq` | No | `0.05` | Ignore fields that are anomalous too often (above this ratio) |
| `minnormfreq` | No | `0.01` | Ignore fields that are never anomalous (below this ratio) |
| `field-list` | No | all fields | Restrict analysis to these fields |

## Anomaly score fields added

- **Numeric fields**: `Anomaly_Score_Num(<field>)` — standard deviations from mean (Gaussian model)
- **Non-numeric fields**: `Anomaly_Score_Cat(<field>)` — rare value detection

## Examples

### Filter to only anomalous events (default action)

    index=main | anomalousvalue

### Annotate all events with anomaly scores

    index=main | anomalousvalue action=annotate
    | table _time, host, Anomaly_Score_Num*

### Return anomaly summary per field

    index=main | anomalousvalue action=summary
    | sort -catAnoFreq%

### Custom threshold and field list

    host=reports | anomalousvalue action=filter pthresh=0.02 bytes response_time

## Gotchas

- **Default action is `filter`** — events without anomalous values are removed from output; use `annotate` to keep all events.
- **`minsupcount` defaults to 100** — fields with fewer than 100 occurrences are excluded. Lower this when working with small datasets: `minsupcount=10`.
- **Max 50,000 results** — controlled by `maxresultrows` in `limits.conf [anomalousvalue]`. Larger datasets need pre-filtering.
- **Gaussian model for numeric fields** — outlier detection assumes normal distribution; skewed distributions (e.g., byte counts) may produce misleading scores without log transformation.
- **Not the same as `anomalies`** — `anomalies` assigns a holistic unexpectedness score per event; `anomalousvalue` scores per field per event.

## See also

- `anomalies.md` — event-level unexpectedness scoring
- `outlier.md` — numeric outlier removal by standard deviation
- `analyzefields.md` — predictive strength of fields for a target class
