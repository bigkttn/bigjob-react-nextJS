import React from "react";

interface BanPopupProps {
  banDetails: { date: string; remaining: string };
  onAcknowledge: () => void;
}

export default function BanPopup({ banDetails, onAcknowledge }: BanPopupProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
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
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
          textAlign: "center",
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
          คุณไม่สามารถเข้าใช้งานระบบได้ในขณะนี้
          <br />
          จนกว่าจะถึงเวลา:{" "}
          <strong style={{ color: "#111" }}>{banDetails.date}</strong>
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
            {banDetails.remaining}
          </span>
        </p>
        <button
          onClick={onAcknowledge}
          style={{
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            width: "100%",
            transition: "0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#dc2626")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#ef4444")
          }
        >
          รับทราบและออกจากระบบ
        </button>
      </div>
    </div>
  );
}
