---
name: spl-gotchas
description: SPL syntax traps and categorized command index for all Splunk search commands. Load BEFORE writing any SPL — dashboards, ad-hoc searches, alerts, saved searches, generators. Top 20+ silent-fail traps ranked by frequency, plus categorized command index with when-to-use descriptions. For full syntax on any command, read reference/<command>.md from this plugin.
---

# spl-gotchas — SPL traps + command index

## How to use

1. This file is loaded eagerly — scan it before writing any SPL.
2. Check the **silent-fail traps** for syntax you're about to use.
3. Use the **command index** to find the right command for your task.
4. For full syntax + parameters + examples, read `reference/<command>.md`.

**Source versions:** Reference files are sourced from Splunk Enterprise
Search Reference 8.2.12 with updates from 10.2.0 (2026-05-01). Commands
marked "REMOVED in 10.2" in their reference file are no longer available
in Splunk Enterprise 10.2+. New eval functions added in 10.2 (bitwise,
extended type conversion/checking) are documented in `reference/eval.md`.

---

## Silent-fail traps (ranked by frequency)

### 1. spath: `output=` not `as`

**Wrong:** `| spath path=items{}.category as category`
**Right:** `| spath path=items{}.category output=category`
**Why:** `as` is silently ignored — the field gets the path string as its name instead of your alias. No error, just a column named `items{}.category` instead of `category`.

### 2. case() default: comma not equals

**Wrong:** `case(x>90, "high", true() = "low")` or `case(x>90, "high", true = "low")`
**Right:** `case(x>90, "high", 1==1, "low")` or `case(x>90, "high", true(), "low")`
**Why:** `true() = "low"` is a comparison expression (does true equal "low"? — no), so the default branch never fires. `true = "low"` reads `true` as a field name. The separator between condition and value is always a comma, never `=`.

### 3. Dotted fields need single quotes in eval/where

**Wrong:** `| eval x = properties.status.errorCode`
**Right:** `| eval x = 'properties.status.errorCode'`
**Why:** Without quotes, Splunk interprets dots as sub-search operators and silently returns wrong results. Affects `eval`, `where`, `if`, `case`, `search`, `match`. Does NOT affect `stats`, `table`, `fields`, `rename`, `sort`, `dedup`.

### 4. matchValue vs rangeValue in Dashboard Studio DOS

**Wrong:** `> table | seriesByName('status') | rangeValue(statusColors)` (for string values)
**Right:** `> table | seriesByName('status') | matchValue(statusColors)` (for string values)
**Why:** `rangeValue` uses numeric `from`/`to` ranges. `matchValue` uses string equality via `match` key. Using the wrong one silently produces no color — the cell stays default.

### 5. sort default limit is 10000

**Wrong:** `| sort -count`
**Right:** `| sort 0 -count`
**Why:** Without a count argument, `sort` silently returns only the first 10,000 results. `0` means "all results".

### 6. join default limit is 50000

**Wrong:** `| join src [search ...]`
**Right:** `| join max=0 src [search ...]`
**Why:** The subsearch in `join` returns at most 50,000 results by default. Events beyond that are silently dropped. `max=0` removes the limit.

### 7. `!=` in search returns nulls

**Wrong:** `| search status!=200` (includes events where status is null)
**Right:** `| where status!=200` (excludes nulls)
**Why:** `search` treats `!=` as "field exists AND is not X" OR "field doesn't exist". `where` correctly excludes nulls. Safe pattern: `| where isnotnull(status) AND status!=200`.

### 8. timechart limit=10 hides series

**Wrong:** `| timechart span=1h count by sourcetype`
**Right:** `| timechart span=1h count by sourcetype limit=0 useother=f`
**Why:** Default `limit=10` silently merges all series beyond the top 10 into "OTHER". Use `limit=0` to show all, `useother=f` to hide the OTHER bucket.

### 9. rex max_match=1 default

**Wrong:** `| rex field=_raw "(?<ip>\d+\.\d+\.\d+\.\d+)"`
**Right:** `| rex field=_raw max_match=0 "(?<ip>\d+\.\d+\.\d+\.\d+)"`
**Why:** Default extracts only the FIRST match into a single-value field. `max_match=0` extracts ALL matches into a multivalue field.

### 10. `"field"` in eval is a string literal

**Wrong:** `| eval x = "status"` (assigns the string "status")
**Right:** `| eval x = status` or `| eval x = 'status'`
**Why:** Double quotes in eval always create string literals. For field references, use no quotes (simple names) or single quotes (dotted/special names).

### 11. strftime on non-epoch field

**Wrong:** `| eval formatted = strftime(date_field, "%Y-%m-%d")`
**Right:** `| eval epoch = strptime(date_field, "%Y-%m-%d %H:%M:%S") | eval formatted = strftime(epoch, "%Y-%m-%d")`
**Why:** `strftime` expects epoch seconds. If the input is a string, it silently produces garbage output with no error.

### 12. relative_time snap direction

**Wrong (maybe):** `-1d@d` when you mean "exactly 24 hours ago"
**Right:** `-1d` for exactly 24h ago, `-1d@d` for yesterday at midnight
**Why:** `@d` snaps to midnight AFTER applying the offset. `-1d@d` = "go back 1 day, then snap to midnight" = yesterday 00:00:00. Subtle but causes off-by-hours bugs in time-bounded searches.

### 13. count vs count(field)

**Wrong (maybe):** `| stats count by src` when field is sometimes null
**Right:** `| stats count(user) AS user_count by src`
**Why:** `count` counts events regardless of field values. `count(field)` counts only events where `field` is non-null. Wrong choice silently inflates or deflates your metric.

### 14. first()/last() are NOT time-ordered

**Wrong:** `| stats first(status) AS first_status by src`
**Right:** `| stats earliest(status) AS first_status by src`
**Why:** `first()` and `last()` return the first/last event the search head encounters — which depends on indexer parallelism and is effectively random. `earliest()` and `latest()` are time-ordered.

### 15. stats drops NULL by-values silently

**Wrong:** `| stats count by category` (rows where category is null vanish)
**Right:** `| fillnull value="(none)" category | stats count by category`
**Why:** `stats ... by field` silently excludes all events where the `by` field is null. No warning, no empty row — they just disappear from results.

### 16. in() needs if() wrapper in eval

**Wrong:** `| eval is_target = in(user, "admin", "root")`
**Right:** `| eval is_target = if(in(user, "admin", "root"), 1, 0)`
**Why:** `in()` returns a boolean but `eval` can't assign it directly. Must be wrapped in `if()`. In `where`, `in()` works directly: `| where in(user, "admin", "root")`.

### 17. json_extract dots = nesting

**Wrong:** `| eval val = json_extract(payload, "system.splunk.path")` (descends into system→splunk→path)
**Right:** `| eval val = json_extract_exact(payload, "system.splunk.path")` (treats key literally)
**Why:** `json_extract` interprets dots as nested paths. If the JSON key literally contains dots, use `json_extract_exact()`.

### 18. transaction is slow — prefer stats

**Wrong:** `| transaction session_id maxspan=1h` (memory-intensive)
**Right:** `| stats min(_time) AS start, max(_time) AS end, count, values(action) AS actions by session_id | eval duration = end - start`
**Why:** `transaction` loads all events into memory and is 10-100x slower than the `stats` equivalent. Only use `transaction` when you need `maxpause`, `startswith`/`endswith`, or access to raw events within each group.

### 19. makemv only types row 1 for sparklines

**Wrong:** `| eval x="1,2,3" | makemv delim="," x` (only first row gets typed as multivalue)
**Right:** `| stats sparkline(avg(metric), 30m) AS trend by host`
**Why:** `makemv` applied after `eval` only types the first row correctly. Rows 2+ silently degrade to single-value. For sparklines in tables, always use `| stats sparkline()`.

### 20. subsearch 60s timeout / 50K limit

**Wrong:** Assuming subsearch returns all results from a large dataset
**Right:** Check with `| append [search ... | stats count]` or use `join`/`map` alternatives
**Why:** Subsearches silently timeout at 60 seconds and truncate at 50,000 results. No error in the outer search — it just runs with partial/missing data.

### 21. `| fields - _time` needed to hide _time in tables

**Wrong:** Expecting `showInternalFields: false` to hide `_time` in `splunk.table`
**Right:** `| fields - _time` in SPL
**Why:** `_time` is exempt from `showInternalFields` in Dashboard Studio tables. The only way to hide it is to exclude it in SPL.

### 22. tostring() format arg only accepts 3 values

**Wrong:** `| eval display = tostring(round(val, 3), "0.000")`
**Right:** `| eval display = tostring(round(val, 3))`
**Why:** `tostring()` format argument only accepts `"hex"`, `"commas"`, or `"duration"`. Numeric format patterns (`"0.000"`, `"#,###"`) are NOT valid — they cause eval errors. For decimal precision, use `round(x, N)` before `tostring()`. For comma-separated display, use `tostring(val, "commas")`. For time display, use `tostring(val, "duration")`.

### 23. strftime on _time kills chart x-axis

**Wrong:** `| eval _time=strftime(_time, "%H:%M")` before a timechart/area/line
**Right:** Keep `_time` as epoch for charts, only use strftime in tables via `| eval display_time=strftime(_time, "%H:%M")`
**Why:** Converting `_time` to a string destroys the numeric axis. Splunk charts need epoch values for the x-axis. Only use strftime for display in table columns, never to replace `_time` in chart searches.

### 24. TERM() for exact major-term matching — massive performance gain

**Wrong:** `index=firewall src_ip=10.0.0.1` (Splunk breaks `10.0.0.1` into minor terms `10`, `0`, `1` — matches millions of false positives)
**Right:** `index=firewall TERM(src_ip=10.0.0.1)` (matches the exact major term in the tsidx lexicon)
**Why:** Without `TERM()`, Splunk's search bar text is broken into minor terms by the segmenter. Searching `average=0.9*` generates LISPY `[ AND 0 9* index::* ]` — matching any event containing `0` and a term starting with `9`. With `TERM(average=0.9*)` the LISPY becomes `[ AND average=0.9* index::* ]` — matching only events with that exact major term. Real-world improvement: 21 seconds → 0.7 seconds (99.99% false positive elimination).

**When TERM() works:** the value you're searching for must be a single major term in the lexicon. Major breakers are: `[ ] < > ( ) { } | ! ; , ' " * \n \r \s \t & ? +` and URL-encoded equivalents. If your value contains a major breaker (like spaces), it's split into multiple major terms and `TERM()` won't match.

**When TERM() doesn't work:** values with spaces or major breakers inside them (e.g., `TERM(user=John Smith)` fails because the space splits it). Use `TERM()` for `key=value` pairs, IPs, GUIDs, hostnames — anything without major breakers.

```spl
| search index=main TERM(src_ip=192.168.1.100) TERM(action=blocked)
| stats count by src_ip, dest_ip
```

**Discover available terms with `walklex`:**
```spl
| walklex index=main type=term | search term="src_ip=*"
```

### 25. PREFIX() in tstats — indexed-field-free aggregation

**Wrong:** `index=_internal host IN (idx*) group=thruput | stats sum(kb) by host _time` (raw search, 134 seconds)
**Right:** `| tstats sum(PREFIX(kb=)) as kb where index=_internal host=idx* TERM(group=thruput) by host _time span=1767s` (PREFIX search, 3-30x faster)
**Why:** `PREFIX()` (v8+) allows `tstats` to treat major terms as pseudo-indexed-fields. Instead of requiring a data model or indexed field extraction, `PREFIX(field=)` reads values directly from the tsidx lexicon. Works in WHERE, BY, and aggregation clauses.

**Syntax:**
```spl
| tstats count where index=myindex TERM(status=error) by PREFIX(host=) _time span=1h
| rename PREFIX(host=) as host
```

**Rules:**
- `TERM(key=value)` in WHERE clause for filtering
- `PREFIX(key=)` in BY clause for grouping (note: trailing `=`)
- `sum(PREFIX(value=))` in aggregation for numeric extraction
- Always `| rename PREFIX(key=) as key` after — output field name includes the prefix
- Requires Splunk 8+ (PREFIX directive added in v8)

**The killer combo — replaces 5 appended tstats with one:**
```spl
-- SLOW: one tstats per value
| tstats prestats=t count where index=itsi_summary TERM(alert_severity=high) by _time span=1sec
| fillnull "high" alert_severity
| tstats prestats=t append=t count where index=itsi_summary TERM(alert_severity=low) by _time span=1sec
| fillnull "low" alert_severity
...

-- FAST: single tstats with PREFIX
| tstats count where index=itsi_summary TERM(alert_severity=*)
    by PREFIX(alert_severity=) _time span=1sec
| rename PREFIX(alert_severity=) as alert_severity
```

### 26. append/join/transaction are last resort — use stats-based alternatives

**Wrong:** Reaching for `append`, `join`, or `transaction` as the first approach to combining or correlating data.
**Right:** Use `stats`, `eventstats`, or `streamstats` first. These commands are distributed, streaming, and orders of magnitude faster.

| Slow command | When acceptable | Fast alternative |
|---|---|---|
| `transaction` | Need `maxpause`, `startswith`/`endswith`, or access to grouped `_raw` | `stats min(_time) AS start, max(_time) AS end, values(action) AS actions, count by session_id \| eval duration=end-start` |
| `join` | True SQL-style join on a small lookup-like dataset (<50K rows) | `stats` with shared by-fields, or `lookup`, or `eventstats` |
| `append` | Combining results from genuinely different indexes/sourcetypes | `multisearch` (parallel), or single search with `stats ... by sourcetype` |
| `appendcols` | Adding a single computed column from a different search | `eventstats` if same dataset, or `lookup` if external |

**Why these are slow:**
- `transaction` loads all events into memory — 10-100x slower than `stats` (trap #18)
- `join` default max is 50K and runs a full subsearch (trap #6)
- `append` runs subsearches sequentially — each has 60s timeout / 50K limit (trap #20)
- `eventstats` adds computed fields inline without destroying original events
- `streamstats` does running calculations in a single pass

**Pattern: "find events where field X is above the group average"**
```spl
-- WRONG: join to get averages
... | join type=left src [search ... | stats avg(bytes) as avg_bytes by src]
    | where bytes > avg_bytes

-- RIGHT: eventstats adds the average inline
... | eventstats avg(bytes) as avg_bytes by src
    | where bytes > avg_bytes
```

**Pattern: "running total / cumulative sum"**
```spl
-- WRONG: append with progressive stats
-- RIGHT:
... | sort 0 _time | streamstats sum(count) as cumulative_count
```

---

## Search performance hierarchy

Optimize SPL in this order — earlier stages eliminate more work:

```
1. Specify INDEX + TIME RANGE           ← narrows buckets to consider
   index=firewall earliest=-1h

2. Add host/source/sourcetype           ← bloom filter eliminates buckets
   sourcetype=cisco:asa

3. Use TERM() for exact major terms     ← tsidx eliminates slices (no decompression)
   TERM(action=blocked)

4. Use tstats + PREFIX() when possible  ← reads tsidx only, never touches raw events
   | tstats count where ... by PREFIX(src=)

5. Filter early with WHERE, not late    ← first line = most computational effort
   index=fw TERM(action=blocked)        ← good: filters at indexer
   index=fw | search action=blocked     ← bad: filters at search head after extraction
```

**Key metric: scanCount vs eventCount** (visible in Job Inspector).
If scanCount >> eventCount, you're decompressing and parsing events
only to throw them away. Add TERM() or tighten the first line of
your search to eliminate earlier in the pipeline.

---

## Command index

### Filtering & searching

| Command | When to use | Ref |
|---|---|---|
| search | Filter events by field values and keywords. First command in the pipeline (implicit). Supports wildcards (`field=*val*`) and boolean (`AND`, `OR`, `NOT`). For field-vs-field comparison or function-based filtering, use `where` instead. | reference/search.md |
| where | Filter with expressions, comparisons, and functions. Supports `<`, `>`, `like()`, `match()`, `cidrmatch()`, field-vs-field comparison. Unlike `search`, `!=` correctly excludes nulls. Prefer over `search` for non-trivial filters. | reference/where.md |
| regex | Keep or remove events matching a regular expression. `| regex field="pattern"` keeps matches, `| regex field!="pattern"` removes them. Simpler than `| where match()` but less flexible — no capture groups. | reference/regex.md |
| dedup | Remove duplicate events by field combination. `| dedup src dest` keeps first event per unique pair. Use `sortby -_time` to keep latest instead of first. `| dedup 3 src` keeps first 3 per value. | reference/dedup.md |
| uniq | Remove adjacent duplicate events (ALL fields must match). Much stricter than `dedup` — requires events to be sorted first. Rarely used; prefer `dedup`. | reference/uniq.md |
| head | Return first N results. `| head 10` returns top 10. Default N=10. Useful in subsearches to limit output. Very cheap — stops pipeline early. | reference/head.md |
| tail | Return last N results. `| tail 5` returns bottom 5. Requires full pipeline to run first (unlike `head`). Use for "most recent N" after `| sort -_time`. | reference/tail.md |
| reverse | Reverse the order of results. `| reverse` flips the result set. Equivalent to re-sorting in opposite direction but without specifying fields. | reference/reverse.md |
| require | Fail the search if preceding commands return zero results. Useful in subsearches and saved searches to detect empty-result conditions. | reference/require.md |
| scrub | Anonymize search results by replacing field values with scrubbed versions. Used for sharing data without exposing sensitive values. | reference/scrub.md |

### Field extraction

| Command | When to use | Ref |
|---|---|---|
| spath | Extract fields from JSON or XML structured data. Default input is `_raw`. Use `output=` (NOT `as`) to rename extracted field. For arrays use `path=items{}.name` with `{}` notation, then pair with `mvexpand` for one-row-per-element. | reference/spath.md |
| rex | Extract fields via regex named capture groups `(?<fieldname>...)`. Also has `mode=sed` for in-place replacement (masking SSNs, IPs). Use `max_match=0` to extract ALL matches, not just the first. | reference/rex.md |
| extract | Auto-extract key=value pairs from event text (also known as `kv`). Quick-and-dirty extraction when events follow `key=value` format. Less precise than `rex` or `spath`. | reference/extract.md |
| xmlkv | Auto-extract key-value pairs from XML events. Quick alternative to `spath` for flat XML. For complex/nested XML, use `spath` or `xpath` instead. | reference/xmlkv.md |
| xpath | Extract from XML using XPath expressions. More powerful than `spath` for complex XML with namespaces or attributes. Prefer `spath` for JSON. | reference/xpath.md |
| xmlunescape | Unescape XML-encoded characters (`&amp;` → `&`, `&lt;` → `<`). Use when XML content has been double-encoded and fields contain escaped entities. | reference/xmlunescape.md |
| multikv | Extract field-values from table-formatted events (e.g., `top`, `ps`, `netstat` output). Reads header row to determine field names. | reference/multikv.md |
| kvform | Extract field-values using a form template. More structured than `extract` — you define the expected layout. Rarely used; prefer `rex`. | reference/kvform.md |
| erex | Auto-generate regex from examples. Provide example values and Splunk builds the extraction regex. Good for prototyping; prefer explicit `rex` in production. | reference/erex.md |

### Field manipulation

| Command | When to use | Ref |
|---|---|---|
| eval | Compute new fields with expressions and functions. Covers conditional (`case`, `if`), string, numeric, type, time, JSON, multivalue, and crypto functions. See trap #2 (case default), #3 (dotted fields), #10 (string vs field). | reference/eval.md |
| fieldformat | Change display formatting without changing the underlying value. `| fieldformat bytes = tostring(bytes, "commas")`. Calculations still use the raw number. Prefer over `eval` when you only need cosmetic formatting. | reference/fieldformat.md |
| rename | Rename fields. `| rename src AS source_ip`. Dotted fields need double quotes: `| rename "properties.status" AS status`. Supports wildcards: `| rename *ip AS *address`. | reference/rename.md |
| fields | Keep or remove fields from results. `| fields src, dest, action` keeps only those. `| fields - _raw, _time` removes those. Use early in pipeline for performance — drops fields before they reach the search head. | reference/fields.md |
| table | Create a table with specified fields in order. `| table src, dest, action`. Similar to `fields` but also sets column order. Removes all unlisted fields. | reference/table.md |
| replace | Replace field values with new values. `| replace "localhost" WITH "local" IN host`. Supports wildcards. For regex-based replacement, use `| rex mode=sed` instead. | reference/replace.md |
| setfields | Set field values for all results to a constant. `| setfields status="OK"`. Overwrites existing values. Rarely used; prefer `eval`. | reference/setfields.md |
| fillnull | Replace null values with a specified value. `| fillnull value=0 count, bytes`. Use before `stats` to prevent null by-values from vanishing (trap #15). `| fillnull value="N/A"` fills ALL fields. | reference/fillnull.md |
| filldown | Replace null values with the last non-null value in the column. `| filldown status`. Useful for filling gaps in time-series data where the value carries forward. | reference/filldown.md |
| convert | Convert field values to numerical format. `| convert auto(field)` auto-detects. Supports `dur2sec`, `mstime`, `memk`, `rmunit`, `ctime`, `mktime`. Prefer `eval tonumber()` for simple cases. | reference/convert.md |
| reltime | Convert `_time` to human-readable relative time (`"2 hours ago"`). Adds a `reltime` field. Useful for display in tables. For epoch math, use `eval now() - _time`. | reference/reltime.md |
| tags | Annotate events with tags defined in the knowledge manager. `| tags outputfield=tag`. Tags are pre-configured field-value → tag-name mappings. | reference/tags.md |
| iconify | Display a unique icon for each distinct value of specified fields. Visual aid in Splunk Web event listings. Not used in Dashboard Studio — use markdown or viz options instead. | reference/iconify.md |
| highlight | Highlight specified terms in search results. `| highlight error, fail, timeout`. Visual aid in Splunk Web event listings. | reference/highlight.md |

### Aggregation & statistics

| Command | When to use | Ref |
|---|---|---|
| stats | Aggregate events into summary rows. Core aggregations: `count`, `dc()`, `avg()`, `sum()`, `values()`, `list()`, `earliest()`, `latest()`, `perc95()`. Use `by` clause for grouping. Removes all original fields — only grouped fields and aggregations survive. | reference/stats.md |
| eventstats | Same aggregations as `stats` but PRESERVES all original events — adds computed fields inline. Use when you need per-event comparison against group averages (e.g., "is this event above the group mean?"). | reference/eventstats.md |
| streamstats | Running/cumulative calculations over ordered events. `window=N` for rolling averages, `current=f` for "previous value" patterns. Events must be pre-sorted. `| streamstats count AS row_num` for row numbering. | reference/streamstats.md |
| timechart | Time-series aggregation with automatic bucketing (`span=1h`). One row per time bucket. Default `limit=10` hides extra series as "OTHER" — use `limit=0 useother=f`. Primary viz datasource for `splunk.line`/`splunk.area`. | reference/timechart.md |
| chart | Two-dimensional aggregation: `| chart count by status, sourcetype` or `| chart avg(dur) over hour by day`. Like `timechart` but not time-bucketed. Output suitable for bar/column/pie charts. | reference/chart.md |
| top | Show most common values of a field. `| top 10 src`. Auto-adds `count` and `percent` columns. Default limit=10, returns all with `limit=0`. Related: `rare` for least common. | reference/top.md |
| rare | Show least common values of a field. Inverse of `top`. `| rare 10 user`. Same output format as `top` — count + percent. | reference/rare.md |
| addtotals | Add a total across all numeric fields for each row. `| addtotals fieldname=total`. `row=t` adds row totals, `col=t` adds column totals. | reference/addtotals.md |
| addcoltotals | Add a summary row with column totals at the bottom. `| addcoltotals`. Useful for table footers. | reference/addcoltotals.md |
| mstats | Calculate statistics on metric data in metric indexes. `| mstats avg(cpu.idle) WHERE index=metrics span=5m`. Much faster than `stats` for metrics — uses the metric store directly. | reference/mstats.md |

### Multivalue

| Command | When to use | Ref |
|---|---|---|
| mvexpand | Expand a multivalue field into separate events — one row per value. `| mvexpand tags`. Essential after `spath` array extraction. Pair with `stats` to aggregate the expanded values. | reference/mvexpand.md |
| makemv | Split a single-value field into multivalue using a delimiter. `| makemv delim="," tags`. Also supports `tokenizer="regex"` mode. Warning: for sparklines, use `stats sparkline()` instead (trap #19). | reference/makemv.md |
| mvcombine | Inverse of `mvexpand` — combine rows with the same values into a multivalue field. `| mvcombine delim="," src`. Groups rows that differ only in the specified field. | reference/mvcombine.md |
| nomv | Convert a multivalue field to single-value at search time. Values are concatenated with a space. Useful before output to systems that don't support multivalue. | reference/nomv.md |
| strcat | Concatenate string values into a new field. `| strcat src ":" dest combined`. Simpler than `| eval combined = src . ":" . dest` for basic concatenation. | reference/strcat.md |

### Subsearches & combining

| Command | When to use | Ref |
|---|---|---|
| append | Stack results from a subsearch as additional rows. `| append [search ...]`. Results are simply added below — no field matching. For side-by-side field merging, use `appendcols`. | reference/append.md |
| appendcols | Add fields from a subsearch as new columns — first result to first result. `| appendcols [search ... | stats count]`. Useful for adding a single computed value as a column to existing results. | reference/appendcols.md |
| appendpipe | Apply a subpipeline to current results and append the output. `| appendpipe [stats count]`. Like `append` but operates on current results, not a new search. Useful for adding summary rows. | reference/appendpipe.md |
| join | Combine main search with subsearch results like SQL join. `| join type=left src [search ...]`. Default is inner join. Default max=50000 — use `max=0` for unlimited. Prefer stats-based correlation over `join` when possible. | reference/join.md |
| selfjoin | Join results with themselves. `| selfjoin src`. Finds events that share the same value in the join field. Useful for self-referencing correlation (e.g., "find IPs that appear in both allow and deny"). | reference/selfjoin.md |
| union | Combine results from multiple datasets (like SQL UNION ALL). `| union [search ...] [search ...]`. Alternative to `append` when combining more than two result sets. | reference/union.md |
| multisearch | Run multiple streaming searches simultaneously and combine results. `| multisearch [search ...] [search ...]`. More efficient than `append` for multiple searches — runs them in parallel. | reference/multisearch.md |
| set | Perform set operations on subsearches: union, diff, intersect. `| set diff [search A] [search B]`. Finds events in A but not in B. Useful for change detection. | reference/set.md |
| diff | Return the difference between two search results. Compares field-by-field and shows which values changed. Pair with `| loadjob` to compare current vs. previous run. | reference/diff.md |
| map | Loop over search results, running a templated search for each row. `| map search="search index=main src=$src$"`. Like a for-each loop. Expensive — use for targeted follow-up searches, not large datasets. | reference/map.md |
| return | Specify which values to return from a subsearch. `| return 5 $src` returns the first 5 `src` values formatted for the outer search. Cleaner output than `| fields src | format`. | reference/return.md |
| format | Format subsearch results into a single string suitable for the outer search. `| format`. Auto-generates `(field1="val1") OR (field1="val2")` syntax. Used implicitly in subsearches; explicit when customizing output. | reference/format.md |

### Lookups & I/O

| Command | When to use | Ref |
|---|---|---|
| lookup | Enrich events with values from a lookup table. `| lookup geo_ip ip AS src OUTPUT city, country`. Matches on a key field and adds output fields. Automatic lookups run without explicit `| lookup`. | reference/lookup.md |
| inputlookup | Load a lookup table as search results. `| inputlookup customers.csv`. Supports `WHERE` for server-side filtering. `append=t` adds to existing results. Use for reference data exploration. | reference/inputlookup.md |
| outputlookup | Write search results to a lookup table. `| outputlookup threat_summary.csv`. Creates or overwrites a CSV or KV store collection. `append=t` adds rows instead of replacing. | reference/outputlookup.md |
| inputcsv | Load results from a CSV file in dispatch directory. `| inputcsv myfile.csv`. Less common than `inputlookup` — mainly for loading previously exported search results. | reference/inputcsv.md |
| outputcsv | Write results to a CSV file in dispatch directory. `| outputcsv myfile.csv`. For persistent storage, prefer `outputlookup`. | reference/outputcsv.md |
| outputtext | Output `_raw` text of results into the `_xml` field. Specialized export format. Rarely used directly. | reference/outputtext.md |

### Generating commands

| Command | When to use | Ref |
|---|---|---|
| makeresults | Generate N empty events for testing or mock data. `| makeresults count=100`. Creates events with only `_time`. Pair with `eval` to build synthetic data for dashboard development without real indexes. | reference/makeresults.md |
| gentimes | Generate time-range results. `| gentimes start=01/01/2026 end=01/31/2026 increment=1d`. Creates one event per time step. Useful for building date spines for timechart gap-filling. | reference/gentimes.md |
| loadjob | Load results from a previously completed search job. `| loadjob <sid>` or `| loadjob savedsearch="admin:search:MySavedSearch"`. Useful for comparing current vs. previous results with `diff`. | reference/loadjob.md |
| from | Retrieve data from a named dataset — data model, lookup, saved search, or table dataset. `| from datamodel:"Authentication" | search action=failure`. Cleaner alternative to `| datamodel` for CIM access. | reference/from.md |
| savedsearch | Run a saved search by name. `| savedsearch "My Saved Search"`. Results are inline — no need to run via scheduler. | reference/savedsearch.md |
| rest | Access Splunk REST API endpoints as search results. `| rest /services/server/info`. Returns JSON-like tabular data. Commonly blocked on Splunk Cloud (`rest` command is restricted). | reference/rest.md |
| metadata | Return metadata about indexes — list of sources, sourcetypes, or hosts. `| metadata type=sourcetypes index=main`. Fast — reads metadata, not events. Good for index discovery. | reference/metadata.md |
| dbinspect | Return info about a specified index — bucket count, event count, time ranges. `| dbinspect index=main`. Useful for capacity planning and index health checks. | reference/dbinspect.md |
| eventcount | Return the event count for indexes. `| eventcount summarize=false index=*`. Faster than `| metadata` when you only need counts. | reference/eventcount.md |
| walklex | List indexed terms or fields from the tsidx files. `| walklex index=main type=field`. Low-level index inspection — shows what's actually indexed. | reference/walklex.md |
| typeahead | Return typeahead suggestions for a prefix. `| typeahead prefix="error" count=10`. Used by the Splunk search bar UI — rarely called directly. | reference/typeahead.md |
| metasearch | Search event metadata (not event data). `| metasearch index=main sourcetype=syslog`. Faster than `| search` when you only need to know which indexes/sourcetypes exist. | reference/metasearch.md |

### Time & bucketing

| Command | When to use | Ref |
|---|---|---|
| bin | Group numeric or time values into discrete buckets. `| bin span=1h _time` or `| bin bins=10 bytes`. Alias: `bucket`. Essential for creating time-series data when not using `timechart`. | reference/bin.md |
| timewrap | Compare time periods by wrapping `timechart` output. `| timechart span=1d count | timewrap 1w`. Produces side-by-side columns for this-week vs last-week. Only valid after `timechart`. | reference/timewrap.md |
| makecontinuous | Fill gaps in a field to make it continuous. `| makecontinuous _time span=1h`. Ensures every time bucket has a row, even if count is 0. Used after `timechart`/`chart` for gap-free charts. | reference/makecontinuous.md |
| concurrency | Find concurrent events by duration. `| concurrency duration=duration`. Adds a `concurrency` field showing how many events overlap in time. Useful for capacity analysis. | reference/concurrency.md |
| localize | Return time ranges where search results were found. `| localize maxpause=30m`. Groups results into time windows separated by gaps. | reference/localize.md |
| overlap | Find events in a summary index that overlap in time or have missed events. Used with `collect`/`overlap` for summary index maintenance. | reference/overlap.md |

### Transaction & correlation

| Command | When to use | Ref |
|---|---|---|
| transaction | Group related events into transactions by shared field values. `| transaction session_id maxspan=1h`. Creates `duration` and `eventcount` fields. Slow and memory-intensive — prefer `stats` pattern (trap #18). | reference/transaction.md |
| searchtxn | Find transaction events matching constraints. `| searchtxn txn_type`. Searches within pre-defined transaction types. Less common than inline `transaction`. | reference/searchtxn.md |
| correlate | Calculate correlation between fields across events. `| correlate`. Produces a correlation matrix. Useful for finding which fields move together. | reference/correlate.md |
| associate | Identify correlations between fields. `| associate`. Similar to `correlate` but focused on field-pair association strength. | reference/associate.md |
| contingency | Build a contingency table for two fields. `| contingency src dest`. Shows co-occurrence counts. Also known as `counttable` or `ctable`. | reference/contingency.md |
| cofilter | Find how often field1 and field2 values co-occur. `| cofilter src dest`. Useful for network analysis — "which sources talk to which destinations?" | reference/cofilter.md |
| arules | Find association rules between field values. `| arules src,dest,action`. Market-basket-analysis style — "events with A and B also tend to have C." | reference/arules.md |

### Ordering & sorting

| Command | When to use | Ref |
|---|---|---|
| sort | Sort results by field values. `| sort 0 -count` sorts ALL results descending by count. Default limit is 10000 — always use `sort 0` for unlimited (trap #5). Supports `ip()`, `num()`, `str()` type hints. | reference/sort.md |

### Reporting & data reshaping

| Command | When to use | Ref |
|---|---|---|
| gauge | Transform results for Gauge chart display. `| gauge count 0 50 100 200`. Sets range markers. Used with `splunk.markergauge`/`splunk.fillergauge` viz types. | reference/gauge.md |
| xyseries | Convert `stats` output to a format suitable for charting. `| stats count by series_field x_field | xyseries x_field series_field count`. Pivots rows into columns. Inverse of `untable`. | reference/xyseries.md |
| untable | Convert a tabular format to a format similar to `stats` output. `| untable _time host count`. Inverse of `xyseries`. Useful for unpivoting wide tables into long format. | reference/untable.md |
| transpose | Swap rows and columns. `| transpose 5`. Converts up to N columns into rows. Useful for transposing a wide stats result into a vertical table. | reference/transpose.md |
| tojson | Convert events to JSON objects. `| tojson`. Creates a `_raw` field containing JSON representation. Useful for export to JSON-consuming systems. | reference/tojson.md |
| rangemap | Map numeric field values to named ranges. `| rangemap field=count low=0-10 mid=11-50 high=51-100`. Adds a `range` field. Useful for status classification. | reference/rangemap.md |

### Geo & location

| Command | When to use | Ref |
|---|---|---|
| geom | Add geographic data for choropleth map visualization. `| geom geo_countries featureIdField=country`. Adds polygon geometry for `splunk.choropleth.svg`. Required for geographic fill maps. | reference/geom.md |
| geomfilter | Filter geographic data to a bounding box for choropleth. `| geomfilter min_x=-130 min_y=20 max_x=-60 max_y=55`. Clips a choropleth to a region (e.g., continental US). | reference/geomfilter.md |
| geostats | Aggregate statistics into geographic bins for map visualization. `| geostats latfield=lat longfield=lon count`. REQUIRED for `splunk.map` bubble layers — map viz won't render without `geostats`. | reference/geostats.md |
| iplocation | Extract geographic info from IP addresses. `| iplocation src`. Adds `City`, `Country`, `Region`, `lat`, `lon` fields. Uses MaxMind GeoIP database. | reference/iplocation.md |

### Accelerated search & data models

| Command | When to use | Ref |
|---|---|---|
| tstats | Search indexed fields and data model accelerations — orders of magnitude faster than `stats`. `| tstats count WHERE index=main by sourcetype`. Limited aggregations (count, dc, sum, avg, min, max, values). No `eval` inside — post-process after. | reference/tstats.md |
| datamodel | Examine or search a data model dataset. `| datamodel Authentication search`. Access CIM-normalized data. Prefer `| from datamodel:` for simpler syntax. | reference/datamodel.md |
| datamodelsimple | Simplified data model access. Returns information about a data model object. Less common than `datamodel` or `from`. | reference/datamodelsimple.md |
| tscollect | Write results into tsidx files for later use by `tstats`. `| tscollect`. Creates accelerated summaries. Used in scheduled searches to build tstats-searchable data. | reference/tscollect.md |
| pivot | Run pivot searches against a data model dataset. `| pivot Authentication count(Authentication) AS count SPLITBY action`. UI-friendly alternative to `tstats` for data model queries. | reference/pivot.md |
| sichart | Summary-indexing version of `chart`. `| sichart count by sourcetype`. Computes partial results for later aggregation via `chart`. Used in scheduled searches for report acceleration. | reference/sichart.md |
| sistats | Summary-indexing version of `stats`. `| sistats count by src`. Computes partial results for later aggregation via `stats`. | reference/sistats.md |
| sitimechart | Summary-indexing version of `timechart`. `| sitimechart span=1h count`. Computes partial results for later aggregation via `timechart`. | reference/sitimechart.md |
| sitop | Summary-indexing version of `top`. `| sitop src_ip`. Computes partial results for later aggregation via `top`. | reference/sitop.md |
| sirare | Summary-indexing version of `rare`. `| sirare user`. Computes partial results for later aggregation via `rare`. | reference/sirare.md |

### Anomaly detection & prediction

| Command | When to use | Ref |
|---|---|---|
| anomalies | Compute an "unexpectedness" score for each event based on field values. `| anomalies`. Events with high scores are unusual. Good for broad anomaly scanning. | reference/anomalies.md |
| anomalousvalue | Find and summarize irregular or uncommon field values. `| anomalousvalue`. Scores each field value by how unusual it is across results. | reference/anomalousvalue.md |
| anomalydetection | Identify anomalous events by computing per-event probability and detecting unusually small probabilities. More sophisticated than `anomalies` — uses probabilistic model. | reference/anomalydetection.md |
| cluster | Group similar events together based on text similarity. `| cluster`. Assigns a `cluster_count` field. Useful for log deduplication and pattern discovery. | reference/cluster.md |
| kmeans | Perform k-means clustering on numeric fields. `| kmeans k=5 field1, field2`. Assigns each event to a cluster. Useful for segmentation analysis. | reference/kmeans.md |
| outlier | Remove or flag outlying numeric values. `| outlier`. Removes events where numeric fields are statistical outliers. Useful for cleaning noisy data before visualization. | reference/outlier.md |
| predict | Predict future values using time series algorithms. `| predict count`. Supports multiple algorithms (LLP, LLT, LLP5, LL). Adds predicted value and confidence bounds. | reference/predict.md |
| trendline | Compute moving averages of fields. `| trendline sma5(count) AS trend`. Supports `sma` (simple), `ema` (exponential), `wma` (weighted). Useful for smoothing noisy time series. | reference/trendline.md |
| x11 | Decompose time series into trend, seasonal, and residual components. `| x11 count`. Removes seasonal patterns to expose the underlying trend. | reference/x11.md |
| autoregress | Set up data for autoregression — copies prior event field values into current event. `| autoregress src p=1-3`. Creates `src_p1`, `src_p2`, `src_p3` lag fields. | reference/autoregress.md |
| accum | Keep a running total of a numeric field. `| accum count AS cumulative`. Simpler alternative to `streamstats sum()` for cumulative sums. | reference/accum.md |
| delta | Compute the difference between current and previous values. `| delta count AS change`. Simpler alternative to `streamstats` for single-field deltas. | reference/delta.md |

### Output & alerting

| Command | When to use | Ref |
|---|---|---|
| collect | Write search results to a summary index. `| collect index=summary`. Events are stored with original `_time`. Used in scheduled searches for report acceleration. Pair with `overlap` for integrity checks. | reference/collect.md |
| mcollect | Write search results as metrics to a metric index. `| mcollect index=my_metrics`. Converts events to metric data points. For metric indexes only. | reference/mcollect.md |
| meventcollect | Write search results as metric events to a metric index on the indexers. More efficient than `mcollect` for large-scale metric ingestion. | reference/meventcollect.md |
| sendemail | Email search results. `| sendemail to="user@example.com" subject="Alert"`. Supports HTML body, PDF/CSV attachments. Used in alert actions. | reference/sendemail.md |
| sendalert | Invoke a custom alert action. `| sendalert my_action`. Triggers the named alert action with current results as context. | reference/sendalert.md |
| delete | Delete events from an index. `| delete`. Marks events as deleted (not physically removed until bucket rolls). Requires `can_delete` role. Dangerous — no undo. | reference/delete.md |

### Field discovery & typing

| Command | When to use | Ref |
|---|---|---|
| fieldsummary | Generate summary statistics for all fields — count, distinct_count, min, max, mean, stdev. `| fieldsummary`. Returns one row per field. Great for data exploration and understanding field coverage. | reference/fieldsummary.md |
| analyzefields | Analyze which fields predict another field's values. `| analyzefields classfield=status`. Returns correlation strength per field. Useful for feature selection in detection engineering. | reference/analyzefields.md |
| findtypes | Generate suggested event types based on current results. `| findtypes`. Helps bootstrap knowledge objects. | reference/findtypes.md |
| typer | Calculate event types for results. `| typer`. Adds a `eventtype` field based on configured event type definitions. | reference/typer.md |
| typelearner | Generate suggested event types. Deprecated — use `findtypes` instead. | reference/typelearner.md |

### Subsystem & admin

| Command | When to use | Ref |
|---|---|---|
| localop | Force all subsequent commands to run locally (not on remote peers). `| localop | stats count`. Useful in distributed environments for troubleshooting. | reference/localop.md |
| redistribute | Enable parallel reduce for high-cardinality datasets. `| redistribute by src | stats count by src`. Speeds up searches by distributing transforming commands across indexers. | reference/redistribute.md |
| rtorder | Buffer real-time events and emit them in ascending time order. Used in real-time searches to ensure time-ordered processing. | reference/rtorder.md |
| script | Run an external Perl or Python script as part of the search. `| script python my_script.py`. Also invoked as `run`. External commands must be configured in `commands.conf`. | reference/script.md |
| audit | Return audit trail events from the local audit index. `| audit`. Shows who searched what, when. | reference/audit.md |
| history | Return search history. `| history`. Shows past searches run by the current user. | reference/history.md |
| mpreview | Preview raw metric data points from a metric index. `| mpreview index=my_metrics`. Shows the underlying metric records. | reference/mpreview.md |
| msearch | Alias for `mpreview`. Same functionality. | reference/msearch.md |

### Misc

| Command | When to use | Ref |
|---|---|---|
| abstract | Produce a summary snippet of each event's text. `| abstract maxlines=3`. Truncates `_raw` to a short excerpt. Useful for creating event previews. | reference/abstract.md |
| addinfo | Add fields with info about the current search — `info_min_time`, `info_max_time`, `info_search_time`, `info_sid`. Useful for making searches aware of their own time range. | reference/addinfo.md |
| bucketdir | Replace filenames with higher-level directory grouping. `| bucketdir source`. Groups by directory path instead of individual files. | reference/bucketdir.md |
| folderize | Create higher-level grouping by replacing filenames with directories. Similar to `bucketdir`. `| folderize`. | reference/folderize.md |
| foreach | Run a templated subsearch for each field matching a wildcard. `| foreach * [eval <<FIELD>> = if('<<FIELD>>' > 0, '<<FIELD>>', null())]`. Powerful for applying transforms across many fields. | reference/foreach.md |
| ctable | Alias for `contingency`. Builds contingency table for two fields. | reference/ctable.md |
