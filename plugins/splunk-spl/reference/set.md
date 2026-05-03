# set — perform set operations on subsearches

Source: Splunk Search Reference 10.2.0

## Syntax

    | set (union | diff | intersect) <subsearch1> <subsearch2>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `union` / `diff` / `intersect` | Yes | — | The set operation to perform |
| `subsearch1`, `subsearch2` | Yes | — | Exactly two subsearches in square brackets |

### Operations

| Operation | Result |
|---|---|
| `union` | All results from both subsearches, deduplicated (rows common to both appear once) |
| `diff` | Results from either subsearch that are NOT common to both (symmetric difference) |
| `intersect` | Only results common to both subsearches |

## Usage

`set` is an event-generating command and must start with a leading pipe. It runs both
subsearches, then applies the specified set operation based on **complete row equality**
(all field values in a row must match for two rows to be considered the same).

**Subsearch result limits:** By default, each subsearch is truncated at 50,000 rows
(controlled by `maxresultrows` in `[set]` stanza of `limits.conf`). Results exceeding the
`maxout` subsearch limit (default 10,000) are also silently truncated.

## Examples

### URLs with 404 errors but not 303 errors (symmetric difference)

    | set diff [search 404 | fields url] [search 303 | fields url]

### URLs that have both 404 and 303 errors

    | set intersect [search 404 | fields url] [search 303 | fields url]

### Combine events from two searches, deduplicating common rows

    | set union
        [search index=main host=web01 | fields src, dest, action]
        [search index=main host=web02 | fields src, dest, action]

### Exclude internal fields before comparison

    | set intersect
        [search index=a | fields host, status | fields - _*]
        [search index=b | fields host, status | fields - _*]

## Gotchas

- **Row equality includes ALL fields** — even internal fields like `_serial` or `_raw`
  differ between searches, making most raw-event comparisons useless. Always use
  `| fields <fieldlist> | fields - _*` inside subsearches to strip internal fields.
- **Silent truncation at 50,000 rows** — if either subsearch returns more rows, extras are
  silently dropped. The `diff` description in the docs says "silently truncated." Monitor
  subsearch result counts when working with large datasets.
- **`diff` is symmetric difference, not left-minus-right** — rows unique to either search
  are included; rows common to both are excluded. This is NOT `A minus B`; it is
  `(A ∪ B) minus (A ∩ B)`. If you need A-minus-B, use `join` with `type=left` and a
  `where` filter.
- **Both subsearches must return the same fields** for meaningful comparison. Mismatched
  field schemas cause all rows to appear unique.

## Tips

- Use `| fields - _*` in both subsearches to strip Splunk-generated internal fields before
  any set comparison on raw or semi-structured events.
- For large datasets, consider `join` or `lookup`-based approaches that do not have the
  50,000-row limit.

## See also

- `union.md` — simpler combine without deduplication logic
- `join.md` — key-based join for structured relational comparisons
- `append.md` / `appendcols.md` — alternative result combination patterns
