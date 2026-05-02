# arules — find association rules between field values

Source: Splunk Search Reference 10.2.0

## Syntax

    | arules [sup=<int>] [conf=<float>] <field> <field> [<field>...]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field-list` | Yes | — | Two or more field names to analyze for associations. At least two fields must be provided |
| `sup` | No | `3` | Minimum support count (integer). Associations appearing fewer than this many times are excluded |
| `conf` | No | `0.5` | Minimum confidence threshold (0-1). Associations with a `Strength` value below this are excluded |

## Output columns

`arules` returns a table with these columns:

| Column | Description |
|---|---|
| `Given fields` | The antecedent field=value pair(s) |
| `Implied fields` | The consequent field=value pair(s) |
| `Strength` | Confidence of the rule (probability that implied fields appear given the antecedent) |
| `Given fields support` | Frequency of the antecedent in the data |
| `Implied fields support` | Frequency of the consequent in the data |

## Examples

### Find which URLs are associated with specific user actions

    index=web sourcetype=access_combined
    | arules uri, action, status

### Increase support threshold to find only frequent associations

    index=web sourcetype=access_combined
    | arules sup=10 conf=0.7 clientip, uri, action

### Find product co-occurrence in e-commerce logs

    index=orders
    | arules sup=5 conf=0.6 product_category, payment_method, region

## Gotchas

- **`sup` is a count, not a fraction** — unlike some association rule frameworks where support is expressed as a proportion (0-1), Splunk's `sup` is a minimum integer event count.
- **At least two fields required** — providing only one field raises an error. The command needs pairs to compute antecedent/consequent relationships.
- **High cardinality fields explode the result set** — fields like `session_id` or `timestamp` produce an unmanageable number of rules. Pre-aggregate or filter to low-cardinality fields before running `arules`.
- **Order matters for interpretation** — `arules` considers all combinations of given/implied from the field list, but the output is directional. Review `Given fields` and `Implied fields` carefully.

## See also

- `associate.md` — entropy-based field correlation (finds which fields predict each other)
- `correlate.md` — Pearson correlation coefficient matrix for numeric fields
- `contingency.md` — co-occurrence count matrix for two categorical fields
