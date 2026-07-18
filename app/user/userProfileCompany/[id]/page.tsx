// 📂 app/(user-facing route)/company/[id]/ProfileCompany.tsx
"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./userProfileCompany.module.css";
import Link from "next/link";

type LeafletMapProps = {
  lat: number | string | null;
  lng: number | string | null;
  isEditMode: boolean;
  onChangeLocation: (newLat: number, newLng: number) => void;
};

export default function ProfileCompany() {
  const { id } = useParams();
  const router = useRouter();

  // โหลดแผนที่แบบไม่ SSR เหมือนหน้า CompanyProfile (แต่ล็อกไว้เป็นโหมดดูอย่างเดียว)
  const MapWithNoSSR = dynamic<LeafletMapProps>(
    () => import("@/components/LeafletMap"),
    {
      ssr: false,
      loading: () => (
        <div
          style={{
            height: "300px",
            background: "#eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p>Loading Map...</p>
        </div>
      ),
    },
  );

  const [company, setCompany] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const res = await fetch(`/api/company/getCompanyById/${id}`);
        const data = await res.json();
        // ดึงข้อมูลบริษัทและรายการโพสต์งานที่ส่งมาจากหลังบ้าน
        company = data.company;
        posts = data.posts || [];
      } else {
        const textError = await res.text();
        console.error("API did not return JSON. Received:", textError.substring(0, 200));
      }
    } else {
      console.error(`Failed to fetch company profile. Status: ${res.status}`);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }

  // กรณีไม่พบข้อมูลบริษัท
  if (!company) {
    return (
      <div className={styles.container}>
        <div className={styles.card || ""}>
          <BackButton />
          <div style={{ textAlign: "center", padding: "40px 0", color: "#dc3545" }}>
            <h3>ไม่พบข้อมูลบริษัท หรือเกิดข้อผิดพลาดในการเชื่อมต่อระบบ</h3>
            <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "8px" }}>
              โปรดตรวจสอบความถูกต้องของ URL หรือสถานะของเซิร์ฟเวอร์ API
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fmt = (val: any) =>
    val !== null && val !== undefined && val !== "" ? String(val) : "-";

  const isVerified =
    typeof company.verification_status === "string" &&
    company.verification_status.toLowerCase() === "approved";
  const isRejected =
    typeof company.verification_status === "string" &&
    company.verification_status.toLowerCase() === "rejected";

  const statusColor = isVerified ? "#1a8a2a" : isRejected ? "#b50000" : "#888";
  const statusLabel = isVerified
    ? "ยืนยันตัวตนแล้ว"
    : isRejected
      ? "ถูกปฏิเสธ"
      : "รอตรวจสอบ";

  return (
    <div className={styles.container}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />

      {/* ฝั่งซ้าย: ข้อมูลบริษัท (อ่านอย่างเดียว) */}
      <div className={styles.leftSection}>
        <div
          style={{
            width: "100px",
            height: "25px",

          }}>
          <BackButton />
        </div>
        <div className={styles.profileCard}>
          <img
            src={company.cover_image || "/assets/images/company_2.jpg"}
            className={styles.banner}
            alt="Banner"
          />

          <div className={styles.logoWrapper}>
            <img
              src={company.logo_image || "/assets/images/suggestedCompanys.jpg"}
              className={styles.logo}
              alt="Logo"
            />
          </div>

          <div className={styles.infoArea}>
            <h1 className={styles.companyName}>
              {fmt(company.company_name)}
              {isVerified ? (
                <span
                  className="material-symbols-outlined"
                  title="บริษัทนี้ผ่านการยืนยันตัวตนแล้ว"
                  style={{ color: "#1d9bf0" }}
                >
                  verified
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: statusColor,
                    border: `1px solid ${statusColor}`,
                    borderRadius: "999px",
                    padding: "2px 10px",
                    alignSelf: "center",
                  }}
                >
                  {statusLabel}
                </span>
              )}
              <div
                style={{
                  marginLeft: "auto",      // ดันปุ่มไปทางขวาจนสุด
                  marginRight: "20px",     // ระยะห่างจากขอบขวาสุด 20px (ปรับเพิ่ม-ลดได้)
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <SaveAndReportCompany
                  userId={Number(viewer.id)}
                  companyId={Number(companyId)}
                />
              </div>

            </h1>
            {isAdmin && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "end",
                }}
              >
                <AdminButton
                  id={String(viewer?.id)}
                  role={viewer?.role || ""}
                  company_id={
                    company.company_id ? String(company.company_id) : ""
                  }
                />
              </div>
            )}

            <p>{fmt(company.brief_history)}</p>

            <hr />
            <div className={styles.contactGroup}>
              <h3>Contact & Location</h3>
              <p>{fmt(company.contact_information)}</p>
              <p>{fmt(company.full_address)}</p>
              <p>{fmt(company.province)}</p>
              <p>{fmt(company.postcode)}</p>
              <p>Tel: {fmt(company.mobile_phone)}</p>
              <p>Email: {fmt(company.company_email)}</p>
            </div>
          </div>
        </div>

        {/* แผนที่ย่อย */}
        <CompanyMapSection
          latitude={company.company_latitude}
          longitude={company.company_longitude}
        />
      </div>

      {/* ฝั่งขวา: สถานะยืนยันตัวตน + ตำแหน่งงาน */}
      <div className={styles.rightSection}>
        <div className={styles.VerifiedConfirm}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h3 style={{ margin: 0 }}>Company Registration Certificate</h3>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#fff",
                backgroundColor: statusColor,
                borderRadius: "999px",
                padding: "4px 12px",
              }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className={styles.jobScrollArea}>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.2rem", color: "#1e293b" }}>
            ตำแหน่งงานที่เปิดรับสมัคร ({posts.length})
          </h2>

          {posts.length === 0 ? (
            <p style={{ color: "#888" }}>ยังไม่มีตำแหน่งงานที่เปิดรับ</p>
          ) : (
            posts.map((job: any) => (
              <div key={job.post_id} className={styles.jobCard}>
                <img
                  src={company.logo_image || "/assets/images/suggestedCompanys.jpg"}
                  width={80}
                  height={80}
                  alt="Job Logo"
                />
                <div>
                  <h2>{fmt(job.job_position)}</h2>
                  <p><strong>Details:</strong> {fmt(job.job_description)}</p>
                  <p><strong>Salary:</strong> THB {fmt(job.salary_min)} - {fmt(job.salary_max)} / month</p>
                  <Link href={`/user/user-detail-job/${job.post_id}`}>
                    <button className={styles.detailBtn}>Detail</button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}