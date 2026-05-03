# iplocation — extract geographic info from IP addresses

Source: Splunk Search Reference 10.2.0

## Syntax

    | iplocation [prefix=<string>] [allfields=<bool>] [lang=<string>] <ip-address-fieldname>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `ip-address-fieldname` | Yes | — | Field containing the IP address (IPv4 or IPv6, CIDR notation supported) |
| `allfields` | No | `false` | If `false`, adds `City`, `Country`, `Region`, `lat`, `lon`. If `true`, also adds `Continent`, `MetroCode`, `Timezone` |
| `prefix` | No | (none) | String prefix for all output field names to avoid collisions (e.g., `prefix=src_` → `src_City`, `src_lat`) |
| `lang` | No | (system default) | Language for rendered strings (e.g., `lang=es` for Spanish). Use `lang=code` for two-letter ISO abbreviations |

## Output fields (default, `allfields=false`)

| Field | Description |
|---|---|
| `City` | City name |
| `Country` | Country name |
| `Region` | Region/state/province |
| `lat` | Latitude (decimal degrees) |
| `lon` | Longitude (decimal degrees) |

Additional with `allfields=true`: `Continent`, `MetroCode`, `Timezone`.

## Database

Splunk ships with `dbip-city-lite.mmdb` in `$SPLUNK_HOME/share/`. You can replace it with `GeoLite2-City.mmdb` or `GeoIP2-City.mmdb` (MaxMind) via Settings > Lookups > GeoIP lookups file. The GeoIP2-City (paid) is more accurate.

## Examples

### Basic enrichment

```spl
index=firewall | iplocation src
| stats count by Country, City | sort 0 -count
```

### Avoid field name collision — two IP fields

```spl
index=proxy | iplocation prefix=src_ src_ip
| iplocation prefix=dst_ dst_ip
| table src_ip, src_Country, dst_ip, dst_Country
```

### For bubble map visualization

```spl
index=firewall | iplocation src
| geostats latfield=lat longfield=lon count by action
```

### All fields with locale

```spl
index=web | iplocation allfields=true lang=es clientip
| table clientip, Country, City, Continent, Timezone
```

## Gotchas

- **Private/RFC1918 IPs return no fields** — `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`, `127.x.x.x`, and other reserved ranges have no GeoIP entry. The output fields will simply be absent for those events. Filter with `| where isnotnull(Country)` to remove internal traffic before aggregation.
- **`allfields=false` is the default** — `Continent`, `MetroCode`, and `Timezone` are NOT added unless you explicitly set `allfields=true`. This surprises users who expect all fields by default.
- **MaxMind accuracy varies** — the bundled free database is city-level accurate roughly 70% of the time for IPv4 and less for IPv6. Country-level is >99%. Do not use city data for SLA or compliance decisions.
- **`MetroCode` absent in default database** — the bundled `dbip-city-lite.mmdb` does not include `MetroCode`. Only the MaxMind `GeoIP2-City.mmdb` provides it. `Timezone` is also absent from the bundled file.
- **Distributable streaming** — `iplocation` runs on indexers, so place it early in the pipeline before any transforming commands to maximize parallelism.
- **Field name casing** — output fields use title case (`City`, `Country`, `Region`). Using lowercase in `stats` or `table` will silently return null.

## Tips

Use `prefix=` when your events contain both source and destination IPs — without it, the second `iplocation` call overwrites the fields from the first.

## See also

- `geostats.md` — aggregate by geography for bubble/cluster maps
- `geom.md` — polygon data for choropleth maps
