"use client";

import React, { useState } from "react";
import styles from "./company_tracking.module.css";
import { apiUrl } from "@/lib/hostURL";
import dynamic from "next/dynamic";

// โหลด MapComponent เข้ามาและปิดการทำ SSR
const MapComponent = dynamic(() => import("./mapComponent"), {
  ssr: false,
  loading: () => <p style={{ textAlign: "center", padding: "20px" }}>กำลังโหลดแผนที่...</p>,
});

// 1. Interfaces สำหรับ Sub-tables
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

export interface JobTitleItem {
  jobtitle_id: number;
  job_name: string;
  user_id: number;
}

// 2. Interface Applicant
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
  skills?: SkillItem[];
  experiences?: ExperienceItem[];
  typing_speed?: TypingSpeedItem[];
  languages?: LanguageItem[];
  files?: FileItem[];
  company_latitude?: number;
  company_longitude?: number;
  job_titles?: JobTitleItem[];
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

  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [startDate, setStartDate] = useState("");
  
  // ----- เพิ่ม State สำหรับจัดการประเภทการนัดสัมภาษณ์ -----
  const [interviewType, setInterviewType] = useState<"onsite" | "online">("onsite");
  const [meetingLink, setMeetingLink] = useState("");
  // ----------------------------------------------

  const [isRejectModalOpen, setIsRejectModelOpen] = useState(false);
  const [targetTrackingId, setTargetTrackingId] = useState<number | null>(null);

  const [locationName, setLocationName] = useState("");
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const status = selectedJob?.status || "pending";

  const getStatusClass = (status: string = "pending") => {
    switch (status.toLowerCase()) {
      case "interview":
        return styles.statusInterview;
      case "rejected":
      case "closed":
        return styles.statusRejected;
      case "applied":
        return styles.statusApplied;
      case "appointment":
        return styles.statusOffer;
      default:
        return styles.statusPending;
    }
  };

  const steps = ["Pending", "Applied", "Interview", "Appointment"];

  const getStepStatus = (stepName: string, currentStatus: string = "pending") => {
    const stepIndex = steps.findIndex((s) => s.toLowerCase() === stepName.toLowerCase());
    const currentIndex = steps.findIndex((s) => s.toLowerCase() === currentStatus.toLowerCase());

    if (currentIndex === -1) return "";
    if (stepIndex === currentIndex) return styles.active;
    if (stepIndex < currentIndex) return styles.completed;
    return "";
  };

  const handleUpdateStatus = async (
    trackingId: number,
    newStatus: string,
    interviewDetails?: {
      interviewDate: string;
      interviewTime: string;
      locationName: string;
      latitude: number | null;
      longitude: number | null;
      interviewType?: string; // รองรับประเภทการสัมภาษณ์
    }
  ) => {
    if (!selectedJob) return;

    try {
      const response = await fetch(`${apiUrl}/api/interview_tracking/update-status/company`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: trackingId,
          status: newStatus,
          seekerEmail: selectedJob.email,
          seekerName: selectedJob.fullname,
          jobTitle: selectedJob.job_position,
          ...interviewDetails,
        }),
      });

      if (response.ok) {
        if (newStatus === "reject" || newStatus === "rejected") {
          setJobs((prevJobs) => {
            const updatedJobs = prevJobs.filter((job) => job.tracking_id !== trackingId);
            if (selectedJob.tracking_id === trackingId) {
              setSelectedJob(updatedJobs.length > 0 ? updatedJobs[0] : null);
            }
            return updatedJobs;
          });
        } else {
          setJobs((prevJobs) =>
            prevJobs.map((job) =>
              job.tracking_id === trackingId ? { ...job, status: newStatus } : job
            )
          );

          if (selectedJob && selectedJob.tracking_id === trackingId) {
            setSelectedJob((prev) => (prev ? { ...prev, status: newStatus } : null));
          }
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleOpenRejectModel = (trackingId: number) => {
    setTargetTrackingId(trackingId);
    setIsRejectModelOpen(true);
  };

  const handleConfirmReject = async () => {
    if (targetTrackingId !== null) {
      await handleUpdateStatus(targetTrackingId, "reject");
      setIsRejectModelOpen(false);
      setTargetTrackingId(null);
    }
  };

  const handleOpenMap = () => {
    if (selectedJob?.company_latitude && selectedJob?.company_longitude) {
      setSelectedLat(Number(selectedJob.company_latitude));
      setSelectedLng(Number(selectedJob.company_longitude));
    } else {
      setSelectedLat(13.7563);
      setSelectedLng(100.5018);
    }
    setSearchQuery(locationName || "");
    setIsMapModalOpen(true);
  };

  const resumeFile = selectedJob?.files?.find(
    (f) => f.file_category?.toLowerCase() === "resume" || f.file_name.endsWith(".pdf")
  ) || selectedJob?.files?.[0];

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
        <div className={styles.cardScollBar}>
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
                      src={
                        job.profile_image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          job.fullname || "Seeker"
                        )}&background=random`
                      }
                      alt="seeker profile"
                      className={styles.profileLeft}
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/50";
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
        </div>

        {/* รายละเอียดผู้สมัครด้านขวา */}
        <section className={styles.rightPanel}>
          <div style={{ width: "56rem", height: "45rem", backgroundColor: "#9D9D9D" }}>
            {selectedJob ? (
              <>
                {/* Stepper Status Box */}
                <div className={styles.trackerBox}>
                  <div className={styles.stepperContainer}>
                    
                    {/* Step 1: pending */}
                    <div className={`${styles.step} ${status === 'Pending' ? styles.active : ''}`}>
                      <div className={styles.stepIcon}>📄</div>
                      <span className={styles.stepLabel}>Pending</span>
                      {status === 'pending' && (
                        <div className={styles.inlineDatePicker}>
                          <p className={styles.txtWaiting}>รอผู้สมัครงานตอบกลับ</p>
                          <button
                            className={styles.txtRejected}
                            onClick={() => handleOpenRejectModel(selectedJob.tracking_id)}
                          >
                            ยกเลิก
                          </button>
                        </div>
                      )}

                      {isRejectModalOpen && (
                        <div className={styles.modalOverlay}>
                          <div className={styles.modalContent}>
                            <h3>ยืนยันการยกเลิก</h3>
                            <p>คุณต้องการยกเลิกรายการผู้สมัครคนนี้ใช่หรือไม่?</p>
                            <div className={styles.modalActions}>
                              <button
                                className={styles.btnConfirm}
                                onClick={handleConfirmReject}>
                                ยกเลิก
                              </button>
                              <button
                                className={styles.btnCancel}
                                onClick={() => setIsRejectModelOpen(false)}>
                                ใม่
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.stepLine} />

                    {/* Step 2: Applied */}
                    <div className={`${styles.step} ${status === 'applied' || status === 'interview' || status === 'Interview' ? styles.active : ''}`}>
                      <div className={styles.stepIcon}>☑️</div>
                      <span className={styles.stepLabel}>Applied</span>
                      
                      {status === 'applied' && (
                        <div className={styles.inlineDatePicker}>
                          <label>วันสัมภาษณ์:</label>
                          <input
                            type="date"
                            value={interviewDate}
                            onChange={(e) => setInterviewDate(e.target.value)}
                          />
                          <label>เวลาสัมภาษณ์:</label>
                          <input
                            type="time"
                            value={interviewTime}
                            onChange={(e) => setInterviewTime(e.target.value)}
                          />

                          {/* ----- เพิ่มตัวเลือกรุปแบบการสัมภาษณ์ ----- */}
                          <label style={{ marginTop: '10px' }}>รูปแบบการสัมภาษณ์:</label>
                          <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="interviewType"
                                value="onsite"
                                checked={interviewType === "onsite"}
                                onChange={() => setInterviewType("onsite")}
                              />
                              นัดเจอ (On-site)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="interviewType"
                                value="online"
                                checked={interviewType === "online"}
                                onChange={() => setInterviewType("online")}
                              />
                              ออนไลน์ (Online)
                            </label>
                          </div>
                          {/* -------------------------------------- */}

                          {/* สลับการแสดงผลตามประเภทที่เลือก */}
                          {interviewType === "onsite" ? (
                            <>
                              <label>สถานที่สัมภาษณ์:</label>
                              <div className={styles.mapContainer}>
                                <input className={styles.inputMap}
                                  type="text"
                                  placeholder="ปักหมุดสถานที่สัมภาษณ์..."
                                  value={locationName}
                                  onChange={(e) => setLocationName(e.target.value)}
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
                              <label>ลิงก์เข้าร่วมสัมภาษณ์ (Google Meet, Zoom ฯลฯ):</label>
                              <input
                                type="text"
                                placeholder="วางลิงก์ที่นี่..."
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                              />
                            </>
                          )}

                          <button
                            className={styles.btnSubmitStep}
                            style={{ marginTop: '15px' }}
                            onClick={() => {
                              // เลือกส่งข้อมูลตามประเภทการสัมภาษณ์
                              const finalLocation = interviewType === "online" ? meetingLink : locationName;
                              
                              handleUpdateStatus(selectedJob.tracking_id, 'Interview', {
                                interviewDate, 
                                interviewTime, 
                                locationName: finalLocation, // ส่งลิงก์หรือสถานที่ไปที่ฟิลด์เดิม
                                interviewType: interviewType, // ส่งประเภทบอก Backend ไปด้วย
                                latitude: interviewType === "onsite" ? selectedLat : null, 
                                longitude: interviewType === "onsite" ? selectedLng : null,
                              });
                            }}
                          >
                            นัดสัมภาษณ์
                          </button>
                        </div>
                      )}

                      {(status === 'interview' || status === 'Interview') && (
                        <div className={styles.inlineDatePicker}>
                          <p className={styles.txtWaiting}>⏳ รอการตอบกลับนัดหมาย</p>
                        </div>
                      )}
                    </div>

                    {/* Pop-up แผนที่ (แยก Component) */}
                    {isMapModalOpen && (
                      <div className={styles.modalOverlay}>
                        <div className={styles.mapModalContent}>
                          <h3>คลิกบนแผนที่เพื่อปักหมุดเลือกสถานที่</h3>
                          <p style={{ fontSize: "14px", color: "#333", margin: "8px 0" }}>
                            <strong>สถานที่เลือก:</strong> {searchQuery || "ยังไม่ได้เลือกสถานที่"}
                          </p>

                          <div className={styles.mapContainer} style={{ height: "350px", width: "100%" }}>
                            <MapComponent
                              selectedLat={selectedLat || 13.7563}
                              selectedLng={selectedLng || 100.5018}
                              onLocationSelect={(lat, lng, addressName) => {
                                setSelectedLat(lat);
                                setSelectedLng(lng);
                                setSearchQuery(addressName);
                              }}
                            />
                          </div>

                          <div className={styles.modalActions} style={{ marginTop: "16px" }}>
                            <button
                              className={styles.btnConfirm}
                              onClick={() => {
                                setLocationName(searchQuery);
                                setIsMapModalOpen(false);
                              }}
                            >
                              ยืนยันตำแหน่งนี้
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

                    <div className={styles.stepLine} />

                    {/* Step 3: Interview */}
                    <div className={`${styles.step} ${status === 'interview' || status === 'Interview' ? styles.active : ''}`}>
                      <div className={styles.stepIcon}>🎙️</div>
                      <span className={styles.stepLabel}>Interview</span>
                    </div>

                    <div className={styles.stepLine} />

                    {/* Step 4: Appointment */}
                    <div className={`${styles.step} ${status === 'appointment' || status === 'Appointment' ? styles.active : ''}`}>
                      <div className={styles.stepIcon}>💼</div>
                      <span className={styles.stepLabel}>Appointment</span>

                      {status === 'appointment' && (
                        <div className={styles.inlineDatePicker}>
                          <label>วันเริ่มงาน:</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                          <button
                            className={styles.btnSubmitStep}
                            onClick={() => handleUpdateStatus(selectedJob.tracking_id, 'hired')}
                          >
                            ส่งข้อเสนอเริ่มงาน
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className={styles.detailGrid}>
                  <div className={styles.columnProfile}>
                    <div className={styles.avatarWrapper}>
                      <img
                        src={selectedJob.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedJob.fullname || "Seeker")}&background=random`}
                        alt="seeker profile"
                        className={styles.profileRight}
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
                      {selectedJob.job_titles && selectedJob.job_titles.length > 0 ? (
                        <ol>
                          {selectedJob.job_titles.map((job) => (
                            <li key={job.jobtitle_id}>{job.job_name}</li>
                          ))}
                        </ol>
                      ) : (
                        <p>ไม่ระบุ</p>
                      )}
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

                  {/* คอลัมน์ที่ 3: Skills, Experiences, Languages */}
                  <div className={styles.columnCard}>
                    <h2>Skills</h2>

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

                    <div className={styles.cardSection}>
                      <label>Typing speed in Thai (wpm)</label>
                      <p>{thaiTyping ? `- Thai - ${thaiTyping.typing_wpm} wpm` : "-"}</p>
                    </div>

                    <div className={styles.cardSection}>
                      <label>Typing speed in English (wpm)</label>
                      <p>{engTyping ? `- English - ${engTyping.typing_wpm} wpm` : "-"}</p>
                    </div>

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