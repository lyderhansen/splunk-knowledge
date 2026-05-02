# history — return search history

Source: Splunk Search Reference 8.2.12, page 347.

## Syntax

    | history [events=<bool>]

## Examples

```spl
| history | table _time, search, user
```

## See also

- `audit.md` — broader audit trail
