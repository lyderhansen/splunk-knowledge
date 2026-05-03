# geostats — geographic binning for map visualization

Source: Splunk Search Reference 10.2.0

## Syntax

    | geostats [translatetoxy=<bool>] [latfield=<field>] [longfield=<field>]
               [globallimit=<int>] [locallimit=<int>]
               [outputlatfield=<string>] [outputlongfield=<string>]
               [binspanlat=<float> binspanlong=<float>] [maxzoomlevel=<int>]
               <stats-agg-term>... [BY <field>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `stats-agg-term` | Yes | — | Aggregation function (same syntax as `stats`): `count`, `avg(field)`, `sum(field)`, etc. |
| `latfield` | No | `lat` | Field containing latitude |
| `longfield` | No | `lon` | Field containing longitude |
| `globallimit` | No | `10` | Max number of BY-clause categories rendered per bin. Others go into `OTHER` |
| `locallimit` | No | `10` | Top-N filter per series before global aggregation |
| `outputlatfield` | No | `latitude` | Name of latitude field in output |
| `outputlongfield` | No | `longitude` | Name of longitude field in output |
| `binspanlat` | No | `22.5` | Bin height in degrees at lowest zoom level |
| `binspanlong` | No | `45.0` | Bin width in degrees at lowest zoom level |
| `maxzoomlevel` | No | `9` | Number of zoom levels precomputed (0 through N) |
| `translatetoxy` | No | `true` | If `true`, one result per geographic bin (map mode). If `false`, results broken out per category — cannot be rendered on a map |

## Examples

### Bubble map — event count by location

```spl
index=main | iplocation src
| geostats latfield=lat longfield=lon count
```

### Bubble map — split by category

```spl
index=firewall | iplocation src_ip
| geostats latfield=lat longfield=lon count by action
```

### Custom field names

```spl
index=sensors
| geostats latfield=gps_lat longfield=gps_lon avg(temperature) AS avg_temp
```

### Reduce clutter by raising bin size

```spl
index=main | iplocation clientip
| geostats latfield=lat longfield=lon count binspanlat=5.0 binspanlong=5.0
```

## Gotchas

- **Required for `splunk.map` bubble layers** — Dashboard Studio map viz will not render bubble/cluster layers without `geostats` output. Missing it is the most common map rendering error.
- **Default field names are `lat` and `lon`** — `iplocation` outputs exactly these names, so the common `iplocation src | geostats count` pattern needs no `latfield`/`longfield`. If your data uses different names (e.g., `latitude`, `longitude`), you must specify them explicitly.
- **Output latitude/longitude fields are renamed** — `geostats` outputs `latitude` and `longitude` (not `lat`/`lon`). Downstream commands that expect `lat`/`lon` will break. Use `outputlatfield=lat outputlongfield=lon` to preserve original names if needed.
- **`globallimit=0` shows all categories** — the default of 10 silently hides categories beyond the top 10. Set `globallimit=0` to see everything; be aware this can produce very large results.
- **`binspanlat` below default can break rendering** — setting `binspanlat` lower than `22.5` (or `binspanlong` lower than `33`) may cause the map visualization to fail to render at the lowest zoom level.
- **`translatetoxy=false` is not a map mode** — it produces category-per-row output suitable for `timechart`-style analysis but cannot be fed to a map visualization.

## Tips

Pair `geostats` with `iplocation` for IP-based maps or with your own lat/lon fields for asset/sensor maps. Increase `maxzoomlevel` only if users will zoom in very closely — higher values increase computation time.

## See also

- `iplocation.md` — extract lat/lon from IP addresses
- `geom.md` — polygon data for choropleth maps
- `geomfilter.md` — clip to bounding box before geostats
