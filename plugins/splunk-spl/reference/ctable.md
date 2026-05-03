# ctable — alias for contingency

Source: Splunk Search Reference 10.2.0

`ctable` is an exact alias for the `contingency` command. Every argument, option, and
behavior available on `contingency` is available identically on `ctable`. The two commands
produce identical results and are interchangeable at the syntax level.

Builds a co-occurrence matrix (contingency table) showing the count of events for each
combination of values between two categorical fields.

## Syntax

    | ctable [maxrows=<int>] [maxcols=<int>] [minrowcover=<num>] [mincolcover=<num>]
             [usetotal=<bool>] [totalstr=<field>] <field1> <field2>

(Identical to the `contingency` syntax.)

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field1` | Yes | — | First categorical field (appears as row labels); no wildcards |
| `field2` | Yes | — | Second categorical field (appears as column labels); no wildcards |
| `maxrows` | No | 1000 | Max distinct values of `field1` to include; least-common values are dropped |
| `maxcols` | No | 1000 | Max distinct values of `field2` to include; least-common values are dropped |
| `minrowcover` | No | 1.0 | Minimum fraction of row values to represent (0.0–1.0) |
| `mincolcover` | No | 1.0 | Minimum fraction of column values to represent (0.0–1.0) |
| `usetotal` | No | true | Add row totals, column totals, and grand total to the output |
| `totalstr` | No | `TOTAL` | Label used for the totals row and column |

## Examples

### HTTP status by host cross-tab

    sourcetype=access_combined
    | ctable status host

### Auth action vs. user (hide totals)

    index=security sourcetype=linux_secure
    | ctable action user usetotal=false

### Limit output to top values only

    sourcetype=access_combined
    | ctable uri_path clientip maxrows=20 maxcols=10

## Gotchas

- **`ctable` has no independent documentation page** — all parameters, defaults, and limits
  are documented only under `contingency` in the Splunk Search Reference. If you search the
  docs for `ctable` you will find nothing useful; always look under `contingency`.
- **Prefer `contingency` in production searches** — `ctable` is uncommon enough to confuse
  reviewers and on-call engineers who are not aware of the alias. Use the full name in saved
  searches, alerts, and dashboards for readability.
- **Hard limit of 1000 on both maxrows and maxcols** — you cannot exceed 1000 values per
  dimension regardless of what you set. High-cardinality fields (IPs, usernames, URLs) will
  silently drop the least-common values.
- **Empty string values appear as `EMPTY_STR`** — events where `field1` or `field2` is an
  empty string are not dropped; they appear with the label `EMPTY_STR` in the table.
- **Wildcards are not supported in field names** — `| ctable src* dest*` is invalid syntax.

## Tips

- Pipe into `sort` on `field1` to make the row order predictable:
  `| ctable status host | sort status`
- Use `usetotal=false` when you only need the raw counts and totals would mislead.

## See also

- `contingency.md` — full syntax, parameters, examples, and gotchas (canonical documentation)
- `associate.md` — identifies field correlations
- `correlate.md` — calculates correlation coefficients between fields
