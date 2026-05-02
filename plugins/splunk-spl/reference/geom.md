# geom — add geographic polygon data for choropleth maps

Source: Splunk Search Reference 8.2.12, page 332.

## Syntax

    | geom <featureCollection> [featureIdField=<field>] [gen=<float>] [allFeatures=<bool>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| featureCollection | yes | — | Name of the KMZ/KML feature collection (e.g., `geo_countries`, `geo_us_states`) |
| featureIdField | no | auto | Field in results that matches feature IDs in the collection |
| allFeatures | no | false | If true, include features with no matching data |

## Examples

### Country choropleth

```spl
index=main | stats count by Country
| geom geo_countries featureIdField=Country
```

## Gotchas

- **Feature ID matching:** `geo_countries` expects full country names (e.g., "United States", not "US"). Check the collection's feature IDs.
- **Required for `splunk.choropleth.svg`:** Dashboard Studio choropleth viz requires `geom` output.

## See also

- `geomfilter.md` — clip to bounding box
- `geostats.md` — geographic binning for bubble maps
- `iplocation.md` — extract geo from IPs
