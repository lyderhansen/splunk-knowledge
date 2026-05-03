# timewrap — compare time periods side-by-side

Source: Splunk Search Reference 10.2.0

## Syntax

    | timewrap <timewrap-span>
        [align=now | end]
        [series=relative | exact | short]
        [time_format=<str>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `timewrap-span` | Yes | — | Period length to wrap on. Format: `[<int>]<timescale>`. Timescale: `s`, `min`, `h`, `d`, `w`, `m`, `qtr`, `y` |
| `align` | No | end | Align wrapping to `end` of search range or `now` (current time) |
| `series` | No | relative | Column naming: `relative` = `latest_week`/`1week_before`; `exact` = custom via `time_format`; `short` = `s0`, `s1`, … |
| `time_format` | No | (none) | Custom series name format when `series=exact`. Supports `strftime` specifiers. |

**Note:** `timewrap` uses `m` for months. In `timechart` and `bin`, `m` means minutes.

## Usage

`timewrap` is a reporting command and must follow `timechart`. It reshapes the time-series
output of `timechart` by "wrapping" each period (span) into a separate column. This enables
side-by-side comparisons such as day-over-day or week-over-week.

With a `BY` clause in the preceding `timechart`, the period suffix is appended to each
category name: e.g. `ACCESSORIES_s0`, `ACCESSORIES_s1`.

## Examples

### Week-over-week comparison

    index=main | timechart count span=1d | timewrap 1w

Produces columns `count_latest_week`, `count_1week_before`, etc.

### Short series names (easy for addtotals)

    index=main | timechart count span=1h | timewrap 1d series=short

Produces columns `s0` (today), `s1` (yesterday), `s2` (2 days ago), etc.

### Today vs yesterday vs 7-day average

    index=main | timechart count span=1h
    | timewrap 1d series=short
    | addtotals s0 s1 s2 s3 s4 s5 s6
    | eval 7dayavg = Total / 7.0
    | table _time, s0, s1, 7dayavg
    | rename s0 AS today, s1 AS yesterday

## Gotchas

- **Must follow `timechart`** — `timewrap` is not a standalone command. Placing it after
  any other command causes an error or produces no meaningful output.
- **`m` means months here** — unlike `timechart span=1m` (1 minute), `timewrap 1m` wraps
  by 1 month. Use `1min` or `60s` in `timechart` to avoid confusion.
- **Column names change with `series=relative`** — names like `count_latest_week` are
  human-readable but hard to reference programmatically. Use `series=short` when you
  need consistent `s0`, `s1` references downstream.
- **`align=end` vs `align=now`** — with `align=end`, the wrapping boundary is the end of
  the search window. With `align=now`, it is always the current time. Results differ for
  historical searches.

## Tips

- Pair `series=short` with `addtotals` and `rename` for a compact today/yesterday/avg table.
- Use `time_format` with `series=exact` to produce calendar-date column headers for display
  in dashboards (e.g. `time_format="%b %d"`).

## See also

- `timechart.md` — required preceding command
- `addtotals.md` — sum across period columns
- `rename.md` — humanise short series names for display
