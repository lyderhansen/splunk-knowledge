# contingency — build a co-occurrence table for two fields

Source: Splunk Search Reference 10.2.0. Aliases: `counttable`, `ctable`.

## Syntax

    | contingency [maxrows=<int>] [maxcols=<int>]
                 [minrowcover=<float>] [mincolcover=<float>]
                 [usetotal=<bool>] [totalstr=<string>]
                 <field1> <field2>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field1` | Yes | — | Row field. Wildcard characters are not supported |
| `field2` | Yes | — | Column field. Wildcard characters are not supported |
| `maxrows` | No | `1000` | Maximum distinct row values to include. Least common values are dropped |
| `maxcols` | No | `1000` | Maximum distinct column values to include |
| `minrowcover` | No | `1.0` | Target fraction of total row values to represent (0-1). Adds enough rows to meet this ratio |
| `mincolcover` | No | `1.0` | Target fraction of total column values to represent |
| `usetotal` | No | `true` | Add row totals, column totals, and a grand total row/column |
| `totalstr` | No | `TOTAL` | Label for the totals row and column |

## Usage

`contingency` is a transforming command that builds a pivot-style table. Each cell shows the count of events where both the row value and the column value co-occur. If the fields are independent, cell counts will be roughly uniform across rows; if a pattern exists, some cells will be significantly higher.

Empty string values are rendered as `EMPTY_STR` in the output table.

## Examples

### Firewall traffic by zone pair

    index=firewall sourcetype=palo_alto
    | contingency src_zone dest_zone

### Analyze HTTP method vs. status code distribution

    index=web sourcetype=access_combined
    | contingency method status
    | sort method

### Reduce table size for high-cardinality fields

    index=web
    | contingency maxrows=20 maxcols=10 uri status
    | sort uri

### Hide totals row for cleaner export

    index=web | contingency usetotal=false action status

## Gotchas

- **Aliases `ctable` and `counttable` are equivalent** — all three produce the same output. Pick one and stay consistent within a project.
- **Hard limit of 1000 values per field** — even if `maxrows`/`maxcols` is set higher, the system enforces a ceiling of 1000. High-cardinality fields require pre-aggregation (e.g., `stats count` → `head 20`) before passing to `contingency`.
- **Wildcards not allowed in field names** — `contingency src* dest` raises a syntax error. Specify exact field names.
- **Overlapping ranges allowed** — if using `minrowcover` and `maxrows`, the `maxrows` limit takes precedence when it is reached first.

## See also

- `correlate.md` — Pearson correlation matrix for multiple fields
- `associate.md` — entropy-based field pair correlation
- `arules.md` — association rules with confidence and support metrics
