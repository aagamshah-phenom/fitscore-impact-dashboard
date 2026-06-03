import { useState } from "react";
import { Avatar } from "../Avatar";
import { Button } from "../Button";
import { Modal } from "../Modal";
import { cn } from "../../lib/cn";
import { useDemoState } from "../../state/useDemoState";
import styles from "./KeepWarmModal.module.css";

const DEFAULT_MESSAGE =
  "Thanks for your interest. We're still reviewing candidates for this role and will share an update soon. In the meantime, we may also consider you for similar opportunities.";

const RECIPIENTS = [
  { id: "olivia-carter", name: "Olivia Carter" },
  { id: "marcus-lee", name: "Marcus Lee" },
];

interface KeepWarmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional override called instead of the default send flow. */
  onSend?: () => void;
}

export function KeepWarmModal({ open, onOpenChange, onSend }: KeepWarmModalProps) {
  const { sendKeepWarmUpdate, pushToast, advanceStep } = useDemoState();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  // Reset on open transition without useEffect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setEditing(false);
      setMessage(DEFAULT_MESSAGE);
    }
  }

  function handleSend() {
    if (onSend) {
      onSend();
      return;
    }
    sendKeepWarmUpdate(RECIPIENTS.map((r) => r.id));
    pushToast("Update sent to candidates.", "success");
    advanceStep(6);
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Keep candidates warm"
      subtitle="The HM interview pipeline is full. Send a short update to strong candidates instead of forwarding more candidates."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? "Done editing" : "Edit message"}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSend}>
            Send update
          </Button>
        </>
      }
    >
      <div className={styles.intro}>
        Going to {RECIPIENTS.length} strong candidates flagged for "Keep warm".
      </div>
      <div className={styles.recipients}>
        {RECIPIENTS.map((r) => (
          <span key={r.id} className={styles.recipient}>
            <Avatar name={r.name} size="sm" />
            {r.name}
          </span>
        ))}
      </div>
      <div className={styles.section}>
        <label className={styles.label} htmlFor="keep-warm-message">
          Message
        </label>
        <textarea
          id="keep-warm-message"
          className={cn(styles.textarea, !editing && styles.textareaReadonly)}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          readOnly={!editing}
        />
      </div>
    </Modal>
  );
}
