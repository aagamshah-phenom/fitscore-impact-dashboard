# Interview Management — Data Context

**Database:** CID   **Schema:** RAW_SCHEMA

Pod-specific Snowflake tables for the Interview Management experience. Covers interview scheduling and Interview Intelligence (recording, evaluation, scorecards). Platform-level entities (applications, candidates, account mapping) are in **Platform Data Context**.

## Scheduling Tables

### RB_SCHEDULING_SCHEDULE_REQUEST

Core table for interview scheduling requests. One row per scheduling request.

| Column | Type | Description |
| --- | --- | --- |
| SCHEDULE_REQUEST_OBJECT_ID | VARCHAR | Primary key — unique request identifier |
| REFNUM | VARCHAR | Customer identifier — join to SALESFORCE_SCHEMA.ACCOUNT |
| CREATED_DATE | TIMESTAMP | When the request was created |
| STATUS | VARCHAR | Current request status: pending, scheduled, completed, cancelled, expired, NOT_COMPLETED |
| JOB_CATEGORY | VARCHAR | Job category for the position |
| CANDIDATE_ID | VARCHAR | Candidate identifier |
| CANDIDATE_ATS_APPLICATION_ID | VARCHAR | Application ID from ATS — joins to RB_APPLICATIONS.APPLICATION_ID |

**Common filters:** `REFNUM = '{customer}'` | `CREATED_DATE >= DATEADD('MONTH', -3, CURRENT_DATE())` | `STATUS IN ('scheduled', 'completed')`

**Common joins:** SALESFORCE_SCHEMA.ACCOUNT (REFNUM = REFNUM_C) | RB_APPLICATIONS_DETAILS (CANDIDATE_ATS_APPLICATION_ID = APPLICATION_ID)

### RB_SCHEDULING_REQUEST_ACTIVITY

Activity events on scheduling requests — escalations, reschedules, lifecycle events.

| Column | Type | Description |
| --- | --- | --- |
| SCHEDULE_REQUEST_ID | VARCHAR | References SCHEDULE_REQUEST_OBJECT_ID in RB_SCHEDULING_SCHEDULE_REQUEST |
| ACTIVITY_ID | VARCHAR | Type of activity event (see activity types below) |
| CREATED_DATE | TIMESTAMP | When the activity occurred |
| REFNUM | VARCHAR | Customer identifier |

**Activity Types:**

| Category | Activity Values |
| --- | --- |
| Lifecycle | INTERVIEW_CREATED, INVITE_SENT, SLOT_SELECTED, COMPLETED |
| Negotiation | NEGOTIATION_LINK_SENT, NEGOTIATION_LINK_OPENED, NEGOTIATION_SLOT_SUBMITTED, NEGOTIATION_SUCCESSFUL — requester asked to get more interviewer slots when none were available |
| Escalation | REQUESTER_ESCALATION_RAISED, REQUESTER_ESCALATION_EXPIRED, REQUESTER_NOTIFICATION_RAISED, REQUESTER_ESCALATION_ACTION_TAKEN, REQUESTER_ESCALATION_DISMISSED — system alerted requester to take action. Count each REQUESTER_ESCALATION_RAISED per event. |
| Reschedule | REQUEST_RESCHEDULED, RESCHEDULED_REQUESTED |
| Cancellation | CANCELED, INVITE_CANCELED, EXPIRED |

### RB_SCHEDULING_MEETINGS

Scheduled meeting instances linked to scheduling requests.

| Column | Type | Description |
| --- | --- | --- |
| MEETING_ID | VARCHAR | Unique meeting identifier |
| SCHEDULE_REQUEST_ID | VARCHAR | Parent scheduling request — joins to RB_SCHEDULING_SCHEDULE_REQUEST |
| START_TIME | TIMESTAMP | Meeting start time |
| END_TIME | TIMESTAMP | Meeting end time |

### RB_SCHEDULING_MEETING_PANEL

Interview panel members for meetings. Documents which interviewers are assigned to each meeting.

### RB_SCHEDULING_SCHEDULES

Schedule definitions and templates used when creating scheduling requests.

## Interview Intelligence Tables

### RB_MEETINGS

Core table for Interview Intelligence. Each row = one meeting. Tracks recording enablement, bot join status, and scorecard attachment.

| Column | Type | Description |
| --- | --- | --- |
| MEETING_ID | VARCHAR | Primary key — unique meeting identifier |
| REFNUM | VARCHAR | Customer identifier |
| CANDIDATE_CANDIDATEID | VARCHAR | Candidate ID for the meeting |
| CANDIDATE_ATSAPPLICATIONID | VARCHAR | ATS application ID — joins to RB_APPLICATIONS_DETAILS.APPLICATION_ID |
| CREATED_BY_ID | VARCHAR | Requester/creator ID |
| CREATED_BY_EMAIL | VARCHAR | Requester/creator email |
| RECORDING_ENABLED | BOOLEAN | Whether recording was enabled for this meeting |
| BOT_STATUS | VARCHAR | Recording bot outcome — see status values below |
| SCORECARD_ID | VARCHAR | Scorecard attached to meeting (NULL if none) — joins to RB_SCORECARDS |

**BOT_STATUS values:**

| Value | Category | Meaning |
| --- | --- | --- |
| success | success | Bot joined and fully recorded |
| recording_stopped | success | Recording manually stopped by participant — still counts as success |
| bot_not_allowed | participant_rejected | Bot request declined by participant |
| removed_within_5_minutes | participant_rejected | Bot removed from meeting by participant |
| delete_phrase_detected_and_container_deleted | participant_rejected | Bot removed via delete phrase by participant |
| nobody_joined | participant_rejected | Bot requested to join but not acknowledged |
| ongoing | error | Technical error state |
| Recording Unavailable | error | Technical error state |
| technical_error | error | Technical error state |

**Common joins:** RB_SCORECARDS (SCORECARD_ID), RB_APPLICATIONS_DETAILS (CANDIDATE_ATSAPPLICATIONID = APPLICATION_ID), RB_PENDING_EVALUATIONS (MEETING_ID), RB_EVALUATION_SUBMISSION (MEETING_ID)

### RB_SCORECARDS

Scorecard definitions. A scorecard contains an Evaluation Form and an Interview Guide.

| Column | Type | Description |
| --- | --- | --- |
| SCORECARD_ID | VARCHAR | Primary key — joins from RB_MEETINGS, RB_PENDING_EVALUATIONS, RB_EVALUATION_SUBMISSION |

### RB_PENDING_EVALUATIONS

Evaluation tasks/requests. Each row = one evaluation task assigned to one person for one candidate. Tracks whether the evaluator has submitted. Created by various systems: scheduling automation, CRM, HRM, migration.

| Column | Type | Description |
| --- | --- | --- |
| OBJECT_ID | VARCHAR | Primary key — unique row identifier |
| REFNUM | VARCHAR | Customer identifier |
| SUBMISSION_STATUS | VARCHAR | pending = not submitted \| submitted = evaluator completed \| draft = in progress |
| REQUEST_TYPE | VARCHAR | interview_evaluation (linked to meeting) \| general_evaluation (standalone, no pending task created) |
| MEETING_ID | VARCHAR | Meeting this evaluation is linked to — primary join to RB_MEETINGS. Populated ~93% of the time. |
| APPLICATION_ID | VARCHAR | ATS application ID. Populated ~19% of the time. |
| REQUESTED_BY_EMAIL | VARCHAR | Email of the requester |
| REQUESTEDTO_REQUESTEDTOEMAIL | VARCHAR | Email of the assigned evaluator |
| REQUESTEDTO_PARTICIPANTTYPE | VARCHAR | Role of assigned evaluator: interviewer, Hiring Manager, hiring_manager, Interviewer, recruiter, Recruiter, conferenceroom. Values are case-inconsistent — normalize with LOWER() when grouping. |
| SCORECARD_ID | VARCHAR | Scorecard used — joins to RB_SCORECARDS |
| SCORECARD_NAME | VARCHAR | Name of the scorecard |
| SUBMISSION_ID | VARCHAR | Links to RB_EVALUATION_SUBMISSION.SUBMISSION_ID when status = submitted/draft. NULL when pending. |
| SOURCE | VARCHAR | System that created the task: scheduling, migratedData, HRM, CRM, crm |
| JOB_JOBID / JOB_JOBTITLE / JOB_JOBCATEGORY / JOB_JOBLOCATION | VARCHAR | Job context fields |
| DATE_CREATED | TIMESTAMP | When the evaluation task was created |

### RB_EVALUATION_SUBMISSION

Completed evaluation submissions. **Each row = one question response within a submission.** A single SUBMISSION_ID has multiple rows (~9 questions avg). Use `COUNT(DISTINCT SUBMISSION_ID)` to count submissions, never `COUNT(*)`.

| Column | Type | Description |
| --- | --- | --- |
| OBJECT_ID | VARCHAR | Unique row-level identifier (one per question response) |
| SUBMISSION_ID | VARCHAR | Groups all question responses. NOT unique per row. Use COUNT(DISTINCT SUBMISSION_ID). |
| REFNUM | VARCHAR | Customer identifier |
| SUBMITTED_BY_EMAIL | VARCHAR | Email of submitter |
| SOURCE | VARCHAR | HRM (Hiring Manager experience) \| CRM (Recruiter experience). Submissions only created via UI. |
| RECOMMEND | VARCHAR | "true" or "false" recommendation. Required, same value across all question rows in a submission. |
| SCORECARD_ID / SCORECARD_NAME | VARCHAR | Scorecard used — joins to RB_SCORECARDS |
| MEETING_ID | VARCHAR | Meeting this submission links to. Populated ~48% of the time. |
| QUESTIONS_QUESTIONTEXT | VARCHAR | Text of the question being answered in this row |
| QUESTIONS_QUESTIONTYPE | VARCHAR | Type: rating, text, etc. |
| QUESTIONS_OPTIONS | VARCHAR | Answer options / response given |
| NOTE_TEXT | VARCHAR | Free-text notes from evaluator |
| USER_ROLE | VARCHAR | Role of the submitter |
| CREATED_EVENT_AT | TIMESTAMP | When the submission was submitted or updated |

**Join to pending evaluations:** ~53% of submissions match a pending eval task. ~47% are general/ad-hoc evaluations with no pending task.

## Key Metrics (Interview Intelligence)

| Metric | Formula | Table |
| --- | --- | --- |
| Recording Enabled Rate | COUNT(CASE WHEN RECORDING_ENABLED = TRUE THEN 1 END) * 100.0 / COUNT(*) | RB_MEETINGS |
| Bot Success Rate | COUNT(CASE WHEN BOT_STATUS IN ('success', 'recording_stopped') THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN RECORDING_ENABLED = TRUE THEN 1 END), 0) | RB_MEETINGS — denominator = recording-enabled meetings only |
| Participant Rejection Rate | COUNT(CASE WHEN BOT_STATUS IN ('bot_not_allowed', 'removed_within_5_minutes', 'delete_phrase_detected_and_container_deleted', 'nobody_joined') THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN RECORDING_ENABLED = TRUE THEN 1 END), 0) | RB_MEETINGS — measures participant resistance to recording |
| Scorecard Usage Rate | COUNT(CASE WHEN SCORECARD_ID IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) | RB_MEETINGS |
| Evaluation Submission Rate | COUNT(CASE WHEN SUBMISSION_STATUS = 'submitted' THEN 1 END) * 100.0 / COUNT(*) | RB_PENDING_EVALUATIONS — break down by REQUESTEDTO_PARTICIPANTTYPE |
| Recommend Rate | COUNT(DISTINCT CASE WHEN RECOMMEND = 'true' THEN SUBMISSION_ID END) * 100.0 / COUNT(DISTINCT SUBMISSION_ID) | RB_EVALUATION_SUBMISSION |

## Common Filters

* Always filter by `REFNUM = '{customer}'` first for query performance
* Use `DATE_TRUNC('week', CREATED_DATE)` for WoW trend analysis on scheduling tables
* Filter `STATUS NOT IN ('cancelled', 'expired')` for active scheduling metrics
* For evaluation submission rate, use `LOWER(REQUESTEDTO_PARTICIPANTTYPE)` to normalize case-inconsistent values

## Table Relationships

```
RB_SCHEDULING_SCHEDULE_REQUEST
  └── RB_SCHEDULING_REQUEST_ACTIVITY (SCHEDULE_REQUEST_OBJECT_ID = SCHEDULE_REQUEST_ID)
  └── RB_SCHEDULING_MEETINGS (SCHEDULE_REQUEST_OBJECT_ID = SCHEDULE_REQUEST_ID)
      └── RB_SCHEDULING_MEETING_PANEL

RB_MEETINGS
  └── RB_SCORECARDS (SCORECARD_ID = SCORECARD_ID)
  └── RB_PENDING_EVALUATIONS (MEETING_ID = MEETING_ID)
      └── RB_EVALUATION_SUBMISSION (SUBMISSION_ID = SUBMISSION_ID)
  └── RB_EVALUATION_SUBMISSION (MEETING_ID = MEETING_ID)

Cross-pod links (see platform/cross-pod-join-patterns.md):
  RB_SCHEDULING_SCHEDULE_REQUEST <-> RB_APPLICATIONS_DETAILS (via CANDIDATE_ATS_APPLICATION_ID)
  RB_MEETINGS <-> RB_APPLICATIONS_DETAILS (via CANDIDATE_ATSAPPLICATIONID)
```
