# Recruiter Hub — Strategy

## Pod Vision

Recruiter Hub is the **connective tissue** of the Hiring Intelligence suite. Its job is to ensure that every product surfaces its value in the right place at the right time — inside the recruiter's natural workflow. The vision is a unified workspace where recruiters never leave the CRM/HRM to act on screening results, scheduling status, evaluation submissions, or AI insights.

North star: _the recruiter workspace is the single pane of glass for the entire hiring workflow — every action, insight, and next step is one click away._

## Strategic Priorities (Current Half)

1. **Unified recruiter experience across products:** Today each product adds its own surface to the CRM. The priority is ensuring a consistent UX pattern so recruiters navigate screening, scheduling, and evaluation flows with the same mental model.
2. **Automation Engine integration depth:** The CRM is where recruiters see and act on automation outcomes. As Automation Engine matures (event-driven scheduling, screening auto-assignment, stage-based triggers), the recruiter workspace needs to surface automation status, override options, and audit trails clearly.
3. **HM experience consistency:** Hiring manager access varies widely by customer configuration. Standardizing the HM experience — what they see, what they can act on, how evaluations are surfaced — reduces support burden and improves evaluation completion rates.

## Success Metrics

| Metric | Current | Target |
| --- | --- | --- |
| Recruiter actions per requisition | Tracked via RB_RECRUITER_ACTIVITY | Reduce manual touchpoints as automation matures |
| HM evaluation submission rate | Varies by customer | Improve through better HM access and reminders |
| Cross-product feature adoption per customer | Qualitative | Track % of customers using 2+ HI products through CRM |

## Roadmap Themes

1. **Short-term:** Improve CRM surface integration for Interview Intelligence (playback, summaries accessible without leaving requisition); standardize escalation/alert UX across Scheduling and Screening.
2. **Mid-term:** Unified activity feed per candidate showing screening → scheduling → interview → evaluation timeline; recruiter coaching insights (based on activity patterns and outcomes).
3. **Long-term:** Agentic recruiter assistant embedded in the workspace — proactive suggestions, automated next-step recommendations, and multi-agent orchestration that feels like a single assistant.

## How This Pod Fits the Platform

* **Consumed by all experience pods:** Every HI product renders its primary recruiter-facing UX through the CRM/HRM workspace.
* **Provides platform services:** Candidate profile management, activity tracking, communication engine, role-based access, and hiring pipeline state are all platform capabilities owned or coordinated through this layer.
* **Automation Engine dependency:** The recruiter workspace is the primary surface for automation outcomes and human-in-the-loop override points.
