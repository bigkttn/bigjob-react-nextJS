"use client";

import React, { useEffect, useState } from "react";
import styles from "./TestResultModal.module.css";

interface ChoiceDetail {
  choiceId: number;
  choiceText: string;
  isCorrect: boolean;
  isSelected: boolean;
}

interface QuestionDetail {
  index: number;
  questionId: number;
  question: string;
  choices: ChoiceDetail[];
  selectedChoiceId: number | null;
  selectedChoiceText: string | null;
  correctChoiceText: string | null;
  isCorrect: boolean;
}

interface TestResultData {
  hasTest: boolean;
  hasSubmitted: boolean;
  message?: string;
  totalQuestions: number;
  score: number;
  scorePercentage: number;
  questions: QuestionDetail[];
}

interface TestResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingId: number | null;
  candidateName?: string;
  jobPosition?: string;
}

export default function TestResultModal({
  isOpen,
  onClose,
  trackingId,
  candidateName = "ผู้สมัคร",
  jobPosition = "ตำแหน่งงาน",
}: TestResultModalProps) {
  const [data, setData] = useState<TestResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !trackingId) {
      return;
    }

    let isMounted = true;
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/question/get-user-answers/${trackingId}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || "ไม่สามารถโหลดข้อมูลแบบทดสอบได้");
        }
        const json: TestResultData = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [isOpen, trackingId]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>
              <span
                className="material-symbols-outlined"
                style={{ color: "#2563eb", fontSize: "22px" }}
              >
                quiz
              </span>
              ผลการตอบแบบทดสอบ
            </h3>
            <p className={styles.modalSubtitle}>
              {candidateName} • ตำแหน่ง: {jobPosition}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {loading && (
            <div className={styles.stateContainer}>
              <div className={styles.spinner} />
              <p className={styles.stateText}>กำลังโหลดผลแบบทดสอบ...</p>
            </div>
          )}

          {error && !loading && (
            <div className={styles.stateContainer}>
              <span
                className={`material-symbols-outlined ${styles.stateIcon}`}
                style={{ color: "#dc2626" }}
              >
                error
              </span>
              <p className={styles.stateText} style={{ color: "#dc2626" }}>
                {error}
              </p>
            </div>
          )}

          {!loading && !error && data && !data.hasTest && (
            <div className={styles.stateContainer}>
              <span
                className={`material-symbols-outlined ${styles.stateIcon}`}
              >
                assignment_late
              </span>
              <p className={styles.stateText}>
                {data.message || "ไม่มีข้อมูลแบบทดสอบสำหรับตำแหน่งนี้"}
              </p>
            </div>
          )}

          {!loading && !error && data && data.hasTest && !data.hasSubmitted && (
            <div className={styles.stateContainer}>
              <span
                className={`material-symbols-outlined ${styles.stateIcon}`}
                style={{ color: "#f59e0b" }}
              >
                pending_actions
              </span>
              <p className={styles.stateText}>
                ผู้สมัครรายนี้ยังไม่ได้ส่งคำตอบแบบทดสอบ
              </p>
            </div>
          )}

          {!loading && !error && data && data.hasTest && data.hasSubmitted && (
            <>
              {/* Score Banner */}
              <div
                className={`${styles.scoreBanner} ${
                  data.scorePercentage >= 80
                    ? ""
                    : data.scorePercentage >= 50
                    ? styles.scoreBannerWarning
                    : styles.scoreBannerDanger
                }`}
              >
                <div className={styles.scoreInfo}>
                  <span className={styles.scoreLabel}>คะแนนที่ได้</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span className={styles.scoreNumber}>{data.score}</span>
                    <span className={styles.scoreTotal}>
                      / {data.totalQuestions} ข้อ
                    </span>
                  </div>
                </div>

                <div
                  className={`${styles.scoreBadge} ${
                    data.scorePercentage >= 80
                      ? styles.scoreBadgeHigh
                      : data.scorePercentage >= 50
                      ? styles.scoreBadgeMedium
                      : styles.scoreBadgeLow
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "18px" }}
                  >
                    {data.scorePercentage >= 50 ? "check_circle" : "cancel"}
                  </span>
                  {data.scorePercentage}% (
                  {data.scorePercentage >= 80
                    ? "ดีเยี่ยม"
                    : data.scorePercentage >= 50
                    ? "ผ่านเกณฑ์"
                    : "ต้องปรับปรุง"}
                  )
                </div>
              </div>

              {/* Questions List */}
              <div className={styles.questionList}>
                {data.questions.map((q) => (
                  <div key={q.questionId} className={styles.questionCard}>
                    <div className={styles.questionHeader}>
                      <h4 className={styles.questionTitle}>
                        {q.index}. {q.question}
                      </h4>
                      <span
                        className={`${styles.resultTag} ${
                          q.isCorrect
                            ? styles.resultTagCorrect
                            : styles.resultTagIncorrect
                        }`}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "16px" }}
                        >
                          {q.isCorrect ? "check" : "close"}
                        </span>
                        {q.isCorrect ? "ตอบถูกต้อง" : "ตอบไม่ถูกต้อง"}
                      </span>
                    </div>

                    <div className={styles.choiceList}>
                      {q.choices.map((c) => {
                        const isChosen = c.isSelected;
                        const isAnswerKey = c.isCorrect && !isChosen;

                        let itemClass = styles.choiceItem;
                        if (isChosen && c.isCorrect) {
                          itemClass = `${styles.choiceItem} ${styles.choiceSelectedCorrect}`;
                        } else if (isChosen && !c.isCorrect) {
                          itemClass = `${styles.choiceItem} ${styles.choiceSelectedIncorrect}`;
                        } else if (isAnswerKey) {
                          itemClass = `${styles.choiceItem} ${styles.choiceCorrectAnswer}`;
                        }

                        return (
                          <div key={c.choiceId} className={itemClass}>
                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                className="material-symbols-outlined"
                                style={{
                                  fontSize: "18px",
                                  color: isChosen
                                    ? c.isCorrect
                                      ? "#16a34a"
                                      : "#dc2626"
                                    : isAnswerKey
                                    ? "#16a34a"
                                    : "#94a3b8",
                                }}
                              >
                                {isChosen
                                  ? c.isCorrect
                                    ? "check_circle"
                                    : "cancel"
                                  : isAnswerKey
                                  ? "task_alt"
                                  : "radio_button_unchecked"}
                              </span>
                              {c.choiceText}
                            </span>

                            {isChosen && c.isCorrect && (
                              <span
                                className={`${styles.choiceTag} ${styles.tagCorrect}`}
                              >
                                คำตอบของผู้สมัคร
                              </span>
                            )}

                            {isChosen && !c.isCorrect && (
                              <span
                                className={`${styles.choiceTag} ${styles.tagIncorrect}`}
                              >
                                คำตอบของผู้สมัคร
                              </span>
                            )}

                            {isAnswerKey && (
                              <span
                                className={`${styles.choiceTag} ${styles.tagAnswerKey}`}
                              >
                                เฉลยข้อที่ถูกต้อง
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnClose}
            onClick={onClose}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
