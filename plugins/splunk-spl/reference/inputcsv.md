# inputcsv — load CSV from dispatch directory

Source: Splunk Search Reference 8.2.12, page 351.

## Syntax

    | inputcsv [append=<bool>] [dispatch=<string>] [events=<bool>] <filename>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| filename | yes | — | CSV file name in the dispatch directory |
| append | no | false | Append to existing results |
| dispatch | no | current job | Dispatch directory to read from |

## Examples

```spl
| inputcsv previously_exported.csv
```

## Gotchas

- **Not for lookup files:** Use `inputlookup` for lookup tables. `inputcsv` reads from the search job dispatch directory.

## See also

- `inputlookup.md` — load lookup tables
- `outputcsv.md` — write CSV to dispatch directory
