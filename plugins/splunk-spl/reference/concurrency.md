# concurrency — count overlapping events at each event's start time

Source: Splunk Search Reference 10.2.0

## Syntax

    | concurrency duration=<field> [start=<field>] [output=<field>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `duration` | Yes | — | Numeric field representing the event's span (in the same units as `start`). For `_time`-based data, this should be seconds |
| `start` | No | `_time` | Field representing the event's start time |
| `output` | No | `concurrency` | Name of the output field where the concurrent event count is written |

## Usage

`concurrency` measures how many events were "in progress" at the moment each event started. An event Y is concurrent with event X if `Y.start` falls between `X.start` and `X.start + X.duration`.

The output `concurrency` value for each event equals the number of events (including itself) that were active when it began.

**Completion time events:** If your events record completion time (not start time), subtract the duration from the timestamp before running `concurrency`:

    | eval new_start = _time - duration | concurrency start=new_start duration=duration

`concurrency` is a dataset processing command — it requires all data to be available before processing.

## Examples

### Count overlapping HTTP requests in Splunk internal logs

    index=_internal sourcetype=splunkd_ui_access
    | eval spent_sec = spent / 1000
    | concurrency duration=spent_sec
    | timechart max(concurrency) AS peak_concurrent span=1m

### Measure peak concurrent transactions in a web application

    index=web sourcetype=access_combined
    | transaction JSESSIONID clientip startswith="view" endswith="purchase"
    | concurrency duration=duration
    | timechart max(concurrency) span=5m

### Use a custom start field and output field name

    index=jobs sourcetype=batch_job
    | concurrency duration=job_duration_sec start=start_time output=active_jobs
    | table _time, job_id, active_jobs

## Gotchas

- **`duration` and `start` must use the same units** — if `_time` is in Unix epoch seconds, `duration` must also be in seconds. Millisecond durations with a seconds-based `start` will produce wildly incorrect concurrency counts.
- **Completion-time events need adjustment** — if your `_time` represents when an event ended (not when it started), subtract the duration before passing to `concurrency`: `eval adj_start = _time - duration`.
- **Memory limit at 10 million concurrent events** — `concurrency` tracks all overlapping events in memory. If the concurrency exceeds `max_count` (default 10,000,000) from `limits.conf`, results are clamped and a warning is shown.
- **Dataset processing command** — `concurrency` processes all results at once. Large result sets consume significant memory. Pre-filter aggressively and use `timechart` downstream to aggregate.

## See also

- `transaction.md` — group related events into sessions with a computed `duration` field suitable for `concurrency`
- `streamstats.md` — alternative for running window calculations on event streams
- `overlap.md` — find overlapping summary events
