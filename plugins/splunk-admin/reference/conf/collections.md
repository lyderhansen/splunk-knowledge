# collections.conf

Configure KV Store collections for an app: field typing, optional type enforcement, query acceleration definitions, replication to indexers, profiling, and internal cache semantics tied to deployment topology.

**Source version:** Splunk Enterprise 10.2

## File details

| Property | Value |
|----------|-------|
| Location | `$SPLUNK_HOME/etc/system/local/` (or app context) |
| Pipeline phase | Search |
| Restart required | No |
| Related files | transforms.conf |

## Stanzas and settings

### `[<collection_name>]`

`<collection_name>` matches the collection stanza referenced from lookups (`transforms.conf`).

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enforceTypes` | `<boolean>` | `false` | When `true`, invalid inserts fail entirely; when `false`, invalid fields are dropped while valid ones persist. |
| `field.<name>` | `number \| bool \| string \| time` | inferred | Declares the KV Store field type for `<name>`; otherwise Splunk infers types from JSON payloads. |
| `accelerated_fields.<name>` | `<json>` | _(none)_ | Acceleration definition (valid JSON object); compound accelerations must not repeat fields inside arrays; acceleration always exists on `_key`; duplicate identical definitions are skipped; oversized values log warnings and skip acceleration. |
| `profilingEnabled` | `<boolean>` | `false` | Enables logging of slow KV Store operations governed by `profilingThresholdMs`. |
| `profilingThresholdMs` | `<zero or positive integer>` | `1000` | Slow-operation threshold in milliseconds (`0` logs everything); only honored when profiling is enabled and impacts performance when on. |
| `replicate` | `<boolean>` | `false` | When `true`, replicates collection data to indexers so distributed lookups work; when `false`, lookups requiring replicas fail unless run `local=true`. |
| `replication_dump_strategy` | `one_file \| auto` | `auto` | Chooses single-file dumps versus splitting once collection size exceeds `replication_dump_maximum_file_size`. |
| `replication_dump_maximum_file_size` | `<unsigned integer>` (KB) | `10240` | Maximum dump file size per shard when `replication_dump_strategy=auto`; capped by `concerningReplicatedFileSize` in `distsearch.conf` when smaller. |
| `type` | `internal_cache \| undefined` | `undefined` | Internal-only flag describing cached data; `internal_cache` data is wiped when switching among standalone, SH pool, or SH cluster modes. |
