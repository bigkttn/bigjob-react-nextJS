"use client";
import { useEffect, useState } from "react";
import styles from "./postjob.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number | null;
}

const PostJob = () => {
  const router = useRouter();
  const [isNext, setIsNext] = useState(false);
  const [postId, setPostId] = useState<number | null>(null);

  // 🔑 เพิ่ม State สำหรับเก็บสถานะการยืนยันตัวตน (ค่าเริ่มต้นเป็นเท็จก่อนโหลดข้อมูลเสร็จ)
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    jobPosition: "",
    workLocation: "",
    salary_min: "",
    salary_max: "",
    age_min: "",
    age_max: "",
    vacancy: "",
    jobType: "",
    deadline: "",
    jobDescription: "",
    qualifications: "",
    benefits: "",
    howToApply: "",
    contact: "",
  });

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", text: "", options: ["", ""], correctIndex: null },
  ]);

  // ── ดึงข้อมูลสถานะและโพสต์เก่า ─────────────────────────────────
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // 1. ดึงข้อมูลโพสต์เก่า (เพิ่มการเช็ค postResponse.ok ป้องกัน Error)
      const postResponse = await fetch("/api/posts/getPostbyCompanyId");
      if (postResponse.ok) {
        const postData = await postResponse.json();
        if (Array.isArray(postData)) {
          setMyPosts(postData);
        } else if (postData.posts && Array.isArray(postData.posts)) {
          setMyPosts(postData.posts);
        }
      }

      // 2. ดึงข้อมูลสถานะของบริษัท
      // ⚠️ ระบุ ID ให้ตรงกับ Route ที่คุณมี (เช่น ดึงจาก Session/Context หรือ LocalStorage)
      // สมมติว่าบริษัทที่ล็อกอินอยู่คือ ID: 1
      const companyId = 1;
      const companyResponse = await fetch(
        `/api/company/getCompanyById/${companyId}`,
      );

      // 🛡️ เช็คก่อนแปลงเป็น JSON ว่าไม่ได้ส่ง HTML Error กลับมา
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();

        // เช็คว่าสถานะเป็น Approved หรือไม่
        if (
          companyData?.company?.verification_status === "Approved" ||
          companyData?.verification_status === "Approved"
        ) {
          setIsApproved(true);
        } else {
          setIsApproved(false);
        }
      } else {
        console.error(
          "ไม่สามารถดึงข้อมูลบริษัทได้ Status:",
          companyResponse.status,
        );
        setIsApproved(false); // ล็อกหน้าไว้ก่อนถ้าดึงข้อมูลไม่สำเร็จ
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsApproved(false);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // ── Form handlers (🔓 ทำงานเมื่อ Approved เท่านั้น) ──────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (!isApproved) return; // ล็อกถ้าไม่ Approved
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (!isApproved) return;
    setIsNext(true);
  };

  const handleSubmit = async () => {
    if (!isApproved) return;
    // โค้ดส่งข้อมูลไปหลังบ้านของคุณ
    console.log("Submitting...", formData, questions);
  };

  const handleDelete = async (id: number) => {
    if (!isApproved) {
      alert("ไม่สามารถลบได้เนื่องจากบัญชียังไม่ได้รับการอนุมัติ");
      return;
    }
    // โค้ดลบประกาศงานของคุณ
  };

  // ── Question handlers (🔓 ทำงานเมื่อ Approved เท่านั้น) ──────────────────────────
  const addQuestion = () => {
    if (!isApproved) return;
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        text: "",
        options: ["", ""],
        correctIndex: null,
      },
    ]);
  };

  const deleteQuestion = (qId: string) => {
    if (!isApproved) return;
    setQuestions(questions.filter((q) => q.id !== qId));
  };

  const updateQuestionText = (qId: string, text: string) => {
    if (!isApproved) return;
    setQuestions(questions.map((q) => (q.id === qId ? { ...q, text } : q)));
  };

  const addOption = (qId: string) => {
    if (!isApproved) return;
    setQuestions(
      questions.map((q) =>
        q.id === qId ? { ...q, options: [...q.options, ""] } : q,
      ),
    );
  };

  const deleteOption = (qId: string, optIndex: number) => {
    if (!isApproved) return;
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.filter((_, i) => i !== optIndex) }
          : q,
      ),
    );
  };

  const updateOptionText = (qId: string, optIndex: number, text: string) => {
    if (!isApproved) return;
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const newOpts = [...q.options];
          newOpts[optIndex] = text;
          return { ...q, options: newOpts };
        }
        return q;
      }),
    );
  };

  const setCorrectAnswer = (qId: string, optIndex: number) => {
    if (!isApproved) return;
    setQuestions(
      questions.map((q) =>
        q.id === qId ? { ...q, correctIndex: optIndex } : q,
      ),
    );
  };

  // ── Dynamic Styles ───────────────────────────────────────────
  const inputStyle = isApproved
    ? {}
    : { backgroundColor: "#f5f5f5", cursor: "not-allowed", color: "#888" };
  const btnStyle = isApproved ? {} : { opacity: 0.5, cursor: "not-allowed" };

  if (isLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div>
      {/* My Posts */}
      <div className={styles.myPostsSection}>
        <h2 className={styles.myPostsTitle}>My Posts</h2>
        <div className={styles.item}>
          {myPosts.length > 0 ? (
            myPosts.map((post: any) => (
              <div key={post.post_id}>
                <div className={styles.postMiniCard}>
                  <div className={styles.postMiniCardInfo}>
                    <span
                      className={`${styles.statusBadge} ${post.status === "Open" ? styles.open : styles.closed}`}
                    >
                      {post.status}
                    </span>
                    <p className={styles.bold}>{post.job_position}</p>
                    <p className={styles.subText}>{post.company_name}</p>
                    <div className={styles.cardFooter}>
                      <Link href={`/company/detail/${post.post_id}`}>
                        <button className={styles.detailBtn}>Detail</button>
                      </Link>
                      <button
                        className={styles.DeleteBtn}
                        style={btnStyle}
                        disabled={!isApproved}
                        onClick={() => handleDelete(post.post_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.emptyText}>ยังไม่มีรายการประกาศงาน</p>
          )}
        </div>
      </div>

      {/* Create Post */}
      <div className={styles.postContainer}>
        {/* ⚠️ แสดงข้อความเตือนเฉพาะตอนที่สถานะ "ไม่ใช่ Approved" */}
        {!isApproved && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              color: "#856404",
              border: "1px solid #ffeeba",
              padding: "12px 20px",
              borderRadius: "6px",
              marginBottom: "20px",
              fontWeight: "bold",
            }}
          >
            ⚠️ กรุณายืนยันตัวตนให้เสร็จสิ้นก่อน
            เพื่อเปิดใช้งานระบบการสร้างประกาศงาน
          </div>
        )}

        <div className={styles.postHeader}>
          {isNext ? (
            <button className={styles.nextBtn} onClick={() => setIsNext(false)}>
              Back
            </button>
          ) : (
            <h2 className={styles.myPostsTitle}>
              Create Posts {isApproved ? "" : "(View Only)"}
            </h2>
          )}

          {isNext ? (
            <button
              className={styles.nextBtn}
              style={btnStyle}
              disabled={!isApproved}
              onClick={handleSubmit}
            >
              Submit
            </button>
          ) : (
            <button
              className={styles.nextBtn}
              style={btnStyle}
              disabled={!isApproved}
              onClick={handleNext}
            >
              Next
            </button>
          )}
        </div>

        {/* Step 2: Questions */}
        {isNext ? (
          <div className={styles.container}>
            <div className={styles.headerRow}>
              <p className={styles.instruction}>Questions mode.</p>
            </div>

            <div className={styles.questionList}>
              {questions.map((q, qIndex) => (
                <div key={q.id} className={styles.questionBlock}>
                  <div className={styles.inputWrapper}>
                    <span className={styles.questionNumber}>{qIndex + 1}.</span>
                    <input
                      type="text"
                      placeholder="Enter question"
                      className={styles.mainInput}
                      style={inputStyle}
                      disabled={!isApproved}
                      value={q.text}
                      onChange={(e) => updateQuestionText(q.id, e.target.value)}
                    />
                    <button
                      className={styles.deleteQuestionBtn}
                      style={btnStyle}
                      disabled={!isApproved}
                      onClick={() => deleteQuestion(q.id)}
                    >
                      🗑️
                    </button>
                  </div>

                  <div className={styles.optionsBox}>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className={styles.optionRow}>
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          disabled={!isApproved}
                          checked={q.correctIndex === optIndex}
                          onChange={() => setCorrectAnswer(q.id, optIndex)}
                          className={styles.radioInput}
                        />
                        <input
                          type="text"
                          placeholder="Option"
                          disabled={!isApproved}
                          className={`${styles.optionInput} ${q.correctIndex === optIndex ? styles.correct : ""}`}
                          style={inputStyle}
                          value={opt}
                          onChange={(e) =>
                            updateOptionText(q.id, optIndex, e.target.value)
                          }
                        />
                        {q.options.length > 2 && (
                          <button
                            disabled={!isApproved}
                            style={btnStyle}
                            onClick={() => deleteOption(q.id, optIndex)}
                            className={styles.removeOptionBtn}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={!isApproved}
                      style={btnStyle}
                      onClick={() => addOption(q.id)}
                      className={styles.addOptionBtn}
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.addWrapper}>
              <button
                disabled={!isApproved}
                style={btnStyle}
                onClick={addQuestion}
                className={styles.addBtn}
              >
                + Add More Question
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: Job Form */
          <div className={styles.postForm}>
            <div className={styles.formColumn}>
              <div className={styles.inputGroupInline}>
                <label>Job Position</label>
                <input
                  type="text"
                  name="jobPosition"
                  style={inputStyle}
                  disabled={!isApproved}
                  value={formData.jobPosition}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.inputGroupInline}>
                <label>Work Location</label>
                <input
                  type="text"
                  name="workLocation"
                  style={inputStyle}
                  disabled={!isApproved}
                  value={formData.workLocation}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.inputGroupInline}>
                <label>Salary Range</label>
                <input
                  type="number"
                  name="salary_min"
                  disabled={!isApproved}
                  value={formData.salary_min}
                  onChange={handleChange}
                  style={{ ...inputStyle, width: "100%" }}
                />
                -
                <input
                  type="number"
                  name="salary_max"
                  disabled={!isApproved}
                  value={formData.salary_max}
                  onChange={handleChange}
                  style={{ ...inputStyle, width: "100%" }}
                />
              </div>
              <div className={styles.inputGroupInline}>
                <label>Age Range</label>
                <input
                  type="number"
                  name="age_min"
                  disabled={!isApproved}
                  value={formData.age_min}
                  onChange={handleChange}
                  style={{ ...inputStyle, width: "100%" }}
                />
                -
                <input
                  type="number"
                  name="age_max"
                  disabled={!isApproved}
                  value={formData.age_max}
                  onChange={handleChange}
                  style={{ ...inputStyle, width: "100%" }}
                />
              </div>
              <div className={styles.inputGroupInline}>
                <label>Vacancy</label>
                <input
                  type="number"
                  name="vacancy"
                  style={inputStyle}
                  disabled={!isApproved}
                  value={formData.vacancy}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.inputGroupInline}>
                <label>Job Type</label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  className={styles.selectInput}
                  style={inputStyle}
                  disabled={!isApproved}
                  onChange={handleChange}
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
              </div>
              <div className={styles.inputGroupFull}>
                <label>Deadline</label>
                <input
                  type="datetime-local"
                  className={styles.dateInput}
                  style={inputStyle}
                  disabled={!isApproved}
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.inputGroupFull}>
                <label>Job Description</label>
                <textarea
                  name="jobDescription"
                  style={inputStyle}
                  disabled={!isApproved}
                  value={formData.jobDescription}
                  onChange={handleChange}
                  rows={6}
                />
              </div>
            </div>

            <div className={styles.formColumn}>
              <div className={styles.inputGroupFull}>
                <label>Qualifications</label>
                <textarea
                  name="qualifications"
                  style={inputStyle}
                  disabled={!isApproved}
                  value={formData.qualifications}
                  onChange={handleChange}
                  rows={6}
                />
              </div>
              <div className={styles.inputGroupFull}>
                <label>Benefits</label>
                <textarea
                  name="benefits"
                  style={inputStyle}
                  disabled={!isApproved}
                  value={formData.benefits}
                  onChange={handleChange}
                  rows={6}
                />
              </div>
              <div className={styles.inputGroupFull}>
                <label>How To Apply</label>
                <textarea
                  name="howToApply"
                  style={inputStyle}
                  disabled={!isApproved}
                  value={formData.howToApply}
                  onChange={handleChange}
                  rows={6}
                />
              </div>
              <div className={styles.inputGroupFull}>
                <label>Contact</label>
                <textarea
                  name="contact"
                  style={inputStyle}
                  disabled={!isApproved}
                  value={formData.contact}
                  onChange={handleChange}
                  rows={6}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostJob;
