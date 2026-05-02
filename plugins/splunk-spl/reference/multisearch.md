# multisearch — run multiple streaming searches simultaneously

Source: Splunk Search Reference 8.2.12, page 430.

## Syntax

    | multisearch <subsearch> [<subsearch>]...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| subsearch | yes | — | Two or more searches in square brackets |

## Examples

```spl
| multisearch
    [search index=main sourcetype=syslog host=web*]
    [search index=main sourcetype=access_combined host=web*]
| stats count by sourcetype, host
```

## Gotchas

- **Streaming only:** Unlike `union`, all subsearches must be streaming. No transforming commands inside the subsearches.
- **More efficient than append:** Runs searches in parallel on indexers, not sequentially.

## See also

- `union.md` — more flexible alternative (supports transforming)
- `append.md` — sequential two-search combine
