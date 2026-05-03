# analyzefields — rank numeric fields by predictive power for a target class

Source: Splunk Search Reference 10.2.0. Abbreviation: `af`.

## Syntax

    | analyzefields classfield=<field>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `classfield` | Yes | — | The target field whose values you want to predict; ideally binary (two distinct values) |

## Output columns

The command produces one row per numeric input field, with these columns:

| Column | Description |
|---|---|
| `field` | Name of the numeric field |
| `count` | Number of events where this field is present |
| `cocur` | Co-occurrence ratio: fraction of classfield events where this field also exists (1.0 = always present) |
| `acc` | Prediction accuracy: ratio of correct classfield predictions using this field's value |
| `balacc` | Balanced accuracy: average per-class accuracy (handles class imbalance) |

## Usage

- Only numeric fields are analyzed; string/categorical fields are skipped.
- Best results when `classfield` has exactly two distinct values (binary classification). Multiclass analysis is possible but harder to interpret.
- Run after filtering to the relevant population; noisy upstream data will reduce accuracy scores.

## Examples

### Find which fields predict activation status

    ... | analyzefields classfield=is_activated

### Rank fields for predicting HTTP error vs success

    index=web sourcetype=access_combined
    | eval is_error = if(status >= 400, "error", "ok")
    | analyzefields classfield=is_error
    | sort -balacc

### Filter to high co-occurrence fields only

    index=main
    | analyzefields classfield=action
    | where cocur > 0.8
    | sort -acc

## Gotchas

- **Only numeric fields are considered** — string fields are silently ignored; use `eval` to convert categorical fields to numeric encodings if needed.
- **Requires sufficient data** — `analyzefields` needs enough events to compute meaningful statistics; small result sets produce unreliable accuracy scores.
- **Binary `classfield` works best** — multiclass results are reported but balanced accuracy becomes harder to interpret with more than two classes.
- **Reporting command** — consumes all input events; output is a statistics table, not the original events.
- **High `cocur` does not mean high `acc`** — a field can be present in every event but still be a poor predictor.

## See also

- `fieldsummary.md` — descriptive statistics for all fields
- `correlate.md` — co-occurrence correlation between fields
- `anomalousvalue.md` — anomaly detection on field values
