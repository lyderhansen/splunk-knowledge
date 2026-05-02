# typeahead — return typeahead suggestions

Source: Splunk Search Reference 8.2.12, page 627.

## Syntax

    | typeahead prefix=<string> [count=<int>] [max_time=<int>] [index=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| prefix | yes | — | Prefix string to get suggestions for |
| count | no | 10 | Max suggestions to return |
| index | no | all | Index to search |

## Examples

```spl
| typeahead prefix="error" count=20 index=main
```

## See also

- `metadata.md` — broader index discovery
