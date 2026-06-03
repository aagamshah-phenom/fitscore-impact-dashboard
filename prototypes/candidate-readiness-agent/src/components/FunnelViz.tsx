import type { FunnelStage } from "../data/types";
import { cn } from "../lib/cn";
import styles from "./FunnelViz.module.css";

interface FunnelVizProps {
  stages: FunnelStage[];
}

export function FunnelViz({ stages }: FunnelVizProps) {
  return (
    <div className={styles.funnel} role="list" aria-label="Hiring funnel">
      {stages.map((stage) => {
        const isHighlight = stage.highlight ?? false;
        const isOver =
          stage.target !== undefined &&
          stage.count > stage.target;
        const isUnder =
          stage.target !== undefined &&
          stage.count < stage.target &&
          isHighlight;

        return (
          <div
            key={stage.id}
            role="listitem"
            className={cn(
              styles.stage,
              isHighlight && !isOver && styles.stageHighlight,
              isOver && styles.stageOverloaded,
            )}
          >
            <span className={styles.stageLabel}>{stage.label}</span>
            <span
              className={cn(
                styles.stageCount,
                isHighlight && !isOver && styles.stageCountHighlight,
                isOver && styles.stageCountOverloaded,
              )}
            >
              {stage.count}
            </span>
            {stage.target !== undefined && (
              <span
                className={cn(
                  styles.stageTarget,
                  isHighlight && styles.stageTargetHighlight,
                )}
              >
                / {stage.target} target
              </span>
            )}
            {isUnder && (
              <span className={cn(styles.stageBadge, styles.badgeGap)}>Gap</span>
            )}
            {isOver && (
              <span className={cn(styles.stageBadge, styles.badgeOver)}>
                +{stage.count - (stage.target ?? 0)} over
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
