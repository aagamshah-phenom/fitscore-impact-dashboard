export type ReadinessStatus =
  | "ready-for-hm"
  | "needs-recruiter-review"
  | "needs-review"
  | "send-to-screening"
  | "strong-candidate"
  | "low-priority";

export const READINESS_LABEL: Record<ReadinessStatus, string> = {
  "ready-for-hm": "Ready for HM Interview",
  "needs-recruiter-review": "Needs Recruiter Review",
  "needs-review": "Needs Review",
  "send-to-screening": "Send to Screening",
  "strong-candidate": "Strong Candidate",
  "low-priority": "Low Priority",
};

export type ScreeningStatus =
  | "completed"
  | "pending-evaluation"
  | "not-started"
  | "in-progress";

export const SCREENING_LABEL: Record<ScreeningStatus, string> = {
  completed: "Completed",
  "pending-evaluation": "Pending evaluation",
  "not-started": "Not started",
  "in-progress": "In progress",
};

export type ScenarioKey =
  | "underfilled-pipeline"
  | "high-volume"
  | "hm-backlog";

export type PipelineStatus = "healthy" | "at-risk" | "overloaded";

export interface HMPipelineMetrics {
  status: PipelineStatus;
  target: number;
  current: number;
  /** Positive = gap to fill; negative = over target */
  gap: number;
  goalPct: number;
  risk: string;
  recommendedAction: string;
  ctaLabel: string;
}

export interface FunnelStage {
  id: string;
  label: string;
  count: number;
  /** If set, displayed as "count / target" and highlighted as the bottleneck */
  target?: number;
  highlight?: boolean;
}

export interface RecommendationCopy {
  currentState: string;
  whyItMatters: string;
  nextStep: string;
  expectedOutcome: string;
}

export interface JobSummary {
  id: string;
  slug: string;
  jobId: string;
  title: string;
  scenario: ScenarioKey;
  scenarioLabel: string;
  readinessInsight: string;
  recommendedAction: string;
  address?: string;
  status?: string;
  pipeline: HMPipelineMetrics;
  funnel: FunnelStage[];
  recommendation: RecommendationCopy;
}

export type FitGrade = "A" | "B" | "C" | "D";

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  role: string;
  hiringStatus: string;
  readiness: ReadinessStatus;
  screening?: ScreeningStatus;
  recommendedAction: string;
  createdDate: string;
  profileSource: string;
  leadSource: string;
  location: string;
  email?: string;
  reason?: string;
  /** Letter grade A–D */
  fitScore?: FitGrade;
  /** Score out of 5; null = not completed */
  screeningScore?: number | null;
  /** Short evidence summary */
  evidence?: string;
  /** Risk flag text */
  riskFlag?: string;
}

export interface ReadinessEvidence {
  status: ReadinessStatus;
  summary: string;
  profileFit: string;
  screeningEvidence: string;
  experienceMatch: string;
  locationMatch: string;
  pipelineContext: string;
  riskConcern: string;
  riskLevel?: "low" | "medium" | "high";
  recommendedNextAction: string;
}

export interface AgentPromptCopy {
  body: string;
  buttons: { id: string; label: string; variant: "primary" | "secondary" | "ghost" }[];
  why: {
    title: string;
    pipelineHealth: string;
    candidateReadiness: string;
    screeningEvidence: string;
    recommendation: string;
  };
}

export interface AgentChatEntry {
  role: "agent" | "user";
  text: string;
}
