# Interview Intelligence — Data Context

**Database:** CID  **Schema:** RAW_SCHEMA
Platform-level entities (applications, candidates, account mapping) are in **Platform Data Context**.
Scorecard definitions (RB_SCORECARDS) are shared with Structured Interviews.

## Tables

### RB_MEETINGS
Core table for Interview Intelligence. **One row per meeting.**

| Column | Type | Description |
|---|---|---|
| MEETING_ID | VARCHAR | Primary key — unique meeting identifier |
| REFNUM | VARCHAR | Customer identifier — always filter first |
| CANDIDATE_CANDIDATEID | VARCHAR | Candidate ID |
| CANDIDATE_ATSAPPLICATIONID | VARCHAR | ATS application ID — joins to RB_APPLICATIONS_DETAILS.APPLICATION_ID |
| CREATED_BY_ID | VARCHAR | Requester/creator ID |
| CREATED_BY_EMAIL | VARCHAR | Requester/creator email |
| RECORDING_ENABLED | BOOLEAN | Whether recording was enabled for this meeting |
| BOT_STATUS | VARCHAR | Status of the recording bot (see values below) |
| SCORECARD_ID | VARCHAR | Scorecard attached to this meeting (NULL if none) — join to RB_SCORECARDS |

**BOT_STATUS values:**

| Category | Values |
|---|---|
| success | `success` (fully recorded), `recording_stopped` (participant stopped early — still counts as success) |
| participant_rejected | `bot_not_allowed`, `removed_within_5_minutes`, `delete_phrase_detected_and_container_deleted`, `nobody_joined` |
| error | `ongoing`, `Recording Unavailable`, `technical_error` |

**Important:** Always filter to `RECORDING_ENABLED = TRUE` before calculating bot rates. Denominator must exclude meetings where recording was not turned on.
High participant_rejected rate → change management problem. High error rate → product reliability problem.

**Common joins:**
```sql
JOIN CID.SALESFORCE_SCHEMA.ACCOUNT a ON REFNUM = a.REFNUM_C
JOIN CID.RAW_SCHEMA.RB_SCORECARDS sc ON SCORECARD_ID = sc.SCORECARD_ID
JOIN CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS app ON CANDIDATE_ATSAPPLICATIONID = app.APPLICATION_ID
JOIN CID.RAW_SCHEMA.RB_PENDING_EVALUATIONS pe ON MEETING_ID = pe.MEETING_ID
JOIN CID.RAW_SCHEMA.RB_EVALUATION_SUBMISSION es ON MEETING_ID = es.MEETING_ID
```

---

### RB_SCORECARDS
Scorecard definitions. A scorecard contains an Evaluation Form and an Interview Guide. **Shared with Structured Interviews.**

| Column | Type | Description |
|---|---|---|
| SCORECARD_ID | VARCHAR | Primary key — join from RB_MEETINGS, RB_PENDING_EVALUATIONS, RB_EVALUATION_SUBMISSION |

---

### RB_PENDING_EVALUATIONS
Evaluation tasks. **One row per evaluation task assigned to one person for one candidate.**
Created by scheduling automation, CRM, HRM, or data migration. Only created for interview evaluations (not general evaluations).

| Column | Type | Description |
|---|---|---|
| OBJECT_ID | VARCHAR | Primary key |
| REFNUM | VARCHAR | Customer identifier |
| SUBMISSION_STATUS | VARCHAR | `pending` (not yet submitted), `submitted` (completed), `draft` (in progress) |
| REQUEST_TYPE | VARCHAR | `interview_evaluation` (linked to a meeting) or `general_evaluation` (standalone — no pending task created) |
| MEETING_ID | VARCHAR | Meeting this evaluation is linked to. Populated ~93% of the time. |
| APPLICATION_ID | VARCHAR | ATS application ID. Populated ~19% of the time. |
| CANDIDATE_ID | VARCHAR | Candidate ID |
| REQUESTED_BY_ID / NAME / EMAIL | VARCHAR | Person who requested the evaluation |
| REQUESTEDTO_REQUESTEDTOID / NAME / EMAIL | VARCHAR | Person assigned to complete the evaluation |
| REQUESTEDTO_PARTICIPANTTYPE | VARCHAR | Evaluator role: `interviewer`, `Hiring Manager`, `hiring_manager`, `Interviewer`, `recruiter`, `Recruiter`, `conferenceroom` |
| SCORECARD_ID | VARCHAR | Scorecard used (join to RB_SCORECARDS) |
| SCORECARD_NAME | VARCHAR | Scorecard name |
| EVALUATION_FORM_ID | VARCHAR | Evaluation form ID |
| SUBMISSION_ID | VARCHAR | Links to RB_EVALUATION_SUBMISSION when status = submitted/draft. NULL when pending. |
| II_ID | VARCHAR | Interview Intelligence identifier |
| SOURCE | VARCHAR | System that created the task: `scheduling`, `migratedData`, `HRM`, `CRM`, `crm` |
| JOB_JOBID / JOBTITLE / JOBCATEGORY / JOBLOCATION | VARCHAR | Job details |
| DATE_CREATED | TIMESTAMP | When the evaluation task was created |

**WARNING:** REQUESTEDTO_PARTICIPANTTYPE values are case-inconsistent (`interviewer` vs `Interviewer`, `Hiring Manager` vs `hiring_manager`). Always use `LOWER()` when grouping.

---

### RB_EVALUATION_SUBMISSION
Completed evaluation submissions. **One row per question response per submission.**
A single submission (SUBMISSION_ID) has ~9 rows on average — one per scorecard question.
Submissions can only be created via the UI (CRM or HRM).

**WARNING:** Always use `COUNT(DISTINCT SUBMISSION_ID)` to count submissions. Never use COUNT(*).

| Column | Type | Description |
|---|---|---|
| OBJECT_ID | VARCHAR | Unique row-level identifier (one per question response) |
| SUBMISSION_ID | VARCHAR | Groups all question responses into one submission — NOT unique per row |
| REFNUM | VARCHAR | Customer identifier |
| CANDIDATE_ID | VARCHAR | Candidate ID |
| SUBMITTED_BY_ID / NAME / EMAIL | VARCHAR | Person who submitted the evaluation |
| SOURCE | VARCHAR | UI where submitted: `HRM` or `CRM` only |
| RECOMMEND | VARCHAR | `'true'` or `'false'` — evaluator's recommendation. **String, not boolean.** Same value on all rows in a submission. |
| SCORECARD_ID | VARCHAR | Scorecard used |
| SCORECARD_NAME | VARCHAR | Scorecard name |
| MEETING_ID | VARCHAR | Meeting linked to this submission. Populated ~48% of the time. |
| II_ID | VARCHAR | Interview Intelligence identifier. Populated ~62% of the time. |
| QUESTIONS_QUESTIONID | VARCHAR | Scorecard question ID for this row |
| QUESTIONS_QUESTIONTEXT | VARCHAR | Question text |
| QUESTIONS_QUESTIONTYPE | VARCHAR | Question type (e.g., rating, text) |
| QUESTIONS_OPTIONS | VARCHAR | Answer options / response given |
| QUESTIONS_MANDATORY | BOOLEAN | Whether the question was required |
| NOTE_TEXT | VARCHAR | Free-text notes from the evaluator |
| JOB_ID / JOB_TITLE / JOB_CATEGORY / JOB_LOCATION | VARCHAR | Job details |
| DATE_CREATED | TIMESTAMP | When the evaluation task was originally created |
| CREATED_EVENT_AT | TIMESTAMP | When the submission was submitted or updated |
| USER_ROLE | VARCHAR | Role of the submitter |

---

## Evaluation Domain

**Two evaluation types:**
1. **Interview evaluation** — linked to a meeting. A pending task is created and assigned. Evaluator submits via CRM/HRM UI.
2. **General evaluation** — standalone, not linked to a meeting. No pending task. Evaluator submits directly via UI.

~47% of submissions are general evaluations with no corresponding pending task — this is expected.

**Lifecycle:**
```
Task created (RB_PENDING_EVALUATIONS status=pending)
  → Draft started (status=draft, appears in RB_EVALUATION_SUBMISSION)
  → Submitted (status=submitted, SUBMISSION_ID links both tables)
```

**Key relationships:**
- `RB_PENDING_EVALUATIONS.SUBMISSION_ID = RB_EVALUATION_SUBMISSION.SUBMISSION_ID` — 1 pending : many submission rows (one per question)
- `RB_MEETINGS.MEETING_ID = RB_PENDING_EVALUATIONS.MEETING_ID` — 1 meeting : many pending evaluations (one per assigned evaluator)
- `RB_MEETINGS.MEETING_ID = RB_EVALUATION_SUBMISSION.MEETING_ID` — primary join for linking evaluations to interviews (~48% have MEETING_ID)

---

## Metrics

| Metric | Formula | Table |
|---|---|---|
| Scorecard usage rate | `COUNT(CASE WHEN SCORECARD_ID IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)` | RB_MEETINGS |
| Recording enabled rate | `COUNT(CASE WHEN RECORDING_ENABLED = TRUE THEN 1 END) * 100.0 / COUNT(*)` | RB_MEETINGS |
| Bot success rate | `COUNT(BOT_STATUS IN ('success','recording_stopped')) / COUNT(RECORDING_ENABLED=TRUE)` | RB_MEETINGS |
| Participant rejection rate | `COUNT(BOT_STATUS IN ('bot_not_allowed','removed_within_5_minutes','delete_phrase_detected_and_container_deleted','nobody_joined')) / COUNT(RECORDING_ENABLED=TRUE)` | RB_MEETINGS |
| Bot error rate | `COUNT(BOT_STATUS IN ('ongoing','Recording Unavailable','technical_error')) / COUNT(RECORDING_ENABLED=TRUE)` | RB_MEETINGS |
| Evaluation submission rate | `COUNT(SUBMISSION_STATUS='submitted') * 100.0 / COUNT(*)` | RB_PENDING_EVALUATIONS |
| Recommend rate | `COUNT(DISTINCT CASE WHEN RECOMMEND='true' THEN SUBMISSION_ID END) * 100.0 / COUNT(DISTINCT SUBMISSION_ID)` | RB_EVALUATION_SUBMISSION |

---

## Query Patterns

### II adoption dashboard
```sql
SELECT
  a.NAME AS account_name,
  COUNT(*) AS total_meetings,
  COUNT(CASE WHEN RECORDING_ENABLED = TRUE THEN 1 END) AS recording_enabled,
  COUNT(CASE WHEN SCORECARD_ID IS NOT NULL THEN 1 END) AS with_scorecard,
  ROUND(COUNT(CASE WHEN RECORDING_ENABLED = TRUE THEN 1 END) * 100.0 / COUNT(*), 1) AS recording_rate_pct,
  ROUND(COUNT(CASE WHEN SCORECARD_ID IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) AS scorecard_rate_pct
FROM CID.RAW_SCHEMA.RB_MEETINGS m
JOIN CID.SALESFORCE_SCHEMA.ACCOUNT a ON m.REFNUM = a.REFNUM_C
WHERE m.REFNUM = '{customer}'
GROUP BY a.NAME
```

### Bot success/failure breakdown
```sql
SELECT
  BOT_STATUS,
  COUNT(*) AS meetings,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct_of_recording_enabled
FROM CID.RAW_SCHEMA.RB_MEETINGS
WHERE REFNUM = '{customer}' AND RECORDING_ENABLED = TRUE
GROUP BY BOT_STATUS
ORDER BY meetings DESC
```

### Evaluation submission rate by evaluator role
```sql
SELECT
  LOWER(REQUESTEDTO_PARTICIPANTTYPE) AS evaluator_role,
  COUNT(*) AS total_tasks,
  COUNT(CASE WHEN SUBMISSION_STATUS = 'submitted' THEN 1 END) AS submitted,
  ROUND(COUNT(CASE WHEN SUBMISSION_STATUS = 'submitted' THEN 1 END) * 100.0 / COUNT(*), 1) AS submission_rate_pct
FROM CID.RAW_SCHEMA.RB_PENDING_EVALUATIONS
WHERE REFNUM = '{customer}'
GROUP BY LOWER(REQUESTEDTO_PARTICIPANTTYPE)
ORDER BY total_tasks DESC
```
