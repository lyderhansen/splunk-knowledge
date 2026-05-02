# delta — compute difference between current and a previous field value

Source: Splunk Search Reference 10.2.0

## Syntax

    | delta <field> [AS <newfield>] [p=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field` | Yes | — | Numeric field to compute the delta for. Non-numeric fields produce no output |
| `AS newfield` | No | `delta(<field>)` | Name for the output field. Without `AS`, the result is written to a field named `delta(fieldname)` |
| `p` | No | `1` | Lag distance. `p=1` compares with the immediately preceding event; `p=2` compares with the event two positions back |

## Usage

`delta` is a streaming command that processes events in **search result order**, which for historical searches is **reverse chronological** (newest first). This means deltas are computed from newer to older events: a rising metric over time will produce **negative** delta values.

To get chronological deltas (positive when a value increases over time), `| sort + _time` before running `delta`.

## Examples

### Track changes in event count per hour

    index=main
    | timechart span=1h count
    | sort + _time
    | delta count AS hourly_change

### Compare current CPU to value 3 events prior

    index=metrics sourcetype=cpu
    | sort + _time
    | delta cpu_pct AS cpu_delta p=3

### Detect when bytes jumped more than 10 MB between events

    index=transfer
    | sort + _time
    | delta bytes AS byte_change
    | where byte_change > 10000000
    | table _time, host, bytes, byte_change

## Gotchas

- **Default sort is reverse time** — historical searches present events newest-first. Running `delta` without sorting first produces confusing negative values for increasing trends. Always add `| sort + _time` before `delta` for time-series analysis.
- **Non-numeric fields produce no output** — if the named field contains strings, no delta field is created and no error is raised. Double-check your field type.
- **Default output field name contains parentheses** — `delta(count)` includes parentheses, which can require quoting in subsequent expressions: `where 'delta(count)' > 0`. Using `AS` to rename avoids this.
- **`p` refers to result position, not time distance** — `p=2` means two rows back in the result set, not two seconds or two minutes. The actual time difference depends on the data density.

## See also

- `accum.md` — cumulative sum over result rows
- `streamstats.md` — flexible running window statistics (more powerful, but slower)
- `autoregress.md` — lag one or more field values for regression analysis
