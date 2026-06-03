import type { RecommendationCopy } from "../data/types";
import styles from "./RecommendationBlock.module.css";

interface RecommendationBlockProps {
  copy: RecommendationCopy;
}

export function RecommendationBlock({ copy }: RecommendationBlockProps) {
  return (
    <div className={styles.block}>
      <div className={styles.grid}>
        <div className={styles.cell}>
          <span className={styles.cellLabel}>Current State</span>
          <p className={styles.cellText}>{copy.currentState}</p>
        </div>
        <div className={styles.cell}>
          <span className={styles.cellLabel}>Why This Matters</span>
          <p className={styles.cellText}>{copy.whyItMatters}</p>
        </div>
        <div className={styles.cell}>
          <span className={styles.cellLabel}>Recommended Next Step</span>
          <p className={styles.cellText}>{copy.nextStep}</p>
        </div>
        <div className={styles.cell}>
          <span className={`${styles.cellLabel} ${styles.cellLabelOutcome}`}>
            Expected Outcome
          </span>
          <p className={styles.cellText}>{copy.expectedOutcome}</p>
        </div>
      </div>
    </div>
  );
}
