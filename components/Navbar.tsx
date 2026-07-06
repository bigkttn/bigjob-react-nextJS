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
  const [unreadCount, setUnreadCount] = useState<number>(0); // 🔔 State สำหรับจำนวนแจ้งเตือน

  const pathname = usePathname();
  const router = useRouter();

  // ดึงข้อมูล Session จาก API และยอดแจ้งเตือนเมื่อเปลี่ยนหน้า
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data.user) {
          setUserRole(data.user.role);
          setUserId(data.user.id);
          setUserName(data.user.email);

          // 🔔 ส่งทั้ง ID และ Role ไปเช็คจำนวนแจ้งเตือน
          if (data.user.role !== "guest") {
            fetchNotificationBadge(data.user.id, data.user.role);
          }
        } else {
          setUserRole("guest");
          setUserName("");
          setUserId("");
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch session");
        setUserRole("guest");
        setUserId("");
        setUnreadCount(0);
      }
    };

    fetchSession();
  }, [pathname]);

  // 🔔 ฟังก์ชันเรียกตรวจสอบยอดตกค้าง (แยก Path ตามสิทธิ์ผู้ใช้งาน)
  const fetchNotificationBadge = async (uid: string, role: string) => {
    try {
      // เช็คสิทธิ์: ถ้าเป็นบริษัทให้ยิงไปที่ api ฝั่งบริษัท ถ้าเป็นบุคคลทั่วไปให้ยิงไปที่เดิม
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

  // 🔔 จุดแก้ไขใหม่: รอรับสัญญาณสั่งรีเฟรชตัวเลขกระดิ่งแจ้งเตือนแบบ Real-time
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
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        setUserRole("guest");
        closeMenu();
        router.push("/login");
      } catch (error) {
        console.error("Logout failed", error);
      }
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
      <nav className="navbar">
        <div className="nav-container">
          <div className="brand">
            <button className="menu-icon" onClick={toggleMenu}>
              ☰
            </button>
            <Link href={getDashboardRoute()} className="logo-text">
              BIGJOBs
            </Link>
          </div>

          {/* ---------------- DESKTOP MENU ---------------- */}
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

                {/* 🔔 จุดแสดงแจ้งเตือนฝั่ง Seeker */}
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
                <Link href="/company/saved_users" className={`nav-item ${isActive("/company/saved_users")}`}>Saved</Link>

                {/* 🔔 จุดแสดงแจ้งเตือนสำหรับฝั่ง Company */}
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
