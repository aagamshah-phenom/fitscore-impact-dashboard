import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import styles from "./Table.module.css";

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(styles.tableWrap, className)}>{children}</div>;
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn(styles.table, className)}>{children}</table>;
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className={styles.thead}>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className={styles.tbody}>{children}</tbody>;
}

interface RowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  clickable?: boolean;
}

export function Row({ selected, clickable, className, children, ...rest }: RowProps) {
  return (
    <tr
      className={cn(
        styles.row,
        selected && styles.rowSelected,
        clickable && styles.rowClickable,
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function Th({ children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...rest}>{children}</th>;
}

export function Td({ children, className, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={className} {...rest}>
      {children}
    </td>
  );
}

export function TableFooter({ children }: { children: ReactNode }) {
  return <div className={styles.tableFooter}>{children}</div>;
}
