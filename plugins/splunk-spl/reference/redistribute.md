# redistribute — enable parallel reduce on indexers

Source: Splunk Search Reference 8.2.12, page 474.

## Syntax

    | redistribute [by <field-list>]

## Examples

```spl
index=main | redistribute by src | stats count by src
```

## Gotchas

- **Requires Parallel Reduce:** Only works when Parallel Reduce is enabled on the search head cluster.

## See also

- `localop.md` — opposite: force local execution
