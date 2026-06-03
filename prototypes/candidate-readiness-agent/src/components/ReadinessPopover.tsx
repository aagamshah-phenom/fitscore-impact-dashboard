import * as Popover from "@radix-ui/react-popover";
import type { ReactNode } from "react";
import { READINESS_LABEL, type ReadinessEvidence, type ReadinessStatus } from "../data/types";
import { cn } from "../lib/cn";
import styles from "./ReadinessPopover.module.css";

const STATUS_COLOR: Record<ReadinessStatus, string> = {
  "ready-for-hm": "#1f7644",
  "needs-recruiter-review": "#4a31d8",
  "needs-review": "#a06606",
  "send-to-screening": "#228a73",
  "strong-candidate": "#1f4ea3",
  "low-priority": "#5a5f73",
};

interface ReadinessPopoverProps {
  evidence: ReadinessEvidence;
  trigger: ReactNode;
}

export function ReadinessPopover({ evidence, trigger }: ReadinessPopoverProps) {
  const riskClass =
    evidence.riskLevel === "low"
      ? styles.riskLow
      : evidence.riskLevel === "medium"
        ? styles.riskMedium
        : styles.riskHigh;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={6}
          align="center"
          collisionPadding={16}
          className={styles.content}
        >
          <div className={styles.header}>
            <div
              className={styles.statusIcon}
              style={{ background: STATUS_COLOR[evidence.status] }}
              aria-hidden="true"
            >
              {READINESS_LABEL[evidence.status][0]}
            </div>
            <div className={styles.statusTextWrap}>
              <div className={styles.statusLabel}>
                {READINESS_LABEL[evidence.status]}
              </div>
              <div className={styles.statusSummary}>{evidence.summary}</div>
            </div>
          </div>
          <div className={styles.evidenceList}>
            <EvidenceRow label="Profile Fit" value={evidence.profileFit} />
            <EvidenceRow
              label="Screening Evidence"
              value={evidence.screeningEvidence}
            />
            <EvidenceRow
              label="Experience Match"
              value={evidence.experienceMatch}
            />
            <EvidenceRow label="Location Match" value={evidence.locationMatch} />
            <EvidenceRow
              label="Pipeline Context"
              value={evidence.pipelineContext}
            />
            <EvidenceRow
              label="Risk / Concern"
              value={evidence.riskConcern}
              valueClassName={riskClass}
            />
          </div>
          <div className={styles.next}>
            <span className={styles.nextLabel}>Recommended next action</span>
            <span className={styles.nextValue}>
              {evidence.recommendedNextAction}
            </span>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function EvidenceRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className={styles.evidenceRow}>
      <span className={styles.evidenceLabel}>{label}</span>
      <span className={cn(styles.evidenceValue, valueClassName)}>{value}</span>
    </div>
  );
}
