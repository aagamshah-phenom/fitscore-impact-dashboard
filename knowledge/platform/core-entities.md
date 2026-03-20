# Core Entities

**Database:** CID    **Schema:** RAW_SCHEMA    **Last updated:** 2026-02-10

Cross-pod foundational tables used by multiple experience pods. Always included as Tier 1 context in Product Copilot LLM calls.

## RB_APPLICATIONS

Job applications submitted by candidates.

| Column | Type | Description |
| --- | --- | --- |
| APPLICATION_ID | VARCHAR | Unique application identifier |
| REFNUM | VARCHAR | Customer identifier — join to SALESFORCE_SCHEMA.ACCOUNT |
| APPLIED_DATE | TIMESTAMP | When the application was submitted |
| HIRING_STATUS_CODE | VARCHAR | Current hiring status |
| JOB_ID | VARCHAR | Job posting identifier |

## RB_APPLICATIONS_DETAILS

Extended application data. **Each row = one hiring status change for an application.**

**WARNING: Rows can be duplicated** — the same status change (same APPLICATION_ID + HIRING_STATUS_UPDATED_DATE + HIRING_STATUS_STEP) may appear multiple times. Always use `COUNT(DISTINCT HIRING_STATUS_UPDATED_DATE)` when counting status changes, NOT `COUNT(*)`.

| Column | Type | Description |
| --- | --- | --- |
| APPLICATION_ID | VARCHAR | Unique application identifier |
| ATS_ID | VARCHAR | ATS candidate ID. Format: CANDIDATE-3-XXXXX. Does NOT match RB_VIDEO_SCREENS candidate ID. |
| USER_ID | VARCHAR | Hash-style candidate user ID. Joins to RB_VIDEO_SCREENS.VIDEOSCREENCANDIDATE_CANDIDATEID for screening linkage. |
| REFNUM | VARCHAR | Customer identifier |
| JOB_ID | VARCHAR | Job posting identifier |
| JOB_TITLE | VARCHAR | Job title (e.g., "Quality Specialist") |
| JOB_CATEGORY | VARCHAR | Job family/category (e.g., "Quality", "Stores & Distribution"). Use to filter by job family. |
| APPLIED_JOB_LOCATION | VARCHAR | Job location as displayed to applicant. Primary field for geographic analysis. Three inconsistent formats — see parsing notes below. |
| APPLIED_DATE | TIMESTAMP | When the application was submitted |
| HIRING_STATUS_CODE | VARCHAR | Hiring status code |
| HIRING_STATUS_STEP | VARCHAR | Human-readable step (e.g., "New Candidate", "Interview", "Offer", "Ready for Hire") |
| HIRING_STATUS_VALUE | VARCHAR | Normalized status value. See Hiring Pipeline section. Values: Lead, REVIEW, SCREEN, INTERVIEW, OFFER, HIRED, REJECTED |
| HIRING_STATUS_UPDATED_DATE | TIMESTAMP | When this status change occurred. Use with COUNT(DISTINCT) — rows may be duplicated. |
| HIRING_STATUS_PREVIOUS_STEP | VARCHAR | Previous step. NULL for first status. Use IS NOT NULL to filter to meaningful changes. |
| HIRING_STATUS_PREVIOUS_VALUE | VARCHAR | Previous status value |
| IS_REJECTED | BOOLEAN | Whether the candidate was rejected |
| REJECTION_REASON | VARCHAR | Reason for rejection |
| FIRST_SOURCE_CHANNEL | VARCHAR | First source channel (e.g., "direct / not_set") |
| LAST_SOURCE_CHANNEL | VARCHAR | Most recent source channel (e.g., "Internal Applicant / not_set") |
| APPLIED_SITE_TYPE | VARCHAR | Site type where application was submitted (e.g., "external", "internal") |

### Location Parsing Notes (APPLIED_JOB_LOCATION)

Three inconsistent formats exist:

1. `United States - California - San Diego` — Country - State - City (US jobs with state)
2. `India - Mumbai` — Country - City (non-US jobs, no state)
3. `Norway > Oslo : Kjelsasveien 161` — Country > City : Address (older format)

Trailing whitespace may exist. Always use `TRIM()`.

```sql
-- Extract country (handles both formats)
CASE WHEN CONTAINS(job_location, ' > ') THEN SPLIT_PART(job_location, ' > ', 1)
     ELSE TRIM(SPLIT_PART(job_location, ' - ', 1)) END AS country

-- Extract US state (only for US jobs with 3-part format)
CASE WHEN TRIM(SPLIT_PART(job_location, ' - ', 1)) = 'United States'
          AND TRIM(SPLIT_PART(job_location, ' - ', 3)) != ''
     THEN TRIM(SPLIT_PART(job_location, ' - ', 2)) ELSE NULL END AS us_state
```

### Common Joins

```sql
-- Link applications to scheduled interviews (coverage ~15% for some customers)
JOIN CID.RAW_SCHEMA.RB_SCHEDULING_SCHEDULE_REQUEST sr
  ON APPLICATION_ID = sr.CANDIDATE_ATS_APPLICATION_ID

-- Link applications to screenings (requires both USER_ID and JOB_ID match)
JOIN CID.RAW_SCHEMA.RB_VIDEO_SCREENS vs
  ON USER_ID = vs.VIDEOSCREENCANDIDATE_CANDIDATEID AND JOB_ID = vs.INTERVIEWDETAILS_ENTITYVALUE

-- Get customer account name
JOIN CID.SALESFORCE_SCHEMA.ACCOUNT a ON REFNUM = a.REFNUM_C
```

## RB_CANDIDATES

Candidate profile information.

| Column | Type | Description |
| --- | --- | --- |
| CANDIDATE_ID | VARCHAR | Unique candidate identifier |
| USER_ID | VARCHAR | Hash-style user ID — joins to RB_APPLICATIONS_DETAILS.USER_ID |

## RB_RECRUITER_ACTIVITY

Domain-level recruiter actions in CRM. One row per recruiter action. Tracks status changes, email, SMS, notes, tags, scheduling actions, rejections, and bulk operations. Does NOT include UI clickstream — see note below.

| Column | Type | Description |
| --- | --- | --- |
| RECRUITER_ACTIVITY_OBJECT_ID | VARCHAR | Primary key — unique activity row identifier |
| REFNUM | VARCHAR | Customer identifier |
| ACTION_TYPE | VARCHAR | Type of recruiter action (see action types below) |
| ACTION_VALUE | VARCHAR | Optional value or detail for the action |
| CREATED_DATE | TIMESTAMP_LTZ | When the action occurred (prefer for filtering/ordering) |
| CREATED_EVENT_AT | TIMESTAMP_LTZ | Event timestamp (alternative to CREATED_DATE) |
| RECRUITER_USER_ID | VARCHAR | Recruiter who performed the action — use for attribution |
| CANDIDATE_ID | VARCHAR | Candidate (hash-style). Joins to RB_APPLICATIONS_DETAILS.USER_ID for same job. |
| JOB_ID | VARCHAR | Job posting. Join with CANDIDATE_ID to link activity to an application. |
| ENTITY_ID | VARCHAR | Often unpopulated — prefer (CANDIDATE_ID, JOB_ID) for application join |
| PREVIOUS_STATUS | VARCHAR | Prior hiring status (for status-change actions) |
| CURRENT_STATUS | VARCHAR | New hiring status (for status-change actions) |

### Action Types

| Category | Values |
| --- | --- |
| Status & Pipeline | `CHANGEDJOBSTATUS` |
| Communication | `SENDEMAIL`, `SENDEMAIL_ANALYTICS`, `SENDSMS`, `EMAIL_OPT_IN`, `SMS_OPT_IN` |
| Notes & Tags | `NOTEADDED`, `TAGADD`, `ATTACHMENTADDED` |
| Scheduling | `SCHEDULEDINTERVIEW`, `UPDATEDINTERVIEWSTATUS` |
| Rejection | `REJECTEDPROFILE` |
| Bulk & Apply | `UPLOADRESUME`, `BULKIMPORT`, `JOBAPPLIEDBYRECRUITER` |
| Feedback | `INTERVIEW_FEEDBACK` |

### Common Joins

```sql
-- Match recruiter activity to applications (same candidate, same job)
JOIN CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS app
  ON CANDIDATE_ID = app.USER_ID
 AND RB_RECRUITER_ACTIVITY.JOB_ID = app.JOB_ID

-- Get customer account name
JOIN CID.SALESFORCE_SCHEMA.ACCOUNT a ON REFNUM = a.REFNUM_C
```

### Coverage Notes

* UI clickstream (e.g. "opened candidate profile", "opened Interviews tab") is in `FACT_CRM_OVERALL_ACTIONS` or `RB_USER_ACTIVITIES` / `RB_USER_ACTIVITY_PAGE_STATES`, not here.
* `FACT_CRM_OVERALL_ACTIONS` uses `RECRUITER_SKEY` as the recruiter identifier, which does NOT directly join to `RECRUITER_USER_ID`. A bridge between SKEY and USER_ID is needed to correlate CRM UI behavior with RB_RECRUITER_ACTIVITY.
* Check % of rows with non-null (CANDIDATE_ID, JOB_ID) to see how much activity can be tied to applications.

## Hiring Pipeline (HIRING_STATUS_VALUE Stages)

Ordered pipeline tracked via `HIRING_STATUS_VALUE` in RB_APPLICATIONS_DETAILS.

| Order | HIRING_STATUS_VALUE | HIRING_STATUS_STEP | Meaning |
| --- | --- | --- | --- |
| 1 | Lead | (none) | Initial status assigned automatically. Ignore for meaningful activity — HIRING_STATUS_PREVIOUS_STEP is NULL. |
| 2 | REVIEW | New Candidate | Application received and ready for recruiter review |
| 3 | SCREEN | Screen / Meets Minimum Qualifications OR Qualify / Meets Preferred Qualifications | Candidate passed initial screen. May have multiple SCREEN steps. |
| 4 | INTERVIEW | Interview | Candidate moved to interview stage. May appear multiple times for multiple rounds. |
| 5 | OFFER | Offer | Offer extended to candidate |
| 6 | HIRED | Ready for Hire | Candidate accepted and marked as hired |
| — | REJECTED | Position filled (or other) | Can occur at any stage. Check REJECTION_REASON for details. |

**Important notes:** Pipeline is NOT strictly linear — candidates can skip stages. REJECTED can appear at any point. Rows in RB_APPLICATIONS_DETAILS can be duplicated — always use `COUNT(DISTINCT HIRING_STATUS_UPDATED_DATE)`.
