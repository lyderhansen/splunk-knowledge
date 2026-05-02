# rangemap — categorize numeric values into named ranges

Source: Splunk Search Reference 10.2.0

## Syntax

    | rangemap field=<string>
               [<attribute_name>=<num>-<num>]...
               [default=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field` | Yes | — | Name of the numeric input field to classify |
| `attribute_name=min-max` | No | — | One or more named ranges. The range name becomes the value written to the `range` output field. Min and max are inclusive. Negative values are supported (e.g., `low=-10--1`) |
| `default` | No | `"None"` | Value written to `range` when no range matches |

## Usage

`rangemap` is a distributable streaming command. It adds a new field called `range` to each event with the name of the matching range. If no range matches, `range` is set to the `default` value (or `"None"` if `default` is not specified).

**Overlapping ranges are supported** — if a value falls within multiple ranges, `range` becomes a multivalue field containing all matching range names.

## Examples

### Classify CPU usage for status coloring

    index=metrics sourcetype=perflog
    | stats avg(cpu_pct) AS cpu by host
    | rangemap field=cpu low=0-40 medium=41-70 high=71-89 default=critical
    | table host, cpu, range

### Alert severity from error count

    index=main
    | stats count AS error_count by app
    | rangemap field=error_count info=0-0 low=1-10 medium=11-50 default=high
    | where range="high" OR range="medium"

### Earthquake magnitude classification

    source=earthquakes.csv
    | rangemap field=mag minor=0.0-2.9 light=3.0-3.9 moderate=4.0-4.9 default=strong
    | stats count by range

## Gotchas

- **Output field is always called `range`** — there is no option to change the output field name. If you need a different name, follow `rangemap` with `| rename range AS severity`.
- **Overlapping ranges create multivalue fields** — if `low=0-10` and `elevated=5-15` and the input value is `7`, then `range` will be a multivalue field containing both `low` and `elevated`. Use `mvindex(range, 0)` to pick the first match, or design non-overlapping ranges.
- **Only works on numeric fields** — if the named `field` contains non-numeric values, those events get the `default` value for `range`. Use `where isnum(field)` to verify before applying.
- **Negative range notation** — `Dislike=-5--1` uses double-dash to separate negative min from negative max. This is correct syntax.
- **No `range` field if no ranges defined** — calling `rangemap field=cpu` with no range definitions produces `range=None` for every event, which is rarely useful.

## See also

- `eval.md` — `case()` and `if()` for more complex, multi-condition classification logic
- `bucket.md` — group numeric values into fixed-width buckets automatically
