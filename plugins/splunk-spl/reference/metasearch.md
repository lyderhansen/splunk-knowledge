# metasearch — search event metadata

Source: Splunk Search Reference 8.2.12, page 405.

## Syntax

    | metasearch <search-expression>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| search-expression | yes | — | Boolean expression using index, sourcetype, source, host |

## Examples

```spl
| metasearch index=main sourcetype=syslog
```

## Gotchas

- **Metadata only:** Does not return event data — only confirms which index/sourcetype/source/host combinations exist.

## See also

- `metadata.md` — richer metadata with counts
- `search.md` — actual event search
