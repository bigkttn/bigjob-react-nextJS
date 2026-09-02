"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface BanPopupProps {
  profile?: {
    banned_until?: string | null;
  };
  isAdmin?: boolean;
}

export default function BanPopup({ profile, isAdmin }: BanPopupProps) {
  const [showBanPopup, setShowBanPopup] = useState(true);
  const router = useRouter();

  let formattedBanDate = "";
  let remainingText = "";
  let isBanned = false;

  if (profile && profile.banned_until && !isAdmin) {
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

    const thaiYear = banDate.getFullYear() + 543;
    formattedBanDate = `วันที่ ${banDate.getDate()} ${monthNames[banDate.getMonth()]} พ.ศ. ${thaiYear} เวลา ${banDate.getHours().toString().padStart(2, "0")}:${banDate.getMinutes().toString().padStart(2, "0")} น.`;

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
      remainingText = "(ครบกำหนดเวลาระงับการใช้งานแล้ว)";
      isBanned = false;
    }
  }

  return (
    <div>
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
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
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
              บัญชีผู้ใช้นี้ถูกระงับการใช้งาน
            </h2>
            <p
              style={{
                color: "#4b5563",
                fontSize: "0.95rem",
                lineHeight: "1.5",
                marginBottom: "25px",
              }}
            >
              ไม่สามารถดูข้อมูลโปรไฟล์ หรือดำเนินการใดๆ ได้ในขณะนี้
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
              }}
            >
              รับทราบและกลับไปหน้าก่อนหน้า
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
