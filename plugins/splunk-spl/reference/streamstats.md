# streamstats — running/window statistics computed over events in order

Source: Splunk Search Reference 8.2.12, page 548.

## Syntax

    | streamstats [window=<int>] [current=<bool>] [global=<bool>]
                  [reset_on_change=<bool>] [reset_after=<eval-expression>]
                  <stats-func>(<field>) [AS <alias>]... [BY <field-list>]

Each event receives the aggregate computed over the preceding N events (the window).
Events are processed in the order they appear in the result set — sort by `_time` first
to get time-ordered running calculations.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `stats-func(field)` | Yes | — | Aggregation function to apply |
| `AS alias` | No | function expression | Rename the output field |
| `BY field-list` | No | (none) | Maintain separate running totals per group |
| `window=<int>` | No | 0 (all) | Number of events to include in the window; 0 = all preceding events |
| `current=<bool>` | No | true | Include the current event in the calculation |
| `global=<bool>` | No | true | If false, window resets at the start of each BY-group |
| `reset_on_change=<bool>` | No | false | Reset counter when the BY-field value changes |
| `reset_after=<eval-expression>` | No | — | Reset when the eval expression is true; string values must escape quotes |

## Examples

### Cumulative event count and running byte total

    index=web sourcetype=access_combined
    | sort 0 _time
    | streamstats count AS event_num,
                  sum(bytes) AS cumulative_bytes

### Rolling 5-minute average response time per host

    index=web sourcetype=access_combined
    | sort 0 _time
    | streamstats window=5 avg(response_time) AS rolling_avg by host

### Rate of change (period-over-period delta)

    | timechart span=1h count AS events
    | streamstats current=f window=1 last(events) AS prev_events
    | eval change_pct = round((events - prev_events) / prev_events * 100, 1)

## Gotchas

- **Sort before `streamstats`** — `streamstats` processes events in the order it receives
  them. Without an explicit `| sort 0 _time`, the order is undefined and results will be
  inconsistent across runs.

- **`current=f` shifts the window back one event** — useful for comparing each event to the
  previous window without including the current value. Commonly used for lag/lead patterns.

- **String values in `reset_after` require escaped quotes** — to reset when a string field
  equals a value, escape the inner quotes:
  `reset_after="(description==\"session is closed\")"`

- **`streamstats` is a centralized streaming command** — it runs on the search head only,
  after indexers return results. Keep the event volume manageable before calling it.

## See also

- `eventstats.md` — adds aggregate fields to all events without ordering dependency
- `stats.md` — full aggregation that collapses events
- `timechart.md` — time-bucketed aggregation
