# Structured Interviews — Product Overview

## What Exists Today

Phenom Structured Interviews provides the framework for consistent, fair, and compliant interviewing. It includes company-defined interview guides, scorecards, question and attribute libraries, and evaluation forms. It is the foundation that Interview Intelligence builds on top of — valuable as a standalone product for consistency and compliance, and amplified by recording and AI when Interview Intelligence is enabled.

## Core Capabilities

### Interview Guides

Structured question sets assigned to interviews by job, role, or persona. Guides can be:

* **AI-generated** from job description and skills (fast path to structured interviews without manual authoring)
* **Manually authored** by HR admins or pod leads using the question and attribute library
* **Assigned** to specific jobs, job categories, or interview stages
* **Customized per interview** by the interviewer via the Companion App before or during the interview

### Question & Attribute Library

A shared organizational repository of:

* **Questions** — vetted interview questions tied to specific competencies or job skills
* **Attributes** — competency dimensions (e.g., "problem-solving," "communication," "domain knowledge") that questions are mapped to
* **Bias-aware tagging** — questions can be flagged for potential bias risk and guidance is surfaced

Customers who invest in the library get compounding value: consistency across interviewers, reusability across roles, and the data foundation that powers Interview Intelligence insights (coverage checks, question detection).

### Scorecards & Evaluation Forms

Each interview can have an assigned scorecard that defines:

* The attributes being evaluated and their weighting
* Rating scale (numeric, Likert, etc.)
* Free-text notes fields per attribute
* Overall recommendation (yes/no/strong yes/no)
* Custom evaluation roles (who sees and submits what)

Scorecards are submitted via the Companion App (during/after interview) or directly in the CRM/HRM.

### Usage Analytics

Admins can see which guides and scorecards are being used, completion rates by guide, and question coverage trends across the organization.

## User Roles

| Role | Key Actions |
| --- | --- |
| **HR Admin** | Creates and manages the question/attribute library; builds and assigns guides and scorecards; configures evaluation permissions and custom roles; reviews guide usage analytics. |
| **Recruiter** | Assigns scorecards to scheduling requests; monitors evaluation submission status; forwards evaluations to hiring managers; reviews completed scorecards in CRM. |
| **Interviewer** | Reviews assigned guide before and during the interview (via Companion App); submits scorecard evaluation post-interview; can add custom questions within the session. |
| **Hiring Manager** | Reviews submitted evaluations; optionally submits their own evaluation; sees recommendation summary across all interviewers for a candidate. |

## How It Works With Interview Intelligence

When Interview Intelligence is enabled, Structured Interviews capabilities are **enhanced but not replaced**:

* The guide becomes the baseline for AI **question coverage checking** — the system can detect which guide questions were asked and which were missed.
* The interview recording provides AI **summaries** that help evaluators complete scorecards faster and more accurately.
* The attribute library powers **bias detection** — AI flags questions that may be inappropriate for the competency being assessed.
* The evaluation submission is still human-driven — AI augments, the evaluator decides.

## Known Limitations / Adoption Reality

* **Setup friction is the main barrier:** Most customers don't fully build out their question/attribute library, meaning scorecards are ad-hoc rather than calibrated. AI guide generation is the key unlock.
* **Completion rates vary:** Scorecard submission rates depend heavily on whether interviewers are trained and reminded. Tracked via RB_PENDING_EVALUATIONS.
* **Standalone value underappreciated:** Many customers don't realize they can get EEOC-defensible consistency, faster evaluations, and structured feedback without enabling recording.
