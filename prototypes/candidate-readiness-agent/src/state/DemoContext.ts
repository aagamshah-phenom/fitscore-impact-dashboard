import { createContext } from "react";
import type { AgentChatEntry, Candidate, ReadinessStatus } from "../data/types";

export type DemoStep = 1 | 2 | 3 | 4 | 5 | 6;

// Tracks which conversation turn each job is on.
// "initial" = first agent message + action chips
// "post-action" = follow-up message after recruiter acted
// "post-action-2" = second follow-up (store ops redirect)
export type ConversationPhase = "initial" | "post-action" | "post-action-2";

export interface CandidateOverride {
  hiringStatus?: string;
  recommendedAction?: string;
  readiness?: ReadinessStatus;
}

export interface Toast {
  id: number;
  message: string;
  tone?: "default" | "success";
}

/** Per-job overrides to funnel stage counts (e.g. after sending to screening) */
export type FunnelStageOverride = Record<string, number>;

export interface DemoState {
  overrides: Record<string, CandidateOverride>;
  sentUpdates: string[];
  redirectedCandidates: string[];
  prioritizedJobs: string[];
  dismissedPrompts: string[];
  conversationPhases: Record<string, ConversationPhase>;
  /** jobId → Record<stageId, count> */
  funnelOverrides: Record<string, FunnelStageOverride>;
  /** jobId → chat history for the right-side agent panel */
  agentChats: Record<string, AgentChatEntry[]>;
  demoStep: DemoStep;
  toasts: Toast[];
}

export interface DemoContextValue {
  state: DemoState;
  applyOverride: (candidate: Candidate) => Candidate;
  moveToHM: (ids: string[]) => void;
  sendKeepWarmUpdate: (ids: string[]) => void;
  redirectCandidate: (id: string) => void;
  prioritizeQueue: (jobId: string) => void;
  dismissPrompt: (promptId: string) => void;
  isPromptDismissed: (promptId: string) => boolean;
  setConversationPhase: (jobId: string, phase: ConversationPhase) => void;
  getConversationPhase: (jobId: string) => ConversationPhase;
  setFunnelStage: (jobId: string, stageId: string, count: number) => void;
  getFunnelCount: (jobId: string, stageId: string, defaultCount: number) => number;
  pushAgentChat: (jobId: string, entries: AgentChatEntry[]) => void;
  getAgentChat: (jobId: string) => AgentChatEntry[];
  setStep: (step: DemoStep) => void;
  advanceStep: (min: DemoStep) => void;
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
  resetDemo: () => void;
}

export const DemoContext = createContext<DemoContextValue | null>(null);
