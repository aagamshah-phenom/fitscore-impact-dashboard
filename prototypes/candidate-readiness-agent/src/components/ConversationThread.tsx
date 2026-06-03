import * as Popover from "@radix-ui/react-popover";
import type { ReactNode } from "react";
import { Sparkles } from "../lib/icons";
import { Button, type ButtonVariant } from "./Button";
import styles from "./ConversationThread.module.css";

export interface ActionChip {
  id: string;
  label: string;
  variant?: ButtonVariant;
  /** Renders an explain popover instead of firing onAction */
  explain?: ExplainContent;
}

export interface ExplainContent {
  title: string;
  items: { label: string; text: string }[];
  recommendation: string;
}

export interface ConversationMessage {
  role: "agent" | "recruiter";
  /** For recruiter rows: shown as "You selected …" chip label */
  text: string;
}

interface ConversationThreadProps {
  /** All messages so far; only the last 3 are rendered */
  messages: ConversationMessage[];
  /** Action chips shown after the latest agent message */
  actions: ActionChip[];
  onAction: (id: string) => void;
}

export function ConversationThread({
  messages,
  actions,
  onAction,
}: ConversationThreadProps) {
  // Show at most the last 3 messages so the card stays compact.
  const visible = messages.slice(-3);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrap} aria-hidden="true">
          <Sparkles size={14} />
        </div>
        <span className={styles.agentLabel}>Candidate Readiness Agent</span>
      </div>

      <div className={styles.thread}>
        {visible.map((msg, i) =>
          msg.role === "agent" ? (
            <div key={i} className={`${styles.row} ${styles.agentRow}`}>
              <p className={styles.agentText}>{msg.text}</p>
            </div>
          ) : (
            <div key={i} className={`${styles.row} ${styles.recruiterRow}`}>
              <span className={styles.youLabel}>You</span>
              <span className={styles.selectedChip}>{msg.text}</span>
            </div>
          ),
        )}
      </div>

      {actions.length > 0 && (
        <div className={styles.actionsRow}>
          {actions.map((chip) =>
            chip.explain ? (
              <ExplainPopoverChip key={chip.id} chip={chip as ActionChip & { explain: ExplainContent }} />
            ) : (
              <Button
                key={chip.id}
                size="sm"
                variant={chip.variant ?? "secondary"}
                onClick={() => onAction(chip.id)}
              >
                {chip.label}
              </Button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function ExplainPopoverChip({
  chip,
}: {
  chip: ActionChip & { explain: ExplainContent };
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button size="sm" variant={chip.variant ?? "ghost"}>
          {chip.label}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={8}
          align="start"
          collisionPadding={16}
          className={styles.explainPopover}
        >
          <div className={styles.explainTitle}>
            <Sparkles size={13} /> {chip.explain.title}
          </div>
          <div className={styles.explainList}>
            {chip.explain.items.map((item) => (
              <div key={item.label} className={styles.explainItem}>
                <span className={styles.explainItemLabel}>{item.label}</span>
                <span className={styles.explainItemText}>{item.text}</span>
              </div>
            ))}
          </div>
          <div className={styles.explainRec}>
            <span className={styles.explainRecLabel}>Recommendation:</span>
            {chip.explain.recommendation}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Convenience: a small inline node that renders a popover with evidence copy. */
export function InlineExplainButton({
  children,
  explain,
}: {
  children: ReactNode;
  explain: ExplainContent;
}) {
  return (
    <ExplainPopoverChip
      chip={{
        id: "inline",
        label: String(children),
        explain,
      }}
    />
  );
}
