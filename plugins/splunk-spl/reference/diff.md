# diff — return differences between two search results

Source: Splunk Search Reference 8.2.12, page 272.

## Syntax

    | diff [position1=<int>] [position2=<int>] [attribute=<field>] [diffheader=<field>] [maxlen=<int>] [context=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| position1 | no | 1 | Position of first result to compare |
| position2 | no | 2 | Position of second result to compare |
| attribute | no | all | Specific field to compare |

## Examples

### Compare two events field-by-field

```spl
index=main host=web01 | head 2 | diff
```

## See also

- `set.md` — set operations for diff at scale
