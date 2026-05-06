---
name: ds-viz-icon-library
description: "Splunk Dashboard Studio icon_library custom visualization — 2500+ Material Symbols icons with configurable color, size, background shape, shadow, glow, label, rotation, and data-driven styling. Requires the icon_library Splunk app to be installed. Use when the user wants professional icons on a dashboard — status indicators, category markers, KPI decorations, or any named Material Symbols icon."
---

# icon_library — Material Symbols icon renderer

> **Requires:** The `icon_library` Splunk app must be installed on the
> target Splunk instance. Install the `.tar.gz` from the app package.
> Without it, panels using this viz type render empty.

## When to use

- Professional icons on dashboard panels — status dots, category markers, KPI decorations
- Any of the 2500+ Material Symbols icons (browse at fonts.google.com/icons)
- Icons with background shapes — circle, rounded_rect, or square tiles for card-style layouts
- Data-driven icon colors from search results — icon changes color based on a field value
- Icons with a text label below them — name, category, or state description

## When NOT to use

- Custom SVG floor plans or choropleth canvases → use `ds-svg` + `ds-viz-choropleth-svg`
- Logos or brand images → use `ds-viz-image`
- Custom SVG shapes not available in Material Symbols → use `ds-svg`
- Decorative shapes with gradient fills → use `ds-viz-infographic-shapes`
- Built-in icon KPI tile (no app dependency) → use `ds-viz-singlevalueicon`

## Quick start

Complete panel JSON for a security icon tile with background, shadow, and label:

```json
{
  "type": "icon_library.icon_library",
  "dataSources": { "primary": "ds_stub" },
  "options": {
    "backgroundColor": "transparent",
    "icon_library.icon_library.iconName": "shield",
    "icon_library.icon_library.iconColor": "#06B6D4",
    "icon_library.icon_library.iconSize": "0",
    "icon_library.icon_library.bgShape": "rounded_rect",
    "icon_library.icon_library.bgColor": "#1E293B",
    "icon_library.icon_library.bgOpacity": "1",
    "icon_library.icon_library.bgPadding": "16",
    "icon_library.icon_library.bgRadius": "12",
    "icon_library.icon_library.shadow": "yes",
    "icon_library.icon_library.shadowColor": "#000000",
    "icon_library.icon_library.shadowBlur": "8",
    "icon_library.icon_library.showLabel": "yes",
    "icon_library.icon_library.labelText": "Security",
    "icon_library.icon_library.labelColor": "#94A3B8"
  }
}
```

> **Namespace rule:** ALL option keys must be prefixed with
> `icon_library.icon_library.` — this is how custom viz namespacing
> works in Dashboard Studio. Options without the prefix are silently
> ignored.

## Stub data source

`icon_library` requires a data source even for fully static icons. Add
this data source to the dashboard's `dataSources` block:

```json
"ds_stub": {
  "type": "ds.test",
  "options": {
    "data": {
      "fields": [{"name": "_stub"}],
      "columns": [["1"]]
    }
  },
  "name": "Icon stub"
}
```

Reference it from the panel: `"dataSources": { "primary": "ds_stub" }`.

## Popular icons

| Category | Icon names |
|---|---|
| **Status** | `check_circle`, `cancel`, `error`, `warning`, `info`, `pending`, `hourglass_empty`, `task_alt` |
| **Security** | `shield`, `lock`, `lock_open`, `security`, `verified_user`, `gpp_good`, `gpp_bad`, `vpn_key`, `key`, `fingerprint`, `policy` |
| **Network** | `wifi`, `wifi_off`, `router`, `hub`, `lan`, `cable`, `cell_tower`, `signal_cellular_alt`, `dns`, `network_check` |
| **Infrastructure** | `storage`, `database`, `memory`, `developer_board`, `terminal`, `code`, `devices`, `computer`, `laptop`, `monitor`, `smartphone` |
| **Cloud** | `cloud`, `cloud_upload`, `cloud_download`, `cloud_off` |
| **Monitoring** | `monitor_heart`, `speed`, `analytics`, `insights`, `trending_up`, `trending_down`, `bar_chart`, `show_chart`, `dashboard` |
| **Alerts** | `notifications`, `notifications_active`, `bolt`, `electric_bolt`, `emergency`, `crisis_alert`, `report`, `bug_report` |
| **Business** | `payments`, `credit_card`, `account_balance`, `shopping_cart`, `store`, `work`, `business` |
| **Time** | `schedule`, `timer`, `calendar_today`, `event` |
| **Files** | `folder`, `folder_open`, `description`, `article`, `upload_file`, `download`, `upload` |
| **Actions** | `sync`, `refresh`, `autorenew`, `check`, `close`, `arrow_forward`, `arrow_back`, `open_in_new` |
| **People** | `person`, `group`, `account_circle`, `admin_panel_settings` |
| **Communication** | `email`, `chat`, `forum`, `phone`, `language`, `public` |
| **Industry** | `factory`, `local_hospital`, `health_and_safety`, `science`, `eco`, `solar_power`, `water_drop`, `thermostat`, `apartment`, `school` |
| **Development** | `build`, `construction`, `engineering`, `api`, `data_object`, `integration_instructions`, `schema`, `deployed_code`, `token` |
| **Navigation** | `location_on`, `map`, `explore`, `navigation`, `directions`, `flight`, `local_shipping` |

For ANY Material Symbols icon not listed above, set `customIcon` to the
icon name from fonts.google.com/icons. Use lowercase_with_underscores
exactly as shown on the Google Fonts site (e.g. `mode_heat_off`,
`nest_thermostat`). `customIcon` overrides `iconName` when set.

## All options

All keys in the JSON are written without the namespace prefix below for
readability. In actual dashboard JSON, prepend `icon_library.icon_library.`
to every key.

| Option | Type | Default | Description |
|---|---|---|---|
| `iconName` | enum | `home` | Popular icon from dropdown list |
| `customIcon` | string | *(empty)* | Any Material Symbols name — overrides `iconName` when set |
| `iconSize` | number | `0` | Icon size in px. `0` = auto-scale to fill panel |
| `iconColor` | hex | `#06B6D4` | Icon color |
| `hAlign` | enum | `center` | Horizontal position: `left`, `center`, `right` |
| `vAlign` | enum | `center` | Vertical position: `top`, `center`, `bottom` |
| `rotation` | number | `0` | Rotation angle 0–360 degrees |
| `showLabel` | enum | `no` | Show label below icon: `yes`, `no` |
| `labelText` | string | *(empty)* | Text to display below the icon |
| `labelSize` | number | `0` | Label font size in px. `0` = auto-scale |
| `labelColor` | hex | `#94A3B8` | Label text color |
| `bgShape` | enum | `none` | Background shape: `none`, `circle`, `rounded_rect`, `square` |
| `bgColor` | hex | `#1E293B` | Background fill color |
| `bgOpacity` | number | `1` | Background opacity 0–1 |
| `bgPadding` | number | `16` | Space between icon edge and background shape edge (px) |
| `bgRadius` | number | `12` | Corner radius for `rounded_rect` background (px) |
| `shadow` | enum | `no` | Drop shadow on icon or background: `yes`, `no` |
| `shadowColor` | hex | `#000000` | Shadow color |
| `shadowBlur` | number | `8` | Shadow blur radius (px) |
| `shadowOffsetX` | number | `0` | Shadow horizontal offset (px) |
| `shadowOffsetY` | number | `4` | Shadow vertical offset (px) |
| `glow` | enum | `no` | Glow effect around icon: `yes`, `no` |
| `glowColor` | hex | `#06B6D4` | Glow color |
| `glowSize` | number | `12` | Glow halo size (px) |
| `drilldown` | enum | `no` | Enable drilldown on click: `yes`, `no` |
| `drilldownUrl` | string | *(empty)* | URL to navigate to on click. Supports tokens: `$icon$`, `$label$`, `$color$`. Leave empty to use Dashboard Studio `eventHandlers` instead. |
| `drilldownNewTab` | enum | `yes` | Open drilldown URL in new browser tab: `yes`, `no` |

## Do / Don't

| Do | Don't |
|---|---|
| **ALWAYS** set `backgroundColor: "transparent"` on the viz (not in the namespace options — on the viz itself) | Default bg shows a dark box behind the icon that clashes with shadow cards |
| Use `customIcon` for any Material Symbols name not in the dropdown | Guess icon names — browse fonts.google.com/icons and copy the exact name |
| Set `iconSize: "0"` for auto-scaling icons that adapt to panel size | Use fixed pixel sizes that break when the panel is resized |
| Add `bgShape: "rounded_rect"` for KPI-style icon card tiles | Leave `bgShape: "none"` when the icon will float invisibly on a matching background |
| Use `shadow: "yes"` for depth on dark backgrounds | Stack shadow AND glow on the same icon — pick one, the combination is noisy |
| Data-drive icon color: return a hex field from SPL and set `iconColor` via `colorField` | Hardcode icon colors when they should reflect live data state |
| Prefix ALL options with `icon_library.icon_library.` in dashboard JSON | Omit the namespace prefix — options are silently ignored without it |

## Data-driven patterns

### Color from search result

Return a hex color field from SPL and use it to set the icon color
dynamically based on data state.

SPL example:

```spl
| makeresults
| eval status="critical", color=if(status="critical","#EF4444","#22C55E")
```

Panel options — reference the field name via a token or `colorField`
option (if the viz supports it). The standard approach in Dashboard
Studio is to bind the icon color to a token set by the search:

```json
"icon_library.icon_library.iconColor": "$color_tok$"
```

Set the token in an `eventHandler` or use `ds.chain` to extract the
field value from the search result and feed it into a token. The icon
re-renders whenever the token value changes.

### Status icon pattern

Return a field for both icon name and color to switch icons per status:

```spl
| makeresults
| eval status="warning"
| eval icon_name=case(
    status="ok",       "check_circle",
    status="warning",  "warning",
    status="critical", "error",
    true(),            "help"
  ),
  icon_color=case(
    status="ok",       "#22C55E",
    status="warning",  "#F59E0B",
    status="critical", "#EF4444",
    true(),            "#94A3B8"
  )
```

Bind `$icon_name_tok$` to `customIcon` and `$icon_color_tok$` to
`iconColor`. Each search run updates both the icon glyph and color
without any manual edits to the dashboard JSON.

## See also

- `ds-viz-infographic-shapes` — shapes with gradient fills, glow, and shadow (no icon glyph)
- `ds-svg` — custom SVG elements and choropleth canvas overlays
- `ds-viz-singlevalueicon` — built-in Splunk KPI tile with icon (no app dependency, limited icon set)
- `ds-viz-choropleth-svg` — inline SVG technique for simple decorative icons without an app install
