# mvexpand — expand multivalue field into separate events

Source: Splunk Search Reference 8.2.12, page 435.

## Syntax

    | mvexpand <field> [limit=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Multivalue field to expand |
| limit | no | 0 (unlimited) | Max number of values to expand per event |

## Examples

### Basic — one row per array element after spath

```spl
index=myindex sourcetype=json_logs
| spath path=items{}.name output=item
| mvexpand item
| stats count by item
```

### With limit

```spl
| mvexpand tags limit=5
```

### Dashboard pattern — expand JSON array for charting

```spl
index=fake_tshrt sourcetype="FAKE:orders"
| spath path=items{}.category output=category
| spath path=items{}.price output=price
| mvexpand category
| stats sum(price) AS revenue by category
```

## Gotchas

- **Creates duplicate events:** Every other field is duplicated for each expanded value. A 3-value multivalue field produces 3 events — all other fields repeated.
- **Order matters with multiple mv fields:** If you need to expand two parallel arrays (e.g., `items{}.name` and `items{}.price`), expand only one — the other stays aligned by index. Expanding both independently produces a cartesian product.
- **NULL values are skipped:** Null entries in the multivalue field are silently dropped during expansion.

## See also

- `makemv.md` — create multivalue from delimited string
- `mvcombine.md` — inverse of mvexpand
- `spath.md` — array extraction that produces multivalue fields
