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

  // ── Form handlers ──────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Step 1: กด Next → ตรวจสอบฟิลด์ที่จำเป็นเฉยๆ ยังไม่บันทึกลง DB
  const handleNext = () => {
    if (!formData.jobPosition || !formData.workLocation || !formData.jobType) {
      alert("Please fill in all required fields.");
      return;
    }
    // ผ่านการตรวจสอบแล้วให้เปลี่ยนไปหน้าทำข้อสอบได้เลย
    setIsNext(true);
  };

  // Step 2: กด Submit → บันทึกทั้ง Post และ คำถามต่อเนื่องกัน
  const handleSubmit = async () => {
    // 1. ตรวจสอบความถูกต้องของข้อมูลโพสต์งานอีกครั้งเพื่อความชัวร์
    if (!formData.jobPosition || !formData.workLocation || !formData.jobType) {
      alert("Please fill in all required fields in the job form.");
      setIsNext(false); // เด้งกลับไปหน้าแรกให้กรอกใหม่
      return;
    }

    // 2. ตรวจสอบความถูกต้องของข้อสอบ
    const isValid = questions.every((q) => q.text && q.correctIndex !== null);
    if (!isValid) {
      alert(
        "Please fill in all questions and select the correct answer for each.",
      );
      return;
    }

    try {
      // 🚀 จังหวะที่ 1: บันทึกข้อมูล Post ลง Database ก่อนเพื่อเอา postId
      const postResponse = await fetch("/api/posts/insertPost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!postResponse.ok) {
        const errorData = await postResponse.json();
        alert(`Failed to create post: ${errorData.message}`);
        return;
      }

      const postData = await postResponse.json();
      const insertedPostId = postData.postId; // ได้ postId มาใช้งานแล้ว

      // 🚀 จังหวะที่ 2: นำ insertedPostId ที่ได้ไปบันทึกชุดข้อสอบต่อทันที
      const questionResponse = await fetch("/api/question/createTest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: insertedPostId, questions }),
      });

      if (questionResponse.ok) {
        alert("Post and test created successfully! 🎉");

        // รีเซ็ตข้อมูล Form ทั้งหมดกลับเป็นค่าเริ่มต้น
        setFormData({
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

        // รีเซ็ตข้อสอบ
        setQuestions([
          { id: "1", text: "", options: ["", ""], correctIndex: null },
        ]);

        setPostId(null);
        setIsNext(false);
        fetchMyPosts(); // อัปเดตรายการงานล่าสุด
      } else {
        alert("Post created, but failed to create test. Please contact admin.");
      }
    } catch (error) {
      console.error("Error posting data:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // ── My Posts ───────────────────────────────────────────────────
  const fetchMyPosts = async () => {
    try {
      const response = await fetch("/api/posts/getPostbyCompanyId");
      const data = await response.json();
      if (Array.isArray(data)) {
        setMyPosts(data);
        console.log("Fetched posts:", data);
      } else if (data.posts && Array.isArray(data.posts)) {
        setMyPosts(data.posts);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const response = await fetch(`/api/posts/deletePost/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Post deleted successfully!");
        fetchMyPosts();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, []);

  // ── Question handlers ──────────────────────────────────────────
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        text: "",
        options: ["", ""],
        correctIndex: null,
      },
    ]);
  };

  const deleteQuestion = (qId: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== qId));
    }
  };

  const updateQuestionText = (qId: string, text: string) => {
    setQuestions(questions.map((q) => (q.id === qId ? { ...q, text } : q)));
  };

  const addOption = (qId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId ? { ...q, options: [...q.options, ""] } : q,
      ),
    );
  };

  const deleteOption = (qId: string, optIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId && q.options.length > 2) {
          const newOptions = q.options.filter((_, i) => i !== optIndex);
          let newCorrect = q.correctIndex;
          if (q.correctIndex === optIndex) {
            newCorrect = null;
          } else if (newCorrect !== null && newCorrect > optIndex) {
            newCorrect -= 1;
          }
          return { ...q, options: newOptions, correctIndex: newCorrect };
        }
        return q;
      }),
    );
  };

  const updateOptionText = (qId: string, optIndex: number, text: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const newOptions = [...q.options];
          newOptions[optIndex] = text;
          return { ...q, options: newOptions };
        }
        return q;
      }),
    );
  };

  const setCorrectAnswer = (qId: string, optIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === qId ? { ...q, correctIndex: optIndex } : q,
      ),
    );
  };

  // ── Render ─────────────────────────────────────────────────────
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
                      className={`${styles.statusBadge} ${
                        post.status === "Open" ? styles.open : styles.closed
                      }`}
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
        <div className={styles.postHeader}>
          {isNext ? (
            <button className={styles.nextBtn} onClick={() => setIsNext(false)}>
              Back
            </button>
          ) : (
            <h2 className={styles.myPostsTitle}>Create Posts</h2>
          )}

          {isNext ? (
            <button className={styles.nextBtn} onClick={handleSubmit}>
              Submit
            </button>
          ) : (
            <button className={styles.nextBtn} onClick={handleNext}>
              Next
            </button>
          )}
        </div>

        {/* Step 2: Questions */}
        {isNext ? (
          <div className={styles.container}>
            <div className={styles.headerRow}>
              <p className={styles.instruction}>
                Please ask at least 5 questions to gauge the applicant's
                attitude.
              </p>
            </div>

            <div className={styles.questionList}>
              {questions.map((q, qIndex) => (
                <div key={q.id} className={styles.questionBlock}>
                  <div className={styles.inputWrapper}>
                    <span className={styles.questionNumber}>{qIndex + 1}.</span>
                    <input
                      type="text"
                      placeholder="Enter your question here..."
                      className={styles.mainInput}
                      value={q.text}
                      onChange={(e) => updateQuestionText(q.id, e.target.value)}
                    />
                    <button
                      className={styles.deleteQuestionBtn}
                      onClick={() => deleteQuestion(q.id)}
                      title="Delete Question"
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
                          checked={q.correctIndex === optIndex}
                          onChange={() => setCorrectAnswer(q.id, optIndex)}
                          className={styles.radioInput}
                        />
                        <input
                          type="text"
                          placeholder="Option"
                          className={`${styles.optionInput} ${
                            q.correctIndex === optIndex ? styles.correct : ""
                          }`}
                          value={opt}
                          onChange={(e) =>
                            updateOptionText(q.id, optIndex, e.target.value)
                          }
                        />
                        {q.options.length > 2 && (
                          <button
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
              <button onClick={addQuestion} className={styles.addBtn}>
                + Add More Question
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: Job Form */
          <div className={styles.postForm}>
            {/* Left Column */}
            <div className={styles.formColumn}>
              <div className={styles.inputGroupInline}>
                <label>Job Position</label>
                <input
                  type="text"
                  name="jobPosition"
                  value={formData.jobPosition}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.inputGroupInline}>
                <label>Work Location</label>
                <input
                  type="text"
                  name="workLocation"
                  value={formData.workLocation}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.inputGroupInline}>
                <label>Salary Range</label>
                <input
                  type="number"
                  name="salary_min"
                  value={formData.salary_min}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                />
                -
                <input
                  type="number"
                  name="salary_max"
                  value={formData.salary_max}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                />
              </div>
              <div className={styles.inputGroupInline}>
                <label>Age Range</label>
                <input
                  type="number"
                  name="age_min"
                  value={formData.age_min}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                />
                -
                <input
                  type="number"
                  name="age_max"
                  value={formData.age_max}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                />
              </div>
              <div className={styles.inputGroupInline}>
                <label>Vacancy</label>
                <input
                  type="number"
                  name="vacancy"
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
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.inputGroupFull}>
                <label>Job Description</label>
                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  rows={6}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className={styles.formColumn}>
              <div className={styles.inputGroupFull}>
                <label>Qualifications</label>
                <textarea
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  rows={6}
                />
              </div>
              <div className={styles.inputGroupFull}>
                <label>Benefits</label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  rows={6}
                />
              </div>
              <div className={styles.inputGroupFull}>
                <label>How To Apply</label>
                <textarea
                  name="howToApply"
                  value={formData.howToApply}
                  onChange={handleChange}
                  rows={6}
                />
              </div>
              <div className={styles.inputGroupFull}>
                <label>Contact</label>
                <textarea
                  name="contact"
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
