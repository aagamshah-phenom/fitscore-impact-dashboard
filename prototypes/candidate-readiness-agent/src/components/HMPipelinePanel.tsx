import type { HMPipelineMetrics } from "../data/types";
import { cn } from "../lib/cn";
import styles from "./HMPipelinePanel.module.css";

interface HMPipelinePanelProps {
  metrics: HMPipelineMetrics;
}

export function HMPipelinePanel({ metrics }: HMPipelinePanelProps) {
  const { status, target, current, gap, goalPct, risk, recommendedAction } = metrics;

  const isAtRisk = status === "at-risk";
  const isOverloaded = status === "overloaded";
  const isHealthy = status === "healthy";

  const statusClass = isAtRisk
    ? styles.statusAtRisk
    : isOverloaded
      ? styles.statusOverloaded
      : styles.statusHealthy;

  const statusLabel = isAtRisk
    ? "At Risk"
    : isOverloaded
      ? "Overloaded"
      : "Healthy";

  const barClass = isAtRisk
    ? styles.progressBarAtRisk
    : isOverloaded
      ? styles.progressBarOverloaded
      : styles.progressBarHealthy;

  const clampedPct = Math.min(goalPct, 100);

  const gapLabel =
    gap > 0
      ? `${gap} more needed`
      : gap < 0
        ? `${Math.abs(gap)} over target`
        : "On target";

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>HM Interview Pipeline</span>
          <span className={cn(styles.statusBadge, statusClass)}>{statusLabel}</span>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Target</span>
          <span className={styles.metricValue}>{target}</span>
          <span className={styles.metricSub}>HM interviews</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Current</span>
          <span
            className={cn(
              styles.metricValue,
              isAtRisk && styles.metricValueAtRisk,
              isOverloaded && styles.metricValueOverloaded,
            )}
          >
            {current}
          </span>
          <span className={styles.metricSub}>HM-ready / sent</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Gap</span>
          <span
            className={cn(
              styles.metricValue,
              isAtRisk && styles.metricValueAtRisk,
              isOverloaded && styles.metricValueOverloaded,
            )}
          >
            {gapLabel}
          </span>
        </div>
        <div className={styles.progressWrap}>
          <span className={styles.progressLabel}>Goal achievement</span>
          <span className={styles.progressPct}>{goalPct}%</span>
          <div className={styles.progressBarTrack}>
            <div
              className={cn(styles.progressBarFill, barClass)}
              style={{ width: `${clampedPct}%` }}
              role="progressbar"
              aria-valuenow={goalPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerCell}>
          <span className={styles.footerLabel}>Risk</span>
          <span
            className={cn(
              styles.footerText,
              isAtRisk && styles.footerTextRisk,
              isOverloaded && styles.footerTextOverloaded,
              isHealthy && "",
            )}
          >
            {risk}
          </span>
        </div>
        <div className={styles.footerCell}>
          <span className={styles.footerLabel}>Recommended action</span>
          <span className={styles.footerText}>{recommendedAction}</span>
        </div>
      </div>
    </div>
  );
}
