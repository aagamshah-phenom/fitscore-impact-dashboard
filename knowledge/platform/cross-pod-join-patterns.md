# Cross-Pod Join Patterns

Documented join paths and analysis patterns that span multiple pods or require combining pod-specific tables with platform entity tables. This is the highest-value data context document for complex cross-pod queries — the LLM uses these to construct accurate Snowflake queries without hallucinating column names or join keys.

## Counting Interview Rounds

Two approaches exist — they measure different things and give different numbers. Present both when possible.

### Approach 1: Hiring Status Changes (Universal Coverage)

| Attribute | Value |
| --- | --- |
| Table | CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS |
| What it measures | Pipeline stage transitions to INTERVIEW status — how many times candidate was moved to/through Interview status |
| Typical values | ~1.1–1.6 per offered candidate |
| Pro | Available for all candidates. High coverage. |
| Con | Undercounts actual interviews — one status change may represent multiple interview events. |

```sql
SELECT APPLICATION_ID,
    COUNT(DISTINCT HIRING_STATUS_UPDATED_DATE) AS interview_status_changes
FROM CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS
WHERE REFNUM = '{customer}' AND HIRING_STATUS_VALUE = 'INTERVIEW'
GROUP BY APPLICATION_ID
```

### Approach 2: Scheduling Requests (More Accurate, Limited Coverage)

| Attribute | Value |
| --- | --- |
| Table | CID.RAW_SCHEMA.RB_SCHEDULING_SCHEDULE_REQUEST |
| What it measures | Actual interview scheduling events through Phenom scheduling product |
| Typical values | ~1.5–2.2 per offered candidate (where data exists) |
| Pro | Each scheduling request = one interview event. More accurate count. |
| Con | Only covers candidates who used Phenom scheduling. Coverage varies widely (~15% for some customers). |

```sql
SELECT sr.CANDIDATE_ATS_APPLICATION_ID AS APPLICATION_ID,
    COUNT(DISTINCT sr.SCHEDULE_REQUEST_OBJECT_ID) AS scheduled_interviews
FROM CID.RAW_SCHEMA.RB_SCHEDULING_SCHEDULE_REQUEST sr
WHERE sr.REFNUM = '{customer}'
GROUP BY sr.CANDIDATE_ATS_APPLICATION_ID
```

**Recommendation:** Present both approaches when possible. The gap between them reveals Phenom scheduling adoption rate for the customer.

## Time to Offer / Time to Hire

Standard pattern for calculating time through the hiring funnel for candidates who received an offer.

**Definition:** Time to Offer = days from APPLIED_DATE to first HIRING_STATUS_UPDATED_DATE where HIRING_STATUS_VALUE = 'OFFER'. Scope to candidates who received at least one OFFER.

**Key dimensions:** JOB_CATEGORY, APPLIED_JOB_LOCATION, JOB_ID

```sql
WITH offered_apps AS (
    SELECT DISTINCT APPLICATION_ID
    FROM CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS
    WHERE REFNUM = '{customer}' AND JOB_CATEGORY = '{job_family}'
      AND HIRING_STATUS_VALUE = 'OFFER' AND APPLICATION_ID IS NOT NULL
),
app_base AS (
    SELECT d.APPLICATION_ID,
        MIN(d.APPLIED_DATE) AS applied_date,
        MAX(d.APPLIED_JOB_LOCATION) AS job_location
    FROM CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS d
    JOIN offered_apps oa ON d.APPLICATION_ID = oa.APPLICATION_ID
    WHERE d.REFNUM = '{customer}' AND d.JOB_CATEGORY = '{job_family}'
    GROUP BY d.APPLICATION_ID
),
first_offer AS (
    SELECT APPLICATION_ID, MIN(HIRING_STATUS_UPDATED_DATE) AS first_offer_date
    FROM CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS d
    JOIN offered_apps oa USING (APPLICATION_ID)
    WHERE d.REFNUM = '{customer}' AND d.HIRING_STATUS_VALUE = 'OFFER'
    GROUP BY APPLICATION_ID
)
SELECT
    CASE WHEN CONTAINS(ab.job_location, ' > ') THEN SPLIT_PART(ab.job_location, ' > ', 1)
         ELSE TRIM(SPLIT_PART(ab.job_location, ' - ', 1)) END AS country,
    COUNT(*) AS offers,
    ROUND(AVG(DATEDIFF('day', ab.applied_date, fo.first_offer_date)), 1) AS avg_days_to_offer,
    ROUND(MEDIAN(DATEDIFF('day', ab.applied_date, fo.first_offer_date)), 1) AS med_days_to_offer
FROM app_base ab
JOIN first_offer fo ON ab.APPLICATION_ID = fo.APPLICATION_ID
GROUP BY country
ORDER BY offers DESC
```

**Notes:** Filter to offered candidates first, then look backward at their journey. Use LEFT JOIN for screen/interview CTEs, INNER JOIN for offer CTE. Negative days_to_offer values indicate data quality issues.

## Application → Interview Scheduling Join

Links an application to its scheduled interviews via Phenom scheduling. Coverage varies by customer (~15% for some).

```sql
JOIN CID.RAW_SCHEMA.RB_SCHEDULING_SCHEDULE_REQUEST sr
  ON app.APPLICATION_ID = sr.CANDIDATE_ATS_APPLICATION_ID
-- Result: one row per scheduling request linked to this application
```

## Application → Screening Join

Links an application to its video screening assessment. Requires both USER_ID and JOB_ID to match. Coverage can be very low for some job families.

```sql
JOIN CID.RAW_SCHEMA.RB_VIDEO_SCREENS vs
  ON app.USER_ID = vs.VIDEOSCREENCANDIDATE_CANDIDATEID
 AND app.JOB_ID = vs.INTERVIEWDETAILS_ENTITYVALUE
-- Note: ATS_ID does NOT match RB_VIDEO_SCREENS candidate ID — use USER_ID instead
```

## Scheduling WoW Trend by Customer

Standard pattern for week-over-week scheduling volume analysis with customer segmentation:

```sql
SELECT
    a.NAME AS account_name,
    DATE_TRUNC('week', sr.CREATED_DATE) AS week,
    COUNT(DISTINCT sr.SCHEDULE_REQUEST_OBJECT_ID) AS scheduling_requests
FROM CID.RAW_SCHEMA.RB_SCHEDULING_SCHEDULE_REQUEST sr
JOIN CID.SALESFORCE_SCHEMA.ACCOUNT a ON sr.REFNUM = a.REFNUM_C
WHERE sr.CREATED_DATE >= DATEADD('MONTH', -3, CURRENT_DATE())
GROUP BY 1, 2
ORDER BY 1, 2
```

## Job Activity: Is a Job Active?

Three approaches for determining if a job has meaningful activity. Use alone or combine.

### Approach 1: Application Count

Job has N+ applications created in a time period.

```sql
SELECT JOB_ID, REFNUM, COUNT(DISTINCT APPLICATION_ID) AS app_count
FROM CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS
WHERE REFNUM = '{customer}' AND APPLIED_DATE >= DATEADD('MONTH', -3, CURRENT_DATE())
GROUP BY JOB_ID, REFNUM
HAVING app_count >= 1
```

### Approach 2: Hiring Status Changes

Job has N+ hiring status changes (recruiter/candidate activity beyond apply).

```sql
SELECT JOB_ID, REFNUM, COUNT(*) AS status_change_count
FROM CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS
WHERE REFNUM = '{customer}' AND HIRING_STATUS_UPDATED_DATE >= DATEADD('MONTH', -3, CURRENT_DATE())
GROUP BY JOB_ID, REFNUM
HAVING status_change_count >= 1
```

### Approach 3: Meaningful Status Changes Only

Exclude the initial LEAD status assigned at apply time — only count recruiter-driven pipeline movement.

```sql
SELECT JOB_ID, REFNUM, COUNT(*) AS meaningful_change_count
FROM CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS
WHERE REFNUM = '{customer}'
  AND HIRING_STATUS_UPDATED_DATE >= DATEADD('MONTH', -3, CURRENT_DATE())
  AND COALESCE(HIRING_STATUS_STEP, '') != 'LEAD'
  AND HIRING_STATUS_PREVIOUS_STEP IS NOT NULL
GROUP BY JOB_ID, REFNUM
HAVING meaningful_change_count >= 1
```

### Combined (recommended)

```sql
WITH active_by_apps AS (
  SELECT JOB_ID, REFNUM FROM CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS
  WHERE REFNUM = '{customer}' AND APPLIED_DATE >= DATEADD('MONTH', -3, CURRENT_DATE())
  GROUP BY JOB_ID, REFNUM HAVING COUNT(DISTINCT APPLICATION_ID) >= 1
),
active_by_changes AS (
  SELECT JOB_ID, REFNUM FROM CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS
  WHERE REFNUM = '{customer}' AND HIRING_STATUS_UPDATED_DATE >= DATEADD('MONTH', -3, CURRENT_DATE())
    AND COALESCE(HIRING_STATUS_STEP, '') != 'LEAD' AND HIRING_STATUS_PREVIOUS_STEP IS NOT NULL
  GROUP BY JOB_ID, REFNUM HAVING COUNT(*) >= 1
)
SELECT DISTINCT JOB_ID, REFNUM FROM active_by_apps
UNION
SELECT DISTINCT JOB_ID, REFNUM FROM active_by_changes
```

**Note:** `RB_APPLICATIONS_DETAILS` has both `APPLIED_DATE` and `HIRING_STATUS_UPDATED_DATE` — one table covers both application counts and status change analysis.

## Adding New Patterns

When you discover a reliable cross-pod join pattern, document it here with: the two tables being joined, the join key, coverage notes, and a query example.
