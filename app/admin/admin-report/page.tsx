import React from 'react';
import styles from './adminReport.module.css';

const AdminReportPage = () => {
  // ข้อมูลจำลองสำหรับแสดงในตาราง
  const reportData = [
    { id: 'R001', reporter: 'user1', details:  `Hi Admin Team,
I am trying to upload my PDF resume, but the system keeps showing an "Error 500" message and stops the upload. I am using Google Chrome on Windows. Could you please look into this so I can complete my application?  `, target: 'ABC Company', date: '12/04/2026', status: 'Suspend' },
    { id: 'R002', reporter: 'user12', details:  `The applicant sent inappropriate messages during tแแแhe interview..แแแแแแแแ. `, target: 'john_smith', date: '18/04/2026', status: 'Warn' },
    { id: 'R003', reporter: 'user39', details: 'The job description does not match the actual job responsibilities...', target: 'Global IT Solutions', date: '1/05/2026', status: 'Review' },
    
  ];

  return (
    <div className={styles.container}>
      <div className={styles.reportCard}>
        <h2 className={styles.title}>Report</h2>
        
        {/* ส่วนหัวตารางที่มีเส้นแบ่งคอลัมน์ชัดเจนตามรูป */}
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>ID</div>
          <div className={styles.headerCell}>Reporter</div>
          <div className={styles.headerCell}>Details</div>
          <div className={styles.headerCell}>Target</div>
          <div className={styles.headerCell}>Date</div>
          <div className={styles.headerCell}>Action</div>
        </div>

        <div className={styles.tableBody}>
          {reportData.map((report) => (
            <div key={report.id} className={styles.reportRow}>
              <div className={styles.cell}><span className={styles.badgeGray}>{report.id}</span></div>
              <div className={styles.cell}><span className={styles.badgeGray}>{report.reporter}</span></div>
              <div className={styles.cell}>
                <div className={styles.detailBubble}>{report.details}</div>
              </div>
              <div className={styles.cell}><span className={styles.badgeGray}>{report.target}</span></div>
              <div className={styles.cell}><span className={styles.badgeGray}>{report.date}</span></div>
              <div className={styles.cell}>
                {/* ใช้สีตามสถานะที่กำหนดในรูปภาพ */}
                <button className={`${styles.statusBtn} ${styles[report.status.toLowerCase()]}`}>
                  {report.status}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminReportPage;