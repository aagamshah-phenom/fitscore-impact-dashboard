import type { HMPipelineMetrics } from "../data/types";
import { cn } from "../lib/cn";
import styles from "./HMPipelinePanel.module.css";

interface HMPipelinePanelProps {
  metrics: HMPipelineMetrics;
}

export function HMPipelinePanel({ metrics }: HMPipelinePanelProps) {
  const {
    status,
    target,
    current,
    risk,
    recommendedAction,
    deadline,
    screenedCount,
    readyCount,
    readyLabel,
    recommendedImpact,
  } = metrics;

  const isAtRisk = status === "at-risk";
  const isOverloaded = status === "overloaded";

  const statusClass = isAtRisk
    ? styles.statusAtRisk
    : isOverloaded
      ? styles.statusOverloaded
      : styles.statusHealthy;

  const statusLabel = isAtRisk ? "At Risk" : isOverloaded ? "Overloaded" : "Healthy";

  const currentClass = isAtRisk
    ? styles.metricValueAtRisk
    : isOverloaded
      ? styles.metricValueOverloaded
      : undefined;

  return (
    <div className={styles.panel}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>HM Interview Pipeline</span>
          <span className={cn(styles.statusBadge, statusClass)}>{statusLabel}</span>
        </div>
      </div>

      {/* ── 4-tile body ── */}
      <div className={styles.body}>
        {/* Tile A — HM Interview Goal */}
        <div className={styles.tile}>
          <span className={styles.tileLabel}>HM Interview Goal</span>
          <span className={styles.tileValue}>{target} candidates</span>
          <span className={styles.tileSub}>by {deadline}</span>
        </div>

        {/* Tile B — Current HM Pipeline */}
        <div className={styles.tile}>
          <span className={styles.tileLabel}>Current HM Pipeline</span>
          <span className={cn(styles.tileValue, currentClass)}>{current}</span>
          <span className={styles.tileSub}>in HM review</span>
        </div>

        {/* Tile C — Screening Supply */}
        <div className={styles.tile}>
          <span className={styles.tileLabel}>Screening Supply</span>
          <span className={styles.tileValue}>{screenedCount} screened</span>
          <span className={styles.tileSub}>
            {readyCount} {readyLabel}
          </span>
        </div>

        {/* Tile D — Recommended Impact */}
        <div className={cn(styles.tile, styles.tileImpact)}>
          <span className={styles.tileLabel}>Recommended Impact</span>
          <span className={cn(styles.tileValue, styles.tileValueImpact)}>
            {recommendedImpact}
          </span>
        </div>
      </div>

      {/* ── Footer: Risk + Recommended action ── */}
      <div className={styles.footer}>
        <div className={styles.footerCell}>
          <span className={styles.footerLabel}>Risk</span>
          <span
            className={cn(
              styles.footerText,
              isAtRisk && styles.footerTextRisk,
              isOverloaded && styles.footerTextOverloaded,
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
