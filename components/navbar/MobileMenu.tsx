import React from "react";
import Link from "next/link";

interface MobileMenuProps {
  isMenuOpen: boolean;
  closeMenu: () => void;
  userRole: string;
  userName: string;
  userId: string;
  unreadCount: number;
  isActive: (path: string) => string;
  onLogout: () => void;
}

export default function MobileMenu({
  isMenuOpen,
  closeMenu,
  userRole,
  userName,
  userId,
  unreadCount,
  isActive,
  onLogout,
}: MobileMenuProps) {
  return (
    <>
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
    </>
  );
}
