"use client";
import React from "react";
import styles from "./seekerProfile.module.css";
import { name } from "next/dist/server/ci-info";

const SeekerProfile = () => {
  const profileSeeker = [
    {
      name: "Ruben amorim",
      email: "rubenamorim@gamil.com",
      img: "/assets/images/seeker.jpg",
      gender: "Male",
      age: "40",
      military: "Completed military service",
      birth: "27 January 1985",
      nation: "Portuguese",
      religion: "Christian",
      weigth: "73",
      height: "178",
      dis_status: "None",
      mari_status: "Married",
      mobile_phone: "093432342",
      line_id: "ruben178",
      country: "United Kingdom",
      address: "12/3 Soi Greenfield, Sukhumvit Road",
      province: "Bangkok",
      district: "Bang Na",
      sub_district: "Bang Na Nuea",
      postal_code: "10260",
      type_of_work: "",
    },
  ];
  const jobTitle = [
    {
      jobtitle: "Head Coach",
    },
    {
      jobtitle: "Head Coach",
    },
  ];
  const educationData = [
    {
      degree: "Master's Degree",
      school: "The Football Innovation and Research Institute",
    },
    {
      degree: "Bachelor's Degree",
      school: "National College of Football Coaching and Management",
    },
    { degree: "High School", school: "Royal Knights Sporting School" },
  ];
  const specificSkills = [
    {
      specSkill: "Tactical Awareness",
    },
    {
      specSkill: "Player Development Skills",
    },
    {
      specSkill: "Game Analysis and Performance Evaluation",
    },
  ];
  const typingSpeed = [
    {
      typing_language: "Typing speed in Thai (wpm)",
      typing_wpm: "45 wpm",
    },
    {
      typing_language: "Typing speed in English (wpm)",
      typing_wpm: "60 wpm",
    },
  ];
  const Experiences = [
    {
      ex_title: "Successfully led a team project",
      ex_description:
        "Successfully led a team project to  develop a mobile app used by over 10,000 users.",
      type: "",
      start_date: "",
      end_date: "",
    },
    {
      ex_title: "Received Employee",
      ex_description: "Received Employee of the Year award in 2023.",
      type: "",
      start_date: "",
      end_date: "",
    },
    {
      ex_title: "Volunteered as a community",
      ex_description:
        "Volunteered as a community organizer for local environmental campaigns.",
      type: "",
      start_date: "",
      end_date: "",
    },
  ];
  const fileItems = [
    { label: "Resume file", key: "resume", url: "/assets/files/resume.pdf" },
    {
      label: "Transcript file",
      key: "transcript",
      url: "/assets/files/transcript.pdf",
    },
    {
      label: "Portfolio file",
      key: "portfolio",
      url: "/assets/files/portfolio.pdf",
    },
    {
      label: "Certificate file",
      key: "certificate",
      url: "/assets/files/certificate.pdf",
    },
  ];
  const language_proficiency = [
    {
      language_type: "English:",
      test_name: "IELTS",
      level: "Fluent",
      score: " 7.5",
    },
    {
      language_type: "Portuguese:",
      test_name: "",
      level: "Native",
      score: "",
    },
    {
      language_type: "Thai:",
      test_name: "",
      level: "Intermediate",
      score: "",
    },
  ];
  return (
    <div className={styles.container}>
      <div className={styles.profileGrid}>
        {/* Column 1: Personal Information */}
        {profileSeeker.map((profile, index) => (
          <div key={index} className={styles.column}>
            <div className={styles.cardHeader}>Personal Information</div>
            <div className={styles.personalInfoContent}>
              <div className={styles.avatarWrapper}>
                <img src={profile.img} className={styles.avatar} />
              </div>

              <h2 className={styles.name}>{profile.name}</h2>
              <p className={styles.email}>{profile.email}</p>

              <div className={styles.detailsBox}>
                <div className={styles.titleinfoRow}>
                  <strong>About</strong>
                </div>
                <div className={styles.infoRow}>Gender: {profile.gender}</div>
                <div className={styles.infoRow}>Age: {profile.age} year</div>
                <div className={styles.infoRow}>
                  Military Status:{profile.military}
                </div>
                <div className={styles.infoRow}>
                  Date of Birth: {profile.birth}
                </div>
                <div className={styles.infoRow}>
                  Nationality: {profile.nation}
                </div>
                <div className={styles.infoRow}>
                  Religion: {profile.religion}
                </div>
                <div className={styles.infoRow}>
                  Weight: {profile.weigth} Kg
                </div>
                <div className={styles.infoRow}>
                  Height: {profile.height} Cm
                </div>
                <div className={styles.infoRow}>
                  Disability Status: {profile.dis_status}
                </div>
                <div className={styles.infoRow}>
                  Marital Status: {profile.mari_status}
                </div>
                <div className={styles.infoRow}>
                  Mobile Phone: {profile.mobile_phone}
                </div>

                {/* ... เพิ่มข้อมูลอื่นๆ ตามรูป ... */}
                <div className={styles.titleinfoRow}>
                  <br />
                  <strong>Contact</strong>
                </div>
                <div className={styles.infoRow}>LINE ID: {profile.line_id}</div>
                <div className={styles.infoRow}>Country: {profile.country}</div>
                <div className={styles.infoRow}>
                  Current Address: {profile.address}
                </div>
                <div className={styles.infoRow}>
                  Province: {profile.province}
                </div>
                <div className={styles.infoRow}>
                  District: {profile.district}
                </div>
                <div className={styles.infoRow}>
                  Sub-district: {profile.sub_district}
                </div>
                <div className={styles.infoRow}>
                  Postal Code: {profile.postal_code}
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Column 2: Job Preferences */}
        <div className={styles.column}>
          <div className={styles.cardHeader}>Job Preferences</div>
          <div className={styles.contentPadding}>
            <section className={styles.section}>
              <h4>Job Title</h4>
              <ol className="list-decimal list-inside">
                {jobTitle.map((job, index) => (
                  <li key={index}>{job.jobtitle}</li>
                ))}
              </ol>
            </section>

            <section className={styles.section}>
              <h4>Type Of Work</h4>
              <div className={styles.tagGroup}>
                <span className={styles.tagActive}>Full-time</span>
                <span className={styles.tag}>Freelance</span>
                <span className={styles.tag}>Part-time</span>
                <span className={styles.tag}>Internship</span>
              </div>
            </section>

            <section className={styles.section}>
              <h4>Desired salary (baht)</h4>
              <p>300,000 - 500,000</p>
            </section>

            <section className={styles.section}>
              <h4>Education</h4>
              {/* ส่วนนี้สามารถวาดเป็นเส้น Timeline ด้วย CSS ได้ */}
              <div className={styles.educationTimeline}></div>
            </section>
            <section className={styles.Educontainer}>
              <div className={styles.timeline}>
                {/* เส้นแกนกลาง */}
                <div className={styles.centralLine}></div>

                {educationData.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles.timelineItem} ${index % 2 === 0 ? styles.left : styles.right}`}
                  >
                    <div className={styles.content}>
                      <h4 className={styles.degree}>{item.degree}</h4>
                      <p className={styles.school}>{item.school}</p>
                    </div>
                    {/* ขีดเชื่อมแกนกลาง */}
                    <div className={styles.connector}></div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Column 3: Skills */}
        <div className={styles.column}>
          <div className={styles.cardHeader}>Skills</div>
          <div className={styles.contentPadding}>
            <section className={styles.section}>
              <h4>Specific skills</h4>
              <ol className="list-decimal list-inside">
                {specificSkills.map((skills, index) => (
                  <li key={index}>{skills.specSkill}</li>
                ))}
              </ol>
            </section>

            <section className={styles.section}>
              {typingSpeed.map((typing, index) => (
                <ul key={index}>
                  <li>
                    <h4>{typing.typing_language}</h4>
                  </li>
                  <li>
                    <span className={styles.bullet}>-</span>
                    {typing.typing_wpm}
                  </li>
                  <br />
                </ul>
              ))}
            </section>

            <section className={styles.section}>
              <h4>Projects, Achievements, and Other Experiences</h4>
              {Experiences.map((experiences, index) => (
                <ul key={index}>
                  <li>
                    <span className={styles.bullet}>-</span>
                    <strong>{experiences.ex_title}</strong>
                  </li>
                  <li className={styles.setLi}>
                    {" "}
                    {experiences.ex_description}
                  </li>
                  <li className={styles.setLi}>{experiences.type}</li>
                  <li className={styles.setLi}>{experiences.type}</li>
                  <li className={styles.setLi}>{experiences.start_date}</li>
                  <li className={styles.setLi}>{experiences.end_date}</li>
                </ul>
              ))}
            </section>
            <section className={styles.section}>
              <h4>Language Proficiency</h4>
              {language_proficiency.map((items, index) => (
                <ul key={index}>
                  <li className={styles.setLiTitle}>
                    <span className={styles.bullet}>•</span>
                    <strong>
                      {items.language_type} {items.level}
                    </strong>
                  </li>
                  <li className={styles.setLi}>
                    {items.test_name ? (
                      <span>
                        {items.test_name} {items.score}
                      </span>
                    ) : (
                      <p> </p>
                    )}
                  </li>
                </ul>
              ))}
            </section>
          </div>
        </div>

        {/* Column 4: Files & Contact */}
        <div className={styles.columnTransparent}>
          {/* แทนที่ fileGroup เดิมทั้งหมด */}
          <div className={styles.fileGroup}>
            {fileItems.map((file) => (
              <div key={file.key} className={styles.fileItem}>
                <label>{file.label}</label>
                <div className={styles.fileBox}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.viewBtn}
                  >
                    view file
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.contactCard}>
            <h3>Contact</h3>
            <button className={styles.sentBtn}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeekerProfile;
