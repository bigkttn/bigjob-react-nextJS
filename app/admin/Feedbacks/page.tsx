"use client";

import { useState, useEffect, useMemo } from "react";
import { IFeedback, ApiResponse } from "@/app/api/admin/feedbacks/route";
import styles from "./AdminFeedback.module.css";

// แผนผังแสดงประเภทสถานะ (Status Badge Config)
const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending: { label: "รอตรวจรับ", class: styles.statusPending },
  read: { label: "อ่านแล้ว", class: styles.statusRead },
  replied: { label: "ตอบกลับแล้ว", class: styles.statusReplied },
};

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 📌 State สำหรับเก็บคำตอบของแต่ละการ์ดแยกกัน (เช่น {"user-1": "ข้อความตอบกลับ"})
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  // 📌 State สำหรับเก็บสถานะกำลังส่งของแต่ละการ์ดแยกกัน (เช่น {"user-1": true})
  const [submittingStates, setSubmittingStates] = useState<
    Record<string, boolean>
  >({});

  // ตัวกรอง (Filters)
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  // ดึงข้อมูลเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // ซิงค์ข้อความตอบกลับดั้งเดิมเข้าสู่ State เมื่อได้ข้อมูลมาใหม่
  useEffect(() => {
    const initialReplies: Record<string, string> = {};
    feedbacks.forEach((item) => {
      const key = `${item.source_type}-${item.feedback_id}`;
      initialReplies[key] = item.admin_message || "";
    });
    setReplyTexts(initialReplies);
  }, [feedbacks]);

  // ดึงข้อมูล Feedbacks จาก API
  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/feedbacks");
      const result: ApiResponse<IFeedback[]> = await res.json();
      if (res.ok && result.success && result.data) {
        setFeedbacks(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ดำเนินการส่งคำตอบกลับ
  const handleReplySubmit = async (item: IFeedback) => {
    const key = `${item.source_type}-${item.feedback_id}`;
    const text = replyTexts[key]?.trim() || "";

    if (!text) {
      alert("กรุณาพิมพ์ข้อความก่อนทำการส่งคำตอบกลับ");
      return;
    }

    try {
      // เปิด Loading เฉพาะการ์ดใบนี้
      setSubmittingStates((prev) => ({ ...prev, [key]: true }));

      const res = await fetch("/api/admin/feedbacks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback_id: item.feedback_id,
          admin_message: text,
          source_type: item.source_type,
        }),
      });

      if (res.ok) {
        alert("บันทึกคำตอบสำเร็จ!");
        fetchFeedbacks();
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกคำตอบกลับ");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      // ปิด Loading เฉพาะการ์ดใบนี้
      setSubmittingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ดำเนินการลบ Feedback
  const handleDeleteFeedback = async (
    feedback_id: number,
    source_type: string,
  ): Promise<void> => {
    if (!confirm("คุณต้องการลบ Feedback นี้ใช่หรือไม่?")) return;

    try {
      const res = await fetch(
        `/api/admin/feedbacks?id=${feedback_id}&type=${source_type}`,
        { method: "DELETE" },
      );

      if (res.ok) {
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

  // กรองข้อมูลและเรียงลำดับ
  const processedFeedbacks = useMemo(() => {
    return feedbacks
      .filter((item) => {
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
  }, [feedbacks, filterRole, filterStatus, sortOrder]);

  return (
    <div className={styles.container}>
      {/* ส่วนหัวเว็บบอร์ด */}
      <div className={styles.header}>
        <h2>Admin Feedback Dashboard</h2>
        <p>จัดการและตอบกลับข้อเสนอแนะจากผู้ใช้งาน</p>
      </div>

      {/* ส่วนตัวกรอง (Filters) */}
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

      {/* ส่วนแสดงรายการ Feedbacks */}
      <div className={styles.listContainer}>
        {isLoading ? (
          <p className={styles.loading}>Loading feedbacks...</p>
        ) : processedFeedbacks.length === 0 ? (
          <p className={styles.empty}>
            ไม่มีข้อมูล Feedback ที่ตรงกับเงื่อนไขการค้นหา
          </p>
        ) : (
          processedFeedbacks.map((item, index) => {
            const cardKey = `${item.source_type}-${item.feedback_id}`;
            const replyText = replyTexts[cardKey] || "";
            const isSubmitting = submittingStates[cardKey] || false;

            const statusInfo = STATUS_CONFIG[item.status] || {
              label: item.status,
              class: "",
            };
            const isCompany =
              (item.role?.toLowerCase() || item.source_type) === "company";
            const hasAdminMessage = Boolean(item.admin_message?.trim());

            return (
              <div key={`${cardKey}-${index}`} className={styles.card}>
                {/* 1. ส่วนข้อมูลผู้ใช้ (User Info) */}
                <div className={styles.userInfo}>
                  <span
                    className={`${styles.badge} ${isCompany ? styles.badgeCompany : styles.badgeUser}`}
                  >
                    {isCompany ? "Company" : "User"}
                  </span>
                  <span className={styles.date}>
                    {new Date(item.created_at).toLocaleString("th-TH")}
                  </span>
                  <div style={{ marginTop: "6px" }}>
                    <span
                      className={`${styles.statusBadge} ${statusInfo.class}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <span className={styles.emailText}>
                    {item.email || "ไม่มีอีเมล"}
                  </span>
                </div>

                {/* 2. ส่วนข้อความ Feedback */}
                <div className={styles.messageContent}>
                  <div className={styles.userMessage}>
                    <p>{item.message}</p>
                  </div>

                  {/* ประวัติ Admin Message เดิม */}
                  {hasAdminMessage && (
                    <div className={styles.repliedBox}>
                      <strong>Admin Reply (ประวัติคำตอบเดิม):</strong>
                      <p>{item.admin_message}</p>
                      {item.replied_at && (
                        <small>
                          ตอบเมื่อ:{" "}
                          {new Date(item.replied_at).toLocaleString("th-TH")}
                        </small>
                      )}
                    </div>
                  )}

                  {/* ฟอร์มพิมพ์คำตอบใหม่/แก้ไขคำตอบ */}
                  <div className={styles.replySection}>
                    <textarea
                      placeholder="พิมพ์ข้อความตอบกลับ..."
                      value={replyText}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({
                          ...prev,
                          [cardKey]: e.target.value,
                        }))
                      }
                      className={styles.replyTextarea}
                      disabled={isSubmitting}
                    />
                    <button
                      onClick={() => handleReplySubmit(item)}
                      className={styles.replyBtn}
                      disabled={isSubmitting}
                    >
                      {hasAdminMessage ? "Update Reply" : "Send Reply"}
                    </button>
                  </div>
                </div>

                {/* 3. ปุ่มลบรายการ */}
                <div className={styles.actions}>
                  <button
                    className={styles.removeBtn}
                    onClick={() =>
                      handleDeleteFeedback(item.feedback_id, item.source_type)
                    }
                  >
                    remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
