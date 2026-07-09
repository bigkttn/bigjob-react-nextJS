"use client"; // อย่าลืมใส่ use client ด้านบนสุดของไฟล์เพราะมีการใช้ React Hook
import { useEffect, useState } from "react";
import styles from "./footer.module.css";

interface FooterStats {
  total_users: number;
  general_users: number;
  companies: number;
  all_jobs: number;
  visitors: number;
}

const Footer = () => {
  const [stats, setStats] = useState<FooterStats | null>(null);

  useEffect(() => {
    fetchFooterStats();
  }, []);

  const fetchFooterStats = async () => {
    try {
      const res = await fetch("/api/footer-stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
        console.log("Footer stats fetched successfully:", data.data);
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  return (
    <footer className={styles.footerContainer}>
      <hr />
      <div className={styles.footerContent}>
        {/* Column 1: User Stats */}
        <div className={styles.footerColumn}>
          <div className={styles.statRow}>
            <span className={styles.label}>Total Users</span>
            <span className={styles.value}>{stats?.total_users || 0}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.label}>General Users</span>
            <span className={styles.value}>{stats?.general_users || 0}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.label}>Companies</span>
            <span className={styles.value}>{stats?.companies || 0}</span>
          </div>
        </div>

        {/* Column 2: Job Stats */}
        <div className={styles.footerColumn}>
          <div className={styles.statRow}>
            <span className={styles.label}>All Jobs</span>
            <span className={styles.value}>{stats?.all_jobs || 0}</span>
          </div>
        </div>

        {/* Column 3: Visitor Stats */}
        <div className={styles.footerColumn}>
          <div className={styles.statRow}>
            <span className={styles.label}>Visitors</span>
            <span className={styles.value}>{stats?.visitors || 0}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
