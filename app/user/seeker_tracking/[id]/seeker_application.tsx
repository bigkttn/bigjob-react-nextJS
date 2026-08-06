"use client";

import styles from "./seeker_tracking.module.css";
import { useState } from "react";


export interface AppliedJobItem{
  tracking_id: number;
  post_id: number;
  user_id: number;
  status: string; // applied, screening, interview, offer, rejected
  interview_message?: string;
  
  // ข้อมูล Post
  job_position: string;
  job_description?: string;
  preferred_qualifications?: string;
  Benefits?: string;
  province?: string;
  work_location?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  vacancy?: number;
  how_to_apply?: string;
  contact?: string;

  // ข้อมูล Company
  company_name?: string;
  logo_image?: string;
  company_email?: string;
}
interface TrackingProps {
  initialJobs: AppliedJobItem[];
  userId:string;
}

export default function SeekerApplication({ initialJobs }: TrackingProps) {
  console.log("initialJobสสสสสสสสสส",initialJobs);
  const [jobs] = useState<AppliedJobItem[]>(initialJobs);

  const [selectedJob, setSelectedJob] = useState<AppliedJobItem | null>(
     initialJobs.length>0? initialJobs[0]:null
     
  );

  


  const getStatus = (status:string = "")=>{
     switch (status.toLowerCase()) {
      case "screening":
        return styles.statusScreening;
      case "rejected":
        return styles.statusRejected;
      case "offer":
        return styles.statusOffer;
      default:
        return styles.statusPending;
          
     }
  };
 if (!jobs || jobs.length === 0) {
    return (
      <div className={styles.container} style={{ padding: "40px", textAlign: "center" }}>
        <h2>คุณยังไม่มีประวัติการสมัครงาน</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        {/* Left Sidebar - รายการงานที่กดสมัครไป */}
        <aside className={styles.sidebar}>
          {jobs.map((job) => (
            <div
              key={job.tracking_id || job.post_id}
              className={`${styles.jobCard} ${
                selectedJob?.post_id === job.post_id ? styles.selected : ""
              }`}
              onClick={() => setSelectedJob(job)}
            >
              <div className={styles.cardLeft}>
                <img
                  src={job.logo_image || "/assets/images/suggestedCompanys.jpg"}
                  alt={job.company_name}
                  className={styles.companyLogo}
                />
                <div className={styles.cardDetails}>
                  <h4>{job.job_position}</h4>
                  <p>{job.company_name || "ไม่ระบุชื่อบริษัท"}</p>
                </div>
              </div>
              <span
                className={`${styles.statusBadge} ${getStatus(
                  job.status
                )}`}
              >
                {job.status}
              </span>
            </div>
          ))}
        </aside>

        {/* Right Section - แสดงรายละเอียดงานที่เลือก */}
        {selectedJob && (
          <main className={styles.rightPanel}>
            {/* Status Tracker Box */}
            <div className={styles.trackerBox}>
              <div className={styles.stepperContainer}>
                <div className={`${styles.step} ${styles.active}`}>
                  <div className={styles.stepIcon}>&#128203;</div>

                  <span className={styles.stepLabel}>Applied</span>
                </div>
                <div className={styles.stepLine}></div>

                <div
                  className={`${styles.step} ${
                    ["screening", "interview", "offer"].includes(selectedJob.status?.toLowerCase())
                      ? styles.active
                      : ""
                  }`}
                >
                  <div className={styles.stepIcon}>&#128065;</div>
                  <span className={styles.stepLabel}>Screening</span>
                </div>
                <div className={styles.stepLine}></div>

                <div
                  className={`${styles.step} ${
                    ["interview", "offer"].includes(selectedJob.status?.toLowerCase())
                      ? styles.active
                      : ""
                  }`}
                >
                  <div className={styles.stepIcon}>&#127908;</div>
                  <span className={styles.stepLabel}>Interview</span>
                </div>
                <div className={styles.stepLine}></div>

                <div
                  className={`${styles.step} ${
                    selectedJob.status?.toLowerCase() === "offer" ? styles.active : ""
                  }`}
                >
                  <div className={styles.stepIcon}>&#128092;</div>
                  <span className={styles.stepLabel}>Offer</span>
                </div>
              </div>

              {/* Accept / Reject Controls */}
              {selectedJob.status?.toLowerCase() === "offer" && (
                <div className={styles.actionButtons}>
                  <button className={styles.btnAccept}>
                    <span>&#10004;</span> Accept
                  </button>
                  <button className={styles.btnReject}>
                    <span>&#10006;</span> Reject
                  </button>
                </div>
              )}
            </div>

            {/* Job Details Box */}
            <div className={styles.detailBox}>
              <div className={styles.detailHeader}>
                <img
                  src={selectedJob.logo_image || "/assets/images/suggestedCompanys.jpg"}
                  alt={selectedJob.company_name}
                  className={styles.detailLogo}
                />
                <h2>{selectedJob.company_name || "Company Name"}</h2>
              </div>

              <div className={styles.detailGrid}>
                {/* Left Column - Details */}
                <div>
                  <table className={styles.infoTable}>
                    <tbody>
                      <tr>
                        <td>Job Title</td>
                        <td>{selectedJob.job_position}</td>
                      </tr>
                      <tr>
                        <td>Province</td>
                        <td>{selectedJob.province || "-"}</td>
                      </tr>
                      <tr>
                        <td>Work Location</td>
                        <td>{selectedJob.work_location || "-"}</td>
                      </tr>
                      <tr>
                        <td>Salary</td>
                        <td>
                          {selectedJob.salary_min && selectedJob.salary_max
                            ? `${selectedJob.salary_min.toLocaleString()} - ${selectedJob.salary_max.toLocaleString()} บาท`
                            : "-"}
                        </td>
                      </tr>
                      <tr>
                        <td>Job Type</td>
                        <td>{selectedJob.job_type || "-"}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className={styles.sectionTitle}>Details</div>
                  <p style={{ whiteSpace: "pre-line", margin: 0 }}>
                    {selectedJob.job_description || "-"}
                  </p>

                  <div className={styles.sectionTitle}>Qualifications</div>
                  <p style={{ whiteSpace: "pre-line", margin: 0 }}>
                    {selectedJob.preferred_qualifications || "-"}
                  </p>
                </div>

                {/* Right Column - Benefits & Contact */}
                <div className={styles.contactBox}>
                  <div className={styles.sectionTitle} style={{ marginTop: 0 }}>
                    Benefits
                  </div>
                  <p style={{ whiteSpace: "pre-line", margin: 0 }}>
                    {selectedJob.Benefits || "-"}
                  </p>

                  <div className={styles.sectionTitle}>How to Apply</div>
                  <p style={{ whiteSpace: "pre-line", margin: 0 }}>
                    {selectedJob.how_to_apply || "-"}
                  </p>

                  <div className={styles.sectionTitle}>Contact</div>
                  <p style={{ whiteSpace: "pre-line", margin: 0 }}>
                    {selectedJob.contact || "-"}
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}