"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BanPopup from "./BanPopup";
import InterviewSchedule from "./InterviewSchedule";
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

  function resetUserState() {
    setUserRole("guest");
    setUserName("");
    setUserId("");
    setUnreadCount(0);
    setIsBanned(false);
  }

  // ฟังก์ชันตรวจสอบการแบน
  async function checkBanStatus(uid: string, role: string) {
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
  }

  // คำนวณวันหมดอายุการแบน
  function calculateBan(bannedUntil: string) {
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
  }

  // Notification Badge
  async function fetchNotificationBadge(uid: string, role: string) {
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
  }

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

  const renderLinks = (isMobile: boolean) => {
    const itemClass = isMobile ? "side-item" : "nav-item";
    const logoutClass = isMobile ? "side-btn-logout" : "nav-btn-logout";
    const onLinkClick = isMobile ? closeMenu : undefined;

    return (
      <>
        {userRole === "guest" && (
          <>
            <Link
              href="/login"
              className={isMobile ? "side-item" : "nav-btn-outline"}
              onClick={onLinkClick}
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className={isMobile ? "side-item highlight" : "nav-btn-primary"}
              onClick={onLinkClick}
            >
              สมัครสมาชิก
            </Link>
          </>
        )}

        {userRole === "seeker" && (
          <>
            <Link
              href="/user/user-home"
              className={`${itemClass} ${isActive("/user/user-home")}`}
              onClick={onLinkClick}
            >
              หน้าแรก
            </Link>
            <Link
              href={`/user/seeker_tracking/${userId}`}
              className={`${itemClass} ${isActive(`/user/seeker_tracking/${userId}`)}`}
              onClick={onLinkClick}
            >
              ติดตามสถานะ
            </Link>
            <Link
              href="/user/savedCompany"
              className={`${itemClass} ${isActive("/user/savedCompany")}`}
              onClick={onLinkClick}
            >
              ที่บันทึกไว้
            </Link>
            <Link
              href="/user/user-feedback"
              className={`${itemClass} ${isActive("/user/user-feedback")} nav-feedback-link`}
              onClick={onLinkClick}
            >
              ข้อเสนอแนะ
              {unreadCount > 0 && (
                <span className="shock-badge">! {unreadCount}</span>
              )}
            </Link>
            <Link
              href="/user/user-profile"
              className={`${itemClass} ${isActive("/user/user-profile")}`}
              onClick={onLinkClick}
            >
              โปรไฟล์
            </Link>
            <button onClick={onLogout} className={logoutClass}>
              ออกจากระบบ
            </button>
          </>
        )}

        {userRole === "company" && (
          <>
            <Link
              href="/company/company-home"
              className={`${itemClass} ${isActive("/company/company-home")}`}
              onClick={onLinkClick}
            >
              หน้าแรก
            </Link>
            <Link
              href={`/company/company_tracking/${userId}`}
              className={`${itemClass} ${isActive(`/company/company_tracking/${userId}`)}`}
              onClick={onLinkClick}
            >
              ติดตามสถานะ
            </Link>
            <Link
              href="/company/savedSeeker"
              className={`${itemClass} ${isActive("/company/savedSeeker")}`}
              onClick={onLinkClick}
            >
              ที่บันทึกไว้
            </Link>
            <Link
              href="/company/company-feedback"
              className={`${itemClass} ${isActive("/company/company-feedback")} nav-feedback-link`}
              onClick={onLinkClick}
            >
              ข้อเสนอแนะ
              {unreadCount > 0 && (
                <span className="shock-badge">! {unreadCount}</span>
              )}
            </Link>
            <Link
              href="/company/post-job"
              className={`${itemClass} ${isActive("/company/post-job")}`}
              onClick={onLinkClick}
            >
              ลงประกาศงาน
            </Link>
            <Link
              href="/company/profile"
              className={`${itemClass} ${isActive("/company/profile")}`}
              onClick={onLinkClick}
            >
              โปรไฟล์
            </Link>
            <button onClick={onLogout} className={logoutClass}>
              ออกจากระบบ
            </button>
          </>
        )}

        {userRole === "admin" && (
          <>
            <Link
              href="/admin/admin-report"
              className={`${itemClass} ${isActive("/admin/admin-report")}`}
              onClick={onLinkClick}
            >
              รายงาน
            </Link>
            <Link
              href="/admin/Feedbacks"
              className={`${itemClass} ${isActive("/admin/Feedbacks")}`}
              onClick={onLinkClick}
            >
              ข้อเสนอแนะ
            </Link>
            <Link
              href="/admin/home"
              className={`${itemClass} ${isActive("/admin/home")}`}
              onClick={onLinkClick}
            >
              ยืนยันตัวตน
            </Link>
            <button onClick={onLogout} className={logoutClass}>
              ออกจากระบบ
            </button>
          </>
        )}
      </>
    );
  };

  return (
    <>
      {/* ส่วนแสดง Popup หากผู้ใช้ถูกแบน */}
      {isBanned && (
        <BanPopup
          banDetails={banDetails}
          onAcknowledge={() => {
            setIsBanned(false);
            forceLogout();
          }}
        />
      )}

      {/* Backdrop overlay สำหรับปิดเมนูเมื่อแตะพื้นหลัง */}
      {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

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
          <div className="nav-links desktop-menu">{renderLinks(false)}</div>
        </div>

        {/* Mobile Drawer / Sidebar */}
        <div className={`sidebar-menu ${isMenuOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h3 className="logo-text">BIGJOBs</h3>
            <button className="close-btn" onClick={closeMenu}>
              ×
            </button>
          </div>
          <div className="sidebar-links">
            <InterviewSchedule
              isMenuOpen={isMenuOpen}
              userId={userId}
              userRole={userRole}
              closeMenu={closeMenu}
            />

            <div className="mobile-only-links">
              <hr className="sidebar-divider" />
              {renderLinks(true)}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
