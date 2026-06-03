import { cn } from "../lib/cn";
import styles from "./Avatar.module.css";

const PALETTE = [
  "#4f46e5",
  "#0e7490",
  "#15803d",
  "#a16207",
  "#b91c1c",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#0f766e",
  "#9333ea",
];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`;
}

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(styles.avatar, SIZE_CLASS[size], className)}
      style={{ background: colorFor(name) }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
