---
name: Product Context
type: skill
description: When and how to load internal product overview and strategy files from knowledge/
triggers: [product, feature, capability, roadmap, strategy, vision, what does, how does, overview, what is, scheduling, structured interviews, interview intelligence, screening, recruiter hub, II, voice agent]
---

When a user asks about what a Phenom product does, its strategy, roadmap, or how products relate to each other — load the relevant local knowledge file before answering.

## When to Use This Skill

Use this skill (instead of or before the KB) when questions are about:
- **Internal product strategy or roadmap** — what we're building, why, priorities
- **Product capabilities** — what exists today, how it works, user roles
- **Adoption data or ROI benchmarks** — internal metrics from product context
- **How products relate** — dependencies, integration points, maturity curve
- **Suite-level understanding** — how Scheduling + Structured Interviews + II fit together

Use `skills/vanilla-kb.md` for **customer-facing how-to content** (configuration, setup, user experience).

---

## File Routing

Load the file that matches the product area. Use suite-level files for cross-product questions.

### Interview Management Suite

| Question Type | File |
|---|---|
| How the three products relate / suite overview | `knowledge/interview-management/product-overview.md` |
| Suite strategy, maturity curve, north star | `knowledge/interview-management/strategy.md` |

### Scheduling

| Question Type | File |
|---|---|
| What Scheduling does, flows, roles, integrations | `knowledge/interview-management/scheduling/product-overview.md` |
| Scheduling strategy, roadmap, priorities | `knowledge/interview-management/scheduling/strategy.md` |

### Structured Interviews

| Question Type | File |
|---|---|
| What Structured Interviews does, guides, scorecards, roles | `knowledge/interview-management/structured-interviews/product-overview.md` |
| Structured Interviews strategy, roadmap, priorities | `knowledge/interview-management/structured-interviews/strategy.md` |

### Interview Intelligence

| Question Type | File |
|---|---|
| What II does, recording, companion app, AI features, consent | `knowledge/interview-management/interview-intelligence/product-overview.md` |
| II strategy, roadmap, adoption gap, competitive context | `knowledge/interview-management/interview-intelligence/strategy.md` |

### Screening

| Question Type | File |
|---|---|
| What Screening does, tiers, Voice Agent, roles, ROI | `knowledge/screening/product-overview.md` |
| Screening strategy, roadmap, priorities | `knowledge/screening/strategy.md` |

### Recruiter Hub

| Question Type | File |
|---|---|
| Recruiter Hub overview or strategy | `knowledge/recruiter-hub/product-overview.md` or `knowledge/recruiter-hub/strategy.md` |

---

## Loading Multiple Files

For questions that span products (e.g. "how does scheduling connect to interview intelligence?" or "what's the maturity curve for a new customer?"), load both the suite-level file AND the relevant individual product files.

For questions about **data behind a product** (e.g. "how is recording adoption measured?"), pair the product overview file with the relevant data context file — see `skills/snowflake-data-context.md` for data file routing.

---

## Notes

- Product overview files contain what exists today, adoption reality, and ROI benchmarks.
- Strategy files contain pod vision, current-half priorities, roadmap themes, and success metrics.
- Recruiter Hub files describe the shared recruiter workspace that all experience pods build on.
