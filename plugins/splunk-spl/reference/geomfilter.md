# geomfilter — clip choropleth map polygons to a bounding box

Source: Splunk Search Reference 10.2.0

## Syntax

    | geomfilter [min_x=<float>] [min_y=<float>] [max_x=<float>] [max_y=<float>]

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `min_x` | No | `-180` | Left (west) longitude bound of the bounding box, range [-180, 180] |
| `min_y` | No | `-90` | Bottom (south) latitude bound, range [-90, 90] |
| `max_x` | No | `180` | Right (east) longitude bound, range [-180, 180] |
| `max_y` | No | `90` | Top (north) latitude bound, range [-90, 90] |

## Usage

`geomfilter` filters out polygon features (from a `geom` command) that fall entirely outside the specified bounding box. It is used in choropleth map pipelines to restrict the visible map area. All parameters are optional — omitting all parameters applies a full-world bounding box (no filtering effect).

Coordinates use decimal degrees in the WGS84 coordinate system: longitude is x (east-west), latitude is y (north-south).

## Examples

### Continental United States only

    | geom geo_us_states feature_id_field=abbr
    | geomfilter min_x=-130 min_y=22 max_x=-60 max_y=50

### Europe bounding box

    | geom geo_countries feature_id_field=iso3
    | geomfilter min_x=-25 min_y=34 max_x=45 max_y=72

### Asia-Pacific region

    | geom geo_countries feature_id_field=iso3
    | geomfilter min_x=60 min_y=-50 max_x=180 max_y=55

## Gotchas

- **`geomfilter` must follow `geom`** — it operates on the polygon data injected by `geom`. Placing it before `geom` has no effect.
- **Clip is by bounding box, not shape** — a polygon that partially overlaps the bounding box is kept in full, not clipped to the box boundary. Polygons only partially outside the box may still appear in map renders.
- **All parameters are optional with defaults** — calling `| geomfilter` with no arguments is valid but has no filtering effect (uses the full world extent).
- **Longitude then latitude** — `min_x`/`max_x` are longitude (east-west), `min_y`/`max_y` are latitude (north-south). It is easy to swap these; incorrect bounds will produce an empty map.

## See also

- `geom.md` — loads polygon data for choropleth rendering
- `geostats.md` — aggregates events into geographic bins for map scatter plots
