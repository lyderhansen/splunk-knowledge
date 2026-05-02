# outputtext — output raw text to _xml field

Source: Splunk Search Reference 8.2.12, page 449.

## Syntax

    | outputtext [usexml=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| usexml | no | true | If true, output as XML. If false, output as plain text |

## Examples

```spl
index=main | head 5 | outputtext
```

## See also

- `outputcsv.md` — CSV export
- `tojson.md` — JSON export
