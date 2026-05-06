# commands.conf

Registers executable custom search commands backed by scripts or binaries in an app’s `bin/` directory, declaring streaming behavior, preview participation, Python compatibility, chunked protocols, security posture (`is_risky`), and headers passed from `splunkd`.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/apps/<app>/default/` (typical) or `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | Search |
| Restart required | No |
| Related files | authorize.conf |

## Stanzas and settings

### `[default]`

Defines inherited defaults prior to per-command overrides. Any key documented under `[<command_name>]` may appear here to seed shared behavior—Splunk merges them using normal precedence.

### `[<command_name>]`

`<command_name>` becomes the SPL verb unless `filename` redirects execution elsewhere.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `type` | `<string>` | `python` | Script interpreter binding (`python` or `perl`). |
| `python.version` | `default \| python \| python2 \| python3 \| python3.7 \| python3.9 \| latest` | _(unset)_ | **DEPRECATED**—selects interpreter flavor for `.py` handlers; superseded by `python.required`. |
| `python.required` | `<comma-separated list>` | _(unset)_ | Lists supported interpreters (`3.9`, `3.13`, `latest`, etc.); Splunk picks the highest available match and overrides `python.version` when both exist. |
| `filename` | `<string>` | `<stanza>.py/.pl/...` | Executable relative to the app `bin/` directory; `.py` forces Python invocation; chunked commands search `<PLATFORM>/bin` first and honor `.path` pointer files with environment substitution. |
| `command.arg.<N>` | `<string>` | _(chunked only)_ | Extra argv segments forwarded when `chunked=true`; supports `$SPLUNK_HOME` expansion. |
| `local` | `<boolean>` | `false` | Forces search-head-local execution when true. |
| `perf_warn_limit` | `<integer>` | `0` | Emits performance warnings when input events exceed this threshold (`0` disables warnings). |
| `streaming` | `<boolean>` | `false` | Marks commands as streamable versus transforming. |
| `maxinputs` | `<integer>` | `50000` | Caps events per invocation (`0` unlimited) bounded by `limits.conf` → `maxresultrows`. |
| `passauth` | `<boolean>` | `false` | Embeds auth headers when `enableheader=true`; ignored for chunked commands where tokens always flow via the modern protocol. |
| `run_in_preview` | `<boolean>` | `false` if `chunked=true`, else `true` | Controls whether preview pipelines invoke the command (chunked defaults false for performance). |
| `enableheader` | `<boolean>` | `true` | Signals that the command expects Splunk’s metadata header ahead of CSV payload (`splunk.Intersplunk` expectation). |
| `retainsevents` | `<boolean>` | `false` | Indicates event-preserving semantics akin to `sort`/`dedup` versus transforming reshaping. |
| `generating` | `<boolean>` | `false` | True when the command synthesizes events even if none arrive downstream. |
| `generates_timeorder` | `<boolean>` | `false` | When generating events, states whether output arrives descending by `_time`. |
| `overrides_timeorder` | `<boolean>` | `false` | For streaming non-generators, notes whether chronology changes relative to `_time`. |
| `requires_preop` | `<boolean>` | `false` | Marks `streaming_preop` SPL as mandatory rather than opportunistic optimization. |
| `streaming_preop` | `<string>` | _(unset)_ | SPL snippet Splunk should prepend when optimizing streaming commands. |
| `required_fields` | `<string>` | `*` | Comma-separated fields downstream commands must preserve/extract when possible. |
| `supports_multivalues` | `<boolean>` | `false` | Enables Python multivalue list handling instead of flattened strings in legacy adapters. |
| `supports_getinfo` | `<boolean>` | _(not documented)_ | Indicates support for `__GETINFO__` / `__EXECUTE__` probing protocol. |
| `supports_rawargs` | `<boolean>` | `false` | Prefers raw argument strings versus parsed tokens lacking quotes. |
| `undo_scheduler_escaping` | `<boolean>` | `false` | Removes scheduler-applied escaping for risky scheduled searches using raw args. |
| `requires_srinfo` | `<boolean>` | `false` | Requires SearchResultsInfo CSV path via header (`infoPath`), implying `enableheader=true`. |
| `needs_empty_results` | `<boolean>` | `true` | Ensures Splunk still invokes the command when interim pipelines yield zero rows. |
| `changes_colorder` | `<boolean>` | `true` | Allows script output to redefine column ordering for downstream commands. |
| `outputheader` | `<boolean>` | `false` | Writes Splunk-style header sections ahead of CSV results when true. |
| `clear_required_fields` | `<boolean>` | `false` | When true, `required_fields` enumerates the exhaustive field list rather than additive hints—common for transformers. |
| `stderr_dest` | `log \| message \| none` | `log` | Routes stderr to search logs, user-visible messages (with optional level prefixes), or discards it. |
| `is_order_sensitive` | `<boolean>` | `false` | Requires chronological/event ordering for correctness. |
| `is_risky` | `<boolean>` | `false` | Flags searches that should warn users when launched via URL or embedded links in Splunk Web. |
| `chunked` | `<boolean>` | `false` | Enables the modular chunked protocol; when true only `is_risky`, `maxwait`, `maxchunksize`, `filename`, `command.arg.<N>`, `python.version`, and `run_in_preview` remain meaningful alongside chunked plumbing. |
| `pass_timezone` | `<boolean>` | `false` | Adds serialized timezone metadata to headers when `enableheader=true` (PDF alerts rely on this). |
| `maxwait` | `<integer>` | `0` | Seconds a chunked command may stall without producing output (`0` unlimited); unsupported on Windows. |
| `maxchunksize` | `<integer>` | `0` | Maximum chunk bytes (metadata + payload) before Splunk terminates oversized producers (`0` unlimited). |
