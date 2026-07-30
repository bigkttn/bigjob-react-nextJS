"use client";
import React, { useCallback, useEffect, useState } from "react";
import styles from "./detail.module.css";
import { useParams, useRouter } from "next/navigation";
import ProvinceSelect from "@/components/ProvinceSelect";

const DetailJob = () => {
  const params = useParams();
  const postId = params.id;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [editData, setEditData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [isSavingTest, setIsSavingTest] = useState(false);
  const [isMode, setIsMode] = useState(true); // true = แก้ไขงาน, false = แก้ไขข้อสอบ

  const [showBanPopup, setShowBanPopup] = useState(false);

  // ประกาศตัวแปรเตรียมไว้ก่อน
  let formattedBanDate = "";
  let remainingText = "";
  let isBanned = false;

  // เช็คว่าโหลดข้อมูล job มาเสร็จแล้ว และมี ban_until ค่อยเริ่มคำนวณ
  if (job && job.ban_until) {
    const banDate = new Date(job.ban_until.replace(" ", "T"));
    const now = new Date();
    const diffMs = banDate.getTime() - now.getTime();

    // ฟอร์แมตวันที่เป็น ค.ศ.
    const monthNames = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    formattedBanDate = `${banDate.getDate()} ${monthNames[banDate.getMonth()]} ค.ศ. ${banDate.getFullYear()} เวลา ${banDate.getHours().toString().padStart(2, "0")}:${banDate.getMinutes().toString().padStart(2, "0")} น.`;

    // คำนวณเวลาที่เหลือ (วัน / ชั่วโมง / นาที)
    if (diffMs > 0) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      const dayText = days > 0 ? `${days} วัน ` : "";
      const hourText = hours > 0 ? `${hours} ชั่วโมง ` : "";
      const minText = minutes > 0 ? `${minutes} นาที` : "";

      remainingText = `(เหลือเวลาอีก ${dayText}${hourText}${minText})`;
      isBanned = true; // ตั้งสถานะว่าโดนแบนอยู่
    } else {
      remainingText = "(ครบกำหนดเวลาแบนแล้ว)";
      isBanned = false; // หมดเวลาแบนแล้ว
    }
  }
  // คำนวณสถานะการแบน (replace " " เป็น "T" เพื่อป้องกัน Invalid Date ในบาง Browser)
  // const isBanned =
  //   job?.ban_until && new Date(job.ban_until.replace(" ", "T")) > new Date();

  const fetchJobDetail = useCallback(async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/getPostById/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const fetchTestData = useCallback(async () => {
    if (!postId) return;
    try {
      setLoadingTests(true);
      const res = await fetch(`/api/question/getTestByPostId/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Fetch test error:", error);
    } finally {
      setLoadingTests(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchJobDetail();
  }, [fetchJobDetail]);

  useEffect(() => {
    if (job) setEditData({ ...job });
    if (isBanned) {
      setShowBanPopup(true);
    }
  }, [job, isBanned]);

  useEffect(() => {
    fetchTestData();
  }, [fetchTestData]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div style={{ textAlign: "center", padding: "40px" }}>
            กำลังโหลดข้อมูล...
          </div>
        </div>
      </div>
    );
  }

  if (!job || !editData) {
    return <div className={styles.container}>ไม่พบข้อมูลงาน</div>;
  }

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "open" || s === "เปิดรับสมัคร")
      return { color: "#28a745", backgroundColor: "#eaffea" };
    if (s === "closed" || s === "ปิดรับสมัคร")
      return { color: "#dc3545", backgroundColor: "#ffebeb" };
    return { color: "#6c757d", backgroundColor: "#f8f9fa" };
  };

  const formatDateTimeLocal = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // ===== Job handlers =====
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/posts/updatePost/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        setJob(editData);
        alert("บันทึกสำเร็จ ✅");
        window.location.reload();
      } else {
        const err = await res.json();
        alert(`เกิดข้อผิดพลาด: ${err.message}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("ไม่สามารถบันทึกได้ กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  };

  // ===== Test handlers =====
  const handleQuestionChange = (qIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].text = value;
    setQuestions(updated);
  };

  const handleOptionChange = (
    qIndex: number,
    optIndex: number,
    value: string,
  ) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleSelectCorrect = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].correctIndex = optIndex;
    setQuestions(updated);
  };

  const handleSaveTest = async () => {
    if (!postId) return;
    try {
      setIsSavingTest(true);
      const res = await fetch(`/api/question/saveTest`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, questions }),
      });
      if (res.ok) {
        alert("บันทึกชุดข้อสอบสำเร็จ ✅");
        await fetchTestData();
      } else {
        const err = await res.json();
        alert(`เกิดข้อผิดพลาดในการบันทึกข้อสอบ: ${err.message}`);
      }
    } catch (error) {
      console.error("Save test error:", error);
      alert("ไม่สามารถบันทึกข้อสอบได้ กรุณาลองใหม่");
    } finally {
      setIsSavingTest(false);
    }
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (!confirm("ลบข้อสอบข้อนี้?")) return;
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { text: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  const handleAddOption = (qIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (updated[qIndex].options.length < 6) {
        updated[qIndex] = {
          ...updated[qIndex],
          options: [...updated[qIndex].options, ""],
        };
      }
      return updated;
    });
  };

  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIndex] };
      q.options = q.options.filter((_: string, i: number) => i !== optIndex);
      if (q.correctIndex >= q.options.length) q.correctIndex = 0;
      updated[qIndex] = q;
      return updated;
    });
  };

  return (
    <div className={styles.container}>
      {/* แบนเนอร์แจ้งเตือนการแบน (เปลี่ยนเป็นแบบ Popup กลางจอ) */}
      {showBanPopup && isBanned && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)", // ฉากหลังมืด
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999, // ให้อยู่บนสุดของหน้าจอ
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderTop: "6px solid #ef4444",
              borderRadius: "12px",
              padding: "30px",
              width: "90%",
              maxWidth: "400px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>⚠️</div>
            <h2
              style={{
                color: "#b91c1c",
                margin: "0 0 15px 0",
                fontSize: "1.25rem",
              }}
            >
              โพสต์นี้ถูกระงับการใช้งาน
            </h2>
            <p
              style={{
                color: "#4b5563",
                fontSize: "0.95rem",
                lineHeight: "1.5",
                marginBottom: "25px",
              }}
            >
              ไม่สามารถแก้ไขข้อมูลและข้อสอบได้
              <br />
              จนกว่าจะถึงเวลา:{" "}
              <strong style={{ color: "#111" }}>{formattedBanDate}</strong>
              <br />
              <span
                style={{
                  color: "#ef4444",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  display: "inline-block",
                  marginTop: "5px",
                }}
              >
                {remainingText}
              </span>
            </p>
            <button
              onClick={() => {
                setShowBanPopup(false);
                router.back();
              }}
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                width: "100%",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#dc2626")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#ef4444")
              }
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
      <div className={styles.card}>
        {/* ===== Unified Header Row (แถวควบคุมบนสุดระดับสากล) ===== */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "20px",
            borderBottom: "1px solid #e5e7eb",
            marginBottom: "30px",
          }}
        >
          <button className={styles.backBtn} onClick={() => router.back()}>
            <span className={styles.spanMother}>
              <span>{"<"}</span>
              <span>&nbsp;</span>
              <span>B</span>
              <span>a</span>
              <span>c</span>
              <span>k</span>
            </span>

            <span className={styles.spanMother2}>
              <span>{"<"}</span>
              <span>&nbsp;</span>
              <span>B</span>
              <span>a</span>
              <span>c</span>
              <span>k</span>
            </span>
          </button>

          {/* ตรงกลาง: แท็บสลับโหมดบอกสถานะชัดเจน */}
          <div
            style={{
              display: "flex",
              background: "#f3f4f6",
              padding: "6px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <button
              onClick={() => setIsMode(true)}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                background: isMode ? "#fff" : "transparent",
                color: isMode ? "#2563eb" : "#4b5563",
                fontWeight: "bold",
                boxShadow: isMode ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              แก้ไขโพสต์งาน
            </button>
            <button
              onClick={() => setIsMode(false)}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                background: !isMode ? "#fff" : "transparent",
                color: !isMode ? "#2563eb" : "#4b5563",
                fontWeight: "bold",
                boxShadow: !isMode ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              แก้ไขข้อสอบ ({questions.length} ข้อ)
            </button>
          </div>

          {/* ฝั่งขวา: ปุ่มบันทึกตามโหมดที่เลือก */}
          {/* ฝั่งขวา: ปุ่มบันทึกตามโหมดที่เลือก */}
          <button
            onClick={isMode ? handleSave : handleSaveTest}
            // 4. เพิ่ม isBanned เข้าไปในเงื่อนไข disabled
            disabled={isMode ? isSaving || isBanned : isSavingTest || isBanned}
            className={styles.postBtn}
            style={{
              // ปรับสีให้จางลงเมื่อถูกล็อก
              opacity: isBanned ? 0.5 : 1,
              cursor: isBanned ? "not-allowed" : "pointer",
            }}
          >
            {isMode
              ? isSaving
                ? "กำลังบันทึก..."
                : "Save Post"
              : isSavingTest
                ? "กำลังบันทึก..."
                : "Save Questions"}
          </button>
        </div>

        {/* ===== เนื้อหาด้านล่างเปลี่ยนตามโหมด (Content Area) ===== */}
        {isMode ? (
          <div>
            {/* ข้อมูลบริษัทพื้นฐาน */}
            <div className={styles.header}>
              <img
                src={job.logo_image || "/assets/images/suggestedCompanys.jpg"}
                alt="Company Logo"
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

            {/* รายละเอียดฟอร์มงาน */}
            <div className={styles.contentGrid}>
              <div className={styles.leftCol}>
                <table className={styles.infoTable}>
                  <tbody>
                    <tr>
                      <td className={styles.label}>Job Title</td>
                      <td>
                        <div className={styles.editInputWrapper}>
                          <input
                            className={styles.inputField}
                            value={editData.job_position ?? ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                job_position: e.target.value,
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.label}>Province</td>
                      <td>
                        <div className={styles.editInputWrapper}>
                          <ProvinceSelect
                            value={editData.province ?? ""}
                            onChange={(value) =>
                              setEditData({
                                ...editData,
                                province: value,
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.label}>Work Location </td>
                      <td>
                        <div className={styles.editInputWrapper}>
                          <input
                            className={styles.inputField}
                            value={editData.work_location ?? ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                work_location: e.target.value,
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.label}>Salary</td>
                      <td>
                        <div className={styles.editInputWrapper}>
                          <input
                            type="number"
                            className={styles.inputField}
                            value={editData.salary_min ?? ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                salary_min: e.target.value,
                              })
                            }
                          />{" "}
                          -{" "}
                          <input
                            type="number"
                            className={styles.inputField}
                            value={editData.salary_max ?? ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                salary_max: e.target.value,
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.label}>Age</td>
                      <td>
                        <div className={styles.editInputWrapper}>
                          <input
                            type="number"
                            className={styles.inputField}
                            value={editData.age_min ?? ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                age_min: e.target.value,
                              })
                            }
                          />{" "}
                          -{" "}
                          <input
                            type="number"
                            className={styles.inputField}
                            value={editData.age_max ?? ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                age_max: e.target.value,
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.label}>Job type</td>
                      <td>
                        <select
                          className={styles.selectInput}
                          value={editData.job_type ?? ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              job_type: e.target.value,
                            })
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
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.label}>Vacancy</td>
                      <td>
                        <div className={styles.editInputWrapper}>
                          <input
                            className={styles.inputField}
                            value={editData.vacancy ?? ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                vacancy: e.target.value,
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.label}>Details</td>
                      <td>
                        <div className={styles.editInputWrapper}>
                          <textarea
                            className={styles.inputField}
                            value={editData.job_description ?? ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                job_description: e.target.value,
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginTop: "30px" }}>
                  <hr />
                  <h3 className={styles.sectionTitle}>Qualifications</h3>
                  <div className={styles.editInputWrapper}>
                    <textarea
                      className={styles.inputField}
                      value={editData.preferred_qualifications ?? ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          preferred_qualifications: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className={styles.rightCol}>
                <section>
                  <h3 className={styles.sectionTitle}>Benefits</h3>
                  <div className={styles.editInputWrapper}>
                    <textarea
                      className={styles.inputField}
                      value={editData.Benefits ?? ""}
                      onChange={(e) =>
                        setEditData({ ...editData, Benefits: e.target.value })
                      }
                    />
                  </div>
                </section>

                <section style={{ marginTop: "30px" }}>
                  <hr />
                  <h3 className={styles.sectionTitle}>How to Apply</h3>
                  <div className={styles.editInputWrapper}>
                    <textarea
                      className={styles.inputField}
                      value={editData.how_to_apply ?? ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          how_to_apply: e.target.value,
                        })
                      }
                    />
                  </div>
                </section>

                <section style={{ marginTop: "30px" }}>
                  <hr />
                  <h3 className={styles.sectionTitle}>Contact</h3>
                  <div className={styles.editInputWrapper}>
                    <textarea
                      className={styles.inputField}
                      value={editData.contact ?? ""}
                      onChange={(e) =>
                        setEditData({ ...editData, contact: e.target.value })
                      }
                    />
                  </div>
                </section>

                <section style={{ marginTop: "30px" }}>
                  <hr />
                  <h3 className={styles.sectionTitle}>Application Deadline</h3>
                  <div className={styles.editInputWrapper}>
                    <input
                      type="datetime-local"
                      className={styles.inputField}
                      value={formatDateTimeLocal(editData?.application_dates)}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          application_dates: e.target.value,
                        })
                      }
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.testEditorContainer}>
            {loadingTests ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                กำลังโหลดคำถาม...
              </div>
            ) : questions.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#9ca3af",
                }}
              >
                ยังไม่มีข้อสอบสำหรับงานนี้
              </div>
            ) : (
              <div className={styles.questionsList}>
                {questions.map((q, qIndex) => (
                  <div
                    key={q.questionId || qIndex}
                    className={styles.questionBlock}
                  >
                    <div className={styles.inputWrapper}>
                      <span className={styles.questionNumber}>
                        {qIndex + 1}
                      </span>
                      <input
                        type="text"
                        className={styles.mainInput}
                        value={q.text}
                        placeholder="กรอกคำถามที่นี่..."
                        onChange={(e) =>
                          handleQuestionChange(qIndex, e.target.value)
                        }
                      />
                      <button
                        className={styles.deleteQBtn}
                        onClick={() => handleDeleteQuestion(qIndex)}
                      >
                        ลบ
                      </button>
                    </div>

                    <div className={styles.optionsBox}>
                      {q.options.map((optText: string, optIndex: number) => (
                        <div key={optIndex} className={styles.optionRow}>
                          <div
                            className={
                              q.correctIndex === optIndex
                                ? styles.radioCircleActive
                                : styles.radioCircle
                            }
                            onClick={() =>
                              handleSelectCorrect(qIndex, optIndex)
                            }
                          />
                          <input
                            type="text"
                            className={styles.optionInput}
                            value={optText}
                            placeholder={`ตัวเลือกที่ ${optIndex + 1}`}
                            onChange={(e) =>
                              handleOptionChange(
                                qIndex,
                                optIndex,
                                e.target.value,
                              )
                            }
                          />
                          {q.options.length > 2 && (
                            <button
                              className={styles.deleteOptBtn}
                              onClick={() =>
                                handleDeleteOption(qIndex, optIndex)
                              }
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className={styles.cardFooter}>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#9ca3af",
                          fontStyle: "italic",
                        }}
                      >
                        คลิกวงกลมเพื่อเลือกคำตอบที่ถูก
                      </span>
                      {q.options.length < 6 && (
                        <button
                          className={styles.addOptBtn}
                          onClick={() => handleAddOption(qIndex)}
                        >
                          + เพิ่มตัวเลือก
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingTests && (
              <button
                className={styles.addQuestionBtn}
                onClick={handleAddQuestion}
                style={{ marginTop: "20px" }}
              >
                + เพิ่มข้อสอบ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailJob;
