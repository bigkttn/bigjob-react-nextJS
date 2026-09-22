"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./savedCompany.module.css";

interface Company {
  cid: number;
  post_id: number;
  name: string;
  job_title: string;
  logo: string;
  created_at?: string;
  post_created_at?: string;
  status?: string;
  province?: string;
  job_type?: string;
  salary_min?: number;
  salary_max?: number;
}

interface ClientProps {
  userId: number;
}

export default function SavedSeekerClient({ userId }: ClientProps) {
  const [compayData, setCompanyData] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterJobTitle, setFilterJobTitle] = useState("");
  const [sortTime, setSortTime] = useState("desc");

  useEffect(() => {
    const fetchSeekers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/user/saved-company", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        });

        if (!res.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้");
        }

        const data = await res.json();
        // console.log("data in page:", data);
        setCompanyData(data);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดบางอย่าง");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSeekers();
    }
  }, [userId]);

  const uniqueJobTitles = Array.from(
    new Set(compayData.map((company) => company.job_title).filter(Boolean)),
  );

  let filteredData = compayData.filter((company) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (company.name && company.name.toLowerCase().includes(term)) ||
      (company.job_title && company.job_title.toLowerCase().includes(term));
    const matchJobTitle = filterJobTitle
      ? company.job_title === filterJobTitle
      : true;
    return matchSearch && matchJobTitle;
  });

  filteredData = filteredData.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortTime === "desc" ? dateB - dateA : dateA - dateB;
  });

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "open" || s === "เปิดรับสมัคร")
      return {
        color: "#28a745",
        backgroundColor: "#eaffea",
        borderColor: "#28a745",
      };
    if (s === "closed" || s === "ปิดรับสมัคร")
      return {
        color: "#dc3545",
        backgroundColor: "#ffebeb",
        borderColor: "#dc3545",
      };
    return {
      color: "#6c757d",
      backgroundColor: "#f8f9fa",
      borderColor: "#6c757d",
    };
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "ไม่ระบุเงินเดือน";
    if (min && !max) return `฿${min.toLocaleString()}+`;
    if (!min && max) return `สูงสุด ฿${max.toLocaleString()}`;
    return `฿ ${min?.toLocaleString()} - ฿ ${max?.toLocaleString()}`;
  };

  function getTimeAgo(dateString?: string): string {
    if (!dateString) return "ไม่ระบุเวลา";
    const createdDate = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - createdDate.getTime()) / 1000,
    );
    if (diffInSeconds < 60) return "เมื่อสักครู่";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} วันที่แล้ว`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} เดือนที่แล้ว`;
    return `${Math.floor(diffInDays / 365)} ปีที่แล้ว`;
  }

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const toggleMenu = (postId: number) => {
    setOpenMenuId((prev) => (prev === postId ? null : postId));
  };

  const handleUnsave = async (postId: number) => {
    setOpenMenuId(null);
    const confirmDelete = confirm("ต้องการยกเลิกการบันทึกบริษัทนี้ใช่หรือไม่?");
    if (!confirmDelete) return;

    try {
      const response = await fetch("/api/user/delete_favour_post", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          post_id: postId,
        }),
      });

      if (response.ok) {
        setCompanyData((prev) => prev.filter((c) => c.post_id !== postId));
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`ไม่สามารถยกเลิกได้: ${errorData.message || "เกิดข้อผิดพลาด"}`);
      }
    } catch (error) {
      console.error("Error unsaving company:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest(".menu-container")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (loading)
    return <div className={styles.centerMessage}>กำลังโหลดข้อมูล...</div>;
  if (error)
    return (
      <div className={styles.centerMessage} style={{ color: "red" }}>
        ข้อผิดพลาด: {error}
      </div>
    );
  if (compayData.length === 0)
    return (
      <div className={styles.centerMessage}>ไม่พบข้อมูลบริษัทที่บันทึกไว้</div>
    );

  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        {/* Search Bar & Filter */}
        <div className={styles.searchWrapper}>
          <select
            value={sortTime}
            onChange={(e) => setSortTime(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="desc">บันทึกล่าสุด</option>
            <option value="asc">บันทึกเก่าสุด</option>
          </select>
          <select
            value={filterJobTitle}
            onChange={(e) => setFilterJobTitle(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">ตำแหน่งงานทั้งหมด</option>
            {uniqueJobTitles.map((title, index) => (
              <option key={index} value={title}>
                {title}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="ค้นหาชื่อบริษัท หรือตำแหน่งงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {filteredData.length === 0 ? (
          <div className={styles.centerMessage}>ไม่พบข้อมูลที่ค้นหา</div>
        ) : (
          filteredData.map((company, index) => (
            <div key={`${company.cid}-${index}`} className={styles.card}>
              <div className={styles.cardFlex}>
                {/* Image Section */}
                <div className={styles.imageWrapper}>
                  <img
                    src={
                      company.logo ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name || "Company")}&background=random`
                    }
                    alt={company.name}
                    width={240}
                    height={160}
                    className={styles.seekerImage}
                  />
                </div>

                {/* Info Section */}
                <div className={styles.infoWrapper}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.3rem' }}>
                    <h2 className={styles.seekerName} style={{ margin: 0, paddingRight: 0 }}>
                      {company.name}
                    </h2>
                    <span
                      className={styles.statusBadge}
                      style={{
                        ...getStatusStyle(company.status || ""),
                        margin: 0,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        lineHeight: 1
                      }}
                    >
                      {company.status || "ไม่ระบุ"}
                    </span>
                  </div>
                  <h3 className={styles.seekerPosition}>{company.job_title}</h3>

                  <div className={styles.detailsGrid}>
                    <p>
                      <span>สถานที่:</span>{" "}
                      {company.province || "ไม่ระบุสถานที่"}
                    </p>
                    <p>
                      <span>ประเภทงาน:</span>{" "}
                      {company.job_type || "ไม่ระบุประเภท"}
                    </p>
                    <p>
                      <span>เงินเดือน:</span>{" "}
                      {formatSalary(company.salary_min, company.salary_max)}
                    </p>
                    <p>
                      <span>ประกาศเมื่อ:</span>{" "}
                      {getTimeAgo(company.post_created_at)}
                    </p>
                  </div>
                </div>

                {/* Button Section */}
                <div className={styles.buttonWrapper}>
                  <Link href={"/user/user-detail-job/" + company.post_id}>
                    <button className={styles.infoButton}>ดูรายละเอียด</button>
                  </Link>
                </div>

                {/* 3-Dot Menu */}
                <div className={`menu-container ${styles.menuContainer}`}>
                  <button
                    className={styles.actionMenuBtn}
                    onClick={() => toggleMenu(company.post_id)}
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  {openMenuId === company.post_id && (
                    <div className={styles.dropdownMenu}>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleUnsave(company.post_id)}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "1.1rem" }}
                        >
                          bookmark_remove
                        </span>
                        ยกเลิกการบันทึก
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
