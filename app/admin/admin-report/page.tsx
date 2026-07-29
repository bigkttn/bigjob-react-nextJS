"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./adminReport.module.css";

const AdminReportPage = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States สำหรับตัวกรอง
  const [filterAccountType, setFilterAccountType] = useState("ทั้งหมด");
  const [filterStatus, setFilterStatus] = useState("ทั้งหมด");
  const [sortOrder, setSortOrder] = useState("desc");

  const getStatusText = (statusCode: any) => {
    switch (statusCode) {
      case 1:
        return "Suspend";
      case 2:
        return "Warn";
      case 0:
      default:
        return "Review";
    }
  };

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
    if (!reporterId) return "#";
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
          const formattedData = result.data.map((item: any, index: number) => ({
            id: index + 1,
            reporter: item.reporter_name || "ไม่ทราบชื่อ",
            reporterId: item.reporter_id,
            reporterRole: item.reporter_role,
            reportType: getReportTypeText(item.report_type),
            details: item.description,
            target: item.target_name || "ไม่ทราบข้อมูล",
            targetId: item.target_id,
            source: item.source, // ประเภทบัญชี: user, company, post
            rawDate: new Date(item.report_date).getTime(), // เก็บค่าเวลาเพื่อใช้ Sort
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

  // ฟังก์ชันคำนวณข้อมูลที่ผ่านการกรองและการจัดเรียง
  const filteredAndSortedData = reportData
    .filter((report) => {
      // กรองประเภทบัญชี (อิงตาม source ของเป้าหมายที่ถูก Report)
      if (
        filterAccountType !== "ทั้งหมด" &&
        report.source !== filterAccountType
      ) {
        return false;
      }
      // กรองสถานะรายการ
      if (filterStatus !== "ทั้งหมด" && report.status !== filterStatus) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // จัดเรียงตามวันที่
      if (sortOrder === "desc") {
        return b.rawDate - a.rawDate; // ใหม่สุด ไป เก่าสุด
      } else {
        return a.rawDate - b.rawDate; // เก่าสุด ไป ใหม่สุด
      }
    });

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.reportCard}>
        <h2 className={styles.title}>Report</h2>

        {/* --- ส่วนตัวกรอง (อ้างอิงจาก image_3d1246.png) --- */}
        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>ประเภทบัญชี:</span>
            <select
              className={styles.filterSelect}
              value={filterAccountType}
              onChange={(e) => setFilterAccountType(e.target.value)}
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              <option value="user">User</option>
              <option value="company">Company</option>
              <option value="post">Post</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>สถานะรายการ:</span>
            <select
              className={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              <option value="Review">Review</option>
              <option value="Warn">Warn</option>
              <option value="Suspend">Suspend</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>เรียงตามวันที่:</span>
            <select
              className={styles.filterSelect}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">ใหม่สุด ไป เก่าสุด</option>
              <option value="asc">เก่าสุด ไป ใหม่สุด</option>
            </select>
          </div>
        </div>
        {/* ------------------------------------------- */}

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
          {filteredAndSortedData.map((report, index) => (
            <div key={report.id} className={styles.reportRow}>
              <div className={styles.cell}>
                <span className={styles.badgeGray}>{index + 1}</span>
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
                  className={`${styles.statusBtn} ${
                    styles[report.status.toLowerCase()]
                  }`}
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
