# filldown — propagate the last non-null value forward through events

Source: Splunk Search Reference 8.2.12, page 310.

## Syntax

    | filldown [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<field-list>` | no | all fields | Space-delimited list of field names to fill down. If omitted, all fields are filled down. |

## Usage

`filldown` is a **streaming command**. For each specified field, it scans events top-to-bottom
and replaces each null value with the most recent non-null value seen above it. If all values
above are null, the field remains null.

`filldown` is useful when results have sparse fields — for example, after `chart` or `timechart`
generates a matrix where some cells are null because certain category combinations had no events
at specific time buckets.

Always `sort` before `filldown` to establish the row order you want the fill to follow. The
fill direction is strictly top-to-bottom in the current result order.

## Examples

### Basic fill-forward on a sparse field

    | sort _time
    | filldown last_status

### Fill down after chart to close gaps

    index=access_* | chart count by _time sourcetype span=1h
    | filldown

### Fill specific fields only, preserve others

    | sort _time
    | filldown bytes src_country

### Dashboard-specific pattern: carry-forward for step charts

    index=metrics | timechart span=1h last(cpu_load) AS cpu by host
    | filldown cpu
    -- produces a step-chart effect when cpu_load is only logged on change

## Gotchas

- **Top-to-bottom only** — `filldown` fills from earlier rows into later rows. If you need
  fill-backward (earlier nulls filled from later values), reverse sort first, apply `filldown`,
  then reverse again.

- **Sort before filldown** — without an explicit `sort`, result order is non-deterministic.
  `filldown` on unsorted results produces unpredictable output.

- **Does not fill empty strings** — like `fillnull`, `filldown` only propagates non-null values.
  An empty string `""` stops the fill: it is treated as a present (non-null) value.

## See also

- `fillnull.md` — replace null values with a static fill value
- `streamstats.md` — running statistics that also carry values forward with `current=f`
- `eval.md` — `coalesce()` for null-fallback logic
