"use client";

import { useEffect, useState } from "react";
import styles from "./footer.module.css";

interface FooterStats {
  total_users: number;
  general_users: number;
  companies: number;
  all_jobs: number;
  visitors: number;
}

// นับผู้เข้าชมครั้งเดียวต่อการเปิดเว็บ (กัน effect รันซ้ำตอน dev / remount)
// เก็บ promise ไว้ ให้ทุกครั้งที่เรียกรอคำขอเดียวกันจนเสร็จก่อนค่อยดึงสถิติ
let visitorRequest: Promise<void> | null = null;

function countVisitor(): Promise<void> {
  if (!visitorRequest) {
    // ฝั่ง server กันนับซ้ำด้วยคุกกี้ hasVisited (30 วัน)
    visitorRequest = fetch("/api/visitor", { method: "POST" })
      .then(() => undefined)
      .catch((err) => console.error("Count visitor error:", err));
  }
  return visitorRequest;
}

const Footer = () => {
  const [stats, setStats] = useState<FooterStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchFooterStats = async () => {
      try {
        // นับก่อน แล้วค่อยดึงสถิติ ให้คนที่เข้ามาครั้งแรกเห็นยอดที่รวมตัวเองแล้ว
        await countVisitor();
        const res = await fetch("/api/footer-stats");
        const data = await res.json();
        if (isMounted && data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Fetch stats error:", err);
      }
    };

    fetchFooterStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className={styles.footerContainer}>
      <hr className={styles.divider} />
      <div className={styles.footerContent}>
        {/* Column 1: User Stats */}
        <div className={styles.footerColumn}>
          <div className={styles.statRow}>
            <span className={styles.label}>ผู้ใช้งานทั้งหมด</span>
            <span className={styles.value}>{stats?.total_users ?? 0}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.label}>ผู้ใช้งานทั่วไป</span>
            <span className={styles.value}>{stats?.general_users ?? 0}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.label}>บริษัท</span>
            <span className={styles.value}>{stats?.companies ?? 0}</span>
          </div>
        </div>

        {/* Column 2: Job Stats */}
        <div className={styles.footerColumn}>
          <div className={styles.statRow}>
            <span className={styles.label}>งานทั้งหมด</span>
            <span className={styles.value}>{stats?.all_jobs ?? 0}</span>
          </div>
        </div>

        {/* Column 3: Visitor Stats */}
        <div className={styles.footerColumn}>
          <div className={styles.statRow}>
            <span className={styles.label}>ผู้เข้าชมเว็บไซต์</span>
            <span className={styles.value}>{stats?.visitors ?? 0}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
