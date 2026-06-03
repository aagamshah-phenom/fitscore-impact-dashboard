import {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { AgentChatEntry, Candidate } from "../data/types";
import {
  DemoContext,
  type CandidateOverride,
  type ConversationPhase,
  type DemoState,
  type DemoStep,
  type Toast,
} from "./DemoContext";

type DemoAction =
  | { type: "MOVE_TO_HM"; candidateIds: string[] }
  | { type: "SEND_KEEP_WARM"; candidateIds: string[] }
  | { type: "REDIRECT_CANDIDATE"; candidateId: string }
  | { type: "PRIORITIZE_QUEUE"; jobId: string }
  | { type: "DISMISS_PROMPT"; promptId: string }
  | { type: "SET_CONVERSATION_PHASE"; jobId: string; phase: ConversationPhase }
  | { type: "SET_FUNNEL_STAGE"; jobId: string; stageId: string; count: number }
  | { type: "PUSH_AGENT_CHAT"; jobId: string; entries: AgentChatEntry[] }
  | { type: "SET_STEP"; step: DemoStep }
  | { type: "ADVANCE_STEP"; min: DemoStep }
  | { type: "PUSH_TOAST"; toast: Toast }
  | { type: "DISMISS_TOAST"; id: number }
  | { type: "RESET" };

const INITIAL: DemoState = {
  overrides: {},
  sentUpdates: [],
  redirectedCandidates: [],
  prioritizedJobs: [],
  dismissedPrompts: [],
  conversationPhases: {},
  funnelOverrides: {},
  agentChats: {},
  demoStep: 1,
  toasts: [],
};

function reducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "MOVE_TO_HM": {
      const overrides: Record<string, CandidateOverride> = { ...state.overrides };
      let changed = false;
      for (const id of action.candidateIds) {
        const current = overrides[id];
        if (
          current?.hiringStatus === "HM Interview" &&
          current?.recommendedAction === "Moved to HM Interview"
        ) {
          continue;
        }
        overrides[id] = {
          ...current,
          hiringStatus: "HM Interview",
          recommendedAction: "Moved to HM Interview",
        };
        changed = true;
      }
      return changed ? { ...state, overrides } : state;
    }
    case "SEND_KEEP_WARM": {
      const existing = new Set(state.sentUpdates);
      let changed = false;
      for (const id of action.candidateIds) {
        if (!existing.has(id)) {
          existing.add(id);
          changed = true;
        }
      }
      return changed
        ? { ...state, sentUpdates: Array.from(existing) }
        : state;
    }
    case "REDIRECT_CANDIDATE": {
      if (state.redirectedCandidates.includes(action.candidateId)) return state;
      return {
        ...state,
        redirectedCandidates: [...state.redirectedCandidates, action.candidateId],
      };
    }
    case "PRIORITIZE_QUEUE": {
      if (state.prioritizedJobs.includes(action.jobId)) return state;
      return {
        ...state,
        prioritizedJobs: [...state.prioritizedJobs, action.jobId],
      };
    }
    case "DISMISS_PROMPT": {
      if (state.dismissedPrompts.includes(action.promptId)) return state;
      return {
        ...state,
        dismissedPrompts: [...state.dismissedPrompts, action.promptId],
      };
    }
    case "SET_CONVERSATION_PHASE": {
      if (state.conversationPhases[action.jobId] === action.phase) return state;
      return {
        ...state,
        conversationPhases: {
          ...state.conversationPhases,
          [action.jobId]: action.phase,
        },
      };
    }
    case "SET_FUNNEL_STAGE": {
      const existing = state.funnelOverrides[action.jobId];
      if (existing?.[action.stageId] === action.count) return state;
      return {
        ...state,
        funnelOverrides: {
          ...state.funnelOverrides,
          [action.jobId]: { ...existing, [action.stageId]: action.count },
        },
      };
    }
    case "PUSH_AGENT_CHAT": {
      const prev = state.agentChats[action.jobId] ?? [];
      return {
        ...state,
        agentChats: {
          ...state.agentChats,
          [action.jobId]: [...prev, ...action.entries],
        },
      };
    }
    case "SET_STEP":
      if (state.demoStep === action.step) return state;
      return { ...state, demoStep: action.step };
    case "ADVANCE_STEP": {
      const next = Math.max(state.demoStep, action.min) as DemoStep;
      if (next === state.demoStep) return state;
      return { ...state, demoStep: next };
    }
    case "PUSH_TOAST":
      return { ...state, toasts: [...state.toasts, action.toast] };
    case "DISMISS_TOAST": {
      const next = state.toasts.filter((t) => t.id !== action.id);
      if (next.length === state.toasts.length) return state;
      return { ...state, toasts: next };
    }
    case "RESET":
      return INITIAL;
    default:
      return state;
  }
}

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const toastIdRef = useRef(0);

  // All action functions are stable (no deps) so consumers can include them
  // in useEffect dependency arrays without causing infinite re-renders.
  const moveToHM = useCallback((ids: string[]) => {
    dispatch({ type: "MOVE_TO_HM", candidateIds: ids });
  }, []);
  const sendKeepWarmUpdate = useCallback((ids: string[]) => {
    dispatch({ type: "SEND_KEEP_WARM", candidateIds: ids });
  }, []);
  const redirectCandidate = useCallback((id: string) => {
    dispatch({ type: "REDIRECT_CANDIDATE", candidateId: id });
  }, []);
  const prioritizeQueue = useCallback((jobId: string) => {
    dispatch({ type: "PRIORITIZE_QUEUE", jobId });
  }, []);
  const dismissPrompt = useCallback((promptId: string) => {
    dispatch({ type: "DISMISS_PROMPT", promptId });
  }, []);
  const setConversationPhase = useCallback(
    (jobId: string, phase: ConversationPhase) => {
      dispatch({ type: "SET_CONVERSATION_PHASE", jobId, phase });
    },
    [],
  );
  const setFunnelStage = useCallback(
    (jobId: string, stageId: string, count: number) => {
      dispatch({ type: "SET_FUNNEL_STAGE", jobId, stageId, count });
    },
    [],
  );
  const pushAgentChat = useCallback(
    (jobId: string, entries: AgentChatEntry[]) => {
      dispatch({ type: "PUSH_AGENT_CHAT", jobId, entries });
    },
    [],
  );
  const setStep = useCallback((step: DemoStep) => {
    dispatch({ type: "SET_STEP", step });
  }, []);
  const advanceStep = useCallback((min: DemoStep) => {
    dispatch({ type: "ADVANCE_STEP", min });
  }, []);
  const pushToast = useCallback(
    (message: string, tone: Toast["tone"] = "default") => {
      toastIdRef.current += 1;
      dispatch({
        type: "PUSH_TOAST",
        toast: { id: toastIdRef.current, message, tone },
      });
    },
    [],
  );
  const dismissToast = useCallback((id: number) => {
    dispatch({ type: "DISMISS_TOAST", id });
  }, []);
  const resetDemo = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const applyOverride = useCallback(
    (candidate: Candidate): Candidate => {
      const o = state.overrides[candidate.id];
      if (!o) return candidate;
      return {
        ...candidate,
        hiringStatus: o.hiringStatus ?? candidate.hiringStatus,
        recommendedAction: o.recommendedAction ?? candidate.recommendedAction,
        readiness: o.readiness ?? candidate.readiness,
      };
    },
    [state.overrides],
  );

  const isPromptDismissed = useCallback(
    (promptId: string) => state.dismissedPrompts.includes(promptId),
    [state.dismissedPrompts],
  );

  const getConversationPhase = useCallback(
    (jobId: string): ConversationPhase =>
      state.conversationPhases[jobId] ?? "initial",
    [state.conversationPhases],
  );

  const getFunnelCount = useCallback(
    (jobId: string, stageId: string, defaultCount: number): number =>
      state.funnelOverrides[jobId]?.[stageId] ?? defaultCount,
    [state.funnelOverrides],
  );

  const getAgentChat = useCallback(
    (jobId: string): AgentChatEntry[] => state.agentChats[jobId] ?? [],
    [state.agentChats],
  );

  const value = useMemo(
    () => ({
      state,
      applyOverride,
      isPromptDismissed,
      moveToHM,
      sendKeepWarmUpdate,
      redirectCandidate,
      prioritizeQueue,
      dismissPrompt,
      setConversationPhase,
      getConversationPhase,
      setFunnelStage,
      getFunnelCount,
      pushAgentChat,
      getAgentChat,
      setStep,
      advanceStep,
      pushToast,
      dismissToast,
      resetDemo,
    }),
    [
      state,
      applyOverride,
      isPromptDismissed,
      moveToHM,
      sendKeepWarmUpdate,
      redirectCandidate,
      prioritizeQueue,
      dismissPrompt,
      setConversationPhase,
      getConversationPhase,
      setFunnelStage,
      getFunnelCount,
      pushAgentChat,
      getAgentChat,
      setStep,
      advanceStep,
      pushToast,
      dismissToast,
      resetDemo,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
