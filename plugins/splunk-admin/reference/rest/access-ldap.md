> **Overview:** Splunk Enterprise users can configure LDAP user authentication using the REST API. If you are using Splunk Cloud Platform, contact Support for assistance with setting up LDAP authentication.

# /services/admin/LDAP-groups

Access and update LDAP group to role mappings.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/admin/LDAP-groups` |
| Auth required | Yes |
| Capability | `change_authentication` |

## GET /services/admin/LDAP-groups

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| strategy | String | No | — | LDAP strategy name |
| LDAPgroup | String | No | — | LDAP group name |

### Returned values

| Name | Type | Description |
|---|---|---|
| roles | String | Roles mapped to this group |
| strategy | String | Strategy name |
| type | String | Group type |
| users | String | List of users in this group |

### Example

```
curl -u admin:changeme -X GET -k https://localhost:8089/services/admin/LDAP-groups/
```

## POST /services/admin/LDAP-groups

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| strategy | String | Yes | — | Required. LDAP strategy name |
| LDAPgroup | String | Yes | — | Required. LDAP group name |

### Returned values

| Name | Type | Description |
|---|---|---|
| roles | String | Roles mapped to this group. |
| strategy | String | Strategy name |
| type | String | Group type |
| users | String | List of users in this group. |

### Example

```
curl -k -u admin:password -X POST
  https://localhost:8089/services/admin/LDAP-groups/ActiveDirectory_New,Abc123-Admin -d roles=user
```


---

# /services/authentication/providers/LDAP

Access or create LDAP authentication strategies on a server in your deployment.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/providers/LDAP` |
| Auth required | Yes |
| Capability | `change_authentication` |

## GET /services/authentication/providers/LDAP

### Request parameters

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| strategy | String | No | — | Name of LDAP configuration strategy |

### Returned values

The response lists LDAP strategy settings.

See [LDAP settings in authentication.conf](https://help.splunk.com/?resourceId=Splunk_Admin_Authenticationconf) for strategy settings information.

### Example

```
curl -k -u admin:password https://localhost:8089/services/authentication/providers/LDAP/
```

## POST /services/authentication/providers/LDAP

### Request parameters

See [LDAP settings in authentication.conf](https://help.splunk.com/?resourceId=Splunk_Admin_Authenticationconf) for required and optional settings information.

Returned values

None.

### Returned values

No returned fields in the documentation.

### Example

```
curl —k u admin:password -X POST https://localhost:8089/services/authentication/providers/LDAP/ -d name=my_strategy -d groupBaseDN="CN=Saml user2,OU=SAML Test,DC=qa,DC=ad2008r2,DC=com" -d groupMemberAttribute=sn -d groupNameAttribute=sn -d host=1.1.1.1 -d realNameAttribute=sn -d userBaseDN="OU=SAML Test,DC=qa,DC=ab2008e2,DC=com" -d userNameAttribute=sn -d bindDN="CN=Saml user2,OU=SAML Test,DC=qa,DC=ad2008r2,DC=com" -d bindDNpassword=password
```


---

# /services/authentication/providers/LDAP/{LDAP_strategy_name}

Access, update, or delete the`{LDAP_strategy_name}` strategy.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/providers/LDAP/{LDAP_strategy_name}` |
| Auth required | Yes |
| Capability | `change_authentication` |

## POST /services/authentication/providers/LDAP/{LDAP_strategy_name}

### Request parameters

and returned values

See [LDAP settings in authentication.conf](https://help.splunk.com/?resourceId=Splunk_Admin_Authenticationconf) for strategy settings information.

### Example

```
curl -k -u admin:password -X POST https://localhost:8089/services/authentication/providers/LDAP/my_strategy -d port=390
```

## DELETE /services/authentication/providers/LDAP/{LDAP_strategy_name}

### Request parameters

No request parameters.

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:password -X DELETE https://localhost:8089/services/authentication/providers/LDAP/my_strategy
```


---

# /services/authentication/providers/LDAP/{LDAP_strategy_name}/enable

See Splunk REST API Access Control reference.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/providers/LDAP/{LDAP_strategy_name}/enable` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## POST /services/authentication/providers/LDAP/{LDAP_strategy_name}/enable

### Request parameters

No request parameters.

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:password -X POST https://localhost:8089/services/authentication/providers/LDAP/my_strategy/enable
```


---

# /services/authentication/providers/LDAP/{LDAP_strategy_name}/disable

See Splunk REST API Access Control reference.

**Category:** Access control

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/authentication/providers/LDAP/{LDAP_strategy_name}/disable` |
| Auth required | Yes |
| Capability | `See Splunk Access Control REST reference` |

## POST /services/authentication/providers/LDAP/{LDAP_strategy_name}/disable

### Request parameters

No request parameters.

### Returned values

No returned fields in the documentation.

### Example

```
curl -k -u admin:password -X POST https://localhost:8089/services/authentication/providers/LDAP/my_strategy/disable
```


---
