# top — most frequent values of a field with count and percentage

Source: Splunk Search Reference 8.2.12, page 591.

## Syntax

    | top [<N>] [limit=<int>] [countfield=<string>] [percentfield=<string>]
          [showcount=<bool>] [showperc=<bool>] [useother=<bool>] [otherstr=<string>]
          <field-list>
          [BY <field-list>]

Returns the N most common values of one or more fields. Output always includes a `count`
column and a `percent` column by default.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field-list` | Yes | — | One or more fields to find top values for |
| `N` or `limit=<int>` | No | 10 | Number of top values to return; `limit=0` = all values |
| `BY field-list` | No | (none) | Return top values separately for each combination of BY fields |
| `countfield=<string>` | No | `count` | Name of the count output field |
| `percentfield=<string>` | No | `percent` | Name of the percentage output field |
| `showcount=<bool>` | No | true | Include the count column |
| `showperc=<bool>` | No | true | Include the percent column |
| `useother=<bool>` | No | false | Add an "OTHER" row for remaining values |
| `otherstr=<string>` | No | `OTHER` | Label for the other row |

## Examples

### Top 10 source IPs

    index=firewall sourcetype=cisco:asa
    | top src_ip

### Top 5 HTTP status codes per host

    index=web sourcetype=access_combined
    | top 5 status by host

### Top values without percentage column

    index=web sourcetype=access_combined
    | top limit=20 uri_path showperc=f countfield=hits

## Gotchas

- **`top` is a transforming command** — it drops all fields except the target field(s),
  `count`, and `percent`. If you need to keep other fields, aggregate with `stats count by
  field` and sort manually instead.

- **`limit=0` returns all distinct values** — this can be expensive on high-cardinality
  fields. For large datasets, prefer `stats count by field | sort 0 -count` which gives
  the same result with more control.

- **Percentage is out of the returned rows, not all events** — when `limit` is set, the
  percentage reflects only the shown rows unless `useother=t` is also set, which adds the
  remainder back into the denominator.

## See also

- `rare.md` — inverse of top; returns the least frequent values
- `stats.md` — flexible aggregation with full function set
- `chart.md` — frequency counts split across two dimensions
