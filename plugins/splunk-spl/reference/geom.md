# geom — add geographic polygon data for choropleth maps

Source: Splunk Search Reference 10.2.0

## Syntax

    | geom [<featureCollection>] [featureIdField=<field>] [allFeatures=<bool>] [gen=<double>]
          [min_x=<double>] [min_y=<double>] [max_x=<double>] [max_y=<double>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `featureCollection` | No | from event `featureCollection` field | Name of the geospatial lookup (e.g., `geo_countries`, `geo_us_states`) |
| `featureIdField` | No | `featureId` field in event | Field whose values match feature IDs in the collection |
| `allFeatures` | No | `false` | If `true`, include all features from the collection even when no data matches — zero-fills aggregates |
| `gen` | No | `0.1` | Generalization level in degrees (Douglas-Peucker algorithm). Higher = simpler polygons, faster rendering |
| `min_x` / `max_x` | No | `-180` / `180` | Bounding box X (longitude) to clip geometry |
| `min_y` / `max_y` | No | `-90` / `90` | Bounding box Y (latitude) to clip geometry |

## Built-in feature collections

| Collection | Coverage |
|---|---|
| `geo_countries` | World countries |
| `geo_us_states` | US states |

Custom KMZ/KML collections can be added via Settings > Lookups > Geospatial lookups.

## Examples

### Country choropleth

```spl
index=main | stats count by Country
| geom geo_countries featureIdField=Country
```

### US state choropleth with all states shown (zero for missing)

```spl
index=sales | stats sum(revenue) AS revenue by state
| geom geo_us_states featureIdField=state allFeatures=true
```

### Verify a custom lookup

```spl
| inputlookup my_custom_geo_lookup
```

Then switch to Choropleth Map in Visualizations to check polygon coverage.

### Test a single feature

```spl
| stats count | eval featureId="California" | eval count=10000
| geom geo_us_states allFeatures=true
```

## Gotchas

- **Feature ID matching is exact and case-sensitive** — `geo_countries` expects full English country names (e.g., `"United States"`, not `"US"` or `"usa"`). Mismatches silently produce no polygon for that row.
- **`allFeatures=false` hides unmatched regions** — regions with no data in your results simply disappear from the map. Use `allFeatures=true` to show zero-count areas and make absences visible.
- **`gen` reduces polygon detail** — the default `gen=0.1` is good for world maps. For small-region maps (e.g., city boundaries), lower it to `gen=0.001` for more accurate outlines.
- **Required for `splunk.choropleth.svg`** — Dashboard Studio choropleth viz requires `geom` output. Without it, no polygons are drawn.
- **No arguments mode** — when called with no arguments, `geom` looks for `featureCollection` and `featureId` fields already present in the event (e.g., from a `geoindex` lookup).
- **Custom lookups need `external_type=geo`** — in `transforms.conf`, the stanza for a custom geospatial lookup must set `external_type = geo`.

## Tips

Use `gen=0.5` or higher when the map will be rendered small (dashboard thumbnail) to reduce JSON payload size and speed up rendering.

## See also

- `geomfilter.md` — clip results to a bounding box before adding polygon data
- `geostats.md` — geographic binning for bubble/cluster maps
- `iplocation.md` — extract lat/lon and country from IP addresses
