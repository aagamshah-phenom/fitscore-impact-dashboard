import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConversationThread } from "../components/ConversationThread";
import { JOBS } from "../data/jobs";
import type { JobSummary } from "../data/types";
import { useDemoState } from "../state/useDemoState";
import { cn } from "../lib/cn";
import styles from "./JobsPage.module.css";

const TABS = [
  { id: "my-open-jobs", label: "My Open Jobs" },
  { id: "my-jobs", label: "My Jobs" },
  { id: "open-jobs", label: "Open Jobs" },
  { id: "all-jobs", label: "All Jobs" },
  { id: "recent-jobs", label: "Recent Jobs" },
];

const JOBS_AGENT_MESSAGE =
  "Here are the jobs that need recruiter action today. I prioritized them based on pipeline health, Candidate Readiness, and screening evidence.";

export function JobsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("my-open-jobs");
  const { setStep, state } = useDemoState();

  useEffect(() => {
    if (state.demoStep === 1) setStep(1);
  }, [state.demoStep, setStep]);

  function openJob(slug: string) {
    navigate(`/jobs/${slug}`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>My Open Jobs / Today's Hiring Priorities</h1>
        <p className={styles.subtitle}>
          The Candidate Readiness Agent surfaced 3 jobs that need recruiter action
          today based on HM interview pipeline health.
        </p>
      </div>

      <ConversationThread
        messages={[{ role: "agent", text: JOBS_AGENT_MESSAGE }]}
        actions={[]}
        onAction={() => {}}
      />

      <div className={styles.tabsBar}>
        <div className={styles.tabs} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === activeTab}
              className={cn(styles.tab, t.id === activeTab && styles.tabActive)}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.jobCards}>
        {/* Column header row */}
        <div className={styles.jobCard} style={{ cursor: "default", pointerEvents: "none" }}>
          <div className={styles.cardLayout} style={{ minHeight: "unset" }}>
            <div className={styles.cardCell} style={{ padding: "8px 18px" }}>
              <span className={styles.metricLabel} style={{ fontSize: "var(--fs-11)" }}>Job</span>
            </div>
            <div className={styles.cardCell} style={{ padding: "8px 18px" }}>
              <span className={styles.metricLabel}>Pipeline Status</span>
            </div>
            <div className={styles.cardCell} style={{ padding: "8px 18px" }}>
              <span className={styles.metricLabel}>Target / Current</span>
            </div>
            <div className={styles.cardCell} style={{ padding: "8px 18px" }}>
              <span className={styles.metricLabel}>Gap</span>
            </div>
            <div className={styles.cardCell} style={{ padding: "8px 18px" }}>
              <span className={styles.metricLabel}>Goal %</span>
            </div>
            <div className={styles.cardCell} style={{ padding: "8px 18px", borderRight: "none" }}>
              <span className={styles.metricLabel}>Agent Recommendation</span>
            </div>
          </div>
        </div>

        {JOBS.map((job) => (
          <JobCard key={job.id} job={job} onOpen={() => openJob(job.slug)} />
        ))}
      </div>
    </div>
  );
}

function JobCard({ job, onOpen }: { job: JobSummary; onOpen: () => void }) {
  const { pipeline } = job;
  const isAtRisk = pipeline.status === "at-risk";
  const isOverloaded = pipeline.status === "overloaded";

  const cardBorderClass = isAtRisk
    ? styles.jobCardAtRisk
    : isOverloaded
      ? styles.jobCardOverloaded
      : styles.jobCardHealthy;

  const badgeClass = isAtRisk
    ? styles.badgeAtRisk
    : isOverloaded
      ? styles.badgeOverloaded
      : styles.badgeHealthy;

  const statusLabel = isAtRisk ? "At Risk" : isOverloaded ? "Overloaded" : "Healthy";

  const gapLabel =
    pipeline.gap > 0
      ? `+${pipeline.gap} needed`
      : pipeline.gap < 0
        ? `${Math.abs(pipeline.gap)} over`
        : "On target";

  const fillClass = isAtRisk
    ? styles.fillWarn
    : isOverloaded
      ? styles.fillDanger
      : styles.fillSuccess;

  const clampedPct = Math.min(pipeline.goalPct, 100);

  return (
    <div
      className={cn(styles.jobCard, cardBorderClass)}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
    >
      <div className={styles.cardLayout}>
        {/* Job info */}
        <div className={styles.cardCell}>
          <span className={styles.jobStatus}>{job.status}</span>
          <span className={styles.jobTitle}>{job.title}</span>
          <span className={styles.jobId}>{job.jobId}</span>
        </div>

        {/* Pipeline status */}
        <div className={styles.cardCell}>
          <span className={styles.metricLabel}>Status</span>
          <span className={cn(styles.pipelineStatusBadge, badgeClass)}>
            {statusLabel}
          </span>
        </div>

        {/* Target / current */}
        <div className={styles.cardCell}>
          <span className={styles.metricLabel}>HM Target</span>
          <span
            className={cn(
              styles.metricValue,
              isAtRisk && styles.metricValueWarn,
              isOverloaded && styles.metricValueDanger,
            )}
          >
            {pipeline.current} / {pipeline.target}
          </span>
          <span className={styles.metricSub}>interviews</span>
        </div>

        {/* Gap */}
        <div className={styles.cardCell}>
          <span className={styles.metricLabel}>Gap</span>
          <span
            className={cn(
              styles.metricValue,
              isAtRisk && styles.metricValueWarn,
              isOverloaded && styles.metricValueDanger,
            )}
          >
            {gapLabel}
          </span>
        </div>

        {/* Goal % */}
        <div className={styles.cardCell}>
          <span className={styles.metricLabel}>Achievement</span>
          <span className={styles.goalPct}>{pipeline.goalPct}%</span>
          <div className={styles.progressBar}>
            <div
              className={cn(styles.progressFill, fillClass)}
              style={{ width: `${clampedPct}%` }}
            />
          </div>
        </div>

        {/* Recommendation + CTA */}
        <div className={styles.cardCell}>
          <p className={styles.recText}>{job.pipeline.recommendedAction}</p>
          <button
            type="button"
            className={styles.ctaBtn}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            {job.pipeline.ctaLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}
