"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./navbar.css";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("guest");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // State สำหรับจัดการ Popup การแบน
  const [isBanned, setIsBanned] = useState(false);
  const [banDetails, setBanDetails] = useState({ date: "", remaining: "" });

  const pathname = usePathname();
  const router = useRouter();

  // 1. ดึงข้อมูล Session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data.user) {
          setUserRole(data.user.role);
          setUserId(data.user.id);
          setUserName(data.user.email);

          if (data.user.role !== "guest") {
            fetchNotificationBadge(data.user.id, data.user.role);
            // 🔴 เรียกใช้ฟังก์ชันเช็กสถานะแบนหลังจากรู้ Role และ ID
            checkBanStatus(data.user.id, data.user.role);
          }
        } else {
          resetUserState();
        }
      } catch (error) {
        console.error("Failed to fetch session");
        resetUserState();
      }
    };

    fetchSession();
  }, [pathname]);

  const resetUserState = () => {
    setUserRole("guest");
    setUserName("");
    setUserId("");
    setUnreadCount(0);
    setIsBanned(false);
  };

  // 🔴 2. ฟังก์ชันตรวจสอบการแบน
  const checkBanStatus = async (uid: string, role: string) => {
    try {
      // ⚠️ เปลี่ยน URL API ให้ตรงกับที่คุณใช้ดึงข้อมูล Profile ของ User หรือ Company
      const apiUrl =
        role === "company"
          ? `/api/company/getCompanyById/${uid}`
          : `/api/user/getUserById/${uid}`; // สมมติชื่อ API ของฝั่ง User

      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        // ดึงฟิลด์ banned_until ออกมา (แก้ชื่อตัวแปรให้ตรงกับผลลัพธ์ของ API)
        const targetData = role === "company" ? data.company : data.user;
        const bannedUntil = targetData?.banned_until || targetData?.ban_until;

        if (bannedUntil) {
          calculateBan(bannedUntil);
        }
      }
    } catch (error) {
      console.error("Failed to check ban status:", error);
    }
  };

  // 🔴 3. คำนวณวันหมดอายุการแบน
  const calculateBan = (bannedUntil: string) => {
    const banDate = new Date(bannedUntil.replace(" ", "T"));
    const now = new Date();
    const diffMs = banDate.getTime() - now.getTime();

    if (diffMs > 0) {
      const monthNames = [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
      ];
      const formattedBanDate = `${banDate.getDate()} ${
        monthNames[banDate.getMonth()]
      } ค.ศ. ${banDate.getFullYear()} เวลา ${banDate
        .getHours()
        .toString()
        .padStart(
          2,
          "0",
        )}:${banDate.getMinutes().toString().padStart(2, "0")} น.`;

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      const dayText = days > 0 ? `${days} วัน ` : "";
      const hourText = hours > 0 ? `${hours} ชั่วโมง ` : "";
      const minText = minutes > 0 ? `${minutes} นาที` : "";

      setBanDetails({
        date: formattedBanDate,
        remaining: `(เหลือเวลาอีก ${dayText}${hourText}${minText})`,
      });
      setIsBanned(true); // เปิด Popup
    } else {
      setIsBanned(false);
    }
  };

  // ฟังก์ชัน Notification (เดิมของคุณ)
  const fetchNotificationBadge = async (uid: string, role: string) => {
    try {
      const apiUrl =
        role === "company"
          ? `/api/company/notifications?companyId=${uid}`
          : `/api/feedback/notifications?userId=${uid}`;

      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Notification pull failed", err);
    }
  };

  useEffect(() => {
    const handleRefreshNotifications = () => {
      if (userId && userRole !== "guest") {
        fetchNotificationBadge(userId, userRole);
      }
    };
    window.addEventListener("refreshNotifications", handleRefreshNotifications);
    return () => {
      window.removeEventListener(
        "refreshNotifications",
        handleRefreshNotifications,
      );
    };
  }, [userId, userRole]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const onLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await forceLogout();
    }
  };

  // 🔴 4. ฟังก์ชัน Force Logout (ใช้ตอนกดรับทราบการแบนด้วย)
  const forceLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      resetUserState();
      closeMenu();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const getDashboardRoute = () => {
    switch (userRole) {
      case "seeker":
        return "/user/user-home";
      case "company":
        return "/company/company-home";
      case "admin":
        return "/admin/home";
      default:
        return "/";
    }
  };

  const isActive = (path: string) => (pathname === path ? "active" : "");

  return (
    <>
      {/* 🔴 ส่วนแสดง Popup หากผู้ใช้ถูกแบน */}
      {isBanned && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999, // บังทับทุกอย่าง
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderTop: "6px solid #ef4444",
              borderRadius: "12px",
              padding: "30px",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>⚠️</div>
            <h2
              style={{
                color: "#b91c1c",
                margin: "0 0 15px 0",
                fontSize: "1.25rem",
              }}
            >
              บัญชีผู้ใช้นี้ถูกระงับการใช้งาน
            </h2>
            <p
              style={{
                color: "#4b5563",
                fontSize: "0.95rem",
                lineHeight: "1.5",
                marginBottom: "25px",
              }}
            >
              คุณไม่สามารถเข้าใช้งานระบบได้ในขณะนี้
              <br />
              จนกว่าจะถึงเวลา:{" "}
              <strong style={{ color: "#111" }}>{banDetails.date}</strong>
              <br />
              <span
                style={{
                  color: "#ef4444",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  display: "inline-block",
                  marginTop: "5px",
                }}
              >
                {banDetails.remaining}
              </span>
            </p>
            <button
              onClick={() => {
                setIsBanned(false);
                forceLogout(); // เตะออกจากระบบเมื่อกดรับทราบ
              }}
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                width: "100%",
                transition: "0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#dc2626")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#ef4444")
              }
            >
              รับทราบและออกจากระบบ
            </button>
          </div>
        </div>
      )}

      {/* Navbar Structure ปกติของคุณ */}
      <nav className="navbar">
        <div className="nav-container">
          {/* ... โค้ดส่วนอื่นๆ คงเดิมทั้งหมด ... */}
          <div className="brand">
            <button className="menu-icon" onClick={toggleMenu}>
              ☰
            </button>
            <Link href={getDashboardRoute()} className="logo-text">
              BIGJOBs
            </Link>
          </div>

          <div className="nav-links desktop-menu">
            {userRole === "guest" && (
              <>
                <Link href="/login" className="nav-btn-outline">
                  Login
                </Link>
                <Link href="/register" className="nav-btn-primary">
                  Sign Up
                </Link>
              </>
            )}

            {userRole === "seeker" && (
              <>
                <Link
                  href="/user/user-home"
                  className={`nav-item ${isActive("/user/user-home")}`}
                >
                  Home
                </Link>
                <Link
                  href="/user/user-feedback"
                  className={`nav-item nav-feedback-link ${isActive("/user/user-feedback")}`}
                >
                  Feedback
                  {unreadCount > 0 && (
                    <span className="shock-badge">! {unreadCount}</span>
                  )}
                </Link>
                <Link
                  href="/user/user-profile"
                  className={`nav-item ${isActive("/user/user-profile")}`}
                >
                  My Profile
                </Link>
                <button onClick={onLogout} className="nav-btn-logout">
                  Log out
                </button>
              </>
            )}

            {userRole === "company" && (
              <>
                <Link
                  href="/company/company-home"
                  className={`nav-item ${isActive("/company/company-home")}`}
                >
                  Home
                </Link>
                <Link
                  href="/company/saved_users"
                  className={`nav-item ${isActive("/company/saved_users")}`}
                >
                  Saved
                </Link>
                <Link
                  href="/company/company-feedback"
                  className={`nav-item nav-feedback-link ${isActive("/company/company-feedback")}`}
                >
                  Feedback
                  {unreadCount > 0 && (
                    <span className="shock-badge">! {unreadCount}</span>
                  )}
                </Link>
                <Link
                  href="/company/post-job"
                  className={`nav-item ${isActive("/company/post-job")}`}
                >
                  Post a Job
                </Link>
                <Link
                  href="/company/profile"
                  className={`nav-item ${isActive("/company/profile")}`}
                >
                  Profile
                </Link>
                <button onClick={onLogout} className="nav-btn-logout">
                  Log out
                </button>
              </>
            )}

            {userRole === "admin" && (
              <>
                <Link href="/admin/admin-report" className="nav-item">
                  Report
                </Link>
                <Link href="/admin/Feedbacks" className="nav-item">
                  Feedbacks
                </Link>
                <Link href="/admin/home" className="nav-item">
                  Verification
                </Link>
                <button onClick={onLogout} className="nav-btn-logout">
                  Log out
                </button>
              </>
            )}
          </div>
        </div>

        {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

        <div className={`sidebar-menu ${isMenuOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h3 className="logo-text">BIGJOBs</h3>
            <button className="close-btn" onClick={closeMenu}>
              ×
            </button>
          </div>
          <div className="sidebar-links">
            <div className="user-info">
              <span className="u-name">
                Hi {userRole}, {userName} ({userId})
              </span>
              <hr />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
