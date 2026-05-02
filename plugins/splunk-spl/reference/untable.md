# untable — unpivot wide table to long format

Source: Splunk Search Reference 8.2.12, page 638.

## Syntax

    | untable <x-field> <y-name-field> <y-data-field>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| x-field | yes | — | Row identifier field |
| y-name-field | yes | — | Output field for column names |
| y-data-field | yes | — | Output field for values |

## Examples

```spl
| stats count by host, sourcetype
| xyseries host sourcetype count
| untable host sourcetype count
```

## See also

- `xyseries.md` — inverse (long-to-wide)
- `transpose.md` — swap rows and columns
