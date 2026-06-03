import { Button } from "../Button";
import { Modal } from "../Modal";
import { useDemoState } from "../../state/useDemoState";
import styles from "./RedirectCandidateModal.module.css";

interface RedirectCandidateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  currentRole: string;
  suggestedRoleTitle: string;
  suggestedRoleMeta: string;
  reason: string;
  /** Optional override called instead of the default redirect flow. */
  onSuggest?: () => void;
}

export function RedirectCandidateModal({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  currentRole,
  suggestedRoleTitle,
  suggestedRoleMeta,
  reason,
  onSuggest,
}: RedirectCandidateModalProps) {
  const { redirectCandidate, pushToast } = useDemoState();

  function handleSuggest() {
    if (onSuggest) {
      onSuggest();
      return;
    }
    redirectCandidate(candidateId);
    pushToast(`Redirect suggestion saved for ${candidateName}.`, "success");
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Redirect candidate to similar role"
      subtitle="This candidate is strong, but this job's HM pipeline is full. Consider a similar open role."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSuggest}>
            Suggest similar role
          </Button>
        </>
      }
    >
      <div className={styles.grid}>
        <span className={styles.label}>Candidate</span>
        <span className={styles.value}>{candidateName}</span>

        <span className={styles.label}>Current role</span>
        <span className={styles.value}>{currentRole}</span>

        <span className={styles.label}>Suggested similar role</span>
        <div className={styles.suggested}>
          <span className={styles.suggestedTitle}>{suggestedRoleTitle}</span>
          <span className={styles.suggestedMeta}>{suggestedRoleMeta}</span>
        </div>

        <span className={styles.label}>Reason</span>
        <span className={styles.reason}>{reason}</span>
      </div>
    </Modal>
  );
}
