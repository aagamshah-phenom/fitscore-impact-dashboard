import * as Popover from "@radix-ui/react-popover";
import { Sparkles } from "../lib/icons";
import { Button, type ButtonVariant } from "./Button";
import type { AgentPromptCopy } from "../data/types";
import styles from "./AgentPrompt.module.css";

interface AgentPromptProps {
  copy: AgentPromptCopy;
  onButtonClick?: (id: string) => void;
}

export function AgentPrompt({ copy, onButtonClick }: AgentPromptProps) {
  return (
    <div className={styles.prompt}>
      <div className={styles.iconWrap} aria-hidden="true">
        <Sparkles size={16} />
      </div>
      <div className={styles.body}>
        <div className={styles.header}>
          <span className={styles.title}>Candidate Readiness Agent</span>
        </div>
        <p className={styles.message}>{copy.body}</p>
        {copy.buttons.length > 0 && (
          <div className={styles.actions}>
            {copy.buttons.map((btn) =>
              btn.id === "why" ? (
                <WhyPopoverButton
                  key={btn.id}
                  label={btn.label}
                  variant={btn.variant}
                  why={copy.why}
                />
              ) : (
                <Button
                  key={btn.id}
                  size="sm"
                  variant={btn.variant}
                  onClick={() => onButtonClick?.(btn.id)}
                >
                  {btn.label}
                </Button>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WhyPopoverButton({
  label,
  variant,
  why,
}: {
  label: string;
  variant: ButtonVariant;
  why: AgentPromptCopy["why"];
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button size="sm" variant={variant}>
          {label}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={styles.whyPopover}
          sideOffset={8}
          align="start"
          collisionPadding={16}
        >
          <div className={styles.whyTitle}>
            <Sparkles size={14} /> {why.title}
          </div>
          <div className={styles.whyList}>
            <div className={styles.whyItem}>
              <span className={styles.whyLabel}>Pipeline health</span>
              <span className={styles.whyText}>{why.pipelineHealth}</span>
            </div>
            <div className={styles.whyItem}>
              <span className={styles.whyLabel}>Candidate Readiness</span>
              <span className={styles.whyText}>{why.candidateReadiness}</span>
            </div>
            <div className={styles.whyItem}>
              <span className={styles.whyLabel}>Screening evidence</span>
              <span className={styles.whyText}>{why.screeningEvidence}</span>
            </div>
          </div>
          <div className={styles.whyRec}>
            <span className={styles.whyRecLabel}>Recommendation:</span>
            <span className={styles.whyText}>{why.recommendation}</span>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
