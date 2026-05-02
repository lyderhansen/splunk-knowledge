# tojson — convert events to JSON objects

Source: Splunk Search Reference 8.2.12, page 587.

## Syntax

    | tojson [output_field=<field>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| output_field | no | _raw | Field to write JSON output to |

## Examples

```spl
index=main | head 5 | table host, source, sourcetype | tojson
```

## See also

- `outputtext.md` — XML output
- `eval.md` — `json_object()` for building JSON in eval
