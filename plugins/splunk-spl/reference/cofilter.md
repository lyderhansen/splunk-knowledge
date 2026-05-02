# cofilter — find co-occurring field value pairs

Source: Splunk Search Reference 8.2.12, page 234.

## Syntax

    | cofilter <field1> <field2>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field1 | yes | — | First field |
| field2 | yes | — | Second field |

## Examples

```spl
index=web | cofilter url user
```

## See also

- `contingency.md` — co-occurrence counts in table form
- `arules.md` — association rules with confidence/lift
