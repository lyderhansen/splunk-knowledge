# associate — identify entropy-based correlations between field pairs

Source: Splunk Search Reference 10.2.0

## Syntax

    | associate [supcnt=<num>] [supfreq=<float>] [improv=<float>] [<field-list>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `supcnt` | No | `100` | Minimum number of times the reference key=value pair must appear. Must be a non-negative integer |
| `supfreq` | No | `0.1` | Minimum frequency of the reference key=value combination as a fraction of total events (0-1) |
| `improv` | No | `0.5` | Minimum entropy improvement (in bits). The calculated improvement must be ≥ this value |
| `field-list` | No | all fields | Space-delimited list of specific fields to analyze. Wildcards not supported |

## Output columns

`associate` produces a table with these fields:

| Column | Description |
|---|---|
| `Reference_Key` | Name of the first field in a correlated pair |
| `Reference_Value` | Value of the first field |
| `Target_Key` | Name of the second field |
| `Unconditional_Entropy` | Entropy of `Target_Key` across all events |
| `Conditional_Entropy` | Entropy of `Target_Key` given the reference key=value |
| `Improvement` | Reduction in entropy = `Unconditional - Conditional`. Higher = stronger association |

## Examples

### Find correlated field pairs in firewall logs

    index=firewall
    | fields src_ip, dest_port, action, protocol
    | associate

### Tune thresholds to find only strong, frequent associations

    index=web sourcetype=access_combined
    | fields uri, status, method, clientip
    | associate supcnt=50 supfreq=0.05 improv=1.0

### Investigate which field predicts authentication failures

    index=auth sourcetype=linux_secure
    | fields user, src_ip, app, action
    | associate improv=0.8

## Gotchas

- **High `supcnt` default (100)** — if your dataset has fewer than 100 events per field-value combination, `associate` returns no results. Lower `supcnt` for smaller datasets.
- **No wildcards in field-list** — `associate src* dest` is not valid. Field names must be exact.
- **All fields analyzed by default** — without a `field-list`, `associate` analyzes every field in every event, which can be very slow on wide events. Always restrict to relevant fields.
- **Results are directional** — `associate` shows reference→target direction. A strong association from A→B does not imply B→A is equally strong.
- **Entropy, not correlation** — `associate` measures information gain, not linear correlation. It works well for categorical fields but does not produce Pearson r values.

## See also

- `arules.md` — association rules with confidence/support metrics (similar but different output format)
- `correlate.md` — Pearson correlation matrix for numeric fields
- `contingency.md` — co-occurrence counts for two specific fields
