# folderize — group values by directory-style hierarchy

Source: Splunk Search Reference 10.2.0

Collapses a field that contains hierarchical path-like values (separated by a delimiter) into a smaller set of "folder" buckets. Useful for grouping file paths, URL paths, or dot-notation metric names into manageable categories.

## Syntax

    | folderize attr=<string> [sep=<string>] [size=<string>] [minfolders=<int>] [maxfolders=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `attr` | Yes | — | The field whose values will be folderized |
| `sep` | No | `::` | Delimiter used to split the field into path components |
| `size` | No | `totalCount` | Field to use as the bucket weight when merging folders |
| `minfolders` | No | 2 | Minimum number of folder buckets to produce |
| `maxfolders` | No | 20 | Maximum number of folder buckets to produce |

## What it does

Reads the `attr` field across all events and builds a hierarchical tree based on the `sep` delimiter. It then merges low-frequency leaf nodes upward until the number of distinct buckets falls between `minfolders` and `maxfolders`. The result set retains the original events with the `attr` field rewritten to the collapsed folder path.

## Examples

    index=web_logs | stats count by uri_path
    | folderize attr=uri_path sep="/" minfolders=5 maxfolders=15

    index=metrics | stats sum(value) as totalCount by metric_name
    | folderize attr=metric_name sep="."

    index=file_audit | top limit=100 file_path
    | folderize attr=file_path sep="/" maxfolders=10

## Gotchas

- `sep` defaults to `::`, which is rarely the right separator for file paths or URLs — always specify `sep="/"` or `sep="."` as appropriate.
- The `size` field must exist in the result set; if omitted, `totalCount` is expected as a field name. Use `stats count as totalCount by <field>` upstream to guarantee it.
- Output bucket paths may be truncated to a common prefix — downstream `table` or `chart` commands will see the collapsed value, not the original.
- Does not produce useful output on raw event searches; run `stats` or `top` first to get a field-value frequency table.

## Tips

Pair with `stats count as totalCount by <field>` and then `folderize` to quickly build a treemap-style summary of high-cardinality path fields. Especially useful for dashboards showing file-system or URL activity without drowning in leaf-level detail.

## See also

- `bucketdir.md` — similar directory-bucketing approach
- `top.md` — get top values before folderizing
- `stats.md` — aggregate before folderizing
