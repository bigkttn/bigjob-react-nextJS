"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./companyhome.module.css";
import Link from "next/link";
import { EDUCATION_LEVELS } from "@/lib/educationLevels";
import ProvinceSelect from "./province"; // 👈 เพิ่มการนำเข้า ProvinceSelect

// ตัวเลือกรูปแบบการทำงานแบบ Fixed
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

  // Suggested seekers
  const [suggestedSeekers, setSuggestedSeekers] = useState<any[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(true);

  // State สำหรับ Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobName, setSelectedJobName] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedWorkType, setSelectedWorkType] = useState("");
  const [selectedEducation, setSelectedEducation] = useState("");

  // State สำหรับ Age Range Slider
  const MIN_POSSIBLE_AGE = 18;
  const MAX_POSSIBLE_AGE = 60;
  const [minAge, setMinAge] = useState<number>(20);
  const [maxAge, setMaxAge] = useState<number>(60);

  // Filter เรียงลำดับเวลา
  const [sortBy, setSortBy] = useState("newest");

  // State สำหรับ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 12;

  useEffect(() => {
    fetchUsers();
    fetchSuggestedSeekers();
  }, [company]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/user/getUserAndJobtitle?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestedSeekers = async () => {
    try {
      setIsSuggestLoading(true);
      const companyId = company?.company_id || company?.id || "";
      const res = await fetch(
        `/api/posts/CompanySuggested?companyId=${companyId}`,
      );
      const data = await res.json();
      if (data.success) {
        setSuggestedSeekers(data.users || []);
      }
    } catch (err) {
      console.error("Fetch suggested seekers error:", err);
      setSuggestedSeekers([]);
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

  // Dynamic Options
  const availableJobNames = useMemo(() => {
    const names = users.map((u) => u.job_name).filter(Boolean);
    return Array.from(new Set(names));
  }, [users]);

  // ฟังก์ชันกรองข้อมูล
  const filteredUsers = useMemo(() => {
    const filtered = users.filter((u) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        u.fullname?.toLowerCase().includes(term) ||
        u.job_name?.toLowerCase().includes(term) ||
        u.province?.toLowerCase().includes(term);

      const matchesJobName = !selectedJobName || u.job_name === selectedJobName;
      const matchesProvince =
        !selectedProvince || u.province === selectedProvince;

      const userWorkType = (u.type_of_work || u.work_type || "").toString();
      const matchesWorkType =
        !selectedWorkType ||
        userWorkType.toLowerCase().includes(selectedWorkType.toLowerCase());

      const userEduLevels = u.education_levels
        ? u.education_levels.split(",").map((item: string) => item.trim())
        : [];
      const matchesEducation =
        !selectedEducation || userEduLevels.includes(selectedEducation);

      const userAge = Number(u.age);
      const matchesAge = !u.age || (userAge >= minAge && userAge <= maxAge);

      return (
        matchesSearch &&
        matchesJobName &&
        matchesProvince &&
        matchesWorkType &&
        matchesEducation &&
        matchesAge
      );
    });

    return filtered.sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
    });
  }, [
    users,
    searchTerm,
    selectedJobName,
    selectedProvince,
    selectedWorkType,
    selectedEducation,
    minAge,
    maxAge,
    sortBy,
  ]);

  // Pagination Logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleFilterChange = (setter: Function, value: any) => {
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
    setSearchTerm("");
    setSelectedJobName("");
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
    selectedJobName ||
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
            value={searchTerm}
            onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
            placeholder="ค้นหาชื่อผู้สมัคร, ตำแหน่งงานที่สนใจ หรือจังหวัด..."
            className={styles.searchInput}
          />
        </div>

        {/* Dynamic Filters */}
        <div className={styles.filters}>
          {/*  ใช้งาน ProvinceSelect แบบค้นหาได้ พร้อมตัวเลือก "ทุกจังหวัด" */}
          <ProvinceSelect
            value={selectedProvince}
            onChange={(val) => handleFilterChange(setSelectedProvince, val)}
          />

          {/* ตัวเลือกรูปแบบการทำงาน */}
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

          {/* Age Range Slider Box */}
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

      {/* Main Layout 30% / 70% */}
      <div className={styles.mainLayout}>
        {/* ===== ฝั่งซ้าย 30%: Suggested Seekers ===== */}
        <aside className={styles.leftSidebar}>
          <div className={styles.suggestContent}>
            <h3>Suggested Seekers</h3>
            <div className={styles.verticalList}>
              {isSuggestLoading ? (
                <p className={styles.subText}>
                  กำลังประมวลผลผู้สมัครที่แนะนำ...
                </p>
              ) : suggestedSeekers.length > 0 ? (
                suggestedSeekers.map((seeker) => (
                  <div key={seeker.uid} className={styles.suggestMiniCard}>
                    <img
                      src={
                        seeker.profile_image ||
                        "/assets/images/default-profile.png"
                      }
                      alt={seeker.fullname}
                      className={styles.cardImg}
                    />
                    <div className={styles.suggestMiniCardInfo}>
                      <div>
                        <div className={styles.cardHeader}>
                          <p className={styles.bold}>{seeker.fullname}</p>
                          {typeof seeker.similarityScore === "number" && (
                            <span className={styles.matchBadge}>
                              {Math.round(seeker.similarityScore * 100)}% Match
                            </span>
                          )}
                        </div>
                        <p className={styles.subText}>
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

        {/* ===== ฝั่งขวา 70%: ผู้สมัครงานทั้งหมด ===== */}
        <main className={styles.rightContent}>
          <div className={styles.suggestContent}>
            <div className={styles.headerTitleRow}>
              <h3>
                {isFilterActive
                  ? `ผลการค้นหา (${filteredUsers.length} รายการ)`
                  : "ผู้สมัครงานทั้งหมด"}
              </h3>
            </div>

            <div className={styles.suggestGrid}>
              {currentUsers.length > 0 ? (
                currentUsers.map((u) => (
                  <div key={u.uid} className={styles.suggestMiniCard}>
                    <img
                      src={
                        u.profile_image || "/assets/images/default-profile.png"
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

            {/* Pagination Controls */}
            {filteredUsers.length > usersPerPage && (
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
