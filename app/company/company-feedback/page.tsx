"use client";

import { useState, useEffect, FormEvent } from "react";
import styles from "./CompanyFeedback.module.css";

interface FeedbackItem {
  feedback_id: number;
  company_id: number;
  message: string;
  created_at: string;
  admin_message: string | null;
  status: "pending" | "replied" | "read";
  replied_at: string | null;
}

export default function CompanyFeedbackPage() {
  const [message, setMessage] = useState("");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initFeedbackDashboard = async () => {
    try {
      const resAuth = await fetch("/api/auth/me");
      const dataAuth = await resAuth.json();
      if (dataAuth.user?.id) {
        const cid = Number(dataAuth.user.id);
        setCompanyId(cid);

        const resFb = await fetch(`/api/company/feedbacks?companyId=${cid}`);
        const dataFb = await resFb.json();
        setFeedbacks(dataFb.feedbacks || []);

        // แจ้งเตือน Navbar ให้คำนวณตัวเลขแจ้งเตือนใหม่
        window.dispatchEvent(new Event("refreshNotifications"));
      }
    } catch (error) {
      console.error("Initialization page failed", error);
    }
  };

  const handleMarkAsRead = async (
    feedbackId: number,
    currentStatus: string,
  ) => {
    if (currentStatus !== "replied") return;

    try {
      const res = await fetch("/api/company/feedbacks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId }),
      });

      if (res.ok) {
        await initFeedbackDashboard(); // รีเฟรชเพื่อเปลี่ยนสีส้มกลับเป็นสีปกติหลังกดอ่าน
      }
    } catch (error) {
      console.error("Failed to update status to read:", error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !companyId) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/company/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, message }),
      });

      if (res.ok) {
        setMessage("");
        await initFeedbackDashboard();
      } else {
        alert("ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error("Submit error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initFeedbackDashboard();
  }, []);

  return (
    <div className={styles.container}>
      {/* ฝั่งซ้าย: ฟอร์มส่งข้อมูล */}
      <div className={styles.leftPanel}>
        <h1 className={styles.title}>คำติชมระบบ (สำหรับบริษัท)</h1>
        <p className={styles.subtitle}>
          กรุณากรอกข้อมูลปัญหาหรือข้อเสนอแนะที่ต้องการส่งมอบให้ทีมผู้ดูแลระบบ
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            className={styles.textarea}
            placeholder="พิมพ์ข้อความของคุณที่นี่..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={8}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? "กำลังส่งข้อมูล..." : "ส่งเรื่องให้ Admin"}
          </button>
        </form>
      </div>

      {/* ฝั่งขวา: ประวัติคำติชม */}
      <div className={styles.rightPanel}>
        <h2 className={styles.title}>ประวัติและคำตอบจากแอดมิน</h2>
        <div className={styles.historyList}>
          {feedbacks.length === 0 ? (
            <p className={styles.emptyText}>
              ไม่พบประวัติการยื่นเรื่องของคุณในระบบ
            </p>
          ) : (
            feedbacks.map((item) => (
              <div
                key={item.feedback_id}
                className={styles.card}
                onClick={() => handleMarkAsRead(item.feedback_id, item.status)}
                // 🌟 ปรับแต่งสไตล์เพิ่มส้มพาสเทลเมื่อมีสถานะเป็น replied
                style={{
                  cursor: item.status === "replied" ? "pointer" : "default",
                  backgroundColor:
                    item.status === "replied" ? "#fff7ed" : undefined, // สีส้มอ่อนนวลตา (Orange 50)
                  borderColor:
                    item.status === "replied" ? "#ffedd5" : undefined, // ขอบส้มจางๆ (Orange 100)
                  borderWidth: item.status === "replied" ? "1px" : undefined,
                  borderStyle: item.status === "replied" ? "solid" : undefined,
                  transition: "all 0.2s ease", // เพิ่ม Animation ตอนเปลี่ยนสีให้นุ่มนวลขึ้น
                }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.date}>
                    {new Date(item.created_at).toLocaleString("th-TH")}
                  </span>
                  <span className={`${styles.status} ${styles[item.status]}`}>
                    {item.status === "pending" && "รอตรวจรับ"}
                    {item.status === "replied" && "มีคำตอบใหม่"}
                    {item.status === "read" && "อ่านแล้ว"}
                  </span>
                </div>
                <p className={styles.userMessage}>{item.message}</p>

                {item.admin_message && (
                  <div className={styles.adminReply}>
                    <strong>Admin Reply:</strong>
                    <p>{item.admin_message}</p>
                    {item.replied_at && (
                      <span className={styles.replyDate}>
                        ตอบกลับเมื่อ:{" "}
                        {new Date(item.replied_at).toLocaleString("th-TH")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
