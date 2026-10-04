"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import styles from "./company_tracking.module.css";
import dynamic from "next/dynamic";
import Link from "next/link";
import TestResultModal from "@/components/TestResultModal";

const MapComponent = dynamic(() => import("./mapComponent"), {
  ssr: false,
  loading: () => (
    <p style={{ textAlign: "center", padding: "20px" }}>กำลังโหลดแผนที่...</p>
  ),
});

export interface Education {
  education_id?: number;
  level?: string;
  institution?: string;
  faculty?: string;
  major?: string;
  year_start?: string | number;
  year_end?: string | number;
}

export interface FileRecord {
  file_id: number;
  user_id?: number;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_category?: string;
}

export interface Applicant {
  has_test: boolean;
  district: any;
  province: any;
  postal_code: any;
  sub_district: any;
  address: any;
  height: any;
  weight: any;
  religion: string;
  military_status: string;
  nationality: string;
  gender: string;
  age: string;
  mobile_phone: string;
  tracking_id: number;
  post_id: number;
  user_id: number;
  status: string;
  interview_message?: string;
  date_time?: string;
  job_position?: string;
  fullname?: string;
  email?: string; // อีเมลของผู้สมัคร (seekerEmail)
  company_email?: string; // อีเมลของบริษัทตัวเอง
  company_name?: string;
  job_titles?: any[];
  type_of_work?: string;
  desired_salary?: string;
  desired_work_location?: string;
  available_start_date?: string;
  educations?: Education[];
  skills?: any[];
  experiences?: any[];
  languages?: any[];
  typing_speed?: any[];
  files?: FileRecord[];
  profile_image?: string;
  company_full_address?: string;
  company_sub_district?: string;
  company_district?: string;
  company_province?: string;
  company_postcode?: string;
  company_latitude?: number;
  company_longitude?: number;
  interview_date?: string;
  link?: string;
  location?: string;
  status_notification?: string;
}

interface ComponentProps {
  initialJobs: Applicant[];
  companyId: string;
}

export default function CompanyApplication({
  initialJobs,
  companyId,
}: ComponentProps) {
  const [jobs, setJobs] = useState<Applicant[]>(initialJobs || []);
  const [selectedJob, setSelectedJob] = useState<Applicant | null>(
    initialJobs && initialJobs.length > 0 ? initialJobs[0] : null,
  );
  console.log("data รายการผู้สมัครงาน tracking:", initialJobs);

  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [previewResume, setPreviewResume] = useState<FileRecord | null>(null);

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

  // ดึงรายการตำแหน่งงานที่ไม่ซ้ำกัน พร้อมจำนวนผู้สมัครในแต่ละตำแหน่ง
  const availablePositions = useMemo(() => {
    const positionMap = new Map<string, number>();
    jobs.forEach((job) => {
      const pos = job.job_position?.trim() || "ไม่ระบุตำแหน่ง";
      positionMap.set(pos, (positionMap.get(pos) || 0) + 1);
    });
    return Array.from(positionMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [jobs]);

  // คัดกรองรายชื่อผู้สมัครตามตำแหน่งงานที่เลือกใน dropdown
  const filteredJobs = useMemo(() => {
    if (selectedPosition === "all") {
      return jobs;
    }
    return jobs.filter((job) => {
      const pos = job.job_position?.trim() || "ไม่ระบุตำแหน่ง";
      return pos === selectedPosition;
    });
  }, [jobs, selectedPosition]);

  // จัดการเมื่อผู้ใช้เลือกตำแหน่งงานใน dropdown
  const handleSelectPosition = (newPosition: string) => {
    setSelectedPosition(newPosition);
    setIsFilterOpen(false);

    const nextFiltered =
      newPosition === "all"
        ? jobs
        : jobs.filter((job) => {
            const pos = job.job_position?.trim() || "ไม่ระบุตำแหน่ง";
            return pos === newPosition;
          });

    // หากผู้สมัครคนเดิมไม่อยู่ในรายการที่ผ่านการคัดกรอง ให้สลับไปเลือกคนแรกของรายการใหม่ หรือ null
    if (!nextFiltered.some((j) => j.tracking_id === selectedJob?.tracking_id)) {
      setSelectedJob(nextFiltered.length > 0 ? nextFiltered[0] : null);
    }
  };

  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [interviewType, setInterviewType] = useState<"onsite" | "online">(
    "onsite",
  );
  const [meetingLink, setMeetingLink] = useState("");
  const [locationName, setLocationName] = useState("");
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModelOpen] = useState(false);
  const [isTestResultModalOpen, setIsTestResultModalOpen] = useState(false);
  const [targetTrackingId, setTargetTrackingId] = useState<number | null>(null);

  const handleOpenRejectModal = (trackingId?: number) => {
    setTargetTrackingId(trackingId || selectedJob?.tracking_id || null);
    setIsRejectModelOpen(true);
  };

  const status = selectedJob?.status?.toLowerCase() || "pending";

  // หาวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD เพื่อเอาไปบล็อกการเลือกวันย้อนหลัง
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;

  // เช็กว่าวันที่เลือกเป็นอดีตหรือไม่
  const isPastDate = interviewDate && interviewDate < minDate;

  const getStatusClass = (status: string = "pending") => {
    const s = status.toLowerCase();
    if (s === "applied") return styles.statusApplied;
    // ปรับให้ screening ใช้สี (Class) เดียวกับ interview
    if (s === "screening" || s === "interview") return styles.statusInterview;
    if (s === "appointment" || s === "offer" || s === "hired")
      return styles.statusOffer;
    if (s === "rejected" || s === "reject") return styles.statusRejected;
    return styles.statusPending;
  };

  // +++ เพิ่มฟังก์ชันนี้เข้าไปใหม่ +++
  const getDisplayStatus = (status: string = "pending") => {
    const s = status.toLowerCase();
    if (s === "pending") return "ยื่นใบสมัคร";
    if (s === "applied") return "นัดสัมภาษณ์";
    if (s === "screening") return "นัดสัมภาษณ์";
    if (s === "interview") return "สัมภาษณ์งาน";
    if (s === "offer" || s === "appointment" || s === "hired")
      return "ผลการพิจารณา";
    if (s === "reject" || s === "rejected") return "ไม่ผ่านพิจารณา";
    if (s === "cancel" || s === "cancelled") return "ผู้สมัครยกเลิก";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  const handleDeleteTracking = async (trackingId: number) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) return;
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
        alert("เกิดข้อผิดพลาดในการลบรายการ");
      }
    } catch (error) {
      console.error("Error deleting tracking:", error);
    }
  };

  const handleCardClick = async (job: any) => {
    setSelectedJob(job);
    if (
      job.status_notification === "unread_company" ||
      job.status_notification === "unread_both"
    ) {
      try {
        await fetch("/api/interview_tracking/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingId: job.tracking_id,
            userType: "company",
          }),
        });
        setJobs((prev) =>
          prev.map((j) =>
            j.tracking_id === job.tracking_id
              ? {
                  ...j,
                  status_notification:
                    j.status_notification === "unread_both"
                      ? "unread_user"
                      : "read",
                }
              : j,
          ),
        );
      } catch (error) {
        console.error("Failed to mark as read", error);
      }
    }
  };

  const handleUpdateStatus = async (
    trackingId: number,
    newStatus: string,
    interviewDetails?: any,
  ) => {
    if (!selectedJob) return;
    console.log("ข้อมูลที่จะส่งไป API:", {
      trackingId: trackingId,
      status: newStatus,
      companyEmail: selectedJob.company_email || "hr@company.com",
      seekerEmail: selectedJob.email,
      companyName: selectedJob.company_name || "บริษัท",
      seekerName: selectedJob.fullname || "ผู้สมัคร",
      jobTitle: selectedJob.job_position,
      ...interviewDetails,
    });

    try {
      const response = await fetch(
        `/api/interview_tracking/update-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingId: trackingId,
            status: newStatus,
            companyEmail: selectedJob.company_email || "hr@company.com",
            seekerEmail: selectedJob.email,
            companyName: selectedJob.company_name || "บริษัท",
            seekerName: selectedJob.fullname || "ผู้สมัคร",
            jobTitle: selectedJob.job_position,
            ...interviewDetails,
          }),
        },
      );

      if (response.ok) {
        setJobs((prev) =>
          prev.map((job) =>
            job.tracking_id === trackingId
              ? {
                  ...job,
                  status: newStatus,
                  interview_date:
                    interviewDetails &&
                    (interviewDetails.interviewTime || interviewTime)
                      ? `${interviewDetails.interviewDate}T${interviewDetails.interviewTime || interviewTime}:00`
                      : job.interview_date,
                  link:
                    interviewDetails?.interviewType === "online"
                      ? interviewDetails.locationName
                      : job.link,
                  location:
                    interviewDetails?.interviewType === "onsite"
                      ? interviewDetails.locationName
                      : job.location,
                }
              : job,
          ),
        );
        setSelectedJob((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                interview_date:
                  interviewDetails &&
                  (interviewDetails.interviewTime || interviewTime)
                    ? `${interviewDetails.interviewDate}T${interviewDetails.interviewTime || interviewTime}:00`
                    : prev.interview_date,
                link:
                  interviewDetails?.interviewType === "online"
                    ? interviewDetails.locationName
                    : prev.link,
                location:
                  interviewDetails?.interviewType === "onsite"
                    ? interviewDetails.locationName
                    : prev.location,
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleOpenMap = () => {
    if (selectedJob?.company_latitude && selectedJob?.company_longitude) {
      setSelectedLat(Number(selectedJob.company_latitude));
      setSelectedLng(Number(selectedJob.company_longitude));
    }
    setSearchQuery(locationName || "");
    setIsMapModalOpen(true);
  };

  const resumeFiles =
    selectedJob?.files?.filter(
      (f) =>
        f?.file_category?.toLowerCase() === "resume" ||
        f?.file_category === "เรซูเม่" ||
        f?.file_name?.toLowerCase().includes("resume") ||
        f?.file_name?.includes("เรซูเม่"),
    ) || [];

  const resumeFile =
    resumeFiles.length > 0
      ? resumeFiles[0]
      : selectedJob?.files?.find(
          (f) =>
            f?.file_category?.toLowerCase() !== "transcript" &&
            f?.file_category?.toLowerCase() !== "portfolio" &&
            f?.file_category?.toLowerCase() !== "certificate" &&
            Boolean(f?.file_name?.toLowerCase().endsWith(".pdf")),
        );

  const now = new Date();
  let isWaitingForInterviewEnd = false; // ยังไม่ถึงเวลาสัมภาษณ์
  let canMakeOffer = false; // สัมภาษณ์แล้ว (อยู่ในช่วง 7 วัน)
  let isOfferExpired = false; // เกิน 7 วันหลังสัมภาษณ์

  let offerStartDateStr = ""; // วันที่เริ่มส่ง offer ได้
  let offerEndDateStr = ""; // วันสุดท้ายที่ส่ง offer ได้

  if (status === "interview" && selectedJob?.interview_date) {
    const interviewDateObj = new Date(selectedJob.interview_date);

    // คำนวณหาความต่างของเวลา (มิลลิวินาที)
    const diffTime = now.getTime() - interviewDateObj.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (diffTime < 0) {
      // diffTime ติดลบ แปลว่า "ยังไม่ถึงเวลาสัมภาษณ์" (ยังเป็นอนาคตอยู่)
      isWaitingForInterviewEnd = true;
      offerStartDateStr = interviewDateObj.toLocaleDateString("th-TH");
    } else if (diffTime >= 0 && diffDays <= 7) {
      // diffTime เป็นบวก แปลว่า "ถึงเวลา/เลยเวลาสัมภาษณ์มาแล้ว" และยังไม่เกิน 7 วัน
      canMakeOffer = true;
      // คำนวณวันสุดท้ายที่หมดเขต (วันสัมภาษณ์ + 7 วัน)
      const endDateObj = new Date(
        interviewDateObj.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
      offerEndDateStr = endDateObj.toLocaleDateString("th-TH");
    } else if (diffDays > 7) {
      // ผ่านไปเกิน 7 วันแล้ว
      isOfferExpired = true;
    }
  }
  // --------------------------------------------------

  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        {/* Left Sidebar */}
        <div className={styles.cardScollBar}>
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
                      <span className={styles.itemCount}>({jobs.length})</span>
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

          <aside className={styles.sidebar}>
            {filteredJobs.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                {jobs.length === 0
                  ? "ไม่พบข้อมูลผู้สมัคร"
                  : `ไม่พบผู้สมัครในตำแหน่ง "${selectedPosition}"`}
              </p>
            ) : (
              filteredJobs.map((job) => {
                const isUnread =
                  job.status_notification === "unread_company" ||
                  job.status_notification === "unread_both";
                return (
                  <div
                    key={job.tracking_id}
                    className={`${styles.jobCard} ${selectedJob?.tracking_id === job.tracking_id ? styles.selected : ""}`}
                    style={{
                      cursor: "pointer",
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
                          job.profile_image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(job.fullname || "Seeker")}&background=random`
                        }
                        alt="รูปโปรไฟล์ผู้สมัคร"
                        className={styles.profileLeft}
                      />
                      <div className={styles.cardDetails}>
                        <h4>{job.fullname || "ไม่ระบุชื่อ"}</h4>
                        <p>{job.job_position || "ไม่ระบุตำแหน่ง"}</p>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "8px",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(job.status)}`}
                      >
                        {getDisplayStatus(job.status)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </aside>
        </div>

        {/* Right Panel */}
        <section className={styles.rightPanel}>
          {selectedJob ? (
            <>
              <div className={styles.trackerBox}>
                <div className={styles.stepperContainer}>
                  {/* Step 1: Pending */}
                  <div
                    className={`${styles.step} ${styles.active} ${status === "pending" ? styles.currentStep : ""}`}
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
                      className={styles.stepLabel}
                      style={{
                        display: "block",
                        width: "120px",
                        textAlign: "center",
                        lineHeight: "1.3",
                      }}
                    >
                      ยื่นใบสมัคร
                    </span>

                    {status === "pending" && (
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
                          alignItems: "center",
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
                            whiteSpace: "nowrap",
                            width: "100%",
                          }}
                        >
                          ยื่นใบสมัคร
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#555",
                            marginBottom: "15px",
                          }}
                        >
                          รอผู้สมัครงานตอบกลับ
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              background: "none",
                              border: "none",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              color: "#333",
                            }}
                            onClick={() =>
                              handleOpenRejectModal(selectedJob.tracking_id)
                            }
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                backgroundColor: "#d32f2f",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "4px",
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "16px" }}
                              >
                                close
                              </span>
                            </div>
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className={`${styles.stepLine} ${["applied", "screening", "interview", "appointment", "offer", "hired"].includes(status) ? styles.activeLine : ""}`}
                  />

                  {/* Step 2: Applied */}
                  <div
                    className={`${styles.step} ${["applied", "screening", "interview", "appointment", "offer", "hired"].includes(status) ? styles.active : ""} ${status === "applied" ? styles.currentStep : ""}`}
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
                      className={styles.stepLabel}
                      style={{
                        display: "block",
                        width: "120px",
                        textAlign: "center",
                        lineHeight: "1.3",
                      }}
                    >
                      นัดสัมภาษณ์
                    </span>

                    {status === "applied" && (
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
                          // ล็อกความกว้างไว้ ให้ On-site กับ Online การ์ดเท่ากัน
                          // (เดิมเป็น 100% ของกล่องแม่ที่กว้างตามเนื้อหา)
                          width: "240px",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          textAlign: "left",
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
                            whiteSpace: "nowrap",
                          }}
                        >
                          สร้างนัดหมาย
                        </p>
                        <label
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                        >
                          วันสัมภาษณ์:
                        </label>
                        <input
                          type="date"
                          min={minDate}
                          value={interviewDate}
                          onChange={(e) => setInterviewDate(e.target.value)}
                          style={{
                            borderColor: isPastDate ? "#d32f2f" : "#ccc",
                            outline: isPastDate ? "none" : "",
                            marginBottom: "8px",
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        />
                        {isPastDate && (
                          <span
                            style={{
                              color: "#d32f2f",
                              fontSize: "11px",
                              display: "block",
                              marginBottom: "8px",
                            }}
                          >
                            * ไม่สามารถเลือกวันย้อนหลังได้
                          </span>
                        )}

                        <label
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                        >
                          เวลาสัมภาษณ์:
                        </label>
                        <input
                          type="time"
                          value={interviewTime}
                          onChange={(e) => setInterviewTime(e.target.value)}
                          style={{
                            marginBottom: "12px",
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        />

                        <label
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                        >
                          รูปแบบการสัมภาษณ์:
                        </label>
                        <div
                          style={{
                            display: "flex",
                            gap: "15px",
                            marginBottom: "12px",
                          }}
                        >
                          <label style={{ fontSize: "12px" }}>
                            <input
                              type="radio"
                              value="onsite"
                              checked={interviewType === "onsite"}
                              onChange={() => setInterviewType("onsite")}
                            />{" "}
                            On-site
                          </label>
                          <label style={{ fontSize: "12px" }}>
                            <input
                              type="radio"
                              value="online"
                              checked={interviewType === "online"}
                              onChange={() => setInterviewType("online")}
                            />{" "}
                            Online
                          </label>
                        </div>

                        {interviewType === "onsite" ? (
                          <>
                            <label
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                marginBottom: "4px",
                              }}
                            >
                              สถานที่สัมภาษณ์:
                            </label>
                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                marginBottom: "15px",
                              }}
                            >
                              <input
                                type="text"
                                placeholder={
                                  [
                                    selectedJob.company_full_address,
                                    selectedJob.company_sub_district,
                                    selectedJob.company_province,
                                  ]
                                    .filter(Boolean)
                                    .join(" ") || "ปักหมุดสถานที่"
                                }
                                value={locationName}
                                onChange={(e) =>
                                  setLocationName(e.target.value)
                                }
                                style={{
                                  flex: 1,
                                  padding: "6px",
                                  borderRadius: "4px",
                                  border: "1px solid #ccc",
                                  minWidth: 0,
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleOpenMap}
                                style={{
                                  padding: "6px",
                                  backgroundColor: "#2e7d32",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                ปักหมุด
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <label
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                marginBottom: "4px",
                              }}
                            >
                              ลิงก์สัมภาษณ์:
                            </label>
                            <input
                              type="text"
                              placeholder="วางลิงก์ที่นี่..."
                              value={meetingLink}
                              onChange={(e) => setMeetingLink(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "6px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                marginBottom: "15px",
                                boxSizing: "border-box",
                              }}
                            />
                          </>
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "15px",
                            marginTop: "auto",
                            borderTop: "1px solid #f0f0f0",
                            paddingTop: "15px",
                          }}
                        >
                          {(() => {
                            const isInterviewFormComplete =
                              interviewDate &&
                              interviewTime &&
                              (interviewType === "online"
                                ? meetingLink
                                : locationName);
                            return (
                              <>
                                <button
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    background: "none",
                                    border: "none",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    cursor:
                                      !isInterviewFormComplete || isPastDate
                                        ? "not-allowed"
                                        : "pointer",
                                    color:
                                      !isInterviewFormComplete || isPastDate
                                        ? "#9e9e9e"
                                        : "#333",
                                  }}
                                  disabled={
                                    !isInterviewFormComplete ||
                                    Boolean(isPastDate)
                                  }
                                  onClick={() => {
                                    const finalLocation =
                                      interviewType === "online"
                                        ? meetingLink
                                        : locationName;
                                    handleUpdateStatus(
                                      selectedJob.tracking_id,
                                      "screening",
                                      {
                                        interviewDate,
                                        interviewTime,
                                        locationName: finalLocation,
                                        interviewType: interviewType,
                                        latitude:
                                          interviewType === "onsite"
                                            ? selectedLat
                                            : null,
                                        longitude:
                                          interviewType === "onsite"
                                            ? selectedLng
                                            : null,
                                      },
                                    );
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "50%",
                                      backgroundColor:
                                        !isInterviewFormComplete || isPastDate
                                          ? "#ccc"
                                          : "#2e7d32",
                                      color: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    <span
                                      className="material-symbols-outlined"
                                      style={{ fontSize: "16px" }}
                                    >
                                      check
                                    </span>
                                  </div>
                                  ยืนยัน
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    background: "none",
                                    border: "none",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    color: "#333",
                                  }}
                                  onClick={() =>
                                    handleOpenRejectModal(
                                      selectedJob.tracking_id,
                                    )
                                  }
                                >
                                  <div
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "50%",
                                      backgroundColor: "#d32f2f",
                                      color: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    <span
                                      className="material-symbols-outlined"
                                      style={{ fontSize: "16px" }}
                                    >
                                      close
                                    </span>
                                  </div>
                                  ยกเลิก
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className={`${styles.stepLine} ${["screening", "interview", "appointment", "offer", "hired"].includes(status) ? styles.activeLine : ""}`}
                  />

                  {/* Step 3: Screening / Interview */}
                  <div
                    className={`${styles.step} ${["screening", "interview", "appointment", "offer", "hired"].includes(status) ? styles.active : ""} ${["screening", "interview"].includes(status) ? styles.currentStep : ""}`}
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
                      className={styles.stepLabel}
                      style={{
                        display: "block",
                        width: "120px",
                        textAlign: "center",
                        lineHeight: "1.3",
                      }}
                    >
                      สัมภาษณ์งาน
                    </span>

                    {status === "screening" && (
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
                          alignItems: "center",
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
                            whiteSpace: "nowrap",
                            width: "100%",
                          }}
                        >
                          รอการยืนยัน
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#555",
                            marginBottom: "15px",
                            textAlign: "center",
                          }}
                        >
                          รอผู้สมัครยืนยันนัดหมาย
                        </p>
                        <button
                          type="button"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            background: "none",
                            border: "none",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            color: "#333",
                          }}
                          onClick={() =>
                            handleOpenRejectModal(selectedJob.tracking_id)
                          }
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor: "#d32f2f",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "16px" }}
                            >
                              close
                            </span>
                          </div>
                          ยกเลิกนัด
                        </button>
                      </div>
                    )}

                    {status === "interview" && (
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
                          textAlign: "left",
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
                            whiteSpace: "nowrap",
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
                            {selectedJob.interview_date
                              ? new Date(
                                  selectedJob.interview_date,
                                ).toLocaleDateString("th-TH", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "ไม่ระบุวันที่"}
                          </span>
                        </div>

                        {/* ส่วนแสดงเวลา */}
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
                            {selectedJob.interview_date
                              ? new Date(
                                  selectedJob.interview_date,
                                ).toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) + " น."
                              : "ไม่ระบุเวลา"}
                          </span>
                        </div>

                        {/* ส่วนแสดงสถานที่ */}
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
                              color: "#000000",
                              flexShrink: 0,
                            }}
                          >
                            {selectedJob.location &&
                            (selectedJob.location.startsWith("http") ||
                              selectedJob.location
                                .toLowerCase()
                                .includes("meet") ||
                              selectedJob.location
                                .toLowerCase()
                                .includes("zoom"))
                              ? "video_chat"
                              : "distance"}
                          </span>
                          <div
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: "13px",
                              color: "#555",
                            }}
                          >
                            {selectedJob.location ? (
                              <a
                                href={
                                  selectedJob.location.startsWith("http")
                                    ? selectedJob.location
                                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedJob.location)}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                title={selectedJob.location}
                                style={{
                                  color: "#0288d1",
                                  textDecoration: "underline",
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {selectedJob.location}
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

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "auto",
                            borderTop: "1px solid #f0f0f0",
                            paddingTop: "15px",
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              background: "none",
                              border: "none",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              color: "#333",
                            }}
                            onClick={() =>
                              handleOpenRejectModal(selectedJob.tracking_id)
                            }
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                backgroundColor: "#d32f2f",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "4px",
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "16px" }}
                              >
                                close
                              </span>
                            </div>
                            ยกเลิกนัด
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className={`${styles.stepLine} ${["appointment", "offer", "hired"].includes(status) ? styles.activeLine : ""}`}
                  />

                  {/* Step 4: Appointment / Offer */}
                  <div
                    className={`${styles.step} ${["appointment", "offer", "hired"].includes(status) ? styles.active : ""} ${["appointment", "offer", "hired"].includes(status) ? styles.currentStep : ""}`}
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
                      className={styles.stepLabel}
                      style={{
                        display: "block",
                        width: "120px",
                        textAlign: "center",
                        lineHeight: "1.3",
                      }}
                    >
                      ผลการพิจารณา
                    </span>

                    {/* --- Offer block logic is now purely based on status === "appointment" OR "offer" to avoid rendering 2 boxes at once --- */}
                    {(status === "appointment" ||
                      status === "offer" ||
                      (status === "interview" &&
                        selectedJob.interview_date)) && (
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
                          textAlign: "left",
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
                            whiteSpace: "nowrap",
                          }}
                        >
                          ข้อเสนอรับเข้าทำงาน
                        </p>

                        {status === "interview" && isWaitingForInterviewEnd && (
                          <div
                            style={{
                              textAlign: "center",
                              marginBottom: "15px",
                            }}
                          >
                            <p
                              style={{
                                color: "#ff9800",
                                fontWeight: "bold",
                                fontSize: "13px",
                                margin: "0 0 5px 0",
                                whiteSpace: "nowrap",
                              }}
                            >
                              รอการสัมภาษณ์เสร็จสิ้น
                            </p>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#555",
                                margin: 0,
                                whiteSpace: "nowrap",
                              }}
                            >
                              ประเมินผลได้ตั้งแต่วันที่ {offerStartDateStr}
                            </p>
                          </div>
                        )}

                        {status === "interview" && canMakeOffer && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              marginBottom: "15px",
                            }}
                          >
                            <p
                              style={{
                                color: "#d32f2f",
                                textAlign: "center",
                                fontSize: "11px",
                                margin: "0 0 10px 0",
                              }}
                            >
                              * ตัดสินใจได้ถึงวันที่ {offerEndDateStr}
                            </p>
                            <label
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                marginBottom: "4px",
                              }}
                            >
                              กำหนดวันเริ่มงาน:
                            </label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              style={{
                                padding: "6px",
                                borderRadius: "4px",
                                border: "1px solid #ccc",
                                marginBottom: "5px",
                                width: "100%",
                                boxSizing: "border-box",
                              }}
                            />
                          </div>
                        )}

                        {status === "interview" && isOfferExpired && (
                          <div
                            style={{
                              textAlign: "center",
                              marginBottom: "15px",
                            }}
                          >
                            <p
                              style={{
                                color: "#d32f2f",
                                fontWeight: "bold",
                                fontSize: "13px",
                                margin: "0 0 5px 0",
                                whiteSpace: "nowrap",
                              }}
                            >
                              หมดเวลาพิจารณา
                            </p>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#555",
                                margin: 0,
                              }}
                            >
                              เกินกำหนด 7 วันหลังสัมภาษณ์
                            </p>
                          </div>
                        )}

                        {(status === "appointment" || status === "offer") && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "15px",
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
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <span style={{ fontSize: "10px", color: "#888" }}>
                                วันเริ่มงาน / ข้อเสนอ:
                              </span>
                              <span
                                style={{
                                  fontSize: "13px",
                                  color: "#333",
                                  fontWeight: "bold",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {selectedJob.interview_date
                                  ? new Date(
                                      selectedJob.interview_date,
                                    ).toLocaleDateString("th-TH", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "ไม่ระบุ"}
                              </span>
                            </div>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "15px",
                            marginTop: "auto",
                            borderTop: "1px solid #f0f0f0",
                            paddingTop: "15px",
                          }}
                        >
                          {status === "interview" && canMakeOffer && (
                            <>
                              <button
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  background: "none",
                                  border: "none",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  cursor: startDate ? "pointer" : "not-allowed",
                                  color: startDate ? "#333" : "#9e9e9e",
                                }}
                                onClick={() =>
                                  handleUpdateStatus(
                                    selectedJob.tracking_id,
                                    "appointment",
                                    {
                                      interviewDate: startDate,
                                      interviewTime: "09:00",
                                    },
                                  )
                                }
                                disabled={!startDate}
                              >
                                <div
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: startDate
                                      ? "#2e7d32"
                                      : "#ccc",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "16px" }}
                                  >
                                    check
                                  </span>
                                </div>
                                ส่งข้อเสนอ
                              </button>
                              <button
                                type="button"
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  background: "none",
                                  border: "none",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  color: "#333",
                                }}
                                onClick={() =>
                                  handleOpenRejectModal(selectedJob.tracking_id)
                                }
                              >
                                <div
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "#d32f2f",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "16px" }}
                                  >
                                    close
                                  </span>
                                </div>
                                ปฏิเสธ
                              </button>
                            </>
                          )}

                          {status === "interview" &&
                            (isWaitingForInterviewEnd || isOfferExpired) && (
                              <button
                                type="button"
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  background: "none",
                                  border: "none",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  color: "#333",
                                }}
                                onClick={() =>
                                  handleOpenRejectModal(selectedJob.tracking_id)
                                }
                              >
                                <div
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "#d32f2f",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "16px" }}
                                  >
                                    close
                                  </span>
                                </div>
                                {isOfferExpired ? "ปรับเป็นไม่ผ่าน" : "ยกเลิก"}
                              </button>
                            )}

                          {(status === "appointment" || status === "offer") && (
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#2e7d32",
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                              }}
                            >
                              ส่งข้อเสนองานเรียบร้อยแล้ว
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {status === "hired" && (
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
                          alignItems: "center",
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
                            whiteSpace: "nowrap",
                            width: "100%",
                          }}
                        >
                          ตอบรับเข้าทำงาน
                        </p>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#2e7d32",
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ผู้สมัครตอบรับเข้าทำงานแล้ว
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* แผนที่ Modal */}
              {isMapModalOpen && (
                <div className={styles.modalOverlay}>
                  <div
                    className={styles.mapModalContent}
                    style={{
                      backgroundColor: "#fff",
                      padding: "20px",
                      borderRadius: "12px",
                      width: "90%",
                      maxWidth: "700px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          color: "#1e293b",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ color: "#3182ce" }}
                        >
                          map
                        </span>
                        ปักหมุดเลือกสถานที่สัมภาษณ์
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsMapModalOpen(false)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "20px",
                          color: "#64748b",
                          cursor: "pointer",
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div
                      style={{
                        height: "480px",
                        width: "100%",
                        margin: "10px 0",
                      }}
                    >
                      <MapComponent
                        selectedLat={selectedLat || 13.7563}
                        selectedLng={selectedLng || 100.5018}
                        initialAddress={searchQuery || locationName}
                        onLocationSelect={(lat, lng, addressName) => {
                          setSelectedLat(lat);
                          setSelectedLng(lng);
                          setSearchQuery(addressName);
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "flex-end",
                        marginTop: "10px",
                      }}
                    >
                      <button
                        className={styles.btnConfirm}
                        onClick={() => {
                          setLocationName(searchQuery);
                          setIsMapModalOpen(false);
                        }}
                      >
                        ยืนยัน
                      </button>
                      <button
                        className={styles.btnCancel}
                        onClick={() => setIsMapModalOpen(false)}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Details (โชว์ข้อมูลผู้สมัคร) */}
              <div style={{ marginTop: "20px" }}>
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "20px",
                    borderRadius: "15px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    alignItems: "stretch",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between", // ดันหัวข้อไว้ซ้าย ปุ่มไว้ขวา
                      alignItems: "center",
                      borderBottom: "1px solid #f0f0f0", // เพิ่มเส้นใต้คั่นให้ดูเป็นระเบียบ
                      paddingBottom: "15px",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        gap: "1px",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ color: "#3182ce", fontSize: "20px" }}
                      >
                        badge
                      </span>
                      ข้อมูลและประวัติผู้สมัคร
                    </h3>
                    {/* หากบริษัทเป็นฝ่ายเชิญสัมภาษณ์ก่อน (สถานะฝั่งบริษัทเป็น pending) ให้แสดงข้อความว่าผู้สมัครถูกเชิญสัมภาษณ์แล้ว */}
                    {status === "pending" ? (
                      <span className={styles.invitedBadge}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "18px", color: "#0288d1" }}
                        >
                          mail
                        </span>
                        ผู้สมัครถูกเชิญสัมภาษณ์แล้ว
                      </span>
                    ) : selectedJob.has_test ? (
                      <button
                        type="button"
                        className={styles.btnViewTestHeader}
                        onClick={() => setIsTestResultModalOpen(true)}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "18px" }}
                        >
                          quiz
                        </span>
                        ดูผลแบบทดสอบ
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#9e9e9e",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        ไม่มีแบบทดสอบของตำแหน่งงานนี้
                      </span>
                    )}
                  </div>

                  {/* Column 1: Personal Info */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        flex: "1",
                        backgroundColor: "#F8F8F8",
                        borderRadius: "12px",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <Link
                        href={`/company/seeker-profile/${selectedJob.user_id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <img
                          src={
                            selectedJob.profile_image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedJob.fullname || "Seeker")}`
                          }
                          alt="รูปโปรไฟล์"
                          style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            marginBottom: "10px",
                          }}
                        />
                      </Link>
                      <Link
                        href={`/company/seeker-profile/${selectedJob.user_id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <h3
                          style={{
                            margin: "0 0 5px 0",
                            fontSize: "18px",
                            color: "#000000",
                          }}
                        >
                          {selectedJob.fullname || "ไม่ระบุชื่อ"}
                        </h3>
                      </Link>
                      <a
                        href={`mailto:${selectedJob.email}`}
                        style={{
                          color: "#555",
                          textDecoration: "underline",
                          marginBottom: "20px",
                          fontSize: "14px",
                        }}
                      >
                        {selectedJob.email || "ไม่ระบุ"}
                      </a>

                      {(status === "reject" || status === "rejected") && (
                        <button
                          onClick={() =>
                            handleDeleteTracking(selectedJob.tracking_id)
                          }
                          style={{
                            marginTop: "-10px",
                            marginBottom: "20px",
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

                      <div
                        style={{
                          textAlign: "left",
                          width: "100%",
                          fontSize: "12px",
                          lineHeight: "1.6",
                          color: "#555",
                        }}
                      >
                        <p style={{ margin: 0 }}>
                          <strong>เบอร์โทรศัพท์:</strong>{" "}
                          {selectedJob.mobile_phone || "-"}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>อายุ:</strong> {selectedJob.age || "-"}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>เพศ:</strong> {selectedJob.gender || "-"}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>สัญชาติ:</strong>{" "}
                          {selectedJob.nationality || "-"}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>สถานะทางทหาร:</strong>{" "}
                          {selectedJob.military_status || "-"}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>ศาสนา:</strong>{" "}
                          {selectedJob.religion || "-"}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>น้ำหนัก / ส่วนสูง:</strong>{" "}
                          {selectedJob.weight
                            ? `${selectedJob.weight} กก.`
                            : "-"}{" "}
                          /{" "}
                          {selectedJob.height
                            ? `${selectedJob.height} ซม.`
                            : "-"}
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>ที่อยู่ปัจจุบัน:</strong>{" "}
                          {[
                            selectedJob.address,
                            selectedJob.sub_district,
                            selectedJob.district,
                            selectedJob.province,
                            selectedJob.postal_code,
                          ]
                            .filter(Boolean)
                            .join(" ") || "-"}
                        </p>
                      </div>

                      <div
                        style={{
                          width: "100%",
                          marginTop: "20px",
                          paddingTop: "15px",
                        }}
                      >
                        {resumeFile ? (
                          <div
                            style={{
                              // backgroundColor: "#ffffff",
                              //border: "1px solid #d1d5db",
                              //borderRadius: "10px",
                              padding: "10px 12px",
                              textAlign: "center",
                              //boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                marginBottom: "6px",
                              }}
                            ></div>

                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                justifyContent: "center",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setPreviewResume(resumeFile)}
                                style={{
                                  backgroundColor: "#2563eb",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "12px",
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <line x1="10" y1="9" x2="8" y2="9" />
                                </svg>
                                {resumeFile.file_name}
                              </button>
                              {/* <a
                                  href={resumeFile.file_path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  style={{
                                    backgroundColor: "#f3f4f6",
                                    color: "#374151",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    padding: "6px 10px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    textDecoration: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                  ดาวน์โหลด
                                </a> */}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              backgroundColor: "#f9fafb",
                              border: "1px dashed #d1d5db",
                              borderRadius: "10px",
                              padding: "10px",
                              textAlign: "center",
                              color: "#9ca3af",
                              fontSize: "12px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ marginBottom: "8px" }}
                            >
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                              <polyline points="14 2 14 8 20 8" />
                              <circle cx="12" cy="18" r="1" />
                              <path d="M12 14c0-1.5 2-2 2-3s-1-2-2-2-2 1-2 2" />
                            </svg>
                            ยังไม่มีไฟล์เรซูเม่
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Job Preferences */}
                    <div
                      style={{
                        flex: "1",
                        backgroundColor: "#DBDBDB",
                        borderRadius: "12px",
                        padding: "20px",
                      }}
                    >
                      <h2
                        style={{
                          fontSize: "18px",
                          marginTop: 0,
                          marginBottom: "20px",
                          textAlign: "center",
                        }}
                      >
                        งานที่คาดหวัง
                      </h2>

                      {(() => {
                        let titles: any[] = [];
                        if (Array.isArray(selectedJob.job_titles)) {
                          titles = selectedJob.job_titles;
                        } else if (typeof selectedJob.job_titles === "string") {
                          try {
                            const parsed = JSON.parse(selectedJob.job_titles);
                            if (Array.isArray(parsed)) titles = parsed;
                          } catch {
                            titles = [];
                          }
                        }

                        const userJobTitles = titles.filter(
                          (jt: any) =>
                            (typeof jt === "string" && jt.trim() !== "") ||
                            (jt?.job_name && String(jt.job_name).trim() !== ""),
                        );

                        if (userJobTitles.length === 0) return null;

                        return (
                          <div style={{ marginBottom: "15px" }}>
                            <p
                              style={{
                                margin: "0 0 5px 0",
                                color: "#555",
                                fontSize: "13px",
                              }}
                            >
                              ตำแหน่งงาน
                            </p>
                            <ol
                              style={{
                                margin: 0,
                                paddingLeft: "20px",
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: "#333",
                              }}
                            >
                              {userJobTitles.map((jt: any, i: number) => (
                                <li key={i}>
                                  {typeof jt === "string" ? jt : jt.job_name}
                                </li>
                              ))}
                            </ol>
                          </div>
                        );
                      })()}

                      <div style={{ marginBottom: "15px" }}>
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            color: "#555",
                            fontSize: "13px",
                          }}
                        >
                          ประเภทงาน
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          {selectedJob.type_of_work ? (
                            selectedJob.type_of_work
                              .split(",")
                              .map((type, index) => (
                                <span
                                  key={index}
                                  style={{
                                    display: "inline-block",
                                    backgroundColor: "#222",
                                    color: "#ffffff",
                                    padding: "4px 12px",
                                    fontSize: "12px",
                                    borderRadius: "50px",
                                  }}
                                >
                                  {type.trim()}
                                </span>
                              ))
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </div>

                      <div style={{ marginBottom: "15px" }}>
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            color: "#555",
                            fontSize: "13px",
                          }}
                        >
                          เงินเดือนที่คาดหวัง
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#333",
                          }}
                        >
                          {selectedJob.desired_salary || "-"} บาท
                        </p>
                      </div>

                      <div style={{ marginBottom: "15px" }}>
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            color: "#555",
                            fontSize: "13px",
                          }}
                        >
                          สถานที่ทำงานที่คาดหวัง
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#333",
                          }}
                        >
                          {selectedJob.desired_work_location || "-"}
                        </p>
                      </div>

                      <div>
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            color: "#555",
                            fontSize: "13px",
                          }}
                        >
                          วันที่สามารถเริ่มงานได้
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: "#333",
                          }}
                        >
                          {selectedJob.available_start_date
                            ? new Date(
                                selectedJob.available_start_date,
                              ).toLocaleDateString("en-GB")
                            : "-"}
                        </p>
                      </div>

                      <div style={{ marginTop: "15px" }}>
                        <p
                          style={{
                            margin: "0 0 10px 0",
                            color: "#555",
                            fontSize: "13px",
                            fontWeight: "bold",
                          }}
                        >
                          ประวัติการศึกษา
                        </p>
                        {selectedJob.educations &&
                        selectedJob.educations.length > 0 ? (
                          <div className={styles.Educontainer}>
                            <div className={styles.timeline}>
                              <div className={styles.centralLine} />
                              {selectedJob.educations.map((item, index) => (
                                <div
                                  key={item.education_id ?? index}
                                  className={`${styles.timelineItem} ${
                                    index % 2 === 0 ? styles.left : styles.right
                                  }`}
                                >
                                  <div className={styles.content}>
                                    <p className={styles.level}>
                                      {item.level || "-"}
                                    </p>
                                    <h4 className={styles.degree}>
                                      {item.major || "-"}
                                    </h4>
                                    <p className={styles.school}>
                                      {item.institution || "-"}
                                    </p>
                                    <p className={styles.yearText}>
                                      {item.year_start || "-"} –{" "}
                                      {item.year_end || "-"}
                                    </p>
                                  </div>
                                  <div className={styles.connector} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#333",
                            }}
                          >
                            -
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Skills */}
                    <div
                      style={{
                        flex: "1",
                        backgroundColor: "#DBDBDB",
                        borderRadius: "12px",
                        padding: "20px",
                      }}
                    >
                      <h2
                        style={{
                          fontSize: "18px",
                          marginTop: 0,
                          marginBottom: "20px",
                          textAlign: "center",
                        }}
                      >
                        ทักษะ
                      </h2>

                      <div style={{ marginBottom: "15px" }}>
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            color: "#555",
                            fontSize: "13px",
                          }}
                        >
                          ทักษะเฉพาะทาง
                        </p>
                        <ol
                          style={{
                            margin: 0,
                            paddingLeft: "20px",
                            fontSize: "14px",
                            color: "#333",
                          }}
                        >
                          {selectedJob.skills &&
                          selectedJob.skills.length > 0 ? (
                            selectedJob.skills.map((s, i) => (
                              <li key={i}>{s.skill_name}</li>
                            ))
                          ) : (
                            <li>-</li>
                          )}
                        </ol>
                      </div>

                      <div style={{ marginBottom: "15px" }}>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            color: "#555",
                            fontSize: "13px",
                            fontWeight: "bold",
                          }}
                        >
                          ความเร็วในการพิมพ์ (Typing speed)
                        </p>
                        {selectedJob.typing_speed &&
                        selectedJob.typing_speed.length > 0 ? (
                          selectedJob.typing_speed.map((t, idx) => (
                            <p
                              key={idx}
                              style={{
                                margin: "0 0 5px 0",
                                fontSize: "14px",
                                color: "#333",
                              }}
                            >
                              - {t.typing_language} - {t.typing_wpm || "-"} wpm
                            </p>
                          ))
                        ) : (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#333",
                            }}
                          >
                            -
                          </p>
                        )}
                      </div>

                      <div style={{ marginBottom: "15px" }}>
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            color: "#555",
                            fontSize: "13px",
                          }}
                        >
                          ประสบการณ์
                        </p>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "20px",
                            fontSize: "13px",
                            color: "#333",
                          }}
                        >
                          {selectedJob.experiences &&
                          selectedJob.experiences.length > 0 ? (
                            selectedJob.experiences.map((ex, i) => (
                              <li key={i}>
                                <strong>{ex.ex_title}</strong>
                                {ex.ex_description
                                  ? `: ${ex.ex_description}`
                                  : ""}
                              </li>
                            ))
                          ) : (
                            <li>-</li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            color: "#555",
                            fontSize: "13px",
                          }}
                        >
                          ความสามารถทางภาษา
                        </p>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "20px",
                            fontSize: "13px",
                            color: "#333",
                            listStyleType: "disc",
                          }}
                        >
                          {selectedJob.languages &&
                          selectedJob.languages.length > 0 ? (
                            selectedJob.languages.map((l, i) => (
                              <li key={i}>
                                {l.language_type}{" "}
                                {l.level ? `(${l.level})` : ""}
                              </li>
                            ))
                          ) : (
                            <li>-</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{ textAlign: "center", padding: "50px", color: "#666" }}
            >
              กรุณาเลือกผู้สมัครจากรายการด้านซ้าย
            </div>
          )}
        </section>

        {/* Modal ปฏิเสธ */}
        {isRejectModalOpen && (
          <div className={styles.modalOverlay}>
            <div
              className={styles.modalContent}
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <h3>ยืนยันการยกเลิก/ปฏิเสธ</h3>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  marginTop: "20px",
                }}
              >
                <button
                  className={styles.btnConfirm}
                  onClick={() => {
                    const idToReject =
                      targetTrackingId || selectedJob?.tracking_id;
                    if (idToReject) {
                      handleUpdateStatus(idToReject, "reject");
                    }
                    setIsRejectModelOpen(false);
                  }}
                >
                  ยืนยัน
                </button>
                <button
                  className={styles.btnCancel}
                  onClick={() => setIsRejectModelOpen(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal ดูผลแบบทดสอบของผู้สมัคร */}
        <TestResultModal
          isOpen={isTestResultModalOpen}
          onClose={() => setIsTestResultModalOpen(false)}
          trackingId={selectedJob?.tracking_id || null}
          candidateName={selectedJob?.fullname}
          jobPosition={selectedJob?.job_position}
          candidateStatus={status}
        />

        {/* Modal พรีวิวเรซูเม่ / ไฟล์เอกสาร */}
        {previewResume && (
          <div
            className={styles.modalOverlay}
            onClick={() => setPreviewResume(null)}
            style={{ zIndex: 9999 }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                width: "85%",
                maxWidth: "920px",
                height: "85vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: "14px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "15px",
                    color: "#111827",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  📄 ตัวอย่างไฟล์: {previewResume.file_name}
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <a
                    href={previewResume.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      textDecoration: "none",
                      fontWeight: "600",
                    }}
                  >
                    เปิดแท็บใหม่ ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewResume(null)}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: "18px",
                      cursor: "pointer",
                      color: "#6b7280",
                      padding: "4px 8px",
                    }}
                  >
                    ✖
                  </button>
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#525659",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                {previewResume.file_path?.toLowerCase().includes(".pdf") ? (
                  <iframe
                    src={previewResume.file_path}
                    style={{ width: "100%", height: "100%", border: "none" }}
                    title="ตัวอย่างเรซูเม่ (PDF)"
                  />
                ) : (
                  <img
                    src={previewResume.file_path}
                    alt="ตัวอย่างเรซูเม่"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
