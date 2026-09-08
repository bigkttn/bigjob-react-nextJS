"use client";

import { useState, useEffect, FormEvent } from "react";
import styles from "./Feedback.module.css";

interface FeedbackItem {
  feedback_id: number;
  user_id: number;
  message: string;
  created_at: string;
  admin_message: string | null;
  status: "pending" | "replied" | "read";
  replied_at: string | null;
}

export default function UserFeedbackPage() {
  const [message, setMessage] = useState("");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initFeedbackDashboard = async () => {
    try {
      const resAuth = await fetch("/api/auth/me");
      const dataAuth = await resAuth.json();
      if (dataAuth.user?.id) {
        const uid = Number(dataAuth.user.id);
        setUserId(uid);

        // 📥 เช็ค URL ตรงนี้ให้มั่นใจว่าตรงกับโฟลเดอร์หลังบ้าน (มี s หรือไม่มี s)
        const resFb = await fetch(`/api/feedback?userId=${uid}`);
        // 🌟 ดักดึงข้อมูล: ถ้าหลังบ้านพัง (ไม่ใช่ status 200) ให้หยุดทำงานทันที จะได้ไม่เกิดบั๊ก SyntaxError
        if (!resFb.ok) {
          console.error(
            `Backend returned status ${resFb.status} for feedbacks API`,
          );
          return;
        }

        const dataFb = await resFb.json();
        setFeedbacks(dataFb.feedbacks || []);

        window.dispatchEvent(new Event("refreshNotifications"));
      }
    } catch (error) {
      console.error("Initialization page failed", error);
    }
  };

  // 🌟 ฟังก์ชันจัดการเมื่อเกิดการคลิกอ่านที่กล่องข้อความ (เปลี่ยนเป็น read เฉพาะ ID นั้น)
  const handleMarkAsRead = async (
    feedbackId: number,
    currentStatus: string,
  ) => {
    if (currentStatus !== "replied") return;

    try {
      // 🌟 แก้ตรงนี้: เอาตัว s ออกให้ตรงกับเส้น GET
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId }),
      });

      if (res.ok) {
        await initFeedbackDashboard();
      } else {
        console.error("PATCH Error:", res.status); // เพิ่ม log ไว้ดูเผื่อพัง
      }
    } catch (error) {
      console.error("Failed to update status to read:", error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !userId) return;

    setIsLoading(true);
    try {
      // 🌟 แก้ตรงนี้: เอาตัว s ออกด้วยเหมือนกันครับ
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message }),
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
      {/* ฝั่งซ้าย: ฟอร์มกรอกข้อความคำติชม */}
      <div className={styles.leftPanel}>
        <h1 className={styles.title}>คำติชมระบบ</h1>
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
            {isLoading ? "กำลังส่งข้อมูล..." : "ส่งเรื่องให้แอดมิน"}
          </button>
        </form>
      </div>

      {/* ฝั่งขวา: แสดงลิสต์ประวัติพร้อมข้อความตอบกลับ */}
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
                // 🌟 ผูกเหตุการณ์คลิกอ่านแยกทีละกล่อง
                onClick={() => handleMarkAsRead(item.feedback_id, item.status)}
                // 🌟 ปรับแต่งสไตล์เพิ่มสีส้มพาสเทลนวลตาเมื่อมีคำตอบใหม่เข้ามา
                style={{
                  cursor: item.status === "replied" ? "pointer" : "default",
                  backgroundColor:
                    item.status === "replied" ? "#fff7ed" : undefined,
                  borderColor:
                    item.status === "replied" ? "#ffedd5" : undefined,
                  borderWidth: item.status === "replied" ? "1px" : undefined,
                  borderStyle: item.status === "replied" ? "solid" : undefined,
                  transition: "all 0.2s ease",
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
                    <strong>คำตอบจากแอดมิน:</strong>
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
