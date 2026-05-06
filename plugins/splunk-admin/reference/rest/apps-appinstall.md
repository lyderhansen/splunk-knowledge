# /services/apps/appinstall

Install or update an application from a local path or URL (deprecated; use `apps/local` instead).

**Category:** Apps

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/apps/appinstall` |
| Auth required | Yes |
| Capability | Not enumerated on this endpoint; requires credentials authorized to install apps. Deprecated as of Splunk Enterprise 6.6.0—prefer `/services/apps/local`. |

## POST /services/apps/appinstall

Install or update an application from a local file or URL. The response may be delayed while the app installs.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | Yes | — | Full Unix or Windows path of the `.tgz` or `.spl` app source file, or a URL to that archive. |
| update | Boolean | No | `false` | When `true`, update an existing installed app and overwrite its folder; when `false`, install as a new app. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| location | String | Filesystem path where the app was installed under `$SPLUNK_HOME/etc/apps/`. |
| name | String | Installed application name. |
| source_location | String | Source archive location that was supplied in the `name` request parameter. |
| status | String | Installation outcome; `installed` indicates success. |
| eai:acl | Object | Standard Splunk ACL metadata for the created resource entry (app, owner, modifiable, perms, sharing, etc.). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/apps/appinstall -d name=/tmp/example_app.tgz -d output_mode=json
```

## GET

Not documented for this endpoint.

## DELETE

Not documented for this endpoint.
