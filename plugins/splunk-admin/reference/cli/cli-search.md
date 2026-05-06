# splunk search | rtsearch

Run **historical** or **real-time** SPL from the shell on Splunk Enterprise (or target a remote management port), useful for automation, quick investigations, and scripted exports.

**Runs on:** Splunk Enterprise instances with search capability (**search head**, **standalone**, **indexer** with search)—subject to role permissions. **Heavy / Universal Forwarders** are generally **not** search tiers.

**Splunk Cloud:** Documented under combined Enterprise + Cloud CLI search syntax for supported scenarios; interactive administration differs—confirm current Cloud CLI policy for your entitlement.

**Universal parameters:** `-auth user:pass`, `-uri https://host:mgmtPort`, `-app <appname>`, `-owner <user>` may apply (see **Get help with the CLI**).

---

## splunk search

Executes a **historical** search job from the CLI.

### Syntax

```bash
./splunk search '<search_string>' [-parameter value] ...
```

On Windows use double quotes around the search string.

### Options

Boolean parameters accept negatives `0 false f no` and positives `1 true t yes` per Splunk documentation.

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `-app` | `<app_name>` | `search` | Namespace/app context for the search. |
| `-batch` | boolean | `false` | How preview handles updates in preview mode. |
| `-detach` | boolean | `false` | Run **asynchronously**; prints **job ID** and **TTL** instead of blocking on results. |
| `-earliest_time` | time modifier | − | Relative start of search window (CLI-level time window). |
| `-latest_time` | time modifier | end of data / now semantics per docs | Relative end of search window; defaults broad enough to include “future” skew when unspecified for historical searches per Splunk docs. |
| `-header` | boolean | `true` | Show header row in **table** output. |
| `-id` | string | − | Job-related identifier when applicable (see `splunk help search`). |
| `-index_earliest` | epoch or time modifier | − | Bounds on **indexed** time (_indextime) start; syntax aligns with search time modifiers. |
| `-index_latest` | epoch or time modifier | − | Bounds on **indexed** time end. |
| `-max_time` | seconds | `0` | Wall-clock seconds before search finalizes (`0` = no limit). |
| `-maxout` | integer | **100** for `search` | Max events to stdout/export (`0` = unlimited per docs caution—resource intensive). |
| `-output` | `rawdata`, `table`, `csv`, `auto`, `json` | **auto** selects `rawdata` for non-transforming searches and `table` for transforming searches | Output format. |
| `-preview` | boolean | `true` | Stream preview for reporting searches where applicable. |
| `-timeout` | seconds | `0` | Seconds the job may live after running (`0` cancel immediately after run per docs—interpret with care). |
| `-uri` | `http[s]://host:port` | Local `mgmtHostPort` from `web.conf` | Remote splunkd management URI. |
| `-wrap` | boolean / width | `true` | Wrap long lines (`0` or `false` disables wrapping per examples). |

### Examples

```bash
./splunk search 'eventtype=webaccess error' -detach true
./splunk search 'eventtype=webaccess error' -wrap 0
./splunk search '*' -detach true
./splunk search 'index=_internal' -index_earliest -1d@d -index_latest @d
./splunk search 'index=* | stats count by host | fields - count' -preview true
./splunk search '| metadata type=hosts | fields host' -preview true
```

### Notes

- Default CLI behavior historically implied **broad time range**—always set **explicit windows** in automation.
- For remote execution combine `-uri` and `-auth`.
- Large exports: see Search Manual **Export search results** / **Export data using the CLI**.

---

## splunk rtsearch

Runs a **real-time** search with the same overall parameter model as `search`, plus real-time window parameters.

### Syntax

```bash
./splunk rtsearch '<search_string>' [-parameter value] ...
```

### Options

Includes all applicable **`search`** parameters above **except** where real-time rules differ, **plus**:

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `-earliest_time` | real-time window (e.g. `rt-30s`) | **Required** per Splunk docs for real-time operation | Start of sliding/explicit real-time window. |
| `-latest_time` | real-time window (e.g. `rt+30s`) | **Required** per Splunk docs | End of real-time window (`rtsearch` will not run if omitted per Splunk docs). |
| `-maxout` | integer | **0** | Default differs from historical `search` (`0` = unlimited per Splunk CLI syntax docs—still guard production usage). |
| `-rt_id` | string | − | Real-time search routing/correlation token when applicable (see `splunk help rtsearch`). |

Other shared flags behave like **`search`**: `-app`, `-batch`, `-detach`, `-header`, `-id`, `-index_earliest`, `-index_latest`, `-max_time`, `-output`, `-preview`, `-timeout`, `-uri`, `-wrap`.

### Examples

```bash
./splunk rtsearch 'error' -wrap false
./splunk rtsearch 'eventtype=webaccess error | top clientip'
./splunk rtsearch 'index=_internal' -earliest_time 'rt-30s' -latest_time 'rt+30s'
```

### Notes

- Real-time searches are **expensive**—scope indexes and terms tightly.
- Prefer Search UI or REST job APIs when you need granular job control for dashboards/alerts.

---

**Documentation:** [Syntax for searches in the CLI](https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/CLIsearchsyntax), [Administrative CLI commands](https://docs.splunk.com/Documentation/Splunk/latest/Admin/CLIadmincommands), [Get help with the CLI](https://docs.splunk.com/Documentation/Splunk/latest/Admin/GethelpwiththeCLI).
