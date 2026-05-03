# bin — group values into discrete buckets

Source: Splunk Search Reference 10.2.0

Alias: `bucket`. Puts continuous numerical or time values into discrete sets by replacing
each value with the label of the bin it falls into. All events in the same bin share the
same field value, enabling downstream aggregation by bucket.

Note: `chart` and `timechart` call `bin` automatically. Use `bin` directly only for
statistical operations those commands cannot handle. Do not use `bin` before exporting
results to CSV or JSON — the modified field values may be misleading.

## Syntax

    | bin [<bin-options>...] <field> [AS <newfield>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field` | Yes | — | Numeric or time field to bucket |
| `span` | No | auto | Bucket size: a time span (`1h`, `30m`) or numeric step (`100`) or log-span (`2log10`) |
| `bins` | No | 100 | Target number of buckets; Splunk auto-selects a span to produce ~this many buckets |
| `minspan` | No | — | Minimum span granularity when `bins` is used to auto-infer span |
| `start` / `end` | No | — | Expand (not shrink) the bucket range for numeric fields |
| `aligntime` | No | UTC epoch 0 | Align time buckets to `earliest`, `latest`, or a time specifier; ignored for day+ spans |
| `AS newfield` | No | overwrites field | Output field name |

## Examples

### Time bucketing for a sparkline

    index=web sourcetype=access_combined
    | bin span=1h _time
    | stats count by _time
    | sort _time

### Numeric bucketing for a response-time histogram

    index=web sourcetype=access_combined
    | bin span=50 response_time AS rt_bucket
    | stats count by rt_bucket

### Auto-span with target bucket count

    index=main
    | bin bins=20 bytes AS byte_range
    | stats count by byte_range

### Log-scale bucketing

    index=main
    | bin span=2log10 bytes AS bytes_log
    | stats count by bytes_log

## Gotchas

- **`bucket` and `bin` are the same command** — both spellings are fully supported;
  `bin` is the documented canonical name.
- **`bins=N` is a target, not a guarantee** — Splunk picks a "nice" span that yields
  approximately N buckets. The actual count may differ.
- **`start`/`end` can only expand range, not shrink it** — if your data has values
  outside the specified range, those values still appear in outermost buckets. You cannot
  use `start`/`end` to exclude data.
- **Day-or-larger spans align to midnight in the user's timezone** — a `span=1d` bucket
  starts at midnight local time, not UTC. This surprises users in non-UTC timezones when
  comparing to epoch-based calculations.
- **`aligntime` is ignored for day/month/year spans** — time alignment only works for
  sub-day time spans.
- **Log-span syntax** — `span=2log10` means bins of width `2 × log₁₀`. The first number
  is the coefficient (≥1.0 and < base), the second is the base (>1.0). Easy to get wrong.

## Tips

- Use `bin span=1h _time AS hour` before `stats` to get per-hour aggregations without
  `timechart` when you need multiple `BY` dimensions.
- Combine `bin` + `stats count` + `sort` to produce a manual histogram in table form.

## See also

- `timechart.md` — auto-bins `_time` with charting output
- `chart.md` — aggregation with binned axis
- `stats.md` — aggregation after manual binning
