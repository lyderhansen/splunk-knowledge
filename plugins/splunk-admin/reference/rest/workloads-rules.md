# /services/workloads/rules

Create, list, update, and delete workload rules (routing/admission predicates) and admission rules tied to workload pools.

**Category:** Workloads

## Endpoint details

| Property | Value |
|----------|-------|
| URL | `/services/workloads/rules`, `/services/workloads/rules/{name}` |
| Auth required | Yes |
| Capability | GET: `list_workload_rules`; POST / DELETE: `edit_workload_rules` |

### Splunk Cloud Platform

Workload endpoints are generally **not** available on Splunk Cloud Platform.

---

## GET /services/workloads/rules

Return workload rules and optionally admission (`search_filter`) rules based on query parameters.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| workload_rule_type | String | No | — | `search_filter` returns admission rules only; `all` returns admission plus workload rules. Omitting the parameter leaves workload-only listing behavior consistent with Splunk docs (“specify … `/services/workloads/rules/{rule_name}`” for pure workload detail). |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| predicate | String | Condition searches must satisfy before actions trigger (`app`, `role`, `index`, `user`, `search_type`, `search_mode`, `search_time_range`, `runtime`, combined with AND/OR/NOT). |
| action | String | For workload rules: `alert`, `move`, or `abort`. Admission rules require `filter`. |
| workload_pool | String | Destination workload pool (`move` action) or pool association for routing rules. |
| order | Number | Evaluation order among workload rules (lower numbers evaluated earlier). |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/rules?output_mode=json
```

---

## POST /services/workloads/rules

Create a workload rule or admission rule, or toggle admission rule enablement when combined with `workload_rule_type`.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| name | String | Yes | — | Rule name. |
| predicate | String | Yes | — | Single predicate expression (`field=value` with optional boolean composition). |
| action | String | Yes | — | `alert`, `move`, `abort` for workload rules; must be `filter` for admission rules. |
| workload_pool | String | Conditional | — | Required destination pool for `move`; optional otherwise. |
| order | Number | No | — | For **existing** rules only—Splunk docs note order cannot be set during creation. |
| workload_rule_type | String | Conditional | — | Set to `search_filter` when enabling/disabling admission-control entries via REST. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented; Splunk responds with created rule entries. |

### Example

```
curl -k -u admin:pass -X POST https://localhost:8089/services/workloads/rules \
  -d name=ruleTest2 \
  -d predicate='(role=user AND runtime>5m)' \
  -d action=abort
```

---

## GET /services/workloads/rules/{name}

Fetch a single workload or admission rule (`{name}` rule stanza). Equivalent to filtering the collection endpoint down to one entry.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| — | — | — | — | None documented beyond Splunk REST defaults. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| predicate | String | Predicate evaluated for the rule. |
| action | String | Associated action (`alert`, `move`, `abort`, `filter`). |
| workload_pool | String | Linked workload pool when applicable. |
| order | Number | Evaluation order. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/rules/rule_1?output_mode=json
```

---

## POST /services/workloads/rules/{name}

Update mutable fields on an existing rule using Splunk REST edit semantics (same optional arguments as collection POST where applicable, notably `order`, `predicate`, `action`, `workload_pool`, `workload_rule_type` for admission operations).

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| predicate | String | No | — | Replacement predicate string. |
| action | String | No | — | Replacement action. |
| workload_pool | String | No | — | Replacement workload pool binding. |
| order | Number | No | — | Updated evaluation order (allowed for existing rules). |
| workload_rule_type | String | No | — | Supply `search_filter` when manipulating admission-control entries. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented; feed echoes updated rule payload. |

### Example

```
curl -k -u admin:pass https://localhost:8089/services/workloads/rules/rule_1 \
  -d order=2 -d workload_pool=pool_highprio
```

---

## DELETE /services/workloads/rules/{name}

Delete workload or admission rules.

### Request parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| workload_rule_type | String | No | — | Supply `search_filter` when deleting admission-control rules. |

### Returned values

| Name | Type | Description |
|------|------|-------------|
| — | — | None documented. |

### Example

```
curl -k -u admin:pass -X DELETE https://localhost:8089/services/workloads/rules/rule_name
```
