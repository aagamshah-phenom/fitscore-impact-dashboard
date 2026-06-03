import { useContext } from "react";
import { DemoContext, type DemoContextValue } from "./DemoContext";

export type { DemoStep, Toast, DemoContextValue, ConversationPhase, FunnelStageOverride } from "./DemoContext";

export function useDemoState(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemoState must be used inside <DemoStateProvider>");
  }
  return ctx;
}
