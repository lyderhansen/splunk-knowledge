# datamodels.conf

Defines Splunk data models: hierarchical datasets, UI/editor metadata, acceleration policies (`tstats`), workload routing, Hunk-specific storage hints, and strict field projection defaults consumed by `datamodel` / `from` commands.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/apps/<app>/local/` (typical) plus `$SPLUNK_HOME/etc/system/local/` |
| Pipeline phase | Search |
| Restart required | No |
| Related files | props.conf, transforms.conf |

## Stanzas and settings

### `[default]`

Standard Splunk `[default]` merging applies before model-specific stanzas override values. No dedicated `[default]` attributes are enumerated in the shipped spec aside from those universal precedence notes.

### `[<datamodel_name>]`

Each stanza configures one data model whose name matches the stanza header.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `acceleration` | `<boolean>` | `false` | Enables automatic bucket-level column stores for accelerated search via `tstats`, consuming extra disk proportional to cardinality. |
| `acceleration.earliest_time` | `<relative time string>` | `""` | Retention window for summaries (`-7d`, etc.); empty means keep summaries for all time. |
| `acceleration.backfill_time` | `<relative time string>` | `""` | Limits how far back initial summarization runs—must be newer than `acceleration.earliest_time`; risky if narrower than indexer outages. |
| `acceleration.max_time` | `<unsigned integer>` (seconds) | `3600` | Approximate runtime cap per summarization search (`0` disables limit). |
| `acceleration.poll_buckets_until_maxtime` | `<boolean>` | `false` | Forces summarization searches to continue polling buckets until `max_time` elapses for evenly distributed completion across heterogeneous clusters. |
| `acceleration.cron_schedule` | `<cron-string>` | `*/5 * * * *` | Scheduler cadence that probes/regenerates summaries for this model. |
| `acceleration.manual_rebuilds` | `<boolean>` | `false` | Prevents automatic rebuild of outdated summaries via `summarize`, requiring manual intervention while still rebuilding partial inconsistent summaries. |
| `acceleration.max_concurrent` | `<unsigned integer>` | `3` | Caps simultaneous acceleration jobs scheduled for this model. |
| `acceleration.allow_skew` | `<percentage> \| <duration-specifier>` | `0` | Randomizes launch offsets for eligible cron patterns to spread load (`100%`, `5m`, etc.). |
| `acceleration.schedule_priority` | `default \| higher \| highest` | `default` | Elevates scheduler priority for acceleration searches subject to role capability `edit_search_schedule_priority`. |
| `acceleration.allow_old_summaries` | `<boolean>` | `false` | Controls whether `datamodel`/`from`/`tstats` queries accept summaries whose metadata no longer matches current definitions. |
| `acceleration.source_guid` | `<string>` | _(unset)_ | Points this model at summaries owned by another SH/SHC GUID, disabling local acceleration edits while forcing `allow_old_summaries` semantics toward permissive defaults. |
| `acceleration.hunk.compression_codec` | `<string>` | _(unset)_ | Compression codec for accelerated ORC/Parquet artifacts on Hunk deployments. |
| `acceleration.hunk.dfs_block_size` | `<unsigned integer>` | _(unset)_ | Block size in bytes for Hunk acceleration files. |
| `acceleration.hunk.file_format` | `orc \| parquet` | _(unset)_ | File format for Hunk accelerated summaries. |
| `acceleration.workload_pool` | `<string>` | _(optional)_ | Names the workload pool from `workload_pools.conf` hosting summarization searches when workload management is enabled. |
| `dataset.description` | `<string>` | _(unset)_ | User-visible dataset description stored with the knowledge object. |
| `dataset.type` | `datamodel \| table` | `datamodel` | Distinguishes classic data-model datasets from table datasets backed by `dataset.commands`. |
| `dataset.commands` | `[<object>(, <object>)*]` | _(unset)_ | JSON array string describing editor pipeline commands when `dataset.type=table`. |
| `dataset.fields` | `[<string>(, <string>)*]` | _(unset)_ | Auto-generated JSON field list for table datasets after search edits. |
| `dataset.display.diversity` | `latest \| random \| diverse \| rare` | `latest` | Controls preview sampling strategy inside Splunk Web editors. |
| `dataset.display.sample_ratio` | `<integer>` | `1` | Sample denominator (`1/N` chance per event) used by diversity previews. |
| `dataset.display.limiting` | `<integer>` | `100000` | Caps scanned events when previewing datasets interactively. |
| `dataset.display.currentCommand` | `<integer>` | _(unset)_ | Tracks UI cursor position across editing commands. |
| `dataset.display.mode` | `table \| datasummary` | `table` | Chooses row preview versus datasummary preview modes in editors. |
| `dataset.display.datasummary.earliestTime` | `<time-string>` | _(unset)_ | Earliest bound for datasummary previews. |
| `dataset.display.datasummary.latestTime` | `<time-string>` | _(unset)_ | Latest bound for datasummary previews. |
| `strict_fields` | `<boolean>` | `true` | Default `strict_fields` behavior for `| datamodel` and inherited projections when using `| from`. |
| `tags_whitelist` | `<comma-separated list>` | _(unset)_ | Restricts which tag-powered metadata loads for heavy tag-centric models; updates may rebuild summaries unless manual rebuilds are enabled. |
