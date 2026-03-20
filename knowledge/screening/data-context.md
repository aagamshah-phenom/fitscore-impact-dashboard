# Screening — Data Context

**Database:** CID   **Schema:** RAW_SCHEMA

Pod-specific tables for the Screening experience. Platform-level entities (applications, candidates, account mapping) are in **Platform Data Context**.

## RB_VIDEO_SCREENS

Core table for screening requests and assessments. One row per screening request.

| Column | Type | Description |
| --- | --- | --- |
| VIDEO_SCREEN_ID | VARCHAR | Primary key — unique screening request identifier |
| REFNUM | VARCHAR | Customer identifier — join to SALESFORCE_SCHEMA.ACCOUNT |
| DATE_CREATED | TIMESTAMP | When the screening was initiated |
| ASSESSMENT_COMPLETED | TIMESTAMP | When the candidate completed the screening (NULL if not completed) |
| EVALUATED_DATE | TIMESTAMP | When the recruiter evaluated the screening (NULL if not evaluated) |
| SCREENING_TYPE | VARCHAR | standard \| conversational (conversational = Voice Agent screening) |
| INTERVIEWDETAILS_ENTITYVALUE | VARCHAR | JOB_ID for the position — joins to RB_APPLICATIONS_DETAILS.JOB_ID |
| INTERVIEWDETAILS_JOBDETAILS | VARIANT | JSON object with additional job details |
| RECRUITERDETAILS_RECRUITERUSERID | VARCHAR | Recruiter user ID |
| VIDEOSCREENCANDIDATE_CANDIDATEID | VARCHAR | Candidate ID — joins to RB_APPLICATIONS_DETAILS.USER_ID (NOT ATS_ID) |

## Calculated Fields

| Field | Formula | Notes |
| --- | --- | --- |
| time_to_complete | DATEDIFF('hour', DATE_CREATED, ASSESSMENT_COMPLETED) | Time for candidate to complete screening. Use 'day' or 'minute' as needed. |
| time_to_evaluate | DATEDIFF('hour', ASSESSMENT_COMPLETED, EVALUATED_DATE) | Time for recruiter to evaluate after candidate completion |

## Common Filters

* `REFNUM = '{customer}'` — always filter first for performance
* `DATE_CREATED >= DATEADD('MONTH', -3, CURRENT_DATE())`
* `SCREENING_TYPE = 'conversational'` — Voice Agent only
* `ASSESSMENT_COMPLETED IS NOT NULL` — completed screenings only

## Common Joins

```sql
-- Get customer name
JOIN CID.SALESFORCE_SCHEMA.ACCOUNT a ON REFNUM = a.REFNUM_C

-- Link to application (requires both USER_ID and JOB_ID match — coverage varies)
JOIN CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS app
  ON VIDEOSCREENCANDIDATE_CANDIDATEID = app.USER_ID
 AND INTERVIEWDETAILS_ENTITYVALUE = app.JOB_ID
```

See **platform/cross-pod-join-patterns.md** for the full Application → Screening join pattern with coverage notes.
