# cluster — group similar events by text similarity

Source: Splunk Search Reference 8.2.12, page 231.

## Syntax

    | cluster [t=<float>] [showcount=<bool>] [countfield=<field>] [labelfield=<field>] [field=<field>] [labelonly=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| t | no | 0.8 | Similarity threshold (0-1, higher = stricter) |
| showcount | no | true | Add cluster_count field |
| labelfield | no | cluster_label | Field name for cluster label |

## Examples

### Deduplicate similar log messages

```spl
index=main sourcetype=syslog | cluster t=0.9 showcount=true | sort -cluster_count | dedup cluster_label
```

## See also

- `kmeans.md` — numeric field clustering
- `anomalies.md` — anomaly scoring
