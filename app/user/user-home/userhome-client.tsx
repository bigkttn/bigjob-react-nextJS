"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./userhome-client.module.css";
import Link from "next/link";
import ProvinceSelect from "./province";

interface User {
  id?: number;
  user_id?: number | string;
  email?: string;
  role?: string;
}

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

  const abortRef = useRef<AbortController | null>(null);

  const [suggestedPosts, setSuggestedPosts] = useState<JobPost[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter & Sort State
  const [selectedJobType, setSelectedJobType] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  useEffect(() => {
    fetchSuggestedPosts();
  }, [user]);

  const performHybridSearch = useCallback(
    async (query: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setIsSearching(true);
        const queryParams = new URLSearchParams({
          q: query,
          job_type: selectedJobType,
          province: selectedProvince,
          status: selectedStatus,
          sort: sortBy,
        });

        const res = await fetch(
          `/api/posts/user-search-post?${queryParams.toString()}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (data.success) {
          setPosts(data.posts || []);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Search Error:", err);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    },
    [selectedJobType, selectedProvince, selectedStatus, sortBy],
  );

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        job_type: selectedJobType,
        province: selectedProvince,
        status: selectedStatus,
        sort: sortBy,
        t: Date.now().toString(),
      });

      const res = await fetch(
        `/api/posts/getallPosts?${queryParams.toString()}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedJobType, selectedProvince, selectedStatus, sortBy]);

  // เมื่อเปลี่ยนเงื่อนไขค้นหา หรือ Filter
  useEffect(() => {
    if (searchTerm.trim()) {
      performHybridSearch(searchTerm.trim());
    } else {
      fetchPosts();
    }
  }, [searchTerm, fetchPosts, performHybridSearch]);

  const fetchSuggestedPosts = async () => {
    try {
      setIsSuggestLoading(true);
      const userId = user?.user_id || user?.id || "";
      const res = await fetch(`/api/posts/UserSuggested?userId=${userId}`);
      const data = await res.json();
      if (data.success) setSuggestedPosts(data.posts || []);
    } catch (err) {
      console.error("Fetch suggested error:", err);
    } finally {
      setIsSuggestLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    setSearchTerm(searchInput.trim());
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
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
    return `${Math.floor(diffInDays / 365)} ปีที่แล้ว`;
  }

  const availableJobTypes = [
    "Full-time",
    "Part-time",
    "Freelance",
    "Internship",
    "Contract",
  ];

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setSelectedJobType("");
    setSelectedProvince("");
    setSelectedStatus("");
    setSortBy("newest");
    setCurrentPage(1);
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

  const isFilterActive =
    searchTerm ||
    selectedJobType ||
    selectedProvince ||
    selectedStatus ||
    sortBy !== "newest";

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
      <header className={styles.searchSection}>
        <div className={styles.searchBarWrapper}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="ค้นหาตำแหน่งงาน, ชื่อบริษัท, ทักษะ หรือสถานที่ (รองรับ AI Semantic Search)..."
            className={styles.searchInput}
          />
          <button
            type="button"
            onClick={handleSearchSubmit}
            disabled={isSearching}
            className={styles.searchBtnMain}
          >
            {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
          </button>
        </div>

        {searchTerm && !isSearching && (
          <p className={styles.searchingBadge}>
            แสดงผลการค้นหาสำหรับ: “{searchTerm}”
          </p>
        )}

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
            <option value="Open">เปิดรับสมัคร</option>
            <option value="Closed">ปิดรับสมัคร</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
          >
            <option value="newest">เรียงตาม: โพสต์ล่าสุด</option>
            <option value="oldest">เรียงตาม: โพสต์เก่าสุด</option>
          </select>

          {isFilterActive && (
            <button className={styles.resetBtn} onClick={handleResetFilters}>
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </header>

      <div className={styles.mainLayout}>
        <aside className={styles.leftSidebar}>
          <div className={styles.suggestContent}>
            <h3>ตำแหน่งงานแนะนำ</h3>
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
                        <button className={styles.detailsBtn}>
                          รายละเอียด
                        </button>
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
                {isFilterActive
                  ? `ผลการค้นหา (${posts.length} รายการ)`
                  : "ประกาศงานล่าสุด"}
              </h3>
            </div>

            <div className={styles.suggestGrid}>
              {isSearching ? (
                <p className={styles.subText}>กำลังค้นหาด้วย AI...</p>
              ) : currentPosts.length > 0 ? (
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
                        <button className={styles.detailsBtn}>
                          รายละเอียด
                        </button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.noData}>ไม่พบประกาศงานที่ตรงกับการค้นหา</p>
              )}
            </div>

            {posts.length > postsPerPage && (
              <div className={styles.paginationWrapper}>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  ก่อนหน้า
                </button>
                <span className={styles.pageInfo}>
                  หน้า {currentPage} จาก {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={styles.pageBtn}
                >
                  ถัดไป
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
