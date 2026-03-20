# Recruiter Hub — Product Overview

## What Exists Today

Recruiter Hub is the **shared recruiter workspace** within Phenom's CRM/HRM platform. It provides the central interface where recruiters manage candidates, jobs, and hiring workflows across all Hiring Intelligence products. It is not a standalone product — it is the platform layer that experience pods (Screening, Scheduling, Interview Intelligence, Structured Interviews) build on top of.

Key surfaces:
* **Requisition view:** The per-job workspace where recruiters see applications, screening results, scheduling status, and evaluations in one place.
* **CRM Screening tab:** Where recruiters review screening outcomes — filtered by KO status and AI rating. High-volume roles rely on automated triage; knowledge-worker roles involve deeper review of video clips and transcripts.
* **Scheduling status:** Request lifecycle (pending, scheduled, completed, cancelled, expired) synced to the requisition. Escalation and follow-up alerts surface here.
* **Evaluation submission:** Scorecards submitted via CRM (recruiter experience) or HRM (hiring manager experience). Evaluators can submit from the Companion App or directly in the workspace.
* **Interview playback & sharing:** Recordings, summaries, and AI insights stored at the requisition/candidate level. Recruiters can forward interviews to hiring managers with controlled access and a full audit trail.

## Core Components

* **Candidate profile & application management** — RB_APPLICATIONS, RB_APPLICATIONS_DETAILS, RB_CANDIDATES
* **Recruiter activity tracking** — Status changes, email/SMS, notes, tags, scheduling actions, rejections (RB_RECRUITER_ACTIVITY)
* **Hiring pipeline** — Lead → Review → Screen → Interview → Offer → Hired → Rejected workflow with status tracking
* **Communication engine integration** — Email/SMS delivery for all product flows (screening invites, scheduling confirmations, evaluation reminders)
* **Role-based access** — Admin, Recruiter, Hiring Manager, Interviewer permissions across all surfaces

## Which Experience Pods Depend on This

| Pod | Dependency |
| --- | --- |
| **Screening** | CRM requisition Screening tab; evaluation display; auto-assignment and invitation workflows; KO/rating triage UX |
| **Scheduling** | Scheduling request creation and status tracking; escalation/follow-up alerts; calendar integration management |
| **Structured Interviews** | Scorecard assignment to scheduling requests; evaluation submission tracking; guide/scorecard management UX |
| **Interview Intelligence** | Recording playback and sharing; AI summary display; consent configuration; evaluation submission via CRM/HRM |
| **Automation Engine** | Event triggers for job creation, stage changes, and status updates that drive downstream automation |

## Known Limitations

* **CRM/HRM UX is not uniform across products** — each product adds its own tab/surface to the requisition view, but the integration depth varies. Some products (Scheduling) have deep CRM integration; others (Interview Intelligence) rely more on standalone UX (Companion App).
* **Recruiter activity data coverage** — RB_RECRUITER_ACTIVITY captures domain-level actions (status changes, email, notes) but not UI clickstream. Clickstream data lives in separate tables (FACT_CRM_OVERALL_ACTIONS) with a different user identifier (RECRUITER_SKEY) that doesn't directly join to RB tables.
* **HM involvement is customer-configured** — Some customers expose full recruiter-level access to HMs; others restrict HMs to forwarded evaluations only. This variability affects product adoption metrics.
