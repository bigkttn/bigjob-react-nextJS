"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./company_tracking.module.css";

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
  const [jobs] = useState<Applicant[]>(initialJobs || []);
  const [selectedJob, setSelectedJob] = useState<Applicant | null>(
    initialJobs && initialJobs.length > 0 ? initialJobs[0] : null
  );

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
    const stepIndex = steps.findIndex(s => s.toLowerCase() === stepName.toLowerCase());
    const currentIndex = steps.findIndex(s => s.toLowerCase() === currentStatus.toLowerCase());
    
    if (currentIndex === -1) return "";
    if (stepIndex === currentIndex) return styles.active;
    if (stepIndex < currentIndex) return styles.completed;
    return "";
  };

  return (
    <div className={styles.container}>
      {/* Main Grid Content */}
      <main className={styles.mainContent}>
        {/* Left Candidate List */}
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

        {/* Right Detail Panel */}
        <section className={styles.rightPanel}>
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
                      </div>
                      {idx < steps.length - 1 && <div className={styles.stepLine} />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Optional Meeting Date Inputs */}
                <div className={styles.datePickerRow}>
                  <div>
                    <label style={{ fontSize: "12px", marginRight: "6px" }}>Meeting date:</label>
                    <input type="date" className={styles.inputField} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", marginRight: "6px" }}>Meeting time:</label>
                    <input type="time" className={styles.inputField} />
                  </div>
                </div>
              </div>

              {/* Applicant Profile Information */}
              <div className={styles.detailBox}>
                <div className={styles.detailHeader}>
                  <img
                    src={selectedJob.profile_image || "/default-avatar.png"}
                    alt="Applicant Avatar"
                    className={styles.detailLogo}
                    onError={(e) => {
                      (e.target as HTMLElement).setAttribute("src", "https://via.placeholder.com/64");
                    }}
                  />
                  <div>
                    <h2>{selectedJob.fullname || "ไม่ระบุชื่อ"}</h2>
                    <p style={{ color: "#0066cc", margin: "2px 0 0 0" }}>
                      {selectedJob.email || "-"}
                    </p>
                  </div>
                </div>

                <div className={styles.detailGrid}>
                  {/* Column 1: Personal Info */}
                  <div className={styles.gridColumn}>
                    <table className={styles.infoTable}>
                      <tbody>
                        <tr>
                          <td>Gender:</td>
                          <td>{selectedJob.gender || "-"}</td>
                        </tr>
                        <tr>
                          <td>Age:</td>
                          <td>{selectedJob.age || "-"}</td>
                        </tr>
                        <tr>
                          <td>Military Status:</td>
                          <td>{selectedJob.military_status || "-"}</td>
                        </tr>
                        <tr>
                          <td>Date of Birth:</td>
                          <td>{selectedJob.date_of_birth || "-"}</td>
                        </tr>
                        <tr>
                          <td>Nationality:</td>
                          <td>{selectedJob.nationality || "-"}</td>
                        </tr>
                        <tr>
                          <td>Religion:</td>
                          <td>{selectedJob.religion || "-"}</td>
                        </tr>
                        <tr>
                          <td>Weight/Height:</td>
                          <td>
                            {selectedJob.weight ? `${selectedJob.weight} kg` : "-"} /{" "}
                            {selectedJob.height ? `${selectedJob.height} cm` : "-"}
                          </td>
                        </tr>
                        <tr>
                          <td>Marital Status:</td>
                          <td>{selectedJob.marital_status || "-"}</td>
                        </tr>
                        <tr>
                          <td>Mobile Phone:</td>
                          <td>{selectedJob.mobile_phone || "-"}</td>
                        </tr>
                        <tr>
                          <td>LINE ID:</td>
                          <td>{selectedJob.line_id || "-"}</td>
                        </tr>
                        <tr>
                          <td>Current Address:</td>
                          <td>
                            {[
                              selectedJob.address,
                              selectedJob.sub_district,
                              selectedJob.district,
                              selectedJob.province,
                              selectedJob.postal_code,
                            ]
                              .filter(Boolean)
                              .join(" ") || "-"}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <a href="#" className={styles.pdfButton}>
                      {selectedJob.fullname?.toLowerCase().replace(/\s+/g, "") || "resume"}.pdf
                    </a>
                  </div>

                  {/* Column 2: Job Preferences */}
                  <div className={styles.gridColumn}>
                    <div className={styles.sectionTitle}>Job Preferences</div>
                    <table className={styles.infoTable}>
                      <tbody>
                        <tr>
                          <td>Job Title:</td>
                          <td>{selectedJob.job_position || "-"}</td>
                        </tr>
                        <tr>
                          <td>Type Of Work:</td>
                          <td>{selectedJob.type_of_work || "-"}</td>
                        </tr>
                        <tr>
                          <td>Desired Salary:</td>
                          <td>{selectedJob.desired_salary || "-"}</td>
                        </tr>
                        <tr>
                          <td>Desired Location:</td>
                          <td>{selectedJob.desired_work_location || "-"}</td>
                        </tr>
                        <tr>
                          <td>Available Start Date:</td>
                          <td>{selectedJob.available_start_date || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Column 3: Skills & Experiences */}
                  <div className={styles.gridColumn}>
                    <div className={styles.sectionTitle}>Skills</div>
                    <div style={{ fontSize: "12px", color: "#444" }}>
                      <p style={{ margin: "0 0 6px 0", fontWeight: "bold" }}>Specific Skills:</p>
                      <ul style={{ paddingLeft: "16px", margin: "0 0 12px 0" }}>
                        <li>Tactical Awareness</li>
                        <li>Player Development Skills</li>
                        <li>Game Analysis & Performance</li>
                      </ul>

                      <p style={{ margin: "0 0 6px 0", fontWeight: "bold" }}>Language Proficiency:</p>
                      <ul style={{ paddingLeft: "16px", margin: 0 }}>
                        <li>English: Fluent</li>
                        <li>Thai: Intermediate</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>กรุณาเลือกผู้สมัครจากรายการด้านซ้าย</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}