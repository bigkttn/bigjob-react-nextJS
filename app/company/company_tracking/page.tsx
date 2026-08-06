"use client";

import React, { useState } from "react";
import styles from "./seeker_tracking.module.css";
import { JwtPayload } from "jsonwebtoken";

interface CustomJwtPayload extends JwtPayload{
  id: number;
}

interface PageProps{
  params: Promise<{id:string}>;
}

// Mock Data งานที่สมัคร
const mockJobs = [
  {
    id: 1,
    title: "Software Developer",
    company: "Innovatech Solutions",
    logo: "https://via.placeholder.com/50",
    status: "Screening",
    workLocation: "Bangkok, Thailand",
    salary: "40,000 - 70,000",
    rate: "1",
    details: "Direct and manage software projects...",
    qualifications: "1. Bachelor's in CS or related field.\n2. 2+ years exp in React/Next.js.",
    benefits: "Comprehensive health insurance, Flexible working hours.",
    contact: {
      name: "HR Team",
      phone: "021234567",
      email: "hr@innovatech.com",
      website: "www.innovatech.com",
    },
  },
  {
    id: 2,
    title: "Content Creator",
    company: "Urban Pulse Media",
    logo: "https://via.placeholder.com/50",
    status: "Rejected",
    workLocation: "Bangkok",
    salary: "25,000 - 35,000",
    rate: "2",
    details: "Create engaging video content...",
    qualifications: "1. Experience in Video Editing.",
    benefits: "Free snacks, Yearly outing.",
    contact: {
      name: "Media Recruiter",
      phone: "029876543",
      email: "jobs@urbanpulse.com",
      website: "www.urbanpulse.com",
    },
  },
  {
    id: 3,
    title: "Head Coach",
    company: "Chao Phraya United",
    logo: "https://via.placeholder.com/50",
    status: "Offer",
    workLocation: "Pho Chai District, Roi Et Province",
    salary: "20,000 - 50,000",
    rate: "1",
    details:
      "- Direct and manage all daily training programs for the first team.\n- Lead and mentor the first-team's technical staff (assistants, analysts, etc.).\n- Drive match-day strategy using performance and opponent data analysis.\n- Build and maintain a professional, high-performance team culture.",
    qualifications:
      "1. Essential: Must hold a valid AFC 'Pro' Coaching License\n2. Experience: A minimum of 3-5 years professional coaching experience\n3. Language : English, Thai",
    benefits:
      "- Comprehensive health & medical insurance.\n- Furnished accommodation or housing allowance.\n- Company vehicle or transport allowance.\n- Annual home-visit flight allowance (for international staff).\n- Professional development support.",
    contact: {
      name: "Mr. Nolsak Toonhua\nChao Phraya United Football Club (Head Office)",
      address: "888 Chaiyanurak Road, Nai Mueang Subdistrict, Mueang Nakhon Ratchasima District, Nakhon Ratchasima Province 30000 Thailand",
      phone: "0844444444",
      email: "careers@chaophrayaunited.com",
      website: "www.chaophrayaunitedfc.com",
    },
  },
  {
    id: 4,
    title: "IT Security Specialist",
    company: "CyberGuard Thailand",
    logo: "https://via.placeholder.com/50",
    status: "Pending",
  },
  {
    id: 5,
    title: "Marketing Manager",
    company: "Mekong Marketplace",
    logo: "https://via.placeholder.com/50",
    status: "Pending",
  },
  {
    id: 6,
    title: "Project Manager",
    company: "Creative Content Kingdom",
    logo: "https://via.placeholder.com/50",
    status: "Pending",
  },
];

export default async function SeekerTracking({params}:PageProps) {
  const resParams = await params;
  const userId = resParams.id;
  console.log("userId",userId);
  const [selectedJob, setSelectedJob] = useState(mockJobs[2]); // เลือก Head Coach เป็นค่าเริ่มต้น

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Screening":
        return styles.statusScreening;
      case "Rejected":
        return styles.statusRejected;
      case "Offer":
        return styles.statusOffer;
      default:
        return styles.statusPending;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Navigation Bar */}
      <header className={styles.navbar}>
        <div className={styles.navLeft}>
          <button className={styles.hamburgerBtn}>&#9776;</button>
          <span className={styles.brandLogo}>BIGJOBs</span>
        </div>
        <nav className={styles.navRight}>
          <a href="#" className={`${styles.navLink} ${styles.active}`}>
            Tracking
          </a>
          <a href="#" className={styles.navLink}>
            Search
          </a>
          <a href="#" className={styles.navLink}>
            saved
          </a>
          <a href="#" className={styles.navLink}>
            profile
          </a>
          <button className={styles.logoutBtn}>Log out</button>
        </nav>
      </header>

      {/* Main Content Layout */}
      <div className={styles.mainContent}>
        {/* Left Sidebar - Job Cards */}
        <aside className={styles.sidebar}>
          {mockJobs.map((job) => (
            <div
              key={job.id}
              className={`${styles.jobCard} ${
                selectedJob.id === job.id ? styles.selected : ""
              }`}
              onClick={() => setSelectedJob(job)}
            >
              <div className={styles.cardLeft}>
                <img
                  src={job.logo}
                  alt={job.company}
                  className={styles.companyLogo}
                />
                <div className={styles.cardDetails}>
                  <h4>{job.title}</h4>
                  <p>{job.company}</p>
                </div>
              </div>
              <span
                className={`${styles.statusBadge} ${getStatusBadgeClass(
                  job.status
                )}`}
              >
                {job.status}
              </span>
            </div>
          ))}
        </aside>

        {/* Right Section */}
        <main className={styles.rightPanel}>
          {/* Status Tracker Box */}
          <div className={styles.trackerBox}>
            <div className={styles.stepperContainer}>
              <div className={`${styles.step} ${styles.active}`}>
                <div className={styles.stepIcon}>&#128203;</div>
                <span className={styles.stepLabel}>Applied</span>
              </div>
              <div className={styles.stepLine}></div>

              <div className={`${styles.step} ${styles.active}`}>
                <div className={styles.stepIcon}>&#128065;</div>
                <span className={styles.stepLabel}>Screening</span>
              </div>
              <div className={styles.stepLine}></div>

              <div className={`${styles.step} ${styles.active}`}>
                <div className={styles.stepIcon}>&#127908;</div>
                <span className={styles.stepLabel}>Interview</span>
              </div>
              <div className={styles.stepLine}></div>

              <div
                className={`${styles.step} ${
                  selectedJob.status === "Offer" ? styles.active : ""
                }`}
              >
                <div className={styles.stepIcon}>&#128092;</div>
                <span className={styles.stepLabel}>Offer</span>
              </div>
            </div>

            {/* Accept / Reject Controls */}
            {selectedJob.status === "Offer" && (
              <div className={styles.actionButtons}>
                <button className={styles.btnAccept}>
                  <span>&#10004;</span>
                  Accept
                </button>
                <button className={styles.btnReject}>
                  <span>&#10006;</span>
                  Reject
                </button>
              </div>
            )}
          </div>

          {/* Job Details Box */}
          <div className={styles.detailBox}>
            <div className={styles.detailHeader}>
              <img
                src={selectedJob.logo}
                alt={selectedJob.company}
                className={styles.detailLogo}
              />
              <h2>{selectedJob.company}</h2>
            </div>

            <div className={styles.detailGrid}>
              {/* Left Column - Details */}
              <div>
                <table className={styles.infoTable}>
                  <tbody>
                    <tr>
                      <td>Job Title</td>
                      <td>{selectedJob.title}</td>
                    </tr>
                    <tr>
                      <td>Work Location</td>
                      <td>{selectedJob.workLocation || "-"}</td>
                    </tr>
                    <tr>
                      <td>Salary</td>
                      <td>{selectedJob.salary || "-"}</td>
                    </tr>
                    <tr>
                      <td>Rate</td>
                      <td>{selectedJob.rate || "-"}</td>
                    </tr>
                  </tbody>
                </table>

                <div className={styles.sectionTitle}>Details</div>
                <p style={{ whiteSpace: "pre-line", margin: 0 }}>
                  {selectedJob.details || "-"}
                </p>

                <div className={styles.sectionTitle}>Qualifications</div>
                <p style={{ whiteSpace: "pre-line", margin: 0 }}>
                  {selectedJob.qualifications || "-"}
                </p>
              </div>

              {/* Right Column - Benefits & Contact */}
              <div className={styles.contactBox}>
                <div className={styles.sectionTitle} style={{ marginTop: 0 }}>
                  Benefits
                </div>
                <p style={{ whiteSpace: "pre-line", margin: 0 }}>
                  {selectedJob.benefits || "-"}
                </p>

                <div className={styles.sectionTitle}>Contact</div>
                {selectedJob.contact ? (
                  <div>
                    <p style={{ whiteSpace: "pre-line", margin: "0 0 8px 0" }}>
                      {selectedJob.contact.name}
                      {selectedJob.contact.address &&
                        `\n${selectedJob.contact.address}`}
                    </p>
                    <p style={{ margin: "4px 0" }}>
                      Tel: {selectedJob.contact.phone}
                    </p>
                    <p style={{ margin: "4px 0" }}>
                      Email:{" "}
                      <a href={`mailto:${selectedJob.contact.email}`}>
                        {selectedJob.contact.email}
                      </a>
                    </p>
                    <p style={{ margin: "4px 0" }}>
                      Website:{" "}
                      <a
                        href={`https://${selectedJob.contact.website}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selectedJob.contact.website}
                      </a>
                    </p>
                  </div>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}