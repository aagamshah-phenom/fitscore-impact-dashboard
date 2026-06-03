import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDemoState, type DemoStep } from "../state/useDemoState";
import { cn } from "../lib/cn";
import { Check, ChevronDown, Sparkles } from "../lib/icons";
import { Button } from "./Button";
import styles from "./DemoGuide.module.css";

const STEPS: { num: DemoStep; text: string }[] = [
  { num: 1, text: "Start from Jobs / Today's Hiring Priorities" },
  { num: 2, text: "Open ML Engineer underfilled pipeline" },
  { num: 3, text: "Compare candidates and move Routhu to HM Interview" },
  { num: 4, text: "Review the agent's next-best-step follow-up" },
  { num: 5, text: "Open Customer Service high-volume queue and prioritize screening" },
  { num: 6, text: "Open Store Operations Manager backlog and keep candidates warm" },
];

export function DemoGuide() {
  // Default collapsed so the panel never covers CRM content on first load.
  // Presenter opens it explicitly via the floating pill.
  const [open, setOpen] = useState(false);
  const { state, setStep, resetDemo } = useDemoState();
  const navigate = useNavigate();

  if (!open) {
    return (
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen(true)}
        aria-label="Open Demo Guide"
      >
        <Sparkles size={12} />
        Demo Guide · Step {state.demoStep} of 6
      </button>
    );
  }

  function handleReset() {
    resetDemo();
    navigate("/jobs");
  }

  return (
    <aside className={styles.panel} aria-label="Demo Guide">
      <header className={styles.panelHeader}>
        <span className={styles.panelTitle}>
          <Sparkles size={14} /> Demo Guide
        </span>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setOpen(false)}
          aria-label="Collapse Demo Guide"
        >
          <ChevronDown size={14} />
        </button>
      </header>
      <div className={styles.steps}>
        {STEPS.map((s) => {
          const done = state.demoStep > s.num;
          const active = state.demoStep === s.num;
          return (
            <button
              key={s.num}
              type="button"
              className={cn(
                styles.step,
                active && styles.stepActive,
                done && styles.stepDone,
              )}
              onClick={() => setStep(s.num)}
            >
              <span className={styles.stepNum} aria-hidden="true">
                {done ? <Check size={11} /> : s.num}
              </span>
              <span className={styles.stepText}>{s.text}</span>
            </button>
          );
        })}
      </div>
      <footer className={styles.footer}>
        <span className={styles.footerNote}>Presenter aid</span>
        <Button size="sm" variant="secondary" onClick={handleReset}>
          Reset Demo
        </Button>
      </footer>
    </aside>
  );
}
