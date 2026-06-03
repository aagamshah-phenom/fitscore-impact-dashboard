import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import styles from "./Tabs.module.css";

export interface TabDef {
  id: string;
  label: ReactNode;
  badge?: ReactNode;
}

interface TabsProps {
  tabs: TabDef[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, className }: TabsProps) {
  return (
    <div className={cn(styles.tabs, className)} role="tablist">
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
            {tab.label}
            {tab.badge != null && <span className={styles.tabBadge}>{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
