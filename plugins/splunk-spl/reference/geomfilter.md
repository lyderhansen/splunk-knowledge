# geomfilter — clip choropleth to bounding box

Source: Splunk Search Reference 8.2.12, page 337.

## Syntax

    | geomfilter min_x=<float> min_y=<float> max_x=<float> max_y=<float>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| min_x / max_x | yes | — | Longitude bounds |
| min_y / max_y | yes | — | Latitude bounds |

## Examples

### Continental US only

```spl
| geom geo_us_states | geomfilter min_x=-130 min_y=20 max_x=-60 max_y=55
```

## See also

- `geom.md` — add polygon data
