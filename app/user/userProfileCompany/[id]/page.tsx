import styles from "./userProfileCompany.module.css";
import Link from "next/link";
import SaveAndReportCompany from "./SaveAndReportCompanyBttn";
import CompanyMapSection from "./map";
import { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import BackButton from "./backBttn";

interface CustomJwtPayload extends JwtPayload {
  id: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileCompany({ params }: PageProps) {
  const resolvedParams = await params;
  const companyId = resolvedParams.id;

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let viewer: CustomJwtPayload | null = null;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "fallback_secret";
      viewer = jwt.verify(token, secret) as CustomJwtPayload;
    } catch {
      console.error("Token invalid");
    }
  }

  if (!viewer) {
    return (
      <div className={styles.centerMsg}>
        <p>Please log in to view this profile.</p>
      </div>
    );
  }

  // --- ดึงข้อมูลโปรไฟล์บริษัทจาก API หลังบ้าน ---
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  let company: any = null;
  let posts: any[] = [];

  try {
    const res = await fetch(`${apiUrl}/api/company/getCompanyById/${companyId}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
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