# correlate — compute field co-occurrence correlation matrix

Source: Splunk Search Reference 10.2.0.

## Syntax

    | correlate [type=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `type` | No | `inclusion` | Correlation method: `inclusion` (co-occurrence) or `change` (value-change correlation) |

## Output

The command produces a matrix-format table:
- Each row represents one field (stored in `RowField`).
- Each column represents another field.
- Cell values are the **percentage** of events in which both fields co-occur (0.0 to 1.0).

A value of `1.0` means the two fields appear together in 100% of events; `0.0` means they never co-occur.

## Usage

- `correlate` looks at field **presence** co-occurrence (inclusion type), not field **value** correlation. Use `contingency` to count co-occurring values.
- By default, considers up to 1000 fields (controlled by `maxfields` in `limits.conf [correlate]`). If the limit is reached, a warning is emitted.
- Narrow your dataset with `fields` before correlating to get meaningful results and stay within the field limit.

## Examples

### Overview of field co-occurrence in _internal

    index=_internal | correlate

### Correlate only selected fields

    index=web sourcetype=access_combined
    | fields clientip, status, bytes, method, uri_path
    | correlate

### Find fields that rarely co-occur (potential schema variation)

    sourcetype=access_* | correlate
    | where RowField = "referer"

### Change correlation (fields that change together)

    index=main | correlate type=change

## Gotchas

- **Field presence, not value correlation** — `correlate` measures whether two fields exist in the same event, not whether their values move together. For value-level analysis use `contingency` or `stats`.
- **1000-field limit** — if your dataset has more than 1000 fields (e.g., after JSON extraction), add `| fields` before `correlate` to restrict scope.
- **Results vary with search scope** — a narrow sourcetype may show all 1.0s; mixed sourcetypes show more interesting variation.
- **Transforming command** — output is a correlation matrix; original events are consumed.

## See also

- `associate.md` — field-pair association strength with support/confidence
- `contingency.md` — co-occurrence counts for two specific fields and their values
- `analyzefields.md` — rank fields by predictive power for a target variable
