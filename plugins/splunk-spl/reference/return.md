# return — return values from a subsearch

Source: Splunk Search Reference 8.2.12, page 478.

## Syntax

    | return [<count>] [<$field>]... [<alias>=<field>]...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| count | no | 1 | Number of results to return |
| $field | no | — | Field to return (prefixed with `$`) |
| alias=field | no | — | Return field renamed to alias |

## Examples

### Return top source IP for outer search

```spl
index=main [search index=threats | head 1 | return 1 $src]
```

### Return with alias

```spl
index=main [search index=threats | return 5 threat_ip=src]
```

## See also

- `format.md` — auto-format subsearch output
- `fields.md` — simpler field selection for subsearches
