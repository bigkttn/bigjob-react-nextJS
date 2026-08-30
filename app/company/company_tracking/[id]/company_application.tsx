"use client";

import React, { useState } from "react";
import styles from "./company_tracking.module.css";
import { apiUrl } from "@/lib/hostURL";

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
    try {
      const response = await fetch(`${apiUrl}/api/interview_tracking/update_status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_id: trackingId,
          status: newStatus,
          meeting_date: meetingDate,
          meeting_time: meetingTime,
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
                className={`${styles.jobCard} ${
                  selectedJob?.tracking_id === job.tracking_id ? styles.selected : ""
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
         <div style={{ width: '54rem', backgroundColor: '#D9D9D9' }}>
             {selectedJob ? (
            <>
              {/* Stepper Status Box */}
              <div className={styles.trackerBox}>
                <div className={styles.stepperContainer}>
                  {steps.map((step, idx) => (
                    <React.Fragment key={step}>
                      <div className={`${styles.step} ${getStepStatus(step, selectedJob.status)}`}>
                        <div className={styles.stepIcon}>
                          {step === "pending" && "📄"}
                          {step === "Applied" && "☑️"}
                          {step === "Interview" && "🎙️"}
                          {step === "Appointment" && "💼"}
                        </div>
                        <span className={styles.stepLabel}>{step}</span>

                        {/* ปุ่มเปิดอ่าน/ปฏิเสธ ใต้ Step Applied */}
                        {step === "Applied" && selectedJob.status.toLowerCase() === "applied" && (
                          <div className={styles.actionBtnGroup}>
                            <button
                              onClick={() => handleUpdateStatus(selectedJob.tracking_id, "screening")}
                              className={styles.btnRead}
                            >
                              อ่าน
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(selectedJob.tracking_id, "rejected")}
                              className={styles.btnReject}
                            >
                              ปฏิเสธ
                            </button>
                          </div>
                        )}
                      </div>
                      {idx < steps.length - 1 && <div className={styles.stepLine} />}
                    </React.Fragment>
                  ))}
                </div>

                {/* แถบเลือกวันและเวลานัดหมายสัมภาษณ์ */}
                <div className={styles.datePickerRow}>
                  <div className={styles.dateInputGroup}>
                    <label>Meeting date</label>
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                  <div className={styles.dateInputGroup}>
                    <label>Meeting time</label>
                    <input
                      type="time"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                  <button
                    onClick={() => handleUpdateStatus(selectedJob.tracking_id, "Interview")}
                    className={styles.btnSetDate}
                  >
                    date
                  </button>
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
                    <h3>{selectedJob.fullname || "Ruben amorim"}</h3>
                    <a href={`mailto:${selectedJob.email}`} className={styles.emailLink}>
                      {selectedJob.email || "rubenamorim@gamil.com"}
                    </a>
                  </div>

                  <div className={styles.personalInfoList}>
                    <p><span>Gender:</span> {selectedJob.gender || "Male"}</p>
                    <p><span>Age:</span> {selectedJob.age || "40"}</p>
                    <p><span>Military Status:</span> {selectedJob.military_status || "Completed military service"}</p>
                    <p><span>Date of Birth:</span> {selectedJob.date_of_birth || "27 January 1985"}</p>
                    <p><span>Nationality:</span> {selectedJob.nationality || "Portuguese"}</p>
                    <p><span>Religion:</span> {selectedJob.religion || "Christian"}</p>
                    <p><span>Weight:</span> {selectedJob.weight || "73"} kg</p>
                    <p><span>Height:</span> {selectedJob.height || "178"} cm</p>
                    <p><span>Disability Status:</span> {selectedJob.disability_status || "None"}</p>
                    <p><span>Marital Status:</span> {selectedJob.marital_status || "Married"}</p>
                    <p><span>Mobile Phone:</span> {selectedJob.mobile_phone || "093432342"}</p>
                    <p><span>LINE ID:</span> {selectedJob.line_id || "ruben178"}</p>
                    <p><span>Country:</span> {selectedJob.country || "United Kingdom"}</p>
                    <p>
                      <span>Current Address:</span>{" "}
                      {[
                        selectedJob.address || "12/3 Soi Greenfield, Sukhumvit Road",
                        selectedJob.province || "Bangkok",
                        selectedJob.district || "Bang Na",
                        selectedJob.postal_code || "10260",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>

                  <a href="#" className={styles.pdfDownloadBtn}>
                    {selectedJob.fullname?.toLowerCase().replace(/\s+/g, "") || "rubenamorim"}.pdf
                  </a>
                </div>

                {/* คอลัมน์ที่ 2: Job Preferences */}
                <div className={styles.columnCard}>
                  <h2>Job Preferences</h2>
                  <div className={styles.cardSection}>
                    <label>Job Title</label>
                    <ol>
                      <li>{selectedJob.job_position || "Head Coach"}</li>
                      <li>-</li>
                      <li>-</li>
                    </ol>
                  </div>

                  <div className={styles.cardSection}>
                    <label>Type Of Work</label>
                    <ol>
                      <li>{selectedJob.type_of_work || "Full-time"}</li>
                    </ol>
                  </div>

                  <div className={styles.cardSection}>
                    <label>Type of Employment</label>
                    <div className={styles.badgePill}>Full-time</div>
                  </div>

                  <div className={styles.cardSection}>
                    <label>Desired salary (baht)</label>
                    <p>{selectedJob.desired_salary || "300,000 - 500,000"}</p>
                  </div>

                  <div className={styles.cardSection}>
                    <label>Desired work location</label>
                    <p>{selectedJob.desired_work_location || "United kingdom"}</p>
                  </div>

                  <div className={styles.cardSection}>
                    <label>Available start date</label>
                    <p>{selectedJob.available_start_date || "1 October 2025"}</p>
                  </div>
                </div>

                {/* คอลัมน์ที่ 3: Skills */}
                <div className={styles.columnCard}>
                  <h2>Skills</h2>
                  <div className={styles.cardSection}>
                    <label>specific skills</label>
                    <ol>
                      <li>Tactical Awareness</li>
                      <li>Player Development Skills</li>
                      <li>Game Analysis and Performance Evaluation</li>
                    </ol>
                  </div>

                  <div className={styles.cardSection}>
                    <label>Typing speed in Thai (wpm)</label>
                    <p>-Thai – 45 wpm</p>
                  </div>

                  <div className={styles.cardSection}>
                    <label>Typing speed in English (wpm)</label>
                    <p>-English – 60 wpm</p>
                  </div>

                  <div className={styles.cardSection}>
                    <label>Projects, Achievements, and Other Experiences</label>
                    <ul>
                      <li>Successfully led a team project to develop a mobile app used by over 10,000 users.</li>
                      <li>Received Employee of the Year award in 2023.</li>
                      <li>Volunteered as a community organizer for local environmental campaigns.</li>
                    </ul>
                  </div>

                  <div className={styles.cardSection}>
                    <label>Language Proficiency</label>
                    <ul>
                      <li>English: Fluent (IELTS 7.5)</li>
                      <li>Portuguese: Native</li>
                      <li>Thai: Intermediate (spoken and written)</li>
                    </ul>
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