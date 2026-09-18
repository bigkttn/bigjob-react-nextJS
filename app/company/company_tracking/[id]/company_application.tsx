"use client";

import React, { useState } from "react";
import styles from "./company_tracking.module.css";
import { apiUrl } from "@/lib/hostURL";
import dynamic from "next/dynamic";
import { resume } from "react-dom/server";

const MapComponent = dynamic(() => import("./mapComponent"), {
  ssr: false,
  loading: () => <p style={{ textAlign: "center", padding: "20px" }}>กำลังโหลดแผนที่...</p>,
});

export interface Applicant {
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

export default function CompanyApplication({ initialJobs, companyId }: ComponentProps) {
  const [jobs, setJobs] = useState<Applicant[]>(initialJobs || []);
  const [selectedJob, setSelectedJob] = useState<Applicant | null>(
    initialJobs && initialJobs.length > 0 ? initialJobs[0] : null
    
  );
      console.log("data รายการผู้สมัครงาน tracking:",initialJobs);

  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [interviewType, setInterviewType] = useState<"onsite" | "online">("onsite");
  const [meetingLink, setMeetingLink] = useState("");
  const [locationName, setLocationName] = useState("");
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModelOpen] = useState(false);
  const [targetTrackingId, setTargetTrackingId] = useState<number | null>(null);

  const status = selectedJob?.status?.toLowerCase() || "pending";

  const getStatusClass = (status: string = "pending") => {
    const s = status.toLowerCase();
    if (s === "applied") return styles.statusApplied;
    if (s === "screening") return styles.statusScreening;
    if (s === "interview") return styles.statusInterview;
    if (s === "appointment" || s === "offer" || s === "hired") return styles.statusOffer;
    if (s === "rejected" || s === "reject") return styles.statusRejected;
    return styles.statusPending;
  };

  const handleUpdateStatus = async (trackingId: number, newStatus: string, interviewDetails?: any) => {
    if (!selectedJob) return;

    try {
      const response = await fetch(`${apiUrl}/api/interview_tracking/update-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: trackingId,
          status: newStatus,
          companyEmail: selectedJob.company_email || "hr@company.com", // เปลี่ยนตามดึงจริง
          seekerEmail: selectedJob.email,
          companyName: selectedJob.company_name || "บริษัท",
          seekerName: selectedJob.fullname || "ผู้สมัคร",
          jobTitle: selectedJob.job_position,
          ...interviewDetails,
        }),
      });

      if (response.ok) {
        if (newStatus === "reject" || newStatus === "rejected") {
          setJobs((prev) => prev.filter((job) => job.tracking_id !== trackingId));
          setSelectedJob(null);
        } else {
          setJobs((prev) => prev.map((job) => job.tracking_id === trackingId ? { ...job, status: newStatus } : job));
          setSelectedJob((prev) => (prev ? { ...prev, status: newStatus } : null));
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

  const resumeFile = selectedJob?.files?.find((f) => f.file_category?.toLowerCase() === "resume" || f.file_name.endsWith(".pdf"));

  return (
    
    <div className={styles.container}>
      <main className={styles.mainContent}>
        {/* Left Sidebar */}
        <div className={styles.cardScollBar}>
          <aside className={styles.sidebar}>
            {jobs.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px" }}>ไม่พบข้อมูลผู้สมัคร</p>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.tracking_id}
                  className={`${styles.jobCard} ${selectedJob?.tracking_id === job.tracking_id ? styles.selected : ""}`}
                  onClick={() => setSelectedJob(job)}
                >
                  <div className={styles.cardLeft}>
                    <img
                      src={job.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.fullname || "Seeker")}&background=random`}
                      alt="seeker profile"
                      className={styles.profileLeft}
                    />
                    <div className={styles.cardDetails}>
                      <h4>{job.fullname || "ไม่ระบุชื่อ"}</h4>
                      <p>{job.job_position || "ไม่ระบุตำแหน่ง"}</p>
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${getStatusClass(job.status)}`}>
                    {job.status}
                  </span>
                </div>
              ))
            )}
          </aside>
        </div>

        {/* Right Panel */}
        <section className={styles.rightPanel}>
          <div style={{ width: "100%", height: 'auto', backgroundColor: "#9D9D9D", borderRadius: '10px' }}>
            {selectedJob ? (
              <>
                <div className={styles.trackerBox}>
                  <div className={styles.stepperContainer}>

                    {/* Step 1: Pending */}
                    <div className={`${styles.step} ${styles.active}`}>
                      <div className={styles.stepIcon}>📄</div>
                      <span className={styles.stepLabel}>Pending</span>
                      {status === 'pending' && (
                        <div className={styles.inlineDatePicker}>
                          <p className={styles.txtWaiting}>รอผู้สมัครงานตอบกลับ</p>
                          <button className={styles.txtRejected} onClick={() => setIsRejectModelOpen(true)}>ยกเลิก</button>
                        </div>
                      )}
                    </div>
                    <div className={styles.stepLine} />

                    {/* Step 2: Applied (บริษัทตั้งค่าและกดส่งนัดหมาย Screening) */}
                    <div className={`${styles.step} ${["applied", "screening", "interview", "appointment", "offer", "hired"].includes(status) ? styles.active : ""}`}>
                      <div className={styles.stepIcon}>☑️</div>
                      <span className={styles.stepLabel}>Applied</span>

                      {status === 'applied' && (
                        <div className={styles.inlineDatePicker} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '10px' }}>
                          <label>วันสัมภาษณ์:</label>
                          <input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                          <label>เวลาสัมภาษณ์:</label>
                          <input type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />

                          <label style={{ marginTop: '10px' }}>รูปแบบการสัมภาษณ์:</label>
                          <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                            <label><input type="radio" value="onsite" checked={interviewType === "onsite"} onChange={() => setInterviewType("onsite")} /> On-site</label>
                            <label><input type="radio" value="online" checked={interviewType === "online"} onChange={() => setInterviewType("online")} /> Online</label>
                          </div>

                          {interviewType === "onsite" ? (
                            <>
                              <label>สถานที่สัมภาษณ์:</label>
                              <div className={styles.mapContainer}>
                                <input className={styles.inputMap} type="text"
                                  placeholder={[selectedJob.company_full_address, selectedJob.company_sub_district, selectedJob.company_province].filter(Boolean).join(" ") || "ปักหมุดสถานที่"}
                                  value={locationName} onChange={(e) => setLocationName(e.target.value)}
                                />
                                <button type="button" className={styles.btnMap} onClick={handleOpenMap}>ปักหมุด</button>
                              </div>
                            </>
                          ) : (
                            <>
                              <label>ลิงก์สัมภาษณ์:</label>
                              <input type="text" placeholder="วางลิงก์ที่นี่..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                            </>
                          )}

                          <button
                            className={styles.btnSubmitStep} style={{ marginTop: '15px', width: '8rem'}}
                            onClick={() => {
                              const finalLocation = interviewType === "online" ? meetingLink : locationName;
                              handleUpdateStatus(selectedJob.tracking_id, 'screening', { // ส่งสถานะ Screening ให้ผู้สมัคร
                                interviewDate, interviewTime, locationName: finalLocation, interviewType: interviewType,
                                latitude: interviewType === "onsite" ? selectedLat : null, longitude: interviewType === "onsite" ? selectedLng : null,
                              });
                            }}
                          >
                            ส่งนัดหมายสัมภาษณ์
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={styles.stepLine} />

                    {/* Step 3: Screening / Interview */}
                    <div className={`${styles.step} ${["screening", "interview", "appointment", "offer", "hired"].includes(status) ? styles.active : ""}`}>
                      <div className={styles.stepIcon}>🎙️</div>
                      <span className={styles.stepLabel}>Interview</span>

                      {status === 'screening' && (
                        <p style={{ fontSize: '13px', color: '#555', marginTop: '10px' }}>รอผู้สมัครยืนยันการนัดหมาย</p>
                      )}

                      {status === 'interview' && (
                        <div className={styles.interviewDetailsCard} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '10px' }}>
                          <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '4px', fontSize: '14px' }}>รายละเอียดการนัดหมาย</h3>
                          <p><strong>วันเวลา:</strong> {selectedJob.interview_date ? new Date(selectedJob.interview_date).toLocaleString('th-TH') : "ไม่ระบุ"}</p>
                          <p><strong>สถานที่:</strong> {selectedJob.link ? <a href={selectedJob.link} target="_blank">คลิกเข้าร่วมออนไลน์</a> : selectedJob.location}</p>
                          <button className={styles.txtRejected} style={{ marginTop: '10px' }} onClick={() => setIsRejectModelOpen(true)}>ยกเลิก/ไม่ผ่าน</button>
                        </div>
                      )}
                    </div>
                    <div className={styles.stepLine} />

                    {/* Step 4: Appointment / Offer */}
                    <div className={`${styles.step} ${["appointment", "offer", "hired"].includes(status) ? styles.active : ""}`}>
                      <div className={styles.stepIcon}>💼</div>
                      <span className={styles.stepLabel}>Appointment</span>

                      {status === 'interview' && (
                        <div className={styles.inlineDatePicker} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '10px' }}>
                          <label>กำหนดวันเริ่มงาน:</label>
                          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                          <button className={styles.btnSubmitStep} style={{ width: '100%', marginTop: '10px' }} onClick={() => handleUpdateStatus(selectedJob.tracking_id, 'appointment')}>
                            ส่งข้อเสนอเริ่มงาน
                          </button>
                        </div>
                      )}
                      
                      {(status === 'appointment' || status === 'offer' || status === 'hired') && (
                        <p style={{ fontSize: '13px', color: '#2e7d32', marginTop: '10px', fontWeight: 'bold' }}>ส่งข้อเสนองานเรียบร้อยแล้ว</p>
                      )}
                    </div>

                  </div>
                </div>

                {/* แผนที่ Modal */}
                {isMapModalOpen && (
                  <div className={styles.modalOverlay}>
                    <div className={styles.mapModalContent} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px' }}>
                      <h3>ปักหมุดเลือกสถานที่</h3>
                      <div style={{ height: "350px", width: "100%", margin: "10px 0" }}>
                        <MapComponent
                          selectedLat={selectedLat || 13.7563}
                          selectedLng={selectedLng || 100.5018}
                          onLocationSelect={(lat, lng, addressName) => {
                            setSelectedLat(lat); setSelectedLng(lng); setSearchQuery(addressName);
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button className={styles.btnConfirm} onClick={() => { setLocationName(searchQuery); setIsMapModalOpen(false); }}>ยืนยัน</button>
                        <button className={styles.btnCancel} onClick={() => setIsMapModalOpen(false)}>ยกเลิก</button>
                      </div>
                    </div>
                  </div>
                )}

               {/* Profile Details (โชว์ข้อมูลผู้สมัคร) */}
                <div style={{ backgroundColor: '#EBEBEB', padding: '20px', borderRadius: '15px', marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'stretch' }}>
                  
                  {/* Column 1: Personal Info */}
                  <div style={{ flex: '1', backgroundColor: '#F8F8F8', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <img 
                      src={selectedJob.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedJob.fullname || "Seeker")}`} 
                      alt="profile" 
                      style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} 
                    />
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{selectedJob.fullname || "ไม่ระบุชื่อ"}</h3>
                    <a href={`mailto:${selectedJob.email}`} style={{ color: '#555', textDecoration: 'underline', marginBottom: '20px', fontSize: '14px' }}>{selectedJob.email || "ไม่ระบุ"}</a>

                    <div style={{ textAlign: 'left', width: '100%', fontSize: '12px', lineHeight: '1.6', color: '#555' }}>
                      <p style={{ margin: 0 }}><strong>Mobile:</strong> {selectedJob.mobile_phone || "-"}</p>
                      <p style={{ margin: 0 }}><strong>Age:</strong> {selectedJob.age || "-"}</p>
                      <p style={{ margin: 0 }}><strong>Gender:</strong> {selectedJob.gender || "-"}</p>
                      <p style={{ margin: 0 }}><strong>Nationality:</strong> {selectedJob.nationality || "-"}</p>
                      <p style={{ margin: 0 }}><strong>Military Status:</strong> {selectedJob.military_status || "-"}</p>
                      <p style={{ margin: 0 }}><strong>Religion:</strong> {selectedJob.religion || "-"}</p>
                      <p style={{ margin: 0 }}><strong>Weight / Height:</strong> {selectedJob.weight ? `${selectedJob.weight} kg` : "-"} / {selectedJob.height ? `${selectedJob.height} cm` : "-"}</p>
                      <p style={{ margin: 0 }}><strong>Current Address:</strong> {[selectedJob.address, selectedJob.sub_district, selectedJob.district, selectedJob.province, selectedJob.postal_code].filter(Boolean).join(" ") || "-"}</p>
                    </div>

                    {resumeFile && (
                      <a 
                        href={resumeFile.file_path} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ marginTop: 'auto', backgroundColor: '#e2e2e2', padding: '8px 20px', borderRadius: '20px', color: '#d32f2f', textDecoration: 'underline', fontSize: '14px', fontWeight: 'bold' }}
                      >
                        {resumeFile && (
                          <a href={resumeFile.file_path} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             style={{
                                    marginTop: 'auto',
                                    backgroundColor: '#e2e2e2',
                                    padding:'8px 20px',
                                    borderRadius: '20px',
                                    color: '#d32f2f',
                                    textDecoration: 'underline',
                                    fontSize:'14px',
                                    fontWeight:'bold',
                                    whiteSpace:'nowrap',
                                    overflow:'hidden',
                                    textOverflow:'ellipsis',
                                    maxWidth:'100%'
                             }} >

                              {resumeFile.file_name || "resume file"}
                             </a>
                        )}
                      </a>
                    )}
                  </div>

                  {/* Column 2: Job Preferences */}
                  <div style={{ flex: '1', backgroundColor: '#DBDBDB', borderRadius: '12px', padding: '20px' }}>
                    <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>Job Preferences</h2>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '13px' }}>Job Title</p>
                      <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        {selectedJob.job_titles && selectedJob.job_titles.length > 0 
                          ? selectedJob.job_titles.map((jt, i) => <li key={i}>{jt.job_name}</li>) 
                          : <li>{selectedJob.job_position || "-"}</li>}
                      </ol>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '13px' }}>Type Of Work</p>
                      <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#333' }}>
                         {selectedJob.type_of_work ? selectedJob.type_of_work.split(",").map((t, i) => <li key={i}>{t.trim()}</li>) : <li>-</li>}
                      </ol>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '13px' }}>Type of Employment</p>
                      <span style={{ display: 'inline-block', backgroundColor: '#222', color: '#fff', padding: '4px 12px', borderRadius: '15px', fontSize: '12px' }}>Full-time</span>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '13px' }}>Desired salary (baht)</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{selectedJob.desired_salary || "-"}</p>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '13px' }}>Desired work location</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{selectedJob.desired_work_location || "-"}</p>
                    </div>

                    <div>
                      <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '13px' }}>Available start date</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>
                        {selectedJob.available_start_date ? new Date(selectedJob.available_start_date).toLocaleDateString('en-GB') : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Column 3: Skills */}
                  <div style={{ flex: '1', backgroundColor: '#DBDBDB', borderRadius: '12px', padding: '20px' }}>
                    <h2 style={{ fontSize: '18px', marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>Skills</h2>

                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '13px' }}>Specific skills</p>
                      <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#333' }}>
                        {selectedJob.skills && selectedJob.skills.length > 0 
                          ? selectedJob.skills.map((s, i) => <li key={i}>{s.skill_name}</li>) 
                          : <li>-</li>}
                      </ol>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '13px' }}>Typing speed in Thai (wpm)</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>
                        - Thai - {selectedJob.typing_speed?.find(t => t.typing_language === 'Thai' || t.typing_language === 'ไทย')?.typing_wpm || "-"} wpm
                      </p>
                      <p style={{ margin: '10px 0 5px 0', color: '#555', fontSize: '13px' }}>Typing speed in English (wpm)</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>
                        - English - {selectedJob.typing_speed?.find(t => t.typing_language === 'English' || t.typing_language === 'อังกฤษ' || t.typing_language === 'Eng')?.typing_wpm || "-"} wpm
                      </p>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '13px' }}>Projects, Achievements, and Other Experiences</p>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#333' }}>
                        {selectedJob.experiences && selectedJob.experiences.length > 0 
                          ? selectedJob.experiences.map((ex, i) => (
                              <li key={i}>
                                <strong>{ex.ex_title}</strong>{ex.ex_description ? `: ${ex.ex_description}` : ""}
                              </li>
                            )) 
                          : <li>-</li>}
                      </ul>
                    </div>

                    <div>
                      <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '13px' }}>Language Proficiency</p>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#333', listStyleType: 'disc' }}>
                        {selectedJob.languages && selectedJob.languages.length > 0 
                          ? selectedJob.languages.map((l, i) => (
                              <li key={i}>{l.language_type} {l.level ? `(${l.level})` : ""}</li>
                            )) 
                          : <li>-</li>}
                      </ul>
                    </div>
                  </div>

                </div>

              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', color: '#fff' }}>กรุณาเลือกผู้สมัครจากรายการด้านซ้าย</div>
            )}
          </div>
        </section>

        {/* Modal ปฏิเสธ */}
        {isRejectModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h3>ยืนยันการยกเลิก/ปฏิเสธ</h3>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                <button className={styles.btnConfirm} onClick={() => { handleUpdateStatus(targetTrackingId!, "reject"); setIsRejectModelOpen(false); }}>ยืนยัน</button>
                <button className={styles.btnCancel} onClick={() => setIsRejectModelOpen(false)}>ยกเลิก</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}