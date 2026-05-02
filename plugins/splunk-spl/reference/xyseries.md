# xyseries — pivot stats output for charting

Source: Splunk Search Reference 8.2.12, page 655.

## Syntax

    | xyseries <x-field> <y-name-field> <y-data-field> [sep=<string>] [grouped=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| x-field | yes | — | Field for X axis |
| y-name-field | yes | — | Field whose values become column names |
| y-data-field | yes | — | Field whose values fill the columns |

## Examples

### Pivot for charting

```spl
index=main | stats count by _time, sourcetype
| xyseries _time sourcetype count
```

## Gotchas

- **Inverse of untable:** `xyseries` pivots long-to-wide. `untable` does wide-to-long.

## See also

- `untable.md` — inverse operation
- `chart.md` — often produces chart-ready output directly
