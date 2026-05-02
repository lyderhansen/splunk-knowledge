# outputcsv — write results to CSV in dispatch directory

Source: Splunk Search Reference 8.2.12, page 440.

## Syntax

    | outputcsv [append=<bool>] [create_empty=<bool>] <filename>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| filename | yes | — | CSV file name to write |
| append | no | false | Append to existing file |
| create_empty | no | true | Create empty file if no results |

## Examples

```spl
index=main | stats count by src | outputcsv daily_src_counts.csv
```

## See also

- `outputlookup.md` — write to persistent lookup table
- `inputcsv.md` — read CSV back
