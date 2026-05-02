# timewrap — compare time periods side-by-side

Source: Splunk Search Reference 8.2.12, page 583.

## Syntax

    | timewrap <span> [align=now|end] [series_mode=<exact|relative>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| span | yes | — | Period to wrap (e.g., `1w`, `1d`, `1mon`) |
| align | no | now | Align periods to `now` or `end` of search range |
| series_mode | no | exact | `exact` uses actual timestamps, `relative` normalizes to period start |

## Examples

### Compare this week vs last week

```spl
index=main | timechart span=1d count | timewrap 1w
```

## Gotchas

- **Only valid after timechart:** `timewrap` operates on `timechart` output. Cannot be used standalone.
- **Creates `_time_N` columns:** Results get `count_latest_week`, `count_1week_before`, etc. Column names change based on span.

## See also

- `timechart.md` — required preceding command
