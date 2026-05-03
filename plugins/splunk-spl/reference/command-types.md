# SPL command types — performance classification

Source: Splunk Search Reference 10.2.0, pages 72-78.

Understanding command types is critical for writing performant SPL. The type
determines **where** the command runs (indexer vs search head) and dictates
pipeline ordering for optimal performance.

## The golden rule

> **After any non-streaming command, ALL subsequent streaming commands run on
> the search head instead of indexers.** Place streaming commands as early as
> possible in the pipeline.

```spl
-- GOOD: streaming commands before transforming
index=main sourcetype=firewall
| fields src, dest, action          -- distributable streaming (indexer)
| where action="deny"              -- distributable streaming (indexer)
| stats count by src               -- transforming (search head)

-- BAD: streaming after transforming runs on search head
index=main sourcetype=firewall
| stats count by src, action        -- transforming (search head)
| where action="deny"              -- NOW runs on search head (slower)
```

## Six command types

### 1. Distributable streaming

Runs on **indexers** (fast). Operates on each event independently — no need to
see all events. Can be pushed down to indexers for parallel execution.

| Command | Notes |
|---|---|
| `eval` | |
| `where` | |
| `search` | When used as a filter (not first command) |
| `rex` | |
| `spath` | |
| `fields` | |
| `rename` | |
| `replace` | |
| `regex` | |
| `lookup` | When `local=false` (default) |
| `convert` | |
| `fieldformat` | |
| `fillnull` | Only when field-list is specified |
| `makemv` | |
| `mvexpand` | |
| `nomv` | |
| `rangemap` | |
| `reltime` | |
| `strcat` | |
| `tags` | |
| `typer` | |
| `extract` (kv) | |
| `xmlkv` | |
| `xpath` | |
| `highlight` | |
| `iconify` | |
| `iplocation` | |
| `multikv` | |
| `addinfo` | |
| `bin` | Only with `span=` argument |
| `dedup` | Pre-dedup phase on indexers |
| `xyseries` | When `grouped=false` (default) |
| `untable` | |

**Performance tip:** These are your cheapest commands. Use `fields`, `where`,
`eval`, and `rex` early to drop unneeded data before it reaches the search head.

### 2. Centralized streaming

Runs on **search head only**. Operates on each event sequentially — must see
events in order or maintain state across events.

| Command | Notes |
|---|---|
| `head` | Stops pipeline early — efficient for limiting |
| `tail` | Must buffer all events first |
| `streamstats` | Running calculations — needs ordered events |
| `transaction` | Groups events — needs full stream |
| `autoregress` | Lag values — needs ordered events |
| `join` | When field-list is specified |
| `dedup` | Centralized phase after indexer pre-dedup |

**Performance tip:** Place these after distributable streaming commands have
already filtered and reduced the data.

### 3. Generating

Creates events — either from indexes or from scratch. Must be the **first
command** in the pipeline (with leading `|`).

Two sub-types:

**Event-generating (distributable)** — can run on indexers:

| Command | Notes |
|---|---|
| `search` | When it's the first command |
| `tstats` | When `prestats=true`, event-generating |
| `multisearch` | |
| `inputcsv` | Centralized |
| `inputlookup` | Centralized when `append=false` |
| `loadjob` | Centralized |
| `gentimes` | |
| `metasearch` | |
| `searchtxn` | |
| `set` | |

**Report-generating** — runs on search head:

| Command | Notes |
|---|---|
| `makeresults` | |
| `datamodel` | |
| `dbinspect` | |
| `eventcount` | |
| `from` | Type depends on dataset |
| `history` | |
| `metadata` | Fetches from peers, post-processing on search head |
| `mstats` | Except when `append=true` |
| `pivot` | |
| `rest` | |
| `tstats` | Default mode |
| `typeahead` | |
| `walklex` | |

### 4. Transforming

Consumes all events and produces a **summary table**. Runs on search head.
Previously called "reporting commands."

| Command | Notes |
|---|---|
| `stats` | Core aggregation |
| `chart` | Two-dimensional aggregation |
| `timechart` | Time-bucketed aggregation |
| `top` | Most common values |
| `rare` | Least common values |
| `table` | Column selection + ordering |
| `mvcombine` | |
| `makecontinuous` | |
| `addtotals` | Transforming for column totals (`col=t`) |
| `xyseries` | When `grouped=true` |
| `associate` | |
| `cofilter` | |
| `contingency` | |
| `anomalydetection` | |
| `append` | |

### 5. Orchestrating

Controls search execution flow. Does not directly transform data.

| Command | Notes |
|---|---|
| `localop` | Force local execution |
| `redistribute` | Push to indexer reducers |
| `lookup` | When `local=true` — forces search head execution |
| `noop` | Internal optimization |
| `require` | Fail search on empty results |

### 6. Dataset processing

Requires the **entire dataset** before processing. Expensive — runs on search head.

| Command | Notes |
|---|---|
| `sort` | Must see all events to sort |
| `eventstats` | Must see all events to compute group stats |
| `dedup` | With `sortby` or `keepevents=true` |
| `fillnull` | Without field-list (all fields) |
| `join` | Without field-list |
| `reverse` | |
| `tail` | |
| `outlier` | |
| `fieldsummary` | |
| `concurrency` | |
| `cluster` | Some modes |
| `map` | |
| `bin` | Without `span=` argument |
| `transaction` | Some modes |
| `union` | Some modes |
| `appendcols` | |
| `appendpipe` | |
| `from` | Some modes |

## Commands with multiple types

Some commands change type based on arguments:

| Command | Condition | Type |
|---|---|---|
| `search` | First in pipeline | Event-generating |
| `search` | Used as filter | Distributable streaming |
| `dedup` | Default | Distributable streaming (pre-dedup) + centralized |
| `dedup` | With `sortby` or `keepevents=true` | Dataset processing |
| `bin` | With `span=` | Streaming |
| `bin` | Without `span=` | Dataset processing |
| `fillnull` | With field-list | Distributable streaming |
| `fillnull` | Without field-list | Dataset processing |
| `join` | With field-list | Centralized streaming |
| `join` | Without field-list | Dataset processing |
| `lookup` | `local=false` (default) | Distributable streaming |
| `lookup` | `local=true` | Orchestrating |
| `xyseries` | `grouped=false` (default) | Distributable streaming |
| `xyseries` | `grouped=true` | Transforming |
| `addtotals` | Row totals (default) | Distributable streaming |
| `addtotals` | Column totals (`col=t`) | Transforming |

## Pipeline ordering for performance

```
1. Generating:     index=main sourcetype=firewall     (indexers)
2. Dist. streaming: | fields src, dest, action         (indexers)
3. Dist. streaming: | where action="deny"              (indexers)
4. Dist. streaming: | eval network=cidrmatch(...)      (indexers)
5. Transforming:    | stats count by src               (search head)
6. Dataset proc:    | sort 0 -count                    (search head)
7. Cent. streaming: | head 20                          (search head)
```

Everything after step 4 runs on the search head. The more you filter and
reduce in steps 1-4, the less work the search head does.

## See also

- `stats.md` — primary transforming command
- `eval.md` — primary distributable streaming command
- `sort.md` — dataset processing (10K default limit gotcha)
