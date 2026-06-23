"use client";

import { useState, useEffect } from "react";
import { IFeedback, ApiResponse } from "@/app/api/admin/feedbacks/route";
import styles from "./AdminFeedback.module.css";

// ============================================================================
// 📦 Sub-Component: FeedbackCard
// ============================================================================
interface FeedbackCardProps {
  item: IFeedback;
  onSubmitReply: (
    id: number,
    message: string,
    source_type: string,
  ) => Promise<boolean>;
  onDelete: (id: number, source_type: string) => Promise<void>;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({
  item,
  onSubmitReply,
  onDelete,
}) => {
  const [replyText, setReplyText] = useState(item.admin_message || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setReplyText(item.admin_message || "");
  }, [item.admin_message]);

  const handleSend = async () => {
    if (!replyText.trim()) {
      alert("กรุณาพิมพ์ข้อความก่อนทำการส่งคำตอบกลับ");
      return;
    }
    setIsSubmitting(true);
    // 📌 ส่ง item.source_type กลับไปด้วย
    await onSubmitReply(item.feedback_id, replyText, item.source_type);
    setIsSubmitting(false);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className={`${styles.statusBadge} ${styles.statusPending}`}>
            รอตรวจรับ
          </span>
        );
      case "read":
        return (
          <span className={`${styles.statusBadge} ${styles.statusRead}`}>
            อ่านแล้ว
          </span>
        );
      case "replied":
        return (
          <span className={`${styles.statusBadge} ${styles.statusReplied}`}>
            ตอบกลับแล้ว
          </span>
        );
      default:
        return <span className={`${styles.statusBadge}`}>{status}</span>;
    }
  };

  const hasAdminMessage =
    item.admin_message && item.admin_message.trim() !== "";

  // จัดกลุ่มประเภทผู้ใช้งานให้แสดงป้ายสีถูกต้อง
  const displayRole = item.role?.toLowerCase() || item.source_type;
  const isCompany = displayRole === "company";

  return (
    <div className={styles.card}>
      <div className={styles.userInfo}>
        {/* เปลี่ยนสี Badge ตามประเภท Company หรือ User */}
        <span
          className={`${styles.badge} ${isCompany ? styles.badgeCompany : styles.badgeUser}`}
        >
          {isCompany ? "Company" : "User"}
        </span>
        <span className={styles.date}>
          {new Date(item.created_at).toLocaleString("th-TH")}
        </span>
        <div style={{ marginTop: "6px" }}>{renderStatusBadge(item.status)}</div>
        <span className={styles.emailText}>{item.email || "ไม่มีอีเมล"}</span>
      </div>

      <div className={styles.messageContent}>
        <div className={styles.userMessage}>
          <p>{item.message}</p>
        </div>

        {hasAdminMessage && (
          <div className={styles.repliedBox}>
            <strong>Admin Reply (ประวัติคำตอบเดิม):</strong>
            <p>{item.admin_message}</p>
            {item.replied_at && (
              <small>
                ตอบเมื่อ: {new Date(item.replied_at).toLocaleString("th-TH")}
              </small>
            )}
          </div>
        )}

        <div className={styles.replySection}>
          <textarea
            placeholder="พิมพ์ข้อความตอบกลับ..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className={styles.replyTextarea}
            disabled={isSubmitting}
          />
          <button
            onClick={handleSend}
            className={styles.replyBtn}
            disabled={isSubmitting}
          >
            {hasAdminMessage ? "Update Reply" : "Send Reply"}
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.removeBtn}
          onClick={() => onDelete(item.feedback_id, item.source_type)}
        >
          remove
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 🖥️ Main Component Dashboard
// ============================================================================
export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/feedbacks");
      const result: ApiResponse<IFeedback[]> = await res.json();
      if (res.ok && result.success && result.data) {
        setFeedbacks(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch feedbacks", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplySubmit = async (
    feedback_id: number,
    message: string,
    source_type: string,
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/feedbacks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // 📌 ส่ง source_type ไปด้วย
        body: JSON.stringify({
          feedback_id,
          admin_message: message,
          source_type,
        }),
      });

      if (res.ok) {
        alert("บันทึกคำตอบสำเร็จ!");
        fetchFeedbacks();
        return true;
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกคำตอบกลับ");
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      return false;
    }
  };

  const handleDeleteFeedback = async (
    feedback_id: number,
    source_type: string,
  ): Promise<void> => {
    if (!confirm("คุณต้องการลบ Feedback นี้ใช่หรือไม่?")) return;

    try {
      // 📌 แนบ type เป็น Query Param
      const res = await fetch(
        `/api/admin/feedbacks?id=${feedback_id}&type=${source_type}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        // ใช้ 2 เงื่อนไขคัดออก เพราะ ID ของ 2 ตารางอาจซ้ำกัน (เช่นมี ID 1 ทั้งใน user และ company)
        setFeedbacks((prev) =>
          prev.filter(
            (f) =>
              !(f.feedback_id === feedback_id && f.source_type === source_type),
          ),
        );
      } else {
        alert("ลบไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ประมวลผลตัวกรองข้อมูล
  const processedFeedbacks = feedbacks
    .filter((item) => {
      // 📌 กรองจาก source_type แทน จะแม่นยำกว่า เพราะแยกตารางกันชัดเจน
      const matchRole =
        filterRole === "all" ||
        item.source_type === filterRole ||
        (filterRole === "seeker" && item.source_type === "user");

      const matchStatus =
        filterStatus === "all" || item.status === filterStatus;

      return matchRole && matchStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Admin Feedback Dashboard</h2>
        <p>จัดการและตอบกลับข้อเสนอแนะจากผู้ใช้งาน</p>
      </div>

      <div className={styles.filterContainer}>
        <div className={styles.filterGroup}>
          <label>ประเภทบัญชี:</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">ทั้งหมด</option>
            <option value="seeker">User (ผู้หางาน)</option>
            <option value="company">Company (บริษัท)</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>สถานะรายการ:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending">รอตรวจรับ (Pending)</option>
            <option value="read">อ่านแล้ว (Read)</option>
            <option value="replied">ตอบกลับแล้ว (Replied)</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>เรียงตามวันที่:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="desc">ใหม่สุด ไป เก่าสุด</option>
            <option value="asc">เก่าสุด ไป ใหม่สุด</option>
          </select>
        </div>
      </div>

      <div className={styles.listContainer}>
        {isLoading ? (
          <p className={styles.loading}>Loading feedbacks...</p>
        ) : processedFeedbacks.length === 0 ? (
          <p className={styles.empty}>
            ไม่มีข้อมูล Feedback ที่ตรงกับเงื่อนไขการค้นหา
          </p>
        ) : (
          processedFeedbacks.map((item, index) => (
            <FeedbackCard
              // ใช้ index หรือการผสม id+type เป็น key เพื่อป้องกันบั๊กเวลา id ของ 2 ตารางซ้ำกัน
              key={`${item.source_type}-${item.feedback_id}-${index}`}
              item={item}
              onSubmitReply={handleReplySubmit}
              onDelete={handleDeleteFeedback}
            />
          ))
        )}
      </div>
    </div>
  );
}
