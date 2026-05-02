# overlap — find overlapping or missed summary events

Source: Splunk Search Reference 8.2.12, page 450.

## Syntax

    | overlap

No parameters. Operates on summary index data produced by `collect`.

## Examples

```spl
index=summary search_name="Daily Report" | overlap
```

## See also

- `collect.md` — write to summary index
