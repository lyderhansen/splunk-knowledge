# gauge — format a single value for gauge chart visualization

Source: Splunk Search Reference 10.2.0.

## Syntax

    | gauge <value> [<range_val1> <range_val2> ...]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `value` | Yes | — | Numeric field name or literal number to use as the gauge reading |
| `range_val1`, `range_val2`, ... | No | 0 and 100 | Two or more range boundary values defining the gauge scale |

## Output fields

| Field | Description |
|---|---|
| `x` | The current gauge value |
| `y1`, `y2`, `y3`, ... | Range boundary values (one field per range value specified) |

## Usage

- `gauge` produces a single output row. The search must return a single numeric value before piping to `gauge`.
- If no range values are specified, the scale defaults to 0–100.
- When exactly two range values are given, the gauge shows a simple low-to-high scale.
- When four range values are given, the intermediate values define colored sub-bands (green/yellow/red for typical KPI gauges).
- A single range value is silently ignored.
- You can use a gauge chart visualization in Splunk Web without `gauge`; the advantage of the command is the ability to define custom range values.

## Examples

### Basic gauge with default 0–100 scale

    index=_internal | stats count AS myCount | gauge myCount

### Gauge with custom four-band range

Count events and display on a gauge with ranges 0–750, 750–1000, 1000–1250, 1250–1500:

    index=_internal
    | stats count AS myCount
    | gauge myCount 750 1000 1250 1500

### CPU utilization gauge

    index=perf sourcetype=cpu_metrics
    | stats avg(cpu_pct) AS avg_cpu
    | gauge avg_cpu 0 50 80 90 100

## Gotchas

- **Requires a single input row** — `gauge` uses only the first value in the specified field. Always aggregate to one row before calling `gauge`.
- **Default range 0–100** — if your metric can exceed 100 (e.g., byte counts), always specify explicit range values or the gauge will be misleading.
- **Single range value is ignored** — you must specify at least two range values for custom scaling to take effect.
- **Intermediate range values define color bands** — with four values you get three color bands; with five values you get four, and so on.

## See also

- `rangemap.md` — map numeric values to named ranges (low/medium/high) without visualization
- `stats.md` — aggregate to a single value before gauging
