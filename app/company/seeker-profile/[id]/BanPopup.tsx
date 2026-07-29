"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

export default function YourComponent({ profile, isAdmin }: any) {
  // อย่าลืมใส่ props job หรือดึงข้อมูล job มาใช้
  const [showBanPopup, setShowBanPopup] = useState(true); // เปลี่ยนเป็น true ถ้าอยากให้เปิดทันทีที่โดนแบน'
  const router = useRouter();

  let formattedBanDate = "";
  let remainingText = "";
  let isBanned = false;

  // 2. คำนวณตรรกะต่างๆ ก่อนแสดงผล
  if (profile && profile.banned_until && !isAdmin) {
    console.log(isAdmin);
    console.log(profile);
    const banDate = new Date(profile.banned_until.replace(" ", "T"));
    const now = new Date();
    const diffMs = banDate.getTime() - now.getTime();

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
    formattedBanDate = `${banDate.getDate()} ${monthNames[banDate.getMonth()]} ค.ศ. ${banDate.getFullYear()} เวลา ${banDate.getHours().toString().padStart(2, "0")}:${banDate.getMinutes().toString().padStart(2, "0")} น.`;

    if (diffMs > 0) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      const dayText = days > 0 ? `${days} วัน ` : "";
      const hourText = hours > 0 ? `${hours} ชั่วโมง ` : "";
      const minText = minutes > 0 ? `${minutes} นาที` : "";

      remainingText = `(เหลือเวลาอีก ${dayText}${hourText}${minText})`;
      isBanned = true;
    } else {
      remainingText = "(ครบกำหนดเวลาแบนแล้ว)";
      isBanned = false;
    }
  }

  // 3. ส่วนของการแสดงผล (return) จะอยู่ล่างสุดเสมอ
  return (
    <div>
      {/* เนื้อหาอื่นๆ ในหน้าเว็บของคุณ */}

      {/* โค้ด Popup ของคุณ */}
      {showBanPopup && isBanned && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderTop: "6px solid #ef4444",
              borderRadius: "12px",
              padding: "30px",
              width: "90%",
              maxWidth: "400px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>⚠️</div>
            <h2
              style={{
                color: "#b91c1c",
                margin: "0 0 15px 0",
                fontSize: "1.25rem",
              }}
            >
              ถูกระงับการใช้งาน
            </h2>
            <p
              style={{
                color: "#4b5563",
                fontSize: "0.95rem",
                lineHeight: "1.5",
                marginBottom: "25px",
              }}
            >
              ไม่สามารถกระทำการข้อมูลได้
              <br />
              จนกว่าจะถึงเวลา:{" "}
              <strong style={{ color: "#111" }}>{formattedBanDate}</strong>
              <br />
              <span
                style={{
                  color: "#ef4444",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  display: "inline-block",
                  marginTop: "5px",
                }}
              >
                {remainingText}
              </span>
            </p>
            <button
              onClick={() => {
                setShowBanPopup(false);
                router.back();
              }}
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                width: "100%",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#dc2626")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#ef4444")
              }
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
