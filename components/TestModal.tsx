"use client";

import { useEffect, useState } from "react";
import styles from "./ApplyModel.module.css";

interface Choice {
  choice_id: number;
  question_id: number;
  choice: string;
  correct?: number;
}

interface Question {
  question_id: number;
  post_id: number;
  question: string;
  choices: Choice[];
}

interface AnswerItem {
  choice_id: number;
  user_respond: string;
}

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  userId: number;
  companyName: string;
  seekerName: string;
  jobTitle: string;
  seekerEmail: string;
  companyEmail: string;
}

export default function TestModal(props: TestModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [questionId: number]: AnswerItem }>({});
  const [loading, setLoading] = useState(false);

  // State ป็อปอัพยืนยันก่อนส่ง และ ป็อปอัพสำเร็จ
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (props.isOpen && props.postId) {
      fetch(`/api/question/get-test?post_id=${props.postId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((data: Question[]) => setQuestions(data))
        .catch((err) => console.error("Error fetching questions:", err));
    }
  }, [props.isOpen, props.postId]);

  if (!props.isOpen) return null;

  const handleChoiceSelect = (
    questionId: number,
    choiceId: number,
    choiceText: string,
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { choice_id: choiceId, user_respond: choiceText },
    }));
  };

  // ตรวจสอบความครบถ้วนเมื่อผู้สมัครกดส่งแบบทดสอบ -> แสดงป็อปอัพยืนยัน
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      setErrorMsg(
        `กรุณาตอบคำถามให้ครบทุกข้อก่อนส่ง (ตอบแล้ว ${answeredCount}/${questions.length} ข้อ)`,
      );
      return;
    }

    // เมื่อตอบครบถ้วนแล้ว ให้แสดงป็อปอัพยืนยันก่อนส่งใบสมัคร
    setShowConfirm(true);
  };

  // กดยืนยันในป็อปอัพ -> ทำการส่งข้อมูลจริงไปยัง Backend API
  const handleConfirmSubmit = async () => {
    setLoading(true);
    setErrorMsg("");
    const formattedAnswers = Object.values(answers);

    try {
      const res = await fetch("/api/interview_tracking/submit-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: props.postId,
          userId: props.userId,
          companyName: props.companyName,
          seekerName: props.seekerName,
          seekerEmail: props.seekerEmail,
          companyEmail: props.companyEmail,
          jobTitle: props.jobTitle,
          answers: formattedAnswers,
        }),
      });

      if (res.ok) {
        setShowConfirm(false);
        setIsSuccess(true);
      } else {
        setShowConfirm(false);
        setErrorMsg("เกิดข้อผิดพลาดในการส่ง กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      console.error("Error submitting test:", error);
      setShowConfirm(false);
      setErrorMsg("ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับปุ่ม "ตกลง" ในป็อปอัพสำเร็จ
  const handleSuccessOk = () => {
    setIsSuccess(false);
    props.onClose();
    window.location.reload();
  };

  return (
    <>
      {/* --- ป็อปอัพทำแบบทดสอบหลัก --- */}
      <div className={styles.modalOverlay}>
        <div
          className={styles.modalContainer}
          style={{ maxWidth: "600px", maxHeight: "80vh", overflowY: "auto" }}
        >
          <h3 className={styles.modalTitle}>แบบทดสอบก่อนสมัครงาน</h3>
          <p style={{ color: "gray", marginBottom: "15px" }}>
            กรุณาทำแบบทดสอบให้ครบถ้วน ระบบจะส่งใบสมัครพร้อมผลทดสอบให้อัตโนมัติ
          </p>

          {/* แสดงแจ้งเตือนถ้าตอบไม่ครบ หรือมี Error */}
          {errorMsg && (
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f8d7da",
                color: "#842029",
                borderRadius: "5px",
                marginBottom: "15px",
                textAlign: "center",
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handlePreSubmit}>
            {questions.map((q, index) => (
              <div
                key={q.question_id}
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                }}
              >
                <p style={{ fontWeight: "bold", margin: "0 0 10px 0" }}>
                  {index + 1}. {q.question}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {q.choices?.map((c) => (
                    <label
                      key={c.choice_id}
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="radio"
                        name={`question_${q.question_id}`}
                        checked={answers[q.question_id]?.choice_id === c.choice_id}
                        onChange={() =>
                          handleChoiceSelect(
                            q.question_id,
                            c.choice_id,
                            c.choice,
                          )
                        }
                        required
                      />
                      {c.choice}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className={styles.buttonGroup} style={{ marginTop: "20px" }}>
              <button
                type="button"
                onClick={props.onClose}
                className={styles.btnCancel}
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={loading}
              >
                ส่งคำตอบและสมัครงาน
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- ป็อปอัพยืนยันก่อนส่งแบบทดสอบและใบสมัคร --- */}
      {showConfirm && (
        <div className={styles.modalOverlay} style={{ zIndex: 9998 }}>
          <div className={styles.confirmContainer}>
            <div className={styles.confirmIconWrapper}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "40px" }}
              >
                assignment_turned_in
              </span>
            </div>

            <h3 className={styles.confirmTitle}>
              ยืนยันการส่งแบบทดสอบและใบสมัคร
            </h3>
            <p className={styles.confirmSubtitle}>
              คุณได้ตอบแบบทดสอบครบถ้วน ({questions.length}/{questions.length} ข้อ)
            </p>

            {/* กล่องสรุปคำตอบที่ผู้สมัครเลือก */}
            <div className={styles.reviewSection}>
              <div className={styles.reviewHeader}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px", color: "#2563eb" }}
                >
                  fact_check
                </span>
                สรุปคำตอบที่คุณเลือก:
              </div>

              {questions.map((q, idx) => (
                <div key={q.question_id} className={styles.reviewItem}>
                  <div className={styles.reviewQuestion}>
                    ข้อ {idx + 1}: {q.question}
                  </div>
                  <div className={styles.reviewAnswer}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "16px" }}
                    >
                      check_circle
                    </span>
                    {answers[q.question_id]?.user_respond || "-"}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.confirmWarning}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px" }}
              >
                warning
              </span>
              เมื่อส่งแล้วจะไม่สามารถแก้ไขคำตอบได้อีก โปรดตรวจสอบให้แน่ใจ
            </div>

            <div className={styles.confirmButtonGroup}>
              <button
                type="button"
                className={styles.btnBack}
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                กลับไปแก้ไขคำตอบ
              </button>
              <button
                type="button"
                className={styles.btnConfirmAction}
                onClick={handleConfirmSubmit}
                disabled={loading}
              >
                {loading ? (
                  "กำลังส่งใบสมัคร..."
                ) : (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "18px" }}
                    >
                      send
                    </span>
                    ยืนยันส่งใบสมัคร
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ป็อปอัพสำเร็จ (ซ้อนขึ้นมาเมื่อส่งผ่าน) --- */}
      {isSuccess && (
        <div className={styles.modalOverlay} style={{ zIndex: 9999 }}>
          <div
            className={styles.modalContainer}
            style={{ maxWidth: "400px", textAlign: "center", padding: "30px" }}
          >
            <div style={{ marginBottom: "10px" }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "50px", color: "#FFB300" }}
              >
                celebration
              </span>
            </div>

            <h3 style={{ color: "#198754", margin: "0 0 10px 0" }}>สำเร็จ!</h3>
            <p style={{ color: "#555", marginBottom: "20px" }}>
              ทำแบบทดสอบและส่งใบสมัครสำเร็จแล้ว
            </p>
            <button
              className={styles.btnSubmit}
              style={{ width: "100%", padding: "10px" }}
              onClick={handleSuccessOk}
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
