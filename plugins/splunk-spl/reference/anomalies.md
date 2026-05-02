# anomalies — compute unexpectedness score for each event

Source: Splunk Search Reference 10.2.0

## Syntax

    | anomalies
      [threshold=<num>]
      [labelonly=<bool>]
      [normalize=<bool>]
      [maxvalues=<num>]
      [field=<field>]
      [denylist=<filename>]
      [denylistthreshold=<num>]
      [by <fieldlist>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `threshold` | No | `0.01` | Events with `unexpectedness` above this value are considered anomalous |
| `labelonly` | No | `false` | If `true`, all events are kept and annotated; if `false`, only anomalous events are returned |
| `normalize` | No | `true` | If `true`, digits 0-9 are treated as equivalent for comparison. Set `false` when numeric values should be treated as distinct categories |
| `maxvalues` | No | `100` | Size of the sliding window of previous events used to compute unexpectedness (10-10000) |
| `field` | No | `_raw` | Field to analyze when computing unexpectedness |
| `denylist` | No | none | CSV file name (in `$SPLUNK_HOME/var/run/splunk/csv/`) of expected events to suppress. Cloud requires a Support ticket |
| `denylistthreshold` | No | `0.05` | Similarity score at which an event is considered to match a denylist entry |
| `by <fieldlist>` | No | none | Segment anomaly detection by one or more fields — events with different values are analyzed independently |

## Usage

`anomalies` assigns an `unexpectedness` score to each event based on how different it is from a sliding window of recent events. The formula measures how much adding the current event disrupts the similarity of the preceding set.

Use `labelonly=true` with `sort -unexpectedness` to rank all events from most to least anomalous without dropping any events.

## Examples

### Find the 20 most anomalous events

    index=main
    | anomalies threshold=0.05 labelonly=true
    | sort - unexpectedness
    | head 20
    | table _time, unexpectedness, _raw

### Filter to only anomalous events, segmented by host

    index=main
    | anomalies threshold=0.01 by host
    | table _time, host, unexpectedness

### Detect anomalous log patterns using a denylist to suppress known noise

    index=main sourcetype=syslog
    | anomalies denylist=known_good_events threshold=0.02 labelonly=true
    | where unexpectedness > 0.02
    | sort - unexpectedness

## Gotchas

- **Sliding window, not global statistics** — `anomalies` compares each event to the preceding `maxvalues` events, not the full result set. Events near the start of results (with fewer predecessors) may score differently than the same events later.
- **`labelonly=false` drops non-anomalous events** — by default, only anomalous events are returned. This is often surprising when exploring data; set `labelonly=true` to retain all events and inspect the full range of scores.
- **`normalize=true` merges digits** — if your field contains version numbers, IPs, or error codes where the specific digits matter, set `normalize=false` to treat each distinct value as unique.
- **`denylist` file must be pre-placed on the search head** — there is no way to specify a path outside the CSV directory. Splunk Cloud requires a Support ticket to manage denylist files.
- **Increasing `maxvalues` increases CPU cost linearly** — `maxvalues=10000` is 100x slower than the default. Keep the default unless you have specific evidence that a larger window improves accuracy.

## See also

- `anomalydetection.md` — histogram, z-score, and IQR-based detection with more method options
- `anomalousvalue.md` — per-field anomaly analysis with field-specific thresholds
- `outlier.md` — numeric outlier removal using IQR
- `cluster.md` — group similar events to identify rare clusters
