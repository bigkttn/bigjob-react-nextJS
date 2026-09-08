"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./companyhome.module.css";
import Link from "next/link";
import { EDUCATION_LEVELS } from "@/lib/educationLevels";
import ProvinceSelect from "./province";

const WORK_TYPES = [
  "Full-time",
  "Freelance",
  "Part-time",
  "Internship",
  "Contract",
];

const CompanyHomeClient = ({ initialUser }: { initialUser: any }) => {
  const [company] = useState(initialUser);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const [suggestedSeekers, setSuggestedSeekers] = useState<any[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // State Filters
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedWorkType, setSelectedWorkType] = useState("");
  const [selectedEducation, setSelectedEducation] = useState("");

  const MIN_POSSIBLE_AGE = 18;
  const MAX_POSSIBLE_AGE = 60;
  const [minAge, setMinAge] = useState<number>(20);
  const [maxAge, setMaxAge] = useState<number>(60);

  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 12;

  useEffect(() => {
    fetchSuggestedSeekers();
  }, [company]);

  const performHybridSearch = useCallback(
    async (query: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setIsSearching(true);
        const queryParams = new URLSearchParams({
          q: query,
          province: selectedProvince,
          work_type: selectedWorkType,
          education: selectedEducation,
          minAge: minAge.toString(),
          maxAge: maxAge.toString(),
          sort: sortBy,
        });

        const res = await fetch(
          `/api/posts/company-search-user?${queryParams.toString()}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (data.success) {
          setUsers(data.users || []);
        }
      } catch (err: any) {
        if (err.name !== "AbortError")
          console.error("Hybrid Search Error:", err);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    },
    [
      selectedProvince,
      selectedWorkType,
      selectedEducation,
      minAge,
      maxAge,
      sortBy,
    ],
  );

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        province: selectedProvince,
        work_type: selectedWorkType,
        education: selectedEducation,
        minAge: minAge.toString(),
        maxAge: maxAge.toString(),
        sort: sortBy,
        t: Date.now().toString(),
      });

      const res = await fetch(
        `/api/user/getUserAndJobtitle?${queryParams.toString()}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedProvince,
    selectedWorkType,
    selectedEducation,
    minAge,
    maxAge,
    sortBy,
  ]);

  useEffect(() => {
    if (searchTerm.trim()) {
      performHybridSearch(searchTerm.trim());
    } else {
      fetchUsers();
    }
  }, [searchTerm, fetchUsers, performHybridSearch]);

  const fetchSuggestedSeekers = async () => {
    try {
      setIsSuggestLoading(true);
      const companyId = company?.company_id || company?.id || "";
      const res = await fetch(
        `/api/posts/CompanySuggested?companyId=${companyId}`,
      );
      const data = await res.json();
      if (data.success) setSuggestedSeekers(data.users || []);
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

    if (isNaN(createdDate.getTime())) return "ไม่ระบุเวลา";

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

    // เพิ่มการคำนวณระดับเดือน
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} เดือนที่แล้ว`;

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ปีที่แล้ว`;
  }

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const handleFilterChange = <T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: T,
  ) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleMinAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxAge - 1);
    handleFilterChange(setMinAge, value);
  };

  const handleMaxAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minAge + 1);
    handleFilterChange(setMaxAge, value);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setSelectedProvince("");
    setSelectedWorkType("");
    setSelectedEducation("");
    setMinAge(20);
    setMaxAge(60);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const isFilterActive =
    searchTerm ||
    selectedProvince ||
    selectedWorkType ||
    selectedEducation ||
    minAge !== 20 ||
    maxAge !== 60 ||
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
            placeholder="ค้นหาชื่อผู้สมัคร, ตำแหน่งงานที่สนใจ หรือจังหวัด (รองรับ AI Semantic Search)..."
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
            value={selectedWorkType}
            onChange={(e) =>
              handleFilterChange(setSelectedWorkType, e.target.value)
            }
          >
            <option value="">รูปแบบการทำงานทั้งหมด</option>
            {WORK_TYPES.map((type, i) => (
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
            value={selectedEducation}
            onChange={(e) =>
              handleFilterChange(setSelectedEducation, e.target.value)
            }
          >
            <option value="">ระดับการศึกษาทั้งหมด</option>
            {EDUCATION_LEVELS.map((edu, i) => (
              <option key={i} value={edu}>
                {edu}
              </option>
            ))}
          </select>

          <div className={styles.ageFilterBox}>
            <span className={styles.ageLabel}>Age Range</span>
            <div className={styles.sliderContainer}>
              <div
                className={styles.sliderTrack}
                style={{
                  left: `${((minAge - MIN_POSSIBLE_AGE) / (MAX_POSSIBLE_AGE - MIN_POSSIBLE_AGE)) * 100}%`,
                  right: `${100 - ((maxAge - MIN_POSSIBLE_AGE) / (MAX_POSSIBLE_AGE - MIN_POSSIBLE_AGE)) * 100}%`,
                }}
              />
              <input
                type="range"
                min={MIN_POSSIBLE_AGE}
                max={MAX_POSSIBLE_AGE}
                value={minAge}
                onChange={handleMinAgeChange}
                className={styles.rangeInput}
              />
              <input
                type="range"
                min={MIN_POSSIBLE_AGE}
                max={MAX_POSSIBLE_AGE}
                value={maxAge}
                onChange={handleMaxAgeChange}
                className={styles.rangeInput}
              />
            </div>
            <div className={styles.ageValues}>
              <span>{minAge}</span>
              <span>{maxAge}</span>
            </div>
          </div>

          <select
            value={sortBy}
            onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
          >
            <option value="newest">เรียงตาม: สมัครล่าสุด</option>
            <option value="oldest">เรียงตาม: สมัครเก่าสุด</option>
          </select>

          {isFilterActive && (
            <button className={styles.resetBtn} onClick={handleResetFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </header>

      <div className={styles.mainLayout}>
        <aside className={styles.leftSidebar}>
          <div className={styles.suggestContent}>
            <h3>Suggested Seekers</h3>
            <div className={styles.verticalList}>
              {isSuggestLoading ? (
                <p className={styles.subText}>
                  กำลังประมวลผลผู้สมัครที่แนะนำ...
                </p>
              ) : suggestedSeekers.length > 0 ? (
                suggestedSeekers.map((seeker, index) => (
                  <div
                    key={`suggested-${seeker.uid}-${index}`}
                    className={styles.suggestMiniCard}
                  >
                    <img
                      src={
                        seeker.profile_image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          seeker.fullname || "User",
                        )}&background=random`
                      }
                      alt={seeker.fullname}
                      className={styles.cardImg}
                    />
                    <div className={styles.suggestMiniCardInfo}>
                      <div>
                        <div className={styles.cardHeader}>
                          <p className={styles.bold}>{seeker.fullname}</p>
                        </div>
                        <p className={styles.jobPositionText}>
                          {seeker.job_name || "ไม่ระบุตำแหน่งที่สนใจ"}
                        </p>
                        <p className={styles.subText}>
                          {seeker.province || "ไม่ระบุจังหวัด"}
                        </p>
                      </div>
                      <Link
                        href={`/company/seeker-profile/${seeker.uid}`}
                        className={styles.btnWrapper}
                      >
                        <button className={styles.detailsBtn}>Details</button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.subText}>ไม่มีผู้สมัครที่แนะนำ</p>
              )}
            </div>
          </div>
        </aside>

        <main className={styles.rightContent}>
          <div className={styles.suggestContent}>
            <div className={styles.headerTitleRow}>
              <h3>
                {isFilterActive
                  ? `ผลการค้นหา (${users.length} รายการ)`
                  : "ผู้สมัครงานทั้งหมด"}
              </h3>
            </div>

            <div className={styles.suggestGrid}>
              {isSearching ? (
                <p className={styles.subText}>กำลังค้นหาด้วย AI...</p>
              ) : currentUsers.length > 0 ? (
                currentUsers.map((u, index) => (
                  <div
                    key={`user-${u.uid}-${index}`}
                    className={styles.suggestMiniCard}
                  >
                    <img
                      src={
                        u.profile_image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          u.fullname || "User",
                        )}&background=random`
                      }
                      alt={u.fullname}
                      className={styles.cardImg}
                    />
                    <div className={styles.suggestMiniCardInfo}>
                      <div>
                        <div className={styles.cardHeader}>
                          <p className={styles.bold}>{u.fullname}</p>
                        </div>
                        <p className={styles.jobPositionText}>
                          {u.job_name || "ไม่ระบุตำแหน่งที่สนใจ"}
                        </p>
                        <p className={styles.subText}>
                          {u.province || "ไม่ระบุจังหวัด"}
                        </p>
                      </div>
                      <p className={styles.subText}>
                        {getTimeAgo(u.created_at)}
                      </p>
                      <Link
                        href={`/company/seeker-profile/${u.uid}`}
                        className={styles.btnWrapper}
                      >
                        <button className={styles.detailsBtn}>Details</button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.noData}>ไม่พบผู้สมัครที่ตรงกับการค้นหา</p>
              )}
            </div>

            {users.length > usersPerPage && (
              <div className={styles.paginationWrapper}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
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

export default CompanyHomeClient;
