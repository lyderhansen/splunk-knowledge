# selfjoin — join results with themselves

Source: Splunk Search Reference 8.2.12, page 503.

## Syntax

    | selfjoin [overwrite=<bool>] [max=<int>] <field-list>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field-list | yes | — | Fields to self-join on |
| overwrite | no | false | If true, duplicate fields are overwritten |
| max | no | 1 | Max matches per event |

## Examples

### Find IPs in both allow and deny

```spl
index=firewall | stats values(action) AS actions by src
| where mvcount(actions) > 1
```

Note: `selfjoin` is rarely the best approach — the `stats` pattern above is usually cleaner.

## Gotchas

- **Combinatorial explosion:** Self-joining N events on a non-unique key can produce N*N results. Always filter first.

## See also

- `join.md` — join with a separate search
- `stats.md` — often a better alternative for self-correlation
