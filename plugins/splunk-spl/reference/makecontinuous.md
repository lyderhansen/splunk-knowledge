# makecontinuous — fill gaps in a field to make it continuous

Source: Splunk Search Reference 10.2.0

## Syntax

    | makecontinuous <field>
        [span=<int>[<timescale>] | <log-span>]
        [bins=<int>]
        [start=<num>]
        [end=<num>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field` | yes | — | The field to make continuous (typically `_time`) |
| `span` | no | auto | Size of each bin; supports time spans (`1h`, `1d`) or numeric spans |
| `bins` | no | — | Maximum number of bins to discretize into (alternative to `span`) |
| `start` | no | — | Minimum extent for numeric bins; data below this value is discarded |
| `end` | no | — | Maximum extent for numeric bins; data above this value is discarded |

Timescale units for `span`: `s`/`sec`, `m`/`min`, `h`/`hr`, `d`/`day`, `mon`/`month`,
and subsecond units `us`, `ms`, `cs`, `ds`.

Log-based span syntax: `[<coefficient>]log[<base>]` (e.g., `2log10`).

## Usage

`makecontinuous` is a transforming command. It adds empty rows for any missing buckets so that charts
and visualizations display a complete, gap-free x-axis. Added rows contain null values in all non-field
columns — use `fillnull` or `eval` to replace nulls with zeros or other defaults.

Primarily used after `timechart` or `chart` when `cont=false` was set, or when data naturally has gaps
(e.g., no events overnight).

## Examples

### Fill hourly gaps in a timechart output

```spl
index=main | timechart span=1h count
| makecontinuous _time span=1h
| fillnull value=0
```

### Make a 10-minute time axis continuous

```spl
... | makecontinuous _time span=10m
```

### Make a numeric field continuous with bins

```spl
index=metrics | chart avg(response_time) by status_code
| makecontinuous status_code bins=20
| fillnull value=0
```

## Gotchas

- **Does not fill values — only adds rows** — added rows have null in every column except the binned
  field. Always follow with `| fillnull value=0` (or `eval field=coalesce(field, 0)`) when charting numeric
  data.
- **`span` must match the upstream chart span** — if `timechart span=1h` was used, `makecontinuous` must
  also use `span=1h`, otherwise extra rows may be inserted at the wrong intervals.
- **`timechart` has `cont=true` by default** — `makecontinuous` is only needed when `cont=false` was
  explicitly set, or when using `chart` instead of `timechart`.
- **Only applies to already-aggregated results** — `makecontinuous` operates on a result set from a
  transforming command; it cannot fill gaps in raw event streams.

## Tips

- Use `start=` and `end=` with numeric fields to anchor the bin range and prevent unexpected boundary rows.
- For log-scale histograms, the `[coefficient]log[base]` span syntax fills logarithmic bins continuously.

## See also

- `timechart.md` — `cont=true` (default) usually makes this unnecessary for time-based charts
- `fillnull.md` — fill null values in rows added by `makecontinuous`
- `chart.md` — static-bin charts where `makecontinuous` is more commonly needed
