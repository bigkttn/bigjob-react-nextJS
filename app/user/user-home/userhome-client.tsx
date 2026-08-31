"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./userhome-client.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProvinceSelect from "./province";

// 1. กำหนด Type ของ User (อิงตามข้อมูลจริงจาก Console ในรูป)
interface User {
  id?: number;
  user_id?: number | string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// 2. กำหนด Type ของ ประกาศงาน (Job Post)
interface JobPost {
  post_id: number | string;
  company_name?: string;
  logo_image?: string;
  status?: string;
  job_position?: string;
  province?: string;
  work_location?: string;
  job_type?: string;
  salary_min?: number;
  salary_max?: number;
  created_at?: string;
  matchScore?: number;
}

const UserHomeClient = ({ initialUser }: { initialUser: User | null }) => {
  const [user] = useState(initialUser);
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Suggested Posts State
  const [suggestedPosts, setSuggestedPosts] = useState<JobPost[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Sort State (ค่าเริ่มต้นเรียงตามความเกี่ยวข้อง AI Match)
  const [sortBy, setSortBy] = useState("relevance");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  const router = useRouter();

  console.log(" = ", initialUser);
  // 1. ดึงข้อมูล Suggested Posts ครั้งแรก
  useEffect(() => {
    fetchSuggestedPosts();
  }, [user]);

  // 2. Debounce Search Effect สำหรับ AI Hybrid Search API
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        performHybridSearch(searchTerm.trim());
      } else {
        fetchPosts();
      }
    }, 400); // ชะลอ 400ms ก่อนยิง API

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ฟังก์ชันดึงโพสต์งานปกติ (กรณีไม่มีคำค้นหา)
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

  // ฟังก์ชันยิง AI Hybrid Search API
  const performHybridSearch = async (query: string) => {
    try {
      setIsSearching(true);
      const res = await fetch(
        `/api/posts/user-search-post?q=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Hybrid Search Error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchSuggestedPosts = async () => {
    try {
      setIsSuggestLoading(true);
      const userId = user?.user_id || user?.id || "";

      const res = await fetch(`/api/posts/UserSuggested?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setSuggestedPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Fetch suggested posts error:", err);
      setSuggestedPosts([]);
    } finally {
      setIsSuggestLoading(false);
    }
  };

  function getTimeAgo(dateString: string | Date): string {
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

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ปีที่แล้ว`;
  }

  const availableJobTypes = useMemo(() => {
    const types = posts.map((p) => p.job_type).filter(Boolean);
    return Array.from(new Set(types));
  }, [posts]);

  // ฟังก์ชันกรองและเรียงลำดับโพสต์งานบน Client-Side
  const filteredPosts = useMemo(() => {
    const filtered = posts.filter((post) => {
      const matchesJobType =
        !selectedJobType || post.job_type === selectedJobType;

      const matchesProvince =
        !selectedProvince ||
        post.province === selectedProvince ||
        post.work_location?.includes(selectedProvince);

      const matchesStatus =
        !selectedStatus ||
        post.status?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesJobType && matchesProvince && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();

      if (sortBy === "oldest") {
        return timeA - timeB;
      }
      if (sortBy === "newest") {
        return timeB - timeA;
      }
      // ค่าเริ่มต้น "relevance": เรียงตาม matchScore หากมี (กรณีค้นหาด้วย Hybrid Search)
      if (
        typeof b.matchScore === "number" &&
        typeof a.matchScore === "number"
      ) {
        return b.matchScore - a.matchScore;
      }
      return timeB - timeA;
    });
  }, [posts, selectedJobType, selectedProvince, selectedStatus, sortBy]);

  // Pagination Calculations
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const handleFilterChange = (
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedJobType("");
    setSelectedProvince("");
    setSelectedStatus("");
    setSortBy("relevance");
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
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
            placeholder="ค้นหาตำแหน่งงาน, ชื่อบริษัท, ทักษะ หรือสถานที่ (รองรับ AI Semantic Search)..."
            className={styles.searchInput}
          />
          {isSearching && (
            <span className={styles.searchingBadge}>กำลังค้นหาด้วย AI...</span>
          )}
        </div>

        {/* Dynamic Filters */}
        <div className={styles.filters}>
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

          {/* Standalone Province Select Component */}
          <ProvinceSelect
            value={selectedProvince}
            onChange={(val) => handleFilterChange(setSelectedProvince, val)}
          />

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

          <select
            value={sortBy}
            onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
          >
            {/* <option value="relevance">
              เรียงตาม: ความเกี่ยวข้อง (AI Match)
            </option> */}
            <option value="newest">เรียงตาม: โพสต์ล่าสุด</option>
            <option value="oldest">เรียงตาม: โพสต์เก่าสุด</option>
          </select>

          {(searchTerm ||
            selectedJobType ||
            selectedProvince ||
            selectedStatus ||
            sortBy !== "relevance") && (
            <button className={styles.resetBtn} onClick={handleResetFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </header>

      {/* Main Layout 30% / 70% */}
      <div className={styles.mainLayout}>
        <aside className={styles.leftSidebar}>
          <div className={styles.suggestContent}>
            <h3>Suggested Posts</h3>
            <div className={styles.verticalList}>
              {isSuggestLoading ? (
                <p className={styles.subText}>
                  กำลังประมวลผลตำแหน่งงานแนะนำ...
                </p>
              ) : suggestedPosts.length > 0 ? (
                suggestedPosts.map((post) => (
                  <div key={post.post_id} className={styles.suggestMiniCard}>
                    <img
                      src={
                        post.logo_image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          post.company_name || "Company",
                        )}&background=random`
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
                            style={getStatusStyle(post.status || "")}
                          >
                            {post.status || "ไม่ระบุ"}
                          </span>
                        </div>
                        <p className={styles.jobPositionText}>
                          {post.job_position}
                        </p>
                        <p className={styles.subText}>
                          {post.province || "ไม่ระบุสถานที่"}
                        </p>
                        <p className={styles.subText}>
                          {post.job_type || "ไม่ระบุประเภท"}
                        </p>
                        <p className={styles.subText}>
                          {formatSalary(post.salary_min, post.salary_max)}
                        </p>
                      </div>
                      <p className={styles.subText}>
                        {getTimeAgo(post.created_at || "")}
                      </p>
                      <Link
                        href={`/user/user-detail-job/${post.post_id}`}
                        className={styles.btnWrapper}
                      >
                        <button className={styles.detailsBtn}>Details</button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.subText}>ไม่มีตำแหน่งงานแนะนำ</p>
              )}
            </div>
          </div>
        </aside>

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
                        post.logo_image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          post.company_name || "Company",
                        )}&background=random`
                      }
                      alt={post.company_name}
                      className={styles.cardImg}
                    />
                    <div className={styles.suggestMiniCardInfo}>
                      <div>
                        <div className={styles.cardHeader}>
                          <p className={styles.bold}>{post.company_name}</p>
                          {/* แสดง AI Match Score เปอร์เซ็นต์เมื่อมีการค้นหา */}
                          {/* {typeof post.matchScore === "number" && 
                            <span className={styles.matchBadge}>
                              {Math.min(100, Math.round(post.matchScore * 100))}% Match
                            </span>
                          )} */}
                          <span
                            className={styles.statusBadge}
                            style={getStatusStyle(post.status || "")}
                          >
                            {post.status || "ไม่ระบุ"}
                          </span>
                        </div>
                        <p className={styles.jobPositionText}>
                          {post.job_position}
                        </p>
                        <p className={styles.subText}>
                          {post.province || "ไม่ระบุสถานที่"}
                        </p>
                        <p className={styles.subText}>
                          {post.job_type || "ไม่ระบุประเภท"}
                        </p>
                        <p className={styles.subText}>
                          {formatSalary(post.salary_min, post.salary_max)}
                        </p>
                      </div>
                      <p className={styles.subText}>
                        {getTimeAgo(post.created_at || "")}
                      </p>
                      <Link
                        href={`/user/user-detail-job/${post.post_id}`}
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
