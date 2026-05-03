# cofilter — find co-occurring field value pairs

Source: Splunk Search Reference 10.2.0

## Syntax

    | cofilter <field1> <field2>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `field1` | yes | — | The user or subject field (e.g., `user`, `src`) |
| `field2` | yes | — | The item or object field (e.g., `item`, `dest`, `page`) |

## Usage

`cofilter` implements one step in a collaborative filtering analysis for product recommendations or
anomaly detection. For each pair of values `(field1_val, field2_val)` that co-occur in events, it outputs
the popularity of each value individually and the popularity of the co-occurring pair.

`cofilter` is a transforming command and must have preceding results to operate on.

Output fields per row:
- `field1` / `field2` — the two co-occurring values
- `p(field1)` — the marginal popularity of the field1 value
- `p(field2)` — the marginal popularity of the field2 value
- `p(field1,field2)` — the joint popularity of the pair

## Examples

### Basic: user-item co-occurrence

```spl
index=ecommerce action=purchase
| cofilter user item
```

### URL and user co-occurrence from web logs

```spl
index=web sourcetype=access_combined
| cofilter user url
| sort -"p(user,url)"
| head 20
```

### Synthesized example to test the command

```spl
| makeresults
| eval user="a b c a b c a b c"
| makemv user
| mvexpand user
| streamstats count
| eval item = count % 5
| cofilter user item
```

## Gotchas

- **Order matters** — `field1` must be the "user" dimension and `field2` the "item" dimension. Swapping
  them changes the interpretation of the output columns.
- **Requires pre-aggregated or raw events** — the command counts co-occurrence across individual events,
  not pre-grouped stats rows.
- **Popularity values are relative, not absolute** — the `p(...)` fields are normalized proportions, not
  raw counts. For raw counts, use `stats count by field1, field2`.
- **Not for simple cross-tabulation** — if you just need a co-occurrence count table, `contingency` is
  simpler.

## Tips

- Use after `| dedup session_id user item` to ensure each user-item pair is counted only once per session.
- Sort by `"p(field1,field2)"` descending to surface the most common co-occurrences.

## See also

- `contingency.md` — co-occurrence counts in table/matrix form
- `arules.md` — association rules with confidence and lift metrics
