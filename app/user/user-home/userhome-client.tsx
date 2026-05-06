"use client";
import { use, useState } from "react";
import styles from "./userhome-client.module.css";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const UserHomeClient = ({ initialUser }: { initialUser: any }) => {
  const [user] = useState(initialUser);
  const [searchResult, setSearchResult] = useState<any[]>([]); // เก็บผลลัพธ์การค้นหา
  const [searchTerm, setSearchTerm] = useState(""); // เก็บสิ่งที่ User พิมพ์
  const [isSearching, setIsSearching] = useState(false); // เช็คสถานะว่ากดค้นหาหรือยัง

  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    router.refresh(); // รีเฟรชข้อมูลทุกครั้งที่เข้าหน้านี้ (ถ้ามีการเปลี่ยนแปลง Session)
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true); // ✅ set ทุกครั้ง ไม่เช็ค posts.length
      const res = await fetch(`/api/posts/getallPosts?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setPosts(data.posts || []);
      console.log("Data Received:", data);
    } catch (err) {
      console.error("Fetch error:", err);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>; // แสดงข้อความ Loading ขณะรอข้อมูล
  }

  const suggestedCompanys = [
    {
      job_title: "Quantum Software Engineer",
      companyName: "Quantum nexus",
      img: "/assets/images/suggestedCompanys.jpg",
    },
    //ลบได้เลย เอามาtest เฉยๆ 🔽
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

  const mainCompany = [
    {
      job_title: "Senior Marketing Analyst",
      companyName: "Wanvisa CO.,LTD",
      img: "/assets/images/company.jpg",
    },
    {
      job_title: "Senior Marketing Analyst",
      companyName: "Wanvisa CO.,LTiiiiiiiiiD",
      img: "/assets/images/company.jpg",
    },
  ];
  const handleSearch = () => {
    if (searchTerm.trim() === "") return; // ถ้าไม่พิมพ์อะไรเลย ไม่ต้องทำอะไร

    setIsSearching(true); // 1. สลับไปหน้า Search Result

    // 2. จำลองการค้นหาจากรายชื่อที่มีอยู่ (mainProfiles)
    const results = mainCompany.filter(
      (company) =>
        company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.job_title.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // 3. เก็บผลลัพธ์เข้า State เพื่อให้ UI แสดงผล
    setSearchResult(results);
  };

  return (
    <div className={styles.container}>
      {/* {user ? ( */}
      <>
        {" "}
        {/* ใช้ Fragment หุ้มเพราะ JSX ต้องมี root node เดียวในเงื่อนไข */}
        {/* Search Section */}
        <header className={styles.searchSection}>
          <div className={styles.searchBarWrapper}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // พิมพ์ปุ๊บ เก็บปั๊บ
              placeholder="Search Your Employee..."
              className={styles.searchInput}
            />
            <button
              className={styles.searchBtnMain}
              onClick={() => {
                if (isSearching) {
                  setIsSearching(false);
                  setSearchResult([]); // ล้างผลลัพธ์เก่าเมื่อกด Clear
                  setSearchTerm(""); // ล้างช่อง Input
                } else {
                  handleSearch();
                }
              }}
            >
              {isSearching ? "Clear Search" : "Search"}
            </button>
          </div>
          <div className={styles.filters}>
            <select>
              <option>Job Title</option>
            </select>
            <select>
              <option>Address</option>
            </select>
            <select>
              <option>Type of work</option>
            </select>
            <select>
              <option>Education</option>
            </select>
            <select>
              <option>Experience</option>
            </select>
          </div>
        </header>
        {/* Content Area */}
        <main
          className={`${styles.content} ${isSearching ? styles.searchActive : styles.suggestActive}`}
        >
          {isSearching ? (
            <div className={styles.searchActive}>
              <div className={styles.searchMiniContent}>
                <h3>Suggested Posts1</h3>
                <aside className={styles.searchingSection}>
                  {suggestedCompanys.map((company, index) => (
                    <div key={index} className={styles.searchingMiniCard}>
                      <img src={company.img} className={styles.img} />
                      <div className={styles.searchMiniCardInfo}>
                        <p>{company.job_title}</p>
                        <p>{company.companyName}</p>
                        <Link href={"company/company-home"}>
                          <button className={styles.detailsBtnSuggest}>
                            Details
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </aside>
              </div>
              <section>
                {mainCompany.length > 0 ? (
                  <div className={styles.seekersSection}>
                    {mainCompany.map((company, index) => (
                      <div key={index} className={styles.seekerCard}>
                        <div className={styles.setImg}>
                          <img src={company.img} className={styles.img} />
                        </div>

                        <div className={styles.profileDetail}>
                          <h1 className={styles.jobTitle}>
                            {company.job_title}
                          </h1>
                          <h3 className={styles.profileName}>
                            {company.companyName}
                          </h3>

                          <Link href={"company/company-home"}>
                            <button className={styles.seeInfoBtn}>
                              See Info
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.notFoundSection}>
                    <p> NOT FOUND</p>
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className={styles.suggestActive}>
              <div className={styles.suggestContent}>
                <h3>Suggested Posts2</h3>
                <div className={styles.suggestSection}>
                  {suggestedCompanys.map((company, index) => (
                    <div key={index} className={styles.suggestMiniCard}>
                      <div>
                        <img src={company.img} alt={company.companyName} />
                      </div>
                      <div className={styles.suggestMiniCardInfo}>
                        <div>
                          <p className={styles.bold}>{company.companyName}</p>
                          <p>{company.job_title}</p>
                        </div>
                        <Link href={"company/company-home"}>
                          <button className={styles.detailsBtn}>Details</button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ height: "20px" }}></div>
              <div className={styles.suggestActive}>
                <div className={styles.suggestContent}>
                  <h3>Suggested Posts4</h3>
                  <div className={styles.suggestSection}>
                    {posts.length > 0 ? (
                      posts.map((post, index) => (
                        <div key={index} className={styles.suggestMiniCard}>
                          <div>
                            <img
                              src={post.logo_image}
                              alt={post.company_name}
                            />
                          </div>
                          <div className={styles.suggestMiniCardInfo}>
                            <div>
                              <p className={styles.bold}>{post.company_name}</p>
                              <p>{post.job_position}</p>
                            </div>
                            <Link
                              href={"/user/user-detail-job/" + post.post_id}
                            >
                              <button className={styles.detailsBtn}>
                                Details
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No posts found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </>
      {/* ) : (
         <div className="mt-4 p-4 bg-red-100 rounded-lg text-red-600">
          <p>คุณยังไม่ได้เข้าสู่ระบบ หรือ Session หมดอายุ</p>
        </div>
       )} */}
    </div>
  );
};

export default UserHomeClient;
