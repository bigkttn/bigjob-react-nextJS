"use client";
import Swal from "sweetalert2";
import { FormEvent, useEffect, useState } from "react";
import styles from "./postjob.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "./getSession";
import ProvinceSelect from "@/components/ProvinceSelect";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number | null;
}

// ช่องที่รับได้เฉพาะจำนวนเต็มไม่ติดลบ
const NUMBER_FIELDS = [
  "salary_min",
  "salary_max",
  "age_min",
  "age_max",
  "vacancy",
];

// true เมื่อกรอกครบทั้งคู่ และ min มากกว่า max
const isMinOverMax = (min: string, max: string) =>
  min !== "" && max !== "" && Number(min) > Number(max);

// ช่องที่ต้องกรอกก่อนไปขั้นถัดไป (label ใช้แสดงในข้อความแจ้งเตือน)
const REQUIRED_FIELDS = [
  { name: "jobPosition", label: "ตำแหน่งงาน" },
  { name: "province", label: "จังหวัด" },
  { name: "workLocation", label: "สถานที่ทำงาน" },
  { name: "salary_min", label: "เงินเดือนขั้นต่ำ" },
  { name: "salary_max", label: "เงินเดือนสูงสุด" },
  { name: "age_min", label: "อายุขั้นต่ำ" },
  { name: "age_max", label: "อายุสูงสุด" },
  { name: "vacancy", label: "จำนวนที่รับ" },
  { name: "jobType", label: "รูปแบบงาน" },
  { name: "deadline", label: "วันปิดรับสมัคร" },
  { name: "jobDescription", label: "รายละเอียดงาน" },
  { name: "qualifications", label: "คุณสมบัติ" },
  { name: "benefits", label: "สวัสดิการ" },
  { name: "howToApply", label: "วิธีการสมัคร" },
  { name: "contact", label: "ข้อมูลติดต่อ" },
] as const;

type RequiredField = (typeof REQUIRED_FIELDS)[number]["name"];

// ข้อที่ไม่ได้กรอกอะไรเลย (ทั้งคำถามและตัวเลือก) ถือว่าไม่ใช้ จะไม่ถูกบันทึก
const isBlankQuestion = (q: Question) =>
  !q.text.trim() && q.options.every((opt) => !opt.trim());

// คืนข้อความ error ของข้อสอบที่กรอกไม่ครบ, คืน "" ถ้าครบ
const getQuestionError = (q: Question, questionNumber: number) => {
  if (!q.text.trim()) {
    return `ข้อสอบข้อ ${questionNumber}: กรุณากรอกคำถาม`;
  }
  if (q.options.some((opt) => !opt.trim())) {
    return `ข้อสอบข้อ ${questionNumber}: กรุณากรอกตัวเลือกให้ครบ หรือลบตัวเลือกที่ไม่ใช้`;
  }
  if (q.correctIndex === null) {
    return `ข้อสอบข้อ ${questionNumber}: กรุณาคลิกวงกลมเพื่อเลือกคำตอบที่ถูก`;
  }
  return "";
};

const requiredMark = <span style={{ color: "#dc2626" }}> *</span>;

const rangeErrorStyle = {
  color: "#dc2626",
  fontSize: "0.85rem",
  margin: "-4px 0 8px",
};

const PostJob = () => {
  const router = useRouter();
  const [isNext, setIsNext] = useState(false);
  // เปิดหลังกด "ถัดไป" แล้วกรอกไม่ครบ เพื่อไฮไลต์ช่องที่ยังว่าง
  const [showMissing, setShowMissing] = useState(false);
  const [postId, setPostId] = useState<number | null>(null);

  // เพิ่ม State สำหรับเก็บสถานะการยืนยันตัวตน (ค่าเริ่มต้นเป็นเท็จก่อนโหลดข้อมูลเสร็จ)
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewer, setViewer] = useState<any>(null);

  const [formData, setFormData] = useState({
    jobPosition: "",
    province: "",
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJobType, setFilterJobType] = useState("");

  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", text: "", options: ["", ""], correctIndex: null },
  ]);

  const blockInvalidKeys = (e: { key: string; preventDefault: () => void }) => {
    if (["e", "E", "+", "-", ".", "="].includes(e.key)) {
      e.preventDefault();
    }
  };

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

      // ระบุ ID ให้ตรงกับ Route ที่คุณมี (เช่น ดึงจาก Session/Context หรือ LocalStorage)
      // สมมติว่าบริษัทที่ล็อกอินอยู่คือ ID: 1
      // const companyId = 1;

      const userData = await getSession();

      // หากไม่มีข้อมูล Session ให้หยุดการทำงานและล็อกฟอร์ม
      if (!userData || !userData.id) {
        setIsApproved(false);
        setIsLoading(false);
        return;
      }
      const companyResponse = await fetch(
        `/api/company/getCompanyById/${userData.id}`,
      );
      // console.log(userData.id);

      //  เช็คก่อนแปลงเป็น JSON ว่าไม่ได้ส่ง HTML Error กลับมา
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

  let filteredPosts = myPosts.filter((post) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      post.job_position?.toLowerCase().includes(term) ||
      post.company_name?.toLowerCase().includes(term);
    const matchStatus = filterStatus ? post.status === filterStatus : true;
    const matchJobType = filterJobType ? post.job_type === filterJobType : true;
    return matchSearch && matchStatus && matchJobType;
  });

  // ── Form handlers (🔓 ทำงานเมื่อ Approved เท่านั้น) ──────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (!isApproved) return; // ล็อกถ้าไม่ Approved
    const { name } = e.target;
    let { value } = e.target;
    // ช่องตัวเลข: เก็บเฉพาะตัวเลข 0-9 (กันติดลบ/ทศนิยม ทั้งจากการพิมพ์ วาง และปุ่มลูกศร)
    if (NUMBER_FIELDS.includes(name)) {
      value = value.replace(/[^0-9]/g, "");
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // คืนข้อความ error ถ้าช่วงเงินเดือน/อายุ ใส่ min มากกว่า max
  const getRangeError = () => {
    if (isMinOverMax(formData.salary_min, formData.salary_max)) {
      return "เงินเดือนขั้นต่ำต้องไม่มากกว่าเงินเดือนสูงสุด";
    }
    if (isMinOverMax(formData.age_min, formData.age_max)) {
      return "อายุขั้นต่ำต้องไม่มากกว่าอายุสูงสุด";
    }
    if (formData.vacancy !== "" && Number(formData.vacancy) < 1) {
      return "จำนวนที่รับต้องอย่างน้อย 1 อัตรา";
    }
    return "";
  };

  const isFieldMissing = (name: RequiredField) => !formData[name].trim();

  // ชื่อช่องบังคับที่ยังไม่ได้กรอก
  const getMissingLabels = () =>
    REQUIRED_FIELDS.filter((field) => isFieldMissing(field.name)).map(
      (field) => field.label,
    );

  // ใส่กรอบแดงให้กลุ่มช่องที่ยังว่าง หลังจากผู้ใช้กด "ถัดไป" ไปแล้ว
  // ส่งได้หลายช่อง สำหรับกลุ่มแบบช่วง (ขั้นต่ำ - สูงสุด) ว่างช่องใดช่องหนึ่งก็ไฮไลต์
  const groupClass = (baseClass: string, ...names: RequiredField[]) => {
    if (showMissing && names.some(isFieldMissing)) {
      return `${baseClass} ${styles.fieldMissing}`;
    }
    return baseClass;
  };

  // ตรวจข้อมูลขั้นที่ 1 ทั้งหมด คืน true ถ้าผ่าน
  const validateJobForm = () => {
    const missing = getMissingLabels();
    if (missing.length > 0) {
      setShowMissing(true);
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        text: `ยังไม่ได้กรอก: ${missing.join(", ")}`,
      });
      return false;
    }
    const rangeError = getRangeError();
    if (rangeError) {
      Swal.fire(rangeError);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!isApproved) return;
    if (!validateJobForm()) return;
    setIsNext(true);
  };

  const handleSubmit = async () => {
    if (!isApproved) return;
    if (!validateJobForm()) {
      setIsNext(false);
      return;
    }

    for (const [index, q] of questions.entries()) {
      if (isBlankQuestion(q)) continue;
      const questionError = getQuestionError(q, index + 1);
      if (questionError) {
        Swal.fire(questionError);
        return;
      }
    }
    const usedQuestions = questions.filter((q) => !isBlankQuestion(q));

    setIsLoading(true);
    try {
      const response = await fetch("/api/posts/insertPost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        // console.log("Post created successfully:", data);
        setPostId(data.postId);
        // ไม่มีข้อสอบก็ไม่ต้องสร้าง (ถ้าสร้างชุดว่าง ระบบจะคิดว่างานนี้มีข้อสอบ)
        if (usedQuestions.length > 0) {
          const testResponse = await fetch("/api/question/createTest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              postId: data.postId,
              questions: usedQuestions,
            }),
          });
          if (!testResponse.ok) {
            const errorData = await testResponse.json();
            console.error("Error creating test:", errorData);
          }
        }
        // รีเฟรชรายการโพสต์หลังจากสร้างเสร็จ
        // setIsNext(false);
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error("Error creating post:", errorData);
        Swal.fire(
          errorData.message || "สร้างประกาศงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        );
      }
    } catch (error) {
      console.error("Error creating post:", error);
      Swal.fire("เกิดข้อผิดพลาดในการสร้างประกาศงาน กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
    // โค้ดส่งข้อมูลไปหลังบ้านของคุณ
    // console.log("Submitting...", formData, questions);
  };

  const handleDelete = async (id: number) => {
    if (!isApproved) {
      Swal.fire("ไม่สามารถลบได้เนื่องจากบัญชียังไม่ได้รับการอนุมัติ");
      return;
    }
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      text: "คุณแน่ใจหรือไม่ว่าต้องการลบประกาศงานนี้?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/deletePost/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // console.log("Post deleted successfully");
        // อัปเดตรายการโพสต์หลังจากลบ
        setMyPosts((prev) => prev.filter((post) => post.post_id !== id));
      } else {
        const errorData = await response.json();
        console.error("Error deleting post:", errorData);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      Swal.fire("เกิดข้อผิดพลาดในการลบประกาศงาน กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
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
      questions.map((q) => {
        if (q.id !== qId) return q;
        // เลื่อนคำตอบที่ถูกให้ยังชี้ตัวเลือกเดิม (ถ้าลบตัวที่เป็นคำตอบ ต้องเลือกใหม่)
        let correctIndex = q.correctIndex;
        if (correctIndex === optIndex) correctIndex = null;
        if (correctIndex !== null && correctIndex > optIndex) correctIndex -= 1;
        return {
          ...q,
          options: q.options.filter((_, i) => i !== optIndex),
          correctIndex,
        };
      }),
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
        <h2 className={styles.myPostsTitle}>โพสต์ของฉัน</h2>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "15px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="ค้นหาตำแหน่งงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              minWidth: "200px",
              outline: "none",
            }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              outline: "none",
            }}
          >
            <option value="">ทุกสถานะ</option>
            <option value="Open">Open</option>
            <option value="closed">Closed</option>
            <option value="banned">Banned</option>
          </select>
          <select
            value={filterJobType}
            onChange={(e) => setFilterJobType(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              outline: "none",
            }}
          >
            <option value="">ทุกประเภทงาน</option>
            <option value="Full-time">Full-time</option>
            <option value="Freelance">Freelance</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
        </div>

        <div className={styles.item}>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post: any) => (
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
                        <button className={styles.detailBtn}>
                          ดูรายละเอียด
                        </button>
                      </Link>
                      <button
                        className={styles.DeleteBtn}
                        style={btnStyle}
                        disabled={!isApproved}
                        onClick={() => handleDelete(post.post_id)}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.emptyText}>ไม่พบรายการประกาศงาน</p>
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
              ย้อนกลับ
            </button>
          ) : (
            <h2 className={styles.myPostsTitle}>
              สร้างประกาศงาน {isApproved ? "" : "(อ่านเท่านั้น)"}
            </h2>
          )}

          {isNext ? (
            <button
              className={styles.nextBtn}
              style={btnStyle}
              disabled={!isApproved}
              onClick={handleSubmit}
            >
              ยืนยัน
            </button>
          ) : (
            <button
              className={styles.nextBtn}
              style={btnStyle}
              disabled={!isApproved}
              onClick={handleNext}
            >
              ถัดไป
            </button>
          )}
        </div>

        {/* Step 2: Questions */}
        {isNext ? (
          <div className={styles.container}>
            <div className={styles.headerRow}>
              <p className={styles.instruction}>สร้างชุดข้อสอบคัดกรอง</p>
            </div>
            <p className={styles.formHint}>
              ไม่บังคับ — ถ้าไม่ต้องการข้อสอบ ปล่อยข้อที่ว่างไว้แล้วกด
              &quot;ยืนยัน&quot; ได้เลย ถ้าเริ่มกรอกข้อไหนแล้ว ต้องกรอกคำถาม
              ตัวเลือก และเลือกคำตอบที่ถูกให้ครบ
            </p>

            <div className={styles.questionList}>
              {questions.map((q, qIndex) => (
                <div key={q.id} className={styles.questionBlock}>
                  <div className={styles.inputWrapper}>
                    <span className={styles.questionNumber}>{qIndex + 1}</span>
                    <input
                      type="text"
                      placeholder="กรอกคำถามที่นี่..."
                      className={styles.mainInput}
                      style={inputStyle}
                      disabled={!isApproved}
                      value={q.text}
                      onChange={(e) => updateQuestionText(q.id, e.target.value)}
                    />
                    <button
                      className={styles.deleteQBtn}
                      style={btnStyle}
                      disabled={!isApproved}
                      onClick={() => deleteQuestion(q.id)}
                    >
                      ลบ
                    </button>
                  </div>

                  <div className={styles.optionsBox}>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className={styles.optionRow}>
                        <div
                          className={
                            q.correctIndex === optIndex
                              ? styles.radioCircleActive
                              : styles.radioCircle
                          }
                          style={
                            !isApproved
                              ? { opacity: 0.5, cursor: "not-allowed" }
                              : {}
                          }
                          onClick={() => {
                            if (isApproved) setCorrectAnswer(q.id, optIndex);
                          }}
                        />
                        <input
                          type="text"
                          placeholder={`ตัวเลือกที่ ${optIndex + 1}`}
                          disabled={!isApproved}
                          className={styles.optionInput}
                          style={inputStyle}
                          value={opt}
                          onChange={(e) =>
                            updateOptionText(q.id, optIndex, e.target.value)
                          }
                        />
                        {q.options.length > 2 && (
                          <button
                            disabled={!isApproved}
                            className={styles.deleteOptBtn}
                            style={btnStyle}
                            onClick={() => deleteOption(q.id, optIndex)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className={styles.testCardFooter}>
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
                        type="button"
                        disabled={!isApproved}
                        style={btnStyle}
                        className={styles.addOptBtn}
                        onClick={() => addOption(q.id)}
                      >
                        + เพิ่มตัวเลือก
                      </button>
                    )}
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
                + เพิ่มข้อสอบ
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: Job Form */
          <>
            <p className={styles.formHint}>
              ช่องที่มี {requiredMark} จำเป็นต้องกรอกให้ครบก่อนกด
              &quot;ถัดไป&quot;
            </p>
            <div className={styles.postForm}>
              <div className={styles.formColumn}>
                <div
                  className={groupClass(styles.inputGroupInline, "jobPosition")}
                >
                  <label>
                    ตำแหน่งงาน
                    {requiredMark}
                  </label>
                  <input
                    type="text"
                    name="jobPosition"
                    style={inputStyle}
                    disabled={!isApproved}
                    value={formData.jobPosition}
                    onChange={handleChange}
                  />
                </div>
                <div
                  className={groupClass(styles.inputGroupInline, "province")}
                >
                  <label>
                    จังหวัด
                    {requiredMark}
                  </label>
                  <ProvinceSelect
                    value={formData.province ?? ""}
                    onChange={(value: string) => {
                      if (!isApproved) return;
                      setFormData((prev) => ({ ...prev, province: value }));
                    }}
                  />
                </div>

                <div
                  className={groupClass(styles.inputGroupFull2, "workLocation")}
                >
                  <label>
                    สถานที่ทำงาน
                    {requiredMark}
                  </label>
                  <textarea
                    name="workLocation"
                    style={inputStyle}
                    disabled={!isApproved}
                    value={formData.workLocation}
                    onKeyDown={blockInvalidKeys}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                <div
                  className={groupClass(
                    styles.inputGroupInline,
                    "salary_min",
                    "salary_max",
                  )}
                >
                  <label>
                    ช่วงเงินเดือน
                    {requiredMark}
                  </label>
                  <input
                    type="number"
                    name="salary_min"
                    min={0}
                    disabled={!isApproved}
                    value={formData.salary_min}
                    onChange={handleChange}
                    onKeyDown={blockInvalidKeys}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                  -
                  <input
                    type="number"
                    name="salary_max"
                    min={0}
                    disabled={!isApproved}
                    value={formData.salary_max}
                    onChange={handleChange}
                    onKeyDown={blockInvalidKeys}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
                {isMinOverMax(formData.salary_min, formData.salary_max) && (
                  <p style={rangeErrorStyle}>
                    เงินเดือนขั้นต่ำต้องไม่มากกว่าเงินเดือนสูงสุด
                  </p>
                )}
                <div
                  className={groupClass(
                    styles.inputGroupInline,
                    "age_min",
                    "age_max",
                  )}
                >
                  <label>
                    ช่วงอายุ
                    {requiredMark}
                  </label>
                  <input
                    type="number"
                    name="age_min"
                    min={0}
                    disabled={!isApproved}
                    value={formData.age_min}
                    onKeyDown={blockInvalidKeys}
                    onChange={handleChange}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                  -
                  <input
                    type="number"
                    name="age_max"
                    min={0}
                    disabled={!isApproved}
                    value={formData.age_max}
                    onKeyDown={blockInvalidKeys}
                    onChange={handleChange}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
                {isMinOverMax(formData.age_min, formData.age_max) && (
                  <p style={rangeErrorStyle}>
                    อายุขั้นต่ำต้องไม่มากกว่าอายุสูงสุด
                  </p>
                )}
                <div className={groupClass(styles.inputGroupInline, "vacancy")}>
                  <label>
                    จำนวนที่รับ
                    {requiredMark}
                  </label>
                  <input
                    type="number"
                    name="vacancy"
                    min={0}
                    style={inputStyle}
                    disabled={!isApproved}
                    value={formData.vacancy}
                    onChange={handleChange}
                    onKeyDown={blockInvalidKeys}
                  />
                </div>
                <div className={groupClass(styles.inputGroupInline, "jobType")}>
                  <label>
                    รูปแบบงาน
                    {requiredMark}
                  </label>
                  <select
                    name="jobType"
                    value={formData.jobType}
                    className={styles.selectInput}
                    style={inputStyle}
                    disabled={!isApproved}
                    onChange={handleChange}
                  >
                    <option value="" disabled>
                      เลือกรุปแบบงาน
                    </option>
                    <option value="Full-time">Full-time</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div className={groupClass(styles.inputGroupFull, "deadline")}>
                  <label>
                    วันปิดรับสมัคร
                    {requiredMark}
                  </label>
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
                <div
                  className={groupClass(
                    styles.inputGroupFull,
                    "jobDescription",
                  )}
                >
                  <label>
                    รายละเอียดงาน
                    {requiredMark}
                  </label>
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
                <div
                  className={groupClass(
                    styles.inputGroupFull,
                    "qualifications",
                  )}
                >
                  <label>
                    คุณสมบัติ
                    {requiredMark}
                  </label>
                  <textarea
                    name="qualifications"
                    style={inputStyle}
                    disabled={!isApproved}
                    value={formData.qualifications}
                    onChange={handleChange}
                    rows={6}
                  />
                </div>
                <div className={groupClass(styles.inputGroupFull, "benefits")}>
                  <label>
                    สวัสดิการ
                    {requiredMark}
                  </label>
                  <textarea
                    name="benefits"
                    style={inputStyle}
                    disabled={!isApproved}
                    value={formData.benefits}
                    onChange={handleChange}
                    rows={6}
                  />
                </div>
                <div
                  className={groupClass(styles.inputGroupFull, "howToApply")}
                >
                  <label>
                    วิธีการสมัคร
                    {requiredMark}
                  </label>
                  <textarea
                    name="howToApply"
                    style={inputStyle}
                    disabled={!isApproved}
                    value={formData.howToApply}
                    onChange={handleChange}
                    rows={6}
                  />
                </div>
                <div className={groupClass(styles.inputGroupFull, "contact")}>
                  <label>
                    ข้อมูลติดต่อ
                    {requiredMark}
                  </label>
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
          </>
        )}
      </div>
    </div>
  );
};

export default PostJob;
