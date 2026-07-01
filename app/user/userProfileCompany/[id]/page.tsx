"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./userProfileCompany.module.css";
import Link from "next/link";

export default function ProfileCompany() {
  const { id } = useParams();
  const router = useRouter();
  const [companyData, setCompanyData] = useState<{
    company: any;
    posts: any[];
  } | null>(null);

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const response = await fetch(`/api/company/getCompanyById/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCompanyData(data);
        }
      } catch (error) {
        console.error("Error fetching company profile:", error);
      }
    }

    if (id) {
      fetchCompanyProfile();
    }
  }, [id]);

  if (!companyData) {
    return <div className={styles.container}>กำลังโหลดข้อมูลบริษัท...</div>;
  }

  // ดึงข้อมูลบริษัท และอาเรย์ของโพสต์งานออกมาใช้งาน
  const { company, posts } = companyData;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <button
          onClick={() => router.back()}
          style={{
            marginBottom: "20px",
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ← ย้อนกลับ
        </button>

        {/* --- ส่วนหัวโปรไฟล์บริษัท (Company Header) --- */}
        <div className={styles.header}>
          <img
            src={company.logo_image || "/assets/images/suggestedCompanys.jpg"}
            alt={company.company_name}
            className={styles.logo}
          />
          <h1 className={styles.companyName}>
            {company.company_name || "Company Name"}
          </h1>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "bold",
              display: "inline-block",
              marginTop: "5px",
              border: "1px solid #22c55e",
              color: "#22c55e",
              backgroundColor: "#f0fdf4",
            }}
          >
            {company.verification_status === "Approved"
              ? "ยืนยันตัวตนแล้ว"
              : "รอดำเนินการ"}
          </span>
        </div>

        {/* --- ข้อมูลทั่วไปของบริษัท --- */}
        <div style={{ marginTop: "20px", marginBottom: "30px" }}>
          <h3 className={styles.sectionTitle}>เกี่ยวกับบริษัท</h3>
          <p style={{ color: "#666", fontSize: "0.95rem", lineHeight: "1.6" }}>
            {company.brief_history && company.brief_history !== "ดหกดหกด"
              ? company.brief_history
              : "ไม่มีข้อมูลประวัติบริษัท"}
          </p>
          <div style={{ marginTop: "15px", fontSize: "0.9rem", color: "#444" }}>
            <strong>ประเภทธุรกิจ:</strong> {company.business_type} <br />
            <strong>ที่อยู่:</strong> {company.full_address} จ.
            {company.province} {company.postcode} <br />
            <strong>ติดต่อ:</strong> {company.contact_information} (
            {company.mobile_phone})
          </div>
        </div>

        <hr />

        {/* --- รายการตำแหน่งงานที่เปิดรับ (Job Openings) --- */}
        <div style={{ marginTop: "30px" }}>
          <h2
            style={{
              fontSize: "1.4rem",
              marginBottom: "20px",
              color: "#1e293b",
            }}
          >
            ตำแหน่งงานที่เปิดรับสมัคร ({posts ? posts.length : 0} ตำแหน่ง)
          </h2>

          {posts && posts.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {posts.map((job) => (
                <div
                  key={job.post_id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "20px",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 8px 0", color: "#2563eb" }}>
                        {job.job_position}
                      </h3>
                      <p
                        style={{
                          margin: "0 0 12px 0",
                          color: "#475569",
                          fontSize: "0.9rem",
                        }}
                      >
                        <strong>รายละเอียดงาน:</strong> {job.job_description}
                      </p>
                      <p
                        style={{
                          margin: "0",
                          color: "#475569",
                          fontSize: "0.9rem",
                        }}
                      >
                        <strong>คุณสมบัติเด่น:</strong>{" "}
                        {job.preferred_qualifications}
                      </p>
                    </div>
                    <Link
                      href={`/jobs/${job.post_id}`} // เปลี่ยน Link ไปยังหน้ารายละเอียดของงานนั้นๆ
                      style={{
                        padding: "8px 16px",
                        background: "#2563eb",
                        color: "#fff",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        fontWeight: "500",
                      }}
                    >
                      ดูรายละเอียดงาน
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#94a3b8" }}>
              ขณะนี้ยังไม่มีตำแหน่งงานที่เปิดรับ
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
