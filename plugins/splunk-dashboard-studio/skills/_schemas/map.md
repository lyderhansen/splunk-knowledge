# splunk.map — authoritative options reference

Source: `@splunk/visualization-schemas@28.6.0` — extracted from `optionsSchemas/splunk.map.js`.

**12 documented options.**

| Option | Type | Default | Enum / pattern | Description |
|---|---|---|---|---|
| `backgroundColor` | string | `> themes.defaultBackgroundColor` | _color or token_ | 'Specify a color for the background. You might use a dataSource to apply the color. The default for enterprise light is "#FFFFFF". The default for enterprise dark is "#000000". The default for prisma dark is "#0B0C0E".' |
| `baseLayerTileServer` | string | `—` |  | Specify the URL for the set of tiles that make up the base map. |
| `baseLayerTileServerType` | string | `—` | vector \|  raster | Specify the type of tile set for the base map. |
| `center` | array | `—` |  | Specify the center of the map in coordinates, in the form of [latitude, longitude]. If you don\u2019t provide coordinates, the map automatically centers, based on available location data. If there is no available loca... |
| `layers` | array | `[
      {
        type: "bubble" /* Bubble */,
...` |  | Specify the optional data visualization layers over the base map. If empty, only the base map appears. |
| `scaleUnit` | string | `metric` | metric \|  imperial | Specify the scale unit to use. |
| `showBaseLayer` | boolean | `true` |  | Specify if showing the base map. |
| `showScale` | boolean | `true` |  | Specify whether to display the scale on the bottom left. |
| `showZoomControls` | boolean | `true` |  | Specify whether to display the control panel of zoom on the top left. |
| `zoom` | number | `—` |  | Specify the zoom level of the map. |
| `showCoordinates` | boolean | `true` |  | Specify whether to display coordinates (latitude and longitude) in the tooltip. |
| `icon` | string | `` |  | 'Specify the url for an svg to display an icon inside bubbles for map. This applies to layers where type: "bubble".' |