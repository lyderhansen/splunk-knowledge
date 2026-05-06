# splunk.table — sparkline data recipe

Before you touch any styling, sparkline columns must be **true
multivalue fields with enough datapoints across the dashboard's time
window**. Two failure modes look identical at a glance but have
different fixes.

## Symptom-to-fix table


| Symptom                                                                                | Cause                                                                               | Fix                                                  |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Row 1 paints as sparkline; rows 2..N stay as comma-text or empty                       | Wrong shape — `eval x="1,2,3" | makemv ...` only types row 1 as mv                  | Replace with `stats sparkline(...) by <key>`         |
| Row 1 paints as a coloured sparkline; rows 2..N degrade to flat default-coloured lines | Right shape, not enough datapoints — synthetic data doesn't span `earliest..latest` | Widen synthetic time range to match dashboard window |


## Canonical SPL recipe (24h dashboard window)

```spl
| makeresults count=288
| streamstats count AS rn
| eval _time = relative_time(now(), "-" . tostring((288-rn)*5) . "m")
| eval host = case((rn-1) % 4 == 0, "web-01", (rn-1) % 4 == 1, "web-02",
                   (rn-1) % 4 == 2, "db-01", 1==1, "app-03")
| eval cpu  = case(host=="web-01",75,host=="web-02",55,host=="db-01",45,1==1,28) + (rn % 25) - 12
| eval mem  = case(host=="web-01",68,host=="web-02",50,host=="db-01",72,1==1,32) + (rn % 18) - 8
| eval req  = case(host=="web-01",1400,host=="web-02",640,host=="db-01",240,1==1,80) + (rn % 80)*4 - 160
| eval err  = case(host=="web-01",18,host=="web-02",4,host=="db-01",2,1==1,1) + (rn % 7) - 3
| stats latest(cpu)              AS current_cpu,
        sparkline(avg(cpu), 30m) AS trend_cpu,
        sparkline(avg(mem), 30m) AS trend_mem,
        sparkline(sum(req), 30m) AS trend_req,
        sparkline(sum(err), 30m) AS trend_err
   by host
```

## Why these numbers?

- `**count=288` × `5m` = 24 hours**, matching
`defaults.dataSources.global.queryParameters.earliest = "-24h@h"`.
If your dashboard uses a different window, scale `count`
accordingly (`144` for `-12h`, `576` for `-48h`).
- `**_time = relative_time(now(), "-" . tostring((288-rn)*5) . "m")`**
spreads synthetic events across the window. Without the `*5`
multiplier you get all events crammed into the last 240 minutes and
only the latest sparkline bucket has data.
- `**sparkline(avg(metric), 30m)` produces ~48 buckets** across 24
hours, more than enough for a smooth line.

## Verify density before debugging colours

```spl
... | stats sparkline(...) ... by host
| eval mv = mvcount(trend_cpu)
```

You want **≥20 elements per row**, not 3. If you see 3 elements per
row (`##__SPARKLINE__##` marker + one numeric + a `0`), you have
effectively one datapoint per host and Splunk will not honour your
`sparklineColors`.

## Anti-pattern — fake mv with `makemv`

```spl
| eval trend_cpu = "60,72,81,88,94"
| makemv tokenizer="(\d+)" trend_cpu     # ❌ only the first row gets typed as mv
```

Or the variant using `delim`:

```spl
| eval trend_cpu = "60,72,81,88,94"
| makemv delim="," trend_cpu              # ❌ same problem
```

`makemv` operates row-by-row in a way that the table renderer's mv
detector only picks up reliably on the first row of stats output. The
first row paints as a sparkline; rows 2..N stay as plain comma-strings
or empty.

This is the most common reason a "sparkline column only renders on
`web-01`" — it isn't a colour-mapping bug, it's that rows 2..N are
not actually mv.

**Fix:** replace `eval | makemv` pair with `stats sparkline(...) by <key>`.
Drop any `columnFormat.<col>.cellTypes: ["SparklineCell"]` you may
have added — the default DOS auto-detects.

## sparklineTypes enum

`area` and `line` only. There is **no `bar` sparkline**. If you need
bar-shaped inline trends, render a tiny `splunk.column` viz inside a
layout cell instead.