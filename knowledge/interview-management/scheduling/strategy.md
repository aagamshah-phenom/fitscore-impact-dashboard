# Scheduling — Strategy

## Pod Vision

Make scheduling **invisible to the recruiter** — a fully automated, candidate-friendly coordination flow that handles every edge case (no slots, reschedules, no-shows, escalations) without human intervention. Scheduling is the entry product into the Hiring Intelligence suite: the fastest to configure, the most universally valuable, and the natural trigger for everything that comes next (structured interviews, recording, evaluation).

North star: _every interview at a Phenom customer is scheduled via Phenom Scheduling, with zero recruiter touchpoints for standard flows._

## Strategic Priorities (Current Half)

1. **Deepen automation coverage per customer:** Most customers use Scheduling for direct invite flows but haven't enabled the full automation stack (negotiation, escalation, auto-trigger from screening pass). Priority is expanding automation breadth within existing accounts — not just adoption, but depth.
2. **Tighter Automation Engine integration:** Scheduling requests today are often manually triggered. The goal is event-driven scheduling: job creation triggers a scheduling template; screening pass auto-initiates an interview request; stage change auto-generates next-round invite. This is where recruiting automation matures.
3. **Group interview and multi-interviewer optimization:** Panel scheduling is a current limitation for complex hiring processes. Group interview support (multiple interviewers, pooled availability, panel logistics) is a key expansion area for enterprise customers.

## Success Metrics

| Metric | Current | Target |
| --- | --- | --- |
| Customer adoption | ~300+ customers (~60% of base) | Maintain; grow automation depth per customer |
| % of scheduling requests requiring recruiter intervention | Varies by customer | Reduce by 30% through automation improvements |
| Time-to-schedule (invite to confirmed) | 87% faster vs manual (case study benchmark) | Track broadly across base; surface in-product |
| Escalation rate | Track via RB_SCHEDULING_REQUEST_ACTIVITY | Reduce REQUESTER_ESCALATION_RAISED events as automation matures |
| Candidate no-show rate | 20% reduction (benchmark) | Maintain; expand to more customers |

## Roadmap Themes

1. **Short-term:** Deeper Automation Engine triggers (screening pass → schedule, job creation → template); group interview improvements; candidate availability scoring; SLA escalation visibility improvements for requesters.
2. **Mid-term:** Agentic self-scheduling across channels (email/SMS/chat — candidate can say "I'm free Thursday afternoon" and it books); smarter slot optimization using interviewer patterns and candidate preferences.
3. **Long-term:** Fully autonomous scheduling agent that handles all edge cases, proactively negotiates availability, and learns from patterns across the recruiting organization.

## How This Pod Fits the Platform

* **Inputs from:** Automation Engine (event triggers for job creation, screening pass, stage change); Screening (pass = trigger scheduling); Recruiter CRM (requisition context, interviewer pool).
* **Outputs to:** Interview Intelligence (scheduling can auto-enable recording + consent for confirmed meetings); CRM (scheduling status, confirmation, evaluation triggers); candidate communication (all email/SMS flows).
* **Structured Interviews dependency:** Scheduling is the mechanism; Structured Interviews is the content (guide + scorecard) that the meeting will use. When a meeting is confirmed, the assigned scorecard becomes the evaluation template.
