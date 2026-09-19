import React from "react";
import Link from "next/link";
import InterviewSchedule from "./InterviewSchedule";

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

          {/* ส่วนแสดงตารางนัดสัมภาษณ์ (แสดงทั้ง PC และ Mobile) แยก Component ออกมา */}
          <InterviewSchedule 
            isMenuOpen={isMenuOpen} 
            userId={userId} 
            userRole={userRole} 
            closeMenu={closeMenu} 
          />

          {/* ครอบด้วย mobile-only-links: แสดงเมนูพวกนี้เฉพาะบนมือถือเท่านั้น */}
          <div className="mobile-only-links">
            <hr className="sidebar-divider" />

            {userRole === "guest" && (
              <>
                <Link href="/login" className="side-item" onClick={closeMenu}>
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="side-item highlight"
                  onClick={closeMenu}
                >
                  สมัครสมาชิก
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
                  หน้าแรก
                </Link>
                <Link
                  href={`/user/seeker_tracking/${userId}`}
                  className={`side-item ${isActive(`/user/seeker_tracking/${userId}`)}`}
                  onClick={closeMenu}
                >
                  ติดตามสถานะ
                </Link>
                <Link
                  href="/user/savedCompany"
                  className={`side-item ${isActive("/user/savedCompany")}`}
                  onClick={closeMenu}
                >
                  ที่บันทึกไว้
                </Link>
                <Link
                  href="/user/user-feedback"
                  className={`side-item ${isActive("/user/user-feedback")}`}
                  onClick={closeMenu}
                >
                  ข้อเสนอแนะ{" "}
                  {unreadCount > 0 && (
                    <span className="shock-badge">! {unreadCount}</span>
                  )}
                </Link>
                <Link
                  href="/user/user-profile"
                  className={`side-item ${isActive("/user/user-profile")}`}
                  onClick={closeMenu}
                >
                  โปรไฟล์ของฉัน
                </Link>
                <button onClick={onLogout} className="side-btn-logout">
                  ออกจากระบบ
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
                  หน้าแรก
                </Link>
                <Link
                  href={`/company/company_tracking/${userId}`}
                  className={`side-item ${isActive(`/company/company_tracking/${userId}`)}`}
                  onClick={closeMenu}
                >
                  ติดตามสถานะ
                </Link>
                <Link
                  href="/company/savedSeeker"
                  className={`side-item ${isActive("/company/savedSeeker")}`}
                  onClick={closeMenu}
                >
                  ที่บันทึกไว้
                </Link>
                <Link
                  href="/company/company-feedback"
                  className={`side-item ${isActive("/company/company-feedback")}`}
                  onClick={closeMenu}
                >
                  ข้อเสนอแนะ{" "}
                  {unreadCount > 0 && (
                    <span className="shock-badge">! {unreadCount}</span>
                  )}
                </Link>
                <Link
                  href="/company/post-job"
                  className={`side-item ${isActive("/company/post-job")}`}
                  onClick={closeMenu}
                >
                  ลงประกาศงาน
                </Link>
                <Link
                  href="/company/profile"
                  className={`side-item ${isActive("/company/profile")}`}
                  onClick={closeMenu}
                >
                  โปรไฟล์
                </Link>
                <button onClick={onLogout} className="side-btn-logout">
                  ออกจากระบบ
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
                  รายงาน
                </Link>
                <Link
                  href="/admin/Feedbacks"
                  className={`side-item ${isActive("/admin/Feedbacks")}`}
                  onClick={closeMenu}
                >
                  ข้อเสนอแนะ
                </Link>
                <Link
                  href="/admin/home"
                  className={`side-item ${isActive("/admin/home")}`}
                  onClick={closeMenu}
                >
                  ยืนยันตัวตน
                </Link>
                <button onClick={onLogout} className="side-btn-logout">
                  ออกจากระบบ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
