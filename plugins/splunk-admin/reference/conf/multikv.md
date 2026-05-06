# multikv.conf

Defines reusable extraction recipes consumed by `| multikv conf=<stanza>` so Splunk can explode single events that contain ASCII tables (for example `top`, `ps`, `ls`) into child events with sane fields.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app contexts) |
| Pipeline phase | Search |
| Restart required | No |
| Related files | Search-time `props.conf` (`KV_MODE=multi:<stanza>`), commands.conf overrides |

## Stanzas and settings

### `[<multikv_config_name>]`

Referenced explicitly from SPL (`conf=<multikv_config_name>`). Replace `<section>` with `pre`, `header`, `body`, or `post`.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `<section>.start` | `<regex>` | — | Marks the first line belonging to the section (match is inclusive). |
| `<section>.start_offset` | `<integer>` | — | Line offset from the event start (or prior section end) when regex boundaries are impractical. |
| `<section>.member` | `<regex>` | — | Tests whether a candidate line belongs to the section body between start/end markers. |
| `<section>.end` | `<regex>` | — | Marks the first line after the section (exclusive boundary). |
| `<section>.linecount` | `<integer>` | — | Fixed number of lines belonging to the section when regex termination cannot be expressed. |
| `<section>.ignore` | `_all_\|_none_\|_regex_ <list>` | — | Drops lines inside the section from further processing (_regex_ form accepts comma-separated regex list). |
| `<section>.replace` | `"find"="repl",...` | — | Performs literal substring swaps prior to tokenization (pairs must be quoted per spec examples). |
| `<section>.tokens` | `<tokenizer-spec>` | — | Describes how to chop/tokenize/align columns using the tokenizer DSL summarized below. |

### Tokenizer DSL (`<section>.tokens`)

| Token pattern | Type | Default | Description |
|---------------|------|---------|-------------|
| `_chop_, <offsets>` | `<tuple list>` | — | Supplies repeating `(offset,length)` pairs (without parentheses) carving fixed-width columns out of each member line. |
| `_tokenize_, <max_tokens>, <delims>[, <consume>]` | `<int>,<csv chars>[,bool]` | consume=`true` | Splits on delimiter characters; `max_tokens=-1` tokenizes fully, `0` inherits header token count, positive integers cap fields and merge remainder into the last token. |
| `_align_, <header>, <L\|R>, <width>` | `<string>,<side>,<int>` | — | Extracts whitespace-aligned columns anchored to a header substring; `width=-1` scans until space/tab boundaries. |
| `_token_list_, <fields>` | `<csv>` | — | Forces explicit ordered field names when tables lack header rows (for example `ls -lah`). |
