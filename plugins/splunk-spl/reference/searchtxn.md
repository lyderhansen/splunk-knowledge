# searchtxn — search pre-defined transaction types

Source: Splunk Search Reference 8.2.12, page 501.

## Syntax

    | searchtxn <transaction-type-name>

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| transaction-type-name | yes | — | Name of a transaction type defined in `transactiontypes.conf` |

## Examples

```spl
index=main | searchtxn purchase_flow
```

## See also

- `transaction.md` — inline transaction grouping
