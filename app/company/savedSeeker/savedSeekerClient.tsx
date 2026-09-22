"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./savedSeeker.module.css";

interface SeekerDetails {
  gender: string;
  age: number;
  militaryStatus: string;
  dateOfBirth: string;
  nationality: string;
  religion: string;
  weight: string;
  height: string;
}

interface Seeker {
  uid: number;
  name: string;
  jobtitle: string;
  image: string;
  created_at?: string;
  is_visible?: number;
  details: SeekerDetails | null;
}

interface ClientProps {
  companyId: number;
}

export default function SavedSeekerClient({ companyId }: ClientProps) {
  const [seekerData, setSeekersData] = useState<Seeker[]>([]);
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

        const res = await fetch("/api/company/saved-seekers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ company_id: companyId }),
        });

        if (!res.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้");
        }

        const data = await res.json();
        console.log("data of savedSeekerClient:", data);

        setSeekersData(data);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message || "เกิดข้อผิดพลาดบางอย่าง");
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchSeekers();
    }
  }, [companyId]);

  const uniqueJobTitles = Array.from(
    new Set(seekerData.map((seeker) => seeker.jobtitle).filter(Boolean)),
  );

  let filteredData = seekerData.filter((seeker) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (seeker.name && seeker.name.toLowerCase().includes(term)) ||
      (seeker.jobtitle && seeker.jobtitle.toLowerCase().includes(term));
    const matchJobTitle = filterJobTitle
      ? seeker.jobtitle === filterJobTitle
      : true;
    return matchSearch && matchJobTitle;
  });

  filteredData = filteredData.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return sortTime === "desc" ? dateB - dateA : dateA - dateB;
  });

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const toggleMenu = (uid: number) => {
    setOpenMenuId((prev) => (prev === uid ? null : uid));
  };

  const handleUnsave = async (seekerUid: number) => {
    setOpenMenuId(null);
    const confirmDelete = confirm(
      "ต้องการยกเลิกการบันทึกผู้สมัครงานคนนี้ใช่หรือไม่?",
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch("/api/company/delete_favour_user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: seekerUid,
          company_id: companyId,
        }),
      });

      if (response.ok) {
        setSeekersData((prev) => prev.filter((s) => s.uid !== seekerUid));
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`ไม่สามารถยกเลิกได้: ${errorData.message || "เกิดข้อผิดพลาด"}`);
      }
    } catch (error) {
      console.error("Error unsaving seeker:", error);
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
  if (seekerData.length === 0)
    return (
      <div className={styles.centerMessage}>
        ไม่พบข้อมูลผู้สมัครที่บันทึกไว้
      </div>
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
            placeholder="ค้นหาชื่อผู้สมัคร หรือตำแหน่งงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {filteredData.length === 0 ? (
          <div className={styles.centerMessage}>ไม่พบข้อมูลที่ค้นหา</div>
        ) : (
          filteredData.map((seeker, index) => (
            <div key={`${seeker.uid}-${index}`} className={styles.card}>
              <div className={styles.cardFlex}>
                {/* Image Section */}
                <div className={styles.imageWrapper}>
                  <img
                    src={
                      seeker.image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(seeker.name || "User")}&background=random`
                    }
                    alt={seeker.name}
                    width={240}
                    height={160}
                    className={styles.seekerImage}
                  />
                </div>

                {/* Info Section */}
                <div className={styles.infoWrapper}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <h2 className={styles.seekerName}>{seeker.name}</h2>
                    {seeker.is_visible === 0 && (
                      <span
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#e5e7eb",
                          color: "#6b7280",
                          fontSize: "0.85rem",
                          fontWeight: "bold",
                          borderRadius: "20px",
                          marginBottom: "0.3rem",
                        }}
                      >
                        ผู้สมัครปิดโปรไฟล์
                      </span>
                    )}
                  </div>
                  <h3 className={styles.seekerPosition}>{seeker.jobtitle}</h3>

                  {seeker.details && (
                    <div className={styles.detailsGrid}>
                      <p>
                        <span>เพศ:</span> {seeker.details.gender}
                      </p>
                      <p>
                        <span>อายุ:</span> {seeker.details.age}
                      </p>
                      <p>
                        <span>สถานะทางทหาร:</span>{" "}
                        {seeker.details.militaryStatus}
                      </p>
                      <p>
                        <span>วันเกิด:</span> {seeker.details.dateOfBirth}
                      </p>
                      <p>
                        <span>สัญชาติ:</span> {seeker.details.nationality}
                      </p>
                      <p>
                        <span>ศาสนา:</span> {seeker.details.religion}
                      </p>
                      <p>
                        <span>น้ำหนัก (กก.):</span> {seeker.details.weight}
                      </p>
                      <p>
                        <span>ส่วนสูง (ซม.):</span> {seeker.details.height}
                      </p>
                    </div>
                  )}
                </div>

                {/* Button Section */}
                <div className={styles.buttonWrapper}>
                  {seeker.is_visible === 0 ? (
                    <button
                      className={styles.infoButton}
                      style={{
                        backgroundColor: "#d1d5db",
                        cursor: "not-allowed",
                      }}
                      disabled
                    >
                      ปิดโปรไฟล์
                    </button>
                  ) : (
                    <Link href={`/company/seeker-profile/${seeker.uid}`}>
                      <button className={styles.infoButton}>
                        ดูรายละเอียด
                      </button>
                    </Link>
                  )}
                </div>

                {/* 3-Dot Menu */}
                <div className={`menu-container ${styles.menuContainer}`}>
                  <button
                    className={styles.actionMenuBtn}
                    onClick={() => toggleMenu(seeker.uid)}
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  {openMenuId === seeker.uid && (
                    <div className={styles.dropdownMenu}>
                      <button
                        className={styles.dropdownItem}
                        onClick={() => handleUnsave(seeker.uid)}
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
