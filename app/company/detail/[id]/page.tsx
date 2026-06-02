"use client";
import React, { useCallback, useEffect, useState } from "react";
import styles from "./detail.module.css";
import { useParams, useRouter } from "next/navigation";
import { Span } from "next/dist/trace";
import { spawn } from "child_process";

const DetailJob = () => {
  const params = useParams(); // 2. ดึงค่าจาก URL
  const postId = params.id; // 3. สมมติว่า URL เป็น /user/user-detail-job/123 จะได้ postId = 123
  // console.log("Post ID from URL:", postId); // 4. ตรวจสอบค่าที่ดึงมา

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

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

  useEffect(() => {
    if (job) setEditData({ ...job });
  }, [job]);

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

  const handleSave = async () => {
    const res = await fetch(`/api/posts/updatePost/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    if (res.ok) {
      setJob(editData); // อัปเดต state หลัก
      setIsEditing(false);
    }
  };

  const formatDateTimeLocal = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // แปลงให้เป็น YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.headerButton}>
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

          <div>
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    marginBottom: "20px",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#ff0000",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
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
                  Save changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  marginBottom: "20px",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#047011",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Edit post
              </button>
            )}
          </div>
        </div>
        <div className={styles.header}>
          <img
            src={job.logo_image || "/assets/images/suggestedCompanys.jpg"}
            alt="Chao Phraya United"
            className={styles.logo}
          />
          <h1 className={styles.companyName}>
            {job.company_name || "Company Name"}
          </h1>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "bold",
              display: "inline-block",
              marginTop: "5px",
              border: "1px solid currentColor",
              ...getStatusStyle(job.status),
            }}
          >
            {job.status || "ไม่ระบุสถานะ"}
          </span>
        </div>

        {/* --- ส่วนเนื้อหา (Grid) --- */}
        <div className={styles.contentGrid}>
          {/* ฝั่งซ้าย: ข้อมูลงาน */}
          <div className={styles.leftCol}>
            <table className={styles.infoTable}>
              <tbody>
                <tr>
                  <td className={styles.label}>Job Title</td>
                  {/* ✅ ใส่ td คลุมทั้งเงื่อนไข */}
                  <td>
                    {isEditing ? (
                      <div className={styles.editInputWrapper}>
                        <input
                          className={styles.inputField} // ใส่คลาสที่ตัว input ตรงๆ
                          value={editData.job_position}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              job_position: e.target.value,
                            })
                          }
                        />
                      </div>
                    ) : (
                      <span>{job.job_position}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={styles.label}>Work Location</td>
                  <td>
                    {isEditing ? (
                      <div className={styles.editInputWrapper}>
                        <input
                          className={styles.inputField}
                          value={editData.work_location}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              work_location: e.target.value,
                            })
                          }
                        />
                      </div>
                    ) : (
                      <span> {job.work_location || "Work Location"}</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className={styles.label}>Salary</td>
                  <td>
                    {isEditing ? (
                      <div className={styles.editInputWrapper}>
                        <input
                          className={styles.inputField}
                          value={editData.salary_min}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              salary_min: e.target.value,
                            })
                          }
                        />{" "}
                        -{" "}
                        <input
                          className={styles.inputField}
                          value={editData.salary_max}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              salary_max: e.target.value,
                            })
                          }
                        />
                      </div>
                    ) : (
                      <td>
                        {job.salary_min || "Salary"} -{" "}
                        {job.salary_max || "Salary"} บาท
                      </td>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={styles.label}>Age</td>
                  <td>
                    {isEditing ? (
                      <div className={styles.editInputWrapper}>
                        <input
                          className={styles.inputField}
                          value={editData.age_min}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              age_min: e.target.value,
                            })
                          }
                        />{" "}
                        -{" "}
                        <input
                          className={styles.inputField}
                          value={editData.age_max}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              age_max: e.target.value,
                            })
                          }
                        />
                      </div>
                    ) : (
                      <td>
                        {job.age_min || "age"} - {job.age_max || "age"} ปี
                      </td>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={styles.label}>Job type</td>
                  <td>
                    {isEditing ? (
                      <select
                        className={styles.selectInput}
                        value={editData.job_type}
                        onChange={(e) =>
                          setEditData({ ...editData, job_type: e.target.value })
                        }
                      >
                        <option value="" disabled>
                          Select Job Type
                        </option>
                        <option value="Full-time">Full-time</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                      </select>
                    ) : (
                      <span>{job.job_type || "Salary"}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={styles.label}>Vacancy</td>
                  <td>
                    {isEditing ? (
                      <div className={styles.editInputWrapper}>
                        <input
                          className={styles.inputField}
                          value={editData.vacancy}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              vacancy: e.target.value,
                            })
                          }
                        />
                      </div>
                    ) : (
                      <span>{job.vacancy || 1}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className={styles.label}>Details</td>
                  <td>
                    {isEditing ? (
                      <div className={styles.editInputWrapper}>
                        <textarea
                          className={styles.inputField}
                          value={editData.job_description}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              job_description: e.target.value,
                            })
                          }
                        />
                      </div>
                    ) : (
                      <ul className={styles.list}>
                        <li>{job.job_description || "No details specified"}</li>
                      </ul>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: "30px" }}>
              <hr />
              <h3 className={styles.sectionTitle}>Qualifications</h3>
              {isEditing ? (
                <div className={styles.editInputWrapper}>
                  <textarea
                    className={styles.inputField}
                    value={editData.preferred_qualifications}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        preferred_qualifications: e.target.value,
                      })
                    }
                  ></textarea>
                </div>
              ) : (
                <ol className={styles.list}>
                  <li>
                    {job.preferred_qualifications ||
                      "No qualifications specified"}
                  </li>
                </ol>
              )}
            </div>
          </div>

          {/* ฝั่งขวา: สวัสดิการและติดต่อ */}
          <div className={styles.rightCol}>
            <section>
              <h3 className={styles.sectionTitle}>Benefits</h3>
              {isEditing ? (
                <div className={styles.editInputWrapper}>
                  <textarea
                    className={styles.inputField} // ใส่คลาสที่ตัว input ตรงๆ
                    value={editData.Benefits}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        Benefits: e.target.value,
                      })
                    }
                  />
                </div>
              ) : (
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
              )}
            </section>

            <section style={{ marginTop: "30px" }}>
              <hr />
              <h3 className={styles.sectionTitle}>How to Apply</h3>
              {isEditing ? (
                <div className={styles.editInputWrapper}>
                  <textarea
                    className={styles.inputField} // ใส่คลาสที่ตัว input ตรงๆ
                    value={editData.how_to_apply}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        how_to_apply: e.target.value,
                      })
                    }
                  />
                </div>
              ) : (
                <ul className={styles.list}>
                  <li>
                    {job.how_to_apply ||
                      "No application instructions specified"}
                  </li>
                </ul>
              )}
            </section>

            <section style={{ marginTop: "30px" }}>
              <hr />
              <h3 className={styles.sectionTitle}>Contact</h3>
              {isEditing ? (
                <div className={styles.editInputWrapper}>
                  <textarea
                    className={styles.inputField} // ใส่คลาสที่ตัว input ตรงๆ
                    value={editData.contact}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        contact: e.target.value,
                      })
                    }
                  />
                </div>
              ) : (
                <ul className={styles.list}>
                  <li>{job.contact || "No contact information specified"}</li>
                </ul>
              )}

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

              {isEditing ? (
                <div className={styles.editInputWroapper}>
                  <input
                    type="datetime-local"
                    className={styles.inputField}
                    value={formatDateTimeLocal(editData.application_dates)}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        application_dates: e.target.value,
                      })
                    }
                  />
                </div>
              ) : (
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
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DetailJob;
