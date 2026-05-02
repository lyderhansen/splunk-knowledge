# abstract — produce summary snippet of event text

Source: Splunk Search Reference 8.2.12, page 174.

## Syntax

    | abstract [maxlines=<int>] [maxterms=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| maxlines | no | — | Max lines in the summary |
| maxterms | no | — | Max terms in the summary |

## Examples

```spl
index=main | abstract maxlines=3 | table _time, _abstract
```

## See also

- `highlight.md` — highlight terms in events
