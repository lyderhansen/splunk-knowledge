---
name: ds-spl
description: Comprehensive SPL syntax reference and gotchas for Splunk Dashboard Studio. Covers eval, stats, where, rex, tstats, lookups, subsearches, timechart, makeresults patterns, dotted-field quoting, case() default semantics, multiselect IN with token quoting, time-bound search hygiene, and the silent-fail traps that produce empty panels. Use when writing, reviewing, or debugging SPL inside dashboard data sources, or when ds-data-explore / ds-mock / ds-create / ds-update needs SPL grammar detail. Pairs with (does NOT replace) ds-ref-syntax (JSON schema), ds-pick-viz (viz selection), and ds-viz-* (per-viz option fields).
---

# ds-spl — Splunk SPL syntax reference

Comprehensive reference for writing correct, performant SPL. Consult this skill whenever writing or reviewing SPL queries.

---

## 1. Nested / JSON Field Names (Dotted Fields)

**Critical rule:** In `eval`, `where`, `if`, `case`, `search`, and `match` — wrap dotted field names in **single quotes**.

```spl
| eval status=if('properties.status.errorCode'=0, "Success", "Failed")
| where 'requestParameters.bucketName'="prod-data"
| eval user='userIdentity.userName'
| search 'eventData.protocol'="tcp"
```

**Without quotes, Splunk interprets dots as sub-search operators and silently returns wrong results.**

Commands that handle dotted fields **without** quotes: `stats`, `table`, `fields`, `rename`, `sort`, `dedup`, `values`, `chart`, `timechart`.

```spl
| stats count by properties.status.errorCode
| table userIdentity.userName, eventName
| rename requestParameters.bucketName AS bucket
```

### JSON arrays (multivalue indexed fields)

JSON arrays like `resources{}.type` use `{}` notation. In `spath`-extracted data:

```spl
| spath input=_raw path=resources{}.type output=resource_type
| mvexpand resource_type
| stats count by resource_type
```

For `{}` fields already extracted, use `mvindex` or `mvfilter`:

```spl
| eval first_resource='resources{}.type'
| where mvfind('resources{}.type', "S3") >= 0
```

### JSON functions in eval

Full suite for building, extracting, and manipulating JSON within SPL:

```spl
-- Create JSON
| eval obj = json_object("name", user, "ip", src, "count", count)
| eval arr = json_array("val1", "val2", "val3")

-- Validate
| eval is_json = json_valid(_raw)
| eval validated = json(_raw)                   -- returns value if valid, NULL if not

-- Extract values (path syntax: "key", "{0}" for array index, "{}.key" for all items)
| eval val = json_extract(payload, "user.name")
| eval first = json_extract(payload, "items{0}.id")
| eval all_names = json_extract(payload, "items{}.name")
| eval deep = json_extract(payload, "data{2}.bridges{0}.length")

-- Extract with literal dots (keys containing dots like "system.splunk.path")
| eval val = json_extract_exact(payload, "system.splunk.path")

-- Get keys
| eval keys = json_keys(payload)                -- returns JSON array of top-level keys

-- Set/update values (dots = nested path)
| eval updated = json_set(payload, "status", "active", "meta.updated", now())

-- Set with literal dots (key IS "meta.updated", not nested)
| eval updated = json_set_exact(payload, "meta.updated", now())

-- Append to array (nests arrays as single element: ["a","b",["c","d"]])
| eval result = json_append(payload, "tags", "new_tag")

-- Extend array (flattens: ["a","b","c","d"])
| eval result = json_extend(payload, "tags", json_array("c", "d"))

-- Convert between JSON arrays and multivalue fields
| eval mv_field = json_array_to_mv(json_arr)
| eval json_arr = mv_to_json_array(mv_field)
```

**Key gotchas:**

- `json_extract` path uses `{}` for array traversal — `{0}` = first element, `{}` = all elements
- `json_extract` interprets dots as nesting — use `json_extract_exact` for literal dots in keys
- `json_append` vs `json_extend` — append nests arrays, extend flattens them
- `json_keys` only works on objects, NOT arrays

### lookup() as eval function

Inline CSV lookup within eval — returns JSON:

```spl
| eval result = json_extract(
    lookup("customer_lookup.csv",
           json_object("customer_id", customer_id),
           json_array("customer_name", "tier")),
    "customer_name")
```

---

## 2. Quoting Rules


| Context                                | Single Quotes `'...'`  | Double Quotes `"..."`  | No Quotes            |
| -------------------------------------- | ---------------------- | ---------------------- | -------------------- |
| **Field names** (dotted/special chars) | `'src.ip'`             | never                  | simple fields: `src` |
| **String values** in eval/where        | never                  | `"Success"`            | never                |
| **String values** in search            | never                  | `"error message"`      | single word: `error` |
| **Field=value** in search              | `'nested.field'="val"` | `field="multi word"`   | `field=simple`       |
| **Variable references** in eval        | `'fieldname'`          | never (it's a literal) | `fieldname`          |


**Common mistake:** Using double quotes for field names in eval — `"fieldname"` is a **string literal**, not a field reference.

```spl
| eval x = status          -- field reference (OK for simple names)
| eval x = 'status'        -- field reference (always works)
| eval x = "status"        -- string literal "status", NOT a field reference
```

---

## 3. eval Functions & Gotchas

### Null handling

`null()` is not the same as empty string `""`. Many fields that don't exist are null, not empty.

```spl
| eval has_value = if(isnotnull(fieldname), "yes", "no")
| eval safe_val = coalesce(field1, field2, "default")
| where isnotnull(user)
```

**Gotcha:** `field!=""` does NOT match null values. Use `isnotnull(field)` or `field=`*.

```spl
| where isnotnull(src) AND src!=""
| search src=*
```

### Type coercion

Splunk fields are strings by default. Use `tonumber()` for math:

```spl
| eval bytes_mb = tonumber(bytes) / 1024 / 1024
| where tonumber(status) >= 400
```

`tostring()` formats:

```spl
| eval formatted = tostring(bytes, "commas")         -- 1,234,567
| eval hex_val = tostring(num, "hex")                -- 0xFF
| eval dur = tostring(seconds, "duration")           -- 01:23:45
```

### String functions

```spl
| eval lower_user = lower(user)
| eval domain = mvindex(split(email, "@"), 1)
| eval short = substr(hash, 1, 8)
| eval has_admin = if(like(user, "%admin%"), 1, 0)
| eval match = if(match(url, "^/api/v\d+/"), 1, 0)
| eval replaced = replace(msg, "(\d{4})-(\d{2})", "\2/\1")
| eval len = len(fieldname)
| eval trimmed = trim(field, " \t")
| eval uri_parts = urldecode(raw_url)
```

### Conditional logic

```spl
| eval severity = case(
    level >= 90, "critical",
    level >= 70, "high",
    level >= 40, "medium",
    1==1, "low"
)

| eval category = case(
    cidrmatch("10.0.0.0/8", src), "internal",
    cidrmatch("172.16.0.0/12", src), "internal",
    cidrmatch("192.168.0.0/16", src), "internal",
    1==1, "external"
)
```

**Gotcha:** `case()` evaluates top-down and returns the first match. Returns NULL if no condition matches. Use `1==1` or `true()` as the default.

#### The three `case()` default traps (all three silently never fire)

`case()` expects pairs `<condition>, <value>` separated by commas. Three variants look
like defaults but are not; all three cause the default branch to silently never fire.
Every time this project has been bitten by it, the symptom is the same: mock-data KPIs
render the wrong number, or the "All" option in a dropdown returns blank while the
specific options work.


| Written form                              | What Splunk actually does                                                                                                                                                                                                                                                                                                                                                                                     | Fix                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `…, true = "low"`                         | Reads `true` as a **field name**, compares it to the string `"low"`. Since no row has a field named `true`, the comparison is NULL → never matches. Also: Splunk Cloud sometimes parses `true` as a non-existent command and throws `External search command 'true' not found`.                                                                                                                               | `…, true(), "low"` or `…, 1==1, "low"` |
| `…, true() = "low"`                       | `true()` is a valid function that returns boolean `true`. `true() = "low"` is a **comparison expression**: "does `true` equal the string `low`?" — which is never true. The clause compiles clean, but the default branch still never fires. This is the *looks-right-but-isn't* variant; it has hit this project multiple times because the parens trick the eye into reading it as a correct function call. | `…, true(), "low"` (remove the `=`)    |
| `case(cond1, v1, cond2, v2)` (no default) | Splunk returns NULL for any row that doesn't match `cond1` or `cond2`. Not itself a trap — it is correct SPL — but combined with `                                                                                                                                                                                                                                                                            | table`or`                              |


**The one rule:** inside `case()`, the separator between a condition and its value is
always a **comma**. Never `=`. `true` and `true()` as the condition are fine; the `=`
after them is what breaks everything.

Detection: `splunk-skills/scripts/validate_dashboard.py` flags both `,true=` and `,true()=`
as `ERROR`. If you see either in a `data_sources.*.options.query`, rewrite to `,true(),`.

### Numeric functions

```spl
| eval rounded = round(avg_time, 2)
| eval pct = round(count / total * 100, 1)
| eval abs_diff = abs(expected - actual)
| eval log_val = log(bytes, 2)                -- log base 2
| eval clamped = max(0, min(value, 100))       -- clamp 0-100
| eval rand_id = random() % 1000
```

### printf (C-style string formatting)

```spl
| eval msg = printf("User %s had %d events (%.1f%%)", user, count, pct)
| eval formatted = printf("%'d", 12345)          -- "12,345" (thousands separator)
| eval padded = printf("%05d", id)                -- "00042" (zero-padded)
| eval hex = printf("0x%x", num)                  -- "0xff"
| eval width = printf("%-20s %d", name, count)    -- left-justified, 20 chars wide
| eval dynamic = printf("%.*f", precision, value)  -- dynamic precision via field
```

Specifiers: `%d` (int), `%f` (float), `%s` (string), `%e` (scientific), `%x` (hex), `%o` (octal), `%c` (unicode char). Use `%%` for literal `%`.

### in() function

```spl
| eval is_target = if(in(user, "alex.miller", "jessica.brown", "brooklyn.white"), 1, 0)
| where in(action, "deny", "blocked", "dropped")
```

**Gotcha:** `in()` requires exact string values — no wildcards. Must be wrapped in `if()` when used in eval.

### validate (opposite of case)

Returns the error message for the **first FALSE** condition. NULL if all pass:

```spl
| eval error = validate(
    isnotnull(user), "Missing user",
    len(user) > 2, "User too short",
    isnotnull(src), "Missing source IP"
)
| where isnotnull(error)
```

### searchmatch (inline search test)

```spl
| eval is_attack = if(searchmatch("action=deny src=185.220.*"), "yes", "no")
```

Must be wrapped in `if()`. Useful for complex event classification.

### nullif

Returns NULL if X equals Y, otherwise returns X:

```spl
| eval clean_status = nullif(status, "-")         -- treat "-" as null
| eval non_zero = nullif(count, 0)
```

### NaN handling

NaN is both a number AND a string in Splunk. `isnum()` and `isstr()` both return TRUE:

```spl
-- Reliable NaN test:
| eval is_nan = if(isnum(value), match(value, "NaN"), false())
```

### cidrmatch

```spl
| eval network = case(
    cidrmatch("10.10.0.0/16", src_ip), "Boston",
    cidrmatch("10.20.0.0/16", src_ip), "Atlanta",
    cidrmatch("10.30.0.0/16", src_ip), "Austin",
    cidrmatch("172.16.1.0/24", src_ip), "DMZ",
    1==1, "External"
)
| where cidrmatch("10.0.0.0/8", src)
```

---

## 4. where vs search


| Feature        | `search`                              | `where`                                             |
| -------------- | ------------------------------------- | --------------------------------------------------- |
| Wildcards      | `field=*error*`                       | `like(field, "%error%")` or `match(field, "error")` |
| Boolean        | `AND`, `OR`, `NOT`                    | `AND`, `OR`, `NOT` (also `&&`, `                    |
| Null check     | `field=`* (exists)                    | `isnotnull(field)`                                  |
| Not equal      | `field!=value` (still returns nulls!) | `field!="value"` (excludes nulls)                   |
| Comparison     | only `=` and `!=`                     | `<`, `>`, `<=`, `>=`, `=`, `!=`, `LIKE`             |
| Field vs field | not supported                         | `where src_ip = dest_ip`                            |
| Functions      | not supported                         | `where len(url) > 100`                              |


**Critical gotcha with `!=` in search:**

```spl
| search status!=200          -- returns events where status exists AND is not 200
                               -- BUT also returns events where status is null!
| where status!=200           -- only returns events where status exists AND is not 200
                               -- null values are excluded
```

Safe pattern for "field is not X":

```spl
| where isnotnull(status) AND status!=200
```

### Wildcards

```spl
| search user="admin*"                          -- starts with admin
| search src_ip="10.10.*"                       -- prefix match
| where like(user, "admin%")                    -- % = any chars, _ = single char
| where match(user, "^admin\d+$")               -- regex
| where like(host, "DC-%-01")                   -- pattern: DC-BOS-01, DC-ATL-01
```

---

## 5. stats / chart / timechart

### stats aggregations

```spl
| stats count, dc(src) AS unique_sources, values(user) AS users,
        avg(duration) AS avg_dur, median(duration) AS med_dur,
        min(duration) AS min_dur, max(duration) AS max_dur,
        sum(bytes) AS total_bytes, perc95(duration) AS p95_dur,
        earliest(_time) AS first_seen, latest(_time) AS last_seen,
        list(action) AS all_actions
    by src_ip
```

**Key aggregations:**


| Function          | Returns                   | Notes                                          |
| ----------------- | ------------------------- | ---------------------------------------------- |
| `count`           | number of events          | `count(field)` counts non-null only            |
| `dc(field)`       | distinct count            | approximate for large datasets                 |
| `values(field)`   | multivalue, sorted unique | `list(field)` keeps duplicates and order       |
| `earliest(field)` | first value by _time      | `first(field)` = first encountered (arbitrary) |
| `latest(field)`   | last value by _time       | `last(field)` = last encountered (arbitrary)   |
| `perc95(field)`   | 95th percentile           | also `perc50`, `perc99`, etc.                  |
| `range(field)`    | max - min                 |                                                |
| `stdev(field)`    | standard deviation        |                                                |


### eventstats vs stats

`stats` removes all fields and produces summary rows. `eventstats` **adds** aggregated fields to each event (preserves all events):

```spl
| eventstats avg(duration) AS avg_duration by sourcetype
| eval slow = if(duration > avg_duration * 2, "yes", "no")
```

### streamstats

Running calculations over events (ordered by _time):

```spl
| sort 0 _time
| streamstats count AS event_num
| streamstats window=5 avg(response_time) AS rolling_avg
| streamstats sum(bytes) AS cumulative_bytes by src_ip
| streamstats current=f latest(status) AS prev_status
```

### timechart

```spl
| timechart span=1h count by sourcetype
| timechart span=5m avg(cpu_load_percent) by host limit=10 useother=f
| timechart span=1d dc(src) AS unique_sources
| timechart span=15m perc95(response_time) AS p95
```

**Span values:** `s` (sec), `m` (min), `h` (hour), `d` (day), `w` (week), `mon` (month)

`**limit` and `useother`:** `timechart` splits by top N series (default 10). Set `limit=0` for unlimited, `useother=f` to hide "OTHER".

### chart

```spl
| chart count by status, sourcetype
| chart avg(duration) over hour by day_of_week
| chart sparkline(count, 1h) AS trend, count by sourcetype
```

---

## 6. Time Functions

### strftime (epoch -> formatted string)

```spl
| eval formatted = strftime(_time, "%Y-%m-%d %H:%M:%S")
| eval date_only = strftime(_time, "%Y-%m-%d")
| eval hour = strftime(_time, "%H")
| eval day_name = strftime(_time, "%A")          -- Monday, Tuesday...
| eval month_name = strftime(_time, "%B")        -- January, February...
| eval iso8601 = strftime(_time, "%Y-%m-%dT%H:%M:%S%z")
```

**Common format codes:**


| Code | Meaning            | Example    |
| ---- | ------------------ | ---------- |
| `%Y` | 4-digit year       | 2026       |
| `%m` | Month (01-12)      | 01         |
| `%d` | Day (01-31)        | 15         |
| `%H` | Hour 24h (00-23)   | 14         |
| `%I` | Hour 12h (01-12)   | 02         |
| `%M` | Minute (00-59)     | 30         |
| `%S` | Second (00-59)     | 45         |
| `%p` | AM/PM              | PM         |
| `%A` | Weekday name       | Monday     |
| `%a` | Weekday abbrev     | Mon        |
| `%B` | Month name         | January    |
| `%b` | Month abbrev       | Jan        |
| `%z` | Timezone offset    | +0000      |
| `%Z` | Timezone name      | UTC        |
| `%s` | Epoch seconds      | 1767225600 |
| `%e` | Day (1-31, no pad) | 5          |
| `%j` | Day of year        | 042        |
| `%w` | Weekday (0=Sun)    | 1          |


### strptime (string -> epoch)

```spl
| eval epoch = strptime(date_field, "%Y-%m-%d %H:%M:%S")
| eval epoch = strptime("2026-01-15 14:30:00", "%Y-%m-%d %H:%M:%S")
```

### relative_time

```spl
| eval yesterday = relative_time(now(), "-1d@d")
| eval start_of_week = relative_time(now(), "@w0")
| eval one_hour_ago = relative_time(now(), "-1h")
| where _time > relative_time(now(), "-24h")
```

**Snap-to syntax:** `@` snaps to boundary. Offset is processed FIRST, then snap (always rounds backwards).

**Time unit aliases:**


| Unit    | Aliases                                   |
| ------- | ----------------------------------------- |
| second  | `s`, `sec`, `secs`, `second`, `seconds`   |
| minute  | `m`, `min`, `mins`, `minute`, `minutes`   |
| hour    | `h`, `hr`, `hrs`, `hour`, `hours`         |
| day     | `d`, `day`, `days`                        |
| week    | `w`, `week`, `weeks`                      |
| month   | `mon`, `month`, `months`                  |
| quarter | `q`, `qtr`, `qtrs`, `quarter`, `quarters` |
| year    | `y`, `yr`, `yrs`, `year`, `years`         |


```
-1h          1 hour ago (exactly)
-30m         30 minutes ago
-1d@d        start of yesterday (midnight) — offset first, then snap
@d           start of today (midnight)
+1d@d        start of tomorrow
-7d@d        7 days ago at midnight
@w0          start of this week (Sunday)
@w1          start of this week (Monday) ... @w6 = Saturday
@mon         start of this month
-1mon@mon    start of last month
@q           start of current quarter (Jan 1, Apr 1, Jul 1, Oct 1)
@y           start of this year
@d-2h        midnight today, then subtract 2h = 10 PM yesterday (chaining)
```

**Key behaviors:**

- Time modifiers in SPL (`earliest`/`latest`) override the Time Range Picker
- `earliest=1` = UNIX epoch start (all time); `earliest=0` = earliest event in data
- Subsearch time ranges are independent of the outer search (unless set via Time Range Picker)
- `_index_earliest`/`_index_latest` = search by index time (when indexed, not event time)

### Time comparisons

```spl
| eval duration_sec = latest_time - earliest_time
| eval duration_min = round((latest_time - earliest_time) / 60, 1)
| eval age_days = round((now() - _time) / 86400, 1)
| eval is_recent = if(_time > relative_time(now(), "-1h"), "yes", "no")
```

---

## 7. Subsearches

Subsearches run first and return results that are inlined into the outer search. **Max 60 seconds, max 50,000 results by default.**

```spl
index=fake_tshrt sourcetype="FAKE:cisco:asa" action=deny
    [search index=fake_tshrt demo_id=exfil | dedup src | fields src]
```

The inner search returns a list of `src` values, which becomes: `(src="10.10.30.55" OR src="185.220.101.42" OR ...)`.

### format command (customize subsearch output)

```spl
index=fake_tshrt
    [search index=fake_tshrt demo_id=exfil
     | stats dc(sourcetype) by src
     | where 'dc(sourcetype)' > 3
     | fields src
     | format]
```

### return command (controlled field output)

```spl
index=fake_tshrt sourcetype="FAKE:cisco:asa"
    [search index=fake_tshrt demo_id=exfil earliest=-1h
     | head 1
     | return 1 $src]
```

`return N $field` returns the first N results, renaming to `search` format.

### Subsearch alternatives (better performance)

For large datasets, prefer `join`, `lookup`, or `map` over subsearches:

```spl
-- join (like SQL inner join, limited to 50K results by default)
index=fake_tshrt sourcetype="FAKE:cisco:asa"
| join src [search index=fake_tshrt demo_id=exfil | dedup src | fields src]

-- Better: use stats + eventstats pattern
index=fake_tshrt (sourcetype="FAKE:cisco:asa" OR demo_id=exfil)
| eventstats dc(demo_id) AS has_exfil by src
| where has_exfil > 0 AND sourcetype="FAKE:cisco:asa"

-- OR use lookup for static lists
| inputlookup threat_ips.csv
| rename ip AS src
| join src [search index=fake_tshrt sourcetype="FAKE:cisco:asa"]
```

### Subsearch limits


| Setting         | Default    | Notes                             |
| --------------- | ---------- | --------------------------------- |
| `maxtime`       | 60 seconds | Subsearch timeout                 |
| `maxout`        | 50,000     | Max results from subsearch        |
| `maxresultrows` | 50,000     | Max rows returned to outer search |


---

## 8. Multivalue Fields

### Creating multivalue fields

```spl
| eval mv_field = mvappend(field1, field2, field3)
| eval parts = split(url, "/")
| makemv delim="," tags
| makemv tokenizer="(\w+@\w+\.\w+)" _raw       -- regex-based split
```

### Accessing multivalue fields

```spl
| eval first = mvindex(parts, 0)
| eval last = mvindex(parts, -1)
| eval subset = mvindex(parts, 1, 3)             -- index 1 to 3
| eval count = mvcount(mv_field)
| eval found = mvfind(tags, "security")           -- returns index or null
| eval joined = mvjoin(values, ", ")
```

### Filtering and transforming

```spl
| eval critical = mvfilter(match(alerts, "critical|high"))
| eval unique = mvdedup(mv_field)
| eval sorted = mvsort(mv_field)
| mvexpand tags                                    -- one row per value
```

### Stats with multivalue

```spl
| stats values(sourcetype) AS sourcetypes, dc(sourcetype) AS type_count by demo_id
| eval sourcetype_list = mvjoin(sourcetypes, ", ")
```

---

## 9. rex (Field Extraction via Regex)

### Named capture groups

```spl
| rex field=_raw "user=(?<username>\w+)"
| rex field=url "\/api\/v(?<api_version>\d+)\/"
| rex field=email "(?<user_part>[^@]+)@(?<domain>[^\"]+)"
```

### sed mode (replacement)

```spl
| rex field=msg mode=sed "s/\d{3}-\d{2}-\d{4}/XXX-XX-XXXX/g"    -- mask SSN
| rex field=src mode=sed "s/(\d+\.\d+\.\d+\.)\d+/\1xxx/g"        -- mask last octet
```

### Multiple extractions from same field

```spl
| rex field=_raw "src=(?<src_ip>\d+\.\d+\.\d+\.\d+):(?<src_port>\d+)"
| rex field=_raw "dst=(?<dst_ip>\d+\.\d+\.\d+\.\d+):(?<dst_port>\d+)"
```

### max_match (extract all occurrences)

```spl
| rex field=_raw max_match=0 "(?<all_ips>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
```

`max_match=0` extracts ALL matches into a multivalue field. Default is `max_match=1` (first match only).

---

## 10. Lookups

### lookup (enrich events)

```spl
| lookup customer_lookup customer_id OUTPUT customer_name, customer_tier
| lookup geo_ip_lookup ip AS src OUTPUT city, country, lat, lon
```

### inputlookup / outputlookup

```spl
| inputlookup customer_lookup.csv
| inputlookup customer_lookup.csv WHERE customer_tier="VIP"
| inputlookup append=t second_lookup.csv

-- Save results to lookup
| stats count by src_ip, action
| outputlookup threat_summary.csv
```

### Automatic lookups

Defined in `transforms.conf` + `props.conf` — run automatically at search time. No explicit `| lookup` needed. Configure via:

```ini
# transforms.conf
[customer_lookup]
filename = customer_lookup.csv
match_type = WILDCARD(customer_id)

# props.conf
[source::...]
LOOKUP-customers = customer_lookup customer_id OUTPUT customer_name
```

### KV Store lookups

```spl
| inputlookup kvstore_collection
| outputlookup kvstore_collection
| lookup kvstore_collection _key AS id OUTPUT value
```

---

## 11. tstats (Accelerated Search)

`tstats` searches indexed fields and data model accelerations — orders of magnitude faster than regular search for large datasets.

### Indexed field search (tsidx)

```spl
| tstats count WHERE index=fake_tshrt by sourcetype, host
| tstats count WHERE index=fake_tshrt sourcetype="FAKE:cisco:asa" by host
| tstats earliest(_time) AS first, latest(_time) AS last WHERE index=fake_tshrt by sourcetype
```

### With data model acceleration

```spl
| tstats count FROM datamodel=Authentication WHERE action=failure by Authentication.user, Authentication.src
| tstats summariesonly=t count FROM datamodel=Network_Traffic by All_Traffic.action, All_Traffic.dest_port
```

### tstats limitations

- Only works with indexed fields (`INDEXED_EXTRACTIONS`) or data model fields
- No `eval` inside tstats — post-process with `| eval`
- Limited aggregations: `count`, `dc`, `sum`, `avg`, `min`, `max`, `earliest`, `latest`, `values`, `list`

```spl
| tstats count WHERE index=fake_tshrt by sourcetype, _time span=1h
| eval sourcetype=replace(sourcetype, "FAKE:", "")
| timechart sum(count) by sourcetype
```

---

## 12. join, append, union

### join

```spl
-- Inner join (default)
index=fake_tshrt sourcetype="FAKE:cisco:asa"
| join src_ip [search index=fake_tshrt sourcetype="FAKE:azure:aad:signin"
               | stats count by src_ip]

-- Left join (keep all from main search)
index=fake_tshrt sourcetype="FAKE:cisco:asa"
| join type=left src_ip [search index=fake_tshrt sourcetype="FAKE:azure:aad:signin"
                          | rename properties.ipAddress AS src_ip
                          | stats values(identity) AS aad_user by src_ip]

-- Outer join
| join type=outer field1 [search ...]
```

**join limits:** Default max 50,000 results from subsearch. Use `| join max=0` for unlimited.

**Prefer stats-based correlation over join when possible:**

```spl
-- Instead of join, use a combined search + stats:
index=fake_tshrt (sourcetype="FAKE:cisco:asa" OR sourcetype="FAKE:azure:aad:signin")
| stats values(action) AS actions, values(identity) AS users, dc(sourcetype) AS source_count by src
| where source_count = 2
```

### append

Adds results from a subsearch as additional rows (no field matching):

```spl
index=fake_tshrt sourcetype="FAKE:cisco:asa" | stats count AS asa_count
| append [search index=fake_tshrt sourcetype="FAKE:aws:cloudtrail" | stats count AS aws_count]
```

### union (Splunk 7.1+)

Combines multiple datasets (like SQL UNION ALL):

```spl
| union
    [search index=fake_tshrt sourcetype="FAKE:cisco:asa" | stats count by src]
    [search index=fake_tshrt sourcetype="FAKE:meraki:securityappliances" | stats count by eventData.src]
```

---

## 13. Transaction vs stats

**Prefer `stats` over `transaction`** — `transaction` is memory-intensive and slow.

```spl
-- Transaction (slow, but groups related events)
index=fake_tshrt sourcetype="FAKE:cisco:asa"
| transaction src_ip maxspan=5m maxpause=30s
| eval duration=duration
| table src_ip, duration, eventcount

-- stats equivalent (fast)
index=fake_tshrt sourcetype="FAKE:cisco:asa"
| stats min(_time) AS start, max(_time) AS end, count AS eventcount,
        values(action) AS actions, values(dest_port) AS ports by src_ip
| eval duration = end - start
```

Use `transaction` only when you need:

- `maxpause` (gap-based grouping)
- Access to raw events within each group
- `startswith` / `endswith` conditions

```spl
| transaction session_id startswith=action="built" endswith=action="teardown" maxspan=1h
```

---

## 14. dedup, sort, head/tail

### dedup

```spl
| dedup src_ip                          -- keep first event per src_ip
| dedup src_ip dest_ip                  -- keep first event per combination
| dedup 3 src_ip                        -- keep first 3 events per src_ip
| dedup src_ip sortby -_time            -- keep latest event per src_ip
| dedup src_ip keepevents=true          -- mark dupes but keep them
```

### sort

```spl
| sort 0 -count                         -- sort all results descending by count
| sort 0 +_time                         -- sort ascending by time
| sort 0 -count, +user                  -- multi-field sort
| sort 100 -bytes                       -- top 100 by bytes (default limit = 10000)
```

**Gotcha:** `sort` has a default limit of 10,000 results. Use `sort 0` to sort ALL results.

### head / tail

```spl
| head 10                               -- first 10 results
| tail 5                                -- last 5 results
| head 1                                -- useful in subsearches
```

---

## 15. Formatting & Display

### fieldformat vs eval

`fieldformat` changes display without changing the underlying value (so calculations still work):

```spl
| eval bytes_total = sum_bytes
| fieldformat bytes_total = tostring(bytes_total, "commas") . " bytes"
| fieldformat _time = strftime(_time, "%Y-%m-%d %H:%M")
| fieldformat pct = round(pct, 1) . "%"
```

### fillnull

```spl
| fillnull value=0 count, bytes            -- specific fields
| fillnull value="N/A"                     -- all fields
| fillnull value=0                         -- all numeric gaps
```

### rename

```spl
| rename src AS source_ip, dst AS dest_ip
| rename "properties.status.errorCode" AS error_code    -- dotted fields need quotes
| rename *ip AS *address                                 -- wildcard rename
| rename count AS "Event Count"                          -- display names with spaces
```

### table vs fields

```spl
| table src, dest, action, _time           -- reorder and select (removes unlisted)
| fields src, dest, action                 -- keep only these (more efficient early in pipeline)
| fields - _raw, _time                     -- remove specific fields
```

**Performance tip:** Use `| fields` early in the pipeline to drop unneeded fields — reduces memory.

---

## 16. Macros

Define reusable search fragments:

```ini
# macros.conf
[get_location(1)]
args = ip_field
definition = eval location=case(cidrmatch("10.10.0.0/16", $ip_field$), "Boston", cidrmatch("10.20.0.0/16", $ip_field$), "Atlanta", cidrmatch("10.30.0.0/16", $ip_field$), "Austin", 1==1, "External")
```

Usage:

```spl
index=fake_tshrt sourcetype="FAKE:cisco:asa"
| `get_location(src)`
| stats count by location
```

---

## 17. Common Patterns

### Top N with "other"

```spl
| stats count by sourcetype
| sort 0 -count
| streamstats count AS rank
| eval sourcetype = if(rank <= 10, sourcetype, "OTHER")
| stats sum(count) AS count by sourcetype
| sort 0 -count
```

### Rate of change

```spl
| timechart span=1h count AS events
| streamstats current=f window=1 last(events) AS prev_events
| eval change_pct = round((events - prev_events) / prev_events * 100, 1)
```

### First/last seen tracker

```spl
| stats earliest(_time) AS first_seen, latest(_time) AS last_seen, count by src
| eval first_seen = strftime(first_seen, "%Y-%m-%d %H:%M:%S")
| eval last_seen = strftime(last_seen, "%Y-%m-%d %H:%M:%S")
```

### Correlation across sourcetypes

```spl
index=fake_tshrt (sourcetype="FAKE:cisco:asa" OR sourcetype="FAKE:azure:aad:signin")
| eval common_ip = coalesce(src, 'properties.ipAddress')
| stats dc(sourcetype) AS source_count, values(sourcetype) AS sources,
        values(user) AS users, values(action) AS actions by common_ip
| where source_count > 1
```

### Enrichment chain

```spl
index=fake_tshrt sourcetype="FAKE:cisco:asa" action=deny
| lookup geo_ip_lookup ip AS src OUTPUT country, city
| eval location = city . ", " . country
| stats count by src, location
| sort 0 -count
```

### Outlier detection

```spl
index=fake_tshrt sourcetype="FAKE:access_combined"
| timechart span=1h count by host
| foreach * [eval <<FIELD>> = if('<<FIELD>>' > 0, '<<FIELD>>', null())]
| untable _time host count
| eventstats avg(count) AS avg_count, stdev(count) AS stdev_count by host
| eval zscore = round((count - avg_count) / stdev_count, 2)
| where abs(zscore) > 2
```

### Bucket / bin

```spl
| eval response_bucket = case(
    response_time < 100, "0-100ms",
    response_time < 500, "100-500ms",
    response_time < 1000, "500ms-1s",
    1==1, ">1s"
)
| bin bytes span=1000 AS byte_range
| bin _time span=1h AS hour
```

---

## 18. Command Types (Performance Classification)

Understanding command types is critical for query performance:


| Type                        | Runs Where                    | Key Commands                                                                               |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------ |
| **Distributable streaming** | Indexer (fast) or search head | `eval`, `where`, `rex`, `spath`, `fields`, `regex`, `rename`, `search`, `lookup`, `makemv` |
| **Centralized streaming**   | Search head only              | `head`, `streamstats`, `transaction`, `join` (with fields)                                 |
| **Transforming**            | Search head, produces table   | `stats`, `chart`, `timechart`, `top`, `rare`, `table`, `mvcombine`                         |
| **Generating**              | Creates events                | `search` (first cmd), `makeresults`, `inputlookup`, `tstats`                               |
| **Dataset processing**      | Needs full dataset            | `sort`, `eventstats`, `dedup` (with sortby), `appendcols`, `fieldsummary`                  |


**Key rule:** After any non-streaming command, ALL subsequent streaming commands run on the search head instead of indexers. Place streaming commands as early as possible.

```spl
-- Good: streaming commands before transforming
index=fake_tshrt sourcetype="FAKE:cisco:asa"
| fields src, dest, action             -- distributable streaming (runs on indexer)
| where action="deny"                  -- distributable streaming (runs on indexer)
| stats count by src                   -- transforming (search head)

-- Bad: streaming after transforming runs on search head
index=fake_tshrt sourcetype="FAKE:cisco:asa"
| stats count by src, action           -- transforming
| where action="deny"                  -- now runs on search head (slower)
```

---

## 19. Performance Tips

1. **Be specific with index and sourcetype** — always include both
2. **Use `fields` early** to drop unneeded fields
3. **Prefer `stats` over `transaction`** — 10-100x faster
4. **Prefer `tstats` over `stats`** when only indexed fields are needed
5. **Avoid `join` when possible** — use `stats` + `eventstats` patterns
6. **Use `| head N` in subsearches** to limit results
7. **Time range matters** — narrower = faster
8. `**dedup` before `stats`** when you need unique-then-aggregate
9. `**where` after `stats**` — filter aggregated results, not raw events
10. **Avoid `NOT` with wildcards** — `NOT src=10.`* scans every event

```spl
-- Slow:
index=* | search sourcetype="FAKE:cisco:asa" | stats count by src

-- Fast:
index=fake_tshrt sourcetype="FAKE:cisco:asa" | fields src | stats count by src
```

---

## 20. SPL for SQL Users


| SQL                         | SPL                                                   |
| --------------------------- | ----------------------------------------------------- |
| `SELECT *`                  | `index=fake_tshrt sourcetype=...`                     |
| `SELECT col1, col2`         | `| fields col1, col2`                                 |
| `WHERE col = 5`             | `col=5` (in search) or `| where col=5`                |
| `WHERE col BETWEEN 1 AND 5` | `col>=1 col<=5`                                       |
| `WHERE col LIKE '%text%'`   | `col="*text*"` or `| where like(col, "%text%")`       |
| `WHERE col IN ('a','b')`    | `(col="a" OR col="b")` or `| where in(col, "a", "b")` |
| `GROUP BY col`              | `| stats count by col`                                |
| `HAVING avg(x) > 5`         | `| stats avg(x) AS ax by col | where ax > 5`          |
| `ORDER BY col DESC`         | `| sort 0 -col`                                       |
| `DISTINCT col`              | `| dedup col`                                         |
| `COUNT(DISTINCT col)`       | `| stats dc(col)`                                     |
| `LIMIT 10`                  | `| head 10`                                           |
| `JOIN`                      | `| join type=inner col [search ...]`                  |
| `LEFT JOIN`                 | `| join type=left col [search ...]`                   |
| `UNION ALL`                 | `| append [search ...]` or `| union [search ...]`     |
| `INSERT INTO`               | `| collect index=target`                              |
| `AS alias`                  | `| rename col AS alias`                               |
| Subquery                    | `[search ... | fields col]` (subsearch)               |


**Key difference:** Splunk's killer feature is full-text search across ALL fields -- `"error timeout"` searches everything. Nearly impossible in SQL.

---

## 21. Common Mistakes Quick Reference


| Mistake                                | Fix                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `eval x = "field"` (string, not field) | `eval x = field` or `eval x = 'field'`                                     |
| `where field = `* (invalid)            | `where isnotnull(field)` or `search field=*`                               |
| `if(field="val", ...)` missing quotes  | `if(field="val", ...)` is correct; check dotted fields need `'field.name'` |
| `case()` with no default               | Add `1==1, "default"` as last condition                                    |
| `sort -count` only sorts 10K           | Use `sort 0 -count` for all results                                        |
| `stats count by field` nulls vanish    | Use `fillnull` before stats, or `eventstats`                               |
| `!=` in search returns nulls           | Use `where field!="val"` or `where isnotnull(field) AND field!="val"`      |
| `join` drops events silently           | Check subsearch hit 50K limit; use `max=0`                                 |
| Timechart shows "OTHER"                | Add `limit=0 useother=f`                                                   |
| `rex` extracts only first match        | Use `max_match=0` for all matches                                          |
| `strftime` on non-epoch field          | Convert first: `eval epoch=strptime(field, "%Y-%m-%d")`                    |
| `relative_time` wrong snap             | `-1d@d` = yesterday midnight; `-1d` = exactly 24h ago                      |


