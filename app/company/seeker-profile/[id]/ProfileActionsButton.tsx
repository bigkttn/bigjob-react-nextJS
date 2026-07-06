"use client";

import { useState, useRef, useEffect } from "react";
import "material-symbols";
import styles from "./seekerProfile.module.css"; // หรือจะแยกไฟล์ css ก็ได้

export default async function ProfileActionsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ปิดเมนูเมื่อคลิกพื้นที่ด้านนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // โค้ดสำหรับเซฟ/บุ๊กมาร์ก
  const handleBookmark = async () => {
    alert("Saved / Bookmarked!");
    setIsOpen(false);
  };

  try {
    const response = await fetch(
      "http://localhost:3000/api/company/favour_user",
      {
        method: "",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error:", error);
    alert("Unable to connect to the server.");
  }

  const handleReport = () => {
    // โค้ดสำหรับแจ้งรายงาน (Report)
    alert("Reported!");
    setIsOpen(false);
  };

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      ref={menuRef}
    >
      {/* ปุ่ม 3 จุด (More Vert) */}
      <span
        className="material-symbols-outlined"
        style={{
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        more_vert
      </span>

      {/* Dropdown เมนูย่อย */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            backgroundColor: "#fff",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "6px",
            zIndex: 10,
            minWidth: "120px",
            padding: "4px 0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <button
            onClick={handleBookmark}
            style={{
              padding: "8px 12px",
              background: "none",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#333",
              fontSize: "14px",
            }}
          >
            <span
              className="material-symbols-outlined  sav"
              style={{ fontSize: "18px" }}
            >
              bookmark
            </span>
            Save
          </button>

          <button
            onClick={handleReport}
            style={{
              padding: "8px 12px",
              background: "none",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#d93025", // สีแดงสำหรับ Report
              fontSize: "14px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px" }}
            >
              flag_2
            </span>
            Report
          </button>
        </div>
      )}
    </div>
  );
}
