import { useState } from "react";
import { Avatar } from "../Avatar";
import { Button } from "../Button";
import { Modal } from "../Modal";
import { ReadinessChip } from "../ReadinessChip";
import { cn } from "../../lib/cn";
import { useDemoState } from "../../state/useDemoState";
import styles from "./CompareCandidatesModal.module.css";

interface CompareRow {
  id: string;
  name: string;
  role: string;
  readiness: "ready-for-hm" | "needs-recruiter-review" | "needs-review" | "send-to-screening";
  evidenceSummary: string;
  concern: string;
  concernLevel: "low" | "medium" | "high";
  recommendedAction: string;
}

const ROWS: CompareRow[] = [
  {
    id: "routhu-vivek",
    name: "Routhu Vivek",
    role: "Machine Learning Engineer · 4 yrs",
    readiness: "ready-for-hm",
    evidenceSummary: "Strong profile + strong screening",
    concern: "Low concern",
    concernLevel: "low",
    recommendedAction: "Fast-track to HM",
  },
  {
    id: "benno-muller",
    name: "Benno Müller",
    role: "Applied ML Researcher · 5 yrs",
    readiness: "needs-recruiter-review",
    evidenceSummary: "Good profile + pending screening evaluation",
    concern: "Evaluation pending",
    concernLevel: "medium",
    recommendedAction: "Review before HM",
  },
  {
    id: "ryan-reynolds",
    name: "Ryan Reynolds",
    role: "ML Engineer · 3 yrs",
    readiness: "needs-review",
    evidenceSummary: "Strong profile + weak screening depth",
    concern: "Screening depth concern",
    concernLevel: "high",
    recommendedAction: "Review transcript",
  },
  {
    id: "tair-malka",
    name: "Tair Malka",
    role: "Data Scientist · 6 yrs",
    readiness: "needs-review",
    evidenceSummary: "Strong screening + profile fit gap",
    concern: "Mismatch",
    concernLevel: "high",
    recommendedAction: "Manual review",
  },
  {
    id: "lalitha-singari",
    name: "Lalitha Singari",
    role: "ML Software Engineer · 2 yrs",
    readiness: "send-to-screening",
    evidenceSummary: "Good profile but no screening",
    concern: "Missing screening evidence",
    concernLevel: "medium",
    recommendedAction: "Send to screening",
  },
];

const DEFAULT_SELECTED = ["routhu-vivek"];

interface CompareCandidatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional override: called instead of the default moveToHM flow. */
  onMoveToHM?: (ids: string[]) => void;
}

export function CompareCandidatesModal({
  open,
  onOpenChange,
  onMoveToHM,
}: CompareCandidatesModalProps) {
  const { moveToHM, pushToast, advanceStep } = useDemoState();
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);
  // Reset selection each time the modal transitions to open. Using the
  // recommended "store the previous value during render" pattern instead of
  // useEffect (per https://react.dev/learn/you-might-not-need-an-effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSelected(DEFAULT_SELECTED);
  }

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleMove() {
    if (selected.length === 0) return;
    if (onMoveToHM) {
      onMoveToHM(selected);
      return;
    }
    moveToHM(selected);
    const count = selected.length;
    pushToast(
      `${count} candidate${count === 1 ? "" : "s"} moved to HM Interview.`,
      "success",
    );
    advanceStep(4);
    onOpenChange(false);
  }

  function closeOnly() {
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Compare candidates for HM Interview"
      subtitle="Candidate Readiness combines profile fit, screening evidence, and pipeline context. Select who should move forward."
      size="xl"
      footer={
        <>
          <span className={styles.footerLeft}>
            {selected.length} selected
          </span>
          <Button variant="ghost" size="sm" onClick={closeOnly}>
            Cancel
          </Button>
          <Button variant="secondary" size="sm" onClick={closeOnly}>
            Add recruiter note
          </Button>
          <Button variant="secondary" size="sm" onClick={closeOnly}>
            Send selected to screening
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleMove}
            disabled={selected.length === 0}
          >
            Move selected to HM Interview
          </Button>
        </>
      }
    >
      <div className={styles.intro}>
        Each row combines profile fit, screening evidence, and pipeline context
        into one Candidate Readiness signal. Default selection reflects the
        agent's recommendation.
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}></th>
              <th>Candidate</th>
              <th>Candidate Readiness</th>
              <th>Evidence summary</th>
              <th>Risk / concern</th>
              <th>Recommended action</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const isSelected = selected.includes(row.id);
              return (
                <tr key={row.id} className={cn(isSelected && styles.rowSelected)}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={isSelected}
                      onChange={() => toggle(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                  <td>
                    <div className={styles.nameBlock}>
                      <Avatar name={row.name} size="md" />
                      <div className={styles.nameText}>
                        <span className={styles.namePrimary}>{row.name}</span>
                        <span className={styles.nameSecondary}>{row.role}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <ReadinessChip status={row.readiness} staticChip />
                  </td>
                  <td>{row.evidenceSummary}</td>
                  <td
                    className={cn(
                      styles.concern,
                      row.concernLevel === "low" && styles.concernLow,
                      row.concernLevel === "medium" && styles.concernMedium,
                      row.concernLevel === "high" && styles.concernHigh,
                    )}
                  >
                    {row.concern}
                  </td>
                  <td className={styles.actionCell}>{row.recommendedAction}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
