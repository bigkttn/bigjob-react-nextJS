"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AdminButtonProps {
  id: string;
  role: string;
  user_id: string; // เปลี่ยนเป็น user_id
  banned_until?: string | null;
  onSuccess?: () => void;
}

export default function AdminButton({
  id,
  role,
  user_id,
  banned_until,
  onSuccess,
}: AdminButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [banDuration, setBanDuration] = useState("3");
  const [isLoading, setIsLoading] = useState(false);

  // State เก็บข้อความเวลาถอยหลังและสถานะการแบน
  const [countdownText, setCountdownText] = useState<string>("");
  const [isBanned, setIsBanned] = useState<boolean>(false);

  const router = useRouter();

  // --- ระบบนับเวลาถอยหลัง Real-time (อัปเดตทุก 1 นาที) ---
  useEffect(() => {
    if (!banned_until) {
      setIsBanned(false);
      setCountdownText("สถานะปกติ (ไม่ถูกแบน)");
      return;
    }

    const checkTime = () => {
      const targetDate = new Date(banned_until);
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
    const interval = setInterval(checkTime, 60000); // อัปเดตทุก 1 นาที
    return () => clearInterval(interval);
  }, [banned_until]);

  // --- ฟังก์ชันแบนผู้ใช้ ---
  const handleBan = async () => {
    const durationText = banDuration === "999" ? "ถาวร" : `${banDuration} วัน`;
    const isConfirm = confirm(
      `คุณต้องการแบนผู้ใช้งาน ID: ${user_id} เป็นเวลา ${durationText} ใช่หรือไม่?`,
    );
    if (!isConfirm) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/user/ban`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          user_id,
          durationDays: parseInt(banDuration),
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert(`แบนผู้ใช้งานสำเร็จ! (ระยะเวลา: ${durationText})`);
        setIsOpen(false);
        router.refresh();
        if (onSuccess) onSuccess();
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error || "ไม่สามารถแบนผู้ใช้ได้"}`);
      }
    } catch (error) {
      console.error("Ban error:", error);
      alert("เกิดข้อผิดพลาดในการแบนผู้ใช้งาน");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ฟังก์ชันปลดแบนผู้ใช้ ---
  const handleUnban = async () => {
    const isConfirm = confirm(
      `คุณต้องการปลดแบนผู้ใช้งาน ID: ${user_id} ใช่หรือไม่?`,
    );
    if (!isConfirm) return;

    setIsLoading(true);
    try {
      // เรียก API ลบการแบน (ส่ง user_id ไปกับ query string)
      const res = await fetch(`/api/admin/user/ban?user_id=${user_id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (res.ok) {
        alert("ปลดแบนสำเร็จ!");
        setIsOpen(false);
        router.refresh();
        if (onSuccess) onSuccess();
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
        จัดการผู้ใช้ (Admin)
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
              Admin User Management
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
                {user_id}
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
                Ban / Unban User Account
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
                  {isLoading ? "Processing..." : "ปลดแบนผู้ใช้นี้"}
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
