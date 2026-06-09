import type { AgentPromptCopy, JobSummary } from "./types";

export const JOBS: JobSummary[] = [
  {
    id: "ml-engineer",
    slug: "ml-engineer",
    jobId: "P-204481",
    title: "Product Development Engineer I/II – Machine Learning",
    scenario: "underfilled-pipeline",
    scenarioLabel: "Underfilled HM pipeline",
    readinessInsight: "2 of 5 HM Interview target",
    recommendedAction: "Fast-track 3 ready candidates to HM review",
    address: "300 Brookside Ave building 18 suite 200, Ambler, PA 19002",
    status: "Open",
    pipeline: {
      status: "at-risk",
      target: 5,
      current: 2,
      gap: 3,
      goalPct: 40,
      risk: "Role may fall behind historical fill pace",
      recommendedAction: "Fast-track 3 high-readiness candidates",
      ctaLabel: "Review recommendation",
      deadline: "Jun 21",
      screenedCount: 17,
      readyCount: 3,
      readyLabel: "ready candidates",
      recommendedImpact: "+3 to HM → target covered",
    },
    funnel: [
      { id: "applicants", label: "Applicants", count: 64 },
      { id: "screened", label: "Screened", count: 17 },
      { id: "ready-hm", label: "Ready for HM", count: 2, target: 5, highlight: true },
      { id: "sent-hm", label: "Sent to HM", count: 2 },
      { id: "hm-interview", label: "HM Interview", count: 2 },
    ],
    recommendation: {
      currentState:
        "Only 2 candidates are ready for HM interview against a target of 5.",
      whyItMatters:
        "Historically, this role type needs at least 5 HM interviews to stay on track for a timely offer.",
      nextStep:
        "Fast-track 3 candidates with strong Fit Score and strong screening evidence.",
      expectedOutcome:
        "HM interview pipeline moves from 40% to 100% target coverage.",
    },
  },
  {
    id: "customer-service-outfitter",
    slug: "customer-service-outfitter",
    jobId: "P-204512",
    title: "Customer Service Outfitter – Part Time",
    scenario: "high-volume",
    scenarioLabel: "High-volume applicant flow",
    readinessInsight: "4 of 12 HM Interview target",
    recommendedAction: "Prioritize 31 candidates for screening",
    address: "1850 Market Street, Philadelphia, PA 19103",
    status: "Open",
    pipeline: {
      status: "at-risk",
      target: 12,
      current: 4,
      gap: 8,
      goalPct: 33,
      risk: "Screening queue is the bottleneck",
      recommendedAction: "Prioritize 31 candidates for screening",
      ctaLabel: "Prioritize queue",
      deadline: "Jun 21",
      screenedCount: 186,
      readyCount: 31,
      readyLabel: "ready for screening",
      recommendedImpact: "+31 to screening queue",
    },
    funnel: [
      { id: "applicants", label: "Applicants", count: 632 },
      { id: "screened", label: "Screened", count: 186 },
      { id: "ready-screening", label: "Ready for Screening", count: 31, highlight: true },
      { id: "sent-screening", label: "Sent to Screening", count: 0 },
      { id: "hm-interview", label: "HM Interview", count: 4, target: 12 },
    ],
    recommendation: {
      currentState:
        "4 candidates are in HM interview against a target of 12. 31 candidates are ready for screening but have not been actioned.",
      whyItMatters:
        "The screening queue is the bottleneck. Without moving the 31 ready candidates forward, HM interview volume cannot recover.",
      nextStep: "Send the 31 ready-for-screening candidates to screening.",
      expectedOutcome:
        "Screening throughput increases, enabling more HM-ready candidates in the next cycle.",
    },
  },
  {
    id: "store-operations-manager",
    slug: "store-operations-manager",
    jobId: "P-204537",
    title: "Store Operations Manager",
    scenario: "hm-backlog",
    scenarioLabel: "HM interview backlog",
    readinessInsight: "10 of 6 HM Interview target — overloaded",
    recommendedAction: "Do not forward more; keep warm or add as lead to similar role",
    address: "200 King of Prussia Mall, King of Prussia, PA 19406",
    status: "Open",
    pipeline: {
      status: "overloaded",
      target: 6,
      current: 10,
      gap: -4,
      goalPct: 167,
      risk: "HM interview backlog / pipeline congestion",
      recommendedAction: "Hold, keep warm, or add strong candidates as leads to similar roles",
      ctaLabel: "Manage backlog",
      deadline: "Jun 21",
      screenedCount: 86,
      readyCount: 10,
      readyLabel: "ready candidates",
      recommendedImpact: "Hold new HM sends · keep warm / add leads to similar roles",
    },
    funnel: [
      { id: "applicants", label: "Applicants", count: 142 },
      { id: "screened", label: "Screened", count: 86 },
      { id: "ready-hm", label: "Ready for HM", count: 10, target: 6, highlight: true },
      { id: "sent-hm", label: "Sent to HM", count: 10 },
      { id: "hm-interview", label: "HM Interview", count: 10 },
    ],
    recommendation: {
      currentState:
        "10 candidates are with the hiring manager — 4 over the 6-interview target.",
      whyItMatters:
        "Pipeline congestion increases HM cycle time and delays feedback on candidates already in review.",
      nextStep:
        "Hold forwarding. Send warm updates to strong waiting candidates and add top matches as leads to open roles with available HM capacity.",
      expectedOutcome:
        "HM workload normalizes; strong candidates remain engaged while pipeline drains.",
    },
  },
];

export const JOBS_BY_SLUG: Record<string, JobSummary> = Object.fromEntries(
  JOBS.map((j) => [j.slug, j]),
);

// Agent prompt copy kept for legacy reference (conversation thread copies live in each page)
export const AGENT_PROMPTS: Record<string, AgentPromptCopy> = {
  "jobs-today": {
    body: "Here are the jobs that need recruiter action today. I prioritized them based on pipeline health, Candidate Readiness, and screening evidence.",
    buttons: [],
    why: {
      title: "Why these jobs are prioritized",
      pipelineHealth:
        "Each job is flagged because its pipeline health is off-target: one is underfilled, one is high-volume, and one has an interview backlog.",
      candidateReadiness:
        "Candidate Readiness identified clear next actions for each job — fast-track, prioritize queue, or keep warm.",
      screeningEvidence:
        "Screening evidence is incorporated into Candidate Readiness so recruiters can act without reviewing every transcript.",
      recommendation:
        "Start with the underfilled ML role — it has 2 ready candidates who can move to HM Interview today.",
    },
  },
  "ml-engineer": {
    body: "This ML role is under target for HM Interviews. Historically, this role needs 5 HM interviews to fill. You currently have 2. I found 2 candidates with strong Candidate Readiness. Want to compare and fast-track them?",
    buttons: [
      { id: "compare", label: "Compare ready candidates", variant: "primary" },
      { id: "why", label: "Show why", variant: "secondary" },
      { id: "dismiss", label: "Not now", variant: "ghost" },
    ],
    why: {
      title: "Why this recommendation",
      pipelineHealth:
        "This ML role typically needs 5 HM interviews to fill. The pipeline currently holds 2 — under target by 3.",
      candidateReadiness:
        "2 candidates show strong Candidate Readiness combining profile fit and screening evidence.",
      screeningEvidence:
        "Both ready candidates have completed screening with strong technical signals.",
      recommendation:
        "Fast-tracking the 2 ready candidates would bring the HM pipeline to 4 of 5 and reduce time-to-fill.",
    },
  },
  "customer-service-outfitter": {
    body: "This high-volume role has 186 new applicants. I found 31 candidates ready for screening, 18 needing review, and 42 low-priority candidates. Want to prioritize the queue?",
    buttons: [
      { id: "prioritize", label: "Prioritize queue", variant: "primary" },
      { id: "review-top", label: "Review top candidates", variant: "secondary" },
      { id: "show-low", label: "Show low-priority group", variant: "secondary" },
      { id: "why", label: "Show why", variant: "ghost" },
    ],
    why: {
      title: "Why this recommendation",
      pipelineHealth:
        "186 new applicants arrived in the last 7 days — well above the average for this role and impossible to review one-by-one.",
      candidateReadiness:
        "Candidate Readiness grouped applicants into actionable buckets: 31 ready for screening, 18 needing review, and 42 low-priority.",
      screeningEvidence:
        "Profile fit + structured screening responses drive the bucketing, so recruiters can act in bulk with confidence.",
      recommendation:
        "Send the 31 Ready for Screening candidates first, then triage the 18 Needs Review candidates manually.",
    },
  },
  "store-operations-manager": {
    body: "This job already has 10 candidates with the hiring manager. Historically, this role needs 6 HM interviews. I do not recommend forwarding more candidates right now.",
    buttons: [
      { id: "keep-warm", label: "Keep candidates warm", variant: "primary" },
      { id: "redirect", label: "Redirect strong candidates", variant: "secondary" },
      { id: "review-backlog", label: "Review backlog", variant: "secondary" },
      { id: "dismiss", label: "Not now", variant: "ghost" },
    ],
    why: {
      title: "Why this recommendation",
      pipelineHealth:
        "10 candidates are with the hiring manager. This role historically needs only 6 HM interviews — pipeline is over-capacity.",
      candidateReadiness:
        "Several strong candidates are still in lead status. Forwarding more would create longer HM cycle times without changing outcomes.",
      screeningEvidence:
        "Screening evidence is solid for the top 3 — they should be kept warm or redirected, not pushed into the queue.",
      recommendation:
        "Keep strong leads warm with a short update and consider redirecting them to similar open roles.",
    },
  },
};
