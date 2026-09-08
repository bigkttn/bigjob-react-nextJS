import styles from "./detailjob.module.css";
import Link from "next/link";
import SaveAndReport from "../saveAndreportBttn";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import BackButton from "./backBttn";
import AdminButton from "./adminbutton";
import BanPopup from "./BanPopup";
import ApplyCompany from "./apply-company";
import { apiUrl } from "@/lib/hostURL";

interface CustomJwtPayload extends JwtPayload {
  id: number;
  role?: string;
  fullname?: string;
  email?: string;
}

interface JobPost {
  post_id?: number;
  job_position?: string;
  company_id?: number;
  company_name?: string;
  province?: string;
  work_location?: string;
  salary_min?: number;
  salary_max?: number;
  age_min?: number;
  age_max?: number;
  job_type?: string;
  vacancy?: number;
  job_description?: string;
  logo_image?: string;
  status?: string;
  ban_until?: string;
  [key: string]: unknown;
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

  if (!viewer) {
    return (
      <div className={styles.centerMsg}>
        <p>กรุณาเข้าสู่ระบบเพื่อดูข้อมูลนี้</p>
      </div>
    );
  }

  let seekerName = viewer?.fullname || "";
  let seekerEmail = viewer?.email || "";

  if (viewer?.id) {
    try {
      const seekerRes = await fetch(
        `${apiUrl}/api/user/getUserById/${viewer.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );

      if (seekerRes.ok) {
        const responseData = await seekerRes.json();
        const seekerData =
          responseData?.user || responseData?.data || responseData;

        seekerEmail = seekerData?.email || seekerEmail;
        seekerName = seekerData?.fullname || seekerName;
      } else {
        console.warn(
          `User profile not found in DB (Status ${seekerRes.status}). Using JWT fallback info.`,
        );
      }
    } catch (error) {
      console.error("Error fetching seeker profile:", error);
    }
  }

  // ถ้าสุดท้ายยังไม่ได้ค่า ให้ใส่ค่า Default
  seekerEmail = seekerEmail || "ไม่ระบุอีเมลผู้สมัคร";
  seekerName = seekerName || "ไม่ระบุชื่อผู้สมัคร";

  // เช็กว่าเป็น admin หรือ superadmin
  const isAdmin = viewer.role === "admin" || viewer.role === "superadmin";

  // Fetch ข้อมูล Job Post
  let job: JobPost | null = null;

  try {
    const jobResponse = await fetch(
      `${apiUrl}/api/posts/getPostById/${postId}`,
      {
        cache: "no-store",
      },
    );

    if (jobResponse.ok) {
      const contentType = jobResponse.headers.get("content-type");
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
    console.error("Fetch job error:", error);
  }

  // Fetch ข้อมูล Company Email
  let companyEmail = "";
  if (job?.company_id) {
    try {
      const companyResponse = await fetch(
        `${apiUrl}/api/company/getCompanyById/${job.company_id}`,
        {
          cache: "no-store",
        },
      );

      if (
        companyResponse.ok &&
        companyResponse.headers
          .get("content-type")
          ?.includes("application/json")
      ) {
        const responseData = await companyResponse.json();
        const companyData = responseData.company || responseData;
        companyEmail = companyData?.company_email || "";
      }
    } catch (error) {
      console.error("Fetch company error:", error);
    }
  }

  // กรณีไม่พบข้อมูลงาน
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

  // ฟังก์ชันกำหนดสีของ Status
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
          โหมดแอดมิน
        </h1>
      )}
      <div className={styles.container}>
        <div className={styles.card}>
          <BackButton />

          {/* ปุ่ม Apply พร้อมส่ง Props */}
          <ApplyCompany
            mode="invite"
            postId={Number(postId)}
            userId={viewer.id}
            companyId={Number(job.company_id)}
            companyName={job.company_name || "ไม่ระบุชื่อบริษัท"}
            seekerName={seekerName || "ไม่ระบุชื่อผู้สมัคร"}
            jobTitle={job.job_position || "ไม่ระบุตำแหน่งงาน"}
            seekerEmail={seekerEmail || "ไม่ระบุอีเมลผู้สมัคร"}
            companyEmail={companyEmail || viewer.email || "ไม่ระบุอีเมลบริษัท"}
          />

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
                  src={
                    job.logo_image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name || "Company")}&background=random`
                  }
                  alt="Company Logo"
                  className={styles.logo}
                />

                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <h1 className={styles.companyName}>
                    {job.company_name || "ไม่ระบุชื่อบริษัท"}
                  </h1>

                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                      border: "1px solid currentColor",
                      ...getStatusStyle(job.status || ""),
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
            {isAdmin && (
              <AdminButton
                id={String(viewer?.id || "")}
                role={viewer?.role || ""}
                post_id={String(job.post_id || "")}
                company_id={String(job.company_id || "")}
                ban_until={job.ban_until}
              />
            )}
          </div>

          {/* --- ส่วนเนื้อหา (Grid) --- */}
          <div className={styles.contentGrid}>
            {/* ฝั่งซ้าย: ข้อมูลงาน */}
            <div className={styles.leftCol}>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <td className={styles.label}>ตำแหน่งงาน</td>
                    <td>{job.job_position || "ไม่ระบุตำแหน่งงาน"}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>จังหวัด</td>
                    <td>{job.province || "ไม่ระบุจังหวัด"}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>สถานที่ทำงาน</td>
                    <td
                      style={{
                        maxWidth: "450px",
                        whiteSpace: "pre-line",
                        wordBreak: "break-word",
                      }}
                    >
                      {job.work_location || "ไม่ระบุสถานที่ทำงาน"}
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.label}>เงินเดือน</td>
                    <td>
                      {job.salary_min || "ไม่ระบุ"} -{" "}
                      {job.salary_max || "ไม่ระบุ"} บาท
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.label}>อายุ</td>
                    <td>
                      {job.age_min || "ไม่ระบุ"} - {job.age_max || "ไม่ระบุ"} ปี
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.label}>ประเภทงาน</td>
                    <td>{job.job_type || "ไม่ระบุ"}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>จำนวนที่รับ</td>
                    <td>{job.vacancy || 1} ตำแหน่ง</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>รายละเอียดงาน</td>
                    <td>
                      <ul className={styles.list}>
                        <li
                          style={{
                            maxWidth: "450px",
                            whiteSpace: "pre-line",
                            wordBreak: "break-word",
                          }}
                        >
                          {job.job_description || "ไม่ได้ระบุรายละเอียด"}
                        </li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: "30px" }}>
                <hr />
                <h3 className={styles.sectionTitle}>คุณสมบัติ</h3>
                <ol className={styles.list}>
                  <li
                    style={{
                      maxWidth: "450px",
                      whiteSpace: "pre-line",
                      wordBreak: "break-word",
                    }}
                  >
                    {typeof job.preferred_qualifications === "string"
                      ? job.preferred_qualifications
                      : "ไม่ได้ระบุคุณสมบัติ"}
                  </li>
                </ol>
              </div>
            </div>

            {/* ฝั่งขวา: สวัสดิการและติดต่อ */}
            <div className={styles.rightCol}>
              <section>
                <h3 className={styles.sectionTitle}>สวัสดิการ</h3>
                <ul className={styles.list}>
                  <li
                    style={{
                      maxWidth: "450px",
                      whiteSpace: "pre-line",
                      wordBreak: "break-word",
                    }}
                  >
                    {typeof job.Benefits === "string"
                      ? job.Benefits
                      : "ไม่ได้ระบุสวัสดิการ"}
                  </li>
                </ul>
              </section>

              <section style={{ marginTop: "30px" }}>
                <hr />
                <h3 className={styles.sectionTitle}>วิธีการสมัคร</h3>
                <ul className={styles.list}>
                  <li
                    style={{
                      maxWidth: "450px",
                      whiteSpace: "pre-line",
                      wordBreak: "break-word",
                    }}
                  >
                    {typeof job.how_to_apply === "string"
                      ? job.how_to_apply
                      : "ไม่ได้ระบุวิธีการสมัคร"}
                  </li>
                </ul>
              </section>

              <section style={{ marginTop: "30px" }}>
                <hr />
                <h3 className={styles.sectionTitle}>ช่องทางติดต่อ</h3>
                <ul className={styles.list}>
                  <li
                    style={{
                      maxWidth: "450px",
                      whiteSpace: "pre-line",
                      wordBreak: "break-word",
                    }}
                  >
                    {typeof job.contact === "string"
                      ? job.contact
                      : "ไม่ได้ระบุข้อมูลติดต่อ"}
                  </li>
                </ul>
              </section>

              <section style={{ marginTop: "30px" }}>
                <hr />
                <h3 className={styles.sectionTitle}>วันปิดรับสมัคร</h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "10px",
                  }}
                >
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
                      ? new Date(
                          job.application_dates as string | number,
                        ).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }) + " น."
                      : "ไม่ได้ระบุกำหนดการ"}
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
