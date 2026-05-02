# foreach — apply transform across multiple fields

Source: Splunk Search Reference 8.2.12, page 317.

## Syntax

    | foreach <wc-field-list> [fieldstr=<string>] [<subsearch>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| wc-field-list | yes | — | Wildcard field pattern (e.g., `*`, `cpu_*`, `host_*`) |
| subsearch | yes | — | Transform to apply. Use `<<FIELD>>` as the field name token |

## Examples

### Zero-fill all fields

```spl
| foreach * [eval <<FIELD>> = if('<<FIELD>>' > 0, '<<FIELD>>', 0)]
```

### Prefix all matching fields

```spl
| foreach cpu_* [eval <<FIELD>> = round('<<FIELD>>', 2)]
```

## Gotchas

- **`<<FIELD>>` token:** Must use double angle brackets. The token is replaced with each matching field name.
- **Single-quote field references:** Inside the subsearch, reference the field value with `'<<FIELD>>'` (single quotes) since the expanded name may contain special characters.

## See also

- `eval.md` — single-field computation
- `map.md` — iterate over results (not fields)
