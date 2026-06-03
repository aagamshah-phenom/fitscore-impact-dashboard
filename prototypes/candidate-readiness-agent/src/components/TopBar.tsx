import {
  Bell,
  Calendar,
  Grid,
  HelpCircle,
  Plus,
  Search,
  Settings,
} from "../lib/icons";
import styles from "./TopBar.module.css";

export function TopBar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <span className={styles.brandName}>Phenom People</span>
        <span className={styles.brandTag}>Candidate Readiness Agent</span>
      </div>
      <div className={styles.searchWrap}>
        <div className={styles.search}>
          <Search size={14} />
          <input
            type="text"
            placeholder="Search"
            aria-label="Search"
            readOnly
          />
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.iconBtn} aria-label="Create" tabIndex={-1}>
          <Plus size={16} />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Calendar" tabIndex={-1}>
          <Calendar size={16} />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Notifications" tabIndex={-1}>
          <Bell size={16} />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Help" tabIndex={-1}>
          <HelpCircle size={16} />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Settings" tabIndex={-1}>
          <Settings size={16} />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Apps" tabIndex={-1}>
          <Grid size={16} />
        </button>
        <div className={styles.avatar} aria-hidden="true">
          AS
        </div>
      </div>
    </header>
  );
}
