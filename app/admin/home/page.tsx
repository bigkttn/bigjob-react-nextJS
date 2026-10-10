"use client";
import Swal from "sweetalert2";
import { showAlert } from "@/lib/customAlert";

import styles from "./home.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface PendingCompany {
  company_id: number;
  company_name: string;
  logo_image: string | null;
  dbd_file: string | null;
  verification_status: string;
  verification_comment: string | null;
  updated_at?: string | null;
}

type HistoryFilter = "all" | "approved" | "rejected";

// ชื่อบริษัทมาจากผู้ใช้ ต้อง escape ก่อนใส่ใน html ของ popup
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const statusOf = (c: PendingCompany) =>
  (c.verification_status || "").toLowerCase();

const formatThaiDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface UserPayload {
  id?: number | string;
  role?: string;
  email?: string;
  [key: string]: unknown;
}

const Home = () => {
  const router = useRouter();
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [, setUser] = useState<UserPayload | null>(null);

  // รายการรอตรวจสอบ / ประวัติที่ตรวจแล้ว (ดึงบริษัททั้งหมดครั้งเดียวแล้วแยกตามสถานะ)
  const pendingCompanies = companies.filter((c) => statusOf(c) === "pending");
  const historyCompanies = companies
    .filter((c) => statusOf(c) === "approved" || statusOf(c) === "rejected")
    .sort(
      (a, b) =>
        new Date(b.updated_at || 0).getTime() -
        new Date(a.updated_at || 0).getTime(),
    );
  const approvedCount = historyCompanies.filter(
    (c) => statusOf(c) === "approved",
  ).length;
  const rejectedCount = historyCompanies.length - approvedCount;
  const visibleHistory =
    historyFilter === "all"
      ? historyCompanies
      : historyCompanies.filter((c) => statusOf(c) === historyFilter);

  // อัปเดตสถานะในหน้าจอทันทีหลังบันทึกสำเร็จ (ย้ายระหว่างรายการรอตรวจสอบ ↔ ประวัติ)
  const updateLocalStatus = (
    id: number,
    status: string,
    comment: string | null,
  ) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.company_id === id
          ? {
              ...c,
              verification_status: status,
              verification_comment: comment,
              updated_at: new Date().toISOString(),
            }
          : c,
      ),
    );
  };

  // ─── ตรวจสอบ Session ผู้ใช้งาน ───
  useEffect(() => {
    let isMounted = true;

    const checkSessionAndFetch = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.user || data.user.role !== "admin") {
          router.push("/");
          return;
        }

        if (isMounted) {
          setUser(data.user);
        }
      } catch (err: unknown) {
        console.error("เกิดข้อผิดพลาดในการตรวจสอบ Session:", err);
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

  // ─── ดึงรายชื่อบริษัททั้งหมด (รอตรวจสอบ + ประวัติ) ───
  const fetchPendingCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/companies");
      const data = await res.json();
      if (res.ok) {
        setCompanies(data.companies || []);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch pending companies", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingCompanies();
  }, [fetchPendingCompanies]);

  // ─── อนุมัติบริษัท ───
  const handleApprove = async (id: number) => {
    const result = await Swal.fire({
      title: "ยืนยันการอนุมัติ",
      text: "คุณต้องการยืนยันการอนุมัติบริษัทนี้ใช่หรือไม่?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;
    try {
      setActingId(id);
      const res = await fetch(`/api/admin/verify/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: "Approved" }),
      });
      if (res.ok) {
        updateLocalStatus(id, "Approved", null);
      } else {
        const data = await res.json();
        Swal.fire(data.error || "เกิดข้อผิดพลาด ไม่สามารถอนุมัติได้");
      }
    } catch (err: unknown) {
      console.error(err);
      Swal.fire("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setActingId(null);
    }
  };

  // ─── ปฏิเสธบริษัท ───
  const handleReject = async (id: number) => {
    const comment = await showAlert.prompt(
      "กรุณาระบุเหตุผลในการปฏิเสธบริษัทนี้",
      "เช่น เอกสารไม่ชัดเจน, ข้อมูลไม่ตรงกับหนังสือรับรอง",
    );
    if (!comment) return;

    try {
      setActingId(id);
      const res = await fetch(`/api/admin/verify/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification_status: "Rejected",
          verification_comment: comment,
        }),
      });
      if (res.ok) {
        updateLocalStatus(id, "Rejected", comment);
      } else {
        const data = await res.json();
        Swal.fire(data.error || "เกิดข้อผิดพลาด ไม่สามารถปฏิเสธได้");
      }
    } catch (err: unknown) {
      console.error(err);
      Swal.fire("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setActingId(null);
    }
  };

  // ─── ยกเลิกผลการตรวจสอบ (กลับไปเป็น "รอตรวจสอบ") ───
  const handleUndo = async (company: PendingCompany) => {
    const wasApproved = statusOf(company) === "approved";
    const name = escapeHtml(company.company_name || "");
    const result = await Swal.fire({
      title: "ยกเลิกผลการตรวจสอบ",
      html: wasApproved
        ? `ยกเลิกการอนุมัติ <b>${name}</b> ใช่หรือไม่?<br/><small>บริษัทจะกลับไปเป็น "รอตรวจสอบ" และใช้งานฟีเจอร์ที่ต้องยืนยันตัวตน เช่น ลงประกาศงาน ไม่ได้จนกว่าจะอนุมัติใหม่</small>`
        : `ยกเลิกการปฏิเสธ <b>${name}</b> ใช่หรือไม่?<br/><small>บริษัทจะกลับไปเป็น "รอตรวจสอบ" และเหตุผลที่ปฏิเสธไว้จะถูกลบ</small>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ยืนยันการยกเลิก",
      cancelButtonText: "ปิด",
    });
    if (!result.isConfirmed) return;

    try {
      setActingId(company.company_id);
      const res = await fetch(`/api/admin/verify/${company.company_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: "Pending" }),
      });
      if (res.ok) {
        updateLocalStatus(company.company_id, "Pending", null);
      } else {
        const data = await res.json();
        Swal.fire(data.error || "เกิดข้อผิดพลาด ไม่สามารถยกเลิกได้");
      }
    } catch (err: unknown) {
      console.error(err);
      Swal.fire("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.cardWrapper}>
        <h2 className={styles.headerTitle}>
          รายการหนังสือรับรอง / เอกสารการจดทะเบียนบริษัทที่รอการตรวจสอบ (Company
          Verification Requests)
        </h2>

        {loading ? (
          <p style={{ textAlign: "center" }}>
            กำลังโหลดข้อมูลบริษัทที่รอการตรวจสอบ...
          </p>
        ) : pendingCompanies.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            ไม่มีรายการบริษัทที่รอการตรวจสอบในขณะนี้
          </p>
        ) : (
          <div className={styles.list}>
            {pendingCompanies.map((company) => (
              <div key={company.company_id} className={styles.companyRow}>
                {/* ส่วนชื่อและโลโก้ */}
                <div className={styles.leftInfo}>
                  <img
                    src={
                      company.logo_image ||
                      "/assets/images/suggestedCompanys.jpg"
                    }
                    alt={company.company_name}
                    className={styles.logo}
                  />
                  <span className={styles.companyName}>
                    {company.company_name}
                  </span>
                </div>

                {/* ส่วนกลุ่มปุ่มจัดการ */}
                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={() => handleApprove(company.company_id)}
                    disabled={actingId === company.company_id}
                    className={`${styles.btn} ${styles.approve}`}
                  >
                    อนุมัติ (Approve)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(company.company_id)}
                    disabled={actingId === company.company_id}
                    className={`${styles.btn} ${styles.reject}`}
                  >
                    ปฏิเสธ (Reject)
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.seeInfo}`}
                    onClick={() =>
                      router.push(`/admin/company/${company.company_id}`)
                    }
                  >
                    ดูรายละเอียด (See Info)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── ประวัติการตรวจสอบ (ผ่าน / ไม่ผ่าน) ─── */}
      <div className={`${styles.cardWrapper} ${styles.historyCard}`}>
        <h2 className={styles.headerTitle}>ประวัติการตรวจสอบบริษัท</h2>

        <div className={styles.historyTabs} role="tablist">
          {(
            [
              ["all", `ทั้งหมด (${historyCompanies.length})`],
              ["approved", `ผ่าน (${approvedCount})`],
              ["rejected", `ไม่ผ่าน (${rejectedCount})`],
            ] as [HistoryFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={historyFilter === key}
              className={`${styles.historyTab} ${historyFilter === key ? styles.historyTabActive : ""}`}
              onClick={() => setHistoryFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: "center" }}>กำลังโหลดประวัติ...</p>
        ) : visibleHistory.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            ยังไม่มีประวัติในหมวดนี้
          </p>
        ) : (
          <div className={styles.list}>
            {visibleHistory.map((company) => {
              const approved = statusOf(company) === "approved";
              return (
                <div key={company.company_id} className={styles.companyRow}>
                  <div className={styles.leftInfo}>
                    <img
                      src={
                        company.logo_image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          company.company_name || "Company",
                        )}&background=random`
                      }
                      alt={company.company_name}
                      className={styles.logo}
                    />
                    <div className={styles.historyInfo}>
                      <span className={styles.companyName}>
                        {company.company_name}
                      </span>
                      <span
                        className={`${styles.statusBadge} ${approved ? styles.badgeApproved : styles.badgeRejected}`}
                      >
                        {approved ? "ผ่าน" : "ไม่ผ่าน"}
                      </span>
                      {!approved && company.verification_comment && (
                        <span className={styles.historyReason}>
                          เหตุผล: {company.verification_comment}
                        </span>
                      )}
                      <span className={styles.historyDate}>
                        ตรวจสอบเมื่อ {formatThaiDateTime(company.updated_at)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.buttonGroup}>
                    <button
                      type="button"
                      onClick={() => handleUndo(company)}
                      disabled={actingId === company.company_id}
                      className={`${styles.btn} ${styles.undo}`}
                    >
                      ยกเลิกผล
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.seeInfo}`}
                      onClick={() =>
                        router.push(`/admin/company/${company.company_id}`)
                      }
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
