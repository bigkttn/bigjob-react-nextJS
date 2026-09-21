import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface InterviewScheduleProps {
  isMenuOpen: boolean;
  userId: string;
  userRole: string;
  closeMenu: () => void;
}

export default function InterviewSchedule({
  isMenuOpen,
  userId,
  userRole,
  closeMenu,
}: InterviewScheduleProps) {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    if (isMenuOpen && userId && (userRole === "seeker" || userRole === "company")) {
      const fetchInterviews = async () => {
        try {
          const res = await fetch(`/api/interview_tracking/upcoming?userId=${userId}&role=${userRole}`);
          if (res.ok) {
            const data = await res.json();
            setInterviews(data.rows || []);
          }
        } catch (err) {
          console.error("Failed to fetch upcoming interviews", err);
        }
      };
      fetchInterviews();
    }
  }, [isMenuOpen, userId, userRole]);

  // Calendar Logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(new Date(year, parseInt(e.target.value), 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(new Date(parseInt(e.target.value), month, 1));
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  const hasInterviews = (date: Date) => {
    return interviews.some((iv) => {
      const ivDate = new Date(iv.interview_date);
      return isSameDay(ivDate, date);
    });
  };

  const selectedInterviews = useMemo(() => {
    if (!selectedDate) return [];
    return interviews.filter((iv) => {
      const ivDate = new Date(iv.interview_date);
      return isSameDay(ivDate, selectedDate);
    });
  }, [interviews, selectedDate]);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "ไม่ระบุเวลา";
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const monthsTH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i); // currentYear - 1 to currentYear + 3

  if (userRole !== "seeker" && userRole !== "company") return null;

  return (
    <div
      className="interview-schedule-container"
      style={{ marginTop: "15px", marginBottom: "5px" }}
    >
      <div className="sidebar-section-title">
        {userRole === "seeker" ? "นัดสัมภาษณ์ของคุณ" : "นัดสัมภาษณ์ผู้สมัคร"}
      </div>

      {/* Calendar UI */}
      <div style={{
        backgroundColor: "transparent",
        borderRadius: "8px",
        marginBottom: "16px",
      }}>
        {/* Header - Navigation & Dropdowns */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px" }}>
          <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "16px", padding: "4px" }}>
            &lt;
          </button>
          
          <div style={{ display: "flex", gap: "8px", flex: 1 }}>
            <select 
              value={month} 
              onChange={handleMonthChange}
              style={{
                flex: 1,
                backgroundColor: "#1e1e24",
                color: "#fff",
                border: "1px solid #333",
                padding: "6px 4px",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
                WebkitAppearance: "menulist"
              }}
            >
              {monthsTH.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>

            <select 
              value={year} 
              onChange={handleYearChange}
              style={{
                flex: 1,
                backgroundColor: "#1e1e24",
                color: "#fff",
                border: "1px solid #333",
                padding: "6px 4px",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
                WebkitAppearance: "menulist"
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y + 543}</option>
              ))}
            </select>
          </div>

          <button onClick={nextMonth} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "16px", padding: "4px" }}>
            &gt;
          </button>
        </div>

        {/* Days of week */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center", marginBottom: "8px" }}>
          {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => (
            <div key={i} style={{ color: i === 0 ? "#ef4444" : "#a1a1aa", fontSize: "12px", fontWeight: "bold" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
          {days.map((date, index) => {
            if (!date) return <div key={index}></div>;

            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const hasEvent = hasInterviews(date);
            const isSunday = date.getDay() === 0;

            return (
              <div
                key={index}
                onClick={() => setSelectedDate(date)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "34px",
                  cursor: "pointer",
                  position: "relative",
                  borderRadius: "6px",
                  backgroundColor: isSelected ? "#38bdf8" : isToday ? "rgba(56, 189, 248, 0.15)" : "transparent",
                  color: isSelected ? "#000" : isToday ? "#38bdf8" : isSunday ? "#ef4444" : "#fff",
                  fontWeight: isSelected || isToday ? "bold" : "normal",
                  fontSize: "13px",
                  transition: "all 0.2s"
                }}
              >
                {date.getDate()}
                {hasEvent && (
                  <div style={{
                    position: "absolute",
                    bottom: "2px",
                    width: "4px",
                    height: "4px",
                    backgroundColor: isSelected ? "#000" : "#38bdf8",
                    borderRadius: "50%"
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Header */}
      <div style={{ 
        color: "#fff", 
        fontSize: "13px", 
        fontWeight: "bold", 
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "1px solid #333"
      }}>
        {selectedDate 
          ? `ตารางงานวันที่ ${selectedDate.toLocaleDateString("th-TH", { day: "numeric", month: "long" })}`
          : "เลือกวันที่เพื่อดูตารางงาน"}
      </div>

      <div style={{ maxHeight: "calc(100vh - 440px)", overflowY: "auto", paddingRight: "4px" }}>
        {selectedInterviews.length === 0 ? (
          <div className="interview-empty">ไม่มีนัดสัมภาษณ์ในวันนี้</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {selectedInterviews.map((interview: any) => (
              <div
                key={interview.tracking_id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: "13.5px",
                  padding: "12px",
                  backgroundColor: "#1e1e24",
                  borderRadius: "6px",
                  color: "#fff",
                }}
              >
                {/* Title (Company or Candidate) in Blue like original */}
                {userRole === "seeker" ? (
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>
                    บริษัท: {interview.company_name}
                  </div>
                ) : (
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>
                    ตำแหน่ง: {interview.job_position}
                  </div>
                )}
                
                {/* Date and Position */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ color: "#a1a1aa", fontSize: "12px" }}>
                    {formatDateTime(interview.interview_date)}
                  </span>
                  <span style={{ fontWeight: 500, fontSize: "14px" }}>
                    {userRole === "seeker" ? interview.job_position : interview.applicant_name}
                  </span>
                </div>

                {/* Location text only (No Emoji) */}
                {interview.location && (
                  <div style={{ color: "#a1a1aa", fontSize: "11.5px", marginTop: "2px", lineHeight: "1.4" }}>
                    {interview.location}
                  </div>
                )}

                {/* Links */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  {interview.link ? (
                    <a
                      href={interview.link.startsWith("http") ? interview.link : `https://${interview.link}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "12px",
                        color: "#3b82f6",
                        textDecoration: "underline",
                        display: "inline-block"
                      }}
                    >
                      เข้าร่วม / ลิงก์สัมภาษณ์
                    </a>
                  ) : <div></div>}
                  
                  <Link
                    href={userRole === "seeker" ? `/user/seeker_tracking/${userId}` : `/company/company_tracking/${userId}?post=${interview.post_id}`}
                    onClick={closeMenu}
                    style={{ color: "#a1a1aa", fontSize: "12px", textDecoration: "underline" }}
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
