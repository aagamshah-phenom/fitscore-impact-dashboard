import { ChevronRight } from "../lib/icons";
import { cn } from "../lib/cn";
import styles from "./SegmentTabs.module.css";

export interface SegmentTab {
  id: string;
  label: string;
  count?: number | string;
}

interface SegmentTabsProps {
  tabs: SegmentTab[];
  activeId: string;
  onChange: (id: string) => void;
  showOverflow?: boolean;
  className?: string;
}

export function SegmentTabs({
  tabs,
  activeId,
  onChange,
  showOverflow,
  className,
}: SegmentTabsProps) {
  return (
    <div className={cn(styles.wrap, className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(styles.tab, isActive && styles.tabActive)}
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.count != null && <span className={styles.count}>{tab.count}</span>}
          </button>
        );
      })}
      {showOverflow && (
        <span className={styles.overflow} title="More segments">
          More <ChevronRight size={14} />
        </span>
      )}
    </div>
  );
}
