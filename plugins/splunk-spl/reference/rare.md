# rare — least frequent values of a field with count and percentage

Source: Splunk Search Reference 8.2.12, page 463.

## Syntax

    | rare [<N>] [limit=<int>] [countfield=<string>] [percentfield=<string>]
           [showcount=<bool>] [showperc=<bool>] [useother=<bool>]
           <field-list>
           [BY <field-list>]

Returns the N least common values of one or more fields. `rare` is the exact inverse of
`top` — it accepts the same parameters and produces the same output format, but sorted
ascending by frequency.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field-list` | Yes | — | One or more fields to find rare values for |
| `N` or `limit=<int>` | No | 10 | Number of least-frequent values to return; `limit=0` = all |
| `BY field-list` | No | (none) | Return rare values separately per BY-group |
| `countfield=<string>` | No | `count` | Name of the count output field |
| `percentfield=<string>` | No | `percent` | Name of the percentage output field |
| `showcount=<bool>` | No | true | Include the count column |
| `showperc=<bool>` | No | true | Include the percent column |
| `useother=<bool>` | No | false | Add an "OTHER" row for remaining values |

## Examples

### Least common user agents

    index=web sourcetype=access_combined
    | rare useragent

### Rarest source IPs per destination port (security: beaconing detection)

    index=firewall sourcetype=cisco:asa action=allow
    | rare limit=5 src_ip by dest_port

### Rare HTTP methods (anomaly hunting)

    index=web sourcetype=access_combined
    | rare method showperc=f

## Gotchas

- **`rare` is a transforming command** — like `top`, it drops all original fields except
  the target field(s), count, and percent. Chain a `lookup` or `join` after if you need to
  enrich the rare values.

- **Single-occurrence values are common in noisy data** — on high-cardinality fields like
  `useragent` or `clientip`, `rare` may return hundreds of values with `count=1`. Use
  `| rare limit=10` to cap output and `| where count > 1` if you want to exclude
  true singletons.

## See also

- `top.md` — inverse; returns the most frequent values
- `stats.md` — general aggregation with full function set
- `anomalydetection.md` — automated anomaly scoring
