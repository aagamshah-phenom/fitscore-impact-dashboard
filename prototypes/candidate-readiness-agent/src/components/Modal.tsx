import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { X } from "../lib/icons";
import styles from "./Modal.module.css";

type ModalSize = "md" | "lg" | "xl";

const SIZE_CLASS: Record<ModalSize, string> = {
  md: styles["size-md"]!,
  lg: styles["size-lg"]!,
  xl: styles["size-xl"]!,
};

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onOpenChange,
  title,
  subtitle,
  size = "lg",
  children,
  footer,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={cn(styles.content, SIZE_CLASS[size])}>
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <Dialog.Title className={styles.title}>{title}</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className={styles.closeBtn}
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>
            {subtitle && (
              <Dialog.Description className={styles.subtitle}>
                {subtitle}
              </Dialog.Description>
            )}
          </header>
          <div className={styles.body}>{children}</div>
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
