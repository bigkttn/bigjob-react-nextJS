"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import styles from "./adminReport.module.css";
import { useRouter } from "next/navigation";

// --- TypeScript Interfaces ---
interface RawReportApiItem {
  report_id?: number;
  reporter_name?: string;
  reporter_id: number;
  reporter_role: string;
  report_type: string;
  description: string;
  target_name?: string;
  target_id: number;
  target_banned_until?: string | null;
  source: string;
  report_date: string;
  status: number;
  warn_message?: string | null; // ✅ เพิ่มรองรับข้อความตักเตือน
}

interface ReportItem {
  id: number;
  reportId?: number;
  reporter: string;
  reporterId: number;
  reporterRole: string;
  reportType: string;
  details: string;
  target: string;
  targetId: number;
  bannedUntil: number | null;
  source: string;
  rawDate: number;
  date: string;
  statusCode: number;
  status: string;
  statusClass: string;
  warnMessage?: string | null; // ✅ เพิ่มรองรับข้อความตักเตือน
}

interface UserPayload {
  id?: number | string;
  role?: string;
  email?: string;
  [key: string]: unknown;
}

// --- Helper Functions ---
const getDurationText = (
  statusCode: number,
  bannedUntil: number | null,
): string => {
  if (statusCode !== 1) return "-";
  if (!bannedUntil) return "ไม่มีกำหนด";
  const diffDays = Math.ceil(
    (bannedUntil - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "ครบกำหนดแล้ว";
  return `เหลืออีก ${diffDays} วัน`;
};

const getStatusText = (statusCode: number): string => {
  switch (statusCode) {
    case 1:
      return "ระงับการใช้งาน";
    case 2:
      return "ตักเตือน";
    case 3:
      return "ปลดแบน";
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
    case 3:
      return styles.unban;
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

  // States สำหรับ Modal ส่งตักเตือน
  const [warnModalItem, setWarnModalItem] = useState<ReportItem | null>(null);
  const [customWarnText, setCustomWarnText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State สำหรับป๊อปอัพดูข้อความตักเตือนย้อนหลัง ✅
  const [viewWarnText, setViewWarnText] = useState<{
    target: string;
    message: string;
  } | null>(null);

  const router = useRouter();
  const [, setUser] = useState<UserPayload | null>(null);

  // ฟังก์ชันดึงข้อมูลรายการรายงาน
  const fetchReports = useCallback(async () => {
    try {
      // 🟢 ใส่ { cache: 'no-store' } เพื่อให้ดึงข้อมูลใหม่จาก DB ทุกครั้ง
      const response = await fetch("/api/admin/reports", { cache: "no-store" });
      const result = await response.json();

      if (response.ok) {
        const formattedData: ReportItem[] = result.data.map(
          (item: RawReportApiItem, index: number) => ({
            id: index + 1,
            reportId: item.report_id,
            reporter: item.reporter_name || "ไม่ทราบชื่อ",
            reporterId: item.reporter_id,
            reporterRole: item.reporter_role,
            reportType: getReportTypeText(item.report_type),
            details: item.description,
            target: item.target_name || "ไม่ทราบข้อมูล",
            targetId: item.target_id,
            bannedUntil: item.target_banned_until
              ? new Date(item.target_banned_until).getTime()
              : null,
            source: item.source,
            rawDate: new Date(item.report_date).getTime(),
            date: new Date(item.report_date).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            statusCode: item.status,
            status: getStatusText(item.status),
            statusClass: getStatusClass(item.status),
            warnMessage: item.warn_message || null, // ✅ อ่านค่าข้อความตักเตือน
          }),
        );
        setReportData(formattedData);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkSessionAndFetch = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.user || data.user.role !== "admin") {
          router.push("/");
          return;
        }

        if (isMounted) {
          setUser(data.user);
          await fetchReports();
        }
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
  }, [router, fetchReports]);

  const handleToggleUnban = async (report: ReportItem) => {
    if (report.statusCode !== 1) return;

    const confirmUnban = window.confirm(
      `คุณต้องการปลดแบน ${report.target} ใช่หรือไม่?`,
    );
    if (!confirmUnban) return;

    try {
      let endpoint = "";
      if (report.source === "user") {
        endpoint = `/api/admin/user/ban?user_id=${report.targetId}`;
      } else if (report.source === "company") {
        endpoint = `/api/admin/companies/Ban?company_id=${report.targetId}`;
      } else if (report.source === "post") {
        endpoint = `/api/admin/post/Ban?post_id=${report.targetId}`;
      }

      const res = await fetch(endpoint, { method: "DELETE" });

      if (res.ok) {
        alert("ปลดแบนเรียบร้อยแล้ว");
        fetchReports();
      } else {
        const errData = await res.json();
        alert(`เกิดข้อผิดพลาด: ${errData.error || "ไม่สามารถปลดแบนได้"}`);
      }
    } catch (error) {
      console.error("Error unbanning:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  const handleOpenWarnModal = (report: ReportItem) => {
    setWarnModalItem(report);
    setCustomWarnText(
      `ได้รับการแจ้งร้องเรียนในหัวข้อ: ${report.reportType}\nรายละเอียด: ${report.details}`,
    );
  };

  const handleSendWarning = async () => {
    if (!warnModalItem || !customWarnText.trim()) {
      alert("กรุณากรอกข้อความตักเตือน");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/warn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: warnModalItem.reportId,
          target_id: warnModalItem.targetId,
          source: warnModalItem.source,
          message: customWarnText,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("ส่งอีเมลตักเตือนเรียบร้อยแล้ว");
        setWarnModalItem(null);
        setCustomWarnText("");
        fetchReports();
      } else {
        alert(
          `เกิดข้อผิดพลาด: ${data.error || "ไม่สามารถส่งอีเมลตักเตือนได้"}`,
        );
      }
    } catch (err) {
      console.error("Error sending warning:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <option value="ปลดแบน">ปลดแบน</option>
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
            <div className={styles.headerCell}>ระยะเวลาแบน / การจัดการ</div>
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
                    onClick={() => handleToggleUnban(report)}
                    className={`${styles.statusBtn} ${report.statusClass}`}
                    title={
                      report.statusCode === 1
                        ? "คลิกเพื่อปลดแบนรายการนี้"
                        : undefined
                    }
                  >
                    {report.status}
                  </button>
                </div>

                {/* ✅ คอลัมน์ที่ 8: แสดงปุ่มตักเตือน / ปุ่มดูเรื่องที่ส่งเตือน / ระยะเวลาแบน */}
                <div className={styles.cell}>
                  {report.statusCode === 0 ? (
                    <button
                      type="button"
                      onClick={() => handleOpenWarnModal(report)}
                      style={{
                        backgroundColor: "#f59e0b",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ตักเตือน
                    </button>
                  ) : report.statusCode === 2 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setViewWarnText({
                          target: report.target,
                          message:
                            report.warnMessage ||
                            "ไม่พบรายละเอียดข้อความตักเตือน",
                        })
                      }
                      style={{
                        backgroundColor: "#3b82f6",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                      }}
                      title="คลิกเพื่อดูข้อความตักเตือนที่ส่งไป"
                    >
                      ดูข้อความเตือน
                    </button>
                  ) : (
                    <span className={styles.badgeGray}>
                      {getDurationText(report.statusCode, report.bannedUntil)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ Modal 1: ป๊อปอัพสำหรับ Admin กรอกข้อความตักเตือนก่อนส่ง */}
        {warnModalItem && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "24px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "500px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              }}
            >
              <h3 style={{ margin: "0 0 12px 0", color: "#d97706" }}>
                ส่งอีเมลตักเตือน: {warnModalItem.target}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#4b5563",
                  marginBottom: "8px",
                }}
              >
                แก้ไขหรือระบุข้อความตักเตือนที่ต้องการส่งหาผู้ใช้ผ่านอีเมล:
              </p>

              <textarea
                rows={5}
                value={customWarnText}
                onChange={(e) => setCustomWarnText(e.target.value)}
                placeholder="พิมพ์รายละเอียดข้อความตักเตือนตรงนี้..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  marginBottom: "16px",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setWarnModalItem(null)}
                  disabled={isSubmitting}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSendWarning}
                  disabled={isSubmitting}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#f59e0b",
                    color: "#ffffff",
                    fontWeight: "bold",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "กำลังส่ง..." : "ส่งอีเมลตักเตือน"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Modal 2: ป๊อปอัพแสดงรายละเอียดข้อความตักเตือนย้อนหลัง */}
        {viewWarnText && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "24px",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "500px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              }}
            >
              <h3 style={{ margin: "0 0 12px 0", color: "#2563eb" }}>
                รายละเอียดข้อความตักเตือน
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                ส่งถึง: <strong>{viewWarnText.target}</strong>
              </p>
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  whiteSpace: "pre-line",
                  fontSize: "14px",
                  color: "#334155",
                  marginBottom: "16px",
                  maxHeight: "250px",
                  overflowY: "auto",
                }}
              >
                {viewWarnText.message}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setViewWarnText(null)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#64748b",
                    color: "#ffffff",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportPage;
