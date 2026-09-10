"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BanPopup from "./navbar/BanPopup";
import DesktopMenu from "./navbar/DesktopMenu";
import MobileMenu from "./navbar/MobileMenu";
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
        <BanPopup 
          banDetails={banDetails} 
          onAcknowledge={() => {
            setIsBanned(false);
            forceLogout();
          }} 
        />
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
          <DesktopMenu 
            userRole={userRole} 
            userId={userId} 
            unreadCount={unreadCount} 
            isActive={isActive} 
            onLogout={onLogout} 
          />
        </div>

        {/* Mobile Drawer / Sidebar */}
        <MobileMenu 
          isMenuOpen={isMenuOpen} 
          closeMenu={closeMenu} 
          userRole={userRole} 
          userName={userName} 
          userId={userId} 
          unreadCount={unreadCount} 
          isActive={isActive} 
          onLogout={onLogout} 
        />
      </nav>
    </>
  );
}
