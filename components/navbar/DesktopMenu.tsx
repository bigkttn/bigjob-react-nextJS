import React from "react";
import Link from "next/link";

interface DesktopMenuProps {
  userRole: string;
  userId: string;
  unreadCount: number;
  isActive: (path: string) => string;
  onLogout: () => void;
}

export default function DesktopMenu({
  userRole,
  userId,
  unreadCount,
  isActive,
  onLogout,
}: DesktopMenuProps) {
  return (
    <div className="nav-links desktop-menu">
      {userRole === "guest" && (
        <>
          <Link href="/login" className="nav-btn-outline">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="nav-btn-primary">
            สมัครสมาชิก
          </Link>
        </>
      )}

      {userRole === "seeker" && (
        <>
          <Link
            href="/user/user-home"
            className={`nav-item ${isActive("/user/user-home")}`}
          >
            หน้าแรก
          </Link>
          <Link
            href={`/user/seeker_tracking/${userId}`}
            className={`nav-item ${isActive(`/user/seeker_tracking/${userId}`)}`}
          >
            ติดตามสถานะ
          </Link>

          <Link
            href="/user/savedCompany"
            className={`nav-item ${isActive("/user/savedCompany")}`}
          >
            ที่บันทึกไว้
          </Link>
          <Link
            href="/user/user-feedback"
            className={`nav-item nav-feedback-link ${isActive("/user/user-feedback")}`}
          >
            ข้อเสนอแนะ
            {unreadCount > 0 && (
              <span className="shock-badge">! {unreadCount}</span>
            )}
          </Link>
          <Link
            href="/user/user-profile"
            className={`nav-item ${isActive("/user/user-profile")}`}
          >
            โปรไฟล์ของฉัน
          </Link>
          <button onClick={onLogout} className="nav-btn-logout">
            ออกจากระบบ
          </button>
        </>
      )}

      {userRole === "company" && (
        <>
          <Link
            href="/company/company-home"
            className={`nav-item ${isActive("/company/company-home")}`}
          >
            หน้าแรก
          </Link>
          <Link
            href={`/company/company_tracking/${userId}`}
            className={`nav-item ${isActive(`/company/company_tracking/${userId}`)}`}
          >
            ติดตามสถานะ
          </Link>
          <Link
            href="/company/savedSeeker"
            className={`nav-item ${isActive("/company/savedSeeker")}`}
          >
            ที่บันทึกไว้
          </Link>
          <Link
            href="/company/company-feedback"
            className={`nav-item nav-feedback-link ${isActive("/company/company-feedback")}`}
          >
            ข้อเสนอแนะ
            {unreadCount > 0 && (
              <span className="shock-badge">! {unreadCount}</span>
            )}
          </Link>
          <Link
            href="/company/post-job"
            className={`nav-item ${isActive("/company/post-job")}`}
          >
            ลงประกาศงาน
          </Link>
          <Link
            href="/company/profile"
            className={`nav-item ${isActive("/company/profile")}`}
          >
            โปรไฟล์
          </Link>
          <button onClick={onLogout} className="nav-btn-logout">
            ออกจากระบบ
          </button>
        </>
      )}

      {userRole === "admin" && (
        <>
          <Link href="/admin/admin-report" className={`nav-item ${isActive("/admin/admin-report")}`}>
            รายงาน
          </Link>
          <Link href="/admin/Feedbacks" className={`nav-item ${isActive("/admin/Feedbacks")}`}>
            ข้อเสนอแนะ
          </Link>
          <Link href="/admin/home" className={`nav-item ${isActive("/admin/home")}`}>
            ยืนยันตัวตน
          </Link>
          <button onClick={onLogout} className="nav-btn-logout">
            ออกจากระบบ
          </button>
        </>
      )}
    </div>
  );
}
