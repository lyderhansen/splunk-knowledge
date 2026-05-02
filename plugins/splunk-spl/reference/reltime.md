# reltime — add a human-readable relative time field based on _time

Source: Splunk Search Reference 8.2.12, page 468.

## Syntax

    | reltime

## Parameters

None. `reltime` takes no arguments.

## Usage

`reltime` is a **distributable streaming command**. It adds a field named `reltime` to each
event, containing a human-readable string describing how long ago the event occurred relative
to the current time at search execution. Examples: `"2 minutes ago"`, `"3 hours ago"`,
`"Yesterday"`, `"Last week"`, `"2 months ago"`.

The `reltime` command reads `_time` on each event and computes the relative offset. Events with
`_time` in the future produce strings like `"In 5 minutes"`.

The output field is always named `reltime`. It is intended for display purposes only — do not
use the string values in downstream calculations. For time arithmetic, use `_time` directly or
`eval relative_time(now(), modifier)`.

## Examples

### Add relative time to an events view

    index=access_* | table _time, src, action
    | reltime
    | table reltime, src, action

### Combine with fieldformat for mixed display

    index=security_* earliest=-24h
    | reltime
    | table reltime, src_ip, user, action, _time
    | fieldformat _time = strftime(_time, "%Y-%m-%d %H:%M:%S")

### Dashboard-specific pattern: recent alerts table

    index=alerts severity=high
    | sort 0 -_time
    | head 20
    | reltime
    | table reltime, alert_name, src, severity

## Gotchas

- **Output is display-only** — the `reltime` string (`"3 hours ago"`) cannot be parsed back to
  epoch. Do not use it in `where`, `eval` math, or `stats`. Use `_time` for all calculations.

- **Relative time is computed at search execution** — if a search result is cached or re-used,
  the `reltime` values will be stale. They reflect the time when `reltime` ran, not when the
  result is displayed.

- **Field name collision** — if your data already has a field named `reltime`, this command
  overwrites it. Rename the existing field first if you need to preserve it.

## See also

- `convert.md` — `ctime()` function for formatted absolute timestamp strings
- `eval.md` — `strftime()` for custom time formatting; `relative_time()` for time arithmetic
- `fieldformat.md` — format `_time` display without adding a separate field
