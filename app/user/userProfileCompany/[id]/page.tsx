// 📂 app/(user-facing route)/company/[id]/ProfileCompany.tsx
"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./userProfileCompany.module.css";
import Link from "next/link";
import SaveAndReportCompany from "./SaveAndReportCompanyBttn";
import jwt, { JwtPayload } from "jsonwebtoken";

type LeafletMapProps = {
  lat: number | string | null;
  lng: number | string | null;
  isEditMode: boolean;
  onChangeLocation: (newLat: number, newLng: number) => void;
};

export default function ProfileCompany() {
  const { id } = useParams();  //company id
  const router = useRouter();

 const [company, setCompany] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // สร้าง State ไว้เก็บข้อมูล User ที่ Login อยู่แทนการใช้ cookies ด้านบน
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    // จำลองหรือดึงข้อมูลผู้ใช้จาก Session/API หรือแปลงจาก Token ฝั่ง Client
    // (หรือถ้าคุณมี API ดึงข้อมูลส่วนตัว สามารถเรียกใช้ตรงนี้ได้ครับ)
    // ตัวอย่างสมมุติ:
    setCurrentUserId(1); // เปลี่ยนเป็นระบบดึง user_id จริงของคุณ หรือ decode token บน client
  }, []);

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const res = await fetch(`/api/company/getCompanyById/${id}`);
        const data = await res.json();
        if (res.ok) {
          setCompany(data.company);
          setPosts(data.posts || []);
        } else {
          setError(data.error || "Failed to fetch company profile");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchCompanyProfile();
  }, [id]);
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

  if (loading) return <p style={{ padding: 20 }}>กำลังโหลดข้อมูลบริษัท...</p>;
  if (error) return <p style={{ padding: 20 }}>Error: {error}</p>;
  if (!company) return <p style={{ padding: 20 }}>No company data</p>;

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const res = await fetch(`/api/company/getCompanyById/${id}`);
        const data = await res.json();
        if (res.ok) {
          setCompany(data.company);
          setPosts(data.posts || []);
        } else {
          setError(data.error || "Failed to fetch company profile");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchCompanyProfile();
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>กำลังโหลดข้อมูลบริษัท...</p>;
  if (error) return <p style={{ padding: 20 }}>Error: {error}</p>;
  if (!company) return <p style={{ padding: 20 }}>No company data</p>;

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

      <div className={styles.backBtnWrapper}>
        <button
          type="button"
          onClick={() => router.back()}
          className={styles.backBtn}
        >
          ← ย้อนกลับ
        </button>
      </div>

      {/* ฝั่งซ้าย: ข้อมูลบริษัท (อ่านอย่างเดียว) */}
      <div className={styles.leftSection}>
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
              {/*  */}
              <SaveAndReportCompany
                  userId={Number(currentUserId)}
                  companyId={Number(id)}/>
            </h1>

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

        <div className={styles.mapWrapper}>
          <MapWithNoSSR
            lat={company.company_latitude}
            lng={company.company_longitude}
            isEditMode={false}
            onChangeLocation={() => {}}
          />
        </div>
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
          <h2
            style={{ margin: "0 0 4px", fontSize: "1.2rem", color: "#1e293b" }}
          >
            ตำแหน่งงานที่เปิดรับสมัคร ({posts.length})
          </h2>

          {posts.length === 0 ? (
            <p style={{ color: "#888" }}>ยังไม่มีตำแหน่งงานที่เปิดรับ</p>
          ) : (
            posts.map((job: any) => (
              <div key={job.post_id} className={styles.jobCard}>
                <img
                  src={
                    company.logo_image || "/assets/images/suggestedCompanys.jpg"
                  }
                  width={80}
                  height={80}
                  alt="Job Logo"
                />
                <div>
                  <h2>{fmt(job.job_position)}</h2>
                  <p>
                    <strong>Details:</strong> {fmt(job.job_description)}
                  </p>
                  <p>
                    <strong>Salary:</strong> THB {fmt(job.salary_min)} -{" "}
                    {fmt(job.salary_max)} / month
                  </p>
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
