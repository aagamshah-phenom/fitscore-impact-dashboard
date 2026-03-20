# Account / Tenant Mapping

**Primary Database:** CID    **Primary Schema:** RAW_SCHEMA

Documents how to resolve REFNUM (the universal customer identifier in all Hiring Intelligence tables) to human-readable account names. Required for any customer-level analysis.

## What is REFNUM?

REFNUM is the primary customer identifier across **all** Hiring Intelligence Snowflake tables. Every table has a `REFNUM` column. It maps to the Salesforce Account record for the customer.

| Field | Table | Description |
| --- | --- | --- |
| REFNUM | All Hiring Intelligence tables | Customer identifier — present on every table, use as primary filter |
| REFNUM_C | CID.SALESFORCE_SCHEMA.ACCOUNT | Same value as REFNUM — join key on the Salesforce side |
| NAME | CID.SALESFORCE_SCHEMA.ACCOUNT | Human-readable customer account name |

## SALESFORCE_SCHEMA.ACCOUNT

The authoritative source for resolving REFNUM to account name.

| Column | Type | Description |
| --- | --- | --- |
| REFNUM_C | VARCHAR | Customer identifier — joins to REFNUM in all other tables |
| NAME | VARCHAR | Account name (e.g., "Acme Corp") |

## Standard Join Pattern

Always join like this when you need customer name in results:

```sql
SELECT a.NAME AS account_name, a.REFNUM_C AS refnum, ...
FROM CID.RAW_SCHEMA.[pod_table] t
JOIN CID.SALESFORCE_SCHEMA.ACCOUNT a ON t.REFNUM = a.REFNUM_C
WHERE t.REFNUM = '{customer_refnum}'
```

## Refresh Query (cached mapping)

Use this to refresh the local refnum_account_mapping.json cache:

```sql
SELECT DISTINCT REFNUM_C AS refnum, NAME AS account_name
FROM CID.SALESFORCE_SCHEMA.ACCOUNT
WHERE REFNUM_C IS NOT NULL AND REFNUM_C != ''
ORDER BY account_name
```

## Performance Note

Always filter by `REFNUM = '{customer}'` as the **first filter** in any query for performance. The REFNUM column is the primary partitioning key across tables.
