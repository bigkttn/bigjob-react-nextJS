"use client";
import Swal from "sweetalert2";
import Link from "next/link";

import React, { useState, useMemo, useRef, useEffect } from "react";
import styles from "./seeker_tracking.module.css";

export interface Recruiter {
  tracking_id: number;
  status: string;
  interview_message?: string;
  interview_date?: string;
  date_time?: string;
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
  company_id?: number | string;
  company_email?: string;
  logo_image?: string;
  status_notification?: string;

  reviewRating: number;
  reviewComment: string;
}

interface ComponentProps {
  initialJobs: Recruiter[];
  userId: string; // รับ Email หรือชื่อผู้สมัครเข้ามา
}

const EXCLUDED_STATUSES: string[] = [];

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

  const [modalAction, setModalAction] = useState<"reject" | "cancel" | null>(
    null,
  );
  const [targetTrackingId, setTargetTrackingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState("");
  const [pendingFinalStatus, setPendingFinalStatus] = useState<
    "hired" | "reject" | null
  >(null);

  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // ปิด dropdown เมื่อคลิกพื้นที่ด้านนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  const visibleJobs = jobs.filter((job) => !isExcludedStatus(job.status));

  // ดึงรายการตำแหน่งงานที่ไม่ซ้ำกัน พร้อมจำนวนงานที่สมัครในแต่ละตำแหน่ง
  const availablePositions = useMemo(() => {
    const positionMap = new Map<string, number>();
    visibleJobs.forEach((job) => {
      const pos = job.job_position?.trim() || "ไม่ระบุตำแหน่ง";
      positionMap.set(pos, (positionMap.get(pos) || 0) + 1);
    });
    return Array.from(positionMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [visibleJobs]);

  // คัดกรองรายการงานที่สมัครตามตำแหน่งงานที่เลือกใน dropdown
  const filteredJobs = useMemo(() => {
    if (selectedPosition === "all") {
      return visibleJobs;
    }
    return visibleJobs.filter((job) => {
      const pos = job.job_position?.trim() || "ไม่ระบุตำแหน่ง";
      return pos === selectedPosition;
    });
  }, [visibleJobs, selectedPosition]);

  // งานที่เลือกในปัจจุบัน (สัมพันธ์กับรายการที่ผ่านการคัดกรอง)
  const activeSelectedJob = useMemo(() => {
    if (
      selectedJob &&
      !isExcludedStatus(selectedJob.status) &&
      filteredJobs.some((j) => j.tracking_id === selectedJob.tracking_id)
    ) {
      return selectedJob;
    }
    return filteredJobs.length > 0 ? filteredJobs[0] : null;
  }, [selectedJob, filteredJobs]);

  // จัดการเมื่อผู้ใช้เลือกตำแหน่งงานใน dropdown
  const handleSelectPosition = (newPosition: string) => {
    setSelectedPosition(newPosition);
    setIsFilterOpen(false);

    const nextFiltered =
      newPosition === "all"
        ? visibleJobs
        : visibleJobs.filter((job) => {
            const pos = job.job_position?.trim() || "ไม่ระบุตำแหน่ง";
            return pos === newPosition;
          });

    if (!nextFiltered.some((j) => j.tracking_id === selectedJob?.tracking_id)) {
      setSelectedJob(nextFiltered.length > 0 ? nextFiltered[0] : null);
    }
  };

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
          ยื่นใบสมัคร
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
          นัดสัมภาษณ์
        </span>
      );
    if (s === "interview")
      return (
        <span
          className={`${styles.badge} ${styles.badgeInterview}`}
          style={{
            backgroundColor: "#e49b08",
            padding: "4px 12px",
            borderRadius: "12px",
            color: "#fff",
          }}
        >
          สัมภาษณ์งาน
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
          ผลการพิจารณา
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
          ไม่ผ่านพิจารณา
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
        รอดำเนินการ
      </span>
    );
  };

  const currentStatus = activeSelectedJob?.status?.toLowerCase() || "applied";

  const handleDeleteTracking = async (trackingId: number) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      text: "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;
    try {
      const response = await fetch(
        `/api/interview_tracking/delete-tracking?tracking_id=${trackingId}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        setJobs((prev) => prev.filter((job) => job.tracking_id !== trackingId));
        if (selectedJob?.tracking_id === trackingId) {
          setSelectedJob(null);
        }
      } else {
        Swal.fire("เกิดข้อผิดพลาดในการลบรายการ");
      }
    } catch (error) {
      console.error("Error deleting tracking:", error);
    }
  };

  const handleCardClick = async (job: Recruiter) => {
    setSelectedJob(job);
    if (
      job.status_notification === "unread_user" ||
      job.status_notification === "unread_both"
    ) {
      try {
        await fetch("/api/interview_tracking/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingId: job.tracking_id,
            userType: "user",
          }),
        });
        setJobs((prev) =>
          prev.map((j) =>
            j.tracking_id === job.tracking_id
              ? {
                  ...j,
                  status_notification:
                    j.status_notification === "unread_both"
                      ? "unread_company"
                      : "read",
                }
              : j,
          ),
        );
        window.dispatchEvent(new Event("refreshNotifications"));
      } catch (error) {
        console.error("Failed to mark as read", error);
      }
    }
  };

  const handleUpdateStatus = async (
    trackingId: number,
    newStatus: string,
    reviewData?: { rating: number; comment: string },
  ) => {
    if (!activeSelectedJob) return;

    try {
      const response = await fetch(
        `/api/interview_tracking/update-status`,
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
            reviewRating: reviewData?.rating, // <--- ส่งค่ารีวิวพ่วงไป
            reviewComment: reviewData?.comment, // <--- ส่งค่าคอมเมนต์พ่วงไป
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
              (job) =>
                job.tracking_id !== trackingId && !isExcludedStatus(job.status),
            );
            // สลับไปแสดงงานอื่นแทน ถ้ายกเลิก/ปฏิเสธงานที่กำลังเปิดดูอยู่
            if (
              activeSelectedJob &&
              activeSelectedJob.tracking_id === trackingId
            ) {
              setSelectedJob(updatedJobs.length > 0 ? updatedJobs[0] : null);
            }
            return updatedJobs;
          });
        } else {
          // ถ้าเป็นสถานะอื่น (เช่น applied, interview, hired) ให้อัปเดตสถานะที่หน้าจอตามปกติ
          if (newStatus === "hired") {
            setToastMessage("คุณได้ตอบรับข้อเสนองานเรียบร้อยแล้ว!");
            setTimeout(() => {
              setToastMessage(null);
            }, 3000);
          }

          setJobs((prevJobs) =>
            prevJobs.map((job) =>
              job.tracking_id === trackingId
                ? { ...job, status: newStatus }
                : job,
            ),
          );
          if (
            activeSelectedJob &&
            activeSelectedJob.tracking_id === trackingId
          ) {
            setSelectedJob((prev) =>
              prev ? { ...prev, status: newStatus } : null,
            );
          }
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleOpenRejectModel = (
    trackingId: number,
    actionType: "reject" | "cancel",
  ) => {
    setTargetTrackingId(trackingId);
    setModalAction(actionType);
  };

  const handleConfirmAction = async () => {
    if (targetTrackingId !== null && modalAction) {
      await handleUpdateStatus(
        targetTrackingId,
        modalAction === "cancel" ? "cancel" : "reject",
      );
      setModalAction(null);
      setTargetTrackingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        {/* Left Sidebar */}
        <aside className={styles.sidebar}>
          {/* แถบตัวกรองตำแหน่งงาน (มีเพียงไอคอน filter เมื่อคลิกจึงแสดง dropdown รายการตำแหน่งงาน) */}
          <div className={styles.filterTopBar}>
            {selectedPosition !== "all" && (
              <div className={styles.activeFilterChip}>
                <span className={styles.activeFilterText}>
                  {selectedPosition}
                </span>
                <button
                  type="button"
                  className={styles.clearChipBtn}
                  onClick={() => handleSelectPosition("all")}
                  title="ล้างตัวกรอง"
                >
                  ✕
                </button>
              </div>
            )}

            <div className={styles.filterDropdownWrapper} ref={filterRef}>
              <button
                type="button"
                className={`${styles.filterIconButton} ${isFilterOpen || selectedPosition !== "all" ? styles.filterIconActive : ""}`}
                onClick={() => setIsFilterOpen((prev) => !prev)}
                title="คัดกรองตำแหน่งงาน"
                aria-label="คัดกรองตำแหน่งงาน"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  filter_alt
                </span>
                {selectedPosition !== "all" && (
                  <span className={styles.filterActiveDot} />
                )}
              </button>

              {isFilterOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>
                    <span>เลือกตำแหน่งงาน</span>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                      ({availablePositions.length} ตำแหน่ง)
                    </span>
                  </div>
                  <div className={styles.dropdownList}>
                    <button
                      type="button"
                      className={`${styles.dropdownItem} ${selectedPosition === "all" ? styles.selectedItem : ""}`}
                      onClick={() => handleSelectPosition("all")}
                    >
                      <span className={styles.itemText}>ทุกตำแหน่งงาน</span>
                      <span className={styles.itemCount}>
                        ({visibleJobs.length})
                      </span>
                      {selectedPosition === "all" && (
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: "16px",
                            color: "#2563eb",
                            marginLeft: "auto",
                          }}
                        >
                          check
                        </span>
                      )}
                    </button>

                    {availablePositions.map(({ name, count }) => (
                      <button
                        key={name}
                        type="button"
                        className={`${styles.dropdownItem} ${selectedPosition === name ? styles.selectedItem : ""}`}
                        onClick={() => handleSelectPosition(name)}
                      >
                        <span className={styles.itemText}>{name}</span>
                        <span className={styles.itemCount}>({count})</span>
                        {selectedPosition === name && (
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: "16px",
                              color: "#2563eb",
                              marginLeft: "auto",
                            }}
                          >
                            check
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#666",
                fontSize: "14px",
              }}
            >
              {visibleJobs.length === 0
                ? "ไม่พบข้อมูลการสมัครงาน"
                : `ไม่พบตำแหน่งงาน "${selectedPosition}"`}
            </p>
          ) : (
            filteredJobs.map((job) => {
              const isUnread =
                job.status_notification === "unread_user" ||
                job.status_notification === "unread_both";
              return (
                <div
                  key={job.tracking_id}
                  className={`${styles.jobCard} ${activeSelectedJob?.tracking_id === job.tracking_id ? styles.selected : ""}`}
                  style={{
                    cursor: isUnread ? "pointer" : "default",
                    backgroundColor: isUnread ? "#fff7ed" : undefined,
                    borderColor: isUnread ? "#ffedd5" : undefined,
                    borderWidth: isUnread ? "1px" : undefined,
                    borderStyle: isUnread ? "solid" : undefined,
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => handleCardClick(job)}
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
                      <h4>{job.job_position || "ไม่ระบุตำแหน่ง"}</h4>
                      <p>{job.company_name || "ไม่ระบุบริษัท"}</p>
                    </div>
                  </div>
                  <div
                    className={styles.badgeContainer}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      alignItems: "flex-end",
                    }}
                  >
                    {getStatusBadge(job.status)}
                  </div>
                </div>
              );
            })
          )}
        </aside>

        {/* Right Panel */}
        {activeSelectedJob && (
          <section className={styles.rightPanel}>
            <div className={styles.trackerCard}>
              <div className={styles.stepperWrapper}>
                {/* Step 1: Applied */}
                <div
                  className={`${styles.step} ${styles.active} ${["pending", "applied"].includes(currentStatus) ? styles.currentStep : ""}`}
                >
                  <div className={styles.stepIcon}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "24px" }}
                    >
                      description
                    </span>
                  </div>
                  <span
                    style={{
                      display: "block",
                      width: "120px",
                      textAlign: "center",
                      lineHeight: "1.3",
                    }}
                  >
                    ยื่นใบสมัคร
                  </span>
                  {currentStatus === "pending" && (
                    <div
                      style={{
                        marginTop: "15px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        backgroundColor: "#ffffff",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: "1.5px solid #2e7d32",
                        boxShadow: "0 6px 18px rgba(46, 125, 50, 0.12)",
                        width: "10rem",
                        boxSizing: "border-box",
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
                            handleOpenRejectModel(
                              activeSelectedJob.tracking_id,
                              "reject",
                            )
                          }
                        >
                          <span className={styles.iconCross}>✕</span> ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  )}
                  {currentStatus === "applied" && (
                    <>
                      <div
                        style={{
                          marginTop: "15px",
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#ffffff",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          border: "1.5px solid #2e7d32",
                          boxShadow: "0 6px 18px rgba(46, 125, 50, 0.12)",
                          width: "11rem",
                          boxSizing: "border-box",
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
                      </div>
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
                            handleOpenRejectModel(
                              activeSelectedJob.tracking_id,
                              "cancel",
                            )
                          }
                        >
                          <span className={styles.iconCross}>✕</span> ยกเลิก
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div
                  className={`${styles.stepLine} ${["", "screening", "interview", "offer", "appointment", "hired"].includes(currentStatus) ? styles.activeLine : ""}`}
                />

                {/* Step 2: Screening */}
                <div
                  className={`${styles.step} ${["screening", "interview", "offer", "appointment", "hired"].includes(currentStatus) ? styles.active : ""} ${currentStatus === "screening" ? styles.currentStep : ""}`}
                >
                  <div className={styles.stepIcon}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "24px" }}
                    >
                      search
                    </span>
                  </div>
                  <span
                    style={{
                      display: "block",
                      width: "120px",
                      textAlign: "center",
                      lineHeight: "1.3",
                    }}
                  >
                    นัดสัมภาษณ์
                  </span>
                  {currentStatus === "screening" && (
                    <div
                      style={{
                        marginTop: "15px",
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#ffffff",
                        padding: "15px",
                        borderRadius: "12px",
                        border: "1.5px solid #2e7d32",
                        boxShadow:
                          "0 6px 18px rgba(46, 125, 50, 0.15), 0 2px 4px rgba(0,0,0,0.04)",
                        width: "100%",
                        maxWidth: "240px",
                        boxSizing: "border-box",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#333",
                          margin: "0 0 12px 0",
                          fontWeight: "bold",
                          textAlign: "center",
                          borderBottom: "1px solid #f0f0f0",
                          paddingBottom: "8px",
                        }}
                      >
                        รายละเอียดนัดสัมภาษณ์
                      </p>

                      {/* ส่วนแสดงวันที่ */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: "18px",
                            color: "#1976d2",
                            flexShrink: 0,
                          }}
                        >
                          event
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#555",
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {activeSelectedJob.interview_date
                            ? new Date(
                                activeSelectedJob.interview_date,
                              ).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "ไม่ระบุวันที่"}
                        </span>
                      </div>

                      {/* ⏰ ส่วนแสดงเวลา */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: "18px",
                            color: "#ed6c02",
                            flexShrink: 0,
                          }}
                        >
                          schedule
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#555",
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {activeSelectedJob.interview_date
                            ? new Date(
                                activeSelectedJob.interview_date,
                              ).toLocaleTimeString("th-TH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }) + " น."
                            : "ไม่ระบุเวลา"}
                        </span>
                      </div>

                      {/* 📍 ส่วนแสดงสถานที่ (หมุด) หรือ ลิงก์ออนไลน์ (กล้อง) */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "15px",
                          width: "100%",
                        }}
                      >
                        {activeSelectedJob.link ? (
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: "18px",
                              color: "#000000",
                              flexShrink: 0,
                            }}
                          >
                            video_chat
                          </span>
                        ) : (
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: "18px",
                              color: "#000000",
                              flexShrink: 0,
                            }}
                          >
                            distance
                          </span>
                        )}
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: "13px",
                            color: "#555",
                          }}
                        >
                          {activeSelectedJob.link ? (
                            <a
                              href={
                                activeSelectedJob.link.startsWith("http")
                                  ? activeSelectedJob.link
                                  : `https://${activeSelectedJob.link}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              title={activeSelectedJob.link}
                              style={{
                                color: "#0288d1",
                                textDecoration: "underline",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {activeSelectedJob.link}
                            </a>
                          ) : activeSelectedJob.location ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeSelectedJob.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={activeSelectedJob.location}
                              style={{
                                color: "#0288d1",
                                textDecoration: "underline",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {activeSelectedJob.location}
                            </a>
                          ) : (
                            <span
                              style={{
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              ไม่ระบุสถานที่
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ปุ่มกดยืนยัน / ปฏิเสธ */}
                      <div
                        className={styles.actionButtons}
                        style={{
                          padding: 0,
                          justifyContent: "center",
                          marginTop: "5px",
                          display: "flex",
                          gap: "10px",
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
                          onClick={() =>
                            handleOpenRejectModel(
                              activeSelectedJob.tracking_id,
                              "reject",
                            )
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
                  className={`${styles.step} ${["interview", "offer", "appointment", "hired"].includes(currentStatus) ? styles.active : ""} ${currentStatus === "interview" ? styles.currentStep : ""}`}
                >
                  <div className={styles.stepIcon}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "24px" }}
                    >
                      mic
                    </span>
                  </div>
                  <span
                    style={{
                      display: "block",
                      width: "120px",
                      textAlign: "center",
                      lineHeight: "1.3",
                    }}
                  >
                    สัมภาษณ์งาน
                  </span>
                  {currentStatus === "interview" && (
                    <div
                      style={{
                        marginTop: "15px",
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#ffffff",
                        padding: "15px",
                        borderRadius: "12px",
                        border: "1.5px solid #2e7d32",
                        boxShadow:
                          "0 6px 18px rgba(46, 125, 50, 0.15), 0 2px 4px rgba(0,0,0,0.04)",
                        width: "100%",
                        maxWidth: "240px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#333",
                          margin: "0 0 12px 0",
                          fontWeight: "bold",
                          textAlign: "center",
                          borderBottom: "1px solid #f0f0f0", // ตรงนี้มีขีดเส้นใต้อยู่แล้ว 1 เส้น
                          paddingBottom: "8px",
                        }}
                      >
                        รายละเอียดนัดสัมภาษณ์
                        <hr
                          style={{
                            border: "0",
                            borderTop: "1px solid #e0e0e0",
                            margin: "8px 0",
                          }}
                        />
                        <span
                          style={{
                            whiteSpace: "pre-line",
                            fontSize: "12px",
                            color: "#959595",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start", // แนะนำให้ใช้ flex-start แทน start เพื่อป้องกันบั๊กในบางเบราว์เซอร์
                            marginBottom: "5px",
                          }}
                        >
                          โปรดไปตามที่นัดหมาย
                        </span>
                      </div>
                      {/* ส่วนแสดงวันที่ */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: "18px",
                            color: "#1976d2",
                            flexShrink: 0,
                          }}
                        >
                          event
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#555",
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {activeSelectedJob.interview_date
                            ? new Date(
                                activeSelectedJob.interview_date,
                              ).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "ไม่ระบุวันที่"}
                        </span>
                      </div>

                      {/* ⏰ ส่วนแสดงเวลา */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: "18px",
                            color: "#ed6c02",
                            flexShrink: 0,
                          }}
                        >
                          schedule
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#555",
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {activeSelectedJob.interview_date
                            ? new Date(
                                activeSelectedJob.interview_date,
                              ).toLocaleTimeString("th-TH", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }) + " น."
                            : "ไม่ระบุเวลา"}
                        </span>
                      </div>

                      {/* 📍 ส่วนแสดงสถานที่ (หมุด) หรือ ลิงก์ออนไลน์ (กล้อง) */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "15px",
                          width: "100%",
                        }}
                      >
                        {activeSelectedJob.link ? (
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: "18px",
                              color: "#000000",
                              flexShrink: 0,
                            }}
                          >
                            video_chat
                          </span>
                        ) : (
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: "18px",
                              color: "#000000",
                              flexShrink: 0,
                            }}
                          >
                            distance
                          </span>
                        )}
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: "13px",
                            color: "#555",
                          }}
                        >
                          {activeSelectedJob.link ? (
                            <a
                              href={
                                activeSelectedJob.link.startsWith("http")
                                  ? activeSelectedJob.link
                                  : `https://${activeSelectedJob.link}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              title={activeSelectedJob.link}
                              style={{
                                color: "#0288d1",
                                textDecoration: "underline",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {activeSelectedJob.link}
                            </a>
                          ) : activeSelectedJob.location ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeSelectedJob.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={activeSelectedJob.location}
                              style={{
                                color: "#0288d1",
                                textDecoration: "underline",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {activeSelectedJob.location}
                            </a>
                          ) : (
                            <span
                              style={{
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              ไม่ระบุสถานที่
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ปุ่มกดยืนยัน / ปฏิเสธ */}
                      <div
                        className={styles.actionButtons}
                        style={{
                          padding: 0,
                          justifyContent: "center",
                          marginTop: "5px",
                          display: "flex",
                          gap: "10px",
                        }}
                      >
                        <button
                          className={styles.btnReject}
                          onClick={() =>
                            handleOpenRejectModel(
                              activeSelectedJob.tracking_id,
                              "cancel",
                            )
                          }
                        >
                          <span className={styles.iconCross}>✕</span> ยกเลิกนัด
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div
                  className={`${styles.stepLine} ${["offer", "appointment", "hired"].includes(currentStatus) ? styles.activeLine : ""}`}
                />

                {/* Step 4: Offer */}
                <div
                  className={`${styles.step} ${["offer", "appointment", "hired"].includes(currentStatus) ? styles.active : ""} ${["offer", "appointment", "hired"].includes(currentStatus) ? styles.currentStep : ""}`}
                >
                  <div className={styles.stepIcon}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "24px" }}
                    >
                      work
                    </span>
                  </div>
                  <span
                    style={{
                      display: "block",
                      width: "120px",
                      textAlign: "center",
                      lineHeight: "1.3",
                    }}
                  >
                    ผลการพิจารณา
                  </span>

                  {(currentStatus === "offer" ||
                    currentStatus === "appointment") && (
                    <div
                      style={{
                        marginTop: "15px",
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#ffffff",
                        padding: "15px",
                        borderRadius: "12px",
                        border: "1.5px solid #2e7d32",
                        boxShadow:
                          "0 6px 18px rgba(46, 125, 50, 0.15), 0 2px 4px rgba(0,0,0,0.04)",
                        width: "10rem",

                        boxSizing: "border-box",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#2e7d32",
                          margin: "0 0 12px 0",
                          fontWeight: "bold",
                          textAlign: "center",
                          borderBottom: "1px solid #f0f0f0",
                          paddingBottom: "8px",
                        }}
                      >
                        ข้อเสนอรับเข้าทำงาน
                      </p>

                      {/* 📅 แสดงวันที่เสนองาน / วันเริ่มงาน */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "15px",
                          width: "100%",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: "18px",
                            color: "#2e7d32",
                            flexShrink: 0,
                          }}
                        >
                          event_available
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#888",
                              display: "block",
                            }}
                          >
                            วันเริ่มงาน / ข้อเสนอ:
                          </span>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#333",
                              fontWeight: "500",
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={
                              activeSelectedJob.interview_date
                                ? new Date(
                                    activeSelectedJob.interview_date,
                                  ).toLocaleDateString("th-TH", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : activeSelectedJob.date_time
                                  ? new Date(
                                      activeSelectedJob.date_time,
                                    ).toLocaleDateString("th-TH", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "ตามที่บริษัทกำหนด"
                            }
                          >
                            {activeSelectedJob.interview_date
                              ? new Date(
                                  activeSelectedJob.interview_date,
                                ).toLocaleDateString("th-TH", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : activeSelectedJob.date_time
                                ? new Date(
                                    activeSelectedJob.date_time,
                                  ).toLocaleDateString("th-TH", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "ตามที่บริษัทกำหนด"}
                          </span>
                        </div>
                      </div>

                      {/* ปุ่ม ตกลง และ ปฏิเสธ */}
                      <div
                        className={styles.actionButtons}
                        style={{
                          padding: 0,
                          justifyContent: "center",
                          marginTop: "5px",
                          display: "flex",
                          gap: "10px",
                        }}
                      >
                        <button
                          className={styles.btnAccept}
                          onClick={() => {
                            setPendingFinalStatus("hired");
                            setIsReviewModalOpen(true);
                          }}
                        >
                          <span className={styles.iconCheck}>✓</span> ตกลง
                        </button>
                        <button
                          className={styles.btnReject}
                          onClick={() => {
                            setPendingFinalStatus("reject");
                            setIsReviewModalOpen(true);
                          }}
                        >
                          <span className={styles.iconCross}>✕</span> ปฏิเสธ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* เมื่อผู้สมัครกดตอบรับแล้ว (status === "hired") */}
                  {currentStatus === "hired" && (
                    <div
                      style={{
                        marginTop: "15px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        backgroundColor: "#e8f5e9",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #c8e6c9",
                        maxWidth: "240px",
                        boxSizing: "border-box",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "24px",
                          color: "#2e7d32",
                          marginBottom: "4px",
                        }}
                      >
                        verified
                      </span>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#2e7d32",
                          fontWeight: "bold",
                          margin: 0,
                          textAlign: "center",
                        }}
                      >
                        ตอบรับเข้าทำงานแล้ว
                      </p>
                      {(activeSelectedJob.interview_date ||
                        activeSelectedJob.date_time) && (
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#555",
                            margin: "4px 0 0 0",
                            textAlign: "center",
                          }}
                        >
                          วันเริ่มงาน:{" "}
                          {new Date(
                            activeSelectedJob.interview_date ||
                              activeSelectedJob.date_time!,
                          ).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details Card (ด้านล่าง) */}
            <div className={styles.detailsCard}>
              <div className={styles.detailsHeader}>
                <Link
                  href={`/user/userProfileCompany/${activeSelectedJob.company_id}`}
                >
                  <img
                    src={
                      activeSelectedJob.logo_image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(activeSelectedJob.company_name || "Company")}&background=random`
                    }
                    alt="logo"
                    className={styles.detailsLogo}
                  />
                </Link>
                <Link
                  href={`/user/userProfileCompany/${activeSelectedJob.company_id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <h2>{activeSelectedJob.company_name || "ไม่ระบุบริษัท"}</h2>
                </Link>
                {(currentStatus === "reject" ||
                  currentStatus === "rejected" ||
                  currentStatus === "cancel" ||
                  currentStatus === "canceled") && (
                  <button
                    onClick={() =>
                      handleDeleteTracking(activeSelectedJob.tracking_id)
                    }
                    style={{
                      marginLeft: "auto",
                      padding: "6px 12px",
                      backgroundColor: "#ffebee",
                      color: "#d32f2f",
                      border: "1px solid #d32f2f",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    ลบรายการ
                  </button>
                )}
              </div>
              <div className={styles.detailsGrid}>
                <div className={styles.leftCol}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>ตำแหน่งงาน</span>
                    <span className={styles.infoValue}>
                      {activeSelectedJob.job_position || "-"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>สถานที่ทำงาน</span>
                    <span className={styles.infoValue}>
                      {activeSelectedJob.work_location ||
                        activeSelectedJob.province ||
                        "-"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>เงินเดือน</span>
                    <span className={styles.infoValue}>
                      {activeSelectedJob.salary_min &&
                      activeSelectedJob.salary_max
                        ? `${activeSelectedJob.salary_min.toLocaleString()} - ${activeSelectedJob.salary_max.toLocaleString()}`
                        : "-"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>จำนวนรับ</span>
                    <span className={styles.infoValue}>
                      {activeSelectedJob.rate ||
                        activeSelectedJob.vacancy ||
                        "-"}
                    </span>
                  </div>
                  <div className={styles.sectionBlock}>
                    <span className={styles.sectionTitle}>รายละเอียดงาน</span>
                    <p>{activeSelectedJob.details || "-"}</p>
                  </div>
                  <div className={styles.sectionBlock}>
                    <span className={styles.sectionTitle}>คุณสมบัติ</span>
                    <p>{activeSelectedJob.preferred_qualifications || "-"}</p>
                  </div>
                </div>
                <div className={styles.rightCol}>
                  <div className={styles.sectionBlock} style={{ marginTop: 0 }}>
                    <span className={styles.sectionTitle}>สวัสดิการ</span>
                    <p>{activeSelectedJob.Benefits || "-"}</p>
                  </div>
                  <div className={styles.sectionBlock}>
                    <span className={styles.sectionTitle}>
                      ช่องทางการติดต่อ
                    </span>
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
                    {modalAction === "cancel"
                      ? "ยืนยันการยกเลิก"
                      : "ยืนยันการปฏิเสธ"}
                  </h3>
                  <p>
                    {modalAction === "cancel"
                      ? "คุณแน่ใจหรือไม่ว่าต้องการยกเลิกใบสมัครงานนี้?"
                      : "คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำเชิญหรือข้อเสนองานจากบริษัทนี้?"}
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

      {/* Review Modal */}
      {isReviewModalOpen && pendingFinalStatus !== null && (
        <div className={styles.modalOverlay}>
          <div
            style={{
              backgroundColor: "#ffffff",
              color: "#1e293b",
              padding: "32px 28px",
              borderRadius: "20px",
              width: "360px",
              textAlign: "center",
              boxShadow:
                "0 20px 40px -10px rgba(0, 123, 255, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.05)",
              border: "1.5px solid #60a5fa", // เส้นขอบสีฟ้าโมเดิร์น
              position: "relative",
              boxSizing: "border-box",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* ปุ่มปิด (✕) มุมขวาบน */}
            <span
              style={{
                position: "absolute",
                top: "16px",
                right: "18px",
                cursor: "pointer",
                fontSize: "18px",
                color: "#94a3b8",
                lineHeight: "1",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1e293b")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              onClick={() => {
                setIsReviewModalOpen(false);
                setReviewRating(0);
                setReviewComment("");
              }}
            >
              ✕
            </span>

            <h3
              style={{
                margin: "0 0 6px 0",
                fontSize: "20px",
                fontWeight: "700",
                color: "#0f172a",
              }}
            >
              Rate Review
            </h3>
            <p
              style={{
                margin: "0 0 20px 0",
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              กรุณาให้คะแนนและแสดงความคิดเห็น
            </p>

            {/* ส่วนเลือกดาว */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "22px",
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= reviewRating;
                return (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      outline: "none",
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill={isFilled ? "#f59e0b" : "#e2e8f0"}
                      stroke={isFilled ? "#f59e0b" : "#cbd5e1"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ transition: "fill 0.2s, stroke 0.2s" }}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                );
              })}
            </div>
            {/* ส่วนกรอกคอมเมนต์ */}
            <div style={{ textAlign: "left", marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#475569",
                  marginBottom: "6px",
                }}
              >
                Comment
              </label>
              <textarea
                rows={3}
                value={reviewComment}
                placeholder="พิมพ์ข้อความที่นี่..."
                onChange={(e) => setReviewComment(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1.5px solid #e2e8f0",
                  outline: "none",
                  boxSizing: "border-box",
                  fontSize: "14px",
                  color: "#1e293b",
                  resize: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(59, 130, 246, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* ปุ่ม Submit */}
            <button
              onClick={() => {
                if (!selectedJob) return;
                handleUpdateStatus(
                  selectedJob.tracking_id,
                  pendingFinalStatus,
                  {
                    rating: reviewRating,
                    comment: reviewComment,
                  },
                );
                setIsReviewModalOpen(false);
                setReviewRating(0);
                setReviewComment("");
              }}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #0070f3, #2563eb)",
                color: "white",
                padding: "10px 0",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "15px",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                transition: "opacity 0.2s, transform 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
