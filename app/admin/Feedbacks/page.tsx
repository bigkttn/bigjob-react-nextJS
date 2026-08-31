"use client";

import { useState, useEffect, useMemo } from "react";
import { IFeedback, ApiResponse } from "@/app/api/admin/feedbacks/route";
import styles from "./AdminFeedback.module.css";
import { useRouter } from "next/navigation"; // --- TypeScript Interfaces ---

interface UserPayload {
  id?: number | string;
  role?: string;
  email?: string;
  [key: string]: unknown;
}

// แผนผังแสดงประเภทสถานะ (Status Badge Config)
const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending: { label: "รอตรวจรับ", class: styles.statusPending },
  read: { label: "อ่านแล้ว", class: styles.statusRead },
  replied: { label: "ตอบกลับแล้ว", class: styles.statusReplied },
};

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submittingStates, setSubmittingStates] = useState<
    Record<string, boolean>
  >({});

  // ตัวกรอง (Filters)
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const router = useRouter();
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const checkSessionAndFetch = async () => {
      try {
        // 1. เรียก API Route ที่คุณสร้างไว้ (เปลี่ยน Path ให้ตรงกับที่คุณเซ็ตไว้)
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        // 2. ถ้าไม่มี User ล็อกอิน หรือ Role ไม่ใช่ admin ให้ Re-direct ไปหน้าหลัก
        if (!data.user || data.user.role !== "admin") {
          router.push("/");
          return;
        }

        if (isMounted) {
          setUser(data.user);
        }

        // 3. (ถ้ามี) ดึงข้อมูลรายงานต่อ...
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการตรวจสอบ Session:", error);
        router.push("/");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSessionAndFetch();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    const initialReplies: Record<string, string> = {};
    feedbacks.forEach((item) => {
      const key = `${item.source_type}-${item.feedback_id}`;
      initialReplies[key] = item.admin_message || "";
    });
    setReplyTexts(initialReplies);
  }, [feedbacks]);

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

  // แปลงฟอร์แมตวันที่ (DD/MM/YYYY HH:mm)
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleReplySubmit = async (item: IFeedback) => {
    const key = `${item.source_type}-${item.feedback_id}`;
    const text = replyTexts[key]?.trim() || "";

    if (!text) {
      alert("กรุณาพิมพ์ข้อความก่อนทำการส่งคำตอบกลับ");
      return;
    }

    try {
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
      setSubmittingStates((prev) => ({ ...prev, [key]: false }));
    }
  };

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
      {/* ส่วนหัว Dashboard */}
      <div className={styles.header}>
        <h2>Admin Feedback Dashboard</h2>
        <p>จัดการและตอบกลับข้อเสนอแนะจากผู้ใช้งานอย่างเป็นระบบ</p>
      </div>

      {/* ส่วนตัวกรอง (Control Bar) */}
      <div className={styles.filterContainer}>
        <div className={styles.filterGroup}>
          <label>ประเภทบัญชี</label>
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
          <label>สถานะรายการ</label>
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
          <label>เรียงลำดับ</label>
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

      {/* รายการ Feedbacks */}
      <div className={styles.listContainer}>
        {isLoading ? (
          <div className={styles.loading}>กำลังโหลดข้อมูล Feedbacks...</div>
        ) : processedFeedbacks.length === 0 ? (
          <div className={styles.empty}>
            ไม่พบข้อมูล Feedback ที่ตรงกับเงื่อนไขที่เลือก
          </div>
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
                {/* 1. ส่วนข้อมูลผู้ใช้และเวลา */}
                <div className={styles.userInfo}>
                  <span
                    className={`${styles.badge} ${
                      isCompany ? styles.badgeCompany : styles.badgeUser
                    }`}
                  >
                    {isCompany ? "company" : "user"}
                  </span>

                  <span className={styles.date}>
                    {formatDate(item.created_at)}
                  </span>

                  <span className={`${styles.statusBadge} ${statusInfo.class}`}>
                    <span className={styles.statusDot}></span>
                    {statusInfo.label}
                  </span>

                  {item.email && (
                    <span className={styles.emailText} title={item.email}>
                      {item.email}
                    </span>
                  )}
                </div>

                {/* 2. ส่วนเนื้อหา Feedback & แบบฟอร์มตอบกลับ */}
                <div className={styles.messageContent}>
                  {/* Speech Bubble ข้อความฝั่งผู้ใช้ */}
                  <div className={styles.userMessage}>
                    <p className={styles.messageText}>{item.message}</p>
                  </div>

                  {/* ประวัติการตอบกลับเดิมของแอดมิน */}
                  {hasAdminMessage && (
                    <div className={styles.repliedBox}>
                      <div className={styles.repliedHeader}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Admin Reply (ประวัติคำตอบเดิม):</span>
                      </div>
                      <p>{item.admin_message}</p>
                      {item.replied_at && (
                        <small>ตอบเมื่อ: {formatDate(item.replied_at)}</small>
                      )}
                    </div>
                  )}

                  {/* ฟอร์มพิมพ์ข้อความตอบกลับ */}
                  <div className={styles.replySection}>
                    <textarea
                      placeholder="พิมพ์ข้อความตอบกลับผู้ใช้..."
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

                {/* 3. ปุ่ม Remove สไตล์แคปซูลสีแดง */}
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
