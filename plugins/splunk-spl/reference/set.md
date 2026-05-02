# set — perform set operations on subsearches

Source: Splunk Search Reference 8.2.12, page 514.

## Syntax

    | set <operation> <subsearch> <subsearch>

Where `<operation>` is `union`, `diff`, or `intersect`.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| operation | yes | — | `union`, `diff`, or `intersect` |
| subsearch | yes | — | Two searches in square brackets |

## Examples

### Find events in A but not in B

```spl
| set diff [search index=main host=web01] [search index=main host=web02]
```

### Find events common to both

```spl
| set intersect [search index=main src=10.10.*] [search index=main action=deny]
```

## See also

- `union.md` — simpler combine (union only)
- `diff.md` — field-by-field difference comparison
