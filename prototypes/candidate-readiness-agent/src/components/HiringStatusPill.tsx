import { ChevronDown } from "../lib/icons";
import { cn } from "../lib/cn";
import styles from "./HiringStatusPill.module.css";

interface HiringStatusPillProps {
  status: string;
  changed?: boolean;
}

export function HiringStatusPill({ status, changed }: HiringStatusPillProps) {
  return (
    <span className={cn(styles.pill, changed && styles.changed)}>
      <span className={styles.label}>{status}</span>
      <ChevronDown size={12} />
    </span>
  );
}
