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

  // ดึงข้อมูล Session
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

  // ฟังก์ชันตรวจสอบการแบน
  const checkBanStatus = async (uid: string, role: string) => {
    try {
      const apiUrl =
        role === "company"
          ? `/api/company/getCompanyById/${uid}`
          : `/api/user/getUserById/${uid}`;

      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
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

  // คำนวณวันหมดอายุการแบน
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
      setIsBanned(true);
    } else {
      setIsBanned(false);
    }
  };

  // Notification Badge
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
      {/* ส่วนแสดง Popup หากผู้ใช้ถูกแบน */}
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
            zIndex: 99999,
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
                forceLogout();
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

      {/* Navbar Structure */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="brand">
            <button
              className="menu-icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <Link href={getDashboardRoute()} className="logo-text">
              BIGJOBs
            </Link>
          </div>

          {/* Desktop Menu */}
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
                  href={`/user/seeker_tracking/${userId}`}
                  className={`nav-item ${isActive(`/user/seeker_tracking/${userId}`)}`}
                >
                  Tracking
                </Link>

                <Link
                  href="/user/savedCompany"
                  className={`nav-item ${isActive("/user/savedCompany")}`}
                >
                  Saved
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
                  href={`/company/company_tracking/${userId}`}
                  className={`nav-item ${isActive(`/company/company_tracking/${userId}`)}`}
                >
                  Tracking
                </Link>
                <Link
                  href="/company/savedSeeker"
                  className={`nav-item ${isActive("/company/savedSeeker")}`}
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

        {/* Backdrop overlay สำหรับปิดเมนูเมื่อแตะพื้นหลัง */}
        {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

        {/* Mobile Drawer / Sidebar */}
        <div className={`sidebar-menu ${isMenuOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h3 className="logo-text">BIGJOBs</h3>
            <button className="close-btn" onClick={closeMenu}>
              ×
            </button>
          </div>
          <div className="sidebar-links">
            {/* ข้อมูลผู้ใช้ */}
            {userRole !== "guest" && (
              <div className="user-info">
                <span className="u-name">
                  Hi {userRole}, {userName} ({userId})
                </span>
              </div>
            )}
            {/* ครอบด้วย mobile-only-links: แสดงเมนูพวกนี้เฉพาะบนมือถือเท่านั้น */}
            <div className="mobile-only-links">
              <hr className="sidebar-divider" />

              {userRole === "guest" && (
                <>
                  <Link href="/login" className="side-item" onClick={closeMenu}>
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="side-item highlight"
                    onClick={closeMenu}
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {userRole === "seeker" && (
                <>
                  <Link
                    href="/user/user-home"
                    className={`side-item ${isActive("/user/user-home")}`}
                    onClick={closeMenu}
                  >
                    Home
                  </Link>
                  <Link
                    href={`/user/seeker_tracking/${userId}`}
                    className={`side-item ${isActive(`/user/seeker_tracking/${userId}`)}`}
                    onClick={closeMenu}
                  >
                    Tracking
                  </Link>
                  <Link
                    href="/user/savedCompany"
                    className={`side-item ${isActive("/user/savedCompany")}`}
                    onClick={closeMenu}
                  >
                    Saved
                  </Link>
                  <Link
                    href="/user/user-feedback"
                    className={`side-item ${isActive("/user/user-feedback")}`}
                    onClick={closeMenu}
                  >
                    Feedback{" "}
                    {unreadCount > 0 && (
                      <span className="shock-badge">! {unreadCount}</span>
                    )}
                  </Link>
                  <Link
                    href="/user/user-profile"
                    className={`side-item ${isActive("/user/user-profile")}`}
                    onClick={closeMenu}
                  >
                    My Profile
                  </Link>
                  <button onClick={onLogout} className="side-btn-logout">
                    Log out
                  </button>
                </>
              )}

              {userRole === "company" && (
                <>
                  <Link
                    href="/company/company-home"
                    className={`side-item ${isActive("/company/company-home")}`}
                    onClick={closeMenu}
                  >
                    Home
                  </Link>
                  <Link
                    href={`/company/company_tracking/${userId}`}
                    className={`side-item ${isActive(`/company/company_tracking/${userId}`)}`}
                    onClick={closeMenu}
                  >
                    Tracking
                  </Link>
                  <Link
                    href="/company/savedSeeker"
                    className={`side-item ${isActive("/company/savedSeeker")}`}
                    onClick={closeMenu}
                  >
                    Saved
                  </Link>
                  <Link
                    href="/company/company-feedback"
                    className={`side-item ${isActive("/company/company-feedback")}`}
                    onClick={closeMenu}
                  >
                    Feedback{" "}
                    {unreadCount > 0 && (
                      <span className="shock-badge">! {unreadCount}</span>
                    )}
                  </Link>
                  <Link
                    href="/company/post-job"
                    className={`side-item ${isActive("/company/post-job")}`}
                    onClick={closeMenu}
                  >
                    Post a Job
                  </Link>
                  <Link
                    href="/company/profile"
                    className={`side-item ${isActive("/company/profile")}`}
                    onClick={closeMenu}
                  >
                    Profile
                  </Link>
                  <button onClick={onLogout} className="side-btn-logout">
                    Log out
                  </button>
                </>
              )}

              {userRole === "admin" && (
                <>
                  <Link
                    href="/admin/admin-report"
                    className={`side-item ${isActive("/admin/admin-report")}`}
                    onClick={closeMenu}
                  >
                    Report
                  </Link>
                  <Link
                    href="/admin/Feedbacks"
                    className={`side-item ${isActive("/admin/Feedbacks")}`}
                    onClick={closeMenu}
                  >
                    Feedbacks
                  </Link>
                  <Link
                    href="/admin/home"
                    className={`side-item ${isActive("/admin/home")}`}
                    onClick={closeMenu}
                  >
                    Verification
                  </Link>
                  <button onClick={onLogout} className="side-btn-logout">
                    Log out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
