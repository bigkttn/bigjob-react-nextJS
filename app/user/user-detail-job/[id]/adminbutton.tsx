"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AdminButtonProps {
  id: string;
  role: string;
  post_id: string;
  company_id?: string;
  ban_until?: string | null; // รับเวลาปลดแบนจาก Database เข้ามา
}

export default function AdminButton({
  id,
  role,
  post_id,
  company_id,
  ban_until,
}: AdminButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [banDuration, setBanDuration] = useState("3");
  const [isLoading, setIsLoading] = useState(false);

  // State สำหรับเก็บข้อความแสดงเวลาแบนถอยหลัง
  const [countdownText, setCountdownText] = useState<string>("");
  const [isBanned, setIsBanned] = useState<boolean>(false);

  const router = useRouter();

  // ฟังก์ชันคำนวณเวลาถอยหลัง
  useEffect(() => {
    if (!ban_until) {
      setIsBanned(false);
      setCountdownText("สถานะปกติ (ไม่ถูกแบน)");
      return;
    }

    const checkTime = () => {
      // เนื่องจาก backend มีการ +7 ชม. ตอนเซฟ ดังนั้นถ้าแสดงผลในไทยถือว่าเวลาตรงกันแล้ว
      const targetDate = new Date(ban_until);
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();

      if (targetDate.getFullYear() >= 9990) {
        setIsBanned(true);
        setCountdownText("ถูกแบนถาวร");
        return;
      }

      if (diffMs <= 0) {
        setIsBanned(false);
        setCountdownText("ครบกำหนดแบนแล้ว (รอรีเฟรชสถานะ)");
      } else {
        setIsBanned(true);
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diffMs / (1000 * 60)) % 60);

        setCountdownText(
          `เหลือเวลา: ${days} วัน ${hours} ชั่วโมง ${mins} นาที`,
        );
      }
    };

    checkTime();
    // อัปเดตเวลาทุกๆ 1 นาที (60000 ms)
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [ban_until]);

  const handleDelete = async () => {
    const isConfirm = confirm(
      `Are you sure you want to delete Post ID: ${post_id} ? This action cannot be undone.`,
    );
    if (!isConfirm) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/deletePost/${post_id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Post deleted successfully");
        router.back();
      } else {
        const errorData = await response.json();
        console.error("Error deleting post:", errorData);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("เกิดข้อผิดพลาดในการลบประกาศงาน กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBan = async () => {
    const durationText = banDuration === "999" ? "ถาวร" : `${banDuration} วัน`;
    const isConfirm = confirm(
      `คุณต้องการแบนผู้สร้างโพสต์ ID: ${post_id} เป็นเวลา ${durationText} ใช่หรือไม่?`,
    );
    if (!isConfirm) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/post/Ban`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          post_id,
          durationDays: parseInt(banDuration),
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert(`แบนโพสต์สำเร็จ! (ระยะเวลา: ${durationText})`);
        setIsOpen(false);
        router.refresh(); // ใช้ refresh แทน back เพื่อให้ข้อมูลหน้าที่เปิดอยู่อัปเดต
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error || "ไม่สามารถแบนโพสต์ได้"}`);
      }
    } catch (error) {
      console.error("Ban error:", error);
      alert("เกิดข้อผิดพลาดในการแบนผู้ใช้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async () => {
    const isConfirm = confirm(
      `คุณต้องการปลดแบนโพสต์ ID: ${post_id} ใช่หรือไม่?`,
    );
    if (!isConfirm) return;

    setIsLoading(true);
    try {
      // ส่ง DELETE Request พร้อม query parameter
      const res = await fetch(`/api/admin/post/Ban?post_id=${post_id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (res.ok) {
        alert("ปลดแบนสำเร็จ!");
        setIsOpen(false);
        router.refresh(); // รีเฟรชหน้าเพื่อดึงข้อมูลใหม่
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error || "ไม่สามารถปลดแบนได้"}`);
      }
    } catch (error) {
      console.error("Unban error:", error);
      alert("เกิดข้อผิดพลาดในการปลดแบน");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          backgroundColor: "#dc3545",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
          transition: "background-color 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#c82333")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#dc3545")}
      >
        จัดการโพสต์ (Admin)
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "400px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              color: "#333",
              fontFamily: "inherit",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "1.25rem",
                fontWeight: "bold",
              }}
            >
              Admin Post Management
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#666",
                marginBottom: "15px",
              }}
            >
              Managing Target ID:{" "}
              <span style={{ fontWeight: "bold", color: "#000" }}>
                {post_id}
              </span>
            </p>

            {/* แสดงสถานะการแบนปัจจุบัน */}
            <div
              style={{
                backgroundColor: isBanned ? "#fff3cd" : "#d4edda",
                color: isBanned ? "#856404" : "#155724",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "0.9rem",
                fontWeight: "bold",
                border: `1px solid ${isBanned ? "#ffeeba" : "#c3e6cb"}`,
              }}
            >
              สถานะ: {countdownText}
            </div>

            <hr
              style={{
                border: "0",
                borderTop: "1px solid #eee",
                marginBottom: "20px",
              }}
            />

            {/* ส่วนที่ 1: การลบโพสต์ (Delete) */}
            <div style={{ marginBottom: "25px" }}>
              <h4
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: "#dc3545",
                }}
              >
                1. Delete This Post
              </h4>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                style={{
                  width: "100%",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? "Processing..." : "Delete Post Now"}
              </button>
            </div>

            <hr
              style={{
                border: "0",
                borderTop: "1px solid #eee",
                marginBottom: "20px",
              }}
            />

            {/* ส่วนที่ 2: การแบน หรือ ปลดแบน (Ban / Unban) */}
            <div style={{ marginBottom: "20px" }}>
              <h4
                style={{
                  margin: "0 0 6px 0",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: "#fd7e14",
                }}
              >
                2. Ban / Unban Post
              </h4>

              {isBanned ? (
                // ถ้าโดนแบนอยู่ให้แสดงปุ่มปลดแบน
                <button
                  onClick={handleUnban}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? "Processing..." : "ปลดแบนโพสต์นี้"}
                </button>
              ) : (
                // ถ้าไม่ได้โดนแบนให้แสดงฟอร์มสำหรับแบน
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "12px",
                    }}
                  >
                    <select
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        fontSize: "0.9rem",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="3">Ban for 3 Days</option>
                      <option value="7">Ban for 7 Days</option>
                      <option value="30">Ban for 30 Days</option>
                      <option value="999">Permanently Suspend</option>
                    </select>
                  </div>

                  <button
                    onClick={handleBan}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      backgroundColor: "#fd7e14",
                      color: "white",
                      border: "none",
                      padding: "10px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading ? "Processing..." : "Confirm Ban"}
                  </button>
                </>
              )}
            </div>

            {/* ส่วนที่ 3: ปุ่มยกเลิก / ปิด Popup */}
            <button
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              style={{
                width: "100%",
                backgroundColor: "#f1f3f5",
                color: "#495057",
                border: "none",
                padding: "10px",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              Cancel / Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
