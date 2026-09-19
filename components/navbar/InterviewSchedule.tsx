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
  const [searchQuery, setSearchQuery] = useState("");

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

  // Format date helper
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

  // กรองข้อมูลตามคำค้นหา (Search Filter)
  const filteredInterviews = useMemo(() => {
    if (!searchQuery.trim()) return interviews;
    const lowerQuery = searchQuery.toLowerCase();
    return interviews.filter((item) => {
      if (userRole === "seeker") {
        return (
          item.company_name?.toLowerCase().includes(lowerQuery) ||
          item.job_position?.toLowerCase().includes(lowerQuery)
        );
      } else {
        return (
          item.applicant_name?.toLowerCase().includes(lowerQuery) ||
          item.job_position?.toLowerCase().includes(lowerQuery)
        );
      }
    });
  }, [interviews, searchQuery, userRole]);

  // Group interviews for company role
  const groupedInterviews =
    userRole === "company"
      ? filteredInterviews.reduce(
          (acc, curr) => {
            const key = curr.post_id;
            if (!acc[key]) {
              acc[key] = {
                post_id: curr.post_id,
                job_position: curr.job_position,
                candidates: [],
              };
            }
            acc[key].candidates.push(curr);
            return acc;
          },
          {} as Record<string, any>,
        )
      : null;

  // Group interviews for seeker role
  const groupedSeekerInterviews =
    userRole === "seeker"
      ? filteredInterviews.reduce(
          (acc, curr) => {
            const key = curr.company_name || "Unknown Company";
            if (!acc[key]) {
              acc[key] = {
                company_name: curr.company_name || "Unknown Company",
                interviews: [],
              };
            }
            acc[key].interviews.push(curr);
            return acc;
          },
          {} as Record<string, any>,
        )
      : null;

  if (userRole !== "seeker" && userRole !== "company") return null;

  return (
    <div
      className="interview-schedule-container"
      style={{ marginTop: "15px", marginBottom: "5px" }}
    >
      <div className="sidebar-section-title">
        {userRole === "seeker" ? "นัดสัมภาษณ์ของคุณ" : "นัดสัมภาษณ์ผู้สมัคร"}
      </div>

      {/* ช่องค้นหา - ช่วยให้หาได้ง่ายขึ้นถ้ามีนัดสัมภาษณ์เยอะ */}
      {interviews.length > 0 && (
        <input
          type="text"
          placeholder={userRole === "seeker" ? "ค้นหาบริษัท / ตำแหน่งงาน..." : "ค้นหาชื่อผู้สมัคร / ตำแหน่ง..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            marginBottom: "12px",
            borderRadius: "6px",
            border: "1px solid #333",
            backgroundColor: "#111",
            color: "#fff",
            fontSize: "13px",
            outline: "none"
          }}
        />
      )}

      {/* ส่วน Scrollable เผื่อมีรายการเยอะมาก */}
      <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto", paddingRight: "4px" }}>
        {interviews.length === 0 ? (
          <div className="interview-empty">ไม่มีนัดสัมภาษณ์ในขณะนี้</div>
        ) : filteredInterviews.length === 0 ? (
          <div className="interview-empty" style={{ fontSize: "12px", textAlign: "center" }}>
            ไม่พบข้อมูลที่ค้นหา
          </div>
        ) : userRole === "seeker" ? (
          // Seeker View: Group by company_name
          Object.values(groupedSeekerInterviews || {}).map((group: any) => (
            <div key={group.company_name} style={{ marginBottom: "12px" }}>
              <Link
                href={`/user/seeker_tracking/${userId}`}
                style={{ textDecoration: "none" }}
                onClick={closeMenu}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#38bdf8",
                    marginBottom: "6px",
                    cursor: "pointer",
                  }}
                >
                  บริษัท: {group.company_name}
                </div>
              </Link>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {group.interviews.map((interview: any) => (
                  <div
                    key={interview.tracking_id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      fontSize: "13.5px",
                      padding: "8px 12px",
                      backgroundColor: "#1e1e24",
                      borderRadius: "6px",
                      color: "#fff",
                      marginLeft: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#a1a1aa", fontSize: "12px" }}>
                        {formatDateTime(interview.interview_date)}
                      </span>
                      <span style={{ fontWeight: 500 }}>
                        {interview.job_position}
                      </span>
                    </div>
                    {interview.location && (
                      <div style={{ color: "#a1a1aa", fontSize: "11.5px", marginTop: "6px", lineHeight: "1.4" }}>
                        {interview.location}
                      </div>
                    )}
                    {interview.link && (
                      <a
                        href={
                          interview.link.startsWith("http")
                            ? interview.link
                            : `https://${interview.link}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "12px",
                          color: "#3b82f6",
                          marginTop: "6px",
                          textDecoration: "underline",
                          display: "inline-block"
                        }}
                      >
                        เข้าร่วม / ลิงก์สัมภาษณ์
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // Company View: Group by post_id
          Object.values(groupedInterviews || {}).map((group: any) => (
            <div key={group.post_id} style={{ marginBottom: "12px" }}>
              <Link
                href={`/company/company_tracking/${userId}?post=${group.post_id}`}
                style={{ textDecoration: "none" }}
                onClick={closeMenu}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#38bdf8",
                    marginBottom: "6px",
                    cursor: "pointer",
                  }}
                >
                  ตำแหน่ง: {group.job_position}
                </div>
              </Link>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {group.candidates.map((candidate: any) => (
                  <div
                    key={candidate.tracking_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "13.5px",
                      padding: "8px 12px",
                      backgroundColor: "#1e1e24",
                      borderRadius: "6px",
                      color: "#fff",
                      marginLeft: "10px",
                    }}
                  >
                    <span style={{ color: "#a1a1aa", fontSize: "12px" }}>
                      {formatDateTime(candidate.interview_date)}
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {candidate.applicant_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
