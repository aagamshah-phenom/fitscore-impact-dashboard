import { NavLink } from "react-router-dom";
import { cn } from "../lib/cn";
import {
  BarChart,
  Briefcase,
  Calendar,
  Layout,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  Users,
} from "../lib/icons";
import styles from "./LeftRail.module.css";

const SECONDARY_ITEMS: { label: string; Icon: typeof Briefcase }[] = [
  { label: "Discover", Icon: Sparkles },
  { label: "Workspaces", Icon: Layout },
  { label: "People", Icon: User },
  { label: "Campaigns", Icon: Mail },
  { label: "Calendar", Icon: Calendar },
  { label: "Forms", Icon: MessageSquare },
  { label: "Teams", Icon: Users },
  { label: "Analytics", Icon: BarChart },
  { label: "Compliance", Icon: ShieldCheck },
  { label: "Locations", Icon: MapPin },
  { label: "Tags", Icon: Tag },
];

export function LeftRail() {
  return (
    <nav className={styles.rail} aria-label="Primary">
      <div className={styles.logo} aria-label="Phenom People">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 4h7a5 5 0 0 1 0 10H8v6H5z"
            fill="currentColor"
          />
          <circle cx="12" cy="9" r="1.8" fill="#ffffff" />
        </svg>
      </div>
      <NavLink
        to="/jobs"
        className={({ isActive }) =>
          cn(styles.item, isActive && styles.itemActive)
        }
        aria-label="Jobs"
        title="Jobs"
      >
        <Briefcase size={18} />
      </NavLink>
      <div className={styles.divider} />
      {SECONDARY_ITEMS.map(({ label, Icon }) => (
        <button
          key={label}
          type="button"
          className={styles.item}
          aria-label={label}
          title={label}
          tabIndex={-1}
        >
          <Icon size={18} />
        </button>
      ))}
    </nav>
  );
}
