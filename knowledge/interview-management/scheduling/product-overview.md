# Scheduling — Product Overview

## What Exists Today

Phenom Scheduling automates candidate-friendly interview coordination synced to interviewer calendars. It handles the full lifecycle: invite → confirmation → reschedule → cancellation → no-show follow-up → escalation. It is the **most adopted product in the Hiring Intelligence suite** (~300+ customers) and frequently the first automation a customer deploys.

## Core Flows

| Flow | What Happens |
| --- | --- |
| **Candidate Availability Invite** | Recruiter sends candidate a scheduling link. Candidate picks a slot from live calendar availability. Both candidate and interviewer(s) receive confirmations. |
| **Candidate Follow-Up** | If candidate doesn't respond, system sends repeated follow-ups until a configured limit, then escalates to requester with an Action Required alert. |
| **No Slots / Reschedule** | If no interviewer slots exist, system notifies candidate and emails interviewers requesting availability (Negotiation flow). If interviewers don't respond, escalates to requester. |
| **Candidate-Initiated Reschedule/Cancel** | Candidate clicks reschedule/cancel link. System acknowledges, cancels existing invite, and sends updated slot options or cancellation confirmation. |
| **Interviewer-Initiated Reschedule/Cancel** | System notifies candidate that interview will be rescheduled, cancels existing invite, and re-issues availability link. |
| **Group / Panel Interviews** | Multi-interviewer coordination with pooled availability. Panel scheduling with attendee management. |
| **Request Expiration** | If request goes unresolved past SLA, it expires and notifies the requester. Requesters can edit or extend. |

## Email & SMS Templates

Every flow above has associated configurable email/SMS templates. Key template types:

* Candidate Availability (initial invite)
* Candidate Confirmation
* Interview Invite (to interviewer)
* Candidate Follow Up
* No Slots Found to Reschedule
* Negotiation with Interviewer(s)
* Action Required (escalation to requester)
* Updated Slots
* Interview Invite Cancelled / Rescheduled

Templates support custom branding, localization (multi-language), and placeholder tokens for dynamic content (candidate name, job title, scheduling link, etc.).

## User Roles

| Role | Key Actions |
| --- | --- |
| **Recruiter / Requester** | Creates scheduling requests; selects interview template; monitors status; receives escalation alerts; edits requests when needed; resolves expired requests. |
| **Interviewer** | Receives calendar invite; can decline or propose reschedule; receives negotiation email when slot bottlenecks exist. |
| **HR Admin** | Configures interview templates (duration, type, buffer); manages email/SMS templates; sets SLA thresholds for follow-ups and escalations; manages calendar integrations. |
| **Candidate** | Receives invite link; self-selects time slot from live availability; can reschedule or cancel directly via link; receives confirmation and reminders. Branded as employer experience. |

## Key Integrations

* **Calendar:** Google Calendar, Microsoft Outlook/O365/Exchange — real-time availability sync.
* **Video conferencing:** Zoom, Google Meet, Microsoft Teams, Webex — auto-generates meeting links in invites.
* **Automation Engine:** Screening pass, stage change, or job creation events can auto-trigger scheduling requests.
* **Interview Intelligence:** Confirmed meetings can auto-enable recording consent and attach scorecards.
* **CRM/HRM:** Scheduling status synced to requisition; evaluation triggers generated post-meeting.

## Known Limitations / Adoption Reality

* **Most adopted HI product** but many customers only use basic direct-invite flows — negotiation, escalation, and Automation Engine-triggered scheduling are underutilized.
* **Group interview complexity:** Panel scheduling for multi-interviewer processes is a current limitation being actively developed.
* **Calendar accuracy:** Availability accuracy depends on calendar sync health — edge cases around out-of-office, tentative events, and shared calendars can cause sync issues.
