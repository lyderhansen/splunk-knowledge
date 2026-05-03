# gentimes — generate time-range results

Source: Splunk Search Reference 10.2.0

## Syntax

    | gentimes start=<timestamp> [end=<timestamp>] [increment=<int>(s|m|h|d)]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `start` | Yes | — | Start date/time. `MM/DD/YYYY[:HH:MM:SS]` or integer (e.g., `-5` for five days ago) |
| `end` | No | Midnight prior to current time (local) | End date/time. Same format as `start` |
| `increment` | No | `1d` | Step size between events. Supports `s` (seconds), `m` (minutes), `h` (hours), `d` (days) |

## Output fields

`gentimes` always produces exactly four fields per event:

| Field | Description |
|---|---|
| `starttime` | Start of range as UNIX epoch (integer) |
| `starthuman` | Start of range as human-readable string, e.g. `Sun Apr 4 00:00:00 2021` |
| `endtime` | End of range as UNIX epoch (integer) |
| `endhuman` | End of range as human-readable string |

Note: the field is `strttime` in some older documentation — the actual field name is `starttime`.

## Examples

### Daily date spine

```spl
| gentimes start=4/4/2021 end=4/7/2021
```

Generates three rows (April 4, 5, 6). End date is exclusive — April 7 is not included.

### Relative times (days ago)

```spl
| gentimes start=-30 end=-27
```

Generates daily ranges for 30, 29, and 28 days ago.

### Hourly ranges

```spl
| gentimes start=12/1/2021 end=12/5/2021 increment=1h
```

### Weekly ranges

The `w` (week) increment is not supported. Use `increment=7d` instead:

```spl
| gentimes start=12/1/2021 end=4/30/2022 increment=7d
```

### Date spine for gap-filling with map

```spl
| gentimes start=01/01/2026 end=01/31/2026 increment=1d
| eval _time = starttime
| eval date = strftime(_time, "%Y-%m-%d")
| map search="index=orders earliest=$starttime$ latest=$endtime$ | stats count | eval date=\"$date$\""
```

## Gotchas

- **End date is exclusive** — `end=4/7/2021` stops at the end of April 6. The interval that would start on April 7 is not generated.
- **US date format only** — `MM/DD/YYYY`, not ISO 8601. Writing `01/04/2026` means January 4, not April 1.
- **No `_time` field is set** — events have `starttime` / `endtime` (UNIX integers) but no `_time`. Assign manually with `| eval _time = starttime` before using time-aware commands.
- **No week (`w`) increment** — only `s`, `m`, `h`, and `d` are supported. Use `increment=7d` for weekly.
- **Default end is midnight last night** — if `end=` is omitted, `gentimes` generates up to (but not including) the start of today, local time.
- **Best used with `map`** — its primary purpose is to drive `map` with time windows. For generating arbitrary events use `makeresults` instead.

## Tips

Pair with `map` to backfill historical data or generate per-day statistics when `timechart` cannot be used directly.

## See also

- `makeresults.md` — generate arbitrary events without time logic
- `makecontinuous.md` — fill gaps in existing time-series results
- `map.md` — iterate a search over each generated row
