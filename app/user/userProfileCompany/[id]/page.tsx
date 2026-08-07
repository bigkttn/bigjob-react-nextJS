"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./userProfileCompany.module.css";

import BackButton from "./backBttn";
import AdminButton from "./adminbutton";
import SaveAndReportCompany from "./SaveAndReportCompanyBttn";
import CompanyMapSection from "./map";
import { getSession, CustomJwtPayload } from "./getSession";
import BanPopup from "./BanPopup";

export default function ProfileCompany() {
  const { id } = useParams();

  const [company, setCompany] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [viewer, setViewer] = useState<CustomJwtPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // โหลด session ของผู้ใช้ที่กำลังดูหน้านี้ (เพื่อเช็คสิทธิ์ admin / ผู้รายงาน)
  useEffect(() => {
    async function fetchSession() {
      try {
        const session = await getSession();
        setViewer(session);
      } catch (err) {
        console.error("Session fetch error:", err);
        setViewer(null);
      }
    }
    fetchSession();
  }, []);

  // โหลดข้อมูลบริษัทและรายการตำแหน่งงาน
  useEffect(() => {
    if (!id) return;

    async function fetchCompanyProfile() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/company/getCompanyById/${id}`);
        const contentType = res.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          const textError = await res.text();
          console.error(
            "API did not return JSON. Received:",
            textError.substring(0, 200),
          );
          setError("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
          return;
        }

        const data = await res.json();

        if (res.ok) {
          setCompany(data.company);
          setPosts(data.posts || []);
        } else {
          console.error(
            `Failed to fetch company profile. Status: ${res.status}`,
            data,
          );
          setError("ไม่สามารถโหลดข้อมูลบริษัทได้");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
      } finally {
        setLoading(false);
      }
    }

    fetchCompanyProfile();
  }, [id, refreshTrigger]);

  const fmt = (val: any) =>
    val !== null && val !== undefined && val !== "" ? String(val) : "-";

  // สถานะกำลังโหลด
  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // กรณีไม่พบข้อมูลบริษัท หรือเกิด error
  if (error || !company) {
    return (
      <div className={styles.container}>
        <div>
          <BackButton />
          <div
            style={{ textAlign: "center", padding: "40px 0", color: "#dc3545" }}
          >
            <h3>ไม่พบข้อมูลบริษัท หรือเกิดข้อผิดพลาดในการเชื่อมต่อระบบ</h3>
            <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "8px" }}>
              โปรดตรวจสอบความถูกต้องของ URL หรือสถานะของเซิร์ฟเวอร์ API
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  const isAdmin = viewer?.role === "admin";
  const companyId = company.company_id
    ? String(company.company_id)
    : String(id);

  console.log(company);

  return (
    <div>
      {isAdmin && (
        <h1
          style={{
            color: "red",
            fontWeight: "bold",
            fontSize: "1.50rem",
            textAlign: "center",
            backgroundColor: "#ffe6e6",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          Admin Mode
        </h1>
      )}
      <div className={styles.container}>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        {/* ฝั่งซ้าย: ข้อมูลบริษัท (อ่านอย่างเดียว) */}

        <div className={styles.leftSection}>
          <BanPopup company={company} isAdmin={isAdmin} />
          <div style={{ width: "100px", height: "25px" }}>
            <BackButton />
          </div>

          <div className={styles.profileCard}>
            <img
              src={company.cover_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name || "Company")}&background=random`}
              className={styles.banner}
              alt="Banner"
            />

            <div className={styles.logoWrapper}>
              <img
                src={
                  company.logo_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name || "Company")}&background=random`
                }
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
                {viewer && (
                  <div
                    style={{
                      marginLeft: "auto",
                      marginRight: "20px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <SaveAndReportCompany
                      userId={Number(viewer.id)}
                      companyId={Number(companyId)}
                    />
                  </div>
                )}
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
                    company_id={companyId}
                    banned_until={company.banned_until}
                    onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
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
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: "1.2rem",
                color: "#1e293b",
              }}
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
                      company.logo_image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name || "Company")}&background=random`
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
    </div>
  );
}
