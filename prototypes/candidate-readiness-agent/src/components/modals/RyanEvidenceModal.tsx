import { Button } from "../Button";
import { Modal } from "../Modal";
import styles from "./RyanEvidenceModal.module.css";

interface RyanEvidenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVIDENCE_ROWS = [
  { label: "Profile Fit", value: "Strong", className: "" },
  { label: "Screening Evidence", value: "Weak", className: styles.valueMedium },
  { label: "Experience Match", value: "Within range", className: "" },
  { label: "Location Match", value: "Good", className: "" },
  { label: "Pipeline Context", value: "HM pipeline under target", className: "" },
  { label: "Risk / Concern", value: "Screening depth concern", className: styles.valueMedium },
];

export function RyanEvidenceModal({ open, onOpenChange }: RyanEvidenceModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Ryan Reynolds — Screening Evidence"
      subtitle="Candidate Readiness: Needs Review"
      size="md"
      footer={
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      }
    >
      <div className={styles.body}>
        <div className={styles.evidenceGrid}>
          {EVIDENCE_ROWS.map((row) => (
            <div key={row.label} className={styles.evidenceRow}>
              <span className={styles.evidenceLabel}>{row.label}</span>
              <span className={`${styles.evidenceValue} ${row.className}`}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className={styles.recommendation}>
          <span className={styles.recommendationLabel}>Agent assessment:</span>
          Ryan has strong profile evidence, but screening responses did not show enough technical
          depth. Recommendation: review screening evidence before HM submission.
        </div>
      </div>
    </Modal>
  );
}
