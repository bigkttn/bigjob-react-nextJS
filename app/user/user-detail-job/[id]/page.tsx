"use client";
import React, { useCallback, useEffect, useState } from "react";
import styles from "./detailjob.module.css";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const DetailJob = () => {
  const params = useParams(); // 2. ดึงค่าจาก URL
  const postId = params.id; // 3. สมมติว่า URL เป็น /user/user-detail-job/123 จะได้ postId = 123
  // console.log("Post ID from URL:", postId); // 4. ตรวจสอบค่าที่ดึงมา

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchJobDetail = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/posts/getPostById/${postId}`);

      if (response.ok) {
        const data = await response.json();
        setJob(data);
        console.log("Fetched job data:", data); // ตรวจสอบข้อมูลที่ได้รับ
      } else {
        console.error("Failed to fetch job data");
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchJobDetail();
  }, [fetchJobDetail]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}></div>
      </div>
    );
  }

  // กรณีไม่พบข้อมูล
  if (!job) {
    return <div className={styles.container}>ไม่พบข้อมูลงาน</div>;
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
        {/* --- ส่วนหัว (Header) --- */}
        {/* {suggestedCompanys.map((company, index) => (
                    
          <div key={index} className={styles.header}>))} */}
        <button className={styles.applyBtn}>Apply Now</button>

        <div className={styles.header}>
          <div
            // style={{
            //   display: "flex",
            //   flexDirection: "column",
            //   alignItems: "center",
            //   gap: "10px",
            //   backgroundColor: "#056ed8",
            //   borderRadius: "50px",
            // }}
            className={styles.linkCard1}
          >
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
                    {job.salary_min || "Salary"} - {job.salary_max || "Salary"}{" "}
                    บาท
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
                  {job.how_to_apply || "No application instructions specified"}
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
  );
};
export default DetailJob;
