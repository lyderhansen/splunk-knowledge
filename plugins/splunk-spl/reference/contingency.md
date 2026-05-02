# contingency — build co-occurrence table for two fields

Source: Splunk Search Reference 8.2.12, page 245. Aliases: `counttable`, `ctable`.

## Syntax

    | contingency <field1> <field2> [usetotal=<bool>] [totalstr=<string>] [mincover=<float>] [maxopts=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field1 | yes | — | Row field |
| field2 | yes | — | Column field |
| usetotal | no | true | Show row/column totals |

## Examples

```spl
index=firewall | contingency src_zone dest_zone
```

## See also

- `correlate.md` — multi-field correlation matrix
- `associate.md` — field pair strength
