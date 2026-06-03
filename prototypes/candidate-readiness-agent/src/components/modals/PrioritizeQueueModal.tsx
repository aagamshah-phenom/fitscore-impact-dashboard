import { Button } from "../Button";
import { Modal } from "../Modal";
import { ReadinessChip } from "../ReadinessChip";
import { CUSTOMER_SERVICE_SEGMENT_COUNTS } from "../../data/candidates";
import { useDemoState } from "../../state/useDemoState";
import { cn } from "../../lib/cn";
import type { ReadinessStatus } from "../../data/types";
import styles from "./PrioritizeQueueModal.module.css";

interface Bucket {
  id: string;
  status: ReadinessStatus;
  label: string;
  count: number;
  action: string;
  primary?: boolean;
}

const BUCKETS: Bucket[] = [
  {
    id: "ready",
    status: "send-to-screening",
    label: "Ready for Screening",
    count: CUSTOMER_SERVICE_SEGMENT_COUNTS.readyForScreening,
    action: "Send to screening",
    primary: true,
  },
  {
    id: "needs-review",
    status: "needs-review",
    label: "Needs Review",
    count: CUSTOMER_SERVICE_SEGMENT_COUNTS.needsReview,
    action: "Review evidence",
  },
  {
    id: "low-priority",
    status: "low-priority",
    label: "Low Priority",
    count: CUSTOMER_SERVICE_SEGMENT_COUNTS.lowPriority,
    action: "Hold for later",
  },
  {
    id: "incomplete",
    status: "needs-recruiter-review",
    label: "Incomplete Evidence",
    count: CUSTOMER_SERVICE_SEGMENT_COUNTS.incompleteEvidence,
    action: "Request missing info / review manually",
  },
];

interface PrioritizeQueueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  /** Optional override called instead of the default prioritize flow. */
  onSend?: () => void;
}

export function PrioritizeQueueModal({
  open,
  onOpenChange,
  jobId,
  onSend,
}: PrioritizeQueueModalProps) {
  const { prioritizeQueue, pushToast, advanceStep } = useDemoState();

  function handleSend() {
    if (onSend) {
      onSend();
      return;
    }
    prioritizeQueue(jobId);
    pushToast(
      `${CUSTOMER_SERVICE_SEGMENT_COUNTS.readyForScreening} candidates prepared for screening.`,
      "success",
    );
    advanceStep(5);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Prioritize high-volume candidate queue"
      subtitle="Group candidates by Candidate Readiness so recruiters can act in bulk without reviewing every profile manually."
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSend}>
            Send Ready for Screening group
          </Button>
        </>
      }
    >
      <div className={styles.intro}>
        The agent grouped the pipeline using profile fit and screening evidence.
        You can act on each bucket independently — start with the largest
        time-saver below.
      </div>
      <div className={styles.buckets}>
        {BUCKETS.map((b) => (
          <div
            key={b.id}
            className={cn(styles.bucket, b.primary && styles.bucketPrimary)}
          >
            <div className={styles.bucketTitle}>
              <ReadinessChip status={b.status} staticChip />
              <span className={styles.bucketCount}>{b.count} candidates</span>
            </div>
            <div className={styles.bucketLabel}>{b.label}</div>
            <div className={styles.bucketAction}>{b.action}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
