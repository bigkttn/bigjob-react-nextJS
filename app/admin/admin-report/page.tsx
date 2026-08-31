"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./adminReport.module.css";
import { useRouter } from "next/navigation"; // --- TypeScript Interfaces ---
interface RawReportApiItem {
  reporter_name?: string;
  reporter_id: number;
  reporter_role: string;
  report_type: string;
  description: string;
  target_name?: string;
  target_id: number;
  source: string;
  report_date: string;
  status: number;
}

interface ReportItem {
  id: number;
  reporter: string;
  reporterId: number;
  reporterRole: string;
  reportType: string;
  details: string;
  target: string;
  targetId: number;
  source: string;
  rawDate: number;
  date: string;
  status: string;
  statusClass: string;
}

// กำหนด Type ของ User ให้ชัดเจน (ไม่ต้องใช้ any)
interface UserPayload {
  id?: number | string;
  role?: string;
  email?: string;
  [key: string]: unknown;
}

// --- Helper Functions (วางไว้นอก Component เพื่อป้องกัน react-hooks/exhaustive-deps) ---
const getStatusText = (statusCode: number): string => {
  switch (statusCode) {
    case 1:
      return "ระงับการใช้งาน";
    case 2:
      return "ตักเตือน";
    case 0:
    default:
      return "รอดำเนินการ";
  }
};

const getStatusClass = (statusCode: number): string => {
  switch (statusCode) {
    case 1:
      return styles.suspend;
    case 2:
      return styles.warn;
    case 0:
    default:
      return styles.review;
  }
};

const getReportTypeText = (type: string): string => {
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

const getTargetLink = (source: string, targetId: number): string => {
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

const getReportLink = (role: string, reporterId: number): string => {
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

const AdminReportPage = () => {
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // States สำหรับตัวกรอง
  const [filterAccountType, setFilterAccountType] = useState<string>("ทั้งหมด");
  const [filterStatus, setFilterStatus] = useState<string>("ทั้งหมด");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const router = useRouter();
  const [user, setUser] = useState<UserPayload | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSessionAndFetch = async () => {
      try {
        // 1. เรียก API Route ที่คุณสร้างไว้ (เปลี่ยน Path ให้ตรงกับที่คุณเซ็ตไว้)
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        // 2. ถ้าไม่มี User ล็อกอิน หรือ Role ไม่ใช่ admin ให้ Re-direct ไปหน้าหลัก
        if (!data.user || data.user.role !== "admin") {
          router.push("/");
          return;
        }

        if (isMounted) {
          setUser(data.user);
        }

        // 3. (ถ้ามี) ดึงข้อมูลรายงานต่อ...
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการตรวจสอบ Session:", error);
        router.push("/");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSessionAndFetch();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    const fetchReports = async () => {
      try {
        const response = await fetch("/api/admin/reports");
        const result = await response.json();

        if (response.ok && isMounted) {
          const formattedData: ReportItem[] = result.data.map(
            (item: RawReportApiItem, index: number) => ({
              id: index + 1,
              reporter: item.reporter_name || "ไม่ทราบชื่อ",
              reporterId: item.reporter_id,
              reporterRole: item.reporter_role,
              reportType: getReportTypeText(item.report_type),
              details: item.description,
              target: item.target_name || "ไม่ทราบข้อมูล",
              targetId: item.target_id,
              source: item.source,
              rawDate: new Date(item.report_date).getTime(),
              date: new Date(item.report_date).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              status: getStatusText(item.status),
              statusClass: getStatusClass(item.status),
            }),
          );
          setReportData(formattedData);
        } else if (!response.ok) {
          console.error(result.message);
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      }
    };

    if (!loading) {
      fetchReports();
    }

    return () => {
      isMounted = false;
    };
  }, [loading]);

  const filteredAndSortedData = reportData
    .filter((report) => {
      if (
        filterAccountType !== "ทั้งหมด" &&
        report.source !== filterAccountType
      ) {
        return false;
      }
      if (filterStatus !== "ทั้งหมด" && report.status !== filterStatus) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "desc") {
        return b.rawDate - a.rawDate;
      }
      return a.rawDate - b.rawDate;
    });

  if (loading) return <div>กำลังโหลดข้อมูลการรายงาน...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.reportCard}>
        <h2 className={styles.title}>รายงานการร้องเรียน (Report)</h2>

        {/* --- ส่วน Filter --- */}
        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>ประเภทรายการ:</span>
            <select
              className={styles.filterSelect}
              value={filterAccountType}
              onChange={(e) => setFilterAccountType(e.target.value)}
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              <option value="user">ผู้หางาน (User)</option>
              <option value="company">บริษัท (Company)</option>
              <option value="post">โพสต์ประกาศงาน (Post)</option>
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
              <option value="รอดำเนินการ">รอดำเนินการ</option>
              <option value="ตักเตือน">ตักเตือน</option>
              <option value="ระงับการใช้งาน">ระงับการใช้งาน</option>
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

        {/* --- ตารางแสดงข้อมูล --- */}
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <div className={styles.headerCell}>ลำดับ</div>
            <div className={styles.headerCell}>ผู้แจ้งรายงาน</div>
            <div className={styles.headerCell}>ประเภทข้อร้องเรียน</div>
            <div className={styles.headerCell}>รายละเอียด</div>
            <div className={styles.headerCell}>เป้าหมายที่ถูกรายงาน</div>
            <div className={styles.headerCell}>วันที่แจ้ง</div>
            <div className={styles.headerCell}>สถานะ</div>
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
                    className={styles.cellLink}
                  >
                    <span className={styles.nextLink}>{report.reporter}</span>
                  </Link>
                </div>

                <div className={styles.cell}>
                  <span className={styles.badgeGray}>{report.reportType}</span>
                </div>

                <div className={styles.cell}>
                  <div className={styles.detailBubble}>{report.details}</div>
                </div>

                <div className={styles.cell}>
                  <Link
                    href={getTargetLink(report.source, report.targetId)}
                    className={styles.cellLink}
                  >
                    <span className={styles.nextLink}>{report.target}</span>
                  </Link>
                </div>

                <div className={styles.cell}>
                  <span className={styles.badgeGray}>{report.date}</span>
                </div>

                <div className={styles.cell}>
                  <button
                    type="button"
                    className={`${styles.statusBtn} ${report.statusClass}`}
                  >
                    {report.status}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportPage;
