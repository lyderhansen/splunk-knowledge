# bucketdir — group files by directory path

Source: Splunk Search Reference 8.2.12, page 215.

## Syntax

    | bucketdir <field> [maxcount=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Field containing file paths (usually `source`) |

## Examples

```spl
index=main | bucketdir source | stats count by source
```

## See also

- `folderize.md` — similar grouping
- `cluster.md` — text-based grouping
