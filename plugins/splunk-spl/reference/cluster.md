# cluster — group events by text similarity

Source: Splunk Search Reference 10.2.0

## Syntax

    | cluster [t=<num>] [showcount=<bool>] [countfield=<field>] [labelfield=<field>]
              [field=<field>] [labelonly=<bool>] [match=termlist|termset|ngramset]
              [delims=<string>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `t` | No | `0.8` | Similarity threshold (0-1). Higher = more selective. Events must be more similar to share a cluster |
| `showcount` | No | `false` | If `true`, appends the cluster's event count to each event in `countfield` |
| `countfield` | No | `cluster_count` | Name of the field to write cluster size into (only used when `showcount=true`) |
| `labelfield` | No | `cluster_label` | Name of the field to write the cluster number into |
| `field` | No | `_raw` | Field to analyze for similarity |
| `labelonly` | No | `false` | If `true`, annotates all events with cluster info. If `false`, outputs one representative event per cluster |
| `match` | No | `termlist` | Similarity method: `termlist` (ordered terms), `termset` (unordered terms), `ngramset` (3-char substrings) |
| `delims` | No | non-alphanumeric | Characters used to tokenize the field value |

## Usage

`cluster` groups events based on how similar their `field` values are. By default it clusters on `_raw`. Events are assigned a `cluster_label` (cluster number). The default `labelonly=false` outputs one representative event per cluster along with the cluster count.

Use `cluster` to deduplicate similar log messages, identify the most frequent error patterns, or surface rare event types.

## Examples

### Find and count distinct error types in Splunk internal logs

    index=_internal source=*splunkd.log* log_level!=info
    | cluster showcount=true
    | table cluster_count, cluster_label, _raw
    | sort - cluster_count

### Annotate all events with their cluster number (keep all events)

    index=main sourcetype=syslog
    | cluster t=0.85 labelonly=true showcount=true
    | sort - cluster_count, _time

### Cluster on a specific field (not raw event)

    index=web sourcetype=access_combined
    | cluster field=uri t=0.7 showcount=true
    | dedup cluster_label
    | table cluster_count, uri

### Use ngramset for short, non-textual fields like punct

    index=main
    | cluster field=punct match=ngramset t=0.6 showcount=true
    | sort - cluster_count

## Gotchas

- **`showcount=false` by default** — without `showcount=true`, no cluster size field is added. This surprises users who expect counts automatically. Always specify `showcount=true` if you want to sort by cluster size.
- **`t=0.8` is a strict threshold** — events must be 80% similar to be grouped. For noisier logs, lower `t` to `0.6` or `0.7`. For tighter grouping of near-identical messages, use `t=0.9`.
- **`labelonly=false` deduplicated output** — the default output mode returns only one representative event per cluster, not all events. Use `labelonly=true` if you need every individual event with its cluster annotation.
- **`ngramset` is significantly slower** — only use it for short, non-textual fields like `punct` or error codes. Use `termlist` or `termset` for natural-language log messages.
- **Cluster labels are ordinal, not meaningful** — `cluster_label=1` does not imply the largest or most important cluster. Sort by `cluster_count` to find the most common patterns.

## See also

- `kmeans.md` — k-means clustering for numeric fields
- `anomalies.md` — unexpectedness scoring to find rare events
- `dedup.md` — remove duplicate events (simpler than cluster for exact duplicates)
