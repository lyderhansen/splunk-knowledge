# lookup — enrich events with lookup table values

Source: Splunk Search Reference 8.2.12, page 378.

## Syntax

    | lookup [local=<bool>] [update=<bool>] <lookup-name> <lookup-field> [AS <event-field>] [OUTPUT|OUTPUTNEW <lookup-field> [AS <event-field>]]...

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| lookup-name | yes | — | Name of the lookup table (CSV or KV store) |
| lookup-field | yes | — | Field in the lookup to match on |
| AS event-field | no | same name | Map lookup field to a different event field name |
| OUTPUT | no | all non-match fields | Fields to add from the lookup. `OUTPUTNEW` only adds if field doesn't exist |
| local | no | false | Only use lookups from the local app |
| update | no | true | Whether to update the lookup cache |

## Examples

### Basic enrichment

```spl
index=main | lookup geo_ip_lookup ip AS src OUTPUT city, country, lat, lon
```

### Rename on output

```spl
index=main | lookup customer_lookup customer_id OUTPUT customer_name AS name, tier
```

### Automatic lookups

Configured in `transforms.conf` + `props.conf` — run without explicit `| lookup`:

```ini
# transforms.conf
[customer_lookup]
filename = customer_lookup.csv

# props.conf
[source::...]
LOOKUP-customers = customer_lookup customer_id OUTPUT customer_name
```

## Gotchas

- **OUTPUT vs OUTPUTNEW:** `OUTPUT` overwrites existing fields. `OUTPUTNEW` only writes if the field is null. Use `OUTPUTNEW` when you don't want to clobber existing values.
- **Case-sensitive by default:** Lookup matching is case-sensitive. Configure `case_sensitive_match = false` in `transforms.conf` for case-insensitive matching.
- **Missing keys return null:** If the event's key doesn't match any lookup row, the output fields are null (not an error).

## See also

- `inputlookup.md` — load lookup as results
- `outputlookup.md` — write results to lookup
