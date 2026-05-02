# anomalydetection — probabilistic anomaly detection on events

Source: Splunk Search Reference 10.2.0

## Syntax

    | anomalydetection
      [method=histogram|zscore|iqr]
      [action=<action>]
      [pthresh=<float>]
      [cutoff=<bool>]
      [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `method` | No | `histogram` | Detection algorithm: `histogram` (event-probability model), `zscore` (behaves like `anomalousvalue`), `iqr` (behaves like `outlier`) |
| `action` | No | `filter` (histogram/zscore) or `transform` (iqr) | What to do with anomalous events. For histogram/zscore: `filter`, `annotate`, `summary`. For iqr: `remove`, `transform` |
| `pthresh` | No | auto (histogram) or `0.01` (zscore) | Probability threshold below which an event is anomalous. Not valid with `method=iqr` |
| `cutoff` | No | `true` | Histogram only. When `true`, limits the number of anomalies using a modified IQR formula |
| `field-list` | No | all fields | Space-delimited list of specific fields to include in analysis |

## Action details by method

| Method | Actions available | Default action |
|---|---|---|
| `histogram` | `filter`, `annotate`, `summary` | `filter` |
| `zscore` | `filter`, `annotate`, `summary` | `filter` |
| `iqr` | `remove`, `transform` | `transform` |

When `action=filter` or `action=annotate`, four new fields are added to each event: `log_event_prob`, `probable_cause`, `probable_cause_value`, and `probable_cause_prob`.

## Examples

### Flag anomalous HTTP responses using histogram method

    index=web sourcetype=access_combined
    | anomalydetection method=histogram action=annotate
    | where isnotnull(probable_cause)
    | table _time, host, status, bytes, probable_cause

### Detect z-score outliers on a specific field

    index=metrics sourcetype=cpu
    | anomalydetection method=zscore pthresh=0.005 action=filter cpu_pct
    | table _time, host, cpu_pct, probable_cause

### Summary report of anomaly statistics

    index=main
    | anomalydetection method=histogram action=summary
    | table field, num_values, num_anomalous_values

## Gotchas

- **`action` default differs by method** — `method=histogram` and `method=zscore` default to `filter`; `method=iqr` defaults to `transform`. Mixing up methods and actions causes unexpected behavior.
- **`pthresh` is invalid with `method=iqr`** — passing `pthresh` with `iqr` causes an error. Use `param` (via the `outlier` command) instead, or switch methods.
- **`method=histogram` is probabilistic, not threshold-based** — the threshold `pthresh` is calculated per dataset when not specified; do not assume a fixed cutoff applies across different datasets.
- **Supersedes `anomalousvalue` and `outlier`** — `anomalydetection` was designed to unify both older commands. Prefer it for new searches.
- **Splunk MLTK** — for production anomaly detection, Splunk recommends the Machine Learning Toolkit which has more advanced algorithms.

## See also

- `anomalies.md` — sliding-window unexpectedness scoring
- `anomalousvalue.md` — per-field anomaly detection (legacy)
- `outlier.md` — IQR-based outlier removal (legacy)
