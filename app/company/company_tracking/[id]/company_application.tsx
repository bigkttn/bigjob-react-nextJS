"use client";

import React, { useState } from "react";
import styles from "./company_tracking.module.css";
import { apiUrl } from "@/lib/hostURL";
import dynamic from "next/dynamic";
import Link from "next/link";
import TestResultModal from "@/components/TestResultModal";
import { spawn } from "child_process";

const MapComponent = dynamic(() => import("./mapComponent"), {
  ssr: false,
  loading: () => (
    <p style={{ textAlign: "center", padding: "20px" }}>กำลังโหลดแผนที่...</p>
  ),
});

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
  skills?: any[];
  experiences?: any[];
  languages?: any[];
  typing_speed?: any[];
  files?: any[];
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
    if (s === "screening") return "Interview";
    return status.charAt(0).toUpperCase() + status.slice(1);
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
        `${apiUrl}/api/interview_tracking/update-status`,
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
        if (newStatus === "reject" || newStatus === "rejected") {
          setJobs((prev) =>
            prev.filter((job) => job.tracking_id !== trackingId),
          );
          setSelectedJob(null);
        } else {
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

  const resumeFile = selectedJob?.files?.find(
    (f) =>
      f.file_category?.toLowerCase() === "resume" ||
      f.file_name.endsWith(".pdf"),
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
          <aside className={styles.sidebar}>
            {jobs.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px" }}>
                ไม่พบข้อมูลผู้สมัคร
              </p>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.tracking_id}
                  className={`${styles.jobCard} ${selectedJob?.tracking_id === job.tracking_id ? styles.selected : ""}`}
                  onClick={() => setSelectedJob(job)}
                >
                  <div className={styles.cardLeft}>
                    <img
                      src={
                        job.profile_image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(job.fullname || "Seeker")}&background=random`
                      }
                      alt="seeker profile"
                      className={styles.profileLeft}
                    />
                    <div className={styles.cardDetails}>
                      <h4>{job.fullname || "ไม่ระบุชื่อ"}</h4>
                      <p>{job.job_position || "ไม่ระบุตำแหน่ง"}</p>
                    </div>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(job.status)}`}
                  >
                    {getDisplayStatus(job.status)}
                  </span>
                </div>
              ))
            )}
          </aside>
        </div>

        {/* Right Panel */}
        <section className={styles.rightPanel}>
          <div
            style={{
              width: "100%",
              height: "auto",
              backgroundColor: "#9D9D9D",
              borderRadius: "10px",
              padding: "15px",
            }}
          >
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
                      <span className={styles.stepLabel}>Pending</span>
                      {status === "pending" && (
                        <div className={styles.inlineDatePicker}>
                          <p className={styles.txtWaiting}>
                            รอผู้สมัครงานตอบกลับ
                          </p>
                          <button
                            type="button"
                            className={styles.txtRejected}
                            onClick={() =>
                              handleOpenRejectModal(selectedJob.tracking_id)
                            }
                          >
                            ยกเลิก
                          </button>
                        </div>
                      )}
                    </div>
                    <div
                      className={`${styles.stepLine} ${["applied", "screening", "interview", "appointment", "offer", "hired"].includes(status) ? styles.activeLine : ""}`}
                    />

                    {/* Step 2: Applied (บริษัทตั้งค่าและกดส่งนัดหมาย Screening) */}
                    <div
                      className={`${styles.step} ${["applied", "screening", "interview", "appointment", "offer", "hired"].includes(status) ? styles.active : ""} ${status === "applied" ? styles.currentStep : ""}`}
                    >
                      <div className={styles.stepIcon}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "24px" }}
                        >
                          task_alt
                        </span>
                      </div>
                      <span className={styles.stepLabel}>Applied</span>

                      {status === "applied" && (
                        <div
                          className={styles.inlineDatePicker}
                          style={{
                            backgroundColor: "#fff",
                            padding: "15px",
                            borderRadius: "8px",
                            border: "1px solid #ccc",
                            marginTop: "10px",
                          }}
                        >
                          <label>วันสัมภาษณ์:</label>
                          <label>วันสัมภาษณ์:</label>
                          <input
                            type="date"
                            min={minDate} // ล็อกปฏิทินไม่ให้เลือกวันในอดีตได้
                            value={interviewDate}
                            onChange={(e) => setInterviewDate(e.target.value)}
                            style={{
                              borderColor: isPastDate ? "#d32f2f" : "#ccc", // เปลี่ยนกรอบเป็นสีแดงถ้าพิมพ์วันย้อนหลัง
                              outline: isPastDate ? "none" : "",
                            }}
                          />

                          {/* แสดงข้อความเตือนสีแดงเล็กๆ หากเป็นวันที่ย้อนหลัง */}
                          {isPastDate && (
                            <span
                              style={{
                                color: "#d32f2f",
                                fontSize: "12px",
                                display: "block",
                                marginTop: "4px",
                              }}
                            >
                              * ไม่สามารถเลือกวันแบบย้อนหลังได้
                            </span>
                          )}
                          <label>เวลาสัมภาษณ์:</label>
                          <input
                            type="time"
                            value={interviewTime}
                            onChange={(e) => setInterviewTime(e.target.value)}
                          />

                          <label style={{ marginTop: "10px" }}>
                            รูปแบบการสัมภาษณ์:
                          </label>
                          <div
                            style={{
                              display: "flex",
                              gap: "15px",
                              marginBottom: "10px",
                            }}
                          >
                            <label>
                              <input
                                type="radio"
                                value="onsite"
                                checked={interviewType === "onsite"}
                                onChange={() => setInterviewType("onsite")}
                              />{" "}
                              On-site
                            </label>
                            <label>
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
                              <label>สถานที่สัมภาษณ์:</label>
                              <div className={styles.mapContainer}>
                                <input
                                  className={styles.inputMap}
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
                                />
                                <button
                                  type="button"
                                  className={styles.btnMap}
                                  onClick={handleOpenMap}
                                >
                                  ปักหมุด
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <label>ลิงก์สัมภาษณ์:</label>
                              <input
                                type="text"
                                placeholder="วางลิงก์ที่นี่..."
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                style={{ width: "100%", padding: "8px" }}
                              />
                            </>
                          )}

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "10px",
                              marginTop: "15px",
                            }}
                          >
                            {/* +++ เพิ่มส่วนเช็กความครบถ้วนก่อนกดปุ่ม +++ */}
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
                                    className={styles.btnSubmitStep}
                                    style={{
                                      width: "8rem",
                                      backgroundColor:
                                        !isInterviewFormComplete || isPastDate
                                          ? "#9e9e9e"
                                          : "",
                                      cursor:
                                        !isInterviewFormComplete || isPastDate
                                          ? "not-allowed"
                                          : "pointer",
                                    }}
                                    disabled={
                                      !isInterviewFormComplete ||
                                      Boolean(isPastDate)
                                    } // บล็อกไม่ให้กดปุ่มได้
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
                                    นัดสัมภาษณ์
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.txtRejected}
                                    style={{
                                      padding: "6px 14px",
                                      fontSize: "12px",
                                    }}
                                    onClick={() =>
                                      handleOpenRejectModal(
                                        selectedJob.tracking_id,
                                      )
                                    }
                                  >
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
                      <span className={styles.stepLabel}>Interview</span>

                      {status === "screening" && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            width: "10rem",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "10px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#555",
                              margin: 0,
                            }}
                          >
                            รอผู้สมัครยืนยันการนัดหมาย
                          </p>
                          <button
                            type="button"
                            className={styles.txtRejected}
                            style={{ padding: "5px 12px", fontSize: "11px" }}
                            onClick={() =>
                              handleOpenRejectModal(selectedJob.tracking_id)
                            }
                          >
                            ยกเลิก
                          </button>
                        </div>
                      )}

                      {status === "interview" && (
                        <div
                          className={styles.interviewDetailsCard}
                          style={{
                            backgroundColor: "#fff",
                            padding: "15px",
                            borderRadius: "8px",
                            border: "1px solid #ccc",
                            marginTop: "10px",
                          }}
                        >
                          <h3
                            style={{
                              borderBottom: "1px solid #333",
                              paddingBottom: "4px",
                              fontSize: "14px",
                            }}
                          >
                            รายละเอียดการนัดหมาย
                          </h3>
                          <p>
                            <strong>วัน:</strong>{" "}
                            {selectedJob.interview_date
                              ? new Date(
                                  selectedJob.interview_date,
                                ).toLocaleDateString("th-TH")
                              : "ไม่ระบุ"}
                          </p>
                          <p>
                            <strong>เวลา:</strong>{" "}
                            {selectedJob.interview_date
                              ? new Date(
                                  selectedJob.interview_date,
                                ).toLocaleTimeString("th-TH")
                              : "ไม่ระบุ"}
                          </p>
                          <p>
                            <strong>สถานที่:</strong>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedJob.location || "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#0288d1",
                                textDecoration: "underline",
                                display: "inline-block",
                                maxWidth:
                                  "70%" /* ให้กว้างสุดเท่าที่กล่องจะรับได้ */,
                                whiteSpace:
                                  "nowrap" /* บังคับไม่ให้ขึ้นบรรทัดใหม่ */,
                                overflow: "hidden" /* ซ่อนข้อความที่ล้น */,
                                textOverflow:
                                  "ellipsis" /* ใส่ ... ตรงที่ล้น */,
                                verticalAlign: "bottom",
                              }}
                            >
                              {selectedJob.location}
                            </a>
                          </p>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <button
                              type="button"
                              className={styles.txtRejected}
                              style={{ marginTop: "10px" }}
                              onClick={() =>
                                handleOpenRejectModal(selectedJob.tracking_id)
                              }
                            >
                              ยกเลิก
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
                      <span className={styles.stepLabel}>Appointment</span>

                      {status === "interview" && selectedJob.interview_date && (
                        <div
                          style={{
                            backgroundColor: "#fff",
                            padding: "15px",
                            borderRadius: "8px",
                            // border: "1px solid #ccc",
                            marginTop: "10px",
                            width: "100%",
                          }}
                        >
                          {/* กรณีที่ 1: ยังไม่ถึง 1 วันหลังสัมภาษณ์ */}
                          {isWaitingForInterviewEnd && (
                            <div style={{ textAlign: "center" }}>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#ff9800",
                                  margin: "0 0 5px 0",
                                  fontWeight: "bold",
                                }}
                              >
                                รอการสัมภาษณ์เสร็จสิ้น
                              </p>
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#555",
                                  margin: "0 0 10px 0",
                                }}
                              >
                                ประเมินผลได้ตั้งแต่วันที่ {offerStartDateStr}
                              </p>
                              <button
                                type="button"
                                className={styles.txtRejected}
                                style={{
                                  padding: "5px 12px",
                                  fontSize: "11px",
                                }}
                                onClick={() =>
                                  handleOpenRejectModal(selectedJob.tracking_id)
                                }
                              >
                                ยกเลิก
                              </button>
                            </div>
                          )}

                          {/* กรณีที่ 2: อยู่ในช่วง 1 - 7 วัน (เปิดให้กรอกวันเริ่มงาน) */}
                          {canMakeOffer && (
                            <div className={styles.inlineDatePicker}>
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#d32f2f",
                                  margin: "0 0 10px 0",
                                  textAlign: "center",
                                }}
                              >
                                * ตัดสินใจได้ถึงวันที่ {offerEndDateStr}
                              </p>
                              <label
                                style={{
                                  fontSize: "13px",
                                  display: "block",
                                  marginBottom: "5px",
                                }}
                              >
                                กำหนดวันเริ่มงาน:
                              </label>
                              <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{
                                  width: "100%",
                                  marginBottom: "10px",
                                  padding: "5px",
                                }}
                              />
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  justifyContent: "center",
                                  marginTop: "5px",
                                }}
                              >
                                <button
                                  className={styles.btnSubmitStep}
                                  style={{
                                    flex: 1,
                                    backgroundColor: startDate
                                      ? "#2e7d32"
                                      : "#9e9e9e",
                                    color: "#fff",
                                    border: "none",
                                    padding: "8px",
                                    borderRadius: "4px",
                                    cursor: startDate
                                      ? "pointer"
                                      : "not-allowed",
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
                                  disabled={!startDate} // ปิดปุ่มถ้ายังไม่เลือกวันเริ่มงาน
                                >
                                  ส่งข้อเสนอเริ่มงาน
                                </button>
                                <button
                                  type="button"
                                  className={styles.txtRejected}
                                  style={{
                                    padding: "8px 12px",
                                    fontSize: "12px",
                                  }}
                                  onClick={() =>
                                    handleOpenRejectModal(
                                      selectedJob.tracking_id,
                                    )
                                  }
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          )}

                          {/* กรณีที่ 3: หมดเวลาพิจารณา (เกิน 7 วัน) */}
                          {isOfferExpired && (
                            <div style={{ textAlign: "center" }}>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#d32f2f",
                                  margin: "0 0 5px 0",
                                  fontWeight: "bold",
                                }}
                              >
                                หมดเวลาพิจารณารับเข้าทำงาน
                              </p>
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#555",
                                  margin: "0 0 10px 0",
                                }}
                              >
                                เกินกำหนด 7 วันหลังการสัมภาษณ์
                              </p>
                              <button
                                className={styles.btnReject}
                                style={{
                                  width: "100%",
                                  backgroundColor: "#d32f2f",
                                  color: "#fff",
                                  border: "none",
                                  padding: "8px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  handleOpenRejectModal(selectedJob.tracking_id)
                                }
                              >
                                ปรับสถานะเป็นไม่ผ่าน
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* เมื่อส่งข้อเสนอไปแล้ว จะแสดงข้อความนี้ */}
                      {(status === "appointment" || status === "offer") && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "10px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#2e7d32",
                              margin: 0,
                              fontWeight: "bold",
                              textAlign: "center",
                            }}
                          >
                            ส่งข้อเสนองานเรียบร้อยแล้ว
                          </p>
                        </div>
                      )}

                      {status === "hired" && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "10px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#2e7d32",
                              margin: 0,
                              fontWeight: "bold",
                              textAlign: "center",
                            }}
                          >
                            ผู้สมัครตอบรับเข้าทำงานแล้ว
                          </p>
                          <button
                            type="button"
                            className={styles.txtRejected}
                            style={{ padding: "5px 12px", fontSize: "11px" }}
                            onClick={() =>
                              handleOpenRejectModal(selectedJob.tracking_id)
                            }
                          >
                            ยกเลิก
                          </button>
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
                      {/* ซ่อนปุ่ม และแสดงข้อความแทน ถ้าไม่มีแบบทดสอบ */}
                      {selectedJob.has_test ? (
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
                        <img
                          src={
                            selectedJob.profile_image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedJob.fullname || "Seeker")}`
                          }
                          alt="profile"
                          style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            marginBottom: "10px",
                          }}
                        />
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
                            <strong>Mobile:</strong>{" "}
                            {selectedJob.mobile_phone || "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Age:</strong> {selectedJob.age || "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Gender:</strong> {selectedJob.gender || "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Nationality:</strong>{" "}
                            {selectedJob.nationality || "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Military Status:</strong>{" "}
                            {selectedJob.military_status || "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Religion:</strong>{" "}
                            {selectedJob.religion || "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Weight / Height:</strong>{" "}
                            {selectedJob.weight
                              ? `${selectedJob.weight} kg`
                              : "-"}{" "}
                            /{" "}
                            {selectedJob.height
                              ? `${selectedJob.height} cm`
                              : "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            <strong>Current Address:</strong>{" "}
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

                        {resumeFile && (
                          <a
                            href={resumeFile.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              marginTop: "auto",
                              backgroundColor: "#e2e2e2",
                              padding: "8px 12px",
                              borderRadius: "20px",
                              color: "#000000",
                              textDecoration: "none",
                              fontSize: "14px",
                              fontWeight: "bold",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%",
                            }}
                          >
                            {resumeFile.file_name || "resume file"}
                          </a>
                        )}
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
                          } else if (
                            typeof selectedJob.job_titles === "string"
                          ) {
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
                              (jt?.job_name &&
                                String(jt.job_name).trim() !== ""),
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
                              margin: "0 0 5px 0",
                              color: "#555",
                              fontSize: "13px",
                            }}
                          >
                            Typing speed in Thai (wpm)
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#333",
                            }}
                          >
                            - Thai -{" "}
                            {selectedJob.typing_speed?.find(
                              (t) =>
                                t.typing_language === "Thai" ||
                                t.typing_language === "ไทย",
                            )?.typing_wpm || "-"}{" "}
                            wpm
                          </p>
                          <p
                            style={{
                              margin: "10px 0 5px 0",
                              color: "#555",
                              fontSize: "13px",
                            }}
                          >
                            Typing speed in English (wpm)
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#333",
                            }}
                          >
                            - English -{" "}
                            {selectedJob.typing_speed?.find(
                              (t) =>
                                t.typing_language === "English" ||
                                t.typing_language === "อังกฤษ" ||
                                t.typing_language === "Eng",
                            )?.typing_wpm || "-"}{" "}
                            wpm
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
                style={{ textAlign: "center", padding: "50px", color: "#fff" }}
              >
                กรุณาเลือกผู้สมัครจากรายการด้านซ้าย
              </div>
            )}
          </div>
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
        />
      </main>
    </div>
  );
}
