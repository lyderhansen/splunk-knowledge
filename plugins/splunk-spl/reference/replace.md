# replace — replace field values matching a pattern with a new value

Source: Splunk Search Reference 8.2.12, page 472.

## Syntax

    | replace (<value-or-wildcard> WITH <new-value>)... [IN <field-list>]

Multiple replacement pairs can be specified in one `replace` command. Without `IN`, the
replacement applies to all fields.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<value-or-wildcard>` | yes | — | The value to match. Supports `*` wildcard (matches any sequence of characters). Case-sensitive. |
| `<new-value>` | yes | — | The replacement value. Cannot use `*` as a back-reference. |
| `IN <field-list>` | no | all fields | Restrict replacements to the named fields only. |

## Usage

`replace` is a **distributable streaming command**. It performs exact string replacement (with
optional wildcard matching). It is useful for normalizing field values, replacing NULL
placeholders, or recoding categorical values without writing an `eval` expression.

Wildcard `*` in the pattern matches any characters — similar to shell globbing, not regex.
Back-references are not supported; the replacement value is always a literal string.

For regex-based replacement within eval, use `eval replace(field, "regex", "replacement")`.

## Examples

### Replace a specific value

    ... | replace "-" WITH "unknown" IN src_country

### Replace multiple values in one call

    ... | replace 404 WITH "Not Found", 500 WITH "Server Error", 200 WITH "OK" IN status

### Wildcard replacement (normalize prefixes)

    ... | replace "FAKE:*" WITH "normalized" IN sourcetype

### Replace across all fields

    ... | replace "" WITH "N/A"          -- replace empty strings everywhere

### Normalize status codes for dashboard labels

    index=access_* | stats count by status
    | replace 2* WITH "Success", 3* WITH "Redirect",
              4* WITH "Client Error", 5* WITH "Server Error" IN status

## Gotchas

- **Case-sensitive matching** — `replace "error" WITH "ERROR"` does not match `Error` or `ERROR`.
  Use `eval lower(field)` first to normalize case before replacing.

- **No regex support in `replace`** — the `*` wildcard is not a regex. For regex replacement,
  use `eval replace(field, "regex", "new")` or `rex field=X mode=sed "s/pattern/replacement/g"`.

- **Wildcard replacement loses original value** — `replace "GET /api/*" WITH "API call"` matches
  any URL starting with `/api/` but replaces the entire value with the literal string "API call".
  You cannot preserve or reference the matched portion.

- **No back-references** — unlike `eval replace()` which supports `\1` capture group references,
  the SPL `replace` command cannot reference any part of the matched value in the replacement string.

## See also

- `eval.md` — `replace(X, regex, Y)` function supports regex and back-references
- `rex.md` — regex extraction and sed-mode substitution
- `fillnull.md` — replace NULL values specifically
