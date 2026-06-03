import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { READINESS_LABEL, type ReadinessStatus } from "../data/types";
import styles from "./ReadinessChip.module.css";

const VARIANT_CLASS: Record<ReadinessStatus, string> = {
  "ready-for-hm": styles.readyForHm,
  "needs-recruiter-review": styles.needsRecruiter,
  "needs-review": styles.needsReview,
  "send-to-screening": styles.sendScreening,
  "strong-candidate": styles.strongCandidate,
  "low-priority": styles.lowPriority,
};

interface ReadinessChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  status: ReadinessStatus;
  staticChip?: boolean;
}

export const ReadinessChip = forwardRef<HTMLButtonElement, ReadinessChipProps>(
  function ReadinessChip({ status, staticChip, className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          styles.chip,
          VARIANT_CLASS[status],
          staticChip && styles.staticChip,
          className,
        )}
        {...rest}
      >
        <span className={styles.dot} aria-hidden="true" />
        {READINESS_LABEL[status]}
      </button>
    );
  },
);
