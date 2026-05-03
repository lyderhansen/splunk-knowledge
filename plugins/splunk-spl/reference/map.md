# map — run a search for each result (loop)

Source: Splunk Search Reference 10.2.0

## Syntax

    | map (search="<string>" | <saved-search-name>) [maxsearches=<int>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `search` | yes* | — | Ad hoc search string with `$field$` token substitution; *required unless using a saved search name |
| `<saved-search-name>` | yes* | — | Name of a saved search to run per result; *required unless using `search=` |
| `maxsearches` | no | 10 | Maximum number of iterations (sub-searches); `0` does NOT mean unlimited |

## Usage

`map` is a looping operator: for each row in the current results, it executes the search with `$field$`
tokens replaced by that row's field values. Results from all iterations are combined into a single output
set.

`$_serial_id$` is a built-in variable that provides a 1-based incrementing counter across iterations.

In dashboard `<form>` contexts, use double-dollar signs (`$$field$$`) to avoid conflicts with token syntax.

Note: this command is flagged as "risky" and triggers SPL safeguards — users may be prompted to confirm.

## Examples

### Look up event detail for each denied IP

```spl
index=main action=deny | stats count by src | head 5
| map maxsearches=5 search="search index=main src=$src$ | stats dc(dest) AS targets"
```

### Run a saved search per host

```spl
index=main | stats count by host | head 10
| map maxsearches=10 per_host_report
```

### Use `$_serial_id$` to number iterations

```spl
| makeresults count=4
| streamstats count
| eval field = "hello" . count
| map
  [ makeresults
  | eval item = "$field$", serial = "$_serial_id$" ]
```

## Gotchas

- **`maxsearches=10` by default — not unlimited** — only the first 10 rows are processed. A message is
  generated for rows beyond the limit but they are silently skipped. `maxsearches=0` does NOT disable the
  limit; set a large number explicitly.
- **Very expensive** — each iteration spawns a full sub-search. For large datasets, use `join`, `lookup`,
  or `stats`-based patterns instead.
- **Cannot be followed by `append` or `appendpipe`** — placing either command after `map` in the same
  pipeline is unsupported and causes an error.
- **Token name conflicts** — reserved field names like `$name$`, `$search$`, and `$description$` may
  conflict with saved-search token names. Test carefully with these fields.
- **SPL safeguard prompt** — because `map` can launch many background searches, Splunk may display a
  confirmation dialog before executing.

## Tips

- Always set `maxsearches=` explicitly to avoid the silent 10-result default truncation.
- For complex ad hoc searches, use a bracketed subsearch instead of escaping quotes inside `search="..."`.

## See also

- `join.md` — often more efficient for the same lookup pattern
- `foreach.md` — iterate over fields within a single result, not over rows
- `lookup.md` — static enrichment from a lookup table without spawning new searches
