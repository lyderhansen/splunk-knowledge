# mvcombine — combine rows into multivalue field

Source: Splunk Search Reference 8.2.12, page 432.

## Syntax

    | mvcombine [delim=<string>] <field>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Field whose values should be combined into multivalue |
| delim | no | newline | Delimiter between values in the combined field |

## Examples

### Basic — combine IPs per user

```spl
index=myindex | stats count by user, src
| mvcombine delim=", " src
```

### Inverse of mvexpand

```spl
| mvexpand tags
| eval tags = upper(tags)
| mvcombine tags
```

## Gotchas

- **Only combines rows identical in ALL other fields:** Rows must match on every field except the one being combined. If any other field differs, they stay separate.
- **Order not guaranteed:** The order of values in the resulting multivalue field is not deterministic. Sort before combining if order matters.

## See also

- `mvexpand.md` — inverse operation
- `makemv.md` — create multivalue from delimited string
- `stats.md` — `values()` and `list()` for aggregation-based multivalue
