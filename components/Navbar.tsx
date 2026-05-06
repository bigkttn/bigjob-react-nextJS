"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./navbar.css";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("guest");
  const [userName, setUserName] = useState("");

  const pathname = usePathname();
  const router = useRouter();

  // 🔄 ดึงข้อมูล Session จาก API แทน LocalStorage
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data.user) {
          setUserRole(data.user.role);
          // ใช้ email แสดงผลไปก่อน (หากใน JWT คุณส่งชื่อมาด้วย สามารถเปลี่ยนเป็น data.user.name ได้)
          setUserName(data.user.email);
        } else {
          setUserRole("guest");
          setUserName("");
        }
      } catch (error) {
        console.error("Failed to fetch session");
        setUserRole("guest");
      }
    };

    fetchSession();
  }, [pathname]); // ดึงใหม่เมื่อเปลี่ยนหน้า

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // 🚪 ฟังก์ชัน Logout ยิงไปที่ API
  const onLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      try {
        await fetch("/api/auth/logout", { method: "POST" }); // สั่งลบ Cookie
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
        return "/admin/Feedbacks";
      default:
        return "/";
    }
  };

  const isActive = (path: string) => (pathname === path ? "active" : "");

  return (
    <>
      <nav className="navbar">
        {/* ... (โค้ด HTML ส่วนการแสดงผล Navbar ของคุณเหมือนเดิมเป๊ะๆ ทุกบรรทัด ไม่ต้องแก้เลยครับ) ... */}
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
            {/* GUEST ROLE */}
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

            {/* SEEKER ROLE */}
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
                  className={`nav-item ${isActive("/user/user-feedback")}`}
                >
                  Feedback
                </Link>
                <Link
                  href="/user/profile"
                  className={`nav-item ${isActive("/user/profile")}`}
                >
                  My Profile
                </Link>
                <button onClick={onLogout} className="nav-btn-logout">
                  Log out
                </button>
              </>
            )}

            {/* COMPANY ROLE */}
            {userRole === "company" && (
              <>
                <Link
                  href="/company/company-home"
                  className={`nav-item ${isActive("/company/company-home")}`}
                >
                  Home
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

            {/* ADMIN ROLE */}
            {userRole === "admin" && (
              <>
                <Link href="/admin/Feedbacks" className="nav-item">
                  Feedbacks
                </Link>
                <Link href="/admin/CompanyVerification" className="nav-item">
                  Verification
                </Link>
                <button onClick={onLogout} className="nav-btn-logout">
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
        {/* ---------------- MOBILE SIDEBAR & OVERLAY ---------------- */}
        {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

        <div className={`sidebar-menu ${isMenuOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h3 className="logo-text">BIGJOBs</h3>
            <button className="close-btn" onClick={closeMenu}>
              ×
            </button>
          </div>

          <div className="sidebar-links">
            {userRole !== "guest" && (
              <div className="user-info">
                <span className="u-name">Hi, {userName}</span>
                <hr />
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
// {/* GUEST ROLE (Mobile) */}
//             {userRole === "guest" && (
//               <>
//                 <Link href="/login" onClick={closeMenu} className="nav-item">
//                   Login
//                 </Link>
//                 <Link href="/register" onClick={closeMenu} className="nav-item">
//                   Sign Up
//                 </Link>
//               </>
//             )}

//             {/* SEEKER ROLE (Mobile) */}
//             {userRole === "seeker" && (
//               <>
//                 <Link
//                   href="/userhome"
//                   onClick={closeMenu}
//                   className={`nav-item ${isActive("/")}`}
//                 >
//                   Home
//                 </Link>
//                 <Link
//                   href="/user/UserFeedback"
//                   onClick={closeMenu}
//                   className={`nav-item ${isActive("/")}`}
//                 >
//                   Feedback
//                 </Link>
//                 <Link
//                   href="/user/profile"
//                   onClick={closeMenu}
//                   className={`nav-item ${isActive("/")}`}
//                 >
//                   My Profile
//                 </Link>
//                 <button
//                   onClick={onLogout}
//                   className="nav-btn-logout"
//                   style={{ marginTop: "1rem" }}
//                 >
//                   Log out
//                 </button>
//               </>
//             )}

//             {/* COMPANY ROLE (Mobile) */}
//             {userRole === "company" && (
//               <>
//                 <Link
//                   href="/companyhome"
//                   onClick={closeMenu}
//                   className={`nav-item ${isActive("/companyhome")}`}
//                 >
//                   Home
//                 </Link>
//                 <Link
//                   href="/company/post-job"
//                   onClick={closeMenu}
//                   className={`nav-item ${isActive("/company/post-job")}`}
//                 >
//                   Post a Job
//                 </Link>
//                 <Link
//                   href="/company/profile"
//                   onClick={closeMenu}
//                   className={`nav-item ${isActive("/company/profile")}`}
//                 >
//                   Profile
//                 </Link>
//                 <button
//                   onClick={onLogout}
//                   className="nav-btn-logout"
//                   style={{ marginTop: "1rem" }}
//                 >
//                   Log out
//                 </button>
//               </>
//             )}

//             {/* ADMIN ROLE (Mobile) */}
//             {userRole === "admin" && (
//               <>
//                 <Link
//                   href="/admin/Feedbacks"
//                   onClick={closeMenu}
//                   className="nav-item"
//                 >
//                   Feedbacks
//                 </Link>
//                 <Link
//                   href="/admin/CompanyVerification"
//                   onClick={closeMenu}
//                   className="nav-item"
//                 >
//                   Verification
//                 </Link>
//                 <button
//                   onClick={onLogout}
//                   className="nav-btn-logout"
//                   style={{ marginTop: "1rem" }}
//                 >
//                   Log out
//                 </button>
//               </>
//             )}
