"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./userhome-client.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

const UserHomeClient = ({ initialUser }: { initialUser: any }) => {
  const [user] = useState(initialUser);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State สำหรับระบบค้นหาและ Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // State สำหรับ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9; // แสดงหน้าละ 9 โพสต์ (ปรับได้ตามต้องการ)

  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/posts/getallPosts?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // สกัดหาตัวเลือก Dynamic สำหรับ Dropdown (ดึงค่าที่ไม่ซ้ำจาก posts)
  const availableJobTypes = useMemo(() => {
    const types = posts.map((p) => p.job_type).filter(Boolean);
    return Array.from(new Set(types));
  }, [posts]);

  const availableProvinces = useMemo(() => {
    const provinces = posts
      .map((p) => p.province || p.work_location)
      .filter(Boolean);
    return Array.from(new Set(provinces));
  }, [posts]);

  //  ฟังก์ชันกรองข้อมูล (Filter Engine)
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // ค้นหาจาก Keyword (ตำแหน่ง, บริษัท, รายละเอียด, คุณสมบัติ, จังหวัด, สถานที่ทำงาน)
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        post.job_position?.toLowerCase().includes(term) ||
        post.company_name?.toLowerCase().includes(term) ||
        post.job_description?.toLowerCase().includes(term) ||
        post.preferred_qualifications?.toLowerCase().includes(term) ||
        post.province?.toLowerCase().includes(term) ||
        post.work_location?.toLowerCase().includes(term);

      // กรองตามประเภทงาน (Job Type)
      const matchesJobType =
        !selectedJobType || post.job_type === selectedJobType;

      // กรองตามจังหวัด/สถานที่ (Province / Location)
      const matchesProvince =
        !selectedProvince ||
        post.province === selectedProvince ||
        post.work_location?.includes(selectedProvince);

      // กรองตามสถานะ (Status)
      const matchesStatus =
        !selectedStatus ||
        post.status?.toLowerCase() === selectedStatus.toLowerCase();

      return (
        matchesSearch && matchesJobType && matchesProvince && matchesStatus
      );
    });
  }, [posts, searchTerm, selectedJobType, selectedProvince, selectedStatus]);

  //  คำนวณ Pagination จากข้อมูลที่กรองแล้ว (filteredPosts)
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  // ฟังก์ชันจัดการเมื่อเปลี่ยนค่า Search/Filter
  const handleFilterChange = (setter: Function, value: string) => {
    setter(value);
    setCurrentPage(1); // รีเซ็ตไปหน้า 1 เสมอเมื่อเปลี่ยนตัวกรอง
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedJobType("");
    setSelectedProvince("");
    setSelectedStatus("");
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

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

  const suggestedCompanys = [
    {
      job_title: "Quantum Software Engineer",
      companyName: "Quantum nexus",
      img: "/assets/images/suggestedCompanys.jpg",
    },
    {
      job_title: "Quantum Software Engineer",
      companyName: "Quantum nexus",
      img: "/assets/images/suggestedCompanys.jpg",
    },
    {
      job_title: "Quantum Software Engineer",
      companyName: "Quantum nexus",
      img: "/assets/images/suggestedCompanys.jpg",
    },
  ];

  if (isLoading) {
    return (
      <div className={styles.skeletonWrapper}>
        <header className={styles.searchSection}>
          <div className={styles.searchBarWrapper}>
            <div
              className={styles.skeletonBlock}
              style={{ width: "50%", height: "42px", borderRadius: "21px" }}
            />
          </div>
        </header>
        <div className={styles.mainLayout}>
          <div className={styles.leftSidebar}>
            <div
              className={styles.skeletonBlock}
              style={{ width: "100%", height: "400px", borderRadius: "15px" }}
            />
          </div>
          <div className={styles.rightContent}>
            <div
              className={styles.skeletonBlock}
              style={{ width: "100%", height: "600px", borderRadius: "15px" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Search & Filters */}
      <header className={styles.searchSection}>
        <div className={styles.searchBarWrapper}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
            placeholder="ค้นหาตำแหน่งงาน, ชื่อบริษัท, ทักษะ หรือสถานที่..."
            className={styles.searchInput}
          />
        </div>

        {/* Dynamic Filters */}
        <div className={styles.filters}>
          {/* Filter 1: Job Type */}
          <select
            value={selectedJobType}
            onChange={(e) =>
              handleFilterChange(setSelectedJobType, e.target.value)
            }
          >
            <option value="">ประเภทงานทั้งหมด</option>
            {availableJobTypes.map((type, i) => (
              <option key={i} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Filter 2: Province / Location */}
          <select
            value={selectedProvince}
            onChange={(e) =>
              handleFilterChange(setSelectedProvince, e.target.value)
            }
          >
            <option value="">ทุกจังหวัด / สถานที่</option>
            {availableProvinces.map((prov, i) => (
              <option key={i} value={prov}>
                {prov}
              </option>
            ))}
          </select>

          {/* Filter 3: Status */}
          <select
            value={selectedStatus}
            onChange={(e) =>
              handleFilterChange(setSelectedStatus, e.target.value)
            }
          >
            <option value="">ทุกสถานะ</option>
            <option value="Open">Open (เปิดรับ)</option>
            <option value="Closed">Closed (ปิดรับ)</option>
          </select>

          {/* ปุ่มล้างตัวกรอง */}
          {(searchTerm ||
            selectedJobType ||
            selectedProvince ||
            selectedStatus) && (
            <button className={styles.resetBtn} onClick={handleResetFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </header>

      {/* Main Layout 30% / 70% */}
      <div className={styles.mainLayout}>
        {/* ===== ฝั่งซ้าย 30%: Suggested Posts ===== */}
        <aside className={styles.leftSidebar}>
          <div className={styles.suggestContent}>
            <h3>Suggested Posts</h3>
            <div className={styles.verticalList}>
              {suggestedCompanys.map((company, index) => (
                <div key={index} className={styles.suggestMiniCard}>
                  <img
                    src={company.img}
                    alt={company.companyName}
                    className={styles.cardImg}
                  />
                  <div className={styles.suggestMiniCardInfo}>
                    <div>
                      <p className={styles.bold}>{company.companyName}</p>
                      <p className={styles.subText}>{company.job_title}</p>
                    </div>
                    <Link
                      href={"/company/company-home"}
                      className={styles.btnWrapper}
                    >
                      <button className={styles.detailsBtn}>Details</button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ===== ฝั่งขวา 70%: Search Results ===== */}
        <main className={styles.rightContent}>
          <div className={styles.suggestContent}>
            <div className={styles.headerTitleRow}>
              <h3>
                {searchTerm ||
                selectedJobType ||
                selectedProvince ||
                selectedStatus
                  ? `ผลการค้นหา (${filteredPosts.length} รายการ)`
                  : "Latest Job Openings"}
              </h3>
            </div>

            <div className={styles.suggestGrid}>
              {currentPosts.length > 0 ? (
                currentPosts.map((post) => (
                  <div key={post.post_id} className={styles.suggestMiniCard}>
                    <img
                      src={
                        post.logo_image || "/assets/images/default-company.png"
                      }
                      alt={post.company_name}
                      className={styles.cardImg}
                    />
                    <div className={styles.suggestMiniCardInfo}>
                      <div>
                        <div className={styles.cardHeader}>
                          <p className={styles.bold}>{post.company_name}</p>
                          <span
                            className={styles.statusBadge}
                            style={getStatusStyle(post.status)}
                          >
                            {post.status || "ไม่ระบุ"}
                          </span>
                        </div>
                        <p className={styles.jobPositionText}>
                          {post.job_position}
                        </p>
                        <p className={styles.subText}>
                          {post.province ||
                            post.work_location ||
                            "ไม่ระบุสถานที่"}
                        </p>
                        <p className={styles.subText}>
                          {post.job_type || "ไม่ระบุประเภท"}
                        </p>
                        <p className={styles.subText}>
                          {formatSalary(post.salary_min, post.salary_max)}
                        </p>
                      </div>
                      <Link
                        href={"/user/user-detail-job/" + post.post_id}
                        className={styles.btnWrapper}
                      >
                        <button className={styles.detailsBtn}>Details</button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.noData}>ไม่พบประกาศงานที่ตรงกับการค้นหา</p>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredPosts.length > postsPerPage && (
              <div className={styles.paginationWrapper}>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={styles.pageBtn}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserHomeClient;
