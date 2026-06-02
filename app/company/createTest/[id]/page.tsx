"use client";
import React, { useState } from "react";
import styles from "./createTest.module.css";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number | null; // เก็บ index ของข้อที่ถูก
}

const CreateTest = () => {
  const params = useParams();
  const router = useRouter();
  const postId = params.id;

  const handlePost = async () => {
    // Validation เบื้องต้น: ทุกข้อต้องมีคำถาม และต้องเลือกข้อที่ถูก
    const isValid = questions.every((q) => q.text && q.correctIndex !== null);
    if (!isValid) {
      alert(
        "Please fill in all questions and select the correct answer for each.",
      );
      return;
    }

    try {
      const response = await fetch("/api/question/createTest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, questions }),
      });
      if (response.ok) {
        alert("Test created successfully!");
        router.push("/company/post-job"); // เปลี่ยนเป็นหน้าแสดงรายละเอียดงานที่เหมาะสม
      } else {
        alert("Failed to create test. Please try again.");
      }
    } catch (error) {
      console.error("Error posting test:", error);
      alert("An error occurred while creating the test. Please try again.");
    }
  };
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", text: "", options: ["", ""], correctIndex: null },
  ]);

  // --- ฟังก์ชันจัดการ Question ---
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

  // --- ฟังก์ชันจัดการ Option ---
  const addOption = (qId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return { ...q, options: [...q.options, ""] };
        }
        return q;
      }),
    );
  };

  const deleteOption = (qId: string, optIndex: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId && q.options.length > 2) {
          const newOptions = q.options.filter((_, i) => i !== optIndex);

          let newCorrect = q.correctIndex;

          // กรณีที่ 1: ถ้าข้อที่ถูกลบ คือข้อเดียวกับที่เลือกไว้พอดี -> ให้รีเซ็ตเป็น null
          if (q.correctIndex === optIndex) {
            newCorrect = null;
          }
          // กรณีที่ 2: ถ้าข้อที่ถูกลบ อยู่ "ก่อนหน้า" ข้อที่เลือกไว้ -> ต้องขยับ Index ถอยหลัง 1 ตำแหน่ง
          // เพิ่มเงื่อนไขเช็ค !== null เพื่อให้ TS สบายใจ
          else if (newCorrect !== null && newCorrect > optIndex) {
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

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <p className={styles.instruction}>
          Please ask at least 5 questions to gauge the applicant's attitude.
        </p>
        {/* <Link href={"/company/detail-job"}> */}
        <button className={styles.postBtn} onClick={handlePost}>
          Post
        </button>
        {/* </Link> */}
      </div>

      <div className={styles.questionList}>
        {questions.map((q, qIndex) => (
          <div key={q.id} className={styles.questionBlock}>
            {/* ส่วนหัวคำถาม */}
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

            {/* ส่วนรายการตัวเลือก (Options) */}
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
                    placeholder={`Option ${optIndex + 1}`}
                    className={`${styles.optionInput} ${q.correctIndex === optIndex ? styles.correct : ""}`}
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
  );
};

export default CreateTest;
