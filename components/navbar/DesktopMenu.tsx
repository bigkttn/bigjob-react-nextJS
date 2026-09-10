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
          <Link href="/admin/admin-report" className={`nav-item ${isActive("/admin/admin-report")}`}>
            Report
          </Link>
          <Link href="/admin/Feedbacks" className={`nav-item ${isActive("/admin/Feedbacks")}`}>
            Feedbacks
          </Link>
          <Link href="/admin/home" className={`nav-item ${isActive("/admin/home")}`}>
            Verification
          </Link>
          <button onClick={onLogout} className="nav-btn-logout">
            Log out
          </button>
        </>
      )}
    </div>
  );
}
