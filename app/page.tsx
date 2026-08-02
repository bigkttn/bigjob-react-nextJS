// "use client";
// import { useState, useEffect, useMemo } from "react";
// import styles from "./home.module.css";
// import Link from "next/link";
// import { useRouter } from "next/navigation";

// const UserHomeClient = ({ initialUser }: { initialUser: any }) => {
//   const [user] = useState(initialUser);
//   const [posts, setPosts] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   // 1. เพิ่ม State สำหรับ Suggested Posts ฝั่ง AI/Matching
//   const [suggestedPosts, setSuggestedPosts] = useState<any[]>([]);
//   const [isSuggestLoading, setIsSuggestLoading] = useState(true);

//   // State สำหรับระบบค้นหาและ Filter
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedJobType, setSelectedJobType] = useState("");
//   const [selectedProvince, setSelectedProvince] = useState("");
//   const [selectedStatus, setSelectedStatus] = useState("");

//   // State สำหรับ Pagination
//   const [currentPage, setCurrentPage] = useState(1);
//   const postsPerPage = 12;

//   const router = useRouter();

//   useEffect(() => {
//     fetchPosts();
//     fetchSuggestedPosts(); // 2. เรียกฟังก์ชันดึง Suggested Posts
//   }, [user]);

//   const fetchPosts = async () => {
//     try {
//       setIsLoading(true);
//       const res = await fetch(`/api/posts/getallPosts?t=${Date.now()}`, {
//         cache: "no-store",
//       });
//       const data = await res.json();
//       setPosts(data.posts || []);
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setPosts([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // 3. ฟังก์ชันดึงตำแหน่งงานแนะนำจาก API AI Vector Matching
//   const fetchSuggestedPosts = async () => {
//     try {
//       setIsSuggestLoading(true);
//       // ดึง ID ของ User (รองรับทั้ง user_id หรือ id)
//       const userId = user?.user_id || user?.id || "";

//       const res = await fetch(`/api/posts/UserSuggested?userId=${userId}`);
//       const data = await res.json();

//       if (data.success) {
//         setSuggestedPosts(data.posts || []);
//       }
//     } catch (err) {
//       console.error("Fetch suggested posts error:", err);
//       setSuggestedPosts([]);
//     } finally {
//       setIsSuggestLoading(false);
//     }
//   };
//   function getTimeAgo(dateString: string | Date): string {
//     if (!dateString) return "ไม่ระบุเวลา";

//     const createdDate = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor(
//       (now.getTime() - createdDate.getTime()) / 1000,
//     );

//     if (diffInSeconds < 60) {
//       return "เมื่อสักครู่";
//     }

//     const diffInMinutes = Math.floor(diffInSeconds / 60);
//     if (diffInMinutes < 60) {
//       return `${diffInMinutes} นาทีที่แล้ว`;
//     }

//     const diffInHours = Math.floor(diffInMinutes / 60);
//     if (diffInHours < 24) {
//       return `${diffInHours} ชั่วโมงที่แล้ว`;
//     }

//     const diffInDays = Math.floor(diffInHours / 24);
//     if (diffInDays < 30) {
//       return `${diffInDays} วันที่แล้ว`;
//     }

//     const diffInMonths = Math.floor(diffInDays / 30);
//     if (diffInMonths < 12) {
//       return `${diffInMonths} เดือนที่แล้ว`;
//     }

//     const diffInYears = Math.floor(diffInDays / 365);
//     return `${diffInYears} ปีที่แล้ว`;
//   }

//   // สกัดหาตัวเลือก Dynamic สำหรับ Dropdown
//   const availableJobTypes = useMemo(() => {
//     const types = posts.map((p) => p.job_type).filter(Boolean);
//     return Array.from(new Set(types));
//   }, [posts]);

//   const availableProvinces = useMemo(() => {
//     const provinces = posts.map((p) => p.province).filter(Boolean);
//     return Array.from(new Set(provinces));
//   }, [posts]);

//   // ฟังก์ชันกรองข้อมูล (Filter Engine)
//   const filteredPosts = useMemo(() => {
//     return posts.filter((post) => {
//       const term = searchTerm.toLowerCase().trim();
//       const matchesSearch =
//         !term ||
//         post.job_position?.toLowerCase().includes(term) ||
//         post.company_name?.toLowerCase().includes(term) ||
//         post.job_description?.toLowerCase().includes(term) ||
//         post.preferred_qualifications?.toLowerCase().includes(term) ||
//         post.province?.toLowerCase().includes(term) ||
//         post.work_location?.toLowerCase().includes(term);

//       const matchesJobType =
//         !selectedJobType || post.job_type === selectedJobType;

//       const matchesProvince =
//         !selectedProvince ||
//         post.province === selectedProvince ||
//         post.work_location?.includes(selectedProvince);

//       const matchesStatus =
//         !selectedStatus ||
//         post.status?.toLowerCase() === selectedStatus.toLowerCase();

//       return (
//         matchesSearch && matchesJobType && matchesProvince && matchesStatus
//       );
//     });
//   }, [posts, searchTerm, selectedJobType, selectedProvince, selectedStatus]);

//   // คำนวณ Pagination
//   const indexOfLastPost = currentPage * postsPerPage;
//   const indexOfFirstPost = indexOfLastPost - postsPerPage;
//   const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
//   const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

//   const handleFilterChange = (setter: Function, value: string) => {
//     setter(value);
//     setCurrentPage(1);
//   };

//   const handleResetFilters = () => {
//     setSearchTerm("");
//     setSelectedJobType("");
//     setSelectedProvince("");
//     setSelectedStatus("");
//     setCurrentPage(1);
//   };

//   const handleNextPage = () => {
//     if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
//   };

//   const handlePrevPage = () => {
//     if (currentPage > 1) setCurrentPage((prev) => prev - 1);
//   };

//   const getStatusStyle = (status: string) => {
//     const s = status?.toLowerCase();
//     if (s === "open" || s === "เปิดรับสมัคร")
//       return {
//         color: "#28a745",
//         backgroundColor: "#eaffea",
//         borderColor: "#28a745",
//       };
//     if (s === "closed" || s === "ปิดรับสมัคร")
//       return {
//         color: "#dc3545",
//         backgroundColor: "#ffebeb",
//         borderColor: "#dc3545",
//       };
//     return {
//       color: "#6c757d",
//       backgroundColor: "#f8f9fa",
//       borderColor: "#6c757d",
//     };
//   };

//   const formatSalary = (min?: number, max?: number) => {
//     if (!min && !max) return "ไม่ระบุเงินเดือน";
//     if (min && !max) return `฿${min.toLocaleString()}+`;
//     if (!min && max) return `สูงสุด ฿${max.toLocaleString()}`;
//     return `฿ ${min?.toLocaleString()} - ฿ ${max?.toLocaleString()}`;
//   };

//   if (isLoading) {
//     return (
//       <div className={styles.skeletonWrapper}>
//         <header className={styles.searchSection}>
//           <div className={styles.searchBarWrapper}>
//             <div
//               className={styles.skeletonBlock}
//               style={{ width: "50%", height: "42px", borderRadius: "21px" }}
//             />
//           </div>
//         </header>
//         <div className={styles.mainLayout}>
//           <div className={styles.leftSidebar}>
//             <div
//               className={styles.skeletonBlock}
//               style={{ width: "100%", height: "400px", borderRadius: "15px" }}
//             />
//           </div>
//           <div className={styles.rightContent}>
//             <div
//               className={styles.skeletonBlock}
//               style={{ width: "100%", height: "600px", borderRadius: "15px" }}
//             />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={styles.container}>
//       {/* Header Search & Filters */}
//       <header className={styles.searchSection}>
//         <div className={styles.searchBarWrapper}>
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
//             placeholder="ค้นหาตำแหน่งงาน, ชื่อบริษัท, ทักษะ หรือสถานที่..."
//             className={styles.searchInput}
//           />
//         </div>

//         {/* Dynamic Filters */}
//         <div className={styles.filters}>
//           <select
//             value={selectedJobType}
//             onChange={(e) =>
//               handleFilterChange(setSelectedJobType, e.target.value)
//             }
//           >
//             <option value="">ประเภทงานทั้งหมด</option>
//             {availableJobTypes.map((type, i) => (
//               <option key={i} value={type}>
//                 {type}
//               </option>
//             ))}
//           </select>

//           <select
//             value={selectedProvince}
//             onChange={(e) =>
//               handleFilterChange(setSelectedProvince, e.target.value)
//             }
//           >
//             <option value="">ทุกจังหวัด / สถานที่</option>
//             {availableProvinces.map((prov, i) => (
//               <option key={i} value={prov}>
//                 {prov}
//               </option>
//             ))}
//           </select>

//           <select
//             value={selectedStatus}
//             onChange={(e) =>
//               handleFilterChange(setSelectedStatus, e.target.value)
//             }
//           >
//             <option value="">ทุกสถานะ</option>
//             <option value="Open">Open (เปิดรับ)</option>
//             <option value="Closed">Closed (ปิดรับ)</option>
//           </select>

//           {(searchTerm ||
//             selectedJobType ||
//             selectedProvince ||
//             selectedStatus) && (
//             <button className={styles.resetBtn} onClick={handleResetFilters}>
//               Clear Filters
//             </button>
//           )}
//         </div>
//       </header>

//       {/* Main Layout 30% / 70% */}
//       <div className={styles.mainLayout}>
//         {/* ===== ฝั่งซ้าย 30%: Suggested Posts ===== */}
//         <aside className={styles.leftSidebar}>
//           <div className={styles.suggestContent}>
//             <h3>Suggested Posts</h3>
//             <div className={styles.verticalList}>
//               {isSuggestLoading ? (
//                 <p className={styles.subText}>
//                   กำลังประมวลผลตำแหน่งงานแนะนำ...
//                 </p>
//               ) : suggestedPosts.length > 0 ? (
//                 suggestedPosts.map((post) => (
//                   <div key={post.post_id} className={styles.suggestMiniCard}>
//                     <img
//                       src={
//                         post.logo_image || "/assets/images/default-company.png"
//                       }
//                       alt={post.company_name}
//                       className={styles.cardImg}
//                     />
//                     <div className={styles.suggestMiniCardInfo}>
//                       <div>
//                         <div className={styles.cardHeader}>
//                           <p className={styles.bold}>{post.company_name}</p>
//                           <span
//                             className={styles.statusBadge}
//                             style={getStatusStyle(post.status)}
//                           >
//                             {post.status || "ไม่ระบุ"}
//                           </span>
//                         </div>
//                         <p className={styles.subText}>{post.job_position}</p>
//                         <p className={styles.subText}>
//                           {post.province || "ไม่ระบุสถานที่"}
//                         </p>
//                         <p className={styles.subText}>
//                           {post.job_type || "ไม่ระบุประเภท"}
//                         </p>
//                         <p className={styles.subText}>
//                           {formatSalary(post.salary_min, post.salary_max)}
//                         </p>
//                       </div>
//                       {/* แสดงเวลาที่โพสต์ล่าสุดที่มุมล่างซ้าย */}
//                       <p className={styles.subText}>
//                         {getTimeAgo(post.created_at)}
//                       </p>
//                       <Link
//                         href={`/user/user-detail-job/${post.post_id}`}
//                         className={styles.btnWrapper}
//                       >
//                         <button className={styles.detailsBtn}>Details</button>
//                       </Link>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <p className={styles.subText}>ไม่มีตำแหน่งงานแนะนำ</p>
//               )}
//             </div>
//           </div>
//         </aside>

//         {/* ===== ฝั่งขวา 70%: Search Results ===== */}
//         <main className={styles.rightContent}>
//           <div className={styles.suggestContent}>
//             <div className={styles.headerTitleRow}>
//               <h3>
//                 {searchTerm ||
//                 selectedJobType ||
//                 selectedProvince ||
//                 selectedStatus
//                   ? `ผลการค้นหา (${filteredPosts.length} รายการ)`
//                   : "Latest Job Openings"}
//               </h3>
//             </div>

//             <div className={styles.suggestGrid}>
//               {currentPosts.length > 0 ? (
//                 currentPosts.map((post) => (
//                   <div key={post.post_id} className={styles.suggestMiniCard}>
//                     <img
//                       src={
//                         post.logo_image || "/assets/images/default-company.png"
//                       }
//                       alt={post.company_name}
//                       className={styles.cardImg}
//                     />
//                     <div className={styles.suggestMiniCardInfo}>
//                       <div>
//                         <div className={styles.cardHeader}>
//                           <p className={styles.bold}>{post.company_name}</p>
//                           <span
//                             className={styles.statusBadge}
//                             style={getStatusStyle(post.status)}
//                           >
//                             {post.status || "ไม่ระบุ"}
//                           </span>
//                         </div>
//                         <p className={styles.jobPositionText}>
//                           {post.job_position}
//                         </p>
//                         <p className={styles.subText}>
//                           {post.province || "ไม่ระบุสถานที่"}
//                         </p>
//                         <p className={styles.subText}>
//                           {post.job_type || "ไม่ระบุประเภท"}
//                         </p>
//                         <p className={styles.subText}>
//                           {formatSalary(post.salary_min, post.salary_max)}
//                         </p>
//                       </div>
//                       {/* แสดงเวลาที่โพสต์ล่าสุดที่มุมล่างซ้าย */}
//                       <p className={styles.subText}>
//                         {getTimeAgo(post.created_at)}
//                       </p>
//                       <Link
//                         href={"/user/user-detail-job/" + post.post_id}
//                         className={styles.btnWrapper}
//                       >
//                         <button className={styles.detailsBtn}>Details</button>
//                       </Link>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <p className={styles.noData}>ไม่พบประกาศงานที่ตรงกับการค้นหา</p>
//               )}
//             </div>

//             {/* Pagination Controls */}
//             {filteredPosts.length > postsPerPage && (
//               <div className={styles.paginationWrapper}>
//                 <button
//                   onClick={handlePrevPage}
//                   disabled={currentPage === 1}
//                   className={styles.pageBtn}
//                 >
//                   Previous
//                 </button>
//                 <span className={styles.pageInfo}>
//                   Page {currentPage} of {totalPages}
//                 </span>
//                 <button
//                   onClick={handleNextPage}
//                   disabled={currentPage === totalPages}
//                   className={styles.pageBtn}
//                 >
//                   Next
//                 </button>
//               </div>
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default UserHomeClient;
// app/page.tsx
const UserHomeClient = (await import("./user/user-home/page")).default as any;

export default async function HomePage() {
  // ดึงข้อมูล User ฝั่ง Server
  const user = null;

  return (
    <main>
      <UserHomeClient initialUser={user} />
    </main>
  );
}
