"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./adminReport.module.css";

const AdminReportPage = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusText = (statusCode: any) => {
    switch (statusCode) {
      case 1:
        return "Suspend"; // ระงับ
      case 2:
        return "Warn"; // เตือน
      case 0:
      default:
        return "Review";
    }
  };

  // แปลง report_type ให้เป็นข้อความตรงกับ Dropdown (อ้างอิงจาก image_872d63.png)
  const getReportTypeText = (type: string) => {
    switch (type) {
      case "identity_fraud":
        return "ข้อมูลงานไม่ตรงกับความจริง / หลอกลวง";
      case "job_no_show":
        return "งานผิดกฎหมาย / สิ่งลามกอนาจาร / พนันออนไลน์";
      case "harassment_to_staff":
        return "ลิงก์เสีย / ข้อมูลติดต่อไม่ถูกต้อง";
      case "other":
        return "อื่นๆ (ระบุในรายละเอียด)";
      default:
        return type || "-";
    }
  };

  // สร้างลิงก์ตามประเภทของเป้าหมาย
  const getTargetLink = (source: string, targetId: number) => {
    switch (source) {
      case "company":
        return `/user/userProfileCompany/${targetId}`;
      case "post":
        return `/user/user-detail-job/${targetId}`;
      case "user":
        return `/company/seeker-profile/${targetId}`;
      default:
        return "#";
    }
  };

  const getReportLink = (role: string, reporterId: number) => {
    if (!reporterId) return "#"; // ตรวจสอบ reporterId ว่าไม่เป็น undefined หรือ null
    switch (role) {
      case "company":
        return `/user/userProfileCompany/${reporterId}`;
      case "user":
        return `/company/seeker-profile/${reporterId}`;
      default:
        return "#";
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/admin/reports");
        const result = await response.json();

        if (response.ok) {
          // ใช้ index + 1 ในการสร้าง ID เรียงลำดับ 1, 2, 3...
          const formattedData = result.data.map((item: any, index: number) => ({
            id: index + 1,
            reporter: item.reporter_name || "ไม่ทราบชื่อ",
            reporterId: item.reporter_id,
            reporterRole: item.reporter_role,
            reportType: getReportTypeText(item.report_type),
            details: item.description,
            target: item.target_name || "ไม่ทราบข้อมูล",
            targetId: item.target_id,
            source: item.source,
            date: new Date(item.report_date).toLocaleDateString("en-GB"),
            status: getStatusText(item.status),
          }));
          setReportData(formattedData);
        } else {
          console.error(result.message);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.reportCard}>
        <h2 className={styles.title}>Report</h2>

        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>ID</div>
          <div className={styles.headerCell}>Reported By</div>
          <div className={styles.headerCell}>Report Type</div>
          <div className={styles.headerCell}>Report Details</div>
          <div className={styles.headerCell}>Reported User</div>
          <div className={styles.headerCell}>Report Date</div>
          <div className={styles.headerCell}>Status Report</div>
        </div>

        <div className={styles.tableBody}>
          {reportData.map((report) => (
            <div key={report.id} className={styles.reportRow}>
              <div className={styles.cell}>
                <span className={styles.badgeGray}>{report.id}</span>
              </div>

              <div className={styles.cell}>
                <Link
                  href={getReportLink(report.reporterRole, report.reporterId)}
                >
                  <span
                    className={styles.nextLink}
                    style={{ cursor: "pointer" }}
                  >
                    <span className={styles.badgeGray}>{report.reporter}</span>
                  </span>
                </Link>
              </div>

              <div className={styles.cell}>
                <span className={styles.badgeGray}>{report.reportType}</span>
              </div>

              <div className={styles.cell}>
                <div className={styles.detailBubble}>{report.details}</div>
              </div>
              <div className={styles.cell}>
                {/* Target กดแล้วไปหน้าโปรไฟล์จริง */}
                <Link href={getTargetLink(report.source, report.targetId)}>
                  <span
                    className={styles.nextLink}
                    style={{ cursor: "pointer" }}
                  >
                    {report.target}
                  </span>
                </Link>
              </div>
              <div className={styles.cell}>
                <span className={styles.badgeGray}>{report.date}</span>
              </div>
              <div className={styles.cell}>
                <button
                  className={`${styles.statusBtn} ${styles[report.status.toLowerCase()]}`}
                >
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
