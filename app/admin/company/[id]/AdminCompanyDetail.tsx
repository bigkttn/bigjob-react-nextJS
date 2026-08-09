"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./adminCompanyDetail.module.css";

interface Props {
  companyId: string;
}

const AdminCompanyDetail = ({ companyId }: Props) => {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/company/getCompanyById/${companyId}`);
      const data = await res.json();
      if (res.ok) setCompany(data.company);
      else setError(data.error || "Failed to fetch company");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  const handleApprove = async () => {
    if (!confirm("ยืนยันอนุมัติบริษัทนี้?")) return;
    try {
      setActing(true);
      const res = await fetch(`/api/admin/verify/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: "Approved" }),
      });
      if (res.ok) {
        alert("อนุมัติเรียบร้อยแล้ว");
        fetchCompany();
      } else {
        const data = await res.json();
        alert(data.error || "ไม่สามารถอนุมัติได้");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    const comment = prompt("ระบุเหตุผลที่ปฏิเสธบริษัทนี้:");
    if (!comment) return;
    try {
      setActing(true);
      const res = await fetch(`/api/admin/verify/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification_status: "Rejected",
          verification_comment: comment,
        }),
      });
      if (res.ok) {
        alert("ปฏิเสธเรียบร้อยแล้ว");
        fetchCompany();
      } else {
        const data = await res.json();
        alert(data.error || "ไม่สามารถปฏิเสธได้");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActing(false);
    }
  };

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>;
  if (error) return <p style={{ padding: 30 }}>Error: {error}</p>;
  if (!company) return <p style={{ padding: 30 }}>No company data</p>;

  const fmt = (val: any) =>
    val !== null && val !== undefined && val !== "" ? String(val) : "-";

  const status = company.verification_status as string | null;
  const statusColor =
    status === "Approved"
      ? "#1a8a2a"
      : status === "Rejected"
        ? "#b50000"
        : "#888";

  const isPdf =
    typeof company.dbd_file === "string" &&
    company.dbd_file.toLowerCase().includes(".pdf");

  return (
    <div className={styles.container}>
      {/* 🟢 ปุ่มย้อนกลับรูปแบบใหม่สไตล์โมเดิร์น */}
      <div className={styles.topBar}>
        <button
          className={styles.backButtonCustom}
          onClick={() => router.push("/admin/home")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>กลับหน้ารายการ</span>
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.headerRow}>
          <img
            src={company.logo_image || "/assets/images/suggestedCompanys.jpg"}
            alt="logo"
            className={styles.logo}
          />
          <div>
            <h2 className={styles.companyName}>{fmt(company.company_name)}</h2>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: statusColor }}
            >
              {status || "Pending"}
            </span>
          </div>
        </div>

        {status === "Rejected" && company.verification_comment && (
          <p className={styles.rejectReason}>
            เหตุผลที่ปฏิเสธก่อนหน้านี้: {company.verification_comment}
          </p>
        )}

        <div className={styles.infoGrid}>
          <div>
            <strong>ประเภทธุรกิจ:</strong> {fmt(company.business_type)}
          </div>
          <div>
            <strong>ผู้ติดต่อ:</strong> {fmt(company.contact_information)}
          </div>
          <div>
            <strong>เบอร์โทร:</strong> {fmt(company.mobile_phone)}
          </div>
          <div>
            <strong>อีเมล:</strong> {fmt(company.company_email)}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <strong>ที่อยู่:</strong> {fmt(company.full_address)}{" "}
            {fmt(company.province)} {fmt(company.postcode)}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <strong>ประวัติบริษัท:</strong> {fmt(company.brief_history)}
          </div>
        </div>

        <h3 className={styles.sectionTitle}>หนังสือรับรอง / ทะเบียนบริษัท</h3>
        {!company.dbd_file ? (
          <p style={{ color: "#888" }}>บริษัทนี้ยังไม่ได้อัปโหลดไฟล์</p>
        ) : isPdf ? (
          <iframe src={company.dbd_file} className={styles.filePreview} />
        ) : (
          <img
            src={company.dbd_file}
            alt="certificate"
            className={styles.filePreview}
          />
        )}

        {/* 🟢 ส่วนปุ่มกดที่จัดระเบียบให้แสดงผลชัดเจนขึ้น */}
        <div className={styles.actionRow}>
          <button
            className={`${styles.btn} ${styles.approve}`}
            onClick={handleApprove}
            disabled={acting || status === "Approved"}
          >
            Approve อนุมัติ
          </button>
          <button
            className={`${styles.btn} ${styles.reject}`}
            onClick={handleReject}
            disabled={acting || status === "Rejected"}
          >
            Reject ปฏิเสธ
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCompanyDetail;
