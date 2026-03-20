# Structured Interviews — Strategy

## Pod Vision

Give every hiring team a consistent, fair, and legally defensible way to evaluate candidates — regardless of interviewer experience level, role type, or geography. Structured Interviews is the **foundational infrastructure layer** of the interview experience: it defines what gets asked, how answers are evaluated, and what the record looks like. Interview Intelligence builds on top of it; it is valuable even without recording.

North star: _every interview at a Phenom customer is guided by a structured framework — consistent criteria, calibrated scoring, and a defensible audit trail._

## Strategic Priorities (Current Half)

1. **Make guide + scorecard creation effortless:** The barrier to structured interviewing is setup friction. AI-generated guides from JD/skills lower this barrier significantly. Priority is making the authoring experience fast enough that every job can have a guide without PM-level effort from the recruiter.
2. **Drive scorecard completion rates:** Scorecards are created but often not completed. The goal is driving evaluation submission rates up — through better UX, reminders, and integration with Interview Intelligence's companion app that makes submission feel natural at the end of an interview.
3. **Build the question/attribute library as a strategic asset:** Customers who invest in a shared attribute and question library get compounding value — consistency across roles, interviewer training, and the data foundation that powers Interview Intelligence insights. Position this as a long-term organizational capability, not a one-time setup task.

## Success Metrics

| Metric | Current | Target |
| --- | --- | --- |
| % of interviews with a scorecard assigned | Tracked via RB_MEETINGS.SCORECARD_ID IS NOT NULL | Increase to 60%+ of meetings for customers with II enabled |
| Evaluation submission rate | Tracked via RB_PENDING_EVALUATIONS.SUBMISSION_STATUS | 80%+ submission rate within 48 hrs of interview |
| AI guide generation adoption | Qualitative (no metric yet) | Define and track % of new guides created with AI assist vs. manual |
| Question library reuse rate | Not tracked | Define metric: % of guide questions drawn from shared library vs. one-off |

## Roadmap Themes

1. **Short-term:** Improve AI guide/question generation quality; reduce scorecard setup time; improve evaluation reminder flows; better HM access to evaluation submission.
2. **Mid-term:** Guide analytics (which questions get asked most, which predict performance); configurable bias criteria in evaluations; cross-job calibration reports showing rating distribution by interviewer.
3. **Long-term:** Evaluation data feeds back into hiring quality analytics — connecting scorecard ratings to 90-day performance, retention, and role fit outcomes. This is the feedback loop that makes structured interviewing a continuously improving system.

## How This Pod Fits the Platform

* **Prerequisite for Interview Intelligence:** Recording and AI analysis are most valuable when paired with structured guides. Without a guide, there's no coverage check, no question detection baseline, and no calibrated evaluation to attach insights to.
* **Feeds Scheduling:** When a scheduling request confirms, the assigned scorecard becomes the evaluation template that interviewers are expected to complete.
* **Standalone value:** Customers without recording still benefit — consistency, fairness, EEOC defensibility, and faster evaluation turnaround are all available without enabling Interview Intelligence.
