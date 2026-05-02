# highlight — highlight matching strings in the Splunk Web Events list

Source: Splunk Search Reference 8.2.12, page 346.

## Syntax

    | highlight <string>...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `<string>` | yes | — | One or more space-separated strings (or quoted multi-word phrases) to highlight. Matching is case-insensitive. |

## Usage

`highlight` is a **distributable streaming command**. It visually highlights occurrences of
the specified strings in the Splunk Web Events tab display. Matching is not case-sensitive.

The strings you provide must be **field values**, not field names. `highlight` scans the
rendered event text for matching substrings and wraps them in highlighting markup for display.

You must use `highlight` in a search that keeps raw events and displays output on the Events
tab. It does not work after commands like `stats`, `chart`, or `timechart` that produce
calculated results rather than raw events.

## Examples

### Highlight two terms

    index=access_* | highlight login logout

### Highlight a multi-word phrase

    index=security_* | highlight "access denied"

### Highlight multiple phrases

    index=web_logs | highlight error "failed authentication" "permission denied"

### Combine with search filter

    index=access_* (status=401 OR status=403)
    | highlight "401" "403" "Unauthorized" "Forbidden"

## Gotchas

- **Events tab only** — highlighting is a display feature in the Splunk Web Events tab. It has
  no effect on the Statistics tab, in Dashboard Studio, or in exported data.

- **Values, not field names** — `highlight src_ip` looks for events containing the literal
  string `"src_ip"`, not the value of the `src_ip` field. To highlight specific IP values,
  use the value directly: `highlight "192.168.1.5"`.

- **Cannot use after transforming commands** — `stats`, `chart`, `timechart`, `table`, and
  similar commands produce calculated results without raw event text. `highlight` has nothing
  to highlight in those contexts. It must come before or instead of transforming commands.

- **No regex support** — `highlight` matches literal strings only. For regex-based pattern
  highlighting, use the Splunk Web Events tab formatting options or `rex` to extract fields
  first.

## See also

- `iconify.md` — replace field values with visual icons in the Events list
- `eval.md` — `match()`, `like()` for programmatic pattern detection
- `search` command — filter events before highlighting to narrow the result set
