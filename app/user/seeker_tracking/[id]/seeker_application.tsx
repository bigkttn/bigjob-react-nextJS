"use client";

import React, { useState } from "react";
import styles from "./seeker_tracking.module.css";
import { apiUrl } from "@/lib/hostURL";

export interface Recruiter {
  tracking_id: number;
  status: string;
  interview_message?: string;
  interview_date?: string;
  link?: string;
  location?: string;

  post_id: number;
  job_position: string;
  details?: string;
  rate?: number;
  preferred_qualifications?: string;
  Benefits?: string;
  province?: string;
  work_location?: string;
  vacancy?: number;
  how_to_apply?: string;
  contact?: string;
  job_type?: string;
  salary_min?: number;
  salary_max?: number;
  age_min?: number;
  age_max?: number;

  company_name?: string;
  company_email?: string;
  logo_image?: string;
}

interface ComponentProps {
  initialJobs: Recruiter[];
  userId: string; // รับ Email หรือชื่อผู้สมัครเข้ามา
}

const EXCLUDED_STATUSES = ["reject", "rejected", "cancle", "cancel", "canceled"];

const isExcludedStatus = (status?: string): boolean => {
  if (!status) return false;
  return EXCLUDED_STATUSES.includes(status.trim().toLowerCase());
};

export default function SeekerApplication({
  initialJobs,
  userId,
}: ComponentProps) {
  const validInitialJobs = (initialJobs || []).filter(
    (job) => !isExcludedStatus(job.status),
  );

  const [jobs, setJobs] = useState<Recruiter[]>(validInitialJobs);
  const [selectedJob, setSelectedJob] = useState<Recruiter | null>(
    validInitialJobs.length > 0 ? validInitialJobs[0] : null,
  );

  const [modalAction, setModalAction] = useState<"reject" | "cancel" | null>(null);
  const [targetTrackingId, setTargetTrackingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const visibleJobs = jobs.filter((job) => !isExcludedStatus(job.status));
  const activeSelectedJob =
    selectedJob && !isExcludedStatus(selectedJob.status)
      ? selectedJob
      : visibleJobs.length > 0
        ? visibleJobs[0]
        : null;

  const getStatusBadge = (status: string = "pending") => {
    const s = status.toLowerCase();
    if (s === "applied")
      return (
        <span
          className={`${styles.badge} ${styles.badgeApplied}`}
          style={{
            backgroundColor: "#0288d1",
            padding: "4px 12px",
            borderRadius: "12px",
            color: "#fff",
          }}
        >
          Applied
        </span>
      );
    if (s === "screening")
      return (
        <span
          className={`${styles.badge} ${styles.badgeScreening}`}
          style={{
            backgroundColor: "#ff9800",
            padding: "4px 12px",
            borderRadius: "12px",
            color: "#fff",
          }}
        >
          Screening
        </span>
      );
    if (s === "interview")
      return (
        <span
          className={`${styles.badge} ${styles.badgeInterview}`}
          style={{
            backgroundColor: "#9c27b0",
            padding: "4px 12px",
            borderRadius: "12px",
            color: "#fff",
          }}
        >
          Interview
        </span>
      );
    if (s === "offer" || s === "appointment" || s === "hired")
      return (
        <span
          className={`${styles.badge} ${styles.badgeOffer}`}
          style={{
            backgroundColor: "#2e7d32",
            padding: "4px 12px",
            borderRadius: "12px",
            color: "#fff",
          }}
        >
          Offer
        </span>
      );
    if (s === "rejected" || s === "reject")
      return (
        <span
          className={`${styles.badge} ${styles.badgeRejected}`}
          style={{
            backgroundColor: "#d32f2f",
            padding: "4px 12px",
            borderRadius: "12px",
            color: "#fff",
          }}
        >
          Rejected
        </span>
      );
    return (
      <span
        className={`${styles.badge} ${styles.badgePending}`}
        style={{
          backgroundColor: "#9e9e9e",
          padding: "4px 12px",
          borderRadius: "12px",
          color: "#fff",
        }}
      >
        Pending
      </span>
    );
  };

  const currentStatus = activeSelectedJob?.status?.toLowerCase() || "applied";

  const handleUpdateStatus = async (trackingId: number, newStatus: string) => {
    if (!activeSelectedJob) return;

    try {
      const response = await fetch(
        `${apiUrl}/api/interview_tracking/update-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingId: trackingId,
            status: newStatus,
            companyEmail: activeSelectedJob.company_email,
            seekerEmail: userId, // หรืออีเมลของ user จริงๆ
            companyName: activeSelectedJob.company_name,
            seekerName: "ผู้สมัคร",
            jobTitle: activeSelectedJob.job_position,
          }),
        },
      );

   if (response.ok) {
        const s = newStatus.toLowerCase();
        
        // ถ้าเป็น reject หรือ cancel ให้ลบออกจากหน้าจอ (State)
        if (isExcludedStatus(s)) {
          
          // เปลี่ยนจาก alert เป็น Toast Popup ลอยๆ
          if (s === "reject" || s === "rejected") {
            setToastMessage("คุณได้ปฏิเสธคำเชิญนี้เรียบร้อยแล้ว");
          } else {
            setToastMessage("คุณได้ยกเลิกใบสมัครนี้เรียบร้อยแล้ว");
          }
          // สั่งให้หายไปเองหลังจากผ่านไป 3 วินาที (3000 ms)
          setTimeout(() => {
            setToastMessage(null);
          }, 3000);

          // ลบงานนี้ออกจาก State (ทำให้หายไปจากหน้าจอทันที)
          setJobs((prevJobs) => {
            const updatedJobs = prevJobs.filter(
              (job) => job.tracking_id !== trackingId && !isExcludedStatus(job.status),
            );
            // สลับไปแสดงงานอื่นแทน ถ้ายกเลิก/ปฏิเสธงานที่กำลังเปิดดูอยู่
            if (activeSelectedJob && activeSelectedJob.tracking_id === trackingId) {
              setSelectedJob(updatedJobs.length > 0 ? updatedJobs[0] : null);
            }
            return updatedJobs;
          });

        } else {
          // ถ้าเป็นสถานะอื่น (เช่น applied, interview) ให้อัปเดตสถานะที่หน้าจอตามปกติ
          setJobs((prevJobs) =>
            prevJobs.map((job) =>
              job.tracking_id === trackingId ? { ...job, status: newStatus } : job,
            ),
          );
          if (activeSelectedJob && activeSelectedJob.tracking_id === trackingId) {
            setSelectedJob((prev) => (prev ? { ...prev, status: newStatus } : null));
          }
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleOpenRejectModel = (trackingId: number,actionType:"reject"|"cancel") => {
    setTargetTrackingId(trackingId);
    setModalAction(actionType);
  };

  const handleConfirmAction = async () => {
    if(targetTrackingId !== null && modalAction){
      await handleUpdateStatus(targetTrackingId, modalAction === "cancel" ? "cancel" : "reject");
      setModalAction(null);
      setTargetTrackingId(null);
    }
  };
  
  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        {/* Left Sidebar */}
        <aside className={styles.sidebar}>
          {visibleJobs.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px" }}>
              No applications found.
            </p>
          ) : (
            visibleJobs.map((job) => (
              <div
                key={job.tracking_id}
                className={`${styles.jobCard} ${activeSelectedJob?.tracking_id === job.tracking_id ? styles.selected : ""}`}
                onClick={() => setSelectedJob(job)}
              >
                <div className={styles.cardLeft}>
                  <img
                    src={
                      job.logo_image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company_name || "Company")}&background=random`
                    }
                    alt="company logo"
                    className={styles.sidebarLogo}
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/50";
                    }}
                  />
                  <div className={styles.cardDetails}>
                    <h4>{job.job_position || "Unknown Position"}</h4>
                    <p>{job.company_name || "Unknown Company"}</p>
                  </div>
                </div>
                <div className={styles.badgeContainer}>
                  {getStatusBadge(job.status)}
                </div>
              </div>
            ))
          )}
        </aside>

        {/* Right Panel */}
        {activeSelectedJob && (
          <section className={styles.rightPanel}>
            <div className={styles.trackerCard}>
              <div className={styles.stepperWrapper}>
                {/* Step 1: Applied */}
                <div className={`${styles.step} ${styles.active}`}>
                  <div className={styles.stepIcon}>📄</div>
                  <span>Applied</span>
                  {currentStatus === "pending" && (
                    <div
                      style={{
                        marginTop: "15px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#555",
                          margin: "0 0 10px 0",
                        }}
                      >
                        บริษัทรอการตอบกลับ
                      </p>
                      <div
                        className={styles.actionButtons}
                        style={{
                          padding: 0,
                          justifyContent: "center",
                          marginTop: 0,
                        }}
                      >
                        <button
                          className={styles.btnAccept}
                          onClick={() =>
                            handleUpdateStatus(
                              activeSelectedJob.tracking_id,
                              "applied",
                            )
                          }
                        >
                          <span className={styles.iconCheck}>✓</span> ตอบรับ
                        </button>
                        <button
                          className={styles.btnReject}
                          onClick={() =>
                            handleOpenRejectModel(activeSelectedJob.tracking_id,"reject")
                          }
                        >
                          <span className={styles.iconCross}>✕</span> ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  )}
                  {currentStatus === "applied" && (
                    <div
                      style={{
                        marginTop: "15px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#555",
                          margin: "0 0 10px 0",
                        }}
                      >
                        รอการตอบกลับจากบริษัท
                      </p>
                      <div
                        className={styles.actionButtons}
                        style={{
                          padding: 0,
                          justifyContent: "center",
                          marginTop: 0,
                        }}
                      >
                        <button
                          className={styles.btnReject}
                          onClick={() =>
                            handleOpenRejectModel(activeSelectedJob.tracking_id,"cancel")
                          }
                        >
                          <span className={styles.iconCross}>✕</span> ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className={`${styles.stepLine} ${["applied", "screening", "interview", "offer", "appointment", "hired"].includes(currentStatus) ? styles.activeLine : ""}`}
                />

                {/* Step 2: Screening */}
                <div
                  className={`${styles.step} ${["screening", "interview", "offer", "appointment", "hired"].includes(currentStatus) ? styles.active : ""}`}
                >
                  <div className={styles.stepIcon}>🔍</div>
                  <span>Screening</span>
                  {currentStatus === "screening" && (
                    <div
                      style={{
                        marginTop: "15px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        backgroundColor: "#f9f9f9",
                        padding: "10px",
                        borderRadius: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#333",
                          margin: "0 0 5px 0",
                          fontWeight: "bold",
                        }}
                      >
                        รายละเอียดนัดสัมภาษณ์
                      </p>
                      <p style={{ fontSize: "12px", margin: "0 0 5px 0" }}>
                        📅{" "}
                        {activeSelectedJob.interview_date
                          ? new Date(activeSelectedJob.interview_date).toLocaleString(
                              "th-TH",
                            )
                          : "-"}
                      </p>
                      <p style={{ fontSize: "12px", margin: "0 0 10px 0" }}>
                        📍 {activeSelectedJob.location || activeSelectedJob.link || "-"}
                      </p>
                      <div
                        className={styles.actionButtons}
                        style={{
                          padding: 0,
                          justifyContent: "center",
                          marginTop: 0,
                        }}
                      >
                        <button
                          className={styles.btnAccept}
                          onClick={() =>
                            handleUpdateStatus(
                              activeSelectedJob.tracking_id,
                              "interview",
                            )
                          }
                        >
                          <span className={styles.iconCheck}>✓</span> ยืนยันนัด
                        </button>
                        <button
                          className={styles.btnReject}
                          onClick={() => handleOpenRejectModel(activeSelectedJob.tracking_id,"reject")
                          }
                        >
                          <span className={styles.iconCross}>✕</span> ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className={`${styles.stepLine} ${["interview", "offer", "appointment", "hired"].includes(currentStatus) ? styles.activeLine : ""}`}
                />

                {/* Step 3: Interview */}
                <div
                  className={`${styles.step} ${["interview", "offer", "appointment", "hired"].includes(currentStatus) ? styles.active : ""}`}
                >
                  <div className={styles.stepIcon}>🎙️</div>
                  <span>Interview</span>
                </div>
                <div
                  className={`${styles.stepLine} ${["offer", "appointment", "hired"].includes(currentStatus) ? styles.activeLine : ""}`}
                />

                {/* Step 4: Offer */}
                <div
                  className={`${styles.step} ${["offer", "appointment", "hired"].includes(currentStatus) ? styles.active : ""}`}
                >
                  <div className={styles.stepIcon}>💼</div>
                  <span>Offer</span>
                </div>
              </div>
            </div>

            {/* Details Card (ด้านล่าง) */}
            <div className={styles.detailsCard}>
              <div className={styles.detailsHeader}>
                <img
                  src={
                    activeSelectedJob.logo_image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(activeSelectedJob.company_name || "Company")}&background=random`
                  }
                  alt="logo"
                  className={styles.detailsLogo}
                />
                <h2>{activeSelectedJob.company_name || "Unknown Company"}</h2>
              </div>
              <div className={styles.detailsGrid}>
                <div className={styles.leftCol}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Job Title</span>
                    <span className={styles.infoValue}>
                      {activeSelectedJob.job_position || "-"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Work Location</span>
                    <span className={styles.infoValue}>
                      {activeSelectedJob.work_location || activeSelectedJob.province || "-"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Salary</span>
                    <span className={styles.infoValue}>
                      {activeSelectedJob.salary_min && activeSelectedJob.salary_max
                        ? `${activeSelectedJob.salary_min.toLocaleString()} - ${activeSelectedJob.salary_max.toLocaleString()}`
                        : "-"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Rate</span>
                    <span className={styles.infoValue}>
                      {activeSelectedJob.rate || activeSelectedJob.vacancy || "-"}
                    </span>
                  </div>
                  <div className={styles.sectionBlock}>
                    <span className={styles.sectionTitle}>Details</span>
                    <p>{activeSelectedJob.details || "-"}</p>
                  </div>
                  <div className={styles.sectionBlock}>
                    <span className={styles.sectionTitle}>Qualifications</span>
                    <p>{activeSelectedJob.preferred_qualifications || "-"}</p>
                  </div>
                </div>
                <div className={styles.rightCol}>
                  <div className={styles.sectionBlock} style={{ marginTop: 0 }}>
                    <span className={styles.sectionTitle}>Benefits</span>
                    <p>{activeSelectedJob.Benefits || "-"}</p>
                  </div>
                  <div className={styles.sectionBlock}>
                    <span className={styles.sectionTitle}>Contact</span>
                    <p>{activeSelectedJob.contact || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Modal (ยกเลิก / ปฏิเสธ) */}
            {modalAction !== null && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <h3>
                    {modalAction === "cancel" ? "ยืนยันการยกเลิก" : "ยืนยันการปฏิเสธ"}
                  </h3>
                  <p>
                    {modalAction === "cancel"
                      ? "คุณแน่ใจหรือไม่ว่าต้องการยกเลิกใบสมัครงานนี้?"
                      : "คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำเชิญจากบริษัทนี้?"}
                  </p>
                  <div className={styles.modalActions}>
                    <button
                      className={styles.btnConfirm}
                      onClick={handleConfirmAction}
                    >
                      {modalAction === "cancel" ? "ใช่, ยกเลิก" : "ใช่, ปฏิเสธ"}
                    </button>
                    <button
                      className={styles.btnCancel}
                      onClick={() => setModalAction(null)}
                    >
                      ปิดหน้าต่าง
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
      {/* Toast Notification (ป็อปอัพวงรีลอยๆ) */}
      {toastMessage && (
        <div 
          style={{
            position: "fixed",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#ffffff",
            padding: "12px 32px",
            borderRadius: "50px", // ปรับให้เป็นวงรี
            fontSize: "15px",
            fontWeight: "500",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          <span style={{ color: "#ff4d4f", fontSize: "18px" }}>✕</span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
