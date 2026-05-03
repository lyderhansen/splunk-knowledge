# accum — running total (cumulative sum) of a numeric field

Source: Splunk Search Reference 10.2.0.

## Syntax

    | accum <field> [AS <newfield>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field` | Yes | — | Numeric field to accumulate; must contain numeric values |
| `AS newfield` | No | overwrites `field` | Name for the output field containing the cumulative sum |

## Usage

- `accum` processes events in their current order — sort first if chronological order matters.
- Non-numeric values in `field` are treated as 0.
- The running total from row N is the sum of `field` values for rows 1 through N.
- `accum` is a streaming command.

## Examples

### Running total of page views by product

    sourcetype=access_* status=200 categoryId=STRATEGY
    | chart count AS views BY productId
    | accum views AS TotalViews

### Cumulative daily event count

    index=main
    | timechart span=1d count
    | accum count AS cumulative_count

### Running sum of bytes transferred

    index=web sourcetype=access_combined
    | sort _time
    | accum bytes AS running_bytes
    | table _time, bytes, running_bytes

## Gotchas

- **Order matters** — `accum` sums rows in the order they appear in the result set. Always `sort` first if you need chronological accumulation; without a sort, row order is non-deterministic.
- **Overwrites the original field if no AS clause** — if you omit `AS newfield`, the original `field` is replaced by the running total; you lose the per-row values.
- **Does not reset per group** — `accum` produces a single running total across all rows. For per-group running totals, use `streamstats sum(field) AS running_total BY group`.
- **Non-numeric values are zero** — null or non-numeric entries contribute 0 to the total; the running total just holds its previous value at those rows.

## See also

- `streamstats.md` — `sum()` for running totals with group-by support and window options
- `delta.md` — difference between consecutive row values (inverse of accum)
- `autoregress.md` — copy prior row values for time-series modeling
