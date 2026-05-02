# from — retrieve data from a named dataset

Source: Splunk Search Reference 8.2.12, page 324.

## Syntax

    | from <dataset-type>:<dataset-name> [where <expression>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| dataset-type | yes | — | `datamodel`, `lookup`, `savedsearch`, or `inputlookup` |
| dataset-name | yes | — | Name of the dataset |

## Examples

### CIM data model access

```spl
| from datamodel:"Authentication" | search action=failure | stats count by user
```

### Lookup access

```spl
| from lookup:"customer_lookup.csv" | where tier="VIP"
```

## Gotchas

- **Colon syntax:** The dataset type and name are separated by a colon. Quotes around the name are required if it contains spaces.

## See also

- `datamodel.md` — lower-level data model access
- `inputlookup.md` — alternative lookup loading
- `savedsearch.md` — run saved searches
