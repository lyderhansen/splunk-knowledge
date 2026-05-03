# return — return values from a subsearch

Source: Splunk Search Reference 10.2.0

## Syntax

    | return [<count>] [<alias>=<field>]... [<field>]... [$<field>]...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `count` | No | 1 | Number of result rows to convert into search terms |
| `alias=field` | No | — | Return field value renamed to `alias` in the outer search |
| `field` | No | — | Return field as a `field=value` term |
| `$field` | No | — | Return only the field **value** (no field name prefix) |

## Usage

`return` replaces the subsearch's output with a single synthetic event whose `search` field
contains an OR-joined filter expression. It automatically prepends `head <count>` and a
`fields` command, eliminating the need for those in the subsearch.

Output forms produced by `return`:

| Form | Example input | Output in outer search |
|---|---|---|
| Field name | `return ip` | `ip=10.0.0.1` |
| Alias | `return threat_ip=src` | `threat_ip=10.0.0.1` |
| Value only | `return $src` | `10.0.0.1` (bare value) |

Multiple rows become OR clauses: `return 2 user ip` might yield
`(user=alice ip=10.1.2.3) OR (user=bob ip=10.4.5.6)`.

## Examples

### Return the most recent IP of user "boss"

    error [search user=boss | return ip]

Outer search becomes: `error ip=192.168.1.5`

### Return top N items as an OR filter

    index=main [search index=threats | dedup src | return 5 $src]

### Use alias to rename a field for the outer search

    index=main [search index=threats | return threat_ip=src]

### Use return value in eval

    | eval nextid = 1 + [search user=* | return $id]

## Gotchas

- **`return` takes the first N rows, not N distinct values** — if the same value appears in
  the first two rows, `return 2 user` returns only one user. Prepend `dedup <field>` to
  get unique values.
- **Empty subsearch returns empty string** — if the subsearch yields 0 events, `return`
  produces an empty expression. The outer search then matches everything (no filter
  applied), which can silently return all events. Always test subsearches in isolation.
- **`$field` returns the value without a field name** — useful for bare-value filters or
  eval expressions, but meaningless if the field is multi-word.
- **Alias `=` must have no spaces** — `threat_ip=src` is valid; `threat_ip = src` causes
  a parse error.
- **Do not quote the `$` form** — write `return $src`, not `return "$src"`.

## Tips

- In most subsearches, `return` replaces `| head N | fields ... | rename ... | format`.
  Prefer `return` for clarity and performance.
- Use `dedup` before `return` when you need distinct values from first N results.

## See also

- `format.md` — manual control over subsearch output expression formatting
- `fields.md` — simpler field selection when `return` is not needed
- `search.md` — subsearch documentation and constraints
