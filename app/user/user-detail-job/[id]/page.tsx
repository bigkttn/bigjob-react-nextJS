"use client";
import React from "react";
import styles from "./detailjob.module.css";
import { useParams } from "next/navigation";
const DetailJob = () => {
  const params = useParams(); // 2. ดึงค่าจาก URL
  const postId = params.id; // 3. สมมติว่า URL เป็น /user/user-detail-job/123 จะได้ postId = 123
  console.log("Post ID from URL:", postId); // 4. ตรวจสอบค่าที่ดึงมา
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* --- ส่วนหัว (Header) --- */}
        <button className={styles.applyBtn}>Apply Now</button>
        <div className={styles.header}>
          <img
            src="/assets/images/suggestedCompanys.jpg"
            alt="Chao Phraya United"
            className={styles.logo}
          />
          <h1 className={styles.companyName}>Chao Phraya United</h1>
        </div>

        {/* --- ส่วนเนื้อหา (Grid) --- */}
        <div className={styles.contentGrid}>
          {/* ฝั่งซ้าย: ข้อมูลงาน */}
          <div className={styles.leftCol}>
            <table className={styles.infoTable}>
              <tbody>
                <tr>
                  <td className={styles.label}>Job Title</td>
                  <td>Soccer coach</td>
                </tr>
                <tr>
                  <td className={styles.label}>Work Location</td>
                  <td>Pho Chai District, Roi Et Province</td>
                </tr>
                <tr>
                  <td className={styles.label}>Salary</td>
                  <td>20,000 - 50,000</td>
                </tr>
                <tr>
                  <td className={styles.label}>Rate</td>
                  <td>1</td>
                </tr>
                <tr>
                  <td className={styles.label}>Details</td>
                  <td>
                    <ul className={styles.list}>
                      <li>
                        Direct and manage all daily training programs for the
                        first team.
                      </li>
                      <li>Lead and mentor the first-team's technical staff.</li>
                      <li>Drive match-day strategy using performance data.</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: "30px" }}>
              <hr />
              <h3 className={styles.sectionTitle}>Qualifications</h3>
              <ol className={styles.list}>
                <li>Male/Female, 23 years or older.</li>
                <li>Education: Bachelor's degree.</li>
                <li>Diligent, honest, and passionate about sports.</li>
                <li>At least 2 years of experience.</li>
              </ol>
            </div>
          </div>

          {/* ฝั่งขวา: สวัสดิการและติดต่อ */}
          <div className={styles.rightCol}>
            <section>
              <hr />
              <h3 className={styles.sectionTitle}>Benefits</h3>
              <ul className={styles.list}>
                <li>Comprehensive health & medical insurance.</li>
                <li>Furnished accommodation or housing allowance.</li>
                <li>Company vehicle or transport allowance.</li>
                <li>Professional development support.</li>
              </ul>
            </section>

            <section style={{ marginTop: "30px" }}>
              <hr />
              <h3 className={styles.sectionTitle}>How to Apply</h3>
              <ul className={styles.list}>
                <li>Email / Person / By Mail</li>
                <li>BIGJOBs (Click Apply Now)</li>
                <li style={{ color: "red", fontWeight: "bold" }}>
                  Application Deadline: September 15, 2026
                </li>
              </ul>
            </section>

            <section style={{ marginTop: "30px" }}>
              <hr />
              <h3 className={styles.sectionTitle}>Contact</h3>
              <div style={{ fontSize: "0.9rem", lineHeight: "1.6" }}>
                <strong>Mr. Nolsak Toonhua</strong>
                <br />
                Chao Phraya United Football Club (Head Office)
                <br />
                888 Chaiyanurak Road, Nakhon Ratchasima, 30000
                <br />
                Tel: 0844444444
                <br />
                Email: careers@chaophrayaunited.com
                <br />
                Website: <a href="#">www.chaophrayaunitedfc.com</a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DetailJob;
