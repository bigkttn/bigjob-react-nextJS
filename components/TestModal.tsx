"use client";

import { useEffect, useState } from "react";
import styles from "./ApplyModel.module.css"; 

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
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<{ [questionId: number]: any }>({});
  const [loading, setLoading] = useState(false);
  
  // +++ เพิ่ม State ควบคุมป็อปอัพสำเร็จ และแจ้งเตือน Error +++
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (props.isOpen && props.postId) {
      fetch(`/api/question/get-test?post_id=${props.postId}`)
        .then(res => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then(data => setQuestions(data))
        .catch(err => console.error("Error fetching questions:", err));
    }
  }, [props.isOpen, props.postId]);

  if (!props.isOpen) return null;

  const handleChoiceSelect = (questionId: number, choiceId: number, choiceText: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { choice_id: choiceId, user_respond: choiceText }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (Object.keys(answers).length < questions.length) {
      setErrorMsg("กรุณาตอบคำถามให้ครบทุกข้อก่อนส่ง");
      return;
    }

    setLoading(true);
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
          answers: formattedAnswers
        }),
      });

      if (res.ok) {
        // +++ เปลี่ยนจาก alert เป็นการเปิดป็อปอัพสำเร็จ +++
        setIsSuccess(true);
      } else {
        setErrorMsg("เกิดข้อผิดพลาดในการส่ง กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // +++ ฟังก์ชันสำหรับปุ่ม "ตกลง" ในป็อปอัพสำเร็จ +++
  const handleSuccessOk = () => {
    setIsSuccess(false);
    props.onClose();
    window.location.reload(); 
  };

  return (
    <>
      {/* --- ป็อปอัพทำแบบทดสอบหลัก --- */}
      <div className={styles.modalOverlay}>
        <div className={styles.modalContainer} style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
          <h3 className={styles.modalTitle}>แบบทดสอบก่อนสมัครงาน</h3>
          <p style={{ color: 'gray', marginBottom: '15px' }}>กรุณาทำแบบทดสอบให้ครบถ้วน ระบบจะส่งใบสมัครพร้อมผลทดสอบให้อัตโนมัติ</p>

          {/* แสดงแจ้งเตือนถ้าตอบไม่ครบ หรือมี Error */}
          {errorMsg && (
            <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '5px', marginBottom: '15px', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {questions.map((q, index) => (
              <div key={q.question_id} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>{index + 1}. {q.question}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.choices?.map((c: any) => (
                    <label key={c.choice_id} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="radio" 
                        name={`question_${q.question_id}`} 
                        onChange={() => handleChoiceSelect(q.question_id, c.choice_id, c.choice)}
                        required
                      />
                      {c.choice}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className={styles.buttonGroup} style={{ marginTop: '20px' }}>
              <button type="button" onClick={props.onClose} className={styles.btnCancel} disabled={loading}>ยกเลิก</button>
              <button type="submit" className={styles.btnSubmit} disabled={loading}>
                {loading ? "กำลังบันทึก..." : "ส่งคำตอบและสมัครงาน"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- ป็อปอัพสำเร็จ (ซ้อนขึ้นมาเมื่อส่งผ่าน) --- */}
      {isSuccess && (
        <div className={styles.modalOverlay} style={{ zIndex: 9999 }}>
          <div className={styles.modalContainer} style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
            <h3 style={{ color: '#198754', margin: '0 0 10px 0' }}>สำเร็จ!</h3>
            <p style={{ color: '#555', marginBottom: '20px' }}>ทำแบบทดสอบและส่งใบสมัครสำเร็จแล้ว</p>
            <button 
              className={styles.btnSubmit} 
              style={{ width: '100%', padding: '10px' }}
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