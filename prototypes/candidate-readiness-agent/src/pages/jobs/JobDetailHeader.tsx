import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Sparkles } from "../../lib/icons";
import type { JobSummary } from "../../data/types";
import { cn } from "../../lib/cn";
import styles from "./JobDetailHeader.module.css";

const TABS = [
  { id: "candidates", label: "Candidates" },
  { id: "ai-discovery", label: "AI Discovery", badge: "4" },
  { id: "screening", label: "Screening" },
  { id: "interviews", label: "Interviews" },
  { id: "description", label: "Description" },
  { id: "details", label: "Details" },
  { id: "analytics", label: "Analytics" },
];

interface JobDetailHeaderProps {
  job: JobSummary;
  activeTabId: string;
  onTabChange: (id: string) => void;
  summary: {
    visits: number;
    leads: number;
    applicants: number;
  };
}

export function JobDetailHeader({
  job,
  activeTabId,
  onTabChange,
  summary,
}: JobDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => navigate("/jobs")}
        >
          <ChevronLeft size={14} />
          Jobs
        </button>
        <div className={styles.nav}>
          <button type="button" className={styles.navItem} tabIndex={-1}>
            <ChevronLeft size={12} /> Previous Job
          </button>
          <span className={styles.navDivider}>|</span>
          <button type="button" className={styles.navItem} tabIndex={-1}>
            Next Job <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <div className={styles.titleRow}>
        <span className={styles.statusPill}>{job.status}</span>
        <span className={styles.title}>{job.title}</span>
        <span className={styles.jobId}>| {job.jobId}</span>
        <span className={styles.askPill}>
          <Sparkles size={12} />
          Ask anything
        </span>
        <div className={styles.headerRight}>
          <button type="button" className={styles.actionsBtn} tabIndex={-1}>
            Actions <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {job.address && <div className={styles.address}>{job.address}</div>}

      <div className={styles.tabsRow}>
        <div className={styles.tabsList} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === activeTabId}
              className={cn(
                styles.tab,
                t.id === activeTabId && styles.tabActive,
              )}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
              {t.badge && <span className={styles.tabBadge}>{t.badge}</span>}
            </button>
          ))}
        </div>
        <div className={styles.summary}>
          Visits <b>{summary.visits.toLocaleString()}</b> · Leads{" "}
          <b>{summary.leads}</b> · Applicants <b>{summary.applicants}</b>
        </div>
      </div>
    </header>
  );
}
