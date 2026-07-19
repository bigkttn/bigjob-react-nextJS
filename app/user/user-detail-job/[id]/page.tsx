import styles from "./detailjob.module.css";
import Link from "next/link";
import SaveAndReport from "../saveAndreportBttn";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import BackButton from "./backBttn";
import AdminButton from "./adminbutton";
import BanPopup from "./BanPopup";
interface CustomJwtPayload extends JwtPayload {
  id: number;
  role?: string;
}
interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function DetailJob({ params }: PageProps) {
  const resolvedParams = await params;
  const postId = resolvedParams.id;

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
  //true if user is admin or superadmin
  const isAdmin = viewer?.role === "admin" || viewer?.role === "superadmin";

  if (!viewer) {
    return (
      <div className={styles.centerMsg}>
        <p>Please log in to view this profile.</p>
      </div>
    );
  }

  // Fetch job data
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  let job: any = null;
  const jobResponse = await fetch(`${apiUrl}/api/posts/getPostById/${postId}`, {
    cache: "no-store", // เพื่อให้ได้ข้อมูลที่อัปเดตใหม่เสมอเหมือน useEffect
  });

  try {
    // 1. เช็กว่า response status ok หรือไม่ (เช่น 200-299)
    if (jobResponse.ok) {
      const contentType = jobResponse.headers.get("content-type");

      // 2. เช็กว่าสิ่งที่ส่งกลับมาคือ JSON จริงๆ ไม่ใช่ HTML
      if (contentType && contentType.includes("application/json")) {
        job = await jobResponse.json();
      } else {
        const textError = await jobResponse.text();
        console.error(
          "API did not return JSON. Received:",
          textError.substring(0, 200),
        );
      }
    } else {
      console.error(`Failed to fetch job. Status: ${jobResponse.status}`);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
  // กรณีไม่พบข้อมูล
  if (!job) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <BackButton />
          <div
            style={{ textAlign: "center", padding: "40px 0", color: "#dc3545" }}
          >
            <h3>ไม่พบข้อมูลงาน หรือเกิดข้อผิดพลาดในการเชื่อมต่อระบบ</h3>
            <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "8px" }}>
              โปรดตรวจสอบความถูกต้องของ URL หรือสถานะของเซิร์ฟเวอร์ API
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- ฟังก์ชันกำหนดสีของ Status ---
  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "open" || s === "เปิดรับสมัคร")
      return { color: "#28a745", backgroundColor: "#eaffea" };
    if (s === "closed" || s === "ปิดรับสมัคร")
      return { color: "#dc3545", backgroundColor: "#ffebeb" };
    return { color: "#6c757d", backgroundColor: "#f8f9fa" };
  };

  return (
    <div>
      <BanPopup job={job} isAdmin={isAdmin} />
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
        <div className={styles.card}>
          <BackButton />

          <button className={styles.applyBtn}>Apply Now</button>

          <div className={styles.header}>
            <div className={styles.linkCard1}>
              <Link
                href={`/user/userProfileCompany/${job.company_id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <img
                  src={job.logo_image || "/assets/images/suggestedCompanys.jpg"}
                  alt="Company Logo"
                  className={styles.logo}
                />

                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <h1 className={styles.companyName}>
                    {job.company_name || "Company Name"}
                  </h1>

                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                      border: "1px solid currentColor",
                      ...getStatusStyle(job.status),
                    }}
                  >
                    {job.status || "ไม่ระบุสถานะ"}
                  </span>
                </div>
              </Link>
            </div>

            <SaveAndReport
              userId={Number(viewer?.id)}
              postId={Number(postId)}
            />
          </div>

          {/* --- ส่วนเนื้อหา (Grid) --- */}
          <div className={styles.contentGrid}>
            {/* ฝั่งซ้าย: ข้อมูลงาน */}
            <div className={styles.leftCol}>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <td className={styles.label}>Job Title</td>
                    <td>{job.job_position || "Job Title"}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Work Location</td>
                    <td>{job.work_location || "Work Location"}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Salary</td>
                    <td>
                      {job.salary_min || "Salary"} -{" "}
                      {job.salary_max || "Salary"} บาท
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Age</td>
                    <td>
                      {job.age_min || "Salary"} - {job.age_max || "Salary"} ปี
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Job type</td>
                    <td>{job.job_type || "Salary"} </td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Vacancy</td>
                    <td>{job.vacancy || 1} </td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Details</td>
                    <td>
                      <ul className={styles.list}>
                        <li>{job.job_description || "No details specified"}</li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: "30px" }}>
                <hr />
                <h3 className={styles.sectionTitle}>Qualifications</h3>
                <ol className={styles.list}>
                  <li>
                    {job.preferred_qualifications ||
                      "No qualifications specified"}
                  </li>
                </ol>
              </div>
            </div>

            {/* ฝั่งขวา: สวัสดิการและติดต่อ */}
            <div className={styles.rightCol}>
              <section>
                <h3 className={styles.sectionTitle}>Benefits</h3>
                <ul className={styles.list}>
                  <li
                    style={{
                      maxWidth: "450px",
                      whiteSpace: "pre-line",
                      wordBreak: "break-word",
                    }}
                  >
                    {job.Benefits || "No benefits specified"}
                  </li>
                </ul>
              </section>

              <section style={{ marginTop: "30px" }}>
                <hr />
                <h3 className={styles.sectionTitle}>How to Apply</h3>

                <ul className={styles.list}>
                  <li>
                    {job.how_to_apply ||
                      "No application instructions specified"}
                  </li>
                </ul>
              </section>

              <section style={{ marginTop: "30px" }}>
                <hr />
                <h3 className={styles.sectionTitle}>Contact</h3>
                <ul className={styles.list}>
                  <li>{job.contact || "No contact information specified"}</li>
                </ul>
                {/* <div style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>
                {job.contact || "No contact information specified"}
              </div> */}
              </section>

              <section style={{ marginTop: "30px" }}>
                {/* <hr
                style={{
                  border: "0",
                  borderTop: "1px solid #eee",
                  marginBottom: "20px",
                }}
              /> */}
                <hr />

                <h3 className={styles.sectionTitle}>Application Deadline</h3>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "10px",
                  }}
                >
                  {/* จุดวงกลมเล็กๆ เพื่อเน้นสายตา */}
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#e67e22",
                    }}
                  ></div>

                  <span
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "500",
                      color: "#333",
                    }}
                  >
                    {job.application_dates
                      ? new Date(job.application_dates).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          },
                        ) + " น."
                      : "No deadline specified"}
                  </span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
