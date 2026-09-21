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
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            padding: "20px",
          }}
        >
          <style>
            {`
              .ban-modal-btn {
                background: linear-gradient(135deg, #ef4444, #b91c1c);
                color: #ffffff;
                border: 1px solid rgba(255,255,255,0.1);
                padding: 14px 24px;
                border-radius: 12px;
                font-size: 15px;
                font-weight: bold;
                cursor: pointer;
                width: 100%;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.25);
              }
              .ban-modal-btn:hover {
                background: linear-gradient(135deg, #f87171, #dc2626);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
              }
              .ban-icon-container {
                width: 70px;
                height: 70px;
                background: rgba(239, 68, 68, 0.08);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px auto;
                border: 1px solid rgba(239, 68, 68, 0.2);
                box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
              }
            `}
          </style>
          
          <div
            style={{
              backgroundColor: "#1e1e24",
              border: "1px solid rgba(239, 68, 68, 0.15)",
              borderRadius: "24px",
              padding: "40px 30px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute",
              top: "-50px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "180px",
              height: "180px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              filter: "blur(40px)",
              borderRadius: "50%",
              zIndex: 0,
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="ban-icon-container">
                <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#f87171" }}>
                  lock
                </span>
              </div>
              
              <h2
                style={{
                  color: "#ffffff",
                  margin: "0 0 10px 0",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  letterSpacing: "0.5px"
                }}
              >
                บัญชีผู้ใช้นี้ถูกระงับการใช้งาน
              </h2>
              
              <p
                style={{
                  color: "#a1a1aa",
                  fontSize: "0.95rem",
                  lineHeight: "1.6",
                  marginBottom: "25px",
                }}
              >
                ไม่สามารถดูข้อมูลโปรไฟล์ หรือดำเนินการใดๆ ได้ในขณะนี้จนกว่าจะถึงเวลา:
                <br /><br />
                
                <span style={{ 
                  display: "inline-block",
                  background: "rgba(0,0,0,0.4)", 
                  padding: "10px 16px", 
                  borderRadius: "10px", 
                  color: "#e4e4e7", 
                  fontWeight: 600,
                  border: "1px solid #333",
                  marginBottom: "12px",
                  fontSize: "0.95rem"
                }}>
                  {formattedBanDate}
                </span>
                <br />
                
                <span
                  style={{
                    color: "#f87171",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    textShadow: "0 0 10px rgba(248, 113, 113, 0.3)"
                  }}
                >
                  {remainingText}
                </span>
              </p>

              <button
                className="ban-modal-btn"
                onClick={() => {
                  setShowBanPopup(false);
                  router.back();
                }}
              >
                รับทราบและกลับไปหน้าก่อนหน้า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
