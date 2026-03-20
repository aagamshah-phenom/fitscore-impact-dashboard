# Scheduling — Data Context

**Database:** CID  **Schema:** RAW_SCHEMA
Platform-level entities (applications, candidates, account mapping) are in **Platform Data Context**.

## Tables

### RB_SCHEDULING_SCHEDULE_REQUEST
Core table for interview scheduling requests. **One row per scheduling request.**

| Column | Type | Description |
|---|---|---|
| SCHEDULE_REQUEST_OBJECT_ID | VARCHAR | Primary key — unique request identifier. Use COUNT(DISTINCT SCHEDULE_REQUEST_OBJECT_ID) for request counts. |
| REFNUM | VARCHAR | Customer identifier — always filter first. Join to SALESFORCE_SCHEMA.ACCOUNT. |
| CREATED_DATE | TIMESTAMP | When the request was created — use for time-based filtering. |
| STATUS | VARCHAR | Current request status: `pending`, `scheduled`, `completed`, `cancelled`, `expired`, `NOT_COMPLETED` |
| JOB_CATEGORY | VARCHAR | Job category for the position |
| CANDIDATE_ID | VARCHAR | Candidate identifier |
| CANDIDATE_ATS_APPLICATION_ID | VARCHAR | Application ID from ATS — joins to RB_APPLICATIONS_DETAILS.APPLICATION_ID |

**Common filters:**
- `REFNUM = '{customer}'` — always first
- `CREATED_DATE >= DATEADD('MONTH', -3, CURRENT_DATE())`
- `STATUS IN ('scheduled', 'completed')`

**Common joins:**
```sql
JOIN CID.SALESFORCE_SCHEMA.ACCOUNT a ON REFNUM = a.REFNUM_C
JOIN CID.RAW_SCHEMA.RB_APPLICATIONS_DETAILS app ON CANDIDATE_ATS_APPLICATION_ID = app.APPLICATION_ID
```

---

### RB_SCHEDULING_REQUEST_ACTIVITY
Activity events on scheduling requests. **Multiple rows per request** — one per event.

**WARNING:** Use `COUNT(DISTINCT SCHEDULE_REQUEST_ID)` when counting interviews scheduled/completed. Never use COUNT(*).

| Column | Type | Description |
|---|---|---|
| SCHEDULE_REQUEST_ID | VARCHAR | References SCHEDULE_REQUEST_OBJECT_ID — use for distinct request counts |
| ACTIVITY_ID | VARCHAR | Type of activity event (see values below) |
| CREATED_DATE | TIMESTAMP | When the activity occurred |
| REFNUM | VARCHAR | Customer identifier |

**Activity types:**

| Category | Values |
|---|---|
| Lifecycle | `INTERVIEW_CREATED`, `INVITE_SENT`, `SLOT_SELECTED`, `COMPLETED` |
| Negotiation | `NEGOTIATION_LINK_SENT`, `NEGOTIATION_LINK_OPENED`, `NEGOTIATION_SLOT_SUBMITTED`, `NEGOTIATION_SUCCESSFUL` |
| Escalation | `REQUESTER_ESCALATION_RAISED`, `REQUESTER_ESCALATION_EXPIRED`, `REQUESTER_NOTIFICATION_RAISED`, `REQUESTER_ESCALATION_ACTION_TAKEN`, `REQUESTER_ESCALATION_DISMISSED` |
| Reschedule | `REQUEST_RESCHEDULED`, `RESCHEDULED_REQUESTED` |
| Cancellation | `CANCELED`, `INVITE_CANCELED`, `EXPIRED` |

---

### RB_SCHEDULING_MEETINGS
Scheduled meeting instances linked to requests.

| Column | Type | Description |
|---|---|---|
| MEETING_ID | VARCHAR | Unique meeting identifier |
| SCHEDULE_REQUEST_ID | VARCHAR | Parent scheduling request |
| START_TIME | TIMESTAMP | Meeting start time |
| END_TIME | TIMESTAMP | Meeting end time |

---

### RB_SCHEDULING_MEETING_PANEL
Interview panel members for meetings.

### RB_SCHEDULING_SCHEDULES
Schedule definitions and templates.

---

## Metrics

| Metric | Definition |
|---|---|
| Conversion rate | % of requests that reached `scheduled` or `completed` status |
| Completion rate | % of requests with `STATUS = 'completed'` |
| Cancellation rate | % of requests with `STATUS = 'cancelled'` |
| Reschedule rate | % with activity `REQUEST_RESCHEDULED` or `RESCHEDULED_REQUESTED` |
| Escalation rate | % with activity `REQUESTER_ESCALATION_RAISED` at least once |
| Negotiation rate | % with activity `NEGOTIATION_LINK_SENT` at least once |

---

## Negotiation & Escalation Domain

**Negotiation** = no slots available; system emails requester to get more slots from interviewers.
- Triggered: `NEGOTIATION_LINK_SENT`
- Funnel: `NEGOTIATION_LINK_SENT` → `NEGOTIATION_LINK_OPENED` → `NEGOTIATION_SLOT_SUBMITTED`
- **Sequence rule:** For "A followed by B", join activities and require `B.CREATED_DATE > A.CREATED_DATE`

**Escalation** = system alerted requester to take action (slow response, no slots, etc.)
- `REQUESTER_ESCALATION_RAISED` = one escalation event per request
- Use `MIN(CREATED_DATE) WHERE ACTIVITY_ID = 'REQUESTER_ESCALATION_RAISED'` for first escalation time

---

## Query Patterns

### Negotiation funnel (triggered → opened → submitted)
```sql
WITH requests AS (
  SELECT SCHEDULE_REQUEST_OBJECT_ID
  FROM CID.RAW_SCHEMA.RB_SCHEDULING_SCHEDULE_REQUEST
  WHERE REFNUM = '{customer}' AND CREATED_DATE >= DATEADD('MONTH', -3, CURRENT_DATE())
),
with_sent AS (
  SELECT DISTINCT r.SCHEDULE_REQUEST_OBJECT_ID FROM requests r
  JOIN CID.RAW_SCHEMA.RB_SCHEDULING_REQUEST_ACTIVITY a
    ON r.SCHEDULE_REQUEST_OBJECT_ID = a.SCHEDULE_REQUEST_ID
    AND a.REFNUM = '{customer}' AND a.ACTIVITY_ID = 'NEGOTIATION_LINK_SENT'
),
sent_then_opened AS (
  SELECT DISTINCT r.SCHEDULE_REQUEST_OBJECT_ID FROM requests r
  JOIN CID.RAW_SCHEMA.RB_SCHEDULING_REQUEST_ACTIVITY sent
    ON r.SCHEDULE_REQUEST_OBJECT_ID = sent.SCHEDULE_REQUEST_ID
    AND sent.ACTIVITY_ID = 'NEGOTIATION_LINK_SENT' AND sent.REFNUM = '{customer}'
  JOIN CID.RAW_SCHEMA.RB_SCHEDULING_REQUEST_ACTIVITY opened
    ON r.SCHEDULE_REQUEST_OBJECT_ID = opened.SCHEDULE_REQUEST_ID
    AND opened.ACTIVITY_ID = 'NEGOTIATION_LINK_OPENED' AND opened.REFNUM = '{customer}'
    AND opened.CREATED_DATE > sent.CREATED_DATE
),
sent_then_submitted AS (
  SELECT DISTINCT r.SCHEDULE_REQUEST_OBJECT_ID FROM requests r
  JOIN CID.RAW_SCHEMA.RB_SCHEDULING_REQUEST_ACTIVITY sent
    ON r.SCHEDULE_REQUEST_OBJECT_ID = sent.SCHEDULE_REQUEST_ID
    AND sent.ACTIVITY_ID = 'NEGOTIATION_LINK_SENT' AND sent.REFNUM = '{customer}'
  JOIN CID.RAW_SCHEMA.RB_SCHEDULING_REQUEST_ACTIVITY sub
    ON r.SCHEDULE_REQUEST_OBJECT_ID = sub.SCHEDULE_REQUEST_ID
    AND sub.ACTIVITY_ID = 'NEGOTIATION_SLOT_SUBMITTED' AND sub.REFNUM = '{customer}'
    AND sub.CREATED_DATE > sent.CREATED_DATE
)
SELECT
  (SELECT COUNT(*) FROM requests) AS total_requests,
  (SELECT COUNT(*) FROM with_sent) AS negotiation_triggered,
  (SELECT COUNT(*) FROM sent_then_opened) AS link_opened,
  (SELECT COUNT(*) FROM sent_then_submitted) AS slots_submitted
```

### Escalation count per request
```sql
SELECT
  r.SCHEDULE_REQUEST_OBJECT_ID,
  r.CREATED_DATE AS request_created,
  COUNT(CASE WHEN a.ACTIVITY_ID = 'REQUESTER_ESCALATION_RAISED' THEN 1 END) AS escalation_count,
  MIN(CASE WHEN a.ACTIVITY_ID = 'REQUESTER_ESCALATION_RAISED' THEN a.CREATED_DATE END) AS first_escalation_at
FROM CID.RAW_SCHEMA.RB_SCHEDULING_SCHEDULE_REQUEST r
LEFT JOIN CID.RAW_SCHEMA.RB_SCHEDULING_REQUEST_ACTIVITY a
  ON r.SCHEDULE_REQUEST_OBJECT_ID = a.SCHEDULE_REQUEST_ID
  AND a.REFNUM = r.REFNUM
  AND a.ACTIVITY_ID = 'REQUESTER_ESCALATION_RAISED'
WHERE r.REFNUM = '{customer}' AND r.CREATED_DATE >= DATEADD('MONTH', -3, CURRENT_DATE())
GROUP BY r.SCHEDULE_REQUEST_OBJECT_ID, r.CREATED_DATE
HAVING escalation_count > 0
ORDER BY escalation_count DESC
```

### Weekly request volume
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

See **Platform Data Context > Cross-Pod Join Patterns** for application → scheduling join with coverage notes.
