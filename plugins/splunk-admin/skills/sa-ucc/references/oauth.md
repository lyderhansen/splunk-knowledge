# OAuth & Authentication Reference

UCC supports three authentication methods in the Configuration page via the `oauth` entity type.

## Auth Types

| auth_type value | Flow |
|----------------|------|
| `basic` | Username + password (+ optional extras) |
| `oauth` | OAuth 2.0 Authorization Code (interactive popup) |
| `oauth_client_credentials` | OAuth 2.0 Client Credentials (non-interactive) |

---

## Full OAuth Entity Example

```jsonc
{
  "type": "oauth",
  "field": "oauth",
  "label": "Authentication",
  "options": {
    "auth_type": ["basic", "oauth"],
    "auth_label": "Auth Type",          // optional: label for the auth selector

    "basic": [
      {
        "field": "username",
        "label": "Username",
        "help": "Enter your username.",
        "required": true
      },
      {
        "field": "password",
        "label": "Password",
        "encrypted": true,
        "required": true
      }
    ],

    "oauth": [
      {"field": "client_id",     "label": "Client ID",     "required": true},
      {"field": "client_secret", "label": "Client Secret", "encrypted": true, "required": true},
      {"field": "redirect_url",  "label": "Redirect URL",  "required": true},
      {"field": "endpoint",      "label": "Endpoint",      "defaultValue": "login.example.com", "required": true},
      {"field": "scope",         "label": "Scope",         "required": false}
    ],

    "auth_code_endpoint":   "/services/oauth2/authorize",
    "access_token_endpoint": "/services/oauth2/token",

    // Optional popup sizing / timeout
    "oauth_popup_width":  600,
    "oauth_popup_height": 600,
    "oauth_timeout":      180,

    // Optional: separate authorize vs token endpoints
    // "endpoint_authorize": "login.example.com",
    // "endpoint_token":     "api.login.example.com"
  }
}
```

## Client Credentials Flow

```jsonc
{
  "type": "oauth",
  "field": "oauth",
  "label": "Authentication",
  "options": {
    "auth_type": ["oauth_client_credentials"],
    "oauth_client_credentials": [
      {"field": "client_id_oauth_credentials",       "label": "Client ID",     "required": true},
      {"field": "client_secret_oauth_credentials",   "label": "Client Secret", "encrypted": true, "required": true},
      {"field": "endpoint_token_oauth_credentials",  "label": "Token Endpoint","required": true},
      {"field": "scope",                             "label": "Scope",         "required": false}
    ]
  }
}
```

## Custom Auth Method

You can add custom auth methods alongside the built-ins. The backend REST handler must support the new method:

```jsonc
"auth_type": ["basic", "oauth", "my_api_key_method"],

"my_api_key_method": [
  {"field": "api_key", "label": "API Key", "encrypted": true, "required": true}
],

"oauth_type_labels": {
  "basic":             "Basic Auth",
  "oauth":             "OAuth 2.0",
  "my_api_key_method": "API Key"
}
```

## Field Options (within auth sections)

| Property | Description |
|----------|-------------|
| `field` | Key name (mandatory fields must keep their prescribed names) |
| `label` | UI label |
| `help` | Help text below field |
| `encrypted` | Store value in Splunk's encrypted storage |
| `required` | Default `true` |
| `defaultValue` | Initial value |
| `validators` | Array of validator objects |
| `options.disableonEdit` | Lock field in edit mode |
| `options.enable` | Enable/disable field |

## Mandatory field names

For `basic`: `username` and `password` are required keys.
For `oauth`: `client_id`, `client_secret`, `redirect_url`, `endpoint` (or `endpoint_authorize` + `endpoint_token`).
For `oauth_client_credentials`: `client_id_oauth_credentials`, `client_secret_oauth_credentials`, `endpoint_token_oauth_credentials`.

## Runtime: reading auth credentials in Python

```python
from solnlib import conf_manager

def get_account_credentials(session_key, addon_name, account_name, realm):
    cfm = conf_manager.ConfManager(session_key, addon_name)
    account_conf = cfm.get_conf("ta_my_addon_account")
    stanza = account_conf.get(account_name)
    return stanza  # dict with decrypted fields
```
