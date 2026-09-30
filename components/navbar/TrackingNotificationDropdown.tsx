"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./tracking-notification.css";

interface TrackingNotification {
  tracking_id: number;
  status: string;
  title: string;
  sender_name: string;
  sender_image: string;
  date_time: string;
}

interface Props {
  userId: string;
  userRole: string;
}

export default function TrackingNotificationDropdown({ userId, userRole }: Props) {
  const [notifications, setNotifications] = useState<TrackingNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/interview_tracking/notifications?userId=${userId}&role=${userRole}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch tracking notifications", err);
    }
  };

  useEffect(() => {
    if (userId && userRole && userRole !== "guest") {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [userId, userRole]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (trackingId: number) => {
    try {
      await fetch("/api/interview_tracking/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId, role: userRole }),
      });
      fetchNotifications();
      setIsOpen(false);
      
      if (userRole === "seeker") {
        router.push(`/user/seeker_tracking/${userId}`);
      } else if (userRole === "company") {
        router.push(`/company/company_tracking/${userId}`);
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'applied': return 'สมัครงานใหม่';
      case 'screening': return 'พิจารณาคุณสมบัติ/นัดสัมภาษณ์';
      case 'interview': return 'ยืนยันการสัมภาษณ์';
      case 'appointment': 
      case 'offer': return 'ข้อเสนอเริ่มงาน';
      case 'hired': return 'รับเข้าทำงาน';
      case 'reject':
      case 'rejected': return 'ถูกปฏิเสธ';
      case 'pending': return 'คำเชิญสมัครงาน';
      default: return status;
    }
  };

  if (!userId || userRole === "guest" || userRole === "admin") return null;

  return (
    <div className="tracking-notification-container" ref={dropdownRef}>
      <button 
        className="notification-bell-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="การแจ้งเตือนสถานะการสมัคร"
      >
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>การแจ้งเตือนสถานะ</h4>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">ไม่มีการแจ้งเตือนใหม่</p>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.tracking_id} 
                  className="notification-item unread"
                  onClick={() => handleNotificationClick(notif.tracking_id)}
                >
                  <div className="notification-content">
                    <p className="notification-title">
                      สถานะตำแหน่ง <strong>{notif.title}</strong> เปลี่ยนเป็น <strong>{getStatusText(notif.status)}</strong>
                    </p>
                    <p className="notification-sender">
                      โดย: {notif.sender_name}
                    </p>
                    <p className="notification-time">
                      {new Date(notif.date_time).toLocaleString('th-TH')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
