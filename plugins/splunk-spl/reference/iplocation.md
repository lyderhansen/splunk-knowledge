# iplocation — extract geographic info from IP addresses

Source: Splunk Search Reference 8.2.12, page 358.

## Syntax

    | iplocation [prefix=<string>] [allfields=<bool>] [lang=<string>] <field>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| field | yes | — | Field containing IP address |
| prefix | no | — | Prefix for output field names |
| allfields | no | true | Include all geo fields (City, Country, Region, lat, lon, MetroCode, Timezone) |

## Examples

### Basic enrichment

```spl
index=firewall | iplocation src
| stats count by Country, City | sort 0 -count
```

### For map visualization

```spl
index=firewall | iplocation src
| geostats latfield=lat longfield=lon count by action
```

## Gotchas

- **Private IPs return no data:** RFC1918 addresses (10.x, 172.16.x, 192.168.x) have no GeoIP entry — fields will be null.
- **MaxMind database accuracy:** City-level is ~70% accurate for IPv4, less for IPv6. Country-level is >99%.

## See also

- `geostats.md` — aggregate by geography for maps
- `geom.md` — polygon data for choropleth
