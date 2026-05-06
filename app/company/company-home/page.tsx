"use client";
import { useState } from "react";
import styles from "./companyhome.module.css";
import Link from "next/link";
import router from "next/router";

const CompanyHome = ({ initialUser }: { initialUser: any }) => {
  const [user] = useState(initialUser);
  const [searchResult, setSearchResult] = useState<any[]>([]); // เก็บผลลัพธ์การค้นหา
  const [searchTerm, setSearchTerm] = useState(""); // เก็บสิ่งที่ User พิมพ์
  const [isSearching, setIsSearching] = useState(false); // เช็คสถานะว่ากดค้นหาหรือยัง

  const suggestedSeekers = [
    {
      name: "Xavi Hernández",
      job_title: "Head Coach",
      img: "/assets/images/employee.jpg",
    },

    //ลบได้เลย เอามาtest เฉยๆ
    {
      name: "Xavi Hernández",
      job_title:
        "Head Coachssssssssssssssssssssssssfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffsssssssssssssss",
      img: "/assets/images/employee.jpg",
    },
    {
      name: "Xavi Hernández",
      job_title: "Head Coach",
      img: "/assets/images/employee.jpg",
    },
    {
      name: "Xavi Hernández",
      job_title:
        "Head Coachssssssssssssssssssssssssfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffsssssssssssssss",
      img: "/assets/images/employee.jpg",
    },
    {
      name: "Xavi Hernández",
      job_title: "Head Coach",
      img: "/assets/images/employee.jpg",
    },
    {
      name: "Xavi Hernández",
      job_title:
        "Head Coachssssssssssssssssssssssssfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffsssssssssssssss",
      img: "/assets/images/employee.jpg",
    },
    {
      name: "Xavi Hernández",
      job_title: "Head Coach",
      img: "/assets/images/employee.jpg",
    },
    {
      name: "Xavi Hernández",
      job_title:
        "Head Coachssssssssssssssssssssssssfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffsssssssssssssss",
      img: "/assets/images/employee.jpg",
    },
    {
      name: "Xavi Hernández",
      job_title: "Head Coach",
      img: "/assets/images/employee.jpg",
    },
  ];
  const mainProfiles = [
    {
      name: "Veerasak Siriphok",
      job_title: "Senior Marketing Analyst",
      age: "28",
      gender: "Male",
      military: "N/A",
      birth: "15 May 1998",
      nationality: "Thai",
      religion: "Buddhism",
      weight: "52 Kg.",
      height: "185 cm.",
      img: "/assets/images/seeker.jpg",
    },
    {
      name: "Veerasak Siriphok",
      job_title: "Senior Marketing AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnalyst",
      age: "28",
      gender: "Male",
      military: "N/A",
      birth: "15 May 1998",
      nationality: "Thai",
      religion: "Buddhism",
      weight: "52 Kg.",
      height: "185 cm.",
      img: "/assets/images/seeker.jpg",
    },
  ];

  const [age, setAge] = useState(20);
  const [showBadge, setShowBadge] = useState(false); // แสดงผลของ Tooltip (เลขแสดงอายุ Age Range)

  const min = 20;
  const max = 60;

  // ฟังก์ชันคำนวณตำแหน่ง % เพื่อให้เลขวิ่งตามหัว Slider
  const getLeftPos = () => {
    return ((age - min) / (max - min)) * 100; // คำนวณเปอร์เซ็นต์ของค่าปัจจุบันเทียบกับช่วง min-max
  };
  const handleSearch = () => {
    if (searchTerm.trim() === "") return; // ถ้าไม่พิมพ์อะไรเลย ไม่ต้องทำอะไร

    setIsSearching(true); // 1. สลับไปหน้า Search Result

    // 2. จำลองการค้นหาจากรายชื่อที่มีอยู่ (mainProfiles)
    const results = mainProfiles.filter(
      (profile) =>
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.job_title.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // 3. เก็บผลลัพธ์เข้า State เพื่อให้ UI แสดงผล
    setSearchResult(results);
  };

  return (
    <div className={styles.container}>
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

          <div className={styles.ageRangeContainer}>
            <label>Age Range</label>
            <div className={styles.sliderWrapper}>
              {/* ตัวเลข Popup */}
              <span
                className={`${styles.ageBadge} ${showBadge ? styles.visible : styles.hidden}`}
                style={{ left: `${((age - min) / (max - min)) * 40}%` }}
              >
                {age}
              </span>

              <input
                type="range"
                min={min}
                max={max}
                value={age} // ผูกค่า input กับ State age
                // เมื่อมีการเปลี่ยนแปลงค่า (เลื่อน Slider)
                onChange={(e) => {
                  setAge(parseInt(e.target.value)); // อัปเดต State age
                  setShowBadge(true); // มั่นใจว่าโชว์ Badge ขณะลาก (สำคัญสำหรับมือถือ)
                }}
                // เพิ่ม Event Handlers สำหรับซ่อน/แสดงเมื่อเมาส์เข้า-ออก
                onMouseEnter={() => setShowBadge(true)} // เมาส์วาง -> แสดง
                onMouseLeave={() => setShowBadge(false)} // เมาส์ออก -> ซ่อน
                onMouseDown={() => setShowBadge(true)} // คลิก/กด -> แสดง
                onMouseUp={() => setShowBadge(false)} // ปล่อยคลิก -> ซ่อน
                className={styles.rangeInput}
              />

              <div className={styles.rangeMinMax}>
                <span>{min}</span> {/* ใช้ตัวแปร min */}
                <span>{max}</span> {/* ใช้ตัวแปร max */}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main
        className={`${styles.content} ${isSearching ? styles.searchActive : styles.suggestActive}`}
      >
        {isSearching ? (
          <div className={styles.searchActive}>
            <div className={styles.searchMiniContent}>
              <h3>Suggested Seekers</h3>
              <aside className={styles.searchingSection}>
                {suggestedSeekers.map((seeker, index) => (
                  <div key={index} className={styles.searchingMiniCard}>
                    <img src={seeker.img} className={styles.img} />
                    <div className={styles.searchMiniCardInfo}>
                      <p>{seeker.job_title}</p>
                      <p>{seeker.name}</p>
                      <Link href={"/user/seeker-profile"}>
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
              {searchResult.length > 0 ? (
                <div className={styles.seekersSection}>
                  {searchResult.map((profile, index) => (
                    <div key={index} className={styles.seekerCard}>
                      <img src={profile.img} className={styles.img} />
                      <div className={styles.profileDetail}>
                        <h1 className={styles.jobTitle}>{profile.job_title}</h1>
                        <h3 className={styles.profileName}>{profile.name}</h3>
                        <p>Gender: {profile.gender}</p>
                        <p>Age: {profile.age}</p>
                        <p>Military Status: {profile.military}</p>
                        <p>Date of Birth: {profile.birth}</p>
                        <p>Nationality: {profile.nationality}</p>
                        <p>Religion: {profile.religion}</p>
                        <p>Weight: {profile.weight}</p>
                        <p>Height: {profile.height}</p>

                        <Link href={"/user/seeker-profile"}>
                          <button className={styles.seeInfoBtn}>
                            See Info
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p> NOT FOUND</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className={styles.suggestActive}>
            <div className={styles.suggestContent}>
              <h3>Suggested Seekers</h3>
              <div className={styles.suggestSection}>
                {suggestedSeekers.map((seeker, index) => (
                  <div key={index} className={styles.suggestMiniCard}>
                    <div>
                      <img src={seeker.img} alt={seeker.name} />
                    </div>
                    <div className={styles.suggestMiniCardInfo}>
                      <div>
                        <p className={styles.bold}>{seeker.name}</p>
                        <p>{seeker.job_title}</p>
                      </div>
                      <Link href={"/user/seeker-profile"}>
                        <button className={styles.detailsBtn}>Details</button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CompanyHome;
