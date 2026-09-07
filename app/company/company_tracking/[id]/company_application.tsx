"use client";

import React, { useState } from "react";
import styles from "./company_tracking.module.css";
import { apiUrl } from "@/lib/hostURL";

// 1. เพิ่ม Interfaces สำหรับ Sub-tables
export interface SkillItem {
  skill_id: number;
  skill_name: string;
  skill_category?: string;
  skill_detail?: string;
}

export interface ExperienceItem {
  experience_id: number;
  ex_title: string;
  ex_description?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
}

export interface TypingSpeedItem {
  typing_id: number;
  typing_language: string;
  typing_wpm: number;
}

export interface LanguageItem {
  lang_id: number;
  language_type: string;
  level?: string;
  test_name?: string;
  score?: string;
}

export interface FileItem {
  file_id: number;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_category?: string;
}

// 2. อัปเดต Interface Applicant ให้รวม Sub-tables
export interface Applicant {
  tracking_id: number;
  post_id: number;
  user_id: number;
  status: string;
  interview_message?: string;
  date_time?: string;
  job_position?: string;
  fullname?: string;
  email?: string;
  gender?: string;
  age?: number;
  military_status?: string;
  date_of_birth?: string;
  nationality?: string;
  religion?: string;
  weight?: number;
  height?: number;
  disability_status?: string;
  marital_status?: string;
  mobile_phone?: string;
  line_id?: string;
  country?: string;
  address?: string;
  province?: string;
  district?: string;
  sub_district?: string;
  postal_code?: string;
  type_of_work?: string;
  available_start_date?: string;
  desired_salary?: string;
  desired_work_location?: string;
  profile_image?: string;
  // เพิ่ม 5 properties ตัวใหม่
  skills?: SkillItem[];
  experiences?: ExperienceItem[];
  typing_speed?: TypingSpeedItem[];
  languages?: LanguageItem[];
  files?: FileItem[];
}

interface ComponentProps {
  initialJobs: Applicant[];
  companyId: string;
}

export default function CompanyApplication({ initialJobs, companyId }: ComponentProps) {
  const [jobs, setJobs] = useState<Applicant[]>(initialJobs || []);
  const [selectedJob, setSelectedJob] = useState<Applicant | null>(
    initialJobs && initialJobs.length > 0 ? initialJobs[0] : null
  );

  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [startDate, setStartDate] = useState("");

  const getStatusClass = (status: string = "pending") => {
    switch (status.toLowerCase()) {
      case "interview":
        return styles.statusInterview;
      case "rejected":
      case "closed":
        return styles.statusRejected;
      case "applied":
      case "appointment":
        return styles.statusOffer;
      default:
        return styles.statusPending;
    }
  };

  const steps = ["pending", "Applied", "Interview", "Appointment"];

  const getStepStatus = (stepName: string, currentStatus: string = "pending") => {
    const stepIndex = steps.findIndex((s) => s.toLowerCase() === stepName.toLowerCase());
    const currentIndex = steps.findIndex((s) => s.toLowerCase() === currentStatus.toLowerCase());

    if (currentIndex === -1) return "";
    if (stepIndex === currentIndex) return styles.active;
    if (stepIndex < currentIndex) return styles.completed;
    return "";
  };

  const handleUpdateStatus = async (trackingId: number, newStatus: string) => {
    if (!selectedJob) return;

    try {
      const response = await fetch(`${apiUrl}/api/interview_tracking/update_status/company`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_id: trackingId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job.tracking_id === trackingId ? { ...job, status: newStatus } : job
          )
        );

        if (selectedJob && selectedJob.tracking_id === trackingId) {
          setSelectedJob((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // ดึงไฟล์ PDF Resume ของผู้สมัคร
  const resumeFile = selectedJob?.files?.find(
    (f) => f.file_category?.toLowerCase() === "resume" || f.file_name.endsWith(".pdf")
  ) || selectedJob?.files?.[0];

  // ดึงความเร็วพิมพ์ดีดภาษาไทย และ อังกฤษ
  const thaiTyping = selectedJob?.typing_speed?.find(
    (t) => t.typing_language.toLowerCase() === "thai" || t.typing_language === "ไทย"
  );
  const engTyping = selectedJob?.typing_speed?.find(
    (t) => t.typing_language.toLowerCase() === "english" || t.typing_language === "อังกฤษ"
  );

  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        {/* รายการผู้สมัครด้านซ้าย */}
        <aside className={styles.sidebar}>
          {jobs.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px" }}>ไม่พบข้อมูลผู้สมัคร</p>
          ) : (
            jobs.map((job) => (
              <div
                key={job.tracking_id}
                className={`${styles.jobCard} ${selectedJob?.tracking_id === job.tracking_id ? styles.selected : ""
                  }`}
                onClick={() => setSelectedJob(job)}
              >
                <div className={styles.cardLeft}>
                  <img
                    src={job.profile_image || "/default-avatar.png"}
                    alt={job.fullname || "Applicant"}
                    className={styles.companyLogo}
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute("src", "https://via.placeholder.com/50");
                    }}
                  />
                  <div className={styles.cardDetails}>
                    <h4>{job.fullname || "ไม่ระบุชื่อ"}</h4>
                    <p>{job.job_position || "ไม่ระบุตำแหน่ง"}</p>
                  </div>
                </div>
                <span className={`${styles.statusBadge} ${getStatusClass(job.status)}`}>
                  {job.status || "Pending"}
                </span>
              </div>
            ))
          )}
        </aside>

        {/* รายละเอียดผู้สมัครด้านขวา */}
        <section className={styles.rightPanel}>
          <div style={{ width: "56rem", height: "45rem", backgroundColor: "#9D9D9D" }}>
            {selectedJob ? (
              <>
                {/* Stepper Status Box */}
                <div className={styles.trackerBox}>
                  <div className={styles.stepperContainer}>
                    {steps.map((step, idx) => {
                      const currentStatus = selectedJob.status?.toLowerCase() || "";

                      return (
                        <React.Fragment key={step}>
                          <div className={`${styles.step} ${getStepStatus(step, selectedJob.status)}`}>
                            <div className={styles.stepIcon}>
                              {step === "pending" && "📄"}
                              {step === "Applied" && "☑️"}
                              {step === "Interview" && "🎙️"}
                              {step === "Appointment" && "💼"}
                            </div>
                            <span className={styles.stepLabel}>{step}</span>

                            {step === "pending" && (
                              <div className={styles.stepActionArea}>
                                {currentStatus === "pending" ? (
                                  <span className={styles.txtWaiting}>รอผู้สมัครตอบรับงาน</span>
                                ) : currentStatus === "rejected" ? (
                                  <span className={styles.txtRejected}>ผู้สมัครปฏิเสธงานแล้ว</span>
                                ) : null}
                              </div>
                            )}

                            {step === "Applied" && currentStatus === "applied" && (
                              <div className={styles.stepActionArea}>
                                <div className={styles.actionBtnGroup}>
                                  <button
                                    onClick={() => handleUpdateStatus(selectedJob.tracking_id, "prepinterview")}
                                    className={styles.btnRead}
                                  >
                                    รับสัมภาษณ์
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(selectedJob.tracking_id, "rejected")}
                                    className={styles.btnReject}
                                  >
                                    ปฏิเสธ
                                  </button>
                                </div>
                              </div>
                            )}

                            {step === "Interview" && (
                              <div className={styles.stepActionArea}>
                                {currentStatus === "screening" || currentStatus === "applied" ? (
                                  <div className={styles.inlineDatePicker}>
                                    <input
                                      type="date"
                                      value={meetingDate}
                                      onChange={(e) => setMeetingDate(e.target.value)}
                                      className={styles.inputField}
                                    />
                                    <input
                                      type="time"
                                      value={meetingTime}
                                      onChange={(e) => setMeetingTime(e.target.value)}
                                      className={styles.inputField}
                                    />
                                    <button
                                      onClick={() => handleUpdateStatus(selectedJob.tracking_id, "interview_pending")}
                                      className={styles.btnSetDate}
                                    >
                                      นัดสัมภาษณ์
                                    </button>
                                  </div>
                                ) : currentStatus === "interview_pending" ? (
                                  <span className={styles.txtWaiting}>นัดหมายแล้ว (รอผู้สมัครตอบกลับ)</span>
                                ) : null}
                              </div>
                            )}

                            {step === "Appointment" && (
                              <div className={styles.stepActionArea}>
                                {currentStatus === "interview_passed" || currentStatus === "interview" ? (
                                  <div className={styles.inlineDatePicker}>
                                    <label>วันเริ่มงาน:</label>
                                    <input
                                      type="date"
                                      value={startDate}
                                      onChange={(e) => setStartDate(e.target.value)}
                                      className={styles.inputField}
                                    />
                                    <button
                                      onClick={() => handleUpdateStatus(selectedJob.tracking_id, "offer_pending")}
                                      className={styles.btnSetDate}
                                    >
                                      ส่งข้อเสนอเริ่มงาน
                                    </button>
                                  </div>
                                ) : currentStatus === "offer_pending" ? (
                                  <span className={styles.txtWaiting}>ส่งวันเริ่มงานแล้ว (รอผู้สมัครตอบกลับ)</span>
                                ) : null}
                              </div>
                            )}
                          </div>
                          {idx < steps.length - 1 && <div className={styles.stepLine} />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* ข้อมูลโปรไฟล์ผู้สมัคร 3 คอลัมน์ */}
                <div className={styles.detailGrid}>
                  {/* คอลัมน์ที่ 1: Profile ส่วนตัว */}
                  <div className={styles.columnProfile}>
                    <div className={styles.avatarWrapper}>
                      <img
                        src={selectedJob.profile_image || "/default-avatar.png"}
                        alt="Applicant Avatar"
                        className={styles.profileAvatar}
                        onError={(e) => {
                          (e.target as HTMLElement).setAttribute("src", "https://via.placeholder.com/100");
                        }}
                      />
                      <h3>{selectedJob.fullname || "ไม่ระบุชื่อ"}</h3>
                      <a href={`mailto:${selectedJob.email}`} className={styles.emailLink}>
                        {selectedJob.email || "ไม่ระบุ"}
                      </a>
                    </div>

                    <div className={styles.personalInfoList}>
                      <p><span>Gender:</span> {selectedJob.gender || "ไม่ระบุ"}</p>
                      <p><span>Age:</span> {selectedJob.age || "ไม่ระบุ"}</p>
                      <p><span>Military Status:</span> {selectedJob.military_status || "ไม่ระบุ"}</p>
                      <p><span>Date of Birth:</span> {selectedJob.date_of_birth || "ไม่ระบุ"}</p>
                      <p><span>Nationality:</span> {selectedJob.nationality || "ไม่ระบุ"}</p>
                      <p><span>Religion:</span> {selectedJob.religion || "ไม่ระบุ"}</p>
                      <p><span>Weight:</span> {selectedJob.weight ? `${selectedJob.weight} kg` : "ไม่ระบุ"}</p>
                      <p><span>Height:</span> {selectedJob.height ? `${selectedJob.height} cm` : "ไม่ระบุ"}</p>
                      <p><span>Disability Status:</span> {selectedJob.disability_status || "ไม่ระบุ"}</p>
                      <p><span>Marital Status:</span> {selectedJob.marital_status || "ไม่ระบุ"}</p>
                      <p><span>Mobile Phone:</span> {selectedJob.mobile_phone || "ไม่ระบุ"}</p>
                      <p><span>LINE ID:</span> {selectedJob.line_id || "ไม่ระบุ"}</p>
                      <p><span>Country:</span> {selectedJob.country || "ไม่ระบุ"}</p>
                      <p>
                        <span>Current Address:</span>{" "}
                        {[
                          selectedJob.address,
                          selectedJob.sub_district,
                          selectedJob.district,
                          selectedJob.province,
                          selectedJob.postal_code,
                        ]
                          .filter(Boolean)
                          .join(", ") || "ไม่ระบุ"}
                      </p>
                    </div>

                    {/* ปุ่มดาวน์โหลด Resume PDF จริงจาก Database */}
                    {resumeFile ? (
                      <a
                        href={resumeFile.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.pdfDownloadBtn}
                      >
                        {resumeFile.file_name}
                      </a>
                    ) : (
                      <span className={styles.pdfDownloadBtn} style={{ opacity: 0.6 }}>
                        ไม่มีไฟล์แนบ
                      </span>
                    )}
                  </div>

                  {/* คอลัมน์ที่ 2: Job Preferences */}
                  <div className={styles.columnCard}>
                    <h2>Job Preferences</h2>
                    <div className={styles.cardSection}>
                      <label>Job Title</label>
                      <ol>
                        <li>{selectedJob.job_position || "ไม่ระบุ"}</li>
                      </ol>
                    </div>

                    <div className={styles.cardSection}>
                      <label>Type Of Work</label>
                      <div className={styles.badgeContainer}>
                        {selectedJob.type_of_work
                          ? selectedJob.type_of_work.split(",").map((item, index) => (
                            <div key={index} className={styles.badgePill}>
                              {item.trim()}
                            </div>
                          ))
                          : "-"}
                      </div>
                    </div>

                    <div className={styles.cardSection}>
                      <label>Desired salary (baht)</label>
                      <p>{selectedJob.desired_salary || "ไม่ระบุ"}</p>
                    </div>

                    <div className={styles.cardSection}>
                      <label>Desired work location</label>
                      <p>{selectedJob.desired_work_location || "ไม่ระบุ"}</p>
                    </div>

                    <div className={styles.cardSection}>
                      <label>Available start date</label>
                      <p>{selectedJob.available_start_date || "ไม่ระบุ"}</p>
                    </div>
                  </div>

                  {/* คอลัมน์ที่ 3: Skills, Experiences, Languages (แมปข้อมูลจริงจาก DB) */}
                  <div className={styles.columnCard}>
                    <h2>Skills</h2>

                    {/* Specific Skills */}
                    <div className={styles.cardSection}>
                      <label>specific skills</label>
                      {selectedJob.skills && selectedJob.skills.length > 0 ? (
                        <ol>
                          {selectedJob.skills.map((skill) => (
                            <li key={skill.skill_id}>{skill.skill_name}</li>
                          ))}
                        </ol>
                      ) : (
                        <p>-</p>
                      )}
                    </div>

                    {/* Typing Speed */}
                    <div className={styles.cardSection}>
                      <label>Typing speed in Thai (wpm)</label>
                      <p>{thaiTyping ? `- Thai - ${thaiTyping.typing_wpm} wpm` : "-"}</p>
                    </div>

                    <div className={styles.cardSection}>
                      <label>Typing speed in English (wpm)</label>
                      <p>{engTyping ? `- English - ${engTyping.typing_wpm} wpm` : "-"}</p>
                    </div>

                    {/* Experiences */}
                    <div className={styles.cardSection}>
                      <label>Projects, Achievements, and Other Experiences</label>
                      {selectedJob.experiences && selectedJob.experiences.length > 0 ? (
                        <ul>
                          {selectedJob.experiences.map((exp) => (
                            <li key={exp.experience_id}>
                              <strong>{exp.ex_title}</strong>
                              {exp.ex_description ? `: ${exp.ex_description}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>-</p>
                      )}
                    </div>

                    {/* Language Proficiency */}
                    <div className={styles.cardSection}>
                      <label>Language Proficiency</label>
                      {selectedJob.languages && selectedJob.languages.length > 0 ? (
                        <ul>
                          {selectedJob.languages.map((lang) => (
                            <li key={lang.lang_id}>
                              {lang.language_type}
                              {lang.level ? `: ${lang.level}` : ""}
                              {lang.score ? ` (${lang.score})` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>-</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>กรุณาเลือกผู้สมัครจากรายการด้านซ้าย</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}