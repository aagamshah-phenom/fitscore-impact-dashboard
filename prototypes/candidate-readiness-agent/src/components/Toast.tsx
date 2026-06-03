import { useEffect } from "react";
import { Check, Sparkles } from "../lib/icons";
import { useDemoState } from "../state/useDemoState";
import styles from "./Toast.module.css";

const DURATION_MS = 3500;

export function ToastViewport() {
  const { state, dismissToast } = useDemoState();

  useEffect(() => {
    if (state.toasts.length === 0) return;
    const timers = state.toasts.map((t) =>
      window.setTimeout(() => dismissToast(t.id), DURATION_MS),
    );
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [state.toasts, dismissToast]);

  if (state.toasts.length === 0) return null;

  return (
    <div className={styles.viewport} role="status" aria-live="polite">
      {state.toasts.map((t) => (
        <div key={t.id} className={styles.toast}>
          {t.tone === "success" ? (
            <span className={styles.iconSuccess}>
              <Check size={10} />
            </span>
          ) : (
            <span className={styles.iconDefault}>
              <Sparkles size={10} />
            </span>
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
