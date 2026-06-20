# reshape-wide-to-tall — convert a wide one-row result to tall N-row output

Source: Splunk Search Reference 10.2.0

## When to use

You have a single "wide" row — one event with many metric columns (e.g. `gpu_temp_c`, `cpu_temp_c`, `vrm_temp_c` as separate fields) — and a Canvas viz (radar, clock, fan, component grid) that wants one row per component (`component`, `current_temp_c`).

`untable` is the obvious choice but it does not preserve enough type metadata for Canvas custom vizs, and it cannot derive missing components inline. The `makemv + mvexpand + case` pattern keeps types intact and lets each `case()` arm compute a value.

## Pattern

```spl
| inputlookup telemetry_5min.csv | search rig_id="$focus_rig$" | sort -_time | head 1
| eval components = "GPU,CPU,VRM,SSD,RAM,PSU"
| makemv delim="," components
| mvexpand components
| eval current_temp_c = case(
    components=="GPU", gpu_temp_c, components=="CPU", cpu_temp_c,
    components=="VRM", vrm_temp_c, components=="SSD", ssd_temp_c,
    components=="RAM", round(cpu_temp_c - 5, 1), components=="PSU", round(vrm_temp_c + 4, 1))
| rename components as component
| table component current_temp_c throttle_temp_c max_safe_c
```

## Why not `untable`

- `untable` discards the per-column type metadata that Canvas vizs read to render correctly.
- The `case()` arm lets you derive components that are not in the source data inline (the `RAM` and `PSU` rows above are computed from `cpu_temp_c` and `vrm_temp_c`).

Used in 3 of 7 panels in the Asus ROG build (test52 Correction #25).

## Relationship to the makemv sparkline trap

This is a different use case from spl-gotchas trap #19 ("makemv only types row 1 for sparklines"). Trap #19 warns that `makemv` after `eval` only types the FIRST row when building sparklines — for sparklines you should use `stats sparkline()` instead. Here, the input is a SINGLE row (`| head 1`), so the row-1-only typing limitation does not apply: there is only one row to expand. Use this reshape pattern for single-row wide→tall conversion; use `stats sparkline()` for per-group sparklines.
