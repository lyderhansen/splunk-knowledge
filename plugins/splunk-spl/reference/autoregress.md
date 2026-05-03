# autoregress — copy prior row values for autoregression and moving averages

Source: Splunk Search Reference 10.2.0.

## Syntax

    | autoregress <field> [AS <newfield>] [p=<int> | p=<int>-<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field` | Yes | — | Field whose prior values you want to copy into each event |
| `AS newfield` | No | `<field>_p<n>` | Output field name; only valid when `p` is a single integer |
| `p` | No | `1` | Lag specification: single integer (copy from Nth prior row) or range `p=2-4` (copy from rows 2, 3, and 4 prior) |

## Output field naming

- Single `p` value with `AS`: field named as specified.
- Single `p` value without `AS`: field named `<field>_p<n>` (e.g., `count_p1`).
- Range `p=2-4`: fields `<field>_p2`, `<field>_p3`, `<field>_p4`.

## Usage

- `autoregress` is a **centralized streaming command** — it runs on the search head, not on indexers.
- The first `p` events in the result set will have null values in the lag fields (no prior rows exist).
- Always sort by time before using `autoregress` if you need chronological lag values.

## Examples

### Copy the previous value (lag 1)

    index=main | timechart span=1h count
    | autoregress count AS prev_count
    | eval change = count - prev_count

### Copy the 3rd prior IP into a new field

    ... | autoregress ip AS old_ip p=3

### Create multiple lag columns for autoregression

    ... | autoregress count p=2-5

Creates: `count_p2`, `count_p3`, `count_p4`, `count_p5`

### Compute a 5-event moving average

    ... | eval rawlen = len(_raw)
    | autoregress rawlen p=1-4
    | eval moving_avg = (rawlen + rawlen_p1 + rawlen_p2 + rawlen_p3 + rawlen_p4) / 5

## Gotchas

- **First rows have null lags** — the first `p` rows cannot have a prior value and will have null in the lag fields; use `where isnotnull(count_p1)` to drop warm-up rows from analysis.
- **Centralized streaming** — runs on the search head; for large datasets, reduce volume upstream before `autoregress`.
- **Sort before autoregress** — event order in search results is not guaranteed without explicit sorting; results will be meaningless without `| sort _time`.
- **`AS` only valid for single `p`** — using `AS newfield` with a range like `p=1-3` causes an error.
- **Null fields propagate in eval** — `(rawlen + rawlen_p1 + ... ) / 5` evaluates to null if any term is null; use `fillnull value=0` on lag fields if you want the average to start before warm-up completes.

## See also

- `streamstats.md` — `current=f` lag access with window support and group-by
- `delta.md` — difference between current and previous row value
- `trendline.md` — moving average with built-in SMA/EMA/WMA functions
